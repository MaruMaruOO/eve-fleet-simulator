// @flow
import React, { useState } from 'react';
import { Input, Checkbox, Dropdown, Button, Message } from 'semantic-ui-react';
import { importFromData, importFromText, dataFromCurrent, textFromCurrent, restoreNames } from './../load_fleet';
import type { FullUI } from './../index';
import type { FleetSet, SyntheticInputEvent, SyntheticButtonEvent, SyntheticDropdownEvent } from './../flow_types';

function SaveLoadDropdown(props: { fullui: FullUI }) {
  // Syntax used to avoid recalculating "savedFleets" every render.
  const [savedFleetNames, setNames] = useState(() => {
    const savedFleets: FleetSet[] = JSON.parse(localStorage.getItem('savedFleets') || '[]');
    const names = savedFleets.map((f, i) =>
      ({ key: i, text: f.name || 'name not found', value: f.name }));
    return names;
  });

  const [lastLoad, setLastLoad] = useState('Fleet Name');
  const [lastDelete, setLastDelete] = useState('');
  const [enteredName, setEnteredName] = useState('');
  const [fleetText, setFleetText] = useState('');
  const [inFleetText, setInFleetText] = useState('');
  const [saveMissingFits, setSaveMissingFits] = useState(false);
  const [saveError, setSaveError] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [saveMessageText, setSaveMessageText] = useState('');
  const [parseError, setParseError] = useState(false);
  const [parseErrorText, setParseErrorText] = useState('');

  const stopDefaultPropagation = (e) => {
    e.preventDefault();
    e.stopPropagation();
  };
  const updateName = (...args: [null, { value: string }]) => {
    const [, objData] = args;
    setEnteredName(objData.value);
  };
  const cleanDropdownState = () => {
    setLastLoad('Fleet Name');
    setLastDelete('Fleet Name');
    setEnteredName('');
    setFleetText('');
    setInFleetText('');
    setSaveError(false);
    setSaveSuccess(false);
    setSaveMessageText('');
    setParseError(false);
    setParseErrorText('');
  };
  // Note this has to be triggered onBlur not onClose.
  const onDropClose = (e: SyntheticDropdownEvent) => {
    stopDefaultPropagation(e);
  };
  const loadFleet = (
    e: SyntheticDropdownEvent,
    objData: { value: string },
  ) => {
    if (objData.value === 'Fleet Name') {
      setLastLoad(objData.value);
      return;
    }
    if (objData.value !== lastLoad) {
      const savedFleets: FleetSet[] = JSON.parse(localStorage.getItem('savedFleets') || '[]');
      const selectedFleet = savedFleets.find(f => f.name === objData.value);
      if (selectedFleet) {
        setLastLoad(selectedFleet.name);
        importFromData(selectedFleet.fleets, saveMissingFits);
      } else {
        console.error(`Could not find fleet with name "${objData.value}".`);
      }
    }
  };
  const deleteFleet = (
    e: SyntheticDropdownEvent,
    objData: { value: string },
  ) => {
    if (objData.value === 'Fleet Name') {
      setLastDelete(objData.value);
      return;
    }
    if (objData.value !== lastDelete) {
      const savedFleets: FleetSet[] = JSON.parse(localStorage.getItem('savedFleets') || '[]');
      const selectedFleetInd = savedFleets.findIndex(f => f.name === objData.value);
      const selectedFleet = savedFleets[selectedFleetInd];
      savedFleets.splice(selectedFleetInd, 1);
      setLastDelete('Fleet Name');
      if (selectedFleet.name === lastLoad) {
        setLastLoad('Fleet Name');
      }
      localStorage.setItem('savedFleets', JSON.stringify(savedFleets));
      const names = savedFleets.map((f, i) =>
        ({ key: i, text: f.name || 'name not found', value: f.name }));
      setNames(names);
    }
  };
  const saveFleet = () => {
    const saveData: FleetSet[] = JSON.parse(localStorage.getItem('savedFleets') || '[]');
    const inputName: string = enteredName;
    if (!inputName || saveData.some(f => f.name === inputName)) {
      setSaveError(true);
      if (inputName) {
        setSaveMessageText((
          <Message style={{ marginTop: '0.6em' }} error>
            You already have a fleet using the name &quot;{inputName}&quot;.<br />
            Fleet names must be unique, please select another.
          </Message>
        ));
      } else {
        setSaveMessageText((
          <Message style={{ marginTop: '0.6em' }} error>
            Please give the fleet a name in order to save it.
          </Message>
        ));
      }
      return;
    }
    const [fleetData, originalNames] = dataFromCurrent();
    const current = { name: inputName, fleets: fleetData };
    saveData.push(current);
    const stringData = JSON.stringify(saveData);
    localStorage.setItem('savedFleets', stringData);
    // Restores deduping info (ie (1) ect).
    restoreNames(fleetData, originalNames);
    const names = saveData.map((f, i) =>
      ({ key: i, text: f.name || 'name not found', value: f.name }));
    setNames(names);
    setSaveError(false);
    setSaveSuccess(true);
    setSaveMessageText((
      <Message style={{ marginTop: '0.6em' }} success>
        Successfully saved fleet {inputName}.
      </Message>
    ));
  };
  const addFleetText = (e: SyntheticButtonEvent) => {
    const text = textFromCurrent();
    setFleetText(text);
    stopDefaultPropagation(e);
  };
  const loadFleetFromText = () => {
    try {
      importFromText(inFleetText, saveMissingFits);
      setParseError(false);
    } catch (e) {
      console.log(e);
      setParseError(true);
      setParseErrorText((
        <Message style={{ marginTop: '0.6em', textAlign: 'left' }} error>
          <Message.Header>Failed to parse fleet details.</Message.Header>
          Please check you have pasted the correct data and try again.<br />
          Error Details: {e.message}
        </Message>
      ));
    }
  };
  const updateInFleetText = (
    e: SyntheticInputEvent,
    objData: { value: string },
  ) => {
    setInFleetText(objData.value);
  };
  const saveMissingFitsToggle = (e: SyntheticDropdownEvent) => {
    setSaveMissingFits(!saveMissingFits);
    stopDefaultPropagation(e);
  };
  const buttonColors = props.fullui.GetButtonColors();
  return (
    <Dropdown item pointing floating text="Load or Save Fleet" onClose={cleanDropdownState}>
      <Dropdown.Menu>
        <Dropdown.Item onClick={stopDefaultPropagation}>
          <Input
            placeholder="Name..."
            onClick={stopDefaultPropagation}
            onChange={updateName}
            action={<Button className={buttonColors[2]} type="submit" onClick={saveFleet}>Save</Button>}
            error={saveError}
            value={enteredName}
          />
          {saveError || saveSuccess ? saveMessageText : ''}
        </Dropdown.Item>
        <Dropdown.Item onClick={stopDefaultPropagation}>
          <Dropdown
            text="Load Fleet..."
            fluid
            floating
            direction="left"
            onBlur={onDropClose}
            onChange={loadFleet}
            options={[{ key: -1, text: 'Fleet Name', value: 'Fleet Name' }, ...savedFleetNames]}
            value={lastLoad}
          />
        </Dropdown.Item>
        <Dropdown.Item onClick={stopDefaultPropagation}>
          <Input
            placeholder="Copy Fleet Text"
            onClick={stopDefaultPropagation}
            spellCheck="false"
            autoComplete="off"
            autoCorrect="off"
            autoCapitalize="off"
            value={fleetText}
            action={<Button className={buttonColors[2]} type="submit" onClick={addFleetText}>Get Fleet Data</Button>}
          />
        </Dropdown.Item>
        <Dropdown.Item onClick={stopDefaultPropagation} className="semi-attached-dropdown-item">
          <Input
            placeholder="Paste Fleet Text"
            onClick={stopDefaultPropagation}
            onChange={updateInFleetText}
            spellCheck="false"
            autoComplete="off"
            autoCorrect="off"
            autoCapitalize="off"
            action={
              <Button className={buttonColors[2]} type="submit" onClick={loadFleetFromText}>
                Load fleet from text
              </Button>}
            error={parseError}
            value={inFleetText}
          />
          <br />
          <span onClick={saveMissingFitsToggle} role="presentation">Save new fits locally.</span>
          <Checkbox fitted={false} onChange={saveMissingFitsToggle} checked={saveMissingFits} />
          {parseError ? parseErrorText : ''}
        </Dropdown.Item>
        <Dropdown.Item onClick={stopDefaultPropagation}>
          <Dropdown
            text="Delete Fleets..."
            fluid
            floating
            direction="left"
            onBlur={onDropClose}
            onChange={deleteFleet}
            options={[{ key: -1, text: 'Fleet Name', value: 'Fleet Name' }, ...savedFleetNames]}
            value={lastDelete}
          />
        </Dropdown.Item>
      </Dropdown.Menu>
    </Dropdown>
  );
}
export default SaveLoadDropdown;
