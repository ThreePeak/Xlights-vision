import { PropGeometry, PropModelType } from '../types/xlights';

export interface PropNode {
  id: number;
  strandIndex: number;
  nodeIndex: number;
  x: number; // 0..1 normalized width in prop frame
  y: number; // 0..1 normalized height in prop frame
  depth: number; // 0..1 for 3D perspective / 360 wrap
  submodel?: string;
  worldX?: number; // -1..1 centered 3D coordinate
  worldY?: number; // -1..1 centered 3D coordinate (up is positive)
  worldZ?: number; // -1..1 centered 3D depth (towards camera is positive)
}

export class PropGeometryModeler {
  public static generateNodes(type: PropModelType, geom: PropGeometry): PropNode[] {
    const nodes: PropNode[] = [];
    let globalId = 0;

    switch (type) {
      case 'Mega Tree': {
        const { degrees, strands, nodesPerStrand, hasStarTopper, starNodes } = geom;
        
        // Dynamic tree geometry based on wrap degrees: 180 (flat front), 270 (3/4 wrap), 360 (round cone)
        // Authentic slender mega tree aspect ratio (height-to-base ratio ~2:1, not a bloated wide triangle)
        const totalSpanRad = (degrees / 360) * Math.PI * 2;
        let startRad = 0;
        let baseRadius = 0.142; // Sleek standard mega tree base radius in 16:9 canvas
        let topRadius = 0.014;  // Tight topper convergence

        if (degrees === 180) {
          startRad = -Math.PI / 2; // -90 deg to +90 deg (street facing front arc)
          baseRadius = 0.155;
          topRadius = 0.016;
        } else if (degrees === 270) {
          startRad = -Math.PI * 0.75; // -135 deg to +135 deg (3/4 wrap)
          baseRadius = 0.148;
          topRadius = 0.015;
        } else {
          // 360 Round Conic Tree
          startRad = -Math.PI; // Full circle centered with front facing camera
          baseRadius = 0.142;
          topRadius = 0.014;
        }

        const apexY = 0.08;
        const baseY = 0.88;

        for (let s = 0; s < strands; s++) {
          const sNorm = strands > 1 ? s / (strands - 1) : 0.5;
          const angle = startRad + sNorm * totalSpanRad;

          // 3D elliptical base ring perspective curvature (front center bows down, rear lifts)
          const ringZOffset = Math.cos(angle); // 1 = closest front, -1 = furthest rear
          const ringBaseY = baseY + ringZOffset * (baseRadius * 0.14);
          const ringApexY = apexY + ringZOffset * (topRadius * 0.14);

          const bottomX = 0.5 + Math.sin(angle) * baseRadius;
          const topX = 0.5 + Math.sin(angle) * topRadius;

          const bottomDepth = (ringZOffset + 1) * 0.5; // 0..1 depth

          for (let n = 0; n < nodesPerStrand; n++) {
            const nNorm = nodesPerStrand > 1 ? n / (nodesPerStrand - 1) : 0;
            
            // Linear progression along the conical strand from top spindle to base ring
            const px = topX + (bottomX - topX) * nNorm;
            const py = ringApexY + (ringBaseY - ringApexY) * nNorm;

            // Depth calculation: apex has solid center depth, base fans out in 3D
            const nodeDepth = 0.65 + (bottomDepth - 0.65) * nNorm;

            // Centered 3D World Coordinates (-1 to 1) for 3D Orbit Viewer
            const strandRadiusAtN = topRadius + (baseRadius - topRadius) * nNorm;
            const wX = Math.sin(angle) * strandRadiusAtN * 4.2;
            const wY = (0.5 - py) * 2.2; // +0.9 at top to -0.85 at bottom
            const wZ = Math.cos(angle) * strandRadiusAtN * 4.2;

            nodes.push({
              id: globalId++,
              strandIndex: s,
              nodeIndex: n,
              x: px,
              y: py,
              depth: Math.max(0, Math.min(1, nodeDepth)),
              submodel: 'Tree Ribbons',
              worldX: wX,
              worldY: wY,
              worldZ: wZ,
            });
          }
        }

        // Add Star Topper if enabled
        if (hasStarTopper && starNodes > 0) {
          for (let sn = 0; sn < starNodes; sn++) {
            const starAngle = (sn / starNodes) * Math.PI * 2;
            const radius = 0.038 * (sn % 2 === 0 ? 1 : 0.42);
            const sx = 0.5 + Math.sin(starAngle) * radius;
            const sy = apexY - 0.012 - Math.cos(starAngle) * (radius * 1.6);
            nodes.push({
              id: globalId++,
              strandIndex: strands,
              nodeIndex: sn,
              x: sx,
              y: sy,
              depth: 1.0,
              submodel: 'Star Topper',
              worldX: Math.sin(starAngle) * radius * 4.2,
              worldY: (0.5 - sy) * 2.2,
              worldZ: 0.15,
            });
          }
        }
        break;
      }

      case 'PEX Arches': {
        const { archCount, nodesPerArch } = geom;
        const totalSpan = 0.90;
        const archSlotWidth = totalSpan / archCount;
        const baseY = 0.84;
        const canvasAspect = 16 / 9; // Aspect ratio compensation for true circular arch in pixel space

        for (let a = 0; a < archCount; a++) {
          const archCenter = 0.05 + (a + 0.5) * archSlotWidth;
          const archRadiusX = (archSlotWidth * 0.90) / 2;
          // Apply aspect ratio compensation so horizontal and vertical radius in pixels are equal
          const archRadiusY = Math.min(0.48, archRadiusX * canvasAspect);

          // Staggered 3D depth for tunnel/yard depth perspective
          const archZ = archCount > 1 ? (a / (archCount - 1) - 0.5) * 0.5 : 0;

          for (let n = 0; n < nodesPerArch; n++) {
            const nNorm = nodesPerArch > 1 ? n / (nodesPerArch - 1) : 0;
            
            // True smooth 180° / 190° half-circle arc-length parameterization
            // Starts slightly anchored below rebar foot (185°) to top crest (90°) to right foot (-5°)
            const sweepTotal = (190 * Math.PI) / 180; // 190 degrees
            const startAngle = (185 * Math.PI) / 180;
            const arcTheta = startAngle - nNorm * sweepTotal;
            
            const px = archCenter + Math.cos(arcTheta) * archRadiusX;
            const py = baseY - Math.sin(arcTheta) * archRadiusY;

            // 3D coordinates
            const wX = (px - 0.5) * 2.0;
            const wY = (0.5 - py) * 2.0;
            const wZ = archZ;

            nodes.push({
              id: globalId++,
              strandIndex: a,
              nodeIndex: n,
              x: px,
              y: py,
              depth: 0.5 + archZ * 0.4,
              submodel: `Arch ${a + 1}`,
              worldX: wX,
              worldY: wY,
              worldZ: wZ,
            });
          }
        }
        break;
      }

      case 'Matrix': {
        const { matrixRows, matrixCols } = geom;
        for (let r = 0; r < matrixRows; r++) {
          const rNorm = matrixRows > 1 ? r / (matrixRows - 1) : 0.5;
          const py = 0.1 + rNorm * 0.8;

          for (let c = 0; c < matrixCols; c++) {
            const cNorm = matrixCols > 1 ? c / (matrixCols - 1) : 0.5;
            const px = 0.08 + cNorm * 0.84;

            nodes.push({
              id: globalId++,
              strandIndex: r,
              nodeIndex: c,
              x: px,
              y: py,
              depth: 0.5,
              submodel: 'Matrix Surface',
            });
          }
        }
        break;
      }

      case 'Spinner / ChromaStar': {
        const { spinnerBlades, nodesPerBlade } = geom;
        const cx = 0.5;
        const cy = 0.5;
        const maxRadius = 0.4;

        for (let b = 0; b < spinnerBlades; b++) {
          const baseAngle = (b / spinnerBlades) * Math.PI * 2;

          for (let n = 0; n < nodesPerBlade; n++) {
            const nNorm = (n + 1) / nodesPerBlade;
            // Slight spiral twist
            const angle = baseAngle + nNorm * 0.4;
            const dist = nNorm * maxRadius;

            nodes.push({
              id: globalId++,
              strandIndex: b,
              nodeIndex: n,
              x: cx + Math.cos(angle) * dist,
              y: cy + Math.sin(angle) * dist,
              depth: 0.5,
              submodel: `Blade ${b + 1}`,
            });
          }
        }
        break;
      }

      default: {
        // Linear / Single Line / Roofline fallback
        const total = geom.nodesPerStrand || 100;
        for (let n = 0; n < total; n++) {
          const nNorm = n / (total - 1);
          nodes.push({
            id: globalId++,
            strandIndex: 0,
            nodeIndex: n,
            x: 0.08 + nNorm * 0.84,
            y: 0.5,
            depth: 0.5,
            submodel: 'Main Strand',
          });
        }
      }
    }

    return nodes;
  }
}
