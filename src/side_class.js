// @flow
import Ship from './ship_class';
import ShipData from './ship_data_class';

class Side {
  targetGrouping: number;
  reactionTime: number = 1000;
  uniqueFitCount: number;
  totalShipCount: number;
  color: string;
  ships: Ship[] = [];
  deadShips: Ship[] = [];
  deadShipDict: {names: string[], shipCount: number[]} = { names: [], shipCount: [] };
  aliveShipDict: {names: string[], shipCount: number[]} = { names: [], shipCount: [] };
  aliveShipString: string;
  deadShipString: string;
  theoreticalDamage: number = 0;
  appliedDamage: number = 0;
  damageApplicationRatio: number = this.appliedDamage / this.theoreticalDamage;
  static makeShipDict(ships: Ship[], dict: ({names: string[], shipCount: number[]})) {
    for (const ship of ships) {
      const ind = dict.names.findIndex(name => name === ship.name);
      if (ind >= 0) {
        dict.shipCount[ind] += 1;
      } else {
        dict.shipCount.push(1);
        dict.names.push(ship.name);
      }
    }
  }
  logSide() {
    this.deadShipDict = { names: [], shipCount: [] };
    Side.makeShipDict(this.deadShips, this.deadShipDict);
    this.aliveShipDict = { names: [], shipCount: [] };
    Side.makeShipDict(this.ships, this.aliveShipDict);
    this.deadShipString = '';
    const len = this.deadShipDict.names.length;
    for (let i = 0; i < len; i += 1) {
      const shipName = this.deadShipDict.names[i];
      const aliveInd = this.aliveShipDict.names.findIndex(name => name === shipName);
      const aliveCount = aliveInd >= 0 ? this.aliveShipDict.shipCount[aliveInd] : 0;
      const totalCount = aliveCount + this.deadShipDict.shipCount[i];
      this.deadShipString += ` ${shipName}: ${aliveCount} / ${totalCount}`;
    }
    const fitsWithoutLosses = this.aliveShipDict.names.filter(name =>
      !this.deadShipDict.names.some(deadName => deadName === name));
    for (const noneDead of fitsWithoutLosses) {
      const ind = this.aliveShipDict.names.findIndex(name => name === noneDead);
      const totalCount = this.aliveShipDict.shipCount[ind];
      const aliveCount = totalCount;
      this.deadShipString += ` ${noneDead}: ${aliveCount} / ${totalCount}`;
    }
  }
  makeFleet(sidesShips: {ship: ShipData, n: number}[], initalDistance: number) {
    this.uniqueFitCount = 0;
    this.totalShipCount = 0;
    for (const shipClass of sidesShips) {
      this.uniqueFitCount += 1;
      this.totalShipCount += shipClass.n;
      const alternateColoring = this.uniqueFitCount % 2 === 0;
      const colorShift = ((this.uniqueFitCount - 1) * (255 / sidesShips.length).toFixed(0)).toString();
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
          console.log(shipStats);
          console.log(localShip);
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
