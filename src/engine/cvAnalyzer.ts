import {
  RoiBox,
  TimingInterval,
  TemporalExtractionSummary,
  FrameFeature,
  ColorSwatch,
  WaveformPattern,
  MotionDirection,
  WholeClipSurveyResult,
  RepeatingCycleInstance,
  BehavioralPhase,
} from '../types/xlights';

// Color naming helper with LED Overexposure Bloom Suppression & Sensor Clipping Compensation
export function getColorNameAndHex(r: number, g: number, b: number): { name: string; hex: string } {
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const delta = max - min;

  // 1. Off / Dark Background Floor
  if (max < 35) return { name: 'Black (Off)', hex: '#000000' };

  // 2. White / Warm White (Camera sensors heavily wash out bright LEDs into desaturated high luminance)
  // Any bright LED where minimum channel is above 100 or saturation is low is White
  const saturation = max > 0 ? delta / max : 0;
  if ((max > 130 && saturation < 0.38) || (max > 175 && min > 95) || (min > 130)) {
    return { name: 'White', hex: '#FFFFFF' };
  }
  if (r > 190 && g > 170 && b < 130 && delta < 80 && saturation < 0.40) {
    return { name: 'Warm White', hex: '#FFF4D0' };
  }

  // 3. LED Sensor Overexposure Bloom Compensation for RED:
  // Cameras filming red LEDs heavily overexpose: R saturates to 255 while G/B leak up into 80-210.
  // Unless Blue or Green is genuinely dominant, this is 100% intentional holiday RED.
  if (r > 110 && r > b * 1.15 && r > g * 1.08) {
    return { name: 'Red', hex: '#FF0000' };
  }
  if (r > 160 && r >= g && b < 180 && (r - b > 30)) {
    return { name: 'Red', hex: '#FF0000' };
  }

  // 4. Pure Green LEDs
  if (g > 120 && g > r * 1.25 && g > b * 1.2) {
    return { name: 'Green', hex: '#00FF00' };
  }

  // 5. Pure Blue LEDs
  if (b > 120 && b > r * 1.25 && b > g * 1.2) {
    return { name: 'Blue', hex: '#0044FF' };
  }

  // 6. True Yellow / Gold LEDs (Requires deliberate intentional high Red AND high Green, with negligible Blue)
  if (r > 180 && g > 160 && b < 65 && Math.abs(r - g) < 40 && delta > 110) {
    return { name: 'Yellow / Gold', hex: '#FFCC00' };
  }

  // 7. True Magenta / Pink LEDs (Requires deliberate high Red AND high Blue with LOW Green)
  if (r > 170 && b > 160 && g < 75 && Math.abs(r - b) < 45) {
    return { name: 'Magenta / Pink', hex: '#FF00FF' };
  }

  // 8. Cyan / Aqua LEDs
  if (g > 130 && b > 130 && r < 75) {
    return { name: 'Cyan / Ice Blue', hex: '#00FFFF' };
  }

  // 9. Standard Hue calculation with strict safety guards against sensor halo artifacts
  let h = 0;
  if (delta !== 0) {
    if (max === r) h = ((g - b) / delta) % 6;
    else if (max === g) h = (b - r) / delta + 2;
    else h = (r - g) / delta + 4;
    h = Math.round(h * 60);
    if (h < 0) h += 360;
  }

  // Map hue to intentional lighting design channels
  if (h >= 335 || h < 25) return { name: 'Red', hex: '#FF0000' };
  if (h >= 25 && h < 45) {
    // If predominantly red/white show, orange fringing is sensor bleed
    return r > 160 && b < 100 ? { name: 'Red', hex: '#FF0000' } : { name: 'Orange', hex: '#FF7F00' };
  }
  if (h >= 45 && h < 70) {
    // High green with low blue is Yellow; if blue is leaking or delta low, fold into White or Red
    if (b > 90 || delta < 90) return { name: 'White', hex: '#FFFFFF' };
    return { name: 'Yellow / Gold', hex: '#FFCC00' };
  }
  if (h >= 70 && h < 165) return { name: 'Green', hex: '#00FF00' };
  if (h >= 165 && h < 195) return { name: 'Cyan / Ice Blue', hex: '#00FFFF' };
  if (h >= 195 && h < 260) return { name: 'Blue', hex: '#0044FF' };
  if (h >= 260 && h < 315) return { name: 'Purple / Violet', hex: '#9900FF' };
  
  // High hue > 315: If green is present or saturation is moderate, this is sensor bloom from Red
  if (g > 60 || saturation < 0.65) {
    return { name: 'Red', hex: '#FF0000' };
  }
  return { name: 'Magenta / Pink', hex: '#FF00FF' };
}

// Convert RGB to HSV
export function rgbToHsv(r: number, g: number, b: number): [number, number, number] {
  const rNorm = r / 255;
  const gNorm = g / 255;
  const bNorm = b / 255;
  const max = Math.max(rNorm, gNorm, bNorm);
  const min = Math.min(rNorm, gNorm, bNorm);
  const delta = max - min;

  let h = 0;
  if (delta !== 0) {
    if (max === rNorm) h = ((gNorm - bNorm) / delta) % 6;
    else if (max === gNorm) h = (bNorm - rNorm) / delta + 2;
    else h = (rNorm - gNorm) / delta + 4;
    h = Math.round(h * 60);
    if (h < 0) h += 360;
  }
  const s = max === 0 ? 0 : delta / max;
  const v = max;
  return [h, Math.round(s * 100), Math.round(v * 100)];
}

