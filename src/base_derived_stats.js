// @flow
import { shipBaseJSON } from './shipBaseJSON';
import ShipData from './ship_data_class';
import type { Hp, Resonance, SingleResonance } from './flow_types';

type TankType = 'shield' | 'armor' | 'hull';
type ResistType = 'em' | 'therm' | 'kin' | 'exp';
type ResistEffects = { em: number[], therm: number[], kin: number[], exp: number[] };

function getOmniResMod(type: TankType, quality: number, isActive: boolean): number {
  if (type === 'shield') {
    if (!isActive) {
      return 0;
    }
    if (quality <= 2) {
      return 0.3;
    } else if (quality === 3) {
      return 0.406; // Pith-C
    } else if (quality === 4) {
      return 0.469;
    }
  } else if (type === 'armor') {
    if (quality === 1) {
      return 0.25;
    } else if (quality === 2) {
      return 0.28125;
    } else if (quality === 3) {
      return 0.305;
    } else if (quality === 4) {
      return 0.35375;
    }
  } else if (type === 'hull') {
    return 0;
  }
  return 0;
}
function getSingleResMod(type: TankType, quality: number, isActive: boolean): number {
  // q1 = t2, q2 = Pith-C (deadspace), q3+ = Pith-X
  let n = 0;
  if (type === 'shield') {
    if (quality === 1) {
      n = isActive ? 0.55 : 0.46875;
    } else if (quality === 2) {
      n = isActive ? 0.573 : 0.51625;
    } else if (quality >= 3) {
      n = isActive ? 0.64 : 0.56375;
    }
  } else if (type === 'armor') {
    if (quality === 1) {
      n = isActive ? 0.55 : 0.46875;
    } else if (quality === 2) {
      n = isActive ? 0.573 : 0.51875;
    } else if (quality >= 3) {
      n = isActive ? 0.64 : 0.55625;
    }
  } else if (type === 'hull') {
    return 0;
  }
  return n;
}

function getMultiMod(type: TankType, quality: number): number {
  if (type === 'shield') {
    return 0;
  } else if (type === 'armor') {
    return 0.15;
  } else if (type === 'hull') {
    if (quality === 1) {
      return 0.25;
    }
    return 0.27;
  }
  return 0;
}

function getBufferMod(type: TankType, rigSize: number, groupID: number): [number, number] {
  let pendingCapMulti = [0, 0];
  if (type === 'shield') {
    if (rigSize === 1) {
      return [1100, 22.5];
    } else if (rigSize === 2 || rigSize === 3) {
      return [2600, 120];
    } else if (rigSize === 4) {
      pendingCapMulti = [79200, 61900];
    }
  } else if (type === 'armor') {
    if (rigSize === 1) {
      return [1200, 35];
    } else if (rigSize === 2 || rigSize === 3) {
      return [4800, 550];
    } else if (rigSize === 4) {
      pendingCapMulti = [82500, 110000];
    }
  } else if (type === 'hull') {
    return [0, 0];
  }
  if (groupID === 659) {
    pendingCapMulti[0] *= 5; // Super carriers
  } else if (groupID === 30) {
    pendingCapMulti[0] *= 6; // Titans
  }
  return pendingCapMulti;
}


function multiRes(res: SingleResonance, multi: number): SingleResonance {
  return {
    em: res.em * multi, therm: res.therm * multi, kin: res.kin * multi, exp: res.exp * multi,
  };
}

function applyEffectSet(base: number, effects: number[]): number {
  // These are actually 1 / Math.exp(((-i) / 2.67) ** 2) (where i is the index)
  // This solution is used instead for speed reasons
  const stackingPenelties = [1, 0.869, 0.571, 0.283, 0.106, 0.03, 0];
  let value = base;
  for (let i = 0; i < effects.length; i += 1) {
    value *= (1 - (effects[i] * stackingPenelties[i]));
  }
  return value;
}

function getBaseRes(res: SingleResonance): SingleResonance {
  const resistToFactorOut = 1.27551; // 1 / (1 - 0.216)
  return multiRes(res, resistToFactorOut);
}

