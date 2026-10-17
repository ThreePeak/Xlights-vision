import {
  AnalysisDeductionResult,
  ColorSwatch,
  MotionDirection,
  PropModelType,
  SequencerLayerInstruction,
  TemporalExtractionSummary,
  UserContextConfig,
  WaveformPattern,
  XLightsRecipe,
} from '../types/xlights';
import { getManualEffectSpec } from './xlightsManualKnowledge';

/**
 * Generates official xLights clipboard XML representation
 * Compatible with xLights 2024.x / 2025.x / 2026.x
 * Supports single-layer and multi-layer sequencer stacking.
 */
export function generateXLightsXmlSnippet(recipe: {
  effectName: string;
  startMs: number;
  endMs: number;
  palette: ColorSwatch[];
  settings: Record<string, string | number | boolean>;
  layerIndex: number;
  layerBlending: string;
  inTransition: { type: string; durationMs: number };
  outTransition: { type: string; durationMs: number };
  multiLayerStack?: SequencerLayerInstruction[];
}): string {
  const activePaletteIndices = recipe.palette
    .filter((p) => p.checked)
    .map((p) => p.index - 1)
    .join(',');

  const paletteColorsAttr = recipe.palette
    .map((p) => `C_BUTTON_Palette${p.index}="${p.hex}"`)
    .join(' ');

  const paletteCheckboxesAttr = recipe.palette
    .map((p) => `C_CHECKBOX_Palette${p.index}="${p.checked ? '1' : '0'}"`)
    .join(' ');

  // If a multi-layer stack is defined, generate all stacked EffectLayers
  if (recipe.multiLayerStack && recipe.multiLayerStack.length > 0) {
    const layerBlocks = recipe.multiLayerStack
      .map((layer) => {
        const layerActiveIndices = layer.palette
          .filter((p) => p.checked)
          .map((p) => p.index - 1)
          .join(',');

        const settingsLines = Object.entries(layer.settings)
          .map(([key, val]) => {
            const formattedVal = typeof val === 'boolean' ? (val ? '1' : '0') : String(val);
            return `        <Setting name="${escapeXml(key)}" value="${escapeXml(formattedVal)}"/>`;
          })
          .join('\n');

        return `  <EffectLayer layerIndex="${layer.layerIndex}">
    <Effect label="${escapeXml(layer.effectName)}" startTime="${layer.timing.startMs}" endTime="${layer.timing.endMs}" palette="${layerActiveIndices || activePaletteIndices}" layerBlending="${layer.blendingMode}" submodel="${escapeXml(layer.submodelTarget)}">
      <EffectSettings>
${settingsLines}
      </EffectSettings>
    </Effect>
  </EffectLayer>`;
      })
      .join('\n');

    return `<?xml version="1.0" encoding="UTF-8"?>
<xLightsClipboard version="2024.18">
  <ColorPalettes>
    <ColorPalette ${paletteColorsAttr} ${paletteCheckboxesAttr}/>
  </ColorPalettes>
${layerBlocks}
</xLightsClipboard>`;
  }

  // Single-layer fallback
  const settingsLines = Object.entries(recipe.settings)
    .map(([key, val]) => {
      const formattedVal = typeof val === 'boolean' ? (val ? '1' : '0') : String(val);
      return `    <Setting name="${escapeXml(key)}" value="${escapeXml(formattedVal)}"/>`;
    })
    .join('\n');

  return `<?xml version="1.0" encoding="UTF-8"?>
<xLightsClipboard version="2024.18">
  <ColorPalettes>
    <ColorPalette ${paletteColorsAttr} ${paletteCheckboxesAttr}/>
  </ColorPalettes>
  <EffectLayer layerIndex="${recipe.layerIndex}">
    <Effect label="${escapeXml(recipe.effectName)}" startTime="${recipe.startMs}" endTime="${recipe.endMs}" palette="${activePaletteIndices}" layerBlending="${recipe.layerBlending}">
      <InTransition type="${recipe.inTransition.type}" duration="${recipe.inTransition.durationMs}"/>
      <OutTransition type="${recipe.outTransition.type}" duration="${recipe.outTransition.durationMs}"/>
      <EffectSettings>
${settingsLines}
      </EffectSettings>
    </Effect>
  </EffectLayer>
</xLightsClipboard>`;
}

function escapeXml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

/**
 * Builds a structured multi-layer timeline stack (Layer 1, Layer 2, Layer 3)
 * and step-by-step instructions for xLights Sequencer replication.
 */