// Check if point (px, py) is inside 4-point polygon
function isPointInPolygon(px: number, py: number, poly: { x: number; y: number }[]): boolean {
  if (poly.length < 3) return false;
  let inside = false;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const xi = poly[i].x;
    const yi = poly[i].y;
    const xj = poly[j].x;
    const yj = poly[j].y;
    const intersect = yi > py !== yj > py && px < ((xj - xi) * (py - yi)) / (yj - yi) + xi;
    if (intersect) inside = !inside;
  }
  return inside;
}

export interface FrameAnalysisOptions {
  video: HTMLVideoElement | HTMLCanvasElement;
  roi: RoiBox;
  timeRange: { startMs: number; endMs: number };
  intervalMs: TimingInterval; // 25ms (40 FPS) or 50ms (20 FPS)
  onProgress?: (progressPercent: number, currentFrame: number, totalFrames: number) => void;
  wholeClipSurvey?: WholeClipSurveyResult;
}

export interface WholeClipSurveyOptions {
  video: HTMLVideoElement | HTMLCanvasElement;
  roi: RoiBox;
  clipDurationMs: number;
  sampleIntervalMs?: number; // default 50ms
  onProgress?: (percent: number, currentSample: number, totalSamples: number, stage: string) => void;
}

export class VideoSequenceCvAnalyzer {
  private offscreenCanvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;

  constructor() {
    this.offscreenCanvas = document.createElement('canvas');
    this.ctx = this.offscreenCanvas.getContext('2d', { willReadFrequently: true })!;
  }

