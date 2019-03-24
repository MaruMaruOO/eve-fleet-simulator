// @flow

import React from 'react';
import {
  Menu, Image, Icon,
  Container, Dropdown,
} from 'semantic-ui-react';

import mainRifterIcon from './../eve_icons/mainRifterIcon.png';

import ShipDataDisplayManager from './../ship_data_display_manager';
import SaveLoadDropdown from './save_load_dropdown';
import { UIRefresh } from './../index';
import type { FullUI } from './../index';

import type { SyntheticDropdownEvent, SyntheticButtonEvent, ButtonColors } from './../flow_types';

const documentElement: HTMLElement = document.documentElement || document.createElement('div');

function TopNavBar(props: { fullui: FullUI }) {
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
      text: (<div><Icon name="square" style={{ color: 'rgb(180, 180, 180)' }} /> Default</div>),
      value: 'defaultTheme',
    },
  ];
  const themeChange = (
    e: SyntheticDropdownEvent,
    objData: { fullui: FullUI, value: 'darkTheme' | 'lightTheme' | 'defaultTheme' },
  ) => {
    const newTheme = objData.value;
    documentElement.className = newTheme;
  };
  const updateUiTheming = (
    e: SyntheticDropdownEvent,
    objData: { fullui: FullUI, value: 'darkTheme' | 'lightTheme' | 'defaultTheme' },
  ) => {
    localStorage.setItem('efsTheme', documentElement.className);
    const colors: ButtonColors = objData.fullui.GetButtonColors();
    objData.fullui.setState({ button_colors: colors });
  };
  const pageChange = (
    e: SyntheticButtonEvent,
    data: { fullui: FullUI, page: '<FleetSimAndShips />' | '<AddOrRemoveFits />' | '<AboutPage />',
            fitmode: ?('true' | 'false') },
  ) => {
    if (data.fitmode !== undefined) {
      ShipDataDisplayManager.isDisplayModeFit = data.fitmode === 'true';
      ShipDataDisplayManager.shipDisplaySort = ShipDataDisplayManager.shipTypeDataTypes[0].getter;
      ShipDataDisplayManager.shipDisplaySortName = 'default';
    }
    data.fullui.setState({ page: data.page });
    UIRefresh();
  };
  return (
    <Menu
      secondary
      pointing
      inverted
      style={{
        top: '0%', left: '0%', right: '0%', position: 'fixed', zIndex: '1',
      }}
    >
      <Container >
        <Menu.Menu position="left">
          <Menu.Item fitted style={{ padding: '0px', height: '100%' }}>
            <Image src={mainRifterIcon} size="mini" />
          </Menu.Item>
          <Menu.Item header fitted="vertically" >
            Eve Fleet Simulator
          </Menu.Item>
          <Menu.Item
            as="a"
            active={props.fullui.state.page === '<FleetSimAndShips />' && !ShipDataDisplayManager.isDisplayModeFit}
            fullui={props.fullui}
            fitmode="false"
            page="<FleetSimAndShips />"
            onClick={pageChange}
          >
            Ships
          </Menu.Item>
          <Menu.Item
            as="a"
            active={props.fullui.state.page === '<FleetSimAndShips />' && ShipDataDisplayManager.isDisplayModeFit}
            fullui={props.fullui}
            fitmode="true"
            page="<FleetSimAndShips />"
            onClick={pageChange}
          >
            Fleet Simulator
          </Menu.Item>
          <Menu.Item
            as="a"
            active={props.fullui.state.page === '<AddOrRemoveFits />'}
            fullui={props.fullui}
            page="<AddOrRemoveFits />"
            onClick={pageChange}
          >
            Upload Fits
          </Menu.Item>
          <SaveLoadDropdown fullui={props.fullui} />
        </Menu.Menu>
        <Menu.Menu position="right">
          <Menu.Item
            as="a"
            active={props.fullui.state.page === '<AboutPage />'}
            fullui={props.fullui}
            page="<AboutPage />"
            onClick={pageChange}
          >
            About
          </Menu.Item>
          <Dropdown
            className="link item"
            onChange={themeChange}
            onClose={updateUiTheming}
            fullui={props.fullui}
            options={themes}
            pointing
            defaultValue={documentElement.className}
          />
        </Menu.Menu>
      </Container>
    </Menu>);
}

export default TopNavBar;
