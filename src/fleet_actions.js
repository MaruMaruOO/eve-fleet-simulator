// @flow
import { Weapon, PendingAttack } from './weapon_classes';
import Ship from './ship_class';
import Side from './side_class';
import CheckForAmmoSwaps from './fleet_calculations/ammo_swap';
import { getTargets, updateProjectionTargets, updateProjTargetsIfNeeded } from './fleet_calculations/targeting';
import calculateDamage from './fleet_calculations/calculate_damage';
import { ApplyRemoteEffects } from './fleet_calculations/remote_effects';
import RunLocalEffects from './fleet_calculations/local_effects';
import GetUpdatedPreferedDistance from './fleet_calculations/range_selection';


function dealDamage(ship: Ship, t: number, wep: Weapon, side: Side) {
  if (ship.targets[0].currentEHP <= 0) {
    ship.targets.shift();
    if (ship.targets.length > 0) {
      dealDamage(ship, t, wep, side);
    }
  } else {
    wep.currentReload -= t;
    if (wep.currentReload <= 0) {
      const [target] = ship.targets;
      if (wep.bonusMulti && target !== ship.previousTarget) {
        wep.bonusMulti = 0;
        ship.previousTarget = target;
      }
      const attack = new PendingAttack(wep.getDamageDelay(ship.distanceFromTarget));
      wep.pendingDamage.push(attack);
      wep.currentReload = wep.reload;
    }
    let isPendingFinished = false;
    for (const pendingAttack of wep.pendingDamage) {
      pendingAttack.timer -= t;
      if (pendingAttack.timer <= 0) {
        const initalHP: number = ship.targets[0].currentEHP;
        const damage = calculateDamage(ship, ship.targets[0], wep, side);
        ship.targets[0].currentEHP -= damage;
        if (Number.isNaN(initalHP) || Number.isNaN(ship.targets[0].currentEHP)) {
          console.error(
            'Applied damage or target EHP is not a number, this is likely a bug.',
            wep, initalHP, ship.targets[0].currentEHP, ship,
          );
        }
        side.appliedDamage += initalHP - ship.targets[0].currentEHP;
        isPendingFinished = true;
        if (ship.isShotCaller) {
          const ind = ship.weapons.indexOf(wep);
          const sf = side.subFleets.find(s => s.fc === ship);
          if (sf && sf.wepAmmoSwapData[ind].currentAmmo) {
            sf.wepAmmoSwapData[ind].recentDamage.push(damage);
            sf.wepAmmoSwapData[ind].cycledSinceCheck = true;
            if (sf.wepAmmoSwapData[ind].chargesLeft > 0) {
              sf.wepAmmoSwapData[ind].chargesLeft -= 1;
            } else {
              sf.wepAmmoSwapData[ind].chargesLeft = sf.wepAmmoSwapData[ind].chargesHeld;
            }
          }
        }
      }
    }
    if (isPendingFinished) {
      wep.pendingDamage = wep.pendingDamage.filter(attack => attack.timer > 0);
    }
  }
}

