// @flow
import React from 'react';
import {
  Divider, Accordion,
  Container, Segment, Header, Image,
} from 'semantic-ui-react';

import shieldIcon from './../eve_icons/2_64_4.png';
import armorIcon from './../eve_icons/1_64_9.png';
import hullIcon from './../eve_icons/2_64_12.png';
import powerIcon from './../eve_icons/pg_icon.png';
import cpuIcon from './../eve_icons/12_64_7.png';
import highSlotIcon from './../eve_icons/filterIconHighSlot.png';
import midSlotIcon from './../eve_icons/filterIconMediumSlot.png';
import lowSlotIcon from './../eve_icons/filterIconLowSlot.png';
import launcherIcon from './../eve_icons/21_64_16.png';
import turretIcon from './../eve_icons/13_64_7.png';
import sigRadiusIcon from './../eve_icons/22_32_14.png';
import optimalRangeIcon from './../eve_icons/74_64_10.png';

import velocityIconAB from './../eve_icons/3_64_2.png';
import velocityIconMWD from './../eve_icons/79_64_9.png';
import droneIcon from './../eve_icons/drones.png';


const GenralFaq = [
  {
    key: 'panel-baa',
    title: 'What character skills are used for calculations?',
    content: 'The simulator\'s default fits along with the Ships page both assume all skills are at level 5. \n' +
      'Custom fits exported from pyfa will reflect the skills of the character selected when they were exported from pyfa',
  },
  {
    key: 'panel-bas',
    title: 'Do effective hp and damage calculations consider damage types?',
    content: 'Not at this time. Effectively all damage is treated as being omni damage ' +
    '(equal parts electromagnetic, thermal, kinetic and explosive)',
  },
];

const GenralFaqContent = (
  <div>
    <Accordion.Accordion panels={GenralFaq} />
  </div>
);

const AddingFitsFaq = [
  {
    key: 'panel-baq',
    title: 'How do I add my own fits to simulations?',
    content: '',
  },
  {
    key: 'panel-baw',
    title: 'Are you going to steal my secret squirrel elite pvp fits?',
    content: 'No, custom fits and settings are stored locally in the browser and not sent anywhere',
  },
  {
    key: 'panel-bae',
    title: 'Is there a limit to how many fits I can add?',
    content: 'Yes, the browser will have a limit on local storage. \n' +
    'The exact number will depend on the exact fits along with your browser but it should always be at least several hundred.',
  },
  {
    key: 'panel-bar',
    title: 'Why do I have to use pyfa to add fits?',
    content: 'EFS can\'t independently calculate everything pyfa can. \n' +
    'Creating another fitting tool would be a large duplication of effort and would increase maintenance significantly',
  },
  {
    key: 'panel-bat',
    title: 'Why pyfa rather than eft or both?',
    content: 'pyfa was selected for it\'s consistency in quickly updating to match Eve over several years. \n' +
    'Exporting has only been added to pyfa for now as the work required to export EFS\'s data is non-trivial.',
  },
];

const AddingFitsFaqContent = (
  <div>
    <Accordion.Accordion panels={AddingFitsFaq} />
  </div>
);

