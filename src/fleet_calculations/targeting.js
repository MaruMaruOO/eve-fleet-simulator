// @flow
import Ship from './../ship_class';
import type { Ewar } from './../ship_class';
import Side from './../side_class';

function findNewTarget(targetCaller: Ship, opposingSide: Side): ?Ship {
  let oppShips = opposingSide.ships;
  if (oppShips.length > targetCaller.maxTargets) {
    oppShips = oppShips.slice(0, targetCaller.maxTargets + 1);
  }
  let newTarget = oppShips.find(oppShip =>
    !oppShip.isShotCaller &&
    !targetCaller.targets.some(target => target === oppShip) && oppShip.currentEHP > 0);
  const possibleFcTarget = oppShips.find(oppShip =>
    !targetCaller.targets.some(target => target === oppShip) && oppShip.currentEHP > 0);
  // This should target the fc if it's the last ship left in the group
  if (!newTarget || (possibleFcTarget && possibleFcTarget.id !== newTarget.id)) {
    newTarget = possibleFcTarget;
  }
  return newTarget;
}

function getTargets(targetCaller: Ship, opposingSide: Side) {
  const newTarget = findNewTarget(targetCaller, opposingSide);
  if (newTarget) {
    targetCaller.targets.push(newTarget);
    if (targetCaller.targets.length < targetCaller.maxTargets) {
      getTargets(targetCaller, opposingSide);
    }
  }
}

/**
  * Returns the first target that would be selected if there were no targets selected
  * and all the ships were alive.
  */
function getDoaTarget(ship: Ship, opposingSide: Side) {
  let prevT: ?Ship;
  for (const t of opposingSide.ships) {
    if (!t.isShotCaller || opposingSide.ships.length === 1) {
      return t;
    }
    const posFcTarg: ?Ship = prevT;
    if (posFcTarg && posFcTarg.id !== t.id) {
      return posFcTarg;
    }
    prevT = t;
  }
  return opposingSide.ships[0];
}

function getFocusedEwarTarget(targets: Ship[], type: 'tps' | 'webs', multi: number) {
  // Targets.length > 1 not 0 because a single target often indicates a forced target
  // When it doesn't targeting a dead ship shouldn't cause any issues anyway.
  while (targets.length > 1 && targets[0].currentEHP <= 0) {
    targets.shift();
  }
  for (let i = 0; i < targets.length; i += 1) {
    const t = targets[i];
    t.appliedEwar[type].sort((a, b) => Math.abs(b[0]) - Math.abs(a[0]));
    if (t.appliedEwar[type].length <= 6 || Math.abs(t.appliedEwar[type][5][0]) < Math.abs(multi)) {
      i = targets.length;
      return t;
    }
  }
  return targets[0];
}

function updateProjectionTargets(ship: Ship, ewar: Ewar | null = null) {
  if (ewar && ewar.currentTarget) {
    const eTarg = ewar.currentTarget;
    ship.projTargets = ship.projTargets.filter(([a, e]) =>
      e.currentTarget && e.currentTarget.currentEHP > 0 && a === e.currentTarget);

    if (!ship.projTargets.some(e => e[0] === eTarg && e[1] === ewar)) {
      ship.projTargets.push([eTarg, ewar]);
    }
  }
  ship.projTargets = ship.projTargets.filter(([a, e]) =>
    e.currentTarget && e.currentTarget.currentEHP > 0 && a === e.currentTarget);

  const v10 = ship.velocity / 10;
  ship.projTargets.sort(([, a], [, b]) => {
    const act = a.currentTarget;
    const bct = b.currentTarget;
    if (act && bct) {
      // It might be worth changing this to sort based off the distance relative
      // to the optimal not the absolute distance (though the expected impact is tiny).
      const va = Math.abs(ship.dis - act.dis);
      const vb = Math.abs(ship.dis - bct.dis);
      const da = Math.abs(act.dis - bct.dis);
      const isAssOrder = (va > v10 + a.optimal && vb > v10 + b.optimal) ||
        (da > a.optimal + b.optimal + (2 * v10));
      if (isAssOrder) {
        return va - vb;
      }
      return vb - va;
    }
    console.error(`${JSON.stringify(ship)} is unexpectedly missing currentTarget data`
                  + `for ${JSON.stringify(a)} or ${JSON.stringify(b)}`);
    return -1;
  });
}

function updateProjTargetsIfNeeded(ship: Ship, v10: number) {
  if (ship.projTargets.length > 1) {
    const e0 = Math.abs(ship.dis - ship.projTargets[0][0].dis);
    const e1 = Math.abs(ship.dis - ship.projTargets[1][0].dis);
    const da = Math.abs(ship.projTargets[0][0].dis - ship.projTargets[1][0].dis);
    const isAssOrder =
      (e0 > ship.projTargets[0][1].optimal + v10 && e1 > ship.projTargets[1][1].optimal + v10)
      || (da > ship.projTargets[0][1].optimal + ship.projTargets[1][1].optimal + (2 * v10));
    if (e1 > e0 && !isAssOrder) {
      updateProjectionTargets(ship);
    } else if (e1 < e0 && isAssOrder) {
      updateProjectionTargets(ship);
    }
  }
}

export {
  getTargets, getDoaTarget, getFocusedEwarTarget,
  updateProjectionTargets, updateProjTargetsIfNeeded,
};
