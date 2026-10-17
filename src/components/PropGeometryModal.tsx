import React, { useState, useEffect } from 'react';
import { X, Check, Cpu, RefreshCw, BookmarkPlus, AlertCircle, Edit3 } from 'lucide-react';
import { PropGeometry, PropModelType, DEFAULT_PROP_GEOMETRY } from '../types/xlights';

interface PropGeometryModalProps {
  isOpen: boolean;
  onClose: () => void;
  propType: PropModelType;
  geometry: PropGeometry;
  activePresetName?: string;
  onSaveGeometry: (
    newGeom: PropGeometry,
    saveAsNewPresetName?: string,
    renameActivePresetTo?: string
  ) => void;
}

export const PropGeometryModal: React.FC<PropGeometryModalProps> = ({
  isOpen,
  onClose,
  propType,
  geometry,
  activePresetName,
  onSaveGeometry,
}) => {
  const [draft, setDraft] = useState<PropGeometry>(geometry);
  const [saveAsNewName, setSaveAsNewName] = useState<string>('');
  const [showSaveNewInput, setShowSaveNewInput] = useState<boolean>(false);
  const [renamePresetText, setRenamePresetText] = useState<string>(activePresetName || '');
  const [isRenamingPreset, setIsRenamingPreset] = useState<boolean>(false);

  // Decoupled raw string state allowing completely empty fields ("") during typing
  const [inputs, setInputs] = useState<Record<string, string>>({
    strands: String(geometry.strands || 32),
    nodesPerStrand: String(geometry.nodesPerStrand || 50),
    archCount: String(geometry.archCount || 8),
    nodesPerArch: String(geometry.nodesPerArch || 35),
    matrixRows: String(geometry.matrixRows || 20),
    matrixCols: String(geometry.matrixCols || 50),
    spinnerBlades: String(geometry.spinnerBlades || 12),
    nodesPerBlade: String(geometry.nodesPerBlade || 16),
    starNodes: String(geometry.starNodes || 50),
  });

  // Inline validation errors per field
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    setDraft(geometry);
    setInputs({
      strands: String(geometry.strands || 32),
      nodesPerStrand: String(geometry.nodesPerStrand || 50),
      archCount: String(geometry.archCount || 8),
      nodesPerArch: String(geometry.nodesPerArch || 35),
      matrixRows: String(geometry.matrixRows || 20),
      matrixCols: String(geometry.matrixCols || 50),
      spinnerBlades: String(geometry.spinnerBlades || 12),
      nodesPerBlade: String(geometry.nodesPerBlade || 16),
      starNodes: String(geometry.starNodes || 50),
    });
    setErrors({});
    setRenamePresetText(activePresetName || '');
    setShowSaveNewInput(false);
    setIsRenamingPreset(false);
  }, [geometry, isOpen, activePresetName]);

  if (!isOpen) return null;

  const handleInputChange = (field: string, val: string) => {
    // Allows full erase to "" without immediately injecting any characters or numbers
    setInputs((prev) => ({ ...prev, [field]: val }));
    // Clear error for field while user is actively typing
    if (errors[field]) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next[field];
        return next;
      });
    }
  };

  const validateAndCommitField = (
    field: keyof PropGeometry,
    minVal: number,
    maxVal: number
  ): boolean => {
    const raw = inputs[field as string]?.trim();

    if (raw === '' || raw === undefined) {
      setErrors((prev) => ({
        ...prev,
        [field as string]: `Value cannot be empty. Please enter a number between ${minVal} and ${maxVal}.`,
      }));
      return false;
    }

    const parsed = parseInt(raw, 10);
    if (isNaN(parsed)) {
      setErrors((prev) => ({
        ...prev,
        [field as string]: `Invalid number. Please enter a whole number between ${minVal} and ${maxVal}.`,
      }));
      return false;
    }

    if (parsed < minVal || parsed > maxVal) {
      setErrors((prev) => ({
        ...prev,
        [field as string]: `Value must be between ${minVal} and ${maxVal}.`,
      }));
      return false;
    }

    // Valid value: commit to draft and clear error
    setDraft((prev) => ({ ...prev, [field]: parsed }));
    setErrors((prev) => {
      const next = { ...prev };
      delete next[field as string];
      return next;
    });
    return true;
  };

  const validateAllCurrentFields = (): boolean => {
    let isValid = true;

    if (propType === 'Mega Tree') {
      if (!validateAndCommitField('strands', 2, 96)) isValid = false;
      if (!validateAndCommitField('nodesPerStrand', 5, 200)) isValid = false;
      if (draft.hasStarTopper && !validateAndCommitField('starNodes', 5, 150)) isValid = false;
    } else if (propType === 'PEX Arches') {
      if (!validateAndCommitField('archCount', 1, 16)) isValid = false;
      if (!validateAndCommitField('nodesPerArch', 5, 150)) isValid = false;
    } else if (propType === 'Matrix') {
      if (!validateAndCommitField('matrixRows', 1, 120)) isValid = false;
      if (!validateAndCommitField('matrixCols', 1, 200)) isValid = false;
    } else if (propType === 'Spinner / ChromaStar') {
      if (!validateAndCommitField('spinnerBlades', 4, 32)) isValid = false;
      if (!validateAndCommitField('nodesPerBlade', 4, 60)) isValid = false;
    }

    return isValid;
  };

  const handleApply = () => {
    if (!validateAllCurrentFields()) return;

    const renameTarget = isRenamingPreset && renamePresetText.trim() ? renamePresetText.trim() : undefined;
    const saveAsNew = showSaveNewInput && saveAsNewName.trim() ? saveAsNewName.trim() : undefined;

    onSaveGeometry(draft, saveAsNew, renameTarget);
    onClose();
  };

  const handleResetToDefault = () => {
    const def = DEFAULT_PROP_GEOMETRY[propType] || DEFAULT_PROP_GEOMETRY['Mega Tree'];
    setDraft(def);
    setInputs({
      strands: String(def.strands),
      nodesPerStrand: String(def.nodesPerStrand),
      archCount: String(def.archCount),
      nodesPerArch: String(def.nodesPerArch),
      matrixRows: String(def.matrixRows),
      matrixCols: String(def.matrixCols),
      spinnerBlades: String(def.spinnerBlades),
      nodesPerBlade: String(def.nodesPerBlade),
      starNodes: String(def.starNodes),
    });
    setErrors({});
  };

  const hasAnyErrors = Object.keys(errors).length > 0;

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-neutral-900 border border-neutral-800 rounded-2xl w-full max-w-xl flex flex-col shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="px-5 py-3.5 border-b border-neutral-800 flex items-center justify-between bg-neutral-950/80">
          <div className="flex items-center gap-2">
            <Cpu className="w-4 h-4 text-amber-400" />
            <div>
              <h3 className="font-bold text-sm text-neutral-100">
                Custom Prop Geometry & Physical Specs
              </h3>
              <p className="text-[11px] text-neutral-400">
                Editing layout model for: <span className="text-amber-300 font-semibold">{propType}</span>
                {activePresetName && (
                  <span className="text-neutral-500"> ({activePresetName})</span>
                )}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-neutral-400 hover:text-white hover:bg-neutral-800 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 flex flex-col gap-4 text-xs overflow-y-auto max-h-[75vh]">
          <div className="p-3 bg-neutral-950 rounded-lg border border-neutral-800 text-neutral-300 leading-relaxed">
            Configure physical model parameters. Changes immediately update internal simulation test renders and sequence feature calculations.
          </div>

          {/* Preset Display Name Renaming */}
          {activePresetName && (
            <div className="p-3 bg-neutral-950/70 rounded-xl border border-neutral-800 flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-neutral-200 flex items-center gap-1.5">
                  <Edit3 className="w-3.5 h-3.5 text-amber-400" />
                  Preset Display Tab Name:
                </span>
                {!isRenamingPreset && (
                  <button
                    type="button"
                    onClick={() => setIsRenamingPreset(true)}
                    className="text-amber-400 hover:text-amber-300 text-[11px] underline cursor-pointer"
                  >
                    Rename Tab
                  </button>
                )}
              </div>
              {isRenamingPreset ? (
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={renamePresetText}
                    onChange={(e) => setRenamePresetText(e.target.value)}
                    placeholder="e.g. 3 PEX Arches"
                    className="flex-1 px-2.5 py-1.5 rounded-lg bg-neutral-900 border border-neutral-700 text-neutral-100 text-xs focus:outline-none focus:border-amber-500 font-medium"
                  />
                  <button
                    type="button"
                    onClick={() => setIsRenamingPreset(false)}
                    className="text-neutral-400 hover:text-white text-xs px-2"
                  >
                    Keep
                  </button>
                </div>
              ) : (
                <span className="font-mono text-neutral-300 bg-neutral-900 px-2.5 py-1 rounded border border-neutral-800">
                  {renamePresetText || activePresetName}
                </span>
              )}
            </div>
          )}

          {/* Mega Tree Specific Options */}
          {propType === 'Mega Tree' && (
            <div className="space-y-3 bg-neutral-950/60 p-3.5 rounded-xl border border-neutral-800/80">
              <span className="font-semibold text-neutral-200 block">Mega Tree Physical Form:</span>

              <div className="grid grid-cols-3 gap-2">
                {[180, 270, 360].map((deg) => (
                  <button
                    key={deg}
                    type="button"
                    onClick={() => setDraft({ ...draft, degrees: deg as 180 | 270 | 360 })}
                    className={`py-2 px-3 rounded-lg border font-semibold text-center transition cursor-pointer ${
                      draft.degrees === deg
                        ? 'bg-amber-500/20 text-amber-300 border-amber-500/50'
                        : 'bg-neutral-900 text-neutral-400 border-neutral-800 hover:text-white'
                    }`}
                  >
                    {deg}° Tree {deg === 180 ? '(Flat Front)' : deg === 360 ? '(Round Cone)' : '(Wrap)'}
                  </button>
                ))}
              </div>

              <div className="grid grid-cols-2 gap-3 pt-2">
                <div className="flex flex-col gap-1">
                  <label className="text-neutral-400 font-medium">Ribbon / Strand Count:</label>
                  <input
                    type="text"
                    inputMode="numeric"
                    value={inputs.strands}
                    onChange={(e) => handleInputChange('strands', e.target.value)}
                    onBlur={() => validateAndCommitField('strands', 2, 64)}
                    onKeyDown={(e) => e.key === 'Enter' && validateAndCommitField('strands', 2, 64)}
                    className={`px-2.5 py-1.5 rounded-lg bg-neutral-900 border text-neutral-100 font-mono focus:outline-none ${
                      errors.strands ? 'border-red-500 ring-1 ring-red-500/40' : 'border-neutral-700 focus:border-amber-500'
                    }`}
                  />
                  {errors.strands ? (
                    <span className="text-[10px] text-red-400 flex items-center gap-1">
                      <AlertCircle className="w-3 h-3" />
                      {errors.strands}
                    </span>
                  ) : (
                    <span className="text-[10px] text-neutral-500">e.g. 16, 24, 32, 48 strands</span>
                  )}
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-neutral-400 font-medium">Nodes Per Strand:</label>
                  <input
                    type="text"
                    inputMode="numeric"
                    value={inputs.nodesPerStrand}
                    onChange={(e) => handleInputChange('nodesPerStrand', e.target.value)}
                    onBlur={() => validateAndCommitField('nodesPerStrand', 5, 200)}
                    onKeyDown={(e) => e.key === 'Enter' && validateAndCommitField('nodesPerStrand', 5, 200)}
                    className={`px-2.5 py-1.5 rounded-lg bg-neutral-900 border text-neutral-100 font-mono focus:outline-none ${
                      errors.nodesPerStrand ? 'border-red-500 ring-1 ring-red-500/40' : 'border-neutral-700 focus:border-amber-500'
                    }`}
                  />
                  {errors.nodesPerStrand ? (
                    <span className="text-[10px] text-red-400 flex items-center gap-1">
                      <AlertCircle className="w-3 h-3" />
                      {errors.nodesPerStrand}
                    </span>
                  ) : (
                    <span className="text-[10px] text-neutral-500">e.g. 50, 75, 100 pixels</span>
                  )}
                </div>
              </div>

              {/* Star Topper Submodel */}
              <div className="flex items-center justify-between pt-2 border-t border-neutral-800/80">
                <label className="flex items-center gap-2 text-neutral-300 font-medium cursor-pointer">
                  <input
                    type="checkbox"
                    checked={draft.hasStarTopper}
                    onChange={(e) => setDraft({ ...draft, hasStarTopper: e.target.checked })}
                    className="rounded border-neutral-700 text-amber-500 focus:ring-0 cursor-pointer"
                  />
                  Includes Independent Star Topper
                </label>
                {draft.hasStarTopper && (
                  <div className="flex items-center gap-1.5">
                    <span className="text-neutral-500 text-[11px]">Star Nodes:</span>
                    <input
                      type="text"
                      inputMode="numeric"
                      value={inputs.starNodes}
                      onChange={(e) => handleInputChange('starNodes', e.target.value)}
                      onBlur={() => validateAndCommitField('starNodes', 5, 150)}
                      onKeyDown={(e) => e.key === 'Enter' && validateAndCommitField('starNodes', 5, 150)}
                      className={`w-16 px-1.5 py-1 rounded bg-neutral-900 border text-neutral-100 font-mono text-[11px] focus:outline-none ${
                        errors.starNodes ? 'border-red-500' : 'border-neutral-700 focus:border-amber-500'
                      }`}
                    />
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Arches Specific Options */}
          {propType === 'PEX Arches' && (
            <div className="space-y-3 bg-neutral-950/60 p-3.5 rounded-xl border border-neutral-800/80">
              <span className="font-semibold text-neutral-200 block">Arch Group Configuration:</span>
              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1">
                  <label className="text-neutral-400 font-medium">Number of Arches:</label>
                  <input
                    type="text"
                    inputMode="numeric"
                    value={inputs.archCount}
                    onChange={(e) => handleInputChange('archCount', e.target.value)}
                    onBlur={() => validateAndCommitField('archCount', 1, 16)}
                    onKeyDown={(e) => e.key === 'Enter' && validateAndCommitField('archCount', 1, 16)}
                    className={`px-2.5 py-1.5 rounded-lg bg-neutral-900 border text-neutral-100 font-mono focus:outline-none ${
                      errors.archCount ? 'border-red-500 ring-1 ring-red-500/40' : 'border-neutral-700 focus:border-amber-500'
                    }`}
                  />
                  {errors.archCount ? (
                    <span className="text-[10px] text-red-400 flex items-center gap-1">
                      <AlertCircle className="w-3 h-3" />
                      {errors.archCount}
                    </span>
                  ) : (
                    <span className="text-[10px] text-neutral-500">e.g. 3, 4, 8 yard arches</span>
                  )}
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-neutral-400 font-medium">Nodes Per Arch:</label>
                  <input
                    type="text"
                    inputMode="numeric"
                    value={inputs.nodesPerArch}
                    onChange={(e) => handleInputChange('nodesPerArch', e.target.value)}
                    onBlur={() => validateAndCommitField('nodesPerArch', 5, 150)}
                    onKeyDown={(e) => e.key === 'Enter' && validateAndCommitField('nodesPerArch', 5, 150)}
                    className={`px-2.5 py-1.5 rounded-lg bg-neutral-900 border text-neutral-100 font-mono focus:outline-none ${
                      errors.nodesPerArch ? 'border-red-500 ring-1 ring-red-500/40' : 'border-neutral-700 focus:border-amber-500'
                    }`}
                  />
                  {errors.nodesPerArch ? (
                    <span className="text-[10px] text-red-400 flex items-center gap-1">
                      <AlertCircle className="w-3 h-3" />
                      {errors.nodesPerArch}
                    </span>
                  ) : (
                    <span className="text-[10px] text-neutral-500">e.g. 35, 50 nodes</span>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Matrix Specific Options */}
          {propType === 'Matrix' && (
            <div className="space-y-3 bg-neutral-950/60 p-3.5 rounded-xl border border-neutral-800/80">
              <span className="font-semibold text-neutral-200 block">Matrix Dimensions:</span>
              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1">
                  <label className="text-neutral-400 font-medium">Rows (Height):</label>
                  <input
                    type="text"
                    inputMode="numeric"
                    value={inputs.matrixRows}
                    onChange={(e) => handleInputChange('matrixRows', e.target.value)}
                    onBlur={() => validateAndCommitField('matrixRows', 1, 120)}
                    onKeyDown={(e) => e.key === 'Enter' && validateAndCommitField('matrixRows', 1, 120)}
                    className={`px-2.5 py-1.5 rounded-lg bg-neutral-900 border text-neutral-100 font-mono focus:outline-none ${
                      errors.matrixRows ? 'border-red-500 ring-1 ring-red-500/40' : 'border-neutral-700 focus:border-amber-500'
                    }`}
                  />
                  {errors.matrixRows && (
                    <span className="text-[10px] text-red-400 flex items-center gap-1">
                      <AlertCircle className="w-3 h-3" />
                      {errors.matrixRows}
                    </span>
                  )}
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-neutral-400 font-medium">Columns (Width):</label>
                  <input
                    type="text"
                    inputMode="numeric"
                    value={inputs.matrixCols}
                    onChange={(e) => handleInputChange('matrixCols', e.target.value)}
                    onBlur={() => validateAndCommitField('matrixCols', 1, 200)}
                    onKeyDown={(e) => e.key === 'Enter' && validateAndCommitField('matrixCols', 1, 200)}
                    className={`px-2.5 py-1.5 rounded-lg bg-neutral-900 border text-neutral-100 font-mono focus:outline-none ${
                      errors.matrixCols ? 'border-red-500 ring-1 ring-red-500/40' : 'border-neutral-700 focus:border-amber-500'
                    }`}
                  />
                  {errors.matrixCols && (
                    <span className="text-[10px] text-red-400 flex items-center gap-1">
                      <AlertCircle className="w-3 h-3" />
                      {errors.matrixCols}
                    </span>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Spinner Options */}
          {propType === 'Spinner / ChromaStar' && (
            <div className="space-y-3 bg-neutral-950/60 p-3.5 rounded-xl border border-neutral-800/80">
              <span className="font-semibold text-neutral-200 block">Spinner Spoke Topology:</span>
              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1">
                  <label className="text-neutral-400 font-medium">Spokes / Blades:</label>
                  <input
                    type="text"
                    inputMode="numeric"
                    value={inputs.spinnerBlades}
                    onChange={(e) => handleInputChange('spinnerBlades', e.target.value)}
                    onBlur={() => validateAndCommitField('spinnerBlades', 4, 32)}
                    onKeyDown={(e) => e.key === 'Enter' && validateAndCommitField('spinnerBlades', 4, 32)}
                    className={`px-2.5 py-1.5 rounded-lg bg-neutral-900 border text-neutral-100 font-mono focus:outline-none ${
                      errors.spinnerBlades ? 'border-red-500 ring-1 ring-red-500/40' : 'border-neutral-700 focus:border-amber-500'
                    }`}
                  />
                  {errors.spinnerBlades && (
                    <span className="text-[10px] text-red-400 flex items-center gap-1">
                      <AlertCircle className="w-3 h-3" />
                      {errors.spinnerBlades}
                    </span>
                  )}
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-neutral-400 font-medium">Nodes Per Spoke:</label>
                  <input
                    type="text"
                    inputMode="numeric"
                    value={inputs.nodesPerBlade}
                    onChange={(e) => handleInputChange('nodesPerBlade', e.target.value)}
                    onBlur={() => validateAndCommitField('nodesPerBlade', 4, 60)}
                    onKeyDown={(e) => e.key === 'Enter' && validateAndCommitField('nodesPerBlade', 4, 60)}
                    className={`px-2.5 py-1.5 rounded-lg bg-neutral-900 border text-neutral-100 font-mono focus:outline-none ${
                      errors.nodesPerBlade ? 'border-red-500 ring-1 ring-red-500/40' : 'border-neutral-700 focus:border-amber-500'
                    }`}
                  />
                  {errors.nodesPerBlade && (
                    <span className="text-[10px] text-red-400 flex items-center gap-1">
                      <AlertCircle className="w-3 h-3" />
                      {errors.nodesPerBlade}
                    </span>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Save As New Preset Tab (Separate Preset Version) */}
          <div className="pt-2 border-t border-neutral-800 flex flex-col gap-2">
            {!showSaveNewInput ? (
              <button
                type="button"
                onClick={() => setShowSaveNewInput(true)}
                className="text-amber-400 hover:text-amber-300 text-xs font-medium flex items-center gap-1.5 cursor-pointer w-fit"
              >
                <BookmarkPlus className="w-3.5 h-3.5" />
                Save As New Separate Preset Tab...
              </button>
            ) : (
              <div className="flex flex-col gap-1.5 bg-neutral-950 p-3 rounded-lg border border-neutral-800">
                <span className="text-[11px] text-neutral-300 font-medium">
                  Create a new tab in the top Preset Displays bar:
                </span>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    placeholder="e.g. 3 PEX Arches (Custom Yard Layout)"
                    value={saveAsNewName}
                    onChange={(e) => setSaveAsNewName(e.target.value)}
                    className="flex-1 px-2.5 py-1.5 rounded bg-neutral-900 border border-neutral-700 text-neutral-100 text-xs focus:outline-none focus:border-amber-500"
                  />
                  <button
                    type="button"
                    onClick={() => setShowSaveNewInput(false)}
                    className="text-neutral-400 hover:text-white text-xs px-2 py-1"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Computed node count summary */}
          <div className="flex items-center justify-between p-3 rounded-lg bg-neutral-950 border border-neutral-800 text-xs">
            <span className="text-neutral-400">Total Calculated Physical Nodes:</span>
            <span className="font-mono font-bold text-amber-300 text-sm">
              {propType === 'Mega Tree'
                ? draft.strands * draft.nodesPerStrand + (draft.hasStarTopper ? draft.starNodes : 0)
                : propType === 'PEX Arches'
                  ? draft.archCount * draft.nodesPerArch
                  : propType === 'Matrix'
                    ? draft.matrixRows * draft.matrixCols
                    : propType === 'Spinner / ChromaStar'
                      ? draft.spinnerBlades * draft.nodesPerBlade
                      : draft.nodesPerStrand}{' '}
              Pixels
            </span>
          </div>

          {hasAnyErrors && (
            <div className="p-2.5 rounded-lg bg-red-950/40 border border-red-800 text-red-300 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
              <span>Please resolve all field errors above before applying changes.</span>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-neutral-800 bg-neutral-950 flex items-center justify-between">
          <button
            type="button"
            onClick={handleResetToDefault}
            className="text-xs text-neutral-400 hover:text-white flex items-center gap-1 cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Reset Defaults
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-1.5 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-300 text-xs font-medium cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleApply}
              disabled={hasAnyErrors}
              className="px-4 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-neutral-950 font-bold text-xs flex items-center gap-1.5 transition cursor-pointer shadow-md"
            >
              <Check className="w-3.5 h-3.5" />
              {showSaveNewInput && saveAsNewName.trim()
                ? 'Save As New Preset'
                : 'Apply Geometry'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
