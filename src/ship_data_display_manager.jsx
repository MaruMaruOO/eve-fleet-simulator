// @flow
import React from 'react';
// import ReactDOM from 'react-dom';
import 'semantic-ui-css/semantic.min.css';
import { Button, Image, Progress } from 'semantic-ui-react';
import './css/progress_overides.css';
import './css/fit_list.css';
import './css/stat_display_icon.css';

import shieldIcon from './eve_icons/2_64_4.png';
import armorIcon from './eve_icons/1_64_9.png';
import hullIcon from './eve_icons/2_64_12.png';
import powerIcon from './eve_icons/pg_icon.png';
import highSlotIcon from './eve_icons/filterIconHighSlot.png';
import midSlotIcon from './eve_icons/filterIconMediumSlot.png';
import lowSlotIcon from './eve_icons/filterIconLowSlot.png';
import launcherIcon from './eve_icons/21_64_16.png';
import turretIcon from './eve_icons/13_64_7.png';
import sigRadiusIcon from './eve_icons/22_32_14.png';
import optimalRangeIcon from './eve_icons/74_64_10.png';

import velocityIcon from './eve_icons/3_64_2.png';
import droneIcon from './eve_icons/drones.png';

import ShipData from './ship_data_class';
import { GetMaxEHP } from './base_derived_stats';
import { SidebarShipNode } from './react_components/sidebar_ship_display';
import { UIRefresh } from './index';
import type {
  ShipSize, ModuleQualityValue,
  SyntheticButtonEvent,
} from './flow_types';

class ShipTypeDataType {
  name: string;
  isBar: boolean;
  isIcon: boolean;
  icon: string;
  color: string;
  label: string;
  text: string;
  visable: boolean = true;
  max: number = 0;
  key: string;
  getter: (ShipData) => number;
  constructor(
    getterFunction: (ShipData) => number, name: string,
    isBar: boolean, isIcon: boolean, icon: string, color: string,
    label: string, text: string, visable: ?boolean,
  ) {
    this.name = name;
    this.isBar = isBar;
    this.isIcon = isIcon;
    this.icon = icon;
    this.color = color;
    this.label = label;
    this.text = text;
    if (visable) {
      this.visable = visable;
    }
    this.key = name;
    this.getter = getterFunction;
  }
}

class ShipFitDataType extends ShipTypeDataType {
}

class ShipDataDisplayManager {
  static shipTypeDataTypes = [
    new ShipTypeDataType(() => 0, 'default', false, false, '', '', '', '', false),
    new ShipTypeDataType(ShipData.getMaxSpeed, 'maxSpeed', true, false, velocityIcon, 'blue', 'm/s', 'Max Velocity'),
    new ShipTypeDataType(ShipData.getEffectiveLaunchers, 'effectiveLaunchers', true, false, launcherIcon, 'orange', '', 'Effective Launchers'),
    new ShipTypeDataType(ShipData.getEffectiveTurrets, 'effectiveTurrets', true, false, turretIcon, 'red', '', 'Effective Turrets'),
    new ShipTypeDataType(ShipData.getEffectiveDroneBandwidth, 'effectiveDroneBandwidth', true, false, droneIcon, 'violet', 'mbit/s', 'Effective Drone Bandwidth'),
    new ShipTypeDataType(ShipData.getMaxShieldEHP, 'maxShieldEHP', true, false, shieldIcon, 'teal', 'EHP', 'Max Shield EHP'),
    new ShipTypeDataType(ShipData.getMaxArmorEHP, 'maxArmorEHP', true, false, armorIcon, 'green', 'EHP', 'Max Armor EHP'),
    new ShipTypeDataType(ShipData.getMaxHullEHP, 'maxHullEHP', true, false, hullIcon, 'brown', 'EHP', 'Max Hull EHP'),
    new ShipTypeDataType(ShipData.getPowerOutput, 'powerOutput', true, false, powerIcon, 'olive', 'MW', 'Power Grid'),
    new ShipTypeDataType(ShipData.getSignatureRadius, 'signatureRadius', true, false, sigRadiusIcon, 'purple', 'm', 'Signature Radius'),
    new ShipTypeDataType(ShipData.getHighSlots, 'highSlots', false, true, highSlotIcon, 'grey', '', 'High Slots'),
    new ShipTypeDataType(ShipData.getMidSlots, 'midSlots', false, true, midSlotIcon, 'grey', '', 'Mid Slots'),
    new ShipTypeDataType(ShipData.getLowSlots, 'lowSlots', false, true, lowSlotIcon, 'grey', '', 'Low Slots'),
  ];

