// @flow
import { Dropdown } from 'semantic-ui-react';
import type { Element } from 'react';
// This is passed through rather than defined here to avoid importing the ShipData class
import type { SideShipInfo, IconlessSideShipInfo } from './index';

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
  damageMultiplierBonusPerCycle: number;
  damageMultiplierBonusMax: number;
  numCharges: number;
  reloadTime: number;
}

type ProjectionTypeString =
  'Stasis Web' |
  'Weapon Disruptor' |
  'Warp Scrambler' |
  'Target Painter' |
  'Sensor Dampener' |
  'Remote Shield Booster' |
  'Remote Armor Repairer' |
  'Dead Host' | // Used when the source is dead.
  // These don't have implemented effects yet.
  'ECM' |
  'Warp Disruptor' |
  'Energy Nosferatu' |
  'Energy Neutralizer' |
  'Burst Jammer' |
  'Micro Jump Drive';

type RepairTypeString =
  'Shield Booster' |
  'Armor Repairer' |
  'Capacitor Booster';

type ModuleQualityValue = 1 | 2 | 3 | 4;
type AmmoSwapValue = 'None' | 'Cargo' | 'All';
type VectorMaxLenThree = [number] | [number, number] | [number, number, number];

/**
 * Note generic flow types with typing are aliased so emacs
 * JSX mode plays nice as it thinks they're html.
 */
type SyntheticInputEvent = SyntheticEvent<HTMLInputElement>;
type SyntheticButtonEvent = SyntheticEvent<HTMLButtonElement>;
type SyntheticDropdownEvent = SyntheticEvent<Dropdown>;
type GenericSyntheticTransitionEvent = SyntheticTransitionEvent<HTMLElement>;
type ElementDiv = Element<'div'>;

type SimulationState = 'setup' | 'running' | 'finished' | 'paused';

type ButtonColors = [boolean, string, string, string, string, string];

type FleetData = { sideOne: IconlessSideShipInfo[], sideTwo: IconlessSideShipInfo[] };
type FleetSet = { name: string, fleets: FleetData }

type AmmoData = [string, number, number, number, number, number];

type Repair = {
  type: RepairTypeString,
  cycleStarted: boolean,
  [string]: number
};

export type {
  Hp, SingleResonance, Resonance, WeaponData, WeaponType,
  WeaponAbility, ShipSize, ModuleQualityValue, VectorMaxLenThree,
  SyntheticInputEvent, SyntheticButtonEvent, SyntheticDropdownEvent,
  SimulationState, GenericSyntheticTransitionEvent, ButtonColors,
  Subsystem, SubsystemType, SideShipInfo, IconlessSideShipInfo,
  ProjectionTypeString, FleetData, FleetSet, ElementDiv,
  AmmoData, AmmoSwapValue, RepairTypeString, Repair,
};
