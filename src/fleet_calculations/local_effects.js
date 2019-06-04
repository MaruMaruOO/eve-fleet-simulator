// @flow

import Ship from './../ship_class';
import Side from './../side_class';
import type { Repair } from './../flow_types';

function repairLocal(ship: Ship, repair: Repair) {
  const repairAmmount = repair.shieldBonus || repair.armorDamageAmount;
  const postRepEhp = ship.currentEHP + (repairAmmount / ship.meanResonance);
  ship.currentEHP = Math.min(postRepEhp, ship.EHP);
}

function shouldCycleArmorRep(s: Ship, r: Repair) {
  if (s.cap > r.capacitorNeed &&
      (s.cap > 0.8 * s.capacitorCapacity ||
       s.currentEHP + (r.armorDamageAmount / s.meanResonance) < s.EHP)) {
    return true;
  }
  return false;
}

function handleAncillaryCharges(ship: Ship, r: Repair) {
  if (r.numShotsLeft > 0) {
    r.numShotsLeft -= 1;
    if (r.numShotsLeft === 0) {
      if (r.type === 'Shield Booster') {
        r.capacitorNeed = r.unloadedCapacitorNeed;
      } else {
        r.armorDamageAmount *= r.chargedArmorDamageMultiplier;
      }
    }
  }
  if (r.numShotsLeft === 0) {
    let shouldReload = false;
    if (r.type === 'Shield Booster') {
      // Reload ASB's if we're getting low on cap or we have other repairs.
      shouldReload = ship.repairs.length > 1 || ship.cap < 0.3 * ship.capacitorCapacity;
    } else {
      // If EHP is low don't reload as it's liable to not get used before the ship dies.
      // Reloads if EHP > 20-50% based off hull size.
      const sizeFactor = 0.1 + (ship.rigSize / 10);
      shouldReload = ship.currentEHP > sizeFactor * ship.EHP;
    }
    if (shouldReload) {
      r.numShotsLeft = r.numShots;
      r.currentDuration += r.reloadTime;
      if (r.type === 'Shield Booster') {
        r.capacitorNeed = 0;
      } else {
        r.armorDamageAmount /= r.chargedArmorDamageMultiplier;
      }
    }
  }
}

function RunRepairs(ship: Ship, t: number) {
  for (const r of ship.repairs) {
    if (r.currentDuration <= 0) {
      if (ship.currentEHP <= 0) {
        // No need to reapply to self since rr has no ongoing effect.
        r.currentDuration = 100000000;
      } else if (r.type === 'Shield Booster') {
        if (ship.currentEHP + (r.shieldBonus / ship.meanResonance) < ship.EHP) {
          if (ship.cap > r.capacitorNeed) {
            ship.cap -= r.capacitorNeed;
            repairLocal(ship, r);
            r.currentDuration = r.duration;
            if (r.numShots) {
              handleAncillaryCharges(ship, r);
            }
          }
        }
      } else if (r.type === 'Armor Repairer') {
        repairLocal(ship, r);
        r.currentDuration = r.duration;
        if (shouldCycleArmorRep(ship, r)) {
          ship.cap -= r.capacitorNeed;
          r.cycleStarted = true;
        } else {
          r.cycleStarted = false;
        }
        // Note currently AAR's will take and require the cap when they reload.
        // This only has a fairly small impact but should be fixed at some point.
        if (r.numShots) {
          handleAncillaryCharges(ship, r);
        }
      } else if (r.type === 'Capacitor Booster') {
        if (ship.cap < 0.3 * ship.capacitorCapacity) {
          // Cap boosters have a negative capacitorNeed, so this adds cap.
          ship.cap -= r.capacitorNeed;
          r.currentDuration = r.duration;
          r.numShotsLeft -= 1;
          if (r.numShotsLeft === 0) {
            r.numShotsLeft = r.numShots;
            r.currentDuration += r.reloadTime;
          }
        }
      }
    }
    if (r.cycleStarted) {
      r.currentDuration -= t;
    } else if (shouldCycleArmorRep(ship, r)) {
      ship.cap -= r.capacitorNeed;
      r.cycleStarted = true;
      r.currentDuration -= t;
    }
  }
}

function RunLocalEffects(ship: Ship, t: number, s: Side) {
  ship.cap = ship.pendingCap;
  const t5 = ship.rechargeRate / 5;
  const cap = ((1 + ((Math.sqrt(ship.cap / ship.capacitorCapacity) - 1) * Math.exp(-t / t5))) ** 2)
    * ship.capacitorCapacity;
  ship.cap = cap;
  if (ship.currentEHP < ship.EHP) {
    RunRepairs(ship, t);
  }
  ship.pendingCap = ship.cap;
  ship.expectedCapLoss = 0;

  // Weapon cycling should stall after firing if the ship doesn't have the cap it needs to fire.
  for (const w of ship.weapons) {
    if (w.currentReload === w.reload && w.capacitorNeed && w.capacitorNeed > ship.cap) {
      w.currentReload += t;
      // Note damage / reload will give damage per millisecond.
      s.theoreticalDamage += (w.damage / w.reload) * t;
    }
  }
}

export default RunLocalEffects;
