// @flow
import getMidShip from './mid_ship';
import { getDoaTarget } from './targeting';

import Ship from './../ship_class';
import Side from './../side_class';
import { Weapon } from './../weapon_classes';

function hasHigherEffectiveTracking(ship: Ship, target: Ship, specificWeapon: ?Weapon) {
  const wep = specificWeapon || ship.weapons.sort((a, b) => b.dps - a.dps)[0];
  const oppWep = target.weapons.sort((a, b) => b.dps - a.dps)[0];
  if (!oppWep || oppWep.type !== 'Turret') {
    return false;
  } else if (wep.stats.tracking * target.sigRadius > oppWep.stats.tracking * ship.sigRadius) {
    return true;
  }
  return false;
}

/**
 * Returns the transversal that corresponds to hitting 25% of the time at optimal +  1.33 * falloff
 * This reduces range selection issues for ships that always have sub 30% application at
 * full transversal, typically due to their own mwd speed.
 * The value is very conservative to prevent it impacting ships kiting at long range.
 */
function getSpeedCap(w: Weapon, t: Ship): number {
  return ((w.stats.tracking * t.sigRadius) / 80000) * (w.optimal + (w.stats.falloff * 1.33));
}

function innerGetDeltaVelocity(
  ship: Ship, vForTransversal: number, target: Ship,
  mTarget: Ship, isEffTrackingBetter: boolean, specificWeapon: ?Weapon,
) {
  const tv = target.velocity;
  const mtv = mTarget.velocity;
  const wep = specificWeapon || ship.weapons.sort((a, b) => b.dps - a.dps)[0];
  const oppWep = target.weapons.sort((a, b) => b.dps - a.dps)[0];
  if (isEffTrackingBetter && vForTransversal > Math.max(tv, mtv)) {
    const maxTransversal = Math.abs(vForTransversal - Math.max(tv, mtv));
    if (wep.type !== 'Turret') {
      return maxTransversal;
    }
    const speedCap = getSpeedCap(wep, target);
    return Math.min(maxTransversal, speedCap);
  } else if (ship.velocity >= tv) {
    return 0;
  }
  // Target using a turret with worse tracking.
  if (isEffTrackingBetter) {
    return 0;
  }
  // Target not using a turret.
  const maxTransversal = Math.abs(ship.velocity - tv);
  if (!oppWep || oppWep.type !== 'Turret') {
    return maxTransversal;
  }
  // Target using a turret with better tracking.
  const speedCap = getSpeedCap(oppWep, ship);
  return Math.min(maxTransversal, speedCap);
}

/**
 * Gets the velocity delta when the target is assumed to be targeting the ship.
 * Useful for theoretical situations as ships typically adjust range far more
 * slowly than transversal.
 * Thus for ideal range calculations they should consider that they might get shot when
 * picking their transversal, even if they aren't currently targeted.
 */
function getMirrorVelocityDelta(ship: Ship, target: Ship, side: Side, specificWeapon: ?Weapon) {
  const supTracking = hasHigherEffectiveTracking(ship, target, specificWeapon);
  const mTarget = getMidShip(side.oppSide, target);
  let vForTransversal = ship.velocity;
  if (target.targets.length > 0) {
    const shipsInSubFleet = side.ships.filter(s => s.id === ship.id);
    const oppEffectiveTarget = shipsInSubFleet.length > 1 ? shipsInSubFleet[1] : shipsInSubFleet[0];
    // It's pointless the have more transversal than what's actually being shot.
    vForTransversal = Math.min(vForTransversal, oppEffectiveTarget.velocity);
  }
  const deltaVelocity = innerGetDeltaVelocity(ship, vForTransversal, target, mTarget, supTracking);
  return deltaVelocity;
}

function getVelocityDelta(ship: Ship, target: Ship, side: Side, specificWeapon: ?Weapon) {
  const supTracking = hasHigherEffectiveTracking(ship, target, specificWeapon);
  const mTarget = getMidShip(side.oppSide, target);
  let vForTransversal = ship.velocity;
  // Note we can't care if the target's target is alive without
  // causing the run order to impact the results.
  const oppEffectiveTarget = getDoaTarget(target, side);
  vForTransversal = Math.min(vForTransversal, oppEffectiveTarget.velocity);
  const deltaVelocity = innerGetDeltaVelocity(ship, vForTransversal, target, mTarget, supTracking);
  return deltaVelocity;
}

export { getMirrorVelocityDelta, getVelocityDelta };
