// @flow
import Ship from './../ship_class';
import Side from './../side_class';
import type { Subfleet } from './../side_class';

/**
 * Used to get a typical representative of the ships subfleet.
 * The return should be functionally equivalent to:
 *   side.ships.filter(s => s.id === ship.id)[Math.floor(shipsInSubFleet.length / 2)];
 * This is a touch more convoluted but runs much faster for large fights.
 */
function getMidShip(side: Side, ship: Ship) {
  const sf: ?Subfleet = side.subFleets.find(f => f.fc === ship.anchor || f.fc === ship);
  if (sf) {
    let ds = side.deadShips.length;
    if (ds > sf.initalStartInd) {
      const dso = sf.initalStartInd;
      const dss = (ds - sf.initalStartInd) / 2;
      ds = dso + dss;
    }
    const mIndex = Math.floor(sf.initalStartInd + ((sf.n / 2) - ds));
    // If the entire subfleet is dead give the mid ship for the next subfleet.
    // This should be extremely rare and only occur when calculating preferred range.
    if (mIndex === 0 && ship.id !== side.ships[mIndex].id) {
      return getMidShip(side, side.ships[0]);
    }
    return side.ships[mIndex];
  }
  console.error('Failed to find midShip for:', ship, '. Returning ship instead');
  return ship;
}

export default getMidShip;
