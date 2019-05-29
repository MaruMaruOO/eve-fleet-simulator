// @flow
import type { WeaponData, WeaponType } from './flow_types';

class PendingAttack {
  timer: number;
  constructor(delay: number): PendingAttack {
    this.timer = delay;
    return this;
  }
}

class MissileStats {
  sigRadius: number;
  baseSigRadius: number;
  expVelocity: number;
  baseExpVelocity: number;
  travelVelocity: number;
  baseTravelVelocity: number;
  damageReductionFactor: number;
  bonusMultiInc: number = 0;
  bonusMultiCap: number = 0;
  tracking: number = 0;
  baseTracking: number = 0;
  falloff: number = 0;
  baseFalloff: number = 0;
  constructor(wep: WeaponData) {
    this.sigRadius = wep.explosionRadius;
    this.baseSigRadius = wep.explosionRadius;
    this.expVelocity = wep.explosionVelocity;
    this.baseExpVelocity = wep.explosionVelocity;
    this.damageReductionFactor = wep.damageReductionFactor;
    this.travelVelocity = wep.maxVelocity;
    this.baseTravelVelocity = wep.maxVelocity;
  }
}

class TurretStats {
  sigRadius: number = 0;
  baseSigRadius: number = 0;
  expVelocity: number = 0;
  baseExpVelocity: number = 0;
  travelVelocity: number = 0;
  baseTravelVelocity: number = 0;
  damageReductionFactor: number = 0;
  bonusMultiInc: number;
  bonusMultiCap: number;
  tracking: number;
  baseTracking: number;
  falloff: number;
  baseFalloff: number;
  constructor(wep: WeaponData) {
    this.tracking = wep.tracking;
    this.baseTracking = wep.tracking;
    this.falloff = wep.falloff;
    this.baseFalloff = wep.falloff;
    this.bonusMultiInc = wep.damageMultiplierBonusPerCycle;
    this.bonusMultiCap = wep.damageMultiplierBonusMax;
  }
}

class SmartBombStats {
  sigRadius: number = 0;
  baseSigRadius: number = 0;
  expVelocity: number = 0;
  baseExpVelocity: number = 0;
  travelVelocity: number = 0;
  baseTravelVelocity: number = 0;
  damageReductionFactor: number = 0;
  bonusMultiInc: number = 0;
  bonusMultiCap: number = 0;
  tracking: number = 10000;
  baseTracking: number = 10000;
  falloff: number;
  baseFalloff: number = 0;
  constructor() {
    this.falloff = 0;
  }
}


class Weapon {
  type: WeaponType;
  damage: number;
  reload: number;
  currentReload: number = 0;
  stats: TurretStats | MissileStats | SmartBombStats;
  pendingDamage: PendingAttack[] = [];
  optimal: number;
  baseOptimal: number;
  dps: number;
  autonomousMovement: boolean;
  bonusMulti: number = 0;
  capacitorNeed: ?number;
  getDamageDelay(distance: number): number {
    if (this.type === 'Missile') {
      return 1000 * (distance / this.stats.travelVelocity);
    }
    return 0;
  }
  constructor(wep: WeaponData, dronesEnabled: boolean): Weapon {
    this.type = wep.type;
    this.damage = wep.volley;
    this.reload = 1000 * (wep.volley / wep.dps);
    this.optimal = wep.optimal;
    this.baseOptimal = wep.optimal;
    this.dps = wep.dps;
    this.autonomousMovement = false;
    if (wep.capUse) {
      this.capacitorNeed = wep.capUse * (this.reload / 1000);
    }
    if (this.type === 'Turret') {
      this.stats = new TurretStats(wep);
    } else if (this.type === 'Missile') {
      this.stats = new MissileStats(wep);
    } else if (this.type === 'Drone') {
      this.type = 'Turret';
      this.stats = new TurretStats(wep);
      this.autonomousMovement = true;
      this.stats.travelVelocity = wep.maxSpeed;
      if (dronesEnabled === false) {
        this.dps = 0;
        this.damage = 0;
        this.reload = 10000000;
      }
    } else if (this.type === 'SmartBomb') {
      if (wep.name.includes('Doomsday')) {
        this.type = 'Missile';
        wep.explosionRadius = 5000;
        wep.explosionVelocity = 2000;
        wep.damageReductionFactor = 0.01;
        wep.maxVelocity = 12000;
        this.stats = new MissileStats(wep);
      } else {
        this.type = 'Turret';
        this.stats = new SmartBombStats();
      }
    } else if (this.type === 'Fighter') {
      wep.maxVelocity = 7000;
      this.type = 'Missile';
      this.reload = wep.rof;
      this.dps = (wep.volley / wep.rof) * 1000;
      this.stats = new MissileStats(wep);
      this.autonomousMovement = true;
    } else {
      console.error('UNKNOWN WEAPON TYPING', wep.type, wep);
    }
    return this;
  }
}
export { Weapon, PendingAttack };
