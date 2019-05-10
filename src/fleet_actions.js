// @flow
import { Weapon, PendingAttack } from './weapon_classes';
import Ship from './ship_class';
import type { Ewar } from './ship_class';
import Side from './side_class';
import type { VectorMaxLenThree, ProjectionTypeString, AmmoData } from './flow_types';
import type { Subfleet } from './side_class';

function findNewTarget(targetCaller: Ship, opposingSide: Side): ?Ship {
  let oppShips = opposingSide.ships;
  if (oppShips.length > targetCaller.maxTargets) {
    oppShips = oppShips.slice(0, targetCaller.maxTargets + 1);
  }
  let newTarget = oppShips.find(oppShip =>
    !oppShip.isShotCaller &&
    !targetCaller.targets.some(target => target === oppShip) && oppShip.currentEHP > 0);
  const possibleFcTarget = oppShips.find(oppShip =>
    !targetCaller.targets.some(target => target === oppShip) && oppShip.currentEHP > 0);
  // This should target the fc if it's the last ship left in the group
  if (!newTarget || (possibleFcTarget && possibleFcTarget.id !== newTarget.id)) {
    newTarget = possibleFcTarget;
  }
  return newTarget;
}

function getTargets(targetCaller: Ship, opposingSide: Side) {
  const newTarget = findNewTarget(targetCaller, opposingSide);
  if (newTarget) {
    targetCaller.targets.push(newTarget);
    if (targetCaller.targets.length < targetCaller.maxTargets) {
      getTargets(targetCaller, opposingSide);
    }
  }
}

/**
  * Returns the first target that would be selected if there were no targets selected
  * and all the ships were alive.
  */
function getDoaTarget(ship: Ship, opposingSide: Side) {
  let prevT: ?Ship;
  for (const t of opposingSide.ships) {
    if (!t.isShotCaller || opposingSide.ships.length === 1) {
      return t;
    }
    const posFcTarg: ?Ship = prevT;
    if (posFcTarg && posFcTarg.id !== t.id) {
      return posFcTarg;
    }
    prevT = t;
  }
  return opposingSide.ships[0];
}

type DamageApplicationArgs = [
  VectorMaxLenThree | number, VectorMaxLenThree, number, number, number
];
type DamageApplicationFunction = (number, DamageApplicationArgs) => number;
type ApplicationArgArray = [DamageApplicationFunction, DamageApplicationArgs, [number, number]];
type DamageRatioArgs = [
  DamageApplicationFunction, DamageApplicationFunction, DamageApplicationArgs, DamageApplicationArgs
];

const MissileApplication = (distance: number, [
  sigRatio, targetVelocity, expVelocity, optimal, missileDamageReductionFactor,
]: DamageApplicationArgs) => {
  if (optimal < distance) {
    return 10E-128;
  }
  if (Array.isArray(sigRatio)) {
    console.error('MissileApplication received incorrect arguments and will return 0');
    return 0;
  }
  const reducedVelocity = targetVelocity.reduce((s, v) => s + (v * v * v), 0);
  const netVelocity = reducedVelocity ** 0.33333333;
  const velocityRatio = expVelocity / netVelocity;
  const multi = Math.min(1, sigRatio, (sigRatio * velocityRatio) ** missileDamageReductionFactor);
  return multi;
};

const HitChanceFunction = (
  distance: number,
  [velocity, oppVelocity, trackingFactor, optimal, falloff]: DamageApplicationArgs,
) => {
  if (!Array.isArray(velocity)) {
    console.error('HitChanceFunction received incorrect arguments and will return 0');
    return 0;
  }
  const netVector = velocity.map((v, i) => v + oppVelocity[i]);
  const reducedVelocity = netVector.reduce((s, v) => s + (v * v * v), 0);
  const netVelocity = reducedVelocity ** 0.33333333;
  const angularVelocity = netVelocity / distance || 0;
  const trackingComponent = ((angularVelocity * 40000) / (trackingFactor)) ** 2;
  if (falloff === 0) {
    if (Math.max(0, distance - optimal) === 0) {
      return 0.5 ** trackingComponent;
    }
    return 0;
  }
  const rangeComponent = (Math.max(0, distance - optimal) / falloff) ** 2;
  const hitChance = (0.5 ** (trackingComponent + rangeComponent));
  return hitChance;
};

const TurretApplication = (distance: number, hitChanceArgs: DamageApplicationArgs) => {
  const hitChance = HitChanceFunction(distance, hitChanceArgs);
  if (hitChance > 0.01) {
    return ((hitChance ** 2) + hitChance + 0.0499) / 2;
  }
  // Only wrecking hits
  return hitChance * 3;
};

const DamageRatioFunction = (
  distance: number,
  [damageFunction, oppDamageFunction, args, oppArgs]: DamageRatioArgs,
  overrideDistance: ?number,
  oppOverrideDistance: ? number,
) => {
  let damageApplication = damageFunction(overrideDistance || distance, args);
  let oppApplication = oppDamageFunction(oppOverrideDistance || distance, oppArgs);
  if (damageApplication < 0.3) {
    // JS min value is ~5E-324, using 10E-127/128 should give some leway while maintaining accuracy.
    damageApplication = Math.max(damageApplication, 10E-127);
    oppApplication = Math.max(oppApplication, 10E-127);
    damageApplication *= 10E-128;
  }
  return -1 * (damageApplication / oppApplication);
};

/**
 * Used to get a typical representative of the ships subfleet.
 * The return should be functionally equivalent to:
 *   side.ships.filter(s => s.id === ship.id)[Math.floor(shipsInSubFleet.length / 2)];
 * This is a touch more convoluted but runs much faster for large fights.
 */
function getMidShip(side: Side, ship: Ship) {
  const sf: ?Subfleet = side.subFleets.find(f => f.fc === ship.anchor || f.fc === ship);
  if (sf) {
    let ds = side.deadShips.length;
    if (ds > sf.initalStartInd) {
      const dso = sf.initalStartInd;
      const dss = (ds - sf.initalStartInd) / 2;
      ds = dso + dss;
    }
    const mIndex = Math.floor(sf.initalStartInd + ((sf.n / 2) - ds));
    // If the entire subfleet is dead give the mid ship for the next subfleet.
    // This should be extremely rare and only occur when calculating preferred range.
    if (mIndex === 0 && ship.id !== side.ships[mIndex].id) {
      return getMidShip(side, side.ships[0]);
    }
    return side.ships[mIndex];
  }
  console.error('Failed to find midShip for:', ship, '. Returning ship instead');
  return ship;
}

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

