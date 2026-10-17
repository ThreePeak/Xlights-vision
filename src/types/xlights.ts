export type PropModelType =
  | 'Mega Tree'
  | 'PEX Arches'
  | 'Mini Tree with Star'
  | 'Matrix'
  | 'Roofline'
  | 'Spinner / ChromaStar'
  | 'Single Line / Poly Line'
  | 'Window Frame'
  | 'Wreath'
  | 'Custom Coro Prop';

export type SubmodelTarget =
  | 'Default / Full Prop'
  | 'Star Only'
  | 'Trunk Only'
  | 'Per Preview'
  | 'Custom Sub-Buffer';

export type TimingInterval = 25 | 50; // 25ms (40 FPS) or 50ms (20 FPS)

export type LayerBlendingMode =
  | 'Normal'
  | '2 is Mask'
  | 'Average'
  | 'Maximum'
  | 'Minimum'
  | 'Layer 1 Over Layer 2'
  | 'Add'
  | 'Subtract';

export interface PropGeometry {
  degrees: 180 | 270 | 360; // For Mega Tree
  strands: number; // For Mega Tree (e.g. 16, 24, 32, 48)
  nodesPerStrand: number; // Nodes per ribbon/strand (e.g. 50, 100)
  archCount: number; // For Arches (e.g. 1 to 12)
  nodesPerArch: number; // Nodes per arch (e.g. 25, 50, 100)
  matrixRows: number; // For Matrix (e.g. 20)
  matrixCols: number; // For Matrix (e.g. 50)
  matrixOrientation: 'Horizontal' | 'Vertical';
  spinnerBlades: number; // For Coro Spinner (e.g. 8, 12, 16)
  nodesPerBlade: number;
  hasStarTopper: boolean;
  starNodes: number;
}

export const DEFAULT_PROP_GEOMETRY: Record<PropModelType, PropGeometry> = {
  'Mega Tree': {
    degrees: 360,
    strands: 36,
    nodesPerStrand: 50,
    archCount: 1,
    nodesPerArch: 50,
    matrixRows: 20,
    matrixCols: 50,
    matrixOrientation: 'Horizontal',
    spinnerBlades: 12,
    nodesPerBlade: 16,
    hasStarTopper: true,
    starNodes: 50,
  },
  'PEX Arches': {
    degrees: 180,
    strands: 8,
    nodesPerStrand: 50,
    archCount: 8,
    nodesPerArch: 40,
    matrixRows: 20,
    matrixCols: 50,
    matrixOrientation: 'Horizontal',
    spinnerBlades: 12,
    nodesPerBlade: 16,
    hasStarTopper: false,
    starNodes: 0,
  },
  'Mini Tree with Star': {
    degrees: 180,
    strands: 16,
    nodesPerStrand: 30,
    archCount: 1,
    nodesPerArch: 50,
    matrixRows: 20,
    matrixCols: 50,
    matrixOrientation: 'Horizontal',
    spinnerBlades: 12,
    nodesPerBlade: 16,
    hasStarTopper: true,
    starNodes: 20,
  },
  Matrix: {
    degrees: 180,
    strands: 30,
    nodesPerStrand: 60,
    archCount: 1,
    nodesPerArch: 50,
    matrixRows: 30,
    matrixCols: 60,
    matrixOrientation: 'Horizontal',
    spinnerBlades: 12,
    nodesPerBlade: 16,
    hasStarTopper: false,
    starNodes: 0,
  },
  Roofline: {
    degrees: 180,
    strands: 1,
    nodesPerStrand: 200,
    archCount: 1,
    nodesPerArch: 50,
    matrixRows: 1,
    matrixCols: 200,
    matrixOrientation: 'Horizontal',
    spinnerBlades: 12,
    nodesPerBlade: 16,
    hasStarTopper: false,
    starNodes: 0,
  },
  'Spinner / ChromaStar': {
    degrees: 360,
    strands: 12,
    nodesPerStrand: 20,
    archCount: 1,
    nodesPerArch: 50,
    matrixRows: 20,
    matrixCols: 50,
    matrixOrientation: 'Horizontal',
    spinnerBlades: 12,
    nodesPerBlade: 20,
    hasStarTopper: false,
    starNodes: 0,
  },
  'Single Line / Poly Line': {
    degrees: 180,
    strands: 1,
    nodesPerStrand: 100,
    archCount: 1,
    nodesPerArch: 50,
    matrixRows: 1,
    matrixCols: 100,
    matrixOrientation: 'Horizontal',
    spinnerBlades: 12,
    nodesPerBlade: 16,
    hasStarTopper: false,
    starNodes: 0,
  },
  'Window Frame': {
    degrees: 180,
    strands: 4,
    nodesPerStrand: 25,
    archCount: 1,
    nodesPerArch: 50,
    matrixRows: 4,
    matrixCols: 25,
    matrixOrientation: 'Horizontal',
    spinnerBlades: 12,
    nodesPerBlade: 16,
    hasStarTopper: false,
    starNodes: 0,
  },
  Wreath: {
    degrees: 360,
    strands: 3,
    nodesPerStrand: 50,
    archCount: 1,
    nodesPerArch: 50,
    matrixRows: 3,
    matrixCols: 50,
    matrixOrientation: 'Horizontal',
    spinnerBlades: 8,
    nodesPerBlade: 15,
    hasStarTopper: false,
    starNodes: 0,
  },
  'Custom Coro Prop': {
    degrees: 180,
    strands: 8,
    nodesPerStrand: 50,
    archCount: 1,
    nodesPerArch: 50,
    matrixRows: 20,
    matrixCols: 50,
    matrixOrientation: 'Horizontal',
    spinnerBlades: 12,
    nodesPerBlade: 16,
    hasStarTopper: false,
    starNodes: 0,
  },
};

