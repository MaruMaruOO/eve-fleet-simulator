// @flow
import * as React from 'react';
import { Card, Image, Input, Popup, Label, Icon } from 'semantic-ui-react';
import { SidebarShipNode, dataConst, ships, baseShips } from './sidebar_ship_display';
import { sideOneShips, sideTwoShips, UIRefresh } from './../index';
import ShipDataDisplayManager from './../ship_data_display_manager';

import webIcon from './../eve_icons/12_64_6.png';
import weaponDisruptorIcon from './../eve_icons/5_64_7.png';
import scramIcon from './../eve_icons/76_64_1.png';
import targetPainterIcon from './../eve_icons/56_64_1.png';
import sensorDampenerIcon from './../eve_icons/4_64_11.png';
import remoteShieldIcon from './../eve_icons/1_64_16.png';
import remoteArmorIcon from './../eve_icons/remote_armor_repair.png';
import ecmIcon from './../eve_icons/4_64_12.png';
import nosIcon from './../eve_icons/1_64_3.png';
import neutIcon from './../eve_icons/1_64_1.png';
import mjdIcon from './../eve_icons/108_64_22.png';
import pointIcon from './../eve_icons/4_64_9.png';
import shieldBoostIcon from './../eve_icons/2_64_3.png';
import armorRepairIcon from './../eve_icons/1_64_11.png';
import capBoostIcon from './../eve_icons/1_64_6.png';

import ShipData from './../ship_data_class';
import type { SyntheticInputEvent, ProjectionTypeString, RepairTypeString } from './../flow_types';

// uncomment line to include all ship render icons in webpack (roughly 6.3MB for W80).
import renderIconsW80Imp from '../eve_icons/renders/renderIconsW80';

let renderIconsW80: ?{[string]: string};
try {
  renderIconsW80 = renderIconsW80Imp;
} catch (e) {
  renderIconsW80 = null;
}

function trimInputZeros(e: SyntheticInputEvent) {
  // Remove useless leading zeros if present
  const num = Number(e.currentTarget.value);
  // If the value is 0 reset to the default value by making it an empty string.
  e.currentTarget.value = num === 0 ? '' : String(num);
}

function updateSideShips(
  sideNum: SyntheticInputEvent,
  sideN: number,
  fitind: number,
  inputValSet: ?{ [number]: number },
  idsNeedingInputRf: ?number[],
) {
  const s = sideN;
  let side;
  if (s === 1) {
    side = sideOneShips;
  } else {
    side = sideTwoShips;
  }
  const input = Number(sideNum.currentTarget.value);
  if (input < Number(sideNum.currentTarget.min)) {
    sideNum.currentTarget.value = sideNum.currentTarget.min;
  } else if (input > Number(sideNum.currentTarget.max)) {
    sideNum.currentTarget.value = sideNum.currentTarget.max;
  }
  const n = Number(sideNum.currentTarget.value);
  const overallInd = fitind;
  const fit: ShipData = ships[overallInd];
  if (inputValSet && idsNeedingInputRf) {
    inputValSet[fit.id] = n;
    if (!idsNeedingInputRf.includes(fit.id)) {
      idsNeedingInputRf.push(fit.id);
    }
  }
  const ind = side.findIndex(si => si.ship.id === fit.id);
  if (ind >= 0) {
    side[ind] = { n, ship: fit, iconColor: side[ind].iconColor || undefined };
  } else {
    side.forEach((sh) => {
      sh.iconColor = undefined;
    });
    side.push({ n, ship: fit, iconColor: undefined });
  }
  UIRefresh();
}
const FitInfoPopup = (props: { fitdata: ShipData }) => {
  const infoTextMap = (s, i) =>
    (s === '' ? <br key={i.toString()} /> : <div key={i.toString() + s}>{s}</div>);
  let fitInfo;
  if (props.fitdata.isFit) {
    fitInfo = props.fitdata.moduleNames.map(infoTextMap);
  } else if (props.fitdata.mode) {
    fitInfo = infoTextMap(props.fitdata.mode, 0);
  } else {
    fitInfo = [
      infoTextMap('Subsystems: ', 0),
      ...Object.entries(props.fitdata.subsystems).map((pair: [string, mixed], i: number) =>
        infoTextMap(`${pair[0]} - ${String(pair[1])}`, i + 1)),
    ];
  }
  const triggerVal = (<Label as="a" corner="right" icon="help circle" />);
  return (
    <Popup
      wide
      flowing
      position="right center"
      trigger={triggerVal}
      content={fitInfo}
    />
  );
};