function getApplicationArgs(ship: Ship, target: Ship, side: Side): ApplicationArgArray {
  let minRange = (Math.min(1000, ship.sigRadius) * 2) + Math.min(1000, target.sigRadius);
  // minRange is a rearrange of 2 * v * align / 0.75 == 2 * PI * minRange.
  minRange = Math.max(minRange, (ship.velocity * ship.alignTime) / 2.35619);
  let maxRange;
  // Ship movement isn't exact so reduce max values very slightly when they have no falloff.
  const noFalloffComp = (0.1 * (ship.velocity + target.velocity));
  const conservativeMaxTargetRange = ship.maxTargetRange - noFalloffComp;
  const wep = ship.weapons.sort((a, b) => b.dps - a.dps)[0];
  if (wep && wep.type === 'Turret') {
    const damageFunction = TurretApplication;
    const trackingFactor = wep.stats.tracking * target.sigRadius;
    // Optimal + 2.5 * falloff gives a 1.31% hit rate with perfect tracking.
    maxRange = Math.min(conservativeMaxTargetRange, wep.optimal + (wep.stats.falloff * 2.5));
    let velocity;
    const oppVelocity = [0];
    if (wep.autonomousMovement) {
      const conservativeDcr = ship.droneControlRange - noFalloffComp;
      if (wep.stats.travelVelocity > Math.max(target.velocity, 10)) {
        maxRange = Math.min(conservativeDcr, conservativeMaxTargetRange);
      } else {
        maxRange = Math.min(conservativeDcr, maxRange);
      }
      velocity = [Math.abs((wep.stats.travelVelocity / 5) - target.velocity)];
    } else {
      velocity = [getMirrorVelocityDelta(ship, target, side, wep)];
    }
    const args: DamageApplicationArgs = [velocity, oppVelocity, trackingFactor,
      wep.optimal, wep.stats.falloff];
    return ([damageFunction, args, [minRange, maxRange]]: ApplicationArgArray);
  } else if (wep && wep.type === 'Missile') {
    let effectiveOptimal = wep.optimal;
    if (wep.autonomousMovement) {
      effectiveOptimal = 300000;
    }
    const damageFunction = MissileApplication;
    const sigRatio = target.sigRadius / wep.stats.sigRadius;
    const oppVelocity = [target.velocity];
    const args: DamageApplicationArgs = [sigRatio, oppVelocity, wep.stats.expVelocity,
      effectiveOptimal, wep.stats.damageReductionFactor];
    maxRange = Math.min(conservativeMaxTargetRange, effectiveOptimal - noFalloffComp);
    return ([damageFunction, args, [minRange, maxRange]]: ApplicationArgArray);
  }
  const damageFunction = MissileApplication;
  const args: DamageApplicationArgs = [0, [0], 0, 0, 0];
  return ([damageFunction, args, [minRange, conservativeMaxTargetRange]]: ApplicationArgArray);
}

function sign(x) {
  if (x < 0.0) return -1;
  return (x > 0.0) ? 1 : 0;
}

function getMin(
  func: (number, [Ship, Side]) => number,
  x1, x2, args: [Ship, Side], xatol = 1e-5, maxfun = 500,
): [number, number] {
  const sqrtEps = Math.sqrt(2.2e-16);
  const goldenMean = 0.5 * (3.0 - Math.sqrt(5.0));
  let [a, b] = [x1, x2];
  let fulc = a + (goldenMean * (b - a));
  let [nfc, xf] = [fulc, fulc];
  let rat = 0.0; let e = 0;
  let x = xf;
  let fx = func(x, args);
  let num = 1;
  let ffulc = fx; let fnfc = fx;
  let xm = 0.5 * (a + b);
  let tol1 = (sqrtEps * Math.abs(xf)) + (xatol / 3.0);
  let tol2 = 2.0 * tol1;

  while (Math.abs(xf - xm) > (tol2 - (0.5 * (b - a)))) {
    let golden = 1;
    // Check for parabolic fit.
    if (Math.abs(e) > tol1) {
      golden = 0;
      let r = (xf - nfc) * (fx - ffulc);
      let q = (xf - fulc) * (fx - fnfc);
      let p = ((xf - fulc) * q) - ((xf - nfc) * r);
      q = 2.0 * (q - r);
      if (q > 0.0) { p = -p; }
      q = Math.abs(q);
      r = e;
      e = rat;

      // Check for acceptability of parabola.
      if ((Math.abs(p) < Math.abs(0.5 * q * r)) && (p > q * (a - xf)) &&
          (p < q * (b - xf))) {
        rat = (p + 0.0) / q;
        x = xf + rat;

        if (((x - a) < tol2) || ((b - x) < tol2)) {
          const si = sign(xm - xf) + ((xm - xf) === 0);
          rat = tol1 * si;
        }
      } else { // Do a golden section step.
        golden = 1;
      }
    }
    if (golden) {
      if (xf >= xm) {
        e = a - xf;
      } else {
        e = b - xf;
      }
      rat = goldenMean * e;
    }
    const si = sign(rat) + (rat === 0);
    x = xf + (si * Math.max(Math.abs(rat), tol1));
    const fu = func(x, args);
    num += 1;
    if (fu <= fx) {
      if (x >= xf) {
        a = xf;
      } else {
        b = xf;
      }
      [fulc, ffulc] = [nfc, fnfc];
      [nfc, fnfc] = [xf, fx];
      [xf, fx] = [x, fu];
    } else {
      if (x < xf) {
        a = x;
      } else {
        b = x;
      }
      if ((fu <= fnfc) || (nfc === xf)) {
        [fulc, ffulc] = [nfc, fnfc];
        [nfc, fnfc] = [x, fu];
      } else if ((fu <= ffulc) || (fulc === xf) || (fulc === nfc)) {
        [fulc, ffulc] = [x, fu];
      }
    }
    xm = 0.5 * (a + b);
    tol1 = (sqrtEps * Math.abs(xf)) + (xatol / 3.0);
    tol2 = 2.0 * tol1;

    if (num >= maxfun) {
      break;
    }
  }
  const result = xf;
  const ratio = fx * -1;
  return [result, ratio];
}

function calculateDamage(ship: Ship, target: Ship, wep: Weapon, side: Side): number {
  side.theoreticalDamage += wep.damage;
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
    if (wep.stats.bonusMultiInc && wep.bonusMulti < wep.stats.bonusMultiCap) {
      wep.bonusMulti += wep.stats.bonusMultiInc;
    }
    return wep.damage * bonusMulti * TurretApplication(distance, [
      velocity, oppVelocity,
      wep.stats.tracking * target.sigRadius,
      wep.optimal, wep.stats.falloff]);
  }
  return wep.damage;
}