  /**
   * Surveys and watches the WHOLE video clip prior to isolated segment processing.
   * Discovers repeating patterns vs new behavior, identifies fundamental effect cycle period,
   * detects repeating passes, and uses multi-pass phase recurrence to confirm and strengthen confidence.
   */
  public async surveyWholeClipTemporalPattern(
    options: WholeClipSurveyOptions
  ): Promise<WholeClipSurveyResult> {
    const { video, roi, clipDurationMs, sampleIntervalMs = 50, onProgress } = options;
    const isHtmlVideo = video instanceof HTMLVideoElement;
    const originalTime = isHtmlVideo ? video.currentTime : 0;
    const originalPaused = isHtmlVideo ? video.paused : true;

    if (isHtmlVideo && !video.paused) {
      video.pause();
    }

    const effectiveDurationMs = Math.max(500, clipDurationMs);
    const sampleStepMs = Math.max(25, sampleIntervalMs);
    const totalSamples = Math.max(1, Math.floor(effectiveDurationMs / sampleStepMs));
    const fps = Math.round(1000 / sampleStepMs);

    const GRID_W = 32;
    const GRID_H = 32;
    this.offscreenCanvas.width = GRID_W;
    this.offscreenCanvas.height = GRID_H;

    const luminanceTimeline: number[] = [];
    const flowMagnitudeTimeline: number[] = [];
    const flowDxTimeline: number[] = [];
    const flowDyTimeline: number[] = [];
    const curlTimeline: number[] = [];
    const sampleTimestamps: number[] = [];

    let prevGray: Float32Array | null = null;

    try {
      for (let s = 0; s < totalSamples; s++) {
        const timeMs = s * sampleStepMs;
        const targetSec = timeMs / 1000;

        if (isHtmlVideo) {
          await this.seekVideoToTime(video, targetSec);
        }

        const frameData = this.captureRoiImageData(video, roi, GRID_W, GRID_H);
        const feat = this.extractSingleFrameFeatures(frameData, prevGray, s, timeMs, GRID_W, GRID_H);

        luminanceTimeline.push(feat.luminance);
        flowMagnitudeTimeline.push(feat.flowVector.magnitude);
        flowDxTimeline.push(feat.flowVector.dx);
        flowDyTimeline.push(feat.flowVector.dy);
        curlTimeline.push(feat.flowVector.curl);
        sampleTimestamps.push(timeMs);

        prevGray = this.extractGrayBuffer(frameData);

        if (onProgress) {
          const pct = Math.round(((s + 1) / totalSamples) * 100);
          onProgress(pct, s + 1, totalSamples, `Surveying whole clip (${s + 1}/${totalSamples} frames)...`);
        }

        if (s % 8 === 0) {
          await new Promise((resolve) => setTimeout(resolve, 0));
        }
      }
    } finally {
      if (isHtmlVideo) {
        video.currentTime = originalTime;
        if (!originalPaused) {
          video.play().catch(() => {});
        }
      }
    }

    // 1. Autocorrelation & Periodicity Analysis
    const N = luminanceTimeline.length;
    let bestLag = 0;
    let bestCorrelation = -1;

    // Minimum cycle period = 300ms, max = 65% of clip duration
    const minLag = Math.max(3, Math.floor(300 / sampleStepMs));
    const maxLag = Math.min(Math.floor(N * 0.65), Math.floor(6000 / sampleStepMs));

    if (N > minLag * 2) {
      const meanLum = luminanceTimeline.reduce((a, b) => a + b, 0) / N;
      let variance = 0;
      for (let i = 0; i < N; i++) {
        const diff = luminanceTimeline[i] - meanLum;
        variance += diff * diff;
      }

      if (variance > 0.001) {
        for (let lag = minLag; lag < maxLag; lag++) {
          let cov = 0;
          let count = 0;
          for (let i = 0; i < N - lag; i++) {
            cov += (luminanceTimeline[i] - meanLum) * (luminanceTimeline[i + lag] - meanLum);
            count++;
          }
          const normCorr = count > 0 ? (cov / count) / (variance / N) : 0;
          let flowCov = 0;
          for (let i = 0; i < N - lag; i++) {
            flowCov += flowDxTimeline[i] * flowDxTimeline[i + lag] + flowDyTimeline[i] * flowDyTimeline[i + lag];
          }
          const combinedScore = normCorr * 0.65 + (flowCov / Math.max(1, count)) * 0.35;

          if (combinedScore > bestCorrelation) {
            bestCorrelation = combinedScore;
            bestLag = lag;
          }
        }
      }
    }

    const hasRepeatingPattern = bestCorrelation > 0.36 && bestLag >= minLag;
    const cyclePeriodMs = hasRepeatingPattern ? bestLag * sampleStepMs : effectiveDurationMs;
    const detectedCycleCount = Math.max(1, Number((effectiveDurationMs / cyclePeriodMs).toFixed(1)));

    // 2. Multi-Pass Segmentation and Cross-Pass Similarity Evaluation
    const cycleInstances: RepeatingCycleInstance[] = [];
    const cycleSamples = Math.max(4, bestLag);
    const numFullPasses = Math.floor(N / cycleSamples);

    for (let p = 0; p < Math.max(1, numFullPasses); p++) {
      const startSample = p * cycleSamples;
      const endSample = Math.min(N, (p + 1) * cycleSamples);
      const startMs = startSample * sampleStepMs;
      const endMs = endSample * sampleStepMs;
      const dur = endMs - startMs;

      const passLum = luminanceTimeline.slice(startSample, endSample);
      const passDx = flowDxTimeline.slice(startSample, endSample);
      const passDy = flowDyTimeline.slice(startSample, endSample);

      const avgLum = passLum.length > 0 ? passLum.reduce((a, b) => a + b, 0) / passLum.length : 0;
      const avgDx = passDx.length > 0 ? passDx.reduce((a, b) => a + b, 0) / passDx.length : 0;
      const avgDy = passDy.length > 0 ? passDy.reduce((a, b) => a + b, 0) / passDy.length : 0;

      let passDir: MotionDirection = 'Stationary / Non-directional';
      if (Math.abs(avgDx) > Math.abs(avgDy)) {
        passDir = avgDx > 0 ? 'Left to Right' : 'Right to Left';
      } else if (Math.abs(avgDy) > 0.01) {
        passDir = avgDy > 0 ? 'Down (Top to Bottom)' : 'Up (Bottom to Top)';
      }

      let similarityToCanonical = 100;
      let phaseLockedCorrelation = 1.0;
      if (p > 0 && cycleInstances.length > 0) {
        const refLum = luminanceTimeline.slice(0, cycleSamples);
        const compLen = Math.min(passLum.length, refLum.length);
        if (compLen > 3) {
          let dot = 0;
          let normA = 0;
          let normB = 0;
          for (let k = 0; k < compLen; k++) {
            dot += passLum[k] * refLum[k];
            normA += passLum[k] * passLum[k];
            normB += refLum[k] * refLum[k];
          }
          const cosSim = normA > 0 && normB > 0 ? dot / (Math.sqrt(normA) * Math.sqrt(normB)) : 0.85;
          phaseLockedCorrelation = Number(Math.max(0, Math.min(1, cosSim)).toFixed(2));
          similarityToCanonical = Math.round(phaseLockedCorrelation * 100);
        }
      }

      cycleInstances.push({
        passNumber: p + 1,
        startMs,
        endMs,
        durationMs: dur,
        similarityToCanonical,
        phaseLockedCorrelation,
        motionDirection: passDir,
        averageLuminance: Number(avgLum.toFixed(3)),
      });
    }

    // 3. Multi-Pass Confidence Amplification
    let confidenceAmplificationBonus = 0;
    if (hasRepeatingPattern && cycleInstances.length >= 2) {
      const confirmedMatches = cycleInstances.filter((c) => c.similarityToCanonical >= 75).length;
      if (confirmedMatches >= 4) {
        confidenceAmplificationBonus = 18;
      } else if (confirmedMatches >= 3) {
        confidenceAmplificationBonus = 14;
      } else if (confirmedMatches >= 2) {
        confidenceAmplificationBonus = 8;
      }
    }

    // 4. Behavioral Phases
    const behavioralPhases: BehavioralPhase[] = [];
    if (hasRepeatingPattern && cycleInstances.length > 1) {
      behavioralPhases.push({
        type: 'repeating_loop',
        startMs: 0,
        endMs: cycleInstances[cycleInstances.length - 1].endMs,
        label: `Synchronous Repeating Loop (${cycleInstances.length} Passes)`,
        description: `Consistent cyclical kinematics observed across ${cycleInstances.length} passes with ${Math.round(cyclePeriodMs)}ms recurrence period.`,
        stabilityScore: Math.round(
          cycleInstances.reduce((sum, c) => sum + c.similarityToCanonical, 0) / cycleInstances.length
        ),
      });

      const lastEndMs = cycleInstances[cycleInstances.length - 1].endMs;
      if (effectiveDurationMs - lastEndMs > 250) {
        behavioralPhases.push({
          type: 'outro_fade',
          startMs: lastEndMs,
          endMs: effectiveDurationMs,
          label: 'Outro / Remnant Tail',
          description: 'Partial cycle transition or outro fade before video boundary.',
          stabilityScore: 70,
        });
      }
    } else {
      behavioralPhases.push({
        type: 'new_behavior',
        startMs: 0,
        endMs: effectiveDurationMs,
        label: 'Aperiodic / Continuous Progression',
        description: 'Single continuous progressive movement without detected strict phase looping.',
        stabilityScore: 85,
      });
    }

    // 5. Phase-Locked Averaging: Build Clean Canonical Noise-Filtered Template
    const noiseFilteredLuminanceCurve: number[] = [];
    if (hasRepeatingPattern && cycleSamples > 0) {
      for (let k = 0; k < cycleSamples; k++) {
        let sumK = 0;
        let countK = 0;
        for (let p = 0; p < numFullPasses; p++) {
          const idx = p * cycleSamples + k;
          if (idx < N) {
            sumK += luminanceTimeline[idx];
            countK++;
          }
        }
        noiseFilteredLuminanceCurve.push(countK > 0 ? Number((sumK / countK).toFixed(3)) : 0.5);
      }
    }

    return {
      totalClipDurationMs: effectiveDurationMs,
      fps,
      hasRepeatingPattern,
      cyclePeriodMs,
      detectedCycleCount,
      confidenceAmplificationBonus,
      cycleInstances,
      behavioralPhases,
      canonicalPassSummary: {
        dominantFrequencyHz: cyclePeriodMs > 0 ? Number((1000 / cyclePeriodMs).toFixed(2)) : 1.0,
        patternStabilityPct: hasRepeatingPattern
          ? Math.round(cycleInstances.reduce((s, c) => s + c.similarityToCanonical, 0) / Math.max(1, cycleInstances.length))
          : 80,
        noiseFilteredLuminanceCurve,
      },
    };
  }

