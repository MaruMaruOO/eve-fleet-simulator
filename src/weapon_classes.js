// @flow
import type { WeaponData, WeaponType } from './flow_types';

class PendingAttack {
  damage: number;
  timer: number;
  constructor(dmg: number, delay: number) {
    this.damage = dmg;
    this.timer = delay;
  }
}

class MissileStats {
  sigRadius: number;
  expVelocity: number;
  travelVelocity: number;
  damageReductionFactor: number;
  tracking: number = 0;
  falloff: number = 0;
  constructor(wep: WeaponData) {
    this.sigRadius = wep.explosionRadius;
    this.expVelocity = wep.explosionVelocity;
    this.damageReductionFactor = wep.damageReductionFactor;
    this.travelVelocity = wep.maxVelocity;
  }
}

class TurretStats {
  sigRadius: number = 0;
  expVelocity: number = 0;
  travelVelocity: number = 0;
  damageReductionFactor: number = 0;
  tracking: number;
  falloff: number;
  constructor(wep: WeaponData) {
    this.tracking = wep.tracking;
    this.falloff = wep.falloff;
  }
}

class SmartBombStats {
  sigRadius: number = 0;
  expVelocity: number = 0;
  travelVelocity: number = 0;
  damageReductionFactor: number = 0;
  tracking: number;
  falloff: number;
  constructor() {
    this.tracking = 1000;
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
  dps: number;
  autonomousMovement: boolean;
  getDamageDelay(distance: number): number {
    if (this.type === 'Missile') {
      return 1000 * (distance / this.stats.travelVelocity);
    }
    return 0;
  }
  constructor(wep: WeaponData) {
    this.type = wep.type;
    this.damage = wep.volley;
    this.reload = 1000 * (wep.volley / wep.dps);
    this.optimal = wep.optimal;
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
      this.type = 'Turret';
      this.stats = new SmartBombStats();
    } else if (this.type === 'Fighter') {
      wep.maxVelocity = 10000; // wep.explosionDelay * 1000 / wep.optimal;
      wep.damageReductionFactor = 1;
      this.type = 'Missile';
      this.reload = wep.rof;
      this.stats = new MissileStats(wep);
      this.autonomousMovement = true;
      this.stats.travelVelocity = wep.maxSpeed;
    } else {
      console.error('UNKNOWN WEAPON TYPING', wep.type, wep);
    }
  }
}
export { Weapon, PendingAttack };