function dealDamage(ship: Ship, t: number, wep: Weapon, side: Side) {
  if (ship.targets[0].currentEHP <= 0) {
    ship.targets.shift();
    if (ship.targets.length > 0) {
      dealDamage(ship, t, wep, side);
    }
  } else {
    wep.currentReload -= t;
    if (wep.currentReload <= 0) {
      const [target] = ship.targets;
      if (wep.bonusMulti && target !== ship.previousTarget) {
        wep.bonusMulti = 0;
        ship.previousTarget = target;
      }
      const attack = new PendingAttack(wep.getDamageDelay(ship.distanceFromTarget));
      wep.pendingDamage.push(attack);
      wep.currentReload = wep.reload;
    }
    let isPendingFinished = false;
    for (const pendingAttack of wep.pendingDamage) {
      pendingAttack.timer -= t;
      if (pendingAttack.timer <= 0) {
        const initalHP: number = ship.targets[0].currentEHP;
        const damage = calculateDamage(ship, ship.targets[0], wep, side);
        ship.targets[0].currentEHP -= damage;
        if (Number.isNaN(initalHP) || Number.isNaN(ship.targets[0].currentEHP)) {
          console.error(
            'Applied damage or target EHP is not a number, this is likely a bug.',
            wep, initalHP, ship.targets[0].currentEHP, ship,
          );
        }
        side.appliedDamage += initalHP - ship.targets[0].currentEHP;
        isPendingFinished = true;
        if (ship.isShotCaller) {
          const ind = ship.weapons.indexOf(wep);
          const sf = side.subFleets.find(s => s.fc === ship);
          if (sf && sf.wepAmmoSwapData[ind].currentAmmo) {
            sf.wepAmmoSwapData[ind].recentDamage.push(damage);
            sf.wepAmmoSwapData[ind].cycledSinceCheck = true;
            if (sf.wepAmmoSwapData[ind].chargesLeft > 0) {
              sf.wepAmmoSwapData[ind].chargesLeft -= 1;
            } else {
              sf.wepAmmoSwapData[ind].chargesLeft = sf.wepAmmoSwapData[ind].chargesHeld;
            }
          }
        }
      }
    }
    if (isPendingFinished) {
      wep.pendingDamage = wep.pendingDamage.filter(attack => attack.timer > 0);
    }
  }
}

function NetValue(effects: [number, number, Ewar][], baseValue: number) {
  // These are actually 1 / Math.exp(((-i) / 2.67) ** 2) (where i is the index)
  // This solution is used instead for speed reasons
  const stackingPenelties = [1, 0.869, 0.571, 0.283, 0.106, 0.03, 0];
  const effLen = Math.min(6, effects.length);
  let value = baseValue;
  for (let i = 0; i < effLen; i += 1) {
    value += (value * effects[i][0] * stackingPenelties[i]);
  }
  return value;
}

function ewarFalloffCalc(baseMulti: number, ewar, distance: number) {
  if (ewar.falloff) {
    return baseMulti * (0.5 ** ((Math.max(0, distance - ewar.optimal) / ewar.falloff) ** 2));
  } else if (distance <= ewar.optimal) {
    return baseMulti;
  }
  return 0;
}

function getFocusedEwarTarget(targets: Ship[], type: 'tps' | 'webs', multi: number) {
  // Targets.length > 1 not 0 because a single target often indicates a forced target
  // When it doesn't targeting a dead ship shouldn't cause any issues anyway.
  while (targets.length > 1 && targets[0].currentEHP <= 0) {
    targets.shift();
  }
  for (let i = 0; i < targets.length; i += 1) {
    const t = targets[i];
    t.appliedEwar[type].sort((a, b) => Math.abs(b[0]) - Math.abs(a[0]));
    if (t.appliedEwar[type].length <= 6 || Math.abs(t.appliedEwar[type][5][0]) < Math.abs(multi)) {
      i = targets.length;
      return t;
    }
  }
  return targets[0];
}

type attrString = 'trackingSpeedBonus' | 'maxRangeBonus' | 'falloffBonus' |
  'aoeCloudSizeBonus' | 'aoeVelocityBonus' | 'missileVelocityBonus' | 'explosionDelayBonus';

function setProjections(
  ewar, distance: number, attrs: attrString[],
  targetVals: ((s: Ship, attr: attrString) => void)[],
  target: Ship,
) {
  for (let i = 0; i < attrs.length; i += 1) {
    const attr = attrs[i];
    const oldTarget = ewar.currentTarget;
    if (oldTarget) {
      const pullIndex = oldTarget.appliedEwar[attr].findIndex(e => e[2] === ewar);
      if (pullIndex !== -1) {
        oldTarget.appliedEwar[attr].splice(pullIndex, 1);
        oldTarget.appliedEwar[attr].sort((a, b) => Math.abs(b[0]) - Math.abs(a[0]));
        targetVals[i](oldTarget, attr);
      }
    }
    if (Math.abs(ewar[attr]) > 0) {
      const baseMulti = ewar[attr] / 100;
      const multi = ewarFalloffCalc(baseMulti, ewar, distance);
      target.appliedEwar[attr].push([multi, baseMulti, ewar]);
      target.appliedEwar[attr].sort((a, b) => Math.abs(b[0]) - Math.abs(a[0]));
      if (target.appliedEwar[attr].length > 7) {
        target.appliedEwar[attr].pop();
      }
      targetVals[i](target, attr);
    }
  }
}

function NoScramsInRange(t: Ship, forcedDistance: ?number = null, scramSourceId: ?number = null) {
  const inRange =
        s => (
          forcedDistance && scramSourceId === s[2].attachedShip.id ?
            forcedDistance :
            Math.abs(s[2].attachedShip.dis - (s[2].currentTarget || t).dis)
        ) <= s[2].optimal;
  if (t.appliedEwar.scrams.some(inRange)) {
    return false;
  }
  return true;
}

const TargetTypes = {
  focused: 0,
  scattered: 1,
};
type EwarTargetTypeMap = {
  [ProjectionTypeString]: typeof TargetTypes.focused | typeof TargetTypes.scattered,
};
const ewarTargetType: EwarTargetTypeMap = {
  'Stasis Web': TargetTypes.focused,
  'Weapon Disruptor': TargetTypes.scattered,
  'Warp Scrambler': TargetTypes.scattered,
  'Target Painter': TargetTypes.focused,
  'Sensor Dampener': TargetTypes.scattered,
  /* Unimplemented EWAR that's in the data export.
     ECM: 'scattered',
     'Energy Nosferatu': TBD,
     'Energy Neutralizer': TBD,
     'Burst Jammer': AoE,
     'Micro Jump Drive': N/A,
  */
};