  /**
   * Evaluates EVERY frame across the selected time range without skips.
   */
  public async analyzeVideoTimeSegment(
    options: FrameAnalysisOptions
  ): Promise<TemporalExtractionSummary> {
    const { video, roi, timeRange, intervalMs, onProgress, wholeClipSurvey } = options;
    const durationMs = Math.max(intervalMs, timeRange.endMs - timeRange.startMs);
    const totalFrames = Math.max(1, Math.floor(durationMs / intervalMs));
    const fps = Math.round(1000 / intervalMs);

    const frameFeatures: FrameFeature[] = [];
    const luminanceCurve: number[] = [];
    const flowMagnitudeCurve: number[] = [];

    // Working grid resolution for optical flow tensor
    const GRID_W = 48;
    const GRID_H = 48;
    this.offscreenCanvas.width = GRID_W;
    this.offscreenCanvas.height = GRID_H;

    let prevGray: Float32Array | null = null;
    const isHtmlVideo = video instanceof HTMLVideoElement;

    // Save video original time if video
    const originalTime = isHtmlVideo ? video.currentTime : 0;
    const originalPaused = isHtmlVideo ? video.paused : true;

    if (isHtmlVideo && !video.paused) {
      video.pause();
    }

    try {
      for (let f = 0; f < totalFrames; f++) {
        const frameTimeMs = timeRange.startMs + f * intervalMs;
        const targetSeconds = frameTimeMs / 1000;

        if (isHtmlVideo) {
          await this.seekVideoToTime(video, targetSeconds);
        }

        // Render ROI to offscreen canvas
        const frameData = this.captureRoiImageData(video, roi, GRID_W, GRID_H);

        // Compute Frame Features
        const feature = this.extractSingleFrameFeatures(
          frameData,
          prevGray,
          f,
          frameTimeMs,
          GRID_W,
          GRID_H
        );

        // Store downsampled 32x32 ROI RGBA buffer for real frame-by-frame Visual Truth offscreen verification
        const dsW = 32;
        const dsH = 32;
        const downsampled = new Uint8ClampedArray(dsW * dsH * 4);
        const fData = frameData.data;
        for (let dy = 0; dy < dsH; dy++) {
          const sy = dy * 2;
          for (let dx = 0; dx < dsW; dx++) {
            const sx = dx * 2;
            const srcIdx = (sy * GRID_W + sx) * 4;
            const dstIdx = (dy * dsW + dx) * 4;
            downsampled[dstIdx] = fData[srcIdx];
            downsampled[dstIdx + 1] = fData[srcIdx + 1];
            downsampled[dstIdx + 2] = fData[srcIdx + 2];
            downsampled[dstIdx + 3] = fData[srcIdx + 3];
          }
        }
        feature.roiPixelsDownsampled = downsampled;

        frameFeatures.push(feature);
        luminanceCurve.push(feature.luminance);
        flowMagnitudeCurve.push(feature.flowVector.magnitude);

        // Store current grayscale buffer for optical flow
        prevGray = this.extractGrayBuffer(frameData);

        if (onProgress) {
          const pct = Math.round(((f + 1) / totalFrames) * 100);
          onProgress(pct, f + 1, totalFrames);
        }

        // Allow microtask tick for UI smoothness
        if (f % 6 === 0) {
          await new Promise((resolve) => setTimeout(resolve, 0));
        }
      }
    } finally {
      if (isHtmlVideo) {
        video.currentTime = originalTime;
        if (!originalPaused) {
          video.play().catch(() => {});
        }
      }
    }

    // Temporal classification & aggregation
    const waveformPattern = this.classifyLuminanceWaveform(luminanceCurve, intervalMs);
    const motionDirection = this.classifyMotionDirection(frameFeatures);
    const spatialDensity = this.determineDominantSpatialDensity(frameFeatures);
    const activePalette = this.extractConsolidatedPalette(frameFeatures);

    const avgFlowMag =
      flowMagnitudeCurve.reduce((a, b) => a + b, 0) / Math.max(1, flowMagnitudeCurve.length);
    const motionSpeedScore = Math.min(100, Math.round(avgFlowMag * 22));

    return {
      totalFramesAnalyzed: totalFrames,
      stepIntervalMs: intervalMs,
      fps,
      durationMs,
      timeRange,
      waveformPattern,
      motionDirection,
      motionSpeedScore,
      spatialDensity,
      activePalette,
      luminanceCurve,
      opticalFlowMagnitudeCurve: flowMagnitudeCurve,
      frames: frameFeatures,
      wholeClipSurvey,
    };
  }

