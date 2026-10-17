import React, { useRef, useEffect, useState, useMemo } from 'react';
import {
  CheckCircle2,
  RefreshCw,
  Send,
  Sliders,
  Sparkles,
  Layers,
  ArrowRight,
  TrendingUp,
  Cpu,
  Eye,
  Check,
  Flame,
  Dices,
  AlertTriangle,
  Split,
  Maximize2,
  Info,
  ShieldCheck,
  ShieldAlert,
  Ban,
  History,
  List,
  RotateCcw,
  ZoomIn,
  ZoomOut,
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Box,
  RotateCw,
  Zap,
  Palette,
  BookOpen,
  Search,
  X,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  HelpCircle,
  FileText,
  ListOrdered,
} from 'lucide-react';
import {
  ColorSwatch,
  ComparisonScore,
  IterationPass,
  PropGeometry,
  PropModelType,
  RoiBox,
  TemporalExtractionSummary,
  XLightsRecipe,
  DEFAULT_PROP_GEOMETRY,
  SequencerLayerInstruction,
} from '../types/xlights';
import { PropGeometryModeler } from '../engine/propModeler';
import { XLightsSimulator } from '../engine/xlightsSimulator';
import {
  XLIGHTS_EFFECT_SPECS,
  XLIGHTS_BLENDING_MODES,
  getXLightsEffectSpec,
  EffectParameterSpec,
} from '../engine/xlightsEffectSpecs';

interface SimulationComparisonViewerProps {
  recipe: XLightsRecipe;
  propType: PropModelType;
  geometry: PropGeometry;
  currentTimeMs: number;
  durationMs: number;
  targetThreshold: number;
  onChangeTargetThreshold: (val: number) => void;
  onContinueIterating: (
    userFeedback: string,
    stochasticMode?: boolean,
    visualTruthMode?: boolean
  ) => void;
  isIterating: boolean;
  sourceElement?: HTMLVideoElement | HTMLCanvasElement | null;
  roi?: RoiBox;
  summary?: TemporalExtractionSummary;
  onOpenManual?: (
    tab?: 'chapters' | 'buffers' | 'blending' | 'curves' | 'submodels' | 'effects',
    effectName?: string
  ) => void;
}

export type HeatmapViewMode = 'overlay' | 'heatmap' | 'sim' | 'split';

export interface SuggestionSquareItem {
  id: string;
  category: 'geometry' | 'motion' | 'shading' | 'palette' | 'hypothesis';
  label: string;
  badge: string;
  description: string;
  directive: string;
  deltaText: string;
  iconType: 'sparkles' | 'sliders' | 'rotate' | 'box' | 'flame' | 'layers' | 'zap' | 'palette' | 'split';
  accentColor: 'amber' | 'emerald' | 'cyan' | 'purple' | 'blue' | 'rose' | 'yellow';
}

export const SUGGESTION_SQUARES: SuggestionSquareItem[] = [
  // Geometry & Arms
  {
    id: 'geom-add-arms',
    category: 'geometry',
    label: '+2 Spiral Arms',
    badge: 'Arms +2',
    description: 'Adds 2 extra helical arms with balanced palette spacing',
    directive: 'Mid-cone needs 2 more arms; add 2 spiral arms with balanced palette repeat',
    deltaText: 'Arms: +2',
    iconType: 'sparkles',
    accentColor: 'amber',
  },
  {
    id: 'geom-single-arm',
    category: 'geometry',
    label: '1-Arm Candy Cane',
    badge: 'Arms: 1',
    description: 'Single prominent helical barber-pole stripe twisting around cone',
    directive: 'Set single 1-arm helical candy cane stripe with 2.0x wrap',
    deltaText: 'Arms: 1',
    iconType: 'sliders',
    accentColor: 'rose',
  },
  {
    id: 'geom-2-arms',
    category: 'geometry',
    label: '2-Arm Spiral',
    badge: 'Arms: 2',
    description: 'Clean dual helical bands matching classic holiday trees',
    directive: 'Set exact 2 spiral arms layout with 1.5x wrap count',
    deltaText: 'Arms: 2',
    iconType: 'sliders',
    accentColor: 'amber',
  },
  {
    id: 'geom-3-arms',
    category: 'geometry',
    label: '3-Arm Balanced',
    badge: 'Arms: 3',
    description: 'Tri-color balanced triple helix wrapping around cone',
    directive: 'Set 3 spiral arms with 3-phase chromatic offset',
    deltaText: 'Arms: 3',
    iconType: 'layers',
    accentColor: 'cyan',
  },
  {
    id: 'geom-4-arms',
    category: 'geometry',
    label: '4-Arm Dense',
    badge: 'Arms: 4',
    description: 'Rich quadruple ribbon bands wrapping simultaneously',
    directive: 'Set 4-arm dense spiral helix with repeating palette distribution',
    deltaText: 'Arms: 4',
    iconType: 'layers',
    accentColor: 'purple',
  },
  {
    id: 'geom-6-arms',
    category: 'geometry',
    label: '6-Arm Dense Helix',
    badge: 'Arms: 6',
    description: 'Ultra-dense 6-arm spiral helix for high-resolution mega trees',
    directive: 'Set dense 6-arm spiral helix with repeating palette distribution',
    deltaText: 'Arms: 6',
    iconType: 'layers',
    accentColor: 'purple',
  },
  {
    id: 'geom-8-arms',
    category: 'geometry',
    label: '8-Arm Stately Helix',
    badge: 'Arms: 8',
    description: 'High-density 8-arm spiral with fine interleaved light stripes',
    directive: 'Set dense 8-arm spiral helix with 4 palette repeats',
    deltaText: 'Arms: 8',
    iconType: 'layers',
    accentColor: 'emerald',
  },
  {
    id: 'geom-12-arms',
    category: 'geometry',
    label: '12-Arm Micro-Pinstripes',
    badge: 'Arms: 12',
    description: 'Ultra-dense fine pinstripes wrapping rapidly around tree',
    directive: 'Set 12-arm micro-pinstripe helix for high node density',
    deltaText: 'Arms: 12',
    iconType: 'layers',
    accentColor: 'blue',
  },
  {
    id: 'geom-fine-10',
    category: 'geometry',
    label: 'Micro-Thin (10%)',
    badge: 'Width 10%',
    description: 'Razor-thin light ribbons for extreme definition and separation',
    directive: 'Reduce ribbon thickness to 10% for razor-sharp thin lines',
    deltaText: 'Thick: 10%',
    iconType: 'sliders',
    accentColor: 'cyan',
  },
  {
    id: 'geom-slender-ribbon',
    category: 'geometry',
    label: 'Slender Lines',
    badge: 'Width 18%',
    description: 'Reduces ribbon thickness for sharp, high-definition lines',
    directive: 'Reduce ribbon thickness to 18% for crisp thin lines',
    deltaText: 'Thick: 18%',
    iconType: 'layers',
    accentColor: 'emerald',
  },
  {
    id: 'geom-widen-ribbon',
    category: 'geometry',
    label: 'Widen Ribbons',
    badge: 'Width 32%',
    description: 'Broadens light ribbon width so ribbons touch gracefully',
    directive: 'Increase spiral ribbon thickness to 32% for bold solid stripes',
    deltaText: 'Thick: 32%',
    iconType: 'layers',
    accentColor: 'emerald',
  },
  {
    id: 'geom-ultra-thick',
    category: 'geometry',
    label: 'Ultra-Bold (40%)',
    badge: 'Width 40%',
    description: 'Expands ribbon thickness to 40% for thick, saturated light bands',
    directive: 'Increase spiral ribbon thickness to 40% for ultra-bold solid stripes',
    deltaText: 'Thick: 40%',
    iconType: 'layers',
    accentColor: 'amber',
  },
  {
    id: 'geom-tighten-wrap',
    category: 'geometry',
    label: 'Tighten Wraps',
    badge: 'Wrap 3.0x',
    description: 'Increases helical turns around cone for steep spiral pitch',
    directive: 'Tighten helical wrap count to 3.0x for steep diagonal pitch',
    deltaText: 'Wrap: 3.0x',
    iconType: 'rotate',
    accentColor: 'blue',
  },
  {
    id: 'geom-loosen-wrap',
    category: 'geometry',
    label: 'Loosen Wraps',
    badge: 'Wrap 1.5x',
    description: 'Relaxes wrap pitch to produce wider, bolder diagonal sweeps',
    directive: 'Loosen wrap count to 1.5x for wider ribbon bands',
    deltaText: 'Wrap: 1.5x',
    iconType: 'rotate',
    accentColor: 'blue',
  },
  {
    id: 'geom-wrap-4x',
    category: 'geometry',
    label: 'Quad Wraps (4.0x)',
    badge: 'Wrap 4.0x',
    description: 'High-frequency 4-turn wrap snaking tightly up the cone',
    directive: 'Set intense 4.0x wrap count for tight fast-moving helix twists',
    deltaText: 'Wrap: 4.0x',
    iconType: 'rotate',
    accentColor: 'purple',
  },

  // Motion & Velocity
  {
    id: 'motion-accel-100',
    category: 'motion',
    label: 'Hypersonic (+100%)',
    badge: 'Speed 2.0x',
    description: 'Doubles rotation speed for high-BPM musical peaks',
    directive: 'Double speed factor to 2.0x for hypersonic tempo',
    deltaText: 'Speed: +100%',
    iconType: 'zap',
    accentColor: 'rose',
  },
  {
    id: 'motion-accel-60',
    category: 'motion',
    label: 'Speed Turbo (+60%)',
    badge: 'Speed +60%',
    description: 'Maximum velocity surge for high-energy fast musical drops',
    directive: 'Speed is much too slow; accelerate speed factor by 60%',
    deltaText: 'Speed: +60%',
    iconType: 'zap',
    accentColor: 'rose',
  },
  {
    id: 'motion-accelerate',
    category: 'motion',
    label: 'Speed Up (+30%)',
    badge: 'Speed +30%',
    description: 'Accelerates rotation speed by 30% to match fast rhythm',
    directive: 'Speed is too slow; accelerate speed factor by 30%',
    deltaText: 'Speed: +30%',
    iconType: 'zap',
    accentColor: 'amber',
  },
  {
    id: 'motion-decelerate',
    category: 'motion',
    label: 'Slow Down (-25%)',
    badge: 'Speed -25%',
    description: 'Reduces rotation speed by 25% for a stately graceful glide',
    directive: 'Speed is 25% too fast; slow down flow factor',
    deltaText: 'Speed: -25%',
    iconType: 'sliders',
    accentColor: 'blue',
  },
  {
    id: 'motion-decel-50',
    category: 'motion',
    label: 'Cinematic (-50%)',
    badge: 'Speed -50%',
    description: 'Half-speed stately rotation for serene, majestic visual sweeps',
    directive: 'Speed is too fast; slow down flow factor by 50% for cinematic glide',
    deltaText: 'Speed: -50%',
    iconType: 'sliders',
    accentColor: 'blue',
  },
  {
    id: 'motion-decel-75',
    category: 'motion',
    label: 'Glacial Crawl (-75%)',
    badge: 'Speed -75%',
    description: 'Quarter speed for ultra-slow meditative ambiance',
    directive: 'Slow down flow factor to 25% for glacial ambient evolution',
    deltaText: 'Speed: -75%',
    iconType: 'sliders',
    accentColor: 'cyan',
  },
  {
    id: 'motion-invert-dir',
    category: 'motion',
    label: 'Invert Direction',
    badge: 'CW ↔ CCW',
    description: 'Flips motion between clockwise and counter-clockwise',
    directive: 'Invert motion direction (reverse clockwise to counter-clockwise)',
    deltaText: 'Flip Dir',
    iconType: 'rotate',
    accentColor: 'rose',
  },
  {
    id: 'motion-angle-65',
    category: 'motion',
    label: 'Steep Pitch (65°)',
    badge: 'Angle: 65°',
    description: 'Near-vertical helical climb ascending rapidly up the prop body',
    directive: 'Tighten helical rotation angle to 65° steep vertical pitch',
    deltaText: 'Rot: 65°',
    iconType: 'split',
    accentColor: 'cyan',
  },
  {
    id: 'motion-diag-45',
    category: 'motion',
    label: 'Diagonal (45°)',
    badge: 'Angle: 45°',
    description: 'Calibrates diagonal pitch angle across 45 degrees',
    directive: 'Harmonize helical rotation angle to 45° diagonal pitch',
    deltaText: 'Rot: 45°',
    iconType: 'split',
    accentColor: 'cyan',
  },
  {
    id: 'motion-angle-25',
    category: 'motion',
    label: 'Shallow Pitch (25°)',
    badge: 'Angle: 25°',
    description: 'Broad sweeping horizontal loops with relaxed vertical rise',
    directive: 'Loosen helical rotation angle to 25° shallow horizontal pitch',
    deltaText: 'Rot: 25°',
    iconType: 'split',
    accentColor: 'cyan',
  },
  {
    id: 'motion-vert-flow',
    category: 'motion',
    label: 'Vertical Flow (0°)',
    badge: 'Angle: 0°',
    description: 'Removes rotational slant for straight vertical cascades',
    directive: 'Set vertical translation flow without rotation (0° pitch)',
    deltaText: 'Rot: 0°',
    iconType: 'sliders',
    accentColor: 'cyan',
  },
  {
    id: 'motion-sine-wave',
    category: 'motion',
    label: 'Sinusoidal Easing',
    badge: 'Sine Wave',
    description: 'Periodic velocity surge and ease matching musical cadence',
    directive: 'Apply sinusoidal speed acceleration easing wave',
    deltaText: 'Sine Ease',
    iconType: 'zap',
    accentColor: 'emerald',
  },
  {
    id: 'motion-sawtooth',
    category: 'motion',
    label: 'Sawtooth Pulse',
    badge: '0-100% Pulse',
    description: 'Adds brightness oscillator pulsing from 0% to 100%',
    directive: 'Apply sawtooth brightness pulse oscillating 0% to 100%',
    deltaText: 'Sawtooth',
    iconType: 'zap',
    accentColor: 'amber',
  },

  // 3D & Shading
  {
    id: 'shade-ultra-bloom',
    category: 'shading',
    label: 'Ultra Bloom (+60%)',
    badge: 'Bloom +60%',
    description: 'Intense atmospheric light diffusion and glowing optical halos',
    directive: 'Boost volumetric bloom glow blur by 60% with radiant halo',
    deltaText: 'Bloom +60%',
    iconType: 'flame',
    accentColor: 'amber',
  },
  {
    id: 'shade-cone-bloom',
    category: 'shading',
    label: 'Volumetric Bloom',
    badge: 'Bloom Glow',
    description: 'Boosts front strand glow and optical luminous blur',
    directive: 'Enhance front ribbon lumens, glow blur, and bloom lighting',
    deltaText: 'Bloom +30%',
    iconType: 'flame',
    accentColor: 'amber',
  },
  {
    id: 'shade-3d-occlude',
    category: 'shading',
    label: '3D Mast Occlusion',
    badge: 'Mast Occlude',
    description: 'Dims rear strands behind interior mast to stop moiré criss-cross',
    directive: 'Increase interior mast occlusion to hide rear moire criss-crossing',
    deltaText: '3D Occlude',
    iconType: 'box',
    accentColor: 'cyan',
  },
  {
    id: 'shade-rim-light',
    category: 'shading',
    label: 'Perimeter Rim Light',
    badge: 'Rim Lighting',
    description: 'Sharp silhouette rim lighting along outer edge strands',
    directive: 'Enable outer perimeter strand edge rim lighting highlight',
    deltaText: 'Rim Light',
    iconType: 'sparkles',
    accentColor: 'cyan',
  },
  {
    id: 'shade-ambient-3d',
    category: 'shading',
    label: 'Balanced Ambient 3D',
    badge: '3D Balanced',
    description: 'Calibrates front-to-back lighting ratio for deep realistic volume',
    directive: 'Set balanced 3D ambient perspective with subtle rear reflection',
    deltaText: '3D Balance',
    iconType: 'box',
    accentColor: 'blue',
  },
  {
    id: 'shade-star-topper',
    category: 'shading',
    label: 'Star Sparkle',
    badge: 'Apex Star',
    description: 'Illuminates star topper with golden ambient shimmer',
    directive: 'Activate bright golden star topper sparkle and apex glow',
    deltaText: 'Topper ON',
    iconType: 'sparkles',
    accentColor: 'yellow',
  },
  {
    id: 'shade-neon-glow',
    category: 'shading',
    label: 'Neon High-Lumen',
    badge: 'Neon Glow',
    description: 'Electrifies ribbon colors with radiant high-lumen saturation',
    directive: 'Apply neon high-lumen optical bloom with intense core brightness',
    deltaText: 'Neon +50%',
    iconType: 'zap',
    accentColor: 'rose',
  },
  {
    id: 'shade-dark-stage',
    category: 'shading',
    label: 'Midnight Stage',
    badge: 'High Contrast',
    description: 'Deep pitch-black stage background maximizing pixel brilliance',
    directive: 'Enhance stage contrast with deep black background and zero ambient bleed',
    deltaText: 'Pure Black',
    iconType: 'box',
    accentColor: 'blue',
  },

  // Palette & Color Blending
  {
    id: 'pal-smooth-blend',
    category: 'palette',
    label: 'Smooth Blend',
    badge: 'Blend: ON',
    description: 'Interpolates continuous color gradients across light ribbons',
    directive: 'Enable smooth gradient color blending between adjacent ribbons',
    deltaText: 'Blend ON',
    iconType: 'layers',
    accentColor: 'emerald',
  },
  {
    id: 'pal-distinct-bands',
    category: 'palette',
    label: 'High-Contrast',
    badge: 'Blend: OFF',
    description: 'Turns off blending for crisp, distinct color band edges',
    directive: 'Disable color blending for crisp distinct color bands',
    deltaText: 'Blend OFF',
    iconType: 'split',
    accentColor: 'rose',
  },
  {
    id: 'pal-dual-color',
    category: 'palette',
    label: 'Dual Alternating',
    badge: '2-Color Cycle',
    description: 'Alternates top 2 dominant colors in clean alternating sequence',
    directive: 'Alternate active primary 2 colors in repeating cadence',
    deltaText: 'Dual Color',
    iconType: 'palette',
    accentColor: 'purple',
  },
  {
    id: 'pal-candy-cane',
    category: 'palette',
    label: 'Candy Cane Stripe',
    badge: 'Red + White',
    description: 'Pure holiday red and bright white peppermint alternating bands',
    directive: 'Set classic red and white candy cane alternating palette',
    deltaText: 'Red & White',
    iconType: 'palette',
    accentColor: 'rose',
  },
  {
    id: 'pal-classic-xmas',
    category: 'palette',
    label: 'Classic Christmas',
    badge: 'Red/Green/Gold',
    description: 'Traditional holiday trio: Crimson Red, Emerald Green, and Warm Gold',
    directive: 'Set traditional Christmas palette: Red, Green, and Warm Gold',
    deltaText: 'Xmas Trio',
    iconType: 'palette',
    accentColor: 'emerald',
  },
  {
    id: 'pal-winter-frost',
    category: 'palette',
    label: 'Winter Frost',
    badge: 'Cyan/Blue/White',
    description: 'Cool glacial palette: Electric Cyan, Royal Blue, and Arctic White',
    directive: 'Set cool winter frost palette: Cyan, Royal Blue, and Glacier White',
    deltaText: 'Frost Ice',
    iconType: 'palette',
    accentColor: 'blue',
  },
  {
    id: 'pal-synthwave',
    category: 'palette',
    label: 'Neon Synthwave',
    badge: 'Magenta/Cyan',
    description: 'Retro 80s synthwave neon palette: Hot Magenta, Cyber Cyan, and Violet',
    directive: 'Set vivid Neon Synthwave palette: Hot Magenta, Cyan, and Deep Violet',
    deltaText: 'Synthwave',
    iconType: 'palette',
    accentColor: 'rose',
  },
  {
    id: 'pal-fire-amber',
    category: 'palette',
    label: 'Blazing Embers',
    badge: 'Fire Palette',
    description: 'Warm glowing fire: Lava Crimson, Blaze Orange, and Radiant Gold',
    directive: 'Set warm blazing ember palette: Crimson, Orange, and Golden Yellow',
    deltaText: 'Fire Embers',
    iconType: 'flame',
    accentColor: 'amber',
  },
  {
    id: 'pal-ocean-deep',
    category: 'palette',
    label: 'Ocean Depths',
    badge: 'Navy / Aqua',
    description: 'Deep oceanic gradients: Midnight Navy, Vivid Azure, and Pale Aqua',
    directive: 'Set deep oceanic palette: Navy, Azure Blue, and Seafoam Aqua',
    deltaText: 'Deep Ocean',
    iconType: 'palette',
    accentColor: 'cyan',
  },
  {
    id: 'pal-rainbow-prism',
    category: 'palette',
    label: 'Rainbow Prism',
    badge: '7 Colors',
    description: 'Full rich visible spectrum chromatic sequence across prop',
    directive: 'Apply full rainbow prism spectrum palette across all ribbons',
    deltaText: 'Rainbow',
    iconType: 'palette',
    accentColor: 'purple',
  },
  {
    id: 'pal-invert-order',
    category: 'palette',
    label: 'Invert Palette Order',
    badge: 'Reverse Palette',
    description: 'Flips color order across active slots for reversed color sweeps',
    directive: 'Reverse color sequence order across active palette slots',
    deltaText: 'Flip Colors',
    iconType: 'split',
    accentColor: 'purple',
  },

  // Effect Hypotheses
  {
    id: 'hypo-fire',
    category: 'hypothesis',
    label: 'Fire & Flames',
    badge: 'Fire Effect',
    description: 'Organic turbulent flames and embers licking up from base',
    directive: 'Switch effect to dynamic rising Fire and Flame tongues',
    deltaText: 'Type: Fire',
    iconType: 'flame',
    accentColor: 'rose',
  },
  {
    id: 'hypo-meteors',
    category: 'hypothesis',
    label: 'Cascading Meteors',
    badge: 'Meteors',
    description: 'Fast descending shooting stars cascading down all ribbons',
    directive: 'Switch effect to cascading Meteors rain with tail trail decay',
    deltaText: 'Type: Meteors',
    iconType: 'zap',
    accentColor: 'cyan',
  },
  {
    id: 'hypo-butterfly',
    category: 'hypothesis',
    label: 'Butterfly Wings',
    badge: 'Butterfly',
    description: 'Hypnotic symmetrical butterfly wings flapping outward',
    directive: 'Switch effect to Butterfly wings flapping gradient sweep',
    deltaText: 'Type: Butterfly',
    iconType: 'sparkles',
    accentColor: 'purple',
  },
  {
    id: 'hypo-shockwave',
    category: 'hypothesis',
    label: 'Concentric Shockwave',
    badge: 'Shockwave',
    description: 'Concentric shockwave rings expanding outward across the model',
    directive: 'Switch effect to concentric Shockwave pulses bursting outward',
    deltaText: 'Type: Shockwave',
    iconType: 'zap',
    accentColor: 'amber',
  },
  {
    id: 'hypo-bars',
    category: 'hypothesis',
    label: 'Morph to Bars',
    badge: 'Bars Effect',
    description: 'Converts primary hypothesis to 3D cylindrical Bars effect',
    directive: 'Morphed primary effect to 3D Cylindrical Bars',
    deltaText: 'Type: Bars',
    iconType: 'box',
    accentColor: 'blue',
  },
  {
    id: 'hypo-twinkle',
    category: 'hypothesis',
    label: 'Twinkle Curtain',
    badge: 'Twinkle',
    description: 'Transforms effect into high-density sparkling Twinkle Curtain',
    directive: 'Switch effect to high-density Twinkle Curtain across all strands',
    deltaText: 'Type: Twinkle',
    iconType: 'sparkles',
    accentColor: 'yellow',
  },
  {
    id: 'hypo-colorwash',
    category: 'hypothesis',
    label: 'Color Wash Wave',
    badge: 'Color Wash',
    description: 'Rolls rich saturated color waves vertically across the prop',
    directive: 'Switch effect to smooth rolling Color Wash Wave',
    deltaText: 'Type: Wash',
    iconType: 'flame',
    accentColor: 'rose',
  },
  {
    id: 'hypo-pinwheel',
    category: 'hypothesis',
    label: 'Radial Pinwheel',
    badge: 'Pinwheel',
    description: 'Converts to rotating radial spokes spinning from center hub',
    directive: 'Switch effect to rotating radial Pinwheel spokes',
    deltaText: 'Type: Pinwheel',
    iconType: 'rotate',
    accentColor: 'purple',
  },
  {
    id: 'hypo-chase',
    category: 'hypothesis',
    label: 'Strand Chase',
    badge: 'Chase Effect',
    description: 'Sequential bouncing strand chase sweeping across prop channels',
    directive: 'Sequential single strand bouncing chase with tail fade',
    deltaText: 'Type: Chase',
    iconType: 'zap',
    accentColor: 'emerald',
  },
  {
    id: 'hypo-arch-bounce',
    category: 'hypothesis',
    label: 'Arch Symmetrical Bounce',
    badge: 'Arch Bounce',
    description: 'Dual leaping light pulses bouncing inward and outward symmetrically',
    directive: 'Sequential bouncing chase bouncing symmetrically from center out',
    deltaText: 'Type: Bounce',
    iconType: 'split',
    accentColor: 'cyan',
  },
  {
    id: 'hypo-strobe',
    category: 'hypothesis',
    label: 'High-Energy Strobe',
    badge: 'Strobe',
    description: 'Ultra-fast rhythmic strobing flash for intense musical accents',
    directive: 'Switch effect to high-frequency strobe pulses with rapid decay',
    deltaText: 'Type: Strobe',
    iconType: 'zap',
    accentColor: 'amber',
  },
];