function ApplyEwar(ewar, targets, distanceOveride: number | null = null) {
  let target = targets[0];
  let distance = distanceOveride;
  if (ewar.type === 'Stasis Web') {
    const getInitalVel = t => (
      NoScramsInRange(t, distanceOveride, ewar.attachedShip.id) ?
        t.baseVelocity : t.unpropedVelocity
    );
    const oldTarget = ewar.currentTarget;
    if (oldTarget) {
      const pullIndex = oldTarget.appliedEwar.webs.findIndex(e => e[2] === ewar);
      if (pullIndex !== -1) {
        oldTarget.appliedEwar.webs.splice(pullIndex, 1);
        oldTarget.appliedEwar.webs.sort((a, b) => Math.abs(b[0]) - Math.abs(a[0]));
        oldTarget.velocity = NetValue(oldTarget.appliedEwar.webs, getInitalVel(oldTarget));
      }
    }
    const baseMulti = ewar.speedFactor / 100;
    distance = distance || Math.abs(ewar.attachedShip.dis - target.dis);
    const multi = ewarFalloffCalc(baseMulti, ewar, distance);
    target = getFocusedEwarTarget(targets, 'webs', multi);
    target.appliedEwar.webs.push([multi, baseMulti, ewar]);
    target.appliedEwar.webs.sort((a, b) => Math.abs(b[0]) - Math.abs(a[0]));
    if (target.appliedEwar.webs.length > 7) {
      target.appliedEwar.webs.pop();
    }
    target.velocity = NetValue(target.appliedEwar.webs, getInitalVel(target));
  } else if (ewar.type === 'Target Painter') {
    const getInitalSig = t => (
      NoScramsInRange(t, distanceOveride, ewar.attachedShip.id) ?
        t.baseSigRadius : t.unpropedSigRadius
    );
    const oldTarget = ewar.currentTarget;
    if (oldTarget) {
      const pullIndex = oldTarget.appliedEwar.tps.findIndex(e => e[2] === ewar);
      if (pullIndex !== -1) {
        oldTarget.appliedEwar.tps.splice(pullIndex, 1);
        oldTarget.appliedEwar.tps.sort((a, b) => Math.abs(b[0]) - Math.abs(a[0]));
        oldTarget.sigRadius = NetValue(oldTarget.appliedEwar.tps, getInitalSig(oldTarget));
      }
    }
    const baseMulti = ewar.signatureRadiusBonus / 100;
    distance = distance || Math.abs(ewar.attachedShip.dis - target.dis);
    const multi = ewarFalloffCalc(baseMulti, ewar, distance);
    target = getFocusedEwarTarget(targets, 'tps', multi);
    target.appliedEwar.tps.push([multi, baseMulti, ewar]);
    target.appliedEwar.tps.sort((a, b) => Math.abs(b[0]) - Math.abs(a[0]));
    if (target.appliedEwar.tps.length > 7) {
      target.appliedEwar.tps.pop();
    }
    target.sigRadius = NetValue(target.appliedEwar.tps, getInitalSig(target));
  } else if (ewar.type === 'Sensor Dampener') {
    for (const attr of ['maxTargetRangeBonus', 'scanResolutionBonus']) {
      const oldTarget = ewar.currentTarget;
      if (oldTarget) {
        const pullIndex = oldTarget.appliedEwar[attr].findIndex(e => e[2] === ewar);
        if (pullIndex !== -1) {
          oldTarget.appliedEwar[attr].splice(pullIndex, 1);
          oldTarget.appliedEwar[attr].sort((a, b) => Math.abs(b[0]) - Math.abs(a[0]));
          if (attr === 'maxTargetRangeBonus') {
            oldTarget.maxTargetRange =
              NetValue(oldTarget.appliedEwar[attr], oldTarget.baseMaxTargetRange);
          } else {
            oldTarget.scanRes = NetValue(oldTarget.appliedEwar[attr], oldTarget.baseScanRes);
          }
        }
      }
      const baseMulti = ewar[attr] / 100;
      distance = distance || Math.abs(ewar.attachedShip.dis - target.dis);
      const multi = ewarFalloffCalc(baseMulti, ewar, distance);
      target.appliedEwar[attr].push([multi, baseMulti, ewar]);
      target.appliedEwar[attr].sort((a, b) => Math.abs(b[0]) - Math.abs(a[0]));
      if (target.appliedEwar[attr].length > 7) {
        target.appliedEwar[attr].pop();
      }
      if (attr === 'maxTargetRangeBonus') {
        target.maxTargetRange = NetValue(target.appliedEwar[attr], target.baseMaxTargetRange);
      } else {
        target.scanRes = NetValue(target.appliedEwar[attr], target.baseScanRes);
      }
    }
  } else if (ewar.type === 'Weapon Disruptor') {
    const attrs = [
      'trackingSpeedBonus', 'maxRangeBonus', 'falloffBonus', 'aoeCloudSizeBonus',
      'aoeVelocityBonus', 'missileVelocityBonus', 'explosionDelayBonus',
    ];
    const targetVals = [
      (s: Ship, attr: attrString): void => {
        s.weapons.forEach((w: Weapon) => {
          if (w.type === 'Turret' && !w.autonomousMovement) {
            w.stats.tracking = NetValue(s.appliedEwar[attr], w.stats.baseTracking);
          }
        });
      },
      (s: Ship, attr: attrString): void => {
        s.weapons.forEach((w: Weapon) => {
          if (w.type === 'Turret' && !w.autonomousMovement) {
            w.optimal = NetValue(s.appliedEwar[attr], w.baseOptimal);
          }
        });
      },
      (s: Ship, attr: attrString): void => {
        s.weapons.forEach((w: Weapon) => {
          if (w.type === 'Turret' && !w.autonomousMovement) {
            w.stats.falloff = NetValue(s.appliedEwar[attr], w.stats.baseFalloff);
          }
        });
      },
      (s: Ship, attr: attrString): void => {
        s.weapons.forEach((w: Weapon) => {
          if (w.type === 'Missile' && !w.autonomousMovement) {
            w.stats.sigRadius = NetValue(s.appliedEwar[attr], w.stats.baseSigRadius);
          }
        });
      },
      (s: Ship, attr: attrString): void => {
        s.weapons.forEach((w: Weapon) => {
          if (w.type === 'Missile' && !w.autonomousMovement) {
            w.stats.expVelocity = NetValue(s.appliedEwar[attr], w.stats.baseExpVelocity);
          }
        });
      },
      (s: Ship, attr: attrString): void => {
        s.weapons.forEach((w: Weapon) => {
          if (w.type === 'Missile' && !w.autonomousMovement) {
            w.stats.travelVelocity = NetValue(s.appliedEwar[attr], w.stats.baseTravelVelocity);
          }
        });
      },
      (s: Ship, attr: attrString): void => {
        s.weapons.forEach((w: Weapon) => {
          if (w.type === 'Missile' && !w.autonomousMovement) {
            w.optimal = NetValue(s.appliedEwar[attr], w.baseOptimal);
          }
        });
      },
    ];
    distance = distance || Math.abs(ewar.attachedShip.dis - target.dis);
    setProjections(ewar, distance, attrs, targetVals, target);
  } else if (ewar.type === 'Warp Scrambler' && ewar.activationBlockedStrenght > 0) {
    const getInitalVel = t => (
      NoScramsInRange(t, distanceOveride, ewar.attachedShip.id) ?
        t.baseVelocity : t.unpropedVelocity
    );
    const getInitalSig = t => (
      NoScramsInRange(t, distanceOveride, ewar.attachedShip.id) ?
        t.baseSigRadius : t.unpropedSigRadius
    );
    const oldTarget = ewar.currentTarget;
    if (oldTarget) {
      const pullIndex = oldTarget.appliedEwar.scrams.findIndex(e => e[2] === ewar);
      oldTarget.appliedEwar.scrams.splice(pullIndex, 1);
      oldTarget.velocity = NetValue(oldTarget.appliedEwar.webs, getInitalVel(oldTarget));
      oldTarget.sigRadius = NetValue(oldTarget.appliedEwar.tps, getInitalSig(oldTarget));
    }
    // Note the scram is intentionally added even when it's out of range.
    target.appliedEwar.scrams.push([0, 0, ewar]);
    distance = distance || Math.abs(ewar.attachedShip.dis - target.dis);
    if (distance <= ewar.optimal) {
      target.velocity = NetValue(target.appliedEwar.webs, getInitalVel(target));
      target.sigRadius = NetValue(target.appliedEwar.tps, getInitalSig(target));
    }
  }
  ewar.currentTarget = target;
  ewar.currentDuration = ewar.duration;
}