const shipTypeDataTypeInfo = [
  [
    velocityIconAB, 'Max Velocity',
    'Maximum velocity of the hull without any modules, rigs, implants or boosters.',
  ],
  [
    velocityIconMWD, 'MWD Max Velocity',
    'Maximum velocity of the hull with a T2 Micro Warp Drive(MWD) equipped without any other modules, rigs, implants or boosters. \n' +
      'The MWD will be undersized or absent if the hull has insufficient base fitting or no med slots. \n' +
      'In all other cases it will be correctly sized based off the rigs used by the hull.',
  ],
  [
    launcherIcon, 'Effective Launchers',
    'The number of unbonused launchers of the same type  that would be required to' +
      'match the damage per second of this hulls launchers when they are making optimal use of any hull bonuses.',
  ],
  [
    turretIcon, 'Effective Turrets',
    'The number of unbonused turrets of the same type  that would be required to' +
      'match the damage per second of this hulls turrets when they are making optimal use of any hull bonuses.',
  ],
  [
    droneIcon, 'Effective Drone Bandwidth',
    'The ships drone bandwidth multiplied by the one plus the highest' +
      'damage multiplier the hull has for drones. This is just the ships drone bandwidth for ships without a drone damage bonus.',
  ],
  [
    shieldIcon, 'Max Shield EHP',
    'The maximum total effective hitpoints attainable by the hull when fit for a shield tank.' +
      'The pool of modules tested will depend on the module quality setting and wether active tanks are enabled.' +
      'Will use all available med/rig slots along with a damage control. ' +
      'Doesn\'t require any fitting room to be left for non-tank options so may fit combinations what wouldn\'t normally be practical.' +
      'For example fitting two T2 1600mm plates to an onerios leaving it with very little powergrid for remote repairers' +
      'Will not use power diagnostic systems as it\'s very rarely sensible to fit them purely for tank reasons.',
  ],
  [
    armorIcon, 'Max Armor EHP',
    'The maximum total effective hitpoints attainable by the hull when fit for a shield tank.' +
      'The pool of modules tested will depend on the module quality setting and wether active tanks are enabled.' +
      'Will use all available low/rig slots.' +
      'Doesn\'t require any fitting room to be left for non-tank options so may fit combinations what wouldn\'t normally be practical.' +
      'For example fitting two T2 1600mm plates to an onerios leaving it with very little powergrid for remote repairers',
  ],
  [
    hullIcon, 'Max Hull EHP',
    'The maximum total effective hitpoints attainable by the hull when fit for a hull tank.' +
      'The pool of modules tested will depend on the module quality setting.' +
      'Will use all available low/rig slots.',
  ],
  [
    powerIcon, 'Power Grid',
    'The hulls total available power grid without any modules, rigs, implants or boosters.',
  ],
  [
    cpuIcon, 'CPU',
    'The hulls total CPU output without any modules, rigs, implants or boosters.',
  ],
  [
    sigRadiusIcon, 'Signature Radius',
    'The hulls signature radius without any modules, rigs, implants or boosters.',
  ],
  [
    highSlotIcon, 'High Slots',
    'The number of available high power module slots',
  ],
  [
    midSlotIcon, 'Mid Slots',
    'The number of available medium power module slots',
  ],
  [
    lowSlotIcon, 'Low Slots',
    'The number of available low power module slots',
  ],
];

function dataTypeExplanation(data) {
  const icon = data[0];
  const name = data[1];
  const description = data.length < 3 ? `blarg standin description for ${name}` : data[2];
  return (
    <div key={name}>
      <Container
        text
        style={{
          display: 'flex', width: '100%', alignItems: 'center', marginLeft: 'inherit', fontSize: 'inherit',
        }}
      >
        <Image
          src={icon}
          centered={false}
          circular
          size="mini"
          style={{ overflow: 'inherit' }}
        />
        <div
          style={{
            fontSize: 'inherit', color: 'var(--high-contrast-font-color)', whiteSpace: 'pre', paddingRight: '0.5em',
          }}
        >
          {name}:
        </div>
        <Container text style={{ fontSize: 'inherit' }}>
          <div>
            {description}
          </div>
        </Container>
      </Container>
      <Divider />
    </div>
  );
}

const ShipFaq = [
  {
    key: 'panel-1a1',
    title: 'What are the exactly are the diffrent values?',
    content: { content: shipTypeDataTypeInfo.map(dataTypeExplanation), key: 'shipTypeDataTypeInfo' },
  },
  {
    key: 'panel-ba2',
    title: 'What do the module quality options correspond to?',
    content: 'Level 1B Contents',
  },
  {
    key: 'panel-ba3',
    title: 'Do the values include command bursts?',
    content: 'Yes, they include the bonuses from a perfect set of bursts provided by command ships',
  },
  {
    key: 'panel-ba4',
    title: 'How does tech 3 cruiser selection work?',
    content: 'EFS will display every possible valid combination of subsystems that can be formed from the selections made.' +
      'Be warned this can take a short while to load when there are many possible combinations',
  },
];

const ShipFaqContent = (
  <div>
    <Accordion.Accordion panels={ShipFaq} />
  </div>
);

const shipFitDataTypeInfo = [
  [
    hullIcon, 'Effective Hitpoints',
    'The fits total effective hitpoints.',
  ],
  [
    turretIcon, 'Damage Per Second',
    'The average damage per second of all the ships weapon systems combined under ideal conditions.' +
      'This includes drones even when they are disabled (however they won\'t actually deal damage in simulations).' +
      'Calculations do not include reload times.',
  ],
  [
    velocityIconMWD, 'Max Velocity',
    'Maximum velocity of the ship.',
  ],
  [
    velocityIconAB, 'Max Velocity without MWD',
    'Maximum velocity of the ship with any micro warp drives turned off to the signature radius increase.' +
      'This will still include any speed bonuses from after burners as they don\'t impact signature radius.',
  ],
  [
    optimalRangeIcon, 'Weapon Optimal Ranges',
    'The optimal range of the weapon system with the highest possible damage per second.' +
      'For drones and fighters this is their own optimal range not the control range of the fit itself.' +
      'Targeted doomsdays are treated as having a 300km optimal due limitations on lock range.',
  ],
  [
    sigRadiusIcon, 'Signature Radius',
    'The fits signature radius including any increases from micro warp drives.' +
      'For default fits micro jump drives and cynosural field generators are considered inactive.',
  ],
];

