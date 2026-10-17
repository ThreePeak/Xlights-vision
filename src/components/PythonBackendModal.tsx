import React, { useState } from 'react';
import { Terminal, Copy, Check, X, FileCode, CheckCircle2 } from 'lucide-react';

interface PythonBackendModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const PythonBackendModal: React.FC<PythonBackendModalProps> = ({ isOpen, onClose }) => {
  const [copiedScript, setCopiedScript] = useState<boolean>(false);
  const [copiedHarness, setCopiedHarness] = useState<boolean>(false);

  if (!isOpen) return null;

  const harnessScript = `import requests

# Test Harness: Submit LED video clip to Python FastAPI OpenCV engine
url = "http://localhost:8000/api/analyze-video"
files = {"file": open("holiday_display.mp4", "rb")}
data = {
    "prop_type": "Mega Tree",
    "step_interval_ms": 25,  # 40 FPS High Definition
    "roi_x": 0.28,
    "roi_y": 0.12,
    "roi_w": 0.44,
    "roi_h": 0.76,
    "start_ms": 0,
    "end_ms": 3500
}

response = requests.post(url, files=files, data=data)
result = response.json()

print(f"Confidence: {result['confidence_score']}%")
print(f"Primary Effect: {result['primary_recipe']['effect_name']}")
print(f"Motion Direction: {result['motion_direction']}")
print(f"Waveform: {result['waveform_pattern']}")
print("XML Clipboard Output:\\n", result['primary_recipe']['xml_clipboard'])
`;

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-neutral-900 border border-neutral-800 rounded-2xl w-full max-w-3xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="px-5 py-3.5 border-b border-neutral-800 flex items-center justify-between bg-neutral-950/80">
          <div className="flex items-center gap-2.5">
            <Terminal className="w-5 h-5 text-amber-400" />
            <div>
              <h3 className="font-bold text-sm text-neutral-100">
                Python FastAPI & OpenCV Backend Architecture
              </h3>
              <p className="text-xs text-neutral-400">
                Farneback Optical Flow · MOG2 Background Filtration · Pydantic Schemas
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg bg-neutral-800 text-neutral-400 hover:text-white hover:bg-neutral-700 transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 overflow-y-auto space-y-4 text-xs text-neutral-300">
          {/* Architecture overview */}
          <div className="bg-neutral-950 p-3.5 rounded-xl border border-neutral-800 space-y-2">
            <div className="font-semibold text-neutral-100 text-sm flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              Production Deployment Blueprint (Section 6 Compliant)
            </div>
            <p className="leading-relaxed text-neutral-400">
              The project includes the complete Python OpenCV implementation in{' '}
              <code className="text-amber-300 font-mono">backend_reference/cv_engine.py</code>. It
              executes dense optical flow across normalized video coordinates with Farneback vector
              fields, extracts angular curl/divergence, and returns structured Pydantic models with
              native xLights XML clips.
            </p>
          </div>

          {/* Setup steps */}
          <div>
            <div className="font-semibold text-neutral-200 mb-2">
              1. Setup and Run Standalone Server
            </div>
            <pre className="p-3 bg-neutral-950 rounded-lg border border-neutral-800 font-mono text-[11px] text-amber-400 overflow-x-auto">
{`# 1. Install dependencies
cd backend_reference
pip install -r requirements.txt

# 2. Launch FastAPI service on port 8000
python cv_engine.py
# -> Uvicorn running on http://0.0.0.0:8000 (OpenAPI docs at /docs)`}
            </pre>
          </div>

          {/* Mock Test Harness */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <div className="font-semibold text-neutral-200">
                2. Python Test Harness (Run Against Any Video)
              </div>
              <button
                onClick={() => {
                  navigator.clipboard.writeText(harnessScript);
                  setCopiedHarness(true);
                  setTimeout(() => setCopiedHarness(false), 2000);
                }}
                className="text-xs text-amber-400 hover:text-amber-300 flex items-center gap-1 font-medium cursor-pointer"
              >
                {copiedHarness ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                {copiedHarness ? 'Copied' : 'Copy Harness'}
              </button>
            </div>
            <pre className="p-3 bg-neutral-950 rounded-lg border border-neutral-800 font-mono text-[11px] text-emerald-400 overflow-x-auto whitespace-pre">
              {harnessScript}
            </pre>
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-neutral-800 bg-neutral-950 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-200 font-medium text-xs transition cursor-pointer"
          >
            Close Guide
          </button>
        </div>
      </div>
    </div>
  );
};