function RecalcEwarForDistance(ship: Ship, posDistanceOveride: ?number = null) {
  const attrs = [
    'webs', 'tps', 'scrams', 'maxTargetRangeBonus', 'scanResolutionBonus',
    'trackingSpeedBonus', 'maxRangeBonus', 'falloffBonus', 'aoeCloudSizeBonus',
    'aoeVelocityBonus', 'missileVelocityBonus', 'explosionDelayBonus',
  ];
  const impactedAttrs = attrs.filter(at => ship.appliedEwar[at].length > 0);
  for (const att of impactedAttrs) {
    // Note ApplyEwar often sorts appliedEwar values so the spread operator is needed.
    for (const ewarApp of [...ship.appliedEwar[att]]) {
      const ewar = ewarApp[2];
      const originalTimeLeftInCycle = ewar.currentDuration;
      let distance = posDistanceOveride;
      const ewarSrc = ewar.attachedShip;
      const realDis = Math.abs(ewarSrc.dis - ship.dis);
      if (distance) {
        // The distance arg is replaced if we can't reasonably
        // expect to dictate range to the ewar's source
        if (ewarSrc.velocity > ship.velocity) {
          if (distance > realDis) {
            distance = realDis;
          } else if (distance > ewar.optimal && distance > ewarSrc.preferedDistance) {
            if ((ewarSrc.velocity - ship.velocity) * 5 > distance - ewarSrc.preferedDistance) {
              distance = ewarSrc.preferedDistance;
            }
          }
        }
      }
      const d = distance || realDis;
      ApplyEwar(ewar, [ship], d);
      ewar.currentDuration = originalTimeLeftInCycle;
    }
  }
}

function GetOffsetDistance(distance: number, ship: Ship, shipM: Ship, target: Ship) {
  if (ship.dis === shipM.dis) {
    return null;
  }
  const ds = Math.abs(target.dis - ship.dis);
  const dm = Math.abs(target.dis - shipM.dis);
  const db = Math.abs(ship.dis - shipM.dis);
  const g = dm - ds;
  const qg = Math.abs(g - db);
  // A value non trivially over 0 would imply shipM is closer to the target than ship.
  // No offset is used in that situation as it suggests shipM isn't representative.
  if (qg < 1) {
    return distance + db;
  }
  return null;
}

const SetArgsFunction = (distance: number, [ship, side]: [Ship, Side]): number => {
  const shipS = ship;
  const shipM = getMidShip(side, ship);
  const oppShipS = ship.targets[0];
  const oppShipM = getMidShip(side.oppSide, oppShipS);
  for (const s of [shipS, shipM, oppShipS, oppShipM]) {
    RecalcEwarForDistance(s, distance);
  }
  const damageFunctionAndArgs = getApplicationArgs(shipM, oppShipS, side);
  const oppDamageFunctionAndArgs = getApplicationArgs(oppShipM, shipS, side.oppSide);
  const target = ship.targets[0];
  if (damageFunctionAndArgs[0] === null || oppDamageFunctionAndArgs[0] === null ||
      damageFunctionAndArgs[2][0] + damageFunctionAndArgs[2][1] === 0) {
    return 0;
  }
  const combinedArgs = [
    damageFunctionAndArgs[0], oppDamageFunctionAndArgs[0],
    damageFunctionAndArgs[1], oppDamageFunctionAndArgs[1],
  ];
  const min = damageFunctionAndArgs[2][0];
  const max = damageFunctionAndArgs[2][1];
  if (distance < min || distance > max) {
    return -1 * (-2 / 1);
  }
  let overrideDistance: number | null = null;
  // Need to fix the ships distance for calculations if the primary wep is drones
  const wep = ship.weapons.sort((a, b) => b.dps - a.dps)[0];
  if (wep && wep.type === 'Turret' && wep.autonomousMovement) {
    if (wep.stats.travelVelocity > Math.max(target.velocity, 10)) {
      overrideDistance = wep.optimal;
    }
  }
  // Adjust the distance if the bulk of the subfleet (thus damage) is located behind oppShipS.
  // This commonly occurs when oppShipS is tackled.
  let oppOverrideDistance: number | null = GetOffsetDistance(distance, oppShipS, oppShipM, shipS);
  const oppWep = target.weapons.sort((a, b) => b.dps - a.dps)[0];
  if (oppWep && oppWep.type === 'Turret' && oppWep.autonomousMovement) {
    if (oppWep.stats.travelVelocity > Math.max(ship.velocity, 10)) {
      oppOverrideDistance = oppWep.optimal;
    }
  }
  return DamageRatioFunction(
    distance, combinedArgs,
    overrideDistance, oppOverrideDistance,
  );
};

function FindIdealRange(ship: Ship, side: Side): number {
  const target = ship.targets[0];
  const damageFunctionAndArgs = getApplicationArgs(ship, target, side);
  const resData = [];

  const remoteReps = ship.outgoingEffects.filter(e =>
    e.type === 'Remote Shield Booster' || e.type === 'Remote Armor Repairer');
  const outgoingEwar = ship.outgoingEffects.filter(e =>
    e.type !== 'Remote Shield Booster' && e.type !== 'Remote Armor Repairer');
  let logiShip = false;
  // Logistics should position to avoid damage while staying in rep range.
  if (remoteReps.length > 0) {
    let totalRepPerSecond = 0;
    let rrRange = 300000;
    for (const rr of remoteReps) {
      rrRange = Math.min(rrRange, rr.optimal);
      if (rr.type === 'Remote Shield Booster') {
        totalRepPerSecond += (rr.shieldBonus / rr.duration) * 1000;
      } else if (rr.type === 'Remote Armor Repairer') {
        totalRepPerSecond += (rr.armorDamageAmount / rr.duration) * 1000;
      }
    }
    const dps = ship.weapons.reduce((t, v) => t + v.dps, 0);
    if (totalRepPerSecond > dps) {
      const repTarget = side.ships.find(s => s.rrDelayTimer > 0 && s.currentEHP > 0);
      if (repTarget) {
        logiShip = true;
        let lMin = damageFunctionAndArgs[2][0];
        let lMax = damageFunctionAndArgs[2][1];
        const isFaster = repTarget.velocity > target.velocity;
        const expectedDis = isFaster ? repTarget.preferedDistance : repTarget.distanceFromTarget;
        lMin = Math.max(lMin, expectedDis - rrRange);
        lMax = Math.min(expectedDis, 300000) + rrRange;
        const resPair = getMin(SetArgsFunction, lMin, lMax, [ship, side]);
        resData.push(resPair);
      }
    }
  }
  // Additional min/max values must be considered for ewar as it can
  // have no impact even at 5-10% of the full max range (which getMin can skip entirely).
  if (logiShip === false) {
    const ewarRanges = [];
    let conservativeOffset = (0.1 * (ship.baseVelocity + target.baseVelocity));
    // Slightly increase the leway when the target can be caught but only slowly.
    if (ship.baseVelocity > target.baseVelocity) {
      conservativeOffset *= ship.baseVelocity / (ship.baseVelocity - target.baseVelocity);
    }
    for (const ewar of outgoingEwar) {
      const ewarOF = (ewar.optimal + (2 * ewar.falloff)) - conservativeOffset;
      const hardMaxTargetRange = Math.max(ship.maxTargetRange, ship.baseMaxTargetRange);
      if (ewarOF < hardMaxTargetRange && ewarRanges.findIndex(n => n === ewarOF) === -1) {
        ewarRanges.push(ewarOF);
      }
    }
    const min = damageFunctionAndArgs[2][0];
    for (const max of [...ewarRanges, damageFunctionAndArgs[2][1]]) {
      const resPair = getMin(SetArgsFunction, min, max, [ship, side]);
      resData.push(resPair);
    }
  }
  resData.sort((a, b) => b[1] - a[1]);
  const [idealRange] = (resData[0]: [number, number]);

  return idealRange;
}

