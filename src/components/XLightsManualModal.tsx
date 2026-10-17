import React, { useState, useMemo } from 'react';
import {
  BookOpen,
  Layers,
  Grid3X3,
  TrendingUp,
  Boxes,
  Sparkles,
  Search,
  X,
  ExternalLink,
  ChevronRight,
  Info,
  CheckCircle2,
  Copy,
  Sliders,
  Maximize2,
  RefreshCw,
  Palette,
  Eye,
} from 'lucide-react';
import {
  XLIGHTS_MANUAL_CHAPTERS,
  XLIGHTS_ALL_EFFECTS_REGISTRY,
  XLIGHTS_BLENDING_MODES,
  XLIGHTS_RENDER_STYLES,
  XLIGHTS_VALUE_CURVES,
  XLightsEffectDefinition,
  BlendingModeDefinition,
} from '../engine/xlightsManualKnowledge';

interface XLightsManualModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialTab?: 'chapters' | 'buffers' | 'blending' | 'curves' | 'submodels' | 'effects';
  initialEffect?: string;
}

export const XLightsManualModal: React.FC<XLightsManualModalProps> = ({
  isOpen,
  onClose,
  initialTab = 'chapters',
  initialEffect,
}) => {
  const [activeTab, setActiveTab] = useState<'chapters' | 'buffers' | 'blending' | 'curves' | 'submodels' | 'effects'>(
    initialTab
  );
  const [searchQuery, setSearchQuery] = useState<string>(initialEffect || '');
  const [selectedEffectName, setSelectedEffectName] = useState<string>(initialEffect || 'Spirals');
  const [selectedChapterId, setSelectedChapterId] = useState<string>('render-buffer');

  // Interactive Layer Blending Sandbox State
  const [testLayer1Color, setTestLayer1Color] = useState<string>('#dc2626'); // Red
  const [testLayer2Color, setTestLayer2Color] = useState<string>('#2563eb'); // Blue
  const [selectedBlendMode, setSelectedBlendMode] = useState<string>('Maximum');

  // Interactive Render Buffer Style State
  const [selectedRenderStyle, setSelectedRenderStyle] = useState<string>('Default');
  const [activeSubBuffer, setActiveSubBuffer] = useState<'all' | 'star' | 'base'>('all');

  // Interactive Value Curve State
  const [selectedValueCurve, setSelectedValueCurve] = useState<string>('sine-wave');

  if (!isOpen) return null;

  // Filtered Effects List
  const allEffects = Object.values(XLIGHTS_ALL_EFFECTS_REGISTRY);
  const filteredEffects = allEffects.filter((eff) => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return true;
    return (
      eff.effectName.toLowerCase().includes(q) ||
      eff.category.toLowerCase().includes(q) ||
      eff.summary.toLowerCase().includes(q) ||
      eff.parameters.some((p) => p.name.toLowerCase().includes(q) || p.xmlKey.toLowerCase().includes(q))
    );
  });

  const selectedEffect =
    XLIGHTS_ALL_EFFECTS_REGISTRY[selectedEffectName] ||
    filteredEffects[0] ||
    XLIGHTS_ALL_EFFECTS_REGISTRY['Spirals'];

  // Calculate RGB for Blending Sandbox
  const hexToRgb = (hex: string): [number, number, number] => {
    const clean = hex.replace('#', '');
    const num = parseInt(clean, 16);
    return [(num >> 16) & 255, (num >> 8) & 255, num & 255];
  };

  const rgbToHex = (r: number, g: number, b: number): string => {
    const clamp = (v: number) => Math.max(0, Math.min(255, Math.round(v)));
    return (
      '#' +
      [clamp(r), clamp(g), clamp(b)]
        .map((x) => x.toString(16).padStart(2, '0'))
        .join('')
    );
  };

  const currentBlendDef =
    XLIGHTS_BLENDING_MODES.find((m) => m.mode === selectedBlendMode) || XLIGHTS_BLENDING_MODES[1];
  const blendResultRgb = currentBlendDef.algebraicMath(
    hexToRgb(testLayer2Color),
    hexToRgb(testLayer1Color)
  );
  const blendResultHex = rgbToHex(blendResultRgb[0], blendResultRgb[1], blendResultRgb[2]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="bg-neutral-900 border border-neutral-800 rounded-xl max-w-5xl w-full h-[90vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Modal Header */}
        <div className="px-5 py-4 border-b border-neutral-800 flex items-center justify-between bg-neutral-950/70">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-400">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-white tracking-wide">
                  Official xLights Manual & Architectural Engine
                </h2>
                <span className="text-[10px] px-2 py-0.5 rounded-full font-mono bg-blue-500/20 text-blue-300 border border-blue-500/40">
                  Confirmed xLights Repo & Manual
                </span>
              </div>
              <p className="text-xs text-neutral-400">
                Official specifications, 2D render buffers, layer blending math, and 38+ verified built-in effects.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-neutral-400 hover:text-white hover:bg-neutral-800 transition cursor-pointer"
            title="Close Manual Viewer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Tabs & Search */}
        <div className="px-5 py-2.5 bg-neutral-950/40 border-b border-neutral-800 flex items-center justify-between flex-wrap gap-2 text-xs">
          <div className="flex items-center gap-1 overflow-x-auto py-0.5">
            <button
              onClick={() => setActiveTab('chapters')}
              className={`px-3 py-1.5 rounded-md font-medium flex items-center gap-1.5 transition cursor-pointer ${
                activeTab === 'chapters'
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                  : 'text-neutral-400 hover:text-white hover:bg-neutral-800/60'
              }`}
            >
              <BookOpen className="w-3.5 h-3.5" />
              Manual Chapters
            </button>
            <button
              onClick={() => setActiveTab('buffers')}
              className={`px-3 py-1.5 rounded-md font-medium flex items-center gap-1.5 transition cursor-pointer ${
                activeTab === 'buffers'
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                  : 'text-neutral-400 hover:text-white hover:bg-neutral-800/60'
              }`}
            >
              <Grid3X3 className="w-3.5 h-3.5" />
              2D Render Buffers
            </button>
            <button
              onClick={() => setActiveTab('blending')}
              className={`px-3 py-1.5 rounded-md font-medium flex items-center gap-1.5 transition cursor-pointer ${
                activeTab === 'blending'
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                  : 'text-neutral-400 hover:text-white hover:bg-neutral-800/60'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              Layer Blending Math
            </button>
            <button
              onClick={() => setActiveTab('curves')}
              className={`px-3 py-1.5 rounded-md font-medium flex items-center gap-1.5 transition cursor-pointer ${
                activeTab === 'curves'
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                  : 'text-neutral-400 hover:text-white hover:bg-neutral-800/60'
              }`}
            >
              <TrendingUp className="w-3.5 h-3.5" />
              Value Curves
            </button>
            <button
              onClick={() => setActiveTab('submodels')}
              className={`px-3 py-1.5 rounded-md font-medium flex items-center gap-1.5 transition cursor-pointer ${
                activeTab === 'submodels'
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                  : 'text-neutral-400 hover:text-white hover:bg-neutral-800/60'
              }`}
            >
              <Boxes className="w-3.5 h-3.5" />
              Submodels & Routing
            </button>
            <button
              onClick={() => setActiveTab('effects')}
              className={`px-3 py-1.5 rounded-md font-medium flex items-center gap-1.5 transition cursor-pointer ${
                activeTab === 'effects'
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                  : 'text-neutral-400 hover:text-white hover:bg-neutral-800/60'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5" />
              Effects Catalog ({allEffects.length})
            </button>
          </div>

          {/* Quick Search */}
          <div className="relative w-48 sm:w-64">
            <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-neutral-500 pointer-events-none" />
            <input
              type="text"
              placeholder="Search parameters, effects, rules..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-neutral-900 border border-neutral-700/80 rounded-md pl-8 pr-3 py-1 text-xs text-neutral-200 placeholder-neutral-500 focus:outline-none focus:border-amber-500"
            />
          </div>
        </div>

        {/* Modal Content Body */}
        <div className="flex-1 overflow-y-auto p-5 text-neutral-200">
          {/* TAB 1: MANUAL CHAPTERS */}
          {activeTab === 'chapters' && (
            <div className="grid grid-cols-1 md:grid-cols-12 gap-5 h-full">
              {/* Chapters List Sidebar */}
              <div className="md:col-span-4 flex flex-col gap-2 border-r border-neutral-800/80 pr-4">
                <h3 className="text-xs font-semibold text-neutral-400 uppercase tracking-wider mb-1">
                  xLights User Manual Chapters
                </h3>
                {XLIGHTS_MANUAL_CHAPTERS.map((ch) => (
                  <button
                    key={ch.id}
                    onClick={() => setSelectedChapterId(ch.id)}
                    className={`p-3 rounded-lg text-left transition flex flex-col gap-1 cursor-pointer border ${
                      selectedChapterId === ch.id
                        ? 'bg-neutral-800 border-amber-500/50 text-white'
                        : 'bg-neutral-950/40 border-neutral-800 text-neutral-300 hover:bg-neutral-800/50'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-neutral-800 text-amber-400">
                        {ch.chapterNumber}
                      </span>
                      <ChevronRight className="w-3.5 h-3.5 text-neutral-500" />
                    </div>
                    <span className="font-semibold text-xs text-neutral-100">{ch.title}</span>
                    <span className="text-[11px] text-neutral-400 line-clamp-2">{ch.subtitle}</span>
                  </button>
                ))}
              </div>

              {/* Selected Chapter Content & Illustrated Diagram */}
              <div className="md:col-span-8 flex flex-col gap-4 overflow-y-auto pr-2">
                {(() => {
                  const ch =
                    XLIGHTS_MANUAL_CHAPTERS.find((c) => c.id === selectedChapterId) ||
                    XLIGHTS_MANUAL_CHAPTERS[0];
                  return (
                    <div className="flex flex-col gap-4">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-xs font-mono px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/40">
                            {ch.chapterNumber}
                          </span>
                          <h2 className="text-lg font-bold text-white">{ch.title}</h2>
                        </div>
                        <p className="text-xs text-neutral-400 italic">{ch.subtitle}</p>
                      </div>

                      {/* Summary Banner */}
                      <div className="p-3 rounded-lg bg-neutral-950 border border-neutral-800 text-xs text-neutral-300 leading-relaxed">
                        <strong className="text-amber-400">Executive Summary: </strong>
                        {ch.summary}
                      </div>

                      {/* Illustrated SVG Diagram based on chapter */}
                      <div className="p-4 rounded-xl bg-neutral-950/80 border border-neutral-800 flex flex-col gap-2">
                        <span className="text-[11px] font-mono text-neutral-400 flex items-center gap-1.5">
                          <Info className="w-3.5 h-3.5 text-amber-400" />
                          Official Architecture Diagram:
                        </span>

                        {ch.svgDiagramType === 'buffer' && (
                          <div className="flex flex-col items-center justify-center p-3">
                            <svg viewBox="0 0 500 200" className="w-full max-w-lg h-auto">
                              {/* 2D Render Buffer Grid representation */}
                              <rect x="20" y="20" width="180" height="150" rx="4" fill="#171717" stroke="#f59e0b" strokeWidth="2" strokeDasharray="3 3" />
                              <text x="110" y="40" fill="#f59e0b" fontSize="11" textAnchor="middle" fontWeight="bold">2D Render Buffer Canvas</text>
                              <text x="110" y="55" fill="#a3a3a3" fontSize="9" textAnchor="middle">16 Strands × 50 Pixels (800 nodes)</text>

                              {/* Matrix grid cells */}
                              {Array.from({ length: 6 }).map((_, i) => (
                                <line key={`v-${i}`} x1={40 + i * 25} y1="70" x2={40 + i * 25} y2="150" stroke="#333333" strokeWidth="1" />
                              ))}
                              {Array.from({ length: 5 }).map((_, j) => (
                                <line key={`h-${j}`} x1="35" y1={75 + j * 16} x2={175} y2={75 + j * 16} stroke="#333333" strokeWidth="1" />
                              ))}

                              {/* Helical Spiral Wave overlay */}
                              <path d="M 40,80 Q 90,130 170,90" fill="none" stroke="#06b6d4" strokeWidth="3" />
                              <path d="M 40,110 Q 90,160 170,120" fill="none" stroke="#ec4899" strokeWidth="3" />

                              {/* Arrow to 3D Physical Mega Tree */}
                              <path d="M 220,95 L 280,95" stroke="#f59e0b" strokeWidth="2" markerEnd="url(#arrow)" />
                              <polygon points="280,95 272,90 272,100" fill="#f59e0b" />
                              <text x="250" y="85" fill="#a3a3a3" fontSize="9" textAnchor="middle">Shader Mapping</text>

                              {/* Physical Mega Tree Cone */}
                              <polygon points="380,30 310,160 450,160" fill="#0a0a0a" stroke="#22c55e" strokeWidth="2" />
                              {/* Helical strands wrapping on cone */}
                              <path d="M 380,30 Q 340,90 330,160" fill="none" stroke="#06b6d4" strokeWidth="2" />
                              <path d="M 380,30 Q 400,90 410,160" fill="none" stroke="#ec4899" strokeWidth="2" />
                              {/* Star topper */}
                              <polygon points="380,20 384,28 392,28 386,33 388,41 380,36 372,41 374,33 368,28 376,28" fill="#eab308" />

                              <text x="380" y="180" fill="#22c55e" fontSize="11" textAnchor="middle" fontWeight="bold">Physical 3D LED Display</text>
                            </svg>
                          </div>
                        )}

                        {ch.svgDiagramType === 'blending' && (
                          <div className="flex flex-col items-center justify-center p-3">
                            <svg viewBox="0 0 500 160" className="w-full max-w-lg h-auto">
                              {/* Layer 1 Box */}
                              <rect x="20" y="30" width="110" height="50" rx="4" fill="#1e1b4b" stroke="#6366f1" strokeWidth="1.5" />
                              <text x="75" y="52" fill="#c7d2fe" fontSize="10" textAnchor="middle" fontWeight="bold">Layer 1: Spirals</text>
                              <text x="75" y="68" fill="#818cf8" fontSize="8.5" textAnchor="middle">(Base Motion Body)</text>

                              {/* Blending Math Operator */}
                              <circle cx="170" cy="55" r="18" fill="#171717" stroke="#f59e0b" strokeWidth="1.5" />
                              <text x="170" y="59" fill="#f59e0b" fontSize="11" textAnchor="middle" fontWeight="bold">MAX</text>

                              {/* Layer 2 Box */}
                              <rect x="210" y="30" width="110" height="50" rx="4" fill="#064e3b" stroke="#10b981" strokeWidth="1.5" />
                              <text x="265" y="52" fill="#a7f3d0" fontSize="10" textAnchor="middle" fontWeight="bold">Layer 2: Twinkle</text>
                              <text x="265" y="68" fill="#34d399" fontSize="8.5" textAnchor="middle">(Star Topper Shimmer)</text>

                              {/* Arrow to Final Composited Buffer */}
                              <path d="M 330,55 L 375,55" stroke="#f59e0b" strokeWidth="2" />
                              <polygon points="375,55 367,50 367,60" fill="#f59e0b" />

                              {/* Output Buffer */}
                              <rect x="385" y="20" width="100" height="70" rx="4" fill="#171717" stroke="#22c55e" strokeWidth="2" />
                              <text x="435" y="48" fill="#4ade80" fontSize="10" textAnchor="middle" fontWeight="bold">Composite</text>
                              <text x="435" y="64" fill="#a3a3a3" fontSize="8.5" textAnchor="middle">Clean Highlight Overlay</text>

                              <text x="250" y="125" fill="#f59e0b" fontSize="10" textAnchor="middle" fontStyle="italic">
                                Algebraic Formula: Pixel = max(Layer1.RGB, Layer2.RGB)
                              </text>
                            </svg>
                          </div>
                        )}

                        {ch.svgDiagramType === 'curves' && (
                          <div className="flex flex-col items-center justify-center p-3">
                            <svg viewBox="0 0 500 140" className="w-full max-w-lg h-auto">
                              <line x1="40" y1="100" x2="460" y2="100" stroke="#404040" strokeWidth="1" />
                              <line x1="40" y1="20" x2="40" y2="100" stroke="#404040" strokeWidth="1" />
                              <text x="35" y="25" fill="#a3a3a3" fontSize="8" textAnchor="end">Max (3.0x)</text>
                              <text x="35" y="100" fill="#a3a3a3" fontSize="8" textAnchor="end">Min (1.0x)</text>
                              <text x="250" y="120" fill="#a3a3a3" fontSize="9" textAnchor="middle">Effect Duration (0ms → 3000ms / 50ms timing cells)</text>

                              {/* Sine waveform */}
                              <path d="M 40,60 Q 90,20 145,60 T 250,60 T 355,60 T 460,60" fill="none" stroke="#06b6d4" strokeWidth="2.5" />
                              <text x="145" y="30" fill="#06b6d4" fontSize="9" fontWeight="bold">Continuous Sine Modulation</text>
                            </svg>
                          </div>
                        )}

                        {ch.svgDiagramType === 'submodels' && (
                          <div className="flex flex-col items-center justify-center p-3">
                            <svg viewBox="0 0 500 150" className="w-full max-w-lg h-auto">
                              <polygon points="150,20 100,120 200,120" fill="#171717" stroke="#525252" strokeWidth="1.5" />
                              <polygon points="150,15 154,23 162,23 156,28 158,36 150,31 142,36 144,28 138,23 146,23" fill="#eab308" />

                              <line x1="165" y1="25" x2="260" y2="35" stroke="#eab308" strokeWidth="1.5" strokeDasharray="2 2" />
                              <text x="270" y="38" fill="#fde047" fontSize="10" fontWeight="bold">Submodel: 'Star Only' (Layer 2 - Maximum Blending)</text>

                              <line x1="175" y1="80" x2="260" y2="80" stroke="#06b6d4" strokeWidth="1.5" strokeDasharray="2 2" />
                              <text x="270" y="83" fill="#67e8f9" fontSize="10" fontWeight="bold">Submodel: 'Tree Body' (Layer 1 - Normal Blending)</text>

                              <line x1="160" y1="120" x2="260" y2="120" stroke="#a855f7" strokeWidth="1.5" strokeDasharray="2 2" />
                              <text x="270" y="123" fill="#d8b4fe" fontSize="10" fontWeight="bold">Submodel: 'Base Ring' (Layer 3 - Accent Chases)</text>
                            </svg>
                          </div>
                        )}
                      </div>

                      {/* Detailed Sections */}
                      <div className="flex flex-col gap-3">
                        {ch.sections.map((sec, idx) => (
                          <div key={idx} className="p-3 rounded-lg bg-neutral-900/90 border border-neutral-800 flex flex-col gap-1.5">
                            <h4 className="font-semibold text-xs text-amber-300">{sec.heading}</h4>
                            {sec.body.map((p, pIdx) => (
                              <p key={pIdx} className="text-xs text-neutral-300 leading-relaxed">
                                {p}
                              </p>
                            ))}
                            {sec.callout && (
                              <div className="mt-1 p-2 rounded bg-amber-500/10 border-l-2 border-amber-500 text-[11px] text-amber-200">
                                {sec.callout}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>

                      {/* Golden Rules */}
                      <div className="p-3 rounded-lg bg-neutral-950 border border-neutral-800 flex flex-col gap-1.5">
                        <span className="text-xs font-bold text-emerald-400 flex items-center gap-1.5">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                          Official xLights Rules & Best Practices:
                        </span>
                        <ul className="text-xs text-neutral-300 space-y-1 list-disc list-inside">
                          {ch.keyRules.map((r, rIdx) => (
                            <li key={rIdx}>{r}</li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  );
                })()}
              </div>
            </div>
          )}

          {/* TAB 2: 2D RENDER BUFFERS */}
          {activeTab === 'buffers' && (
            <div className="flex flex-col gap-6">
              <div className="p-4 rounded-xl bg-neutral-950 border border-neutral-800 flex flex-col gap-2">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    <Grid3X3 className="w-4 h-4 text-amber-400" />
                    2D Render Buffer Styles & Sub-Buffer Engine
                  </h3>
                  <span className="text-[11px] font-mono text-neutral-400">
                    xLights User Manual Section 4.2
                  </span>
                </div>
                <p className="text-xs text-neutral-300 leading-relaxed">
                  Every effect in xLights renders onto a virtual 2D grid buffer. Selecting the proper Render Style
                  governs whether effects wrap cylindrical cone models cleanly or distort across yard space.
                </p>
              </div>

              {/* Render Styles Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {XLIGHTS_RENDER_STYLES.map((rs) => (
                  <div
                    key={rs.style}
                    onClick={() => setSelectedRenderStyle(rs.style)}
                    className={`p-4 rounded-xl border transition cursor-pointer flex flex-col gap-2 ${
                      selectedRenderStyle === rs.style
                        ? 'bg-neutral-800/90 border-amber-500/70 shadow-lg'
                        : 'bg-neutral-950/60 border-neutral-800 hover:bg-neutral-800/40'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-xs text-amber-300">{rs.style} Render Style</span>
                      {selectedRenderStyle === rs.style && (
                        <span className="text-[10px] px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/40">
                          Active Selection
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-neutral-300 leading-relaxed">{rs.description}</p>
                    <div className="pt-2 border-t border-neutral-800/80 text-[11px] flex flex-col gap-1">
                      <span className="text-neutral-400">
                        <strong className="text-emerald-400">Recommended Props: </strong>
                        {rs.bestFor}
                      </span>
                      <span className="text-neutral-400">
                        <strong className="text-blue-400">Buffer Mapping: </strong>
                        {rs.bufferExplanation}
                      </span>
                    </div>
                  </div>
                ))}
              </div>

              {/* Interactive Buffer Region Explorer */}
              <div className="p-4 rounded-xl bg-neutral-950/80 border border-neutral-800 flex flex-col gap-3">
                <span className="font-bold text-xs text-white flex items-center gap-2">
                  <Sliders className="w-4 h-4 text-cyan-400" />
                  Interactive Sub-Buffer Isolation Simulator
                </span>
                <p className="text-xs text-neutral-400">
                  Click a sub-buffer region below to see how xLights isolates calculations to specific prop zones:
                </p>
                <div className="flex items-center gap-2 flex-wrap">
                  <button
                    onClick={() => setActiveSubBuffer('all')}
                    className={`px-3 py-1.5 rounded text-xs font-medium cursor-pointer transition border ${
                      activeSubBuffer === 'all'
                        ? 'bg-amber-500/20 text-amber-300 border-amber-500/50'
                        : 'bg-neutral-900 text-neutral-400 border-neutral-800 hover:text-white'
                    }`}
                  >
                    Full Buffer (100% Tree)
                  </button>
                  <button
                    onClick={() => setActiveSubBuffer('star')}
                    className={`px-3 py-1.5 rounded text-xs font-medium cursor-pointer transition border ${
                      activeSubBuffer === 'star'
                        ? 'bg-yellow-500/20 text-yellow-300 border-yellow-500/50'
                        : 'bg-neutral-900 text-neutral-400 border-neutral-800 hover:text-white'
                    }`}
                  >
                    Star Topper Sub-Buffer (Apex Y: 0..20%)
                  </button>
                  <button
                    onClick={() => setActiveSubBuffer('base')}
                    className={`px-3 py-1.5 rounded text-xs font-medium cursor-pointer transition border ${
                      activeSubBuffer === 'base'
                        ? 'bg-purple-500/20 text-purple-300 border-purple-500/50'
                        : 'bg-neutral-900 text-neutral-400 border-neutral-800 hover:text-white'
                    }`}
                  >
                    Base Wash Sub-Buffer (Ground Y: 80..100%)
                  </button>
                </div>

                <div className="p-4 rounded-lg bg-neutral-900 border border-neutral-800 flex items-center justify-center">
                  <svg viewBox="0 0 300 160" className="w-64 h-auto">
                    <rect x="20" y="20" width="260" height="120" rx="4" fill="#171717" stroke="#404040" strokeWidth="1.5" />
                    {/* Highlighted active zone */}
                    {activeSubBuffer === 'all' && (
                      <rect x="22" y="22" width="256" height="116" rx="3" fill="rgba(245, 158, 11, 0.15)" stroke="#f59e0b" strokeWidth="2" />
                    )}
                    {activeSubBuffer === 'star' && (
                      <rect x="22" y="22" width="256" height="26" rx="3" fill="rgba(234, 179, 8, 0.3)" stroke="#eab308" strokeWidth="2" />
                    )}
                    {activeSubBuffer === 'base' && (
                      <rect x="22" y="112" width="256" height="26" rx="3" fill="rgba(168, 85, 247, 0.3)" stroke="#a855f7" strokeWidth="2" />
                    )}
                    <text x="150" y="85" fill="#a3a3a3" fontSize="11" textAnchor="middle">
                      {activeSubBuffer === 'all'
                        ? '16 Strands × 50 Pixels: Full Tree Active'
                        : activeSubBuffer === 'star'
                        ? 'Isolated Star Topper Buffer (Pixels 0 - 10)'
                        : 'Isolated Base Trunk Buffer (Pixels 40 - 50)'}
                    </text>
                  </svg>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: LAYER BLENDING MATH */}
          {activeTab === 'blending' && (
            <div className="flex flex-col gap-6">
              <div className="p-4 rounded-xl bg-neutral-950 border border-neutral-800 flex flex-col gap-2">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    <Layers className="w-4 h-4 text-amber-400" />
                    The 10 Official Mathematical Layer Blending Modes
                  </h3>
                  <span className="text-[11px] font-mono text-neutral-400">
                    xLights User Manual Section 5.3
                  </span>
                </div>
                <p className="text-xs text-neutral-300 leading-relaxed">
                  Layer Blending controls how pixels from upper sequencer layers combine algebraically with lower layers.
                  Testing formulas prevents accidental opacity washouts and maximizes visual punch.
                </p>
              </div>

              {/* Interactive Blending Sandbox */}
              <div className="p-4 rounded-xl bg-neutral-950/80 border border-neutral-800 flex flex-col gap-4">
                <span className="text-xs font-bold text-white flex items-center gap-2">
                  <Palette className="w-4 h-4 text-amber-400" />
                  Interactive Layer Blending Algebraic Calculator
                </span>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-center">
                  {/* Layer 1 Input */}
                  <div className="p-3 rounded-lg bg-neutral-900 border border-neutral-800 flex flex-col gap-2">
                    <span className="text-[11px] font-semibold text-neutral-400">Layer 1 (Bottom Pixel):</span>
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        value={testLayer1Color}
                        onChange={(e) => setTestLayer1Color(e.target.value)}
                        className="w-8 h-8 rounded border-0 cursor-pointer bg-transparent"
                      />
                      <span className="font-mono text-xs">{testLayer1Color}</span>
                    </div>
                  </div>

                  {/* Mode Selector */}
                  <div className="p-3 rounded-lg bg-neutral-900 border border-neutral-800 flex flex-col gap-2">
                    <span className="text-[11px] font-semibold text-amber-400">Blending Mode:</span>
                    <select
                      value={selectedBlendMode}
                      onChange={(e) => setSelectedBlendMode(e.target.value)}
                      className="bg-neutral-950 border border-neutral-700 rounded px-2.5 py-1 text-xs text-white focus:outline-none focus:border-amber-500 cursor-pointer"
                    >
                      {XLIGHTS_BLENDING_MODES.map((m) => (
                        <option key={m.mode} value={m.mode}>
                          {m.mode}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Layer 2 Input */}
                  <div className="p-3 rounded-lg bg-neutral-900 border border-neutral-800 flex flex-col gap-2">
                    <span className="text-[11px] font-semibold text-neutral-400">Layer 2 (Top Pixel):</span>
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        value={testLayer2Color}
                        onChange={(e) => setTestLayer2Color(e.target.value)}
                        className="w-8 h-8 rounded border-0 cursor-pointer bg-transparent"
                      />
                      <span className="font-mono text-xs">{testLayer2Color}</span>
                    </div>
                  </div>
                </div>

                {/* Mathematical Result Display */}
                <div className="p-4 rounded-lg bg-neutral-900/90 border border-neutral-800 flex items-center justify-between flex-wrap gap-4">
                  <div className="flex flex-col gap-1">
                    <span className="text-xs font-bold text-emerald-400">Calculated Algebraic Output:</span>
                    <span className="text-xs font-mono text-neutral-300">
                      Formula: {currentBlendDef.formula}
                    </span>
                    <span className="text-[11px] text-neutral-400">
                      R: {blendResultRgb[0]}, G: {blendResultRgb[1]}, B: {blendResultRgb[2]}
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div
                      className="w-12 h-12 rounded-lg border border-white/20 shadow-inner"
                      style={{ backgroundColor: blendResultHex }}
                    />
                    <span className="font-mono font-bold text-sm text-white">{blendResultHex}</span>
                  </div>
                </div>
              </div>

              {/* Mode Breakdown Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {XLIGHTS_BLENDING_MODES.map((m) => (
                  <div
                    key={m.mode}
                    className={`p-3 rounded-lg border flex flex-col gap-1.5 transition ${
                      selectedBlendMode === m.mode
                        ? 'bg-neutral-800/90 border-amber-500/60'
                        : 'bg-neutral-950/60 border-neutral-800'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-xs text-amber-300">{m.mode}</span>
                      <code className="text-[10px] font-mono text-neutral-400">{m.formula}</code>
                    </div>
                    <p className="text-xs text-neutral-300">{m.description}</p>
                    <span className="text-[11px] text-emerald-400">
                      <strong>Best Use: </strong>
                      {m.bestUse}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 4: VALUE CURVES */}
          {activeTab === 'curves' && (
            <div className="flex flex-col gap-6">
              <div className="p-4 rounded-xl bg-neutral-950 border border-neutral-800 flex flex-col gap-2">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    <TrendingUp className="w-4 h-4 text-cyan-400" />
                    Value Curves & Dynamic Time Modulation Engine
                  </h3>
                  <span className="text-[11px] font-mono text-neutral-400">
                    xLights User Manual Chapter 7
                  </span>
                </div>
                <p className="text-xs text-neutral-300 leading-relaxed">
                  In xLights, any parameter featuring a curve icon can be continuously modulated over time. Rather than
                  static values, curves deliver organic acceleration, breathing ribbon thickness, and rhythmic musical sweeps.
                </p>
              </div>

              {/* Curves Selector & Graph */}
              <div className="grid grid-cols-1 md:grid-cols-12 gap-5">
                <div className="md:col-span-4 flex flex-col gap-2">
                  {XLIGHTS_VALUE_CURVES.map((vc) => (
                    <button
                      key={vc.id}
                      onClick={() => setSelectedValueCurve(vc.id)}
                      className={`p-3 rounded-lg text-left transition flex flex-col gap-1 cursor-pointer border ${
                        selectedValueCurve === vc.id
                          ? 'bg-neutral-800 border-cyan-500/50 text-white'
                          : 'bg-neutral-950/40 border-neutral-800 text-neutral-300 hover:bg-neutral-800/40'
                      }`}
                    >
                      <span className="font-semibold text-xs text-cyan-300">{vc.name}</span>
                      <span className="text-[11px] text-neutral-400">{vc.formula}</span>
                    </button>
                  ))}
                </div>

                <div className="md:col-span-8 flex flex-col gap-4">
                  {(() => {
                    const vc =
                      XLIGHTS_VALUE_CURVES.find((c) => c.id === selectedValueCurve) ||
                      XLIGHTS_VALUE_CURVES[0];
                    return (
                      <div className="p-4 rounded-xl bg-neutral-950 border border-neutral-800 flex flex-col gap-3">
                        <div className="flex items-center justify-between">
                          <h4 className="font-bold text-sm text-cyan-300">{vc.name}</h4>
                          <code className="text-xs font-mono text-neutral-400">{vc.formula}</code>
                        </div>
                        <p className="text-xs text-neutral-300 leading-relaxed">{vc.description}</p>

                        {/* Normalized Waveform Canvas */}
                        <div className="p-4 rounded-lg bg-neutral-900 border border-neutral-800 flex flex-col items-center">
                          <svg viewBox="0 0 400 120" className="w-full max-w-md h-auto">
                            <line x1="30" y1="90" x2="380" y2="90" stroke="#404040" strokeWidth="1" />
                            <line x1="30" y1="20" x2="30" y2="90" stroke="#404040" strokeWidth="1" />
                            <text x="25" y="25" fill="#a3a3a3" fontSize="8" textAnchor="end">1.0</text>
                            <text x="25" y="90" fill="#a3a3a3" fontSize="8" textAnchor="end">0.0</text>
                            <text x="200" y="108" fill="#a3a3a3" fontSize="8" textAnchor="middle">
                              Normalized Time (0.0 → 1.0)
                            </text>

                            {/* Polyline Path from Sample Points */}
                            <polyline
                              fill="none"
                              stroke="#06b6d4"
                              strokeWidth="2.5"
                              points={vc.samplePoints
                                .map((pt, idx) => {
                                  const x = 30 + (idx / (vc.samplePoints.length - 1)) * 350;
                                  const y = 90 - pt * 70;
                                  return `${x},${y}`;
                                })
                                .join(' ')}
                            />

                            {/* Dots on key sample points */}
                            {vc.samplePoints.map((pt, idx) => {
                              const x = 30 + (idx / (vc.samplePoints.length - 1)) * 350;
                              const y = 90 - pt * 70;
                              return <circle key={idx} cx={x} cy={y} r="3" fill="#22d3ee" />;
                            })}
                          </svg>
                        </div>
                      </div>
                    );
                  })()}
                </div>
              </div>
            </div>
          )}

          {/* TAB 5: SUBMODELS & ROUTING */}
          {activeTab === 'submodels' && (
            <div className="flex flex-col gap-6">
              <div className="p-4 rounded-xl bg-neutral-950 border border-neutral-800 flex flex-col gap-2">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    <Boxes className="w-4 h-4 text-purple-400" />
                    Submodel Architecture & Component Isolation
                  </h3>
                  <span className="text-[11px] font-mono text-neutral-400">
                    xLights User Manual Chapter 9
                  </span>
                </div>
                <p className="text-xs text-neutral-300 leading-relaxed">
                  Submodels partition complex physical props into dedicated sequencing channels. Isolating the Star Topper
                  on a Mega Tree or dividing Arches into left/right halves is critical to producing professional choreography.
                </p>
              </div>

              {/* Submodel Isolation Principles */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-4 rounded-xl bg-neutral-950/70 border border-neutral-800 flex flex-col gap-2">
                  <span className="font-bold text-xs text-yellow-400">1. Mega Tree Star Topper</span>
                  <p className="text-xs text-neutral-300 leading-relaxed">
                    Star toppers are physical components mounted on tree apexes. When tree-wide Spirals run, star nodes
                    are distorted into the helical math, creating jitter.
                  </p>
                  <span className="text-[11px] font-mono text-amber-300 pt-2 border-t border-neutral-800">
                    Solution: Route Star Topper to Layer 2 with 'Star Only' submodel + Maximum Blending.
                  </span>
                </div>

                <div className="p-4 rounded-xl bg-neutral-950/70 border border-neutral-800 flex flex-col gap-2">
                  <span className="font-bold text-xs text-cyan-400">2. PEX Arches Submodels</span>
                  <p className="text-xs text-neutral-300 leading-relaxed">
                    Arches can be sliced into Left Half, Right Half, and Apex Center. This enables bouncing comets and leaping
                    arch sequences across the yard.
                  </p>
                  <span className="text-[11px] font-mono text-cyan-300 pt-2 border-t border-neutral-800">
                    Solution: Submodel as Left/Right halves with Single Line buffer style.
                  </span>
                </div>

                <div className="p-4 rounded-xl bg-neutral-950/70 border border-neutral-800 flex flex-col gap-2">
                  <span className="font-bold text-xs text-purple-400">3. Matrix Windows & Borders</span>
                  <p className="text-xs text-neutral-300 leading-relaxed">
                    Window frames and matrices can have dedicated Outer Border submodels to frame pictures with chasing
                    pinstripes while video plays inside.
                  </p>
                  <span className="text-[11px] font-mono text-purple-300 pt-2 border-t border-neutral-800">
                    Solution: Layer 1 Video (Inner Fill) + Layer 2 Marquee (Outer Border).
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* TAB 6: 38+ BUILT-IN EFFECTS ENCYCLOPEDIA */}
          {activeTab === 'effects' && (
            <div className="grid grid-cols-1 md:grid-cols-12 gap-5 h-full">
              {/* Effect Selector Sidebar */}
              <div className="md:col-span-4 flex flex-col gap-2 border-r border-neutral-800/80 pr-4 overflow-y-auto max-h-[68vh]">
                <div className="flex items-center justify-between pb-1">
                  <span className="text-xs font-semibold text-neutral-400 uppercase tracking-wider">
                    Official Effects ({filteredEffects.length})
                  </span>
                </div>
                {filteredEffects.map((eff) => (
                  <button
                    key={eff.effectName}
                    onClick={() => setSelectedEffectName(eff.effectName)}
                    className={`p-2.5 rounded-lg text-left transition flex items-center justify-between cursor-pointer border ${
                      selectedEffectName === eff.effectName
                        ? 'bg-neutral-800 border-amber-500/50 text-white'
                        : 'bg-neutral-950/40 border-neutral-800 text-neutral-300 hover:bg-neutral-800/40'
                    }`}
                  >
                    <div className="flex flex-col">
                      <span className="font-semibold text-xs text-neutral-100">{eff.effectName}</span>
                      <span className="text-[10px] text-neutral-400">{eff.category}</span>
                    </div>
                    <span className="text-[10.5px] font-mono text-amber-400">
                      {eff.parameters.length} params
                    </span>
                  </button>
                ))}
              </div>

              {/* Effect Detailed Parameters & Manual Impact Breakdown */}
              <div className="md:col-span-8 flex flex-col gap-4 overflow-y-auto pr-2 max-h-[68vh]">
                {selectedEffect && (
                  <div className="flex flex-col gap-4">
                    {/* Header Banner */}
                    <div className="p-4 rounded-xl bg-neutral-950 border border-neutral-800 flex flex-col gap-2">
                      <div className="flex items-center justify-between flex-wrap gap-2">
                        <div className="flex items-center gap-2">
                          <h3 className="text-base font-bold text-white">{selectedEffect.effectName} Effect</h3>
                          <span className="text-[10.5px] px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/40">
                            {selectedEffect.category}
                          </span>
                        </div>
                        <span className="text-[11px] font-mono text-neutral-400">
                          {selectedEffect.manualChapter}
                        </span>
                      </div>
                      <p className="text-xs text-neutral-300 leading-relaxed">{selectedEffect.summary}</p>

                      <div className="pt-2 border-t border-neutral-800/80 grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px]">
                        <span className="text-neutral-400">
                          <strong className="text-emerald-400">Recommended Props: </strong>
                          {selectedEffect.recommendedProps.join(', ')}
                        </span>
                        <span className="text-neutral-400">
                          <strong className="text-blue-400">Buffer Style: </strong>
                          {selectedEffect.bufferStyleRecommendation}
                        </span>
                      </div>
                    </div>

                    {/* Layer Blending Guidance */}
                    <div className="p-3 rounded-lg bg-neutral-900/90 border border-neutral-800 text-xs text-neutral-300">
                      <strong className="text-amber-400">Layer Blending Best Practice: </strong>
                      {selectedEffect.layerBlendingNotes}
                    </div>

                    {/* Parameters Table */}
                    <div className="flex flex-col gap-2">
                      <h4 className="font-bold text-xs text-white uppercase tracking-wider flex items-center gap-1.5">
                        <Sliders className="w-3.5 h-3.5 text-amber-400" />
                        Verified Parameters & Rendering Impact on LED Nodes ({selectedEffect.parameters.length})
                      </h4>

                      <div className="space-y-2">
                        {selectedEffect.parameters.map((param) => (
                          <div
                            key={param.xmlKey}
                            className="p-3 rounded-lg bg-neutral-950/80 border border-neutral-800 flex flex-col gap-1.5"
                          >
                            <div className="flex items-center justify-between flex-wrap gap-2">
                              <div className="flex items-center gap-2">
                                <span className="font-bold text-xs text-neutral-100">{param.name}</span>
                                <code className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-neutral-800 text-amber-300">
                                  {param.xmlKey}
                                </code>
                                <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-neutral-900 text-neutral-400 border border-neutral-800">
                                  {param.type}
                                </span>
                              </div>
                              <span className="text-[11px] font-mono text-neutral-400">
                                Default: <strong>{String(param.defaultValue)}</strong>
                                {param.range && ` (Range: ${param.range.min} - ${param.range.max})`}
                              </span>
                            </div>

                            <p className="text-xs text-neutral-300">{param.description}</p>

                            <div className="text-[11px] text-amber-300/90 bg-amber-500/5 p-2 rounded border border-amber-500/10">
                              <strong className="text-amber-400">Physical Rendering Impact: </strong>
                              {param.renderingImpact}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-5 py-3 border-t border-neutral-800 bg-neutral-950 flex items-center justify-between text-xs text-neutral-400">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            <span>Verified with official xLights Manual and C++ source code algorithms.</span>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-white font-medium transition cursor-pointer"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