  private seekVideoToTime(video: HTMLVideoElement, seconds: number): Promise<void> {
    return new Promise((resolve) => {
      // Bound seek to duration
      const validTime = Math.max(0, Math.min(video.duration || 9999, seconds));
      if (Math.abs(video.currentTime - validTime) < 0.015) {
        resolve();
        return;
      }

      let timeoutId: number;
      const onSeeked = () => {
        clearTimeout(timeoutId);
        video.removeEventListener('seeked', onSeeked);
        resolve();
      };

      video.addEventListener('seeked', onSeeked, { once: true });
      video.currentTime = validTime;

      // Safety timeout in case seeked doesn't fire immediately
      timeoutId = window.setTimeout(() => {
        video.removeEventListener('seeked', onSeeked);
        resolve();
      }, 120);
    });
  }

  private captureRoiImageData(
    source: HTMLVideoElement | HTMLCanvasElement,
    roi: RoiBox,
    targetW: number,
    targetH: number
  ): ImageData {
    const srcW = source instanceof HTMLVideoElement ? source.videoWidth || 640 : source.width;
    const srcH = source instanceof HTMLVideoElement ? source.videoHeight || 360 : source.height;

    this.ctx.clearRect(0, 0, targetW, targetH);

    const roiPxX = Math.max(0, Math.min(srcW - 1, roi.x * srcW));
    const roiPxY = Math.max(0, Math.min(srcH - 1, roi.y * srcH));
    const roiPxW = Math.max(2, Math.min(srcW - roiPxX, roi.width * srcW));
    const roiPxH = Math.max(2, Math.min(srcH - roiPxY, roi.height * srcH));

    if (roi.isPolygon && roi.polygonPoints.length === 4) {
      // Polygon clipping path
      this.ctx.save();
      this.ctx.beginPath();
      const p0 = roi.polygonPoints[0];
      this.ctx.moveTo(p0.x * targetW, p0.y * targetH);
      for (let i = 1; i < 4; i++) {
        const pt = roi.polygonPoints[i];
        this.ctx.lineTo(pt.x * targetW, pt.y * targetH);
      }
      this.ctx.closePath();
      this.ctx.clip();
      this.ctx.drawImage(source, roiPxX, roiPxY, roiPxW, roiPxH, 0, 0, targetW, targetH);
      this.ctx.restore();
    } else {
      this.ctx.drawImage(source, roiPxX, roiPxY, roiPxW, roiPxH, 0, 0, targetW, targetH);
    }

    return this.ctx.getImageData(0, 0, targetW, targetH);
  }

  private extractGrayBuffer(imageData: ImageData): Float32Array {
    const data = imageData.data;
    const len = imageData.width * imageData.height;
    const gray = new Float32Array(len);
    for (let i = 0; i < len; i++) {
      const idx = i * 4;
      // Perceptual luminance Rec. 709
      gray[i] = 0.2126 * data[idx] + 0.7152 * data[idx + 1] + 0.0722 * data[idx + 2];
    }
    return gray;
  }

