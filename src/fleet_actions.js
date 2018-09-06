// @flow
import { Weapon, PendingAttack } from './weapon_classes';
import Ship from './ship_class';
import type { Ewar } from './ship_class';
import Side from './side_class';
import type { VectorMaxLenThree } from './flow_types';
import type { Subfleet } from './side_class';

function findNewTarget(targetCaller: Ship, opposingSide: Side): ?Ship {
  const oppShips = opposingSide.ships;
  let newTarget;
  if (targetCaller.maxTargets >= opposingSide.ships.length) {
    newTarget = opposingSide.ships.find(oppShip =>
      !oppShip.isShotCaller &&
      !targetCaller.targets.some(target => target === oppShip) && oppShip.currentEHP > 0);
    const possibleFcTarget = opposingSide.ships.find(oppShip =>
      !targetCaller.targets.some(target => target === oppShip) && oppShip.currentEHP > 0);
    // This should target the fc if it's the last ship left in the group
    if (!newTarget || (possibleFcTarget && possibleFcTarget.id !== newTarget.id)) {
      newTarget = possibleFcTarget;
    }
  } else {
    const targetOppFc = s => s.isShotCaller && !targetCaller.targets.some(target => target === s);
    const oppFcIndex = oppShips.slice(0, targetCaller.maxTargets - 1).findIndex(targetOppFc);
    const tarLen = targetCaller.targets.length;
    if (oppFcIndex >= 0 && oppShips.length > tarLen + 1 && tarLen > 0 &&
        oppShips[oppFcIndex].id !== oppShips[tarLen + 1].id) {
      newTarget = oppShips[oppFcIndex];
    } else {
      newTarget = opposingSide.ships.find(oppShip =>
        !oppShip.isShotCaller && oppShip.currentEHP > 0 &&
        !targetCaller.targets.some(target => target === oppShip));
    }
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
 **/
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

const MissleApplication = (distance: number, [
  sigRatio, targetVelocity, expVelocity, optimal, missileDamageReductionFactor,
]: DamageApplicationArgs) => {
  if (optimal < distance) {
    return 0.0001;
  }
  if (Array.isArray(sigRatio)) {
    console.error('MissleApplication recived incorrect argments and will return 0');
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
    console.error('HitChanceFunction recived incorrect argments and will return 0');
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
  overrideDroneDistance: ?number,
  oppOverrideDroneDistance: ? number,
) => {
  let damageApplication = damageFunction(overrideDroneDistance || distance, args);
  let oppApplication = oppDamageFunction(oppOverrideDroneDistance || distance, oppArgs);
  if (damageApplication < 0.3) {
    damageApplication -= 1;
    oppApplication += 0.001;
  }
  return -1 * (damageApplication / oppApplication);
};

/**
 * Used to get a typical representitive of the ships subfleet.
 * The return should be functionally equivilent to:
 *   side.ships.filter(s => s.id === ship.id)[Math.floor(shipsInSubFleet.length / 2)];
 * This is a touch more convoluted but runs much faster for large fights.
 **/
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
    // This should be extremely rare and only occur when calculating prefered range.
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

function innerGetDeltaVelocity(
  ship: Ship, vForTransversal: number, target: Ship,
  mTarget: Ship, isEffTrackingBetter: boolean,
) {
  const tv = target.velocity;
  const mtv = mTarget.velocity;
  if (vForTransversal > Math.max(tv, mtv)) {
    return isEffTrackingBetter ? Math.abs(vForTransversal - Math.max(tv, mtv)) : 0;
  } else if (ship.velocity >= tv) {
    return 0;
  }
  return isEffTrackingBetter ? 0 : Math.abs(ship.velocity - tv);
}

/**
 * Get's the velocity delta when the target is assumed to be targeting the ship.
 * Useful for theoretical situations as ships typically adjust range far more
 * slowly than transversal.
 * Thus for ideal range calculations they should consider that they might get shot when
 * picking their transversal, even if they aren't currently targeted.
**/
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
  const oppEffectiveTarget = getDoaTarget(target, side.oppSide);
  vForTransversal = Math.min(vForTransversal, oppEffectiveTarget.velocity);
  const deltaVelocity = innerGetDeltaVelocity(ship, vForTransversal, target, mTarget, supTracking);
  return deltaVelocity;
}

function getApplicationArgs(ship: Ship, target: Ship, side: Side): ApplicationArgArray {
  let minRange = (Math.min(1000, ship.sigRadius) * 2) + Math.min(1000, target.sigRadius);
  // min range is a rearange of 2 * v * align / 0.75 == 2 * PI * minRange
  minRange = Math.max(minRange, (ship.velocity * ship.alignTime) / 2.35619);
  let maxRange;
  // Ship movement isn't exact so reduce max values very slightly when they have no falloff.
  const noFalloffComp = (0.1 * (ship.velocity + target.velocity));
  const conservativeMaxTargetRange = ship.maxTargetRange - noFalloffComp;
  const wep = ship.weapons.sort((a, b) => b.dps - a.dps)[0];
  if (wep && wep.type === 'Turret') {
    const damageFunction = TurretApplication;
    const trackingFactor = wep.stats.tracking * target.sigRadius;
    maxRange = Math.min(conservativeMaxTargetRange, wep.optimal + (wep.stats.falloff * 3));
    let velocity;
    const oppVelocity = [0];
    if (wep.autonomousMovement) {
      if (wep.stats.travelVelocity > Math.max(target.velocity, 10)) {
        maxRange = Math.min(ship.droneControlRange, conservativeMaxTargetRange);
      } else {
        maxRange = Math.min(ship.droneControlRange, maxRange);
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
    const damageFunction = MissleApplication;
    const sigRatio = target.sigRadius / wep.stats.sigRadius;
    const oppVelocity = [target.velocity];
    const args: DamageApplicationArgs = [sigRatio, oppVelocity, wep.stats.expVelocity,
      effectiveOptimal, wep.stats.damageReductionFactor];
    maxRange = Math.min(conservativeMaxTargetRange, effectiveOptimal - noFalloffComp);
    return ([damageFunction, args, [minRange, maxRange]]: ApplicationArgArray);
  }
  const damageFunction = MissleApplication;
  const args: DamageApplicationArgs = [0, [0], 0, 0, 0];
  return ([damageFunction, args, [0, 0]]: ApplicationArgArray);
}

function sign(x) {
  if (x < 0.0) return -1;
  return (x > 0.0) ? 1 : 0;
}

function getMin(
  func: (number, [Ship, Side]) => number,
  x1, x2, args: [Ship, Side], xatol = 1e-5, maxfun = 500,
): number {
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
    // Check for parabolic fit
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

      // Check for acceptability of parabola
      if ((Math.abs(p) < Math.abs(0.5 * q * r)) && (p > q * (a - xf)) &&
          (p < q * (b - xf))) {
        rat = (p + 0.0) / q;
        x = xf + rat;

        if (((x - a) < tol2) || ((b - x) < tol2)) {
          const si = sign(xm - xf) + ((xm - xf) === 0);
          rat = tol1 * si;
        }
      } else { // do a golden section step
        golden = 1;
      }
    }
    if (golden) { // Do a golden-section step
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
  return result;
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
    return wep.damage * MissleApplication(ship.distanceFromTarget, [
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
      // In practice drones have all sorts of funkyness that's not practical to model.
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
  // Targets.length > 1 not 0 beacuse a single target often indicates a forced target
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

function NoScramsInRange(t: Ship) {
  const inRange =
    s => Math.abs(s[2].attachedShip.dis - (s[2].currentTarget || t).dis) <= s[2].optimal;
  if (t.appliedEwar.scrams.some(inRange)) {
    return false;
  }
  return true;
}

function ApplyEwar(ewar, targets, distance, scatterTarget) {
  let target = targets[0];
  if (ewar.type === 'Stasis Web') {
    const getInitalVel = t =>
      (NoScramsInRange(t) ? t.baseVelocity : t.unpropedVelocity);
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
    const multi = ewarFalloffCalc(baseMulti, ewar, distance);
    target = getFocusedEwarTarget(targets, 'webs', multi);
    target.appliedEwar.webs.push([multi, baseMulti, ewar]);
    target.appliedEwar.webs.sort((a, b) => Math.abs(b[0]) - Math.abs(a[0]));
    if (target.appliedEwar.webs.length > 7) {
      target.appliedEwar.webs.pop();
    }
    target.velocity = NetValue(target.appliedEwar.webs, getInitalVel(target));
  } else if (ewar.type === 'Target Painter') {
    const getInitalSig = t =>
      (NoScramsInRange(t) ? t.baseSigRadius : t.unpropedSigRadius);
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
    const multi = ewarFalloffCalc(baseMulti, ewar, distance);
    target = getFocusedEwarTarget(targets, 'tps', multi);
    target.appliedEwar.tps.push([multi, baseMulti, ewar]);
    target.appliedEwar.tps.sort((a, b) => Math.abs(b[0]) - Math.abs(a[0]));
    if (target.appliedEwar.tps.length > 7) {
      target.appliedEwar.tps.pop();
    }
    target.sigRadius = NetValue(target.appliedEwar.tps, getInitalSig(target));
  } else if (ewar.type === 'Sensor Dampener') {
    target = scatterTarget;
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
    target = scatterTarget;
    setProjections(ewar, distance, attrs, targetVals, target);
  } else if (ewar.type === 'Warp Scrambler' && ewar.activationBlockedStrenght > 0) {
    target = scatterTarget;
    const getInitalVel = t =>
      (NoScramsInRange(t) ? t.baseVelocity : t.unpropedVelocity);
    const getInitalSig = t =>
      (NoScramsInRange(t) ? t.baseSigRadius : t.unpropedSigRadius);
    const oldTarget = ewar.currentTarget;
    if (oldTarget) {
      const pullIndex = oldTarget.appliedEwar.scrams.findIndex(e => e[2] === ewar);
      oldTarget.appliedEwar.scrams.splice(pullIndex, 1);
      oldTarget.velocity = NetValue(oldTarget.appliedEwar.webs, getInitalVel(oldTarget));
      oldTarget.sigRadius = NetValue(oldTarget.appliedEwar.tps, getInitalSig(oldTarget));
    }
    // Note the scram is intentionally added even when it's out of range.
    target.appliedEwar.scrams.push([0, 0, ewar]);
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
    // Note ApplyEwar often sorts appliedEwar values so the spread opperator is needed.
    for (const ewarApp of [...ship.appliedEwar[att]]) {
      const ewar = ewarApp[2];
      const originalTimeLeftInCycle = ewar.currentDuration;
      let distance = posDistanceOveride;
      const ewarSrc = ewar.attachedShip;
      if (distance) {
        // The distance arg is replaced if we can't reasonably
        // expect to dictate range to the ewar's source
        if (ewarSrc.velocity > ship.velocity) {
          if (distance > ewarSrc.distanceFromTarget) {
            distance = ewarSrc.distanceFromTarget;
          } else if (distance > ewar.optimal && distance > ewarSrc.preferedDistance) {
            if ((ewarSrc.velocity - ship.velocity) * 5 > distance - ewarSrc.preferedDistance) {
              distance = ewarSrc.preferedDistance;
            }
          }
        }
      }
      const d = distance || ewarSrc.distanceFromTarget;
      ApplyEwar(ewar, [ship], d, ship);
      ewar.currentDuration = originalTimeLeftInCycle;
    }
  }
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
  // Need to fix the ships distance for calculations if the primary wep is drones
  let overrideDroneDistance = null;
  const wep = ship.weapons.sort((a, b) => b.dps - a.dps)[0];
  if (wep && wep.type === 'Turret' && wep.autonomousMovement) {
    if (wep.stats.travelVelocity > Math.max(target.velocity, 10)) {
      overrideDroneDistance = wep.optimal;
    }
  }
  let oppOverrideDroneDistance = null;
  const oppWep = target.weapons.sort((a, b) => b.dps - a.dps)[0];
  if (oppWep && oppWep.type === 'Turret' && oppWep.autonomousMovement) {
    if (oppWep.stats.travelVelocity > Math.max(ship.velocity, 10)) {
      oppOverrideDroneDistance = oppWep.optimal;
    }
  }
  return DamageRatioFunction(
    distance, combinedArgs,
    overrideDroneDistance, oppOverrideDroneDistance,
  );
};

function FindIdealRange(ship: Ship, side: Side): number {
  const target = ship.targets[0];
  const damageFunctionAndArgs = getApplicationArgs(ship, target, side);
  const min = damageFunctionAndArgs[2][0];
  const max = damageFunctionAndArgs[2][1];
  const idealRange = getMin(SetArgsFunction, min, max, [ship, side]);
  return idealRange;
}

/** Recalcs ewar with the actual distance for ships whose stats may changed
  * within FindIdealRange as it adjusts ewar effects to consider the range being tested.
 **/
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
    * Leaving it alone for now as that would have to be consistant for both sides
    * and done fairly carefully.
   **/
  const oppCurrentPrimary = shipsInSubFleet.length > 1 ? shipsInSubFleet[1] : shipsInSubFleet[0];

  UpdateEwarForRepShips(oppCurrentPrimary, side);
  const newPreferedDistance = FindIdealRange(oppCurrentPrimary, side);

  if (newPreferedDistance !== ship.preferedDistance) {
    console.log(
      side.color, ship.name, ' Best Ratio updated to: ', newPreferedDistance,
      'From: ', ship.preferedDistance,
    );
  }
  RecalcEwarForDistance(ship);
  UpdateEwarForRepShips(oppCurrentPrimary, side);
  ship.rangeRecalc = 10000;
  return newPreferedDistance;
}

function moveShip(ship: Ship, t: number, side: Side) {
  if (ship.targets.length <= 0) {
    return;
  }
  const { anchor } = ship;
  if (!ship.isAnchor && anchor) {
    ship.preferedDistance = anchor.preferedDistance;
    const gap = Math.abs(ship.dis - anchor.pendingDis);
    // We only calculate the location seprately if it's slower or has a > 0.1 second gap.
    if (ship.velocity < anchor.velocity || gap > (ship.velocity / 10)) {
      const travelDistance = (ship.velocity * t) / 1000;
      if (gap > travelDistance) {
        if (ship.dis > anchor.pendingDis) {
          ship.pendingDis -= travelDistance;
        } else {
          ship.pendingDis += travelDistance;
        }
        ship.distanceFromTarget = Math.abs(ship.dis - ship.targets[0].dis);
        return;
      }
    }
    ship.distanceFromTarget = anchor.distanceFromTarget;
    ship.pendingDis = anchor.pendingDis;
    return;
  }
  if (ship.preferedDistance > -1) {
    if (ship.rangeRecalc <= 0) {
      /**
        * Recalc the prefered range for all fc's at once to prevent
        * small discrepencies from reapplying the ewar after finishing.
        * This could be moved elsewhere to make it cleaner as
        * only each sides first rangeRecalc timer ever actually does anything.
       **/
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
    ship.distanceFromTarget = Math.abs(ship.dis - ship.targets[0].dis);
    // This is to prevent overshoots, which can cause mirrors to chase each other.
    // (That's a problem as it causes application diffrences)
    if (Math.abs(ship.distanceFromTarget - ship.preferedDistance) < travelDistance) {
      if (ship.preferedDistance > ship.distanceFromTarget) {
        if (ship.dis < ship.targets[0].dis) {
          ship.pendingDis = ship.targets[0].dis - ship.preferedDistance;
        } else {
          ship.pendingDis = ship.targets[0].dis + ship.preferedDistance;
        }
      } else if (ship.preferedDistance < ship.distanceFromTarget) {
        if (ship.dis < ship.targets[0].dis) {
          ship.pendingDis = ship.targets[0].dis - ship.preferedDistance;
        } else {
          ship.pendingDis = ship.targets[0].dis + ship.preferedDistance;
        }
      }
      ship.distanceFromTarget = ship.preferedDistance;
    } else {
      if (ship.preferedDistance > ship.distanceFromTarget) {
        // Move closer based off relative positions (dis)
        if (ship.dis > ship.targets[0].dis) {
          ship.pendingDis += travelDistance;
        } else {
          ship.pendingDis -= travelDistance;
        }
      } else if (ship.preferedDistance < ship.distanceFromTarget) {
        // Move away based off relative positions (dis)
        if (ship.dis < ship.targets[0].dis) {
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

function ApplyRemoteEffects(side: Side, t: number, opposingSide: Side) {
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
        i += 1;
        if (ewar.currentDuration <= 0) {
          if (ewar.attachedShip.currentEHP <= 0) {
            // Apply to the dead ship with an effectively infinite duration.
            // This will purge it from the previous target.
            ewar.duration = 100000000;
            ApplyEwar(ewar, [ewar.attachedShip], 900000, ewar.attachedShip);
            ewar.type = 'Dead Host';
          } else {
            ApplyEwar(
              ewar, subfleet.fc.targets, ewar.attachedShip.distanceFromTarget,
              opposingSide.ships[i % oppShipLen],
            );
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
              && s.rrDelayTimer > s.lockTimeConstant / rr.scanRes);
            if (target) {
              const postRepEhp = target.currentEHP + (rr.shieldBonus / target.meanResonance);
              target.currentEHP = Math.min(postRepEhp, target.EHP);
              rr.currentDuration = rr.duration;
            }
          } else if (rr.type === 'Remote Armor Repairer') {
            const target = rr.currentTarget;
            if (target && target.currentEHP > 0) {
              const effRep = rr.armorDamageAmount / target.meanResonance;
              const postRepEhp = target.currentEHP + effRep;
              target.currentEHP = Math.min(postRepEhp, target.EHP);
            }
            const newTarget = logiLockedShips.find(s => s.currentEHP > 0 && s.tankType === 'armor'
              && s.rrDelayTimer > s.lockTimeConstant / rr.scanRes);
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
    ApplyRemoteEffects(side, t, opposingSide);
    ApplyRemoteEffects(opposingSide, t, side);

    for (const s of [side, opposingSide]) {
      for (const subFleet of s.subFleets) {
        const ship = subFleet.fc;
        if (ship.isShotCaller === true && ship.targets.length < ship.maxTargets) {
          while (ship.targets.length > 0 && ship.targets[0].currentEHP <= 0) {
            ship.targets.shift();
          }
          getTargets(ship, s.oppSide);
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
