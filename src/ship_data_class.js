// @flow
import type { Hp, Resonance, WeaponData, ShipSize, Subsystem } from './flow_types';

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
  moduleNames: string[];
  projections: { type: string, [string]: number }[];
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
  cpuOutput: number;
  droneDPS: number;
  droneControlRange: number;
  mass: number;
  totalVolley: number;
  weaponVolley: number;
  unpropedSpeed: number;
  mwdPropSpeed: number;
  unpropedSig: number;
  subsystems: Subsystem;
  mode: '' | 'Defense Mode' | 'Sharpshooter Mode' | 'Propulsion Mode';
  isFit: boolean = false;

  static processing(shipStats: ShipData): void {
    shipStats.id = Math.random();
    const fullNameBreak = shipStats.name.indexOf(':');
    if (fullNameBreak > -1) {
      const baseName = shipStats.name;
      shipStats.name = baseName.slice(fullNameBreak + 2);
      shipStats.shipType = baseName.slice(0, fullNameBreak);
      shipStats.isFit = true;
    } else {
      shipStats.shipType = undefined;
      shipStats.isFit = false;
      // Handle subsystem processing for t3c.
      if (shipStats.groupID === 963) {
        const subsystems = {};
        const subTypes = ['Defensive', 'Offensive', 'Propulsion', 'Core'];
        for (const sub of subTypes) {
          const subName = shipStats.moduleNames.find(n => n.includes(sub)) || '';
          const specificSubName = subName.substring(subName.indexOf(sub) + 2 + sub.length);
          subsystems[sub] = specificSubName;
        }
        shipStats.subsystems = subsystems;
      }
      // Handle mode processing for t3d.
      if (shipStats.groupID === 1305) {
        const modes = ['Defense Mode', 'Sharpshooter Mode', 'Propulsion Mode'];
        for (const mode of modes) {
          const modeInd = shipStats.name.indexOf(mode);
          const modeStr = shipStats.name.substring(modeInd);
          if (modeStr === mode) {
            shipStats.mode = mode;
            shipStats.name = shipStats.name.substring(0, modeInd - 1);
          }
        }
      }
    }
  }
}
export default ShipData;
