import express from 'express';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const port = parseInt(process.env.PORT || '3000', 10);

app.use(express.json({ limit: '30mb' }));

// Health / Status Check
app.get('/api/status', (req, res) => {
  res.json({
    status: 'online',
    system: 'xLights Sequence Vision CV Engine',
    version: '2.0.0',
    geminiEnabled: Boolean(process.env.GEMINI_API_KEY),
    timestamp: new Date().toISOString(),
  });
});
// Stream Ingestion Endpoint: Extracts stream metadata and resolves YouTube sources
app.post('/api/stream-ingest', async (req, res) => {
  try {
    const { url } = req.body;
    if (!url || typeof url !== 'string') {
      return res.status(400).json({ error: 'Valid URL is required' });
    }

    const trimmed = url.trim();

    // Check YouTube match
    const ytMatch = trimmed.match(
      /(?:youtube\.com\/(?:watch\?.*v=|embed\/|shorts\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/
    );

    if (ytMatch && ytMatch[1]) {
      const videoId = ytMatch[1];
      let title = 'YouTube Holiday Light Display';
      let thumbnail = `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`;

      try {
        const oembedResp = await fetch(
          `https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${videoId}&format=json`
        );
        if (oembedResp.ok) {
          const oembed = await oembedResp.json();
          title = oembed.title || title;
          thumbnail = oembed.thumbnail_url || thumbnail;
        }
      } catch (e) {
        // Fallback to defaults
      }

      return res.json({
        type: 'youtube',
        videoId,
        title,
        thumbnail,
        embedUrl: `https://www.youtube-nocookie.com/embed/${videoId}?enablejsapi=1&controls=0&rel=0&modestbranding=1`,
        durationMs: 180000, // 3 minutes default for sequencing segments
      });
    }

    // Direct MP4 / WebM / Media stream
    return res.json({
      type: 'direct',
      url: trimmed,
      title: trimmed.split('/').pop() || 'Remote Video Stream',
    });
  } catch (err: any) {
    console.error('Stream ingest error:', err);
    return res.status(500).json({ error: 'Failed to process video stream', details: err.message });
  }
});

// AI Orchestration Endpoint: Enhanced reasoning for ambiguous multi-hypothesis sequencing
app.post('/api/ai-deduce', async (req, res) => {
  try {
    const { telemetry, userConfig } = req.body;

    if (!process.env.GEMINI_API_KEY) {
      return res.status(200).json({
        geminiAvailable: false,
        message: 'GEMINI_API_KEY not configured. Autonomous deterministic CV deduction active.',
      });
    }

    const ai = new GoogleGenAI();
    const prompt = `You are a master xLights sequencing engineer.
Reverse engineer the following computer vision telemetry extracted from an LED lighting display video:
Prop Type: ${userConfig.propType || 'Unknown'}
Node Count: ${userConfig.nodeCount || 100}
Submodel: ${userConfig.submodelTarget || 'Default'}
Timing Interval: ${userConfig.timingInterval || 50}ms
Waveform Pattern: ${telemetry.waveformPattern}
Motion Direction: ${telemetry.motionDirection}
Motion Speed Score: ${telemetry.motionSpeedScore}/100
Spatial Density: ${telemetry.spatialDensity}
Whole-Clip Repeating Pattern: ${telemetry.wholeClipSurvey?.hasRepeatingPattern ? `YES - Confirmed ${telemetry.wholeClipSurvey.detectedCycleCount} repeating cycles with period ${Math.round(telemetry.wholeClipSurvey.cyclePeriodMs)}ms (+${telemetry.wholeClipSurvey.confidenceAmplificationBonus}% confidence bonus across passes)` : 'Aperiodic / single pass'}
Luminance Stats: Min ${Math.min(...(telemetry.luminanceCurve || [0]))}, Max ${Math.max(...(telemetry.luminanceCurve || [1]))}
Active Palette: ${JSON.stringify(telemetry.activePalette?.map((p: any) => ({ name: p.name, hex: p.hex })))}
User Notes: ${userConfig.notes || 'None'}

CRITICAL DOMAIN RULES:
1. Ground decisions in Whole-Clip Repeating Period: If a repeating period was detected (e.g. 1400ms), lock the effect Speed precisely to this cycle so the animation matches the video loop!
2. Respect genuine visual and temporal features: Mega Trees and LED matrices can render a rich variety of xLights effects including Fire, Butterfly, Meteors, Concentric Shockwave, Color Wash, Twinkle, Pinwheel, Fan, Galaxy, Strobe, Shimmer, as well as Spirals and Bars. Classify based on true motion vector flow, optical turbulence, and chromatic entropy. Never diagnose a multi-strand Mega Tree as a 1D Single Strand chase.
3. Return exact parametric settings for modern xLights (e.g. for Spirals: 'Arms', 'Palette Repeat', 'Spiral Thickness', 'Direction', 'Speed', 'Rotation', '3D', 'Blend Colors'; for Fire: 'Height', 'Hue Shift'; for Butterfly: 'Style', 'Direction'; for Meteors: 'Count', 'Tail Length').

Return a JSON object conforming strictly to this format:
{
  "confidenceScore": number (0 to 100),
  "isAmbiguous": boolean,
  "ambiguityExplanation": string or null,
  "recommendedEffect": string (valid modern xLights effect name, e.g. "Spirals", "Bars", "Curtain", "Color Wash", "Pinwheel", "Shockwave", "Meteors", "Morph", "Twinkle", "Strobe", "Shimmer", "Fan"),
  "effectSettings": object of key-value pairs with exact xLights parameter names,
  "blendingMode": string ("Normal" | "Maximum" | "Average" | "2 is Mask" | "Add"),
  "submodelTarget": string ("Default / Full Prop" | "Star Only" | "Trunk Only" | "Per Preview"),
  "multiLayerStack": [
    {
      "layerIndex": number,
      "layerName": string,
      "effectName": string,
      "blendingMode": string,
      "submodelTarget": string,
      "settings": object of key-value pairs with exact official xLights parameter names,
      "stepInstruction": string
    }
  ],
  "valueCurvesAdvice": string,
  "effortVsVisualMatch": { "effort": "Low" | "Medium" | "High", "matchPct": number, "notes": string }
}`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
      },
    });

    const parsed = JSON.parse(response.text || '{}');
    return res.json({
      geminiAvailable: true,
      data: parsed,
    });
  } catch (err: any) {
    console.warn('Gemini deduction notice:', err.message || err);
    return res.status(200).json({
      geminiAvailable: false,
      message: 'Gemini service temporarily busy; autonomous high-precision CV engine active.',
      details: err.message,
    });
  }
});

