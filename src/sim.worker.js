// @flow
import '@babel/polyfill';
import Side from './side_class';
import RunFleetActions from './fleet_actions';
import type { SideShipInfo } from './index';
import type { SimMessageData, ShipUpdate } from './react_components/fleet_and_combat_simulator';
import type { AmmoSwapValue } from './flow_types';

// Keeping flow happy
type msgPos = (SimMessageData) => void;
// This is needed to keep both flow and eslist happy without renaming postMessage.
// eslint-disable-next-line prefer-destructuring
const postMessage: msgPos = global.self.postMessage;

class SimWorker {
  state = {};
  simulationSpeed: number;
  initalDistance: number;
  awaitingFrameRender: boolean = false;
  red: Side = new Side('red');
  blue: Side = new Side('blue');
  redGraphData: { x: number, y: number }[];
  blueGraphData: { x: number, y: number }[];
  getGuiShipData = s => (
    {
      dis: s.dis,
      iconColor: s.iconColor,
      id: s.id,
    }
  );
  logUpdate = (blue: Side, red: Side, seconds: number) => {
    this.redGraphData.push({ x: seconds, y: red.ships.length });
    this.blueGraphData.push({ x: seconds, y: blue.ships.length });
  };
  removeDeadShips = (side: Side) => {
    side.deadShips = [
      ...side.deadShips,
      ...side.ships.filter(ship => ship.currentEHP <= 0),
    ];
    side.ships = side.ships.filter(ship => ship.currentEHP > 0);
  };
  RunSimulationWrapper = (
    breakClause: number, interval: number,
    reportInterval: number, simulationSpeed: number,
    minDelay: number, strVal: ShipUpdate,
  ) => {
    if (this.awaitingFrameRender === true) {
      setTimeout(
        this.RunSimulationWrapper, 5,
        breakClause, interval, reportInterval, simulationSpeed, Math.max(0, minDelay - 5), strVal,
      );
    } else {
      postMessage({ type: 'updateSides', val: strVal });
      this.awaitingFrameRender = true;
      setTimeout(
        this.RunSimulationLoop, minDelay,
        breakClause, interval, reportInterval, simulationSpeed,
      );
    }
  };
  RunSimulationLoop = (
    breakClause: number, interval: number,
    reportInterval: number, simulationSpeed: number,
  ) => {
    const startTime = performance.now();
    if (simulationSpeed !== this.simulationSpeed) {
      const newReportInterval = 100 * this.simulationSpeed;
      const newSimulationSpeed = this.simulationSpeed;
      this.RunSimulationLoop(breakClause, interval, newReportInterval, newSimulationSpeed);
    } else if (this.blue.ships.length > 0 && this.red.ships.length > 0 && breakClause < 72000) {
      for (let i = 0; i < reportInterval; i += interval) {
        const isDamageDealtRed = RunFleetActions(this.red, interval, this.blue, true);
        const isDamageDealtBlue = RunFleetActions(this.blue, interval, this.red);
        if (isDamageDealtBlue) {
          this.removeDeadShips(this.red);
        }
        if (isDamageDealtRed) {
          this.removeDeadShips(this.blue);
        }
        if (isDamageDealtBlue || isDamageDealtRed) {
          this.logUpdate(this.blue, this.red, (breakClause + (i / 100)) / 10);
          if (this.blue.ships.length === 0 || this.red.ships.length === 0) {
            break;
          }
        }
      }
      const hRange = 300000;
      const allShips = [...this.red.ships, ...this.blue.ships];
      const disSet = allShips.map(s => s.dis);
      const minDis = Math.min(...disSet);
      const maxDis = Math.max(...disSet);
      if (minDis < -hRange && !(maxDis > hRange)) {
        for (const s of allShips) {
          const newZero = (maxDis > -hRange ? maxDis - hRange : maxDis) / 4;
          s.dis -= newZero;
          s.pendingDis = s.dis;
        }
      } else if (maxDis > hRange && !(minDis < -hRange)) {
        for (const s of allShips) {
          const newZero = (minDis < hRange ? minDis + hRange : minDis) / 4;
          s.dis -= newZero;
          s.pendingDis = s.dis;
        }
      }

      const newBreakClause = breakClause + simulationSpeed;
      const strVal: ShipUpdate = {
        red: this.red.ships.map(this.getGuiShipData),
        blue: this.blue.ships.map(this.getGuiShipData),
      };
      const elapsedTime = performance.now() - startTime;
      const delay = Math.max(0, (reportInterval / simulationSpeed) - elapsedTime);
      this.RunSimulationWrapper(
        newBreakClause, interval, reportInterval,
        simulationSpeed, delay, strVal,
      );
    } else {
      const mapDapApp = s => (
        {
          appliedDamage: s.appliedDamage,
          theoreticalDamage: s.theoreticalDamage,
          graphData: s.color === 'red' ? this.redGraphData : this.blueGraphData,
        }
      );
      postMessage({
        type: 'endStats',
        val: {
          red: mapDapApp(this.red),
          blue: mapDapApp(this.blue),
        },
      });
      postMessage({ type: 'simulationFinished', val: null });
    }
  };
  SimulateBattle = (
    sideOneShips: SideShipInfo[], sideTwoShips: SideShipInfo[], simSpeed: number,
    initalDistance: number, dronesEnabled: boolean, ammoSwaps: AmmoSwapValue,
  ) => {
    this.simulationSpeed = simSpeed;
    this.initalDistance = initalDistance;
    this.redGraphData = [];
    this.blueGraphData = [];
    this.red = new Side('red');
    this.blue = new Side('blue');
    this.red.oppSide = this.blue;
    this.blue.oppSide = this.red;
    this.red.makeFleet(sideOneShips, this.initalDistance, dronesEnabled, ammoSwaps);
    this.blue.makeFleet(sideTwoShips, this.initalDistance, dronesEnabled, ammoSwaps);
    const largestFleet = Math.max(this.blue.ships.length, this.red.ships.length);
    const charLengthOfMaxShips = largestFleet.toString().length;
    postMessage({ type: 'setXYPlotMargin', val: charLengthOfMaxShips });
    const reportInterval = 100 * this.simulationSpeed;
    const interval = 50;
    this.logUpdate(this.blue, this.red, 0);
    const strVal: ShipUpdate = {
      red: this.red.ships.map(this.getGuiShipData),
      blue: this.blue.ships.map(this.getGuiShipData),
    };
    this.RunSimulationWrapper(
      0, interval, reportInterval, this.simulationSpeed,
      reportInterval / this.simulationSpeed, strVal,
    );
  };
}

type SimStartData = [
  Array<SideShipInfo>, Array<SideShipInfo>, number,
number, boolean, AmmoSwapValue,
];

type GuiMessageData = {| +type: 'RunSimulation', +val: SimStartData |} |
  {| +type: 'frameRenderComplete', +val: null |} |
  {| +type: 'changeSimSpeed', +val: number |};

type GuiMessageEvent = {
  data: GuiMessageData,
  origin: string,
  lastEventId: string,
  source: WindowProxy,
}

let simulation;
onmessage = (e: GuiMessageEvent) => {
  const { data } = e;
  if (data.type === 'RunSimulation') {
    const [
      sideOneShips, sideTwoShips, simSpeed, initalDistance, dronesEnabled, ammoSwaps,
    ] = (data.val: SimStartData);
    simulation = new SimWorker();
    simulation.SimulateBattle(
      sideOneShips, sideTwoShips, simSpeed,
      initalDistance, dronesEnabled, ammoSwaps,
    );
  } else if (data.type === 'frameRenderComplete') {
    simulation.awaitingFrameRender = false;
  } else if (data.type === 'changeSimSpeed') {
    simulation.simulationSpeed = data.val;
  }
};
