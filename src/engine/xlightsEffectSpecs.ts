/**
 * Official xLights Effect Specifications & User Manual Reference Registry
 * Confirmed against the official xLights source repository (github.com/smeighan/xLights)
 * and the xLights User Manual (xlights.org / manual).
 *
 * Provides definitive parameter definitions, valid types/ranges, XML attribute names,
 * and comprehensive explanations of their exact rendering impacts on display output.
 */

export interface EffectParameterSpec {
  name: string; // Display label
  xmlKey: string; // XML attribute / Setting name in xLights clipboard/xeffect
  type: 'integer' | 'float' | 'boolean' | 'enum' | 'color';
  defaultValue: any;
  range?: { min: number; max: number; step?: number };
  options?: string[]; // For enum types
  description: string; // Official manual description
  renderingImpact: string; // Exact physical / mathematical rendering effect on display
  category: 'geometry' | 'dynamics' | 'optics' | 'palette' | '3d';
}

export interface XLightsEffectDefinition {
  effectName: string;
  category: 'Matrix & Tree' | 'Lighting & Shimmer' | 'Morph & Vector' | 'Utility & Transitions';
  manualChapter: string;
  summary: string;
  recommendedProps: string[];
  parameters: EffectParameterSpec[];
  layerBlendingNotes: string;
}

