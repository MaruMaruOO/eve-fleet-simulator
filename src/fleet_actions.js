// @flow
import { Weapon, PendingAttack } from './weapon_classes';
import Ship from './ship_class';
import Side from './side_class';
import type { VectorMaxLenThree } from './flow_types';

function getTargets(targetCaller: Ship, opposingSide: Side) {
  let newTarget = opposingSide.ships.find(oppShip =>
    !oppShip.isShotCaller && !targetCaller.targets.some(target => target === oppShip));
  if (targetCaller.maxTargets >= opposingSide.ships.length) {
    newTarget = opposingSide.ships.find(oppShip =>
      !targetCaller.targets.some(target => target === oppShip));
  }
  if (newTarget !== undefined) {
    targetCaller.targets.push(newTarget);
    if (targetCaller.targets.length < targetCaller.maxTargets) {
      getTargets(targetCaller, opposingSide);
    }
  }
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
  const angularVelocity = netVelocity / distance;
  const trackingComponent = ((angularVelocity * 40000) / (trackingFactor)) ** 2;
  const rangeComponent = (Math.max(0, distance - optimal) / falloff) ** 2;
  const hitChance = (0.5 ** (trackingComponent + rangeComponent));
  return hitChance;
};

const DamageRatioFunction = (
  distance: number,
  [damageFunction, oppDamageFunction, args, oppArgs]: DamageRatioArgs,
) => {
  let damageApplication = damageFunction(distance, args);
  let oppApplication = oppDamageFunction(distance, oppArgs);
  if (damageApplication < 0.3) {
    damageApplication -= 1;
    oppApplication += 0.001;
  }
  return -1 * (damageApplication / oppApplication);
};

