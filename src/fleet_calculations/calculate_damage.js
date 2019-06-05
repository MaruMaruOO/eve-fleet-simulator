// @flow
import { MissileApplication, TurretApplication } from './weapon_application';
import { getVelocityDelta } from './velocity_delta';
import Ship from './../ship_class';
import Side from './../side_class';
import { Weapon } from './../weapon_classes';

function calculateDamage(
  ship: Ship, target: Ship, wep: Weapon,
  side: Side, runSideEffects: boolean = true,
): number {
  if (runSideEffects) {
    side.theoreticalDamage += wep.damage;
  }
  if (ship.distanceFromTarget > ship.maxTargetRange) {
    return 0;
  }
  if (wep.type === 'Missile') {
    let effectiveOptimal = wep.optimal;
    // Even relative to drones this is an iffy work around given fighter travel times.
    if (wep.autonomousMovement) {
      effectiveOptimal = 300000;
    }
    return wep.damage * MissileApplication(ship.distanceFromTarget, [
      target.sigRadius / wep.stats.sigRadius,
      [target.velocity], wep.stats.expVelocity,
      effectiveOptimal, wep.stats.damageReductionFactor]);
  } else if (wep.type === 'Turret') {
    let velocity;
    const oppVelocity = [0];
    let distance = ship.distanceFromTarget;
    if (wep.autonomousMovement) {
      if (ship.distanceFromTarget > ship.droneControlRange) {
        return 0;
      }
      // Assume non-sentry drones are at optimal if faster than target.
      // This is somewhat overly generous against fairly fast targets.
      if (wep.stats.travelVelocity > Math.max(target.velocity, 10)) {
        distance = wep.optimal;
      }
      // Drone orbit velocity isn't really v/5 but it's close enough.
      // In practice drones have all sorts of funkiness that's not practical to model.
      velocity = [Math.abs((wep.stats.travelVelocity / 5) - target.velocity)];
    } else {
      velocity = [getVelocityDelta(ship, target, side, wep)];
    }
    const hasDmgRamp = Boolean(wep.stats.bonusMultiInc);
    const bonusMulti = hasDmgRamp ? (1 + wep.bonusMulti) / (1 + wep.stats.bonusMultiCap) : 1;
    if (wep.stats.bonusMultiInc && wep.bonusMulti < wep.stats.bonusMultiCap && runSideEffects) {
      wep.bonusMulti += wep.stats.bonusMultiInc;
    }
    return wep.damage * bonusMulti * TurretApplication(distance, [
      velocity, oppVelocity,
      wep.stats.tracking * target.sigRadius,
      wep.optimal, wep.stats.falloff]);
  }
  return wep.damage;
}

export default calculateDamage;
