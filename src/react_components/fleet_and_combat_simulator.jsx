// @flow
import React from 'react';
import { Divider, Table, Grid, Button, Dimmer, Segment } from 'semantic-ui-react';
import { XYPlot, LineSeries, XAxis, YAxis } from 'react-vis';
import { sideOneShips, sideTwoShips, UIRefresh } from './../index';
import RunFleetActions from './../fleet_actions';
import Side from './../side_class';
import ShipData from './../ship_data_class';
import Ship from './../ship_class';
import type { SimulationState, SyntheticInputEvent } from './../flow_types';

function FleetStateTableHeader(props: { side: 'red' | 'blue' }) {
  return (
    <Table.Header>
      <Table.Row>
        <Table.HeaderCell colSpan="5" textAlign="center">
          { props.side === 'red' ? 'Red Ships' : 'Blue Ships' }
        </Table.HeaderCell>
      </Table.Row>
      <Table.Row>
        <Table.HeaderCell>Name</Table.HeaderCell>
        <Table.HeaderCell>Ship Type</Table.HeaderCell>
        <Table.HeaderCell>Total</Table.HeaderCell>
        <Table.HeaderCell positive>Alive</Table.HeaderCell>
        <Table.HeaderCell negative>Dead</Table.HeaderCell>
      </Table.Row>
    </Table.Header>
  );
}

// disabled for type declaration
// eslint-disable-next-line no-use-before-define
type FleetStateTableContext = { parent: FleetAndCombatSimulator, side: 'red' | 'blue' };
function FleetStateTable(shipInfo: { ship: ShipData, n: number }) {
  const context = (this: FleetStateTableContext);
  const side: Side = context.side === 'red' ? context.parent.red : context.parent.blue;
  return (
    <Table.Row key={shipInfo.ship.name}>
      <Table.Cell>{ shipInfo.ship.name }</Table.Cell>
      <Table.Cell>{ shipInfo.ship.shipType }</Table.Cell>
      <Table.Cell>{ shipInfo.n }</Table.Cell>
      <Table.Cell>
        { side ? side.ships.filter(s => s.id === shipInfo.ship.id).length : shipInfo.n }
      </Table.Cell>
      <Table.Cell>
        { side ? side.deadShips.filter(s => s.id === shipInfo.ship.id).length : 0}
      </Table.Cell>
    </Table.Row>
  );
}

function BattleDisplay(props: { red: Side, blue: Side }) {
  return (
    <svg viewBox="0 0 200 100" className="battleDisplay">
      { props.red && props.red.ships ?
        props.red.ships.map((ship: Ship, i, fleet) => (
          <rect
            key={`red${i.toString()}`}
            fill={ship.iconColor}
            width={fleet.length > 50 ? 1 : 5}
            height="1"
            x={100 - (i / 25) - (ship.distanceFromTarget / 3000)}
            y={49 + (i % 2 ? (i % 50) + 1 : -i % 50)}
          />
        )) : null
      }
      { props.blue && props.blue.ships ?
        props.blue.ships.map((ship: Ship, i, fleet) => (
          <rect
            key={`blue${i.toString()}`}
            fill={ship.iconColor}
            width={fleet.length > 50 ? 1 : 5}
            height="1"
            x={100 + (i / 25) + (ship.distanceFromTarget / 3000)}
            y={49 + (i % 2 ? (i % 50) + 1 : -i % 50)}
          />
        )) : null
      }
    </svg>
  );
}

