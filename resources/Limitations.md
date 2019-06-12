## Currently Known Limitations:

### Unimplemented Module Types:
- Micro Jump Drives and Field Generators
- Area of Effect Doomsday Weapons
- Burst Projectors
- Emergency Hull Energizers<sup>1</sup>
- Interdiction Sphere Launchers
- ECM
- Defender Launchers

1: Will need careful modeling of target swapping to prevent them being broken or useless.

### Partially Implemented Module Types<sup>1</sup>:
- Bomb Launchers<sup>2</sup> <sup>3</sup>
- Single Target Doomsday Weapons<sup>4</sup>
- Unscripted Warp Disruption Field Generators<sup>2</sup>
- Smart Bombs<sup>2</sup>
- Mutadaptive Remote Armor Repairers<sup>5</sup>

1: Modules that are partially implemented because they export from pyfa in a fixed state are listed further down.<br />
2: Only applies to a single target, not as an AoE.<br />
3: Non-damage effects do not apply.<br />
4: Incorrectly able to target subcaps. Deals reduced damage when used this way.<br />
5: Repair amount does not spool up.

### Unimplemented Effects and Behaviors:
- Damage Types<sup>1</sup>
- Warping or jumping ships.
- Structures
- Full 3D positioning and movement.<sup>2</sup>
- Missile and Bomb destructibility.
- Ewar resistance or immunity.

1: Repairs factor in resistance but all damage is treated as omni damage (25% from each type).<br />
2: The ability to do so is considered for transversal calculations and the like.
   The main thing this would do is allow the AI to go around slower opposing ships to get to the other side without dipping into ewar range.
   Implementing this is fairly easy. Having the AI on both sides make smart use of the dimension is far more time consuming.
   Similarly effective visualization is difficult. The WebGL game engine was considered but Eve isn't actually very good at showing larger fights.

### Partially Implemented Effects and Behaviors:
- Fighters
  - No ewar
  - Cannot be destroyed
  - Movement tracked similarly to missiles.<sup>1</sup>
  - Long Range Heavy Fighters can't use Micro Bombs.
- Drones
  - No ewar
  - Cannot be destroyed
  - They teleport to the target if they're faster and in control range.<sup>2</sup>
  - Sentry Drones stay with the controlling ship.
- Remote Repair Scaling<sup>3</sup>
- Ammo swapping treats any T1 ammo as standard navy faction ammo (which deals 15% more damage than non-faction ammo).

1: Due to the lack of destructibility and potentially very long ranges.<br />
2: It's done this way because they have a much shorter range than fighters. If slower they are attached to the controlling ship.<br />
3: The formula used to calculate the diminishing returns isn't exact but should be very close, especially for high remote repair rates.

### Capacitor Interactions:
- Capacitors will only impact ships as outlined here.
- Modules and effects that fully interact with the ships capacitor
  - Capacitor Regeneration
  - Capacitor Boosters
  - Local Repairs (including ancillary repairs)
  - Energy Neutralizers
  - Energy Nosferatus
- Modules that require any needed capacitor to cycle but don't consume that capacitor when cycled.<sup>1</sup>
  - All weapons that require capacitor to function.
- All other modules and effects will behave as if the ship has limitless capacitor.

1: Typically this is done to reduce the complexity and runtime the AI needs to avoid dumb piloting errors.

### Effects and modules which have a fixed state when exported from pyfa or added to efs<sup>1</sup>:
- Weapon and module charges don't change or need reloading.
- Command Bursts<sup>2</sup> <sup>3</sup>
- Phenomena Generators<sup>2</sup> <sup>3</sup>
- Wormhole Effects<sup>2</sup>
- Overheating<sup>2</sup>
- Combat Boosters
- Reactive Armor Hardeners
- Assault Damage Controls<sup>4</sup>

1: Not including modules that don't normally change states during combat.<br />
2: Not used by default fits.<br />
3: Will only impact the ships fitting it. Project in pyfa then export to apply elsewhere.<br />
4: Largely because it wouldn't be more accurate without warp outs and target switching.
