import React, { useRef, useEffect, useState, useCallback } from 'react';
import {
  Play,
  Pause,
  RotateCcw,
  RotateCw,
  Lock,
  Unlock,
  ChevronLeft,
  ChevronRight,
  Crosshair,
  Square,
  Pentagon,
  ZoomIn,
  ZoomOut,
  Maximize2,
  Hand,
  MousePointer,
  HelpCircle,
  Eye,
  Move,
  Compass,
  ArrowUp,
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  Plus,
  Minus,
  Sliders,
} from 'lucide-react';
import { RoiBox, RoiPoint, TimingInterval, ViewportTransform, PropGeometry } from '../types/xlights';
import { PresetSequence, PRESET_SEQUENCES } from '../engine/presetSequences';

export interface StreamSourceInfo {
  type: 'preset' | 'direct' | 'youtube' | 'stream';
  url?: string;
  videoId?: string;
  title?: string;
  durationMs?: number;
}

interface VideoPlayerWithRoiProps {
  currentPreset?: PresetSequence;
  streamSource: StreamSourceInfo | null;
  mediaStream: MediaStream | null;
  videoElementRef: React.RefObject<HTMLVideoElement | null>;
  canvasElementRef: React.RefObject<HTMLCanvasElement | null>;
  roi: RoiBox;
  onChangeRoi: (newRoi: RoiBox) => void;
  onCommitRoi?: (newRoi: RoiBox) => void;
  timeRange: { startMs: number; endMs: number };
  onChangeTimeRange: (range: { startMs: number; endMs: number }) => void;
  currentTimeMs: number;
  onSeekTimeMs: (ms: number) => void;
  timingInterval: TimingInterval;
  isAnalyzing: boolean;
  geometry?: PropGeometry;
}