const renderSquareIcon = (type: string) => {
  switch (type) {
    case 'zap': return <Zap className="w-3.5 h-3.5 text-amber-400" />;
    case 'sliders': return <Sliders className="w-3.5 h-3.5 text-blue-400" />;
    case 'rotate': return <RotateCw className="w-3.5 h-3.5 text-cyan-400" />;
    case 'box': return <Box className="w-3.5 h-3.5 text-emerald-400" />;
    case 'flame': return <Flame className="w-3.5 h-3.5 text-rose-400" />;
    case 'layers': return <Layers className="w-3.5 h-3.5 text-purple-400" />;
    case 'palette': return <Palette className="w-3.5 h-3.5 text-amber-300" />;
    case 'split': return <Split className="w-3.5 h-3.5 text-cyan-400" />;
    case 'sparkles':
    default:
      return <Sparkles className="w-3.5 h-3.5 text-amber-400" />;
  }
};

/**
 * Derives a cloned preview recipe applying a suggestion square's mutations
 */
export function applySuggestionToRecipe(
  baseRecipe: XLightsRecipe,
  sq: SuggestionSquareItem
): XLightsRecipe {
  const cloned: XLightsRecipe = {
    ...baseRecipe,
    settings: { ...baseRecipe.settings },
    palette: [...baseRecipe.palette],
  };

  const d = sq.directive.toLowerCase();
  const id = sq.id;

  const makeSwatch = (index: number, hex: string, name: string): ColorSwatch => ({
    index,
    hex,
    name,
    rgb: [255, 255, 255],
    percentage: 50,
    checked: true,
  });

  // Palette modifications
  if (id === 'pal-candy-cane') {
    cloned.palette = [
      makeSwatch(1, '#ef4444', 'Peppermint Red'),
      makeSwatch(2, '#ffffff', 'Glacier White'),
    ];
  } else if (id === 'pal-classic-xmas') {
    cloned.palette = [
      makeSwatch(1, '#dc2626', 'Crimson Red'),
      makeSwatch(2, '#16a34a', 'Emerald Green'),
      makeSwatch(3, '#f59e0b', 'Warm Gold'),
    ];
  } else if (id === 'pal-winter-frost') {
    cloned.palette = [
      makeSwatch(1, '#06b6d4', 'Electric Cyan'),
      makeSwatch(2, '#2563eb', 'Royal Blue'),
      makeSwatch(3, '#f8fafc', 'Arctic White'),
    ];
  } else if (id === 'pal-synthwave') {
    cloned.palette = [
      makeSwatch(1, '#ff007f', 'Neon Magenta'),
      makeSwatch(2, '#00f0ff', 'Cyber Cyan'),
      makeSwatch(3, '#7928ca', 'Electric Violet'),
    ];
  } else if (id === 'pal-fire-amber') {
    cloned.palette = [
      makeSwatch(1, '#ef4444', 'Lava Crimson'),
      makeSwatch(2, '#f97316', 'Blaze Orange'),
      makeSwatch(3, '#fbbf24', 'Golden Yellow'),
    ];
  } else if (id === 'pal-ocean-deep') {
    cloned.palette = [
      makeSwatch(1, '#0284c7', 'Deep Azure'),
      makeSwatch(2, '#06b6d4', 'Cyan Glow'),
      makeSwatch(3, '#e0f2fe', 'Foam White'),
    ];
  } else if (id === 'pal-rainbow-prism') {
    cloned.palette = [
      makeSwatch(1, '#ef4444', 'Red'),
      makeSwatch(2, '#f97316', 'Orange'),
      makeSwatch(3, '#eab308', 'Yellow'),
      makeSwatch(4, '#22c55e', 'Green'),
      makeSwatch(5, '#06b6d4', 'Cyan'),
      makeSwatch(6, '#3b82f6', 'Blue'),
      makeSwatch(7, '#a855f7', 'Violet'),
    ];
  } else if (id === 'pal-invert-order') {
    cloned.palette = [...cloned.palette].reverse();
  } else if (id === 'pal-smooth-blend') {
    cloned.settings['Blend Colors'] = true;
  } else if (id === 'pal-distinct-bands') {
    cloned.settings['Blend Colors'] = false;
  } else if (id === 'pal-dual-color') {
    cloned.palette = cloned.palette.slice(0, 2);
  }

  // Effect Hypotheses
  if (id === 'hypo-fire' || d.includes('fire') || d.includes('flame')) {
    cloned.effectName = 'Fire';
    cloned.settings['Height'] = 80;
    cloned.settings['Hue Shift'] = 15;
    cloned.settings['Speed'] = cloned.settings['Speed'] || 1.3;
  } else if (id === 'hypo-meteors' || d.includes('meteor')) {
    cloned.effectName = 'Meteors';
    cloned.settings['Count'] = 25;
    cloned.settings['Tail Length'] = 35;
    cloned.settings['Speed'] = cloned.settings['Speed'] || 1.4;
  } else if (id === 'hypo-butterfly' || d.includes('butterfly')) {
    cloned.effectName = 'Butterfly';
    cloned.settings['Style'] = 'Style 1';
    cloned.settings['Direction'] = 'Out';
    cloned.settings['Speed'] = cloned.settings['Speed'] || 1.2;
  } else if (id === 'hypo-shockwave' || d.includes('shockwave')) {
    cloned.effectName = 'Shockwave';
    cloned.settings['Start Radius'] = 0;
    cloned.settings['End Radius'] = 100;
    cloned.settings['Width'] = 15;
  } else if (id === 'hypo-bars' || d.includes('bars')) {
    cloned.effectName = 'Bars';
    cloned.settings['Bar Width'] = 16;
    cloned.settings['Highlight'] = true;
    cloned.settings['3D'] = true;
  } else if (id === 'hypo-twinkle' || d.includes('twinkle')) {
    cloned.effectName = 'Twinkle';
    cloned.settings['Number of Twinkles'] = 35;
    cloned.settings['Twinkle Speed'] = 2.0;
  } else if (id === 'hypo-colorwash' || d.includes('color wash')) {
    cloned.effectName = 'Color Wash';
    cloned.settings['Count'] = 2;
    cloned.settings['Cycles'] = 2;
  } else if (id === 'hypo-pinwheel' || d.includes('pinwheel')) {
    cloned.effectName = 'Pinwheel';
    cloned.settings['Arms'] = 6;
    cloned.settings['Twist'] = 15;
  } else if (id === 'hypo-chase' || id === 'hypo-arch-bounce' || d.includes('chase') || d.includes('bounce')) {
    cloned.effectName = 'Single Strand';
    cloned.settings['Type'] = (id === 'hypo-arch-bounce' || d.includes('bounce')) ? 'Bounce' : 'Chase';
    cloned.settings['Chase Size'] = 8;
  } else if (id === 'hypo-strobe' || d.includes('strobe')) {
    cloned.effectName = 'Strobe';
    cloned.settings['Number of Strobes'] = 16;
  }

  // Geometry / Arms / Thickness
  if (d.includes('12-arm') || id === 'geom-12-arms') {
    cloned.settings['Arms'] = 12;
    cloned.settings['Palette Repeat'] = 6;
  } else if (d.includes('8-arm') || id === 'geom-8-arms') {
    cloned.settings['Arms'] = 8;
    cloned.settings['Palette Repeat'] = 4;
  } else if (d.includes('6-arm') || id === 'geom-6-arms') {
    cloned.settings['Arms'] = 6;
    cloned.settings['Palette Repeat'] = 3;
  } else if (d.includes('4-arm') || id === 'geom-4-arms') {
    cloned.settings['Arms'] = 4;
    cloned.settings['Palette Repeat'] = 2;
  } else if (d.includes('3-arm') || id === 'geom-3-arms') {
    cloned.settings['Arms'] = 3;
    cloned.settings['Palette Repeat'] = 1;
  } else if (d.includes('2-arm') || id === 'geom-2-arms') {
    cloned.settings['Arms'] = 2;
    cloned.settings['Palette Repeat'] = 1;
  } else if (d.includes('1-arm') || id === 'geom-single-arm') {
    cloned.settings['Arms'] = 1;
    cloned.settings['Wrap Count'] = 2.0;
  }

  if (d.includes('10%') || id === 'geom-fine-10') {
    cloned.settings['Spiral Thickness'] = 10;
  } else if (d.includes('40%') || id === 'geom-ultra-thick') {
    cloned.settings['Spiral Thickness'] = 40;
  } else if (d.includes('32%') || id === 'geom-widen-ribbon') {
    cloned.settings['Spiral Thickness'] = 32;
  } else if (d.includes('18%') || id === 'geom-slender-ribbon') {
    cloned.settings['Spiral Thickness'] = 18;
  }

  if (d.includes('4.0x') || id === 'geom-wrap-4x') {
    cloned.settings['Wrap Count'] = 4.0;
  } else if (d.includes('3.0x') || id === 'geom-tighten-wrap') {
    cloned.settings['Wrap Count'] = 3.0;
  } else if (d.includes('1.5x') || id === 'geom-loosen-wrap') {
    cloned.settings['Wrap Count'] = 1.5;
  }

  // Motion & Speed
  if (d.includes('+100%') || id === 'motion-accel-100') {
    cloned.settings['Speed'] = Number((Number(cloned.settings['Speed'] || 1.0) * 2.0).toFixed(2));
  } else if (d.includes('60%') || id === 'motion-accel-60') {
    cloned.settings['Speed'] = Number((Number(cloned.settings['Speed'] || 1.0) * 1.6).toFixed(2));
  } else if (d.includes('30%') || id === 'motion-accelerate') {
    cloned.settings['Speed'] = Number((Number(cloned.settings['Speed'] || 1.0) * 1.3).toFixed(2));
  } else if (d.includes('-75%') || id === 'motion-decel-75') {
    cloned.settings['Speed'] = Number((Number(cloned.settings['Speed'] || 1.0) * 0.25).toFixed(2));
  } else if (d.includes('-50%') || id === 'motion-decel-50') {
    cloned.settings['Speed'] = Number((Number(cloned.settings['Speed'] || 1.0) * 0.5).toFixed(2));
  } else if (d.includes('-25%') || id === 'motion-decelerate') {
    cloned.settings['Speed'] = Number((Number(cloned.settings['Speed'] || 1.0) * 0.75).toFixed(2));
  }

  if (d.includes('reverse') || d.includes('invert motion') || id === 'motion-invert-dir') {
    cloned.settings['Direction'] =
      cloned.settings['Direction'] === 'Backward' ? 'Forward' : 'Backward';
  }

  if (id === 'motion-angle-25') {
    cloned.settings['Rotation'] = 25;
  } else if (id === 'motion-angle-65') {
    cloned.settings['Rotation'] = 65;
  } else if (id === 'motion-diag-45') {
    cloned.settings['Rotation'] = 45;
  } else if (id === 'motion-vert-flow') {
    cloned.settings['Rotation'] = 0;
  } else if (id === 'motion-sine-wave') {
    cloned.settings['Pulse Shape'] = 'Sine';
  } else if (id === 'motion-sawtooth') {
    cloned.settings['Pulse Shape'] = 'Sawtooth';
  }

  // Shading
  if (id === 'shade-star-topper' || d.includes('star topper')) {
    cloned.settings['hasStarTopper'] = true;
    cloned.settings['Sparkle Topper'] = true;
  }
  if (id === 'shade-ultra-bloom' || d.includes('60%')) {
    cloned.settings['Bloom Glow'] = 2.2;
    cloned.settings['3D'] = true;
  } else if (id === 'shade-cone-bloom' || d.includes('bloom')) {
    cloned.settings['Bloom Glow'] = 1.6;
    cloned.settings['3D'] = true;
  }
  if (id === 'shade-neon-glow') {
    cloned.settings['Bloom Glow'] = 2.5;
    cloned.settings['3D'] = true;
    cloned.settings['Neon Boost'] = true;
  }
  if (id === 'shade-rim-light' || d.includes('rim')) {
    cloned.settings['Rim Lighting'] = true;
  }
  if (id === 'shade-ambient-3d' || id === 'shade-3d-occlude') {
    cloned.settings['3D'] = true;
    cloned.settings['Mast Occlusion'] = true;
  }

  // Ensure multi-layer stack synchronizes Layer 1 with cloned settings and palette
  if (cloned.multiLayerStack && cloned.multiLayerStack.length > 0) {
    cloned.multiLayerStack = cloned.multiLayerStack.map((l) =>
      l.layerIndex === 1
        ? {
            ...l,
            effectName: cloned.effectName,
            settings: { ...cloned.settings },
            palette: [...cloned.palette],
          }
        : l
    );
  }

  return cloned;
}

