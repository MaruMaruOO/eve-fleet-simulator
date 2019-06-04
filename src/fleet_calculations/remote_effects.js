// @flow

import { getFocusedEwarTarget, updateProjectionTargets } from './targeting';
import type { ProjectionTypeString } from './../flow_types';
import Ship from './../ship_class';
import type { Ewar } from './../ship_class';
import Side from './../side_class';
import { Weapon } from './../weapon_classes';

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
  // this will focus the fc's targets then scatter any leftover ewar.
  partiallyFocused: 2,
};
type EwarTargetTypeMap = {
  [ProjectionTypeString]: typeof TargetTypes.focused
    | typeof TargetTypes.scattered
    | typeof TargetTypes.partiallyFocused,
};
const ewarTargetType: EwarTargetTypeMap = {
  'Stasis Web': TargetTypes.focused,
  'Weapon Disruptor': TargetTypes.scattered,
  'Warp Scrambler': TargetTypes.scattered,
  'Target Painter': TargetTypes.focused,
  'Sensor Dampener': TargetTypes.scattered,
  'Energy Neutralizer': TargetTypes.partiallyFocused,
  'Energy Nosferatu': TargetTypes.partiallyFocused,
  /* Unimplemented EWAR that's in the data export.
     ECM: 'scattered',
     'Burst Jammer': AoE,
     'Micro Jump Drive': N/A,
  */
};

function ApplyEwar(
  ewar: Ewar, targets: Ship[],
  distanceOveride: number | null = null, altScatterTarget: Ship | null = null,
) {
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
  } else if (ewar.type === 'Energy Neutralizer') {
    if (ewar.attachedShip.cap > ewar.capacitorNeed) {
      const baseDrain = ewar.energyNeutralizerAmount;
      let i = 0;
      while (i < targets.length &&
             (target.currentEHP <= 0 ||
              target.cap < target.capacitorCapacity / 10 ||
              target.expectedCapLoss >= target.cap)) {
        i += 1;
        if (i === targets.length) {
          target = altScatterTarget || target;
        } else {
          target = targets[i];
        }
      }
      if ((target.currentEHP <= 0 ||
           target.expectedCapLoss >= target.cap) && (ewar.attachedShip.currentEHP > 0)) {
        return;
      }
      let drain = baseDrain;
      const rs = target.rigSize;
      if (rs <= 1) {
        drain *= ewar.entityCapacitorLevelModifierSmall;
      } else if (rs === 2) {
        drain *= ewar.entityCapacitorLevelModifierMedium;
      } else if (rs === 3) {
        drain *= ewar.entityCapacitorLevelModifierLarge;
      }
      distance = distance || Math.abs(ewar.attachedShip.dis - target.dis);
      const finalDrain = ewarFalloffCalc(drain, ewar, distance);
      // Accept lower efficency when the target is the primary or secondary.
      const reqEffectiveness = i <= 1 ? 0.75 : 1;
      // Large ships don't need to be efficent in absolute terms against targets with smaller caps.
      const capSizeRatio = ewar.attachedShip.capacitorCapacity / target.capacitorCapacity;
      const drainMulti = Math.max(1, capSizeRatio);
      if (Math.min(finalDrain, target.cap) * drainMulti > (reqEffectiveness * ewar.capacitorNeed)) {
        target.pendingCap = Math.max(0, target.pendingCap - finalDrain);
        target.expectedCapLoss += finalDrain;
        const expectedCap = ewar.attachedShip.pendingCap - ewar.capacitorNeed;
        ewar.attachedShip.pendingCap = Math.max(0, expectedCap);
      } else if (ewar.attachedShip.currentEHP > 0) {
        // Return if the source isn't dead to allow it to try to find a viable target next tick.

        // Uncomment line to limit how often the neut will recheck for a valid target.
        // Notably speeds up long simulations where nuets completely cap out one side.
        // ewar.currentDuration = 1000;
        return;
      }
    }
  } else if (ewar.type === 'Energy Nosferatu') {
    if (ewar.attachedShip.cap > ewar.capacitorNeed) {
      distance = distance || Math.abs(ewar.attachedShip.dis - target.dis);
      const transfer = ewarFalloffCalc(ewar.powerTransferAmount, ewar, distance);
      let i = 0;
      if (ewar.isBrNos) {
        while (i < targets.length &&
               (target.currentEHP <= 0 ||
                target.cap < transfer ||
                target.expectedCapLoss >= target.cap)) {
          i += 1;
          if (i === targets.length) {
            target = altScatterTarget || target;
          } else {
            target = targets[i];
          }
        }
      } else {
        while (i < targets.length &&
               (target.currentEHP <= 0 ||
                target.cap < transfer ||
                target.cap <= ewar.attachedShip.cap ||
                target.expectedCapLoss >= (target.cap - ewar.attachedShip.cap))) {
          i += 1;
          if (i === targets.length) {
            target = altScatterTarget || target;
          } else {
            target = targets[i];
          }
        }
      }
      distance = distance || Math.abs(ewar.attachedShip.dis - target.dis);
      target.pendingCap = Math.max(0, target.pendingCap - transfer);
      target.expectedCapLoss += transfer;
      const expectedCap = ewar.attachedShip.pendingCap + transfer;
      ewar.attachedShip.pendingCap = Math.max(ewar.attachedShip.capacitorCapacity, expectedCap);
    }
  }
  ewar.currentTarget = target;
  ewar.currentDuration = ewar.duration;
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

type Repair = {
  currentTarget: Ship | null,
  attachedShip: Ship,
  type: ProjectionTypeString,
  [string]: number
};
function ApplyRepair(target: Ship, repair: Repair, totalTimeElapsed: number) {
  const repairAmmount = repair.shieldBonus || repair.armorDamageAmount;
  const effectiveness = getAssistEffectiveness(target.totalIncomingReps);
  const effectiveRepair = effectiveness * (repairAmmount / target.meanResonance);
  const postRepEhp = target.currentEHP + effectiveRepair;
  const newEhp = Math.min(postRepEhp, target.EHP);
  const appliedRep = (newEhp - target.currentEHP) * target.meanResonance;
  target.currentEHP = newEhp;
  if (appliedRep > 0) {
    const expTime = totalTimeElapsed + repair.duration;
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

function ApplyRemoteEffects(side: Side, t: number, opposingSide: Side, totalTimeElapsed: number) {
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
        if (ewarTargetType[ewar.type] !== TargetTypes.focused) {
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
            if (ewarTargetType[ewar.type] === TargetTypes.focused) {
              ApplyEwar(ewar, subfleet.fc.targets);
            } else {
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
              if (ewarTargetType[ewar.type] === TargetTypes.partiallyFocused) {
                ApplyEwar(ewar, subfleet.fc.targets, null, scatterTarget);
              } else if (ewarTargetType[ewar.type] === TargetTypes.scattered) {
                ApplyEwar(ewar, scatterTarget ? [scatterTarget] : subfleet.fc.targets);
              }
            }
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
              ApplyRepair(target, rr, totalTimeElapsed);
              rr.currentDuration = rr.duration;
              rr.currentTarget = target;
            }
          } else if (rr.type === 'Remote Armor Repairer') {
            const target = rr.currentTarget;
            if (target && target.currentEHP > 0) {
              ApplyRepair(target, rr, totalTimeElapsed);
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

export { ApplyRemoteEffects, ApplyEwar };
