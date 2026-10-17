import { PropNode } from './propModeler';
import { ColorSwatch, LayerBlendingMode, XLightsRecipe } from '../types/xlights';

export interface RenderedNodeColor {
  nodeId: number;
  r: number;
  g: number;
  b: number;
  intensity: number; // 0..1
}

export class XLightsSimulator {
  /**
   * Simulates an xLights effect frame on target prop nodes at timeMs.
   */
  public static simulateFrame(
    nodes: PropNode[],
    effectName: string,
    settings: Record<string, any>,
    palette: ColorSwatch[],
    timeMs: number,
    durationMs: number = 3000
  ): RenderedNodeColor[] {
    const activePalette = palette.filter((p) => p.checked);
    const colors: [number, number, number][] =
      activePalette.length > 0
        ? activePalette.map((p) => p.rgb)
        : [
            [255, 30, 30],
            [30, 255, 60],
            [255, 255, 255],
            [30, 140, 255],
          ];

    const tSec = timeMs / 1000;
    const speed = Math.max(0.1, Number(settings['Speed'] || 1.0));
    const results: RenderedNodeColor[] = [];

    // Normalize effect name for resilient matching
    const normalizedEffect = (effectName || '').toLowerCase();

    // Determine prop geometry bounds from nodes
    let maxStrand = 1;
    let maxNode = 1;
    for (const n of nodes) {
      if (n.strandIndex > maxStrand) maxStrand = n.strandIndex;
      if (n.nodeIndex > maxNode) maxNode = n.nodeIndex;
    }
    const totalStrands = maxStrand + 1;
    const totalNodesPerStrand = maxNode + 1;

    // 1. SPIRALS / HELIX (Snaking ribbons, double helix, candy cane stripes)
    if (
      normalizedEffect.includes('spiral') ||
      normalizedEffect.includes('helix')
    ) {
      const repeat = Number(settings['Palette Repeat'] || 2);
      const armCount = Math.max(1, Number(settings['Arms'] || repeat * 2 || 4));
      const direction = String(settings['Direction'] || 'Forward');
      const isReverse =
        direction.toLowerCase().includes('backward') ||
        direction.toLowerCase().includes('left') ||
        direction.toLowerCase().includes('reverse');
      const rotSign = isReverse ? -1 : 1;
      const thickness = Number(settings['Spiral Thickness'] || 22) / 100;
      const rotationDeg = Number(settings['Rotation'] || 45);
      const wrapCount = Math.max(0.5, Number(settings['Wrap Count'] || (rotationDeg / 45) * 1.5 || 2.0));
      const hasBlend = Boolean(settings['Blend Colors'] ?? true);

      for (const node of nodes) {
        // Special handling for Star Topper submodel
        if (node.submodel === 'Star Topper') {
          const starGlow = 0.65 + 0.35 * Math.sin(tSec * 6 + node.id);
          results.push({
            nodeId: node.id,
            r: 255,
            g: 240,
            b: 150,
            intensity: starGlow,
          });
          continue;
        }

        // Strand angular position (0..2*PI around cone)
        const sNorm = totalStrands > 1 ? node.strandIndex / totalStrands : 0.5;
        const sAngle = sNorm * Math.PI * 2;

        // Height progression along strand (0 at apex, 1 at base)
        const nNorm = totalNodesPerStrand > 1 ? node.nodeIndex / totalNodesPerStrand : 0.5;

        // Continuous angular phase along the cone: combines rotation around cone with vertical progression
        const phase = sAngle + nNorm * wrapCount * Math.PI * 2 - tSec * speed * Math.PI * 2 * rotSign;

        // Normalize phase into [0, 1) single period
        const normPhase = ((phase / (Math.PI * 2)) % 1 + 1) % 1;

        // Map into arm slot across 0..armCount
        const armSlot = normPhase * armCount;
        const armIndex = Math.floor(armSlot) % armCount;
        // Distance from ribbon center (0 at ribbon center, 1 at boundary between arms)
        const distFromCenter = Math.abs((armSlot - Math.floor(armSlot)) - 0.5) * 2;

        let intensity = 0;
        const ribbonWidth = Math.max(0.12, thickness * 2.2);
        if (distFromCenter < ribbonWidth) {
          intensity = Math.cos((distFromCenter / ribbonWidth) * (Math.PI / 2));
        }

        // Realistic 3D perspective shading:
        // Front-facing strands (depth >= 0.5) are prominent (0.85 to 1.0).
        // Rear-facing strands (depth < 0.5) remain gracefully visible (0.42 to 0.77)
        const depth = node.depth !== undefined ? node.depth : 0.7;
        let depthFactor: number;
        if (depth >= 0.5) {
          depthFactor = 0.85 + 0.15 * ((depth - 0.5) / 0.5); // 0.85 to 1.0
        } else {
          depthFactor = 0.42 + 0.35 * (depth / 0.5); // 0.42 to 0.77
        }
        intensity = Math.min(1, intensity * depthFactor);

        let r = 0, g = 0, b = 0;
        if (hasBlend && colors.length > 1) {
          // Smooth continuous chromatic ribbon progression matching official xLights Spirals
          const colorProg = (armIndex / armCount + nNorm * (repeat * 0.5)) % 1;
          const cSlot = (colorProg * colors.length) % colors.length;
          const cIdx1 = Math.floor(cSlot);
          const cIdx2 = (cIdx1 + 1) % colors.length;
          const blendFrac = cSlot - cIdx1;
          const c1 = colors[cIdx1];
          const c2 = colors[cIdx2];
          r = Math.round(c1[0] * (1 - blendFrac) + c2[0] * blendFrac);
          g = Math.round(c1[1] * (1 - blendFrac) + c2[1] * blendFrac);
          b = Math.round(c1[2] * (1 - blendFrac) + c2[2] * blendFrac);
        } else {
          const colorIdx = armIndex % colors.length;
          [r, g, b] = colors[colorIdx];
        }

        results.push({
          nodeId: node.id,
          r,
          g,
          b,
          intensity: intensity > 0.05 ? intensity : 0.02,
        });
      }
      return results;
    }

    // 2. BARS (2D Cylindrical / Planar Raster Bands)
    if (normalizedEffect.includes('bars')) {
      const dir = String(settings['Direction'] || 'Right');
      const barWidth = Math.max(0.04, Number(settings['Bar Width'] || 12) / 100);
      const paletteRepeat = Math.max(1, Number(settings['Palette Repeat'] || 2));
      const highlight = Boolean(settings['Highlight']);

      for (const node of nodes) {
        let coord = node.x;
        if (dir === 'Left') coord = 1 - node.x;
        else if (dir === 'Up') coord = 1 - node.y;
        else if (dir === 'Down') coord = node.y;
        else if (dir.includes('Angle')) {
          coord = (node.x + node.y) * 0.5;
        }

        // Rolling position
        const shifted = (coord - tSec * speed * 0.65 * paletteRepeat) % 1;
        const pos = (shifted + 1) % 1;

        const colorPos = (pos * colors.length) % colors.length;
        const colorIdx = Math.floor(colorPos);
        const nextColorIdx = (colorIdx + 1) % colors.length;
        const blend = colorPos - colorIdx;

        const c1 = colors[colorIdx];
        const c2 = colors[nextColorIdx];

        let r = Math.round(c1[0] * (1 - blend) + c2[0] * blend);
        let g = Math.round(c1[1] * (1 - blend) + c2[1] * blend);
        let b = Math.round(c1[2] * (1 - blend) + c2[2] * blend);

        let intensity = 0.95;
        if (highlight && blend < 0.15) {
          // Sharp leading highlight edge
          r = Math.min(255, r + 60);
          g = Math.min(255, g + 60);
          b = Math.min(255, b + 60);
          intensity = 1.0;
        }

        results.push({
          nodeId: node.id,
          r,
          g,
          b,
          intensity,
        });
      }
      return results;
    }

    // 3. CURTAIN (Cascading vertical drapery or swags)
    if (normalizedEffect.includes('curtain')) {
      const curtainProg = (tSec * speed * 0.5) % 1;
      for (const node of nodes) {
        const distFromFold = Math.abs((node.y - curtainProg + 1) % 1 - 0.5) * 2;
        const intensity = Math.max(0.05, 1 - distFromFold * 1.5);
        const colorIdx = Math.floor((node.x * colors.length) % colors.length);
        const [r, g, b] = colors[colorIdx];

        results.push({
          nodeId: node.id,
          r,
          g,
          b,
          intensity,
        });
      }
      return results;
    }

    // 4. PINWHEEL & FAN
    if (normalizedEffect.includes('pinwheel') || normalizedEffect.includes('fan')) {
      const arms = Number(settings['Arms'] || settings['Number of Blades'] || 6);
      const twist = Number(settings['Twist'] || 12) / 10;
      const spinSpeed = speed * 1.4;

      for (const node of nodes) {
        const dx = node.x - 0.5;
        const dy = node.y - 0.5;
        const angle = Math.atan2(dy, dx);
        const dist = Math.hypot(dx, dy);

        const armPhase = (angle + dist * twist - tSec * spinSpeed) * arms;
        const wave = (Math.sin(armPhase) + 1) * 0.5;
        const intensity = wave > 0.35 ? (wave - 0.35) * 1.54 : 0.05;

        const armIdx = Math.floor((((angle + Math.PI) / (Math.PI * 2)) * arms) % colors.length);
        const [r, g, b] = colors[Math.abs(armIdx) % colors.length];

        results.push({
          nodeId: node.id,
          r,
          g,
          b,
          intensity,
        });
      }
      return results;
    }

    // 5. SHOCKWAVE & RIPPLE
    if (normalizedEffect.includes('shockwave') || normalizedEffect.includes('ripple')) {
      const startRad = Number(settings['Start Radius'] || 0) / 100;
      const endRad = Number(settings['End Radius'] || 100) / 100;
      const ringWidth = Math.max(0.05, Number(settings['Width'] || 16) / 100);

      const cycleT = (tSec * speed) % 1.6;
      const currentRad = startRad + (endRad - startRad) * (cycleT / 1.6);

      for (const node of nodes) {
        const dist = Math.hypot(node.x - 0.5, node.y - 0.5);
        const ringDist = Math.abs(dist - currentRad);
        let intensity = 0.03;

        if (ringDist < ringWidth) {
          intensity = Math.cos((ringDist / ringWidth) * (Math.PI / 2));
        }

        const colorIdx = Math.floor((dist * 3 + tSec) % colors.length);
        const [r, g, b] = colors[colorIdx % colors.length];

        results.push({
          nodeId: node.id,
          r,
          g,
          b,
          intensity,
        });
      }
      return results;
    }

    // 6. METEORS & RAIN
    if (normalizedEffect.includes('meteor') || normalizedEffect.includes('rain')) {
      const tailLength = 0.35;
      for (const node of nodes) {
        // Individual meteor phase offset per strand
        const strandOffset = (node.strandIndex * 0.37) % 1;
        const headY = ((tSec * speed * 0.9 + strandOffset) % 1.3) - 0.15;
        const distBehind = headY - node.y;

        let intensity = 0.02;
        if (distBehind >= 0 && distBehind < tailLength) {
          intensity = 1 - distBehind / tailLength;
        }

        const [r, g, b] = colors[node.strandIndex % colors.length];
        results.push({
          nodeId: node.id,
          r,
          g,
          b,
          intensity,
        });
      }
      return results;
    }

    // 7. MORPH (Organic Decaying Ribbons)
    if (normalizedEffect.includes('morph')) {
      const headProg = (tSec * speed * 0.8) % 1.2;
      for (const node of nodes) {
        const dist = Math.abs(node.x - headProg);
        const intensity = dist < 0.2 ? Math.max(0.04, 1 - dist / 0.2) : 0.04;
        const [r, g, b] = colors[Math.floor(node.y * colors.length) % colors.length];
        results.push({
          nodeId: node.id,
          r,
          g,
          b,
          intensity,
        });
      }
      return results;
    }

    // 8. TWINKLE & SPARKLE
    if (normalizedEffect.includes('twinkle') || normalizedEffect.includes('sparkle')) {
      for (const node of nodes) {
        // Pseudo-random deterministic sparkle based on nodeId and time
        const hash = Math.sin(node.id * 997.1 + Math.floor(tSec * 6 * speed)) * 43758.5453;
        const isSparkling = (hash - Math.floor(hash)) > 0.72;
        const intensity = isSparkling ? 0.95 : 0.05;
        const [r, g, b] = colors[node.id % colors.length];
        results.push({
          nodeId: node.id,
          r,
          g,
          b,
          intensity,
        });
      }
      return results;
    }

    // 9. STROBE
    if (normalizedEffect.includes('strobe')) {
      const strobeFreq = Math.max(4, Number(settings['Number of Strobes'] || 10));
      const isStrobing = Math.sin(tSec * strobeFreq * Math.PI * 2) > 0.15;
      const intensity = isStrobing ? 1.0 : 0.02;

      for (const node of nodes) {
        const [r, g, b] = colors[0] || [255, 255, 255];
        results.push({
          nodeId: node.id,
          r,
          g,
          b,
          intensity,
        });
      }
      return results;
    }

    // 10. SINGLE STRAND (Strand chase / bounce)
    if (normalizedEffect.includes('single strand') || normalizedEffect.includes('chase')) {
      const chaseSize = Math.max(3, Number(settings['Chase Size'] || 5));
      const totalNodes = nodes.length;
      const cycleProgress = (tSec * speed * 1.2) % 1;
      const headIndex = cycleProgress * totalNodes;

      for (let i = 0; i < totalNodes; i++) {
        const node = nodes[i];
        const dist = (i - headIndex + totalNodes) % totalNodes;
        let intensity = 0.04;
        if (dist >= 0 && dist < chaseSize) {
          intensity = 1 - dist / chaseSize;
        }

        const colorIdx = Math.floor((node.strandIndex || i / chaseSize) % colors.length);
        const [r, g, b] = colors[colorIdx];

        results.push({
          nodeId: node.id,
          r,
          g,
          b,
          intensity,
        });
      }
      return results;
    }

    // 11. BUTTERFLY (Symmetric flapping spectral wings)
    if (normalizedEffect.includes('butterfly')) {
      const flapSpeed = speed * 1.5;
      for (const node of nodes) {
        const dx = Math.abs(node.x - 0.5) * 2; // 0 at center, 1 at wings edge
        const dy = node.y;
        const wingPhase = (dx * 3 - tSec * flapSpeed) % 1;
        const intensity = Math.max(0.06, Math.abs(Math.cos(wingPhase * Math.PI)) * 0.95);
        const colorIdx = Math.floor((dx * 4 + dy * 2) % colors.length);
        const [r, g, b] = colors[colorIdx % colors.length];
        results.push({ nodeId: node.id, r, g, b, intensity });
      }
      return results;
    }

    // 12. FIRE / FLAME (Dynamic organic heat flare ribbons)
    if (normalizedEffect.includes('fire') || normalizedEffect.includes('flame')) {
      for (const node of nodes) {
        const noise = Math.sin(node.x * 12 + tSec * speed * 4) * Math.cos(node.y * 8 - tSec * speed * 3);
        const heightFactor = 1 - node.y; // 1 at base, 0 at top
        const intensity = Math.max(0.05, Math.min(1.0, (heightFactor + noise * 0.25) * 1.2));
        const fireColors: [number, number, number][] = [
          [255, 30, 0],   // Red
          [255, 120, 0],  // Orange
          [255, 220, 30], // Yellow
          [255, 255, 200], // Hot white
        ];
        const cIdx = Math.min(fireColors.length - 1, Math.floor((1 - node.y + noise * 0.2) * fireColors.length));
        const [r, g, b] = fireColors[Math.max(0, cIdx)];
        results.push({ nodeId: node.id, r, g, b, intensity });
      }
      return results;
    }

    // 13. DEFAULT FALLBACK: Smooth Multi-Color Wash (Never a flat monochrome blinking loop!)
    const washPhase = (tSec * speed * 0.4) % 1;
    for (const node of nodes) {
      const pos = (node.x * 0.5 + node.y * 0.5 + washPhase) % 1;
      const colorPos = (pos * colors.length) % colors.length;
      const colorIdx = Math.floor(colorPos);
      const nextIdx = (colorIdx + 1) % colors.length;
      const blend = colorPos - colorIdx;

      const c1 = colors[colorIdx];
      const c2 = colors[nextIdx];

      const r = Math.round(c1[0] * (1 - blend) + c2[0] * blend);
      const g = Math.round(c1[1] * (1 - blend) + c2[1] * blend);
      const b = Math.round(c1[2] * (1 - blend) + c2[2] * blend);

      const breath = 0.6 + 0.4 * Math.sin(tSec * speed * 2 + node.y * Math.PI);
      results.push({
        nodeId: node.id,
        r,
        g,
        b,
        intensity: Math.max(0.1, breath),
      });
    }

    return results;
  }