/** Recalculates ewar with the actual distance for ships whose stats may have changed
  * within FindIdealRange when it adjusted ewar effects to consider each tested range.
  */
function UpdateEwarForRepShips(ship: Ship, side: Side) {
  const shipM = getMidShip(side, ship);
  const oppShipS = ship.targets[0];
  const oppShipM = getMidShip(side.oppSide, oppShipS);
  for (const s of [ship, shipM, oppShipS, oppShipM]) {
    RecalcEwarForDistance(s);
  }
}

function GetUpdatedPreferedDistance(ship: Ship, side: Side) {
  const shipsInSubFleet = side.ships.filter(s => s.id === ship.id);
  /**
    * Note this selection will be heavily targeted by opposing ewar.
    * Something like shipsInSubFleet[Math.floor(shipsInSubFleet.length / 2)] would be better to
    * represent the fleets average ability to hold transversal or apply damage.
    * Leaving it alone for now as that would have to be consistent for both sides
    * and done fairly carefully.
    */
  const oppCurrentPrimary = shipsInSubFleet.length > 1 ? shipsInSubFleet[1] : shipsInSubFleet[0];

  UpdateEwarForRepShips(oppCurrentPrimary, side);
  const newPreferedDistance = FindIdealRange(oppCurrentPrimary, side);

  if (newPreferedDistance !== ship.preferedDistance) {
    console.log(
      side.color, ship.name, ship.shipType, ' Best Ratio updated to: ', newPreferedDistance,
      'From: ', ship.preferedDistance,
    );
  }
  RecalcEwarForDistance(ship);
  UpdateEwarForRepShips(oppCurrentPrimary, side);
  ship.rangeRecalc = 10000;
  return newPreferedDistance;
}

function updateProjectionTargets(ship, ewar = null) {
  if (ewar && ewar.currentTarget) {
    const eTarg = ewar.currentTarget;
    ship.projTargets = ship.projTargets.filter(([a, e]) =>
      e.currentTarget && e.currentTarget.currentEHP > 0 && a === e.currentTarget);

    if (!ship.projTargets.some(e => e[0] === eTarg && e[1] === ewar)) {
      ship.projTargets.push([eTarg, ewar]);
    }
  }
  ship.projTargets = ship.projTargets.filter(([a, e]) =>
    e.currentTarget && e.currentTarget.currentEHP > 0 && a === e.currentTarget);

  const v10 = ship.velocity / 10;
  ship.projTargets.sort(([, a], [, b]) => {
    const act = a.currentTarget;
    const bct = b.currentTarget;
    if (act && bct) {
      // It might be worth changing this to sort based off the distance relative
      // to the optimal not the absolute distance (though the expected impact is tiny).
      const va = Math.abs(ship.dis - act.dis);
      const vb = Math.abs(ship.dis - bct.dis);
      const da = Math.abs(act.dis - bct.dis);
      const isAssOrder = (va > v10 + a.optimal && vb > v10 + b.optimal) ||
        (da > a.optimal + b.optimal + (2 * v10));
      if (isAssOrder) {
        return va - vb;
      }
      return vb - va;
    }
    console.error(`${JSON.stringify(ship)} is unexpectedly missing currentTarget data`
                  + `for ${JSON.stringify(a)} or ${JSON.stringify(b)}`);
    return -1;
  });
}

function updateProjTargetsIfNeeded(ship, v10) {
  if (ship.projTargets.length > 1) {
    const e0 = Math.abs(ship.dis - ship.projTargets[0][0].dis);
    const e1 = Math.abs(ship.dis - ship.projTargets[1][0].dis);
    const da = Math.abs(ship.projTargets[0][0].dis - ship.projTargets[1][0].dis);
    const isAssOrder =
      (e0 > ship.projTargets[0][1].optimal + v10 && e1 > ship.projTargets[1][1].optimal + v10)
      || (da > ship.projTargets[0][1].optimal + ship.projTargets[1][1].optimal + (2 * v10));
    if (e1 > e0 && !isAssOrder) {
      updateProjectionTargets(ship);
    } else if (e1 < e0 && isAssOrder) {
      updateProjectionTargets(ship);
    }
  }
}