function moveShip(ship: Ship, t: number, side: Side) {
  if (ship.targets.length <= 0) {
    return;
  }
  if (ship.isSupportShip && ship.projTargets.length > 0 && ship.projTargets[0][0].currentEHP < 0) {
    ship.projTargets.shift();
    moveShip(ship, t, side);
    return;
  }
  const { anchor } = ship;
  if (!ship.isAnchor && anchor) {
    ship.preferedDistance = anchor.preferedDistance;

    if (ship.isSupportShip) {
      // Note projTargets does not include remote repair effects
      // as they only target a single primary and target friendly ships.
      if (ship.isSupportShip && ship.projTargets.length > 0) {
        const v10 = ship.velocity / 10;
        updateProjTargetsIfNeeded(ship, v10);
        const projTargetsStill = anchor.projTargets.length > 0;
        const positioningTarget = projTargetsStill ? anchor.projTargets[0][0] : anchor.targets[0];
        const gapSize = ship.projTargets.length <= anchor.projTargets.length ? Math.max(
          Math.abs(ship.dis - anchor.pendingDis),
          Math.abs(ship.projTargets[0][0].dis - positioningTarget.dis),
        ) : Math.max(
          Math.abs(ship.dis - anchor.pendingDis),
          ...ship.projTargets.map(([a]) => Math.abs(a.dis - positioningTarget.dis)),
        );
        if (gapSize > v10) {
          const e0 = Math.abs(ship.dis - ship.projTargets[0][0].dis);
          const travelDistance = (ship.velocity * t) / 1000;
          if (gapSize > travelDistance) {
            if (ship.dis > ship.projTargets[0][0].dis) {
              if (e0 > ship.preferedDistance) {
                ship.pendingDis -= travelDistance;
              } else {
                ship.pendingDis += travelDistance;
              }
            } else if (ship.dis < ship.projTargets[0][0].dis) {
              if (e0 > ship.preferedDistance) {
                ship.pendingDis += travelDistance;
              } else {
                ship.pendingDis -= travelDistance;
              }
            }
            return;
          }
        }
      }
    }
    const gap = Math.abs(ship.dis - anchor.pendingDis);
    // We only calculate the location separately if it's slower or has a > 0.1 second gap.
    if (ship.velocity < anchor.velocity || gap > (ship.velocity / 10)) {
      const travelDistance = (ship.velocity * t) / 1000;
      if (gap > travelDistance) {
        if (ship.dis > anchor.pendingDis) {
          ship.pendingDis -= travelDistance;
        } else {
          ship.pendingDis += travelDistance;
        }
        return;
      }
    }
    ship.pendingDis = anchor.pendingDis;
    return;
  }
  if (ship.preferedDistance > -1) {
    if (ship.rangeRecalc <= 0) {
      /**
        * Recalculate the preferred range for all fc's at once to prevent
        * small discrepancies from reapplying the ewar after finishing.
        * This could be moved elsewhere to make it cleaner as
        * only each sides first rangeRecalc timer ever actually does anything.
        */
      const newPreferedDistances = [];
      for (const s of [side.oppSide, side]) {
        for (const subFleet of s.subFleets) {
          if (subFleet.fc.currentEHP > 0) {
            newPreferedDistances.push(GetUpdatedPreferedDistance(subFleet.fc, s));
          }
        }
      }
      // Only set preferedDistances after calculating all of them.
      // This prevents the order from potentially impacting the results.
      let index = 0;
      for (const s of [side.oppSide, side]) {
        for (const subFleet of s.subFleets) {
          if (subFleet.fc.currentEHP > 0) {
            subFleet.fc.preferedDistance = newPreferedDistances[index];
            index += 1;
          }
        }
      }
    }
    ship.rangeRecalc -= t;
    const travelDistance = (ship.velocity * t) / 1000;
    if (ship.isSupportShip && ship.projTargets.length > 1) {
      // Always update for anchors as the length can impact the subfleets movement.
      updateProjectionTargets(ship);
    }
    const useProjTarget = ship.isSupportShip && ship.projTargets.length > 0;
    const positioningTarget = useProjTarget ? ship.projTargets[0][0] : ship.targets[0];
    ship.distanceFromTarget = Math.abs(ship.dis - positioningTarget.dis);
    // This is to prevent overshoots, which can cause mirrors to chase each other.
    // (That's a problem as it causes application differences)
    if (Math.abs(ship.distanceFromTarget - ship.preferedDistance) < travelDistance) {
      if (ship.preferedDistance > ship.distanceFromTarget) {
        if (ship.dis < positioningTarget.dis) {
          ship.pendingDis = positioningTarget.dis - ship.preferedDistance;
        } else {
          ship.pendingDis = positioningTarget.dis + ship.preferedDistance;
        }
      } else if (ship.preferedDistance < ship.distanceFromTarget) {
        if (ship.dis < positioningTarget.dis) {
          ship.pendingDis = positioningTarget.dis - ship.preferedDistance;
        } else {
          ship.pendingDis = positioningTarget.dis + ship.preferedDistance;
        }
      }
      ship.distanceFromTarget = ship.preferedDistance;
    } else {
      if (ship.preferedDistance > ship.distanceFromTarget) {
        // Move closer based off relative positions (dis)
        if (ship.dis > positioningTarget.dis) {
          ship.pendingDis += travelDistance;
        } else {
          ship.pendingDis -= travelDistance;
        }
      } else if (ship.preferedDistance < ship.distanceFromTarget) {
        // Move away based off relative positions (dis)
        if (ship.dis < positioningTarget.dis) {
          ship.pendingDis += travelDistance;
        } else {
          ship.pendingDis -= travelDistance;
        }
      }
      ship.distanceFromTarget = Math.abs(ship.dis - ship.targets[0].dis);
    }
    return;
  }
  // should avoid setting on the first tick to allow ewar to apply
  if (ship.preferedDistance === -1 || ship.preferedDistance === -2) {
    ship.preferedDistance -= 1;
    return;
  }
  ship.preferedDistance = GetUpdatedPreferedDistance(ship, side);
}