export interface UserContextConfig {
  propType: PropModelType;
  nodeCount: number;
  submodelTarget: SubmodelTarget;
  timingInterval: TimingInterval;
  startingLayer: number;
  layerBlending: LayerBlendingMode;
  notes: string;
  geometry: PropGeometry;
}

export interface RoiPoint {
  x: number; // 0..1 normalized
  y: number; // 0..1 normalized
}

export interface RoiBox {
  x: number; // 0..1 normalized left
  y: number; // 0..1 normalized top
  width: number; // 0..1 normalized width
  height: number; // 0..1 normalized height
  rotationDeg: number;
  isPolygon: boolean;
  polygonPoints: RoiPoint[]; // 4 points if isPolygon is true
  locked: boolean;
}

export interface ViewportTransform {
  scale: number; // 0.5 to 5.0
  panX: number; // in pixels
  panY: number; // in pixels
}

export interface ColorSwatch {
  index: number; // 1 to 8
  hex: string;
  name: string;
  rgb: [number, number, number];
  percentage: number;
  checked: boolean;
}

export interface FrameFeature {
  frameIndex: number;
  timestampMs: number;
  luminance: number; // 0..1
  activePixelsRatio: number; // 0..1
  flowVector: {
    dx: number;
    dy: number;
    magnitude: number;
    angleDeg: number;
    divergence: number; // positive = expand, negative = compress
    curl: number; // angular rotational velocity (pinwheel / spiral)
  };
  dominantColors: ColorSwatch[];
  spatialSpread: '1D_strand' | '2D_surface' | 'radial' | 'full_wash';
  roiPixelsDownsampled?: Uint8ClampedArray; // Downsampled 32x32 RGBA buffer for offscreen canvas Visual Truth verification
}

export type WaveformPattern =
  | 'Strobe / Shutter Pulse'
  | 'Linear Ramp-Up'
  | 'Linear Ramp-Down'
  | 'Sinusoidal Shimmer'
  | 'Triangle Wave'
  | 'Square Hold'
  | 'Twinkle / Sparkle'
  | 'Moving Strand Pulse';

export type MotionDirection =
  | 'Left to Right'
  | 'Right to Left'
  | 'Up (Bottom to Top)'
  | 'Down (Top to Bottom)'
  | 'Radial Clockwise'
  | 'Radial Counter-Clockwise'
  | 'Helical Spiral (Clockwise)'
  | 'Helical Spiral (Counter-Clockwise)'
  | 'Expand (Outward)'
  | 'Compress (Inward)'
  | 'Bouncing / Oscillating'
  | 'Stationary / Non-directional';

export interface RepeatingCycleInstance {
  passNumber: number;
  startMs: number;
  endMs: number;
  durationMs: number;
  similarityToCanonical: number; // 0..100%
  phaseLockedCorrelation: number; // 0..1
  motionDirection: MotionDirection;
  averageLuminance: number;
}

export interface BehavioralPhase {
  type: 'repeating_loop' | 'intro_transition' | 'outro_fade' | 'new_behavior';
  startMs: number;
  endMs: number;
  label: string;
  description: string;
  stabilityScore: number; // 0..100%
}

export interface WholeClipSurveyResult {
  totalClipDurationMs: number;
  fps: number;
  hasRepeatingPattern: boolean;
  cyclePeriodMs: number;
  detectedCycleCount: number;
  confidenceAmplificationBonus: number; // e.g. +14%
  cycleInstances: RepeatingCycleInstance[];
  behavioralPhases: BehavioralPhase[];
  canonicalPassSummary?: {
    dominantFrequencyHz: number;
    patternStabilityPct: number;
    noiseFilteredLuminanceCurve: number[];
  };
}

export interface TemporalExtractionSummary {
  totalFramesAnalyzed: number;
  stepIntervalMs: TimingInterval;
  fps: number;
  durationMs: number;
  timeRange: { startMs: number; endMs: number };
  waveformPattern: WaveformPattern;
  motionDirection: MotionDirection;
  motionSpeedScore: number; // 0..100
  spatialDensity: '1D_strand' | '2D_surface' | 'radial' | 'full_wash';
  activePalette: ColorSwatch[];
  luminanceCurve: number[]; // array of normalized luminance values for graphing
  opticalFlowMagnitudeCurve: number[];
  frames: FrameFeature[];
  wholeClipSurvey?: WholeClipSurveyResult;
}

