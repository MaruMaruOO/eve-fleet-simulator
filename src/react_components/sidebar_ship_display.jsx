// @flow
// import React from 'react';
import * as React from 'react';
import { Treebeard, decorators } from 'react-treebeard';
import 'semantic-ui-css/semantic.min.css';
import { Image, Checkbox, Header } from 'semantic-ui-react';
import type { SyntheticButtonEvent } from './../flow_types';
import treebeardStyle from './../css/treebeard_style';
import { UIRefresh } from './../index';

import ShipData from './../ship_data_class';

import { shipJSON } from './../shipJSON';
import { shipBaseJSON } from './../base_derived_stats';
import ShipDataDisplayManager from './../ship_data_display_manager';

const ships: ShipData[] = JSON.parse(shipJSON);
const baseShips: ShipData[] = JSON.parse(shipBaseJSON);
ships.forEach(s => ShipData.processing(s));
baseShips.forEach(s => ShipData.processing(s));

const ShipSizes = ['Frigate', 'Destroyer', 'Cruiser', 'Battlecruiser', 'Battleship', 'Capital', 'Industrial', 'Misc'];

const shipGroupIDNamePair: { [string]: number } = {
  Frigate: 25,
  Cruiser: 26,
  Battleship: 27,
  Industrial: 28,
  Capsule: 29,
  Titan: 30,
  Shuttle: 31,
  Corvette: 237,
  Assault_Frigate: 324,
  Heavy_Assault_Cruiser: 358,
  Deep_Space_Transport: 380,
  Elite_Battleship: 381,
  Combat_Battlecruiser: 419,
  Destroyer: 420,
  Mining_Barge: 463,
  Dreadnought: 485,
  Freighter: 513,
  Command_Ship: 540,
  Interdictor: 541,
  Exhumer: 543,
  Carrier: 547,
  Supercarrier: 659,
  Covert_Ops: 830,
  Interceptor: 831,
  Logistics: 832,
  Force_Recon_Ship: 833,
  Stealth_Bomber: 834,
  Capital_Industrial_Ship: 883,
  Electronic_Attack_Ship: 893,
  Heavy_Interdiction_Cruiser: 894,
  Black_Ops: 898,
  Marauder: 900,
  Jump_Freighter: 902,
  Combat_Recon_Ship: 906,
  Industrial_Command_Ship: 941,
  Strategic_Cruiser: 963,
  Prototype_Exploration_Ship: 1022,
  Attack_Battlecruiser: 1201,
  Blockade_Runner: 1202,
  Expedition_Frigate: 1283,
  Tactical_Destroyer: 1305,
  Logistics_Frigate: 1527,
  Command_Destroyer: 1534,
  Force_Auxiliary: 1538,
};

const shipSubCatagories: { [string]: number[] } = {
  Frigate: [25, 31, 237, 324, 830, 831, 834, 893, 1283, 1527],
  Destroyer: [420, 541, 1305, 1534],
  Cruiser: [26, 358, 832, 833, 894, 906, 963],
  Battlecruiser: [419, 540, 1201],
  Battleship: [27, 381, 898, 900],
  Capital: [30, 485, 513, 547, 659, 883, 902, 1538],
  Industrial: [28, 380, 1202, 463, 543, 941],
  Misc: [29, 1022],
};

class SidebarShipNode {
  name: string;
  checked: boolean;
  indeterminate: boolean;
  nodeId: number;
  typeID: ?number = undefined;
  children: ?SidebarShipNode[] = undefined;
  parentNodeIdChain: number[];
  invisible: boolean = false;
  typeData: ?ShipData;
  fitData: ?ShipData;
  toggled: ?boolean;
  active: ?boolean;
  constructor(
    name: string, nodeId: number, parentNodeIdChain: number[],
    typeID: ?number, children: ?SidebarShipNode[],
  ) {
    this.name = name;
    this.checked = false;
    this.indeterminate = false;
    this.nodeId = nodeId;
    this.parentNodeIdChain = parentNodeIdChain;
    if (typeID) {
      this.typeID = typeID;
    }
    if (children) {
      this.children = children;
    }
  }
}

function getShipFitData(shipTypeId: number, parentNodeIdChain: number[]) {
  const shipFits = ships.filter(ship => ship.typeID === shipTypeId);
  const fitDataSet = [];
  const blankFit = new SidebarShipNode('blank', Math.random(), parentNodeIdChain);
  blankFit.invisible = true;
  fitDataSet.push(blankFit);
  for (const shipFit of shipFits) {
    const fitData = new SidebarShipNode(
      shipFit.name, Math.random(),
      parentNodeIdChain, shipFit.typeID,
    );
    fitData.fitData = shipFit;
    fitDataSet.push(fitData);
  }
  return fitDataSet;
}

