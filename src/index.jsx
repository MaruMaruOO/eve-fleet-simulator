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

import mainRifterIcon from './eve_icons/tabFittingsHorizontal.png';

import ShipAndFitCards from './react_components/ship_and_fit_cards';
import { SidebarShipDisplay } from './react_components/sidebar_ship_display';
import SidebarShipDisplaySettings from './react_components/sidebar_ship_display_settings';
import FleetAndCombatSimulator from './react_components/fleet_and_combat_simulator';

import type { ButtonColors, SyntheticDropdownEvent } from './flow_types';


const documentElement: HTMLElement = document.documentElement || document.createElement('div');
documentElement.className = 'darkTheme';
const root: HTMLElement = document.getElementById('root') || document.createElement('div');
// Adjust root and body fontSize when displaying on a small screen. Scales most things.
if (root.clientWidth < 1920 && root.clientWidth > 1200) {
  const newFontSize = `${Math.max(14 * (root.clientWidth / 1920), 11).toFixed(0)}px`;
  if (documentElement) {
    documentElement.style.fontSize = newFontSize;
  }
  if (document.body) {
    document.body.style.fontSize = newFontSize;
  }
}
const sideOneShips: { ship: ShipData, n: number }[] = [];
const sideTwoShips: { ship: ShipData, n: number }[] = [];

const UIRefresh = () => {
  ReactDOM.render(
    <FullUI />,
    root,
  );
};

function TopMenu() {
  const themes = [
    {
      key: '1',
      text: (<div><Icon name="square" bordered style={{ color: 'rgba(17,19,21,1)' }} /> Dark</div>),
      value: 'darkTheme',
    },
    {
      key: '2',
      text: (<div><Icon name="square" bordered style={{ color: 'rgba(252, 252, 252, 1)' }} /> Light</div>),
      value: 'lightTheme',
    },
    {
      key: '3',
      text: (<div><Icon name="square" bordered style={{ color: 'rgb(5, 55, 55)' }} /> Shipwrecked</div>),
      value: 'shipwreckedTheme',
    },
    {
      key: '4',
      text: (<div><Icon name="square" bordered style={{ color: 'rgb(180, 180, 180)' }} /> Default</div>),
      value: 'defaultTheme',
    },
  ];
  const themeChange = (
    e: SyntheticDropdownEvent,
    objData: { value: 'darkTheme' | 'lightTheme' | 'shipwreckedTheme' | 'defaultTheme' },
  ) => {
    const newTheme = objData.value;
    documentElement.className = newTheme;
    UIRefresh();
  };
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
          <Dropdown
            className="link item"
            onChange={themeChange}
            options={themes}
            pointing
            defaultValue="darkTheme"
          />
        </Menu.Menu>
      </Container>
    </Menu>);
}

function SidebarContent(props: { buttonColors: ButtonColors }) {
  return (
    <Grid columns="1" stretched centered>
      <Grid.Row className="sidebarShipDisplayRow">
        <SidebarShipDisplay />
      </Grid.Row>
      <SidebarShipDisplaySettings buttonColors={props.buttonColors} />
    </Grid>
  );
}

function ShipAndFitDisplay(props: { noTopMargin: boolean }) {
  return (
    <div className={props.noTopMargin ? 'shipDisplay shipDisplayNoTopMargin' : 'shipDisplay'}>
      <ShipAndFitCards />
    </div>
  );
}

class FullUI extends React.Component<{ },
  { showSidebar: boolean, narrowScreen: boolean, buttonColors: ButtonColors }> {
  constructor(props: { }) {
    super(props);
    const currentStyle: CSSStyleDeclaration = getComputedStyle(documentElement);
    const buttonColorOne = currentStyle.getPropertyValue('--semantic-button-color-one');
    const buttonColorTwo = currentStyle.getPropertyValue('--semantic-button-color-two');
    const buttonColorThree = currentStyle.getPropertyValue('--semantic-button-color-three');
    const buttonColorFour = currentStyle.getPropertyValue('--semantic-button-color-four');
    const buttonColorFiveNoGroups = currentStyle
      .getPropertyValue('--semantic-button-color-five-no-button-groups');
    const invertButtonsStr = currentStyle.getPropertyValue('--semantic-invert-buttons');
    const invertButtons = invertButtonsStr === 'true';
    const initalButtonColors: ButtonColors = [
      invertButtons, buttonColorOne, buttonColorTwo,
      buttonColorThree, buttonColorFour, buttonColorFiveNoGroups,
    ];
    this.state = {
      showSidebar: true, narrowScreen: root.clientWidth < 1200, buttonColors: initalButtonColors,
    };
  }
  toggleSidebar = () => {
    this.setState(prevState => ({ showSidebar: !prevState.showSidebar }));
  }
  render() {
    const sideBarIfAny = this.state.showSidebar ? (
      <Grid.Column
        className="sidebarColumn"
        key={0}
        width={this.state.narrowScreen ? 6 : 3}
      >
        <SidebarContent buttonColors={this.state.buttonColors} />
      </Grid.Column>
    ) : '';
    let combatAndShipDisplayWidth = 16;
    if (this.state.showSidebar) {
      combatAndShipDisplayWidth = this.state.narrowScreen ? 10 : 13;
    }
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
            <Grid.Column
              className="combatAndShipDisplay"
              key={1}
              width={combatAndShipDisplayWidth}
            >
              <div className="sidebarToggleDiv">
                <Icon
                  name={this.state.showSidebar ? 'chevron left' : 'chevron right'}
                  size="big"
                  link
                  onClick={this.toggleSidebar}
                />
              </div>
              { !this.state.showSidebar || !this.state.narrowScreen ?
                <FleetAndCombatSimulator
                  narrowScreen={this.state.narrowScreen}
                  buttonColors={this.state.buttonColors}
                /> : ''
              }
              <ShipAndFitDisplay noTopMargin={this.state.narrowScreen && this.state.showSidebar} />
            </Grid.Column>
          </Grid>
        </div>
      </div>
    );
  }
}

UIRefresh();

export { sideOneShips, sideTwoShips, UIRefresh };
