// @flow
import React from 'react';
import { Icon, Grid } from 'semantic-ui-react';

import { ShipAndFitCards } from './ship_and_fit_cards';
import { SidebarShipDisplay } from './sidebar_ship_display';
import SidebarShipDisplaySettings from './sidebar_ship_display_settings';
import FleetAndCombatSimulator from './fleet_and_combat_simulator';
import ShipDataDisplayManager from './../ship_data_display_manager';

import type { ButtonColors, GenericSyntheticTransitionEvent } from './../flow_types';

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

function ShipAndFitDisplay(props: { noTopMargin: boolean, transitionPadding: boolean }) {
  return (
    <div
      style={props.transitionPadding ? { display: 'none' } : { }}
      className={props.noTopMargin ? 'shipDisplay shipDisplayNoTopMargin' : 'shipDisplay'}
    >
      <ShipAndFitCards transitionPadding={false} />
    </div>
  );
}

class FleetSimAndShips extends React.Component<{ button_colors: ButtonColors },
{ showSidebar: boolean, sidebarTransitioning: boolean, narrowScreen: boolean }> {
  constructor(props: { button_colors: ButtonColors }) {
    super(props);
    this.state = {
      showSidebar: true, sidebarTransitioning: false, narrowScreen: root.clientWidth < 1200,
    };
  }
  toggleSidebar = () => {
    this.setState(prevState => (
      { showSidebar: !prevState.showSidebar, sidebarTransitioning: true }
    ));
  };
  sidebarTransitionFinished = (e: GenericSyntheticTransitionEvent) => {
    if (e.propertyName === 'width' && this.state.sidebarTransitioning) {
      setTimeout(() => { this.setState({ sidebarTransitioning: false }); }, 50);
    }
  };
  render() {
    const sidebarWidth = this.state.narrowScreen ? 6 : 3;
    const sideBarIfAny = this.state.showSidebar ? (
      <Grid.Column
        style={{
          transition: 'transform .5s ease,-webkit-transform .5s ease',
          transform: 'translate3d(0%,0,0)',
        }}
        className="sidebarColumn"
        key={0}
        width={sidebarWidth}
      >
        <SidebarContent buttonColors={this.props.button_colors} />
      </Grid.Column>
    ) : (
      <Grid.Column
        style={{
          transition: 'transform .5s ease,-webkit-transform .5s ease',
          transform: 'translate3d(-100%,0,0)',
          position: 'fixed',
        }}
        className="sidebarColumn"
        key={0}
        width={sidebarWidth}
      >
        <SidebarContent buttonColors={this.props.button_colors} />
      </Grid.Column>
    );
    let combatAndShipDisplayWidth = 16;
    if (this.state.showSidebar) {
      combatAndShipDisplayWidth = 16 - sidebarWidth;
    }
    let combatAndShipDisplayStyle = { };
    if (this.state.showSidebar) {
      if (this.state.sidebarTransitioning) {
        combatAndShipDisplayStyle = {
          marginLeft: `${(6.25 * sidebarWidth).toString()}%`,
          position: 'fixed',
        };
      } else {
        combatAndShipDisplayStyle = {
          marginLeft: `${(6.25 * sidebarWidth).toString()}%`,
          position: 'fixed',
        };
      }
    } else {
      combatAndShipDisplayStyle = {
        marginLeft: '0%',
      };
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
            flexWrap: this.state.showSidebar ? 'wrap' : 'wrap-reverse',
          }}
          stretched
        >
          { sideBarIfAny }
          <Grid.Column
            className="combatAndShipDisplay"
            style={combatAndShipDisplayStyle}
            key={1}
            width={combatAndShipDisplayWidth}
            onTransitionEnd={this.sidebarTransitionFinished}
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
            <ShipAndFitDisplay
              noTopMargin={this.state.narrowScreen && this.state.showSidebar}
              transitionPadding={this.state.sidebarTransitioning}
              showSidebar={this.state.showSidebar}
            />
          </Grid.Column>
        </Grid>
      </div>
    );
  }
}

export default FleetSimAndShips;