  /**
   * Simulates full multi-layer sequencer composite frame with proper blend modes.
   */
  public static simulateCompositeRecipe(
    nodes: PropNode[],
    recipe: XLightsRecipe,
    timeMs: number,
    durationMs: number = 3000
  ): RenderedNodeColor[] {
    const stack = recipe.multiLayerStack;
    if (!stack || stack.length === 0) {
      return this.simulateFrame(
        nodes,
        recipe.effectName,
        recipe.settings,
        recipe.palette,
        timeMs,
        durationMs
      );
    }

    // Composite layers from bottom (Layer 1) to top (Layer N)
    let compositeMap = new Map<number, RenderedNodeColor>();

    for (let l = 0; l < stack.length; l++) {
      const layer = stack[l];

      // Filter target nodes by submodel
      let targetNodes = nodes;
      if (layer.submodelTarget && layer.submodelTarget !== 'Default' && layer.submodelTarget !== 'All' && layer.submodelTarget !== 'Full Prop') {
        const subLower = layer.submodelTarget.toLowerCase();
        if (subLower.includes('star')) {
          targetNodes = nodes.filter((n) => n.submodel === 'Star Topper');
        } else if (subLower.includes('ribbon') || subLower.includes('tree')) {
          targetNodes = nodes.filter((n) => n.submodel !== 'Star Topper');
        }
      }

      if (targetNodes.length === 0) continue;

      const layerColors = this.simulateFrame(
        targetNodes,
        layer.effectName,
        layer.settings,
        layer.palette && layer.palette.length > 0 ? layer.palette : recipe.palette,
        timeMs,
        durationMs
      );

      if (l === 0) {
        for (const c of layerColors) {
          compositeMap.set(c.nodeId, { ...c });
        }
      } else {
        const blendMode: LayerBlendingMode = layer.blendingMode || 'Normal';
        for (const c of layerColors) {
          const base = compositeMap.get(c.nodeId);
          if (!base) {
            compositeMap.set(c.nodeId, { ...c });
            continue;
          }

          if (blendMode === 'Add') {
            base.r = Math.min(255, base.r + c.r);
            base.g = Math.min(255, base.g + c.g);
            base.b = Math.min(255, base.b + c.b);
            base.intensity = Math.min(1, base.intensity + c.intensity);
          } else if (blendMode === 'Maximum') {
            base.r = Math.max(base.r, c.r);
            base.g = Math.max(base.g, c.g);
            base.b = Math.max(base.b, c.b);
            base.intensity = Math.max(base.intensity, c.intensity);
          } else if (blendMode === '2 is Mask') {
            base.intensity = base.intensity * c.intensity;
          } else {
            // Normal (Layer Over)
            const alpha = c.intensity;
            base.r = Math.round(base.r * (1 - alpha) + c.r * alpha);
            base.g = Math.round(base.g * (1 - alpha) + c.g * alpha);
            base.b = Math.round(base.b * (1 - alpha) + c.b * alpha);
            base.intensity = Math.max(base.intensity, c.intensity);
          }
        }
      }
    }

    return Array.from(compositeMap.values());
  }

