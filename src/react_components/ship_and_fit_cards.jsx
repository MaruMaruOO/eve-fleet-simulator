// @flow
import React from 'react';
import { Card, Image, Input, Popup, Label } from 'semantic-ui-react';
import { SidebarShipNode, dataConst, ships, baseShips } from './sidebar_ship_display';
import { sideOneShips, sideTwoShips, UIRefresh } from './../index';
import ShipDataDisplayManager from './../ship_data_display_manager';

import ShipData from './../ship_data_class';
import type { SyntheticInputEvent } from './../flow_types';

// uncomment line to include all ship render icons in webpack (roughly 6.3MB for W80).
import renderIconsW80Imp from '../eve_icons/renders/renderIconsW80';

let renderIconsW80;
try {
  renderIconsW80 = renderIconsW80Imp;
} catch (e) {
  renderIconsW80 = null;
}

function updateSideShips(sideNum: SyntheticInputEvent, sideN: number, fitind: number) {
  const s = sideN;
  let side;
  if (s === 1) {
    side = sideOneShips;
  } else {
    side = sideTwoShips;
  }
  const n = Number(sideNum.currentTarget.value);
  const overallInd = fitind;
  const fit: ShipData = ships[overallInd];
  const ind = side.findIndex(si => si.ship.id === fit.id);
  if (ind >= 0) {
    side[ind] = { n, ship: fit };
  } else {
    side.push({ n, ship: fit });
  }
  UIRefresh();
}

function ShipAndFitCards() {
  const addMissingTypeData = (typeNode: SidebarShipNode | SidebarShipNode[]) => {
    if (Array.isArray(typeNode)) {
      typeNode.forEach(addMissingTypeData);
    } else if (!typeNode.typeData) {
      const typeNodeRef = typeNode;
      const [typeData] = baseShips.filter(ship => ship.typeID === typeNodeRef.typeID);
      typeNodeRef.typeData = typeData;
    }
  };
  const sortDisplay = (a: SidebarShipNode, b: SidebarShipNode) => {
    if (!ShipDataDisplayManager.shipDisplaySort ||
        ShipDataDisplayManager.shipDisplaySortName === 'default') {
      return 0;
    }
    if (ShipDataDisplayManager.isDisplayModeFit) {
      const bVal = b.fitData ? ShipDataDisplayManager.shipDisplaySort(b.fitData) : 0;
      const aVal = a.fitData ? ShipDataDisplayManager.shipDisplaySort(a.fitData) : 0;
      return bVal - aVal;
    }
    const bVal = b.typeData ? ShipDataDisplayManager.shipDisplaySort(b.typeData) : 0;
    const aVal = a.typeData ? ShipDataDisplayManager.shipDisplaySort(a.typeData) : 0;
    return bVal - aVal;
  };
  const FitInfoPopup = (props: { fitData: ShipData }) => {
    const fitInfo = props.fitData.moduleNames.map((s, i) =>
      (s === '' ? <br key={i.toString()} /> : <div key={i.toString() + s}>{s}</div>));
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
  const getFitNode = (fit: SidebarShipNode) => {
    const fitDataArg = fit.fitData;
    const fitData = fitDataArg ? ships.find(f => f.id === fitDataArg.id) : null;
    if (!fitData) {
      return (<div> Unable to find fit information for {JSON.stringify(fit)} </div>);
    }
    const redDefaultVal = (sideOneShips.find(s => s.ship.id === fitData.id) || { n: null }).n;
    const blueDefaultVal = (sideTwoShips.find(s => s.ship.id === fitData.id) || { n: null }).n;
    const iconSrc = renderIconsW80 ?
      renderIconsW80[`i${fitData.typeID.toString()}`] :
      `./Renders/w80/${fitData.typeID.toString()}.png`;
    return (
      <Card key={fit.nodeId}>
        <Card.Content>
          <Card.Header textAlign="center" className="shipCardHeader">
            <FitInfoPopup fitData={fitData} />
            <Image
              centered
              rounded
              size="tiny"
              label={{ content: fitData.name, attached: 'bottom' }}
              src={iconSrc}
            />
          </Card.Header>
          <Card.Description className="shipCardBody">
            { ShipDataDisplayManager.ShipFitBarVisuals(fitData) }
          </Card.Description>
          <Card.Meta content={fitData.shipType} className="shipCardMeta" />
          <Card.Content extra>
            <Input
              style={{ maxWidth: '40%', marginRight: '2em' }}
              fitname={fitData.name}
              type="number"
              min="0"
              onChange={(e: SyntheticInputEvent) => updateSideShips(e, 1, ships.indexOf(fitData))}
              label={{ color: 'red' }}
              placeholder="Red"
              defaultValue={redDefaultVal}
            />
            <Input
              style={{ maxWidth: '40%' }}
              fitname={fitData.name}
              type="number"
              min="0"
              onChange={(e: SyntheticInputEvent) => updateSideShips(e, 2, ships.indexOf(fitData))}
              label={{ color: 'blue' }}
              placeholder="Blue"
              defaultValue={blueDefaultVal}
            />
          </Card.Content>
        </Card.Content>
      </Card>
    );
  };
  const getTypeNode = (typeNode) => {
    const shipData = baseShips.filter(ship => ship.typeID === typeNode.typeID)[0];
    const iconSrc = renderIconsW80 ?
      renderIconsW80[`i${shipData.typeID.toString()}`] :
      `./Renders/w80/${shipData.typeID.toString()}.png`;
    return (
      <Card key={typeNode.nodeId}>
        <Card.Content>
          <Card.Header textAlign="center" className="shipCardHeader">
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
  const sizeSelected: SidebarShipNode[] = dataConst[0].filter(s =>
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
    ShipDataDisplayManager.SetTypeBarMaximums(...commonSetBarMaximumArgs);
    addMissingTypeData(typesSelected);
    return (
      <Card.Group centered >
        { typesSelected.sort(sortDisplay).map(getTypeNode) }
      </Card.Group>);
  }
  let fitsSelected: SidebarShipNode[] = [];
  for (const shipType of typesSelected) {
    if (shipType.children) {
      const temp = shipType.children.filter(s => s.checked === true && !s.invisible);
      fitsSelected = [...fitsSelected, ...temp];
    }
  }
  ShipDataDisplayManager.SetFitBarMaximums(...commonSetBarMaximumArgs, ships);
  return (
    <Card.Group centered>
      { fitsSelected.sort(sortDisplay).map(getFitNode) }
    </Card.Group>);
}

export default ShipAndFitCards;
