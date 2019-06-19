// @flow
import Ship from './ship_class';
import ShipData from './ship_data_class';
import { Weapon } from './weapon_classes';
import { AmmoTables, AmmoGroupMap, BaseChargeMap } from './staticAmmoData';
import type {
  SideShipInfo, ProjectionTypeString,
  AmmoData, AmmoSwapValue,
} from './flow_types';

type AmmoTable = AmmoData[];
type WepAmmoSwapData = {
  currentAmmo: number | null,
  ammoOptions: AmmoTable,
  reloadTime: number,
  chargesHeld: number,
  chargesLeft: number,
  recentDamage: number[],
  cycledSinceCheck: boolean,
};
type Subfleet = {fc: Ship, ewar: {
  currentTarget: Ship | null,
  attachedShip: Ship,
  type: ProjectionTypeString,
  [string]: number
}[],
remoteRepair: {
  currentTarget: Ship | null,
  attachedShip: Ship,
  type: ProjectionTypeString,
  [string]: number
}[],
initalStartInd: number,
n: number,
wepAmmoSwapData: WepAmmoSwapData[],
};
function mapProjection(
  subfleet: Subfleet,
  projection: {type: ProjectionTypeString, [string]: number},
  ship: Ship,
  shipStats: ShipData,
) {
  if ([
    'Stasis Web', 'Weapon Disruptor', 'Warp Scrambler', 'Target Painter', 'Sensor Dampener',
    'ECM', 'Energy Neutralizer', 'Energy Nosferatu',
  ].some(type => type === projection.type)) {
    const ewar = Object.assign({}, projection);
    ewar.currentDuration = 0;
    ewar.currentTarget = null;
    ewar.attachedShip = ship;
    if (projection.type === 'Energy Nosferatu') {
      // typeIDs for Succubus, Phantasm, Bhaalgorn, Chemosh and Molok
      ewar.isBrNos = [17924, 17718, 17920, 42243, 42241].includes(shipStats.typeID);
    }
    subfleet.ewar.push(ewar);
    return ewar;
  } else if ([
    'Remote Shield Booster', 'Remote Armor Repairer',
  ].some(type => type === projection.type)) {
    const rr = Object.assign({}, projection);
    rr.currentDuration = 0;
    rr.currentTarget = null;
    rr.scanRes = ship.scanRes;
    rr.attachedShip = ship;
    subfleet.remoteRepair.push(rr);
    return rr;
  }
  return null;
}

function GetWepAmmoSwapData(localShip: Ship, shipStats: ShipData, ammoSwaps: AmmoSwapValue) {
  // This can be replaced with a filter if flow ever plays nice with filters.
  const modsWithCharges: [number, number][] = shipStats.modTypeIDs.reduce(
    (arr: [number, number][], m: number | [number, number]) =>
      (Array.isArray(m) ? [...arr, m] : arr),
    [],
  );
  const modsNamesWithCharges = shipStats.moduleNames.filter(m => m.includes(': '));
  const weaponsWithCharges: [[number, number], string][] = [];
  for (let v = 0; v < modsWithCharges.length; v += 1) {
    const chargeID = modsWithCharges[v][1];
    if (BaseChargeMap[chargeID.toString()]) {
      weaponsWithCharges.push([modsWithCharges[v], modsNamesWithCharges[v]]);
    }
  }
  const ammoSwapData: WepAmmoSwapData[] = [];

  for (const wep of shipStats.weapons) {
    const ammoTable = [];
    let initalAmmoID: number | null = null;
    const isSpecialWeapon = wep.damageReductionFactor === 0 && wep.type === 'Missile';
    if (ammoSwaps !== 'None' && ['Missile', 'Turret'].includes(wep.type) && !isSpecialWeapon) {
      const pairData: [[number, number], string] | [null, null] =
        (weaponsWithCharges.find((pair: [[number, number], string]) => {
          const [, n: string] = pair;
          const ns: string[] = n.split(': ');
          return ns.every(s => wep.name.includes(s));
        }) || [null, null]);
      const [idPair, name] = pairData;
      if (idPair && name) {
        const baseChargePair: [number, string, string] =
          BaseChargeMap[idPair[1].toString()];
        [initalAmmoID] = baseChargePair;
        const groupMap = AmmoGroupMap;
        const groupData = groupMap.find(v => v[0] === idPair[0]);
        if (groupData) {
          const chSize = groupData[1];
          const groups = groupData[2];
          const matchingTables = AmmoTables.filter(v =>
            (groups.includes(v.ammoGroupID) && v.chargeSize === chSize));
          const fullTable = [];
          for (const t of matchingTables) {
            if (ammoSwaps === 'Cargo') {
              const baseCargoIDs: number[] = shipStats.cargoItemIDs.reduce((arr, id) => {
                const cd: ?[number, string, string] = BaseChargeMap[id.toString()];
                if (cd) {
                  arr.push(cd[0]);
                }
                return arr;
              }, []);
              fullTable.push(...t.ammoData.filter(a =>
                (a[1] === initalAmmoID || baseCargoIDs.includes(a[1]))));
            } else {
              fullTable.push(...t.ammoData);
            }
          }
          ammoTable.push(...fullTable);
        }
      }
    }
    // Ships (but not ShipData) treat fighter abilities as separate weapons.
    // Thus multiple entries are needed for fighters so that the length matches.
    const loops = wep.type === 'Fighter' ? wep.abilities.length : 1;
    for (let i = 0; i < loops; i += 1) {
      const wepAmmoData = {
        currentAmmo: initalAmmoID,
        ammoOptions: ammoTable,
        reloadTime: Math.round(wep.reloadTime),
        chargesHeld: wep.numCharges,
        chargesLeft: wep.numCharges,
        recentDamage: [],
        cycledSinceCheck: false,
      };
      ammoSwapData.push(wepAmmoData);
    }
  }
  // Ships sort their weapons by dps in the simulation.
  // We are presorting the fc's and making sure the subfleet's wepAmmoSwapData matches.
  // This is required to avoid a mismatch when loading fleets.
  localShip.weapons.sort((a: Weapon, b: Weapon) => b.dps - a.dps);
  const mapped: { index: number, dps: number }[] = shipStats.weapons.reduce((
    (arr, wep) => {
      if (wep.type === 'Fighter') {
        for (const ab of wep.abilities) {
          arr.push({ index: arr.length, dps: (ab.volley / ab.rof) * 1000 });
        }
      } else {
        arr.push({ index: arr.length, dps: wep.dps });
      }
      return arr;
    }), []);
  mapped.sort((a, b) => b.dps - a.dps);
  const ammoSwapDataSorted = mapped.map(pair => ammoSwapData[pair.index]);

  return ammoSwapDataSorted;
}

