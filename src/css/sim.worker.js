/******/ (function(modules) { // webpackBootstrap
/******/ 	// The module cache
/******/ 	var installedModules = {};
/******/
/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {
/******/
/******/ 		// Check if module is in cache
/******/ 		if(installedModules[moduleId]) {
/******/ 			return installedModules[moduleId].exports;
/******/ 		}
/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = installedModules[moduleId] = {
/******/ 			i: moduleId,
/******/ 			l: false,
/******/ 			exports: {}
/******/ 		};
/******/
/******/ 		// Execute the module function
/******/ 		modules[moduleId].call(module.exports, module, module.exports, __webpack_require__);
/******/
/******/ 		// Flag the module as loaded
/******/ 		module.l = true;
/******/
/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}
/******/
/******/
/******/ 	// expose the modules object (__webpack_modules__)
/******/ 	__webpack_require__.m = modules;
/******/
/******/ 	// expose the module cache
/******/ 	__webpack_require__.c = installedModules;
/******/
/******/ 	// define getter function for harmony exports
/******/ 	__webpack_require__.d = function(exports, name, getter) {
/******/ 		if(!__webpack_require__.o(exports, name)) {
/******/ 			Object.defineProperty(exports, name, {
/******/ 				configurable: false,
/******/ 				enumerable: true,
/******/ 				get: getter
/******/ 			});
/******/ 		}
/******/ 	};
/******/
/******/ 	// getDefaultExport function for compatibility with non-harmony modules
/******/ 	__webpack_require__.n = function(module) {
/******/ 		var getter = module && module.__esModule ?
/******/ 			function getDefault() { return module['default']; } :
/******/ 			function getModuleExports() { return module; };
/******/ 		__webpack_require__.d(getter, 'a', getter);
/******/ 		return getter;
/******/ 	};
/******/
/******/ 	// Object.prototype.hasOwnProperty.call
/******/ 	__webpack_require__.o = function(object, property) { return Object.prototype.hasOwnProperty.call(object, property); };
/******/
/******/ 	// __webpack_public_path__
/******/ 	__webpack_require__.p = "";
/******/
/******/ 	// Load entry module and return exports
/******/ 	return __webpack_require__(__webpack_require__.s = 4);
/******/ })
/************************************************************************/
/******/ ([
/* 0 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


Object.defineProperty(exports, "__esModule", {
  value: true
});

var _ship_class = __webpack_require__(1);

var _ship_class2 = _interopRequireDefault(_ship_class);

var _ship_data_class = __webpack_require__(3);

var _ship_data_class2 = _interopRequireDefault(_ship_data_class);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function mapProjection(subfleet, projection, ship) {
  if (['Stasis Web', 'Weapon Disruptor', 'Warp Scrambler', 'Target Painter', 'Sensor Dampener', 'ECM'].some(function (type) {
    return type === projection.type;
  })) {
    var _ewar = Object.assign({}, projection);
    _ewar.currentDuration = 0;
    _ewar.currentTarget = null;
    _ewar.attachedShip = ship;
    subfleet.ewar.push(_ewar);
  } else if (['Remote Shield Booster', 'Remote Armor Repairer'].some(function (type) {
    return type === projection.type;
  })) {
    var rr = Object.assign({}, projection);
    rr.currentDuration = 0;
    rr.currentTarget = null;
    rr.scanRes = ship.scanRes;
    rr.attachedShip = ship;
    subfleet.remoteRepair.push(rr);
  }
}

var Side = function Side(color) {
  var _this = this;

  _classCallCheck(this, Side);

  this.reactionTime = 1000;
  this.ships = [];
  this.deadShips = [];
  this.subFleets = [];
  this.subFleetEffectPurgeTimer = 120000;
  this.theoreticalDamage = 0;
  this.appliedDamage = 0;
  this.damageApplicationRatio = this.appliedDamage / this.theoreticalDamage;

  this.makeFleet = function (sidesShips, initalDistance, dronesEnabled) {
    _this.uniqueFitCount = 0;
    _this.totalShipCount = 0;
    var colorChangePerShip = 255 / sidesShips.length;
    var _iteratorNormalCompletion = true;
    var _didIteratorError = false;
    var _iteratorError = undefined;

    try {
      for (var _iterator = sidesShips[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
        var shipClass = _step.value;

        _this.uniqueFitCount += 1;
        _this.totalShipCount += shipClass.n;
        var alternateColoring = _this.uniqueFitCount % 2 === 0;
        var colorShift = ((_this.uniqueFitCount - 1) * colorChangePerShip).toFixed(0);
        if (!shipClass.iconColor) {
          shipClass.iconColor = _this.color === 'red' ? 'rgb(' + (alternateColoring ? '180' : '255') + ', ' + colorShift + ', ' + (alternateColoring ? '80' : '0') + ')' : 'rgb(' + (alternateColoring ? '80' : '0') + ', ' + colorShift + ', ' + (alternateColoring ? '180' : '255') + ')';
        }
        var iconColor = shipClass.iconColor;

        var lastShotCaller = null;
        var lastAnchor = null;
        var shipStats = shipClass.ship;
        var size = shipClass.n;
        for (var i = 0; i < size; i += 1) {
          var localShip = new _ship_class2.default(lastShotCaller, lastAnchor, shipStats, initalDistance, dronesEnabled);
          if (i === 0 || i % _this.targetGrouping === 0) {
            localShip.isAnchor = true;
            localShip.isShotCaller = true;
            localShip.rangeRecalc = 10000;
            lastShotCaller = localShip;
            lastAnchor = localShip;
            _this.subFleets.push({
              fc: localShip,
              ewar: [],
              remoteRepair: [],
              initalStartInd: _this.totalShipCount - shipClass.n,
              n: size
            });
            console.log(shipStats);
            console.log(localShip);
          }
          var _iteratorNormalCompletion2 = true;
          var _didIteratorError2 = false;
          var _iteratorError2 = undefined;

          try {
            for (var _iterator2 = shipStats.projections[Symbol.iterator](), _step2; !(_iteratorNormalCompletion2 = (_step2 = _iterator2.next()).done); _iteratorNormalCompletion2 = true) {
              var projection = _step2.value;

              mapProjection(_this.subFleets[_this.uniqueFitCount - 1], projection, localShip);
            }
          } catch (err) {
            _didIteratorError2 = true;
            _iteratorError2 = err;
          } finally {
            try {
              if (!_iteratorNormalCompletion2 && _iterator2.return) {
                _iterator2.return();
              }
            } finally {
              if (_didIteratorError2) {
                throw _iteratorError2;
              }
            }
          }

          localShip.iconColor = iconColor;
          localShip.dis = _this.color === 'red' ? 0.5 * initalDistance : -0.5 * initalDistance;
          localShip.pendingDis = localShip.dis;
          _this.ships.push(localShip);
        }
      }
    } catch (err) {
      _didIteratorError = true;
      _iteratorError = err;
    } finally {
      try {
        if (!_iteratorNormalCompletion && _iterator.return) {
          _iterator.return();
        }
      } finally {
        if (_didIteratorError) {
          throw _iteratorError;
        }
      }
    }
  };

  this.targetGrouping = 1000;
  this.color = color;
  return this;
};

exports.default = Side;

/***/ }),
/* 1 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


Object.defineProperty(exports, "__esModule", {
  value: true
});

var _weapon_classes = __webpack_require__(2);

var _ship_data_class = __webpack_require__(3);

var _ship_data_class2 = _interopRequireDefault(_ship_data_class);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var Ship = function Ship(currentShotCaller, currentAnchor, shipStats, initalDistance, dronesEnabled) {
  _classCallCheck(this, Ship);

  this.damageType = '';
  this.currentReload = 0;
  this.maxTargets = 6;
  this.preferedDistance = -1;
  this.appliedEwar = {
    webs: [],
    tps: [],
    scrams: [],
    maxTargetRangeBonus: [],
    scanResolutionBonus: [],
    trackingSpeedBonus: [],
    maxRangeBonus: [],
    falloffBonus: [],
    aoeCloudSizeBonus: [],
    aoeVelocityBonus: [],
    missileVelocityBonus: [],
    explosionDelayBonus: []
  };
  this.appliedRR = { armor: [], shield: [] };
  this.rrDelayTimer = 0;

  if (shipStats !== null) {
    this.distanceFromTarget = initalDistance;
    this.shipType = shipStats.shipType ? shipStats.shipType : '';
    this.shipGroup = shipStats.shipGroup;
    this.name = shipStats.name;
    this.id = shipStats.id;
    this.EHP = shipStats.ehp.shield + shipStats.ehp.armor + shipStats.ehp.hull;
    if (shipStats.ehp.armor > shipStats.ehp.shield) {
      this.tankType = 'armor';
      var res = shipStats.resonance.armor;
      this.meanResonance = (res.em + res.therm + res.kin + res.exp) / 4;
    } else {
      this.tankType = 'shield';
      var _res = shipStats.resonance.shield;
      this.meanResonance = (_res.em + _res.therm + _res.kin + _res.exp) / 4;
    }
    this.damage = shipStats.weaponVolley;
    this.reload = 1000 * (shipStats.weaponVolley / shipStats.weaponDPS);
    this.scanRes = shipStats.scanRes;
    this.baseScanRes = shipStats.scanRes;
    this.velocity = shipStats.maxSpeed;
    this.baseVelocity = shipStats.maxSpeed;
    this.unpropedVelocity = shipStats.unpropedSpeed;
    this.alignTime = shipStats.alignTime;
    this.sigRadius = shipStats.signatureRadius;
    this.baseSigRadius = shipStats.signatureRadius;
    this.lockTimeConstant = 40000 / Math.pow(Math.asinh(shipStats.signatureRadius), 2) * 1000;
    this.unpropedSigRadius = shipStats.unpropedSig;
    this.maxTargets = shipStats.maxTargets;
    this.maxTargetRange = shipStats.maxTargetRange;
    this.baseMaxTargetRange = shipStats.maxTargetRange;
    this.droneControlRange = shipStats.droneControlRange;
    this.weapons = [];
    var _iteratorNormalCompletion = true;
    var _didIteratorError = false;
    var _iteratorError = undefined;

    try {
      for (var _iterator = shipStats.weapons[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
        var wep = _step.value;

        if (wep.type === 'Fighter') {
          var _iteratorNormalCompletion2 = true;
          var _didIteratorError2 = false;
          var _iteratorError2 = undefined;

          try {
            for (var _iterator2 = wep.abilities[Symbol.iterator](), _step2; !(_iteratorNormalCompletion2 = (_step2 = _iterator2.next()).done); _iteratorNormalCompletion2 = true) {
              var ability = _step2.value;

              ability.type = 'Fighter';
              var addedWep = new _weapon_classes.Weapon(ability, dronesEnabled);
              this.weapons.push(addedWep);
            }
          } catch (err) {
            _didIteratorError2 = true;
            _iteratorError2 = err;
          } finally {
            try {
              if (!_iteratorNormalCompletion2 && _iterator2.return) {
                _iterator2.return();
              }
            } finally {
              if (_didIteratorError2) {
                throw _iteratorError2;
              }
            }
          }
        } else {
          var _addedWep = new _weapon_classes.Weapon(wep, dronesEnabled);
          this.weapons.push(_addedWep);
        }
      }
    } catch (err) {
      _didIteratorError = true;
      _iteratorError = err;
    } finally {
      try {
        if (!_iteratorNormalCompletion && _iterator.return) {
          _iterator.return();
        }
      } finally {
        if (_didIteratorError) {
          throw _iteratorError;
        }
      }
    }

    if (this.weapons.length > 1) {
      this.weapons = this.weapons.sort(function (a, b) {
        return b.dps - a.dps;
      });
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
};

exports.default = Ship;

/***/ }),
/* 2 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


Object.defineProperty(exports, "__esModule", {
  value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var PendingAttack = function PendingAttack(delay) {
  _classCallCheck(this, PendingAttack);

  this.timer = delay;
  return this;
};

var MissileStats = function MissileStats(wep) {
  _classCallCheck(this, MissileStats);

  this.bonusMultiInc = 0;
  this.bonusMultiCap = 0;
  this.tracking = 0;
  this.baseTracking = 0;
  this.falloff = 0;
  this.baseFalloff = 0;

  this.sigRadius = wep.explosionRadius;
  this.baseSigRadius = wep.explosionRadius;
  this.expVelocity = wep.explosionVelocity;
  this.baseExpVelocity = wep.explosionVelocity;
  this.damageReductionFactor = wep.damageReductionFactor;
  this.travelVelocity = wep.maxVelocity;
  this.baseTravelVelocity = wep.maxVelocity;
};

var TurretStats = function TurretStats(wep) {
  _classCallCheck(this, TurretStats);

  this.sigRadius = 0;
  this.baseSigRadius = 0;
  this.expVelocity = 0;
  this.baseExpVelocity = 0;
  this.travelVelocity = 0;
  this.baseTravelVelocity = 0;
  this.damageReductionFactor = 0;

  this.tracking = wep.tracking;
  this.baseTracking = wep.tracking;
  this.falloff = wep.falloff;
  this.baseFalloff = wep.falloff;
  this.bonusMultiInc = wep.damageMultiplierBonusPerCycle;
  this.bonusMultiCap = wep.damageMultiplierBonusMax;
};

var SmartBombStats = function SmartBombStats() {
  _classCallCheck(this, SmartBombStats);

  this.sigRadius = 0;
  this.baseSigRadius = 0;
  this.expVelocity = 0;
  this.baseExpVelocity = 0;
  this.travelVelocity = 0;
  this.baseTravelVelocity = 0;
  this.damageReductionFactor = 0;
  this.bonusMultiInc = 0;
  this.bonusMultiCap = 0;
  this.tracking = 10000;
  this.baseTracking = 10000;
  this.baseFalloff = 0;

  this.falloff = 0;
};

var Weapon = function () {
  _createClass(Weapon, [{
    key: 'getDamageDelay',
    value: function getDamageDelay(distance) {
      if (this.type === 'Missile') {
        return 1000 * (distance / this.stats.travelVelocity);
      }
      return 0;
    }
  }]);

  function Weapon(wep, dronesEnabled) {
    _classCallCheck(this, Weapon);

    this.currentReload = 0;
    this.pendingDamage = [];
    this.bonusMulti = 0;

    this.type = wep.type;
    this.damage = wep.volley;
    this.reload = 1000 * (wep.volley / wep.dps);
    this.optimal = wep.optimal;
    this.baseOptimal = wep.optimal;
    this.dps = wep.dps;
    this.autonomousMovement = false;
    if (this.type === 'Turret') {
      this.stats = new TurretStats(wep);
    } else if (this.type === 'Missile') {
      this.stats = new MissileStats(wep);
    } else if (this.type === 'Drone') {
      this.type = 'Turret';
      this.stats = new TurretStats(wep);
      this.autonomousMovement = true;
      this.stats.travelVelocity = wep.maxSpeed;
      if (dronesEnabled === false) {
        this.dps = 0;
        this.damage = 0;
        this.reload = 10000000;
      }
    } else if (this.type === 'SmartBomb') {
      if (wep.name.includes('Doomsday')) {
        this.type = 'Missile';
        wep.explosionRadius = 5000;
        wep.explosionVelocity = 2000;
        wep.damageReductionFactor = 0.01;
        wep.maxVelocity = 12000;
        this.stats = new MissileStats(wep);
      } else {
        this.type = 'Turret';
        this.stats = new SmartBombStats();
      }
    } else if (this.type === 'Fighter') {
      wep.maxVelocity = 7000;
      this.type = 'Missile';
      this.reload = wep.rof;
      this.stats = new MissileStats(wep);
      this.autonomousMovement = true;
    } else {
      console.error('UNKNOWN WEAPON TYPING', wep.type, wep);
    }
    return this;
  }

  return Weapon;
}();

exports.Weapon = Weapon;
exports.PendingAttack = PendingAttack;

/***/ }),
/* 3 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


Object.defineProperty(exports, "__esModule", {
  value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var ShipData = function () {
  function ShipData() {
    _classCallCheck(this, ShipData);

    this.isFit = false;
  }

  _createClass(ShipData, null, [{
    key: 'getMaxShieldEHP',
    value: function getMaxShieldEHP(shipData) {
      return shipData.maxShieldEHP;
    }
  }, {
    key: 'getMaxArmorEHP',
    value: function getMaxArmorEHP(shipData) {
      return shipData.maxArmorEHP;
    }
  }, {
    key: 'getMaxHullEHP',
    value: function getMaxHullEHP(shipData) {
      return shipData.maxHullEHP;
    }
  }, {
    key: 'getCapRecharge',
    value: function getCapRecharge(shipData) {
      return shipData.capRecharge;
    }
  }, {
    key: 'getDroneVolley',
    value: function getDroneVolley(shipData) {
      return shipData.droneVolley;
    }
  }, {
    key: 'getCapUsed',
    value: function getCapUsed(shipData) {
      return shipData.capUsed;
    }
  }, {
    key: 'getEffectiveTurrets',
    value: function getEffectiveTurrets(shipData) {
      return shipData.effectiveTurrets;
    }
  }, {
    key: 'getAlignTime',
    value: function getAlignTime(shipData) {
      return shipData.alignTime;
    }
  }, {
    key: 'getMidSlots',
    value: function getMidSlots(shipData) {
      return shipData.midSlots;
    }
  }, {
    key: 'getTurretSlots',
    value: function getTurretSlots(shipData) {
      return shipData.turretSlots;
    }
  }, {
    key: 'getRigSize',
    value: function getRigSize(shipData) {
      return shipData.rigSize;
    }
  }, {
    key: 'getEffectiveDroneBandwidth',
    value: function getEffectiveDroneBandwidth(shipData) {
      return shipData.effectiveDroneBandwidth;
    }
  }, {
    key: 'getTypeID',
    value: function getTypeID(shipData) {
      return shipData.typeID;
    }
  }, {
    key: 'getMaxTargetRange',
    value: function getMaxTargetRange(shipData) {
      return shipData.maxTargetRange;
    }
  }, {
    key: 'getMaxSpeed',
    value: function getMaxSpeed(shipData) {
      return shipData.maxSpeed;
    }
  }, {
    key: 'getGroupID',
    value: function getGroupID(shipData) {
      return shipData.groupID;
    }
  }, {
    key: 'getScanStrength',
    value: function getScanStrength(shipData) {
      return shipData.scanStrength;
    }
  }, {
    key: 'getScanRes',
    value: function getScanRes(shipData) {
      return shipData.scanRes;
    }
  }, {
    key: 'getWeaponDPS',
    value: function getWeaponDPS(shipData) {
      return shipData.weaponDPS;
    }
  }, {
    key: 'getLauncherSlots',
    value: function getLauncherSlots(shipData) {
      return shipData.launcherSlots;
    }
  }, {
    key: 'getLowSlots',
    value: function getLowSlots(shipData) {
      return shipData.lowSlots;
    }
  }, {
    key: 'getRigSlots',
    value: function getRigSlots(shipData) {
      return shipData.rigSlots;
    }
  }, {
    key: 'getHighSlots',
    value: function getHighSlots(shipData) {
      return shipData.highSlots;
    }
  }, {
    key: 'getMaxTargets',
    value: function getMaxTargets(shipData) {
      return shipData.maxTargets;
    }
  }, {
    key: 'getSignatureRadius',
    value: function getSignatureRadius(shipData) {
      return shipData.signatureRadius;
    }
  }, {
    key: 'getEffectiveLaunchers',
    value: function getEffectiveLaunchers(shipData) {
      return shipData.effectiveLaunchers;
    }
  }, {
    key: 'getPowerOutput',
    value: function getPowerOutput(shipData) {
      return shipData.powerOutput;
    }
  }, {
    key: 'getDroneDPS',
    value: function getDroneDPS(shipData) {
      return shipData.droneDPS;
    }
  }, {
    key: 'getTotalVolley',
    value: function getTotalVolley(shipData) {
      return shipData.totalVolley;
    }
  }, {
    key: 'getWeaponVolley',
    value: function getWeaponVolley(shipData) {
      return shipData.weaponVolley;
    }
  }, {
    key: 'processing',
    value: function processing(shipStats) {
      shipStats.id = Math.random();
      var fullNameBreak = shipStats.name.indexOf(':');
      if (fullNameBreak > -1) {
        var baseName = shipStats.name;
        shipStats.name = baseName.slice(fullNameBreak + 2);
        shipStats.shipType = baseName.slice(0, fullNameBreak);
        shipStats.isFit = true;
      } else {
        shipStats.shipType = undefined;
        shipStats.isFit = false;
        // Handle subsystem processing for t3c.
        if (shipStats.groupID === 963) {
          var subsystems = {};
          var subTypes = ['Defensive', 'Offensive', 'Propulsion', 'Core'];

          var _loop = function _loop(sub) {
            var subName = shipStats.moduleNames.find(function (n) {
              return n.includes(sub);
            }) || '';
            var specificSubName = subName.substring(subName.indexOf(sub) + 2 + sub.length);
            subsystems[sub] = specificSubName;
          };

          var _iteratorNormalCompletion = true;
          var _didIteratorError = false;
          var _iteratorError = undefined;

          try {
            for (var _iterator = subTypes[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
              var sub = _step.value;

              _loop(sub);
            }
          } catch (err) {
            _didIteratorError = true;
            _iteratorError = err;
          } finally {
            try {
              if (!_iteratorNormalCompletion && _iterator.return) {
                _iterator.return();
              }
            } finally {
              if (_didIteratorError) {
                throw _iteratorError;
              }
            }
          }

          shipStats.subsystems = subsystems;
        }
        // Handle mode processing for t3d.
        if (shipStats.groupID === 1305) {
          var modes = ['Defense Mode', 'Sharpshooter Mode', 'Propulsion Mode'];
          var _iteratorNormalCompletion2 = true;
          var _didIteratorError2 = false;
          var _iteratorError2 = undefined;

          try {
            for (var _iterator2 = modes[Symbol.iterator](), _step2; !(_iteratorNormalCompletion2 = (_step2 = _iterator2.next()).done); _iteratorNormalCompletion2 = true) {
              var mode = _step2.value;

              var modeInd = shipStats.name.indexOf(mode);
              var modeStr = shipStats.name.substring(modeInd);
              if (modeStr === mode) {
                shipStats.mode = mode;
                shipStats.name = shipStats.name.substring(0, modeInd - 1);
              }
            }
          } catch (err) {
            _didIteratorError2 = true;
            _iteratorError2 = err;
          } finally {
            try {
              if (!_iteratorNormalCompletion2 && _iterator2.return) {
                _iterator2.return();
              }
            } finally {
              if (_didIteratorError2) {
                throw _iteratorError2;
              }
            }
          }
        }
      }
    }
  }]);

  return ShipData;
}();

exports.default = ShipData;

/***/ }),
/* 4 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";
/* WEBPACK VAR INJECTION */(function(global) {

var _slicedToArray = function () { function sliceIterator(arr, i) { var _arr = []; var _n = true; var _d = false; var _e = undefined; try { for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) { _arr.push(_s.value); if (i && _arr.length === i) break; } } catch (err) { _d = true; _e = err; } finally { try { if (!_n && _i["return"]) _i["return"](); } finally { if (_d) throw _e; } } return _arr; } return function (arr, i) { if (Array.isArray(arr)) { return arr; } else if (Symbol.iterator in Object(arr)) { return sliceIterator(arr, i); } else { throw new TypeError("Invalid attempt to destructure non-iterable instance"); } }; }();

var _side_class = __webpack_require__(0);

var _side_class2 = _interopRequireDefault(_side_class);

var _fleet_actions = __webpack_require__(5);

var _fleet_actions2 = _interopRequireDefault(_fleet_actions);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _toConsumableArray(arr) { if (Array.isArray(arr)) { for (var i = 0, arr2 = Array(arr.length); i < arr.length; i++) { arr2[i] = arr[i]; } return arr2; } else { return Array.from(arr); } }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

// Keeping flow happy
var postMessage = global.self.postMessage;

var SimWorker = function SimWorker() {
  var _this = this;

  _classCallCheck(this, SimWorker);

  this.state = {};
  this.awaitingFrameRender = false;
  this.red = new _side_class2.default('red');
  this.blue = new _side_class2.default('blue');

  this.getGuiShipData = function (s) {
    return {
      dis: s.dis,
      iconColor: s.iconColor,
      id: s.id
    };
  };

  this.logUpdate = function (blue, red, seconds) {
    _this.redGraphData.push({ x: seconds, y: red.ships.length });
    _this.blueGraphData.push({ x: seconds, y: blue.ships.length });
  };

  this.removeDeadShips = function (side) {
    side.deadShips = [].concat(_toConsumableArray(side.deadShips), _toConsumableArray(side.ships.filter(function (ship) {
      return ship.currentEHP <= 0;
    })));
    side.ships = side.ships.filter(function (ship) {
      return ship.currentEHP > 0;
    });
  };

  this.RunSimulationWrapper = function (breakClause, interval, reportInterval, simulationSpeed, minDelay, strVal) {
    if (_this.awaitingFrameRender === true) {
      setTimeout(_this.RunSimulationWrapper, 5, breakClause, interval, reportInterval, simulationSpeed, Math.max(0, minDelay - 5), strVal);
    } else {
      postMessage({ type: 'updateSides', val: strVal });
      _this.awaitingFrameRender = true;
      setTimeout(_this.RunSimulationLoop, minDelay, breakClause, interval, reportInterval, simulationSpeed);
    }
  };

  this.RunSimulationLoop = function (breakClause, interval, reportInterval, simulationSpeed) {
    var startTime = performance.now();
    if (simulationSpeed !== _this.simulationSpeed) {
      var newReportInterval = 100 * _this.simulationSpeed;
      var newSimulationSpeed = _this.simulationSpeed;
      _this.RunSimulationLoop(breakClause, interval, newReportInterval, newSimulationSpeed);
    } else if (_this.blue.ships.length > 0 && _this.red.ships.length > 0 && breakClause < 72000) {
      for (var i = 0; i < reportInterval; i += interval) {
        var isDamageDealtRed = (0, _fleet_actions2.default)(_this.red, interval, _this.blue, true);
        var isDamageDealtBlue = (0, _fleet_actions2.default)(_this.blue, interval, _this.red);
        if (isDamageDealtBlue) {
          _this.removeDeadShips(_this.red);
        }
        if (isDamageDealtRed) {
          _this.removeDeadShips(_this.blue);
        }
        if (isDamageDealtBlue || isDamageDealtRed) {
          _this.logUpdate(_this.blue, _this.red, (breakClause + i / 100) / 10);
          if (_this.blue.ships.length === 0 || _this.red.ships.length === 0) {
            break;
          }
        }
      }
      var hRange = 300000;
      var allShips = [].concat(_toConsumableArray(_this.red.ships), _toConsumableArray(_this.blue.ships));
      var disSet = allShips.map(function (s) {
        return s.dis;
      });
      var minDis = Math.min.apply(Math, _toConsumableArray(disSet));
      var maxDis = Math.max.apply(Math, _toConsumableArray(disSet));
      if (minDis < -hRange && !(maxDis > hRange)) {
        var _iteratorNormalCompletion = true;
        var _didIteratorError = false;
        var _iteratorError = undefined;

        try {
          for (var _iterator = allShips[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
            var s = _step.value;

            var newZero = (maxDis > -hRange ? maxDis - hRange : maxDis) / 4;
            s.dis -= newZero;
            s.pendingDis = s.dis;
          }
        } catch (err) {
          _didIteratorError = true;
          _iteratorError = err;
        } finally {
          try {
            if (!_iteratorNormalCompletion && _iterator.return) {
              _iterator.return();
            }
          } finally {
            if (_didIteratorError) {
              throw _iteratorError;
            }
          }
        }
      } else if (maxDis > hRange && !(minDis < -hRange)) {
        var _iteratorNormalCompletion2 = true;
        var _didIteratorError2 = false;
        var _iteratorError2 = undefined;

        try {
          for (var _iterator2 = allShips[Symbol.iterator](), _step2; !(_iteratorNormalCompletion2 = (_step2 = _iterator2.next()).done); _iteratorNormalCompletion2 = true) {
            var _s = _step2.value;

            var _newZero = (minDis < hRange ? minDis + hRange : minDis) / 4;
            _s.dis -= _newZero;
            _s.pendingDis = _s.dis;
          }
        } catch (err) {
          _didIteratorError2 = true;
          _iteratorError2 = err;
        } finally {
          try {
            if (!_iteratorNormalCompletion2 && _iterator2.return) {
              _iterator2.return();
            }
          } finally {
            if (_didIteratorError2) {
              throw _iteratorError2;
            }
          }
        }
      }

      var newBreakClause = breakClause + simulationSpeed;
      var strVal = {
        red: _this.red.ships.map(_this.getGuiShipData),
        blue: _this.blue.ships.map(_this.getGuiShipData)
      };
      var elapsedTime = performance.now() - startTime;
      var delay = Math.max(0, reportInterval / simulationSpeed - elapsedTime);
      _this.RunSimulationWrapper(newBreakClause, interval, reportInterval, simulationSpeed, delay, strVal);
    } else {
      var mapDapApp = function mapDapApp(s) {
        return {
          appliedDamage: s.appliedDamage,
          theoreticalDamage: s.theoreticalDamage,
          graphData: s.color === 'red' ? _this.redGraphData : _this.blueGraphData
        };
      };
      postMessage({
        type: 'endStats',
        val: {
          red: mapDapApp(_this.red),
          blue: mapDapApp(_this.blue)
        }
      });
      postMessage({ type: 'simulationFinished', val: null });
    }
  };

  this.SimulateBattle = function (sideOneShips, sideTwoShips, simSpeed, initalDistance, dronesEnabled) {
    _this.simulationSpeed = simSpeed;
    _this.initalDistance = initalDistance;
    _this.redGraphData = [];
    _this.blueGraphData = [];
    _this.red = new _side_class2.default('red');
    _this.blue = new _side_class2.default('blue');
    _this.red.oppSide = _this.blue;
    _this.blue.oppSide = _this.red;
    _this.red.makeFleet(sideOneShips, _this.initalDistance, dronesEnabled);
    _this.blue.makeFleet(sideTwoShips, _this.initalDistance, dronesEnabled);
    var largestFleet = Math.max(_this.blue.ships.length, _this.red.ships.length);
    var charLengthOfMaxShips = largestFleet.toString().length;
    postMessage({ type: 'setXYPlotMargin', val: charLengthOfMaxShips });
    var reportInterval = 100 * _this.simulationSpeed;
    var interval = 50;
    _this.logUpdate(_this.blue, _this.red, 0);
    var strVal = {
      red: _this.red.ships.map(_this.getGuiShipData),
      blue: _this.blue.ships.map(_this.getGuiShipData)
    };
    _this.RunSimulationWrapper(0, interval, reportInterval, _this.simulationSpeed, reportInterval / _this.simulationSpeed, strVal);
  };
};

var simulation = void 0;
onmessage = function onmessage(e) {
  var data = e.data;

  if (data.type === 'RunSimulation') {
    var _ref = data.val,
        _ref2 = _slicedToArray(_ref, 5),
        sideOneShips = _ref2[0],
        sideTwoShips = _ref2[1],
        simSpeed = _ref2[2],
        initalDistance = _ref2[3],
        dronesEnabled = _ref2[4];

    simulation = new SimWorker();
    simulation.SimulateBattle(sideOneShips, sideTwoShips, simSpeed, initalDistance, dronesEnabled);
  } else if (data.type === 'frameRenderComplete') {
    simulation.awaitingFrameRender = false;
  } else if (data.type === 'changeSimSpeed') {
    simulation.simulationSpeed = data.val;
  }
};
/* WEBPACK VAR INJECTION */}.call(exports, __webpack_require__(6)))

