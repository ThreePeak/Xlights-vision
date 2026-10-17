import React, { useState, useRef, useEffect } from 'react';
import {
  Play,
  RotateCcw,
  Zap,
  Activity,
  AlertTriangle,
  Layers,
  Sparkles,
  CheckCircle2,
  Clock,
  Cpu,
  ArrowRight,
  Filter,
  Check,
  Copy,
  Download,
  Info,
  Sliders,
  Eye,
  RefreshCw,
} from 'lucide-react';
import { Header } from './components/Header';
import { VideoPlayerWithRoi, StreamSourceInfo } from './components/VideoPlayerWithRoi';
import { UserContextPanel } from './components/UserContextPanel';
import { WaveformAndVectorViewer } from './components/WaveformAndVectorViewer';
import { RecipeCard } from './components/RecipeCard';
import { PythonBackendModal } from './components/PythonBackendModal';
import { UrlInputModal } from './components/UrlInputModal';
import { PropGeometryModal } from './components/PropGeometryModal';
import { SimulationComparisonViewer } from './components/SimulationComparisonViewer';
import { ClarificationAdvisorModal } from './components/ClarificationAdvisorModal';
import { XLightsManualModal } from './components/XLightsManualModal';
import { PRESET_SEQUENCES, PresetSequence } from './engine/presetSequences';
import { VideoSequenceCvAnalyzer } from './engine/cvAnalyzer';
import { deduceXLightsRecipes } from './engine/xlightsDeduction';
import { SimulationScorer } from './engine/simulationScorer';
import { SessionStore } from './engine/sessionStore';
import {
  RoiBox,
  UserContextConfig,
  AnalysisDeductionResult,
  TemporalExtractionSummary,
  PropGeometry,
  DEFAULT_PROP_GEOMETRY,
  ClarificationQuestion,
  IterationPass,
  AnalysisSession,
  XLightsRecipe,
} from './types/xlights';