const FleetSimFaq = [
  {
    key: 'panel-2a1',
    title: 'What are the exactly are the diffrent values?',
    content: { content: shipFitDataTypeInfo.map(dataTypeExplanation), key: 'shipFitDataTypeInfo' },
  },
  {
    key: 'panel-2b2',
    title: 'Are any weapon systems unimplemented or partially implemented?',
    content: 'Area of effect doomsday weapons (lance, bfg, reaper) are unimplemented.' +
      'Single target doomsday weapons are implemented but will incorrectly fire with ' +
      'very poor application upon subcaps if they\'re targeted.' +
      'Bomb launchers and smart bombs only damage a single target.' +
      'As this somewhat implies missiles and bombs not take damage.' +
      'The micro bomb launchers on long ranger heavy fighter bombers are unimplemented.' +
      'Drones and fighters are not targeted and cannot take damage.' +
      'Drones have no delay when moving between targets if they are faster than the target and it\'s within drone control range.' +
      'Sentry drones are glued to the ship that owns them.' +
      'Fighters do model the delay between targets but it\'s inexact.' +
      'All other ship based damage dealing weapon systems should be correctly modeled.' +
      'Defender launchers are unimplemented.' +
      'If you run into something not mentioned here that seems to give incorrect simulation results please consider filing a bug report.',
  },
  {
    key: 'panel-ba3',
    title: 'How is ewar implemented?',
    content: 'Ewar can either be scattered or focused.' +
      'Scattered ewar will spread evenly across the opposing fleet.' +
      'For example if one side has 150 ships with 1 tracking disruptor(TD) each and the other' +
      'side has 100 ships then the second side would have 2 TDs applied to 50 of it\'s ships ' +
      'while the remaining 50 would each have 1 TD applied to them.' +
      'Focused ewar will apply it\'s effect 6 times before moving onto the next target based off targeting priority.' +
      'For example 10 Loki\'s with 1 web each would apply 6 webs to the primary target and 4 webs to the secondary target.' +
      'Please see "Which ewar systems are implemented?" if you wish to see which ewar systems are focused and which are scattered.' +
      'Note that although ewar does factor in the distance to the target it only adjust to any changes in the range' +
      'when either the effects impacting the target change or the ewar module completes a cycle.' +
      'The practical impact of this is expected to be nearly zero outside of very contrived and niche situations.',
  },
  {
    key: 'panel-ba4',
    title: 'Which ewar systems are implemented?',
    content: 'Stasis Webifiers (focused),' +
      'Stasis Grapplers (focused),' +
      'Target Painters (focused),' +
      'Sensor Dampeners (scattered),' +
      'Tracking Disruptors (scattered),' +
      'Missile Guidance Disruptors (scattered) and ' +
      'Warp Scramblers (scattered).' +
      'Note that drone, fighter or burst projector based variants are not implemented.',
  },
  {
    key: 'panel-ba5',
    title: 'Are repairs implemented?',
    content: 'Remote armor and shield repairs are implemented.' +
      'Local repairs are not implemented at this time however there are plans to do so.',
  },
  {
    key: 'panel-ba6',
    title: 'How are remote repairs implemented?',
    content: 'Ships broadcast for repairs upon taking damage, causing logistics (logi) to start locking them.' +
      'Repairs are cycled after the finishes locking them.' +
      'At this point the repairs are applied instantly for shields.' +
      'For armor they are applied if the target isn\'t dead at the end of the cycle.' +
      'The ship will continue to be repaired for as long as it lives and takes damage.' +
      'It\'s assumed that logistics is able to stay in range and not cap itself out.' +
      'Note logistics is used as a shorthand for any ship with shield or armor remote repair modules fitted.' +
      'The implementation is not limited specifically to logistics ships.',
  },
  {
    key: 'panel-ba7',
    title: 'How do I change which ships are targeted first?',
    content: 'Both sides will first attack opposing ships with priority 1.' +
      'If present they will move on to ships with priority 2 and so on after priority 1 ships are all dead.' +
      'After adding multiple different fits to one side you can drag the table rows to rearrange them.' +
      'The first row is always priority 1, the second row priority 2 and so on.' +
      'Ships will not change targets even if they are unable to break a target.' +
      'This is mostly to prevent the AI making it much harder to test approximations of known situations.',
  },
  {
    key: 'panel-ba8',
    title: 'How are drones and fighters implemented?',
    content: 'Sentry drones are glued to their ship.' +
      'Light, Medium and Heavy scout drones do not have movement or lock time delays,' +
      'provided they are faster than the target.' +
      'They do model tracking although it may not fully reflect quirky behavior related to rapidly' +
      'dropping in and out of travel mode (mwd) against fast targets.' +
      'Drone control range is considered.' +
      'Ewar and combat utility drones are not implemented.' +
      'Fighters have a delay based off distance however their positioning isn\'t directly modeled.' +
      'In theory they shouldn\'t have any meaningful travel time after the initial target.' +
      'In practice however the current implementation gives more realistic results until' +
      'the ability to kill them is implemented.',
  },
  {
    key: 'panel-ba9',
    title: 'How is ship movement implemented?',
    content: 'The grid is 300km across and ships cannot warp or move outside it.' +
      'Each ship will try to position itself to apply the maximum possible damage to the ' +
      'target while taking as little damage as possible.' +
      'It\'s position is always relative to it\'s current target.' +
      'The faster ships, after considering ewar, will effectively dictate range.' +
      'Keep in mind that in reality unless they are heavily tackled' +
      'fleets will typically warp out if they are being kited to hell.',
  },
  {
    key: 'panel-ba11',
    title: 'Do ships try and match transversal?',
    content: 'Yes if it\'s in their benefit to do so.' +
      'This means often the transversal will be zero unless the faster ship sees some benefit in maintaining it.' +
      'Typically this is fairly on point. It doesn\'t consider agility however so it can create slightly off results' +
      'when the faster ship has far worse agility and far worse tracking (eg Ragnarocks shooting unproped armor Abbadons).',
  },
  {
    key: 'panel-ba12',
    title: 'How do ships select their ideal range?',
    content: 'q',
  },
  {
    key: 'panel-ba13',
    title: 'Can I add my own fits to use in simulations?',
    content: 'w',
  },
  {
    key: 'panel-ba14',
    title: 'Where do the default fits come from?',
    content: 'e',
  },
  {
    key: 'panel-ba15',
    title: 'Why do none of the default fits have implants?',
    content: 'r',
  },
  {
    key: 'panel-ba16',
    title: 'Why are some of the default fits kinda wonky?',
    content: 't',
  },
  {
    key: 'panel-ba17',
    title: 'Is the simulation accurate?',
    content: 'y',
  },
  {
    key: 'panel-ba18',
    title: 'Why create an imperfect simulation?',
    content: 'u',
  },
  {
    key: 'panel-ba19',
    title: 'Is there a time limit on the simulations?',
    content: 'i',
  },
  {
    key: 'panel-b20',
    title: 'Why is my simulation finishing while both sides have ships left?',
    content: 'o',
  },
];

