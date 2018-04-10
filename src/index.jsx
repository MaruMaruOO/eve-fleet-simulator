// @flow
/* global */
import React from 'react';
import ReactDOM from 'react-dom';
import 'semantic-ui-css/semantic.min.css';
import {
  Menu, Image, Icon, Form, Message, Divider, Dimmer,
  Container, Grid, Dropdown, Segment, Header, Button,
} from 'semantic-ui-react';

import './css/progress_overides.css';
import './css/fit_list.css';
import './css/full_ui.css';

import ShipData from './ship_data_class';

import mainRifterIcon from './eve_icons/tabFittingsHorizontal.png';

import ShipAndFitCards from './react_components/ship_and_fit_cards';
import { SidebarShipDisplay, ships } from './react_components/sidebar_ship_display';
import SidebarShipDisplaySettings from './react_components/sidebar_ship_display_settings';
import FleetAndCombatSimulator from './react_components/fleet_and_combat_simulator';
import ShipDataDisplayManager from './ship_data_display_manager';

import type {
  ButtonColors, SyntheticDropdownEvent, SyntheticButtonEvent,
  SyntheticInputEvent,
} from './flow_types';

const documentElement: HTMLElement = document.documentElement || document.createElement('div');
const savedTheme = localStorage.getItem('effsTheme');
if (savedTheme && savedTheme.endsWith('Theme')) {
  documentElement.className = savedTheme;
} else {
  documentElement.className = 'darkTheme';
}
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

type UploadFitsState = {
  fitData: string, addedFits: string, parseFailure: boolean,
  localShipData: { key: number, text: string, value: string }[], deleteSelection: string,
  deleteAllCheck: boolean,
};
class UploadFits extends React.Component<{ }, UploadFitsState> {
  constructor(props: { }) {
    super(props);
    this.updateLocalShipDropdown = () => {
      const localFits: ShipData[] = JSON.parse(localStorage.getItem('effsLocalShipData') || '[]');
      return localFits.map((s, i) => ({ key: i, text: s.name, value: i.toString() }));
    };
    this.state = {
      fitData: '',
      addedFits: '',
      parseFailure: false,
      localShipData: this.updateLocalShipDropdown(),
      deleteSelection: '',
      deleteAllCheck: false,
    };
  }
  updateLocalShipDropdown;
  handleChange = (e: SyntheticInputEvent, { value }: { value: string }) => {
    this.setState({ fitData: value });
  };
  deleteFit = (e: SyntheticButtonEvent, { value }: { value: ?string }) => {
    const localFits: ShipData[] = JSON.parse(localStorage.getItem('effsLocalShipData') || '[]');
    const ind: number = Number(value !== '' ? value : NaN);
    if (!Number.isNaN(ind)) {
      const [{ name }] = localFits.splice(ind, 1);
      localStorage.setItem('effsLocalShipData', JSON.stringify(localFits));
      this.setState({
        localShipData: this.updateLocalShipDropdown(),
        deleteSelection: `Successfully deleted ${name}`,
      });
    }
  };
  deleteDropdownChange = (e: SyntheticDropdownEvent, { value }: { value: string }) => {
    this.setState({ deleteSelection: value });
  };
  checkDeleteAll = () => this.setState({ deleteAllCheck: true });
  cancelDeleteAll = () => this.setState({ deleteAllCheck: false });
  wipeLocalFits = () => {
    localStorage.setItem('effsLocalShipData', JSON.stringify([]));
    this.setState({
      localShipData: this.updateLocalShipDropdown(),
      deleteSelection: 'All local fits have been successfully deleted',
      deleteAllCheck: false,
    });
  };
  addShipFitData = (e: SyntheticButtonEvent, data: { value: string }) => {
    let submittedShipData = data.value.trim();
    if (!submittedShipData.endsWith(']')) {
      submittedShipData += ']';
    }
    if (!submittedShipData.startsWith('[')) {
      submittedShipData = `[${submittedShipData}`;
    }
    if (submittedShipData.endsWith('},]')) {
      submittedShipData = submittedShipData.replace('},]', '}]');
    }
    const previousShipData: ShipData[] =
      JSON.parse(localStorage.getItem('effsLocalShipData') || '[]');
    try {
      const submittedArray: ShipData[] = JSON.parse(submittedShipData);
      const newShipData = previousShipData.length > 0 ?
        [...previousShipData, ...submittedArray] : [...submittedArray];
      const newShipDataStr = JSON.stringify(newShipData);
      submittedArray.forEach(shipData => ShipData.processing(shipData));
      submittedArray.forEach(shipData => ships.push(shipData));
      const newShipNum = submittedArray.length;
      let addedFitsStr: string = '';
      if (newShipNum > 1) {
        addedFitsStr = `${newShipNum.toString()} fits`;
      } else {
        addedFitsStr = ` ${submittedArray[0].shipType || 'unknown'} fit`;
      }
      localStorage.setItem('effsLocalShipData', newShipDataStr);
      this.setState({
        fitData: '',
        addedFits: addedFitsStr,
        parseFailure: false,
        localShipData: this.updateLocalShipDropdown(),
      });
    } catch (err) {
      this.setState({ fitData: '', addedFits: '', parseFailure: true });
    }
  };
  render() {
    const {
      fitData, addedFits, parseFailure, localShipData, deleteSelection, deleteAllCheck,
    } = this.state;
    return (
      <div style={{
        height: '100%',
        width: '100%',
        top: '0%',
        position: 'fixed',
        paddingTop: 'calc(0.92857143em * 1.14285714 * 2 + 1.6em + 32.2344px)',
        overflowY: 'auto',
      }}
      >
        <Container className="pageContainer">
          <Header as="h5" attached="top">
            Add Fits
          </Header>
          <Segment attached>
            <Form success={addedFits.length > 0} error={parseFailure}>
              <Form.TextArea
                value={fitData}
                onChange={this.handleChange}
                label="Fit Data"
                placeholder="Paste Fit Data"
              />
              <Message
                success
                header={`Successfully added ${addedFits}`}
              />
              <Message
                error
                header="Unable to parse fit information"
                content="Make sure to use the data exactly as provided by pyfa's effs format."
              />
              <Form.Button value={fitData} onClick={this.addShipFitData}>
                Submit
              </Form.Button>
            </Form>
          </Segment>
          <Header as="h5" attached="top">
            Delete Fits
          </Header>
          <Segment attached>
            <Form success={deleteSelection.startsWith('Successfully deleted')}>
              <Form.Dropdown
                onChange={this.deleteDropdownChange}
                options={localShipData}
                placeholder="Select fit"
                label="Delete a single fit"
                inline
              />
              <Message
                success
                header={deleteSelection}
              />
              <Form.Button value={deleteSelection} onClick={this.deleteFit}>
                Delete fit
              </Form.Button>
            </Form>
            <Divider />
            <Form success={deleteSelection.startsWith('All local fits')}>
              <Message
                success
                header={deleteSelection}
              />
              <Form.Button
                negative
                content="Delete all"
                onClick={this.checkDeleteAll}
                label="Delete all local fits"
              />
              <Dimmer
                active={deleteAllCheck}
                onClickOutside={this.cancelDeleteAll}
                page
              >
                <Header as="h3" icon inverted>
                  This will permenently delete all locally stored ship fits
                </Header>
                <br />
                <Button.Group>
                  <Button
                    content="Cancel"
                    onClick={this.cancelDeleteAll}
                  />
                  <Button
                    negative
                    content="Confirm delete all"
                    onClick={this.wipeLocalFits}
                  />
                </Button.Group>
              </Dimmer>
            </Form>
          </Segment>
        </Container>
      </div>
    );
  }
}