class Side {
  targetGrouping: number;
  reactionTime: number = 1000;
  uniqueFitCount: number;
  totalShipCount: number;
  color: string;
  oppSide: Side;
  ships: Ship[] = [];
  deadShips: Ship[] = [];
  subFleets: Subfleet[] = [];
  subFleetEffectPurgeTimer: number = 120000
  aliveShipString: string;
  deadShipString: string;
  theoreticalDamage: number = 0;
  appliedDamage: number = 0;
  damageApplicationRatio: number = this.appliedDamage / this.theoreticalDamage;
  makeFleet: (SideShipInfo[], number, boolean, AmmoSwapValue) => void = (
    sidesShips: SideShipInfo[],
    initalDistance: number,
    dronesEnabled: boolean,
    ammoSwaps: AmmoSwapValue,
  ): void => {
    this.uniqueFitCount = 0;
    this.totalShipCount = 0;
    const colorChangePerShip: number = 255 / sidesShips.length;
    for (const shipClass of sidesShips) {
      this.uniqueFitCount += 1;
      this.totalShipCount += shipClass.n;
      const alternateColoring = this.uniqueFitCount % 2 === 0;
      const colorShift = ((this.uniqueFitCount - 1) * colorChangePerShip).toFixed(0);
      if (!shipClass.iconColor) {
        shipClass.iconColor = this.color === 'red' ?
          `rgb(${alternateColoring ? '180' : '255'}, ${colorShift}, ${alternateColoring ? '80' : '0'})` :
          `rgb(${alternateColoring ? '80' : '0'}, ${colorShift}, ${alternateColoring ? '180' : '255'})`;
      }
      const { iconColor } = shipClass;
      let lastShotCaller: Ship | null = null;
      let lastAnchor: Ship | null = null;
      const shipStats: ShipData = shipClass.ship;
      const size = shipClass.n;
      for (let i = 0; i < size; i += 1) {
        const localShip: Ship =
          new Ship(lastShotCaller, lastAnchor, shipStats, initalDistance, dronesEnabled);
        if (i === 0 || i % this.targetGrouping === 0) {
          localShip.anchor = null;
          localShip.shotCaller = null;
          localShip.isAnchor = true;
          localShip.isShotCaller = true;
          localShip.rangeRecalc = 10000;
          lastShotCaller = localShip;
          lastAnchor = localShip;
          const ammoSwapDataSorted = GetWepAmmoSwapData(localShip, shipStats, ammoSwaps);

          this.subFleets.push({
            fc: localShip,
            ewar: [],
            remoteRepair: [],
            initalStartInd: this.totalShipCount - shipClass.n,
            n: size,
            wepAmmoSwapData: ammoSwapDataSorted,
          });
          console.log(shipStats);
          console.log(localShip);
        }
        const sf = this.subFleets[this.uniqueFitCount - 1];
        for (const projection of shipStats.projections) {
          const p = mapProjection(sf, projection, localShip, shipStats);
          if (p) {
            localShip.outgoingEffects.push(p);
          }
        }
        localShip.iconColor = iconColor;
        localShip.baseIconColor = iconColor;
        localShip.dis = this.color === 'red' ? 0.5 * initalDistance : -0.5 * initalDistance;
        localShip.pendingDis = localShip.dis;
        this.ships.push(localShip);
      }
    }
  };
  constructor(color: 'red' | 'blue'): Side {
    this.targetGrouping = 1000;
    this.color = color;
    return this;
  }
}

export type { Subfleet };
export default Side;
