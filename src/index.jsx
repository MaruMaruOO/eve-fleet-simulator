// @flow
/* global */
import React from 'react';
import ReactDOM from 'react-dom';
import 'semantic-ui-css/semantic.min.css';
import {
  Menu, Image, Icon,
  Container, Grid, Dropdown,
} from 'semantic-ui-react';

import './css/progress_overides.css';
import './css/fit_list.css';
import './css/full_ui.css';

import ShipData from './ship_data_class';
import type { SyntheticInputEvent } from './flow_types';

import mainRifterIcon from './eve_icons/tabFittingsHorizontal.png';

import ShipAndFitCards from './react_components/ship_and_fit_cards';
import { SidebarShipDisplay } from './react_components/sidebar_ship_display';
import SidebarShipDisplaySettings from './react_components/sidebar_ship_display_settings';
import FleetAndCombatSimulator from './react_components/fleet_and_combat_simulator';

const root: Element = window.document.getElementById('root');

// const reportStrings = [];
const sideOneShips: { ship: ShipData, n: number }[] = [];
const sideTwoShips: { ship: ShipData, n: number }[] = [];
let initalDistance = 35000;

const UIRefresh = () => {
  ReactDOM.render(
    <FullUI />,
    root,
  );
};

function TopMenu() {
  return (
    <Menu
      inverted
      style={{
        top: '0%', left: '0%', right: '0%', position: 'fixed', zIndex: '1',
      }}
    >
      <Container text>
        <Menu.Item name="Main">
          <Image src={mainRifterIcon} size="mini" />
        </Menu.Item>
        <Menu.Item header>Eve Fleet Fight Simulator</Menu.Item>
        <Menu.Item as="a">Fleets & Fits</Menu.Item>
        <Menu.Item as="a">Upload Fits</Menu.Item>
        <Menu.Menu position="right">
          <Dropdown text="Other" pointing className="link item">
            <Dropdown.Menu>
              <Dropdown.Item>Nothing To See Here</Dropdown.Item>
            </Dropdown.Menu>
          </Dropdown>
          <Menu.Item as="a">Login</Menu.Item>
        </Menu.Menu>
      </Container>
    </Menu>);
}

function SidebarSimulationSettings() {
  const initalDistanceChange = (e: SyntheticInputEvent) => {
    initalDistance = Number(e.currentTarget.value);
    UIRefresh();
  };
  return (
    <Grid.Row>
      <h4>Inital Fleet Distance :
        <input
          onChange={initalDistanceChange}
          defaultValue={initalDistance.toString()}
          type="number"
          min="0"
          max="400000"
        />
      </h4>
    </Grid.Row>
  );
}

function SidebarContent() {
  return (
    <Grid
      columns="1"
      stretched
      centered
      style={{ backgroundColor: 'rgb(83, 87, 123)', overflowY: 'auto' }}
    >
      <SidebarSimulationSettings />
      <Grid.Row style={{
                  width: '100%',
                  display: 'flex',
                  position: 'relative',
                  flexWrap: 'wrap',
                  backgroundColor: 'rgb(33, 37, 43)',
                }}
      >
        <SidebarShipDisplay />
      </Grid.Row>
      <SidebarShipDisplaySettings />
    </Grid>
  );
}

function ShipAndFitDisplay() {
  return (
    <div className="shipDisplay" style={{ overflowY: 'auto', overflowX: 'hidden' }}>
      <ShipAndFitCards />
    </div>
  );
}

class FullUI extends React.Component<{ }, { showSidebar: boolean }> {
  constructor(props: { }) {
    super(props);
    this.state = { showSidebar: true };
  }
  toggleSidebar = () => {
    this.setState(prevState => ({ showSidebar: !prevState.showSidebar }));
  }
  render() {
    const sideBarIfAny = this.state.showSidebar ? (
      <Grid.Column style={{ paddingTop: '6em', backgroundColor: 'rgb(83, 87, 123)' }} key={0} width={3}>
        <SidebarContent />
      </Grid.Column>
    ) : '';
    return (
      <div style={{ height: '100%', position: 'fixed', display: 'block' }}>
        <TopMenu />
        <div style={{
          height: '100%', width: '100%', top: '0%', position: 'fixed', display: 'inlineFlex',
        }}
        >
          <Grid
            style={{
              height: '100%',
              width: '100%',
              margin: '0%',
              position: 'static',
              display: 'flex',
            }}
            stretched
          >
            { sideBarIfAny }
            <Grid.Column className="combatAndShipDisplay" key={1} width={this.state.showSidebar ? 13 : 16}>
              <div className="sidebarToggleDiv">
                <Icon
                  name={this.state.showSidebar ? 'chevron left' : 'chevron right'}
                  size="big"
                  link
                  onClick={this.toggleSidebar}
                />
              </div>
              <FleetAndCombatSimulator
                initalDistance={initalDistance}
              />
              <ShipAndFitDisplay />
            </Grid.Column>
          </Grid>
        </div>
      </div>
    );
  }
}

UIRefresh();

export { sideOneShips, sideTwoShips, UIRefresh };
