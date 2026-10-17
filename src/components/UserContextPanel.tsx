import React, { useState } from 'react';
import {
  SlidersHorizontal,
  ChevronDown,
  ChevronUp,
  Cpu,
  Layers,
  Clock,
  Sparkles,
} from 'lucide-react';
import {
  UserContextConfig,
  PropModelType,
  SubmodelTarget,
  TimingInterval,
  LayerBlendingMode,
} from '../types/xlights';

interface UserContextPanelProps {
  config: UserContextConfig;
  onChangeConfig: (newConfig: UserContextConfig) => void;
  onOpenGeometryModal?: () => void;
  disabled?: boolean;
}

const PROP_OPTIONS: PropModelType[] = [
  'Mega Tree',
  'PEX Arches',
  'Mini Tree with Star',
  'Matrix',
  'Roofline',
  'Spinner / ChromaStar',
  'Single Line / Poly Line',
  'Window Frame',
  'Wreath',
  'Custom Coro Prop',
];

const SUBMODEL_OPTIONS: SubmodelTarget[] = [
  'Default / Full Prop',
  'Star Only',
  'Trunk Only',
  'Per Preview',
  'Custom Sub-Buffer',
];

const BLENDING_MODES: LayerBlendingMode[] = [
  'Normal',
  '2 is Mask',
  'Average',
  'Maximum',
  'Minimum',
  'Layer 1 Over Layer 2',
  'Add',
  'Subtract',
];

