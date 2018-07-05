// @flow
import type { WeaponData, WeaponType } from './flow_types';

class PendingAttack {
  damage: number;
  timer: number;
  constructor(dmg: number, delay: number): PendingAttack {
    this.damage = dmg;
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
  tracking: number;
  baseTracking: number;
  falloff: number;
  baseFalloff: number;
  constructor(wep: WeaponData) {
    this.tracking = wep.tracking;
    this.baseTracking = wep.tracking;
    this.falloff = wep.falloff;
    this.baseFalloff = wep.falloff;
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
  getDamageDelay(distance: number): number {
    if (this.type === 'Missile') {
      return 1000 * (distance / this.stats.travelVelocity);
    }
    return 0;
  }
  constructor(wep: WeaponData): Weapon {
    this.type = wep.type;
    this.damage = wep.volley;
    this.reload = 1000 * (wep.volley / wep.dps);
    this.optimal = wep.optimal;
    this.baseOptimal = wep.optimal;
    this.dps = wep.dps;
    this.autonomousMovement = false;
    if (this.type === 'Turret') {
      this.stats = new TurretStats(wep);
    } else if (this.type === 'Missile') {
      this.stats = new MissileStats(wep);
    } else if (this.type === 'Drone') {
      this.type = 'Turret';
      this.stats = new TurretStats(wep);
      this.autonomousMovement = true;
      this.stats.travelVelocity = wep.maxSpeed;
    } else if (this.type === 'SmartBomb') {
      if (wep.name.includes('Doomsday')) {
        this.type = 'Missile';
        wep.explosionRadius = 5000;
        wep.explosionVelocity = 2000;
        wep.damageReductionFactor = 0.01;
        wep.maxVelocity = 12000;
        this.stats = new MissileStats(wep);
        this.optimal = 300000;
        this.baseOptimal = 300000;
      } else {
        this.type = 'Turret';
        this.stats = new SmartBombStats();
      }
    } else if (this.type === 'Fighter') {
      wep.maxVelocity = 7000;
      this.type = 'Missile';
      this.reload = wep.rof;
      this.stats = new MissileStats(wep);
      this.autonomousMovement = true;
    } else {
      console.error('UNKNOWN WEAPON TYPING', wep.type, wep);
    }
    return this;
  }
}
export { Weapon, PendingAttack };