let timeElapsed = 0;

function RunFleetActions(side: Side, t: number, opposingSide: Side, isSideOneOfTwo: ?boolean) {
  if (isSideOneOfTwo === true) {
    timeElapsed += t;
    for (const s of [side, opposingSide]) {
      for (const ship of s.ships) {
        if (ship.totalIncomingReps > 0) {
          if (ship.isIncomingRepsToBeSorted) {
            ship.incomingReps.sort((a, b) => a[0] - b[0]);
            ship.isIncomingRepsToBeSorted = false;
          }
          while (ship.incomingReps.length > 0 && timeElapsed >= ship.incomingReps[0][0]) {
            const expiredRep = ship.incomingReps.shift();
            ship.totalIncomingReps -= expiredRep[1];
          }
        }
      }
      const os = s === side ? opposingSide : side;
      for (const subfleet of s.subFleets) {
        CheckForAmmoSwaps(s, subfleet, os);
      }
    }

    ApplyRemoteEffects(side, t, opposingSide, timeElapsed);
    ApplyRemoteEffects(opposingSide, t, side, timeElapsed);

    for (const s of [side, opposingSide]) {
      for (const ship of s.ships) {
        RunLocalEffects(ship, t, s);
      }
    }

    for (const s of [side, opposingSide]) {
      for (const subFleet of s.subFleets) {
        const ship = subFleet.fc;
        if (ship.isShotCaller === true) {
          while (ship.targets.length > 0 && ship.targets[0].currentEHP <= 0) {
            ship.targets.shift();
          }
          if (ship.targets.length < ship.maxTargets) {
            getTargets(ship, s.oppSide);
          }
        }
      }
    }

    for (const s of [side, opposingSide]) {
      for (const ship of s.ships) {
        moveShip(ship, t, s);
      }
    }

    for (const s of [side, opposingSide]) {
      for (const ship of s.ships) {
        ship.dis = ship.pendingDis;
        ship.distanceFromTarget = Math.abs(ship.dis - ship.targets[0].pendingDis);
        if (ship.currentEHP < ship.EHP && ship.velocity > 0) {
          ship.rrDelayTimer += t;
        }
      }
    }
  }

  const initalDamage = side.appliedDamage;
  for (const ship of side.ships) {
    // This will somewhat fade meaningfully scrammed or webbed ships.
    // Ideally at some point a more robust and broad system should be
    // implemented to show various states and projected effects.
    if (ship.velocity < ship.baseVelocity / 2) {
      if (ship.iconColor === ship.baseIconColor) {
        const rgb = ship.iconColor.slice(4, -1).split(', ');
        ship.iconColor = `rgba(${rgb[0]}, ${rgb[1]}, ${rgb[2]}, 0.7)`;
      }
    } else {
      ship.iconColor = ship.baseIconColor;
    }
    for (const wep of ship.weapons) {
      if (ship.targets.length > 0) {
        dealDamage(ship, t, wep, side);
      }
    }
  }

  const sideHasAppliedDamage = initalDamage !== side.appliedDamage;
  return sideHasAppliedDamage;
}

export default RunFleetActions;