  static isDisplayModeFit: boolean = false;
  static shipDisplaySort: (ShipData) => number = ShipDataDisplayManager.shipTypeDataTypes[0].getter;
  static shipDisplaySortName = 'default';
  static moduleQuality: ModuleQualityValue = 1;
  static activeTank: boolean = true;
  static prevModuleQuality: ModuleQualityValue;
  static prevActiveTank: boolean;

  static dpsBarMaxValues: [ShipSize, number][] = [
    ['Frigate', 400], ['Destroyer', 600], ['Cruiser', 800], ['Battlecruiser', 1000],
    ['Battleship', 1100], ['Capital', 20000], ['Industrial', 1000], ['Misc', 1000],
  ];
  static shipFitDataTypes = [
    new ShipFitDataType(
      (s: ShipData) => {
        if (s.isFit) return s.ehp.shield + s.ehp.armor + s.ehp.hull;
        return Math.max(s.maxShieldEHP, s.maxArmorEHP, s.maxHullEHP);
      },
      'ehp', true, false, hullIcon, 'green', 'EHP', 'Effective Hitpoints',
    ),
    new ShipFitDataType(
      (s: ShipData) => {
        if (s.isFit) return s.weaponDPS + s.droneDPS;
        const dpsPair = ShipDataDisplayManager.dpsBarMaxValues.find(e => e[0] === s.shipSize);
        return dpsPair && dpsPair.length > 0 ? dpsPair[1] : 0;
      },
      'dps', true, false, turretIcon, 'red', 'DPS', 'Damage Per Second',
    ),
    new ShipFitDataType(
      (s: ShipData) => {
        if (s.isFit) return s.maxSpeed;
        return s.maxSpeed * 7;
      },
      'maxSpeed', true, false, velocityIcon, 'blue', 'm/s', 'Velocity',
    ),
    new ShipFitDataType(
      (s: ShipData) => {
        if (!s.isFit) return Math.min(300000, s.maxTargetRange);
        if (!(s.weapons.length > 0)) return 0;
        const mainWep = s.weapons.sort((a, b) => b.dps - a.dps)[0];
        if (mainWep.optimal) return mainWep.optimal;
        return mainWep.abilities[0].optimal;
      },
      'optimal', true, false, optimalRangeIcon, 'teal', 'm', 'Weapon Optimal Ranges',
    ),
    new ShipTypeDataType(
      (s: ShipData) => {
        if (s.isFit) return s.signatureRadius;
        return 0;
      },
      'signatureRadius', true, false, sigRadiusIcon, 'purple', 'm', 'Signature Radius',
    ),
  ];

  static ReduceNodeChildren = (t: SidebarShipNode[], c: SidebarShipNode) =>
    (c.children ? [...t, ...c.children] : t);

  static SetTypeBarMaximums(shipDataSetFull: ShipData[], nodeSizeSet: SidebarShipNode[]) {
    const groupLevelNodes = nodeSizeSet.reduce(this.ReduceNodeChildren, []);
    const shipTypeSet = groupLevelNodes.reduce(this.ReduceNodeChildren, []);
    const shipDataSet = shipDataSetFull.filter(s => shipTypeSet.some(n => n.typeID === s.typeID));
    const maxEhpSettings = [this.moduleQuality, this.activeTank];
    for (const shipData of shipDataSet) {
      if (!shipData.maxShieldEHP || this.prevModuleQuality !== this.moduleQuality ||
          this.prevActiveTank !== this.activeTank) {
        shipData.maxShieldEHP = GetMaxEHP(shipData, 1, 'shield', ...maxEhpSettings);
        shipData.maxArmorEHP = GetMaxEHP(shipData, 1, 'armor', ...maxEhpSettings);
        shipData.maxHullEHP = GetMaxEHP(shipData, 1, 'hull', ...maxEhpSettings);
        this.prevModuleQuality = this.moduleQuality;
        this.prevActiveTank = this.activeTank;
      }
    }
    for (const dataType of this.shipTypeDataTypes.filter(d => d.isBar)) {
      dataType.max = 0;
      for (const data of shipDataSet) {
        if (dataType.getter(data) > dataType.max) {
          dataType.max = dataType.getter(data);
        }
      }
    }
  }