function moveShip(ship: Ship, t: number, side: Side) {
  if (ship.targets.length <= 0) {
    return;
  }
  if (ship.isSupportShip && ship.projTargets.length > 0 && ship.projTargets[0][0].currentEHP < 0) {
    ship.projTargets.shift();
    moveShip(ship, t, side);
    return;
  }
  const { anchor } = ship;
  if (!ship.isAnchor && anchor) {
    ship.preferedDistance = anchor.preferedDistance;

    if (ship.isSupportShip) {
      // Note projTargets does not include remote repair effects
      // as they only target a single primary and target friendly ships.
      if (ship.isSupportShip && ship.projTargets.length > 0) {
        const v10 = ship.velocity / 10;
        updateProjTargetsIfNeeded(ship, v10);
        const projTargetsStill = anchor.projTargets.length > 0;
        const positioningTarget = projTargetsStill ? anchor.projTargets[0][0] : anchor.targets[0];
        const gapSize = ship.projTargets.length <= anchor.projTargets.length ? Math.max(
          Math.abs(ship.dis - anchor.pendingDis),
          Math.abs(ship.projTargets[0][0].dis - positioningTarget.dis),
        ) : Math.max(
          Math.abs(ship.dis - anchor.pendingDis),
          ...ship.projTargets.map(([a]) => Math.abs(a.dis - positioningTarget.dis)),
        );
        if (gapSize > v10) {
          const e0 = Math.abs(ship.dis - ship.projTargets[0][0].dis);
          const travelDistance = (ship.velocity * t) / 1000;
          if (gapSize > travelDistance) {
            if (ship.dis > ship.projTargets[0][0].dis) {
              if (e0 > ship.preferedDistance) {
                ship.pendingDis -= travelDistance;
              } else {
                ship.pendingDis += travelDistance;
              }
            } else if (ship.dis < ship.projTargets[0][0].dis) {
              if (e0 > ship.preferedDistance) {
                ship.pendingDis += travelDistance;
              } else {
                ship.pendingDis -= travelDistance;
              }
            }
            return;
          }
        }
      }
    }
    const gap = Math.abs(ship.dis - anchor.pendingDis);
    // We only calculate the location separately if it's slower or has a > 0.1 second gap.
    if (ship.velocity < anchor.velocity || gap > (ship.velocity / 10)) {
      const travelDistance = (ship.velocity * t) / 1000;
      if (gap > travelDistance) {
        if (ship.dis > anchor.pendingDis) {
          ship.pendingDis -= travelDistance;
        } else {
          ship.pendingDis += travelDistance;
        }
        return;
      }
    }
    ship.pendingDis = anchor.pendingDis;
    return;
  }
  if (ship.preferedDistance > -1) {
    if (ship.rangeRecalc <= 0) {
      /**
        * Recalculate the preferred range for all fc's at once to prevent
        * small discrepancies from reapplying the ewar after finishing.
        * This could be moved elsewhere to make it cleaner as
        * only each sides first rangeRecalc timer ever actually does anything.
        */
      const newPreferedDistances = [];
      for (const s of [side.oppSide, side]) {
        for (const subFleet of s.subFleets) {
          if (subFleet.fc.currentEHP > 0) {
            newPreferedDistances.push(GetUpdatedPreferedDistance(subFleet.fc, s));
          }
        }
      }
      // Only set preferedDistances after calculating all of them.
      // This prevents the order from potentially impacting the results.
      let index = 0;
      for (const s of [side.oppSide, side]) {
        for (const subFleet of s.subFleets) {
          if (subFleet.fc.currentEHP > 0) {
            subFleet.fc.preferedDistance = newPreferedDistances[index];
            index += 1;
          }
        }
      }
    }
    ship.rangeRecalc -= t;
    const travelDistance = (ship.velocity * t) / 1000;
    if (ship.isSupportShip && ship.projTargets.length > 1) {
      // Always update for anchors as the length can impact the subfleets movement.
      updateProjectionTargets(ship);
    }
    const useProjTarget = ship.isSupportShip && ship.projTargets.length > 0;
    const positioningTarget = useProjTarget ? ship.projTargets[0][0] : ship.targets[0];
    ship.distanceFromTarget = Math.abs(ship.dis - positioningTarget.dis);
    // This is to prevent overshoots, which can cause mirrors to chase each other.
    // (That's a problem as it causes application differences)
    if (Math.abs(ship.distanceFromTarget - ship.preferedDistance) < travelDistance) {
      if (ship.preferedDistance > ship.distanceFromTarget) {
        if (ship.dis < positioningTarget.dis) {
          ship.pendingDis = positioningTarget.dis - ship.preferedDistance;
        } else {
          ship.pendingDis = positioningTarget.dis + ship.preferedDistance;
        }
      } else if (ship.preferedDistance < ship.distanceFromTarget) {
        if (ship.dis < positioningTarget.dis) {
          ship.pendingDis = positioningTarget.dis - ship.preferedDistance;
        } else {
          ship.pendingDis = positioningTarget.dis + ship.preferedDistance;
        }
      }
      ship.distanceFromTarget = ship.preferedDistance;
    } else {
      if (ship.preferedDistance > ship.distanceFromTarget) {
        // Move closer based off relative positions (dis)
        if (ship.dis > positioningTarget.dis) {
          ship.pendingDis += travelDistance;
        } else {
          ship.pendingDis -= travelDistance;
        }
      } else if (ship.preferedDistance < ship.distanceFromTarget) {
        // Move away based off relative positions (dis)
        if (ship.dis < positioningTarget.dis) {
          ship.pendingDis += travelDistance;
        } else {
          ship.pendingDis -= travelDistance;
        }
      }
      ship.distanceFromTarget = Math.abs(ship.dis - ship.targets[0].dis);
    }
    return;
  }
  // should avoid setting on the first tick to allow ewar to apply
  if (ship.preferedDistance === -1 || ship.preferedDistance === -2) {
    ship.preferedDistance -= 1;
    return;
  }
  ship.preferedDistance = GetUpdatedPreferedDistance(ship, side);
}

function getPolyVal(x: number, coefs: number[]) {
  const maxPower = coefs.length - 1;
  let v = 0;
  for (let i = 0; i < coefs.length; i += 1) {
    const c = coefs[i];
    const p = maxPower - i;
    if (p > 0) {
      v += c * (x ** p);
    } else {
      v += c;
    }
  }
  return v;
}

// This is a loose approximation based off the graphs given in the dev blog.
// Can be off by up to 5% but it's much closer for higher currentTotal values.
// Ideally at some point the actual formula should be used instead.
function getAssistEffectiveness(currentTotal: number) {
  const coefs = [-4.6341e-25, 4.6799e-17, -4.5806e-11, 1.8663e-05, 0.0000e+00];
  return 0.5 ** getPolyVal(currentTotal, coefs);
}

let timeElapsed = 0;

type Repair = {
  currentTarget: Ship | null,
  attachedShip: Ship,
  type: ProjectionTypeString,
  [string]: number
};
function ApplyRepair(target: Ship, repair: Repair) {
  const repairAmmount = repair.shieldBonus || repair.armorDamageAmount;
  const effectiveness = getAssistEffectiveness(target.totalIncomingReps);
  const effectiveRepair = effectiveness * (repairAmmount / target.meanResonance);
  const postRepEhp = target.currentEHP + effectiveRepair;
  const newEhp = Math.min(postRepEhp, target.EHP);
  const appliedRep = (newEhp - target.currentEHP) * target.meanResonance;
  target.currentEHP = newEhp;
  if (appliedRep > 0) {
    const expTime = timeElapsed + repair.duration;
    if (target.incomingReps.length > 0) {
      const lastTime = target.incomingReps[target.incomingReps.length - 1][0];
      if (expTime < lastTime) {
        target.isIncomingRepsToBeSorted = true;
      }
    }
    target.incomingReps.push([expTime, appliedRep]);
    target.totalIncomingReps += appliedRep;
  }
}