function shipTypeAndEffectIcons(fitData: ShipData) {
  const effectIcons: {[ProjectionTypeString | RepairTypeString]: [string, boolean]} = {
    'Stasis Web': [webIcon, true],
    'Weapon Disruptor': [weaponDisruptorIcon, true],
    'Warp Scrambler': [scramIcon, true],
    'Target Painter': [targetPainterIcon, true],
    'Sensor Dampener': [sensorDampenerIcon, true],
    'Remote Shield Booster': [remoteShieldIcon, true],
    'Remote Armor Repairer': [remoteArmorIcon, true],
    'Energy Nosferatu': [nosIcon, true],
    'Energy Neutralizer': [neutIcon, true],
    // The rest of these aren't implemented and the icon should make that clear.
    ECM: [ecmIcon, false],
    'Burst Jammer': [ecmIcon, false],
    'Micro Jump Drive': [mjdIcon, false],
    'Warp Disruptor': [pointIcon, false],
    'Shield Booster': [shieldBoostIcon, true],
    'Armor Repairer': [armorRepairIcon, true],
    'Capacitor Booster': [capBoostIcon, true],
  };
  const projSet: {[ProjectionTypeString | RepairTypeString]: number} = {};
  for (const p of fitData.projections) {
    if (p.type) {
      const isNotPoint = p.type !== 'Warp Scrambler' || p.activationBlockedStrenght > 0;
      const t = isNotPoint ? p.type : 'Warp Disruptor';
      if (Object.keys(projSet).includes(t)) {
        projSet[t] += 1;
      } else {
        projSet[t] = 1;
      }
    }
  }
  for (const p of fitData.repairs) {
    if (p.type) {
      const t = p.type;
      if (Object.keys(projSet).includes(t)) {
        projSet[t] += 1;
      } else {
        projSet[t] = 1;
      }
    }
  }

  const mapData = Object.keys(projSet).sort((k1, k2) => projSet[k2] - projSet[k1]).map(p => (
    projSet[p] > 1 ? (
      <div key={p}>
        <Image
          src={effectIcons[p][0]}
          disabled={!effectIcons[p][1]}
          inline
          centered={false}
          circular
          size="mini"
        />
        {projSet[p].toString()}
      </div>
    ) : (
      <Image
        key={p}
        src={effectIcons[p][0]}
        disabled={!effectIcons[p][1]}
        inline
        centered={false}
        circular
        size="mini"
      />
    )
  ));
  return mapData;
}

