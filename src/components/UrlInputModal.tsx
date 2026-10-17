import React, { useState } from 'react';
import { Link2, X, AlertCircle, Youtube, Sparkles } from 'lucide-react';

interface UrlInputModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmitUrl: (url: string) => void;
}

const SAMPLE_URLS = [
  {
    label: 'YouTube: Mega Tree Light Show',
    url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
    badge: 'YouTube',
  },
  {
    label: 'Direct MP4: Holiday Tree Showcase',
    url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
    badge: 'Direct MP4',
  },
];

export const UrlInputModal: React.FC<UrlInputModalProps> = ({
  isOpen,
  onClose,
  onSubmitUrl,
}) => {
  const [url, setUrl] = useState<string>('');
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!url.trim()) {
      setError('Please provide a valid YouTube link or direct video URL');
      return;
    }
    setError(null);
    onSubmitUrl(url.trim());
    onClose();
  };

  const handleSampleClick = (sampleUrl: string) => {
    setUrl(sampleUrl);
    setError(null);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-neutral-900 border border-neutral-800 rounded-2xl w-full max-w-lg flex flex-col shadow-2xl overflow-hidden">
        <div className="px-5 py-3.5 border-b border-neutral-800 flex items-center justify-between bg-neutral-950/80">
          <div className="flex items-center gap-2">
            <div className="p-1 rounded bg-red-500/10 border border-red-500/30 text-red-500">
              <Youtube className="w-4 h-4 fill-red-500/30" />
            </div>
            <h3 className="font-bold text-sm text-neutral-100">
              YouTube Video / Direct Stream Ingestion
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-neutral-400 hover:text-white hover:bg-neutral-800 transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 flex flex-col gap-4 text-xs">
          <div className="bg-neutral-950 p-3 rounded-lg border border-neutral-800 flex flex-col gap-1.5 leading-relaxed text-neutral-400">
            <span className="text-neutral-200 font-semibold flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              Paste any YouTube Video URL as Source Input:
            </span>
            <p className="text-[11px]">
              Supports standard YouTube URLs (<code className="text-amber-300">youtube.com/watch?v=...</code>, <code className="text-amber-300">youtu.be/...</code>, Shorts) as well as direct MP4 / WebM / HLS video streams.
            </p>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-neutral-300 font-medium flex items-center justify-between">
              <span>Video or YouTube URL:</span>
              <span className="text-[10px] text-neutral-500">Auto-embedded & sampled</span>
            </label>
            <div className="relative">
              <input
                type="url"
                placeholder="https://www.youtube.com/watch?v=... or https://youtu.be/..."
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                className="w-full px-3 py-2.5 rounded-lg bg-neutral-950 border border-neutral-700 text-neutral-100 placeholder-neutral-600 focus:outline-none focus:border-red-500 font-mono text-xs pr-10"
                autoFocus
              />
              <div className="absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none text-red-500">
                <Youtube className="w-4 h-4" />
              </div>
            </div>
            {error && (
              <span className="text-red-400 flex items-center gap-1 text-[11px] mt-0.5">
                <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                {error}
              </span>
            )}
          </div>

          {/* Quick Sample Links */}
          <div className="flex flex-col gap-1.5 pt-1">
            <span className="text-[11px] font-medium text-neutral-400">Quick Test Samples:</span>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {SAMPLE_URLS.map((s, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => handleSampleClick(s.url)}
                  className="px-2.5 py-1.5 rounded-lg bg-neutral-950 hover:bg-neutral-800 border border-neutral-800 hover:border-neutral-700 text-left flex items-center justify-between transition cursor-pointer text-[11px]"
                >
                  <span className="truncate text-neutral-300 font-medium">{s.label}</span>
                  <span className="text-[9px] font-mono px-1 py-0.5 rounded bg-neutral-900 border border-neutral-800 text-neutral-400 shrink-0 ml-1">
                    {s.badge}
                  </span>
                </button>
              ))}
            </div>
          </div>

          <div className="pt-2 flex justify-end gap-2 border-t border-neutral-800">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-1.5 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-300 transition cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-1.5 rounded-lg bg-red-600 hover:bg-red-500 text-white font-semibold transition cursor-pointer flex items-center gap-1.5 shadow-md"
            >
              <Youtube className="w-3.5 h-3.5" />
              <span>Load Video Input</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