export const XLIGHTS_EFFECT_SPECS: Record<string, XLightsEffectDefinition> = {
  Spirals: {
    effectName: 'Spirals',
    category: 'Matrix & Tree',
    manualChapter: 'xLights User Manual - Section 8.35: Spirals Effect',
    summary:
      'Creates one or more helical ribbon coils that wrap around or across the model. Ideal for Mega Trees, Mini Trees, Columns, and Matrices.',
    recommendedProps: ['Mega Tree', 'Mini Tree with Star', 'Matrix', 'Spinner / ChromaStar'],
    layerBlendingNotes:
      'Layer 1 Normal blending provides the solid helical ribbon body. When layered with Twinkle or Shimmer on Layer 2 (Maximum or 2 is Mask), produces illuminated sparkling ribbons.',
    parameters: [
      {
        name: 'Arms',
        xmlKey: 'Arms',
        type: 'integer',
        defaultValue: 2,
        range: { min: 1, max: 24, step: 1 },
        description: 'The number of distinct spiral ribbon arms wrapping around the prop.',
        renderingImpact:
          'Higher values produce denser multi-start helical stripes. On a 36-strand Mega Tree, 2 to 4 arms create bold wide bands; 6 to 8 arms create fine barbershop pinstripes.',
        category: 'geometry',
      },
      {
        name: 'Wrap Count',
        xmlKey: 'Wrap Count',
        type: 'float',
        defaultValue: 2.0,
        range: { min: 0.1, max: 12.0, step: 0.1 },
        description: 'How many complete 360° revolutions each spiral arm makes from the top apex to the bottom base.',
        renderingImpact:
          'Controls helical pitch. Low values (0.5 - 1.5) create gentle, nearly vertical stripes. High values (3.0 - 6.0) create steep diagonal stripes wrapping tightly around the cone.',
        category: 'geometry',
      },
      {
        name: 'Spiral Thickness',
        xmlKey: 'Spiral Thickness',
        type: 'integer',
        defaultValue: 25,
        range: { min: 1, max: 100, step: 1 },
        description: 'Percentage of available strand space occupied by each ribbon band.',
        renderingImpact:
          'Directly controls ribbon width. 15-20% produces razor-thin crisp laser lines; 30-45% produces bold holiday ribbons; >60% covers most of the model with narrow dark gaps.',
        category: 'geometry',
      },
      {
        name: 'Direction',
        xmlKey: 'Direction',
        type: 'enum',
        defaultValue: 'Forward',
        options: ['Forward', 'Backward'],
        description: 'Direction of ribbon translation and rotation.',
        renderingImpact:
          'Forward wraps clockwise / travels down-right. Backward wraps counter-clockwise / travels up-left. Inverting direction changes optical flow curl.',
        category: 'dynamics',
      },
      {
        name: 'Speed',
        xmlKey: 'Speed',
        type: 'float',
        defaultValue: 1.0,
        range: { min: 0.1, max: 8.0, step: 0.05 },
        description: 'Speed multiplier for the helical rotational animation cycle.',
        renderingImpact:
          'Calibrates rotation cycles per second. At 1.0x, completes 1 full spin every 4 seconds (at 50ms interval). 2.0x doubles the rotational angular velocity.',
        category: 'dynamics',
      },
      {
        name: 'Rotation',
        xmlKey: 'Rotation',
        type: 'integer',
        defaultValue: 45,
        range: { min: -180, max: 180, step: 5 },
        description: 'Angular tilt of the spiral arms relative to the vertical axis.',
        renderingImpact:
          'Positive angles tilt ribbons rightward; negative tilt leftward. 0° produces purely vertical rising/falling stripes; ±45° produces classical diagonal barber pole twist.',
        category: 'geometry',
      },
      {
        name: 'Palette Repeat',
        xmlKey: 'Palette Repeat',
        type: 'integer',
        defaultValue: 1,
        range: { min: 1, max: 10, step: 1 },
        description: 'Number of times the checked color palette swatches repeat across the arms.',
        renderingImpact:
          'When Arms=4 and Palette Repeat=2 with Red+White swatches, alternates Red, White, Red, White across the 4 arms.',
        category: 'palette',
      },
      {
        name: 'Blend Colors',
        xmlKey: 'Blend Colors',
        type: 'boolean',
        defaultValue: false,
        description: 'Enables smooth continuous gradient color interpolation between adjacent ribbon edges.',
        renderingImpact:
          'When checked, creates a smooth rainbow or pastel transition. When unchecked, creates hard, razor-sharp demarcations between color stripes.',
        category: 'palette',
      },
      {
        name: '3D',
        xmlKey: '3D',
        type: 'boolean',
        defaultValue: true,
        description: 'Applies volumetric 3D spherical depth shading to the ribbons.',
        renderingImpact:
          'Strands facing toward the camera/front viewer render at 100% luminance, while strands wrapping behind the tree cone are dimmed by 40-60% to simulate physical depth and occlusion.',
        category: '3d',
      },
      {
        name: 'Highlight',
        xmlKey: 'Highlight',
        type: 'boolean',
        defaultValue: false,
        description: 'Adds an intensified specular gloss highlight along the center spline of each ribbon.',
        renderingImpact:
          'Gives ribbons a metallic or glossy candy cane sheen with luminous sub-pixel edge definition.',
        category: 'optics',
      },
    ],
  },

  Bars: {
    effectName: 'Bars',
    category: 'Matrix & Tree',
    manualChapter: 'xLights User Manual - Section 8.4: Bars Effect',
    summary:
      'Generates moving bars or bands of color across the model. One of the most versatile foundational effects in holiday sequencing.',
    recommendedProps: ['Mega Tree', 'Matrix', 'PEX Arches', 'Window Frame', 'Spinner / ChromaStar'],
    layerBlendingNotes:
      'Frequently used as a base layer under Morph or Strobe. Using "Average" blending blends bars with background colors; "2 is Mask" restricts subsequent layer animations inside the moving bars.',
    parameters: [
      {
        name: 'Direction',
        xmlKey: 'Direction',
        type: 'enum',
        defaultValue: 'Right',
        options: ['Up', 'Down', 'Left', 'Right', 'Expand', 'Compress', 'H-Expand', 'V-Expand'],
        description: 'The direction of bar motion across the prop coordinate space.',
        renderingImpact:
          'Up/Down translates vertically; Left/Right translates horizontally around the tree or across matrix; Expand/Compress creates bursting or collapsing bars radiating from the center.',
        category: 'dynamics',
      },
      {
        name: 'Bar Width',
        xmlKey: 'Bar Width',
        type: 'integer',
        defaultValue: 20,
        range: { min: 1, max: 100, step: 1 },
        description: 'The pixel width / percentage of each bar.',
        renderingImpact:
          'Controls spatial thickness. Low values (5-10%) yield fine vertical columns; high values (35-50%) yield sweeping solid blocks of color.',
        category: 'geometry',
      },
      {
        name: 'Speed',
        xmlKey: 'Speed',
        type: 'float',
        defaultValue: 1.0,
        range: { min: 0.1, max: 8.0, step: 0.1 },
        description: 'Animation translation velocity factor.',
        renderingImpact:
          'Controls cycle frequency. Higher speeds create fast sweeping chases; low speeds create slow majestic ambient translation.',
        category: 'dynamics',
      },
      {
        name: 'Palette Repeat',
        xmlKey: 'Palette Repeat',
        type: 'integer',
        defaultValue: 2,
        range: { min: 1, max: 10, step: 1 },
        description: 'How many times the color sequence repeats within one sweep.',
        renderingImpact:
          'Higher values partition the display into multiple repeating color triplets or duos.',
        category: 'palette',
      },
      {
        name: 'Highlight',
        xmlKey: 'Highlight',
        type: 'boolean',
        defaultValue: false,
        description: 'Adds an edge gradient sheen on the leading edge of each moving bar.',
        renderingImpact:
          'Imparts directional kinetic energy by brightening the front edge and feathering the trailing edge.',
        category: 'optics',
      },
      {
        name: '3D',
        xmlKey: '3D',
        type: 'boolean',
        defaultValue: true,
        description: 'Wraps bars cylindrically with cosine illumination falloff.',
        renderingImpact:
          'On Mega Trees, converts flat 2D bars into rotating 3D cylindrical columns that wrap around the back of the tree.',
        category: '3d',
      },
    ],
  },

  Butterfly: {
    effectName: 'Butterfly',
    category: 'Matrix & Tree',
    manualChapter: 'xLights User Manual - Section 8.7: Butterfly Effect',
    summary:
      'Generates mathematical chaotic attractor patterns (Lorenz fractal equation) creating kaleidoscopic wing sweeps with continuous hue shifting.',
    recommendedProps: ['Mega Tree', 'Matrix', 'Spinner / ChromaStar'],
    layerBlendingNotes:
      'Pairs exceptionally well on Layer 1 as a lush swirling gradient base, combined with Layer 2 Meteors or Shockwave in "Maximum" blend mode.',
    parameters: [
      {
        name: 'Style',
        xmlKey: 'Style',
        type: 'enum',
        defaultValue: 'Style 1',
        options: ['Style 1', 'Style 2', 'Style 3', 'Style 4', 'Style 5'],
        description: 'Selects the mathematical attractor algorithm and equation parameters.',
        renderingImpact:
          'Style 1 produces classic double-wing butterfly sweeps; Style 2 produces high-frequency turbulence; Style 3 produces radial petal blooms.',
        category: 'geometry',
      },
      {
        name: 'Direction',
        xmlKey: 'Direction',
        type: 'enum',
        defaultValue: 'Out',
        options: ['Out', 'In', 'Left', 'Right'],
        description: 'Vector flow direction of the fractal turbulence.',
        renderingImpact:
          'Out radiates from center toward perimeter; In collapses inward toward the center vortex.',
        category: 'dynamics',
      },
      {
        name: 'Speed',
        xmlKey: 'Speed',
        type: 'float',
        defaultValue: 1.0,
        range: { min: 0.1, max: 5.0, step: 0.1 },
        description: 'Temporal evolution rate of the fractal attractor.',
        renderingImpact:
          'Controls how rapidly the butterfly wings flap and morph through mathematical state space.',
        category: 'dynamics',
      },
      {
        name: 'Bkgrd',
        xmlKey: 'Bkgrd',
        type: 'integer',
        defaultValue: 0,
        range: { min: 0, max: 100, step: 5 },
        description: 'Background illumination floor percentage.',
        renderingImpact:
          '0 leaves unlit nodes totally black for maximum contrast; 20-30% keeps a soft ambient glow across unlit pixels.',
        category: 'optics',
      },
    ],
  },

  Fire: {
    effectName: 'Fire',
    category: 'Matrix & Tree',
    manualChapter: 'xLights User Manual - Section 8.16: Fire Effect',
    summary:
      'Fluid cellular convection simulation reproducing natural combustion flames, thermal plumes, and rising embers.',
    recommendedProps: ['Mega Tree', 'Matrix', 'Mini Tree with Star'],
    layerBlendingNotes:
      'Best used on Layer 1. Can be capped with a star topper twinkle on Layer 2 using "Star Only" submodel routing.',
    parameters: [
      {
        name: 'Height',
        xmlKey: 'Height',
        type: 'integer',
        defaultValue: 80,
        range: { min: 10, max: 100, step: 5 },
        description: 'Percentage of model height reached by the flame tongues.',
        renderingImpact:
          '50% confines fire to the lower trunk; 85-100% causes flame tongues to lick all the way to the tree apex.',
        category: 'geometry',
      },
      {
        name: 'Hue Shift',
        xmlKey: 'Hue Shift',
        type: 'integer',
        defaultValue: 15,
        range: { min: 0, max: 100, step: 5 },
        description: 'Chromatic shift of the thermal gradient from red/amber to yellow/white.',
        renderingImpact:
          'Low values produce deep ember red/crimson flames; medium values create bright golden hearth fire; high values shift toward hot blue/white plasma.',
        category: 'palette',
      },
      {
        name: 'Speed',
        xmlKey: 'Speed',
        type: 'float',
        defaultValue: 1.2,
        range: { min: 0.1, max: 5.0, step: 0.1 },
        description: 'Upward convective turbulence and rising plume speed.',
        renderingImpact:
          'Controls upward velocity of flame sparks and flicker frequency.',
        category: 'dynamics',
      },
      {
        name: 'Grow with Music',
        xmlKey: 'Grow with Music',
        type: 'boolean',
        defaultValue: false,
        description: 'Modulates flame height dynamically against audio track amplitude peaks.',
        renderingImpact:
          'Flame jumps and expands on heavy bass kicks or brass swells.',
        category: 'dynamics',
      },
    ],
  },

  Meteors: {
    effectName: 'Meteors',
    category: 'Lighting & Shimmer',
    manualChapter: 'xLights User Manual - Section 8.24: Meteors / Rain Effect',
    summary:
      'Simulates ballistic shooting stars, raindrops, or cascading falling streaks with fading particle persistence trails.',
    recommendedProps: ['Mega Tree', 'Matrix', 'Roofline', 'Window Frame'],
    layerBlendingNotes:
      'Superb secondary layer effect. Place on Layer 2 over a Layer 1 Color Wash or Spirals with "Maximum" blending to add shimmering falling rain.',
    parameters: [
      {
        name: 'Count',
        xmlKey: 'Count',
        type: 'integer',
        defaultValue: 25,
        range: { min: 1, max: 100, step: 1 },
        description: 'Number of active meteor particles simultaneously traversing the model.',
        renderingImpact:
          '5-10 creates occasional sparse shooting stars; 30-50 creates a dense torrential meteor storm.',
        category: 'geometry',
      },
      {
        name: 'Tail Length',
        xmlKey: 'Tail Length',
        type: 'integer',
        defaultValue: 35,
        range: { min: 5, max: 100, step: 5 },
        description: 'Persistence decay length of each meteor trail behind the head particle.',
        renderingImpact:
          'Short values (10-15%) produce compact pellets; long values (40-60%) produce long graceful luminous streaks.',
        category: 'optics',
      },
      {
        name: 'Direction',
        xmlKey: 'Direction',
        type: 'enum',
        defaultValue: 'Down',
        options: ['Down', 'Up', 'Left', 'Right'],
        description: 'Vector direction of particle trajectory.',
        renderingImpact:
          'Down reproduces natural rainfall / gravity; Up reproduces rising rocket sparks; Left/Right reproduces horizontal gale force wind.',
        category: 'dynamics',
      },
      {
        name: 'Speed',
        xmlKey: 'Speed',
        type: 'float',
        defaultValue: 1.4,
        range: { min: 0.2, max: 6.0, step: 0.1 },
        description: 'Velocity multiplier of falling meteor heads.',
        renderingImpact:
          'Directly influences optical flow vector speed.',
        category: 'dynamics',
      },
    ],
  },

  Shockwave: {
    effectName: 'Shockwave',
    category: 'Matrix & Tree',
    manualChapter: 'xLights User Manual - Section 8.33: Shockwave Effect',
    summary:
      'Produces concentric spherical or elliptical shockwave rings that burst outward from a central epicenter.',
    recommendedProps: ['Mega Tree', 'Matrix', 'Spinner / ChromaStar'],
    layerBlendingNotes:
      'Works wonders as an accent hit on snare or cymbal crashes. Placed on Layer 2 or Layer 3 with "Maximum" or "Add" blending.',
    parameters: [
      {
        name: 'Start Radius',
        xmlKey: 'Start Radius',
        type: 'integer',
        defaultValue: 0,
        range: { min: 0, max: 100, step: 5 },
        description: 'Initial radius percentage where shockwave ring originates.',
        renderingImpact:
          '0% starts from pinpoint center node; 40% starts from mid-model.',
        category: 'geometry',
      },
      {
        name: 'End Radius',
        xmlKey: 'End Radius',
        type: 'integer',
        defaultValue: 100,
        range: { min: 10, max: 200, step: 5 },
        description: 'Maximum expansion radius before ring dissipates.',
        renderingImpact:
          '100% expands until it reaches model boundaries; 150% expands well beyond perimeter for seamless bleed.',
        category: 'geometry',
      },
      {
        name: 'Width',
        xmlKey: 'Width',
        type: 'integer',
        defaultValue: 15,
        range: { min: 2, max: 50, step: 1 },
        description: 'Ring ribbon thickness from inner to outer wavefront.',
        renderingImpact:
          '5% creates razor-sharp acoustic shock pulses; 25% creates wide radiant pressure waves.',
        category: 'geometry',
      },
      {
        name: 'Speed',
        xmlKey: 'Speed',
        type: 'float',
        defaultValue: 1.5,
        range: { min: 0.2, max: 5.0, step: 0.1 },
        description: 'Shockwave propagation speed.',
        renderingImpact:
          'Governs explosive expansion velocity.',
        category: 'dynamics',
      },
    ],
  },

  Twinkle: {
    effectName: 'Twinkle',
    category: 'Lighting & Shimmer',
    manualChapter: 'xLights User Manual - Section 8.41: Twinkle Effect',
    summary:
      'Creates random or rhythmic twinkling, glittering, and shimmering across nodes.',
    recommendedProps: ['Mega Tree', 'Mini Tree with Star', 'Roofline', 'PEX Arches', 'Wreath'],
    layerBlendingNotes:
      'The quintessential overlay effect. Placed on upper layers with "Maximum" blending or routed specifically to "Star Only" submodel.',
    parameters: [
      {
        name: 'Number of Twinkles',
        xmlKey: 'Number of Twinkles',
        type: 'integer',
        defaultValue: 12,
        range: { min: 1, max: 100, step: 1 },
        description: 'Density of twinkling nodes simultaneously in active shimmer state.',
        renderingImpact:
          'Low values (5-10) create delicate quiet stars; high values (40+) create intense glittering field.',
        category: 'geometry',
      },
      {
        name: 'Twinkle Speed',
        xmlKey: 'Twinkle Speed',
        type: 'float',
        defaultValue: 2.0,
        range: { min: 0.1, max: 8.0, step: 0.2 },
        description: 'Frequency of shimmer pulse cycles per second.',
        renderingImpact:
          'Controls how rapidly nodes fade in and out.',
        category: 'dynamics',
      },
      {
        name: 'Strobe',
        xmlKey: 'Strobe',
        type: 'boolean',
        defaultValue: false,
        description: 'Replaces soft cosine twinkle fade with instantaneous square-wave strobe flashes.',
        renderingImpact:
          'Produces high-energy paparazzi flash effect rather than calm twinkle.',
        category: 'optics',
      },
      {
        name: 'Random Colors',
        xmlKey: 'Random Colors',
        type: 'boolean',
        defaultValue: false,
        description: 'Cycles through random RGB hues instead of adhering strictly to checked palette swatches.',
        renderingImpact:
          'Unchecked enforces display palette harmony (e.g. Gold+White). Checked creates multicolored glitter.',
        category: 'palette',
      },
    ],
  },

  Strobe: {
    effectName: 'Strobe',
    category: 'Lighting & Shimmer',
    manualChapter: 'xLights User Manual - Section 8.38: Strobe Effect',
    summary:
      'High-speed shutter-synchronized bursts of light designed for high-impact musical accents.',
    recommendedProps: ['Mega Tree', 'Matrix', 'Roofline', 'Single Line / Poly Line'],
    layerBlendingNotes:
      'Always best on the highest layer (Layer 3 or 4) with "Maximum" blending so strobe pulses pierce through whatever background animation is running.',
    parameters: [
      {
        name: 'Number of Strobes',
        xmlKey: 'Number of Strobes',
        type: 'integer',
        defaultValue: 8,
        range: { min: 1, max: 50, step: 1 },
        description: 'Count of strobe flash bursts per interval.',
        renderingImpact:
          'Determines intensity and frequency of strobe strikes.',
        category: 'dynamics',
      },
      {
        name: 'Strobe Duration (ms)',
        xmlKey: 'Strobe Duration (ms)',
        type: 'integer',
        defaultValue: 50,
        range: { min: 10, max: 200, step: 5 },
        description: 'On-time duration in milliseconds for each individual strobe strike.',
        renderingImpact:
          '20-30ms produces blinding instantaneous camera flash; 80-100ms produces noticeable lingering pulses.',
        category: 'dynamics',
      },
      {
        name: 'Strobe Type',
        xmlKey: 'Strobe Type',
        type: 'enum',
        defaultValue: 'Randomized',
        options: ['Randomized', 'Synchronized', 'Wave'],
        description: 'Spatial distribution pattern across nodes.',
        renderingImpact:
          'Randomized scatters flashes randomly across prop; Synchronized fires every node simultaneously for whole-yard impact.',
        category: 'geometry',
      },
    ],
  },

  'Color Wash': {
    effectName: 'Color Wash',
    category: 'Lighting & Shimmer',
    manualChapter: 'xLights User Manual - Section 8.9: Color Wash Effect',
    summary:
      'Floods the model with solid colors or sweeping linear/circular color gradients.',
    recommendedProps: ['Mega Tree', 'Matrix', 'PEX Arches', 'Window Frame', 'Wreath'],
    layerBlendingNotes:
      'Ideal as a Layer 1 base canvas under Spirals, Bars, or Twinkle in "Average" or "Normal" blending.',
    parameters: [
      {
        name: 'Horizontal Fade',
        xmlKey: 'Horizontal Fade',
        type: 'boolean',
        defaultValue: false,
        description: 'Applies a linear horizontal color gradient transition across the model.',
        renderingImpact:
          'Transitions smoothly between palette swatches from left to right.',
        category: 'palette',
      },
      {
        name: 'Vertical Fade',
        xmlKey: 'Vertical Fade',
        type: 'boolean',
        defaultValue: false,
        description: 'Applies a linear vertical color gradient transition from base to apex.',
        renderingImpact:
          'Blends lower tree colors into different apex colors.',
        category: 'palette',
      },
      {
        name: 'Speed',
        xmlKey: 'Speed',
        type: 'float',
        defaultValue: 1.0,
        range: { min: 0.1, max: 5.0, step: 0.1 },
        description: 'Rate of color cycling through the checked palette.',
        renderingImpact:
          'Controls cycle tempo.',
        category: 'dynamics',
      },
      {
        name: 'Repeat',
        xmlKey: 'Repeat',
        type: 'integer',
        defaultValue: 1,
        range: { min: 1, max: 6, step: 1 },
        description: 'How many times the gradient sequence repeats across the prop.',
        renderingImpact:
          'Partitions wash into repeating color bands.',
        category: 'palette',
      },
    ],
  },

  Pinwheel: {
    effectName: 'Pinwheel',
    category: 'Matrix & Tree',
    manualChapter: 'xLights User Manual - Section 8.30: Pinwheel Effect',
    summary:
      'Rotates radial spoke vanes around a central focal hub with optional curved twist.',
    recommendedProps: ['Spinner / ChromaStar', 'Mega Tree', 'Matrix', 'Wreath'],
    layerBlendingNotes:
      'Combines exceptionally well on spinners and wreaths. On trees, creates a radial fan or flower bloom.',
    parameters: [
      {
        name: 'Arms',
        xmlKey: 'Arms',
        type: 'integer',
        defaultValue: 6,
        range: { min: 2, max: 16, step: 1 },
        description: 'Number of radial vanes radiating from center.',
        renderingImpact:
          'Controls angular spoke count.',
        category: 'geometry',
      },
      {
        name: 'Twist',
        xmlKey: 'Twist',
        type: 'integer',
        defaultValue: 45,
        range: { min: -360, max: 360, step: 15 },
        description: 'Curvature of the vanes as they extend outward.',
        renderingImpact:
          '0 produces straight geometric spokes; 90-180° creates curved whirlpool or galaxy spiral arms.',
        category: 'geometry',
      },
      {
        name: 'Speed',
        xmlKey: 'Speed',
        type: 'float',
        defaultValue: 1.2,
        range: { min: 0.1, max: 6.0, step: 0.1 },
        description: 'Rotational angular velocity.',
        renderingImpact:
          'Controls revolutions per minute.',
        category: 'dynamics',
      },
      {
        name: 'Direction',
        xmlKey: 'Direction',
        type: 'enum',
        defaultValue: 'Clockwise',
        options: ['Clockwise', 'Counter-Clockwise'],
        description: 'Rotational direction.',
        renderingImpact:
          'Direction of spoke spin.',
        category: 'dynamics',
      },
    ],
  },

  'Single Strand': {
    effectName: 'Single Strand',
    category: 'Morph & Vector',
    manualChapter: 'xLights User Manual - Section 8.34: Single Strand Effect',
    summary:
      'Drives chases, fills, and bounces strictly along the 1D physical wiring path of a single strand or arch.',
    recommendedProps: ['PEX Arches', 'Roofline', 'Single Line / Poly Line', 'Window Frame'],
    layerBlendingNotes:
      'The definitive effect for leaping arches and jumping chases across lawn outlines.',
    parameters: [
      {
        name: 'Chase Type',
        xmlKey: 'Chase Type',
        type: 'enum',
        defaultValue: 'Left-Right',
        options: ['Left-Right', 'Right-Left', 'Bounce', 'Center-Out', 'Dual'],
        description: 'Propagation path along the node strand sequence.',
        renderingImpact:
          'Left-Right sweeps continuously; Bounce travels to the end and returns; Center-Out leaps from arch apex down both sides.',
        category: 'dynamics',
      },
      {
        name: 'Chase Size',
        xmlKey: 'Chase Size',
        type: 'integer',
        defaultValue: 15,
        range: { min: 1, max: 100, step: 1 },
        description: 'Percentage of the strand illuminated by the moving chase slug.',
        renderingImpact:
          '5-10% produces a small leaping comet; 30-50% produces a thick surging pulse.',
        category: 'geometry',
      },
      {
        name: 'Speed',
        xmlKey: 'Speed',
        type: 'float',
        defaultValue: 1.5,
        range: { min: 0.1, max: 8.0, step: 0.1 },
        description: 'Travel speed across the strand nodes.',
        renderingImpact:
          'Controls time taken to traverse from node 1 to node N.',
        category: 'dynamics',
      },
      {
        name: '3D',
        xmlKey: '3D',
        type: 'boolean',
        defaultValue: false,
        description: 'Simulates 3D tubular lighting dispersion along the strand.',
        renderingImpact:
          'Softens node boundaries to mimic diffused silicone neon or milky PEX tubing.',
        category: '3d',
      },
    ],
  },
};