function TopMenu(props: { fullui: FullUI }) {
  const themes = [
    {
      key: '1',
      text: (<div><Icon name="square" style={{ color: 'rgba(17,19,21,1)' }} /> Dark</div>),
      value: 'darkTheme',
    },
    {
      key: '2',
      text: (<div><Icon name="square" style={{ color: 'rgba(252, 252, 252, 1)' }} /> Light</div>),
      value: 'lightTheme',
    },
    {
      key: '3',
      text: (<div><Icon name="square" style={{ color: 'rgb(5, 55, 55)' }} /> Shipwrecked</div>),
      value: 'shipwreckedTheme',
    },
    {
      key: '4',
      text: (<div><Icon name="square" style={{ color: 'rgb(180, 180, 180)' }} /> Default</div>),
      value: 'defaultTheme',
    },
  ];
  const themeChange = (
    e: SyntheticDropdownEvent,
    objData: { value: 'darkTheme' | 'lightTheme' | 'shipwreckedTheme' | 'defaultTheme' },
  ) => {
    const newTheme = objData.value;
    documentElement.className = newTheme;
    localStorage.setItem('effsTheme', newTheme);
  };
  const pageChange = (
    e: SyntheticButtonEvent,
    data: { fullui: FullUI, page: '<FleetAndFits />' | '<UploadFits />', fitmode: ?('true' | 'false') },
  ) => {
    if (data.fitmode !== undefined) {
      ShipDataDisplayManager.isDisplayModeFit = data.fitmode === 'true';
    }
    data.fullui.setState({ page: data.page });
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
        <Menu.Item as="a" fullui={props.fullui} fitmode="false" page="<FleetAndFits />" onClick={pageChange}>Ships</Menu.Item>
        <Menu.Item as="a" fullui={props.fullui} fitmode="true" page="<FleetAndFits />" onClick={pageChange}>Fleet Simulator</Menu.Item>
        <Menu.Item as="a" fullui={props.fullui} page="<UploadFits />" onClick={pageChange}>Upload Fits</Menu.Item>
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
            defaultValue={documentElement.className}
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
class FullUI extends React.Component<{ }, { page: '<FleetAndFits />' | '<UploadFits />' }> {
  constructor(props: { }) {
    super(props);
    this.state = { page: '<FleetAndFits />' };
  }
  render() {
    return (
      <div style={{ height: '100%', position: 'fixed', display: 'block' }}>
        <TopMenu fullui={this} />
        {this.state.page === '<FleetAndFits />' ? <FleetAndFits /> : <UploadFits />}
      </div>
    );
  }
}
class FleetAndFits extends React.Component<{ },
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
            { (!this.state.showSidebar || !this.state.narrowScreen)
                && ShipDataDisplayManager.isDisplayModeFit ?
                  <FleetAndCombatSimulator
                    narrowScreen={this.state.narrowScreen}
                    buttonColors={this.state.buttonColors}
                  /> : ''
            }
            <ShipAndFitDisplay noTopMargin={this.state.narrowScreen && this.state.showSidebar} />
          </Grid.Column>
        </Grid>
      </div>
    );
  }
}

UIRefresh();

export { sideOneShips, sideTwoShips, UIRefresh };
