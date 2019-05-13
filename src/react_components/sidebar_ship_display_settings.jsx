// @flow
import React from 'react';
import {
  Button, Image,
  Container, Grid,
  Dropdown, Checkbox,
} from 'semantic-ui-react';

import ShipDataDisplayManager from './../ship_data_display_manager';
import { UIRefresh } from './../index';
import type { SyntheticDropdownEvent, ButtonColors } from './../flow_types';

import techTwoIcon from './../eve_icons/73_16_242.png';
import factionIcon from './../eve_icons/73_16_246.png';
import deadspaceIcon from './../eve_icons/73_16_247.png';

function SidebarShipDisplaySettings(props: { buttonColors: ButtonColors }) {
  const moduleQualityChange = (e: SyntheticDropdownEvent, objData: { value: '1' | '2' | '3' | '4' }) => {
    const num = Number(objData.value);
    if (num === 1 || num === 2 || num === 3 || num === 4) {
      ShipDataDisplayManager.moduleQuality = num;
      localStorage.setItem('moduleQuality', objData.value);
    }
  };
  const sortChange = (e: SyntheticDropdownEvent, objData: { value: string }) => {
    ShipDataDisplayManager.shipDisplaySortName = objData.value;
    if (ShipDataDisplayManager.isDisplayModeFit) {
      const fitData = ShipDataDisplayManager.shipFitDataTypes.find(t => t.name === objData.value);
      ShipDataDisplayManager.shipDisplaySort = fitData ? fitData.getter : () => 0;
    } else {
      const typeData = ShipDataDisplayManager.shipTypeDataTypes.find(t => t.name === objData.value);
      ShipDataDisplayManager.shipDisplaySort = typeData ? typeData.getter : () => 0;
    }
  };
  const activeTankToggle = () => {
    ShipDataDisplayManager.activeTank = !ShipDataDisplayManager.activeTank;
    localStorage.setItem('activeTank', ShipDataDisplayManager.activeTank.toString());
    UIRefresh();
  };
  const dronesEnabledToggle = () => {
    ShipDataDisplayManager.dronesEnabled = !ShipDataDisplayManager.dronesEnabled;
    localStorage.setItem('dronesEnabled', ShipDataDisplayManager.dronesEnabled.toString());
    UIRefresh();
  };
  const ammoSwapsToggle = () => {
    if (ShipDataDisplayManager.ammoSwaps === 'None') {
      ShipDataDisplayManager.ammoSwaps = 'All';
    } else if (ShipDataDisplayManager.ammoSwaps === 'Cargo') {
      ShipDataDisplayManager.ammoSwaps = 'None';
    } else if (ShipDataDisplayManager.ammoSwaps === 'All') {
      ShipDataDisplayManager.ammoSwaps = 'Cargo';
    }
    localStorage.setItem('ammoSwaps', ShipDataDisplayManager.ammoSwaps.toString());
    UIRefresh();
  };
  const isBarOrIcon = d => d.isIcon || d.isBar;
  let sortOptions;
  if (ShipDataDisplayManager.isDisplayModeFit) {
    sortOptions = ShipDataDisplayManager.shipFitDataTypes.filter(isBarOrIcon).map(t => ({
      key: t.name, icon: <Image src={t.icon} />, text: t.text, value: t.name,
    }));
  } else {
    sortOptions = ShipDataDisplayManager.shipTypeDataTypes.filter(isBarOrIcon).map(t => ({
      key: t.name, icon: <Image src={t.icon} />, text: t.text, value: t.name,
    }));
  }
  const moduleQualityOptions = [
    {
      key: '1', icon: <Image src={techTwoIcon} />, text: 'Tech 2', value: '1',
    },
    {
      key: '2', icon: <Image src={factionIcon} />, text: 'Cheapish Faction', value: '2',
    },
    {
      key: '3', icon: <Image src={deadspaceIcon} />, text: 'Cheapish Deadspace', value: '3',
    },
    {
      key: '4', icon: <Image src={deadspaceIcon} />, text: 'All Deadspace', value: '4',
    },
  ];
  const defaultModQuality = ShipDataDisplayManager.moduleQuality.toString();
  let ammoSwapState = ShipDataDisplayManager.ammoSwaps === 'All' ? 'All Ammo Swaps Enabled' : 'Ammo Swaps Disabled';
  if (ShipDataDisplayManager.ammoSwaps === 'Cargo') {
    ammoSwapState = 'Cargo Ammo Swaps Enabled';
  }
  return (
    <Grid.Row verticalAlign="bottom" stretched>
      <Container className="shipDisplaySettings">
        {ShipDataDisplayManager.StatDisplayIconToggles(ShipDataDisplayManager.isDisplayModeFit)}
        {ShipDataDisplayManager.isDisplayModeFit ?
          <div className="ui">
            <Button.Group
              className={ShipDataDisplayManager.ammoSwaps !== 'None' ?
                     props.buttonColors[1] : props.buttonColors[4]}
              inverted={props.buttonColors[0]}
            >
              <Button className="formattingButton">{ammoSwapState}
              </Button>
              <Button as="div" className="contentButton">
                <Checkbox
                  onClick={ammoSwapsToggle}
                  checked={ShipDataDisplayManager.ammoSwaps !== 'None'}
                  indeterminate={ShipDataDisplayManager.ammoSwaps === 'Cargo'}
                  toggle
                />
              </Button>
            </Button.Group>
          </div> :
          null
        }
        {!ShipDataDisplayManager.isDisplayModeFit ?
          <div className="ui">
            <Button.Group
              className={ShipDataDisplayManager.activeTank ?
                     props.buttonColors[1] : props.buttonColors[4]}
              inverted={props.buttonColors[0]}
            >
              <Button className="formattingButton">Active Tank
              </Button>
              <Button as="div" className="contentButton">
                <Checkbox
                  onClick={activeTankToggle}
                  checked={ShipDataDisplayManager.activeTank}
                  toggle
                />
              </Button>
            </Button.Group>
          </div> :
          <div className="ui">
            <Button.Group
              className={ShipDataDisplayManager.dronesEnabled ?
                     props.buttonColors[1] : props.buttonColors[4]}
              inverted={props.buttonColors[0]}
            >
              <Button className="formattingButton">
                {ShipDataDisplayManager.dronesEnabled ? 'Drones Enabled' : 'Drones Disabled'}
              </Button>
              <Button as="div" className="contentButton" onClick={dronesEnabledToggle}>
                <Checkbox
                  checked={ShipDataDisplayManager.dronesEnabled}
                  toggle
                />
              </Button>
            </Button.Group>
          </div>
        }
        {!ShipDataDisplayManager.isDisplayModeFit ?
          <div className="ui">
            <Button.Group className={props.buttonColors[3]} inverted={props.buttonColors[0]}>
              <Button className="formattingButton">Module Quality</Button>
              <Dropdown
                className="contentButton"
                onChange={moduleQualityChange}
                onClose={UIRefresh}
                options={moduleQualityOptions}
                floating
                button
                upward
                defaultValue={defaultModQuality}
              />
            </Button.Group>
          </div> :
          null
        }
        <div className="ui">
          <Button.Group className={props.buttonColors[2]} inverted={props.buttonColors[0]}>
            <Button className="formattingButton">Sort Ships by</Button>
            <Dropdown
              className="contentButton"
              onChange={sortChange}
              onClose={UIRefresh}
              options={sortOptions}
              floating
              button
              upward
              placeholder="Select option"
            />
          </Button.Group>
        </div>
      </Container>
    </Grid.Row>
  );
}

export default SidebarShipDisplaySettings;
