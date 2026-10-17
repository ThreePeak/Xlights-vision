import React, { useState } from 'react';
import { X, Download, Copy, Check, Palette, FileCode, FileText, Table } from 'lucide-react';
import { ColorSwatch } from '../types/xlights';

interface PaletteExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  palette: ColorSwatch[];
  effectName?: string;
}

export const PaletteExportModal: React.FC<PaletteExportModalProps> = ({
  isOpen,
  onClose,
  palette,
  effectName = 'xlights',
}) => {
  const [selectedSwatches, setSelectedSwatches] = useState<number[]>(
    palette.filter((p) => p.checked).map((p) => p.index)
  );

  // Export format checkboxes
  const [exportXPalette, setExportXPalette] = useState<boolean>(true);
  const [exportTxt, setExportTxt] = useState<boolean>(true);
  const [exportCsv, setExportCsv] = useState<boolean>(false);

  const [copiedFormat, setCopiedFormat] = useState<string | null>(null);

  if (!isOpen) return null;

  const toggleSwatch = (index: number) => {
    setSelectedSwatches((prev) =>
      prev.includes(index) ? prev.filter((i) => i !== index) : [...prev, index].sort((a, b) => a - b)
    );
  };

  const selectAllSwatches = () => {
    setSelectedSwatches(palette.map((p) => p.index));
  };

  const activeColors = palette.filter((p) => selectedSwatches.includes(p.index));

  // Generate xLights .xpalette XML
  const generateXPaletteXml = () => {
    const colorAttrs = palette
      .map((p) => `C_BUTTON_Palette${p.index}="${p.hex}"`)
      .join(' ');
    const checkAttrs = palette
      .map((p) => `C_CHECKBOX_Palette${p.index}="${selectedSwatches.includes(p.index) ? '1' : '0'}"`)
      .join(' ');

    return `<?xml version="1.0" encoding="UTF-8"?>
<ColorPalette ${colorAttrs} ${checkAttrs}/>`;
  };

  // Generate Plain Text .txt
  const generatePlainText = () => {
    const lines = [
      `# xLights Color Palette Export - ${effectName}`,
      `# Generated: ${new Date().toLocaleString()}`,
      `# Total Active Colors: ${activeColors.length}`,
      '',
    ];
    activeColors.forEach((c) => {
      lines.push(`${c.hex} - ${c.name} (RGB: ${c.rgb.join(', ')}) [${c.percentage}% display coverage]`);
    });
    return lines.join('\n');
  };

  // Generate CSV
  const generateCsv = () => {
    const lines = ['Index,Hex,ColorName,Red,Green,Blue,CoveragePercent'];
    activeColors.forEach((c) => {
      lines.push(`${c.index},${c.hex},"${c.name}",${c.rgb[0]},${c.rgb[1]},${c.rgb[2]},${c.percentage}`);
    });
    return lines.join('\n');
  };

  const triggerDownload = (filename: string, content: string, mimeType: string) => {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleDownloadSelectedFormats = () => {
    const cleanPrefix = effectName.toLowerCase().replace(/[^a-z0-9]/g, '_');

    if (exportXPalette) {
      triggerDownload(`${cleanPrefix}_palette.xpalette`, generateXPaletteXml(), 'application/xml');
    }
    if (exportTxt) {
      setTimeout(() => {
        triggerDownload(`${cleanPrefix}_palette.txt`, generatePlainText(), 'text/plain');
      }, 100);
    }
    if (exportCsv) {
      setTimeout(() => {
        triggerDownload(`${cleanPrefix}_palette.csv`, generateCsv(), 'text/csv');
      }, 200);
    }

    onClose();
  };

  const handleCopy = (formatName: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedFormat(formatName);
    setTimeout(() => setCopiedFormat(null), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-neutral-900 border border-neutral-800 rounded-2xl w-full max-w-lg flex flex-col shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="px-5 py-3.5 border-b border-neutral-800 flex items-center justify-between bg-neutral-950/80">
          <div className="flex items-center gap-2">
            <Palette className="w-4 h-4 text-amber-400" />
            <div>
              <h3 className="font-bold text-sm text-neutral-100">Export Color Palette</h3>
              <p className="text-[11px] text-neutral-400">
                Choose format(s) and select swatches to export
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
        <div className="p-5 flex flex-col gap-4 text-xs">
          {/* Swatch Selection */}
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <label className="font-semibold text-neutral-200">
                Active Swatches ({selectedSwatches.length} of {palette.length} selected):
              </label>
              <button
                type="button"
                onClick={selectAllSwatches}
                className="text-amber-400 hover:text-amber-300 text-[11px] font-medium cursor-pointer"
              >
                Select All
              </button>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {palette.map((swatch) => {
                const isSelected = selectedSwatches.includes(swatch.index);
                return (
                  <button
                    key={swatch.index}
                    type="button"
                    onClick={() => toggleSwatch(swatch.index)}
                    className={`p-2 rounded-lg border text-left flex items-center gap-2 transition cursor-pointer ${
                      isSelected
                        ? 'bg-neutral-950 border-amber-500/50 ring-1 ring-amber-500/20'
                        : 'bg-neutral-950/60 border-neutral-800 text-neutral-500 opacity-60'
                    }`}
                  >
                    <div
                      className="w-4 h-4 rounded border border-white/20 shrink-0"
                      style={{ backgroundColor: swatch.hex }}
                    />
                    <div className="flex flex-col min-w-0">
                      <span className="font-mono font-bold text-[10px] text-neutral-200">
                        #{swatch.index}
                      </span>
                      <span className="font-mono text-[10px] text-amber-300 truncate">
                        {swatch.hex}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Formats Selection */}
          <div className="bg-neutral-950/60 p-3.5 rounded-xl border border-neutral-800 space-y-3">
            <label className="font-semibold text-neutral-200 block">Export Formats to Download:</label>

            <label className="flex items-start gap-2.5 cursor-pointer">
              <input
                type="checkbox"
                checked={exportXPalette}
                onChange={(e) => setExportXPalette(e.target.checked)}
                className="mt-0.5 rounded border-neutral-700 text-amber-500 focus:ring-0 cursor-pointer"
              />
              <div className="flex flex-col">
                <span className="font-medium text-neutral-200 flex items-center gap-1.5">
                  <FileCode className="w-3.5 h-3.5 text-amber-400" />
                  xLights Palette XML (<span className="font-mono text-amber-300">.xpalette</span>)
                </span>
                <span className="text-[11px] text-neutral-400">
                  Standard XML format directly loadable in the xLights Palette manager.
                </span>
              </div>
            </label>

            <label className="flex items-start gap-2.5 cursor-pointer">
              <input
                type="checkbox"
                checked={exportTxt}
                onChange={(e) => setExportTxt(e.target.checked)}
                className="mt-0.5 rounded border-neutral-700 text-amber-500 focus:ring-0 cursor-pointer"
              />
              <div className="flex flex-col">
                <span className="font-medium text-neutral-200 flex items-center gap-1.5">
                  <FileText className="w-3.5 h-3.5 text-blue-400" />
                  Plain Text Hex List (<span className="font-mono text-blue-300">.txt</span>)
                </span>
                <span className="text-[11px] text-neutral-400">
                  Clean list of hex codes and RGB coordinates with color names.
                </span>
              </div>
            </label>

            <label className="flex items-start gap-2.5 cursor-pointer">
              <input
                type="checkbox"
                checked={exportCsv}
                onChange={(e) => setExportCsv(e.target.checked)}
                className="mt-0.5 rounded border-neutral-700 text-amber-500 focus:ring-0 cursor-pointer"
              />
              <div className="flex flex-col">
                <span className="font-medium text-neutral-200 flex items-center gap-1.5">
                  <Table className="w-3.5 h-3.5 text-emerald-400" />
                  Spreadsheet CSV (<span className="font-mono text-emerald-300">.csv</span>)
                </span>
                <span className="text-[11px] text-neutral-400">
                  Structured table with index, RGB channels, and screen coverage percentage.
                </span>
              </div>
            </label>
          </div>

          {/* Quick Copy Snippet Options */}
          <div className="flex items-center justify-between pt-1 border-t border-neutral-800 text-[11px]">
            <span className="text-neutral-400">Or quick copy to clipboard:</span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => handleCopy('xpalette', generateXPaletteXml())}
                className="px-2 py-1 rounded bg-neutral-800 hover:bg-neutral-700 text-neutral-300 hover:text-white transition flex items-center gap-1 cursor-pointer"
              >
                {copiedFormat === 'xpalette' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                Copy XML
              </button>
              <button
                type="button"
                onClick={() => handleCopy('txt', generatePlainText())}
                className="px-2 py-1 rounded bg-neutral-800 hover:bg-neutral-700 text-neutral-300 hover:text-white transition flex items-center gap-1 cursor-pointer"
              >
                {copiedFormat === 'txt' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                Copy Hex
              </button>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-neutral-800 bg-neutral-950/80 flex items-center justify-between">
          <button
            type="button"
            onClick={onClose}
            className="px-3 py-1.5 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-300 text-xs font-medium cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleDownloadSelectedFormats}
            disabled={!exportXPalette && !exportTxt && !exportCsv}
            className="px-4 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-neutral-950 font-bold text-xs flex items-center gap-1.5 transition disabled:opacity-50 cursor-pointer shadow-md"
          >
            <Download className="w-3.5 h-3.5" />
            Download Selected File(s)
          </button>
        </div>
      </div>
    </div>
  );
};