function getApplicationArgs(ship: Ship, target: Ship): ApplicationArgArray {
  let minRange = (Math.min(1000, ship.sigRadius) * 2) + Math.min(1000, target.sigRadius);
  // min range is a rearange of 2 * v * align / 0.75 == 2 * PI * minRange
  minRange = Math.max(minRange, (ship.velocity * ship.alignTime) / 2.35619);
  let maxRange;
  const wep = ship.weapons.sort((a, b) => b.dps - a.dps)[0];
  const oppWep = target.weapons.sort((a, b) => b.dps - a.dps)[0];
  if (wep && wep.type === 'Turret') {
    const damageFunction = HitChanceFunction;
    const trackingFactor = wep.stats.tracking * target.sigRadius;
    const oppTrackingFactor = oppWep ? oppWep.stats.tracking * ship.sigRadius : 0;
    maxRange = Math.min(ship.maxTargetRange, (wep.optimal + wep.stats.falloff) * 3);
    let velocity;
    let oppVelocity = [0];
    if (wep.autonomousMovement) {
      velocity = [wep.stats.travelVelocity];
      oppVelocity = [target.velocity];
    } else if (ship.velocity > target.velocity && oppTrackingFactor > trackingFactor) {
      velocity = [0];
    } else {
      velocity = [Math.abs(ship.velocity - target.velocity)];
    }
    const args: DamageApplicationArgs = [velocity, oppVelocity, trackingFactor,
      wep.optimal, wep.stats.falloff];
    return ([damageFunction, args, [minRange, maxRange]]: ApplicationArgArray);
  } else if (wep && wep.type === 'Missile') {
    const damageFunction = MissleApplication;
    const sigRatio = target.sigRadius / wep.stats.sigRadius;
    const oppVelocity = [target.velocity];
    const args: DamageApplicationArgs = [sigRatio, oppVelocity, wep.stats.expVelocity, wep.optimal,
      wep.stats.damageReductionFactor];
    maxRange = Math.min(ship.maxTargetRange, wep.optimal);
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
  func: (number, DamageRatioArgs) => number,
  x1, x2, args: DamageRatioArgs, xatol = 1e-5, maxfun = 500,
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

function FindIdealRange(ship: Ship): number {
  const target = ship.targets[0];
  const damageFunctionAndArgs = getApplicationArgs(ship, target);
  const oppDamageFunctionAndArgs = getApplicationArgs(target, ship);
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
  const idealRange = getMin(DamageRatioFunction, min, max, combinedArgs);

  const chance = damageFunctionAndArgs[0](idealRange, damageFunctionAndArgs[1]);
  console.log('application at selected range for', ship.name, chance, 'argSet:', damageFunctionAndArgs[1]);
  return idealRange;
}

function moveShip(ship: Ship, t: number) {
  if (ship.targets.length <= 0) {
    return;
  }
  if (!ship.isAnchor && ship.anchor) {
    ship.distanceFromTarget = ship.anchor.distanceFromTarget;
    ship.preferedDistance = ship.anchor.preferedDistance;
    return;
  }
  if (ship.preferedDistance !== -1) {
    ship.distanceFromTarget = ship.targets[0].distanceFromTarget;
    const travelDistance = (ship.velocity * t) / 1000;
    if (Math.abs(ship.distanceFromTarget - ship.preferedDistance) < travelDistance) {
      ship.distanceFromTarget = ship.preferedDistance;
    } else {
      ship.distanceFromTarget += ship.preferedDistance > ship.distanceFromTarget ?
        travelDistance : -travelDistance;
    }
    return;
  }
  ship.preferedDistance = FindIdealRange(ship);

  console.log(ship.name, ' Best Ratio: ', ship.preferedDistance);
}

function calculateDamage(ship: Ship, target: Ship, wep: Weapon, side: Side): number {
  side.theoreticalDamage += wep.damage;
  if (ship.distanceFromTarget > ship.maxTargetRange) {
    return 0;
  }
  if (wep.type === 'Missile') {
    return wep.damage * MissleApplication(ship.distanceFromTarget, [
      target.sigRadius / wep.stats.sigRadius,
      [target.velocity], wep.stats.expVelocity,
      wep.optimal, wep.stats.damageReductionFactor]);
  } else if (wep.type === 'Turret') {
    let deltaVelocity;
    if (ship.velocity > target.velocity &&
        (target.weapons.length > 0 ? target.weapons[0].stats.tracking * ship.sigRadius : 0)
        > wep.stats.tracking * target.sigRadius) {
      deltaVelocity = 0;
    } else {
      deltaVelocity = Math.abs(ship.velocity - target.velocity);
    }
    if (wep.autonomousMovement) {
      if (ship.distanceFromTarget > ship.droneControlRange ? ship.droneControlRange : 84000) {
        return 0;
      }
      return wep.damage * HitChanceFunction(ship.distanceFromTarget, [
        [wep.stats.travelVelocity], [target.velocity],
        wep.stats.tracking * target.sigRadius,
        wep.optimal, wep.stats.falloff]);
    }
    return wep.damage * HitChanceFunction(ship.distanceFromTarget, [
      [deltaVelocity], [0],
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
      const damage = calculateDamage(ship, ship.targets[0], wep, side);
      const attack = new PendingAttack(damage, wep.getDamageDelay(ship.distanceFromTarget));
      wep.pendingDamage.push(attack);
      wep.currentReload = wep.reload;
    }
    let isPendingFinished = false;
    for (let i = 0; i < wep.pendingDamage.length; i += 1) {
      wep.pendingDamage[i].timer -= t;
      if (wep.pendingDamage[i].timer <= 0) {
        const initalHP: number = ship.targets[0].currentEHP;
        ship.targets[0].currentEHP -= wep.pendingDamage[i].damage;
        side.appliedDamage += initalHP - ship.targets[0].currentEHP;
        isPendingFinished = true;
      }
    }
    if (isPendingFinished) {
      wep.pendingDamage = wep.pendingDamage.filter(attack => attack.timer > 0);
    }
  }
}

function RunFleetActions(side: Side, t: number, opposingSide: Side) {
  const initalDamage = side.appliedDamage;
  for (const ship of side.ships) {
    for (const wep of ship.weapons) {
      if (ship.targets.length > 0) {
        dealDamage(ship, t, wep, side);
      }
    }
    if (ship.isShotCaller === true && ship.targets.length < ship.maxTargets) {
      getTargets(ship, opposingSide);
    }
    moveShip(ship, t);
  }
  if (initalDamage !== side.appliedDamage) {
    side.deadShips = [...side.deadShips, ...side.ships.filter(ship => ship.currentEHP <= 0)];
    side.ships = side.ships.filter(ship => ship.currentEHP > 0);
  }
}

export default RunFleetActions;