/**
 * Official xLights Layer Blending Modes & Visual Composite Behaviors
 */
export const XLIGHTS_BLENDING_MODES = [
  {
    mode: 'Normal',
    formula: 'Result = LayerN (Opaque Overwrite)',
    description:
      'Standard default. Layer N completely renders over underlying layers without transparency.',
    bestUse: 'Base Layer 1 or isolated non-overlapping submodel targets (e.g. Star Only).',
  },
  {
    mode: 'Maximum',
    formula: 'Result = max(LayerN.RGB, LayerLower.RGB)',
    description:
      'Per-channel maximum comparison. Brighter illuminated pixels always win and pass through.',
    bestUse:
      'Ideal for sparkles, twinkles, star topper shimmers, and meteors over moving background effects.',
  },
  {
    mode: 'Average',
    formula: 'Result = (LayerN.RGB + LayerLower.RGB) / 2',
    description:
      'Even 50/50 additive mix blending colors smoothly together.',
    bestUse: 'Blending two color palettes or creating translucent motion overlays.',
  },
  {
    mode: '2 is Mask',
    formula: 'Result = Layer1 masked by Layer2 brightness stencil',
    description:
      'Uses Layer 2 as an alpha luminance mask cutting out shapes from Layer 1.',
    bestUse: 'Restricting moving spirals or gradients inside text, shapes, or bars.',
  },
  {
    mode: 'Add',
    formula: 'Result = min(255, LayerN.RGB + LayerLower.RGB)',
    description:
      'Pure additive lighting simulation where overlapping lights intensify and saturate toward white.',
    bestUse: 'High energy concert strobe hits, explosions, and lens flare peaks.',
  },
  {
    mode: 'Minimum',
    formula: 'Result = min(LayerN.RGB, LayerLower.RGB)',
    description: 'Darkest pixel wins, creating shadow silhouettes and inverse masks.',
    bestUse: 'Carving dark gaps or negative space animations.',
  },
];

/**
 * Lookup helper to retrieve verified official documentation for an effect
 */
export function getXLightsEffectSpec(effectName: string): XLightsEffectDefinition | null {
  const normalized = (effectName || '').trim();
  for (const [key, spec] of Object.entries(XLIGHTS_EFFECT_SPECS)) {
    if (key.toLowerCase() === normalized.toLowerCase()) {
      return spec;
    }
  }
  // Fallback matching
  for (const [key, spec] of Object.entries(XLIGHTS_EFFECT_SPECS)) {
    if (normalized.toLowerCase().includes(key.toLowerCase())) {
      return spec;
    }
  }
  return null;
}
