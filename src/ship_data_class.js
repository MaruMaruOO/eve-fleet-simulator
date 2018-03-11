// @flow
import type { Hp, Resonance, WeaponData, ShipSize } from './flow_types';

class ShipData {
  static getMaxShieldEHP(shipData: ShipData): number {
    return shipData.maxShieldEHP;
  }
  static getMaxArmorEHP(shipData: ShipData): number {
    return shipData.maxArmorEHP;
  }
  static getMaxHullEHP(shipData: ShipData): number {
    return shipData.maxHullEHP;
  }
  static getCapRecharge(shipData: ShipData): number {
    return shipData.capRecharge;
  }
  static getDroneVolley(shipData: ShipData): number {
    return shipData.droneVolley;
  }
  static getCapUsed(shipData: ShipData): number {
    return shipData.capUsed;
  }
  static getEffectiveTurrets(shipData: ShipData): number {
    return shipData.effectiveTurrets;
  }
  static getAlignTime(shipData: ShipData): number {
    return shipData.alignTime;
  }
  static getMidSlots(shipData: ShipData): number {
    return shipData.midSlots;
  }
  static getTurretSlots(shipData: ShipData): number {
    return shipData.turretSlots;
  }
  static getRigSize(shipData: ShipData): number {
    return shipData.rigSize;
  }
  static getEffectiveDroneBandwidth(shipData: ShipData): number {
    return shipData.effectiveDroneBandwidth;
  }
  static getTypeID(shipData: ShipData): number {
    return shipData.typeID;
  }
  static getMaxTargetRange(shipData: ShipData): number {
    return shipData.maxTargetRange;
  }
  static getMaxSpeed(shipData: ShipData): number {
    return shipData.maxSpeed;
  }
  static getGroupID(shipData: ShipData): number {
    return shipData.groupID;
  }
  static getScanStrength(shipData: ShipData): number {
    return shipData.scanStrength;
  }
  static getScanRes(shipData: ShipData): number {
    return shipData.scanRes;
  }
  static getWeaponDPS(shipData: ShipData): number {
    return shipData.weaponDPS;
  }
  static getLauncherSlots(shipData: ShipData): number {
    return shipData.launcherSlots;
  }
  static getLowSlots(shipData: ShipData): number {
    return shipData.lowSlots;
  }
  static getRigSlots(shipData: ShipData): number {
    return shipData.rigSlots;
  }
  static getHighSlots(shipData: ShipData): number {
    return shipData.highSlots;
  }
  static getMaxTargets(shipData: ShipData): number {
    return shipData.maxTargets;
  }
  static getSignatureRadius(shipData: ShipData): number {
    return shipData.signatureRadius;
  }
  static getEffectiveLaunchers(shipData: ShipData): number {
    return shipData.effectiveLaunchers;
  }
  static getPowerOutput(shipData: ShipData): number {
    return shipData.powerOutput;
  }
  static getDroneDPS(shipData: ShipData): number {
    return shipData.droneDPS;
  }
  static getTotalVolley(shipData: ShipData): number {
    return shipData.totalVolley;
  }
  static getWeaponVolley(shipData: ShipData): number {
    return shipData.weaponVolley;
  }

  maxShieldEHP: number;
  maxArmorEHP: number;
  maxHullEHP: number;
  capRecharge: number;
  droneVolley: number;
  capUsed: number;
  hp: Hp;
  effectiveTurrets: number;
  alignTime: number;
  midSlots: number;
  turretSlots: number;
  projectedModules: { string: number | string }[];
  rigSize: number;
  effectiveDroneBandwidth: number;
  typeID: number;
  maxTargetRange: number;
  maxSpeed: number;
  name: string;
  id: number;
  shipType: string | void;
  shipGroup: string;
  ehp: Hp;
  groupID: number;
  scanStrength: number;
  scanRes: number;
  shipSize: ShipSize;
  weaponDPS: number;
  launcherSlots: number;
  lowSlots: number;
  weapons: WeaponData[];
  rigSlots: number;
  highSlots: number;
  maxTargets: number;
  signatureRadius: number;
  effectiveLaunchers: number;
  resonance: Resonance;
  powerOutput: number;
  droneDPS: number;
  droneControlRange: number;
  totalVolley: number;
  weaponVolley: number;
  isFit: boolean = false;

  static processing(shipStats: ShipData) {
    shipStats.id = Math.random();
    const fullNameBreak = shipStats.name.indexOf(':');
    if (fullNameBreak > -1) {
      const baseName = shipStats.name;
      shipStats.name = baseName.slice(fullNameBreak + 2);
      shipStats.shipType = baseName.slice(0, fullNameBreak);
      shipStats.isFit = true;
    } else {
      shipStats.name = shipStats.name;
      shipStats.shipType = undefined;
      shipStats.isFit = false;
    }
  }
}
export default ShipData;