  static SetFitBarMaximums(
    shipDataSetFull: ShipData[], nodeSizeSet: SidebarShipNode[],
    shipFitDataSetFull: ShipData[],
  ) {
    const groupLevelNodes = nodeSizeSet.reduce(this.ReduceNodeChildren, []);
    const shipTypeSet = groupLevelNodes.reduce(this.ReduceNodeChildren, []);
    let shipDataSet = shipDataSetFull.filter(s => shipTypeSet.some(n => n.typeID === s.typeID));
    const maxEhpSettings = [this.moduleQuality, this.activeTank];
    for (const shipData of shipDataSet) {
      if (!shipData.maxShieldEHP || this.prevModuleQuality !== this.moduleQuality ||
          this.prevActiveTank !== this.activeTank) {
        shipData.maxShieldEHP = GetMaxEHP(shipData, 1, 'shield', ...maxEhpSettings);
        shipData.maxArmorEHP = GetMaxEHP(shipData, 1, 'armor', ...maxEhpSettings);
        shipData.maxHullEHP = GetMaxEHP(shipData, 1, 'hull', ...maxEhpSettings);
        this.prevModuleQuality = this.moduleQuality;
        this.prevActiveTank = this.activeTank;
      }
    }
    const fitDataSet = shipFitDataSetFull.filter(s => shipTypeSet.some(n => n.typeID === s.typeID));
    shipDataSet = [...shipDataSet, ...fitDataSet];
    for (const dataType of this.shipFitDataTypes.filter(d => d.isBar)) {
      dataType.max = 0;
      for (const data of shipDataSet) {
        if (dataType.getter(data) > dataType.max) {
          dataType.max = dataType.getter(data);
        }
      }
    }
  }

  static BasicVisualBar(props: {
    label: string, val: number, max: number, color: string, icon: string}) {
    let labelStr = props.label ? props.label : '';
    const capStart = labelStr.startsWith(labelStr.charAt(0).toUpperCase());
    let label;
    if (props.val > 10000) {
      labelStr = !labelStr.startsWith('m') ? ` ${labelStr}` : labelStr;
      label = `${(props.val / 1000).toFixed(2)}k${labelStr}`;
    } else {
      label = props.val.toFixed(1).toString() + (capStart ? ` ${labelStr}` : labelStr);
    }

    const ele = (
      <div width="50%" className="shipStatBarDiv" key={props.color}>
        <Image
          className="shipStatBarIcon"
          src={props.icon}
          inline
          centered={false}
          circular
          size="mini"
        />
        <Progress
          className="shipStatBarMain"
          label={label}
          size="small"
          percent={100 * (props.val / props.max)}
          color={props.color}
        />
      </div>
    );
    return ele;
  }

  static ShipTypeBarVisuals(shipData: ShipData) {
    return this.shipTypeDataTypes.filter(d => d.isBar && d.visable).map(t => this.BasicVisualBar({
      label: t.label, val: t.getter(shipData), max: t.max, color: t.color, icon: t.icon,
    }));
  }

  static SimpleStatData(props: {value: string | number, icon: string, text: string, name: string}) {
    return (
      <div key={props.name}>
        <Image src={props.icon} />
        {props.value.toString()}
      </div>
    );
  }

  static ShipTypeSimpleStatVisuals(shipData: ShipData) {
    return this.shipTypeDataTypes.filter(d => d.isIcon && d.visable).map(t => this.SimpleStatData({
      value: t.getter(shipData), icon: t.icon, text: t.text, name: t.name,
    }));
  }

  static ShipFitBarVisuals(shipData: ShipData) {
    return this.shipFitDataTypes.filter(d => d.isBar && d.visable).map(t => this.BasicVisualBar({
      label: t.label, val: t.getter(shipData), max: t.max, color: t.color, icon: t.icon,
    }));
  }

  static ShipFitSimpleStatVisuals(shipData: ShipData) {
    return this.shipFitDataTypes.filter(d => d.isIcon && d.visable).map(t => this.SimpleStatData({
      value: t.getter(shipData), icon: t.icon, text: t.text, name: t.name,
    }));
  }

  static StatDisplayIcon(dataType: ShipTypeDataType) {
    const toggleFunction = (e: SyntheticButtonEvent, dataTypeToggled: ShipTypeDataType) => {
      dataTypeToggled.visable = !dataTypeToggled.visable;
      UIRefresh();
    };
    const icon = (<Image circular className="statDisplayIconIcon" src={dataType.icon} />);
    return (<Button
      className="statDisplayIcon"
      key={dataType.name}
      onClick={(e: SyntheticButtonEvent) => toggleFunction(e, dataType)}
      active={dataType.visable}
      toggle
      circular
      icon={icon}
    />
    );
  }

  static StatDisplayIconToggles(isDisplayModeFit: boolean) {
    if (isDisplayModeFit) {
      return (
        <div>
          { this.shipFitDataTypes.filter(d => d.isBar || d.isIcon).map(this.StatDisplayIcon) }
        </div>);
    }
    return (
      <div>
        { this.shipTypeDataTypes.filter(d => d.isBar || d.isIcon).map(this.StatDisplayIcon) }
      </div>);
  }
}
export default ShipDataDisplayManager;
