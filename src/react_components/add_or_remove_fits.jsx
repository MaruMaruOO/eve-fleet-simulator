// @flow
import React from 'react';
import type { Element } from 'react';
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

function FixNameIfDupeAndAdd(shipData: ShipData) {
  // Find any ships with the same type and base name
  const typeMatches = ships.filter(s => s.typeID === shipData.typeID);
  const regex = new RegExp(`${shipData.name} \\(\\d+\\)$`);
  const nameMatches = typeMatches.filter(s => s.name === shipData.name || regex.test(s.name));
  // Find how high the (1), (2) ect numbers go, this isn't always length + 1 due to deletions.
  let maxN: number = 0;
  nameMatches.forEach((s) => {
    const ind = s.name.lastIndexOf(' ');
    const n = Number(s.name.substring(ind + 2).replace(')', ''));
    if (n && n > maxN) {
      maxN = n;
    }
  });
  // Adjust the name if needed then add the ship.
  if (maxN) {
    shipData.name += ` (${maxN + 1})`;
  } else if (nameMatches.length === 1) {
    shipData.name += ' (1)';
  }
  ships.push(shipData);
}

type AddOrRemoveFitsState = {
  fitData: string, addedFits: string, parseFailure: boolean, specificParseError: Element<'p'> | '',
  localShipData: { key: number, text: string, value: string }[], deleteSelection: string,
  deleteAllCheck: boolean,
};
class AddOrRemoveFits extends React.Component<{ }, AddOrRemoveFitsState> {
  constructor(props: { }) {
    super(props);
    this.updateLocalShipDropdown = () => {
      const localFits: ShipData[] = JSON.parse(localStorage.getItem('efsLocalShipData') || '[]');
      ShipData.fixDupeNames(localFits);
      return localFits.map((s, i) => ({ key: i, text: s.name, value: i.toString() }));
    };
    this.state = {
      fitData: '',
      addedFits: '',
      parseFailure: false,
      specificParseError: '',
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
    const localFits: ShipData[] = JSON.parse(localStorage.getItem('efsLocalShipData') || '[]');
    const ind: number = Number(value !== '' ? value : NaN);
    if (!Number.isNaN(ind)) {
      ships.splice((ships.length - localFits.length) + ind, 1);
      const [{ name }] = localFits.splice(ind, 1);
      localStorage.setItem('efsLocalShipData', JSON.stringify(localFits));
      const newLocalShipData = this.state.localShipData;
      newLocalShipData.splice(ind, 1);
      this.setState({
        localShipData: newLocalShipData,
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
    localStorage.setItem('efsLocalShipData', JSON.stringify([]));
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
      JSON.parse(localStorage.getItem('efsLocalShipData') || '[]');
    try {
      const submittedArray: ShipData[] = JSON.parse(submittedShipData);
      const minimumEfsExportVersion = 0.02;
      for (const newFit of submittedArray) {
        if (newFit.efsExportVersion && newFit.efsExportVersion < minimumEfsExportVersion) {
          const oldExportError = (
            <p>
              Found one or more fit/s exported using pyfa version {newFit.pyfaVersion} and
              EFS Export version {newFit.efsExportVersion}.<br />
              This version of EFS requires EFS export version {minimumEfsExportVersion} or newer
              to function correctly. <br />
              Please export the fit/s with a newer version of pyfa and try again.
            </p>
          );
          this.setState({
            fitData: '', addedFits: '', parseFailure: true, specificParseError: oldExportError,
          });
          return;
        }
      }
      const newShipData = previousShipData.length > 0 ?
        [...previousShipData, ...submittedArray] : [...submittedArray];
      const newShipDataStr = JSON.stringify(newShipData);
      submittedArray.forEach(shipData => ShipData.processing(shipData));
      submittedArray.forEach(FixNameIfDupeAndAdd);
      const newShipNum = submittedArray.length;
      let addedFitsStr: string = '';
      if (newShipNum > 1) {
        addedFitsStr = `${newShipNum.toString()} fits`;
      } else {
        addedFitsStr = ` ${submittedArray[0].shipType || 'unknown'} fit`;
      }
      localStorage.setItem('efsLocalShipData', newShipDataStr);
      this.setState({
        fitData: '',
        addedFits: addedFitsStr,
        parseFailure: false,
        localShipData: this.updateLocalShipDropdown(),
      });
    } catch (err) {
      this.setState({
        fitData: '', addedFits: '', parseFailure: true, specificParseError: '',
      });
    }
  };
  render() {
    const {
      fitData, addedFits, parseFailure, specificParseError,
      localShipData, deleteSelection, deleteAllCheck,
    } = this.state;
    return (
      <div className="pageMainContentWrapper">
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
                spellCheck="false"
                autoComplete="off"
                autoCorrect="off"
                autoCapitalize="off"
              />
              <Message
                success
                header={`Successfully added ${addedFits}`}
              />
              <Message
                error
                header="Unable to parse fit information"
                content={specificParseError || "Make sure to use the data exactly as provided by pyfa's EFS format."}
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

export { AddOrRemoveFits, FixNameIfDupeAndAdd };
