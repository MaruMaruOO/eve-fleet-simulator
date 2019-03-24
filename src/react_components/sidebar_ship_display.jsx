// @flow
import * as React from 'react';
import { Treebeard, decorators } from 'react-treebeard';
import { Image, Checkbox, Header } from 'semantic-ui-react';
import type { SyntheticButtonEvent, SubsystemType } from './../flow_types';
import treebeardStyle from './../css/treebeard_style';
import { UIRefresh } from './../index';

import ShipData from './../ship_data_class';

import { shipJSON } from './../shipJSON';
import { shipBaseJSON } from './../base_derived_stats';
import ShipDataDisplayManager from './../ship_data_display_manager';

// Uncomment line to include all ship render icons in webpack (roughly 2.5MB for W35).
import renderIconsW35Imp from '../eve_icons/renders/renderIconsW35';

let renderIconsW35: ?{[string]: string};
try {
  renderIconsW35 = renderIconsW35Imp;
} catch (e) {
  renderIconsW35 = null;
}
const defaultFits: ShipData[] = shipJSON;
defaultFits.forEach(s => ShipData.processing(s));
let localFits: ShipData[] = [];
try {
  localFits = (JSON.parse(localStorage.getItem('efsLocalShipData') || '[]'): ShipData[]);
  localFits = localFits.filter(f => f);
  localFits.forEach(s => ShipData.processing(s));
} catch (e) {
  localFits = [];
  localStorage.setItem('efsLocalShipData', JSON.stringify(localFits));
}
const ships: ShipData[] = localFits.length > 0 ? [...defaultFits, ...localFits] : defaultFits;
ShipData.fixDupeNames(ships);
const baseShips: ShipData[] = shipBaseJSON;
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
  Flag_Cruiser: 1972,
};