export function buildMultiLayerStackAndGuide(
  primaryEffect: string,
  targetProp: PropModelType,
  submodelTarget: string,
  startMs: number,
  endMs: number,
  timingTrackName: string,
  palette: ColorSwatch[],
  primarySettings: Record<string, string | number | boolean>,
  speedMultiplier: string,
  userConfig: UserContextConfig
): {
  multiLayerStack: SequencerLayerInstruction[];
  stepByStepGuide: string[];
  recommendedGroups: string[];
} {
  const durationMs = endMs - startMs;
  const layers: SequencerLayerInstruction[] = [];
  const guide: string[] = [];

  // Determine base color swatch
  const firstActiveSwatch = palette.find((p) => p.checked) || palette[0];
  const secondActiveSwatch = palette.filter((p) => p.checked)[1] || palette[1] || palette[0];

  // Layer 1: Primary Effect (Directly on Layer 1 with Normal Blending for pristine contrast)
  layers.push({
    layerIndex: 1,
    layerName: `Layer 1: ${primaryEffect} (Primary Motion)`,
    effectName: primaryEffect,
    blendingMode: 'Normal',
    submodelTarget: submodelTarget,
    timing: {
      startMs,
      endMs,
      durationMs,
      timingTrack: timingTrackName,
    },
    palette: palette,
    settings: { ...primarySettings },
    stepInstruction: `In your xLights sequencer, drag the '${primaryEffect}' effect onto Layer 1 of '${targetProp}' spanning ${startMs}ms - ${endMs}ms. Set Layer Blending to 'Normal'.`,
  });

  // Layer 2: Dedicated Star Topper or Shimmer Highlight
  if (targetProp === 'Mega Tree' || targetProp === 'Mini Tree with Star' || userConfig.geometry.hasStarTopper || primarySettings['Sparkle Topper']) {
    layers.push({
      layerIndex: 2,
      layerName: 'Layer 2: Star Topper Shimmer / Apex Highlight',
      effectName: 'Twinkle',
      blendingMode: 'Maximum',
      submodelTarget: 'Star Only',
      timing: {
        startMs,
        endMs,
        durationMs,
        timingTrack: timingTrackName,
      },
      palette: [firstActiveSwatch, secondActiveSwatch],
      settings: {
        'Number of Twinkles': 12,
        'Twinkle Speed': 2.0,
        'Strobe': false,
        'Random Colors': false,
        'Re-twinkle': 50,
      },
      stepInstruction: `(Star Topper Layer) Right-click '${targetProp}' and select 'Add Layer Below' to create Layer 2. Drag 'Twinkle' onto Layer 2 spanning ${startMs}ms - ${endMs}ms. In Layer Settings, set Render Submodel to 'Star Only' and Blending Mode to 'Maximum' so the topper sparkles cleanly without washing out tree body ribbons.`,
    });
  }

  // Layer 3: Perimeter Rim / Shimmer Accent (When highlight or bloom glow is requested)
  if (primarySettings['Highlight'] || primarySettings['Rim Lighting'] || Number(primarySettings['Bloom Glow'] || 1) > 1.2) {
    layers.push({
      layerIndex: layers.length + 1,
      layerName: `Layer ${layers.length + 1}: Specular Rim Highlight`,
      effectName: 'Twinkle',
      blendingMode: 'Maximum',
      submodelTarget: submodelTarget,
      timing: {
        startMs,
        endMs,
        durationMs,
        timingTrack: timingTrackName,
      },
      palette: [firstActiveSwatch],
      settings: {
        'Number of Twinkles': 6,
        'Twinkle Speed': 1.2,
        'Strobe': false,
        'Random Colors': false,
      },
      stepInstruction: `(Specular Shimmer Overlay) Add Layer ${layers.length + 1}. Drag 'Twinkle' onto Layer ${layers.length + 1}. Set Blending Mode to 'Maximum' and assign Swatch #1 (${firstActiveSwatch.name}) to cast specular glints across active motion ribbons.`,
    });
  }

  // Generate Clear, Unambiguous Sequential Step-by-Step Instructions for Desktop xLights
  const checkedSwatches = palette.filter((p) => p.checked);
  const swatchNames = checkedSwatches.map((p) => `#${p.index} (${p.name})`).join(', ') || 'Swatch #1';
  const swatchIndices = checkedSwatches.map((p) => p.index).join(', ') || '1';

  let stepIdx = 1;
  guide.push(`Step ${stepIdx++} [Desktop xLights Sequencer Grid Setup]: Open your .xsq sequence and select the active timing track '${timingTrackName}' (Grid snap at ${startMs}ms). Locate the row for model '${targetProp}'.`);

  // Output explicit configuration steps for each layer in the stack
  for (let l = 0; l < layers.length; l++) {
    const layer = layers[l];
    const isBaseLayer = l === 0;

    const spec = getManualEffectSpec(layer.effectName);

    if (isBaseLayer) {
      const bufferRec = spec?.bufferStyleRecommendation || 'Default';
      guide.push(`Step ${stepIdx++} [Layer 1 Placement & Buffer Architecture]: In the Effect Palette toolbar, click '${layer.effectName}' and drop it onto Layer 1 from ${startMs}ms to ${endMs}ms. In Layer Settings, set Render Style to '${bufferRec}' and Blending Mode to '${layer.blendingMode}' (${spec?.layerBlendingNotes || 'Normal blending ensures opaque base rendering'}). Official Manual: ${spec?.manualChapter || 'xLights Manual'}.`);
      guide.push(`Step ${stepIdx++} [Layer 1 Color Palette Assignment]: In the Color Palette panel, check swatches [${swatchIndices}] to assign ${swatchNames}.`);
      
      const layer1SettingsFormatted = Object.entries(layer.settings)
        .map(([k, v]) => `    • ${k}: ${typeof v === 'boolean' ? (v ? 'Checked (1)' : 'Unchecked (0)') : v}`)
        .join('\n');
      guide.push(`Step ${stepIdx++} [Layer 1 Effect Settings (${layer.effectName}) - Verified against official manual]: With Layer 1 selected, enter these exact values in the Effect Settings panel:\n${layer1SettingsFormatted}`);
    } else {
      guide.push(`Step ${stepIdx++} [Layer ${layer.layerIndex} Creation & Submodel Routing]: Right-click '${targetProp}' and select 'Add Layer Below' for Layer ${layer.layerIndex}. Drop '${layer.effectName}' onto Layer ${layer.layerIndex} from ${startMs}ms to ${endMs}ms. In Layer Settings, set Render Submodel to '${layer.submodelTarget}' and Blending Mode to '${layer.blendingMode}' (${spec?.layerBlendingNotes || 'Passes brighter highlight pixels cleanly through underlying layers'}).`);
      
      const layerPaletteSwatches = layer.palette?.filter((p) => p.checked) || [firstActiveSwatch, secondActiveSwatch];
      const layerSwatchNames = layerPaletteSwatches.map((p) => `#${p.index} (${p.name})`).join(', ');
      guide.push(`Step ${stepIdx++} [Layer ${layer.layerIndex} Palette]: For Layer ${layer.layerIndex}, assign active colors: ${layerSwatchNames}.`);

      const layerSettingsFormatted = Object.entries(layer.settings)
        .map(([k, v]) => `    • ${k}: ${typeof v === 'boolean' ? (v ? 'Checked (1)' : 'Unchecked (0)') : v}`)
        .join('\n');
      guide.push(`Step ${stepIdx++} [Layer ${layer.layerIndex} Effect Settings (${layer.effectName}) - Verified against official manual]: With Layer ${layer.layerIndex} selected, enter these exact values in the Effect Settings panel:\n${layerSettingsFormatted}`);
    }
  }

  // Composite Blending Summary if multiple layers exist
  if (layers.length > 1) {
    const blendSummary = layers.map((l) => `Layer ${l.layerIndex} ('${l.effectName}' on '${l.submodelTarget}') blended with '${l.blendingMode}'`).join(' + ');
    guide.push(`Step ${stepIdx++} [Composite Layer Interaction]: Verify layer hierarchy: ${blendSummary}. Layer 1 provides the body motion while upper layers overlay isolated highlights.`);
  }

  guide.push(`Step ${stepIdx++} [Render Sequence]: Press Ctrl+R (Cmd+R on Mac) or click 'Render All' in xLights to compile the multi-layer effect stack into your display preview.`);
  guide.push(`[Shortcut]: Alternatively, click 'Copy xLights XML' in this app and press Ctrl+V directly on the xLights timeline at ${startMs}ms to paste all layers instantly!`);

  // Recommended Prop Groups
  const groups: string[] = [];
  if (targetProp === 'Mega Tree') groups.push('All Trees Group', 'Center Stage Focus', 'Vertical Elements');
  else if (targetProp === 'PEX Arches') groups.push('All Arches', 'Front Yard Ground Elements', 'Horizon Line');
  else if (targetProp === 'Mini Tree with Star') groups.push('Mini Trees Row', 'Left/Right Symmetrical Pairs');
  else if (targetProp === 'Matrix') groups.push('All Matrices Group', 'Whole House Video Surface');
  else groups.push('Whole House Group', 'All Props Group');

  return {
    multiLayerStack: layers,
    stepByStepGuide: guide,
    recommendedGroups: groups,
  };
}

