// @flow
import React, { Fragment } from 'react';
import { Divider, Table, Grid, Button, Dimmer, Segment } from 'semantic-ui-react';
import { XYPlot, LineSeries, XAxis, YAxis } from 'react-vis';
import { sideOneShips, sideTwoShips, UIRefresh } from './../index';
import Side from './../side_class';
import ShipData from './../ship_data_class';
import type { SimulationState, SyntheticInputEvent, ButtonColors, SideShipInfo } from './../flow_types';
import FleetInfoDnDTable from './fleet_info_dnd_table';
import ShipDataDisplayManager from './../ship_data_display_manager';
import SimWorker from './../sim.worker';


type SideGuiStats = {
  appliedDamage: number,
  theoreticalDamage: number,
  graphData: { x: number, y: number }[],
};
type EndStats = { red: SideGuiStats, blue: SideGuiStats };
type GuiShipData = {
  dis: number,
  iconColor: string,
  id: number,
}
type ShipUpdate = { red: GuiShipData[], blue: GuiShipData[] };

type SimMessageData = {| +type: 'setXYPlotMargin', +val: number |} |
  {| +type: 'updateSides', +val: ShipUpdate |} |
  {| +type: 'simulationFinished', +val: null |} |
  {| +type: 'endStats', +val: EndStats |};

type SimMessageEvent = {
  data: SimMessageData,
  origin: string,
  lastEventId: string,
  source: WindowProxy,
}

class GuiSide {
  ships: GuiShipData[];
  deadShips: GuiShipData[];
  theoreticalDamage: number = 0;
  appliedDamage: number = 0;
  oppSide: GuiSide;
  uniqueFitCount: number;
  totalShipCount: number;
  color: string;

  makeFleet: (SideShipInfo[], number) => void = (
    sidesShips: SideShipInfo[],
    initalDistance: number,
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
      const shipStats: ShipData = shipClass.ship;
      for (let i = 0; i < shipClass.n; i += 1) {
        const localShip: GuiShipData = {
          dis: this.color === 'red' ? 0.5 * initalDistance : -0.5 * initalDistance,
          iconColor: shipClass.iconColor,
          id: shipStats.id,
        };
        this.ships.push(localShip);
      }
    }
  };

  constructor(colorArg: 'red' | 'blue'): GuiSide {
    this.ships = [];
    this.deadShips = [];
    this.color = colorArg;
    return this;
  }
}

function BattleDisplay(props: { red: GuiSide, blue: GuiSide }) {
  return (
    <svg viewBox="0 0 200 100" className="battleDisplay">
      { props.red && props.red.ships ?
        props.red.ships.map((ship: GuiShipData, i, fleet) => (
          <rect
            key={`red${i.toString()}`}
            fill={ship.iconColor}
            width={fleet.length > 50 ? 1 : 5}
            height="1"
            x={(100 - (i / 25)) - (ship.dis / 3000)}
            y={49 + (i % 2 ? (i % 50) + 1 : -i % 50)}
          />
        )) : null
      }
      { props.blue && props.blue.ships ?
        props.blue.ships.map((ship: GuiShipData, i, fleet) => (
          <rect
            key={`blue${i.toString()}`}
            fill={ship.iconColor}
            width={fleet.length > 50 ? 1 : 5}
            height="1"
            x={(100 + (i / 25)) - (ship.dis / 3000)}
            y={49 + (i % 2 ? (i % 50) + 1 : -i % 50)}
          />
        )) : null
      }
    </svg>
  );
}

function getApplicationString(appliedDamage: number, theoreticalDamage: number) {
  if (Number.isNaN(appliedDamage) || theoreticalDamage === 0) {
    return 'None';
  }
  return `${((appliedDamage / theoreticalDamage) * 100).toPrecision(4)}%`;
}

function enforceInputMinMax(e: SyntheticInputEvent) {
  const input = Number(e.currentTarget.value);
  if (input < Number(e.currentTarget.min)) {
    e.currentTarget.value = e.currentTarget.min;
  } else if (input > Number(e.currentTarget.max)) {
    e.currentTarget.value = e.currentTarget.max;
  }
}

