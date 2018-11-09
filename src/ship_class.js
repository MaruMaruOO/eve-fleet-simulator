// @flow
import { Weapon, PendingAttack } from './weapon_classes';
import type { ProjectionTypeString } from './flow_types';
import ShipData from './ship_data_class';

class Ship {
  name: string;
  id: number;
  iconColor: string;
  baseIconColor: string;
  shipType: string;
  shipGroup: string;
  EHP: number;
  currentEHP: number;
  damage: number;
  damageType: string = '';
  reload: number;
  currentReload: number = 0;
  scanRes: number;
  velocity: number;
  alignTime: number;
  sigRadius: number;
  optimal: number;
  falloff: number;
  tracking: number;
  damageDelay: number;
  isAnchor: boolean;
  isShotCaller: boolean;
  isSupportShip: boolean;
  shotCaller: ?Ship;
  anchor: ?Ship;
  targets: Ship[];
  previousTarget: ?Ship;
  weapons: Weapon[];
  maxTargets: number = 6;
  distanceFromTarget: number;
  maxTargetRange: number;
  droneControlRange: number;
  preferedDistance: number = -1;
  pendingDamage: PendingAttack[];
  // Ewar applied to this ship.
  appliedEwar: {
    webs: [number, number, Ewar][], tps: [number, number, Ewar][],
    scrams: [number, number, Ewar][],
    maxTargetRangeBonus: [number, number, Ewar][], scanResolutionBonus: [number, number, Ewar][],
    trackingSpeedBonus: [number, number, Ewar][], maxRangeBonus: [number, number, Ewar][],
    falloffBonus: [number, number, Ewar][], aoeCloudSizeBonus: [number, number, Ewar][],
    aoeVelocityBonus: [number, number, Ewar][], missileVelocityBonus: [number, number, Ewar][],
    explosionDelayBonus: [number, number, Ewar][],
  } = {
    webs: [],
    tps: [],
    scrams: [],
    maxTargetRangeBonus: [],
    scanResolutionBonus: [],
    trackingSpeedBonus: [],
    maxRangeBonus: [],
    falloffBonus: [],
    aoeCloudSizeBonus: [],
    aoeVelocityBonus: [],
    missileVelocityBonus: [],
    explosionDelayBonus: [],
  };
  appliedRR: { armor: [number, number][], shield: [number, number][] } = { armor: [], shield: [] };
  // Possible outgoing effects this ship could provide.
  outgoingEffects: Ewar[] = [];
  // Target effect pairs for outgoing effects this ship is currently applying.
  projTargets: [Ship, Ewar][] = [];
  tankType: 'armor' | 'shield';
  meanResonance: number;
  rrDelayTimer: number = 0;
  lockTimeConstant: number;
  baseVelocity: number;
  unpropedSigRadius: number;
  baseSigRadius: number;
  unpropedVelocity: number;
  baseMaxTargetRange: number;
  baseScanRes: number;
  dis: number;
  pendingDis: number;
  rangeRecalc: number;
  constructor(
    currentShotCaller: Ship | null, currentAnchor: Ship | null,
    shipStats: ShipData, initalDistance: number, dronesEnabled: boolean,
  ) {
    if (shipStats !== null) {
      this.distanceFromTarget = initalDistance;
      this.shipType = shipStats.shipType ? shipStats.shipType : '';
      this.shipGroup = shipStats.shipGroup;
      this.name = shipStats.name;
      this.id = shipStats.id;
      this.isSupportShip = shipStats.isSupportShip;
      this.EHP = shipStats.ehp.shield + shipStats.ehp.armor + shipStats.ehp.hull;
      if (shipStats.ehp.armor > shipStats.ehp.shield) {
        this.tankType = 'armor';
        const res = shipStats.resonance.armor;
        this.meanResonance = (res.em + res.therm + res.kin + res.exp) / 4;
      } else {
        this.tankType = 'shield';
        const res = shipStats.resonance.shield;
        this.meanResonance = (res.em + res.therm + res.kin + res.exp) / 4;
      }
      this.damage = shipStats.weaponVolley;
      this.reload = 1000 * (shipStats.weaponVolley / shipStats.weaponDPS);
      this.scanRes = shipStats.scanRes;
      this.baseScanRes = shipStats.scanRes;
      this.velocity = shipStats.maxSpeed;
      this.baseVelocity = shipStats.maxSpeed;
      this.unpropedVelocity = shipStats.unpropedSpeed;
      this.alignTime = shipStats.alignTime;
      this.sigRadius = shipStats.signatureRadius;
      this.baseSigRadius = shipStats.signatureRadius;
      this.lockTimeConstant = (40000 / (Math.asinh(shipStats.signatureRadius) ** 2)) * 1000;
      this.unpropedSigRadius = shipStats.unpropedSig;
      this.maxTargets = shipStats.maxTargets;
      this.maxTargetRange = shipStats.maxTargetRange;
      this.baseMaxTargetRange = shipStats.maxTargetRange;
      this.droneControlRange = shipStats.droneControlRange;
      this.weapons = [];
      for (const wep of shipStats.weapons) {
        if (wep.type === 'Fighter') {
          for (const ability of wep.abilities) {
            ability.type = 'Fighter';
            const addedWep = new Weapon(ability, dronesEnabled);
            this.weapons.push(addedWep);
          }
        } else {
          const addedWep = new Weapon(wep, dronesEnabled);
          this.weapons.push(addedWep);
        }
      }
      if (this.weapons.length > 1) {
        this.weapons = this.weapons.sort((a, b) => b.dps - a.dps);
      }
    }
    this.currentEHP = this.EHP;
    this.isAnchor = false;
    this.isShotCaller = false;
    this.pendingDamage = [];
    if (currentShotCaller !== null) {
      this.shotCaller = currentShotCaller;
      this.targets = currentShotCaller.targets;
    } else {
      this.shotCaller = null;
      this.targets = [];
    }
    if (currentAnchor !== null) {
      this.anchor = currentAnchor;
    } else {
      this.anchor = null;
    }
  }
}
type Ewar = {
  currentTarget: Ship | null,
  attachedShip: Ship,
  type: ProjectionTypeString,
  [string]: number
};
export type { Ewar };
export default Ship;
