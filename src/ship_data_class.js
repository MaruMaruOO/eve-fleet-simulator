// @flow
import type { Hp, Resonance, WeaponData, ShipSize, Subsystem, ProjectionTypeString } from './flow_types';

const hexString = (buffer: ArrayBuffer): string => {
  const byteArray = new Uint8Array(buffer);
  const hexCodes = [...byteArray].map((value) => {
    const hexCode = value.toString(16);
    const paddedHexCode = hexCode.padStart(2, '0');
    return paddedHexCode;
  });
  return hexCodes.join('');
};

const digestMessage = (message: string) => {
  const encoder = new TextEncoder();
  const data = encoder.encode(message);
  return (window.crypto.subtle.digest('SHA-256', data): Promise<ArrayBuffer>);
};

function isDamageDealerShip(ship) {
  const transportGroupIDs = [28, 380, 513, 902, 1202];
  const eWarGroupIDs = [833, 893, 894, 906];
  const fcGroupIDs = [1972];
  const remoteRepGroupIDs = [832, 1527, 1538];
  const suppGroupIDs = [...transportGroupIDs, ...eWarGroupIDs, ...fcGroupIDs, ...remoteRepGroupIDs];
  if (suppGroupIDs.includes(ship.groupID)) {
    return false;
  }
  // typeIDs for t1 support ships by size
  // Scorpion
  const bsSuppIDs = [640];
  // Osprey, Augoror, Arbitrator, Bellicose,
  // Scythe, Blackbird, Celestis, Exequror,
  // Opux Luxury Yacht,
  const cruiserSuppIDs = [
    640, 625, 628, 630,
    631, 632, 633, 634,
    635,
  ];
  // Crucifier, Inquisitor, Bantam, Griffin,
  // Maulus, Navitas, Burst, Vigil
  const frigSuppIDs = [
    2161, 590, 582, 584,
    609, 592, 599, 3766,
  ];
  if ([...bsSuppIDs, ...cruiserSuppIDs, ...frigSuppIDs].includes(ship.typeID)) {
    return false;
  }
  return true;
}

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
  projections: { type: ProjectionTypeString, [string]: number }[];
  projectedModules: { string: number | string }[];
  rigSize: number;
  effectiveDroneBandwidth: number;
  typeID: number;
  maxTargetRange: number;
  maxSpeed: number;
  name: string;
  id: number;
  dataID: string;
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
  isSupportShip: boolean = false;
  modTypeIDs: (number | [number, number])[];
  efsExportVersion: number;
  pyfaVersion: string;

  /**
  * Adds (1), (2) ect to the end of ship names when they share the same name and type.
  * This method scales poorly for ship counts well over 1000.
  * It also gets slow when 100+ ships have the same name and type.
  * A dict based method runs in ~5ms rather than ~8ms but it's much messier.
  */
  static fixDupeNames(ships: ShipData[]): void {
    const names: string[] = [];
    for (const s of ships) {
      const b: string = s.name + s.typeID.toString();
      let n = b;
      let c = 0;
      while (names.includes(n)) {
        c += 1;
        n = `${b} (${c})`;
      }
      if (c > 0) {
        s.name = `${s.name} (${c})`;
      }
      names.push(n);
    }
  }

  static processing(shipStats: ShipData): void {
    // If it has isFit and shipType then it's already been processed.
    if (!(shipStats.shipType && shipStats.isFit)) {
      const fullNameBreak = shipStats.name.indexOf(':');
      if (fullNameBreak > -1) {
        const baseName = shipStats.name;
        shipStats.name = baseName.slice(fullNameBreak + 2);
        shipStats.shipType = baseName.slice(0, fullNameBreak);
        shipStats.isFit = true;
        // isSupportShip is fairly conservative in it's labeling.
        // This could be changed or allowed an explicit toggle in the future.
        const dps = shipStats.weapons.reduce((t, v) => t + v.dps, 0);
        if (!isDamageDealerShip(shipStats) && shipStats.projections.length > 0) {
          const ehp = shipStats.ehp.shield + shipStats.ehp.armor + shipStats.ehp.hull;
          if (dps < 200 || dps < ehp / 1200) {
            shipStats.isSupportShip = true;
          }
        }
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
    shipStats.id = 0;
    shipStats.dataID = '';
    const text = JSON.stringify(shipStats);
    shipStats.id = Math.random();
    digestMessage(text).then((digestValue: ArrayBuffer) => {
      const idStr: string = hexString(digestValue);
      shipStats.dataID = idStr;
    });
  }
}
export default ShipData;
