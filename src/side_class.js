// @flow
import Ship from './ship_class';
import ShipData from './ship_data_class';


type Subfleet = {fc: Ship, ewar: {
  currentTarget: Ship | null,
  attachedShip: Ship,
  type: string,
  [string]: number
}[],
remoteRepair: {
  currentTarget: Ship | null,
  attachedShip: Ship,
  type: string,
  [string]: number
}[]};
function mapProjection(
  subfleet: Subfleet,
  projection: {type: string, [string]: number},
  ship: Ship,
) {
  if ([
    'Stasis Web', 'Weapon Disruptor', 'Warp Scrambler', 'Target Painter', 'Sensor Dampener',
    'ECM',
  ].some(type => type === projection.type)) {
    const ewar = Object.assign({}, projection);
    ewar.currentDuration = 0;
    ewar.currentTarget = null;
    ewar.attachedShip = ship;
    subfleet.ewar.push(ewar);
  } else if ([
    'Remote Shield Booster', 'Remote Armor Repairer',
  ].some(type => type === projection.type)) {
    const rr = Object.assign({}, projection);
    rr.currentDuration = 0;
    rr.currentTarget = null;
    rr.scanRes = ship.scanRes;
    rr.attachedShip = ship;
    subfleet.remoteRepair.push(rr);
  }
}

class Side {
  targetGrouping: number;
  reactionTime: number = 1000;
  uniqueFitCount: number;
  totalShipCount: number;
  color: string;
  ships: Ship[] = [];
  deadShips: Ship[] = [];
  subFleets: Subfleet[] = [];
  aliveShipString: string;
  deadShipString: string;
  theoreticalDamage: number = 0;
  appliedDamage: number = 0;
  damageApplicationRatio: number = this.appliedDamage / this.theoreticalDamage;
  makeFleet(sidesShips: {ship: ShipData, n: number}[], initalDistance: number) {
    this.uniqueFitCount = 0;
    this.totalShipCount = 0;
    const colorChangePerShip: number = 255 / sidesShips.length;
    for (const shipClass of sidesShips) {
      this.uniqueFitCount += 1;
      this.totalShipCount += shipClass.n;
      const alternateColoring = this.uniqueFitCount % 2 === 0;
      const colorShift = ((this.uniqueFitCount - 1) * colorChangePerShip).toFixed(0);
      const iconColor = this.color === 'red' ?
        `rgb(${alternateColoring ? '180' : '255'}, ${colorShift}, ${alternateColoring ? '80' : '0'})` :
        `rgb(${alternateColoring ? '80' : '0'}, ${colorShift}, ${alternateColoring ? '180' : '255'})`;
      let lastShotCaller: Ship | null = null;
      let lastAnchor: Ship | null = null;
      const shipStats: ShipData = shipClass.ship;
      const size = shipClass.n;
      for (let i = 0; i < size; i += 1) {
        const localShip: Ship =
          new Ship(lastShotCaller, lastAnchor, shipStats, initalDistance);
        if (i === 0 || i % this.targetGrouping === 0) {
          localShip.isAnchor = true;
          localShip.isShotCaller = true;
          lastShotCaller = localShip;
          lastAnchor = localShip;
          this.subFleets.push({ fc: localShip, ewar: [], remoteRepair: [] });
          console.log(shipStats);
          console.log(localShip);
        }
        for (const projection of shipStats.projections) {
          mapProjection(this.subFleets[this.uniqueFitCount - 1], projection, localShip);
        }
        localShip.iconColor = iconColor;
        this.ships.push(localShip);
      }
    }
  }
  constructor(color: 'red' | 'blue') {
    this.targetGrouping = 1000;
    this.color = color;
  }
}

export default Side;