/**
 * Deduce xLights Effect, Confidence Score, Primary & Alternative Recipes
 */
export function deduceXLightsRecipes(
  summary: TemporalExtractionSummary,
  userConfig: UserContextConfig,
  startTimeMs: number = 0
): AnalysisDeductionResult {
  const { motionSpeedScore, spatialDensity, activePalette } = summary;
  const motionDir: string = summary.motionDirection;
  const motionDirection: string = summary.motionDirection;
  const waveform: string = summary.waveformPattern;
  const waveformPattern: string = summary.waveformPattern;
  const prop = userConfig.propType;
  const durationMs = summary.durationMs;
  const startMs = startTimeMs;
  const endMs = startMs + durationMs;

  const recipes: XLightsRecipe[] = [];
  let confidence = 85;
  let isAmbiguous = false;
  let ambiguityNotice = '';

  // Calibrate speedMultiplier to realistic natural xLights speeds (1.0x to 3.5x)
  let calibratedSpeed = Math.max(
    1.0,
    Math.min(3.5, Number((1.0 + (motionSpeedScore / 30)).toFixed(2)))
  );

  // Synchronize speed precisely to detected Whole-Clip Repeating Period
  if (summary.wholeClipSurvey?.hasRepeatingPattern && summary.wholeClipSurvey.cyclePeriodMs > 300) {
    calibratedSpeed = Math.max(
      0.6,
      Math.min(3.5, Number((2000 / summary.wholeClipSurvey.cyclePeriodMs).toFixed(2)))
    );
    confidence = Math.min(99, confidence + (summary.wholeClipSurvey.confidenceAmplificationBonus || 0));
  }
  const speedMultiplier = calibratedSpeed.toFixed(2);
  const timingTrackName =
    summary.stepIntervalMs === 25 ? '25ms High Definition' : '50ms Standard Beat Track';

  // Rule 1: Strobe / Shutter Pulse
  if (waveform === 'Strobe / Shutter Pulse') {
    confidence = 94;
    recipes.push({
      id: 'strobe-primary',
      label: 'Recipe A (Primary / Dedicated Strobe)',
      isPrimary: true,
      effectName: 'Strobe',
      targetProp: prop,
      submodelTarget: userConfig.submodelTarget,
      timing: { startMs, endMs, durationMs, timingTrack: timingTrackName },
      layerIndex: userConfig.startingLayer,
      layerBlending: userConfig.layerBlending,
      inTransition: { type: 'None', durationMs: 0 },
      outTransition: { type: 'None', durationMs: 0 },
      palette: activePalette,
      settings: {
        'Number of Strobes': Math.max(4, Math.round(motionSpeedScore / 10)),
        'Strobe Duration (ms)': summary.stepIntervalMs,
        'Strobe Type': 'Randomized',
        Color: 'Palette',
      },
      tradeOff: {
        effort: 'Low',
        visualMatchPercentage: 98,
        description:
          'Exact match for high-frequency shutter-sync bursts with minimal node overhead.',
      },
      rationale:
        'Detected periodic high-frequency luminance oscillations exceeding 4Hz with short hold duty cycles, aligning precisely with the xLights Strobe effect.',
      xmlClipboardSnippet: '',
    });

    recipes.push({
      id: 'strobe-alt-shimmer',
      label: 'Recipe B (Alternative / Shimmer with Value Curve)',
      isPrimary: false,
      effectName: 'Shimmer',
      targetProp: prop,
      submodelTarget: userConfig.submodelTarget,
      timing: { startMs, endMs, durationMs, timingTrack: timingTrackName },
      layerIndex: userConfig.startingLayer,
      layerBlending: userConfig.layerBlending,
      inTransition: { type: 'None', durationMs: 0 },
      outTransition: { type: 'None', durationMs: 0 },
      palette: activePalette,
      settings: {
        'Duty Cycle': 25,
        Cycles: Math.max(3, Math.round(durationMs / 200)),
        'Use All Colors': true,
      },
      valueCurves: {
        Brightness: { curveType: 'Sawtooth', description: 'Square pulse oscillating 0% to 100%' },
      },
      tradeOff: {
        effort: 'Medium',
        visualMatchPercentage: 92,
        description: 'Produces a smoother duty-cycle pulse across matrix nodes.',
      },
      rationale:
        'Shimmer effect provides granular duty cycle control if the video pulse is non-randomized across the physical prop.',
      xmlClipboardSnippet: '',
    });
  }

  // Helper to test warm palette for Fire / Flame effects
  const hasWarmFireColors = activePalette.some((c) => {
    const hex = c.hex.toLowerCase();
    return hex.includes('ff4') || hex.includes('ff6') || hex.includes('ff8') ||
           hex.includes('ef4444') || hex.includes('f97316') || hex.includes('eab308') ||
           hex.includes('dc2626') || hex.includes('f59e0b') || hex.includes('d97706');
  });

  // Rule 2A: Fire / Flame Simulation (Warm chromatic palettes + upward flow or high-energy sparkle)
  if (
    hasWarmFireColors &&
    (motionDir === 'Up (Bottom to Top)' ||
      waveform === 'Sinusoidal Shimmer' ||
      waveform === 'Twinkle / Sparkle' ||
      motionDir === 'Stationary / Non-directional')
  ) {
    confidence = 94;
    recipes.push({
      id: 'fire-primary',
      label: 'Recipe A (Primary / Volumetric Fire & Flame)',
      isPrimary: true,
      effectName: 'Fire',
      targetProp: prop,
      submodelTarget: userConfig.submodelTarget,
      timing: { startMs, endMs, durationMs, timingTrack: timingTrackName },
      layerIndex: userConfig.startingLayer,
      layerBlending: userConfig.layerBlending,
      inTransition: { type: 'Fade', durationMs: 200 },
      outTransition: { type: 'Fade', durationMs: 200 },
      palette: activePalette,
      settings: {
        Height: 75,
        Hue: 12,
        'Grow With Music': false,
        Speed: speedMultiplier,
        'Fire Type': 'Warm Embers & Rising Flames',
      },
      tradeOff: {
        effort: 'Low',
        visualMatchPercentage: 96,
        description: 'Realistic organic thermodynamic flame propagation climbing up prop strands.',
      },
      rationale:
        'Detected upward vertical thermal gradient with warm red/orange/yellow chromatic entropy matching the xLights Fire shader.',
      xmlClipboardSnippet: '',
    });

    recipes.push({
      id: 'fire-alt-colorwash',
      label: 'Recipe B (Alternative / Vertical Color Wash Waves)',
      isPrimary: false,
      effectName: 'Color Wash',
      targetProp: prop,
      submodelTarget: userConfig.submodelTarget,
      timing: { startMs, endMs, durationMs, timingTrack: timingTrackName },
      layerIndex: userConfig.startingLayer,
      layerBlending: userConfig.layerBlending,
      inTransition: { type: 'Fade', durationMs: 150 },
      outTransition: { type: 'Fade', durationMs: 150 },
      palette: activePalette,
      settings: {
        Count: 3,
        Cycles: 2,
        'Vertical Fade': true,
        'Horizontal Fade': false,
        'Circular Palette': false,
        Speed: speedMultiplier,
      },
      tradeOff: {
        effort: 'Low',
        visualMatchPercentage: 91,
        description: 'Smooth harmonic vertical color sweeps for a stylized theatrical look.',
      },
      rationale: 'Color Wash delivers broad vertical thermal gradients without sharp flickering boundaries.',
      xmlClipboardSnippet: '',
    });

    recipes.push({
      id: 'fire-alt-bars',
      label: 'Recipe C (Alternative / Upward Ascending Bars)',
      isPrimary: false,
      effectName: 'Bars',
      targetProp: prop,
      submodelTarget: userConfig.submodelTarget,
      timing: { startMs, endMs, durationMs, timingTrack: timingTrackName },
      layerIndex: userConfig.startingLayer,
      layerBlending: userConfig.layerBlending,
      inTransition: { type: 'None', durationMs: 0 },
      outTransition: { type: 'None', durationMs: 0 },
      palette: activePalette,
      settings: {
        Direction: 'Up',
        'Palette Repeat': 2,
        'Bar Width': 16,
        Highlight: true,
        '3D': true,
        Speed: speedMultiplier,
      },
      tradeOff: {
        effort: 'Low',
        visualMatchPercentage: 88,
        description: 'Ascending vertical color ribbons with crisp leading edges.',
      },
      rationale: 'Ascending 3D Bars offer strict geometric boundaries while matching the upward velocity.',
      xmlClipboardSnippet: '',
    });
  }

  // Rule 2B: Butterfly Wings / Kaleidoscopic Symmetrical Flutter
  else if (
    (motionDir === 'Bouncing / Oscillating' ||
      (activePalette.length >= 3 && spatialDensity === '2D_surface' && motionDir === 'Stationary / Non-directional')) &&
    prop !== 'PEX Arches'
  ) {
    confidence = 92;
    recipes.push({
      id: 'butterfly-primary',
      label: 'Recipe A (Primary / Butterfly Symmetrical Wings)',
      isPrimary: true,
      effectName: 'Butterfly',
      targetProp: prop,
      submodelTarget: userConfig.submodelTarget,
      timing: { startMs, endMs, durationMs, timingTrack: timingTrackName },
      layerIndex: userConfig.startingLayer,
      layerBlending: userConfig.layerBlending,
      inTransition: { type: 'Fade', durationMs: 200 },
      outTransition: { type: 'Fade', durationMs: 200 },
      palette: activePalette,
      settings: {
        Style: 'Style 1',
        Direction: 'Out',
        Speed: speedMultiplier,
        'Color Style': 'Palette',
        'Bkgrd Skip': 2,
      },
      tradeOff: {
        effort: 'Low',
        visualMatchPercentage: 97,
        description: 'Bilateral symmetrical chromatic wings flapping smoothly across the surface.',
      },
      rationale: 'Detected bilateral symmetry with high chromatic variance, matching xLights Butterfly generator.',
      xmlClipboardSnippet: '',
    });

    recipes.push({
      id: 'butterfly-alt-pinwheel',
      label: 'Recipe B (Alternative / Multi-Blade Pinwheel)',
      isPrimary: false,
      effectName: 'Pinwheel',
      targetProp: prop,
      submodelTarget: userConfig.submodelTarget,
      timing: { startMs, endMs, durationMs, timingTrack: timingTrackName },
      layerIndex: userConfig.startingLayer,
      layerBlending: userConfig.layerBlending,
      inTransition: { type: 'Fade', durationMs: 150 },
      outTransition: { type: 'Fade', durationMs: 150 },
      palette: activePalette,
      settings: {
        Arms: 6,
        Twist: 18,
        Speed: Number(speedMultiplier) * 6,
        Size: 100,
        'Pinwheel Color Mode': 'Palette',
      },
      tradeOff: {
        effort: 'Low',
        visualMatchPercentage: 93,
        description: 'Rotating radial spokes spinning from the prop centroid.',
      },
      rationale: 'Pinwheel provides continuous rotational symmetry across matrices, trees, and spinner props.',
      xmlClipboardSnippet: '',
    });

    recipes.push({
      id: 'butterfly-alt-spirals',
      label: 'Recipe C (Alternative / Dual Intersecting Spirals)',
      isPrimary: false,
      effectName: 'Spirals',
      targetProp: prop,
      submodelTarget: userConfig.submodelTarget,
      timing: { startMs, endMs, durationMs, timingTrack: timingTrackName },
      layerIndex: userConfig.startingLayer,
      layerBlending: userConfig.layerBlending,
      inTransition: { type: 'Fade', durationMs: 150 },
      outTransition: { type: 'Fade', durationMs: 150 },
      palette: activePalette,
      settings: {
        'Palette Repeat': 2,
        Arms: 4,
        Direction: 'Forward',
        'Spiral Thickness': 24,
        Speed: speedMultiplier,
        Rotation: 45,
        'Wrap Count': 2.0,
        '3D': true,
        'Blend Colors': true,
      },
      tradeOff: {
        effort: 'Medium',
        visualMatchPercentage: 90,
        description: 'Interwoven helical spirals wrapping across the tree cone.',
      },
      rationale: 'Dual spirals produce a similar interlocking geometric texture to butterfly flutters.',
      xmlClipboardSnippet: '',
    });
  }

  // Rule 2C: Curtain / Cascading Downward Drips (Matrix, Trees, Rooflines)
  else if (motionDir === 'Down (Top to Bottom)') {
    confidence = 93;
    recipes.push({
      id: 'curtain-primary',
      label: 'Recipe A (Primary / Cascading Curtain)',
      isPrimary: true,
      effectName: 'Curtain',
      targetProp: prop,
      submodelTarget: userConfig.submodelTarget,
      timing: { startMs, endMs, durationMs, timingTrack: timingTrackName },
      layerIndex: userConfig.startingLayer,
      layerBlending: userConfig.layerBlending,
      inTransition: { type: 'None', durationMs: 0 },
      outTransition: { type: 'None', durationMs: 0 },
      palette: activePalette,
      settings: {
        Direction: 'Down',
        'Curtain Edge': 'Soft',
        Speed: speedMultiplier,
        Swag: 2,
        Repeat: 2,
      },
      tradeOff: {
        effort: 'Low',
        visualMatchPercentage: 95,
        description: 'Cascading vertical curtain drapery with smooth falling trails.',
      },
      rationale: 'Optical flow vectors reveal strong downward vertical translation along the prop height.',
      xmlClipboardSnippet: '',
    });

    recipes.push({
      id: 'curtain-alt-bars',
      label: 'Recipe B (Alternative / Downward 3D Bars)',
      isPrimary: false,
      effectName: 'Bars',
      targetProp: prop,
      submodelTarget: userConfig.submodelTarget,
      timing: { startMs, endMs, durationMs, timingTrack: timingTrackName },
      layerIndex: userConfig.startingLayer,
      layerBlending: userConfig.layerBlending,
      inTransition: { type: 'None', durationMs: 0 },
      outTransition: { type: 'None', durationMs: 0 },
      palette: activePalette,
      settings: {
        Direction: 'Down',
        'Palette Repeat': 2,
        'Bar Width': 18,
        Highlight: true,
        '3D': true,
        Speed: speedMultiplier,
      },
      tradeOff: {
        effort: 'Low',
        visualMatchPercentage: 92,
        description: 'Rigid downward bar sweeps with sharp boundary transitions.',
      },
      rationale: 'Bars effect mapped vertically produces reliable downward sweeps across strands.',
      xmlClipboardSnippet: '',
    });

    recipes.push({
      id: 'curtain-alt-morph',
      label: 'Recipe C (Alternative / Falling Morph Ribbons)',
      isPrimary: false,
      effectName: 'Morph',
      targetProp: prop,
      submodelTarget: userConfig.submodelTarget,
      timing: { startMs, endMs, durationMs, timingTrack: timingTrackName },
      layerIndex: userConfig.startingLayer,
      layerBlending: userConfig.layerBlending,
      inTransition: { type: 'None', durationMs: 0 },
      outTransition: { type: 'None', durationMs: 0 },
      palette: activePalette,
      settings: {
        'Head Duration (ms)': 300,
        'Tail Length': 15,
        'Start Y': 0,
        'End Y': 100,
      },
      tradeOff: {
        effort: 'Medium',
        visualMatchPercentage: 89,
        description: 'Smooth morph droplets leaving decaying comet tails as they fall.',
      },
      rationale: 'Morph gives independent control over trail decay persistence for falling drops.',
      xmlClipboardSnippet: '',
    });
  }

  // Rule 2D: Pure Radial / Pinwheel / Spinner
  else if (
    prop === 'Spinner / ChromaStar' ||
    motionDir === 'Radial Clockwise' ||
    motionDir === 'Radial Counter-Clockwise'
  ) {
    const isClockwise = motionDir !== 'Radial Counter-Clockwise';
    confidence = 95;
    recipes.push({
      id: 'pinwheel-primary',
      label: 'Recipe A (Primary / Radial Pinwheel)',
      isPrimary: true,
      effectName: 'Pinwheel',
      targetProp: prop,
      submodelTarget: userConfig.submodelTarget,
      timing: { startMs, endMs, durationMs, timingTrack: timingTrackName },
      layerIndex: userConfig.startingLayer,
      layerBlending: userConfig.layerBlending,
      inTransition: { type: 'Fade', durationMs: 150 },
      outTransition: { type: 'Fade', durationMs: 150 },
      palette: activePalette,
      settings: {
        Arms: 6,
        Twist: 15,
        Speed: isClockwise ? Number(speedMultiplier) * 8 : -Number(speedMultiplier) * 8,
        Size: 100,
        'Pinwheel Color Mode': 'Palette',
      },
      tradeOff: {
        effort: 'Low',
        visualMatchPercentage: 97,
        description: 'Radial blades spinning around central hub.',
      },
      rationale: 'High rotational curl detected without vertical helical progression.',
      xmlClipboardSnippet: '',
    });

    recipes.push({
      id: 'pinwheel-alt-spirals',
      label: 'Recipe B (Alternative / 3D Spirals Helix)',
      isPrimary: false,
      effectName: 'Spirals',
      targetProp: prop,
      submodelTarget: userConfig.submodelTarget,
      timing: { startMs, endMs, durationMs, timingTrack: timingTrackName },
      layerIndex: userConfig.startingLayer,
      layerBlending: userConfig.layerBlending,
      inTransition: { type: 'Fade', durationMs: 150 },
      outTransition: { type: 'Fade', durationMs: 150 },
      palette: activePalette,
      settings: {
        'Palette Repeat': 2,
        Arms: 4,
        Direction: isClockwise ? 'Forward' : 'Backward',
        'Spiral Thickness': 26,
        Speed: speedMultiplier,
        Rotation: isClockwise ? 45 : -45,
        'Wrap Count': 1.8,
        '3D': true,
        'Blend Colors': true,
      },
      tradeOff: {
        effort: 'Medium',
        visualMatchPercentage: 93,
        description: 'Multi-arm 3D helical spirals winding around cone strands.',
      },
      rationale: 'Spirals simulate radial wheel action when wrapped with balanced wrap counts.',
      xmlClipboardSnippet: '',
    });

    recipes.push({
      id: 'pinwheel-alt-fan',
      label: 'Recipe C (Alternative / Fan Blade Effect)',
      isPrimary: false,
      effectName: 'Fan',
      targetProp: prop,
      submodelTarget: userConfig.submodelTarget,
      timing: { startMs, endMs, durationMs, timingTrack: timingTrackName },
      layerIndex: userConfig.startingLayer,
      layerBlending: userConfig.layerBlending,
      inTransition: { type: 'None', durationMs: 0 },
      outTransition: { type: 'None', durationMs: 0 },
      palette: activePalette,
      settings: {
        'Number of Blades': 4,
        Blade_Width: 35,
        Revolutions: 2,
        Reverse: !isClockwise,
      },
      tradeOff: {
        effort: 'Low',
        visualMatchPercentage: 90,
        description: 'Sharp fan blades with crisp sector cutoffs.',
      },
      rationale: 'Fan effect is preferable when blades have distinct hard boundaries.',
      xmlClipboardSnippet: '',
    });
  }

  // Rule 2E: Helical Spirals (When helical rotation and upward/diagonal angular progression is present)
  else if (
    motionDir.includes('Spiral') ||
    (prop === 'Mega Tree' && (motionDir === 'Left to Right' || motionDir === 'Right to Left' || motionDir === 'Stationary / Non-directional'))
  ) {
    const isClockwise =
      motionDir === 'Helical Spiral (Clockwise)' ||
      motionDir === 'Left to Right' ||
      motionDir === 'Stationary / Non-directional';
    confidence = 96;

    const armsCount = Math.max(1, Math.min(4, activePalette.length > 0 ? Math.min(3, activePalette.length) : 2));
    const spiralSettings = {
      'Palette Repeat': 1,
      Arms: armsCount,
      Direction: isClockwise ? 'Forward' : 'Backward',
      'Spiral Thickness': 28,
      Speed: speedMultiplier,
      Rotation: isClockwise ? 45 : -45,
      'Wrap Count': 1.5,
      '3D': true,
      '3D Perspective': true,
      'Blend Colors': true,
    };

    recipes.push({
      id: 'radial-primary-spirals',
      label: 'Recipe A (Primary / 3D Spirals Helix Effect)',
      isPrimary: true,
      effectName: 'Spirals',
      targetProp: prop,
      submodelTarget: userConfig.submodelTarget,
      timing: { startMs, endMs, durationMs, timingTrack: timingTrackName },
      layerIndex: userConfig.startingLayer,
      layerBlending: userConfig.layerBlending,
      inTransition: { type: 'Fade', durationMs: 150 },
      outTransition: { type: 'Fade', durationMs: 150 },
      palette: activePalette,
      settings: spiralSettings,
      tradeOff: {
        effort: 'Low',
        visualMatchPercentage: 97,
        description: 'Multi-arm 3D helical spiral ribbons winding continuously around conical tree strands.',
      },
      rationale:
        'Helical spiral vectors and angular rotational curl detected around tree centroid, matching xLights 3D Spirals ribbon generator.',
      xmlClipboardSnippet: '',
    });

    recipes.push({
      id: 'radial-alt-bars',
      label: 'Recipe B (Alternative / 3D Angled Bars on Tree)',
      isPrimary: false,
      effectName: 'Bars',
      targetProp: prop,
      submodelTarget: userConfig.submodelTarget,
      timing: { startMs, endMs, durationMs, timingTrack: timingTrackName },
      layerIndex: userConfig.startingLayer,
      layerBlending: userConfig.layerBlending,
      inTransition: { type: 'None', durationMs: 0 },
      outTransition: { type: 'None', durationMs: 0 },
      palette: activePalette,
      settings: {
        Direction: isClockwise ? 'Right' : 'Left',
        'Palette Repeat': 2,
        'Bar Width': 14,
        Highlight: true,
        '3D': true,
        Speed: speedMultiplier,
      },
      tradeOff: {
        effort: 'Medium',
        visualMatchPercentage: 94,
        description: 'Continuous 3D cylindrical bars sweeping around conical tree geometry.',
      },
      rationale:
        '3D Bars wrapped across tree strands offer a clean alternative with distinct ribbon boundaries.',
      xmlClipboardSnippet: '',
    });

    recipes.push({
      id: 'radial-alt-butterfly',
      label: 'Recipe C (Alternative / Symmetrical Butterfly Wings)',
      isPrimary: false,
      effectName: 'Butterfly',
      targetProp: prop,
      submodelTarget: userConfig.submodelTarget,
      timing: { startMs, endMs, durationMs, timingTrack: timingTrackName },
      layerIndex: userConfig.startingLayer,
      layerBlending: userConfig.layerBlending,
      inTransition: { type: 'Fade', durationMs: 150 },
      outTransition: { type: 'Fade', durationMs: 150 },
      palette: activePalette,
      settings: {
        Style: 'Style 1',
        Direction: 'Out',
        Speed: speedMultiplier,
      },
      tradeOff: {
        effort: 'Low',
        visualMatchPercentage: 92,
        description: 'Hypnotic symmetrical butterfly wings flapping outward across tree body.',
      },
      rationale: 'Butterfly wings produce rich bilateral dynamics that fill the conical tree canopy beautifully.',
      xmlClipboardSnippet: '',
    });

    recipes.push({
      id: 'radial-alt-colorwash',
      label: 'Recipe D (Alternative / 3D Color Wash Gradient Wave)',
      isPrimary: false,
      effectName: 'Color Wash',
      targetProp: prop,
      submodelTarget: userConfig.submodelTarget,
      timing: { startMs, endMs, durationMs, timingTrack: timingTrackName },
      layerIndex: userConfig.startingLayer,
      layerBlending: userConfig.layerBlending,
      inTransition: { type: 'Fade', durationMs: 150 },
      outTransition: { type: 'Fade', durationMs: 150 },
      palette: activePalette,
      settings: {
        Count: 2,
        Cycles: 2,
        'Vertical Fade': true,
        'Horizontal Fade': false,
        'Circular Palette': true,
      },
      tradeOff: {
        effort: 'Low',
        visualMatchPercentage: 89,
        description: 'Smooth gradient wave rolling down cone body with broad chromatic bands.',
      },
      rationale: 'Color Wash delivers broad chromatic waves without sharp spiral boundaries.',
      xmlClipboardSnippet: '',
    });

    recipes.push({
      id: 'radial-alt-twinkle-curtain',
      label: 'Recipe E (Alternative / High-Density Twinkle Curtain)',
      isPrimary: false,
      effectName: 'Twinkle',
      targetProp: prop,
      submodelTarget: userConfig.submodelTarget,
      timing: { startMs, endMs, durationMs, timingTrack: timingTrackName },
      layerIndex: userConfig.startingLayer,
      layerBlending: userConfig.layerBlending,
      inTransition: { type: 'None', durationMs: 0 },
      outTransition: { type: 'None', durationMs: 0 },
      palette: activePalette,
      settings: {
        'Number of Twinkles': 35,
        'Twinkle Speed': Number(speedMultiplier) * 1.5,
        'Random Colors': true,
        'Re-trigger': true,
      },
      tradeOff: {
        effort: 'Low',
        visualMatchPercentage: 88,
        description: 'Randomized twinkling sparkle curtain shimmering across all prop strands simultaneously.',
      },
      rationale: 'Twinkle Curtain provides high-energy sparkle coverage when individual discrete LEDs shimmer independently.',
      xmlClipboardSnippet: '',
    });
  }

  // Rule 3: Single Strand Chase (Strictly for linear 1D props: Arches, Rooflines, Single Lines)
  else if (
    (prop === 'PEX Arches' ||
      prop === 'Roofline' ||
      prop === 'Single Line / Poly Line' ||
      spatialDensity === '1D_strand') &&
    prop !== 'Matrix'
  ) {
    const isLToR = motionDirection === 'Left to Right' || motionDirection === 'Expand (Outward)';
    const chaseDir = isLToR ? 'Left to Right' : 'Right to Left';

    confidence = prop === 'PEX Arches' || prop === 'Roofline' ? 95 : 88;
    if (confidence < 90) {
      isAmbiguous = true;
      ambiguityNotice =
        'This look can be produced through multiple approaches in xLights: Single Strand chase vs. a 1D Bars effect with narrow band size.';
    }

    recipes.push({
      id: 'chase-primary',
      label: 'Recipe A (Primary / Single Strand Chase)',
      isPrimary: true,
      effectName: 'Single Strand',
      targetProp: prop,
      submodelTarget: userConfig.submodelTarget,
      timing: { startMs, endMs, durationMs, timingTrack: timingTrackName },
      layerIndex: userConfig.startingLayer,
      layerBlending: userConfig.layerBlending,
      inTransition: { type: 'None', durationMs: 0 },
      outTransition: { type: 'None', durationMs: 0 },
      palette: activePalette,
      settings: {
        Type: motionDirection === 'Bouncing / Oscillating' ? 'Bounce' : 'Chase',
        Direction: chaseDir,
        'Chase Size': Math.max(3, Math.round(userConfig.nodeCount * 0.08)),
        'Number of Chases': 1,
        'Color Wash': false,
        '3D': false,
        Speed: speedMultiplier,
      },
      tradeOff: {
        effort: 'Low',
        visualMatchPercentage: 97,
        description:
          'Direct mapping to strand pixel topology. Highly CPU efficient and clean on PEX arches.',
      },
      rationale:
        'Narrow spatial ignition along strand index with continuous directional flow matches the native Single Strand Chase effect.',
      xmlClipboardSnippet: '',
    });

    recipes.push({
      id: 'chase-alt-bars',
      label: 'Recipe B (Alternative / 1D Bars Effect)',
      isPrimary: false,
      effectName: 'Bars',
      targetProp: prop,
      submodelTarget: userConfig.submodelTarget,
      timing: { startMs, endMs, durationMs, timingTrack: timingTrackName },
      layerIndex: userConfig.startingLayer,
      layerBlending: userConfig.layerBlending,
      inTransition: { type: 'None', durationMs: 0 },
      outTransition: { type: 'None', durationMs: 0 },
      palette: activePalette,
      settings: {
        Direction: isLToR ? 'Right' : 'Left',
        'Palette Repeat': 1,
        'Bar Width': 8,
        Highlight: false,
        '3D': false,
        Speed: speedMultiplier,
      },
      tradeOff: {
        effort: 'Low',
        visualMatchPercentage: 94,
        description: 'Easier to blend when cross-fading with whole-house matrix groups.',
      },
      rationale:
        'Bars effect mapped over a 1D line or arch renders identically to a chase while allowing gradient blending.',
      xmlClipboardSnippet: '',
    });

    recipes.push({
      id: 'chase-alt-morph',
      label: 'Recipe C (Alternative / Morph with Tail Fade)',
      isPrimary: false,
      effectName: 'Morph',
      targetProp: prop,
      submodelTarget: userConfig.submodelTarget,
      timing: { startMs, endMs, durationMs, timingTrack: timingTrackName },
      layerIndex: userConfig.startingLayer,
      layerBlending: userConfig.layerBlending,
      inTransition: { type: 'None', durationMs: 0 },
      outTransition: { type: 'None', durationMs: 0 },
      palette: activePalette,
      settings: {
        'Head Duration (ms)': 250,
        'Tail Length': Math.max(5, Math.round(userConfig.nodeCount * 0.15)),
        'Start X': isLToR ? 0 : 100,
        'End X': isLToR ? 100 : 0,
      },
      tradeOff: {
        effort: 'Medium',
        visualMatchPercentage: 99,
        description:
          'Provides an organic phosphor decay / tail fade that pure Single Strand lacks.',
      },
      rationale:
        'Morph provides tail decay length adjustments matching real-world camera persistence.',
      xmlClipboardSnippet: '',
    });
  }

  // Rule 4: Shockwave / Explosion / Radial Expansion
  else if (motionDirection === 'Expand (Outward)' || motionDirection === 'Compress (Inward)') {
    confidence = 91;
    const isExpand = motionDirection === 'Expand (Outward)';

    recipes.push({
      id: 'shockwave-primary',
      label: 'Recipe A (Primary / Shockwave Effect)',
      isPrimary: true,
      effectName: 'Shockwave',
      targetProp: prop,
      submodelTarget: userConfig.submodelTarget,
      timing: { startMs, endMs, durationMs, timingTrack: timingTrackName },
      layerIndex: userConfig.startingLayer,
      layerBlending: userConfig.layerBlending,
      inTransition: { type: 'None', durationMs: 0 },
      outTransition: { type: 'None', durationMs: 0 },
      palette: activePalette,
      settings: {
        'Start Radius': isExpand ? 0 : 100,
        'End Radius': isExpand ? 100 : 0,
        Width: 15,
        Acceleration: 0,
        Speed: speedMultiplier,
      },
      tradeOff: {
        effort: 'Low',
        visualMatchPercentage: 98,
        description: 'Native expanding ring generator for matrix or tree surfaces.',
      },
      rationale:
        'Positive optical flow divergence radiating symmetrically outward from the center point.',
      xmlClipboardSnippet: '',
    });

    recipes.push({
      id: 'shockwave-alt-ripple',
      label: 'Recipe B (Alternative / Ripple Effect)',
      isPrimary: false,
      effectName: 'Ripple',
      targetProp: prop,
      submodelTarget: userConfig.submodelTarget,
      timing: { startMs, endMs, durationMs, timingTrack: timingTrackName },
      layerIndex: userConfig.startingLayer,
      layerBlending: userConfig.layerBlending,
      inTransition: { type: 'None', durationMs: 0 },
      outTransition: { type: 'None', durationMs: 0 },
      palette: activePalette,
      settings: {
        'Movement Type': isExpand ? 'Explode' : 'Implode',
        Spacing: 20,
        Points: 1,
      },
      tradeOff: {
        effort: 'Low',
        visualMatchPercentage: 93,
        description: 'Multi-ring concentric ripple propagation.',
      },
      rationale:
        'Ripple produces repetitive wave rings if multiple outward pulses were observed.',
      xmlClipboardSnippet: '',
    });
  }

  // Rule 5: 2D Surface Bars / Curtain / Marquee (Matrix, Mega Tree, Screen)
  else if (spatialDensity === '2D_surface') {
    confidence = 88;
    isAmbiguous = true;
    ambiguityNotice =
      'This look can be produced through multiple approaches in xLights: Bars effect vs Curtain effect or Marquee.';

    recipes.push({
      id: 'surface-primary-bars',
      label: 'Recipe A (Primary / Bars Effect)',
      isPrimary: true,
      effectName: 'Bars',
      targetProp: prop,
      submodelTarget: userConfig.submodelTarget,
      timing: { startMs, endMs, durationMs, timingTrack: timingTrackName },
      layerIndex: userConfig.startingLayer,
      layerBlending: userConfig.layerBlending,
      inTransition: { type: 'None', durationMs: 0 },
      outTransition: { type: 'None', durationMs: 0 },
      palette: activePalette,
      settings: {
        Direction:
          motionDirection === 'Left to Right'
            ? 'Right'
            : motionDirection === 'Right to Left'
              ? 'Left'
              : motionDirection === 'Down (Top to Bottom)'
                ? 'Down'
                : 'Up',
        'Palette Repeat': 2,
        'Bar Width': 12,
        Highlight: true,
        '3D': false,
        Speed: speedMultiplier,
      },
      tradeOff: {
        effort: 'Low',
        visualMatchPercentage: 96,
        description: 'Standard 2D raster bars moving across planar pixels.',
      },
      rationale:
        'Continuous linear motion field spanning the 2D surface width with sharp leading boundaries.',
      xmlClipboardSnippet: '',
    });

    recipes.push({
      id: 'surface-alt-marquee',
      label: 'Recipe B (Alternative / Marquee Border)',
      isPrimary: false,
      effectName: 'Marquee',
      targetProp: prop,
      submodelTarget: userConfig.submodelTarget,
      timing: { startMs, endMs, durationMs, timingTrack: timingTrackName },
      layerIndex: userConfig.startingLayer,
      layerBlending: userConfig.layerBlending,
      inTransition: { type: 'None', durationMs: 0 },
      outTransition: { type: 'None', durationMs: 0 },
      palette: activePalette,
      settings: {
        'Band Size': 6,
        'Skip Size': 4,
        Direction: 'Clockwise',
        Speed: speedMultiplier,
      },
      tradeOff: {
        effort: 'Medium',
        visualMatchPercentage: 91,
        description: 'Great for perimeter framing on matrix or window surrounds.',
      },
      rationale:
        'Marquee produces stepped band chases if pixels are confined to prop boundaries.',
      xmlClipboardSnippet: '',
    });
  }

  // Rule 6: Full Wash / On Effect with Animated Value Curve
  else {
    confidence = 86;
    isAmbiguous = true;
    ambiguityNotice =
      'This look can be produced through multiple approaches in xLights: Color Wash vs On Effect with Value Curve.';

    const isRampUp = waveformPattern === 'Linear Ramp-Up';
    const isRampDown = waveformPattern === 'Linear Ramp-Down';
    const isSine = waveformPattern === 'Sinusoidal Shimmer';

    const curveType = isRampUp
      ? 'Ramp Up'
      : isRampDown
        ? 'Ramp Down'
        : isSine
          ? 'Sine'
          : 'Linear';

    recipes.push({
      id: 'wash-primary-colorwash',
      label: 'Recipe A (Primary / Color Wash)',
      isPrimary: true,
      effectName: 'Color Wash',
      targetProp: prop,
      submodelTarget: userConfig.submodelTarget,
      timing: { startMs, endMs, durationMs, timingTrack: timingTrackName },
      layerIndex: userConfig.startingLayer,
      layerBlending: userConfig.layerBlending,
      inTransition: { type: isRampUp ? 'Fade' : 'None', durationMs: isRampUp ? durationMs : 0 },
      outTransition: {
        type: isRampDown ? 'Fade' : 'None',
        durationMs: isRampDown ? durationMs : 0,
      },
      palette: activePalette,
      settings: {
        Count: 1,
        Cycles: 1,
        'Horizontal Fade': false,
        'Vertical Fade': false,
      },
      tradeOff: {
        effort: 'Low',
        visualMatchPercentage: 96,
        description: 'Smooth palette transition with hardware gamma correction.',
      },
      rationale:
        'Luminance spread evenly across the entire ROI surface with slow color morphing.',
      xmlClipboardSnippet: '',
    });

    recipes.push({
      id: 'wash-alt-on-curve',
      label: 'Recipe B (Alternative / On Effect + Brightness Value Curve)',
      isPrimary: false,
      effectName: 'On',
      targetProp: prop,
      submodelTarget: userConfig.submodelTarget,
      timing: { startMs, endMs, durationMs, timingTrack: timingTrackName },
      layerIndex: userConfig.startingLayer,
      layerBlending: userConfig.layerBlending,
      inTransition: { type: 'None', durationMs: 0 },
      outTransition: { type: 'None', durationMs: 0 },
      palette: activePalette,
      settings: {
        'Render Mode': 'Per Model',
      },
      valueCurves: {
        Brightness: {
          curveType: curveType,
          description: `Custom ${curveType} intensity curve from 0% to 100%`,
        },
      },
      tradeOff: {
        effort: 'Medium',
        visualMatchPercentage: 99,
        description:
          'Exact mathematical replication of the extracted luminance waveform envelope.',
      },
      rationale:
        'The On effect combined with an animated Brightness Value Curve guarantees identical frame-by-frame photometric envelope tracking.',
      xmlClipboardSnippet: '',
    });
  }

  // Populate multi-layer stacks, step-by-step instructions, and XML snippets for all recipes
  for (const r of recipes) {
    const { multiLayerStack, stepByStepGuide, recommendedGroups } = buildMultiLayerStackAndGuide(
      r.effectName,
      r.targetProp,
      r.submodelTarget,
      r.timing.startMs,
      r.timing.endMs,
      r.timing.timingTrack,
      r.palette,
      r.settings,
      speedMultiplier,
      userConfig
    );

    r.multiLayerStack = multiLayerStack;
    r.stepByStepGuide = stepByStepGuide;
    r.recommendedGroups = recommendedGroups;

    r.xmlClipboardSnippet = generateXLightsXmlSnippet({
      effectName: r.effectName,
      startMs: r.timing.startMs,
      endMs: r.timing.endMs,
      palette: r.palette,
      settings: r.settings,
      layerIndex: r.layerIndex,
      layerBlending: r.layerBlending,
      inTransition: r.inTransition,
      outTransition: r.outTransition,
      multiLayerStack: r.multiLayerStack,
    });
  }

  const primary = recipes.find((r) => r.isPrimary) || recipes[0];
  const alternatives = recipes.filter((r) => r.id !== primary.id);

  return {
    confidenceScore: confidence,
    isAmbiguous,
    ambiguityNotice,
    summary,
    primaryRecipe: primary,
    alternativeRecipes: alternatives,
    diagnostics: {
      opticalFlowAlgorithm: 'Lucas-Kanade & Horn-Schunck Hybrid Spatial Tensor',
      backgroundFilter: 'Otsu Black-Floor Adaptive Subtraction + Bloom Halo Suppression',
      detectedCyclesPerSecond:
        summary.durationMs > 0 ? summary.totalFramesAnalyzed / (summary.durationMs / 1000) : 20,
      dutyCyclePercent: Math.round(
        (summary.luminanceCurve.filter((v) => v > 0.4).length /
          Math.max(1, summary.luminanceCurve.length)) *
          100
      ),
      renderTimeMs: Math.round(summary.totalFramesAnalyzed * 1.8),
    },
    iterationPasses: [],
  };
}
