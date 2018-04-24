// @flow
import React from 'react';
import {
  Form, Message, Divider, Dimmer,
  Container, Segment, Header, Button,
} from 'semantic-ui-react';
import ShipData from './../ship_data_class';
import { ships } from './sidebar_ship_display';

import type {
  SyntheticDropdownEvent, SyntheticButtonEvent,
  SyntheticInputEvent,
} from './../flow_types';

type UploadFitsState = {
  fitData: string, addedFits: string, parseFailure: boolean,
  localShipData: { key: number, text: string, value: string }[], deleteSelection: string,
  deleteAllCheck: boolean,
};
class UploadFits extends React.Component<{ }, UploadFitsState> {
  constructor(props: { }) {
    super(props);
    this.updateLocalShipDropdown = () => {
      const localFits: ShipData[] = JSON.parse(localStorage.getItem('effsLocalShipData') || '[]');
      return localFits.map((s, i) => ({ key: i, text: s.name, value: i.toString() }));
    };
    this.state = {
      fitData: '',
      addedFits: '',
      parseFailure: false,
      localShipData: this.updateLocalShipDropdown(),
      deleteSelection: '',
      deleteAllCheck: false,
    };
  }
  updateLocalShipDropdown: () => { key: number, text: string, value: string }[];
  handleChange = (e: SyntheticInputEvent, { value }: { value: string }) => {
    this.setState({ fitData: value });
  };
  deleteFit = (e: SyntheticButtonEvent, { value }: { value: ?string }) => {
    const localFits: ShipData[] = JSON.parse(localStorage.getItem('effsLocalShipData') || '[]');
    const ind: number = Number(value !== '' ? value : NaN);
    if (!Number.isNaN(ind)) {
      const [{ name }] = localFits.splice(ind, 1);
      localStorage.setItem('effsLocalShipData', JSON.stringify(localFits));
      this.setState({
        localShipData: this.updateLocalShipDropdown(),
        deleteSelection: `Successfully deleted ${name}`,
      });
    }
  };
  deleteDropdownChange = (e: SyntheticDropdownEvent, { value }: { value: string }) => {
    this.setState({ deleteSelection: value });
  };
  checkDeleteAll = () => this.setState({ deleteAllCheck: true });
  cancelDeleteAll = () => this.setState({ deleteAllCheck: false });
  wipeLocalFits = () => {
    localStorage.setItem('effsLocalShipData', JSON.stringify([]));
    this.setState({
      localShipData: this.updateLocalShipDropdown(),
      deleteSelection: 'All local fits have been successfully deleted',
      deleteAllCheck: false,
    });
  };
  addShipFitData = (e: SyntheticButtonEvent, data: { value: string }) => {
    let submittedShipData = data.value.trim();
    if (!submittedShipData.endsWith(']')) {
      submittedShipData += ']';
    }
    if (!submittedShipData.startsWith('[')) {
      submittedShipData = `[${submittedShipData}`;
    }
    if (submittedShipData.endsWith('},]')) {
      submittedShipData = submittedShipData.replace('},]', '}]');
    }
    const previousShipData: ShipData[] =
      JSON.parse(localStorage.getItem('effsLocalShipData') || '[]');
    try {
      const submittedArray: ShipData[] = JSON.parse(submittedShipData);
      const newShipData = previousShipData.length > 0 ?
        [...previousShipData, ...submittedArray] : [...submittedArray];
      const newShipDataStr = JSON.stringify(newShipData);
      submittedArray.forEach(shipData => ShipData.processing(shipData));
      submittedArray.forEach(shipData => ships.push(shipData));
      const newShipNum = submittedArray.length;
      let addedFitsStr: string = '';
      if (newShipNum > 1) {
        addedFitsStr = `${newShipNum.toString()} fits`;
      } else {
        addedFitsStr = ` ${submittedArray[0].shipType || 'unknown'} fit`;
      }
      localStorage.setItem('effsLocalShipData', newShipDataStr);
      this.setState({
        fitData: '',
        addedFits: addedFitsStr,
        parseFailure: false,
        localShipData: this.updateLocalShipDropdown(),
      });
    } catch (err) {
      this.setState({ fitData: '', addedFits: '', parseFailure: true });
    }
  };
  render() {
    const {
      fitData, addedFits, parseFailure, localShipData, deleteSelection, deleteAllCheck,
    } = this.state;
    return (
      <div style={{
        height: '100%',
        width: '100%',
        top: '0%',
        position: 'fixed',
        paddingTop: 'calc(0.92857143em * 1.14285714 * 2 + 1.6em + 32.2344px)',
        overflowY: 'auto',
      }}
      >
        <Container className="pageContainer">
          <Header as="h5" attached="top">
            Add Fits
          </Header>
          <Segment attached>
            <Form success={addedFits.length > 0} error={parseFailure}>
              <Form.TextArea
                value={fitData}
                onChange={this.handleChange}
                label="Fit Data"
                placeholder="Paste Fit Data"
              />
              <Message
                success
                header={`Successfully added ${addedFits}`}
              />
              <Message
                error
                header="Unable to parse fit information"
                content="Make sure to use the data exactly as provided by pyfa's effs format."
              />
              <Form.Button value={fitData} onClick={this.addShipFitData}>
                Submit
              </Form.Button>
            </Form>
          </Segment>
          <Header as="h5" attached="top">
            Delete Fits
          </Header>
          <Segment attached>
            <Form success={deleteSelection.startsWith('Successfully deleted')}>
              <Form.Dropdown
                onChange={this.deleteDropdownChange}
                options={localShipData}
                placeholder="Select fit"
                label="Delete a single fit"
                inline
                scrolling
              />
              <Message
                success
                header={deleteSelection}
              />
              <Form.Button value={deleteSelection} onClick={this.deleteFit}>
                Delete fit
              </Form.Button>
            </Form>
            <Divider />
            <Form success={deleteSelection.startsWith('All local fits')}>
              <Message
                success
                header={deleteSelection}
              />
              <Form.Button
                negative
                content="Delete all"
                onClick={this.checkDeleteAll}
                label="Delete all local fits"
              />
              <Dimmer
                active={deleteAllCheck}
                onClickOutside={this.cancelDeleteAll}
                page
              >
                <Header as="h3" icon inverted>
                  This will permenently delete all locally stored ship fits
                </Header>
                <br />
                <Button.Group>
                  <Button
                    content="Cancel"
                    onClick={this.cancelDeleteAll}
                  />
                  <Button
                    negative
                    content="Confirm delete all"
                    onClick={this.wipeLocalFits}
                  />
                </Button.Group>
              </Dimmer>
            </Form>
          </Segment>
        </Container>
      </div>
    );
  }
}

export default UploadFits;