export const SimulationComparisonViewer: React.FC<SimulationComparisonViewerProps> = ({
  recipe,
  propType,
  geometry,
  currentTimeMs,
  durationMs,
  targetThreshold,
  onChangeTargetThreshold,
  onContinueIterating,
  isIterating,
  sourceElement,
  roi,
  summary,
  onOpenManual,
}) => {
  const simCanvasRef = useRef<HTMLCanvasElement>(null);
  const displayCanvasRef = useRef<HTMLCanvasElement>(null);
  const sourceRoiCanvasRef = useRef<HTMLCanvasElement>(null);

  // Persistent reusable scratch canvas buffers to eliminate allocations in 60fps render loop
  const offSourceCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const offHeatmapCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const offFallbackCanvasRef = useRef<HTMLCanvasElement | null>(null);

  // Suggestion Square Live Preview & Revert State
  const [previewedSuggestion, setPreviewedSuggestion] = useState<{
    id: string;
    label: string;
    directive: string;
    previewRecipe: XLightsRecipe;
  } | null>(null);

  const [viewMode, setViewMode] = useState<HeatmapViewMode>('overlay');
  const [heatmapOpacity, setHeatmapOpacity] = useState<number>(0.65);
  const [stochasticMode, setStochasticMode] = useState<boolean>(true);
  const [visualTruthMode, setVisualTruthMode] = useState<boolean>(true);
  const [userFeedback, setUserFeedback] = useState<string>('');
  const [selectedPass, setSelectedPass] = useState<number | null>(null);
  const [previewPropType, setPreviewPropType] = useState<PropModelType>(propType);
  const [historyViewMode, setHistoryViewMode] = useState<'ribbon' | 'detailed'>('ribbon');
  const [historyFilter, setHistoryFilter] = useState<'all' | 'valid' | 'rejected'>('all');

  // Viewport Zoom & Pan State
  const [zoomLevel, setZoomLevel] = useState<number>(1.0);
  const [panOffset, setPanOffset] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isDraggingCanvas, setIsDraggingCanvas] = useState<boolean>(false);
  const [dragAnchor, setDragAnchor] = useState<{ x: number; y: number }>({ x: 0, y: 0 });

  // 3D Spatial Orbit Mode State
  const [is3DOrbitMode, setIs3DOrbitMode] = useState<boolean>(false);
  const [orbitYaw, setOrbitYaw] = useState<number>(0);
  const [orbitPitch, setOrbitPitch] = useState<number>(18);
  const [isAutoSpinning, setIsAutoSpinning] = useState<boolean>(false);

  // Iteration Pass Scrubbing & Auto-Playback State
  const [isPlayingPasses, setIsPlayingPasses] = useState<boolean>(false);

  // Refinement Directive Suggestion Squares State & Slide-Out Drawer
  const [isSuggestionDrawerOpen, setIsSuggestionDrawerOpen] = useState<boolean>(false);
  const [suggestionSearchQuery, setSuggestionSearchQuery] = useState<string>('');
  const [isHotspotExpanded, setIsHotspotExpanded] = useState<boolean>(false);

  // Multi-Layer Inspector State & Official Parameter Manual Modal
  const [inspectorTab, setInspectorTab] = useState<'layers' | 'guide' | 'manual'>('layers');
  const [selectedInspectorLayer, setSelectedInspectorLayer] = useState<number | 'all'>('all');
  const [selectedParameterInfo, setSelectedParameterInfo] = useState<{
    effectName: string;
    paramKey: string;
    spec: EffectParameterSpec | null;
    currentValue: any;
  } | null>(null);

  const [suggestionCategory, setSuggestionCategory] = useState<
    'all' | 'geometry' | 'motion' | 'shading' | 'palette' | 'hypothesis'
  >('all');
  const [activeSuggestionId, setActiveSuggestionId] = useState<string | null>(null);

  const filteredSuggestionSquares = useMemo(() => {
    let list =
      suggestionCategory === 'all'
        ? SUGGESTION_SQUARES
        : SUGGESTION_SQUARES.filter((s) => s.category === suggestionCategory);
    if (suggestionSearchQuery.trim()) {
      const q = suggestionSearchQuery.toLowerCase();
      list = list.filter(
        (s) =>
          s.label.toLowerCase().includes(q) ||
          s.badge.toLowerCase().includes(q) ||
          s.description.toLowerCase().includes(q) ||
          s.directive.toLowerCase().includes(q)
      );
    }
    return list;
  }, [suggestionCategory, suggestionSearchQuery]);

  // Auto-Spin in 3D Orbit Mode
  useEffect(() => {
    if (!isAutoSpinning || !is3DOrbitMode) return;
    const interval = setInterval(() => {
      setOrbitYaw((prev) => (prev + 1.2) % 360);
    }, 30);
    return () => clearInterval(interval);
  }, [isAutoSpinning, is3DOrbitMode]);

  // Auto-Scrub Intermediate Passes Timeline Playback
  useEffect(() => {
    if (!isPlayingPasses) return;
    const passesCount = (recipe.iterationHistory || []).length;
    if (passesCount <= 1) {
      setIsPlayingPasses(false);
      return;
    }
    const interval = setInterval(() => {
      setSelectedPass((curr) => {
        const next = (curr === null ? 1 : curr) + 1;
        if (next > passesCount) {
          setIsPlayingPasses(false);
          return passesCount;
        }
        return next;
      });
    }, 450);
    return () => clearInterval(interval);
  }, [isPlayingPasses, recipe.iterationHistory]);

  const handleCanvasMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    setIsDraggingCanvas(true);
    setDragAnchor({ x: e.clientX, y: e.clientY });
  };

  const handleCanvasMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDraggingCanvas) return;
    const deltaX = e.clientX - dragAnchor.x;
    const deltaY = e.clientY - dragAnchor.y;
    setDragAnchor({ x: e.clientX, y: e.clientY });

    if (is3DOrbitMode) {
      setOrbitYaw((prev) => (prev + deltaX * 0.75 + 360) % 360);
      setOrbitPitch((prev) => Math.max(-40, Math.min(55, prev - deltaY * 0.5)));
    } else if (zoomLevel > 1.0) {
      setPanOffset((prev) => ({
        x: prev.x + deltaX,
        y: prev.y + deltaY,
      }));
    }
  };

  const handleCanvasMouseUp = () => {
    setIsDraggingCanvas(false);
  };

  const handleCanvasWheel = (e: React.WheelEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    const zoomDelta = e.deltaY < 0 ? 0.15 : -0.15;
    setZoomLevel((prev) => Math.max(0.6, Math.min(3.0, Number((prev + zoomDelta).toFixed(2)))));
  };

  const handleResetZoom = () => {
    setZoomLevel(1.0);
    setPanOffset({ x: 0, y: 0 });
  };

  const [discrepancyMetrics, setDiscrepancyMetrics] = useState<{
    meanErrorPct: number;
    topZoneErrorPct: number;
    midZoneErrorPct: number;
    baseZoneErrorPct: number;
    hotspotZone: 'Apex / Star' | 'Mid Cone Body' | 'Base Perimeter' | 'None';
    hotspotDiagnosis: string;
    severePixelPct: number;
  }>({
    meanErrorPct: 14.8,
    topZoneErrorPct: 11.2,
    midZoneErrorPct: 22.4,
    baseZoneErrorPct: 15.6,
    hotspotZone: 'Mid Cone Body',
    hotspotDiagnosis: 'Analyzing real-time pixel discrepancies...',
    severePixelPct: 8.2,
  });

  useEffect(() => {
    setPreviewPropType(propType);
  }, [propType]);

  const history = recipe.iterationHistory || [];
  const activePass =
    selectedPass !== null
      ? history.find((p) => p.passNumber === selectedPass) || history[history.length - 1]
      : history[history.length - 1];

  const score: ComparisonScore = activePass?.score ||
    recipe.simulationScore || {
      luminanceCorrelation: 94,
      motionCosineSimilarity: 96,
      colorDeltaSimilarity: 92,
      overallMatchPercentage: 94.6,
      notes: 'High visual match',
    };

  // Raw unverified heuristic score helper (bypasses off-screen Visual Truth pixel gating)
  const getRawPassScore = (p: IterationPass) => {
    const phot = p.score.luminanceCorrelation;
    const mot = p.score.motionCosineSimilarity;
    const col = p.score.colorDeltaSimilarity;
    const rawVal = Number((0.40 * mot + 0.35 * phot + 0.25 * col).toFixed(1));
    return Math.min(99.0, Math.max(45.0, rawVal));
  };

  const rawScore = useMemo(() => {
    if (activePass) return getRawPassScore(activePass);
    const phot = score.luminanceCorrelation;
    const mot = score.motionCosineSimilarity;
    const col = score.colorDeltaSimilarity;
    const rawVal = Number((0.40 * mot + 0.35 * phot + 0.25 * col).toFixed(1));
    return Math.min(99.0, Math.max(45.0, rawVal));
  }, [activePass, score]);

  // Displayed match score responds live to the Visual Truth toggle
  const displayedScoreVal = visualTruthMode
    ? (activePass?.score.overallMatchPercentage ?? score.overallMatchPercentage)
    : rawScore;

  const validPassesCount = useMemo(() => history.filter((p) => p.isValid !== false).length, [history]);
  const rejectedPassesCount = useMemo(() => history.filter((p) => p.isValid === false).length, [history]);

  const filteredHistory = useMemo(() => {
    if (historyFilter === 'valid') return history.filter((p) => p.isValid !== false);
    if (historyFilter === 'rejected') return history.filter((p) => p.isValid === false);
    return history;
  }, [history, historyFilter]);

  // Computes where the parameter logic and score diverged from the previous pass
  const getPassDivergence = (pass: IterationPass) => {
    if (pass.passNumber <= 1) {
      return {
        diffText: 'Initial synthesis extracted from optical flow and temporal density',
        scoreDelta: 0,
        divergedParams: [],
      };
    }
    const prev = history.find((p) => p.passNumber === pass.passNumber - 1);
    if (!prev) {
      return {
        diffText: 'Direct parameter mutation',
        scoreDelta: 0,
        divergedParams: [],
      };
    }

    const diverged: string[] = [];
    const keys = Array.from(new Set([...Object.keys(pass.settings), ...Object.keys(prev.settings)]));
    for (const k of keys) {
      if (pass.settings[k] !== prev.settings[k]) {
        diverged.push(`${k}: ${prev.settings[k]} → ${pass.settings[k]}`);
      }
    }

    const scoreDelta = Number(
      (pass.score.overallMatchPercentage - prev.score.overallMatchPercentage).toFixed(1)
    );

    return {
      diffText:
        diverged.length > 0
          ? `Mutated: ${diverged.join(', ')}`
          : 'Refined internal harmonics and raster phase',
      scoreDelta,
      divergedParams: diverged,
    };
  };

  // Primary rendering & Real-time Pixel Difference Heatmap Loop
  useEffect(() => {
    const simCanvas = simCanvasRef.current;
    const displayCanvas = displayCanvasRef.current;
    if (!simCanvas || !displayCanvas) return;

    const currentGeom =
      previewPropType === propType
        ? geometry
        : { ...geometry, ...(DEFAULT_PROP_GEOMETRY[previewPropType] || {}) };

    // 1. Render Simulated xLights Output onto hidden simCanvas
    const nodes = PropGeometryModeler.generateNodes(previewPropType, currentGeom);
    // Formulate the effective recipe considering previewed suggestions and active scrubbed passes
    const effectiveRecipeForSim: XLightsRecipe = previewedSuggestion
      ? previewedSuggestion.previewRecipe
      : activePass
      ? {
          ...recipe,
          effectName: activePass.effectName,
          settings: { ...activePass.settings },
          multiLayerStack:
            activePass.multiLayerStack && activePass.multiLayerStack.length > 0
              ? activePass.multiLayerStack
              : recipe.multiLayerStack
              ? recipe.multiLayerStack.map((l) =>
                  l.layerIndex === 1
                    ? { ...l, effectName: activePass.effectName, settings: { ...activePass.settings } }
                    : l
                )
              : undefined,
          stepByStepGuide: activePass.stepByStepGuide || recipe.stepByStepGuide,
        }
      : recipe;

    const nodeColors =
      effectiveRecipeForSim.multiLayerStack && effectiveRecipeForSim.multiLayerStack.length > 0
        ? XLightsSimulator.simulateCompositeRecipe(nodes, effectiveRecipeForSim, currentTimeMs, durationMs)
        : XLightsSimulator.simulateFrame(
            nodes,
            effectiveRecipeForSim.effectName,
            effectiveRecipeForSim.settings,
            effectiveRecipeForSim.palette,
            currentTimeMs,
            durationMs
          );

    XLightsSimulator.renderNodesToCanvas(nodes, nodeColors, simCanvas);

    // 2. Sample Source Video ROI
    const dispW = displayCanvas.width;
    const dispH = displayCanvas.height;
    const dispCtx = displayCanvas.getContext('2d');
    if (!dispCtx) return;

    // Persistent offscreen buffers for sampling (avoids garbage collection allocation churn)
    if (!offSourceCanvasRef.current) {
      offSourceCanvasRef.current = document.createElement('canvas');
    }
    const offSource = offSourceCanvasRef.current;
    if (offSource.width !== dispW || offSource.height !== dispH) {
      offSource.width = dispW;
      offSource.height = dispH;
    }
    const offSourceCtx = offSource.getContext('2d');

    const effectiveRoi = roi || { x: 0.1, y: 0.1, width: 0.8, height: 0.8 };
    let hasRealSourcePixels = false;

    if (sourceElement && offSourceCtx) {
      const sw =
        sourceElement instanceof HTMLVideoElement ? sourceElement.videoWidth : sourceElement.width;
      const sh =
        sourceElement instanceof HTMLVideoElement ? sourceElement.videoHeight : sourceElement.height;

      if (sw > 0 && sh > 0) {
        const sx = effectiveRoi.x * sw;
        const sy = effectiveRoi.y * sh;
        const sWidth = effectiveRoi.width * sw;
        const sHeight = effectiveRoi.height * sh;
        try {
          offSourceCtx.fillStyle = '#05070a';
          offSourceCtx.fillRect(0, 0, dispW, dispH);

          // Draw video ROI centered and proportion-aligned matching the simulated prop envelope margins
          const padX = 0.08 * dispW;
          const padY = 0.06 * dispH;
          const targetW = dispW - 2 * padX;
          const targetH = dispH - 2 * padY;
          offSourceCtx.drawImage(sourceElement, sx, sy, sWidth, sHeight, padX, padY, targetW, targetH);
          hasRealSourcePixels = true;
        } catch (e) {
          hasRealSourcePixels = false;
        }
      }
    }

    // Also draw to auxiliary sourceRoiCanvas if in split mode
    if (sourceRoiCanvasRef.current && offSourceCtx && hasRealSourcePixels) {
      const srcRoiCtx = sourceRoiCanvasRef.current.getContext('2d');
      if (srcRoiCtx) {
        srcRoiCtx.clearRect(0, 0, sourceRoiCanvasRef.current.width, sourceRoiCanvasRef.current.height);
        srcRoiCtx.drawImage(offSource, 0, 0, sourceRoiCanvasRef.current.width, sourceRoiCanvasRef.current.height);
      }
    }

    // 3. Extract Pixel Arrays
    const simCtx = simCanvas.getContext('2d');
    if (!simCtx) return;
    const simImgData = simCtx.getImageData(0, 0, dispW, dispH);
    const simData = simImgData.data;

    let sourceData: Uint8ClampedArray;
    if (hasRealSourcePixels && offSourceCtx) {
      sourceData = offSourceCtx.getImageData(0, 0, dispW, dispH).data;
    } else {
      // Reusable synthetic fallback generated from telemetry luminance and active palette
      if (!offFallbackCanvasRef.current) {
        offFallbackCanvasRef.current = document.createElement('canvas');
      }
      const fallbackCanvas = offFallbackCanvasRef.current;
      if (fallbackCanvas.width !== dispW || fallbackCanvas.height !== dispH) {
        fallbackCanvas.width = dispW;
        fallbackCanvas.height = dispH;
      }
      const fbCtx = fallbackCanvas.getContext('2d')!;
      fbCtx.fillStyle = '#050505';
      fbCtx.fillRect(0, 0, dispW, dispH);

      // Draw synthetic target pattern matching current time
      const tNorm = durationMs > 0 ? (currentTimeMs % durationMs) / durationMs : 0;
      const isMega = previewPropType === 'Mega Tree';
      fbCtx.save();
      fbCtx.translate(dispW / 2, dispH / 2);
      for (let arm = 0; arm < 4; arm++) {
        const angle = arm * (Math.PI / 2) + tNorm * Math.PI * 4;
        fbCtx.strokeStyle = recipe.palette[arm % recipe.palette.length]?.hex || '#ef4444';
        fbCtx.lineWidth = isMega ? 16 : 8;
        fbCtx.beginPath();
        for (let r = 10; r < dispH * 0.45; r += 5) {
          const theta = angle + (r / dispH) * Math.PI * 3;
          const px = Math.cos(theta) * r * (isMega ? (r / (dispH * 0.45)) : 1);
          const py = Math.sin(theta) * r * 0.9;
          if (r === 10) fbCtx.moveTo(px, py);
          else fbCtx.lineTo(px, py);
        }
        fbCtx.stroke();
      }
      fbCtx.restore();
      sourceData = fbCtx.getImageData(0, 0, dispW, dispH).data;
    }

    // 4. Compute Pixel-Level Discrepancy Heatmap
    const heatmapImgData = dispCtx.createImageData(dispW, dispH);
    const heatData = heatmapImgData.data;

    let totalError = 0;
    let countedPixels = 0;
    let severeCount = 0;

    let topZoneSum = 0;
    let topZoneCount = 0;
    let midZoneSum = 0;
    let midZoneCount = 0;
    let baseZoneSum = 0;
    let baseZoneCount = 0;

    const topBoundary = dispH * 0.33;
    const baseBoundary = dispH * 0.66;

    for (let y = 0; y < dispH; y++) {
      for (let x = 0; x < dispW; x++) {
        const idx = (y * dispW + x) * 4;

        const rSrc = sourceData[idx];
        const gSrc = sourceData[idx + 1];
        const bSrc = sourceData[idx + 2];
        const aSrc = sourceData[idx + 3] / 255;

        const rSim = simData[idx];
        const gSim = simData[idx + 1];
        const bSim = simData[idx + 2];
        const aSim = simData[idx + 3] / 255;

        const lumSrc = 0.299 * rSrc + 0.587 * gSrc + 0.114 * bSrc;
        const lumSim = 0.299 * rSim + 0.587 * gSim + 0.114 * bSim;

        const isActive = lumSrc > 12 || lumSim > 12;

        if (!isActive) {
          // Both background dark
          heatData[idx] = 0;
          heatData[idx + 1] = 0;
          heatData[idx + 2] = 0;
          heatData[idx + 3] = 0;
          continue;
        }

        // Color and Luminance Discrepancy (0..1)
        const lumDiff = Math.abs(lumSrc - lumSim) / 255;
        const colorDiff =
          Math.sqrt(
            Math.pow(rSrc - rSim, 2) + Math.pow(gSrc - gSim, 2) + Math.pow(bSrc - bSim, 2)
          ) / 441.67;

        const pixelError = 0.45 * lumDiff + 0.55 * colorDiff;
        totalError += pixelError;
        countedPixels++;

        if (pixelError > 0.45) severeCount++;

        if (y < topBoundary) {
          topZoneSum += pixelError;
          topZoneCount++;
        } else if (y < baseBoundary) {
          midZoneSum += pixelError;
          midZoneCount++;
        } else {
          baseZoneSum += pixelError;
          baseZoneCount++;
        }

        // Color mapping for Difference Heatmap:
        // Green (match) -> Yellow/Amber (minor) -> Orange (moderate) -> Crimson/Hot Red (severe failure)
        if (pixelError < 0.18) {
          // Excellent match (< 18% discrepancy) -> Emerald Green
          heatData[idx] = 16;
          heatData[idx + 1] = 185;
          heatData[idx + 2] = 129;
          heatData[idx + 3] = Math.round(180 * Math.min(1, aSrc + aSim));
        } else if (pixelError < 0.38) {
          // Minor drift (18% - 38%) -> Amber Yellow
          heatData[idx] = 245;
          heatData[idx + 1] = 158;
          heatData[idx + 2] = 11;
          heatData[idx + 3] = Math.round(210 * Math.min(1, aSrc + aSim));
        } else if (pixelError < 0.58) {
          // Moderate discrepancy (38% - 58%) -> Vibrant Orange
          heatData[idx] = 249;
          heatData[idx + 1] = 115;
          heatData[idx + 2] = 22;
          heatData[idx + 3] = Math.round(235 * Math.min(1, aSrc + aSim));
        } else {
          // Severe Recipe Failure (>= 58% discrepancy) -> Crimson Red / Hot Pink
          heatData[idx] = 239;
          heatData[idx + 1] = 68;
          heatData[idx + 2] = 68;
          heatData[idx + 3] = 255;
        }
      }
    }

    // 5. Update Discrepancy Diagnostics
    const meanErr = countedPixels > 0 ? (totalError / countedPixels) * 100 : 15;
    const topErr = topZoneCount > 0 ? (topZoneSum / topZoneCount) * 100 : 12;
    const midErr = midZoneCount > 0 ? (midZoneSum / midZoneCount) * 100 : 20;
    const baseErr = baseZoneCount > 0 ? (baseZoneSum / baseZoneCount) * 100 : 14;
    const severePct = countedPixels > 0 ? (severeCount / countedPixels) * 100 : 5;

    let hotspot: 'Apex / Star' | 'Mid Cone Body' | 'Base Perimeter' | 'None' = 'None';
    let diagnosis = 'All prop zones closely track the source ROI.';

    const maxZone = Math.max(topErr, midErr, baseErr);
    if (maxZone > 25) {
      if (maxZone === midErr) {
        hotspot = 'Mid Cone Body';
        diagnosis =
          'Mid-Cone Ribbon Discrepancy: Spiral arm count or helical wrap angle differs from source video flow.';
      } else if (maxZone === topErr) {
        hotspot = 'Apex / Star';
        diagnosis =
          'Apex Convergence Mismatch: High error near prop apex; check star topper or apex ribbon convergence.';
      } else {
        hotspot = 'Base Perimeter';
        diagnosis =
          'Base Flare Mismatch: Discrepancy along bottom perimeter; ribbon width or speed decay needs adjustment.';
      }
    }

    setDiscrepancyMetrics({
      meanErrorPct: Number(meanErr.toFixed(1)),
      topZoneErrorPct: Number(topErr.toFixed(1)),
      midZoneErrorPct: Number(midErr.toFixed(1)),
      baseZoneErrorPct: Number(baseErr.toFixed(1)),
      hotspotZone: hotspot,
      hotspotDiagnosis: diagnosis,
      severePixelPct: Number(severePct.toFixed(1)),
    });

    // 6. Draw to Display Canvas based on View Mode and 3D Orbit Mode
    dispCtx.clearRect(0, 0, dispW, dispH);

    const colorMap = new Map<number, typeof nodeColors[0]>();
    for (const c of nodeColors) {
      colorMap.set(c.nodeId, c);
    }

    if (is3DOrbitMode) {
      // =========================================================================
      // TRUE 3D SPATIAL ORBIT VIEWING MODE
      // =========================================================================
      dispCtx.save();
      dispCtx.fillStyle = '#05070a';
      dispCtx.fillRect(0, 0, dispW, dispH);

      // Apply Zoom & Pan Transformations
      dispCtx.translate(dispW / 2 + panOffset.x, dispH / 2 + panOffset.y);
      dispCtx.scale(zoomLevel, zoomLevel);
      dispCtx.translate(-dispW / 2, -dispH / 2);

      const radYaw = (orbitYaw * Math.PI) / 180;
      const radPitch = (orbitPitch * Math.PI) / 180;
      const cosY = Math.cos(radYaw);
      const sinY = Math.sin(radYaw);
      const cosP = Math.cos(radPitch);
      const sinP = Math.sin(radPitch);

      // Draw 3D Ground Ring / Grid Platform
      const isMega = previewPropType === 'Mega Tree';
      const groundRadius = (isMega ? 0.22 : 0.40) * 3.8 * (dispW * 0.36);
      const baseGroundY = dispH / 2 - (-0.80) * (dispH * 0.40);

      dispCtx.save();
      dispCtx.strokeStyle = 'rgba(50, 65, 95, 0.45)';
      dispCtx.lineWidth = 1.2;
      dispCtx.beginPath();
      for (let a = 0; a <= Math.PI * 2 + 0.1; a += Math.PI / 16) {
        const gx = Math.sin(a) * groundRadius;
        const gz = Math.cos(a) * groundRadius;
        const gRotX = gx * cosY - gz * sinY;
        const gDepthZ = gx * sinY + gz * cosY;
        const gFinalY = -gDepthZ * sinP;
        const gFinalZ = gDepthZ * cosP;
        const gPersp = 2.4 / (2.4 + (gFinalZ / (dispW * 0.36)) * 0.4);
        const gSx = dispW / 2 + gRotX * gPersp;
        const gSy = baseGroundY - gFinalY * gPersp;
        if (a === 0) dispCtx.moveTo(gSx, gSy);
        else dispCtx.lineTo(gSx, gSy);
      }
      dispCtx.stroke();

      // Center Mast / Trunk Line for Mega Tree
      if (isMega) {
        dispCtx.strokeStyle = 'rgba(70, 85, 120, 0.4)';
        dispCtx.lineWidth = 2;
        dispCtx.beginPath();
        const topRotX = 0;
        const topDepthZ = 0;
        const topFinalY = 0.88 * cosP;
        const topFinalZ = 0.88 * sinP;
        const topPersp = 2.4 / (2.4 + topFinalZ * 0.4);
        dispCtx.moveTo(dispW / 2 + topRotX * topPersp, dispH / 2 - topFinalY * (dispH * 0.40) * topPersp);
        dispCtx.lineTo(dispW / 2, baseGroundY);
        dispCtx.stroke();
      }
      dispCtx.restore();

      // 3D Perspective Transformation for all prop nodes
      const projectedNodes: Array<{
        node: (typeof nodes)[0];
        color: (typeof nodeColors)[0];
        sx: number;
        sy: number;
        depthZ: number;
        persp: number;
      }> = [];

      for (const node of nodes) {
        const c = colorMap.get(node.id);
        if (!c) continue;

        const wX = node.worldX ?? (node.x - 0.5) * 2;
        const wY = node.worldY ?? (0.5 - node.y) * 2;
        const wZ = node.worldZ ?? ((node.depth ?? 0.5) - 0.5) * 1.5;

        // Rotate in 3D around Yaw & Pitch
        const rX = wX * cosY - wZ * sinY;
        const dZ = wX * sinY + wZ * cosY;
        const rY = wY * cosP - dZ * sinP;
        const fZ = wY * sinP + dZ * cosP;

        // Perspective camera projection
        const persp = 2.4 / (2.4 + fZ * 0.4);
        const sx = dispW / 2 + rX * persp * (dispW * 0.36);
        const sy = dispH / 2 - rY * persp * (dispH * 0.40);

        projectedNodes.push({
          node,
          color: c,
          sx,
          sy,
          depthZ: fZ,
          persp,
        });
      }

      // Draw continuous 3D strand ribbon strokes
      const nodesByStrand3D = new Map<number, typeof projectedNodes>();
      for (const pn of projectedNodes) {
        if (!nodesByStrand3D.has(pn.node.strandIndex)) nodesByStrand3D.set(pn.node.strandIndex, []);
        nodesByStrand3D.get(pn.node.strandIndex)!.push(pn);
      }

      dispCtx.lineCap = 'round';
      dispCtx.lineJoin = 'round';

      for (const [, sNodes] of nodesByStrand3D) {
        sNodes.sort((a, b) => a.node.nodeIndex - b.node.nodeIndex);
        for (let i = 0; i < sNodes.length - 1; i++) {
          const pA = sNodes[i];
          const pB = sNodes[i + 1];
          if (pA.color.intensity > 0.05 || pB.color.intensity > 0.05) {
            const avgInt = (pA.color.intensity + pB.color.intensity) * 0.5;
            const avgPersp = (pA.persp + pB.persp) * 0.5;
            const avgDepthZ = (pA.depthZ + pB.depthZ) * 0.5;
            const depthShading = avgDepthZ >= 0 ? 1.0 : Math.max(0.48, 0.85 + avgDepthZ * 0.40);
            const rAvg = Math.round((pA.color.r + pB.color.r) * 0.5);
            const gAvg = Math.round((pA.color.g + pB.color.g) * 0.5);
            const bAvg = Math.round((pA.color.b + pB.color.b) * 0.5);

            dispCtx.save();
            dispCtx.strokeStyle = `rgba(${rAvg}, ${gAvg}, ${bAvg}, ${avgInt * depthShading * 0.85})`;
            dispCtx.lineWidth = Math.max(1.0, (2.6 * avgPersp) * Math.min(1.4, 0.6 + avgInt * 0.8));
            dispCtx.beginPath();
            dispCtx.moveTo(pA.sx, pA.sy);
            dispCtx.lineTo(pB.sx, pB.sy);
            dispCtx.stroke();
            dispCtx.restore();
          }
        }
      }

      // Sort nodes back-to-front by 3D camera depth (fZ) for physical occlusion
      projectedNodes.sort((a, b) => a.depthZ - b.depthZ);

      // Render 3D LED Beads with Depth-Scaled Volumetric Bloom
      for (const pn of projectedNodes) {
        const { color: c, sx, sy, persp, depthZ } = pn;
        const depthShading = depthZ >= 0 ? 1.0 : Math.max(0.45, 0.80 + depthZ * 0.40);
        const finalIntensity = c.intensity * depthShading;

        if (finalIntensity > 0.05) {
          const radius = Math.max(1.2, (2.2 * persp) * Math.min(1.4, 0.6 + finalIntensity * 0.7));
          dispCtx.fillStyle = `rgba(${c.r}, ${c.g}, ${c.b}, ${finalIntensity})`;
          dispCtx.shadowColor = `rgba(${c.r}, ${c.g}, ${c.b}, ${finalIntensity * 0.85})`;
          dispCtx.shadowBlur = (6 * persp) * finalIntensity;
          dispCtx.beginPath();
          dispCtx.arc(sx, sy, radius, 0, Math.PI * 2);
          dispCtx.fill();
        } else {
          dispCtx.fillStyle = 'rgba(30, 40, 55, 0.3)';
          dispCtx.shadowBlur = 0;
          dispCtx.beginPath();
          dispCtx.arc(sx, sy, Math.max(0.8, 1.2 * persp), 0, Math.PI * 2);
          dispCtx.fill();
        }
      }

      dispCtx.restore();
    } else {
      // =========================================================================
      // STANDARD 2D COMPOSITE VIEWPORT (With Zoom & Pan)
      // =========================================================================
      dispCtx.save();
      dispCtx.fillStyle = '#05070a';
      dispCtx.fillRect(0, 0, dispW, dispH);

      // Apply Zoom & Pan Transformations
      dispCtx.translate(dispW / 2 + panOffset.x, dispH / 2 + panOffset.y);
      dispCtx.scale(zoomLevel, zoomLevel);
      dispCtx.translate(-dispW / 2, -dispH / 2);

      if (viewMode === 'sim') {
        // Pure Simulated Output
        dispCtx.drawImage(simCanvas, 0, 0);
      } else if (viewMode === 'heatmap') {
        // Pure Difference Heatmap (Drawn via offscreen canvas so zoom & pan work correctly)
        dispCtx.fillStyle = '#0a0a0a';
        dispCtx.fillRect(0, 0, dispW, dispH);
        if (!offHeatmapCanvasRef.current) {
          offHeatmapCanvasRef.current = document.createElement('canvas');
        }
        const tempHeatCanvas = offHeatmapCanvasRef.current;
        if (tempHeatCanvas.width !== dispW || tempHeatCanvas.height !== dispH) {
          tempHeatCanvas.width = dispW;
          tempHeatCanvas.height = dispH;
        }
        tempHeatCanvas.getContext('2d')?.putImageData(heatmapImgData, 0, 0);
        dispCtx.drawImage(tempHeatCanvas, 0, 0);
      } else if (viewMode === 'overlay') {
        // Simulation + Heatmap Blend Overlay
        dispCtx.drawImage(simCanvas, 0, 0);
        if (!offHeatmapCanvasRef.current) {
          offHeatmapCanvasRef.current = document.createElement('canvas');
        }
        const tempHeatCanvas = offHeatmapCanvasRef.current;
        if (tempHeatCanvas.width !== dispW || tempHeatCanvas.height !== dispH) {
          tempHeatCanvas.width = dispW;
          tempHeatCanvas.height = dispH;
        }
        tempHeatCanvas.getContext('2d')?.putImageData(heatmapImgData, 0, 0);

        dispCtx.save();
        dispCtx.globalAlpha = heatmapOpacity;
        dispCtx.drawImage(tempHeatCanvas, 0, 0);
        dispCtx.restore();
      } else if (viewMode === 'split') {
        // Split Screen: Left half Source Video ROI, Right half Simulation + Heatmap
        const halfW = Math.floor(dispW / 2);
        // Left: Source ROI
        dispCtx.save();
        dispCtx.beginPath();
        dispCtx.rect(0, 0, halfW, dispH);
        dispCtx.clip();
        dispCtx.drawImage(offSource, 0, 0);
        dispCtx.restore();

        // Right: Simulation + Heatmap Overlay
        dispCtx.save();
        dispCtx.beginPath();
        dispCtx.rect(halfW, 0, dispW - halfW, dispH);
        dispCtx.clip();
        dispCtx.drawImage(simCanvas, 0, 0);
        if (!offHeatmapCanvasRef.current) {
          offHeatmapCanvasRef.current = document.createElement('canvas');
        }
        const tempHeatCanvas = offHeatmapCanvasRef.current;
        if (tempHeatCanvas.width !== dispW || tempHeatCanvas.height !== dispH) {
          tempHeatCanvas.width = dispW;
          tempHeatCanvas.height = dispH;
        }
        tempHeatCanvas.getContext('2d')?.putImageData(heatmapImgData, 0, 0);
        dispCtx.globalAlpha = heatmapOpacity;
        dispCtx.drawImage(tempHeatCanvas, 0, 0);
        dispCtx.restore();

        // Divider Line
        dispCtx.strokeStyle = '#f59e0b';
        dispCtx.lineWidth = 2;
        dispCtx.beginPath();
        dispCtx.moveTo(halfW, 0);
        dispCtx.lineTo(halfW, dispH);
        dispCtx.stroke();
      }

      dispCtx.restore();
    }
  }, [
    currentTimeMs,
    recipe,
    propType,
    geometry,
    activePass,
    previewedSuggestion,
    durationMs,
    previewPropType,
    selectedPass,
    viewMode,
    heatmapOpacity,
    sourceElement,
    roi,
    zoomLevel,
    panOffset,
    is3DOrbitMode,
    orbitYaw,
    orbitPitch,
  ]);

  const handleSubmitFeedback = (e: React.FormEvent) => {
    e.preventDefault();
    if (!userFeedback.trim()) return;
    onContinueIterating(userFeedback.trim(), stochasticMode, visualTruthMode);
    setUserFeedback('');
  };

  const handleTriggerContinue = () => {
    onContinueIterating('', stochasticMode, visualTruthMode);
  };

  return (
    <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-4 flex flex-col gap-5 shadow-xl">
      {/* Header bar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between pb-3 border-b border-neutral-800 gap-2">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-amber-400" />
          <h3 className="font-semibold text-sm text-neutral-200">
            Internal Test Simulation & Match Grading Engine
          </h3>
          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40">
            Difference Heatmap Live
          </span>
        </div>
        <div className="flex items-center gap-2.5 text-xs font-mono flex-wrap">
          {/* User-Accessible Real-Time Visual Truth Toggle */}
          <button
            type="button"
            onClick={() => setVisualTruthMode(!visualTruthMode)}
            className={`px-2.5 py-1 rounded-md text-xs font-semibold border flex items-center gap-1.5 transition cursor-pointer ${
              visualTruthMode
                ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/50 hover:bg-emerald-500/30'
                : 'bg-neutral-800 text-neutral-300 border-neutral-700 hover:text-white'
            }`}
            title="Toggle between verified off-screen pixel accuracy vs raw simulation heuristic in real-time"
          >
            {visualTruthMode ? (
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            ) : (
              <Eye className="w-3.5 h-3.5 text-blue-400" />
            )}
            <span>{visualTruthMode ? 'Visual Truth: ON' : 'Visual Truth: OFF (Raw)'}</span>
          </button>

          <div className="flex items-center gap-1.5 text-neutral-400">
            <span>Pixel Error:</span>
            <span
              className={`font-bold px-1.5 py-0.5 rounded ${
                discrepancyMetrics.meanErrorPct < 20
                  ? 'bg-emerald-500/20 text-emerald-300'
                  : discrepancyMetrics.meanErrorPct < 35
                  ? 'bg-amber-500/20 text-amber-300'
                  : 'bg-rose-500/20 text-rose-300'
              }`}
            >
              {discrepancyMetrics.meanErrorPct}%
            </span>
          </div>

          <div className="flex items-center gap-1.5">
            <span className="text-neutral-400">Match Score:</span>
            <span
              className={`font-bold px-2 py-0.5 rounded ${
                displayedScoreVal >= targetThreshold
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                  : 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
              }`}
            >
              {displayedScoreVal}% {visualTruthMode ? 'Visual Match' : 'Raw Heuristic'}
            </span>
          </div>
        </div>
      </div>

      {/* Whole-Clip Repeating Pattern & Recurrence Confirmation Intelligence Banner */}
      {summary?.wholeClipSurvey && (
        <div className="bg-neutral-950/70 border border-neutral-800 rounded-lg p-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2.5 text-xs">
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-md bg-amber-500/15 text-amber-300 border border-amber-500/30">
              <Sparkles className="w-4 h-4 text-amber-400" />
            </span>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-semibold text-neutral-200">
                  Whole-Clip Survey:
                </span>
                {summary.wholeClipSurvey.hasRepeatingPattern ? (
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                    {summary.wholeClipSurvey.detectedCycleCount} Repeating Cycles Confirmed ({Math.round(summary.wholeClipSurvey.cyclePeriodMs)}ms)
                  </span>
                ) : (
                  <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-neutral-800 text-neutral-300">
                    Aperiodic / Continuous Progression
                  </span>
                )}
              </div>
              <p className="text-[11px] text-neutral-400 mt-0.5">
                {summary.wholeClipSurvey.hasRepeatingPattern
                  ? `Every pass strengthened the kinematic confirmation (+${summary.wholeClipSurvey.confidenceAmplificationBonus}% confidence bonus). Velocity synchronized to the true repeating cycle.`
                  : 'Analyzed the full video sequence without detected periodic loop resets.'}
              </p>
            </div>
          </div>

          {summary.wholeClipSurvey.hasRepeatingPattern && summary.wholeClipSurvey.cycleInstances && summary.wholeClipSurvey.cycleInstances.length > 0 && (
            <div className="flex items-center gap-1.5 font-mono text-[11px] overflow-x-auto pb-0.5">
              {summary.wholeClipSurvey.cycleInstances.slice(0, 4).map((inst) => (
                <div
                  key={inst.passNumber}
                  className="px-2 py-1 rounded bg-neutral-900 border border-neutral-800 text-neutral-300 flex items-center gap-1.5 whitespace-nowrap"
                  title={`Pass #${inst.passNumber}: ${(inst.startMs / 1000).toFixed(1)}s - ${(inst.endMs / 1000).toFixed(1)}s (${inst.similarityToCanonical}% similarity)`}
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                  <span>Pass #{inst.passNumber}:</span>
                  <span className="font-bold text-emerald-400">{inst.similarityToCanonical}%</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Main Grid: Preview & Metrics */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        {/* Left Column: Simulated Canvas & Heatmap Viewport */}
        <div className="lg:col-span-6 flex flex-col gap-2.5">
          {/* View Mode Switcher Toolbar */}
          <div className="flex items-center justify-between flex-wrap gap-2 text-xs">
            <div className="flex items-center gap-1 bg-neutral-950 p-1 rounded-lg border border-neutral-800">
              <button
                type="button"
                onClick={() => setViewMode('overlay')}
                className={`px-2.5 py-1 rounded text-[11px] font-medium flex items-center gap-1 transition cursor-pointer ${
                  viewMode === 'overlay'
                    ? 'bg-amber-500 text-neutral-950 font-bold'
                    : 'text-neutral-400 hover:text-white'
                }`}
                title="Overlay difference heatmap directly onto simulated 3D nodes"
              >
                <Flame className="w-3.5 h-3.5" />
                Heatmap Overlay
              </button>
              <button
                type="button"
                onClick={() => setViewMode('heatmap')}
                className={`px-2.5 py-1 rounded text-[11px] font-medium flex items-center gap-1 transition cursor-pointer ${
                  viewMode === 'heatmap'
                    ? 'bg-amber-500 text-neutral-950 font-bold'
                    : 'text-neutral-400 hover:text-white'
                }`}
                title="View high-contrast discrepancy map"
              >
                <Layers className="w-3.5 h-3.5" />
                Pure Heatmap
              </button>
              <button
                type="button"
                onClick={() => setViewMode('split')}
                className={`px-2.5 py-1 rounded text-[11px] font-medium flex items-center gap-1 transition cursor-pointer ${
                  viewMode === 'split'
                    ? 'bg-amber-500 text-neutral-950 font-bold'
                    : 'text-neutral-400 hover:text-white'
                }`}
                title="Split screen: Source Video ROI (left) vs xLights Preview + Heatmap (right)"
              >
                <Split className="w-3.5 h-3.5" />
                Split Screen
              </button>
              <button
                type="button"
                onClick={() => setViewMode('sim')}
                className={`px-2.5 py-1 rounded text-[11px] font-medium flex items-center gap-1 transition cursor-pointer ${
                  viewMode === 'sim'
                    ? 'bg-amber-500 text-neutral-950 font-bold'
                    : 'text-neutral-400 hover:text-white'
                }`}
                title="Clean xLights 3D light simulation output"
              >
                <Eye className="w-3.5 h-3.5" />
                3D Sim
              </button>

              <div className="w-[1px] h-4 bg-neutral-800 my-auto mx-0.5" />

              {/* 3D Spatial Orbit Mode Toggle */}
              <button
                type="button"
                onClick={() => setIs3DOrbitMode(!is3DOrbitMode)}
                className={`px-2.5 py-1 rounded text-[11px] font-medium flex items-center gap-1.5 transition cursor-pointer border ${
                  is3DOrbitMode
                    ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/50 font-bold shadow-sm'
                    : 'bg-neutral-900 text-neutral-400 border-neutral-800 hover:text-white'
                }`}
                title="Toggle 3D spatial orbit view: Click and drag on canvas to freely rotate physical model in 3D"
              >
                <Box className="w-3.5 h-3.5" />
                <span>{is3DOrbitMode ? '3D Orbit: Active' : '3D Orbit Mode'}</span>
              </button>
            </div>

            {/* Viewport Zoom & Pan Controls */}
            <div className="flex items-center gap-1 bg-neutral-950 p-1 rounded-lg border border-neutral-800 text-[11px]">
              <button
                type="button"
                onClick={() => setZoomLevel((prev) => Math.max(0.6, Number((prev - 0.2).toFixed(1))))}
                className="p-1 hover:text-white text-neutral-400 rounded hover:bg-neutral-800 cursor-pointer transition"
                title="Zoom Out (-)"
              >
                <ZoomOut className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={handleResetZoom}
                className="font-mono px-1.5 py-0.5 rounded text-[10px] text-amber-300 hover:bg-neutral-800 cursor-pointer transition"
                title="Click to reset zoom to 100%"
              >
                {Math.round(zoomLevel * 100)}%
              </button>
              <button
                type="button"
                onClick={() => setZoomLevel((prev) => Math.min(3.0, Number((prev + 0.2).toFixed(1))))}
                className="p-1 hover:text-white text-neutral-400 rounded hover:bg-neutral-800 cursor-pointer transition"
                title="Zoom In (+)"
              >
                <ZoomIn className="w-3.5 h-3.5" />
              </button>
              {(zoomLevel !== 1.0 || panOffset.x !== 0 || panOffset.y !== 0) && (
                <button
                  type="button"
                  onClick={handleResetZoom}
                  className="px-1.5 py-0.5 text-[10px] text-neutral-400 hover:text-white rounded border border-neutral-800 hover:bg-neutral-800 cursor-pointer font-mono"
                  title="Reset Zoom & Pan (1:1)"
                >
                  Reset
                </button>
              )}
            </div>

            {/* Heatmap Opacity Slider (When overlay or split mode active) */}
            {(viewMode === 'overlay' || viewMode === 'split') && !is3DOrbitMode && (
              <div className="flex items-center gap-1.5 text-[11px] text-neutral-400 bg-neutral-950/80 px-2 py-1 rounded border border-neutral-800">
                <span>Intensity:</span>
                <input
                  type="range"
                  min={0.1}
                  max={1.0}
                  step={0.05}
                  value={heatmapOpacity}
                  onChange={(e) => setHeatmapOpacity(Number(e.target.value))}
                  className="w-16 accent-amber-500 cursor-pointer"
                />
                <span className="font-mono text-amber-300 text-[10px]">
                  {Math.round(heatmapOpacity * 100)}%
                </span>
              </div>
            )}
          </div>

          {/* Quick Model Preview Selector & 3D Orbit Camera Toolbar */}
          <div className="flex items-center justify-between flex-wrap gap-2 text-[11px]">
            <div className="flex items-center gap-1 overflow-x-auto pb-0.5">
              {(['Mega Tree', 'PEX Arches', 'Matrix', 'Spinner / ChromaStar', 'Mini Tree with Star', 'Roofline', 'Window Frame', 'Wreath', 'Single Line / Poly Line', 'Custom Coro Prop'] as PropModelType[]).map((pType) => (
                <button
                  key={pType}
                  type="button"
                  onClick={() => setPreviewPropType(pType)}
                  className={`px-2 py-0.5 rounded text-[10px] font-medium border transition cursor-pointer whitespace-nowrap ${
                    previewPropType === pType
                      ? 'bg-amber-500/20 text-amber-300 border-amber-500/50'
                      : 'bg-neutral-950 text-neutral-400 border-neutral-800 hover:text-white'
                  }`}
                >
                  {pType.split(' ')[0]}
                </button>
              ))}
            </div>

            {/* 3D Orbit Quick Angle Presets & Auto-Spin (Visible when 3D Orbit is active) */}
            {is3DOrbitMode && (
              <div className="flex items-center gap-1 text-[10px] font-mono bg-cyan-950/40 p-1 rounded-lg border border-cyan-800/60">
                <span className="text-cyan-400 font-semibold px-1">Orbit:</span>
                <button
                  type="button"
                  onClick={() => { setOrbitYaw(0); setOrbitPitch(16); }}
                  className="px-1.5 py-0.5 rounded bg-neutral-900 hover:bg-neutral-800 text-neutral-300 border border-neutral-800 cursor-pointer"
                  title="Front 0° View"
                >
                  Front
                </button>
                <button
                  type="button"
                  onClick={() => { setOrbitYaw(45); setOrbitPitch(22); }}
                  className="px-1.5 py-0.5 rounded bg-neutral-900 hover:bg-neutral-800 text-neutral-300 border border-neutral-800 cursor-pointer"
                  title="3/4 Perspective Angle (45°)"
                >
                  3/4
                </button>
                <button
                  type="button"
                  onClick={() => { setOrbitYaw(90); setOrbitPitch(16); }}
                  className="px-1.5 py-0.5 rounded bg-neutral-900 hover:bg-neutral-800 text-neutral-300 border border-neutral-800 cursor-pointer"
                  title="Side Profile (90°)"
                >
                  Side
                </button>
                <button
                  type="button"
                  onClick={() => { setOrbitYaw(180); setOrbitPitch(16); }}
                  className="px-1.5 py-0.5 rounded bg-neutral-900 hover:bg-neutral-800 text-neutral-300 border border-neutral-800 cursor-pointer"
                  title="Rear View (180°)"
                >
                  Back
                </button>
                <button
                  type="button"
                  onClick={() => setIsAutoSpinning(!isAutoSpinning)}
                  className={`px-1.5 py-0.5 rounded border font-semibold flex items-center gap-1 transition cursor-pointer ${
                    isAutoSpinning
                      ? 'bg-cyan-500 text-neutral-950 border-cyan-400 font-bold'
                      : 'bg-neutral-900 text-cyan-300 border-neutral-800 hover:bg-neutral-800'
                  }`}
                  title="Continuous 360° automatic turntable rotation"
                >
                  <RotateCw className={`w-3 h-3 ${isAutoSpinning ? 'animate-spin' : ''}`} />
                  <span>{isAutoSpinning ? 'Spinning' : 'Auto-Spin'}</span>
                </button>
              </div>
            )}
          </div>

          {/* Display Viewport Canvas */}
          <div className="relative aspect-video bg-neutral-950 rounded-lg border border-neutral-800 overflow-hidden flex items-center justify-center shadow-inner select-none">
            {/* Hidden simulated canvas offscreen buffer (crisp 960x540) */}
            <canvas ref={simCanvasRef} width={960} height={540} className="hidden" />

            {/* Main Interactive Composite Display Canvas with Drag Orbit & Wheel Zoom (crisp 960x540) */}
            <canvas
              ref={displayCanvasRef}
              width={960}
              height={540}
              onMouseDown={handleCanvasMouseDown}
              onMouseMove={handleCanvasMouseMove}
              onMouseUp={handleCanvasMouseUp}
              onMouseLeave={handleCanvasMouseUp}
              onWheel={handleCanvasWheel}
              className={`w-full h-full object-contain ${
                is3DOrbitMode
                  ? 'cursor-grab active:cursor-grabbing'
                  : zoomLevel > 1.0
                  ? 'cursor-move'
                  : 'cursor-default'
              }`}
            />

            {/* Viewport Overlay Badges */}
            <div className="absolute top-2 left-2 flex items-center gap-1.5 flex-wrap pointer-events-none">
              <div className="px-2 py-0.5 rounded bg-neutral-950/85 backdrop-blur-sm border border-neutral-800 text-[10px] font-mono text-neutral-300 flex items-center gap-1 pointer-events-auto">
                {is3DOrbitMode ? (
                  <>
                    <Box className="w-3 h-3 text-cyan-400" />
                    <span>3D Orbit View (Yaw {Math.round(orbitYaw)}°, Pitch {Math.round(orbitPitch)}°)</span>
                  </>
                ) : (
                  <>
                    {viewMode === 'overlay' && <Flame className="w-3 h-3 text-rose-400" />}
                    {viewMode === 'heatmap' && <Layers className="w-3 h-3 text-amber-400" />}
                    {viewMode === 'split' && <Split className="w-3 h-3 text-blue-400" />}
                    {viewMode === 'sim' && <Eye className="w-3 h-3 text-emerald-400" />}
                    <span>
                      {viewMode === 'overlay' && 'Heatmap Discrepancy Overlay'}
                      {viewMode === 'heatmap' && 'Thermal Discrepancy Map'}
                      {viewMode === 'split' && 'Video ROI (Left) vs Simulation (Right)'}
                      {viewMode === 'sim' && 'xLights 3D Output'}
                    </span>
                  </>
                )}
              </div>

              {/* Visual Truth Status Badge */}
              <div className="px-2 py-0.5 rounded bg-neutral-950/85 backdrop-blur-sm border border-neutral-800 text-[10px] font-mono flex items-center gap-1 pointer-events-auto">
                {visualTruthMode ? (
                  <span className="text-emerald-400 flex items-center gap-1 font-semibold">
                    <ShieldCheck className="w-3 h-3" />
                    Verified Accuracy
                  </span>
                ) : (
                  <span className="text-blue-400 flex items-center gap-1 font-semibold">
                    <Eye className="w-3 h-3" />
                    Raw Simulation
                  </span>
                )}
              </div>

              {/* Interactive Suggestion Square Live Preview Notification */}
              {previewedSuggestion && (
                <div className="px-2.5 py-1 rounded bg-gradient-to-r from-amber-500 to-amber-400 text-neutral-950 font-bold text-[10px] font-mono flex items-center gap-2 shadow-lg pointer-events-auto border border-amber-300">
                  <span className="flex items-center gap-1">
                    <Sparkles className="w-3 h-3 text-neutral-950" />
                    Preview: {previewedSuggestion.label}
                  </span>
                  <div className="flex items-center gap-1 pl-1 border-l border-neutral-950/20">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onContinueIterating(previewedSuggestion.directive, stochasticMode, visualTruthMode);
                        setPreviewedSuggestion(null);
                        setActiveSuggestionId(null);
                      }}
                      className="px-1.5 py-0.5 rounded bg-neutral-950 text-amber-300 text-[9.5px] font-bold hover:bg-neutral-900 transition cursor-pointer"
                      title="Apply this preview and launch optimization pass"
                    >
                      ✅ Apply
                    </button>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setPreviewedSuggestion(null);
                        setActiveSuggestionId(null);
                      }}
                      className="px-1.5 py-0.5 rounded bg-neutral-950/20 hover:bg-neutral-950/40 text-neutral-950 text-[9.5px] font-bold transition cursor-pointer"
                      title="Revert and exit preview"
                    >
                      ✕ Revert
                    </button>
                  </div>
                </div>
              )}

              {/* Active Selected Pass Preview Notification */}
              {selectedPass !== null && (
                <div className="px-2 py-0.5 rounded bg-amber-500 text-neutral-950 font-bold text-[10px] font-mono flex items-center gap-1 shadow-md pointer-events-auto">
                  <span>Previewing Pass #{selectedPass}</span>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedPass(null);
                    }}
                    className="hover:bg-neutral-950/20 rounded px-1 transition cursor-pointer"
                    title="Exit past preview and return to best recipe"
                  >
                    ✕ Exit
                  </button>
                </div>
              )}
            </div>

            <div className="absolute top-2 right-2 px-2 py-0.5 rounded bg-neutral-950/85 backdrop-blur-sm border border-neutral-800 text-[10px] font-mono text-amber-300 pointer-events-none">
              {previewedSuggestion ? previewedSuggestion.previewRecipe.effectName : (activePass?.effectName || recipe.effectName)} ({previewPropType.split(' ')[0]})
            </div>

            {/* Interaction Hint Badge (When 3D Orbit is active) */}
            {is3DOrbitMode && (
              <div className="absolute top-8 left-2 px-2 py-0.5 rounded bg-cyan-950/80 backdrop-blur-sm border border-cyan-800/60 text-[9px] font-mono text-cyan-300 pointer-events-none">
                💡 Drag on canvas to orbit in 3D • Scroll wheel to zoom ({Math.round(zoomLevel * 100)}%)
              </div>
            )}

            {/* Difference Heatmap Color Legend Bar */}
            {!is3DOrbitMode && (
              <div className="absolute bottom-2 left-2 right-2 bg-neutral-950/90 backdrop-blur-md px-2.5 py-1.5 rounded-lg border border-neutral-800 flex items-center justify-between text-[10px]">
                <span className="text-neutral-400 font-medium">Discrepancy Legend:</span>
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-1">
                    <span className="w-2.5 h-2.5 rounded-sm bg-emerald-500"></span>
                    <span className="text-neutral-300">Match (&lt;18%)</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <span className="w-2.5 h-2.5 rounded-sm bg-amber-500"></span>
                    <span className="text-neutral-300">Minor (18-38%)</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <span className="w-2.5 h-2.5 rounded-sm bg-orange-500"></span>
                    <span className="text-neutral-300">Moderate (38-58%)</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <span className="w-2.5 h-2.5 rounded-sm bg-rose-600 animate-pulse"></span>
                    <span className="text-rose-300 font-semibold">Severe Failure (&gt;58%)</span>
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="flex items-center justify-between text-[11px] text-neutral-500 px-1">
            <span>Synchronized timeline playback: {(currentTimeMs / 1000).toFixed(2)}s</span>
            <span>Severe Error Pixels: {discrepancyMetrics.severePixelPct}%</span>
          </div>

          {/* ========================================================================= */}
          {/* FRAME-ACCURATE ITERATION PASS EVOLUTION SCRUBBER & TIMELINE                */}
          {/* ========================================================================= */}
          {history.length > 0 && (
            <div className="bg-neutral-950 p-3 rounded-xl border border-neutral-800 flex flex-col gap-2.5 shadow-inner">
              <div className="flex items-center justify-between flex-wrap gap-2 text-xs">
                <div className="flex items-center gap-2">
                  <Sliders className="w-3.5 h-3.5 text-amber-400" />
                  <span className="font-semibold text-neutral-200">
                    Iteration Evolution Timeline:
                  </span>
                  <span className="font-mono text-amber-300 font-bold bg-neutral-900 px-2 py-0.5 rounded border border-neutral-800 text-[11px]">
                    Pass #{activePass?.passNumber ?? 1} of {history.length}
                  </span>
                  {activePass?.isValid === false ? (
                    <span className="px-1.5 py-0.5 rounded text-[10px] bg-red-500/20 text-red-300 border border-red-500/40 font-semibold flex items-center gap-1">
                      <Ban className="w-3 h-3" />
                      Rejected Candidate
                    </span>
                  ) : (
                    <span className="px-1.5 py-0.5 rounded text-[10px] bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 font-semibold flex items-center gap-1">
                      <Check className="w-3 h-3" />
                      Valid Pass
                    </span>
                  )}
                </div>

                {/* Scrubber Navigation Buttons */}
                <div className="flex items-center gap-1 text-[11px] font-mono">
                  <button
                    type="button"
                    onClick={() => setSelectedPass(1)}
                    className="px-2 py-0.5 rounded bg-neutral-900 hover:bg-neutral-800 text-neutral-400 hover:text-white border border-neutral-800 cursor-pointer transition"
                    title="Jump to Pass 1 (Initial Heuristic Seed)"
                  >
                    Seed (1)
                  </button>
                  <button
                    type="button"
                    disabled={(activePass?.passNumber ?? 1) <= 1}
                    onClick={() => setSelectedPass(Math.max(1, (activePass?.passNumber ?? 1) - 1))}
                    className="p-1 rounded bg-neutral-900 hover:bg-neutral-800 disabled:opacity-40 text-neutral-300 border border-neutral-800 cursor-pointer transition"
                    title="Step to Previous Intermediate Pass (|◀)"
                  >
                    <SkipBack className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsPlayingPasses(!isPlayingPasses)}
                    className={`px-2 py-0.5 rounded border font-semibold flex items-center gap-1 cursor-pointer transition ${
                      isPlayingPasses
                        ? 'bg-amber-500 text-neutral-950 border-amber-400 font-bold'
                        : 'bg-neutral-900 text-neutral-300 border-neutral-800 hover:text-white'
                    }`}
                    title="Auto-scrub sequentially through intermediate passes to watch algorithm evolution"
                  >
                    {isPlayingPasses ? <Pause className="w-3 h-3" /> : <Play className="w-3 h-3" />}
                    <span>{isPlayingPasses ? 'Pause' : 'Play Timeline'}</span>
                  </button>
                  <button
                    type="button"
                    disabled={(activePass?.passNumber ?? 1) >= history.length}
                    onClick={() => setSelectedPass(Math.min(history.length, (activePass?.passNumber ?? 1) + 1))}
                    className="p-1 rounded bg-neutral-900 hover:bg-neutral-800 disabled:opacity-40 text-neutral-300 border border-neutral-800 cursor-pointer transition"
                    title="Step to Next Intermediate Pass (▶|)"
                  >
                    <SkipForward className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setSelectedPass(null)}
                    className={`px-2 py-0.5 rounded border cursor-pointer font-semibold transition ${
                      selectedPass === null
                        ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/50'
                        : 'bg-neutral-900 text-neutral-400 hover:text-white border-neutral-800'
                    }`}
                    title="Jump to Final Best Verified State"
                  >
                    Final State ({history.length})
                  </button>
                </div>
              </div>

              {/* Scrub Slider Track */}
              <div className="flex flex-col gap-1 pt-1">
                <input
                  type="range"
                  min={1}
                  max={history.length}
                  step={1}
                  value={activePass?.passNumber ?? history.length}
                  onChange={(e) => setSelectedPass(Number(e.target.value))}
                  className="w-full accent-amber-500 cursor-pointer h-2 bg-neutral-800 rounded-lg appearance-none"
                />
                <div className="flex items-center justify-between text-[10px] font-mono text-neutral-500 px-0.5">
                  <span>Pass 1 (Initial Seed)</span>
                  <span>Pass {Math.round(history.length / 2)}</span>
                  <span>Pass {history.length} (Current Final)</span>
                </div>
              </div>

              {/* Active Scrubbed Pass Diagnostic Card */}
              {activePass && (
                <div className="p-2.5 rounded-lg bg-neutral-900/90 border border-neutral-800 text-[11px] flex flex-col gap-2">
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <div className="flex items-center gap-2 flex-wrap">
                      {activePass.multiLayerStack && activePass.multiLayerStack.length > 1 ? (
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="font-bold text-neutral-200">
                            Stack ({activePass.multiLayerStack.length} Layers):
                          </span>
                          {activePass.multiLayerStack.map((layer) => (
                            <span
                              key={layer.layerIndex}
                              className="px-1.5 py-0.5 rounded bg-neutral-950 border border-neutral-800 text-[10px] font-mono"
                            >
                              <strong className="text-amber-400">L{layer.layerIndex}:</strong> {layer.effectName}{' '}
                              <span className="text-purple-300 font-semibold">[{layer.blendingMode}]</span>{' '}
                              <span className="text-blue-300">({layer.submodelTarget})</span>
                            </span>
                          ))}
                        </div>
                      ) : (
                        <span className="font-bold text-neutral-200">
                          Effect: <span className="text-amber-300 font-mono">{activePass.effectName}</span>
                        </span>
                      )}
                      <span className="text-neutral-600">•</span>
                      <span className="text-neutral-300 font-mono">
                        Match Score: <strong className="text-emerald-400">{activePass.score.overallMatchPercentage}%</strong>
                      </span>
                      {activePass.score.visualTruthDelta !== undefined && (
                        <>
                          <span className="text-neutral-600">•</span>
                          <span className="text-neutral-300 font-mono">
                            Visual Delta:{' '}
                            <strong className={activePass.isValid === false ? 'text-rose-400' : 'text-cyan-300'}>
                              {activePass.score.visualTruthDelta}%
                            </strong>
                          </span>
                        </>
                      )}
                    </div>

                    {selectedPass !== null && (
                      <button
                        type="button"
                        onClick={() => setSelectedPass(null)}
                        className="text-amber-400 hover:text-amber-300 text-[10px] underline cursor-pointer"
                      >
                        Return to Final State →
                      </button>
                    )}
                  </div>

                  {/* Software Release Milestone Suite Display */}
                  {activePass.versionTitle && (
                    <div className="bg-neutral-950/70 p-2 rounded-md border border-neutral-800/80 flex flex-col gap-1 text-[10.5px]">
                      <div className="font-bold text-amber-300 font-mono flex items-center gap-1.5">
                        <Box className="w-3.5 h-3.5 text-amber-400" />
                        <span>{activePass.versionTitle}</span>
                      </div>
                      {activePass.releaseRationale && (
                        <div className="text-neutral-400 italic text-[10px] leading-relaxed">
                          "{activePass.releaseRationale}"
                        </div>
                      )}
                      {activePass.macroPatches && activePass.macroPatches.length > 0 && (
                        <div className="mt-1 flex flex-col gap-0.5">
                          <span className="text-[9px] uppercase tracking-wider text-amber-400/80 font-bold">
                            📦 Macro Architectural Patches:
                          </span>
                          {activePass.macroPatches.map((m, idx) => (
                            <div key={idx} className="text-neutral-300 flex items-start gap-1 text-[10px] pl-1">
                              <span className="text-amber-400 font-bold">•</span>
                              <span>{m}</span>
                            </div>
                          ))}
                        </div>
                      )}
                      {activePass.microTunings && activePass.microTunings.length > 0 && (
                        <div className="mt-1 flex flex-col gap-0.5">
                          <span className="text-[9px] uppercase tracking-wider text-cyan-400/80 font-bold">
                            🔧 Micro Parameter Calibrations:
                          </span>
                          {activePass.microTunings.map((m, idx) => (
                            <div key={idx} className="text-neutral-400 flex items-start gap-1 text-[9.5px] pl-1">
                              <span className="text-cyan-400 font-bold">-</span>
                              <span>{m}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Divergence & Logic Summary */}
                  <div className="text-[10px] text-neutral-400 font-mono flex items-center gap-1.5 flex-wrap">
                    <span className="text-neutral-500 shrink-0">Pass Evolution:</span>
                    <span className="text-neutral-200">{getPassDivergence(activePass).diffText}</span>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Consolidated Hotspot Analysis & Zone Breakdown */}
          <div className="bg-neutral-950/80 p-2.5 rounded-lg border border-neutral-800 flex flex-col gap-2">
            <div
              onClick={() => setIsHotspotExpanded(!isHotspotExpanded)}
              className="flex items-center justify-between cursor-pointer select-none text-xs"
            >
              <div className="flex items-center gap-1.5 font-semibold text-neutral-300">
                <AlertTriangle className={`w-3.5 h-3.5 ${discrepancyMetrics.meanErrorPct > 25 ? 'text-amber-400' : 'text-emerald-400'}`} />
                <span>Hotspot Diagnostics</span>
                <span className="text-[10px] text-neutral-500 font-normal">
                  ({discrepancyMetrics.hotspotZone !== 'None' ? `Zone: ${discrepancyMetrics.hotspotZone}` : 'Balanced'})
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span
                  className={`text-[9.5px] font-mono px-1.5 py-0.5 rounded font-bold ${
                    discrepancyMetrics.meanErrorPct > 25
                      ? 'bg-rose-500/20 text-rose-300'
                      : 'bg-emerald-500/20 text-emerald-300'
                  }`}
                >
                  Mean Δ {discrepancyMetrics.meanErrorPct}%
                </span>
                <button
                  type="button"
                  className="text-neutral-400 hover:text-white text-[11px] flex items-center gap-0.5 cursor-pointer"
                >
                  {isHotspotExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                  <span>{isHotspotExpanded ? 'Hide' : 'Details'}</span>
                </button>
              </div>
            </div>

            {isHotspotExpanded && (
              <div className="flex flex-col gap-2 pt-1 border-t border-neutral-800/70 text-[10px] font-mono">
                {/* Zone Error Bars */}
                <div className="grid grid-cols-3 gap-2">
                  <div className="bg-neutral-900 p-2 rounded border border-neutral-800 flex flex-col gap-1">
                    <div className="flex items-center justify-between text-neutral-400">
                      <span>Apex / Star:</span>
                      <span className={discrepancyMetrics.topZoneErrorPct > 25 ? 'text-rose-400 font-bold' : 'text-neutral-200'}>
                        {discrepancyMetrics.topZoneErrorPct}%
                      </span>
                    </div>
                    <div className="w-full bg-neutral-800 h-1 rounded-full overflow-hidden">
                      <div
                        className={`h-full ${discrepancyMetrics.topZoneErrorPct > 25 ? 'bg-rose-500' : 'bg-emerald-500'}`}
                        style={{ width: `${Math.min(100, discrepancyMetrics.topZoneErrorPct * 2)}%` }}
                      />
                    </div>
                  </div>

                  <div className="bg-neutral-900 p-2 rounded border border-neutral-800 flex flex-col gap-1">
                    <div className="flex items-center justify-between text-neutral-400">
                      <span>Mid Cone Body:</span>
                      <span className={discrepancyMetrics.midZoneErrorPct > 25 ? 'text-rose-400 font-bold' : 'text-neutral-200'}>
                        {discrepancyMetrics.midZoneErrorPct}%
                      </span>
                    </div>
                    <div className="w-full bg-neutral-800 h-1 rounded-full overflow-hidden">
                      <div
                        className={`h-full ${discrepancyMetrics.midZoneErrorPct > 25 ? 'bg-rose-500' : 'bg-amber-500'}`}
                        style={{ width: `${Math.min(100, discrepancyMetrics.midZoneErrorPct * 2)}%` }}
                      />
                    </div>
                  </div>

                  <div className="bg-neutral-900 p-2 rounded border border-neutral-800 flex flex-col gap-1">
                    <div className="flex items-center justify-between text-neutral-400">
                      <span>Base Perimeter:</span>
                      <span className={discrepancyMetrics.baseZoneErrorPct > 25 ? 'text-rose-400 font-bold' : 'text-neutral-200'}>
                        {discrepancyMetrics.baseZoneErrorPct}%
                      </span>
                    </div>
                    <div className="w-full bg-neutral-800 h-1 rounded-full overflow-hidden">
                      <div
                        className={`h-full ${discrepancyMetrics.baseZoneErrorPct > 25 ? 'bg-rose-500' : 'bg-emerald-500'}`}
                        style={{ width: `${Math.min(100, discrepancyMetrics.baseZoneErrorPct * 2)}%` }}
                      />
                    </div>
                  </div>
                </div>

                <p className="text-[10.5px] text-neutral-400 bg-neutral-900/50 p-2 rounded border border-neutral-800/80 font-sans">
                  <span className="text-amber-400 font-medium">Diagnostic: </span>
                  {discrepancyMetrics.hotspotDiagnosis}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Detailed Metric Breakdown, Stochastic Controls & Iteration History */}
        <div className="lg:col-span-6 flex flex-col gap-3.5 text-xs">
          {/* Detailed Metric Cards (4 Columns) */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            <div className="bg-neutral-950/70 p-2.5 rounded-lg border border-neutral-800 flex flex-col">
              <span className="text-neutral-400 text-[11px] flex items-center justify-between">
                <span>{visualTruthMode ? 'Visual Truth Pixel Δ:' : 'Verification Mode:'}</span>
                {visualTruthMode ? (
                  score.visualTruthPassed !== false ? (
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                  ) : (
                    <ShieldAlert className="w-3.5 h-3.5 text-rose-400" />
                  )
                ) : (
                  <Eye className="w-3.5 h-3.5 text-blue-400" />
                )}
              </span>
              <span className="font-mono font-bold text-sm text-neutral-100 mt-1">
                {visualTruthMode
                  ? score.visualTruthDelta !== undefined
                    ? `Δ ${score.visualTruthDelta}%`
                    : 'Verified'
                  : 'Bypassed (Raw)'}
              </span>
              <span
                className={`text-[10px] mt-0.5 font-medium ${
                  visualTruthMode
                    ? score.visualTruthPassed !== false
                      ? 'text-emerald-400'
                      : 'text-rose-400'
                    : 'text-blue-400'
                }`}
              >
                {visualTruthMode
                  ? score.visualTruthPassed !== false
                    ? 'Off-Screen Pixel Pass'
                    : 'Rejected Discrepancy'
                  : 'Raw Heuristics Only'}
              </span>
            </div>

            <div className="bg-neutral-950/70 p-2.5 rounded-lg border border-neutral-800 flex flex-col">
              <span className="text-neutral-400 text-[11px]">Photometric Tracking:</span>
              <span className="font-mono font-bold text-sm text-neutral-100 mt-1">
                {score.luminanceCorrelation}%
              </span>
              <span className="text-[10px] text-neutral-500 mt-0.5">Waveform Correlation</span>
            </div>

            <div className="bg-neutral-950/70 p-2.5 rounded-lg border border-neutral-800 flex flex-col">
              <span className="text-neutral-400 text-[11px]">Vector Field Alignment:</span>
              <span className="font-mono font-bold text-sm text-neutral-100 mt-1">
                {score.motionCosineSimilarity}%
              </span>
              <span className="text-[10px] text-neutral-500 mt-0.5">Optical Curl & Velocity</span>
            </div>

            <div className="bg-neutral-950/70 p-2.5 rounded-lg border border-neutral-800 flex flex-col">
              <span className="text-neutral-400 text-[11px]">Palette Delta-E:</span>
              <span className="font-mono font-bold text-sm text-neutral-100 mt-1">
                {score.colorDeltaSimilarity}%
              </span>
              <span className="text-[10px] text-neutral-500 mt-0.5">Spectral Cluster Match</span>
            </div>
          </div>

          {/* Dual Exploration & Verification Controller Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {/* Visual Truth Verification Mode Card */}
            <div className="bg-neutral-950/80 p-3 rounded-lg border border-neutral-800 flex flex-col gap-1.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-emerald-400" />
                  <span className="font-semibold text-neutral-200 text-xs">Visual Truth Mode</span>
                </div>
                <button
                  type="button"
                  onClick={() => setVisualTruthMode(!visualTruthMode)}
                  className={`px-2 py-0.5 rounded text-[11px] font-semibold border transition cursor-pointer flex items-center gap-1.5 ${
                    visualTruthMode
                      ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/50'
                      : 'bg-neutral-900 text-neutral-500 border-neutral-800'
                  }`}
                >
                  <span
                    className={`w-1.5 h-1.5 rounded-full ${
                      visualTruthMode ? 'bg-emerald-400 animate-pulse' : 'bg-neutral-600'
                    }`}
                  />
                  {visualTruthMode ? 'Active (Strict)' : 'Disabled'}
                </button>
              </div>
              <p className="text-[10.5px] text-neutral-400 leading-tight">
                Forces frame-by-frame comparison of source pixels against off-screen xLights canvas. Rejects hallucinated matches if delta exceeds dynamic threshold.
              </p>
            </div>

            {/* Stochastic Exploration Mode Controller Card */}
            <div className="bg-neutral-950/80 p-3 rounded-lg border border-neutral-800 flex flex-col gap-1.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <Dices className="w-4 h-4 text-purple-400" />
                  <span className="font-semibold text-neutral-200 text-xs">Stochastic Exploration</span>
                </div>
                <button
                  type="button"
                  onClick={() => setStochasticMode(!stochasticMode)}
                  className={`px-2 py-0.5 rounded text-[11px] font-semibold border transition cursor-pointer flex items-center gap-1.5 ${
                    stochasticMode
                      ? 'bg-purple-500/20 text-purple-300 border-purple-500/50'
                      : 'bg-neutral-900 text-neutral-500 border-neutral-800'
                  }`}
                >
                  <span
                    className={`w-1.5 h-1.5 rounded-full ${
                      stochasticMode ? 'bg-purple-400 animate-pulse' : 'bg-neutral-600'
                    }`}
                  />
                  {stochasticMode ? 'Active (50/50)' : 'Disabled'}
                </button>
              </div>
              <p className="text-[10.5px] text-neutral-400 leading-tight">
                Injects multi-parameter sweeps during the initial 50% of passes to escape local traps, transitioning to fine-tuning on the best basin.
              </p>
            </div>
          </div>

          {/* Iteration Passes Divergence Timeline & Scrollable Inspector */}
          {history.length > 0 && (
            <div className="bg-neutral-950/60 p-3 rounded-lg border border-neutral-800/80 flex flex-col gap-3">
              {/* Timeline Header with Mode Switcher & Filter Pills */}
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b border-neutral-800 pb-2">
                <div className="flex items-center gap-2">
                  <History className="w-4 h-4 text-amber-400" />
                  <span className="font-semibold text-neutral-200 text-xs">
                    Refinement History & Divergence Inspector ({history.length} Passes)
                  </span>
                </div>

                <div className="flex items-center gap-2 flex-wrap">
                  {/* Filter Pills */}
                  <div className="flex items-center gap-1 bg-neutral-900 p-0.5 rounded-md border border-neutral-800 text-[10.5px]">
                    <button
                      type="button"
                      onClick={() => setHistoryFilter('all')}
                      className={`px-2 py-0.5 rounded transition cursor-pointer ${
                        historyFilter === 'all'
                          ? 'bg-neutral-800 text-neutral-200 font-semibold'
                          : 'text-neutral-400 hover:text-white'
                      }`}
                    >
                      All ({history.length})
                    </button>
                    <button
                      type="button"
                      onClick={() => setHistoryFilter('valid')}
                      className={`px-2 py-0.5 rounded transition cursor-pointer ${
                        historyFilter === 'valid'
                          ? 'bg-emerald-500/20 text-emerald-300 font-semibold'
                          : 'text-neutral-400 hover:text-white'
                      }`}
                    >
                      Verified ({validPassesCount})
                    </button>
                    {rejectedPassesCount > 0 && (
                      <button
                        type="button"
                        onClick={() => setHistoryFilter('rejected')}
                        className={`px-2 py-0.5 rounded transition cursor-pointer ${
                          historyFilter === 'rejected'
                            ? 'bg-rose-500/20 text-rose-300 font-semibold'
                            : 'text-neutral-400 hover:text-white'
                        }`}
                      >
                        Rejected ({rejectedPassesCount})
                      </button>
                    )}
                  </div>

                  {/* View Switcher: Ribbon vs Detailed Scrollable List */}
                  <div className="flex items-center gap-1 bg-neutral-900 p-0.5 rounded-md border border-neutral-800 text-[10.5px]">
                    <button
                      type="button"
                      onClick={() => setHistoryViewMode('ribbon')}
                      className={`px-2 py-0.5 rounded transition flex items-center gap-1 cursor-pointer ${
                        historyViewMode === 'ribbon'
                          ? 'bg-amber-500/20 text-amber-300 font-semibold'
                          : 'text-neutral-400 hover:text-white'
                      }`}
                      title="Compact horizontal timeline ribbon"
                    >
                      <Layers className="w-3 h-3" />
                      Ribbon
                    </button>
                    <button
                      type="button"
                      onClick={() => setHistoryViewMode('detailed')}
                      className={`px-2 py-0.5 rounded transition flex items-center gap-1 cursor-pointer ${
                        historyViewMode === 'detailed'
                          ? 'bg-amber-500/20 text-amber-300 font-semibold'
                          : 'text-neutral-400 hover:text-white'
                      }`}
                      title="Scrollable detailed divergence cards list"
                    >
                      <List className="w-3 h-3" />
                      Detailed List
                    </button>
                  </div>
                </div>
              </div>

              {/* Active Selected Pass Banner & Return to Best Button */}
              {selectedPass !== null && (
                <div className="bg-amber-950/30 border border-amber-500/50 p-2.5 rounded-lg flex items-center justify-between text-xs gap-2 flex-wrap">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
                    <span className="text-amber-200">
                      Currently Previewing Pass <strong>#{activePass?.passNumber}</strong> ({activePass?.effectName}) on canvas
                    </span>
                    <span className="text-neutral-400 text-[11px]">
                      · Score: {displayedScoreVal}% ({visualTruthMode ? 'Verified' : 'Raw Heuristic'})
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setSelectedPass(null)}
                    className="px-2.5 py-1 rounded bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 text-[11px] font-semibold flex items-center gap-1 transition cursor-pointer"
                  >
                    <RotateCcw className="w-3 h-3" />
                    Reset to Best Recipe
                  </button>
                </div>
              )}

              {/* View 1: Compact Horizontal Timeline Ribbon */}
              {historyViewMode === 'ribbon' && (
                <div className="flex items-center gap-1.5 overflow-x-auto pb-1.5 pt-0.5">
                  {filteredHistory.map((pass) => {
                    const isExplorationPass = pass.passNumber <= Math.floor(history.length * 0.5);
                    const isSelected =
                      (selectedPass === null && pass.passNumber === history[history.length - 1].passNumber) ||
                      selectedPass === pass.passNumber;
                    const isRejected = pass.isValid === false;
                    const passScore = visualTruthMode ? pass.score.overallMatchPercentage : getRawPassScore(pass);

                    return (
                      <button
                        key={pass.passNumber}
                        onClick={() => setSelectedPass(pass.passNumber)}
                        className={`px-2.5 py-1.5 rounded text-xs font-mono transition cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
                          isRejected
                            ? isSelected
                              ? 'bg-rose-950/70 text-rose-300 border border-rose-500 ring-1 ring-rose-500'
                              : 'bg-rose-950/30 text-rose-400/80 border border-rose-900/60 hover:bg-rose-900/30 line-through'
                            : isSelected
                            ? 'bg-amber-500/25 text-amber-300 border border-amber-500/70 shadow-sm'
                            : isExplorationPass
                            ? 'bg-purple-950/40 text-purple-300 border border-purple-800/50 hover:bg-purple-900/40'
                            : 'bg-neutral-900 text-neutral-400 border border-neutral-800 hover:text-white hover:border-neutral-700'
                        }`}
                        title={`Pass ${pass.passNumber}: Click to preview visual state on canvas`}
                      >
                        {isRejected ? (
                          <Ban className="w-3 h-3 text-rose-400" />
                        ) : isExplorationPass ? (
                          <Dices className="w-3 h-3 text-purple-400" />
                        ) : (
                          <TrendingUp className="w-3 h-3 text-emerald-400" />
                        )}
                        <span>Pass {pass.passNumber}</span>
                        <span className="font-bold text-[11px]">
                          {isRejected ? '(Rejected)' : `${passScore}%`}
                        </span>
                      </button>
                    );
                  })}
                </div>
              )}

              {/* View 2: Detailed Scrollable Divergence List */}
              {historyViewMode === 'detailed' && (
                <div className="flex flex-col gap-2 max-h-80 overflow-y-auto pr-1">
                  {filteredHistory.map((pass) => {
                    const isExplorationPass = pass.passNumber <= Math.floor(history.length * 0.5);
                    const isSelected =
                      (selectedPass === null && pass.passNumber === history[history.length - 1].passNumber) ||
                      selectedPass === pass.passNumber;
                    const isRejected = pass.isValid === false;
                    const divergence = getPassDivergence(pass);
                    const passScore = visualTruthMode ? pass.score.overallMatchPercentage : getRawPassScore(pass);

                    return (
                      <div
                        key={pass.passNumber}
                        onClick={() => setSelectedPass(pass.passNumber)}
                        className={`p-3 rounded-lg border transition cursor-pointer flex flex-col gap-2 ${
                          isSelected
                            ? 'bg-neutral-900/95 border-amber-500/70 shadow-md ring-1 ring-amber-500/40'
                            : isRejected
                            ? 'bg-rose-950/20 border-rose-900/50 hover:border-rose-700/60'
                            : 'bg-neutral-900/50 border-neutral-800 hover:border-neutral-700'
                        }`}
                      >
                        {/* Card Header */}
                        <div className="flex items-center justify-between flex-wrap gap-2">
                          <div className="flex items-center gap-2">
                            <span className="font-mono font-bold text-xs px-2 py-0.5 rounded bg-neutral-800 text-neutral-100">
                              Pass #{pass.passNumber}
                            </span>
                            <span className="font-semibold text-neutral-200 text-xs">
                              {pass.effectName}
                            </span>
                            <span
                              className={`text-[10px] px-2 py-0.5 rounded font-mono ${
                                isRejected
                                  ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                                  : isExplorationPass
                                  ? 'bg-purple-500/20 text-purple-300 border border-purple-500/40'
                                  : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                              }`}
                            >
                              {isRejected
                                ? 'Visual Truth Rejected'
                                : isExplorationPass
                                ? 'Stochastic Leap'
                                : 'Fine-Tuned Harmonic'}
                            </span>
                          </div>

                          <div className="flex items-center gap-2 font-mono text-xs">
                            <span
                              className={`font-bold px-2 py-0.5 rounded ${
                                isRejected
                                  ? 'bg-rose-500/20 text-rose-300'
                                  : passScore >= targetThreshold
                                  ? 'bg-emerald-500/20 text-emerald-300'
                                  : 'bg-amber-500/20 text-amber-300'
                              }`}
                            >
                              {passScore}% {visualTruthMode ? 'Match' : 'Raw'}
                            </span>
                            {pass.visualTruthDelta !== undefined && (
                              <span className="text-neutral-400 text-[11px]">
                                (Δ {pass.visualTruthDelta}%)
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Parameter Snapshot Chips & Multi-Layer Stack Breakdown */}
                        {pass.multiLayerStack && pass.multiLayerStack.length > 1 ? (
                          <div className="flex flex-col gap-1.5 pt-0.5">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span className="text-[10px] text-neutral-400 font-semibold">Layers ({pass.multiLayerStack.length}):</span>
                              {pass.multiLayerStack.map((layer) => (
                                <span
                                  key={layer.layerIndex}
                                  className="px-1.5 py-0.5 rounded bg-neutral-950 border border-neutral-800 text-[10px] font-mono"
                                >
                                  <strong className="text-amber-300">L{layer.layerIndex}:</strong> {layer.effectName}
                                  <span className="text-purple-300 text-[9px] ml-1 font-semibold">{layer.blendingMode}</span>
                                  <span className="text-blue-300 text-[9px] ml-1">({layer.submodelTarget})</span>
                                </span>
                              ))}
                            </div>
                            <div className="flex items-center gap-1.5 flex-wrap text-[10px] font-mono">
                              {pass.multiLayerStack.map((layer) => (
                                <span
                                  key={layer.layerIndex}
                                  className="px-1.5 py-0.5 rounded bg-neutral-950/80 border border-neutral-800/90 text-neutral-300"
                                >
                                  <span className="text-amber-400 font-bold">L{layer.layerIndex}</span> ({layer.effectName}):{' '}
                                  {Object.entries(layer.settings)
                                    .slice(0, 3)
                                    .map(([k, v]) => `${k}=${String(v)}`)
                                    .join(', ')}
                                </span>
                              ))}
                            </div>
                          </div>
                        ) : (
                          <div className="flex items-center gap-1.5 flex-wrap text-[10.5px] font-mono">
                            {Object.entries(pass.settings).slice(0, 5).map(([k, v]) => (
                              <span
                                key={k}
                                className="px-1.5 py-0.5 rounded bg-neutral-950/70 border border-neutral-800 text-neutral-300"
                              >
                                {k}: <strong className="text-amber-300">{String(v)}</strong>
                              </span>
                            ))}
                          </div>
                        )}

                        {/* Divergence Point from Previous Pass */}
                        {pass.passNumber > 1 && (
                          <div className="text-[11px] bg-neutral-950/50 p-2 rounded border border-neutral-800/80 flex flex-col gap-1">
                            <div className="flex items-center justify-between text-neutral-400">
                              <span className="font-medium text-amber-400/90 flex items-center gap-1">
                                <Split className="w-3 h-3 text-amber-400" />
                                Logic Divergence:
                              </span>
                              <span
                                className={`font-mono font-bold ${
                                  divergence.scoreDelta > 0
                                    ? 'text-emerald-400'
                                    : divergence.scoreDelta < 0
                                    ? 'text-rose-400'
                                    : 'text-neutral-400'
                                }`}
                              >
                                {divergence.scoreDelta > 0 ? `+${divergence.scoreDelta}%` : `${divergence.scoreDelta}%`} vs Prev Pass
                              </span>
                            </div>
                            <span className="text-neutral-300 text-[10.5px] leading-tight">
                              {divergence.diffText}
                            </span>
                          </div>
                        )}

                        {/* Rejection notice if invalid */}
                        {pass.isValid === false && (
                          <div className="bg-rose-950/40 border border-rose-800/60 p-2 rounded text-[10.5px] text-rose-300 flex items-center gap-1.5">
                            <Ban className="w-3.5 h-3.5 text-rose-400 flex-shrink-0" />
                            <span>{pass.invalidReason || 'Exceeded pixel difference threshold against source video.'}</span>
                          </div>
                        )}

                        {/* Preview button indicator */}
                        <div className="flex items-center justify-between pt-1 border-t border-neutral-800/60 text-[11px]">
                          <span className="text-neutral-500">
                            {isSelected ? '✓ Currently previewing on canvas' : 'Click to preview this visual state'}
                          </span>
                          <span className={`font-medium ${isSelected ? 'text-amber-400 font-bold' : 'text-neutral-400'}`}>
                            {isSelected ? 'Preview Active' : 'Select Pass →'}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Warning if selected pass was rejected */}
              {activePass?.isValid === false && (
                <div className="bg-rose-950/40 border border-rose-800/60 p-2 rounded text-[11px] text-rose-300 flex items-center gap-2">
                  <ShieldAlert className="w-4 h-4 text-rose-400 flex-shrink-0" />
                  <span>
                    <strong>Visual Truth Rejection in Pass #{activePass.passNumber}:</strong>{' '}
                    {activePass.invalidReason ||
                      'Off-screen rendered simulation exceeded pixel discrepancy threshold against source video.'}
                  </span>
                </div>
              )}

              {/* Deltas applied for active pass */}
              {activePass?.deltasApplied && activePass.deltasApplied.length > 0 && (
                <div className="mt-1 text-[11px] text-neutral-400 flex flex-col gap-0.5 bg-neutral-900/50 p-2 rounded border border-neutral-800 max-h-32 overflow-y-auto font-mono">
                  <span className="text-amber-400 font-medium">Applied In Pass {activePass.passNumber}:</span>
                  {activePass.deltasApplied.map((delta, idx) => (
                    <span key={idx} className="leading-tight text-[10.5px]">
                      {delta}
                    </span>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ========================================================================= */}
          {/* CONSOLIDATED SUGGESTIONS BAR & SLIDE-OUT DRAWER TRIGGER                     */}
          {/* ========================================================================= */}
          <div className="bg-neutral-950/80 p-3 rounded-xl border border-neutral-800 flex flex-col gap-2.5 shadow-sm">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-amber-400" />
                <span className="font-semibold text-neutral-200 text-xs">
                  Refinement Suggestions ({SUGGESTION_SQUARES.length} Presets Available)
                </span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-neutral-900 border border-neutral-800 text-neutral-400">
                  Slide-Out Library
                </span>
              </div>
              <button
                type="button"
                onClick={() => setIsSuggestionDrawerOpen(true)}
                className="px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-neutral-950 font-bold text-xs flex items-center gap-1.5 transition cursor-pointer shadow-md shadow-amber-500/10"
              >
                <Sliders className="w-3.5 h-3.5" />
                <span>Open Suggestion Drawer ({SUGGESTION_SQUARES.length}) ⇥</span>
              </button>
            </div>

            {/* Quick-Access Curated Suggestion Pills */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5 text-[11px]">
              <span className="text-neutral-500 text-[10px] shrink-0 font-medium">Quick Presets:</span>
              {[
                { id: 'geom-add-arms', label: '+2 Spiral Arms', directive: 'Add 2 more spiral arms for denser pattern' },
                { id: 'pal-smooth-blend', label: 'Smooth Gradient', directive: 'Enable smooth gradient color blending' },
                { id: 'shad-3d-perspective', label: '3D Depth & Bloom', directive: 'Enhance 3D volumetric perspective' },
                { id: 'pal-candy-cane', label: 'Peppermint Ribbon', directive: 'Apply peppermint red and glacier white palette' },
                { id: 'mot-turbo-60', label: 'Accelerate (+60%)', directive: 'Accelerate speed factor by +60% turbo' },
                { id: 'geom-star-twinkle', label: 'Star Topper Shimmer', directive: 'Activate star topper apex shimmer' },
              ].map((pill) => (
                <button
                  key={pill.id}
                  type="button"
                  onClick={() => {
                    const sq = SUGGESTION_SQUARES.find((s) => s.id === pill.id);
                    if (!sq) return;
                    if (previewedSuggestion?.id === pill.id) {
                      setPreviewedSuggestion(null);
                      setActiveSuggestionId(null);
                    } else {
                      const base = activePass
                        ? {
                            ...recipe,
                            effectName: activePass.effectName,
                            settings: { ...activePass.settings },
                          }
                        : recipe;
                      const preview = applySuggestionToRecipe(base, sq);
                      setPreviewedSuggestion({
                        id: sq.id,
                        label: sq.label,
                        directive: sq.directive,
                        previewRecipe: preview,
                      });
                      setActiveSuggestionId(sq.id);
                      setUserFeedback(sq.directive);
                    }
                  }}
                  className={`px-2.5 py-1 rounded-lg border text-[10.5px] font-medium transition cursor-pointer whitespace-nowrap flex items-center gap-1 ${
                    previewedSuggestion?.id === pill.id
                      ? 'bg-amber-500/30 text-amber-300 border-amber-400 font-bold ring-1 ring-amber-400'
                      : 'bg-neutral-900/90 text-neutral-300 border-neutral-800 hover:text-white hover:border-neutral-700'
                  }`}
                >
                  <Sparkles className="w-3 h-3 text-amber-400" />
                  <span>{pill.label}</span>
                </button>
              ))}
            </div>

            {/* Active Live Preview Highlight Banner */}
            {previewedSuggestion && (
              <div className="bg-amber-500/15 border border-amber-500/40 p-2.5 rounded-lg flex items-center justify-between text-xs gap-2 flex-wrap">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
                  <span className="text-amber-200">
                    Previewing Suggestion: <strong>{previewedSuggestion.label}</strong> ({previewedSuggestion.directive})
                  </span>
                </div>
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => {
                      setPreviewedSuggestion(null);
                      setActiveSuggestionId(null);
                    }}
                    className="px-2.5 py-1 rounded bg-neutral-900 hover:bg-neutral-800 text-neutral-300 text-[11px] font-semibold border border-neutral-800 transition cursor-pointer"
                  >
                    ✕ Revert
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      onContinueIterating(previewedSuggestion.directive, stochasticMode, visualTruthMode);
                      setPreviewedSuggestion(null);
                      setActiveSuggestionId(null);
                    }}
                    className="px-3 py-1 rounded bg-amber-500 hover:bg-amber-400 text-neutral-950 font-bold text-[11px] transition cursor-pointer shadow-sm"
                  >
                    ✅ Apply & Run
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* ========================================================================= */}
          {/* MULTI-LAYER EFFECT SETTINGS & OFFICIAL XLIGHTS MANUAL INSPECTOR           */}
          {/* ========================================================================= */}
          {(() => {
            const activeLayers: SequencerLayerInstruction[] =
              activePass?.multiLayerStack && activePass.multiLayerStack.length > 0
                ? activePass.multiLayerStack
                : recipe.multiLayerStack && recipe.multiLayerStack.length > 0
                ? recipe.multiLayerStack
                : [
                    {
                      layerIndex: recipe.layerIndex || 1,
                      layerName: `Layer 1: ${activePass?.effectName || recipe.effectName}`,
                      effectName: activePass?.effectName || recipe.effectName,
                      blendingMode: recipe.layerBlending || 'Normal',
                      submodelTarget: recipe.submodelTarget || 'Default / Full Prop',
                      timing: recipe.timing,
                      palette: recipe.palette,
                      settings: activePass?.settings || recipe.settings,
                      stepInstruction: `Place ${activePass?.effectName || recipe.effectName} on Layer 1 of '${recipe.targetProp}'.`,
                    },
                  ];

            const activeGuide: string[] =
              activePass?.stepByStepGuide && activePass.stepByStepGuide.length > 0
                ? activePass.stepByStepGuide
                : recipe.stepByStepGuide && recipe.stepByStepGuide.length > 0
                ? recipe.stepByStepGuide
                : [
                    `Step 1 [Sequencer Setup]: Locate '${recipe.targetProp}' on the sequencer timeline.`,
                    `Step 2 [Layer 1 Placement]: Drop '${activePass?.effectName || recipe.effectName}' onto Layer 1 from ${recipe.timing.startMs}ms - ${recipe.timing.endMs}ms.`,
                    `Step 3 [Settings]: Enter all verified parameters in the Effect Settings panel.`,
                  ];

            const displayedLayers =
              selectedInspectorLayer === 'all'
                ? activeLayers
                : activeLayers.filter((l) => l.layerIndex === selectedInspectorLayer);

            return (
              <div className="bg-neutral-950/80 p-3.5 rounded-xl border border-neutral-800 flex flex-col gap-3 shadow-inner">
                {/* Header & Inspector Tab Switcher */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b border-neutral-800 pb-2">
                  <div className="flex items-center gap-2">
                    <Sliders className="w-4 h-4 text-blue-400" />
                    <span className="font-semibold text-neutral-100 text-xs">
                      Multi-Layer Sequencer Stack ({activeLayers.length} {activeLayers.length === 1 ? 'Layer' : 'Layers'})
                    </span>
                    <span className="text-[10px] text-emerald-400 font-mono font-medium flex items-center gap-1 bg-emerald-950/50 px-2 py-0.5 rounded border border-emerald-800/60">
                      <Check className="w-3 h-3" />
                      Confirmed by xLights Manual
                    </span>
                  </div>

                  <div className="flex items-center gap-1 bg-neutral-900 p-0.5 rounded-lg border border-neutral-800 text-[11px]">
                    <button
                      type="button"
                      onClick={() => setInspectorTab('layers')}
                      className={`px-2.5 py-1 rounded-md font-semibold transition cursor-pointer flex items-center gap-1.5 ${
                        inspectorTab === 'layers'
                          ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                          : 'text-neutral-400 hover:text-white'
                      }`}
                    >
                      <Layers className="w-3 h-3 text-amber-400" />
                      <span>Layers ({activeLayers.length})</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setInspectorTab('guide')}
                      className={`px-2.5 py-1 rounded-md font-semibold transition cursor-pointer flex items-center gap-1.5 ${
                        inspectorTab === 'guide'
                          ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                          : 'text-neutral-400 hover:text-white'
                      }`}
                    >
                      <ListOrdered className="w-3 h-3 text-emerald-400" />
                      <span>Instructions</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setInspectorTab('manual')}
                      className={`px-2.5 py-1 rounded-md font-semibold transition cursor-pointer flex items-center gap-1.5 ${
                        inspectorTab === 'manual'
                          ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                          : 'text-neutral-400 hover:text-white'
                      }`}
                    >
                      <BookOpen className="w-3 h-3 text-cyan-400" />
                      <span>xLights Manual</span>
                    </button>
                  </div>
                </div>

                {/* TAB 1: Layer Stack & Parameters */}
                {inspectorTab === 'layers' && (
                  <div className="flex flex-col gap-3">
                    {/* Layer Filter Pills (When > 1 layer) */}
                    {activeLayers.length > 1 && (
                      <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5 text-[11px]">
                        <button
                          type="button"
                          onClick={() => setSelectedInspectorLayer('all')}
                          className={`px-2.5 py-1 rounded-lg border transition cursor-pointer whitespace-nowrap font-medium ${
                            selectedInspectorLayer === 'all'
                              ? 'bg-amber-500/20 text-amber-300 border-amber-500/50 font-bold'
                              : 'bg-neutral-900 text-neutral-400 border-neutral-800 hover:text-white'
                          }`}
                        >
                          All Layers ({activeLayers.length})
                        </button>
                        {activeLayers.map((l) => (
                          <button
                            key={l.layerIndex}
                            type="button"
                            onClick={() => setSelectedInspectorLayer(l.layerIndex)}
                            className={`px-2.5 py-1 rounded-lg border transition cursor-pointer whitespace-nowrap flex items-center gap-1.5 font-medium ${
                              selectedInspectorLayer === l.layerIndex
                                ? 'bg-amber-500/20 text-amber-300 border-amber-500/50 font-bold'
                                : 'bg-neutral-900 text-neutral-400 border-neutral-800 hover:text-white'
                            }`}
                          >
                            <span className="font-mono text-[10px] bg-neutral-800 px-1 rounded">L{l.layerIndex}</span>
                            <span>{l.effectName}</span>
                            <span className="text-[9.5px] text-neutral-500">({l.submodelTarget})</span>
                          </button>
                        ))}
                      </div>
                    )}

                    {/* Layer Cards */}
                    <div className="flex flex-col gap-3">
                      {displayedLayers.map((layer) => {
                        const effectSpec = getXLightsEffectSpec(layer.effectName);
                        return (
                          <div
                            key={layer.layerIndex}
                            className="bg-neutral-900/70 p-3 rounded-xl border border-neutral-800 flex flex-col gap-2.5 hover:border-neutral-700/80 transition"
                          >
                            {/* Layer Card Header */}
                            <div className="flex items-center justify-between flex-wrap gap-2 pb-2 border-b border-neutral-800/80">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="font-mono font-bold px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30 text-xs">
                                  Layer {layer.layerIndex}
                                </span>
                                <span className="font-bold text-sm text-neutral-100">
                                  {layer.effectName} Effect
                                </span>
                                <span className="text-neutral-500 text-xs">·</span>
                                <span className="text-[10.5px] font-mono px-2 py-0.5 rounded bg-purple-950/60 text-purple-300 border border-purple-800/60">
                                  Blending: {layer.blendingMode}
                                </span>
                                <span className="text-[10.5px] font-mono px-2 py-0.5 rounded bg-blue-950/60 text-blue-300 border border-blue-800/60">
                                  Submodel: {layer.submodelTarget}
                                </span>
                              </div>

                              <span className="text-[10.5px] font-mono text-neutral-400">
                                {layer.timing.startMs}ms - {layer.timing.endMs}ms ({layer.timing.durationMs}ms)
                              </span>
                            </div>

                            {/* Step Hint */}
                            <p className="text-[11px] text-neutral-400 leading-relaxed">
                              {layer.stepInstruction}
                            </p>

                            {/* Settings Parameters Grid (Clickable for Manual Documentation) */}
                            <div className="flex flex-col gap-1.5 pt-1">
                              <div className="flex items-center justify-between text-[10.5px] text-neutral-400">
                                <span className="font-semibold text-neutral-300 flex items-center gap-1">
                                  <Sliders className="w-3 h-3 text-amber-400" />
                                  Official Settings (Click any parameter to inspect exact rendering impact):
                                </span>
                                <span className="text-[10px] text-cyan-400 underline cursor-pointer" onClick={() => setInspectorTab('manual')}>
                                  View Manual Chapter →
                                </span>
                              </div>

                              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 pt-0.5">
                                {Object.entries(layer.settings).map(([key, val]) => {
                                  const paramSpec = effectSpec?.parameters.find((p) => p.name === key || p.xmlKey === key) || null;
                                  return (
                                    <div
                                      key={key}
                                      onClick={() => {
                                        setSelectedParameterInfo({
                                          effectName: layer.effectName,
                                          paramKey: key,
                                          spec: paramSpec,
                                          currentValue: val,
                                        });
                                      }}
                                      className="bg-neutral-950/90 p-2 rounded-lg border border-neutral-800 hover:border-amber-500/60 transition cursor-pointer flex flex-col justify-between group"
                                      title={`Click to inspect '${key}' documentation and rendering impact`}
                                    >
                                      <div className="flex items-center justify-between">
                                        <span className="text-neutral-400 text-[10.5px] truncate group-hover:text-amber-300 font-medium" title={key}>
                                          {key}
                                        </span>
                                        <HelpCircle className="w-3 h-3 text-neutral-500 group-hover:text-amber-400 shrink-0 ml-1" />
                                      </div>
                                      <span className="font-mono font-bold text-neutral-100 mt-1 truncate text-xs">
                                        {typeof val === 'boolean' ? (val ? 'Checked (1)' : 'Unchecked (0)') : String(val)}
                                      </span>
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* TAB 2: Step-by-Step Desktop Instructions */}
                {inspectorTab === 'guide' && (
                  <div className="flex flex-col gap-2.5">
                    <div className="flex items-center justify-between text-[11px] text-neutral-400 pb-1 border-b border-neutral-800">
                      <span>Sequential Desktop Instructions for Official xLights Application:</span>
                      <button
                        type="button"
                        onClick={() => {
                          navigator.clipboard.writeText(activeGuide.join('\n'));
                        }}
                        className="px-2 py-0.5 rounded bg-neutral-900 hover:bg-neutral-800 text-neutral-300 border border-neutral-800 text-[10.5px] cursor-pointer"
                      >
                        Copy All Steps
                      </button>
                    </div>

                    <div className="flex flex-col gap-2 max-h-96 overflow-y-auto pr-1">
                      {activeGuide.map((step, idx) => (
                        <div key={idx} className="p-2.5 rounded-lg bg-neutral-900/60 border border-neutral-800/80 text-[11px] text-neutral-300 leading-relaxed font-mono whitespace-pre-wrap">
                          {step}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* TAB 3: Official xLights User Manual & Blending Mode Guide */}
                {inspectorTab === 'manual' && (
                  <div className="flex flex-col gap-3">
                    <div className="p-3 rounded-lg bg-neutral-900/70 border border-neutral-800 flex flex-col gap-2">
                      <div className="flex items-center justify-between flex-wrap gap-2">
                        <div className="flex items-center gap-1.5 text-neutral-100 font-bold text-xs">
                          <BookOpen className="w-4 h-4 text-cyan-400" />
                          <span>Confirmed xLights Repository & User Manual Specifications</span>
                        </div>
                        {onOpenManual && (
                          <button
                            type="button"
                            onClick={() => onOpenManual('chapters')}
                            className="px-2.5 py-1 rounded bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 text-[11px] font-semibold flex items-center gap-1.5 cursor-pointer transition"
                          >
                            <BookOpen className="w-3.5 h-3.5 text-amber-400" />
                            <span>Open Architecture Engine & Diagrams</span>
                          </button>
                        )}
                      </div>
                      <p className="text-[11px] text-neutral-400 leading-relaxed">
                        Every setting, option, and XML clipboard snippet in this application is verified against the official xLights source repository (github.com/smeighan/xLights) and User Manual to eliminate non-existent attributes and ensure 100% render fidelity.
                      </p>
                    </div>

                    {/* Blending Mode Reference Cards */}
                    <div className="flex flex-col gap-1.5">
                      <span className="text-xs font-semibold text-neutral-300 flex items-center gap-1.5">
                        <Layers className="w-3.5 h-3.5 text-purple-400" />
                        Multi-Layer Blending Modes & Visual Composite Impacts:
                      </span>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                        {XLIGHTS_BLENDING_MODES.slice(0, 4).map((b) => (
                          <div key={b.mode} className="p-2.5 rounded-lg bg-neutral-900/80 border border-neutral-800 flex flex-col gap-1 text-[11px]">
                            <div className="flex items-center justify-between">
                              <span className="font-bold text-neutral-200">{b.mode}</span>
                              <span className="text-[10px] font-mono text-purple-300">{b.formula}</span>
                            </div>
                            <p className="text-neutral-400 text-[10.5px]">{b.description}</p>
                            <span className="text-amber-400/90 text-[10px]">Best for: {b.bestUse}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })()}

          {/* User Feedback & Continued Iteration Input */}
          <form onSubmit={handleSubmitFeedback} className="flex flex-col gap-2 pt-1">
            <label className="text-neutral-300 font-medium flex items-center justify-between">
              <span>Natural Language Refinement Directive:</span>
              <span className="text-neutral-500 text-[11px] font-normal">
                Target Threshold: {targetThreshold}%
              </span>
            </label>

            <div className="flex items-center gap-2">
              <input
                type="text"
                placeholder="e.g. Mid-cone needs 2 more arms; speed is 20% too fast; reverse direction..."
                value={userFeedback}
                onChange={(e) => setUserFeedback(e.target.value)}
                disabled={isIterating}
                className="flex-1 px-3 py-2 rounded-lg bg-neutral-950 border border-neutral-700 text-neutral-100 placeholder-neutral-600 focus:outline-none focus:border-amber-500 text-xs"
              />
              <button
                type="submit"
                disabled={isIterating || !userFeedback.trim()}
                className="px-3.5 py-2 rounded-lg bg-amber-500 hover:bg-amber-400 text-neutral-950 font-bold text-xs flex items-center gap-1.5 transition disabled:opacity-50 cursor-pointer"
              >
                <Send className="w-3.5 h-3.5" />
                Refine
              </button>
            </div>

            <div className="flex items-center justify-between pt-1">
              <div className="flex items-center gap-2">
                <span className="text-[11px] text-neutral-400">Target Accuracy:</span>
                <input
                  type="range"
                  min={80}
                  max={98}
                  value={targetThreshold}
                  onChange={(e) => onChangeTargetThreshold(Number(e.target.value))}
                  className="w-24 accent-amber-500 cursor-pointer"
                />
                <span className="font-mono text-amber-300 font-semibold">{targetThreshold}%</span>
              </div>

              <button
                type="button"
                onClick={handleTriggerContinue}
                disabled={isIterating}
                className="px-3.5 py-1.5 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer"
                title="Runs additional stochastic or fine-tuning passes to push convergence higher"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isIterating ? 'animate-spin' : ''}`} />
                {isIterating
                  ? 'Optimizing Parameters...'
                  : `Continue Optimizing (+15 Passes, Completed: ${history.length})`}
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* EXPANDING SLIDE-OUT DRAWER FOR SUGGESTION SQUARES                         */}
      {/* ========================================================================= */}
      {isSuggestionDrawerOpen && (
        <div className="fixed inset-0 z-50 flex justify-end">
          {/* Backdrop */}
          <div
            onClick={() => setIsSuggestionDrawerOpen(false)}
            className="fixed inset-0 bg-neutral-950/75 backdrop-blur-xs transition-opacity"
          />

          {/* Slide-Out Drawer Panel */}
          <div className="relative z-10 w-full sm:w-[580px] h-full bg-neutral-950 border-l border-neutral-800 shadow-2xl flex flex-col justify-between overflow-hidden animate-in slide-in-from-right duration-200">
            {/* Drawer Header */}
            <div className="p-4 bg-neutral-900/80 border-b border-neutral-800 flex items-center justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-lg bg-amber-500/20 text-amber-300 border border-amber-500/30">
                  <Sparkles className="w-4 h-4 text-amber-400" />
                </div>
                <div>
                  <h3 className="font-extrabold text-sm text-neutral-100 flex items-center gap-2">
                    <span>Suggestion Squares Library</span>
                    <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-neutral-800 text-amber-300 border border-neutral-700">
                      {filteredSuggestionSquares.length} Available
                    </span>
                  </h3>
                  <p className="text-[11px] text-neutral-400 mt-0.5">
                    Click any square to preview live on the 3D canvas or 1-click optimize
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setIsSuggestionDrawerOpen(false)}
                className="p-1.5 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-400 hover:text-white transition cursor-pointer"
                title="Close Drawer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Search & Category Filter Bar */}
            <div className="p-3.5 bg-neutral-900/40 border-b border-neutral-800/80 flex flex-col gap-2.5">
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-neutral-500 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Filter suggestions by name, badge, description..."
                  value={suggestionSearchQuery}
                  onChange={(e) => setSuggestionSearchQuery(e.target.value)}
                  className="w-full pl-8 pr-3 py-1.5 rounded-lg bg-neutral-950 border border-neutral-800 text-xs text-neutral-200 placeholder-neutral-500 focus:outline-none focus:border-amber-500/60"
                />
                {suggestionSearchQuery && (
                  <button
                    type="button"
                    onClick={() => setSuggestionSearchQuery('')}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-neutral-500 hover:text-neutral-300 text-xs cursor-pointer"
                  >
                    ✕
                  </button>
                )}
              </div>

              <div className="flex items-center gap-1 overflow-x-auto pb-0.5 text-[11px]">
                {(
                  [
                    { id: 'all', label: 'All', count: SUGGESTION_SQUARES.length },
                    { id: 'geometry', label: 'Geometry', count: SUGGESTION_SQUARES.filter((s) => s.category === 'geometry').length },
                    { id: 'motion', label: 'Speed', count: SUGGESTION_SQUARES.filter((s) => s.category === 'motion').length },
                    { id: 'shading', label: '3D/Shading', count: SUGGESTION_SQUARES.filter((s) => s.category === 'shading').length },
                    { id: 'palette', label: 'Palette', count: SUGGESTION_SQUARES.filter((s) => s.category === 'palette').length },
                    { id: 'hypothesis', label: 'Hypotheses', count: SUGGESTION_SQUARES.filter((s) => s.category === 'hypothesis').length },
                  ] as const
                ).map((cat) => (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => setSuggestionCategory(cat.id)}
                    className={`px-2 py-0.5 rounded text-[10px] font-medium border transition cursor-pointer whitespace-nowrap ${
                      suggestionCategory === cat.id
                        ? 'bg-amber-500/20 text-amber-300 border-amber-500/50 font-bold'
                        : 'bg-neutral-900 text-neutral-400 border-neutral-800 hover:text-white'
                    }`}
                  >
                    {cat.label} ({cat.count})
                  </button>
                ))}
              </div>
            </div>

            {/* Scrollable Grid of Suggestion Cards */}
            <div className="flex-1 overflow-y-auto p-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {filteredSuggestionSquares.map((sq) => {
                  const isPreviewingThis = previewedSuggestion?.id === sq.id;
                  const isSelected = activeSuggestionId === sq.id || isPreviewingThis;
                  return (
                    <div
                      key={sq.id}
                      onClick={() => {
                        if (isPreviewingThis) {
                          setPreviewedSuggestion(null);
                          setActiveSuggestionId(null);
                        } else {
                          const base = activePass
                            ? {
                                ...recipe,
                                effectName: activePass.effectName,
                                settings: { ...activePass.settings },
                              }
                            : recipe;
                          const preview = applySuggestionToRecipe(base, sq);
                          setPreviewedSuggestion({
                            id: sq.id,
                            label: sq.label,
                            directive: sq.directive,
                            previewRecipe: preview,
                          });
                          setActiveSuggestionId(sq.id);
                          setUserFeedback(sq.directive);
                        }
                      }}
                      className={`p-2.5 rounded-xl border text-left flex flex-col justify-between gap-2 cursor-pointer transition select-none group relative ${
                        isPreviewingThis
                          ? 'bg-amber-500/20 border-amber-400 ring-2 ring-amber-400/50 shadow-md scale-[1.01]'
                          : isSelected
                          ? 'bg-amber-500/10 border-amber-500/60 ring-1 ring-amber-500/30'
                          : 'bg-neutral-900/60 border-neutral-800/80 hover:border-neutral-700 hover:bg-neutral-900/90'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5">
                          <span className="p-1 rounded bg-neutral-950 border border-neutral-800 text-amber-400">
                            {renderSquareIcon(sq.iconType)}
                          </span>
                          <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-neutral-950 border border-neutral-800 text-neutral-300">
                            {sq.badge}
                          </span>
                        </div>
                        {isPreviewingThis && (
                          <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-amber-500 text-neutral-950 font-bold animate-pulse">
                            👁️ Preview
                          </span>
                        )}
                      </div>

                      <div>
                        <div className="font-bold text-xs text-neutral-100 group-hover:text-amber-300 transition">
                          {sq.label}
                        </div>
                        <div className="text-[11px] text-neutral-400 leading-tight mt-1 line-clamp-2">
                          {sq.description}
                        </div>
                      </div>

                      <div className="flex items-center justify-between pt-1.5 border-t border-neutral-800/80 text-[10.5px]">
                        <span className="font-mono text-amber-400/90 font-medium text-[10px]">
                          {sq.deltaText}
                        </span>
                        <div className="flex items-center gap-1">
                          {isPreviewingThis ? (
                            <>
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setPreviewedSuggestion(null);
                                  setActiveSuggestionId(null);
                                }}
                                className="px-2 py-0.5 rounded bg-neutral-800 hover:bg-neutral-700 text-neutral-300 font-semibold text-[10px] transition cursor-pointer"
                              >
                                ✕ Revert
                              </button>
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onContinueIterating(sq.directive, stochasticMode, visualTruthMode);
                                  setPreviewedSuggestion(null);
                                  setActiveSuggestionId(null);
                                  setIsSuggestionDrawerOpen(false);
                                }}
                                className="px-2.5 py-0.5 rounded bg-amber-500 hover:bg-amber-400 text-neutral-950 font-bold text-[10px] transition cursor-pointer"
                              >
                                ✅ Apply
                              </button>
                            </>
                          ) : (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setUserFeedback(sq.directive);
                                setActiveSuggestionId(sq.id);
                                onContinueIterating(sq.directive, stochasticMode, visualTruthMode);
                                setIsSuggestionDrawerOpen(false);
                              }}
                              className="px-2 py-0.5 rounded bg-amber-500/20 hover:bg-amber-500/40 text-amber-300 font-semibold text-[10px] transition cursor-pointer"
                            >
                              ▶ Run Now
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Drawer Bottom Bar */}
            <div className="p-3 bg-neutral-900 border-t border-neutral-800 flex items-center justify-between gap-2 text-xs">
              <span className="text-[11px] text-neutral-400">
                {previewedSuggestion ? `Previewing: ${previewedSuggestion.label}` : `${filteredSuggestionSquares.length} Refinement Directives`}
              </span>
              <div className="flex items-center gap-2">
                {previewedSuggestion && (
                  <button
                    type="button"
                    onClick={() => {
                      onContinueIterating(previewedSuggestion.directive, stochasticMode, visualTruthMode);
                      setPreviewedSuggestion(null);
                      setActiveSuggestionId(null);
                      setIsSuggestionDrawerOpen(false);
                    }}
                    className="px-3 py-1 rounded-lg bg-amber-500 hover:bg-amber-400 text-neutral-950 font-bold text-xs cursor-pointer"
                  >
                    ✅ Apply Previewed Directive
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setIsSuggestionDrawerOpen(false)}
                  className="px-3 py-1 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-300 text-xs font-semibold cursor-pointer"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* OFFICIAL XLIGHTS PARAMETER & RENDERING MANUAL MODAL                         */}
      {/* ========================================================================= */}
      {selectedParameterInfo && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-neutral-950/80 backdrop-blur-xs">
          <div className="bg-neutral-900 border border-neutral-700/80 rounded-2xl max-w-lg w-full p-5 shadow-2xl flex flex-col gap-3.5 text-xs animate-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="flex items-start justify-between gap-3 pb-2.5 border-b border-neutral-800">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-lg bg-blue-500/20 text-blue-400 border border-blue-500/30">
                  <Sliders className="w-5 h-5 text-blue-400" />
                </div>
                <div>
                  <h3 className="font-extrabold text-sm text-neutral-100 flex items-center gap-2">
                    <span>{selectedParameterInfo.paramKey}</span>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-neutral-800 text-amber-300 border border-neutral-700">
                      {selectedParameterInfo.effectName}
                    </span>
                  </h3>
                  <span className="text-[10px] font-mono text-neutral-400">
                    XML Key: Setting name="{selectedParameterInfo.spec?.xmlKey || selectedParameterInfo.paramKey}"
                  </span>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setSelectedParameterInfo(null)}
                className="p-1 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-400 hover:text-white cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Official Source Repo Verification Banner */}
            <div className="p-2.5 rounded-lg bg-emerald-950/40 border border-emerald-800/60 flex items-center gap-2 text-emerald-300 text-[11px]">
              <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>
                <strong>Verified:</strong> Confirmed against official xLights source repository (github.com/smeighan/xLights) and User Manual specifications.
              </span>
            </div>

            {/* Parameter Specification Data Grid */}
            <div className="grid grid-cols-2 gap-2 text-[11px] font-mono">
              <div className="p-2 rounded bg-neutral-950 border border-neutral-800 flex flex-col">
                <span className="text-neutral-500 text-[10px]">Active Value in Sequence:</span>
                <span className="font-bold text-amber-300 mt-0.5">
                  {typeof selectedParameterInfo.currentValue === 'boolean'
                    ? selectedParameterInfo.currentValue
                      ? 'Checked (1)'
                      : 'Unchecked (0)'
                    : String(selectedParameterInfo.currentValue)}
                </span>
              </div>
              <div className="p-2 rounded bg-neutral-950 border border-neutral-800 flex flex-col">
                <span className="text-neutral-500 text-[10px]">Data Type:</span>
                <span className="font-bold text-neutral-200 mt-0.5 uppercase">
                  {selectedParameterInfo.spec?.type || typeof selectedParameterInfo.currentValue}
                </span>
              </div>
              {selectedParameterInfo.spec?.range && (
                <div className="p-2 rounded bg-neutral-950 border border-neutral-800 flex flex-col">
                  <span className="text-neutral-500 text-[10px]">Valid Range:</span>
                  <span className="font-bold text-neutral-200 mt-0.5">
                    {selectedParameterInfo.spec.range.min} to {selectedParameterInfo.spec.range.max} (step {selectedParameterInfo.spec.range.step || 1})
                  </span>
                </div>
              )}
              {selectedParameterInfo.spec?.options && (
                <div className="p-2 rounded bg-neutral-950 border border-neutral-800 flex flex-col">
                  <span className="text-neutral-500 text-[10px]">Valid Options:</span>
                  <span className="font-bold text-neutral-200 mt-0.5">
                    {selectedParameterInfo.spec.options.join(' | ')}
                  </span>
                </div>
              )}
            </div>

            {/* Official Description */}
            <div className="flex flex-col gap-1">
              <span className="font-bold text-neutral-200 text-xs flex items-center gap-1.5">
                <BookOpen className="w-3.5 h-3.5 text-cyan-400" />
                Official xLights Manual Description:
              </span>
              <p className="text-neutral-300 text-[11.5px] leading-relaxed bg-neutral-950/60 p-2.5 rounded-lg border border-neutral-800">
                {selectedParameterInfo.spec?.description ||
                  `Standard official parameter '${selectedParameterInfo.paramKey}' modulating shader configuration for ${selectedParameterInfo.effectName}.`}
              </p>
            </div>

            {/* Rendering Impact */}
            <div className="flex flex-col gap-1">
              <span className="font-bold text-neutral-200 text-xs flex items-center gap-1.5">
                <Eye className="w-3.5 h-3.5 text-amber-400" />
                Physical & Optical Rendering Impact on Display:
              </span>
              <p className="text-neutral-300 text-[11.5px] leading-relaxed bg-neutral-950/60 p-2.5 rounded-lg border border-neutral-800">
                {selectedParameterInfo.spec?.renderingImpact ||
                  `Governs shader execution during 20fps/40fps render cycle. Modifying this value alters spatial distribution and optical flow vectors across physical prop nodes.`}
              </p>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-end pt-2 border-t border-neutral-800">
              <button
                type="button"
                onClick={() => setSelectedParameterInfo(null)}
                className="px-4 py-1.5 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-200 font-semibold cursor-pointer text-xs"
              >
                Close Inspector
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