type ShipAndFitCardsProps = {
  transitionPadding: boolean,
  children: React.ChildrenArray<React.Element<typeof Card>>,
};
class ShipAndFitCards extends React.Component<ShipAndFitCardsProps, {}> {
  static defaultProps = { children: [] };
  getFitNode = (fitData: ShipData) => {
    const redDefaultVal = (sideOneShips.find(s => s.ship.id === fitData.id) || { n: '' }).n;
    const blueDefaultVal = (sideTwoShips.find(s => s.ship.id === fitData.id) || { n: '' }).n;
    if (redDefaultVal) {
      this.shipInputVals.red[fitData.id] = redDefaultVal;
    }
    if (blueDefaultVal) {
      this.shipInputVals.blue[fitData.id] = blueDefaultVal;
    }
    const iconSrc = renderIconsW80 ?
      renderIconsW80[`i${fitData.typeID.toString()}`] :
      `./Renders/w80/${fitData.typeID.toString()}.png`;

    let renderLabel = fitData.name;
    if (fitData.efsExportVersion !== ShipData.LastestEfsExportVersion) {
      renderLabel = (
        <Popup
          wide
          position="right center"
          trigger={(<div>{fitData.name}<br /><Icon fitted size="large" name="warning circle" /></div>)}
          content={(
            <div>
              Fit was exported using an outdated version of pyfa.<br />
              Please export it with the current version of pyfa or it will
              not behave correctly with new EFS features.
            </div>
          )}
        />
      );
    }
    return (
      <Card key={fitData.id}>
        <Card.Content>
          <Card.Header textAlign="center" className="shipCardHeader">
            <FitInfoPopup fitdata={fitData} />
            <Image
              centered
              rounded
              size="tiny"
              label={{ content: renderLabel, attached: 'bottom' }}
              src={iconSrc}
            />
          </Card.Header>
          <Card.Description className="shipCardBody">
            { ShipDataDisplayManager.ShipFitBarVisuals(fitData) }
          </Card.Description>
          <Card.Meta className="shipCardMeta">
            { fitData.shipType }
            <br />
            { shipTypeAndEffectIcons(fitData) }
          </Card.Meta>
          <Card.Content extra>
            <Input
              style={{ maxWidth: '40%', marginRight: '2em' }}
              fitname={fitData.name}
              type="number"
              min="0"
              max="50000"
              onChange={(e: SyntheticInputEvent) => (
                updateSideShips(
                  e,
                  1,
                  ships.indexOf(fitData),
                  this.shipInputVals.red,
                  this.idsNeedingInputRf,
                )
              )}
              onBlur={trimInputZeros}
              label={{ color: 'red' }}
              placeholder="Red"
              value={redDefaultVal}
            />
            <Input
              style={{ maxWidth: '40%' }}
              fitname={fitData.name}
              type="number"
              min="0"
              max="50000"
              onChange={(e: SyntheticInputEvent) => (
                updateSideShips(
                  e,
                  2,
                  ships.indexOf(fitData),
                  this.shipInputVals.blue,
                  this.idsNeedingInputRf,
                )
              )}
              onBlur={trimInputZeros}
              label={{ color: 'blue' }}
              placeholder="Blue"
              value={blueDefaultVal}
            />
          </Card.Content>
        </Card.Content>
      </Card>
    );
  };
  getTypeNodeInner = (shipData: ShipData) => {
    const iconSrc = renderIconsW80 ?
      renderIconsW80[`i${shipData.typeID.toString()}`] :
      `./Renders/w80/${shipData.typeID.toString()}.png`;
    const hasPopupInfo = shipData.subsystems || shipData.mode;
    const extraPopupInfoIfAny = hasPopupInfo ? <FitInfoPopup fitdata={shipData} /> : '';
    return (
      <Card key={shipData.id}>
        <Card.Content>
          <Card.Header textAlign="center" className="shipCardHeader">
            { extraPopupInfoIfAny }
            <Image
              centered
              rounded
              size="tiny"
              label={{ content: shipData.name, attached: 'bottom' }}
              src={iconSrc}
            />
          </Card.Header>
          <Card.Description className="shipCardBody">
            { ShipDataDisplayManager.ShipTypeBarVisuals(shipData) }
          </Card.Description>
          <Card.Meta content={shipData.shipGroup} className="shipCardMeta" />
          <Card.Content className="shipCardSecondary">
            { ShipDataDisplayManager.ShipTypeSimpleStatVisuals(shipData) }
          </Card.Content>
        </Card.Content>
      </Card>);
  };
  getAllSubsChecked = (ship: ShipData, typeNode: SidebarShipNode) => {
    const subTypeNodes = typeNode.children;
    const { subsystems } = ship;
    if (!subTypeNodes || !subsystems) {
      return false;
    }
    const subs = ['Defensive', 'Offensive', 'Propulsion', 'Core'];
    for (const sub of subs) {
      const subTypeNode = subTypeNodes.find(c => c.name === sub) || {};
      const specificSubs = subTypeNode.children || [];
      const specificSub = specificSubs.find(c => c.name === subsystems[sub]);
      if (specificSub && !specificSub.checked) {
        return false;
      }
    }
    return true;
  };
  getSubTypes = (checkedNodes: SidebarShipNode[], typeNode: SidebarShipNode) => {
    const shipDataSet = baseShips.filter((ship: ShipData) => ship.typeID === typeNode.typeID);
    // t3 Cruisers
    if (shipDataSet[0].subsystems && checkedNodes[0].children) {
      return shipDataSet.filter((s: ShipData) => this.getAllSubsChecked(s, typeNode));
    }
    // t3 Destroyers
    return shipDataSet.filter((s: ShipData) =>
      checkedNodes.some((n: SidebarShipNode) => n.nodeId === s.id));
  };
  getTypeNode = (typeNode: SidebarShipNode) => {
    if (this.props.transitionPadding) {
      return null;
    }
    const shipDataSet = baseShips.filter((ship: ShipData) => ship.typeID === typeNode.typeID);
    if (typeNode.children) {
      const checkedNodes = typeNode.children.filter(s =>
        (s.checked === true || s.indeterminate === true) && !s.invisible);
      const selectedSubtypes: ShipData[] = this.getSubTypes(checkedNodes, typeNode);
      return selectedSubtypes;
    }
    return shipDataSet;
  };
  getCardTypeData = (typeNodes: SidebarShipNode[]) => {
    let dataSet = [];
    for (const node of typeNodes) {
      const data = this.getTypeNode(node);
      if (data) {
        dataSet = [...dataSet, ...data];
      }
    }
    return dataSet;
  };
  getCardFitData = (fitNodes: SidebarShipNode[]) => {
    const dataSet = [];
    for (const node of fitNodes) {
      const fitDataArg = node.fitData;
      const fitData = fitDataArg ? ships.find(f => f.id === fitDataArg.id) : null;
      if (fitData) {
        dataSet.push(fitData);
      }
    }
    return dataSet;
  };
  sortCardData = (a: ShipData, b: ShipData) => {
    if (!ShipDataDisplayManager.shipDisplaySort ||
        ShipDataDisplayManager.shipDisplaySortName === 'default') {
      return 0;
    }
    return ShipDataDisplayManager.shipDisplaySort(b) - ShipDataDisplayManager.shipDisplaySort(a);
  };
  addMissingTypeData = (typeNode: SidebarShipNode | SidebarShipNode[]) => {
    if (Array.isArray(typeNode)) {
      typeNode.forEach(this.addMissingTypeData);
    } else if (!typeNode.typeData) {
      const typeNodeRef = typeNode;
      const [typeData] = baseShips.filter(ship => ship.typeID === typeNodeRef.typeID);
      typeNodeRef.typeData = typeData;
    }
  };
  shipSelection: ShipData[] = [];
  displaySettings = [];
  shipSet: React.Element<typeof ShipAndFitCards> = (<Card.Group centered />);
  shipInputVals: { red: { [number]: number }, blue: { [number]: number } } = { red: {}, blue: {} };
  idsNeedingInputRf: number[] = [];
  render() {
    const sddm = ShipDataDisplayManager;
    const sidebarMatchesMode = dataConst[2].isFitInitalValue === sddm.isDisplayModeFit;
    let nodeData;
    if (sidebarMatchesMode) {
      [nodeData] = dataConst;
    } else {
      nodeData = dataConst[1] || [];
    }
    const sizeSelected: SidebarShipNode[] = nodeData.filter(s =>
      s.checked === true || s.indeterminate === true);
    const commonSetBarMaximumArgs = [baseShips, sizeSelected];
    let groupsSelected: SidebarShipNode[] = [];
    for (const size of sizeSelected) {
      if (size.children) {
        const temp = size.children.filter(s => s.checked === true || s.indeterminate === true);
        groupsSelected = [...groupsSelected, ...temp];
      }
    }
    let typesSelected: SidebarShipNode[] = [];
    for (const group of groupsSelected) {
      if (group.children) {
        const temp = group.children.filter(s => s.checked === true || s.indeterminate === true);
        typesSelected = [...typesSelected, ...temp];
      }
    }
    if (!ShipDataDisplayManager.isDisplayModeFit) {
      const tankChange = sddm.activeTank !== sddm.prevActiveTank ||
        sddm.moduleQuality !== sddm.prevModuleQuality;
      sddm.SetTypeBarMaximums(...commonSetBarMaximumArgs);
      this.addMissingTypeData(typesSelected);
      const cardTypeData = this.getCardTypeData(typesSelected);
      cardTypeData.sort(this.sortCardData);
      const typeDisplayData = sddm.shipTypeDataTypes.filter(d => d.visable).map(d => d.name);
      if (this.shipSelection.length !== cardTypeData.length ||
          this.displaySettings.length !== typeDisplayData.length ||
          tankChange ||
          this.shipSelection.some((s, i) => s !== cardTypeData[i]) ||
          this.displaySettings.some(((s, i) => s !== typeDisplayData[i]))) {
        this.shipSelection = cardTypeData;
        this.displaySettings = typeDisplayData;
        this.shipSet = (
          <Card.Group centered >
            { cardTypeData.map(this.getTypeNodeInner) }
          </Card.Group>
        );
      }
      return this.shipSet;
    }
    let fitsSelected: SidebarShipNode[] = [];
    for (const shipType of typesSelected) {
      if (shipType.children) {
        const temp = shipType.children.filter(s => s.checked === true && !s.invisible);
        fitsSelected = [...fitsSelected, ...temp];
      }
    }
    sddm.SetFitBarMaximums(...commonSetBarMaximumArgs, ships);
    const cardFitData = this.getCardFitData(fitsSelected).sort(this.sortCardData);
    const fitDisplayData = sddm.shipFitDataTypes.filter(d => d.visable).map(d => d.name);
    for (const col of Object.keys(this.shipInputVals)) {
      for (const idKeyStr of Object.keys(this.shipInputVals[col])) {
        const idKey: number = Number(idKeyStr);
        const colShips = col === 'red' ? sideOneShips : sideTwoShips;
        if (colShips && this.shipInputVals[col][idKey] !== (colShips.find(s => s.ship.id === idKey) || { n: '' }).n) {
          if (!this.idsNeedingInputRf.includes(idKey)) {
            this.idsNeedingInputRf.push(Number(idKey));
          }
        }
      }
    }
    if (this.idsNeedingInputRf.length > 0) {
      const s: React.Element<typeof ShipAndFitCards> = this.shipSet;
      const pr: React.ElementProps<typeof ShipAndFitCards> = s.props;
      const cards = pr.children && pr.children.length ? pr.children : [pr.children];
      const updatedCards = cards.slice();
      for (const id of this.idsNeedingInputRf) {
        const indC = cards.findIndex(c => c.key && c.key === id.toString());
        const dataC = cardFitData.find(c => c.id === id);
        if (dataC && indC >= 0) {
          updatedCards[indC] = this.getFitNode(dataC);
        }
      }
      this.idsNeedingInputRf = [];
      this.shipSet = (
        <Card.Group centered>
          { updatedCards }
        </Card.Group>
      );
    }
    if (this.shipSelection.length !== cardFitData.length ||
        this.displaySettings.length !== fitDisplayData.length ||
        this.shipSelection.some((s, i) => s !== cardFitData[i]) ||
        this.displaySettings.some(((s, i) => s !== fitDisplayData[i]))) {
      this.shipSelection = cardFitData;
      this.displaySettings = fitDisplayData;
      this.shipSet = (
        <Card.Group centered>
          { cardFitData.map(this.getFitNode) }
        </Card.Group>
      );
    }
    return this.shipSet;
  }
}

export { ShipAndFitCards, updateSideShips, trimInputZeros };