export const UserContextPanel: React.FC<UserContextPanelProps> = ({
  config,
  onChangeConfig,
  onOpenGeometryModal,
  disabled = false,
}) => {
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [nodeCountDraft, setNodeCountDraft] = useState<string>(String(config.nodeCount));
  const [nodeCountError, setNodeCountError] = useState<string | null>(null);

  // Sync draft when config changes externally
  React.useEffect(() => {
    setNodeCountDraft(String(config.nodeCount));
    setNodeCountError(null);
  }, [config.nodeCount]);

  const handleNodeCountChange = (val: string) => {
    setNodeCountDraft(val);
    if (nodeCountError) setNodeCountError(null);
  };

  const commitNodeCount = () => {
    const raw = nodeCountDraft.trim();
    if (raw === '') {
      setNodeCountError('Pixel / node count cannot be empty. Please enter a valid number (1 - 20,000).');
      return;
    }

    const parsed = parseInt(raw, 10);
    if (isNaN(parsed) || parsed < 1 || parsed > 20000) {
      setNodeCountError('Please enter a valid node count between 1 and 20,000.');
      return;
    }

    setNodeCountError(null);
    setNodeCountDraft(String(parsed));
    onChangeConfig({ ...config, nodeCount: parsed });
  };

  return (
    <div className="bg-neutral-900 border border-neutral-800 rounded-xl overflow-hidden shadow-lg transition">
      {/* Header bar */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-4 py-3 bg-neutral-950/70 border-b border-neutral-800/80 flex items-center justify-between text-left hover:bg-neutral-900/80 transition cursor-pointer"
      >
        <div className="flex items-center gap-2.5">
          <SlidersHorizontal className="w-4 h-4 text-amber-400" />
          <span className="font-semibold text-sm text-neutral-200">
            User Context & Override Specifications
          </span>
          <span className="text-xs text-neutral-400">·</span>
          <span className="text-xs text-neutral-400">
            {config.propType} ({config.nodeCount} nodes, {config.timingInterval}ms timing)
          </span>
        </div>
        <div className="flex items-center gap-1.5 text-xs text-neutral-400">
          <span>{isOpen ? 'Collapse' : 'Expand'}</span>
          {isOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </div>
      </button>

      {/* Collapsible Content */}
      {isOpen && (
        <div className="p-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 text-xs">
          {/* Prop Model Type */}
          <div className="flex flex-col gap-1.5">
            <div className="flex items-center justify-between">
              <label className="text-neutral-300 font-medium flex items-center gap-1.5">
                <Cpu className="w-3.5 h-3.5 text-amber-400" />
                Target Prop Model
              </label>
              {onOpenGeometryModal && (
                <button
                  type="button"
                  onClick={onOpenGeometryModal}
                  className="text-amber-400 hover:text-amber-300 text-[11px] font-semibold underline cursor-pointer"
                >
                  Edit Geometry (180°/360°)
                </button>
              )}
            </div>
            <select
              disabled={disabled}
              value={config.propType}
              onChange={(e) =>
                onChangeConfig({ ...config, propType: e.target.value as PropModelType })
              }
              className="px-2.5 py-1.5 rounded-lg bg-neutral-950 border border-neutral-700 text-neutral-100 focus:outline-none focus:border-amber-500 transition cursor-pointer"
            >
              {PROP_OPTIONS.map((opt) => (
                <option key={opt} value={opt}>
                  {opt}
                </option>
              ))}
            </select>
            <span className="text-[11px] text-neutral-500">
              Optional override. Deduces topology automatically if left default.
            </span>
          </div>

          {/* Node / Pixel Count */}
          <div className="flex flex-col gap-1.5">
            <label className="text-neutral-300 font-medium flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              Pixel / Node Count
            </label>
            <input
              type="text"
              inputMode="numeric"
              disabled={disabled}
              value={nodeCountDraft}
              onChange={(e) => handleNodeCountChange(e.target.value)}
              onBlur={commitNodeCount}
              onKeyDown={(e) => e.key === 'Enter' && commitNodeCount()}
              className={`px-2.5 py-1.5 rounded-lg bg-neutral-950 border font-mono transition text-neutral-100 focus:outline-none ${
                nodeCountError ? 'border-red-500 ring-1 ring-red-500/40' : 'border-neutral-700 focus:border-amber-500'
              }`}
            />
            {nodeCountError ? (
              <span className="text-[10px] text-red-400 font-medium">{nodeCountError}</span>
            ) : (
              <span className="text-[11px] text-neutral-500">
                e.g. 50 (arch), 800 (16-strand tree), 2400 (matrix).
              </span>
            )}
          </div>

          {/* Submodel / Buffer Target */}
          <div className="flex flex-col gap-1.5">
            <label className="text-neutral-300 font-medium flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5 text-amber-400" />
              Submodel / Buffer Target
            </label>
            <select
              disabled={disabled}
              value={config.submodelTarget}
              onChange={(e) =>
                onChangeConfig({ ...config, submodelTarget: e.target.value as SubmodelTarget })
              }
              className="px-2.5 py-1.5 rounded-lg bg-neutral-950 border border-neutral-700 text-neutral-100 focus:outline-none focus:border-amber-500 transition cursor-pointer"
            >
              {SUBMODEL_OPTIONS.map((sub) => (
                <option key={sub} value={sub}>
                  {sub}
                </option>
              ))}
            </select>
            <span className="text-[11px] text-neutral-500">
              Target specific sub-sections (e.g. Star on Mini Tree).
            </span>
          </div>

          {/* Sequence Step Interval */}
          <div className="flex flex-col gap-1.5">
            <label className="text-neutral-300 font-medium flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-amber-400" />
              Timing Step Interval
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                disabled={disabled}
                onClick={() => onChangeConfig({ ...config, timingInterval: 50 })}
                className={`py-1.5 px-2 rounded-lg font-medium border text-center transition cursor-pointer ${
                  config.timingInterval === 50
                    ? 'bg-amber-500/20 text-amber-300 border-amber-500/50'
                    : 'bg-neutral-950 text-neutral-400 border-neutral-800 hover:text-white'
                }`}
              >
                50ms (20 FPS Standard)
              </button>
              <button
                type="button"
                disabled={disabled}
                onClick={() => onChangeConfig({ ...config, timingInterval: 25 })}
                className={`py-1.5 px-2 rounded-lg font-medium border text-center transition cursor-pointer ${
                  config.timingInterval === 25
                    ? 'bg-amber-500/20 text-amber-300 border-amber-500/50'
                    : 'bg-neutral-950 text-neutral-400 border-neutral-800 hover:text-white'
                }`}
              >
                25ms (40 FPS High-Def)
              </button>
            </div>
            <span className="text-[11px] text-neutral-500">
              xLights timeline resolution: 50ms (typical) or 25ms (fast audio sync).
            </span>
          </div>

          {/* Starting Layer & Blending Mode */}
          <div className="flex flex-col gap-1.5">
            <label className="text-neutral-300 font-medium flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5 text-amber-400" />
              Layer & Blending Mode
            </label>
            <div className="grid grid-cols-2 gap-2">
              <select
                disabled={disabled}
                value={config.startingLayer}
                onChange={(e) =>
                  onChangeConfig({ ...config, startingLayer: Number(e.target.value) })
                }
                className="px-2.5 py-1.5 rounded-lg bg-neutral-950 border border-neutral-700 text-neutral-100 focus:outline-none focus:border-amber-500 transition cursor-pointer"
              >
                {[1, 2, 3, 4, 5].map((l) => (
                  <option key={l} value={l}>
                    Layer {l}
                  </option>
                ))}
              </select>

              <select
                disabled={disabled}
                value={config.layerBlending}
                onChange={(e) =>
                  onChangeConfig({
                    ...config,
                    layerBlending: e.target.value as LayerBlendingMode,
                  })
                }
                className="px-2.5 py-1.5 rounded-lg bg-neutral-950 border border-neutral-700 text-neutral-100 focus:outline-none focus:border-amber-500 transition cursor-pointer"
              >
                {BLENDING_MODES.map((b) => (
                  <option key={b} value={b}>
                    {b}
                  </option>
                ))}
              </select>
            </div>
            <span className="text-[11px] text-neutral-500">
              Sequencer grid layer assignment and compositor blending.
            </span>
          </div>

          {/* Additional Notes */}
          <div className="flex flex-col gap-1.5">
            <label className="text-neutral-300 font-medium">
              Additional Sequencing Notes
            </label>
            <input
              type="text"
              disabled={disabled}
              placeholder="e.g. Needs smooth tail fade; chorus build-up"
              value={config.notes}
              onChange={(e) => onChangeConfig({ ...config, notes: e.target.value })}
              className="px-2.5 py-1.5 rounded-lg bg-neutral-950 border border-neutral-700 text-neutral-100 placeholder-neutral-600 focus:outline-none focus:border-amber-500 transition"
            />
            <span className="text-[11px] text-neutral-500">
              Context for AI model disambiguation and shader suggestions.
            </span>
          </div>
        </div>
      )}
    </div>
  );
};
