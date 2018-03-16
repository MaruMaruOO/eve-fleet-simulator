// @flow
import React from 'react';
import { Divider, Table, Grid, Button, Dimmer, Segment } from 'semantic-ui-react';
import { XYPlot, LineSeries } from 'react-vis';
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
{ initalDistance: number }, FleetAndCombatSimulatorState
> {
  constructor(props: { initalDistance: number }) {
    super(props);
    this.state = {
      reportStrings: [],
      initalDistance: props.initalDistance,
      simulationSpeed: 10,
      red: new Side('red'),
      blue: new Side('blue'),
      simulationState: 'finished',
    };
  }
  red: Side = new Side('red');;
  blue: Side = new Side('blue');
  redGraphData: { x: number, y: number }[];
  blueGraphData: { x: number, y: number }[];
  logUpdate = (blue: Side, red: Side, recordCount: number) => {
    this.redGraphData.push({ x: recordCount, y: red.ships.length });
    this.blueGraphData.push({ x: recordCount, y: blue.ships.length });
    // blue.logSide();
    // red.logSide();
  };
  RunSimulationLoop = (
    breakClause: number, interval: number,
    reportInterval: number, simulationSpeed: number,
  ) => {
    if (simulationSpeed !== this.state.simulationSpeed) {
      const newReportInterval = 100 * this.state.simulationSpeed;
      const newSimulationSpeed = this.state.simulationSpeed;
      this.RunSimulationLoop(breakClause, interval, newReportInterval, newSimulationSpeed);
    } else if (this.blue.ships.length > 0 && this.red.ships.length > 0 && breakClause < 500000) {
      for (let i = 0; i < reportInterval; i += interval) {
        RunFleetActions(this.blue, interval, this.red);
        RunFleetActions(this.red, interval, this.blue);
      }
      const newBreakClause = breakClause + simulationSpeed;
      this.logUpdate(this.blue, this.red, newBreakClause);
      this.setState({ red: this.red });
      this.setState({ blue: this.blue });
      setTimeout(
        this.RunSimulationLoop, reportInterval / simulationSpeed,
        newBreakClause, interval, reportInterval, simulationSpeed,
      );
    } else {
      this.logUpdate(this.blue, this.red, breakClause);
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
    this.refreshSides();
    const reportData = this.state.reportStrings.length < 100 ?
      this.state.reportStrings.map((report, i) =>
        <p key={report + i.toString()}>{ report }</p>) :
      '';
    return (
      <div className="fleetSim" style={{ overflowY: 'auto', maxHeight: '40%' }}>
        <Grid>
          <Grid.Column width="4">
            <Table celled compact>
              <FleetStateTableHeader side="red" />
              { sideOneShips ?
                <Table.Body>
                  { sideOneShips.map(FleetStateTable, ({ parent: this, side: 'red' }: { parent: FleetAndCombatSimulator, side: 'red' | 'blue' })) }
                </Table.Body> : null
              }
            </Table>
          </Grid.Column>
          <Grid.Column width="8" className="battleDisplay">
            <Dimmer.Dimmable dimmed={this.state.simulationState === 'finished'}>
              <Dimmer active={this.state.simulationState === 'finished'}>
                <div className="battleDisplayResults">
                  <Segment className="applicationDisplay" inverted floated="left">
                    {`Red Application: ${((this.red.appliedDamage / this.red.theoreticalDamage) * 100).toPrecision(4)}%`}
                  </Segment>
                  <XYPlot
                    height={300}
                    width={300}
                    margin={{
                      left: 10, right: 10, top: 10, bottom: 10,
                    }}
                  >
                    <LineSeries color="red" data={this.redGraphData} />
                    <LineSeries color="blue" data={this.blueGraphData} />
                  </XYPlot>
                  <Segment className="applicationDisplay" inverted floated="right">
                    {`Blue Application: ${((this.blue.appliedDamage / this.blue.theoreticalDamage) * 100).toPrecision(4)}%`}
                  </Segment>
                </div>
              </Dimmer>
              <BattleDisplay red={this.red} blue={this.blue} />
            </Dimmer.Dimmable>
            <Button.Group attached="bottom" widths="3">
              <Button color="grey">
                Fleet Starting Distance {this.state.initalDistance.toPrecision(6).toString()}m<br />
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
              <Button color="grey">
                Simulation Speed {this.state.simulationSpeed.toPrecision(4).toString()}x
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
          <Grid.Column width="4">
            <Table celled compact>
              <FleetStateTableHeader side="blue" />
              { sideTwoShips ?
                <Table.Body>
                  { sideTwoShips.map(FleetStateTable, ({ parent: this, side: 'blue' }: { parent: FleetAndCombatSimulator, side: 'red' | 'blue' })) }
                </Table.Body> : null
              }
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
