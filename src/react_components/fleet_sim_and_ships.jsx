// @flow
import React from 'react';
import { Icon, Grid } from 'semantic-ui-react';

import ShipAndFitCards from './ship_and_fit_cards';
import { SidebarShipDisplay } from './sidebar_ship_display';
import SidebarShipDisplaySettings from './sidebar_ship_display_settings';
import FleetAndCombatSimulator from './fleet_and_combat_simulator';
import ShipDataDisplayManager from './../ship_data_display_manager';

import type { ButtonColors } from './../flow_types';

const root: HTMLElement = document.getElementById('root') || document.createElement('div');

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

class FleetSimAndShips extends React.Component<{ button_colors: ButtonColors },
  { showSidebar: boolean, narrowScreen: boolean }> {
  constructor(props: { button_colors: ButtonColors }) {
    super(props);
    this.state = {
      showSidebar: true, narrowScreen: root.clientWidth < 1200,
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
        <SidebarContent buttonColors={this.props.button_colors} />
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
                    buttonColors={this.props.button_colors}
                  /> : ''
            }
            <ShipAndFitDisplay noTopMargin={this.state.narrowScreen && this.state.showSidebar} />
          </Grid.Column>
        </Grid>
      </div>
    );
  }
}

export default FleetSimAndShips;
