import { AnalysisSession, RoiBox, UserContextConfig, AnalysisDeductionResult } from '../types/xlights';
import { PRESET_SEQUENCES } from './presetSequences';

const STORAGE_KEY = 'xlights_vision_saved_sessions_v2';

export class SessionStore {
  /**
   * Retrieves all saved sessions from localStorage or returns default session list.
   */
  public static getAllSessions(): AnalysisSession[] {
    try {
      const data = localStorage.getItem(STORAGE_KEY);
      if (data) {
        const parsed = JSON.parse(data);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      }
    } catch (e) {
      console.warn('Unable to read sessions from localStorage:', e);
    }

    // Default initial session using Preset 0 (Mega Tree)
    const initialSession: AnalysisSession = {
      id: 'session-' + Date.now(),
      name: 'Mega Tree: Rainbow Spiral & Sparkle',
      createdAt: new Date().toISOString(),
      streamSource: {
        type: 'preset',
        title: PRESET_SEQUENCES[0].name,
        durationMs: PRESET_SEQUENCES[0].durationMs,
      },
      videoSourceUrl: null,
      presetId: PRESET_SEQUENCES[0].id,
      roi: { ...PRESET_SEQUENCES[0].defaultRoi },
      timeRange: { startMs: 0, endMs: Math.min(3000, PRESET_SEQUENCES[0].durationMs) },
      currentTimeMs: 0,
      userConfig: {
        propType: PRESET_SEQUENCES[0].propType,
        nodeCount: 800,
        submodelTarget: 'Default / Full Prop',
        timingInterval: PRESET_SEQUENCES[0].stepIntervalMs,
        startingLayer: 1,
        layerBlending: 'Normal',
        notes: '',
        geometry: {
          degrees: 360,
          strands: 32,
          nodesPerStrand: 50,
          archCount: 1,
          nodesPerArch: 50,
          matrixRows: 20,
          matrixCols: 50,
          matrixOrientation: 'Horizontal',
          spinnerBlades: 12,
          nodesPerBlade: 16,
          hasStarTopper: true,
          starNodes: 50,
        },
      },
      analysisResult: null,
    };

    return [initialSession];
  }

  /**
   * Saves the list of sessions to localStorage.
   */
  public static saveAllSessions(sessions: AnalysisSession[]): void {
    try {
      // Store up to 25 recent sessions
      const pruned = sessions.slice(0, 25);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(pruned));
    } catch (e) {
      console.warn('Unable to persist sessions to localStorage:', e);
    }
  }

  /**
   * Creates a new prop slice session from an existing video/stream source.
   * Keeps the same video source but gives the user a fresh ROI and session title.
   */
  public static createNewPropSliceSession(
    currentSession: AnalysisSession,
    sliceCount: number
  ): AnalysisSession {
    const videoTitle = currentSession.streamSource?.title || 'Video';
    const newSession: AnalysisSession = {
      id: 'session-' + Date.now() + '-' + Math.random().toString(36).substring(2, 6),
      name: `${videoTitle.split(':')[0]} - Prop Slice ${sliceCount + 1}`,
      createdAt: new Date().toISOString(),
      streamSource: currentSession.streamSource,
      videoSourceUrl: currentSession.videoSourceUrl,
      presetId: currentSession.presetId,
      // Slightly shift the ROI or reset so the user can frame a different prop easily
      roi: {
        ...currentSession.roi,
        x: Math.min(0.6, currentSession.roi.x + 0.1),
        y: Math.min(0.6, currentSession.roi.y + 0.05),
        locked: false,
      },
      timeRange: { ...currentSession.timeRange },
      currentTimeMs: currentSession.currentTimeMs,
      userConfig: { ...currentSession.userConfig },
      analysisResult: null,
    };
    return newSession;
  }

  /**
   * Creates a brand new empty session.
   */
  public static createBlankSession(name?: string): AnalysisSession {
    const preset = PRESET_SEQUENCES[0];
    return {
      id: 'session-' + Date.now(),
      name: name || `Session ${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`,
      createdAt: new Date().toISOString(),
      streamSource: {
        type: 'preset',
        title: preset.name,
        durationMs: preset.durationMs,
      },
      videoSourceUrl: null,
      presetId: preset.id,
      roi: { ...preset.defaultRoi },
      timeRange: { startMs: 0, endMs: 3000 },
      currentTimeMs: 0,
      userConfig: {
        propType: preset.propType,
        nodeCount: 800,
        submodelTarget: 'Default / Full Prop',
        timingInterval: preset.stepIntervalMs,
        startingLayer: 1,
        layerBlending: 'Normal',
        notes: '',
        geometry: {
          degrees: 360,
          strands: 32,
          nodesPerStrand: 50,
          archCount: 1,
          nodesPerArch: 50,
          matrixRows: 20,
          matrixCols: 50,
          matrixOrientation: 'Horizontal',
          spinnerBlades: 12,
          nodesPerBlade: 16,
          hasStarTopper: true,
          starNodes: 50,
        },
      },
      analysisResult: null,
    };
  }
}
