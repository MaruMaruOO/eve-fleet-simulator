// @flow
/* global */
import React from 'react';
import ReactDOM from 'react-dom';
import './../semantic_theming/semantic.less';

import './css/progress_overides.css';

import ShipData from './ship_data_class';

import pageIcon from './eve_icons/page_icon.ico';

import FleetSimAndShips from './react_components/fleet_sim_and_ships';
import TopNavBar from './react_components/top_nav_bar';
import AddOrRemoveFits from './react_components/add_or_remove_fits';
import AboutPage from './react_components/about_page';

import type { ButtonColors } from './flow_types';

// This is the output from the previous .less file once processed and includes default semantic css
// Note if the .less file or it's dependencies change webpack will run twice.
import './css/main.css';

const documentElement: HTMLElement = document.documentElement || document.createElement('div');
const savedTheme = localStorage.getItem('efsTheme');
if (savedTheme && savedTheme.endsWith('Theme')) {
  documentElement.className = savedTheme;
} else {
  documentElement.className = 'darkTheme';
}
function PageIcon() {
  const iconLink: HTMLLinkElement = document.createElement('link');
  iconLink.href = pageIcon;
  iconLink.rel = 'icon';
  return iconLink;
}
if (document.head) {
  document.head.appendChild(PageIcon());
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
type SideShipInfo = { ship: ShipData, n: number, iconColor: ?string }
const sideOneShips: SideShipInfo[] = [];
const sideTwoShips: SideShipInfo[] = [];

const UIRefresh = () => {
  ReactDOM.render(
    <FullUI />,
    root,
  );
};

class FullUI extends React.Component<{ },
  { page: '<FleetSimAndShips />' | '<AddOrRemoveFits />' | '<AboutPage />',
    button_colors: ButtonColors }> {
  constructor(props: { }) {
    super(props);
    this.GetButtonColors = () => {
      const currentStyle: CSSStyleDeclaration = getComputedStyle(documentElement);
      const buttonColorOne = currentStyle.getPropertyValue('--semantic-button-color-one').trim();
      const buttonColorTwo = currentStyle.getPropertyValue('--semantic-button-color-two').trim();
      const buttonColorThree = currentStyle.getPropertyValue('--semantic-button-color-three').trim();
      const buttonColorFour = currentStyle.getPropertyValue('--semantic-button-color-four').trim();
      const buttonColorFiveNoGroups = currentStyle
        .getPropertyValue('--semantic-button-color-five-no-button-groups').trim();
      const invertButtonsStr = currentStyle.getPropertyValue('--semantic-invert-buttons').trim();
      const invertButtons = invertButtonsStr === 'true';
      return [
        invertButtons, buttonColorOne, buttonColorTwo,
        buttonColorThree, buttonColorFour, buttonColorFiveNoGroups,
      ];
    };
    const initalButtonColors = this.GetButtonColors();
    this.state = { page: '<FleetSimAndShips />', button_colors: initalButtonColors };
  }
  GetButtonColors: () => ButtonColors;
  render() {
    return (
      <div style={{ height: '100%', position: 'fixed', display: 'block' }}>
        <TopNavBar fullui={this} />
        { this.state.page === '<FleetSimAndShips />' ?
          <FleetSimAndShips button_colors={this.state.button_colors} />
          : null }
        { this.state.page === '<AddOrRemoveFits />' ?
          <AddOrRemoveFits />
          : null }
        { this.state.page === '<AboutPage />' ?
          <AboutPage />
          : null }
      </div>
    );
  }
}

UIRefresh();

export { sideOneShips, sideTwoShips, UIRefresh, documentElement };
export type { FullUI, SideShipInfo };
