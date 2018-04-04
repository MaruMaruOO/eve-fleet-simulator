// @flow
import React from 'react';
import 'semantic-ui-css/semantic.min.css';
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
    }
    UIRefresh();
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
    UIRefresh();
  };
  const activeTankToggle = () => {
    ShipDataDisplayManager.activeTank = !ShipDataDisplayManager.activeTank;
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
  return (
    <Grid.Row verticalAlign="bottom" stretched>
      <Container className="shipDisplaySettings">
        {ShipDataDisplayManager.StatDisplayIconToggles(ShipDataDisplayManager.isDisplayModeFit)}
        <div className="ui">
          <Button.Group
            color={ShipDataDisplayManager.activeTank ?
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
        </div>
        <div className="ui">
          <Button.Group color={props.buttonColors[3]} inverted={props.buttonColors[0]}>
            <Button className="formattingButton">Ship type module quality</Button>
            <Dropdown
              className="contentButton"
              onChange={moduleQualityChange}
              options={moduleQualityOptions}
              floating
              button
              upward
              defaultValue="1"
            />
          </Button.Group>
        </div>
        <div className="ui">
          <Button.Group color={props.buttonColors[2]} inverted={props.buttonColors[0]}>
            <Button className="formattingButton">Sort ship types by</Button>
            <Dropdown
              className="contentButton"
              onChange={sortChange}
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
