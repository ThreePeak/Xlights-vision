import React, { useState, useRef, useEffect } from 'react';
import {
  Sparkles,
  Camera,
  Monitor,
  Upload,
  Link2,
  Youtube,
  Terminal,
  Zap,
  FolderOpen,
  ChevronDown,
  Plus,
  Scissors,
  Trash2,
  Edit2,
  Check,
  X,
  Layers,
  BookOpen,
} from 'lucide-react';
import { PRESET_SEQUENCES, PresetSequence } from '../engine/presetSequences';
import { AnalysisSession } from '../types/xlights';

interface HeaderProps {
  presets: PresetSequence[];
  activePresetId: string;
  onSelectPreset: (preset: PresetSequence) => void;
  onRenamePreset?: (presetId: string, newName: string) => void;
  onUploadClick: () => void;
  onScreenShareClick: () => void;
  onCameraClick: () => void;
  onUrlInputClick: () => void;
  onOpenPythonGuide: () => void;
  onOpenManual: () => void;
  isAnalyzing: boolean;
  // Session History Management
  sessions: AnalysisSession[];
  activeSessionId: string;
  onSelectSession: (sessionId: string) => void;
  onCreatePropSlice: () => void;
  onCreateNewSession: () => void;
  onRenameSession: (sessionId: string, newName: string) => void;
  onDeleteSession: (sessionId: string) => void;
}