// Deep AI Refinement Planner Endpoint: Generates comprehensive "Version Release" multi-parameter patches
app.post('/api/ai-plan-refinement', async (req, res) => {
  try {
    const {
      currentPass,
      maxPasses,
      currentEffect,
      currentSettings,
      discrepancyMetrics,
      visualTruthDelta,
      userFeedbackPrompt,
      userConfig,
      summary,
    } = req.body;

    if (!process.env.GEMINI_API_KEY) {
      return res.status(200).json({
        geminiAvailable: false,
        message: 'GEMINI_API_KEY not configured. Running autonomous deterministic release engine.',
      });
    }

    const ai = new GoogleGenAI();
    const prompt = `You are a Lead xLights Rendering Architect conducting a multi-factor software release milestone.
Instead of wasting an iteration pass modifying only one tiny setting, your job is to treat each iteration pass like a MAJOR SOFTWARE VERSION RELEASE (e.g. v2.0, v3.0) where a coordinated package of macro-structural patches and micro-tunings are planned and applied together across geometry, dynamics, color, and 3D lighting.

CURRENT STATE & TELEMETRY:
- Iteration Release Pass: ${currentPass} of ${maxPasses}
- Prop Model: ${userConfig?.propType || 'Mega Tree'} (${JSON.stringify(userConfig?.geometry || {})})
- Current Effect: "${currentEffect}"
- Current Settings: ${JSON.stringify(currentSettings || {})}
- Visual Truth Pixel Error: ${visualTruthDelta || 25}%
- Discrepancy Diagnostics: Hotspot Zone = "${discrepancyMetrics?.hotspotZone || 'Mid Cone Body'}", Mean Error = ${discrepancyMetrics?.meanErrorPct || 22}%, Top Zone Error = ${discrepancyMetrics?.topZoneErrorPct || 15}%, Mid Zone Error = ${discrepancyMetrics?.midZoneErrorPct || 28}%, Base Zone Error = ${discrepancyMetrics?.baseZoneErrorPct || 18}%
- Video Source Motion: Direction = "${summary?.motionDirection || 'Clockwise'}", Speed Score = ${summary?.motionSpeedScore || 45}/100, Waveform = "${summary?.waveformPattern || 'Smooth Continuous'}"
- User Directive Feedback: "${userFeedbackPrompt || 'Optimize global accuracy to match source display'}"

INSTRUCTIONS:
1. Conduct deep reasoning on both big-picture architecture (arm count, wrap pitch, effect style) and micro details (speed decay, ribbon width, 3D occlusion, edge highlights, color blending).
2. Synthesize a comprehensive "Version Release Milestone" package.
3. Apply a unified settings patch object with all updated parameters for xLights.

Return a JSON object conforming strictly to this structure:
{
  "version": "v${currentPass}.0 - <Descriptive Release Name, e.g. Helical Topology & Velocity Phase Sync>",
  "executiveSummary": "High-level architectural rationale explaining the coordinated patches",
  "macroPatches": [
    "Macro patch 1 (structural geometry / topology / wrap angle)",
    "Macro patch 2 (motion velocity / cycle sync / direction)"
  ],
  "microTunings": [
    "Micro tuning 1 (ribbon width / edge highlight / blur)",
    "Micro tuning 2 (3D volumetric depth / topper shimmer / palette repeat)"
  ],
  "settingsPatch": {
    /* Exact updated parameters for the primary effect, e.g. Arms, Wrap Count, Spiral Thickness, Speed, Direction, Rotation, 3D, Blend Colors */
  },
  "multiLayerStack": [
    {
      "layerIndex": number,
      "layerName": string,
      "effectName": string,
      "blendingMode": string,
      "submodelTarget": string,
      "settings": object of key-value pairs with exact xLights parameter names,
      "stepInstruction": string
    }
  ],
  "expectedVisualTarget": "Description of the visual improvement expected in this release"
}`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
      },
    });

    const parsed = JSON.parse(response.text || '{}');
    return res.json({
      geminiAvailable: true,
      data: parsed,
    });
  } catch (err: any) {
    console.warn('AI Refinement Planner notice:', err.message || err);
    return res.status(200).json({
      geminiAvailable: false,
      message: 'AI planner temporarily busy; autonomous multi-parameter release engine active.',
      details: err.message,
    });
  }
});

async function main() {
  if (process.env.NODE_ENV === 'production') {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  } else {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  app.listen(port, '0.0.0.0', () => {
    console.log(`xLights Sequence Vision Server running on http://0.0.0.0:${port}`);
  });
}

main().catch((err) => {
  console.error('Fatal server startup error:', err);
  process.exit(1);
});