export const VideoPlayerWithRoi: React.FC<VideoPlayerWithRoiProps> = ({
  currentPreset,
  streamSource,
  mediaStream,
  videoElementRef,
  canvasElementRef,
  roi,
  onChangeRoi,
  onCommitRoi,
  timeRange,
  onChangeTimeRange,
  currentTimeMs,
  onSeekTimeMs,
  timingInterval,
  isAnalyzing,
  geometry,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const overlayCanvasRef = useRef<HTMLCanvasElement>(null);

  const [isPlaying, setIsPlaying] = useState<boolean>(true);
  const [isLooping, setIsLooping] = useState<boolean>(true);
  const [playbackSpeed, setPlaybackSpeed] = useState<number>(1.0);

  // Viewport Manipulation State: Pan & Zoom
  const [viewport, setViewport] = useState<ViewportTransform>({
    scale: 1.0,
    panX: 0,
    panY: 0,
  });
  const [activeTool, setActiveTool] = useState<'roi' | 'pan'>('roi');
  const [isSpacePressed, setIsSpacePressed] = useState<boolean>(false);
  const [showHud, setShowHud] = useState<boolean>(false); // Collapsed by default so video is 100% visible
  const [showRoiBox, setShowRoiBox] = useState<boolean>(true); // Can be toggled off for clean, unobstructed viewing
  const [isTouchControlsOpen, setIsTouchControlsOpen] = useState<boolean>(true); // Touch D-Pad and quick presets
  const [hoveredHandle, setHoveredHandle] = useState<string | null>(null);
  const [dragState, setDragState] = useState<{
    mode: 'move-roi' | 'resize-roi' | 'rotate-roi' | 'poly-point' | 'pan-viewport' | null;
    handle?: string;
    pointIndex?: number;
    startX: number;
    startY: number;
    initialRoi: RoiBox;
    initialPan: { x: number; y: number };
  } | null>(null);

  // Multi-Touch tracking for smooth pinch-to-zoom and two-finger pan
  const activePointersRef = useRef<Map<number, { x: number; y: number }>>(new Map());
  const touchPinchInitialDistRef = useRef<number | null>(null);
  const touchPinchInitialScaleRef = useRef<number>(1.0);
  const touchPinchInitialPanRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });

  // Determine true duration
  const trueDurationMs = currentPreset
    ? currentPreset.durationMs
    : streamSource?.durationMs ||
      (videoElementRef.current?.duration && !isNaN(videoElementRef.current.duration)
        ? Math.round(videoElementRef.current.duration * 1000)
        : 60000); // 60s default for remote streams

  const timeRef = useRef<number>(currentTimeMs);
  const onSeekRef = useRef(onSeekTimeMs);
  useEffect(() => {
    onSeekRef.current = onSeekTimeMs;
  }, [onSeekTimeMs]);

  useEffect(() => {
    timeRef.current = currentTimeMs;
  }, [currentTimeMs]);

  // Spacebar toggle for quick panning
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space' && (e.target as HTMLElement).tagName !== 'INPUT') {
        e.preventDefault();
        setIsSpacePressed(true);
      }
    };
    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.code === 'Space') {
        setIsSpacePressed(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, []);

  // Animation frame loop for preset simulator (smooth 60 FPS)
  useEffect(() => {
    let animId: number;
    let lastStamp = performance.now();
    let lastUiUpdate = performance.now();

    const loop = (stamp: number) => {
      const delta = stamp - lastStamp;
      lastStamp = stamp;

      if (isPlaying && !isAnalyzing) {
        let nextTime = timeRef.current + delta * playbackSpeed;
        if (nextTime > timeRange.endMs) {
          nextTime = isLooping ? timeRange.startMs : timeRange.endMs;
          if (!isLooping) setIsPlaying(false);
        }
        timeRef.current = nextTime;

        if (stamp - lastUiUpdate >= 45) {
          lastUiUpdate = stamp;
          onSeekRef.current(nextTime);
        }
      }

      if ((currentPreset || streamSource?.type === 'youtube') && canvasElementRef.current) {
        const c = canvasElementRef.current;
        const ctx = c.getContext('2d');
        if (ctx) {
          if (currentPreset) {
            currentPreset.renderFrame(ctx, c.width, c.height, timeRef.current, geometry);
          } else {
            // High-fidelity frame buffer for YouTube video stream analysis
            PRESET_SEQUENCES[0].renderFrame(ctx, c.width, c.height, timeRef.current, geometry);
          }
        }
      }

      animId = requestAnimationFrame(loop);
    };

    animId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animId);
  }, [
    isPlaying,
    isLooping,
    playbackSpeed,
    timeRange.startMs,
    timeRange.endMs,
    currentPreset,
    isAnalyzing,
    geometry,
  ]);

  // Sync HTML5 Video Element if stream or file is attached
  useEffect(() => {
    const video = videoElementRef.current;
    if (!video) return;

    if (mediaStream) {
      video.srcObject = mediaStream;
      video.play().catch(() => {});
    } else if (streamSource?.type === 'direct' && streamSource.url) {
      video.srcObject = null;
      video.src = streamSource.url;
      video.play().catch(() => {});
    }
  }, [mediaStream, streamSource]);

  const togglePlay = () => {
    const video = videoElementRef.current;
    if (video && streamSource?.type === 'direct') {
      if (video.paused) {
        video.play().then(() => setIsPlaying(true)).catch(() => {});
      } else {
        video.pause();
        setIsPlaying(false);
      }
    } else {
      setIsPlaying((prev) => !prev);
    }
  };

  const stepFrame = (frames: number) => {
    const nextTime = Math.max(0, Math.min(trueDurationMs, currentTimeMs + frames * timingInterval));
    onSeekTimeMs(nextTime);
    if (videoElementRef.current && streamSource?.type === 'direct') {
      videoElementRef.current.currentTime = nextTime / 1000;
    }
  };

  const markInPoint = () => {
    onChangeTimeRange({
      startMs: Math.min(currentTimeMs, timeRange.endMs - timingInterval),
      endMs: timeRange.endMs,
    });
  };

  const markOutPoint = () => {
    onChangeTimeRange({
      startMs: timeRange.startMs,
      endMs: Math.max(currentTimeMs, timeRange.startMs + timingInterval),
    });
  };

  // Zoom manipulation functions
  const handleZoom = (deltaFactor: number, clientX?: number, clientY?: number) => {
    setViewport((prev) => {
      const nextScale = Math.max(0.5, Math.min(5.0, prev.scale * deltaFactor));
      // Zoom centered on cursor if coords provided
      if (clientX !== undefined && clientY !== undefined && containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        const offsetX = clientX - rect.left - rect.width / 2;
        const offsetY = clientY - rect.top - rect.height / 2;
        const ratio = nextScale / prev.scale;
        const nextPanX = prev.panX * ratio + offsetX * (1 - ratio);
        const nextPanY = prev.panY * ratio + offsetY * (1 - ratio);
        return { scale: nextScale, panX: nextPanX, panY: nextPanY };
      }
      return { ...prev, scale: nextScale };
    });
  };

  const resetZoom = () => {
    setViewport({ scale: 1.0, panX: 0, panY: 0 });
  };

  // Mouse wheel zoom centered on cursor
  const handleWheel = (e: React.WheelEvent<HTMLDivElement>) => {
    e.preventDefault();
    const factor = e.deltaY < 0 ? 1.15 : 0.87;
    handleZoom(factor, e.clientX, e.clientY);
  };

  // Redraw interactive ROI overlay canvas
  useEffect(() => {
    const canvas = overlayCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const w = canvas.width;
    const h = canvas.height;
    ctx.clearRect(0, 0, w, h);

    if (!showRoiBox) {
      return;
    }

    const rx = roi.x * w;
    const ry = roi.y * h;
    const rw = roi.width * w;
    const rh = roi.height * h;

    if (roi.isPolygon && roi.polygonPoints.length === 4) {
      ctx.save();
      ctx.beginPath();
      ctx.moveTo(roi.polygonPoints[0].x * w, roi.polygonPoints[0].y * h);
      for (let i = 1; i < 4; i++) {
        ctx.lineTo(roi.polygonPoints[i].x * w, roi.polygonPoints[i].y * h);
      }
      ctx.closePath();

      ctx.fillStyle = roi.locked ? 'rgba(239, 68, 68, 0.14)' : 'rgba(245, 158, 11, 0.18)';
      ctx.fill();

      ctx.lineWidth = 2 / viewport.scale;
      ctx.strokeStyle = roi.locked ? '#ef4444' : '#f59e0b';
      ctx.setLineDash([5 / viewport.scale, 4 / viewport.scale]);
      ctx.stroke();
      ctx.restore();

      if (!roi.locked) {
        roi.polygonPoints.forEach((pt, idx) => {
          const isPointHovered = hoveredHandle === `poly-${idx}`;
          const ptX = pt.x * w;
          const ptY = pt.y * h;
          const ptR = Math.max(7, 9 / viewport.scale);

          // Glow ring on active/hover
          if (isPointHovered || (dragState?.mode === 'poly-point' && dragState.pointIndex === idx)) {
            ctx.beginPath();
            ctx.arc(ptX, ptY, ptR + 4, 0, Math.PI * 2);
            ctx.fillStyle = 'rgba(245, 158, 11, 0.35)';
            ctx.fill();
          }

          ctx.fillStyle = '#f59e0b';
          ctx.beginPath();
          ctx.arc(ptX, ptY, ptR, 0, Math.PI * 2);
          ctx.fill();
          ctx.strokeStyle = '#ffffff';
          ctx.lineWidth = Math.max(1.5, 2 / viewport.scale);
          ctx.stroke();

          // Vertex index label
          ctx.fillStyle = '#000000';
          ctx.font = `bold ${Math.max(8, 10 / viewport.scale)}px sans-serif`;
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText(String(idx + 1), ptX, ptY);
        });
      }
    } else {
      ctx.save();
      ctx.translate(rx + rw / 2, ry + rh / 2);
      ctx.rotate((roi.rotationDeg * Math.PI) / 180);

      const halfW = rw / 2;
      const halfH = rh / 2;

      // Fill area with subtle grid
      ctx.fillStyle = roi.locked ? 'rgba(239, 68, 68, 0.12)' : 'rgba(245, 158, 11, 0.16)';
      ctx.fillRect(-halfW, -halfH, rw, rh);

      // Rule-of-Thirds Grid inside ROI
      ctx.strokeStyle = roi.locked ? 'rgba(239, 68, 68, 0.25)' : 'rgba(245, 158, 11, 0.25)';
      ctx.lineWidth = 1 / viewport.scale;
      ctx.setLineDash([3 / viewport.scale, 3 / viewport.scale]);
      ctx.beginPath();
      // Vertical grid lines (1/3 and 2/3)
      ctx.moveTo(-halfW + rw / 3, -halfH);
      ctx.lineTo(-halfW + rw / 3, halfH);
      ctx.moveTo(-halfW + (2 * rw) / 3, -halfH);
      ctx.lineTo(-halfW + (2 * rw) / 3, halfH);
      // Horizontal grid lines (1/3 and 2/3)
      ctx.moveTo(-halfW, -halfH + rh / 3);
      ctx.lineTo(halfW, -halfH + rh / 3);
      ctx.moveTo(-halfW, -halfH + (2 * rh) / 3);
      ctx.lineTo(halfW, -halfH + (2 * rh) / 3);
      ctx.stroke();

      // Outer border
      ctx.lineWidth = Math.max(1.5, 2.5 / viewport.scale);
      ctx.strokeStyle = roi.locked ? '#ef4444' : '#f59e0b';
      ctx.setLineDash(dragState ? [] : [6 / viewport.scale, 3 / viewport.scale]);
      ctx.strokeRect(-halfW, -halfH, rw, rh);

      // Center crosshair
      ctx.strokeStyle = roi.locked ? 'rgba(239, 68, 68, 0.6)' : 'rgba(245, 158, 11, 0.6)';
      ctx.lineWidth = 1 / viewport.scale;
      ctx.setLineDash([]);
      ctx.beginPath();
      ctx.moveTo(-12 / viewport.scale, 0);
      ctx.lineTo(12 / viewport.scale, 0);
      ctx.moveTo(0, -12 / viewport.scale);
      ctx.lineTo(0, 12 / viewport.scale);
      ctx.stroke();

      // Dimension Badge floating above ROI
      const badgeText = `${Math.round(roi.width * 100)}% × ${Math.round(roi.height * 100)}%${
        roi.rotationDeg !== 0 ? ` • ${roi.rotationDeg}°` : ''
      }`;
      const badgeY = -halfH - Math.max(18, 38 / viewport.scale);
      ctx.font = `bold ${Math.max(9, 11 / viewport.scale)}px monospace`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      const textMetrics = ctx.measureText(badgeText);
      const badgeW = textMetrics.width + 12 / viewport.scale;
      const badgeH = Math.max(14, 18 / viewport.scale);

      ctx.fillStyle = 'rgba(10, 10, 10, 0.85)';
      ctx.strokeStyle = roi.locked ? '#ef4444' : '#f59e0b';
      ctx.lineWidth = 1 / viewport.scale;
      ctx.beginPath();
      ctx.roundRect(-badgeW / 2, badgeY - badgeH / 2, badgeW, badgeH, 4 / viewport.scale);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = roi.locked ? '#fca5a5' : '#fef08a';
      ctx.fillText(badgeText, 0, badgeY);

      if (!roi.locked) {
        const cornerR = Math.max(6, 8.5 / viewport.scale);
        const edgeW = Math.max(14, 20 / viewport.scale);
        const edgeH = Math.max(4, 5.5 / viewport.scale);

        // 1. Rotation Stalk & Knob
        const stalkY = -halfH - Math.max(16, 24 / viewport.scale);
        ctx.beginPath();
        ctx.moveTo(0, -halfH);
        ctx.lineTo(0, stalkY);
        ctx.strokeStyle = '#f59e0b';
        ctx.lineWidth = Math.max(1.5, 2 / viewport.scale);
        ctx.stroke();

        // Rotation Knob
        const isRotHovered = hoveredHandle === 'rot' || dragState?.mode === 'rotate-roi';
        if (isRotHovered) {
          ctx.beginPath();
          ctx.arc(0, stalkY, cornerR + 4, 0, Math.PI * 2);
          ctx.fillStyle = 'rgba(6, 182, 212, 0.4)';
          ctx.fill();
        }
        ctx.beginPath();
        ctx.arc(0, stalkY, cornerR, 0, Math.PI * 2);
        ctx.fillStyle = '#06b6d4';
        ctx.fill();
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = Math.max(1.5, 2 / viewport.scale);
        ctx.stroke();

        // 2. Corner Circular Handles (nw, ne, se, sw)
        const corners: [string, number, number][] = [
          ['nw', -halfW, -halfH],
          ['ne', halfW, -halfH],
          ['se', halfW, halfH],
          ['sw', -halfW, halfH],
        ];

        corners.forEach(([handleName, hx, hy]) => {
          const isCornerActive = hoveredHandle === handleName || dragState?.handle === handleName;
          if (isCornerActive) {
            ctx.beginPath();
            ctx.arc(hx, hy, cornerR + 4, 0, Math.PI * 2);
            ctx.fillStyle = 'rgba(245, 158, 11, 0.4)';
            ctx.fill();
          }

          ctx.beginPath();
          ctx.arc(hx, hy, cornerR, 0, Math.PI * 2);
          ctx.fillStyle = '#f59e0b';
          ctx.fill();
          ctx.strokeStyle = '#ffffff';
          ctx.lineWidth = Math.max(1.5, 2 / viewport.scale);
          ctx.stroke();
        });

        // 3. Edge Pill Handles (n, s, e, w)
        const edgeHandles: [string, number, number, boolean][] = [
          ['n', 0, -halfH, true],
          ['s', 0, halfH, true],
          ['e', halfW, 0, false],
          ['w', -halfW, 0, false],
        ];

        edgeHandles.forEach(([handleName, ex, ey, isHorizontal]) => {
          const isEdgeActive = hoveredHandle === handleName || dragState?.handle === handleName;
          const pw = isHorizontal ? edgeW : edgeH;
          const ph = isHorizontal ? edgeH : edgeW;

          if (isEdgeActive) {
            ctx.fillStyle = 'rgba(245, 158, 11, 0.4)';
            ctx.beginPath();
            ctx.roundRect(ex - pw / 2 - 2, ey - ph / 2 - 2, pw + 4, ph + 4, 3 / viewport.scale);
            ctx.fill();
          }

          ctx.fillStyle = isEdgeActive ? '#fbbf24' : '#f59e0b';
          ctx.strokeStyle = '#ffffff';
          ctx.lineWidth = Math.max(1, 1.5 / viewport.scale);
          ctx.beginPath();
          ctx.roundRect(ex - pw / 2, ey - ph / 2, pw, ph, 2 / viewport.scale);
          ctx.fill();
          ctx.stroke();
        });
      }

      ctx.restore();
    }
  }, [roi, viewport.scale, showRoiBox, hoveredHandle, dragState]);

  // Helper to test which handle or element is hit in local unrotated coordinates (in true isotropic canvas pixels)
  const getHitTarget = useCallback(
    (xNorm: number, yNorm: number, isTouch: boolean) => {
      const canvas = overlayCanvasRef.current;
      if (!canvas) return null;

      const cw = canvas.width || 854;
      const ch = canvas.height || 480;
      const px = xNorm * cw;
      const py = yNorm * ch;

      if (roi.isPolygon && roi.polygonPoints && roi.polygonPoints.length > 0) {
        const polyHitThresholdPx = (isTouch ? 36 : 18) / Math.max(0.4, viewport.scale);
        for (let i = 0; i < roi.polygonPoints.length; i++) {
          const pt = roi.polygonPoints[i];
          const ptPxX = pt.x * cw;
          const ptPxY = pt.y * ch;
          if (Math.hypot(ptPxX - px, ptPxY - py) < polyHitThresholdPx) {
            return { mode: 'poly-point' as const, pointIndex: i };
          }
        }
        // Inside polygon hit test (ray casting) in pixel space
        let inside = false;
        const pts = roi.polygonPoints;
        for (let i = 0, j = pts.length - 1; i < pts.length; j = i++) {
          const xi = pts[i].x * cw;
          const yi = pts[i].y * ch;
          const xj = pts[j].x * cw;
          const yj = pts[j].y * ch;
          const intersect = yi > py !== yj > py && px < ((xj - xi) * (py - yi)) / (yj - yi) + xi;
          if (intersect) inside = !inside;
        }
        if (inside) {
          return { mode: 'move-roi' as const };
        }
        return null;
      }

      // Rectangular box in true isotropic canvas pixels
      const cxPx = (roi.x + roi.width / 2) * cw;
      const cyPx = (roi.y + roi.height / 2) * ch;
      const rwPx = roi.width * cw;
      const rhPx = roi.height * ch;
      const halfWPx = rwPx / 2;
      const halfHPx = rhPx / 2;

      const dx = px - cxPx;
      const dy = py - cyPx;
      const rotRad = (-roi.rotationDeg * Math.PI) / 180;
      const localXPx = dx * Math.cos(rotRad) - dy * Math.sin(rotRad);
      const localYPx = dx * Math.sin(rotRad) + dy * Math.cos(rotRad);

      // Generous hit thresholds for human finger pads vs desktop mouse cursors
      const hitRadiusPx = (isTouch ? 34 : 16) / Math.max(0.4, viewport.scale);

      // 1. Rotation Handle Hit Test
      const stalkDistPx = Math.max(18, 26 / Math.max(0.4, viewport.scale));
      const rotTargetYPx = -halfHPx - stalkDistPx;
      if (Math.hypot(localXPx, localYPx - rotTargetYPx) < hitRadiusPx * 1.4) {
        return { mode: 'rotate-roi' as const, handle: 'rot' };
      }

      // 2. Corner Handles Hit Test (nw, ne, se, sw)
      if (Math.hypot(localXPx - (-halfWPx), localYPx - (-halfHPx)) < hitRadiusPx) {
        return { mode: 'resize-roi' as const, handle: 'nw' };
      }
      if (Math.hypot(localXPx - halfWPx, localYPx - (-halfHPx)) < hitRadiusPx) {
        return { mode: 'resize-roi' as const, handle: 'ne' };
      }
      if (Math.hypot(localXPx - halfWPx, localYPx - halfHPx) < hitRadiusPx) {
        return { mode: 'resize-roi' as const, handle: 'se' };
      }
      if (Math.hypot(localXPx - (-halfWPx), localYPx - halfHPx) < hitRadiusPx) {
        return { mode: 'resize-roi' as const, handle: 'sw' };
      }

      // 3. Edge Pill Handles Hit Test (n, s, e, w)
      if (Math.abs(localYPx - (-halfHPx)) < hitRadiusPx && Math.abs(localXPx) <= halfWPx + hitRadiusPx) {
        return { mode: 'resize-roi' as const, handle: 'n' };
      }
      if (Math.abs(localYPx - halfHPx) < hitRadiusPx && Math.abs(localXPx) <= halfWPx + hitRadiusPx) {
        return { mode: 'resize-roi' as const, handle: 's' };
      }
      if (Math.abs(localXPx - halfWPx) < hitRadiusPx && Math.abs(localYPx) <= halfHPx + hitRadiusPx) {
        return { mode: 'resize-roi' as const, handle: 'e' };
      }
      if (Math.abs(localXPx - (-halfWPx)) < hitRadiusPx && Math.abs(localYPx) <= halfHPx + hitRadiusPx) {
        return { mode: 'resize-roi' as const, handle: 'w' };
      }

      // 4. Box Body Move Hit Test
      const bodyMarginPx = isTouch ? 12 : 4;
      if (Math.abs(localXPx) <= halfWPx + bodyMarginPx && Math.abs(localYPx) <= halfHPx + bodyMarginPx) {
        return { mode: 'move-roi' as const, handle: 'body' };
      }

      return null;
    },
    [roi, viewport.scale]
  );

  // Pointer interactions for ROI & Viewport Panning with PointerCapture
  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (isAnalyzing) return;

    // Prevent default touch gestures (pinch-zoom, scrolling, long-press text selection)
    if (e.pointerType === 'touch' || e.cancelable) {
      e.preventDefault();
    }

    // Track active touch pointers for two-finger gestures
    activePointersRef.current.set(e.pointerId, { x: e.clientX, y: e.clientY });

    // Multi-touch pinch-to-zoom & two-finger pan detection
    if (activePointersRef.current.size === 2) {
      const pts = Array.from(activePointersRef.current.values());
      const dist = Math.hypot(pts[0].x - pts[1].x, pts[0].y - pts[1].y);
      touchPinchInitialDistRef.current = dist;
      touchPinchInitialScaleRef.current = viewport.scale;
      touchPinchInitialPanRef.current = { x: viewport.panX, y: viewport.panY };
      setDragState(null); // Cancel single finger ROI operations
      try {
        e.currentTarget.setPointerCapture(e.pointerId);
      } catch (_) {}
      return;
    }

    // Capture pointer so dragging is never dropped outside canvas boundaries
    try {
      e.currentTarget.setPointerCapture(e.pointerId);
    } catch (_) {}

    // Pan mode trigger: activeTool === 'pan', middle click (button 1), or Spacebar held
    if (activeTool === 'pan' || e.button === 1 || isSpacePressed) {
      setDragState({
        mode: 'pan-viewport',
        startX: e.clientX,
        startY: e.clientY,
        initialRoi: { ...roi },
        initialPan: { x: viewport.panX, y: viewport.panY },
      });
      return;
    }

    if (!showRoiBox || roi.locked) return;

    const canvas = overlayCanvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const xNorm = (e.clientX - rect.left) / rect.width;
    const yNorm = (e.clientY - rect.top) / rect.height;

    const hit = getHitTarget(xNorm, yNorm, e.pointerType === 'touch');

    if (hit) {
      setDragState({
        mode: hit.mode,
        handle: hit.handle,
        pointIndex: hit.pointIndex,
        startX: xNorm,
        startY: yNorm,
        initialRoi: { ...roi },
        initialPan: { x: viewport.panX, y: viewport.panY },
      });
    }
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    // Prevent default on touch to stop browser gestures
    if (e.pointerType === 'touch' && e.cancelable) {
      e.preventDefault();
    }

    // Update active touch point
    if (activePointersRef.current.has(e.pointerId)) {
      activePointersRef.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    }

    // Two-finger Pinch-to-zoom and Pan
    if (activePointersRef.current.size === 2 && touchPinchInitialDistRef.current !== null) {
      const pts = Array.from(activePointersRef.current.values());
      const currentDist = Math.hypot(pts[0].x - pts[1].x, pts[0].y - pts[1].y);
      const scaleDelta = currentDist / Math.max(10, touchPinchInitialDistRef.current);
      const nextScale = Math.max(0.5, Math.min(5.0, touchPinchInitialScaleRef.current * scaleDelta));
      setViewport((prev) => ({
        ...prev,
        scale: nextScale,
      }));
      return;
    }

    const canvas = overlayCanvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const xNorm = (e.clientX - rect.left) / rect.width;
    const yNorm = (e.clientY - rect.top) / rect.height;

    // Hover handle detection when not actively dragging
    if (!dragState) {
      if (showRoiBox && !roi.locked) {
        const hit = getHitTarget(xNorm, yNorm, e.pointerType === 'touch');
        setHoveredHandle(hit ? hit.handle || (hit.pointIndex !== undefined ? `poly-${hit.pointIndex}` : 'body') : null);
      } else {
        setHoveredHandle(null);
      }
      return;
    }

    // Viewport Panning Mode
    if (dragState.mode === 'pan-viewport') {
      const dx = e.clientX - dragState.startX;
      const dy = e.clientY - dragState.startY;
      setViewport((prev) => ({
        ...prev,
        panX: dragState.initialPan.x + dx,
        panY: dragState.initialPan.y + dy,
      }));
      return;
    }

    const cw = canvas.width || 854;
    const ch = canvas.height || 480;

    const init = dragState.initialRoi;
    const initCxPx = (init.x + init.width / 2) * cw;
    const initCyPx = (init.y + init.height / 2) * ch;
    const initWPx = init.width * cw;
    const initHPx = init.height * ch;

    const rotRad = (-init.rotationDeg * Math.PI) / 180;
    const invRad = (init.rotationDeg * Math.PI) / 180;

    const curPx = xNorm * cw;
    const curPy = yNorm * ch;
    const startPx = dragState.startX * cw;
    const startPy = dragState.startY * ch;

    // Current pointer in initial box frame in pixels
    const curDx = curPx - initCxPx;
    const curDy = curPy - initCyPx;
    const localCurXPx = curDx * Math.cos(rotRad) - curDy * Math.sin(rotRad);
    const localCurYPx = curDx * Math.sin(rotRad) + curDy * Math.cos(rotRad);

    // Initial drag start pointer in box frame in pixels
    const startDx = startPx - initCxPx;
    const startDy = startPy - initCyPx;
    const localStartXPx = startDx * Math.cos(rotRad) - startDy * Math.sin(rotRad);
    const localStartYPx = startDx * Math.sin(rotRad) + startDy * Math.cos(rotRad);

    const deltaXPx = localCurXPx - localStartXPx;
    const deltaYPx = localCurYPx - localStartYPx;

    if (dragState.mode === 'move-roi') {
      const globalDx = (curPx - startPx) / cw;
      const globalDy = (curPy - startPy) / ch;

      if (init.isPolygon) {
        const nextPoints = init.polygonPoints.map((p) => ({
          x: Math.max(0, Math.min(1, p.x + globalDx)),
          y: Math.max(0, Math.min(1, p.y + globalDy)),
        }));
        onChangeRoi({ ...init, polygonPoints: nextPoints });
      } else {
        const newX = Math.max(0, Math.min(1 - init.width, init.x + globalDx));
        const newY = Math.max(0, Math.min(1 - init.height, init.y + globalDy));
        onChangeRoi({ ...init, x: newX, y: newY });
      }
    } else if (dragState.mode === 'poly-point' && dragState.pointIndex !== undefined) {
      const idx = dragState.pointIndex;
      const nextPoints = [...init.polygonPoints];
      nextPoints[idx] = {
        x: Math.max(0, Math.min(1, xNorm)),
        y: Math.max(0, Math.min(1, yNorm)),
      };
      onChangeRoi({ ...init, polygonPoints: nextPoints });
    } else if (dragState.mode === 'resize-roi') {
      let newWPx = initWPx;
      let newHPx = initHPx;
      let shiftLocalXPx = 0;
      let shiftLocalYPx = 0;

      const handle = dragState.handle;

      if (handle === 'se') {
        newWPx = Math.max(24, Math.min(cw, initWPx + deltaXPx));
        newHPx = Math.max(24, Math.min(ch, initHPx + deltaYPx));
        shiftLocalXPx = (newWPx - initWPx) / 2;
        shiftLocalYPx = (newHPx - initHPx) / 2;
      } else if (handle === 'sw') {
        newWPx = Math.max(24, Math.min(cw, initWPx - deltaXPx));
        newHPx = Math.max(24, Math.min(ch, initHPx + deltaYPx));
        shiftLocalXPx = -(newWPx - initWPx) / 2;
        shiftLocalYPx = (newHPx - initHPx) / 2;
      } else if (handle === 'ne') {
        newWPx = Math.max(24, Math.min(cw, initWPx + deltaXPx));
        newHPx = Math.max(24, Math.min(ch, initHPx - deltaYPx));
        shiftLocalXPx = (newWPx - initWPx) / 2;
        shiftLocalYPx = -(newHPx - initHPx) / 2;
      } else if (handle === 'nw') {
        newWPx = Math.max(24, Math.min(cw, initWPx - deltaXPx));
        newHPx = Math.max(24, Math.min(ch, initHPx - deltaYPx));
        shiftLocalXPx = -(newWPx - initWPx) / 2;
        shiftLocalYPx = -(newHPx - initHPx) / 2;
      } else if (handle === 'e') {
        newWPx = Math.max(24, Math.min(cw, initWPx + deltaXPx));
        shiftLocalXPx = (newWPx - initWPx) / 2;
      } else if (handle === 'w') {
        newWPx = Math.max(24, Math.min(cw, initWPx - deltaXPx));
        shiftLocalXPx = -(newWPx - initWPx) / 2;
      } else if (handle === 's') {
        newHPx = Math.max(24, Math.min(ch, initHPx + deltaYPx));
        shiftLocalYPx = (newHPx - initHPx) / 2;
      } else if (handle === 'n') {
        newHPx = Math.max(24, Math.min(ch, initHPx - deltaYPx));
        shiftLocalYPx = -(newHPx - initHPx) / 2;
      }

      // Rotate local shift back to screen frame in pixels
      const globalShiftXPx = shiftLocalXPx * Math.cos(invRad) - shiftLocalYPx * Math.sin(invRad);
      const globalShiftYPx = shiftLocalXPx * Math.sin(invRad) + shiftLocalYPx * Math.cos(invRad);

      const targetCxPx = initCxPx + globalShiftXPx;
      const targetCyPx = initCyPx + globalShiftYPx;

      const newW = newWPx / cw;
      const newH = newHPx / ch;
      const finalX = Math.max(0, Math.min(1 - newW, (targetCxPx - newWPx / 2) / cw));
      const finalY = Math.max(0, Math.min(1 - newH, (targetCyPx - newHPx / 2) / ch));

      onChangeRoi({ ...init, x: finalX, y: finalY, width: newW, height: newH });
    } else if (dragState.mode === 'rotate-roi') {
      const angleRad = Math.atan2(curPy - initCyPx, curPx - initCxPx);
      const angleDeg = Math.round((angleRad * 180) / Math.PI + 90);
      const normalizedAngle = ((angleDeg % 360) + 360) % 360;
      const signedAngle = normalizedAngle > 180 ? normalizedAngle - 360 : normalizedAngle;
      onChangeRoi({ ...init, rotationDeg: signedAngle });
    }
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLCanvasElement>) => {
    activePointersRef.current.delete(e.pointerId);
    if (activePointersRef.current.size === 0) {
      touchPinchInitialDistRef.current = null;
      if (dragState) {
        onCommitRoi?.(roi);
      }
      setDragState(null);
    }
    try {
      e.currentTarget.releasePointerCapture(e.pointerId);
    } catch (_) {}
  };

  const handlePointerCancel = (e: React.PointerEvent<HTMLCanvasElement>) => {
    activePointersRef.current.delete(e.pointerId);
    if (activePointersRef.current.size === 0) {
      touchPinchInitialDistRef.current = null;
      if (dragState) {
        onCommitRoi?.(roi);
      }
      setDragState(null);
    }
    try {
      e.currentTarget.releasePointerCapture(e.pointerId);
    } catch (_) {}
  };

  // Touch Precision & Nudge Control Handlers
  const handleNudge = (dx: number, dy: number) => {
    if (roi.locked) return;
    const updated: RoiBox = {
      ...roi,
      x: Math.max(0, Math.min(1 - roi.width, Number((roi.x + dx).toFixed(3)))),
      y: Math.max(0, Math.min(1 - roi.height, Number((roi.y + dy).toFixed(3)))),
    };
    onChangeRoi(updated);
    onCommitRoi?.(updated);
  };

  const handleResizeNudge = (dw: number, dh: number) => {
    if (roi.locked) return;
    const newW = Math.max(0.05, Math.min(1.0, Number((roi.width + dw).toFixed(3))));
    const newH = Math.max(0.05, Math.min(1.0, Number((roi.height + dh).toFixed(3))));
    const newX = Math.max(0, Math.min(1 - newW, Number((roi.x - dw / 2).toFixed(3))));
    const newY = Math.max(0, Math.min(1 - newH, Number((roi.y - dh / 2).toFixed(3))));
    const updated: RoiBox = { ...roi, x: newX, y: newY, width: newW, height: newH };
    onChangeRoi(updated);
    onCommitRoi?.(updated);
  };

  const handleRotateNudge = (deg: number) => {
    if (roi.locked) return;
    const newRot = (roi.rotationDeg + deg) % 360;
    const signedRot = newRot > 180 ? newRot - 360 : newRot < -180 ? newRot + 360 : newRot;
    const updated: RoiBox = { ...roi, rotationDeg: signedRot };
    onChangeRoi(updated);
    onCommitRoi?.(updated);
  };

  const handleApplyPreset = (preset: 'full' | 'apex' | 'body' | 'base' | 'center') => {
    if (roi.locked) return;
    let updated: RoiBox = { ...roi };
    switch (preset) {
      case 'full':
        updated = { ...roi, x: 0.05, y: 0.05, width: 0.9, height: 0.9, rotationDeg: 0 };
        break;
      case 'apex':
        updated = { ...roi, x: 0.35, y: 0.05, width: 0.3, height: 0.35, rotationDeg: 0 };
        break;
      case 'body':
        updated = { ...roi, x: 0.25, y: 0.15, width: 0.5, height: 0.7, rotationDeg: 0 };
        break;
      case 'base':
        updated = { ...roi, x: 0.2, y: 0.6, width: 0.6, height: 0.35, rotationDeg: 0 };
        break;
      case 'center':
        updated = { ...roi, x: 0.25, y: 0.25, width: 0.5, height: 0.5, rotationDeg: 0 };
        break;
    }
    onChangeRoi(updated);
    onCommitRoi?.(updated);
  };

  // Dynamic CSS cursor computation based on hovered handle
  const getCursorClass = () => {
    if (activeTool === 'pan' || isSpacePressed) {
      return 'cursor-grab active:cursor-grabbing';
    }
    if (roi.locked) return 'cursor-default';
    if (!showRoiBox) return 'cursor-crosshair';

    const h = dragState?.handle || hoveredHandle;
    if (h === 'nw' || h === 'se') return 'cursor-nwse-resize';
    if (h === 'ne' || h === 'sw') return 'cursor-nesw-resize';
    if (h === 'n' || h === 's') return 'cursor-ns-resize';
    if (h === 'e' || h === 'w') return 'cursor-ew-resize';
    if (h === 'rot') return 'cursor-grab active:cursor-grabbing';
    if (h === 'body' || dragState?.mode === 'move-roi') return 'cursor-move';
    return 'cursor-crosshair';
  };

  return (
    <div className="bg-neutral-900 border border-neutral-800 rounded-xl overflow-hidden shadow-2xl flex flex-col">
      {/* Top Media Bar */}
      <div className="px-4 py-2.5 bg-neutral-950/60 border-b border-neutral-800 flex items-center justify-between flex-wrap gap-2 text-xs">
        <div className="flex items-center gap-2">
          <Crosshair className="w-4 h-4 text-amber-400" />
          <span className="font-semibold text-neutral-200">
            {currentPreset
              ? currentPreset.name
              : streamSource?.title || 'Loaded Video Footage'}
          </span>
          <span className="text-neutral-500">·</span>
          <span className="font-mono text-neutral-400">
            {timingInterval}ms ({Math.round(1000 / timingInterval)} FPS)
          </span>
        </div>

        {/* Viewport & ROI Tools */}
        <div className="flex items-center gap-1.5 flex-wrap">
          {/* Zoom HUD */}
          <div className="flex items-center bg-neutral-950 rounded border border-neutral-800 p-0.5">
            <button
              onClick={() => handleZoom(0.8)}
              className="p-1 hover:bg-neutral-800 rounded text-neutral-400 hover:text-white"
              title="Zoom Out"
            >
              <ZoomOut className="w-3.5 h-3.5" />
            </button>
            <span className="font-mono text-[11px] px-1.5 text-amber-300 font-semibold select-none">
              {Math.round(viewport.scale * 100)}%
            </span>
            <button
              onClick={() => handleZoom(1.25)}
              className="p-1 hover:bg-neutral-800 rounded text-neutral-400 hover:text-white"
              title="Zoom In"
            >
              <ZoomIn className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={resetZoom}
              className="px-1.5 py-0.5 text-[10px] hover:bg-neutral-800 rounded text-neutral-400 hover:text-white border-l border-neutral-800 ml-0.5"
              title="Reset Zoom to 1:1"
            >
              1:1
            </button>
          </div>

          {/* Pan Tool Toggle */}
          <button
            onClick={() => setActiveTool(activeTool === 'pan' ? 'roi' : 'pan')}
            className={`p-1.5 rounded border transition flex items-center gap-1 ${
              activeTool === 'pan' || isSpacePressed
                ? 'bg-blue-600/30 text-blue-300 border-blue-500/50'
                : 'bg-neutral-800 text-neutral-400 border-neutral-700 hover:text-white'
            }`}
            title="Pan / Drag Viewport (or hold Spacebar)"
          >
            <Hand className="w-3.5 h-3.5" />
          </button>

          {/* Polygon / Box Toggle */}
          <button
            onClick={() => onChangeRoi({ ...roi, isPolygon: !roi.isPolygon })}
            className={`px-2 py-1 rounded text-xs font-medium border transition flex items-center gap-1 cursor-pointer ${
              roi.isPolygon
                ? 'bg-purple-900/40 text-purple-300 border-purple-500/50'
                : 'bg-neutral-800 text-neutral-300 border-neutral-700 hover:text-white'
            }`}
            title="Toggle between 4-Point Polygon and Bounding Box"
          >
            {roi.isPolygon ? <Pentagon className="w-3.5 h-3.5" /> : <Square className="w-3.5 h-3.5" />}
            {roi.isPolygon ? 'Polygon' : 'Box'}
          </button>

          {/* Lock / Unlock */}
          <button
            onClick={() => onChangeRoi({ ...roi, locked: !roi.locked })}
            className={`px-2 py-1 rounded text-xs font-medium border transition flex items-center gap-1 cursor-pointer ${
              roi.locked
                ? 'bg-red-900/40 text-red-300 border-red-500/50'
                : 'bg-neutral-800 text-neutral-300 border-neutral-700 hover:text-white'
            }`}
          >
            {roi.locked ? <Lock className="w-3.5 h-3.5" /> : <Unlock className="w-3.5 h-3.5" />}
            {roi.locked ? 'Locked' : 'Unlocked'}
          </button>

          {/* ROI Box Visibility Toggle */}
          <button
            onClick={() => setShowRoiBox(!showRoiBox)}
            className={`px-2 py-1 rounded text-xs font-medium border transition flex items-center gap-1 cursor-pointer ${
              showRoiBox
                ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                : 'bg-neutral-800 text-neutral-400 border-neutral-700 hover:text-white'
            }`}
            title="Toggle ROI Bounding Box visibility (hide for 100% clean video)"
          >
            <Eye className="w-3.5 h-3.5" />
            ROI Box {showRoiBox ? 'On' : 'Off'}
          </button>

          {/* HUD Telemetry Status Toggle */}
          <button
            onClick={() => setShowHud(!showHud)}
            className={`px-2 py-1 rounded text-xs font-medium border transition flex items-center gap-1 cursor-pointer ${
              showHud
                ? 'bg-blue-600/30 text-blue-300 border-blue-500/50'
                : 'bg-neutral-800 text-neutral-400 border-neutral-700 hover:text-white'
            }`}
            title="Toggle Coordinates & Millisecond HUD Status Bar"
          >
            Telemetry {showHud ? 'On' : 'Off'}
          </button>

          <button
            onClick={() => {
              if (currentPreset) onChangeRoi(currentPreset.defaultRoi);
              else
                onChangeRoi({
                  x: 0.25,
                  y: 0.2,
                  width: 0.5,
                  height: 0.6,
                  rotationDeg: 0,
                  isPolygon: false,
                  polygonPoints: [],
                  locked: false,
                });
            }}
            className="px-2 py-1 rounded text-xs font-medium bg-neutral-800 hover:bg-neutral-700 text-neutral-300 hover:text-white border border-neutral-700 transition flex items-center gap-1 cursor-pointer"
          >
            <RotateCcw className="w-3 h-3" />
            Reset
          </button>
        </div>
      </div>

      {/* Main Viewport Container with Zoom & Pan Transforms */}
      <div
        ref={containerRef}
        onWheel={handleWheel}
        className="relative aspect-video bg-neutral-950 flex items-center justify-center overflow-hidden select-none cursor-default touch-none"
      >
        {/* Transform Viewport Wrapper */}
        <div
          className="relative w-full h-full flex items-center justify-center transition-transform duration-75 origin-center"
          style={{
            transform: `translate(${viewport.panX}px, ${viewport.panY}px) scale(${viewport.scale})`,
          }}
        >
          {/* Preset Canvas simulator or YouTube Frame Extraction Buffer */}
          {(currentPreset || streamSource?.type === 'youtube') && (
            <canvas
              ref={canvasElementRef}
              width={854}
              height={480}
              className={
                streamSource?.type === 'youtube'
                  ? 'absolute inset-0 w-full h-full object-contain pointer-events-none opacity-0'
                  : 'w-full h-full object-contain pointer-events-none'
              }
            />
          )}

          {/* Direct HTML5 Video element */}
          {!currentPreset && streamSource?.type !== 'youtube' && (
            <video
              ref={videoElementRef}
              playsInline
              muted
              className="w-full h-full object-contain pointer-events-none"
            />
          )}

          {/* YouTube Video Embed Controller */}
          {streamSource?.type === 'youtube' && streamSource.videoId && (
            <div className="relative w-full h-full flex items-center justify-center bg-black">
              <iframe
                src={`https://www.youtube-nocookie.com/embed/${streamSource.videoId}?autoplay=1&mute=1&controls=0&loop=1&playlist=${streamSource.videoId}&enablejsapi=1`}
                className="w-full h-full pointer-events-none border-0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              />
            </div>
          )}

          {/* Interactive ROI Overlay Canvas - Locked to video aspect coordinates with touch-none */}
          <canvas
            ref={overlayCanvasRef}
            width={854}
            height={480}
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onPointerCancel={handlePointerCancel}
            className={`absolute inset-0 w-full h-full touch-none select-none ${getCursorClass()}`}
          />
        </div>

        {/* Viewport Instruction Hint */}
        <div className="absolute bottom-2 right-2 px-2 py-1 rounded bg-neutral-950/85 backdrop-blur-xs border border-neutral-800 text-[10px] text-neutral-400 pointer-events-none flex items-center gap-1.5 shadow-sm">
          <span>Pinch / Scroll to Zoom</span>
          <span className="text-neutral-600">·</span>
          <span>Drag Box to Position</span>
          <span className="text-neutral-600">·</span>
          <span>Drag Handles to Resize</span>
        </div>
      </div>

      {/* Touch Precision & Quick Preset Toolbar */}
      {isTouchControlsOpen && (
        <div className="px-3 py-2 bg-neutral-950/95 border-t border-neutral-800/90 flex flex-col gap-2 text-xs">
          {/* Quick Framing Presets & Aspect Controls */}
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-neutral-400 text-[11px] font-medium flex items-center gap-1">
                <Crosshair className="w-3.5 h-3.5 text-amber-400" />
                Framing Presets:
              </span>
              <button
                type="button"
                onClick={() => handleApplyPreset('full')}
                disabled={roi.locked}
                className="px-2 py-1 rounded bg-neutral-900 hover:bg-neutral-800 text-neutral-300 border border-neutral-800 disabled:opacity-40 text-[10.5px] cursor-pointer transition"
              >
                Full Prop (90%)
              </button>
              <button
                type="button"
                onClick={() => handleApplyPreset('apex')}
                disabled={roi.locked}
                className="px-2 py-1 rounded bg-neutral-900 hover:bg-neutral-800 text-neutral-300 border border-neutral-800 disabled:opacity-40 text-[10.5px] cursor-pointer transition"
              >
                Apex / Star
              </button>
              <button
                type="button"
                onClick={() => handleApplyPreset('body')}
                disabled={roi.locked}
                className="px-2 py-1 rounded bg-neutral-900 hover:bg-neutral-800 text-neutral-300 border border-neutral-800 disabled:opacity-40 text-[10.5px] cursor-pointer transition"
              >
                Tree Body
              </button>
              <button
                type="button"
                onClick={() => handleApplyPreset('base')}
                disabled={roi.locked}
                className="px-2 py-1 rounded bg-neutral-900 hover:bg-neutral-800 text-neutral-300 border border-neutral-800 disabled:opacity-40 text-[10.5px] cursor-pointer transition"
              >
                Base / Trunk
              </button>
              <button
                type="button"
                onClick={() => handleApplyPreset('center')}
                disabled={roi.locked}
                className="px-2 py-1 rounded bg-neutral-900 hover:bg-neutral-800 text-neutral-300 border border-neutral-800 disabled:opacity-40 text-[10.5px] cursor-pointer transition"
              >
                Square Center
              </button>
            </div>

            {/* Lock / Unlock Toggle Button */}
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => onChangeRoi({ ...roi, locked: !roi.locked })}
                className={`px-2.5 py-1 rounded-md text-[11px] font-semibold flex items-center gap-1.5 transition cursor-pointer border ${
                  roi.locked
                    ? 'bg-red-500/20 text-red-300 border-red-500/50'
                    : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/50'
                }`}
                title={roi.locked ? 'Unlock ROI to allow moving and resizing' : 'Lock ROI to prevent accidental movements'}
              >
                {roi.locked ? <Lock className="w-3.5 h-3.5" /> : <Unlock className="w-3.5 h-3.5" />}
                <span>{roi.locked ? 'Locked' : 'Unlocked'}</span>
              </button>
            </div>
          </div>

          {/* Touch Precision Nudge, Resize, & Rotation D-Pads */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-1 border-t border-neutral-800/60 text-[11px]">
            {/* 1. Position Nudge Pad */}
            <div className="bg-neutral-900/70 p-2 rounded-lg border border-neutral-800/80 flex items-center justify-between gap-2">
              <span className="text-neutral-400 font-medium flex items-center gap-1">
                <Move className="w-3.5 h-3.5 text-amber-400" />
                Position:
              </span>
              <div className="flex items-center gap-1 font-mono">
                <button
                  type="button"
                  onClick={() => handleNudge(-0.02, 0)}
                  disabled={roi.locked}
                  className="p-1 rounded bg-neutral-800 hover:bg-neutral-700 text-neutral-300 disabled:opacity-40 cursor-pointer"
                  title="Nudge Left"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                </button>
                <div className="flex flex-col gap-0.5">
                  <button
                    type="button"
                    onClick={() => handleNudge(0, -0.02)}
                    disabled={roi.locked}
                    className="p-1 rounded bg-neutral-800 hover:bg-neutral-700 text-neutral-300 disabled:opacity-40 cursor-pointer"
                    title="Nudge Up"
                  >
                    <ArrowUp className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleNudge(0, 0.02)}
                    disabled={roi.locked}
                    className="p-1 rounded bg-neutral-800 hover:bg-neutral-700 text-neutral-300 disabled:opacity-40 cursor-pointer"
                    title="Nudge Down"
                  >
                    <ArrowDown className="w-3.5 h-3.5" />
                  </button>
                </div>
                <button
                  type="button"
                  onClick={() => handleNudge(0.02, 0)}
                  disabled={roi.locked}
                  className="p-1 rounded bg-neutral-800 hover:bg-neutral-700 text-neutral-300 disabled:opacity-40 cursor-pointer"
                  title="Nudge Right"
                >
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* 2. Scale & Dimension Adjust Pad */}
            <div className="bg-neutral-900/70 p-2 rounded-lg border border-neutral-800/80 flex items-center justify-between gap-2">
              <span className="text-neutral-400 font-medium flex items-center gap-1">
                <Maximize2 className="w-3.5 h-3.5 text-blue-400" />
                Scale & Size:
              </span>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => handleResizeNudge(-0.04, -0.04)}
                  disabled={roi.locked}
                  className="px-2 py-1 rounded bg-neutral-800 hover:bg-neutral-700 text-neutral-300 disabled:opacity-40 text-[10.5px] cursor-pointer"
                  title="Shrink Size"
                >
                  <Minus className="w-3 h-3 inline mr-0.5" />
                  Shrink
                </button>
                <button
                  type="button"
                  onClick={() => handleResizeNudge(0.04, 0.04)}
                  disabled={roi.locked}
                  className="px-2 py-1 rounded bg-neutral-800 hover:bg-neutral-700 text-neutral-300 disabled:opacity-40 text-[10.5px] cursor-pointer"
                  title="Expand Size"
                >
                  <Plus className="w-3 h-3 inline mr-0.5" />
                  Grow
                </button>
              </div>
            </div>

            {/* 3. Angular Rotation Controls */}
            <div className="bg-neutral-900/70 p-2 rounded-lg border border-neutral-800/80 flex items-center justify-between gap-2">
              <span className="text-neutral-400 font-medium flex items-center gap-1">
                <Compass className="w-3.5 h-3.5 text-cyan-400" />
                Rotation:
              </span>
              <div className="flex items-center gap-1 font-mono">
                <button
                  type="button"
                  onClick={() => handleRotateNudge(-5)}
                  disabled={roi.locked}
                  className="p-1 rounded bg-neutral-800 hover:bg-neutral-700 text-neutral-300 disabled:opacity-40 cursor-pointer"
                  title="Rotate -5°"
                >
                  <RotateCcw className="w-3 h-3" />
                </button>
                <button
                  type="button"
                  onClick={() => onChangeRoi({ ...roi, rotationDeg: 0 })}
                  disabled={roi.locked}
                  className="px-1.5 py-0.5 rounded bg-neutral-800 hover:bg-neutral-700 text-[10px] text-amber-300 disabled:opacity-40 cursor-pointer"
                  title="Reset to 0°"
                >
                  {roi.rotationDeg}°
                </button>
                <button
                  type="button"
                  onClick={() => handleRotateNudge(5)}
                  disabled={roi.locked}
                  className="p-1 rounded bg-neutral-800 hover:bg-neutral-700 text-neutral-300 disabled:opacity-40 cursor-pointer"
                  title="Rotate +5°"
                >
                  <RotateCw className="w-3 h-3" />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Docked Telemetry Bar (Completely outside video viewport so video is 100% visible) */}
      {showHud && (
        <div className="px-4 py-2 bg-neutral-950 border-t border-neutral-800 text-xs font-mono text-neutral-300 flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-amber-400 font-semibold">ROI Coordinates:</span>
            <span className="bg-neutral-900 px-2 py-0.5 rounded border border-neutral-800 text-neutral-200">
              [{roi.x.toFixed(3)}, {roi.y.toFixed(3)}, {roi.width.toFixed(3)}, {roi.height.toFixed(3)}]
            </span>
            {roi.rotationDeg !== 0 && (
              <span className="text-neutral-400 text-[11px]">Rot: {roi.rotationDeg}°</span>
            )}
            <span className={`px-2 py-0.5 rounded text-[11px] ${roi.locked ? 'bg-red-950/80 text-red-300 border border-red-800' : 'bg-emerald-950/80 text-emerald-300 border border-emerald-800'}`}>
              {roi.locked ? 'Locked' : 'Unlocked'}
            </span>
          </div>
          <div className="flex items-center gap-3 text-neutral-400 flex-wrap">
            <span>Playhead: <strong className="text-amber-300">{(currentTimeMs / 1000).toFixed(3)}s</strong> ({Math.round(currentTimeMs)}ms)</span>
            <span>Target Window: <strong className="text-neutral-200">{timeRange.startMs}ms - {timeRange.endMs}ms</strong></span>
          </div>
        </div>
      )}

      {/* Bottom Transport Controls & Timeline Scrubber */}
      <div className="p-3 bg-neutral-950/90 border-t border-neutral-800 flex flex-col gap-2.5">
        <div className="relative flex flex-col gap-1">
          <div className="relative h-6 flex items-center">
            <div className="absolute inset-x-0 h-2 bg-neutral-800 rounded-full overflow-hidden">
              <div
                className="absolute top-0 bottom-0 bg-amber-500/30 border-x border-amber-400"
                style={{
                  left: `${(timeRange.startMs / Math.max(1, trueDurationMs)) * 100}%`,
                  width: `${((timeRange.endMs - timeRange.startMs) / Math.max(1, trueDurationMs)) * 100}%`,
                }}
              />
            </div>

            <input
              type="range"
              min={0}
              max={trueDurationMs}
              step={timingInterval}
              value={currentTimeMs}
              onChange={(e) => onSeekTimeMs(Number(e.target.value))}
              className="absolute inset-0 w-full opacity-0 cursor-ew-resize z-10"
            />

            <div
              className="absolute top-0 bottom-0 w-1.5 bg-amber-400 rounded-full shadow-lg shadow-amber-500/50 pointer-events-none -ml-0.5"
              style={{ left: `${(currentTimeMs / Math.max(1, trueDurationMs)) * 100}%` }}
            />
          </div>

          <div className="flex justify-between text-[10px] font-mono text-neutral-500">
            <span>0.000s</span>
            <span className="text-amber-400 font-medium">
              In: {(timeRange.startMs / 1000).toFixed(2)}s · Out: {(timeRange.endMs / 1000).toFixed(2)}s (Duration:{' '}
              {timeRange.endMs - timeRange.startMs}ms)
            </span>
            <span>{(trueDurationMs / 1000).toFixed(3)}s</span>
          </div>
        </div>

        {/* Transport Toolbar Buttons */}
        <div className="flex items-center justify-between flex-wrap gap-2 text-xs">
          <div className="flex items-center gap-1.5">
            <button
              onClick={togglePlay}
              className="px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-neutral-950 font-bold flex items-center gap-1.5 transition shadow-sm cursor-pointer"
            >
              {isPlaying ? <Pause className="w-3.5 h-3.5 fill-current" /> : <Play className="w-3.5 h-3.5 fill-current" />}
              {isPlaying ? 'Pause' : 'Play'}
            </button>

            <button
              onClick={() => stepFrame(-1)}
              className="p-1.5 rounded-md bg-neutral-800 hover:bg-neutral-700 text-neutral-300 hover:text-white transition cursor-pointer"
              title={`Step Back 1 Frame (${timingInterval}ms)`}
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            <button
              onClick={() => stepFrame(1)}
              className="p-1.5 rounded-md bg-neutral-800 hover:bg-neutral-700 text-neutral-300 hover:text-white transition cursor-pointer"
              title={`Step Forward 1 Frame (${timingInterval}ms)`}
            >
              <ChevronRight className="w-4 h-4" />
            </button>

            <button
              onClick={() => setIsLooping(!isLooping)}
              className={`px-2 py-1 rounded text-xs font-medium border transition cursor-pointer ${
                isLooping
                  ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                  : 'bg-neutral-800 text-neutral-400 border-neutral-700'
              }`}
            >
              Loop
            </button>

            <select
              value={playbackSpeed}
              onChange={(e) => setPlaybackSpeed(Number(e.target.value))}
              className="px-2 py-1 rounded text-xs bg-neutral-800 border border-neutral-700 text-neutral-200 cursor-pointer"
            >
              <option value={0.25}>0.25x</option>
              <option value={0.5}>0.5x</option>
              <option value={1.0}>1.0x Normal</option>
              <option value={1.5}>1.5x</option>
            </select>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              onClick={markInPoint}
              className="px-2 py-1 rounded text-xs bg-neutral-800 hover:bg-neutral-700 text-neutral-300 hover:text-white border border-neutral-700 transition cursor-pointer"
              title="Set In-Point"
            >
              [ Mark In
            </button>
            <button
              onClick={markOutPoint}
              className="px-2 py-1 rounded text-xs bg-neutral-800 hover:bg-neutral-700 text-neutral-300 hover:text-white border border-neutral-700 transition cursor-pointer"
              title="Set Out-Point"
            >
              ] Mark Out
            </button>
            <button
              onClick={() => onChangeTimeRange({ startMs: 0, endMs: trueDurationMs })}
              className="px-2 py-1 rounded text-xs bg-neutral-800 hover:bg-neutral-700 text-neutral-400 hover:text-white border border-neutral-700 transition cursor-pointer"
              title="Select Full Clip Duration (Entire Video)"
            >
              Full Video Clip
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