/***/ }),
/* 5 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


Object.defineProperty(exports, "__esModule", {
  value: true
});

var _slicedToArray = function () { function sliceIterator(arr, i) { var _arr = []; var _n = true; var _d = false; var _e = undefined; try { for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) { _arr.push(_s.value); if (i && _arr.length === i) break; } } catch (err) { _d = true; _e = err; } finally { try { if (!_n && _i["return"]) _i["return"](); } finally { if (_d) throw _e; } } return _arr; } return function (arr, i) { if (Array.isArray(arr)) { return arr; } else if (Symbol.iterator in Object(arr)) { return sliceIterator(arr, i); } else { throw new TypeError("Invalid attempt to destructure non-iterable instance"); } }; }();

var _weapon_classes = __webpack_require__(2);

var _ship_class = __webpack_require__(1);

var _ship_class2 = _interopRequireDefault(_ship_class);

var _side_class = __webpack_require__(0);

var _side_class2 = _interopRequireDefault(_side_class);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _toConsumableArray(arr) { if (Array.isArray(arr)) { for (var i = 0, arr2 = Array(arr.length); i < arr.length; i++) { arr2[i] = arr[i]; } return arr2; } else { return Array.from(arr); } }

function findNewTarget(targetCaller, opposingSide) {
  var oppShips = opposingSide.ships;
  var newTarget = void 0;
  if (targetCaller.maxTargets >= opposingSide.ships.length) {
    newTarget = opposingSide.ships.find(function (oppShip) {
      return !oppShip.isShotCaller && !targetCaller.targets.some(function (target) {
        return target === oppShip;
      }) && oppShip.currentEHP > 0;
    });
    var possibleFcTarget = opposingSide.ships.find(function (oppShip) {
      return !targetCaller.targets.some(function (target) {
        return target === oppShip;
      }) && oppShip.currentEHP > 0;
    });
    // This should target the fc if it's the last ship left in the group
    if (!newTarget || possibleFcTarget && possibleFcTarget.id !== newTarget.id) {
      newTarget = possibleFcTarget;
    }
  } else {
    var targetOppFc = function targetOppFc(s) {
      return s.isShotCaller && !targetCaller.targets.some(function (target) {
        return target === s;
      });
    };
    var oppFcIndex = oppShips.slice(0, targetCaller.maxTargets - 1).findIndex(targetOppFc);
    var tarLen = targetCaller.targets.length;
    if (oppFcIndex >= 0 && oppShips.length > tarLen + 1 && tarLen > 0 && oppShips[oppFcIndex].id !== oppShips[tarLen + 1].id) {
      newTarget = oppShips[oppFcIndex];
    } else {
      newTarget = opposingSide.ships.find(function (oppShip) {
        return !oppShip.isShotCaller && oppShip.currentEHP > 0 && !targetCaller.targets.some(function (target) {
          return target === oppShip;
        });
      });
    }
  }
  return newTarget;
}

function getTargets(targetCaller, opposingSide) {
  var newTarget = findNewTarget(targetCaller, opposingSide);
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
 **/