function getEHP(resonance: Resonance, hp: Hp): number {
  const sRes = (resonance.shield.em + resonance.shield.therm +
                resonance.shield.kin + resonance.shield.exp) / 4;
  const shield = hp.shield / sRes;
  const aRes = (resonance.armor.em + resonance.armor.therm +
                resonance.armor.kin + resonance.armor.exp) / 4;
  const armor = hp.armor / aRes;
  const hRes = (resonance.hull.em + resonance.hull.therm +
                resonance.hull.kin + resonance.hull.exp) / 4;
  const hull = hp.hull / hRes;
  return shield + armor + hull;
}

function calcResonance(base: SingleResonance, effects: ResistEffects) {
  effects.em.sort((a, b) => b - a);
  effects.therm.sort((a, b) => b - a);
  effects.kin.sort((a, b) => b - a);
  effects.exp.sort((a, b) => b - a);
  const emRes = applyEffectSet(base.em, effects.em);
  const thermRes = applyEffectSet(base.therm, effects.therm);
  const kinRes = applyEffectSet(base.kin, effects.kin);
  const expRes = applyEffectSet(base.exp, effects.exp);
  return {
    em: emRes, therm: thermRes, kin: kinRes, exp: expRes,
  };
}

function tryResMod(
  resTypes: ResistType[], value: number, fullResBaseStr: string,
  tankType: TankType, effects: ResistEffects, hp: Hp,
) {
  const fullResBase: Resonance = JSON.parse(fullResBaseStr);
  for (const resType of resTypes) {
    effects[resType].push(value);
  }
  const res = calcResonance(fullResBase[tankType], effects);
  const fullRes = fullResBase;
  fullRes[tankType] = res;
  const ehp = getEHP(fullRes, hp);
  for (const resType of resTypes) {
    const ind = (effects[resType]).indexOf(value);
    effects[resType].splice(ind, 1);
  }
  return ehp;
}