function getShipTypeData(shipClass: string, parentNodeIdChain: number[]) {
  const groupID = shipGroupIDNamePair[shipClass];
  const shipsOfType = baseShips.filter(ship => ship.groupID === groupID);
  const typeDataSet = [];
  for (const shipType of shipsOfType) {
    shipType.shipGroup = shipClass.replace(/_/g, ' ');
    const id = Math.random();
    const fitData = getShipFitData(shipType.typeID, [...parentNodeIdChain, id]);
    const nameInput = fitData.length > 1 ? `${shipType.name} (${fitData.length - 1})` : shipType.name;
    const typeData = new SidebarShipNode(
      nameInput, id,
      parentNodeIdChain, shipType.typeID, undefined,
    );
    if (fitData.length > 0) {
      typeData.children = fitData;
    }
    typeDataSet.push(typeData);
  }
  return typeDataSet;
}

function getShipClassData(size: string, parentNodeIdChain: number[]) {
  const sizeDataSet = [];
  const groupEntries: [string, mixed][] = Object.entries(shipGroupIDNamePair);
  const classes = shipSubCatagories[size].map((id) => {
    const ind = groupEntries.findIndex(e => e[1] === id);
    return groupEntries[ind][0];
  });
  for (const shipClass of classes) {
    const id = Math.random();
    const typeData = getShipTypeData(shipClass, [...parentNodeIdChain, id]);
    const classData = new SidebarShipNode(
      shipClass.replace(/_/g, ' '), id,
      parentNodeIdChain, undefined, undefined,
    );
    if (typeData.length > 0) {
      classData.children = typeData;
    }
    sizeDataSet.push(classData);
  }
  return sizeDataSet;
}

function getHullSizeData() {
  const shipDataSet = [];
  for (const size of ShipSizes) {
    const id = Math.random();
    const classData = getShipClassData(size, [id]);
    const sizeData = new SidebarShipNode(size, id, [], undefined, undefined);
    if (classData.length > 0) {
      sizeData.children = classData;
    }
    shipDataSet.push(sizeData);
  }
  return shipDataSet;
}

const data = getHullSizeData();

function getNodeByIdChain(id: number[]) {
  let currentNode = data.filter(n => n.nodeId === id[0])[0];
  for (let i = 1; i < id.length; i += 1) {
    if (currentNode.children) {
      [currentNode] = currentNode.children.filter(n => n.nodeId === id[i]);
    }
  }
  return currentNode;
}

function setParentsIndeterminate(parentIdChain) {
  if (parentIdChain.length === 0) {
    return;
  }
  for (let i = parentIdChain.length; i > 0; i -= 1) {
    const parent = getNodeByIdChain(parentIdChain.slice(0, i));
    if (parent.children && parent.children.every(n => n.checked)) {
      parent.checked = true;
      parent.indeterminate = false;
    } else {
      parent.checked = false;
    }
    if (!parent.checked && parent.children) {
      if (!parent.children.some(n => n.checked || n.indeterminate)) {
        parent.indeterminate = false;
      } else {
        parent.indeterminate = true;
      }
    }
  }
}

function syncDataNode(dataNode, node) {
  if (node.checked !== null) {
    dataNode.checked = node.checked;
  }
  dataNode.indeterminate = node.indeterminate;
  if (dataNode.children && !dataNode.indeterminate) {
    for (const child of dataNode.children) {
      syncDataNode(child, dataNode);
    }
  }
}

function setDataCheckedSource(node: SidebarShipNode, checkBoxAdditionalToggle: boolean) {
  const dataNode = node.parentNodeIdChain && node.parentNodeIdChain.length > 0 ?
    getNodeByIdChain([...node.parentNodeIdChain, node.nodeId]) :
    getNodeByIdChain([node.nodeId]);
  syncDataNode(dataNode, node);
  if (dataNode.parentNodeIdChain) {
    setParentsIndeterminate(dataNode.parentNodeIdChain);
  }
  if (checkBoxAdditionalToggle) {
    dataNode.toggled = !dataNode.toggled;
  }
}

function updateIsDisplayModeFit() {
  const groupLevelNodes = data.filter(s => s.checked || s.indeterminate)
    .reduce((t: SidebarShipNode[], c) => (c.children ? [...t, ...c.children] : t), []);
  const shipTypeSet = groupLevelNodes.filter(s => s.checked || s.indeterminate)
    .reduce((t, c) => (c.children ? [...t, ...c.children] : t), []);
  if (shipTypeSet.filter(s => s.checked).length > 1) {
    ShipDataDisplayManager.isDisplayModeFit = false;
  } else {
    const shipFitSet = shipTypeSet.filter(s => s.checked || s.indeterminate)
      .reduce((t, c) => (c.children ? [...t, ...c.children] : t), []);
    if (shipFitSet.filter(s => s.checked).length > 0) {
      ShipDataDisplayManager.isDisplayModeFit = true;
    } else {
      ShipDataDisplayManager.isDisplayModeFit = false;
    }
  }
}