type FleetAndCombatSimulatorState = {
  initalDistance: number, simulationSpeed: number,
  red: GuiSide, blue: GuiSide, simulationState: SimulationState,
};
type FleetAndCombatSimulatorProps = {
  initalDistance?: number, narrowScreen: boolean, buttonColors: ButtonColors,
};
class FleetAndCombatSimulator extends React.Component<
FleetAndCombatSimulatorProps,
FleetAndCombatSimulatorState
> {
  constructor(props: {
    initalDistance?: number, narrowScreen: boolean, buttonColors: ButtonColors,
  }) {
    super(props);
    this.state = {
      initalDistance: props.initalDistance || 35000,
      simulationSpeed: 10,
      red: new GuiSide('red'),
      blue: new GuiSide('blue'),
      simulationState: 'setup',
    };
    if (this.props.narrowScreen) {
      this.currentFontSize = 14;
      this.XYPlotSize = 161;
      this.setXYPlotMargin(2);
    } else {
      this.currentFontSize = document.body && document.body.style.fontSize !== '' ?
        Number(document.body.style.fontSize.replace('px', '')) :
        14;
      this.XYPlotSize = this.currentFontSize * 22;
      this.setXYPlotMargin(2);
    }
    this.totalHeight = this.props.narrowScreen ? '20.66em' : '23.81458vw';
  }
  // This shouldn't be used like this but is best changed as part of an overhaul to the class.
  // Make sure to remove it when the component is reworked to allow a vertical variant for mobile.
  componentWillUpdate(
    nextProps: FleetAndCombatSimulatorProps,
    nextState: FleetAndCombatSimulatorState,
  ) {
    this.refreshSides(nextState.simulationState);
    this.totalHeight = this.props.narrowScreen ? '20.66em' : '23.81458vw';
  }
  setXYPlotMargin = (charLengthOfMaxShips: number) => {
    this.XYPlotMargin = {
      left: this.currentFontSize * Math.max(3, charLengthOfMaxShips),
      right: this.currentFontSize,
      top: this.currentFontSize,
      bottom: this.currentFontSize * 2,
    };
  };
  totalHeight: string;
  currentFontSize: number;
  XYPlotSize: number;
  XYPlotMargin: {left: number, right: number, top: number, bottom: number };
  red: GuiSide = new GuiSide('red');
  blue: GuiSide = new GuiSide('blue');
  redGraphData: { x: number, y: number }[];
  blueGraphData: { x: number, y: number }[];
  worker: Worker;
  logUpdate = (blue: GuiSide, red: GuiSide, seconds: number) => {
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
  SimulateBattle = () => {
    if (this.state.simulationState === 'running') {
      return;
    }
    this.setState({ simulationState: 'running' });
    this.red = new GuiSide('red');
    this.blue = new GuiSide('blue');
    let worker;
    if (!this.worker) {
      // Flow doesn't understand worker-loader being used by webpack, hence the any cast is needed.
      worker = (new (SimWorker: any)(): Worker);
      this.worker = worker;
    } else {
      ({ worker } = this);
    }
    worker.onmessage = (e: Object) => {
      // Flow doesn't directly track typing across threads.
      // Without casting the input's type is 'mixed' which is impractical for the use case.
      const simMsg: SimMessageEvent = (e: SimMessageEvent);
      const { data } = simMsg;
      if (data.type === 'setXYPlotMargin') {
        this.setXYPlotMargin(data.val);
      } else if (data.type === 'updateSides') {
        const v: ShipUpdate = data.val;
        this.red.ships = v.red;
        this.blue.ships = v.blue;
        this.setState({ red: this.red, blue: this.blue }, () => {
          if (this.state.simulationState !== 'paused') {
            worker.postMessage({ type: 'frameRenderComplete', val: '' });
          }
        });
      } else if (data.type === 'simulationFinished') {
        this.setState({ simulationState: 'finished' }, () => {
          UIRefresh();
        });
      } else if (data.type === 'endStats') {
        const v: EndStats = data.val;
        const valRed: SideGuiStats = v.red;
        const valBlue: SideGuiStats = v.blue;
        this.red.appliedDamage = valRed.appliedDamage;
        this.red.theoreticalDamage = valRed.theoreticalDamage;
        this.blue.appliedDamage = valBlue.appliedDamage;
        this.blue.theoreticalDamage = valBlue.theoreticalDamage;
        this.redGraphData = valRed.graphData;
        this.blueGraphData = valBlue.graphData;
        this.setState({ red: this.red, blue: this.blue });
      }
    };
    worker.onerror = (e) => {
      console.log(e);
      console.error(e);
    };
    worker.postMessage({
      type: 'RunSimulation',
      val: [
        sideOneShips, sideTwoShips, this.state.simulationSpeed, this.state.initalDistance,
        ShipDataDisplayManager.dronesEnabled, ShipDataDisplayManager.ammoSwaps,
      ],
    });
  };
  refreshSides = (nextSimState: SimulationState | null = null) => {
    if (sideOneShips && sideOneShips.length > 0 &&
        (this.red.uniqueFitCount !== sideOneShips.length ||
         sideOneShips.reduce((t, c) => t + c.n, 0) !== this.red.totalShipCount)) {
      const emptyInd = sideOneShips.findIndex(s => s.n === 0);
      if (emptyInd >= 0) {
        sideOneShips.splice(emptyInd, 1);
      }
      if ((nextSimState || this.state.simulationState) === 'finished') {
        this.updateFleets();
        this.setState({ simulationState: 'setup' });
      } else {
        this.red = new GuiSide('red');
        this.red.oppSide = this.blue;
        this.red.makeFleet(sideOneShips, this.state.initalDistance);
      }
    }
    if (sideTwoShips && sideTwoShips.length > 0 &&
        (this.blue.uniqueFitCount !== sideTwoShips.length ||
         sideTwoShips.reduce((t, c) => t + c.n, 0) !== this.blue.totalShipCount)) {
      const emptyInd = sideTwoShips.findIndex(s => s.n === 0);
      if (emptyInd >= 0) {
        sideTwoShips.splice(emptyInd, 1);
      }
      if ((nextSimState || this.state.simulationState) === 'finished') {
        this.updateFleets();
        this.setState({ simulationState: 'setup' });
      } else {
        this.blue = new GuiSide('blue');
        this.blue.oppSide = this.red;
        this.blue.makeFleet(sideTwoShips, this.state.initalDistance);
      }
    }
  };
  updateFleets = (updatedDistance: number = 0) => {
    this.red = new GuiSide('red');
    this.red.makeFleet(sideOneShips, updatedDistance || this.state.initalDistance);
    this.blue = new GuiSide('blue');
    this.blue.makeFleet(sideTwoShips, updatedDistance || this.state.initalDistance);
    this.red.oppSide = this.blue;
    this.blue.oppSide = this.red;
  };
  initalDistanceChange = (e: SyntheticInputEvent) => {
    enforceInputMinMax(e);
    if (this.state.simulationState === 'setup') {
      this.updateFleets(Number(e.currentTarget.value));
      this.setState({ initalDistance: Number(e.currentTarget.value) });
    } else if (this.state.simulationState === 'finished') {
      this.updateFleets(Number(e.currentTarget.value));
      this.setState({ initalDistance: Number(e.currentTarget.value), simulationState: 'setup' });
    } else {
      e.currentTarget.value = this.state.initalDistance.toString();
    }
  };
  simulationSpeedChange = (e: SyntheticInputEvent) => {
    enforceInputMinMax(e);
    if (this.state.simulationState === 'finished') {
      this.updateFleets();
      this.setState({ simulationSpeed: Number(e.currentTarget.value), simulationState: 'setup' });
    } else {
      this.setState({ simulationSpeed: Number(e.currentTarget.value) });
      if (this.worker) {
        this.worker.postMessage({ type: 'changeSimSpeed', val: Number(e.currentTarget.value) });
      }
    }
  };
  pauseSimulation = () => {
    this.setState({ simulationState: 'paused' });
  };
  resumeSimulation = () => {
    if (this.state.simulationState === 'paused') {
      this.setState({ simulationState: 'running' }, () => {
        this.worker.postMessage({ type: 'frameRenderComplete', val: '' });
      });
    }
  };
  resetSimulation = () => {
    if (this.state.simulationState === 'paused') {
      this.updateFleets();
      this.setState({ simulationState: 'setup' });
    }
  };
  render() {
    const inlineDisStyle = { display: 'inline-block' };
    const unpaddedWrapperStyle = {
      display: 'inline-block',
      maxWidth: '100%',
    };
    const simSpeedLen = this.state.simulationSpeed.toString().length;
    const simSpeedStyle = {
      width: `calc(${simSpeedLen}ch + 8px)`,
    };
    const simSpeedPadding = (4 - simSpeedLen) / 2;
    const simSpeedWrapperStyle = this.props.narrowScreen ? unpaddedWrapperStyle : {
      display: 'inline-block',
      paddingLeft: `calc(${simSpeedPadding}ch + 4px)`,
      paddingRight: `calc(${simSpeedPadding}ch + 4px)`,
      maxWidth: '100%',
    };
    const simSpeedInputWrapperStyle = this.props.narrowScreen ? { } : inlineDisStyle;

    const iDisLen = this.state.initalDistance.toString().length;
    const initalDisStyle = {
      width: `calc(${iDisLen}ch + 8px)`,
    };
    const iDisPadding = (6 - iDisLen) / 2;
    const iDisWrapperStyle = this.props.narrowScreen ? unpaddedWrapperStyle : {
      display: 'inline-block',
      paddingLeft: `calc(${iDisPadding}ch + 4px)`,
      paddingRight: `calc(${iDisPadding}ch + 4px)`,
      maxWidth: '100%',
    };
    const iDisInputWrapperStyle = this.props.narrowScreen ? { } : inlineDisStyle;

    return (
      <div className="fleetSim" style={{ height: this.totalHeight, maxHeight: this.totalHeight }}>
        <Grid>
          <Grid.Column width={this.props.narrowScreen ? 5 : 4}>
            <Table
              celled
              className="fleetStateTable"
              compact={this.props.narrowScreen ? 'very' : true}
            >
              {(<FleetInfoDnDTable
                ships={sideOneShips || []}
                parent={this}
                side="red"
              />
               )}
            </Table>
          </Grid.Column>
          <Grid.Column width={this.props.narrowScreen ? 6 : 8} className={this.props.narrowScreen ? 'battleDisplay battleDisplayNarrow' : 'battleDisplay'}>
            <Dimmer.Dimmable className="battleDisplayDimmer" dimmed={this.state.simulationState === 'finished'}>
              <Dimmer active={this.state.simulationState === 'finished'}>
                {this.state.simulationState === 'finished' ?
                  <div className="battleDisplayResults">
                    <Segment
                      className={this.props.narrowScreen ?
                                 'applicationDisplay applicationDisplayNarrow' : 'applicationDisplay'}
                      inverted
                      floated="left"
                    >
                      {`Red Application: ${getApplicationString(this.red.appliedDamage, this.red.theoreticalDamage)}`}
                    </Segment>
                    <XYPlot
                      height={this.XYPlotSize}
                      width={this.XYPlotSize}
                      margin={this.XYPlotMargin}
                    >
                      <LineSeries
                        color="red"
                        data={this.redGraphData}
                        curve="curveMonotoneX"
                        strokeWidth="0.2em"
                        style={{ fill: 'rgba(0, 0 ,0, 0)' }}
                      />
                      <LineSeries
                        color="blue"
                        data={this.blueGraphData}
                        curve="curveMonotoneX"
                        strokeWidth="0.2em"
                        style={{ fill: 'rgba(0, 0 ,0, 0)' }}
                      />
                      <XAxis
                        title="Time (Seconds)"
                        tickTotal={this.props.narrowScreen ? 2 : 4}
                        style={{
                          stroke: 'var(--graph-font-color)',
                          fill: 'var(--graph-font-color)',
                          line: { stroke: 'grey' },
                          ticks: { stroke: 'var(--graph-font-color)' },
                          text: { stroke: 'var(--graph-font-color)', fill: 'var(--graph-font-color)' },
                        }}
                      />
                      <YAxis
                        title="Ships"
                        style={{
                          stroke: 'var(--graph-font-color)',
                          fill: 'var(--graph-font-color)',
                          line: { stroke: 'grey' },
                          ticks: { stroke: 'var(--graph-font-color)' },
                          text: { stroke: 'var(--graph-font-color)', fill: 'var(--graph-font-color)' },
                        }}
                      />
                    </XYPlot>
                    <Segment
                      className={this.props.narrowScreen ?
                                 'applicationDisplay applicationDisplayNarrow' : 'applicationDisplay'}
                      inverted
                      floated="right"
                    >
                      {`Blue Application: ${getApplicationString(this.blue.appliedDamage, this.blue.theoreticalDamage)}`}
                    </Segment>
                  </div>
                : ''}
              </Dimmer>
              <BattleDisplay red={this.red} blue={this.blue} />
            </Dimmer.Dimmable>
            <Button.Group attached="bottom" widths="3">
              <Button as="div" className={this.props.buttonColors[5]} inverted={this.props.buttonColors[0]}>
                <div style={iDisWrapperStyle}>
                  {'Starting Distance '}
                  <div style={iDisInputWrapperStyle}>
                    <input
                      type="number"
                      onChange={this.initalDistanceChange}
                      min={0}
                      max={300000}
                      value={this.state.initalDistance.toString()}
                      style={initalDisStyle}
                    />
                    m
                  </div>
                </div>
                <br />
                <input
                  className="inlineButtonSlider"
                  type="range"
                  onChange={this.initalDistanceChange}
                  min={0}
                  max={300000}
                  value={this.state.initalDistance}
                />
              </Button>
              {['setup', 'finished'].includes(this.state.simulationState) ?
                <Button
                  onClick={this.SimulateBattle}
                  className={this.props.buttonColors[2]}
                  inverted={this.props.buttonColors[0]}
                >
                  Simulate Battle!
                </Button> : ''}
              {this.state.simulationState === 'running' ?
                <Button
                  onClick={this.pauseSimulation}
                  className={this.props.buttonColors[2]}
                  inverted={this.props.buttonColors[0]}
                >
                  Pause
                </Button> : ''}
              {this.state.simulationState === 'paused' ?
                <Fragment>
                  <Button
                    onClick={this.resetSimulation}
                    className={`${this.props.buttonColors[2]} split-left`}
                    inverted={this.props.buttonColors[0]}
                  >
                    Reset Simulation
                  </Button>
                  <Button
                    onClick={this.resumeSimulation}
                    className={`${this.props.buttonColors[2]} split-right`}
                    inverted={this.props.buttonColors[0]}
                  >
                    Resume
                  </Button>
                </Fragment> : ''}
              <Button as="div" className={this.props.buttonColors[5]} inverted={this.props.buttonColors[0]}>
                <div style={simSpeedWrapperStyle} >
                  {'Simulation Speed '}
                  <div style={simSpeedInputWrapperStyle}>
                    <input
                      type="number"
                      onChange={this.simulationSpeedChange}
                      min={1}
                      max={1000}
                      value={this.state.simulationSpeed.toString()}
                      style={simSpeedStyle}
                    />
                    x
                  </div>
                </div>
                <br />
                <input
                  className="inlineButtonSlider"
                  type="range"
                  onChange={this.simulationSpeedChange}
                  min={1}
                  max={1000}
                  value={this.state.simulationSpeed}
                />
              </Button>
            </Button.Group>
          </Grid.Column>
          <Grid.Column width={this.props.narrowScreen ? 5 : 4}>
            <Table
              celled
              className="fleetStateTable"
              compact={this.props.narrowScreen ? 'very' : true}
            >
              <FleetInfoDnDTable
                ships={sideTwoShips || []}
                parent={this}
                side="blue"
              />
            </Table>
          </Grid.Column>
        </Grid>
        <Divider />
      </div>
    );
  }
}

export default FleetAndCombatSimulator;
export type { SimMessageData, SimMessageEvent, ShipUpdate, GuiSide };
