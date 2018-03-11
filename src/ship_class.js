// @flow
import { Weapon, PendingAttack } from './weapon_classes';
import ShipData from './ship_data_class';

class Ship {
  name: string;
  id: number;
  iconColor: string;
  shipType: string;
  shipGroup: string;
  EHP: number;
  currentEHP: number;
  damage: number;
  damageType: string = '';
  reload: number;
  currentReload: number = 0;
  scanRes: number;
  velocity: number;
  alignTime: number;
  sigRadius: number;
  optimal: number;
  falloff: number;
  tracking: number;
  damageDelay: number;
  isAnchor: boolean;
  isShotCaller: boolean;
  shotCaller: ?Ship;
  anchor: ?Ship;
  targets: Ship[];
  weapons: Weapon[];
  maxTargets: number = 6;
  distanceFromTarget: number;
  maxTargetRange: number;
  droneControlRange: number;
  preferedDistance: number = -1;
  pendingDamage: PendingAttack[];
  constructor(
    currentShotCaller: Ship | null, currentAnchor: Ship | null,
    shipStats: ShipData, initalDistance: number,
  ) {
    if (shipStats !== null) {
      this.distanceFromTarget = initalDistance;
      this.shipType = shipStats.shipType ? shipStats.shipType : '';
      this.shipGroup = shipStats.shipGroup;
      this.name = shipStats.name;
      this.id = shipStats.id;
      this.EHP = shipStats.ehp.shield + shipStats.ehp.armor + shipStats.ehp.hull;
      this.damage = shipStats.weaponVolley;
      this.reload = 1000 * (shipStats.weaponVolley / shipStats.weaponDPS);
      this.scanRes = shipStats.scanRes;
      this.velocity = shipStats.maxSpeed;
      this.alignTime = shipStats.alignTime;
      this.sigRadius = shipStats.signatureRadius;
      this.maxTargets = shipStats.maxTargets;
      this.maxTargetRange = shipStats.maxTargetRange;
      this.droneControlRange = shipStats.droneControlRange;
      this.weapons = [];
      for (const wep of shipStats.weapons) {
        if (wep.type === 'Fighter') {
          for (const ability of wep.abilities) {
            ability.type = 'Fighter';
            const addedWep = new Weapon(ability);
            this.weapons.push(addedWep);
          }
        } else {
          const addedWep = new Weapon(wep);
          this.weapons.push(addedWep);
        }
      }
      if (this.weapons.length > 1) {
        this.weapons = this.weapons.sort((a, b) => b.dps - a.dps);
      }
    }
    this.currentEHP = this.EHP;
    this.isAnchor = false;
    this.isShotCaller = false;
    this.pendingDamage = [];
    if (currentShotCaller !== null) {
      this.shotCaller = currentShotCaller;
      this.targets = currentShotCaller.targets;
    } else {
      this.shotCaller = null;
      this.targets = [];
    }
    if (currentAnchor !== null) {
      this.anchor = currentAnchor;
    } else {
      this.anchor = null;
    }
  }
}
export default Ship;
