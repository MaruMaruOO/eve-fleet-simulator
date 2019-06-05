// @flow
import type { AmmoData } from './../flow_types';
import type { Subfleet } from './../side_class';
import calculateDamage from './calculate_damage';
import { Weapon } from './../weapon_classes';
import Side from './../side_class';

function getAmmoSwapSanity(set) {
  const damRatios: number[] = [];
  for (let i = 0; i < set.recentDamage.length - 1; i += 1) {
    const d = set.recentDamage[i];
    const nd = set.recentDamage[i + 1];
    damRatios.push(nd / d);
  }
  if (damRatios.some(r => r > 1.02)) {
    return false;
  }
  return true;
}
function tempAmmoSwap(wep: Weapon, newAmmo: AmmoData, oldAmmo: AmmoData) {
  const netMulti = [];
  for (let c = 2; c < newAmmo.length; c += 1) {
    if (typeof oldAmmo[c] === 'number' && typeof newAmmo[c] === 'number') {
      netMulti[c - 2] = (1 / oldAmmo[c]) * newAmmo[c];
    }
  }
  wep.damage *= netMulti[0];
  if (wep.type === 'Missile') {
    wep.stats.sigRadius *= netMulti[1];
    wep.stats.expVelocity *= netMulti[2];
    wep.stats.damageReductionFactor *= netMulti[3];
    wep.optimal *= netMulti[4];
  } else if (wep.type === 'Turret') {
    wep.stats.tracking *= netMulti[1];
    wep.optimal *= netMulti[2];
    wep.stats.falloff *= netMulti[3];
  }
}

function ammoSwap(
  side: Side, subfleet: Subfleet, refWep: Weapon,
  newAmmo: AmmoData, oldAmmo: AmmoData, reloadTime: number,
) {
  const wepInd = subfleet.fc.weapons.indexOf(refWep);
  // We also want a shotCaller (fc) match because this will actually run for each subfleet
  // when they go past the split size (1000 as of writing)
  const shipsInSubFleet = side.ships.filter(s => (
    s.id === subfleet.fc.id && (s.shotCaller === subfleet.fc || s === subfleet.fc)
  ));
  for (let i = 0; i < shipsInSubFleet.length; i += 1) {
    const ship = shipsInSubFleet[i];
    const wep = ship.weapons[wepInd];
    tempAmmoSwap(wep, newAmmo, oldAmmo);

    const netMulti = [];
    for (let c = 2; c < newAmmo.length; c += 1) {
      if (typeof oldAmmo[c] === 'number' && typeof newAmmo[c] === 'number') {
        netMulti[c - 2] = (1 / oldAmmo[c]) * newAmmo[c];
      }
    }
    // Should add exception for lasers.
    wep.currentReload += reloadTime;
    wep.dps *= netMulti[0];
    if (wep.type === 'Missile') {
      wep.stats.baseSigRadius *= netMulti[1];
      wep.stats.baseExpVelocity *= netMulti[2];
      wep.baseOptimal *= netMulti[4];
    } else if (wep.type === 'Turret') {
      wep.stats.baseTracking *= netMulti[1];
      wep.baseOptimal *= netMulti[2];
      wep.stats.baseFalloff *= netMulti[3];
    }
  }
}

function CheckForAmmoSwaps(side: Side, subfleet: Subfleet, opposingSide: Side) {
  for (let i = 0; i < subfleet.wepAmmoSwapData.length; i += 1) {
    const set = subfleet.wepAmmoSwapData[i];
    const wep = subfleet.fc.weapons[i];
    const fcTargets = subfleet.fc.targets;
    if (set.cycledSinceCheck && fcTargets.length > 0 && wep.currentReload < 0.75 * wep.reload) {
      set.cycledSinceCheck = false;
      const expectedDamage = calculateDamage(subfleet.fc, fcTargets[0], wep, side, false);
      set.recentDamage.push(expectedDamage);
      const isAmmoSwapSane = getAmmoSwapSanity(set);
      set.recentDamage.pop();
      const initalAmmo = set.ammoOptions.find(t => t[1] === set.currentAmmo);
      if (isAmmoSwapSane && initalAmmo) {
        // Don't consider the added reload time if we'd be reloading anyway.
        const reloadTime = set.chargesLeft > 0 ? set.reloadTime : 0;
        const lastEff = expectedDamage / wep.damage;
        const baseEff = initalAmmo[2] * lastEff;
        const possibleAlts = set.ammoOptions.filter(t => (
          t[2] > baseEff && t[1] !== set.currentAmmo
        ));
        const bestAlt = [0, 0];
        let lastAmmo = initalAmmo;
        // Require a 5% increase if there's no reloadTime, 12.5% for 5000ms and 20% for 10000ms.
        const changeReq = 1.05 + (reloadTime * 0.000015);
        for (let c = 0; c < possibleAlts.length; c += 1) {
          const testAmmo = possibleAlts[c];
          tempAmmoSwap(wep, testAmmo, lastAmmo);
          // MISSILES AREN"T CONSIDERING DISTANCE TO THE TARGET YET~~~~~~
          const damage = calculateDamage(subfleet.fc, fcTargets[0], wep, side, false);
          if (damage > expectedDamage * changeReq && damage > bestAlt[0]) {
            bestAlt[0] = damage;
            bestAlt[1] = c;
          }
          lastAmmo = testAmmo;
        }
        if (possibleAlts.length > 0) {
          tempAmmoSwap(wep, initalAmmo, lastAmmo);
          if (bestAlt[0]) {
            const newAmmo = possibleAlts[bestAlt[1]];
            console.log(`Took ${reloadTime}ms to swap ${subfleet.fc.name}'s ammo to ${newAmmo.toString()} from ${initalAmmo.toString()}`);
            console.log(`Went from ${expectedDamage} to ${bestAlt[0]} damage (${100 * (bestAlt[0] / expectedDamage)}% of previous)`);
            ammoSwap(side, subfleet, wep, newAmmo, initalAmmo, reloadTime);
            const id = newAmmo[1];
            set.currentAmmo = id;
            set.chargesLeft = set.chargesHeld;
            // This will trigger a fairly slow range recalc that normally runs every 10 seconds.
            // Keep an eye on it if ammo swaps are very frequent.
            // It's set for every FC on both sides, otherwise the order would impact the results.
            for (const s of [side, opposingSide]) {
              for (const sf of s.subFleets) {
                sf.fc.rangeRecalc = 0;
              }
            }
          }
        }
      }
    }
    // Reset if the weapon has fired twice.
    if (set.recentDamage.length > 1) {
      set.recentDamage = [];
    }
  }
}

export default CheckForAmmoSwaps;