  /**
   * Renders simulated node colors onto a canvas with 3D depth, halos, and dark ambient styling.
   * Supports 'fit_envelope' (default) to scale and register the prop with the video ROI crop.
   */
  public static renderNodesToCanvas(
    nodes: PropNode[],
    nodeColors: RenderedNodeColor[],
    canvas: HTMLCanvasElement,
    boundsMode: 'fit_envelope' | 'raw' = 'fit_envelope'
  ): void {
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Dark stage background
    ctx.fillStyle = '#05070a';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Dynamic resolution scaling factor (base resolution 480x270)
    const scale = Math.max(1, canvas.width / 480);

    const colorMap = new Map<number, RenderedNodeColor>();
    for (const c of nodeColors) {
      colorMap.set(c.nodeId, c);
    }

    // Compute bounding envelope of all nodes for registration with cropped ROI frame
    let minX = 1, maxX = 0, minY = 1, maxY = 0;
    for (const node of nodes) {
      if (node.x < minX) minX = node.x;
      if (node.x > maxX) maxX = node.x;
      if (node.y < minY) minY = node.y;
      if (node.y > maxY) maxY = node.y;
    }
    const envW = Math.max(0.01, maxX - minX);
    const envH = Math.max(0.01, maxY - minY);
    const padX = 0.08;
    const padY = 0.06;
    const spanX = 1 - 2 * padX;
    const spanY = 1 - 2 * padY;

    const getNodePx = (node: PropNode): { px: number; py: number } => {
      if (boundsMode === 'raw') {
        return { px: node.x * canvas.width, py: node.y * canvas.height };
      }
      const nx = padX + ((node.x - minX) / envW) * spanX;
      const ny = padY + ((node.y - minY) / envH) * spanY;
      return { px: nx * canvas.width, py: ny * canvas.height };
    };

    // 1. Draw continuous strand ribbon segments between adjacent lit nodes on the same strand
    const nodesByStrand = new Map<number, PropNode[]>();
    for (const node of nodes) {
      if (!nodesByStrand.has(node.strandIndex)) nodesByStrand.set(node.strandIndex, []);
      nodesByStrand.get(node.strandIndex)!.push(node);
    }

    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    for (const [, strandNodes] of nodesByStrand) {
      strandNodes.sort((a, b) => a.nodeIndex - b.nodeIndex);
      for (let i = 0; i < strandNodes.length - 1; i++) {
        const nA = strandNodes[i];
        const nB = strandNodes[i + 1];
        const cA = colorMap.get(nA.id);
        const cB = colorMap.get(nB.id);
        if (cA && cB && (cA.intensity > 0.09 || cB.intensity > 0.09)) {
          const depthAvg = ((nA.depth ?? 0.6) + (nB.depth ?? 0.6)) * 0.5;
          const avgIntensity = (cA.intensity + cB.intensity) * 0.5;
          const rAvg = Math.round((cA.r + cB.r) * 0.5);
          const gAvg = Math.round((cA.g + cB.g) * 0.5);
          const bAvg = Math.round((cA.b + cB.b) * 0.5);

          const posA = getNodePx(nA);
          const posB = getNodePx(nB);

          ctx.save();
          ctx.strokeStyle = `rgba(${rAvg}, ${gAvg}, ${bAvg}, ${avgIntensity * 0.75})`;
          ctx.lineWidth = (2.2 + 2.5 * depthAvg) * Math.min(1.3, 0.6 + avgIntensity * 0.7) * (scale * 0.85);
          ctx.beginPath();
          ctx.moveTo(posA.px, posA.py);
          ctx.lineTo(posB.px, posB.py);
          ctx.stroke();
          ctx.restore();
        }
      }
    }

    // 2. Sort nodes back-to-front by depth (depth: 0 = rear, 1 = front) so front ribbons overlap rear ribbons cleanly
    const sortedNodes = [...nodes].sort((a, b) => (a.depth ?? 0.5) - (b.depth ?? 0.5));

    for (const node of sortedNodes) {
      const c = colorMap.get(node.id);
      if (!c) continue;

      const pos = getNodePx(node);
      const px = pos.px;
      const py = pos.py;
      const depth = node.depth !== undefined ? node.depth : 0.6;

      if (c.intensity > 0.08) {
        const radius = (2.0 + 2.0 * depth) * Math.min(1.3, 0.6 + c.intensity * 0.6) * (scale * 0.85);
        ctx.fillStyle = `rgba(${c.r}, ${c.g}, ${c.b}, ${c.intensity})`;
        ctx.shadowColor = `rgba(${c.r}, ${c.g}, ${c.b}, ${c.intensity * 0.85})`;
        ctx.shadowBlur = (4 + 8 * depth) * c.intensity * scale;
        ctx.beginPath();
        ctx.arc(px, py, radius, 0, Math.PI * 2);
        ctx.fill();
      } else {
        // Subtle unlit pixel bead
        ctx.fillStyle = 'rgba(25, 30, 42, 0.25)';
        ctx.shadowBlur = 0;
        ctx.beginPath();
        ctx.arc(px, py, Math.max(0.8, 1.1 * (scale * 0.75)), 0, Math.PI * 2);
        ctx.fill();
      }
    }
  }
}
