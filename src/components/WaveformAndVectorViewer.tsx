import React from 'react';
import {
  Activity,
  Compass,
  Palette,
  Eye,
  CheckCircle2,
  TrendingUp,
  Cpu,
} from 'lucide-react';
import {
  TemporalExtractionSummary,
  ColorSwatch,
  MotionDirection,
  WaveformPattern,
} from '../types/xlights';

interface WaveformAndVectorViewerProps {
  summary: TemporalExtractionSummary;
  currentTimeMs: number;
  onSeekTimeMs: (ms: number) => void;
  onToggleColorChecked: (index: number) => void;
}

export const WaveformAndVectorViewer: React.FC<WaveformAndVectorViewerProps> = ({
  summary,
  currentTimeMs,
  onSeekTimeMs,
  onToggleColorChecked,
}) => {
  const {
    totalFramesAnalyzed,
    stepIntervalMs,
    durationMs,
    timeRange,
    waveformPattern,
    motionDirection,
    motionSpeedScore,
    spatialDensity,
    activePalette,
    luminanceCurve,
  } = summary;

  // Calculate current scrubber frame index
  const currentRelMs = Math.max(0, Math.min(durationMs, currentTimeMs - timeRange.startMs));
  const currentFrameIdx = Math.floor(currentRelMs / stepIntervalMs);

  return (
    <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-4 flex flex-col gap-4 shadow-xl">
      {/* Header bar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between pb-3 border-b border-neutral-800 gap-2">
        <div className="flex items-center gap-2">
          <Activity className="w-4 h-4 text-amber-400" />
          <h3 className="font-semibold text-sm text-neutral-200">
            Temporal Feature & Waveform Dynamics
          </h3>
        </div>
        <div className="flex items-center gap-2 text-xs text-neutral-400 font-mono">
          <span className="text-amber-400 font-bold">{totalFramesAnalyzed} frames</span> evaluated
          (100% full temporal pass · {stepIntervalMs}ms intervals)
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Panel 1: Luminescence Waveform Chart */}
        <div className="lg:col-span-2 bg-neutral-950/70 border border-neutral-800/90 rounded-lg p-3 flex flex-col gap-2">
          <div className="flex items-center justify-between text-xs">
            <span className="font-medium text-neutral-300 flex items-center gap-1.5">
              <TrendingUp className="w-3.5 h-3.5 text-amber-400" />
              Luminescence Waveform L(t)
            </span>
            <span className="text-[11px] font-mono text-neutral-400">
              Pattern: <span className="text-amber-300 font-semibold">{waveformPattern}</span>
            </span>
          </div>

          {/* SVG Waveform Chart */}
          <div className="relative h-32 w-full bg-neutral-950 rounded border border-neutral-800/60 overflow-hidden">
            <svg
              viewBox={`0 0 ${luminanceCurve.length * 10} 100`}
              preserveAspectRatio="none"
              className="w-full h-full"
            >
              {/* Horizontal grid lines */}
              <line x1="0" y1="20" x2={luminanceCurve.length * 10} y2="20" stroke="#262626" strokeDasharray="3,3" />
              <line x1="0" y1="50" x2={luminanceCurve.length * 10} y2="50" stroke="#262626" strokeDasharray="3,3" />
              <line x1="0" y1="80" x2={luminanceCurve.length * 10} y2="80" stroke="#262626" strokeDasharray="3,3" />

              {/* Gradient fill */}
              <defs>
                <linearGradient id="lumGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#f59e0b" stopOpacity="0.4" />
                  <stop offset="100%" stopColor="#f59e0b" stopOpacity="0.0" />
                </linearGradient>
              </defs>

              {/* Waveform polygon area */}
              {luminanceCurve.length > 1 && (
                <polygon
                  points={`0,100 ${luminanceCurve
                    .map((val, idx) => `${idx * 10},${100 - val * 90}`)
                    .join(' ')} ${(luminanceCurve.length - 1) * 10},100`}
                  fill="url(#lumGrad)"
                />
              )}

              {/* Waveform line */}
              {luminanceCurve.length > 1 && (
                <polyline
                  points={luminanceCurve
                    .map((val, idx) => `${idx * 10},${100 - val * 90}`)
                    .join(' ')}
                  fill="none"
                  stroke="#f59e0b"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              )}

              {/* Playhead line */}
              <line
                x1={currentFrameIdx * 10}
                y1="0"
                x2={currentFrameIdx * 10}
                y2="100"
                stroke="#ffffff"
                strokeWidth="2"
                strokeDasharray="2,2"
              />
            </svg>

            {/* Playhead scrubber dot */}
            <div
              className="absolute top-0 bottom-0 pointer-events-none"
              style={{ left: `${(currentRelMs / Math.max(1, durationMs)) * 100}%` }}
            >
              <div className="w-2.5 h-2.5 rounded-full bg-white shadow-md shadow-amber-500 -ml-1 mt-1 border border-neutral-900" />
            </div>
          </div>

          <div className="flex items-center justify-between text-[11px] font-mono text-neutral-500">
            <span>Start: {timeRange.startMs}ms</span>
            <span>
              Frame: {currentFrameIdx + 1} / {totalFramesAnalyzed}
            </span>
            <span>End: {timeRange.endMs}ms</span>
          </div>
        </div>

        {/* Panel 2: Optical Flow & Vector Telemetry */}
        <div className="bg-neutral-950/70 border border-neutral-800/90 rounded-lg p-3 flex flex-col gap-2.5">
          <div className="flex items-center justify-between text-xs">
            <span className="font-medium text-neutral-300 flex items-center gap-1.5">
              <Compass className="w-3.5 h-3.5 text-blue-400" />
              Motion & Optical Flow
            </span>
            <span className="font-mono text-blue-300 font-semibold">{motionDirection}</span>
          </div>

          {/* Directional Compass Radar */}
          <div className="flex items-center justify-center p-2 bg-neutral-900/50 rounded border border-neutral-800/60">
            <div className="relative w-24 h-24 rounded-full border border-neutral-700 flex items-center justify-center">
              <div className="absolute inset-x-0 h-px bg-neutral-800" />
              <div className="absolute inset-y-0 w-px bg-neutral-800" />
              <div className="w-12 h-12 rounded-full border border-neutral-800" />

              {/* Vector arrow indicator */}
              <div
                className="w-1 h-10 bg-gradient-to-t from-transparent to-blue-400 rounded-full origin-bottom transition-transform duration-200"
                style={{
                  transform: `rotate(${
                    motionDirection === 'Left to Right'
                      ? 90
                      : motionDirection === 'Right to Left'
                        ? -90
                        : motionDirection === 'Down (Top to Bottom)'
                          ? 180
                          : motionDirection === 'Up (Bottom to Top)'
                            ? 0
                            : motionDirection === 'Radial Clockwise'
                              ? 45
                              : -45
                  }deg) translateY(-8px)`,
                }}
              />
              <div className="w-2 h-2 rounded-full bg-blue-400 shadow-md shadow-blue-400" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2 text-[11px]">
            <div className="bg-neutral-900/60 p-1.5 rounded border border-neutral-800">
              <span className="text-neutral-500 block">Velocity Score:</span>
              <span className="font-mono font-bold text-neutral-200">
                {motionSpeedScore} / 100
              </span>
            </div>
            <div className="bg-neutral-900/60 p-1.5 rounded border border-neutral-800">
              <span className="text-neutral-500 block">Spatial Topology:</span>
              <span className="font-mono font-bold text-neutral-200 capitalize">
                {spatialDensity.replace('_', ' ')}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Panel 3: Extracted Active 8-Slot Color Palette */}
      <div className="bg-neutral-950/70 border border-neutral-800/90 rounded-lg p-3 flex flex-col gap-2">
        <div className="flex items-center justify-between text-xs">
          <span className="font-medium text-neutral-300 flex items-center gap-1.5">
            <Palette className="w-3.5 h-3.5 text-amber-400" />
            Extracted xLights 8-Slot Color Palette
          </span>
          <span className="text-[11px] text-neutral-400">
            Checkboxes correspond directly to xLights Palette Toolbar (1–8)
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-8 gap-2">
          {activePalette.map((swatch) => (
            <div
              key={swatch.index}
              onClick={() => onToggleColorChecked(swatch.index)}
              className={`p-2 rounded-lg border flex flex-col items-center gap-1.5 cursor-pointer transition select-none ${
                swatch.checked
                  ? 'bg-neutral-900 border-amber-500/50 shadow-sm'
                  : 'bg-neutral-950/60 border-neutral-800/80 opacity-60 hover:opacity-90'
              }`}
            >
              {/* Color Box */}
              <div
                className="w-full h-7 rounded shadow-inner border border-white/20 relative flex items-center justify-center"
                style={{ backgroundColor: swatch.hex }}
              >
                {swatch.checked && (
                  <CheckCircle2 className="w-3.5 h-3.5 text-white drop-shadow-md" />
                )}
              </div>

              {/* Slot & Hex */}
              <div className="w-full text-center">
                <div className="flex items-center justify-between text-[10px] font-mono text-neutral-400">
                  <span>#{swatch.index}</span>
                  <span className="text-amber-400">{swatch.percentage}%</span>
                </div>
                <div className="text-[11px] font-mono font-semibold text-neutral-200 truncate">
                  {swatch.hex}
                </div>
                <div className="text-[10px] text-neutral-400 truncate">{swatch.name}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Panel 4: Whole-Clip Temporal Pattern & Multi-Pass Recurrence Intelligence */}
      {summary.wholeClipSurvey && (
        <div className="bg-neutral-950/80 border border-neutral-800 rounded-lg p-3.5 flex flex-col gap-3">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b border-neutral-800/80 pb-2.5">
            <div className="flex items-center gap-2">
              <span className="p-1 rounded bg-amber-500/20 text-amber-300 border border-amber-500/40">
                <Activity className="w-4 h-4" />
              </span>
              <div>
                <h4 className="font-semibold text-xs text-neutral-200 flex items-center gap-1.5">
                  Whole-Clip Recurrence & Multi-Pass Confirmation
                </h4>
                <p className="text-[11px] text-neutral-400">
                  Watches the entire video sequence to distinguish repeating periodic loops from new behaviors.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 flex-wrap text-xs font-mono">
              {summary.wholeClipSurvey.hasRepeatingPattern ? (
                <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 font-semibold flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                  Repeating Loop Confirmed (+{summary.wholeClipSurvey.confidenceAmplificationBonus}% Confidence)
                </span>
              ) : (
                <span className="px-2 py-0.5 rounded bg-neutral-800 text-neutral-300 border border-neutral-700">
                  Aperiodic / Continuous Movement
                </span>
              )}
            </div>
          </div>

          {/* Recurrence Metrics Bar */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
            <div className="p-2 rounded bg-neutral-900 border border-neutral-800 flex flex-col">
              <span className="text-neutral-500 text-[10px]">Fundamental Period:</span>
              <span className="font-mono font-bold text-amber-300">
                {Math.round(summary.wholeClipSurvey.cyclePeriodMs)} ms
              </span>
            </div>
            <div className="p-2 rounded bg-neutral-900 border border-neutral-800 flex flex-col">
              <span className="text-neutral-500 text-[10px]">Detected Cycle Count:</span>
              <span className="font-mono font-bold text-neutral-200">
                {summary.wholeClipSurvey.detectedCycleCount} Full Cycles
              </span>
            </div>
            <div className="p-2 rounded bg-neutral-900 border border-neutral-800 flex flex-col">
              <span className="text-neutral-500 text-[10px]">Kinematic Stability:</span>
              <span className="font-mono font-bold text-emerald-400">
                {summary.wholeClipSurvey.canonicalPassSummary?.patternStabilityPct}% Match
              </span>
            </div>
            <div className="p-2 rounded bg-neutral-900 border border-neutral-800 flex flex-col">
              <span className="text-neutral-500 text-[10px]">Whole Clip Analyzed:</span>
              <span className="font-mono font-bold text-neutral-300">
                {(summary.wholeClipSurvey.totalClipDurationMs / 1000).toFixed(1)}s total
              </span>
            </div>
          </div>

          {/* Cycle Instances Breakdown */}
          {summary.wholeClipSurvey.cycleInstances && summary.wholeClipSurvey.cycleInstances.length > 0 && (
            <div className="flex flex-col gap-1.5">
              <span className="text-[11px] font-medium text-neutral-400">
                Detected Repeating Effect Passes across the Video:
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2">
                {summary.wholeClipSurvey.cycleInstances.map((inst) => (
                  <div
                    key={inst.passNumber}
                    className="p-2 rounded bg-neutral-900/70 border border-neutral-800/90 flex flex-col gap-1 text-[11px]"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-neutral-300">Pass #{inst.passNumber}</span>
                      <span
                        className={`font-mono text-[10px] font-bold px-1 rounded ${
                          inst.similarityToCanonical >= 85
                            ? 'bg-emerald-500/20 text-emerald-300'
                            : 'bg-amber-500/20 text-amber-300'
                        }`}
                      >
                        {inst.similarityToCanonical}% Match
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-neutral-400 text-[10px] font-mono">
                      <span>{(inst.startMs / 1000).toFixed(1)}s - {(inst.endMs / 1000).toFixed(1)}s</span>
                      <span className="text-neutral-300">{inst.motionDirection.split(' ')[0]}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Behavioral Phases Timeline */}
          {summary.wholeClipSurvey.behavioralPhases && summary.wholeClipSurvey.behavioralPhases.length > 0 && (
            <div className="flex flex-col gap-1 text-[11px]">
              <span className="text-neutral-500 font-medium">Segment Behavioral Context:</span>
              <div className="flex flex-wrap gap-2">
                {summary.wholeClipSurvey.behavioralPhases.map((phase, idx) => (
                  <div
                    key={idx}
                    className="px-2.5 py-1 rounded bg-neutral-900 border border-neutral-800 text-[11px] flex items-center gap-1.5 text-neutral-300"
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                    <span className="font-semibold text-neutral-200">{phase.label}</span>
                    <span className="text-neutral-500 font-mono">
                      ({(phase.startMs / 1000).toFixed(1)}s - {(phase.endMs / 1000).toFixed(1)}s)
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