export const Header: React.FC<HeaderProps> = ({
  presets,
  activePresetId,
  onSelectPreset,
  onRenamePreset,
  onUploadClick,
  onScreenShareClick,
  onCameraClick,
  onUrlInputClick,
  onOpenPythonGuide,
  onOpenManual,
  isAnalyzing,
  sessions,
  activeSessionId,
  onSelectSession,
  onCreatePropSlice,
  onCreateNewSession,
  onRenameSession,
  onDeleteSession,
}) => {
  const [isSessionDropdownOpen, setIsSessionDropdownOpen] = useState<boolean>(false);
  const [editingSessionId, setEditingSessionId] = useState<string | null>(null);
  const [renameText, setRenameText] = useState<string>('');
  const [editingPresetId, setEditingPresetId] = useState<string | null>(null);
  const [presetRenameText, setPresetRenameText] = useState<string>('');
  const dropdownRef = useRef<HTMLDivElement>(null);

  const activeSession = sessions.find((s) => s.id === activeSessionId) || sessions[0];

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsSessionDropdownOpen(false);
        setEditingSessionId(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleStartRename = (session: AnalysisSession, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingSessionId(session.id);
    setRenameText(session.name);
  };

  const handleConfirmRename = (sessionId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (renameText.trim()) {
      onRenameSession(sessionId, renameText.trim());
    }
    setEditingSessionId(null);
  };

  return (
    <header className="border-b border-neutral-800 bg-neutral-900/95 backdrop-blur-md sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 py-2.5">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
          {/* Logo & Session Switcher */}
          <div className="flex items-center gap-3 flex-wrap">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-amber-500 to-red-600 flex items-center justify-center shadow-lg shadow-amber-500/20 text-neutral-950 font-black text-lg">
                <Zap className="w-4 h-4 fill-neutral-950" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="font-bold text-sm tracking-tight text-neutral-100">
                    xLights Vision
                  </h1>
                  <span className="text-xs text-neutral-500">·</span>
                  <span className="text-[11px] font-mono text-amber-400">v2.1 Workstation</span>
                </div>
              </div>
            </div>

            {/* TOP-BAR SESSION SELECTOR DROPDOWN */}
            <div className="relative" ref={dropdownRef}>
              <button
                type="button"
                onClick={() => setIsSessionDropdownOpen(!isSessionDropdownOpen)}
                className="px-2.5 py-1.5 rounded-lg bg-neutral-950 border border-neutral-800 hover:border-neutral-700 text-neutral-200 text-xs font-medium flex items-center gap-2 transition cursor-pointer max-w-xs sm:max-w-md shadow-inner"
                title="Switch between past analysis runs and prop slices"
              >
                <FolderOpen className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                <span className="font-semibold text-neutral-100 truncate">
                  {activeSession?.name || 'Session'}
                </span>
                <span className="px-1.5 py-0.2 rounded bg-neutral-900 text-[10px] font-mono text-neutral-400 border border-neutral-800 shrink-0">
                  {activeSession?.userConfig.propType || 'Prop'}
                </span>
                {activeSession?.analysisResult && (
                  <span className="text-[10px] text-emerald-400 font-bold shrink-0">
                    {activeSession.analysisResult.primaryRecipe.tradeOff.visualMatchPercentage}%
                  </span>
                )}
                <ChevronDown className="w-3.5 h-3.5 text-neutral-400 shrink-0 ml-0.5" />
              </button>

              {/* Sessions Dropdown Menu */}
              {isSessionDropdownOpen && (
                <div className="absolute left-0 mt-1.5 w-80 sm:w-96 rounded-xl bg-neutral-950 border border-neutral-800 shadow-2xl p-2 z-50 flex flex-col gap-1.5 text-xs animate-in fade-in zoom-in-95 duration-100">
                  <div className="px-2 py-1 border-b border-neutral-800/80 flex items-center justify-between text-neutral-400">
                    <span className="font-semibold text-[11px] text-neutral-300">
                      Saved Analysis Sessions ({sessions.length})
                    </span>
                    <span className="text-[10px] text-neutral-500">Auto-persisted</span>
                  </div>

                  {/* Sessions List */}
                  <div className="max-h-60 overflow-y-auto flex flex-col gap-1 pr-1">
                    {sessions.map((session) => {
                      const isSelected = session.id === activeSessionId;
                      const hasResult = !!session.analysisResult;
                      const isEditing = editingSessionId === session.id;

                      return (
                        <div
                          key={session.id}
                          onClick={() => {
                            if (!isEditing) {
                              onSelectSession(session.id);
                              setIsSessionDropdownOpen(false);
                            }
                          }}
                          className={`p-2 rounded-lg border transition flex items-center justify-between gap-2 cursor-pointer ${
                            isSelected
                              ? 'bg-neutral-900 border-amber-500/50 shadow-sm'
                              : 'bg-neutral-950/60 border-neutral-850 hover:bg-neutral-900/60 hover:border-neutral-800'
                          }`}
                        >
                          <div className="flex flex-col min-w-0 flex-1">
                            {isEditing ? (
                              <div
                                className="flex items-center gap-1"
                                onClick={(e) => e.stopPropagation()}
                              >
                                <input
                                  type="text"
                                  value={renameText}
                                  onChange={(e) => setRenameText(e.target.value)}
                                  className="flex-1 px-1.5 py-0.5 rounded bg-neutral-900 border border-neutral-700 text-xs text-neutral-100"
                                  autoFocus
                                />
                                <button
                                  type="button"
                                  onClick={(e) => handleConfirmRename(session.id, e)}
                                  className="p-1 rounded bg-amber-500 text-neutral-950 hover:bg-amber-400"
                                >
                                  <Check className="w-3 h-3" />
                                </button>
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setEditingSessionId(null);
                                  }}
                                  className="p-1 rounded bg-neutral-800 text-neutral-400 hover:text-white"
                                >
                                  <X className="w-3 h-3" />
                                </button>
                              </div>
                            ) : (
                              <div className="flex items-center gap-1.5">
                                <span
                                  className={`font-semibold truncate text-xs ${
                                    isSelected ? 'text-amber-300' : 'text-neutral-200'
                                  }`}
                                >
                                  {session.name}
                                </span>
                              </div>
                            )}

                            <div className="flex items-center gap-2 text-[10px] text-neutral-500 mt-0.5">
                              <span className="text-neutral-400">
                                {session.userConfig.propType}
                              </span>
                              <span>·</span>
                              <span>
                                {hasResult
                                  ? `${session.analysisResult?.primaryRecipe.tradeOff.visualMatchPercentage}% match`
                                  : 'Draft / Unanalyzed'}
                              </span>
                              <span>·</span>
                              <span>
                                {new Date(session.createdAt).toLocaleTimeString([], {
                                  hour: '2-digit',
                                  minute: '2-digit',
                                })}
                              </span>
                            </div>
                          </div>

                          {/* Action icons */}
                          {!isEditing && (
                            <div className="flex items-center gap-1 shrink-0">
                              <button
                                type="button"
                                onClick={(e) => handleStartRename(session, e)}
                                className="p-1 rounded text-neutral-500 hover:text-neutral-300 hover:bg-neutral-800"
                                title="Rename Session"
                              >
                                <Edit2 className="w-3 h-3" />
                              </button>
                              {sessions.length > 1 && (
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    onDeleteSession(session.id);
                                  }}
                                  className="p-1 rounded text-neutral-500 hover:text-red-400 hover:bg-neutral-800"
                                  title="Delete Session"
                                >
                                  <Trash2 className="w-3 h-3" />
                                </button>
                              )}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>

                  {/* Bottom Session Actions */}
                  <div className="pt-2 border-t border-neutral-800/80 grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        onCreatePropSlice();
                        setIsSessionDropdownOpen(false);
                      }}
                      className="px-2.5 py-1.5 rounded-lg bg-neutral-900 hover:bg-neutral-800 text-amber-300 border border-neutral-800 hover:border-amber-500/40 text-[11px] font-semibold flex items-center justify-center gap-1.5 transition cursor-pointer"
                      title="Keep current video, create a new session to isolate another prop"
                    >
                      <Scissors className="w-3 h-3 text-amber-400" />
                      + New Prop Slice
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        onCreateNewSession();
                        setIsSessionDropdownOpen(false);
                      }}
                      className="px-2.5 py-1.5 rounded-lg bg-neutral-900 hover:bg-neutral-800 text-neutral-200 border border-neutral-800 hover:border-neutral-700 text-[11px] font-semibold flex items-center justify-center gap-1.5 transition cursor-pointer"
                    >
                      <Plus className="w-3 h-3 text-neutral-400" />
                      + New Session
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Input Modality Actions */}
          <div className="flex items-center flex-wrap gap-1.5">
            <button
              onClick={onUploadClick}
              disabled={isAnalyzing}
              className="px-2.5 py-1.5 text-xs font-medium rounded-md bg-neutral-800 hover:bg-neutral-700 text-neutral-200 hover:text-white border border-neutral-700/80 transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
              title="Upload MP4, MKV, MOV, or WebM"
            >
              <Upload className="w-3.5 h-3.5 text-amber-400" />
              Upload Video
            </button>

            <button
              onClick={onScreenShareClick}
              disabled={isAnalyzing}
              className="px-2.5 py-1.5 text-xs font-medium rounded-md bg-neutral-800 hover:bg-neutral-700 text-neutral-200 hover:text-white border border-neutral-700/80 transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
              title="Capture Live Screen / xLights Sequencer Tab"
            >
              <Monitor className="w-3.5 h-3.5 text-blue-400" />
              Screen Share
            </button>

            <button
              onClick={onCameraClick}
              disabled={isAnalyzing}
              className="px-2.5 py-1.5 text-xs font-medium rounded-md bg-neutral-800 hover:bg-neutral-700 text-neutral-200 hover:text-white border border-neutral-700/80 transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
              title="Capture Live Camera Stream"
            >
              <Camera className="w-3.5 h-3.5 text-emerald-400" />
              Live Camera
            </button>

            <button
              onClick={onUrlInputClick}
              disabled={isAnalyzing}
              className="px-2.5 py-1.5 text-xs font-semibold rounded-md bg-neutral-800 hover:bg-neutral-700 text-neutral-100 hover:text-white border border-red-500/40 hover:border-red-500/70 transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50 shadow-sm"
              title="Load YouTube Video or Direct Web Stream URL"
            >
              <Youtube className="w-3.5 h-3.5 text-red-500 fill-red-500/20" />
              <span>YouTube / URL</span>
            </button>

            <button
              onClick={onOpenPythonGuide}
              className="px-2.5 py-1.5 text-xs font-medium rounded-md bg-neutral-800 hover:bg-neutral-700 text-neutral-200 hover:text-white border border-neutral-700/80 transition flex items-center gap-1.5 cursor-pointer"
              title="View Python FastAPI & OpenCV Reference"
            >
              <Terminal className="w-3.5 h-3.5 text-amber-400" />
              Python OpenCV
            </button>

            <button
              onClick={onOpenManual}
              className="px-2.5 py-1.5 text-xs font-semibold rounded-md bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 hover:text-white border border-amber-500/40 hover:border-amber-500/70 transition flex items-center gap-1.5 cursor-pointer shadow-sm"
              title="Open Official xLights User Manual, Architectural Engine & Diagrams"
            >
              <BookOpen className="w-3.5 h-3.5 text-amber-400" />
              <span>xLights Manual & Diagrams</span>
            </button>
          </div>
        </div>

        {/* Quick Sample Sequence Picker Bar */}
        <div className="mt-2.5 pt-2 border-t border-neutral-800/80 flex items-center justify-between flex-wrap gap-2 text-xs">
          <div className="flex items-center gap-2 text-neutral-400">
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span className="font-medium text-neutral-300">Preset Displays:</span>
          </div>

          <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5 max-w-full">
            {presets.map((preset) => {
              const isSelected = activePresetId === preset.id;
              const isEditing = editingPresetId === preset.id;
              const displayName = preset.name.split(':')[0];

              if (isEditing) {
                return (
                  <div key={preset.id} className="flex items-center gap-1 bg-neutral-900 px-2 py-0.5 rounded border border-amber-500/50">
                    <input
                      type="text"
                      value={presetRenameText}
                      onChange={(e) => setPresetRenameText(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && presetRenameText.trim() && onRenamePreset) {
                          onRenamePreset(preset.id, presetRenameText.trim());
                          setEditingPresetId(null);
                        } else if (e.key === 'Escape') {
                          setEditingPresetId(null);
                        }
                      }}
                      className="w-28 px-1 py-0.5 text-[11px] bg-neutral-950 border border-neutral-700 text-neutral-100 rounded focus:outline-none"
                      autoFocus
                    />
                    <button
                      type="button"
                      onClick={() => {
                        if (presetRenameText.trim() && onRenamePreset) {
                          onRenamePreset(preset.id, presetRenameText.trim());
                        }
                        setEditingPresetId(null);
                      }}
                      className="p-0.5 text-amber-400 hover:text-amber-300 cursor-pointer"
                    >
                      <Check className="w-3 h-3" />
                    </button>
                    <button
                      type="button"
                      onClick={() => setEditingPresetId(null)}
                      className="p-0.5 text-neutral-400 hover:text-white cursor-pointer"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                );
              }

              return (
                <div
                  key={preset.id}
                  className={`inline-flex items-center rounded text-xs font-medium transition whitespace-nowrap ${
                    isSelected
                      ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow-sm'
                      : 'bg-neutral-800/60 text-neutral-300 hover:bg-neutral-800 hover:text-white border border-neutral-800'
                  }`}
                >
                  <button
                    onClick={() => onSelectPreset(preset)}
                    disabled={isAnalyzing}
                    className="px-2.5 py-1 cursor-pointer"
                  >
                    {displayName}
                  </button>

                  {/* Rename Tab Trigger */}
                  {onRenamePreset && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setEditingPresetId(preset.id);
                        setPresetRenameText(displayName);
                      }}
                      className="pr-1.5 pl-0.5 py-1 text-neutral-500 hover:text-amber-300 opacity-60 hover:opacity-100 cursor-pointer"
                      title={`Rename "${displayName}" tab`}
                    >
                      <Edit2 className="w-2.5 h-2.5" />
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </header>
  );
};