  private extractSingleFrameFeatures(
    imageData: ImageData,
    prevGray: Float32Array | null,
    frameIndex: number,
    timestampMs: number,
    w: number,
    h: number
  ): FrameFeature {
    const data = imageData.data;
    const totalPixels = w * h;

    // 1. Color and Luminance Analysis with Night Noise Filtering
    // Night photography typically has sensor noise in the 0..25 range.
    // Active LEDs typically have luminance > 40.
    const NOISE_FLOOR = 35;
    const BLOOM_RADIUS = 3;

    let activePixels = 0;
    let totalLuminanceSum = 0;
    let minActiveX = w;
    let maxActiveX = 0;
    let minActiveY = h;
    let maxActiveY = 0;
    const colorBins: Map<string, { r: number; g: number; b: number; count: number }> = new Map();

    const currentGray = this.extractGrayBuffer(imageData);

    // Compute localized bloom suppression mask
    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        const idx = y * w + x;
        const pxIdx = idx * 4;
        const lum = currentGray[idx];

        if (lum > NOISE_FLOOR) {
          // Check local contrast vs surround (bloom suppression)
          let surroundLum = 0;
          let surroundCount = 0;
          for (let dy = -BLOOM_RADIUS; dy <= BLOOM_RADIUS; dy += 2) {
            for (let dx = -BLOOM_RADIUS; dx <= BLOOM_RADIUS; dx += 2) {
              const ny = y + dy;
              const nx = x + dx;
              if (nx >= 0 && nx < w && ny >= 0 && ny < h) {
                surroundLum += currentGray[ny * w + nx];
                surroundCount++;
              }
            }
          }
          const avgSurround = surroundCount > 0 ? surroundLum / surroundCount : 0;
          // If pixel is significantly brighter than blurred surround or above high intensity, count as active LED
          if (lum > avgSurround * 0.75 || lum > 140) {
            activePixels++;
            totalLuminanceSum += lum;
            if (x < minActiveX) minActiveX = x;
            if (x > maxActiveX) maxActiveX = x;
            if (y < minActiveY) minActiveY = y;
            if (y > maxActiveY) maxActiveY = y;

            const r = data[pxIdx];
            const g = data[pxIdx + 1];
            const b = data[pxIdx + 2];

            // Quantize to 32-level bins
            const qR = Math.round(r / 32) * 32;
            const qG = Math.round(g / 32) * 32;
            const qB = Math.round(b / 32) * 32;
            const binKey = `${qR},${qG},${qB}`;

            const existing = colorBins.get(binKey);
            if (existing) {
              existing.count++;
              existing.r = (existing.r * (existing.count - 1) + r) / existing.count;
              existing.g = (existing.g * (existing.count - 1) + g) / existing.count;
              existing.b = (existing.b * (existing.count - 1) + b) / existing.count;
            } else {
              colorBins.set(binKey, { r, g, b, count: 1 });
            }
          }
        }
      }
    }

    const activeRatio = activePixels / totalPixels;
    const avgLum = activePixels > 0 ? totalLuminanceSum / (activePixels * 255) : 0;

    // Extract top dominant colors
    const sortedBins = Array.from(colorBins.values()).sort((a, b) => b.count - a.count);
    const dominantColors: ColorSwatch[] = [];

    const topCount = Math.min(4, sortedBins.length);
    for (let i = 0; i < topCount; i++) {
      const b = sortedBins[i];
      const r = Math.round(b.r);
      const g = Math.round(b.g);
      const bl = Math.round(b.b);
      const colorInfo = getColorNameAndHex(r, g, bl);
      const pct = Math.round((b.count / Math.max(1, activePixels)) * 100);

      dominantColors.push({
        index: i + 1,
        hex: colorInfo.hex,
        name: colorInfo.name,
        rgb: [r, g, bl],
        percentage: pct,
        checked: true,
      });
    }

    // 2. Optical Flow & Motion Vector Calculus
    // Horn-Schunck / Lucas-Kanade gradient tensor over ROI grid
    let flowDx = 0;
    let flowDy = 0;
    let flowMagnitude = 0;
    let divergence = 0;
    let curl = 0; // Angular rotational velocity around centroid

    if (prevGray) {
      let flowVectorsCount = 0;
      let sumDx = 0;
      let sumDy = 0;
      let sumDiv = 0;
      let sumCurl = 0;

      const cx = w / 2;
      const cy = h / 2;

      // Sample interior points
      for (let y = 2; y < h - 2; y += 2) {
        for (let x = 2; x < w - 2; x += 2) {
          const idx = y * w + x;

          // Spatial gradients
          const ix = (currentGray[y * w + (x + 1)] - currentGray[y * w + (x - 1)]) / 2;
          const iy = (currentGray[(y + 1) * w + x] - currentGray[(y - 1) * w + x]) / 2;
          // Temporal gradient
          const it = currentGray[idx] - prevGray[idx];

          const gradMagSq = ix * ix + iy * iy;
          if (gradMagSq > 20) {
            // Lucas-Kanade local velocity approximation with smoothing factor alpha
            const alpha = 50;
            const u = (-it * ix) / (gradMagSq + alpha);
            const v = (-it * iy) / (gradMagSq + alpha);

            sumDx += u;
            sumDy += v;

            // Divergence: radial vector alignment
            const rx = x - cx;
            const ry = y - cy;
            const rDist = Math.sqrt(rx * rx + ry * ry) + 0.1;
            // Dot product with radial outward unit vector: (u*rx + v*ry)/r
            sumDiv += (u * rx + v * ry) / rDist;

            // Curl: cross product with radial vector (rotational torque)
            sumCurl += (rx * v - ry * u) / rDist;

            flowVectorsCount++;
          }
        }
      }

      if (flowVectorsCount > 4) {
        flowDx = sumDx / flowVectorsCount;
        flowDy = sumDy / flowVectorsCount;
        flowMagnitude = Math.sqrt(flowDx * flowDx + flowDy * flowDy);
        divergence = sumDiv / flowVectorsCount;
        curl = sumCurl / flowVectorsCount;
      }
    }

    const angleDeg = (Math.atan2(flowDy, flowDx) * 180) / Math.PI;

    // 3. Spatial Spread Topology
    // True 1D strand means active pixels are strictly collinear along a narrow single axis
    const spanX = activePixels > 0 ? (maxActiveX - minActiveX) / w : 0;
    const spanY = activePixels > 0 ? (maxActiveY - minActiveY) / h : 0;

    let spatialSpread: '1D_strand' | '2D_surface' | 'radial' | 'full_wash' = '2D_surface';
    if (activeRatio > 0.65) {
      spatialSpread = 'full_wash';
    } else if (
      Math.abs(curl) > 0.08 ||
      (Math.abs(flowDx) > 0.06 && Math.abs(flowDy) > 0.04) ||
      (Math.abs(flowDx) > 0.04 && Math.abs(curl) > 0.04)
    ) {
      spatialSpread = 'radial';
    } else if (
      (spanX < 0.06 && spanY > 0.5) ||
      (spanY < 0.06 && spanX > 0.5)
    ) {
      // Strictly an isolated single 1D pixel wire/line
      spatialSpread = '1D_strand';
    } else {
      // 2D surface (e.g. tree matrix, multi-strand ribbons)
      spatialSpread = '2D_surface';
    }

    return {
      frameIndex,
      timestampMs,
      luminance: avgLum,
      activePixelsRatio: activeRatio,
      flowVector: {
        dx: flowDx,
        dy: flowDy,
        magnitude: flowMagnitude,
        angleDeg,
        divergence,
        curl,
      },
      dominantColors,
      spatialSpread,
    };
  }

  /**
   * Classify Luminance Waveform Dynamics across every single frame.
   */
  private classifyLuminanceWaveform(
    curve: number[],
    stepIntervalMs: TimingInterval
  ): WaveformPattern {
    if (curve.length < 3) return 'Square Hold';

    const max = Math.max(...curve);
    const min = Math.min(...curve);
    const range = max - min;

    // If practically flat
    if (range < 0.12) return 'Square Hold';

    // Count zero crossings / rapid sign transitions (Strobe detection)
    const mid = min + range * 0.5;
    let transitions = 0;
    for (let i = 1; i < curve.length; i++) {
      if ((curve[i - 1] < mid && curve[i] >= mid) || (curve[i - 1] >= mid && curve[i] < mid)) {
        transitions++;
      }
    }

    const durationSec = (curve.length * stepIntervalMs) / 1000;
    const frequencyHz = durationSec > 0 ? transitions / (2 * durationSec) : 0;

    // High frequency strobing (> 4Hz)
    if (frequencyHz >= 4.0 && range > 0.35) {
      return 'Strobe / Shutter Pulse';
    }

    // Check monotonic slope (Linear Ramp Up vs Ramp Down)
    let upMoves = 0;
    let downMoves = 0;
    for (let i = 1; i < curve.length; i++) {
      const diff = curve[i] - curve[i - 1];
      if (diff > 0.02) upMoves++;
      else if (diff < -0.02) downMoves++;
    }

    const totalMoves = upMoves + downMoves;
    if (totalMoves > 4) {
      if (upMoves / totalMoves > 0.72) return 'Linear Ramp-Up';
      if (downMoves / totalMoves > 0.72) return 'Linear Ramp-Down';
    }

    // Check triangle vs sinusoidal shimmer
    if (transitions >= 2 && transitions <= 6) {
      return 'Sinusoidal Shimmer';
    }

    if (range > 0.4) {
      return 'Triangle Wave';
    }

    return 'Moving Strand Pulse';
  }

  /**
   * Classify Dominant Motion Direction from Dense Optical Flow vectors.
   */
  private classifyMotionDirection(frames: FrameFeature[]): MotionDirection {
    let avgDx = 0;
    let avgDy = 0;
    let avgDiv = 0;
    let avgCurl = 0;
    let validCount = 0;

    let dirChanges = 0;
    let prevSign = 0;

    for (const f of frames) {
      const { dx, dy, divergence, curl, magnitude } = f.flowVector;
      // Sensitive threshold for discrete frame intervals
      if (magnitude > 0.012) {
        avgDx += dx;
        avgDy += dy;
        avgDiv += divergence;
        avgCurl += curl;
        validCount++;

        const currentSign = Math.sign(dx);
        if (prevSign !== 0 && currentSign !== 0 && currentSign !== prevSign) {
          dirChanges++;
        }
        prevSign = currentSign;
      }
    }

    if (validCount === 0) return 'Stationary / Non-directional';

    avgDx /= validCount;
    avgDy /= validCount;
    avgDiv /= validCount;
    avgCurl /= validCount;

    // Oscillating / Bouncing
    if (dirChanges >= 3) {
      return 'Bouncing / Oscillating';
    }

    // Helical Spiral detection (combination of rotational curl + lateral translation + downward ribbon advance)
    if (
      (Math.abs(avgCurl) > 0.035 && (Math.abs(avgDx) > 0.025 || Math.abs(avgDy) > 0.025)) ||
      Math.abs(avgCurl) > 0.065 ||
      (Math.abs(avgDx) > 0.04 && Math.abs(avgDy) > 0.03)
    ) {
      const isClockwise = avgCurl > 0 || avgDx > 0;
      return isClockwise ? 'Helical Spiral (Clockwise)' : 'Helical Spiral (Counter-Clockwise)';
    }

    // Radial Curl (Pinwheel, Spinners)
    if (Math.abs(avgCurl) > 0.12) {
      return avgCurl > 0 ? 'Radial Clockwise' : 'Radial Counter-Clockwise';
    }

    // Divergence (Shockwave, Explode, Compress)
    if (Math.abs(avgDiv) > 0.25) {
      return avgDiv > 0 ? 'Expand (Outward)' : 'Compress (Inward)';
    }

    // Linear translation
    if (Math.abs(avgDx) > Math.abs(avgDy)) {
      return avgDx > 0 ? 'Left to Right' : 'Right to Left';
    } else {
      return avgDy > 0 ? 'Down (Top to Bottom)' : 'Up (Bottom to Top)';
    }
  }

  private determineDominantSpatialDensity(
    frames: FrameFeature[]
  ): '1D_strand' | '2D_surface' | 'radial' | 'full_wash' {
    const counts = { '1D_strand': 0, '2D_surface': 0, radial: 0, full_wash: 0 };
    for (const f of frames) {
      counts[f.spatialSpread]++;
    }
    const maxEntry = Object.entries(counts).sort((a, b) => b[1] - a[1])[0];
    return maxEntry[0] as '1D_strand' | '2D_surface' | 'radial' | 'full_wash';
  }

  /**
   * Aggregate active palette across all frames into distinct swatches,
   * with intelligent suppression of digital camera sensor bloom artifacts
   * (e.g. folding overexposed Red "Pink" bleed back into Red, and filtering
   * low-presence edge-fringing chromatic aberration like "Yellow" on Red/White trees).
   */
  private extractConsolidatedPalette(frames: FrameFeature[]): ColorSwatch[] {
    const colorMap: Map<string, { r: number; g: number; b: number; count: number; name: string }> =
      new Map();

    for (const f of frames) {
      for (const c of f.dominantColors) {
        const key = c.name;
        const existing = colorMap.get(key);
        if (existing) {
          existing.count += c.percentage;
        } else {
          colorMap.set(key, {
            r: c.rgb[0],
            g: c.rgb[1],
            b: c.rgb[2],
            count: c.percentage,
            name: c.name,
          });
        }
      }
    }

    // Fold overexposure artifacts:
    // When Red is present, cameras capture overexposed Red as Pink/Peach. Fold Pink into Red.
    const redEntry = colorMap.get('Red');
    const pinkEntry = colorMap.get('Magenta / Pink');
    if (redEntry && pinkEntry) {
      redEntry.count += pinkEntry.count;
      colorMap.delete('Magenta / Pink');
    }

    const whiteEntry = colorMap.get('White');
    const warmWhiteEntry = colorMap.get('Warm White');
    if (whiteEntry && warmWhiteEntry) {
      whiteEntry.count += warmWhiteEntry.count;
      colorMap.delete('Warm White');
    }

    let sorted = Array.from(colorMap.entries()).sort((a, b) => b[1].count - a[1].count);

    if (sorted.length === 0) {
      return [
        { index: 1, hex: '#FF0000', name: 'Red', rgb: [255, 0, 0], percentage: 50, checked: true },
        { index: 2, hex: '#FFFFFF', name: 'White', rgb: [255, 255, 255], percentage: 50, checked: true },
      ];
    }

    const totalScore = sorted.reduce((sum, item) => sum + item[1].count, 0);

    // If Red and/or White are the primary show colors, prune chromatic aberration halos
    // (e.g. sensor yellow/orange fringing along high-contrast red-on-black or red-on-white boundaries)
    const hasRedOrWhite = sorted.some(([name]) => name === 'Red' || name === 'White');
    if (hasRedOrWhite) {
      sorted = sorted.filter(([name, data], idx) => {
        if (idx === 0) return true;
        const pct = (data.count / totalScore) * 100;
        // Suppress chromatic edge fringe (yellow halos, spurious pink, or orange halos under 25%)
        if (
          pct < 25 &&
          (name.includes('Yellow') || name.includes('Orange') || name.includes('Pink'))
        ) {
          return false;
        }
        return true;
      });
    }

    const newTotal = sorted.reduce((sum, item) => sum + item[1].count, 0);

    return sorted.slice(0, 4).map(([name, data], idx) => {
      const colorInfo = getColorNameAndHex(data.r, data.g, data.b);
      const pct = Math.round((data.count / Math.max(1, newTotal)) * 100);
      return {
        index: idx + 1,
        hex: colorInfo.hex,
        name: data.name,
        rgb: [data.r, data.g, data.b],
        percentage: pct,
        checked: idx < 2 || pct >= 25, // Check top 2 genuine show colors
      };
    });
  }
}
