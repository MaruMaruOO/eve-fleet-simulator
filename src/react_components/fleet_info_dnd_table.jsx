// @flow
import React, { Fragment } from 'react';
import { Table, Popup, Label } from 'semantic-ui-react';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';
import type {
  DropResult,
  DroppableProvided,
  DraggableProvided,
  DraggableStateSnapshot,
} from 'react-beautiful-dnd';
import type { SideShipInfo } from './../flow_types';
import FleetAndCombatSimulator from './fleet_and_combat_simulator';
import ShipData from './../ship_data_class';
import DraggableTableRow from './draggable_table_row';

function FleetStateTableHeader(props: { side: 'red' | 'blue' }) {
  const triggerVal = (<Label as="a" corner="right" icon="help circle" />);
  const popupInfo = (
    <Popup
      wide
      flowing
      position="right center"
      trigger={triggerVal}
      content={(<div>Opposing side will target ships with the lowest priority first.<br />
      Click and drag table rows to change target priority.</div>)}
    />
  );
  return (
    <Table.Header>
      <Table.Row>
        <Table.HeaderCell colSpan="5" textAlign="center">
          { props.side === 'red' ? 'Red Ships' : 'Blue Ships' }
        </Table.HeaderCell>
      </Table.Row>
      <Table.Row className="fleetStateTableSubHeader">
        <Table.HeaderCell>Name</Table.HeaderCell>
        <Table.HeaderCell className="shipTypeSubheader" >Type</Table.HeaderCell>
        <Table.HeaderCell className="tableCellWithTooltip">
          Priority
          <div className="cornerTooltipWrapper">{popupInfo}</div>
        </Table.HeaderCell>
        <Table.HeaderCell>Ships</Table.HeaderCell>
      </Table.Row>
    </Table.Header>
  );
}

const reorder = (
  list: SideShipInfo[],
  startIndex: number,
  endIndex: number,
): SideShipInfo[] => {
  const [removed] = list.splice(startIndex, 1);
  list.splice(endIndex, 0, removed);
  return list;
};

type FleetTableProps = {|
  ships: { ship: ShipData, n: number, iconColor: ?string }[],
  parent: FleetAndCombatSimulator,
  side: 'red' | 'blue',
|}

type FleetTableState = {|
  parent: FleetAndCombatSimulator,
|}
export default class FleetInfoDnDTable extends React.Component<FleetTableProps, FleetTableState> {
  // eslint-disable-next-line react/sort-comp
  tableRef: ?HTMLElement

  state: FleetTableState = {
    parent: this.props.parent,
  };

  onDragEnd = (result: DropResult) => {
    // dropped outside the list
    if (!result.destination || result.destination.index === result.source.index) {
      return;
    }
    // no movement
    if (result.destination.index === result.source.index) {
      return;
    }
    reorder(
      this.props.ships,
      result.source.index,
      result.destination.index,
    );
  }
  render() {
    return (
      <DragDropContext onDragEnd={this.onDragEnd}>
        <Fragment>
          <Table>
            <FleetStateTableHeader side={this.props.side} />
            <Droppable droppableId="table">
              {(droppableProvided: DroppableProvided) => (
                <tbody
                  ref={(ref: ?HTMLElement) => {
                    this.tableRef = ref;
                    droppableProvided.innerRef(ref);
                  }}
                  {...droppableProvided.droppableProps}
                >
                  {this.props.ships.map((shipInfo: SideShipInfo, index: number) => (
                    <Draggable draggableId={shipInfo.ship.id} index={index} key={shipInfo.ship.id}>
                      {(provided: DraggableProvided, snapshot: DraggableStateSnapshot) => (
                        <DraggableTableRow
                          provided={provided}
                          snapshot={snapshot}
                          shipinfo={shipInfo}
                          index={index}
                          parent={this.state.parent}
                          sidestr={this.props.side}
                        />
                    )}
                    </Draggable>
                  ))}
                </tbody>
                )}
            </Droppable>
          </Table>
        </Fragment>
      </DragDropContext>
    );
  }
}
