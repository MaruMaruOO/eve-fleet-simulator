// @flow
import { Dropdown } from 'semantic-ui-react';
// This is passed through rather than defined here to avoid importing the ShipData class
import type { SideShipInfo } from './index';

type Hp = {armor: number, hull: number, shield: number};
type SingleResonance = {em: number, therm: number, kin: number, exp: number};
type Resonance = {armor: SingleResonance,
               hull: SingleResonance,
               shield: SingleResonance};
type ShipSize = 'Frigate' | 'Destroyer' | 'Cruiser' | 'Battlecruiser' | 'Battleship' | 'Capital' | 'Industrial' | 'Misc';
type WeaponType = 'Turret' | 'Missile' | 'Drone' | 'SmartBomb' | 'Fighter';
type Subsystem = ?{ 'Defensive': string, 'Offensive': string, 'Propulsion': string, 'Core': string };
type SubsystemType = 'Defensive' | 'Offensive' | 'Propulsion' | 'Core';
type WeaponAbility = {
  name: string,
  volley: number,
  explosionRadius: number,
  explosionVelocity: number,
  optimal: number,
  damageReductionFactor: number,
  rof: number,
  type: WeaponType
};
class WeaponData {
  dps: number;
  type: WeaponType;
  name: string;
  maxSpeed: number;
  abilities: WeaponData[];
  ehp: number;
  volley: number;
  signatureRadius: number;
  damageReductionFactor: number;
  rof: number;
  optimal: number;
  capUse: number;
  falloff: number;
  maxVelocity: number;
  explosionRadius: number;
  explosionVelocity: number;
  tracking: number;
}

type ModuleQualityValue = 1 | 2 | 3 | 4;
type VectorMaxLenThree = [number] | [number, number] | [number, number, number];

/**
 * Note generic flow types with typing are aliased so emacs
 * JSX mode plays nice as it thinks they're html.
 */
type SyntheticInputEvent = SyntheticEvent<HTMLInputElement>;
type SyntheticButtonEvent = SyntheticEvent<HTMLButtonElement>;
type SyntheticDropdownEvent = SyntheticEvent<Dropdown>;
type GenericSyntheticTransitionEvent = SyntheticTransitionEvent<HTMLElement>;

type SimulationState = 'setup' | 'running' | 'finished';

type ButtonColors = [boolean, string, string, string, string, string];

export type {
  Hp, SingleResonance, Resonance, WeaponData, WeaponType,
  WeaponAbility, ShipSize, ModuleQualityValue, VectorMaxLenThree,
  SyntheticInputEvent, SyntheticButtonEvent, SyntheticDropdownEvent,
  SimulationState, GenericSyntheticTransitionEvent, ButtonColors,
  Subsystem, SubsystemType, SideShipInfo,
};