type FleetAndCombatSimulatorState = {
  reportStrings: string[], initalDistance: number, simulationSpeed: number,
  red: Side, blue: Side, simulationState: SimulationState,
};
class FleetAndCombatSimulator extends React.Component<
{ initalDistance?: number, narrowScreen: boolean }, FleetAndCombatSimulatorState
> {
  constructor(props: { initalDistance?: number }) {
    super(props);
    this.state = {
      reportStrings: [],
      initalDistance: props.initalDistance || 35000,
      simulationSpeed: 10,
      red: new Side('red'),
      blue: new Side('blue'),
      simulationState: 'setup',
    };
    if (this.props.narrowScreen) {
      this.currentFontSize = 14;
      this.XYPlotSize = 140;
      this.setXYPlotMargin(2);
    } else {
      this.currentFontSize = document.body && document.body.style.fontSize !== '' ?
        Number(document.body.style.fontSize.replace('px', '')) :
        14;
      this.XYPlotSize = this.currentFontSize * 22;
      this.setXYPlotMargin(2);
    }
    //this.totalHeight = (10.66 + (this.props.narrowScreen ? 10 : 22)).toString() + 'em';
    this.totalHeight = this.props.narrowScreen ? '20.66em' : '23.81458vw';
    //this.totalHeight = (this.XYPlotSize + this.currentFontSize * 10.66).toString() + 'px';
    //padding: .78571429em 1.5em .78571429em;
    //margin-top: 0.58928571em;2.16
  }
  componentWillUpdate() {
    this.refreshSides();
    this.totalHeight = this.props.narrowScreen ? '20.66em' : '23.81458vw';
    //this.totalHeight = (10.66 + (this.props.narrowScreen ? 10 : 22)).toString() + 'em';
  }
  setXYPlotMargin = (charLengthOfMaxShips: number) => {
    this.XYPlotMargin = {
      left: this.currentFontSize * Math.max(3, charLengthOfMaxShips),
      right: this.currentFontSize,
      top: this.currentFontSize,
      bottom: this.currentFontSize * 2,
    };
  };
  currentFontSize: number;
  XYPlotSize: number;
  XYPlotMargin: {left: number, right: number, top: number, bottom: number };
  red: Side = new Side('red');
  blue: Side = new Side('blue');
  redGraphData: { x: number, y: number }[];
  blueGraphData: { x: number, y: number }[];
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
  RunSimulationLoop = (
    breakClause: number, interval: number,
    reportInterval: number, simulationSpeed: number,
  ) => {
    if (simulationSpeed !== this.state.simulationSpeed) {
      const newReportInterval = 100 * this.state.simulationSpeed;
      const newSimulationSpeed = this.state.simulationSpeed;
      this.RunSimulationLoop(breakClause, interval, newReportInterval, newSimulationSpeed);
    } else if (this.blue.ships.length > 0 && this.red.ships.length > 0 && breakClause < 72000) {
      for (let i = 0; i < reportInterval; i += interval) {
        const isDamageDealtBlue = RunFleetActions(this.blue, interval, this.red);
        const isDamageDealtRed = RunFleetActions(this.red, interval, this.blue);
        if (isDamageDealtBlue) {
          this.removeDeadShips(this.red);
        }
        if (isDamageDealtRed) {
          this.removeDeadShips(this.blue);
        }
      }
      const newBreakClause = breakClause + simulationSpeed;
      this.logUpdate(this.blue, this.red, newBreakClause / 10);
      this.setState({ red: this.red });
      this.setState({ blue: this.blue });
      setTimeout(
        this.RunSimulationLoop, reportInterval / simulationSpeed,
        newBreakClause, interval, reportInterval, simulationSpeed,
      );
    } else {
      this.logUpdate(this.blue, this.red, breakClause / 10);
      this.setState({ simulationState: 'finished' });
      UIRefresh();
    }
  };
  SimulateBattle = () => {
    this.state.reportStrings = [];
    this.redGraphData = [];
    this.blueGraphData = [];
    this.blue = this.state.blue;
    this.red = this.state.red;
    this.red = new Side('red');
    this.blue = new Side('blue');
    this.red.makeFleet(sideOneShips, this.state.initalDistance);
    this.blue.makeFleet(sideTwoShips, this.state.initalDistance);
    this.setState({ red: this.red });
    this.setState({ blue: this.blue });
    this.setState({ simulationState: 'running' });
    const largestFleet = Math.max(this.blue.ships.length, this.red.ships.length);
    const charLengthOfMaxShips = largestFleet.toString().length;
    this.setXYPlotMargin(charLengthOfMaxShips);
    const reportInterval = 100 * this.state.simulationSpeed;
    const interval = 50;
    this.logUpdate(this.blue, this.red, 0);
    setTimeout(
      this.RunSimulationLoop, reportInterval / this.state.simulationSpeed,
      0, interval, reportInterval, this.state.simulationSpeed,
    );
  };
  refreshSides = () => {
    if (sideOneShips && sideOneShips.length > 0 &&
        (this.red.uniqueFitCount !== sideOneShips.length ||
         sideOneShips.reduce((t, c) => t + c.n, 0) !== this.red.totalShipCount)) {
      const emptyInd = sideOneShips.findIndex(s => s.n === 0);
      if (emptyInd >= 0) {
        sideOneShips.splice(emptyInd, 1);
      }
      if (this.state.simulationState === 'finished') {
        this.updateFleets();
        this.setState({ simulationState: 'setup' });
      } else {
        this.red = new Side('red');
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
      if (this.state.simulationState === 'finished') {
        this.updateFleets();
        this.setState({ simulationState: 'setup' });
      } else {
        this.blue = new Side('blue');
        this.blue.makeFleet(sideTwoShips, this.state.initalDistance);
      }
    }
  };
  updateFleets = (updatedDistance: number = 0) => {
    this.red = new Side('red');
    this.red.makeFleet(sideOneShips, updatedDistance || this.state.initalDistance);
    this.blue = new Side('blue');
    this.blue.makeFleet(sideTwoShips, updatedDistance || this.state.initalDistance);
  }
  initalDistanceChange = (e: SyntheticInputEvent) => {
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
    if (this.state.simulationState === 'finished') {
      this.updateFleets();
      this.setState({ simulationSpeed: Number(e.currentTarget.value), simulationState: 'setup' });
    } else {
      this.setState({ simulationSpeed: Number(e.currentTarget.value) });
    }
  };
  render() {
    const reportData = this.state.reportStrings.length < 100 ?
                       this.state.reportStrings.map((report, i) =>
                         <p key={report + i.toString()}>{ report }</p>) :
                       '';
    return (
      <div className="fleetSim" style={{height: this.totalHeight, maxHeight: this.totalHeight}}>
        <Grid>
          <Grid.Column width={ this.props.narrowScreen ? 5 : 4 }>
            <Table
              celled
              className="fleetStateTable"
              compact={ this.props.narrowScreen ? "very" : true }
              size={ this.props.narrowScreen ? 'small' : null }
            >
              <Table>
                <FleetStateTableHeader side="red" />
                { sideOneShips ?
                  <Table.Body>
                    { sideOneShips.map(FleetStateTable, ({ parent: this, side: 'red' }: FleetStateTableContext)) }
                  </Table.Body> : null
                }
              </Table>
            </Table>
          </Grid.Column>
          <Grid.Column width={ this.props.narrowScreen ? 6 : 8 } className={ this.props.narrowScreen ? "battleDisplay battleDisplayNarrow" : "battleDisplay" }>
            <Dimmer.Dimmable className="battleDisplayDimmer" dimmed={this.state.simulationState === 'finished'}>
              <Dimmer active={this.state.simulationState === 'finished'}>
                <div className="battleDisplayResults">
                  <Segment
                    className={ this.props.narrowScreen ?
                               "applicationDisplay applicationDisplayNarrow" : "applicationDisplay" }
                    inverted
                    floated="left"
                  >
                    {`Red Application: ${((this.red.appliedDamage / this.red.theoreticalDamage) * 100).toPrecision(4)}%`}
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
                      tickTotal={ this.props.narrowScreen ? 3 : 5 }
                      style={{
                        stroke: 'white',
                        fill: 'white',
                        line: { stroke: 'grey' },
                        ticks: { stroke: 'white' },
                        text: { stroke: 'white', fill: 'white' },
                      }}
                    />
                    <YAxis
                      title="Ships"
                      style={{
                        stroke: 'white',
                        fill: 'white',
                        line: { stroke: 'grey' },
                        ticks: { stroke: 'white' },
                        text: { stroke: 'white', fill: 'white' },
                      }}
                    />
                  </XYPlot>
                  <Segment
                    className={ this.props.narrowScreen ?
                               "applicationDisplay applicationDisplayNarrow" : "applicationDisplay" }
                    inverted
                    floated="right"
                  >
                    {`Blue Application: ${((this.blue.appliedDamage / this.blue.theoreticalDamage) * 100).toPrecision(4)}%`}
                  </Segment>
                </div>
              </Dimmer>
              <BattleDisplay red={this.red} blue={this.blue} />
            </Dimmer.Dimmable>
            <Button.Group attached="bottom" widths="3">
              <Button color="grey" as="div">
                Fleet Starting Distance {this.state.initalDistance.toPrecision(6).toString()}m
                <br />
                <input
                  className="inlineButtonSlider"
                  type="range"
                  onChange={this.initalDistanceChange}
                  min={0}
                  max={300000}
                  defaultValue={this.state.initalDistance}
                />
              </Button>
              <Button primary onClick={this.SimulateBattle}>Simulate Battle!</Button>
              <Button color="grey" as="div">
                Simulation Speed {this.state.simulationSpeed.toPrecision(4).toString()}x
                <br />
                <input
                  className="inlineButtonSlider"
                  type="range"
                  onChange={this.simulationSpeedChange}
                  min={1}
                  max={1000}
                  defaultValue={this.state.simulationSpeed}
                />
              </Button>
            </Button.Group>
          </Grid.Column>
          <Grid.Column width={ this.props.narrowScreen ? 5 : 4 }>
            <Table
              celled
              className="fleetStateTable"
              compact={ this.props.narrowScreen ? "very" : true }
              size={ this.props.narrowScreen ? 'small' : null }
            >
              <Table>
                <FleetStateTableHeader side="blue" />
                { sideTwoShips ?
                  <Table.Body>
                    { sideTwoShips.map(FleetStateTable, ({ parent: this, side: 'blue' }: FleetStateTableContext)) }
                  </Table.Body> : null
                }
              </Table>
            </Table>
          </Grid.Column>
        </Grid>
        { reportData }
        <Divider />
      </div>
    );
  }
}

export default FleetAndCombatSimulator;