function CheckForAmmoSwaps(side, subfleet) {
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
    subfleet: Subfleet, refWep: Weapon, newAmmo: AmmoData,
    oldAmmo: AmmoData, reloadTime: number,
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
  for (let i = 0; i < subfleet.wepAmmoSwapData.length; i += 1) {
    const set = subfleet.wepAmmoSwapData[i];
    const wep = subfleet.fc.weapons[i];
    const fcTargets = subfleet.fc.targets;
    if (set.cycledSinceCheck && fcTargets.length > 0 && wep.currentReload < 0.75 * wep.reload) {
      set.cycledSinceCheck = false;
      const expectedDamage = calculateDamage(subfleet.fc, fcTargets[0], wep, side);
      side.theoreticalDamage -= wep.damage;
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
          const damage = calculateDamage(subfleet.fc, fcTargets[0], wep, side);
          // Remove added theoretical damage from calculateDamage.
          side.theoreticalDamage -= wep.damage;
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
            ammoSwap(subfleet, wep, newAmmo, initalAmmo, reloadTime);
            const id = newAmmo[1];
            set.currentAmmo = id;
            set.chargesLeft = set.chargesHeld;
            // This will trigger a fairly slow range recalc that normally runs every 10 seconds.
            // Keep an eye on it if ammo swaps are very frequent.
            subfleet.fc.rangeRecalc = 0;
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

function ApplyRemoteEffects(side: Side, t: number, opposingSide: Side) {
  // After this file is reorganised ammo swap checks should be moved somewhere more appropriate.
  for (const subfleet of side.subFleets) {
    CheckForAmmoSwaps(side, subfleet);
  }
  if (side.subFleetEffectPurgeTimer < 0) {
    for (const subfleet of side.subFleets) {
      subfleet.remoteRepair = subfleet.remoteRepair.filter(eff => eff.type !== 'Dead Host');
      subfleet.ewar = subfleet.ewar.filter(eff => eff.type !== 'Dead Host');
    }
    side.subFleetEffectPurgeTimer = 120000;
  } else {
    side.subFleetEffectPurgeTimer -= t;
  }
  let logiLockedShips;
  for (const subfleet of side.subFleets) {
    const oppShipLen = opposingSide.ships.length;
    if (subfleet.fc.targets.length > 0) {
      let i = 0;
      for (const ewar of subfleet.ewar) {
        if (ewarTargetType[ewar.type] === TargetTypes.scattered) {
          i += 1;
        }
        if (ewar.currentDuration <= 0) {
          if (ewar.attachedShip.currentEHP <= 0) {
            // Apply to the dead ship with an effectively infinite duration.
            // This will purge it from the previous target.
            ewar.duration = 100000000;
            ApplyEwar(ewar, [ewar.attachedShip], 900000);
            ewar.type = 'Dead Host';
          } else {
            let scatterTarget = null;
            if (ewarTargetType[ewar.type] === TargetTypes.scattered) {
              const n = i % oppShipLen;
              // Don't target the subfleets anchor initially.
              // Instead target it when the rest of the subfleet has
              // been targeted before starting on the next subfleet.
              if (!opposingSide.ships[n].isAnchor) {
                scatterTarget = opposingSide.ships[n];
              } else {
                // Get the scatter target for the previous i value.
                const prevShip = n > 0 ?
                  opposingSide.ships[n - 1] : opposingSide.ships[oppShipLen - 1];
                // Target prevShip's anchor if it has one.
                // Otherwise it must be an anchor and was skipped over with the previous i value.
                scatterTarget = prevShip.anchor || prevShip;
              }
            }
            ApplyEwar(ewar, scatterTarget ? [scatterTarget] : subfleet.fc.targets);
            if (ewar.attachedShip.isSupportShip) {
              updateProjectionTargets(ewar.attachedShip, ewar);
            }
          }
        }
        ewar.currentDuration -= t;
      }
    }
    if (subfleet.remoteRepair.length > 0) {
      if (!logiLockedShips) {
        logiLockedShips = side.ships.filter(s => s.rrDelayTimer > 0);
      }
      for (const rr of subfleet.remoteRepair) {
        if (rr.currentDuration <= 0) {
          if (rr.attachedShip.currentEHP <= 0) {
            // No need to reapply to self since rr has no ongoing effect.
            rr.currentDuration = 100000000;
            rr.type = 'Dead Host';
          } else if (rr.type === 'Remote Shield Booster') {
            const target = logiLockedShips.find(s => s.currentEHP > 0 && s.tankType === 'shield'
              && s.rrDelayTimer > s.lockTimeConstant / rr.scanRes
              && s !== rr.attachedShip);
            if (target) {
              ApplyRepair(target, rr);
              rr.currentDuration = rr.duration;
              rr.currentTarget = target;
            }
          } else if (rr.type === 'Remote Armor Repairer') {
            const target = rr.currentTarget;
            if (target && target.currentEHP > 0) {
              ApplyRepair(target, rr);
            }
            const newTarget = logiLockedShips.find(s => s.currentEHP > 0 && s.tankType === 'armor'
              && s.rrDelayTimer > s.lockTimeConstant / rr.scanRes
              && s !== rr.attachedShip);
            if (newTarget) {
              rr.currentTarget = newTarget;
              rr.currentDuration = rr.duration;
            }
          }
        }
        rr.currentDuration -= t;
      }
    }
  }
}

function RunFleetActions(side: Side, t: number, opposingSide: Side, isSideOneOfTwo: ?boolean) {
  if (isSideOneOfTwo === true) {
    timeElapsed += t;
    for (const s of [side, opposingSide]) {
      for (const ship of s.ships) {
        if (ship.totalIncomingReps > 0) {
          if (ship.isIncomingRepsToBeSorted) {
            ship.incomingReps.sort((a, b) => a[0] - b[0]);
            ship.isIncomingRepsToBeSorted = false;
          }
          while (ship.incomingReps.length > 0 && timeElapsed >= ship.incomingReps[0][0]) {
            const expiredRep = ship.incomingReps.shift();
            ship.totalIncomingReps -= expiredRep[1];
          }
        }
      }
    }

    ApplyRemoteEffects(side, t, opposingSide);
    ApplyRemoteEffects(opposingSide, t, side);

    for (const s of [side, opposingSide]) {
      for (const subFleet of s.subFleets) {
        const ship = subFleet.fc;
        if (ship.isShotCaller === true) {
          while (ship.targets.length > 0 && ship.targets[0].currentEHP <= 0) {
            ship.targets.shift();
          }
          if (ship.targets.length < ship.maxTargets) {
            getTargets(ship, s.oppSide);
          }
        }
      }
    }

    for (const s of [side, opposingSide]) {
      for (const ship of s.ships) {
        moveShip(ship, t, s);
      }
    }

    for (const s of [side, opposingSide]) {
      for (const ship of s.ships) {
        ship.dis = ship.pendingDis;
        ship.distanceFromTarget = Math.abs(ship.dis - ship.targets[0].pendingDis);
        if (ship.currentEHP < ship.EHP && ship.velocity > 0) {
          ship.rrDelayTimer += t;
        }
      }
    }
  }

  const initalDamage = side.appliedDamage;
  for (const ship of side.ships) {
    // This will somewhat fade meaningfully scrammed or webbed ships.
    // Ideally at some point a more robust and broad system should be
    // implemented to show various states and projected effects.
    if (ship.velocity < ship.baseVelocity / 2) {
      if (ship.iconColor === ship.baseIconColor) {
        const rgb = ship.iconColor.slice(4, -1).split(', ');
        ship.iconColor = `rgba(${rgb[0]}, ${rgb[1]}, ${rgb[2]}, 0.7)`;
      }
    } else {
      ship.iconColor = ship.baseIconColor;
    }
    for (const wep of ship.weapons) {
      if (ship.targets.length > 0) {
        dealDamage(ship, t, wep, side);
      }
    }
  }

  const sideHasAppliedDamage = initalDamage !== side.appliedDamage;
  return sideHasAppliedDamage;
}

export default RunFleetActions;