const FleetSimFaqContent = (
  <div>
    <Accordion.Accordion panels={FleetSimFaq} />
  </div>
);

const faq = [
  { key: 'panel-11', title: 'General', content: { content: GenralFaqContent, key: 'GenralFaqContent' } },
  { key: 'panel-12', title: 'Ship Data', content: { content: ShipFaqContent, key: 'ShipFaqContent' } },
  { key: 'panel-23', title: 'Fleet Simulation', content: { content: FleetSimFaqContent, key: 'FleetSimFaqContent' } },
  { key: 'panel-14', title: 'Custom Fits', content: { content: AddingFitsFaqContent, key: 'AddingFitsFaqContent' } },
];

function AboutPage() {
  return (
    <div className="pageMainContentWrapper">
      <Container className="pageContainer">
        <Header as="h5" attached="top">
          FAQ
        </Header>
        <Accordion panels={faq} styled fluid className="attached" />
        <Header as="h5" attached="top">
          Contact
        </Header>
        <Segment attached>
          Bug reporting and feature requests should be done via the
          <a href="(github url)"> projects github page</a>.
          The developers can also be reached by sending emails to evefleetsim@gmail.com.
        </Segment>
        <Header as="h5" attached="top">
          License
        </Header>
        <Segment attached>
          Eve Fleet Simulator is released under the
          <a href="(link to license file)" type="license"> GNU Affero GPL license </a>
          and it&apos;s
          <a href="(github url)"> source is available here</a>.
        </Segment>
        <Header as="h5" attached="top">
          CCP Copyright Notice
        </Header>
        <Segment attached>
          EVE Online and the EVE logo are the registered trademarks of CCP hf.
          All rights are reserved worldwide. All other trademarks are the property of their
          respective owners. EVE Online, the EVE logo, EVE and all associated logos and
          designs are the intellectual property of CCP hf. All artwork, screenshots,
          characters, vehicles, storylines, world facts or other recognizable features
          of the intellectual property relating to these trademarks are likewise the
          intellectual property of CCP hf. CCP hf. has granted permission to Eve Fleet Simulator
          to use EVE Online and all associated logos and designs for promotional and
          information purposes on its website but does not endorse, and is not in any
          way affiliated with, Eve Fleet Simulator.
          CCP is in no way responsible for the content on or functioning of this
          website, nor can it be liable for any damage arising from the use of this website.
        </Segment>
      </Container>
    </div>
  );
}

export default AboutPage;