const shipSubCatagories: { [string]: number[] } = {
  Frigate: [25, 31, 237, 324, 830, 831, 834, 893, 1283, 1527],
  Destroyer: [420, 541, 1305, 1534],
  Cruiser: [26, 358, 832, 833, 894, 906, 963, 1972],
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

function getNestedCount(data: ?SidebarShipNode[]) {
  let dataLength = 0;
  if (!Array.isArray(data)) {
    return 0;
  }
  if (data.some(d => d.children && d.children.length > 0)) {
    for (const d of data) {
      dataLength += getNestedCount(d.children);
    }
    return dataLength;
  } else if (data.length > 0) {
    const idLen = data[0].parentNodeIdChain.length;
    const isFit = ShipDataDisplayManager.isDisplayModeFit;
    // Should only return non-zero for the final node layer
    if ((idLen >= 3) || (!isFit && idLen === 2)) {
      return data.length;
    }
  }
  return 0;
}
function appendChildrenCount(name: string, data: ?SidebarShipNode[]) {
  const dataLength = getNestedCount(data);
  return dataLength > 0 ? `${name} (${dataLength})` : name;
}
function getShipFitData(shipTypeId: number, parentNodeIdChain: number[]) {
  const shipFits = ships.filter(ship => ship.typeID === shipTypeId);
  const fitDataSet = [];
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
function getSubSystems(
  shipFits: ShipData[],
  subCategory: SubsystemType,
  parentNodeIdChain: number[],
) {
  const addedSubs = [];
  const subNodes = [];
  for (const t3c of shipFits) {
    const { subsystems } = t3c;
    if (subsystems) {
      const sub: string = subsystems[subCategory];
      if (!addedSubs.includes(sub)) {
        addedSubs.push(sub);
        const subNode = new SidebarShipNode(
          sub, Math.random(),
          parentNodeIdChain,
        );
        subNodes.push(subNode);
      }
    }
  }
  return subNodes;
}
function getShipSubTypeData(shipTypeId: number, parentNodeIdChain: number[], groupID: number) {
  const shipFits = baseShips.filter(ship => ship.typeID === shipTypeId);
  const fitDataSet = [];
  if (groupID === shipGroupIDNamePair.Strategic_Cruiser) {
    const subs = ['Defensive', 'Offensive', 'Propulsion', 'Core'];
    for (const sub of subs) {
      const id = Math.random();
      const fitData = new SidebarShipNode(
        sub, id,
        parentNodeIdChain,
      );
      fitData.children = getSubSystems(shipFits, sub, [...parentNodeIdChain, id]);
      fitDataSet.push(fitData);
    }
  } else {
    for (const shipFit of shipFits) {
      const fitData = new SidebarShipNode(
        `${shipFit.name} ${shipFit.mode}`, shipFit.id,
        parentNodeIdChain, shipFit.typeID,
      );
      fitData.fitData = shipFit;
      fitDataSet.push(fitData);
    }
  }
  return fitDataSet;
}
function getShipTypeData(shipClass: string, parentNodeIdChain: number[]) {
  const groupID = shipGroupIDNamePair[shipClass];
  let shipsOfType = baseShips.filter(ship => ship.groupID === groupID);
  let subTypesRequired = false;
  if (groupID === shipGroupIDNamePair.Strategic_Cruiser ||
      groupID === shipGroupIDNamePair.Tactical_Destroyer) {
    const typesInGroup = shipsOfType;
    subTypesRequired = true;
    shipsOfType = [];
    for (const typeInGroup of typesInGroup) {
      if (!shipsOfType.some(s => s.typeID === typeInGroup.typeID)) {
        const shipType = {};
        shipType.shipGroup = typeInGroup.shipGroup;
        shipType.name = typeInGroup.name;
        shipType.typeID = typeInGroup.typeID;
        shipType.id = Math.random();
        shipsOfType.push(shipType);
      }
    }
  }
  const typeDataSet = [];
  for (const shipType of shipsOfType) {
    shipType.shipGroup = shipClass.replace(/_/g, ' ');
    const { id } = shipType;
    let fitData = [];
    if (ShipDataDisplayManager.isDisplayModeFit) {
      fitData = getShipFitData(shipType.typeID, [...parentNodeIdChain, id]);
    } else if (subTypesRequired) {
      fitData = getShipSubTypeData(shipType.typeID, [...parentNodeIdChain, id], groupID);
    }
    const nameInput = appendChildrenCount(shipType.name, fitData);
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
    const nameInput = appendChildrenCount(shipClass.replace(/_/g, ' '), typeData);
    const classData = new SidebarShipNode(
      nameInput, id,
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
    const nameInput = appendChildrenCount(size, classData);
    const sizeData = new SidebarShipNode(nameInput, id, [], undefined, undefined);
    if (classData.length > 0) {
      sizeData.children = classData;
    }
    shipDataSet.push(sizeData);
  }
  return shipDataSet;
}

const dataConst = [
  getHullSizeData(),
  null,
  { isFitInitalValue: ShipDataDisplayManager.isDisplayModeFit },
];
let data = dataConst[0];

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
  UIRefresh();
}

type headArgs = {style: { title: {string: string} }, node: SidebarShipNode};
type headType = headArgs => React.Node;
const headerFunction: headType = ({ style, node }: headArgs) => {
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
  const shipImageStyle = {
    cssFloat: 'left',
    margin: '0px',
    position: 'absolute',
    top: '50%',
    transform: 'translate(calc(-8px + -100%), -50%)',
  };
  const baseStyle = {
    display: 'inline-block',
    color: '#9DA5AB',
    margin: '0em 0em 0em 0em',
    // Always make sure arrow has room and doesn't wrap
    maxWidth: 'calc(100% - 19px)', // Arrow is 24px with a -5px margin
    // Nodes with typeID have icons thus need padding to maintain vertical alignment.
    paddingTop: node.typeID ? '8px' : null,
    paddingBottom: node.typeID ? '8px' : null,
    marginLeft: !node.children ? '19px' : null,
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
  const textAndIconStyle = {
    margin: node.typeID ? '0em 5em 0em calc(0.25em + 43px)' : '0.25em 5em 0.25em 0.25em',
  };
  const typeImage = node.typeID ? (
    <Image
      style={shipImageStyle}
      inline
      centered={false}
      circular
      size="mini"
      src={renderIconsW35 ?
           renderIconsW35[`i${node.typeID.toString()}`] :
      `./Renders/w35/${node.typeID.toString()}.png`}
    />
  ) : null;
  const header = (
    <div style={baseStyle}>
      <div style={style.title || ''}>
        <div style={textAndIconStyle}>
          {typeImage}
          <div>{node.name}</div>
        </div>
        <Checkbox
          toggle
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
type State = { cursor: ?SidebarShipNode, isfit: boolean };
class ShipTree extends React.Component<Props, State> {
  constructor(props: { }) {
    super(props);
    const sddm = ShipDataDisplayManager;
    this.state = { cursor: null, isfit: sddm.isDisplayModeFit };
    dataConst.pop();
    dataConst.pop();
    dataConst.pop();
    dataConst.push(getHullSizeData(), null, { isFitInitalValue: sddm.isDisplayModeFit });
    [data] = dataConst;
    this.dataRefresh = () => {
      const prevData = dataConst.shift() || getHullSizeData();
      const currentData = dataConst.shift() || getHullSizeData();
      dataConst.pop();
      dataConst.push(currentData, prevData, { isFitInitalValue: sddm.isDisplayModeFit });
      [data] = dataConst;
      this.setState(() => ({ cursor: null, isfit: ShipDataDisplayManager.isDisplayModeFit }));
    };
    this.forceUpdate = () => {
      // Reload current data and reset cache.
      const currentData = getHullSizeData();
      const prevData = null;
      while (dataConst.length > 0) {
        dataConst.pop();
      }
      dataConst.push(currentData, prevData, { isFitInitalValue: sddm.isDisplayModeFit });
      [data] = dataConst;
      this.setState(() => ({ cursor: null, isfit: ShipDataDisplayManager.isDisplayModeFit }));
    };
  }
  componentDidUpdate() {
    const sddm = ShipDataDisplayManager;
    if (this.state.isfit !== sddm.isDisplayModeFit) {
      this.dataRefresh();
    } else if (sddm.forceSidebarUpdate) {
      sddm.forceSidebarUpdate = false;
      this.forceUpdate();
    }
  }
  onToggle = (node: SidebarShipNode, toggled: boolean) => {
    if (this.state.cursor) { this.state.cursor.active = false; }
    node.active = true;
    if (node.children) { node.toggled = toggled; }
    this.setState({ cursor: node });
  };
  dataRefresh;
  forceUpdate;
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
        textAlign="center"
        attached="top"
        block
        size="huge"
        className="sidebarHeader"
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

export { SidebarShipDisplay, ShipSizes, SidebarShipNode, dataConst, ships, baseShips };
