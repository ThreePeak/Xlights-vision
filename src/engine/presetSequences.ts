import { PropGeometry, PropModelType, RoiBox } from '../types/xlights';

export interface PresetSequence {
  id: string;
  name: string;
  category: string;
  propType: PropModelType;
  durationMs: number;
  fps: number;
  stepIntervalMs: 25 | 50;
  description: string;
  defaultRoi: RoiBox;
  geometry?: PropGeometry;
  renderFrame: (
    ctx: CanvasRenderingContext2D,
    width: number,
    height: number,
    timeMs: number,
    geometry?: PropGeometry
  ) => void;
}

export const PRESET_SEQUENCES: PresetSequence[] = [
  {
    id: 'mega-tree-spiral',
    name: '32-Strand Mega Tree: Rainbow Spiral & Sparkle',
    category: 'Mega Tree',
    propType: 'Mega Tree',
    durationMs: 4000,
    fps: 40,
    stepIntervalMs: 25,
    description:
      'High-speed dual helical spiral rotating around 32-strand conic mega tree with random star sparkle topper.',
    defaultRoi: {
      x: 0.28,
      y: 0.12,
      width: 0.44,
      height: 0.76,
      rotationDeg: 0,
      isPolygon: false,
      polygonPoints: [
        { x: 0.5, y: 0.12 },
        { x: 0.72, y: 0.88 },
        { x: 0.28, y: 0.88 },
        { x: 0.35, y: 0.5 },
      ],
      locked: false,
    },
    renderFrame: (ctx, width, height, timeMs, geometry) => {
      // Dark night background with lawn silhouette
      ctx.fillStyle = '#05070a';
      ctx.fillRect(0, 0, width, height);

      const treeTopX = width * 0.5;
      const treeTopY = height * 0.18;
      const treeBottomY = height * 0.86;
      const treeHalfWidth = width * 0.19;
      const strands = geometry?.strands ?? 32;
      const nodesPerStrand = geometry?.nodesPerStrand ?? 40;
      const degrees = geometry?.degrees ?? 360;
      const totalSpanRad = (degrees / 360) * Math.PI * 2;
      const startRad = degrees === 180 ? -Math.PI / 2 : 0;
      const hasStar = geometry?.hasStarTopper ?? true;

      const tSec = timeMs / 1000;
      const rotationSpeed = 1.4; // Rotations per second
      const phase = tSec * rotationSpeed * Math.PI * 2;

      // Draw Star Topper if enabled
      if (hasStar) {
        const starGlow = 0.7 + 0.3 * Math.sin(tSec * 8);
        ctx.save();
        ctx.shadowColor = 'rgba(255, 230, 100, 0.9)';
        ctx.shadowBlur = 15;
        ctx.fillStyle = `rgba(255, 240, 150, ${starGlow})`;
        ctx.beginPath();
        ctx.arc(treeTopX, treeTopY - 14, 8, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }

      // Render Strands with Spiral Effect
      for (let s = 0; s < strands; s++) {
        const strandNorm = strands > 1 ? s / (strands - 1) : 0.5;
        const angle = startRad + strandNorm * totalSpanRad;
        const strandBottomX = treeTopX + Math.sin(angle) * treeHalfWidth;

        for (let n = 0; n < nodesPerStrand; n++) {
          const nNorm = nodesPerStrand > 1 ? n / (nodesPerStrand - 1) : 0;
          const px = treeTopX + (strandBottomX - treeTopX) * nNorm;
          const py = treeTopY + (treeBottomY - treeTopY) * nNorm;

          // Double Spiral Equation
          const spiralAngle = angle + nNorm * 8 - phase;
          const spiralWave = (Math.sin(spiralAngle) + 1) * 0.5;
          const isBright = spiralWave > 0.65;

          if (isBright) {
            // Rainbow hue progression along spiral
            const hue = Math.floor((strandNorm * 360 + nNorm * 180 + tSec * 60) % 360);
            ctx.fillStyle = `hsl(${hue}, 100%, 65%)`;
            ctx.shadowColor = `hsl(${hue}, 100%, 50%)`;
            ctx.shadowBlur = 8;
            ctx.beginPath();
            ctx.arc(px, py, 2.5, 0, Math.PI * 2);
            ctx.fill();
          } else {
            // Faint idle baseline
            ctx.fillStyle = 'rgba(20, 25, 35, 0.4)';
            ctx.beginPath();
            ctx.arc(px, py, 1.2, 0, Math.PI * 2);
            ctx.fill();
          }
        }
      }
    },
  },

  {
    id: 'pex-arches-chase',
    name: '8 PEX Arches: High-Speed Left-to-Right Chase',
    category: 'Arches',
    propType: 'PEX Arches',
    durationMs: 3000,
    fps: 20,
    stepIntervalMs: 50,
    description:
      'High-velocity single strand chase sweeping sequentially across 8 yard arches with bouncing tail fade.',
    defaultRoi: {
      x: 0.1,
      y: 0.35,
      width: 0.8,
      height: 0.5,
      rotationDeg: 0,
      isPolygon: false,
      polygonPoints: [
        { x: 0.1, y: 0.35 },
        { x: 0.9, y: 0.35 },
        { x: 0.9, y: 0.85 },
        { x: 0.1, y: 0.85 },
      ],
      locked: false,
    },
    renderFrame: (ctx, width, height, timeMs, geometry) => {
      ctx.fillStyle = '#06080d';
      ctx.fillRect(0, 0, width, height);

      const archCount = Math.max(1, geometry?.archCount ?? 8);
      const nodesPerArch = Math.max(5, geometry?.nodesPerArch ?? 35);
      const totalNodes = archCount * nodesPerArch;

      const tSec = timeMs / 1000;
      // Chase position moves left to right with bounce
      const cycleTime = 1.5;
      const posNorm = (tSec % cycleTime) / cycleTime;
      const activeHeadNode = posNorm * totalNodes;
      const chaseLength = 24;

      const archWidth = (width * 0.76) / archCount;
      const startX = width * 0.12;
      const baseY = height * 0.80;
      const archRadiusX = (archWidth * 0.92) / 2;
      const archRadiusY = Math.min(height * 0.34, archRadiusX * 1.15);

      for (let a = 0; a < archCount; a++) {
        const archCenter = startX + (a + 0.5) * archWidth;

        for (let n = 0; n < nodesPerArch; n++) {
          const globalNodeIdx = a * nodesPerArch + n;
          const archProgress = nodesPerArch > 1 ? n / (nodesPerArch - 1) : 0;
          // Smooth 180° / 190° semi-circular arc-length parameterization
          const arcTheta = (1.028 * Math.PI) - archProgress * (1.056 * Math.PI);
          const archX = archCenter + Math.cos(arcTheta) * archRadiusX;
          const archY = baseY - Math.sin(arcTheta) * archRadiusY;

          // Distance from chase head
          const distFromHead = activeHeadNode - globalNodeIdx;
          const isInChase = distFromHead >= 0 && distFromHead < chaseLength;

          if (isInChase) {
            const intensity = 1 - distFromHead / chaseLength;
            // Alternating Emerald Green and Cyan
            const isGreen = a % 2 === 0;
            const r = isGreen ? 0 : 0;
            const g = isGreen ? 255 : 230;
            const b = isGreen ? 80 : 255;

            ctx.fillStyle = `rgba(${r}, ${g}, ${b}, ${intensity})`;
            ctx.shadowColor = `rgba(${r}, ${g}, ${b}, 0.8)`;
            ctx.shadowBlur = 10 * intensity;
            ctx.beginPath();
            ctx.arc(archX, archY, 3, 0, Math.PI * 2);
            ctx.fill();
          } else {
            // Dim guide LED
            ctx.fillStyle = 'rgba(25, 35, 50, 0.3)';
            ctx.beginPath();
            ctx.arc(archX, archY, 1.2, 0, Math.PI * 2);
            ctx.fill();
          }
        }
      }
    },
  },

  {
    id: 'roofline-shockwave',
    name: 'Roofline & Matrix: Shockwave Ring Explosion & Strobe',
    category: 'Roofline & Matrix',
    propType: 'Roofline',
    durationMs: 3200,
    fps: 40,
    stepIntervalMs: 25,
    description:
      'Radial shockwave ring bursting outward across roof fascia lines followed by high-frequency white strobe pulses.',
    defaultRoi: {
      x: 0.15,
      y: 0.18,
      width: 0.7,
      height: 0.55,
      rotationDeg: 0,
      isPolygon: false,
      polygonPoints: [
        { x: 0.15, y: 0.18 },
        { x: 0.85, y: 0.18 },
        { x: 0.85, y: 0.73 },
        { x: 0.15, y: 0.73 },
      ],
      locked: false,
    },
    renderFrame: (ctx, width, height, timeMs) => {
      ctx.fillStyle = '#07090e';
      ctx.fillRect(0, 0, width, height);

      const tSec = timeMs / 1000;
      const cycleSec = 1.6;
      const localTime = tSec % cycleSec;

      const centerX = width * 0.5;
      const centerY = height * 0.35;

      // Stage 1 (0 to 1.0s): Shockwave expands outward
      // Stage 2 (1.0s to 1.6s): Rapid Strobe Pulses
      const isStrobing = localTime > 1.0;

      // Define roofline geometric segments
      const segments = [
        // Left roof peak
        { x1: width * 0.18, y1: height * 0.5, x2: width * 0.35, y2: height * 0.25 },
        { x1: width * 0.35, y1: height * 0.25, x2: width * 0.5, y2: height * 0.45 },
        // Center main gable peak
        { x1: width * 0.42, y1: height * 0.45, x2: width * 0.58, y2: height * 0.2 },
        { x1: width * 0.58, y1: height * 0.2, x2: width * 0.75, y2: height * 0.45 },
        // Right roofline
        { x1: width * 0.75, y1: height * 0.45, x2: width * 0.88, y2: height * 0.52 },
        // Lower horizontal fascia line
        { x1: width * 0.18, y1: height * 0.52, x2: width * 0.88, y2: height * 0.52 },
      ];

      const shockwaveRadius = (localTime / 1.0) * (width * 0.48);
      const ringWidth = width * 0.045;

      for (const seg of segments) {
        const dx = seg.x2 - seg.x1;
        const dy = seg.y2 - seg.y1;
        const len = Math.sqrt(dx * dx + dy * dy);
        const steps = Math.floor(len / 7);

        for (let i = 0; i <= steps; i++) {
          const norm = i / steps;
          const px = seg.x1 + dx * norm;
          const py = seg.y1 + dy * norm;

          let lit = false;
          let r = 255;
          let g = 0;
          let b = 120;

          if (isStrobing) {
            // Rapid strobe (10Hz)
            const strobePhase = Math.sin((localTime - 1.0) * 40);
            if (strobePhase > 0) {
              lit = true;
              r = 255;
              g = 255;
              b = 255; // White strobe
            }
          } else {
            // Check distance from shockwave explosion center
            const dist = Math.sqrt((px - centerX) * (px - centerX) + (py - centerY) * (py - centerY));
            const ringDist = Math.abs(dist - shockwaveRadius);
            if (ringDist < ringWidth) {
              lit = true;
              const intensity = 1 - ringDist / ringWidth;
              r = 255;
              g = Math.floor(60 * intensity);
              b = Math.floor(220 * intensity);
            }
          }

          if (lit) {
            ctx.fillStyle = `rgb(${r}, ${g}, ${b})`;
            ctx.shadowColor = `rgba(${r}, ${g}, ${b}, 0.9)`;
            ctx.shadowBlur = 10;
            ctx.beginPath();
            ctx.arc(px, py, 2.8, 0, Math.PI * 2);
            ctx.fill();
          } else {
            ctx.fillStyle = 'rgba(25, 30, 45, 0.35)';
            ctx.beginPath();
            ctx.arc(px, py, 1.2, 0, Math.PI * 2);
            ctx.fill();
          }
        }
      }
    },
  },

  {
    id: 'mini-tree-shimmer',
    name: 'Mini Tree with Star: Sinusoidal Shimmer & Value Curve',
    category: 'Mini Tree',
    propType: 'Mini Tree with Star',
    durationMs: 3600,
    fps: 20,
    stepIntervalMs: 50,
    description:
      'Soft sinusoidal luminous breathing wash over tomato-cage mini tree with sparkling gold star topper.',
    defaultRoi: {
      x: 0.32,
      y: 0.22,
      width: 0.36,
      height: 0.65,
      rotationDeg: 0,
      isPolygon: false,
      polygonPoints: [
        { x: 0.5, y: 0.22 },
        { x: 0.68, y: 0.85 },
        { x: 0.32, y: 0.85 },
        { x: 0.35, y: 0.5 },
      ],
      locked: false,
    },
    renderFrame: (ctx, width, height, timeMs) => {
      ctx.fillStyle = '#05070a';
      ctx.fillRect(0, 0, width, height);

      const tSec = timeMs / 1000;
      // Sinusoidal breathing curve (0.6 Hz)
      const breath = 0.5 + 0.5 * Math.sin(tSec * Math.PI * 1.3);

      const treeTopX = width * 0.5;
      const treeTopY = height * 0.32;
      const treeBottomY = height * 0.82;
      const baseWidth = width * 0.15;

      // Draw Star Submodel
      const starSparkle = 0.6 + 0.4 * Math.sin(tSec * 12);
      ctx.save();
      ctx.shadowColor = 'rgba(255, 215, 0, 0.9)';
      ctx.shadowBlur = 14;
      ctx.fillStyle = `rgba(255, 225, 80, ${starSparkle})`;
      ctx.beginPath();
      ctx.arc(treeTopX, treeTopY - 10, 7, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();

      // Tomato cage ribs (3 vertical + 3 rings)
      const ribs = 12;
      const levels = 18;

      for (let lvl = 0; lvl < levels; lvl++) {
        const lvlNorm = lvl / (levels - 1);
        const curY = treeTopY + (treeBottomY - treeTopY) * lvlNorm;
        const curRadius = baseWidth * lvlNorm;

        for (let r = 0; r < ribs; r++) {
          const angle = (r / ribs) * Math.PI * 2 + lvlNorm * 2;
          const curX = treeTopX + Math.sin(angle) * curRadius;

          // Dual color: Deep Red & Warm White
          const isRed = (lvl + r) % 2 === 0;
          const redVal = isRed ? 255 : 255;
          const greenVal = isRed ? 20 : 230;
          const blueVal = isRed ? 20 : 180;

          ctx.fillStyle = `rgba(${redVal}, ${greenVal}, ${blueVal}, ${breath * 0.85 + 0.15})`;
          ctx.shadowColor = `rgba(${redVal}, ${greenVal}, ${blueVal}, ${breath})`;
          ctx.shadowBlur = 8 * breath;
          ctx.beginPath();
          ctx.arc(curX, curY, 2.5, 0, Math.PI * 2);
          ctx.fill();
        }
      }
    },
  },

  {
    id: 'spinner-pinwheel',
    name: '12-Blade Coro Spinner: Clockwise Pinwheel with Color Bands',
    category: 'Spinner',
    propType: 'Spinner / ChromaStar',
    durationMs: 3000,
    fps: 40,
    stepIntervalMs: 25,
    description:
      'High-speed rotating 12-blade pinwheel pattern with outward curved spokes across high-density coro spinner.',
    defaultRoi: {
      x: 0.28,
      y: 0.18,
      width: 0.44,
      height: 0.64,
      rotationDeg: 0,
      isPolygon: false,
      polygonPoints: [
        { x: 0.28, y: 0.18 },
        { x: 0.72, y: 0.18 },
        { x: 0.72, y: 0.82 },
        { x: 0.28, y: 0.82 },
      ],
      locked: false,
    },
    renderFrame: (ctx, width, height, timeMs, geometry) => {
      ctx.fillStyle = '#06070c';
      ctx.fillRect(0, 0, width, height);

      const tSec = timeMs / 1000;
      const rotSpeed = 2.0; // Rev/sec
      const rotAngle = tSec * rotSpeed * Math.PI * 2;

      const cx = width * 0.5;
      const cy = height * 0.5;
      const maxRadius = Math.min(width, height) * 0.28;

      const blades = Math.max(3, geometry?.spinnerBlades ?? 12);
      const nodesPerBlade = Math.max(4, geometry?.nodesPerBlade ?? 16);
      const palette = [
        [255, 0, 80], // Hot Pink
        [0, 240, 255], // Electric Cyan
        [255, 230, 0], // Bright Yellow
        [150, 0, 255], // Violet
      ];

      for (let b = 0; b < blades; b++) {
        const baseAngle = (b / blades) * Math.PI * 2 + rotAngle;
        const color = palette[b % palette.length];

        for (let n = 1; n <= nodesPerBlade; n++) {
          const dist = (n / nodesPerBlade) * maxRadius;
          // Archimedian spiral twist curve
          const twist = (n / nodesPerBlade) * 0.8;
          const curAngle = baseAngle + twist;

          const px = cx + Math.cos(curAngle) * dist;
          const py = cy + Math.sin(curAngle) * dist;

          ctx.fillStyle = `rgb(${color[0]}, ${color[1]}, ${color[2]})`;
          ctx.shadowColor = `rgba(${color[0]}, ${color[1]}, ${color[2]}, 0.85)`;
          ctx.shadowBlur = 9;
          ctx.beginPath();
          ctx.arc(px, py, 2.6, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      // Center glowing hub
      ctx.fillStyle = '#ffffff';
      ctx.shadowColor = '#ffffff';
      ctx.shadowBlur = 15;
      ctx.beginPath();
      ctx.arc(cx, cy, 6, 0, Math.PI * 2);
      ctx.fill();
    },
  },

  {
    id: 'mega-tree-candycane',
    name: '32-Strand Mega Tree: Red & White Candy Cane Spiral',
    category: 'Mega Tree',
    propType: 'Mega Tree',
    durationMs: 3600,
    fps: 40,
    stepIntervalMs: 25,
    description:
      'Classic festive dual-color Candy Cane helical spiral wrapping around 32-strand conic mega tree with gold star topper.',
    defaultRoi: {
      x: 0.28,
      y: 0.12,
      width: 0.44,
      height: 0.76,
      rotationDeg: 0,
      isPolygon: false,
      polygonPoints: [
        { x: 0.5, y: 0.12 },
        { x: 0.72, y: 0.88 },
        { x: 0.28, y: 0.88 },
        { x: 0.35, y: 0.5 },
      ],
      locked: false,
    },
    renderFrame: (ctx, width, height, timeMs, geometry) => {
      ctx.fillStyle = '#040609';
      ctx.fillRect(0, 0, width, height);

      const treeTopX = width * 0.5;
      const treeTopY = height * 0.18;
      const treeBottomY = height * 0.86;
      const treeHalfWidth = width * 0.19;
      const strands = geometry?.strands ?? 32;
      const nodesPerStrand = geometry?.nodesPerStrand ?? 40;
      const degrees = geometry?.degrees ?? 360;
      const totalSpanRad = (degrees / 360) * Math.PI * 2;
      const startRad = degrees === 180 ? -Math.PI / 2 : 0;
      const hasStar = geometry?.hasStarTopper ?? true;

      const tSec = timeMs / 1000;
      const rotationSpeed = 1.2;
      const phase = tSec * rotationSpeed * Math.PI * 2;

      // Draw Star Topper if enabled
      if (hasStar) {
        const starGlow = 0.75 + 0.25 * Math.sin(tSec * 6);
        ctx.save();
        ctx.shadowColor = 'rgba(255, 215, 0, 0.9)';
        ctx.shadowBlur = 14;
        ctx.fillStyle = `rgba(255, 235, 120, ${starGlow})`;
        ctx.beginPath();
        ctx.arc(treeTopX, treeTopY - 14, 8, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }

      // Render Red and White Candy Cane Ribbons
      for (let s = 0; s < strands; s++) {
        const strandNorm = strands > 1 ? s / (strands - 1) : 0.5;
        const angle = startRad + strandNorm * totalSpanRad;
        const strandBottomX = treeTopX + Math.sin(angle) * treeHalfWidth;

        for (let n = 0; n < nodesPerStrand; n++) {
          const nNorm = nodesPerStrand > 1 ? n / (nodesPerStrand - 1) : 0;
          const px = treeTopX + (strandBottomX - treeTopX) * nNorm;
          const py = treeTopY + (treeBottomY - treeTopY) * nNorm;

          // 2-Arm Alternating Red & White Wave
          const spiralAngle = angle + nNorm * 7 - phase;
          const spiralWave = Math.sin(spiralAngle);

          if (Math.abs(spiralWave) > 0.35) {
            const isRed = spiralWave > 0;
            const r = isRed ? 255 : 240;
            const g = isRed ? 20 : 245;
            const b = isRed ? 35 : 255;

            ctx.fillStyle = `rgb(${r}, ${g}, ${b})`;
            ctx.shadowColor = isRed ? 'rgba(255, 30, 40, 0.8)' : 'rgba(255, 255, 255, 0.8)';
            ctx.shadowBlur = 7;
            ctx.beginPath();
            ctx.arc(px, py, 2.5, 0, Math.PI * 2);
            ctx.fill();
          } else {
            ctx.fillStyle = 'rgba(15, 20, 30, 0.35)';
            ctx.beginPath();
            ctx.arc(px, py, 1.2, 0, Math.PI * 2);
            ctx.fill();
          }
        }
      }
    },
  },

  {
    id: 'mega-tree-colorwash',
    name: '24-Strand Mega Tree: Oceanic Gradient Wave (270°)',
    category: 'Mega Tree',
    propType: 'Mega Tree',
    durationMs: 4000,
    fps: 40,
    stepIntervalMs: 25,
    description:
      'Rolling vertical color wash oscillating through deep cyan, teal, and royal blue across 270° mega tree.',
    defaultRoi: {
      x: 0.28,
      y: 0.12,
      width: 0.44,
      height: 0.76,
      rotationDeg: 0,
      isPolygon: false,
      polygonPoints: [
        { x: 0.5, y: 0.12 },
        { x: 0.72, y: 0.88 },
        { x: 0.28, y: 0.88 },
        { x: 0.35, y: 0.5 },
      ],
      locked: false,
    },
    renderFrame: (ctx, width, height, timeMs, geometry) => {
      ctx.fillStyle = '#04060a';
      ctx.fillRect(0, 0, width, height);

      const treeTopX = width * 0.5;
      const treeTopY = height * 0.18;
      const treeBottomY = height * 0.86;
      const treeHalfWidth = width * 0.21;
      const strands = geometry?.strands ?? 24;
      const nodesPerStrand = geometry?.nodesPerStrand ?? 40;
      const degrees = geometry?.degrees ?? 270;
      const totalSpanRad = (degrees / 360) * Math.PI * 2;
      const startRad = -totalSpanRad / 2;

      const tSec = timeMs / 1000;
      const waveSpeed = 2.2;

      for (let s = 0; s < strands; s++) {
        const strandNorm = strands > 1 ? s / (strands - 1) : 0.5;
        const angle = startRad + strandNorm * totalSpanRad;
        const strandBottomX = treeTopX + Math.sin(angle) * treeHalfWidth;

        for (let n = 0; n < nodesPerStrand; n++) {
          const nNorm = nodesPerStrand > 1 ? n / (nodesPerStrand - 1) : 0;
          const px = treeTopX + (strandBottomX - treeTopX) * nNorm;
          const py = treeTopY + (treeBottomY - treeTopY) * nNorm;

          const wave = Math.sin(nNorm * 5 - tSec * waveSpeed + strandNorm * 2);
          const intensity = 0.3 + 0.7 * ((wave + 1) * 0.5);

          const r = Math.floor(10 + 20 * intensity);
          const g = Math.floor(180 * intensity);
          const b = Math.floor(255 * intensity);

          ctx.fillStyle = `rgb(${r}, ${g}, ${b})`;
          ctx.shadowColor = `rgba(${r}, ${g}, ${b}, 0.6)`;
          ctx.shadowBlur = 6 * intensity;
          ctx.beginPath();
          ctx.arc(px, py, 2.2 * intensity, 0, Math.PI * 2);
          ctx.fill();
        }
      }
    },
  },

  {
    id: 'pex-arches-rainbow-bounce',
    name: '4 PEX Arches: Dual Symmetrical Rainbow Leap',
    category: 'Arches',
    propType: 'PEX Arches',
    durationMs: 3000,
    fps: 30,
    stepIntervalMs: 25,
    description:
      'Symmetrical rainbow pulse leaping outward from center arches toward yard wings along smooth 180° curved arches.',
    defaultRoi: {
      x: 0.12,
      y: 0.35,
      width: 0.76,
      height: 0.5,
      rotationDeg: 0,
      isPolygon: false,
      polygonPoints: [
        { x: 0.12, y: 0.35 },
        { x: 0.88, y: 0.35 },
        { x: 0.88, y: 0.85 },
        { x: 0.12, y: 0.85 },
      ],
      locked: false,
    },
    renderFrame: (ctx, width, height, timeMs, geometry) => {
      ctx.fillStyle = '#05070c';
      ctx.fillRect(0, 0, width, height);

      const archCount = Math.max(1, geometry?.archCount ?? 4);
      const nodesPerArch = Math.max(5, geometry?.nodesPerArch ?? 40);
      const tSec = timeMs / 1000;

      const archWidth = (width * 0.74) / archCount;
      const startX = width * 0.13;
      const baseY = height * 0.80;
      const archRadiusX = (archWidth * 0.92) / 2;
      const archRadiusY = Math.min(height * 0.35, archRadiusX * 1.15);

      for (let a = 0; a < archCount; a++) {
        const archCenter = startX + (a + 0.5) * archWidth;
        const archDistFromCenter = Math.abs(a - (archCount - 1) / 2);

        for (let n = 0; n < nodesPerArch; n++) {
          const archProgress = nodesPerArch > 1 ? n / (nodesPerArch - 1) : 0;
          const arcTheta = (1.028 * Math.PI) - archProgress * (1.056 * Math.PI);
          const archX = archCenter + Math.cos(arcTheta) * archRadiusX;
          const archY = baseY - Math.sin(arcTheta) * archRadiusY;

          const wavePos = (tSec * 2.5 - archDistFromCenter * 0.6) % 2.0;
          const nodeDist = Math.abs(archProgress - wavePos * 0.5);

          if (nodeDist < 0.25) {
            const intensity = 1 - nodeDist / 0.25;
            const hue = Math.floor((tSec * 60 + a * 60 + archProgress * 120) % 360);
            ctx.fillStyle = `hsl(${hue}, 100%, 65%)`;
            ctx.shadowColor = `hsl(${hue}, 100%, 50%)`;
            ctx.shadowBlur = 10 * intensity;
            ctx.beginPath();
            ctx.arc(archX, archY, 3, 0, Math.PI * 2);
            ctx.fill();
          } else {
            ctx.fillStyle = 'rgba(20, 30, 45, 0.3)';
            ctx.beginPath();
            ctx.arc(archX, archY, 1.2, 0, Math.PI * 2);
            ctx.fill();
          }
        }
      }
    },
  },

  {
    id: 'roofline-icicle-drip',
    name: 'Roofline: Dual-Speed Icicle Drip & Cool White Sparkle',
    category: 'Roofline & Matrix',
    propType: 'Roofline',
    durationMs: 3000,
    fps: 40,
    stepIntervalMs: 25,
    description:
      'Falling icicle drop sequence cascading from roof peak along eaves with icy cyan and cool-white strobe tips.',
    defaultRoi: {
      x: 0.15,
      y: 0.2,
      width: 0.7,
      height: 0.5,
      rotationDeg: 0,
      isPolygon: false,
      polygonPoints: [
        { x: 0.15, y: 0.2 },
        { x: 0.85, y: 0.2 },
        { x: 0.85, y: 0.7 },
        { x: 0.15, y: 0.7 },
      ],
      locked: false,
    },
    renderFrame: (ctx, width, height, timeMs, geometry) => {
      ctx.fillStyle = '#05070b';
      ctx.fillRect(0, 0, width, height);

      const segments = 48;
      const startX = width * 0.16;
      const endX = width * 0.84;
      const roofY = height * 0.38;
      const tSec = timeMs / 1000;

      for (let i = 0; i < segments; i++) {
        const norm = i / (segments - 1);
        const px = startX + norm * (endX - startX);
        const peakElevation = Math.sin(norm * Math.PI) * height * 0.12;
        const py = roofY - peakElevation;

        const dripPhase = (tSec * 2.0 + norm * 4) % 1.0;
        const dripY = py + dripPhase * height * 0.22;

        // Eave line node
        ctx.fillStyle = 'rgba(100, 180, 255, 0.6)';
        ctx.beginPath();
        ctx.arc(px, py, 2, 0, Math.PI * 2);
        ctx.fill();

        // Droplet
        if (dripPhase > 0.05 && dripPhase < 0.95) {
          const dropIntensity = 1 - dripPhase;
          ctx.fillStyle = `rgba(220, 245, 255, ${dropIntensity})`;
          ctx.shadowColor = 'rgba(0, 200, 255, 0.8)';
          ctx.shadowBlur = 6;
          ctx.beginPath();
          ctx.arc(px, dripY, 2.4, 0, Math.PI * 2);
          ctx.fill();
        }
      }
    },
  },

  {
    id: 'matrix-audio-eq',
    name: 'Matrix 16x50: Dynamic Audio Spectrum Equalizer',
    category: 'Roofline & Matrix',
    propType: 'Matrix',
    durationMs: 3200,
    fps: 40,
    stepIntervalMs: 25,
    description:
      'Bouncing 16-band graphic audio spectrum equalizer with peak-hold dots and gradient bar meters.',
    defaultRoi: {
      x: 0.2,
      y: 0.25,
      width: 0.6,
      height: 0.5,
      rotationDeg: 0,
      isPolygon: false,
      polygonPoints: [
        { x: 0.2, y: 0.25 },
        { x: 0.8, y: 0.25 },
        { x: 0.8, y: 0.75 },
        { x: 0.2, y: 0.75 },
      ],
      locked: false,
    },
    renderFrame: (ctx, width, height, timeMs, geometry) => {
      ctx.fillStyle = '#040508';
      ctx.fillRect(0, 0, width, height);

      const bands = 16;
      const rows = 20;
      const startX = width * 0.22;
      const endX = width * 0.78;
      const baseY = height * 0.72;
      const topY = height * 0.28;
      const bandWidth = (endX - startX) / bands;
      const tSec = timeMs / 1000;

      for (let b = 0; b < bands; b++) {
        const bx = startX + (b + 0.5) * bandWidth;
        const bandFreq = 1.0 + b * 0.4;
        const energy = Math.abs(Math.sin(tSec * bandFreq * 3) * Math.cos(tSec * 2 + b));
        const activeRows = Math.floor(energy * rows);

        for (let r = 0; r < rows; r++) {
          const rowNorm = r / rows;
          const ry = baseY - rowNorm * (baseY - topY);

          if (r <= activeRows) {
            // Green -> Yellow -> Red gradient
            const isHigh = rowNorm > 0.75;
            const isMid = rowNorm > 0.45;
            const cr = isHigh ? 255 : isMid ? 255 : 0;
            const cg = isHigh ? 30 : isMid ? 220 : 255;
            const cb = 40;

            ctx.fillStyle = `rgb(${cr}, ${cg}, ${cb})`;
            ctx.shadowColor = `rgba(${cr}, ${cg}, ${cb}, 0.7)`;
            ctx.shadowBlur = 5;
            ctx.beginPath();
            ctx.arc(bx, ry, 2.5, 0, Math.PI * 2);
            ctx.fill();
          } else {
            ctx.fillStyle = 'rgba(20, 25, 35, 0.3)';
            ctx.beginPath();
            ctx.arc(bx, ry, 1, 0, Math.PI * 2);
            ctx.fill();
          }
        }
      }
    },
  },

  {
    id: 'mini-trees-wave',
    name: '3 Mini Trees with Star: Synchronized Ripple Wave',
    category: 'Mini Tree',
    propType: 'Mini Tree with Star',
    durationMs: 3000,
    fps: 30,
    stepIntervalMs: 50,
    description:
      'Chasing festive color wave rippling across 3 front yard mini trees with flashing golden stars.',
    defaultRoi: {
      x: 0.15,
      y: 0.3,
      width: 0.7,
      height: 0.55,
      rotationDeg: 0,
      isPolygon: false,
      polygonPoints: [
        { x: 0.15, y: 0.3 },
        { x: 0.85, y: 0.3 },
        { x: 0.85, y: 0.85 },
        { x: 0.15, y: 0.85 },
      ],
      locked: false,
    },
    renderFrame: (ctx, width, height, timeMs, geometry) => {
      ctx.fillStyle = '#05070a';
      ctx.fillRect(0, 0, width, height);

      const treeCount = 3;
      const startX = width * 0.22;
      const endX = width * 0.78;
      const treeSpacing = (endX - startX) / (treeCount - 1);
      const baseY = height * 0.78;
      const treeHeight = height * 0.36;
      const tSec = timeMs / 1000;

      for (let t = 0; t < treeCount; t++) {
        const tx = startX + t * treeSpacing;
        const treePhase = tSec * 2.2 - t * 0.8;
        const wave = (Math.sin(treePhase) + 1) * 0.5;

        // Star topper
        ctx.save();
        ctx.shadowColor = 'rgba(255, 230, 80, 0.9)';
        ctx.shadowBlur = 10;
        ctx.fillStyle = 'rgba(255, 240, 140, 0.95)';
        ctx.beginPath();
        ctx.arc(tx, baseY - treeHeight - 8, 5, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();

        // Mini Tree Body
        const tiers = 5;
        for (let r = 0; r < tiers; r++) {
          const tierY = baseY - (r / tiers) * treeHeight;
          const tierWidth = (1 - r / tiers) * width * 0.08;
          const count = 3 + r * 2;

          for (let c = 0; c < count; c++) {
            const cx = tx - tierWidth + (c / (count - 1 || 1)) * tierWidth * 2;
            const isLit = Math.sin(treePhase + r * 0.5 + c * 0.3) > 0.1;

            if (isLit) {
              const hue = Math.floor((tSec * 45 + t * 90 + r * 30) % 360);
              ctx.fillStyle = `hsl(${hue}, 100%, 60%)`;
              ctx.shadowColor = `hsl(${hue}, 100%, 50%)`;
              ctx.shadowBlur = 6;
              ctx.beginPath();
              ctx.arc(cx, tierY, 2.5, 0, Math.PI * 2);
              ctx.fill();
            } else {
              ctx.fillStyle = 'rgba(25, 35, 45, 0.35)';
              ctx.beginPath();
              ctx.arc(cx, tierY, 1.2, 0, Math.PI * 2);
              ctx.fill();
            }
          }
        }
      }
    },
  },
];
