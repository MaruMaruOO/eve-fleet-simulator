// @flow
import React from 'react';
import { Table, Image, Popup, Label, Progress } from 'semantic-ui-react';
import type {
  DraggableProvided,
  DraggableStateSnapshot,
} from 'react-beautiful-dnd';
import type { SideShipInfo } from './../flow_types';
import type { GuiSide } from './fleet_and_combat_simulator';
import FleetAndCombatSimulator from './fleet_and_combat_simulator';
import renderIconsW80 from '../eve_icons/renders/renderIconsW80';

type shipBasicVisBarProps = {
  label: string, val: number, max: number, color: string, icon: string
};
const ShipBasicVisualBar = (props: shipBasicVisBarProps) => {
  let labelStr = props.label ? props.label : '';
  const capStart = labelStr.startsWith(labelStr.charAt(0).toUpperCase());
  let label;
  if (props.val > 10000) {
    labelStr = !labelStr.startsWith('m') ? ` ${labelStr}` : labelStr;
    label = `${(props.val / 1000).toFixed(2)}k${labelStr}`;
  } else {
    label = props.val.toString() + (capStart ? ` ${labelStr}` : labelStr);
  }
  const ele = (
    <div
      width="50%"
      className="shipStatBarDiv"
      key={props.color}
      style={{ '--inherited-bg': props.color }}
    >
      <Progress
        className="shipSimBar"
        label={label}
        size="small"
        percent={100 * (props.val / props.max)}
      />
    </div>
  );
  return ele;
};

type DraggableTableRowProps = {|
  snapshot: DraggableStateSnapshot,
  shipinfo: SideShipInfo,
  provided: DraggableProvided,
  parent: FleetAndCombatSimulator,
  sidestr: 'red' | 'blue',
  index: number,
|}
export default class DraggableTableRow extends React.Component<DraggableTableRowProps> {
  render() {
    const {
      snapshot, shipinfo, provided, parent, sidestr, index,
    } = this.props;
    const side: GuiSide = sidestr === 'red' ? parent.red : parent.blue;
    const shipInfo = shipinfo;
    // Don't get this from shipinfo.iconColor, as it's used for persistance and often undefined.
    const matchingShip = side.ships.find(s => s.id === shipInfo.ship.id);
    const shipIconColor = (matchingShip || { iconColor: 'grey' }).iconColor;
    const iconCellStyle = {
      padding: '0em', width: '18%', paddingTop: '1px', paddingLeft: '1px',
    };
    const shipBorder = {
      maxWidth: '82px',
      borderColor: shipIconColor,
    };
    const triggerVal = (<Label as="a" corner="right" icon="help circle" />);
    const popupInfo = (
      <Popup
        wide
        flowing
        position="right center"
        trigger={triggerVal}
        content={shipInfo.ship.shipType}
      />
    );
    const baseImg = shipInfo.ship.typeID ? (
      <Image
        inline
        centered
        label={popupInfo}
        rounded
        fluid
        style={shipBorder}
        src={renderIconsW80 ?
             renderIconsW80[`i${shipInfo.ship.typeID.toString()}`] :
        `./Renders/w80/${shipInfo.ship.typeID.toString()}.png`}
      />
    ) : null;
    const typeImage = baseImg || (<Label as="a" image={baseImg} />) || (
      { baseImg }
    );
    const dataBar = shipInfo.n > 0 ? ShipBasicVisualBar({
      label: '',
      val: side ? side.ships.filter(s => s.id === shipInfo.ship.id).length : shipInfo.n,
      max: shipInfo.n,
      color: shipIconColor,
      icon: '',
    }) : '';
    const priority = index + 1;
    const isDraggingStyle = snapshot.isDragging ? 'draggingRow' : '';
    // Table.Row can't use ref so using tr instead.
    // Should be identical as Table.Row has no additional classes by default.
    return (
      <tr
        className={isDraggingStyle}
        key={shipInfo.ship.name}
        ref={provided.innerRef}
        {...provided.draggableProps}
        {...provided.dragHandleProps}
      >
        <Table.Cell>{ shipInfo.ship.name }</Table.Cell>
        <Table.Cell style={iconCellStyle} >{typeImage}</Table.Cell>
        <Table.Cell className="tableCellWithTooltip">
          {priority}
        </Table.Cell>
        <Table.Cell style={{ width: '24%', minWidth: '24%' }}>
          {dataBar}
        </Table.Cell>
      </tr>
    );
  }
}
