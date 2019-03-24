// @flow
import ShipDataDisplayManager from './ship_data_display_manager';
import { sideOneShips, sideTwoShips, UIRefresh } from './index';
import { FixNameIfDupeAndAdd } from './react_components/add_or_remove_fits';
import { ships } from './react_components/sidebar_ship_display';
import ShipData from './ship_data_class';
import type { SideShipInfo } from './index';
import type { FleetData } from './flow_types';

// Removes "(1)", "(2)" ect.
function removeDupeNameSuffix(shipSet: SideShipInfo[]) {
  const regex = new RegExp(' \\(\\d+\\)$');
  const originalNames: string[] = [];
  for (const s of shipSet) {
    originalNames.push(s.ship.name);
    const res = regex.exec(s.ship.name);
    if (res) {
      s.ship.name = s.ship.name.substring(0, res.index);
    }
  }
  return originalNames;
}

function restoreNames(data: FleetData, originalNames: string[]) {
  let i = 0;
  for (const s of [...data.sideOne, ...data.sideTwo]) {
    s.ship.name = originalNames[i];
    i += 1;
  }
}

function dataFromCurrent(s1: SideShipInfo[] = sideOneShips, s2: SideShipInfo[] = sideTwoShips) {
  const data = { sideOne: [], sideTwo: [] };
  for (const s of s1) {
    data.sideOne.push({ n: s.n, ship: s.ship });
  }
  for (const s of s2) {
    data.sideTwo.push({ n: s.n, ship: s.ship });
  }
  const originalNames = removeDupeNameSuffix([...data.sideOne, ...data.sideTwo]);
  return [data, originalNames];
}
function textFromCurrent(s1: SideShipInfo[] = sideOneShips, s2: SideShipInfo[] = sideTwoShips) {
  const [data, originalNames] = dataFromCurrent(s1, s2);
  const str = JSON.stringify(data);
  restoreNames(data, originalNames);
  return str;
}

function importFromData(data: FleetData, saveMissingFits: boolean) {
  while (sideOneShips.length > 0) {
    sideOneShips.pop();
  }
  while (sideTwoShips.length > 0) {
    sideTwoShips.pop();
  }
  const fitsToSave: [ShipData, string][] = [];
  for (const s of [...data.sideOne, ...data.sideTwo]) {
    const matchingShip = ships.find(ship => ship.dataID === s.ship.dataID);
    // Adjust the name and id if we already have the exact fit (they aren't consistent).
    if (matchingShip) {
      s.ship.id = matchingShip.id;
      s.ship.name = matchingShip.name;
    } else {
      // Otherwise adjust the name as needed, add the fit and update the sidebar.
      if (ShipDataDisplayManager.isDisplayModeFit) {
        ShipDataDisplayManager.forceSidebarUpdate = true;
      }
      if (saveMissingFits) {
        fitsToSave.push([s.ship, s.ship.name]);
      }
      FixNameIfDupeAndAdd(s.ship);
    }
  }
  if (fitsToSave.length > 0) {
    const pairNameSwap = (pairs: [ShipData, string][]) => {
      for (const pair of pairs) {
        const [sd, newName] = pair;
        const loadedName = sd.name;
        sd.name = newName;
        pair[1] = loadedName;
      }
    };
    const previousShipData: ShipData[] =
          JSON.parse(localStorage.getItem('efsLocalShipData') || '[]');
    // Swap names so the unmodified name is stringified.
    pairNameSwap(fitsToSave);
    const newShipData = previousShipData.length > 0 ?
      [...previousShipData, ...fitsToSave.map(p => p[0])] : [...fitsToSave.map(p => p[0])];
    const newShipDataStr = JSON.stringify(newShipData);
    localStorage.setItem('efsLocalShipData', newShipDataStr);
    // Swaps back to the normal names.
    pairNameSwap(fitsToSave);
  }

  for (const s of data.sideOne) {
    sideOneShips.push({ n: s.n, ship: s.ship, iconColor: undefined });
  }
  for (const s of data.sideTwo) {
    sideTwoShips.push({ n: s.n, ship: s.ship, iconColor: undefined });
  }
  UIRefresh();
}

function importFromText(dataStr: string, saveMissingFits: boolean) {
  const data: FleetData = JSON.parse(dataStr);
  importFromData(data, saveMissingFits);
}

export { restoreNames, textFromCurrent, importFromText, dataFromCurrent, importFromData };
