// @flow
import type { VectorMaxLenThree } from './../flow_types';

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

export { MissileApplication, TurretApplication };
export type { ApplicationArgArray, DamageRatioArgs, DamageApplicationArgs };