function checkboxClickEvent(
  event: SyntheticButtonEvent,
  props: {checked: boolean, node: SidebarShipNode},
) {
  props.node.toggled = !props.node.toggled;
  if (!props.node.children) {
    props.node.checked = props.checked;
    props.checked = props.node.checked;
    // Note this is used to force childless nodes to update the checkbox visually
    props.node.name = props.node.name.endsWith(' ') ? props.node.name.trim() : `${props.node.name} `;
    setDataCheckedSource(props.node, true);
    updateIsDisplayModeFit();
    UIRefresh();
    return;
  } else if (props.node.children) {
    const chil = props.node.children;
    props.node.checked = props.checked;
    setDataCheckedSource(props.node, true);
    if (chil) {
      for (const child of chil) {
        child.checked = props.checked;
      }
    }
  }
  updateIsDisplayModeFit();
  UIRefresh();
}

type headType = {style: Node, node: SidebarShipNode} => React.Node;
const headerFunction: headType = ({ style, node }: {style: Node, node: SidebarShipNode}) => {
  if (node.invisible) {
    return <div />;
  }
  if (node.children) {
    if (node.children.every(n => n.checked)) {
      node.checked = true;
      node.indeterminate = false;
    } else {
      node.checked = false;
    }
    setDataCheckedSource(node, false);
    setParentsIndeterminate(node.parentNodeIdChain);
  }
  const shipImageStyle = { marginRight: '5px', marginTop: '4px', marginBottom: '4px' };
  const baseStyle = {
    display: 'inline-block',
    color: '#9DA5AB',
    margin: '0em 0em 0em 0em',
  };
  const checkBoxStyle = {
    display: 'flex',
    position: 'absolute',
    color: '#9DA5AB',
    alignSelf: 'center',
    left: '100%',
    top: '50%',
    transform: 'translate(-115%, -50%)',
  };
  const header = (
    <div style={baseStyle} width="100%">
      <div style={style.title ? style.title : ''}>
        <div style={{ margin: '0em 2.5em 0em 0.25em' }}>
          {node.typeID ? (<Image
            style={shipImageStyle}
            inline
            centered={false}
            circular
            size="mini"
            src={`./../../February2018Release_1.0_Renders/Renders/${node.typeID.toString()}.png`}
          />) : ''}
          {node.name}
        </div>
        <Checkbox
          label=""
          checked={node.checked}
          indeterminate={node.indeterminate}
          style={checkBoxStyle}
          node={node}
          onClick={checkboxClickEvent}
        />
      </div>
    </div>
  );
  return header;
};
decorators.Header = headerFunction;


type Props = {};
type State = {cursor: ?SidebarShipNode};
class ShipTree extends React.Component<Props, State> {
  constructor(props: {}) {
    super(props);
    this.state = { cursor: null };
  }
  onToggle = (node: SidebarShipNode, toggled: boolean) => {
    if (this.state.cursor) { this.state.cursor.active = false; }
    node.active = true;
    if (node.children) { node.toggled = toggled; }
    this.setState({ cursor: node });
  }
  render() {
    return (
      <Treebeard
        data={data}
        decorators={decorators}
        style={treebeardStyle}
        onToggle={this.onToggle}
      />
    );
  }
}

function SidebarShipDisplay() {
  return (
    <React.Fragment>
      <Header
        style={{
          backgroundColor: 'rgb(180, 180, 180)',
          paddingBottom: '0.75rem',
          paddingTop: '0.75rem',
          marginBottom: '0.75rem',
          marginTop: '0em',
          display: 'block',
          width: '100%',
          //maxHeight: '10%',
        }}
        textAlign="center"
        attached="top"
        block
        size="huge"
      >
        Ship Display Selector
      </Header>
      <div style={{
        width: 'auto',
        display: 'inline-block',
        position: 'relative',
        minHeight: '90%',
        alignSelf: 'top',
        verticalAlign: 'top',
        paddingRight: '1em',
        paddingLeft: '1em',
        textAlign: 'left',
      }}
      >
        <ShipTree />
      </div>
    </React.Fragment>
  );
}

export { SidebarShipDisplay, ShipSizes, SidebarShipNode, data, ships, baseShips };