function getDoaTarget(ship, opposingSide) {
  var prevT = void 0;
  var _iteratorNormalCompletion = true;
  var _didIteratorError = false;
  var _iteratorError = undefined;

  try {
    for (var _iterator = opposingSide.ships[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
      var t = _step.value;

      if (!t.isShotCaller || opposingSide.ships.length === 1) {
        return t;
      }
      var posFcTarg = prevT;
      if (posFcTarg && posFcTarg.id !== t.id) {
        return posFcTarg;
      }
      prevT = t;
    }
  } catch (err) {
    _didIteratorError = true;
    _iteratorError = err;
  } finally {
    try {
      if (!_iteratorNormalCompletion && _iterator.return) {
        _iterator.return();
      }
    } finally {
      if (_didIteratorError) {
        throw _iteratorError;
      }
    }
  }

  return opposingSide.ships[0];
}

var MissleApplication = function MissleApplication(distance, _ref) {
  var _ref2 = _slicedToArray(_ref, 5),
      sigRatio = _ref2[0],
      targetVelocity = _ref2[1],
      expVelocity = _ref2[2],
      optimal = _ref2[3],
      missileDamageReductionFactor = _ref2[4];

  if (optimal < distance) {
    return 0.0001;
  }
  if (Array.isArray(sigRatio)) {
    console.error('MissleApplication recived incorrect argments and will return 0');
    return 0;
  }
  var reducedVelocity = targetVelocity.reduce(function (s, v) {
    return s + v * v * v;
  }, 0);
  var netVelocity = Math.pow(reducedVelocity, 0.33333333);
  var velocityRatio = expVelocity / netVelocity;
  var multi = Math.min(1, sigRatio, Math.pow(sigRatio * velocityRatio, missileDamageReductionFactor));
  return multi;
};

var HitChanceFunction = function HitChanceFunction(distance, _ref3) {
  var _ref4 = _slicedToArray(_ref3, 5),
      velocity = _ref4[0],
      oppVelocity = _ref4[1],
      trackingFactor = _ref4[2],
      optimal = _ref4[3],
      falloff = _ref4[4];

  if (!Array.isArray(velocity)) {
    console.error('HitChanceFunction recived incorrect argments and will return 0');
    return 0;
  }
  var netVector = velocity.map(function (v, i) {
    return v + oppVelocity[i];
  });
  var reducedVelocity = netVector.reduce(function (s, v) {
    return s + v * v * v;
  }, 0);
  var netVelocity = Math.pow(reducedVelocity, 0.33333333);
  var angularVelocity = netVelocity / distance || 0;
  var trackingComponent = Math.pow(angularVelocity * 40000 / trackingFactor, 2);
  if (falloff === 0) {
    if (Math.max(0, distance - optimal) === 0) {
      return Math.pow(0.5, trackingComponent);
    }
    return 0;
  }
  var rangeComponent = Math.pow(Math.max(0, distance - optimal) / falloff, 2);
  var hitChance = Math.pow(0.5, trackingComponent + rangeComponent);
  return hitChance;
};

var TurretApplication = function TurretApplication(distance, hitChanceArgs) {
  var hitChance = HitChanceFunction(distance, hitChanceArgs);
  if (hitChance > 0.01) {
    return (Math.pow(hitChance, 2) + hitChance + 0.0499) / 2;
  }
  // Only wrecking hits
  return hitChance * 3;
};

var DamageRatioFunction = function DamageRatioFunction(distance, _ref5, overrideDroneDistance, oppOverrideDroneDistance) {
  var _ref6 = _slicedToArray(_ref5, 4),
      damageFunction = _ref6[0],
      oppDamageFunction = _ref6[1],
      args = _ref6[2],
      oppArgs = _ref6[3];

  var damageApplication = damageFunction(overrideDroneDistance || distance, args);
  var oppApplication = oppDamageFunction(oppOverrideDroneDistance || distance, oppArgs);
  if (damageApplication < 0.3) {
    damageApplication -= 1;
    oppApplication += 0.001;
  }
  return -1 * (damageApplication / oppApplication);
};

/**
 * Used to get a typical representitive of the ships subfleet.
 * The return should be functionally equivilent to:
 *   side.ships.filter(s => s.id === ship.id)[Math.floor(shipsInSubFleet.length / 2)];
 * This is a touch more convoluted but runs much faster for large fights.
 **/
function getMidShip(side, ship) {
  var sf = side.subFleets.find(function (f) {
    return f.fc === ship.anchor || f.fc === ship;
  });
  if (sf) {
    var ds = side.deadShips.length;
    if (ds > sf.initalStartInd) {
      var dso = sf.initalStartInd;
      var dss = (ds - sf.initalStartInd) / 2;
      ds = dso + dss;
    }
    var mIndex = Math.floor(sf.initalStartInd + (sf.n / 2 - ds));
    // If the entire subfleet is dead give the mid ship for the next subfleet.
    // This should be extremely rare and only occur when calculating prefered range.
    if (mIndex === 0 && ship.id !== side.ships[mIndex].id) {
      return getMidShip(side, side.ships[0]);
    }
    return side.ships[mIndex];
  }
  console.error('Failed to find midShip for:', ship, '. Returning ship instead');
  return ship;
}

function hasHigherEffectiveTracking(ship, target, specificWeapon) {
  var wep = specificWeapon || ship.weapons.sort(function (a, b) {
    return b.dps - a.dps;
  })[0];
  var oppWep = target.weapons.sort(function (a, b) {
    return b.dps - a.dps;
  })[0];
  if (!oppWep || oppWep.type !== 'Turret') {
    return false;
  } else if (wep.stats.tracking * target.sigRadius > oppWep.stats.tracking * ship.sigRadius) {
    return true;
  }
  return false;
}

function innerGetDeltaVelocity(ship, vForTransversal, target, mTarget, isEffTrackingBetter) {
  var tv = target.velocity;
  var mtv = mTarget.velocity;
  if (vForTransversal > Math.max(tv, mtv)) {
    return isEffTrackingBetter ? Math.abs(vForTransversal - Math.max(tv, mtv)) : 0;
  } else if (ship.velocity >= tv) {
    return 0;
  }
  return isEffTrackingBetter ? 0 : Math.abs(ship.velocity - tv);
}

/**
 * Get's the velocity delta when the target is assumed to be targeting the ship.
 * Useful for theoretical situations as ships typically adjust range far more
 * slowly than transversal.
 * Thus for ideal range calculations they should consider that they might get shot when
 * picking their transversal, even if they aren't currently targeted.
**/
function getMirrorVelocityDelta(ship, target, side, specificWeapon) {
  var supTracking = hasHigherEffectiveTracking(ship, target, specificWeapon);
  var mTarget = getMidShip(side.oppSide, target);
  var vForTransversal = ship.velocity;
  if (target.targets.length > 0) {
    var shipsInSubFleet = side.ships.filter(function (s) {
      return s.id === ship.id;
    });
    var oppEffectiveTarget = shipsInSubFleet.length > 1 ? shipsInSubFleet[1] : shipsInSubFleet[0];
    // It's pointless the have more transversal than what's actually being shot.
    vForTransversal = Math.min(vForTransversal, oppEffectiveTarget.velocity);
  }
  var deltaVelocity = innerGetDeltaVelocity(ship, vForTransversal, target, mTarget, supTracking);
  return deltaVelocity;
}

function getVelocityDelta(ship, target, side, specificWeapon) {
  var supTracking = hasHigherEffectiveTracking(ship, target, specificWeapon);
  var mTarget = getMidShip(side.oppSide, target);
  var vForTransversal = ship.velocity;
  // Note we can't care if the target's target is alive without
  // causing the run order to impact the results.
  var oppEffectiveTarget = getDoaTarget(target, side.oppSide);
  vForTransversal = Math.min(vForTransversal, oppEffectiveTarget.velocity);
  var deltaVelocity = innerGetDeltaVelocity(ship, vForTransversal, target, mTarget, supTracking);
  return deltaVelocity;
}

function getApplicationArgs(ship, target, side) {
  var minRange = Math.min(1000, ship.sigRadius) * 2 + Math.min(1000, target.sigRadius);
  // min range is a rearange of 2 * v * align / 0.75 == 2 * PI * minRange
  minRange = Math.max(minRange, ship.velocity * ship.alignTime / 2.35619);
  var maxRange = void 0;
  // Ship movement isn't exact so reduce max values very slightly when they have no falloff.
  var noFalloffComp = 0.1 * (ship.velocity + target.velocity);
  var conservativeMaxTargetRange = ship.maxTargetRange - noFalloffComp;
  var wep = ship.weapons.sort(function (a, b) {
    return b.dps - a.dps;
  })[0];
  if (wep && wep.type === 'Turret') {
    var _damageFunction = TurretApplication;
    var trackingFactor = wep.stats.tracking * target.sigRadius;
    maxRange = Math.min(conservativeMaxTargetRange, wep.optimal + wep.stats.falloff * 3);
    var velocity = void 0;
    var oppVelocity = [0];
    if (wep.autonomousMovement) {
      if (wep.stats.travelVelocity > Math.max(target.velocity, 10)) {
        maxRange = Math.min(ship.droneControlRange, conservativeMaxTargetRange);
      } else {
        maxRange = Math.min(ship.droneControlRange, maxRange);
      }
      velocity = [Math.abs(wep.stats.travelVelocity / 5 - target.velocity)];
    } else {
      velocity = [getMirrorVelocityDelta(ship, target, side, wep)];
    }
    var _args = [velocity, oppVelocity, trackingFactor, wep.optimal, wep.stats.falloff];
    return [_damageFunction, _args, [minRange, maxRange]];
  } else if (wep && wep.type === 'Missile') {
    var effectiveOptimal = wep.optimal;
    if (wep.autonomousMovement) {
      effectiveOptimal = 300000;
    }
    var _damageFunction2 = MissleApplication;
    var sigRatio = target.sigRadius / wep.stats.sigRadius;
    var _oppVelocity = [target.velocity];
    var _args2 = [sigRatio, _oppVelocity, wep.stats.expVelocity, effectiveOptimal, wep.stats.damageReductionFactor];
    maxRange = Math.min(conservativeMaxTargetRange, effectiveOptimal - noFalloffComp);
    return [_damageFunction2, _args2, [minRange, maxRange]];
  }
  var damageFunction = MissleApplication;
  var args = [0, [0], 0, 0, 0];
  return [damageFunction, args, [0, 0]];
}

function sign(x) {
  if (x < 0.0) return -1;
  return x > 0.0 ? 1 : 0;
}

function getMin(func, x1, x2, args) {
  var xatol = arguments.length > 4 && arguments[4] !== undefined ? arguments[4] : 1e-5;
  var maxfun = arguments.length > 5 && arguments[5] !== undefined ? arguments[5] : 500;

  var sqrtEps = Math.sqrt(2.2e-16);
  var goldenMean = 0.5 * (3.0 - Math.sqrt(5.0));
  var a = x1,
      b = x2;

  var fulc = a + goldenMean * (b - a);
  var nfc = fulc,
      xf = fulc;

  var rat = 0.0;var e = 0;
  var x = xf;
  var fx = func(x, args);
  var num = 1;
  var ffulc = fx;var fnfc = fx;
  var xm = 0.5 * (a + b);
  var tol1 = sqrtEps * Math.abs(xf) + xatol / 3.0;
  var tol2 = 2.0 * tol1;

  while (Math.abs(xf - xm) > tol2 - 0.5 * (b - a)) {
    var golden = 1;
    // Check for parabolic fit
    if (Math.abs(e) > tol1) {
      golden = 0;
      var r = (xf - nfc) * (fx - ffulc);
      var q = (xf - fulc) * (fx - fnfc);
      var p = (xf - fulc) * q - (xf - nfc) * r;
      q = 2.0 * (q - r);
      if (q > 0.0) {
        p = -p;
      }
      q = Math.abs(q);
      r = e;
      e = rat;

      // Check for acceptability of parabola
      if (Math.abs(p) < Math.abs(0.5 * q * r) && p > q * (a - xf) && p < q * (b - xf)) {
        rat = (p + 0.0) / q;
        x = xf + rat;

        if (x - a < tol2 || b - x < tol2) {
          var _si = sign(xm - xf) + (xm - xf === 0);
          rat = tol1 * _si;
        }
      } else {
        // do a golden section step
        golden = 1;
      }
    }
    if (golden) {
      // Do a golden-section step
      if (xf >= xm) {
        e = a - xf;
      } else {
        e = b - xf;
      }
      rat = goldenMean * e;
    }
    var si = sign(rat) + (rat === 0);
    x = xf + si * Math.max(Math.abs(rat), tol1);
    var fu = func(x, args);
    num += 1;
    if (fu <= fx) {
      if (x >= xf) {
        a = xf;
      } else {
        b = xf;
      }
      fulc = nfc;
      ffulc = fnfc;
      nfc = xf;
      fnfc = fx;
      xf = x;
      fx = fu;
    } else {
      if (x < xf) {
        a = x;
      } else {
        b = x;
      }
      if (fu <= fnfc || nfc === xf) {
        fulc = nfc;
        ffulc = fnfc;
        nfc = x;
        fnfc = fu;
      } else if (fu <= ffulc || fulc === xf || fulc === nfc) {
        fulc = x;
        ffulc = fu;
      }
    }
    xm = 0.5 * (a + b);
    tol1 = sqrtEps * Math.abs(xf) + xatol / 3.0;
    tol2 = 2.0 * tol1;

    if (num >= maxfun) {
      break;
    }
  }
  var result = xf;
  return result;
}

function calculateDamage(ship, target, wep, side) {
  side.theoreticalDamage += wep.damage;
  if (ship.distanceFromTarget > ship.maxTargetRange) {
    return 0;
  }
  if (wep.type === 'Missile') {
    var effectiveOptimal = wep.optimal;
    // Even relative to drones this is an iffy work around given fighter travel times.
    if (wep.autonomousMovement) {
      effectiveOptimal = 300000;
    }
    return wep.damage * MissleApplication(ship.distanceFromTarget, [target.sigRadius / wep.stats.sigRadius, [target.velocity], wep.stats.expVelocity, effectiveOptimal, wep.stats.damageReductionFactor]);
  } else if (wep.type === 'Turret') {
    var velocity = void 0;
    var oppVelocity = [0];
    var distance = ship.distanceFromTarget;
    if (wep.autonomousMovement) {
      if (ship.distanceFromTarget > ship.droneControlRange) {
        return 0;
      }
      // Assume non-sentry drones are at optimal if faster than target.
      // This is somewhat overly generous against fairly fast targets.
      if (wep.stats.travelVelocity > Math.max(target.velocity, 10)) {
        distance = wep.optimal;
      }
      // Drone orbit velocity isn't really v/5 but it's close enough.
      // In practice drones have all sorts of funkyness that's not practical to model.
      velocity = [Math.abs(wep.stats.travelVelocity / 5 - target.velocity)];
    } else {
      velocity = [getVelocityDelta(ship, target, side, wep)];
    }
    var hasDmgRamp = Boolean(wep.stats.bonusMultiInc);
    var bonusMulti = hasDmgRamp ? (1 + wep.bonusMulti) / (1 + wep.stats.bonusMultiCap) : 1;
    if (wep.stats.bonusMultiInc && wep.bonusMulti < wep.stats.bonusMultiCap) {
      wep.bonusMulti += wep.stats.bonusMultiInc;
    }
    return wep.damage * bonusMulti * TurretApplication(distance, [velocity, oppVelocity, wep.stats.tracking * target.sigRadius, wep.optimal, wep.stats.falloff]);
  }
  return wep.damage;
}

function dealDamage(ship, t, wep, side) {
  if (ship.targets[0].currentEHP <= 0) {
    ship.targets.shift();
    if (ship.targets.length > 0) {
      dealDamage(ship, t, wep, side);
    }
  } else {
    wep.currentReload -= t;
    if (wep.currentReload <= 0) {
      var _ship$targets = _slicedToArray(ship.targets, 1),
          target = _ship$targets[0];

      if (wep.bonusMulti && target !== ship.previousTarget) {
        wep.bonusMulti = 0;
        ship.previousTarget = target;
      }
      var attack = new _weapon_classes.PendingAttack(wep.getDamageDelay(ship.distanceFromTarget));
      wep.pendingDamage.push(attack);
      wep.currentReload = wep.reload;
    }
    var isPendingFinished = false;
    var _iteratorNormalCompletion2 = true;
    var _didIteratorError2 = false;
    var _iteratorError2 = undefined;

    try {
      for (var _iterator2 = wep.pendingDamage[Symbol.iterator](), _step2; !(_iteratorNormalCompletion2 = (_step2 = _iterator2.next()).done); _iteratorNormalCompletion2 = true) {
        var pendingAttack = _step2.value;

        pendingAttack.timer -= t;
        if (pendingAttack.timer <= 0) {
          var initalHP = ship.targets[0].currentEHP;
          var damage = calculateDamage(ship, ship.targets[0], wep, side);
          ship.targets[0].currentEHP -= damage;
          if (Number.isNaN(initalHP) || Number.isNaN(ship.targets[0].currentEHP)) {
            console.error('Applied damage or target EHP is not a number, this is likely a bug.', wep, initalHP, ship.targets[0].currentEHP, ship);
          }
          side.appliedDamage += initalHP - ship.targets[0].currentEHP;
          isPendingFinished = true;
        }
      }
    } catch (err) {
      _didIteratorError2 = true;
      _iteratorError2 = err;
    } finally {
      try {
        if (!_iteratorNormalCompletion2 && _iterator2.return) {
          _iterator2.return();
        }
      } finally {
        if (_didIteratorError2) {
          throw _iteratorError2;
        }
      }
    }

    if (isPendingFinished) {
      wep.pendingDamage = wep.pendingDamage.filter(function (attack) {
        return attack.timer > 0;
      });
    }
  }
}

function NetValue(effects, baseValue) {
  // These are actually 1 / Math.exp(((-i) / 2.67) ** 2) (where i is the index)
  // This solution is used instead for speed reasons
  var stackingPenelties = [1, 0.869, 0.571, 0.283, 0.106, 0.03, 0];
  var effLen = Math.min(6, effects.length);
  var value = baseValue;
  for (var i = 0; i < effLen; i += 1) {
    value += value * effects[i][0] * stackingPenelties[i];
  }
  return value;
}

function ewarFalloffCalc(baseMulti, ewar, distance) {
  if (ewar.falloff) {
    return baseMulti * Math.pow(0.5, Math.pow(Math.max(0, distance - ewar.optimal) / ewar.falloff, 2));
  } else if (distance <= ewar.optimal) {
    return baseMulti;
  }
  return 0;
}

function getFocusedEwarTarget(targets, type, multi) {
  // Targets.length > 1 not 0 beacuse a single target often indicates a forced target
  // When it doesn't targeting a dead ship shouldn't cause any issues anyway.
  while (targets.length > 1 && targets[0].currentEHP <= 0) {
    targets.shift();
  }
  for (var i = 0; i < targets.length; i += 1) {
    var t = targets[i];
    t.appliedEwar[type].sort(function (a, b) {
      return Math.abs(b[0]) - Math.abs(a[0]);
    });
    if (t.appliedEwar[type].length <= 6 || Math.abs(t.appliedEwar[type][5][0]) < Math.abs(multi)) {
      i = targets.length;
      return t;
    }
  }
  return targets[0];
}

function setProjections(ewar, distance, attrs, targetVals, target) {
  // const baseTargetVals =
  // targetVals.map(val => 'base' + val.charAt(0).toUpperCase() + val.substr(1));
  for (var i = 0; i < attrs.length; i += 1) {
    var _attr = attrs[i];
    var oldTarget = ewar.currentTarget;
    if (oldTarget) {
      var pullIndex = oldTarget.appliedEwar[_attr].findIndex(function (e) {
        return e[2] === ewar;
      });
      if (pullIndex !== -1) {
        oldTarget.appliedEwar[_attr].splice(pullIndex, 1);
        oldTarget.appliedEwar[_attr].sort(function (a, b) {
          return Math.abs(b[0]) - Math.abs(a[0]);
        });
        targetVals[i](oldTarget, _attr);
      }
    }
    var baseMulti = ewar[_attr] / 100;
    var multi = ewarFalloffCalc(baseMulti, ewar, distance);
    target.appliedEwar[_attr].push([multi, baseMulti, ewar]);
    target.appliedEwar[_attr].sort(function (a, b) {
      return Math.abs(b[0]) - Math.abs(a[0]);
    });
    if (target.appliedEwar[_attr].length > 7) {
      target.appliedEwar[_attr].pop();
    }
    targetVals[i](target, _attr);
  }
}

function NoScramsInRange(t) {
  var inRange = function inRange(s) {
    return Math.abs(s[2].attachedShip.dis - (s[2].currentTarget || t).dis) <= s[2].optimal;
  };
  if (t.appliedEwar.scrams.some(inRange)) {
    return false;
  }
  return true;
}

function ApplyEwar(ewar, targets, distance, scatterTarget) {
  var target = targets[0];
  if (ewar.type === 'Stasis Web') {
    var getInitalVel = function getInitalVel(t) {
      return NoScramsInRange(t) ? t.baseVelocity : t.unpropedVelocity;
    };
    var oldTarget = ewar.currentTarget;
    if (oldTarget) {
      var pullIndex = oldTarget.appliedEwar.webs.findIndex(function (e) {
        return e[2] === ewar;
      });
      if (pullIndex !== -1) {
        oldTarget.appliedEwar.webs.splice(pullIndex, 1);
        oldTarget.appliedEwar.webs.sort(function (a, b) {
          return Math.abs(b[0]) - Math.abs(a[0]);
        });
        oldTarget.velocity = NetValue(oldTarget.appliedEwar.webs, getInitalVel(oldTarget));
      }
    }
    var baseMulti = ewar.speedFactor / 100;
    var multi = ewarFalloffCalc(baseMulti, ewar, distance);
    target = getFocusedEwarTarget(targets, 'webs', multi);
    target.appliedEwar.webs.push([multi, baseMulti, ewar]);
    target.appliedEwar.webs.sort(function (a, b) {
      return Math.abs(b[0]) - Math.abs(a[0]);
    });
    if (target.appliedEwar.webs.length > 7) {
      target.appliedEwar.webs.pop();
    }
    target.velocity = NetValue(target.appliedEwar.webs, getInitalVel(target));
  } else if (ewar.type === 'Target Painter') {
    var getInitalSig = function getInitalSig(t) {
      return NoScramsInRange(t) ? t.baseSigRadius : t.unpropedSigRadius;
    };
    var _oldTarget = ewar.currentTarget;
    if (_oldTarget) {
      var _pullIndex = _oldTarget.appliedEwar.tps.findIndex(function (e) {
        return e[2] === ewar;
      });
      if (_pullIndex !== -1) {
        _oldTarget.appliedEwar.tps.splice(_pullIndex, 1);
        _oldTarget.appliedEwar.tps.sort(function (a, b) {
          return Math.abs(b[0]) - Math.abs(a[0]);
        });
        _oldTarget.sigRadius = NetValue(_oldTarget.appliedEwar.tps, getInitalSig(_oldTarget));
      }
    }
    var _baseMulti = ewar.signatureRadiusBonus / 100;
    var _multi = ewarFalloffCalc(_baseMulti, ewar, distance);
    target = getFocusedEwarTarget(targets, 'tps', _multi);
    target.appliedEwar.tps.push([_multi, _baseMulti, ewar]);
    target.appliedEwar.tps.sort(function (a, b) {
      return Math.abs(b[0]) - Math.abs(a[0]);
    });
    if (target.appliedEwar.tps.length > 7) {
      target.appliedEwar.tps.pop();
    }
    target.sigRadius = NetValue(target.appliedEwar.tps, getInitalSig(target));
  } else if (ewar.type === 'Sensor Dampener') {
    target = scatterTarget;
    var _arr = ['maxTargetRangeBonus', 'scanResolutionBonus'];
    for (var _i = 0; _i < _arr.length; _i++) {
      var _attr2 = _arr[_i];
      var _oldTarget2 = ewar.currentTarget;
      if (_oldTarget2) {
        var _pullIndex2 = _oldTarget2.appliedEwar[_attr2].findIndex(function (e) {
          return e[2] === ewar;
        });
        if (_pullIndex2 !== -1) {
          _oldTarget2.appliedEwar[_attr2].splice(_pullIndex2, 1);
          _oldTarget2.appliedEwar[_attr2].sort(function (a, b) {
            return Math.abs(b[0]) - Math.abs(a[0]);
          });
          if (_attr2 === 'maxTargetRangeBonus') {
            _oldTarget2.maxTargetRange = NetValue(_oldTarget2.appliedEwar[_attr2], _oldTarget2.baseMaxTargetRange);
          } else {
            _oldTarget2.scanRes = NetValue(_oldTarget2.appliedEwar[_attr2], _oldTarget2.baseScanRes);
          }
        }
      }
      var _baseMulti2 = ewar[_attr2] / 100;
      var _multi2 = ewarFalloffCalc(_baseMulti2, ewar, distance);
      target.appliedEwar[_attr2].push([_multi2, _baseMulti2, ewar]);
      target.appliedEwar[_attr2].sort(function (a, b) {
        return Math.abs(b[0]) - Math.abs(a[0]);
      });
      if (target.appliedEwar[_attr2].length > 7) {
        target.appliedEwar[_attr2].pop();
      }
      if (_attr2 === 'maxTargetRangeBonus') {
        target.maxTargetRange = NetValue(target.appliedEwar[_attr2], target.baseMaxTargetRange);
      } else {
        target.scanRes = NetValue(target.appliedEwar[_attr2], target.baseScanRes);
      }
    }
  } else if (ewar.type === 'Weapon Disruptor') {
    var attrs = ['trackingSpeedBonus', 'maxRangeBonus', 'falloffBonus', 'aoeCloudSizeBonus', 'aoeVelocityBonus', 'missileVelocityBonus', 'explosionDelayBonus'];
    var targetVals = [function (s, attr) {
      s.weapons.forEach(function (w) {
        if (w.type === 'Turret' && !w.autonomousMovement) {
          w.stats.tracking = NetValue(s.appliedEwar[attr], w.stats.baseTracking);
        }
      });
    }, function (s, attr) {
      s.weapons.forEach(function (w) {
        if (w.type === 'Turret' && !w.autonomousMovement) {
          w.optimal = NetValue(s.appliedEwar[attr], w.baseOptimal);
        }
      });
    }, function (s, attr) {
      s.weapons.forEach(function (w) {
        if (w.type === 'Turret' && !w.autonomousMovement) {
          w.stats.falloff = NetValue(s.appliedEwar[attr], w.stats.baseFalloff);
        }
      });
    }, function (s, attr) {
      s.weapons.forEach(function (w) {
        if (w.type === 'Missile' && !w.autonomousMovement) {
          w.stats.sigRadius = NetValue(s.appliedEwar[attr], w.stats.baseSigRadius);
        }
      });
    }, function (s, attr) {
      s.weapons.forEach(function (w) {
        if (w.type === 'Missile' && !w.autonomousMovement) {
          w.stats.expVelocity = NetValue(s.appliedEwar[attr], w.stats.baseExpVelocity);
        }
      });
    }, function (s, attr) {
      s.weapons.forEach(function (w) {
        if (w.type === 'Missile' && !w.autonomousMovement) {
          w.stats.travelVelocity = NetValue(s.appliedEwar[attr], w.stats.baseTravelVelocity);
        }
      });
    }, function (s, attr) {
      s.weapons.forEach(function (w) {
        if (w.type === 'Missile' && !w.autonomousMovement) {
          w.optimal = NetValue(s.appliedEwar[attr], w.baseOptimal);
        }
      });
    }];
    target = scatterTarget;
    setProjections(ewar, distance, attrs, targetVals, target);
  } else if (ewar.type === 'Warp Scrambler' && ewar.activationBlockedStrenght > 0) {
    target = scatterTarget;
    var _getInitalVel = function _getInitalVel(t) {
      return NoScramsInRange(t) ? t.baseVelocity : t.unpropedVelocity;
    };
    var _getInitalSig = function _getInitalSig(t) {
      return NoScramsInRange(t) ? t.baseSigRadius : t.unpropedSigRadius;
    };
    var _oldTarget3 = ewar.currentTarget;
    if (_oldTarget3) {
      var _pullIndex3 = _oldTarget3.appliedEwar.scrams.findIndex(function (e) {
        return e[2] === ewar;
      });
      _oldTarget3.appliedEwar.scrams.splice(_pullIndex3, 1);
      _oldTarget3.velocity = NetValue(_oldTarget3.appliedEwar.webs, _getInitalVel(_oldTarget3));
      _oldTarget3.sigRadius = NetValue(_oldTarget3.appliedEwar.tps, _getInitalSig(_oldTarget3));
    }
    // Note the scram is intentionally added even when it's out of range.
    target.appliedEwar.scrams.push([0, 0, ewar]);
    if (distance <= ewar.optimal) {
      target.velocity = NetValue(target.appliedEwar.webs, _getInitalVel(target));
      target.sigRadius = NetValue(target.appliedEwar.tps, _getInitalSig(target));
    }
  }
  ewar.currentTarget = target;
  ewar.currentDuration = ewar.duration;
}

function RecalcEwarForDistance(ship) {
  var posDistanceOveride = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : null;

  var attrs = ['webs', 'tps', 'scrams', 'maxTargetRangeBonus', 'scanResolutionBonus', 'trackingSpeedBonus', 'maxRangeBonus', 'falloffBonus', 'aoeCloudSizeBonus', 'aoeVelocityBonus', 'missileVelocityBonus', 'explosionDelayBonus'];
  var impactedAttrs = attrs.filter(function (at) {
    return ship.appliedEwar[at].length > 0;
  });
  var _iteratorNormalCompletion3 = true;
  var _didIteratorError3 = false;
  var _iteratorError3 = undefined;

  try {
    for (var _iterator3 = impactedAttrs[Symbol.iterator](), _step3; !(_iteratorNormalCompletion3 = (_step3 = _iterator3.next()).done); _iteratorNormalCompletion3 = true) {
      var att = _step3.value;

      // Note ApplyEwar often sorts appliedEwar values so the spread opperator is needed.
      var _arr2 = [].concat(_toConsumableArray(ship.appliedEwar[att]));

      for (var _i2 = 0; _i2 < _arr2.length; _i2++) {
        var ewarApp = _arr2[_i2];
        var ewar = ewarApp[2];
        var originalTimeLeftInCycle = ewar.currentDuration;
        var distance = posDistanceOveride;
        var ewarSrc = ewar.attachedShip;
        if (distance) {
          // The distance arg is replaced if we can't reasonably
          // expect to dictate range to the ewar's source
          if (ewarSrc.velocity > ship.velocity) {
            if (distance > ewarSrc.distanceFromTarget) {
              distance = ewarSrc.distanceFromTarget;
            } else if (distance > ewar.optimal && distance > ewarSrc.preferedDistance) {
              if ((ewarSrc.velocity - ship.velocity) * 5 > distance - ewarSrc.preferedDistance) {
                distance = ewarSrc.preferedDistance;
              }
            }
          }
        }
        var d = distance || ewarSrc.distanceFromTarget;
        ApplyEwar(ewar, [ship], d, ship);
        ewar.currentDuration = originalTimeLeftInCycle;
      }
    }
  } catch (err) {
    _didIteratorError3 = true;
    _iteratorError3 = err;
  } finally {
    try {
      if (!_iteratorNormalCompletion3 && _iterator3.return) {
        _iterator3.return();
      }
    } finally {
      if (_didIteratorError3) {
        throw _iteratorError3;
      }
    }
  }
}

var SetArgsFunction = function SetArgsFunction(distance, _ref7) {
  var _ref8 = _slicedToArray(_ref7, 2),
      ship = _ref8[0],
      side = _ref8[1];

  var shipS = ship;
  var shipM = getMidShip(side, ship);
  var oppShipS = ship.targets[0];
  var oppShipM = getMidShip(side.oppSide, oppShipS);
  var _arr3 = [shipS, shipM, oppShipS, oppShipM];
  for (var _i3 = 0; _i3 < _arr3.length; _i3++) {
    var _s = _arr3[_i3];
    RecalcEwarForDistance(_s, distance);
  }
  var damageFunctionAndArgs = getApplicationArgs(shipM, oppShipS, side);
  var oppDamageFunctionAndArgs = getApplicationArgs(oppShipM, shipS, side.oppSide);
  var target = ship.targets[0];
  if (damageFunctionAndArgs[0] === null || oppDamageFunctionAndArgs[0] === null || damageFunctionAndArgs[2][0] + damageFunctionAndArgs[2][1] === 0) {
    return 0;
  }
  var combinedArgs = [damageFunctionAndArgs[0], oppDamageFunctionAndArgs[0], damageFunctionAndArgs[1], oppDamageFunctionAndArgs[1]];
  var min = damageFunctionAndArgs[2][0];
  var max = damageFunctionAndArgs[2][1];
  if (distance < min || distance > max) {
    return -1 * (-2 / 1);
  }
  // Need to fix the ships distance for calculations if the primary wep is drones
  var overrideDroneDistance = null;
  var wep = ship.weapons.sort(function (a, b) {
    return b.dps - a.dps;
  })[0];
  if (wep && wep.type === 'Turret' && wep.autonomousMovement) {
    if (wep.stats.travelVelocity > Math.max(target.velocity, 10)) {
      overrideDroneDistance = wep.optimal;
    }
  }
  var oppOverrideDroneDistance = null;
  var oppWep = target.weapons.sort(function (a, b) {
    return b.dps - a.dps;
  })[0];
  if (oppWep && oppWep.type === 'Turret' && oppWep.autonomousMovement) {
    if (oppWep.stats.travelVelocity > Math.max(ship.velocity, 10)) {
      oppOverrideDroneDistance = oppWep.optimal;
    }
  }
  return DamageRatioFunction(distance, combinedArgs, overrideDroneDistance, oppOverrideDroneDistance);
};

function FindIdealRange(ship, side) {
  var target = ship.targets[0];
  var damageFunctionAndArgs = getApplicationArgs(ship, target, side);
  var min = damageFunctionAndArgs[2][0];
  var max = damageFunctionAndArgs[2][1];
  var idealRange = getMin(SetArgsFunction, min, max, [ship, side]);
  return idealRange;
}

/** Recalcs ewar with the actual distance for ships whose stats may changed
  * within FindIdealRange as it adjusts ewar effects to consider the range being tested.
 **/
function UpdateEwarForRepShips(ship, side) {
  var shipM = getMidShip(side, ship);
  var oppShipS = ship.targets[0];
  var oppShipM = getMidShip(side.oppSide, oppShipS);
  var _arr4 = [ship, shipM, oppShipS, oppShipM];
  for (var _i4 = 0; _i4 < _arr4.length; _i4++) {
    var _s2 = _arr4[_i4];
    RecalcEwarForDistance(_s2);
  }
}

function GetUpdatedPreferedDistance(ship, side) {
  var shipsInSubFleet = side.ships.filter(function (s) {
    return s.id === ship.id;
  });
  /**
    * Note this selection will be heavily targeted by opposing ewar.
    * Something like shipsInSubFleet[Math.floor(shipsInSubFleet.length / 2)] would be better to
    * represent the fleets average ability to hold transversal or apply damage.
    * Leaving it alone for now as that would have to be consistant for both sides
    * and done fairly carefully.
   **/
  var oppCurrentPrimary = shipsInSubFleet.length > 1 ? shipsInSubFleet[1] : shipsInSubFleet[0];

  UpdateEwarForRepShips(oppCurrentPrimary, side);
  var newPreferedDistance = FindIdealRange(oppCurrentPrimary, side);

  if (newPreferedDistance !== ship.preferedDistance) {
    console.log(side.color, ship.name, ' Best Ratio updated to: ', newPreferedDistance, 'From: ', ship.preferedDistance);
  }
  RecalcEwarForDistance(ship);
  UpdateEwarForRepShips(oppCurrentPrimary, side);
  ship.rangeRecalc = 10000;
  return newPreferedDistance;
}

function moveShip(ship, t, side) {
  if (ship.targets.length <= 0) {
    return;
  }
  var anchor = ship.anchor;

  if (!ship.isAnchor && anchor) {
    ship.preferedDistance = anchor.preferedDistance;
    var gap = Math.abs(ship.dis - anchor.pendingDis);
    // We only calculate the location seprately if it's slower or has a > 0.1 second gap.
    if (ship.velocity < anchor.velocity || gap > ship.velocity / 10) {
      var travelDistance = ship.velocity * t / 1000;
      if (gap > travelDistance) {
        if (ship.dis > anchor.pendingDis) {
          ship.pendingDis -= travelDistance;
        } else {
          ship.pendingDis += travelDistance;
        }
        ship.distanceFromTarget = Math.abs(ship.dis - ship.targets[0].dis);
        return;
      }
    }
    ship.distanceFromTarget = anchor.distanceFromTarget;
    ship.pendingDis = anchor.pendingDis;
    return;
  }
  if (ship.preferedDistance > -1) {
    if (ship.rangeRecalc <= 0) {
      /**
        * Recalc the prefered range for all fc's at once to prevent
        * small discrepencies from reapplying the ewar after finishing.
        * This could be moved elsewhere to make it cleaner as
        * only each sides first rangeRecalc timer ever actually does anything.
       **/
      var newPreferedDistances = [];
      var _arr5 = [side.oppSide, side];
      for (var _i5 = 0; _i5 < _arr5.length; _i5++) {
        var _s3 = _arr5[_i5];var _iteratorNormalCompletion4 = true;
        var _didIteratorError4 = false;
        var _iteratorError4 = undefined;

        try {
          for (var _iterator4 = _s3.subFleets[Symbol.iterator](), _step4; !(_iteratorNormalCompletion4 = (_step4 = _iterator4.next()).done); _iteratorNormalCompletion4 = true) {
            var subFleet = _step4.value;

            if (subFleet.fc.currentEHP > 0) {
              newPreferedDistances.push(GetUpdatedPreferedDistance(subFleet.fc, _s3));
            }
          }
        } catch (err) {
          _didIteratorError4 = true;
          _iteratorError4 = err;
        } finally {
          try {
            if (!_iteratorNormalCompletion4 && _iterator4.return) {
              _iterator4.return();
            }
          } finally {
            if (_didIteratorError4) {
              throw _iteratorError4;
            }
          }
        }
      }
      // Only set preferedDistances after calculating all of them.
      // This prevents the order from potentially impacting the results.
      var index = 0;
      var _arr6 = [side.oppSide, side];
      for (var _i6 = 0; _i6 < _arr6.length; _i6++) {
        var _s4 = _arr6[_i6];var _iteratorNormalCompletion5 = true;
        var _didIteratorError5 = false;
        var _iteratorError5 = undefined;

        try {
          for (var _iterator5 = _s4.subFleets[Symbol.iterator](), _step5; !(_iteratorNormalCompletion5 = (_step5 = _iterator5.next()).done); _iteratorNormalCompletion5 = true) {
            var _subFleet = _step5.value;

            if (_subFleet.fc.currentEHP > 0) {
              _subFleet.fc.preferedDistance = newPreferedDistances[index];
              index += 1;
            }
          }
        } catch (err) {
          _didIteratorError5 = true;
          _iteratorError5 = err;
        } finally {
          try {
            if (!_iteratorNormalCompletion5 && _iterator5.return) {
              _iterator5.return();
            }
          } finally {
            if (_didIteratorError5) {
              throw _iteratorError5;
            }
          }
        }
      }
    }
    ship.rangeRecalc -= t;
    var _travelDistance = ship.velocity * t / 1000;
    ship.distanceFromTarget = Math.abs(ship.dis - ship.targets[0].dis);
    // This is to prevent overshoots, which can cause mirrors to chase each other.
    // (That's a problem as it causes application diffrences)
    if (Math.abs(ship.distanceFromTarget - ship.preferedDistance) < _travelDistance) {
      if (ship.preferedDistance > ship.distanceFromTarget) {
        if (ship.dis < ship.targets[0].dis) {
          ship.pendingDis = ship.targets[0].dis - ship.preferedDistance;
        } else {
          ship.pendingDis = ship.targets[0].dis + ship.preferedDistance;
        }
      } else if (ship.preferedDistance < ship.distanceFromTarget) {
        if (ship.dis < ship.targets[0].dis) {
          ship.pendingDis = ship.targets[0].dis - ship.preferedDistance;
        } else {
          ship.pendingDis = ship.targets[0].dis + ship.preferedDistance;
        }
      }
      ship.distanceFromTarget = ship.preferedDistance;
    } else {
      if (ship.preferedDistance > ship.distanceFromTarget) {
        // Move closer based off relative positions (dis)
        if (ship.dis > ship.targets[0].dis) {
          ship.pendingDis += _travelDistance;
        } else {
          ship.pendingDis -= _travelDistance;
        }
      } else if (ship.preferedDistance < ship.distanceFromTarget) {
        // Move away based off relative positions (dis)
        if (ship.dis < ship.targets[0].dis) {
          ship.pendingDis += _travelDistance;
        } else {
          ship.pendingDis -= _travelDistance;
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

function ApplyRemoteEffects(side, t, opposingSide) {
  if (side.subFleetEffectPurgeTimer < 0) {
    var _iteratorNormalCompletion6 = true;
    var _didIteratorError6 = false;
    var _iteratorError6 = undefined;

    try {
      for (var _iterator6 = side.subFleets[Symbol.iterator](), _step6; !(_iteratorNormalCompletion6 = (_step6 = _iterator6.next()).done); _iteratorNormalCompletion6 = true) {
        var subfleet = _step6.value;

        subfleet.remoteRepair = subfleet.remoteRepair.filter(function (eff) {
          return eff.type !== 'Dead Host';
        });
        subfleet.ewar = subfleet.ewar.filter(function (eff) {
          return eff.type !== 'Dead Host';
        });
      }
    } catch (err) {
      _didIteratorError6 = true;
      _iteratorError6 = err;
    } finally {
      try {
        if (!_iteratorNormalCompletion6 && _iterator6.return) {
          _iterator6.return();
        }
      } finally {
        if (_didIteratorError6) {
          throw _iteratorError6;
        }
      }
    }

    side.subFleetEffectPurgeTimer = 120000;
  } else {
    side.subFleetEffectPurgeTimer -= t;
  }
  var logiLockedShips = void 0;
  var _iteratorNormalCompletion7 = true;
  var _didIteratorError7 = false;
  var _iteratorError7 = undefined;

  try {
    for (var _iterator7 = side.subFleets[Symbol.iterator](), _step7; !(_iteratorNormalCompletion7 = (_step7 = _iterator7.next()).done); _iteratorNormalCompletion7 = true) {
      var _subfleet = _step7.value;

      var oppShipLen = opposingSide.ships.length;
      if (_subfleet.fc.targets.length > 0) {
        var i = 0;
        var _iteratorNormalCompletion8 = true;
        var _didIteratorError8 = false;
        var _iteratorError8 = undefined;

        try {
          for (var _iterator8 = _subfleet.ewar[Symbol.iterator](), _step8; !(_iteratorNormalCompletion8 = (_step8 = _iterator8.next()).done); _iteratorNormalCompletion8 = true) {
            var ewar = _step8.value;

            i += 1;
            if (ewar.currentDuration <= 0) {
              if (ewar.attachedShip.currentEHP <= 0) {
                // Apply to the dead ship with an effectively infinite duration.
                // This will purge it from the previous target.
                ewar.duration = 100000000;
                ApplyEwar(ewar, [ewar.attachedShip], 900000, ewar.attachedShip);
                ewar.type = 'Dead Host';
              } else {
                ApplyEwar(ewar, _subfleet.fc.targets, ewar.attachedShip.distanceFromTarget, opposingSide.ships[i % oppShipLen]);
              }
            }
            ewar.currentDuration -= t;
          }
        } catch (err) {
          _didIteratorError8 = true;
          _iteratorError8 = err;
        } finally {
          try {
            if (!_iteratorNormalCompletion8 && _iterator8.return) {
              _iterator8.return();
            }
          } finally {
            if (_didIteratorError8) {
              throw _iteratorError8;
            }
          }
        }
      }
      if (_subfleet.remoteRepair.length > 0) {
        if (!logiLockedShips) {
          logiLockedShips = side.ships.filter(function (s) {
            return s.rrDelayTimer > 0;
          });
        }

        var _loop = function _loop(rr) {
          if (rr.currentDuration <= 0) {
            if (rr.attachedShip.currentEHP <= 0) {
              // No need to reapply to self since rr has no ongoing effect.
              rr.currentDuration = 100000000;
              rr.type = 'Dead Host';
            } else if (rr.type === 'Remote Shield Booster') {
              var target = logiLockedShips.find(function (s) {
                return s.currentEHP > 0 && s.tankType === 'shield' && s.rrDelayTimer > s.lockTimeConstant / rr.scanRes;
              });
              if (target) {
                var postRepEhp = target.currentEHP + rr.shieldBonus / target.meanResonance;
                target.currentEHP = Math.min(postRepEhp, target.EHP);
                rr.currentDuration = rr.duration;
              }
            } else if (rr.type === 'Remote Armor Repairer') {
              var _target = rr.currentTarget;
              if (_target && _target.currentEHP > 0) {
                var effRep = rr.armorDamageAmount / _target.meanResonance;
                var _postRepEhp = _target.currentEHP + effRep;
                _target.currentEHP = Math.min(_postRepEhp, _target.EHP);
              }
              var newTarget = logiLockedShips.find(function (s) {
                return s.currentEHP > 0 && s.tankType === 'armor' && s.rrDelayTimer > s.lockTimeConstant / rr.scanRes;
              });
              if (newTarget) {
                rr.currentTarget = newTarget;
                rr.currentDuration = rr.duration;
              }
            }
          }
          rr.currentDuration -= t;
        };

        var _iteratorNormalCompletion9 = true;
        var _didIteratorError9 = false;
        var _iteratorError9 = undefined;

        try {
          for (var _iterator9 = _subfleet.remoteRepair[Symbol.iterator](), _step9; !(_iteratorNormalCompletion9 = (_step9 = _iterator9.next()).done); _iteratorNormalCompletion9 = true) {
            var rr = _step9.value;

            _loop(rr);
          }
        } catch (err) {
          _didIteratorError9 = true;
          _iteratorError9 = err;
        } finally {
          try {
            if (!_iteratorNormalCompletion9 && _iterator9.return) {
              _iterator9.return();
            }
          } finally {
            if (_didIteratorError9) {
              throw _iteratorError9;
            }
          }
        }
      }
    }
  } catch (err) {
    _didIteratorError7 = true;
    _iteratorError7 = err;
  } finally {
    try {
      if (!_iteratorNormalCompletion7 && _iterator7.return) {
        _iterator7.return();
      }
    } finally {
      if (_didIteratorError7) {
        throw _iteratorError7;
      }
    }
  }
}

function RunFleetActions(side, t, opposingSide, isSideOneOfTwo) {
  if (isSideOneOfTwo === true) {
    ApplyRemoteEffects(side, t, opposingSide);
    ApplyRemoteEffects(opposingSide, t, side);

    var _arr7 = [side, opposingSide];
    for (var _i7 = 0; _i7 < _arr7.length; _i7++) {
      var _s5 = _arr7[_i7];var _iteratorNormalCompletion10 = true;
      var _didIteratorError10 = false;
      var _iteratorError10 = undefined;

      try {
        for (var _iterator10 = _s5.subFleets[Symbol.iterator](), _step10; !(_iteratorNormalCompletion10 = (_step10 = _iterator10.next()).done); _iteratorNormalCompletion10 = true) {
          var subFleet = _step10.value;

          var ship = subFleet.fc;
          if (ship.isShotCaller === true && ship.targets.length < ship.maxTargets) {
            while (ship.targets.length > 0 && ship.targets[0].currentEHP <= 0) {
              ship.targets.shift();
            }
            getTargets(ship, _s5.oppSide);
          }
        }
      } catch (err) {
        _didIteratorError10 = true;
        _iteratorError10 = err;
      } finally {
        try {
          if (!_iteratorNormalCompletion10 && _iterator10.return) {
            _iterator10.return();
          }
        } finally {
          if (_didIteratorError10) {
            throw _iteratorError10;
          }
        }
      }
    }

    var _arr8 = [side, opposingSide];
    for (var _i8 = 0; _i8 < _arr8.length; _i8++) {
      var _s6 = _arr8[_i8];var _iteratorNormalCompletion11 = true;
      var _didIteratorError11 = false;
      var _iteratorError11 = undefined;

      try {
        for (var _iterator11 = _s6.ships[Symbol.iterator](), _step11; !(_iteratorNormalCompletion11 = (_step11 = _iterator11.next()).done); _iteratorNormalCompletion11 = true) {
          var _ship = _step11.value;

          moveShip(_ship, t, _s6);
        }
      } catch (err) {
        _didIteratorError11 = true;
        _iteratorError11 = err;
      } finally {
        try {
          if (!_iteratorNormalCompletion11 && _iterator11.return) {
            _iterator11.return();
          }
        } finally {
          if (_didIteratorError11) {
            throw _iteratorError11;
          }
        }
      }
    }

    var _arr9 = [side, opposingSide];
    for (var _i9 = 0; _i9 < _arr9.length; _i9++) {
      var _s7 = _arr9[_i9];var _iteratorNormalCompletion12 = true;
      var _didIteratorError12 = false;
      var _iteratorError12 = undefined;

      try {
        for (var _iterator12 = _s7.ships[Symbol.iterator](), _step12; !(_iteratorNormalCompletion12 = (_step12 = _iterator12.next()).done); _iteratorNormalCompletion12 = true) {
          var _ship2 = _step12.value;

          _ship2.dis = _ship2.pendingDis;
          _ship2.distanceFromTarget = Math.abs(_ship2.dis - _ship2.targets[0].pendingDis);
          if (_ship2.currentEHP < _ship2.EHP && _ship2.velocity > 0) {
            _ship2.rrDelayTimer += t;
          }
        }
      } catch (err) {
        _didIteratorError12 = true;
        _iteratorError12 = err;
      } finally {
        try {
          if (!_iteratorNormalCompletion12 && _iterator12.return) {
            _iterator12.return();
          }
        } finally {
          if (_didIteratorError12) {
            throw _iteratorError12;
          }
        }
      }
    }
  }

  var initalDamage = side.appliedDamage;
  var _iteratorNormalCompletion13 = true;
  var _didIteratorError13 = false;
  var _iteratorError13 = undefined;

  try {
    for (var _iterator13 = side.ships[Symbol.iterator](), _step13; !(_iteratorNormalCompletion13 = (_step13 = _iterator13.next()).done); _iteratorNormalCompletion13 = true) {
      var _ship3 = _step13.value;
      var _iteratorNormalCompletion14 = true;
      var _didIteratorError14 = false;
      var _iteratorError14 = undefined;

      try {
        for (var _iterator14 = _ship3.weapons[Symbol.iterator](), _step14; !(_iteratorNormalCompletion14 = (_step14 = _iterator14.next()).done); _iteratorNormalCompletion14 = true) {
          var wep = _step14.value;

          if (_ship3.targets.length > 0) {
            dealDamage(_ship3, t, wep, side);
          }
        }
      } catch (err) {
        _didIteratorError14 = true;
        _iteratorError14 = err;
      } finally {
        try {
          if (!_iteratorNormalCompletion14 && _iterator14.return) {
            _iterator14.return();
          }
        } finally {
          if (_didIteratorError14) {
            throw _iteratorError14;
          }
        }
      }
    }
  } catch (err) {
    _didIteratorError13 = true;
    _iteratorError13 = err;
  } finally {
    try {
      if (!_iteratorNormalCompletion13 && _iterator13.return) {
        _iterator13.return();
      }
    } finally {
      if (_didIteratorError13) {
        throw _iteratorError13;
      }
    }
  }

  var sideHasAppliedDamage = initalDamage !== side.appliedDamage;
  return sideHasAppliedDamage;
}

exports.default = RunFleetActions;

/***/ }),
/* 6 */
/***/ (function(module, exports) {

var g;

// This works in non-strict mode
g = (function() {
	return this;
})();

try {
	// This works if eval is allowed (see CSP)
	g = g || Function("return this")() || (1,eval)("this");
} catch(e) {
	// This works if the window reference is available
	if(typeof window === "object")
		g = window;
}

// g can still be undefined, but nothing to do about it...
// We return undefined, instead of nothing here, so it's
// easier to handle this case. if(!global) { ...}

module.exports = g;


/***/ })
/******/ ]);