export default function App() {
  // Multi-Session Store State
  const [sessions, setSessions] = useState<AnalysisSession[]>(() => SessionStore.getAllSessions());
  const [activeSessionId, setActiveSessionId] = useState<string>(() => {
    const initial = SessionStore.getAllSessions();
    return initial[0]?.id || 'default';
  });

  const activeSession = sessions.find((s) => s.id === activeSessionId) || sessions[0];

  // Dynamic Preset Sequences with Custom Presets & Renaming support
  const [presets, setPresets] = useState<PresetSequence[]>(() => {
    try {
      const saved = localStorage.getItem('xlights_custom_presets_v2');
      if (saved) {
        const parsed = JSON.parse(saved);
        const merged = PRESET_SEQUENCES.map((p) => {
          const found = parsed.find((item: any) => item.id === p.id);
          if (found) {
            return { ...p, name: found.name, geometry: found.geometry || p.geometry };
          }
          return p;
        });
        const customOnly = parsed.filter((item: any) => !PRESET_SEQUENCES.some((p) => p.id === item.id)).map((custom: any) => {
          const base = PRESET_SEQUENCES.find((p) => p.propType === custom.propType) || PRESET_SEQUENCES[0];
          return {
            ...base,
            ...custom,
            renderFrame: base.renderFrame,
          };
        });
        return [...merged, ...customOnly];
      }
    } catch (e) {}
    return PRESET_SEQUENCES;
  });

  // Preset Sequence selection
  const [activePreset, setActivePreset] = useState<PresetSequence | undefined>(() => {
    return presets.find((p) => p.id === activeSession?.presetId) || presets[0];
  });

  // Media state
  const [streamSource, setStreamSource] = useState<StreamSourceInfo | null>(
    activeSession?.streamSource || {
      type: 'preset',
      title: PRESET_SEQUENCES[0].name,
      durationMs: PRESET_SEQUENCES[0].durationMs,
    }
  );
  const [videoSourceUrl, setVideoSourceUrl] = useState<string | null>(
    activeSession?.videoSourceUrl || null
  );
  const [mediaStream, setMediaStream] = useState<MediaStream | null>(null);

  const videoElementRef = useRef<HTMLVideoElement | null>(null);
  const canvasElementRef = useRef<HTMLCanvasElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // ROI State
  const [roi, setRoi] = useState<RoiBox>(
    activeSession?.roi || PRESET_SEQUENCES[0].defaultRoi
  );

  // Time & Timeline State
  const [currentTimeMs, setCurrentTimeMs] = useState<number>(activeSession?.currentTimeMs || 0);
  const [timeRange, setTimeRange] = useState<{ startMs: number; endMs: number }>(
    activeSession?.timeRange || { startMs: 0, endMs: 3000 }
  );

  // User Context & Physical Prop Geometry
  const [userConfig, setUserConfig] = useState<UserContextConfig>(
    activeSession?.userConfig || {
      propType: PRESET_SEQUENCES[0].propType,
      nodeCount: 800,
      submodelTarget: 'Default / Full Prop',
      timingInterval: PRESET_SEQUENCES[0].stepIntervalMs,
      startingLayer: 1,
      layerBlending: 'Normal',
      notes: '',
      geometry: DEFAULT_PROP_GEOMETRY[PRESET_SEQUENCES[0].propType] || DEFAULT_PROP_GEOMETRY['Mega Tree'],
    }
  );

  // Analysis Progress & Simulation Results
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);
  const [analysisProgress, setAnalysisProgress] = useState<{
    percent: number;
    currentFrame: number;
    totalFrames: number;
    stageText: string;
  }>({
    percent: 0,
    currentFrame: 0,
    totalFrames: 0,
    stageText: '',
  });

  const [analysisResult, setAnalysisResult] = useState<AnalysisDeductionResult | null>(
    activeSession?.analysisResult || null
  );
  const [previewRecipe, setPreviewRecipe] = useState<XLightsRecipe | null>(
    activeSession?.analysisResult?.primaryRecipe || null
  );
  const [activeRecipeTab, setActiveRecipeTab] = useState<'all' | 'primary' | 'alternatives'>('all');
  const [targetThreshold, setTargetThreshold] = useState<number>(92);
  const [isIterating, setIsIterating] = useState<boolean>(false);

  const [isPythonGuideOpen, setIsPythonGuideOpen] = useState<boolean>(false);
  const [isUrlModalOpen, setIsUrlModalOpen] = useState<boolean>(false);
  const [isGeometryModalOpen, setIsGeometryModalOpen] = useState<boolean>(false);
  const [isManualModalOpen, setIsManualModalOpen] = useState<boolean>(false);
  const [manualModalTab, setManualModalTab] = useState<'chapters' | 'buffers' | 'blending' | 'curves' | 'submodels' | 'effects'>('chapters');
  const [manualModalEffect, setManualModalEffect] = useState<string | undefined>(undefined);
  const [clarificationQuestion, setClarificationQuestion] = useState<ClarificationQuestion | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const handleOpenManual = (
    tab: 'chapters' | 'buffers' | 'blending' | 'curves' | 'submodels' | 'effects' = 'chapters',
    effectName?: string
  ) => {
    setManualModalTab(tab);
    setManualModalEffect(effectName);
    setIsManualModalOpen(true);
  };

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 6000);
  };

  // Helper to persist sessions state to localStorage
  const updateAndSaveSessions = (updater: (prev: AnalysisSession[]) => AnalysisSession[]) => {
    setSessions((prev) => {
      const updated = updater(prev);
      SessionStore.saveAllSessions(updated);
      return updated;
    });
  };

  // Switch Active Session Handler
  const handleSelectSession = (sessionId: string) => {
    const target = sessions.find((s) => s.id === sessionId);
    if (!target) return;

    if (mediaStream) {
      mediaStream.getTracks().forEach((t) => t.stop());
      setMediaStream(null);
    }

    setActiveSessionId(target.id);
    setStreamSource(target.streamSource);
    setVideoSourceUrl(target.videoSourceUrl);
    if (target.presetId) {
      const p = PRESET_SEQUENCES.find((seq) => seq.id === target.presetId) || PRESET_SEQUENCES[0];
      setActivePreset(p);
    } else {
      setActivePreset(undefined);
    }
    setRoi({ ...target.roi });
    setTimeRange({ ...target.timeRange });
    setCurrentTimeMs(target.currentTimeMs);
    setUserConfig({ ...target.userConfig });
    setAnalysisResult(target.analysisResult);
    setPreviewRecipe(target.analysisResult?.primaryRecipe || null);

    showToast(`Switched to session: ${target.name}`);
  };

  // Create New Prop Slice Handler (Keeps current video footage, fresh ROI slice)
  const handleCreatePropSlice = () => {
    if (!activeSession) return;
    const newSlice = SessionStore.createNewPropSliceSession(activeSession, sessions.length);
    updateAndSaveSessions((prev) => [newSlice, ...prev]);
    setActiveSessionId(newSlice.id);
    setRoi(newSlice.roi);
    setAnalysisResult(null);
    setPreviewRecipe(null);
    showToast(`Created new prop slice: "${newSlice.name}". Drag the ROI box over your next prop!`);
  };

  // Create New Blank Session Handler
  const handleCreateNewSession = () => {
    const newSession = SessionStore.createBlankSession();
    updateAndSaveSessions((prev) => [newSession, ...prev]);
    handleSelectSession(newSession.id);
  };

  // Rename Session Handler
  const handleRenameSession = (sessionId: string, newName: string) => {
    updateAndSaveSessions((prev) =>
      prev.map((s) => (s.id === sessionId ? { ...s, name: newName } : s))
    );
    showToast(`Renamed session to "${newName}"`);
  };

  // Delete Session Handler
  const handleDeleteSession = (sessionId: string) => {
    if (sessions.length <= 1) {
      showToast('Cannot delete the only remaining session.');
      return;
    }
    const remaining = sessions.filter((s) => s.id !== sessionId);
    updateAndSaveSessions(() => remaining);
    if (activeSessionId === sessionId) {
      handleSelectSession(remaining[0].id);
    }
    showToast('Session removed.');
  };

  // Rename Preset Handler
  const handleRenamePreset = (presetId: string, newName: string) => {
    setPresets((prev) => {
      const updated = prev.map((p) => (p.id === presetId ? { ...p, name: newName } : p));
      try {
        localStorage.setItem(
          'xlights_custom_presets_v2',
          JSON.stringify(
            updated.map((p) => ({
              id: p.id,
              name: p.name,
              propType: p.propType,
              geometry: p.geometry,
            }))
          )
        );
      } catch (e) {}
      return updated;
    });

    if (activePreset?.id === presetId) {
      setActivePreset((prev) => (prev ? { ...prev, name: newName } : undefined));
    }
    showToast(`Renamed preset display tab to "${newName}"`);
  };

  // Switch Preset Handler - Intelligently preserves existing video analysis session
  const handleSelectPreset = (preset: PresetSequence) => {
    if (mediaStream) {
      mediaStream.getTracks().forEach((t) => t.stop());
      setMediaStream(null);
    }

    // Check if the current active session has important user work (video or deduction results)
    const currentHasWork = Boolean(
      activeSession?.analysisResult ||
      activeSession?.videoSourceUrl ||
      (activeSession?.streamSource && activeSession.streamSource.type !== 'preset')
    );

    if (currentHasWork) {
      // Check if we already have an existing session for this preset
      const existingPresetSession = sessions.find((s) => s.presetId === preset.id);
      if (existingPresetSession) {
        handleSelectSession(existingPresetSession.id);
        showToast(`Switched to "${preset.name.split(':')[0]}". Previous session is saved in Sessions menu.`);
        return;
      }

      // Create a dedicated preset session so the current session remains completely intact
      const newPresetSession: AnalysisSession = {
        id: `session-preset-${preset.id}-${Date.now()}`,
        name: preset.name.split(':')[0],
        presetId: preset.id,
        streamSource: {
          type: 'preset',
          title: preset.name,
          durationMs: preset.durationMs,
        },
        videoSourceUrl: null,
        roi: { ...preset.defaultRoi },
        timeRange: { startMs: 0, endMs: Math.min(3000, preset.durationMs) },
        currentTimeMs: 0,
        userConfig: {
          ...userConfig,
          propType: preset.propType,
          timingInterval: preset.stepIntervalMs,
          geometry: preset.geometry || DEFAULT_PROP_GEOMETRY[preset.propType] || userConfig.geometry,
        },
        analysisResult: null,
        createdAt: new Date().toISOString(),
      };

      updateAndSaveSessions((prev) => [newPresetSession, ...prev]);
      handleSelectSession(newPresetSession.id);
      showToast(`Opened "${preset.name.split(':')[0]}". Your video session remains saved in Sessions menu.`);
      return;
    }

    // Direct in-place update for blank or already-preset sessions
    setVideoSourceUrl(null);
    setActivePreset(preset);
    const newStreamSource: StreamSourceInfo = {
      type: 'preset',
      title: preset.name,
      durationMs: preset.durationMs,
    };
    setStreamSource(newStreamSource);
    setRoi(preset.defaultRoi);
    const newTimeRange = { startMs: 0, endMs: Math.min(3000, preset.durationMs) };
    setTimeRange(newTimeRange);
    setCurrentTimeMs(0);
    const newConfig: UserContextConfig = {
      ...userConfig,
      propType: preset.propType,
      timingInterval: preset.stepIntervalMs,
      geometry: preset.geometry || DEFAULT_PROP_GEOMETRY[preset.propType] || userConfig.geometry,
    };
    setUserConfig(newConfig);
    setAnalysisResult(null);
    setPreviewRecipe(null);

    // Update active session
    updateAndSaveSessions((prev) =>
      prev.map((s) =>
        s.id === activeSessionId
          ? {
              ...s,
              name: preset.name.split(':')[0],
              presetId: preset.id,
              streamSource: newStreamSource,
              videoSourceUrl: null,
              roi: preset.defaultRoi,
              timeRange: newTimeRange,
              currentTimeMs: 0,
              userConfig: newConfig,
              analysisResult: null,
            }
          : s
      )
    );
  };

  // File Upload Handler (MP4, MKV, MOV, WebM)
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (mediaStream) {
      mediaStream.getTracks().forEach((t) => t.stop());
      setMediaStream(null);
    }

    const objectUrl = URL.createObjectURL(file);
    setVideoSourceUrl(objectUrl);
    const newStreamSource: StreamSourceInfo = {
      type: 'direct',
      url: objectUrl,
      title: file.name,
      durationMs: 60000,
    };
    setStreamSource(newStreamSource);
    setActivePreset(undefined);
    setCurrentTimeMs(0);
    const newTimeRange = { startMs: 0, endMs: 3000 };
    setTimeRange(newTimeRange);
    setAnalysisResult(null);
    setPreviewRecipe(null);

    // Update active session name and media
    updateAndSaveSessions((prev) =>
      prev.map((s) =>
        s.id === activeSessionId
          ? {
              ...s,
              name: file.name,
              streamSource: newStreamSource,
              videoSourceUrl: objectUrl,
              presetId: undefined,
              timeRange: newTimeRange,
              currentTimeMs: 0,
              analysisResult: null,
            }
          : s
      )
    );

    showToast(`Loaded ${file.name}`);
  };

  // Screen / Tab Sharing Handler
  const handleScreenShare = async () => {
    if (!navigator?.mediaDevices || typeof navigator.mediaDevices.getDisplayMedia !== 'function') {
      showToast(
        'Screen capture is not supported in this iframe/browser context. Please use "Upload Video", preset sequences, or open the app in a full browser tab.'
      );
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getDisplayMedia({
        video: true,
        audio: false,
      });

      if (mediaStream) {
        mediaStream.getTracks().forEach((t) => t.stop());
      }
      setMediaStream(stream);
      setVideoSourceUrl(null);
      const newStreamSource: StreamSourceInfo = {
        type: 'stream',
        title: 'Live Screen / Tab Display',
        durationMs: 60000,
      };
      setStreamSource(newStreamSource);
      setActivePreset(undefined);
      setCurrentTimeMs(0);
      setTimeRange({ startMs: 0, endMs: 3000 });
      setAnalysisResult(null);
      setPreviewRecipe(null);

      updateAndSaveSessions((prev) =>
        prev.map((s) =>
          s.id === activeSessionId
            ? {
                ...s,
                name: 'Live Screen Share',
                streamSource: newStreamSource,
                videoSourceUrl: null,
                presetId: undefined,
                analysisResult: null,
              }
            : s
        )
      );

      showToast('Live screen share connected');

      stream.getVideoTracks()[0].onended = () => {
        setMediaStream(null);
        handleSelectPreset(PRESET_SEQUENCES[0]);
      };
    } catch (err: any) {
      if (err.name !== 'NotAllowedError') {
        console.error('Screen share error:', err);
        showToast('Screen capture unavailable: ' + (err.message || 'Permission denied'));
      }
    }
  };

  // Camera Capture Handler
  const handleCameraCapture = async () => {
    if (!navigator?.mediaDevices || typeof navigator.mediaDevices.getUserMedia !== 'function') {
      showToast(
        'Camera capture is not supported in this iframe/browser context. Please use "Upload Video" or open the app in a full browser tab.'
      );
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 720 } },
        audio: false,
      });

      if (mediaStream) {
        mediaStream.getTracks().forEach((t) => t.stop());
      }
      setMediaStream(stream);
      setVideoSourceUrl(null);
      const newStreamSource: StreamSourceInfo = {
        type: 'stream',
        title: 'Live Camera Capture',
        durationMs: 60000,
      };
      setStreamSource(newStreamSource);
      setActivePreset(undefined);
      setCurrentTimeMs(0);
      setTimeRange({ startMs: 0, endMs: 3000 });
      setAnalysisResult(null);
      setPreviewRecipe(null);

      updateAndSaveSessions((prev) =>
        prev.map((s) =>
          s.id === activeSessionId
            ? {
                ...s,
                name: 'Live Camera Display',
                streamSource: newStreamSource,
                videoSourceUrl: null,
                presetId: undefined,
                analysisResult: null,
              }
            : s
        )
      );

      showToast('Live camera feed connected');
    } catch (err: any) {
      console.error('Camera error:', err);
      showToast('Camera stream unavailable: ' + (err.message || 'Permission denied'));
    }
  };

  // Stream URL / YouTube Submit Handler with Server Resolving
  const handleUrlSubmit = async (inputUrl: string) => {
    if (mediaStream) {
      mediaStream.getTracks().forEach((t) => t.stop());
      setMediaStream(null);
    }

    try {
      showToast('Resolving stream metadata...');
      const resp = await fetch('/api/stream-ingest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: inputUrl }),
      });

      if (resp.ok) {
        const data = await resp.json();
        if (data.type === 'youtube') {
          const newStreamSource: StreamSourceInfo = {
            type: 'youtube',
            videoId: data.videoId,
            title: data.title,
            durationMs: data.durationMs || 180000,
          };
          setStreamSource(newStreamSource);
          setVideoSourceUrl(null);
          setActivePreset(undefined);
          setCurrentTimeMs(0);
          const newRange = { startMs: 0, endMs: Math.min(5000, data.durationMs || 180000) };
          setTimeRange(newRange);
          setAnalysisResult(null);
          setPreviewRecipe(null);

          updateAndSaveSessions((prev) =>
            prev.map((s) =>
              s.id === activeSessionId
                ? {
                    ...s,
                    name: `YouTube: ${data.title}`,
                    streamSource: newStreamSource,
                    videoSourceUrl: null,
                    presetId: undefined,
                    timeRange: newRange,
                    analysisResult: null,
                  }
                : s
            )
          );

          showToast(`Loaded YouTube display: ${data.title}`);
          return;
        } else {
          const newStreamSource: StreamSourceInfo = {
            type: 'direct',
            url: data.url,
            title: data.title,
            durationMs: 60000,
          };
          setStreamSource(newStreamSource);
          setVideoSourceUrl(data.url);
          setActivePreset(undefined);
          setCurrentTimeMs(0);
          const newRange = { startMs: 0, endMs: 5000 };
          setTimeRange(newRange);
          setAnalysisResult(null);
          setPreviewRecipe(null);

          updateAndSaveSessions((prev) =>
            prev.map((s) =>
              s.id === activeSessionId
                ? {
                    ...s,
                    name: data.title,
                    streamSource: newStreamSource,
                    videoSourceUrl: data.url,
                    presetId: undefined,
                    timeRange: newRange,
                    analysisResult: null,
                  }
                : s
            )
          );

          showToast(`Loaded web video: ${data.title}`);
          return;
        }
      }
    } catch (e) {
      // Server resolve failed, fallback to client parsing
    }

    // Direct YouTube URL parsing fallback if server is unreachable
    const ytMatch = inputUrl.match(
      /(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=|shorts\/))([\w-]{11})/i
    );
    if (ytMatch && ytMatch[1]) {
      const videoId = ytMatch[1];
      const newStreamSource: StreamSourceInfo = {
        type: 'youtube',
        videoId,
        title: `YouTube Video (${videoId})`,
        durationMs: 180000,
      };
      setStreamSource(newStreamSource);
      setVideoSourceUrl(null);
      setActivePreset(undefined);
      setCurrentTimeMs(0);
      const newRange = { startMs: 0, endMs: 5000 };
      setTimeRange(newRange);
      setAnalysisResult(null);
      setPreviewRecipe(null);

      updateAndSaveSessions((prev) =>
        prev.map((s) =>
          s.id === activeSessionId
            ? {
                ...s,
                name: `YouTube: ${videoId}`,
                streamSource: newStreamSource,
                videoSourceUrl: null,
                presetId: undefined,
                timeRange: newRange,
                analysisResult: null,
              }
            : s
        )
      );

      showToast(`Loaded YouTube video (${videoId})`);
      return;
    }

    // Direct video stream URL fallback
    setVideoSourceUrl(inputUrl);
    const newStreamSource: StreamSourceInfo = {
      type: 'direct',
      url: inputUrl,
      title: 'Web Stream',
      durationMs: 60000,
    };
    setStreamSource(newStreamSource);
    setActivePreset(undefined);
    setCurrentTimeMs(0);
    const newRange = { startMs: 0, endMs: 5000 };
    setTimeRange(newRange);
    setAnalysisResult(null);
    setPreviewRecipe(null);

    updateAndSaveSessions((prev) =>
      prev.map((s) =>
        s.id === activeSessionId
          ? {
              ...s,
              name: 'Web Stream',
              streamSource: newStreamSource,
              videoSourceUrl: inputUrl,
              presetId: undefined,
              timeRange: newRange,
              analysisResult: null,
            }
          : s
      )
    );

    showToast('Loaded direct video stream URL');
  };

  // Toggle Palette Swatch Checked
  const handleToggleColorChecked = (index: number) => {
    if (!analysisResult) return;
    const updatedPalette = analysisResult.summary.activePalette.map((p) =>
      p.index === index ? { ...p, checked: !p.checked } : p
    );

    const updatedSummary = { ...analysisResult.summary, activePalette: updatedPalette };
    const recomputed = deduceXLightsRecipes(updatedSummary, userConfig, timeRange.startMs);
    setAnalysisResult(recomputed);
    setPreviewRecipe(recomputed.primaryRecipe);

    updateAndSaveSessions((prev) =>
      prev.map((s) => (s.id === activeSessionId ? { ...s, analysisResult: recomputed } : s))
    );
  };

  // Run Exhaustive Temporal CV & Deep Self-Grading Simulation Loop with Backtracking
  const handleRunAnalysis = async (userFeedbackDirective?: string) => {
    setIsAnalyzing(true);
    setAnalysisProgress({
      percent: 0,
      currentFrame: 0,
      totalFrames: 0,
      stageText: 'Initializing exhaustive temporal frame buffer...',
    });

    const targetElement =
      activePreset || streamSource?.type === 'youtube'
        ? canvasElementRef.current
        : videoElementRef.current;
    if (!targetElement) {
      setIsAnalyzing(false);
      showToast('No active video or simulator frame buffer available');
      return;
    }

    try {
      const analyzer = new VideoSequenceCvAnalyzer();
      const intervalMs = userConfig.timingInterval;

      // Stage 1: Survey and watch the whole clip first to detect repeating patterns vs new behavior
      setAnalysisProgress({
        percent: 5,
        currentFrame: 0,
        totalFrames: 0,
        stageText: 'Watching whole clip to understand repeating patterns vs new behavior...',
      });

      const wholeClipDurationMs =
        activePreset?.durationMs ||
        streamSource?.durationMs ||
        (targetElement instanceof HTMLVideoElement ? Math.min(20000, (targetElement.duration || 5) * 1000) : 4000);

      const wholeClipSurvey = await analyzer.surveyWholeClipTemporalPattern({
        video: targetElement,
        roi,
        clipDurationMs: wholeClipDurationMs,
        sampleIntervalMs: 60,
        onProgress: (pct, cur, tot, stage) => {
          setAnalysisProgress({
            percent: Math.round(pct * 0.30),
            currentFrame: cur,
            totalFrames: tot,
            stageText: stage,
          });
        },
      });

      if (wholeClipSurvey.hasRepeatingPattern) {
        showToast(
          `Detected ${wholeClipSurvey.detectedCycleCount} repeating cycles (${Math.round(wholeClipSurvey.cyclePeriodMs)}ms) · +${wholeClipSurvey.confidenceAmplificationBonus}% confidence strengthened across all passes`
        );
      }

      // Stage 2: Deep temporal frame analysis across selected range
      const summary: TemporalExtractionSummary = await analyzer.analyzeVideoTimeSegment({
        video: targetElement,
        roi,
        timeRange,
        intervalMs,
        wholeClipSurvey,
        onProgress: (percent, currentFrame, totalFrames) => {
          const scaledPercent = Math.round(30 + percent * 0.55);
          let stage = 'Extracting pixel cluster foregrounds & bloom suppression...';
          if (percent > 30 && percent < 65) {
            stage = 'Computing dense optical flow gradient tensor & vector fields...';
          } else if (percent >= 65 && percent < 85) {
            stage = 'Tracking luminance waveform dynamics & phase-locked recurrence...';
          } else if (percent >= 85) {
            stage = 'Synthesizing candidate multi-layer xLights effects & parameters...';
          }
          setAnalysisProgress({
            percent: scaledPercent,
            currentFrame,
            totalFrames,
            stageText: stage,
          });
        },
      });

      // Stage 4: Deduce candidate recipes with multi-layer stacks
      const deduction = deduceXLightsRecipes(summary, userConfig, timeRange.startMs);

      // Stage 4b: Optional Gemini AI Orchestration for Deep Multi-Layer Reasoning
      try {
        setAnalysisProgress((prev) => ({
          ...prev,
          percent: 88,
          stageText: 'Consulting Gemini AI orchestration for deep multi-layer reasoning...',
        }));

        const aiResp = await fetch('/api/ai-deduce', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            telemetry: {
              waveformPattern: summary.waveformPattern,
              motionDirection: summary.motionDirection,
              motionSpeedScore: summary.motionSpeedScore,
              spatialDensity: summary.spatialDensity,
              luminanceCurve: summary.luminanceCurve,
              activePalette: summary.activePalette,
              wholeClipSurvey,
            },
            userConfig,
          }),
        });
        if (aiResp.ok) {
          const aiJson = await aiResp.json();
          if (aiJson.geminiAvailable && aiJson.data?.recommendedEffect) {
            const aiData = aiJson.data;
            if (aiData.recommendedEffect) {
              deduction.primaryRecipe.effectName = aiData.recommendedEffect;
              if (aiData.effectSettings) {
                deduction.primaryRecipe.settings = {
                  ...deduction.primaryRecipe.settings,
                  ...aiData.effectSettings,
                };
              }
              if (aiData.effortVsVisualMatch?.notes) {
                deduction.primaryRecipe.rationale += ` • Gemini AI: ${aiData.effortVsVisualMatch.notes}`;
              }
            }
          }
        }
      } catch (e) {
        // Fallback to local CV deduction smoothly
      }

      // Stage 5: Closed-Loop Simulation Test & Deep Refinement Loop with Backtracking
      setAnalysisProgress((prev) => ({
        ...prev,
        percent: 92,
        stageText: 'Running closed-loop simulation & Visual Truth pixel verification (25 Passes)...',
      }));

      const { finalRecipe, passes } = SimulationScorer.runDeepRefinementLoop(
        summary,
        userConfig,
        deduction.primaryRecipe,
        25, // Deep optimization with up to 25 passes
        targetThreshold,
        userFeedbackDirective,
        true, // stochastic exploration
        true // visual truth verification
      );

      // Check for physical prop ambiguity requiring user advisor
      let clarification: ClarificationQuestion | null = null;
      if (userConfig.propType === 'Mega Tree' && userConfig.geometry.degrees === 360 && roi.width < 0.28) {
        clarification = {
          id: 'tree-degrees',
          title: 'Mega Tree Geometry Confirmation',
          explanation:
            'The extracted bounding box isolates a narrow vertical profile. If this is a 180° flat tree rather than a 360° cone tree, effects like Spirals and Bars render with different front-facing ribbon mappings.',
          options: [
            {
              label: '180° Flat Tree (Front Facing Only)',
              description: 'Maps effects across front visible ribbons without rear helix wrapping.',
              action: (cfg) => ({
                ...cfg,
                geometry: { ...cfg.geometry, degrees: 180 },
              }),
            },
            {
              label: '360° Round Cone Tree (All-Around)',
              description: 'Full 360-degree helical wrap with 3D perspective shading.',
              action: (cfg) => ({
                ...cfg,
                geometry: { ...cfg.geometry, degrees: 360 },
              }),
            },
          ],
        };
      }

      const completedResult: AnalysisDeductionResult = {
        ...deduction,
        primaryRecipe: finalRecipe,
        iterationPasses: passes,
        clarificationRequired: clarification,
      };

      setAnalysisResult(completedResult);
      setPreviewRecipe(finalRecipe);

      // Persist completed run into the active session
      updateAndSaveSessions((prev) =>
        prev.map((s) =>
          s.id === activeSessionId
            ? {
                ...s,
                roi,
                timeRange,
                currentTimeMs,
                userConfig,
                analysisResult: completedResult,
              }
            : s
        )
      );

      showToast(
        `Analysis & Deep Refinement complete: ${passes.length} passes (${finalRecipe.simulationScore?.overallMatchPercentage}% visual match)`
      );
    } catch (err: any) {
      console.error('Analysis error:', err);
      showToast('Analysis error: ' + err.message);
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Continue Iterating Handler with User Natural Language Feedback, Stochastic Mode & Visual Truth
  const handleContinueIterating = (
    feedbackText: string,
    enableStochastic?: boolean,
    enableVisualTruth?: boolean
  ) => {
    if (!analysisResult) return;
    setIsIterating(true);
    const additionalPasses = 15;
    const currentPasses = analysisResult.iterationPasses.length;
    const targetPasses = Math.min(50, currentPasses + additionalPasses);
    showToast(
      `Executing +${additionalPasses} additional refinement passes (${
        enableVisualTruth !== false ? '🛡️ Visual Truth Active' : 'Standard'
      } · ${enableStochastic !== false ? 'Stochastic' : 'Fine-Tune'})...`
    );

    const summary = analysisResult.summary;
    const { finalRecipe, passes } = SimulationScorer.runDeepRefinementLoop(
      summary,
      userConfig,
      analysisResult.primaryRecipe,
      targetPasses,
      targetThreshold,
      feedbackText,
      enableStochastic !== false,
      enableVisualTruth !== false
    );

    const updatedResult = {
      ...analysisResult,
      primaryRecipe: finalRecipe,
      iterationPasses: passes,
    };

    setAnalysisResult(updatedResult);
    setPreviewRecipe(finalRecipe);

    updateAndSaveSessions((prev) =>
      prev.map((s) => (s.id === activeSessionId ? { ...s, analysisResult: updatedResult } : s))
    );

    setIsIterating(false);
    showToast(`Refinement updated: ${passes.length} passes completed (${finalRecipe.simulationScore?.overallMatchPercentage}% match)`);
  };

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-100 flex flex-col font-sans">
      {/* Hidden File Input for Local Video Upload */}
      <input
        ref={fileInputRef}
        type="file"
        accept="video/mp4,video/x-matroska,video/quicktime,video/webm"
        className="hidden"
        onChange={handleFileUpload}
      />

      {/* Header with Top-Bar Session Switcher Dropdown */}
      <Header
        presets={presets}
        activePresetId={activePreset?.id || ''}
        onSelectPreset={handleSelectPreset}
        onRenamePreset={handleRenamePreset}
        onUploadClick={() => fileInputRef.current?.click()}
        onScreenShareClick={handleScreenShare}
        onCameraClick={handleCameraCapture}
        onUrlInputClick={() => setIsUrlModalOpen(true)}
        onOpenPythonGuide={() => setIsPythonGuideOpen(true)}
        onOpenManual={() => handleOpenManual('chapters')}
        isAnalyzing={isAnalyzing}
        sessions={sessions}
        activeSessionId={activeSessionId}
        onSelectSession={handleSelectSession}
        onCreatePropSlice={handleCreatePropSlice}
        onCreateNewSession={handleCreateNewSession}
        onRenameSession={handleRenameSession}
        onDeleteSession={handleDeleteSession}
      />

      {/* Main Workspace Layout */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 md:p-6 flex flex-col gap-6">
        {/* Top Section: Video Player & User Context Panel */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Video Player Column */}
          <div className="lg:col-span-8 flex flex-col gap-4">
            <VideoPlayerWithRoi
              currentPreset={activePreset}
              streamSource={streamSource}
              mediaStream={mediaStream}
              videoElementRef={videoElementRef}
              canvasElementRef={canvasElementRef}
              roi={roi}
              onChangeRoi={(newRoi) => {
                setRoi(newRoi);
              }}
              onCommitRoi={(newRoi) => {
                setRoi(newRoi);
                updateAndSaveSessions((prev) =>
                  prev.map((s) => (s.id === activeSessionId ? { ...s, roi: newRoi } : s))
                );
              }}
              timeRange={timeRange}
              onChangeTimeRange={(newRange) => {
                setTimeRange(newRange);
                updateAndSaveSessions((prev) =>
                  prev.map((s) => (s.id === activeSessionId ? { ...s, timeRange: newRange } : s))
                );
              }}
              currentTimeMs={currentTimeMs}
              onSeekTimeMs={setCurrentTimeMs}
              timingInterval={userConfig.timingInterval}
              isAnalyzing={isAnalyzing}
              geometry={userConfig.geometry}
            />

            {/* Analysis Action Launcher Banner */}
            <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 shadow-xl">
              <div className="flex flex-col gap-1">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-sm text-neutral-100 flex items-center gap-1.5">
                    <Activity className="w-4 h-4 text-amber-400" />
                    Exhaustive Vision Reverse-Engineer
                  </span>
                  <span className="text-xs text-neutral-500">·</span>
                  <span className="text-xs font-mono text-emerald-400">Zero-Friction 1-Click</span>
                </div>
                <p className="text-xs text-neutral-400">
                  Evaluates 100% of frames in target window ({timeRange.startMs}ms - {timeRange.endMs}ms) at{' '}
                  <span className="text-amber-400 font-semibold">{userConfig.timingInterval}ms</span>{' '}
                  intervals with deep closed-loop simulation grading & backtracking.
                </p>
              </div>

              <button
                type="button"
                onClick={() => handleRunAnalysis()}
                disabled={isAnalyzing}
                className="px-6 py-3 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-neutral-950 font-black text-sm transition flex items-center justify-center gap-2 shadow-lg shadow-amber-500/20 disabled:opacity-50 cursor-pointer whitespace-nowrap"
              >
                <Zap className="w-4 h-4 fill-current" />
                {isAnalyzing ? 'Extracting & Simulating...' : 'Reverse-Engineer Prop'}
              </button>
            </div>

            {/* Analysis In-Progress Status Bar */}
            {isAnalyzing && (
              <div className="bg-neutral-900/90 border border-amber-500/40 rounded-xl p-4 flex flex-col gap-2.5 animate-pulse">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-amber-300 flex items-center gap-2">
                    <Clock className="w-3.5 h-3.5 animate-spin" />
                    {analysisProgress.stageText}
                  </span>
                  <span className="font-mono text-neutral-300 font-bold">
                    Frame {analysisProgress.currentFrame} / {analysisProgress.totalFrames} ({analysisProgress.percent}%)
                  </span>
                </div>
                <div className="h-2 w-full bg-neutral-950 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-amber-500 to-emerald-400 transition-all duration-150"
                    style={{ width: `${analysisProgress.percent}%` }}
                  />
                </div>
              </div>
            )}
          </div>

          {/* User Context & Override Column */}
          <div className="lg:col-span-4 flex flex-col gap-4">
            <UserContextPanel
              config={userConfig}
              onChangeConfig={(cfg) => {
                setUserConfig(cfg);
                if (analysisResult) {
                  const recomputed = deduceXLightsRecipes(
                    analysisResult.summary,
                    cfg,
                    timeRange.startMs
                  );
                  setAnalysisResult(recomputed);
                  setPreviewRecipe(recomputed.primaryRecipe);
                }
                updateAndSaveSessions((prev) =>
                  prev.map((s) => (s.id === activeSessionId ? { ...s, userConfig: cfg } : s))
                );
              }}
              onOpenGeometryModal={() => setIsGeometryModalOpen(true)}
              disabled={isAnalyzing}
            />

            {/* Quick Diagnostic Card */}
            <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-4 flex flex-col gap-3 text-xs">
              <div className="font-semibold text-neutral-200 flex items-center gap-1.5 pb-2 border-b border-neutral-800">
                <Cpu className="w-3.5 h-3.5 text-amber-400" />
                CV Engine & Simulation Specifications
              </div>
              <div className="flex flex-col gap-2 text-neutral-400">
                <div className="flex justify-between">
                  <span>Physical Prop Geometry:</span>
                  <span className="font-semibold text-neutral-200">
                    {userConfig.geometry.degrees}° {userConfig.propType}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Auto-Refinement Passes:</span>
                  <span className="text-amber-400 font-mono">Up to 10 Cycles (Adaptive Backtracking)</span>
                </div>
                <div className="flex justify-between">
                  <span>Night Sky Filter:</span>
                  <span className="text-emerald-400">Adaptive Black-Floor Subtraction</span>
                </div>
                <div className="flex justify-between">
                  <span>Optical Flow Engine:</span>
                  <span className="font-mono text-neutral-200">Lucas-Kanade & Horn-Schunck</span>
                </div>
                <div className="flex justify-between">
                  <span>xLights Target Version:</span>
                  <span className="text-amber-300 font-mono">xLights 2024 / 2025 / 2026 Compliant</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Temporal Waveform, Simulation Comparison & Recipes */}
        {analysisResult && (
          <div className="flex flex-col gap-6">
            {/* Waveform and Vector Telemetry Viewer */}
            <WaveformAndVectorViewer
              summary={analysisResult.summary}
              currentTimeMs={currentTimeMs}
              onSeekTimeMs={setCurrentTimeMs}
              onToggleColorChecked={handleToggleColorChecked}
            />

            {/* Simulation-in-the-Loop Comparison Viewer with Real-Time Difference Heatmap */}
            <SimulationComparisonViewer
              recipe={previewRecipe || analysisResult.primaryRecipe}
              propType={userConfig.propType}
              geometry={userConfig.geometry}
              currentTimeMs={currentTimeMs}
              durationMs={analysisResult.summary.durationMs}
              targetThreshold={targetThreshold}
              onChangeTargetThreshold={setTargetThreshold}
              onContinueIterating={handleContinueIterating}
              isIterating={isIterating}
              sourceElement={activePreset ? canvasElementRef.current : videoElementRef.current}
              roi={roi}
              summary={analysisResult.summary}
              onOpenManual={handleOpenManual}
            />

            {/* Multi-Hypothesis Deduction & Transparent Confidence Engine */}
            <div className="flex flex-col gap-4">
              {/* Confidence & Ambiguity Banner */}
              <div
                className={`p-4 rounded-xl border flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 shadow-lg ${
                  analysisResult.confidenceScore >= 90 && !analysisResult.isAmbiguous
                    ? 'bg-neutral-900/90 border-emerald-500/50'
                    : 'bg-amber-950/20 border-amber-500/50'
                }`}
              >
                <div className="flex items-start sm:items-center gap-3">
                  <div
                    className={`w-12 h-12 rounded-xl flex items-center justify-center font-black text-lg ${
                      analysisResult.confidenceScore >= 90
                        ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                        : 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                    }`}
                  >
                    {analysisResult.confidenceScore}%
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-bold text-sm text-neutral-100">
                        {analysisResult.confidenceScore >= 90
                          ? 'High-Confidence Recipe Match'
                          : 'Multi-Hypothesis Alternative Detected'}
                      </h3>
                      {analysisResult.isAmbiguous && (
                        <span className="px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/40 text-[10px] font-bold uppercase">
                          Multiple Approaches Available
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-neutral-400 mt-0.5">
                      {analysisResult.ambiguityNotice ||
                        'Analyzed full temporal envelope, optical flow field, and dominant color clusters.'}
                    </p>
                  </div>
                </div>

                {/* Clarification prompt launcher if geometry is ambiguous */}
                {analysisResult.clarificationRequired && (
                  <button
                    type="button"
                    onClick={() => setClarificationQuestion(analysisResult.clarificationRequired || null)}
                    className="px-3.5 py-1.5 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 font-semibold text-xs transition flex items-center gap-1.5 cursor-pointer self-start sm:self-auto"
                  >
                    <Info className="w-3.5 h-3.5" />
                    Prop Layout Advisor
                  </button>
                )}
              </div>

              {/* Suggested Recipe Hypothesis Squares */}
              <div className="bg-neutral-900/90 border border-neutral-800 rounded-xl p-3.5 flex flex-col gap-2.5">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-amber-400" />
                    <span className="font-bold text-xs text-neutral-200">
                      Suggested Hypothesis Recipe Squares ({analysisResult.alternativeRecipes.length + 1} Approaches)
                    </span>
                  </div>
                  <span className="text-[11px] text-neutral-400">
                    Click any suggestion square to load and simulate that exact effect recipe
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2">
                  {[analysisResult.primaryRecipe, ...analysisResult.alternativeRecipes].map((r, idx) => {
                    const isSelected = (previewRecipe?.id || analysisResult.primaryRecipe.id) === r.id;
                    const isPrimary = r.isPrimary;
                    return (
                      <div
                        key={r.id}
                        onClick={() => setPreviewRecipe(r)}
                        className={`p-2.5 rounded-lg border text-left flex flex-col justify-between gap-2 cursor-pointer transition select-none group relative ${
                          isSelected
                            ? 'bg-amber-500/15 border-amber-500/70 ring-1 ring-amber-500/40 shadow-sm'
                            : 'bg-neutral-950/70 border-neutral-800/80 hover:border-neutral-700 hover:bg-neutral-900'
                        }`}
                        title={`Click to preview "${r.effectName}" in 3D simulator`}
                      >
                        <div className="flex items-center justify-between">
                          <span
                            className={`text-[9.5px] font-mono font-bold px-1.5 py-0.5 rounded ${
                              isPrimary
                                ? 'bg-amber-500 text-neutral-950'
                                : 'bg-neutral-800 text-neutral-300'
                            }`}
                          >
                            {isPrimary ? 'Primary' : `Alt #${idx}`}
                          </span>
                          <span className="text-[10px] font-mono font-bold text-emerald-400">
                            {r.tradeOff.visualMatchPercentage}%
                          </span>
                        </div>

                        <div>
                          <div className="font-bold text-xs text-neutral-100 group-hover:text-amber-300 truncate">
                            {r.effectName}
                          </div>
                          <div className="text-[10.5px] text-neutral-400 truncate mt-0.5">
                            {r.targetProp}
                          </div>
                        </div>

                        <div className="flex items-center justify-between pt-1 border-t border-neutral-800/70 text-[10px]">
                          <span className="text-neutral-500">{r.tradeOff.effort} Effort</span>
                          <span className={isSelected ? 'text-amber-400 font-bold' : 'text-neutral-400'}>
                            {isSelected ? 'Previewing' : 'Preview →'}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Recipe Tabs & Filter Controls */}
              <div className="flex items-center justify-between flex-wrap gap-2 border-b border-neutral-800 pb-2">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-xs text-neutral-300">Display Recipes:</span>
                  <button
                    onClick={() => setActiveRecipeTab('all')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition cursor-pointer ${
                      activeRecipeTab === 'all'
                        ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                        : 'bg-neutral-950 text-neutral-400 border-neutral-800 hover:text-white'
                    }`}
                  >
                    All Recipes ({analysisResult.alternativeRecipes.length + 1})
                  </button>
                  <button
                    onClick={() => setActiveRecipeTab('primary')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition cursor-pointer ${
                      activeRecipeTab === 'primary'
                        ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                        : 'bg-neutral-950 text-neutral-400 border-neutral-800 hover:text-white'
                    }`}
                  >
                    Primary Only
                  </button>
                  <button
                    onClick={() => setActiveRecipeTab('alternatives')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition cursor-pointer ${
                      activeRecipeTab === 'alternatives'
                        ? 'bg-purple-500/20 text-purple-300 border-purple-500/40'
                        : 'bg-neutral-950 text-neutral-400 border-neutral-800 hover:text-white'
                    }`}
                  >
                    Alternatives ({analysisResult.alternativeRecipes.length})
                  </button>
                </div>
              </div>

              {/* Generated Recipe Cards List */}
              <div className="flex flex-col gap-5">
                {(activeRecipeTab === 'all' || activeRecipeTab === 'primary') && (
                  <RecipeCard
                    recipe={analysisResult.primaryRecipe}
                    isPrimary={true}
                    onPreviewRecipe={(r) => setPreviewRecipe(r)}
                    isPreviewing={
                      (previewRecipe?.id || analysisResult.primaryRecipe.id) ===
                      analysisResult.primaryRecipe.id
                    }
                    onOpenManual={handleOpenManual}
                  />
                )}

                {(activeRecipeTab === 'all' || activeRecipeTab === 'alternatives') &&
                  analysisResult.alternativeRecipes.map((alt) => (
                    <RecipeCard
                      key={alt.id}
                      recipe={alt}
                      isPrimary={false}
                      onPreviewRecipe={(r) => setPreviewRecipe(r)}
                      isPreviewing={previewRecipe?.id === alt.id}
                      onOpenManual={handleOpenManual}
                    />
                  ))}
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="mt-auto border-t border-neutral-800/80 bg-neutral-950/60 py-4 px-6 text-xs text-neutral-500">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>xLights Sequence Vision Reverse-Engineer & Recipe Generator v2.1</span>
          <span>
            Compliant with xLights 2024.x+ XML Clipboard Specification · Multi-Layer Closed-Loop Optimizer
          </span>
        </div>
      </footer>

      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-5 right-5 z-50 px-4 py-3 rounded-lg bg-neutral-900 border border-amber-500/60 text-neutral-100 text-xs font-medium shadow-2xl flex items-start gap-2.5 animate-in fade-in slide-in-from-bottom-2 max-w-md">
          <Info className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
          <span className="flex-1 leading-snug">{toastMessage}</span>
          <button
            onClick={() => setToastMessage(null)}
            className="text-neutral-400 hover:text-white shrink-0 p-0.5 cursor-pointer"
          >
            ✕
          </button>
        </div>
      )}

      {/* Prop Geometry Customization Modal */}
      <PropGeometryModal
        isOpen={isGeometryModalOpen}
        onClose={() => setIsGeometryModalOpen(false)}
        propType={userConfig.propType}
        geometry={userConfig.geometry}
        activePresetName={activePreset?.name.split(':')[0]}
        onSaveGeometry={(geom, saveAsNewPresetName, renameActivePresetTo) => {
          const updated = { ...userConfig, geometry: geom };
          setUserConfig(updated);

          if (saveAsNewPresetName) {
            // Save as a new separate preset tab in top bar
            const base = activePreset || presets.find((p) => p.propType === userConfig.propType) || presets[0];
            const newPreset: PresetSequence = {
              ...base,
              id: `custom-preset-${Date.now()}`,
              name: saveAsNewPresetName,
              propType: userConfig.propType,
              geometry: geom,
              renderFrame: base.renderFrame,
            };

            setPresets((prev) => {
              const next = [...prev, newPreset];
              try {
                localStorage.setItem(
                  'xlights_custom_presets_v2',
                  JSON.stringify(
                    next.map((p) => ({
                      id: p.id,
                      name: p.name,
                      propType: p.propType,
                      geometry: p.geometry,
                    }))
                  )
                );
              } catch (e) {}
              return next;
            });

            handleSelectPreset(newPreset);
            showToast(`Created new preset display tab: "${saveAsNewPresetName}"`);
          } else if (renameActivePresetTo && activePreset) {
            handleRenamePreset(activePreset.id, renameActivePresetTo);
            showToast(`Updated geometry & renamed tab to "${renameActivePresetTo}"`);
          } else {
            showToast(`Updated physical geometry for ${userConfig.propType}`);
          }

          if (analysisResult) {
            handleContinueIterating('');
          }
          updateAndSaveSessions((prev) =>
            prev.map((s) => (s.id === activeSessionId ? { ...s, userConfig: updated } : s))
          );
        }}
      />

      {/* Clarification Advisor Modal */}
      <ClarificationAdvisorModal
        question={clarificationQuestion}
        onSelectOption={(action) => {
          const updated = action(userConfig);
          setUserConfig(updated);
          setClarificationQuestion(null);
          showToast('Updated configuration preference');
          if (analysisResult) {
            handleContinueIterating('');
          }
          updateAndSaveSessions((prev) =>
            prev.map((s) => (s.id === activeSessionId ? { ...s, userConfig: updated } : s))
          );
        }}
        onDismiss={() => setClarificationQuestion(null)}
      />

      {/* Python Backend Reference Guide Modal */}
      <PythonBackendModal
        isOpen={isPythonGuideOpen}
        onClose={() => setIsPythonGuideOpen(false)}
      />

      {/* Direct Video URL Modal */}
      <UrlInputModal
        isOpen={isUrlModalOpen}
        onClose={() => setIsUrlModalOpen(false)}
        onSubmitUrl={handleUrlSubmit}
      />

      {/* Official xLights Manual & Architectural Engine Modal */}
      <XLightsManualModal
        isOpen={isManualModalOpen}
        onClose={() => setIsManualModalOpen(false)}
        initialTab={manualModalTab}
        initialEffect={manualModalEffect}
      />
    </div>
  );
}