function GetMaxEHP(
  fit: ShipData, side: number, tankType: TankType,
  quality: number, isActive: boolean,
) {
  if (side !== 1 || fit.resonance === undefined) {
    return 0;
  }
  const [baseBufferModHP, bufferModPG] = getBufferMod(tankType, fit.rigSize, fit.groupID);
  let bufferModHP = baseBufferModHP;
  const commandBufferMulti = 1.215625;
  const skillBufferMulti = 1.25; // shield management and hull upgrades
  bufferModHP *= commandBufferMulti * skillBufferMulti;
  let slotsLeft = tankType === 'shield' ? fit.midSlots : fit.lowSlots;
  if (fit.cpuOutput < 10 && tankType === 'shield') {
    slotsLeft = 0;
  }
  const resBase = getBaseRes(fit.resonance[tankType]);
  let fullResBaseObj = {
    shield: fit.resonance.shield, armor: fit.resonance.armor, hull: fit.resonance.hull,
  };
  fullResBaseObj[tankType] = resBase;
  const cmdBase = 0.216;
  let effects: ResistEffects = {
    em: [cmdBase], therm: [cmdBase], kin: [cmdBase], exp: [cmdBase],
  };
  let hp = { shield: fit.hp.shield, armor: fit.hp.armor, hull: fit.hp.hull };
  const omniResMod = getOmniResMod(tankType, quality, isActive);
  const singleResMod = getSingleResMod(tankType, quality, isActive);
  const multiMod = getMultiMod(tankType, quality);
  const dcuResMod = { shield: 0.125, armor: 0.15, hull: 0.4 };
  let dcuApplied = false;
  if (tankType === 'shield' && fit.lowSlots > 0) {
    const newFullResBaseObj = {};
    for (const hpType of Object.keys(fullResBaseObj)) {
      newFullResBaseObj[hpType] = {};
      for (const resistType of Object.keys(fullResBaseObj[hpType])) {
        newFullResBaseObj[hpType][resistType] =
          fullResBaseObj[hpType][resistType] * (1 - dcuResMod[hpType]);
      }
    }
    fullResBaseObj = newFullResBaseObj;
    dcuApplied = true;
  } else if (tankType === 'hull') {
    effects = {
      em: [], therm: [], kin: [], exp: [],
    };
  }
  let maxBufferMods = Math.floor(fit.powerOutput / bufferModPG);
  for (; slotsLeft > 0; slotsLeft -= 1) {
    const fullResBase = JSON.stringify(fullResBaseObj);
    const emVal = tryResMod(['em'], singleResMod, fullResBase, tankType, effects, hp);
    const thermVal = tryResMod(['therm'], singleResMod, fullResBase, tankType, effects, hp);
    const kinVal = tryResMod(['kin'], singleResMod, fullResBase, tankType, effects, hp);
    const expVal = tryResMod(['exp'], singleResMod, fullResBase, tankType, effects, hp);
    const omniVal = tryResMod(['em', 'therm', 'kin', 'exp'], omniResMod, fullResBase, tankType, effects, hp);
    const hpWithBuffer = { shield: hp.shield, armor: hp.armor, hull: hp.hull };
    if (maxBufferMods > 0) {
      hpWithBuffer[tankType] += bufferModHP;
    }
    const bufferVal = tryResMod([], 0, fullResBase, tankType, effects, hpWithBuffer);
    const hpWithMulti = { shield: hp.shield, armor: hp.armor, hull: hp.hull };
    hpWithMulti[tankType] *= (1 + multiMod);
    const multiVal = tryResMod([], 0, fullResBase, tankType, effects, hpWithMulti);
    let dcuVal = 0;
    if (dcuApplied === false) {
      const dcuBase = {};
      for (const hpType of Object.keys(fullResBaseObj)) {
        dcuBase[hpType] = {};
        for (const resistType of Object.keys(fullResBaseObj[hpType])) {
          dcuBase[hpType][resistType] =
            fullResBaseObj[hpType][resistType] * (1 - dcuResMod[hpType]);
        }
      }
      const dcuResBase = JSON.stringify(dcuBase);
      dcuVal = tryResMod([], 0, dcuResBase, tankType, effects, hp);
    }
    const valArray = [emVal, thermVal, kinVal, expVal, omniVal, bufferVal, multiVal, dcuVal];
    let resTypes = [];
    let resValue = 0;
    let newFullResBaseObj;
    valArray.sort((a, b) => b - a);
    switch (valArray[0]) {
      case emVal:
        effects.em.push(singleResMod);
        break;
      case thermVal:
        effects.therm.push(singleResMod);
        break;
      case kinVal:
        effects.kin.push(singleResMod);
        break;
      case expVal:
        effects.exp.push(singleResMod);
        break;
      case omniVal:
        resTypes = ['em', 'therm', 'kin', 'exp'];
        resValue = omniResMod;
        break;
      case bufferVal:
        hp = hpWithBuffer;
        maxBufferMods -= 1;
        break;
      case multiVal:
        hp = hpWithMulti;
        break;
      case dcuVal:
        newFullResBaseObj = {};
        for (const hpType of Object.keys(fullResBaseObj)) {
          newFullResBaseObj[hpType] = {};
          for (const resistType of Object.keys(fullResBaseObj[hpType])) {
            newFullResBaseObj[hpType][resistType] =
              fullResBaseObj[hpType][resistType] * (1 - dcuResMod[hpType]);
          }
        }
        fullResBaseObj = newFullResBaseObj;
        dcuApplied = true;
        break;
      default:
    }
    for (const resType of resTypes) {
      effects[resType].push(resValue);
    }
  }
  let rigMulti;
  if (fit.groupID === 30 || fit.groupID === 659 || quality >= 3) {
    rigMulti = tankType !== 'hull' ? 1.2 ** fit.rigSlots : 1.25 ** fit.rigSlots;
  } else {
    rigMulti = tankType !== 'hull' ? 1.15 ** fit.rigSlots : 1.2 ** fit.rigSlots;
  }
  hp[tankType] *= rigMulti;
  const fullResBaseJson = JSON.stringify(fullResBaseObj);
  const ehp = tryResMod([], 0, fullResBaseJson, tankType, effects, hp);
  return ehp;
}
export { shipBaseJSON, GetMaxEHP };
