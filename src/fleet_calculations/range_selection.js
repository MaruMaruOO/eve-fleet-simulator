// @flow
import Ship from './../ship_class';
import Side from './../side_class';
import getMidShip from './mid_ship';
import { ApplyEwar } from './remote_effects';
import { MissileApplication, TurretApplication } from './weapon_application';
import type { ApplicationArgArray, DamageRatioArgs, DamageApplicationArgs } from './weapon_application';
import { getMirrorVelocityDelta } from './velocity_delta';

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
    // Slightly reduce max range when falloff is extremely low as the dropoff is very sudden.
    if (wep.stats.falloff * 2.5 < noFalloffComp) {
      maxRange -= noFalloffComp;
    }
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

export default GetUpdatedPreferedDistance;