export interface ComparisonScore {
  luminanceCorrelation: number; // 0..100
  motionCosineSimilarity: number; // 0..100
  colorDeltaSimilarity: number; // 0..100
  overallMatchPercentage: number; // 0.0 .. 100.0
  notes: string;
  visualTruthDelta?: number; // 0..100% pixel-level difference against off-screen rendered truth
  visualTruthPassed?: boolean;
  visualTruthThreshold?: number;
  isInvalidCandidate?: boolean;
  rejectionReason?: string;
}

export interface IterationPass {
  passNumber: number;
  effectName: string;
  settings: Record<string, string | number | boolean>;
  score: ComparisonScore;
  deltasApplied: string[];
  simulatedPreviewUrl?: string; // Data URL of simulated representative frame
  isValid?: boolean; // Visual Truth verification pass/fail status
  visualTruthDelta?: number;
  invalidReason?: string;
  versionTitle?: string; // e.g. "v2.0 - Structural Geometry & Velocity Sync"
  macroPatches?: string[];
  microTunings?: string[];
  releaseRationale?: string;
  multiLayerStack?: SequencerLayerInstruction[];
  stepByStepGuide?: string[];
}

export interface SequencerLayerInstruction {
  layerIndex: number;
  layerName: string;
  effectName: string;
  blendingMode: LayerBlendingMode;
  submodelTarget: string;
  timing: {
    startMs: number;
    endMs: number;
    durationMs: number;
    timingTrack: string;
  };
  palette: ColorSwatch[];
  settings: Record<string, string | number | boolean>;
  valueCurves?: Record<
    string,
    {
      curveType: 'Linear' | 'Ramp Up' | 'Ramp Down' | 'Sawtooth' | 'Sine' | 'Custom';
      description: string;
    }
  >;
  stepInstruction: string;
}

export interface XLightsRecipe {
  id: string;
  label: string; // e.g. "Recipe A (Primary / Direct Strand)"
  isPrimary: boolean;
  effectName: string; // Exact toolbar effect name (e.g. "Single Strand", "Bars", etc.)
  targetProp: PropModelType;
  submodelTarget: string;
  timing: {
    startMs: number;
    endMs: number;
    durationMs: number;
    timingTrack: string; // e.g. "50ms Beat Track" or "25ms High Definition"
  };
  layerIndex: number;
  layerBlending: LayerBlendingMode;
  inTransition: {
    type: 'None' | 'Fade' | 'Wipe' | 'Push' | 'Slide' | 'Dissolve';
    durationMs: number;
  };
  outTransition: {
    type: 'None' | 'Fade' | 'Wipe' | 'Push' | 'Slide' | 'Dissolve';
    durationMs: number;
  };
  palette: ColorSwatch[];
  settings: Record<string, string | number | boolean>;
  valueCurves?: Record<
    string,
    {
      curveType: 'Linear' | 'Ramp Up' | 'Ramp Down' | 'Sawtooth' | 'Sine' | 'Custom';
      description: string;
    }
  >;
  multiLayerStack?: SequencerLayerInstruction[];
  recommendedGroups?: string[];
  stepByStepGuide?: string[];
  tradeOff: {
    effort: 'Low' | 'Medium' | 'High';
    visualMatchPercentage: number;
    description: string;
  };
  rationale: string;
  xmlClipboardSnippet: string;
  // Simulation comparison & self-grading
  simulationScore?: ComparisonScore;
  iterationHistory?: IterationPass[];
}

export interface ClarificationQuestion {
  id: string;
  title: string;
  explanation: string;
  options: Array<{
    label: string;
    description: string;
    action: (cfg: UserContextConfig) => UserContextConfig;
  }>;
}

export interface AnalysisSession {
  id: string;
  name: string;
  createdAt: string;
  streamSource: any;
  videoSourceUrl: string | null;
  presetId?: string;
  roi: RoiBox;
  timeRange: { startMs: number; endMs: number };
  currentTimeMs: number;
  userConfig: UserContextConfig;
  analysisResult: AnalysisDeductionResult | null;
}

export interface CustomPreset {
  id: string;
  name: string;
  category: string;
  propType: PropModelType;
  geometry: PropGeometry;
  durationMs: number;
  stepIntervalMs: 25 | 50;
  description: string;
  defaultRoi: RoiBox;
}

export interface AnalysisDeductionResult {
  confidenceScore: number; // 0..100
  isAmbiguous: boolean;
  ambiguityNotice?: string;
  clarificationRequired?: ClarificationQuestion | null;
  summary: TemporalExtractionSummary;
  primaryRecipe: XLightsRecipe;
  alternativeRecipes: XLightsRecipe[];
  diagnostics: {
    opticalFlowAlgorithm: string;
    backgroundFilter: string;
    detectedCyclesPerSecond: number;
    dutyCyclePercent: number;
    renderTimeMs: number;
  };
  iterationPasses: IterationPass[];
}
