# xLights Vision 2.1: Multi-Session Workflow, Layer-by-Layer Recipes & Deep Refinement Engine

A comprehensive architectural plan upgrading xLights Vision with session history management, multi-layer sequencing instructions, live recipe preview rendering, touch-friendly viewport controls, multi-format palette exports, and genuine adaptive simulation optimization with backtracking.

---

## User Review & Critical Decisions

> [!IMPORTANT]
> The following operational preferences were confirmed during Phase 1:
> - **Multi-Layer Recipe Display**: Layer-by-layer timeline stack with step-by-step instructions detailing layer order, blending modes, submodel targets, and parameter values.
> - **Session History Management**: Top-bar session selector dropdown with quick switch, save, and reload for multi-prop and multi-video analysis runs.
> - **Color Palette Export**: Interactive export modal prompting the user to choose desired formats (xLights `.xpalette`, `.txt`, `.csv`) and select/unselect specific swatches.

- **Confirmed Decision 1**: The on-screen ROI HUD will be collapsible via an unobtrusive toggle button and relocated to an external status bar to keep the viewport completely unobstructed.
- **Confirmed Decision 2**: Prop geometry number inputs will use decoupled local draft strings with commit-on-blur validation, fixing the issue where users could not erase values. Geometry changes will immediately update the rendered physical model.
- **Confirmed Decision 3**: The self-grading simulation engine will be overhauled with genuine parameter delta mutation and adaptive backtracking (reverting if a pass scores worse than the previous best).
- **Confirmed Decision 4**: Users can click any recipe or iteration pass to immediately preview its emulated xLights rendering on the configured prop model.

---

## 1. Overview & Core Concept

### What It Delivers
xLights Vision 2.1 transforms the tool into a multi-session sequencing workstation where users can:
1. Frame any prop without visual obstruction (collapsible HUD, 44px touch handles, pinch/zoom/pan).
2. Save and switch between multiple analysis runs and prop slices across the same or different videos without losing progress.
3. Receive complete, multi-layer sequencing recipes with exact layer stacking, layer blending modes, submodel assignments, and parameter dials.
4. Preview any generated recipe in real time on the customized prop model.
5. Customize prop models (180° vs 360°, custom strand/arch counts) with immediate live updates and save them as named custom presets.
6. Export palettes in multiple xLights-compatible formats (`.xpalette`, `.txt`, `.csv`) and export recipes as readable guides (`.txt`) and `.xeffect` presets.
7. Experience true iterative refinement with monotonic improvement and backtracking.

---

## 2. User Experience & Visual Design

### Key User Flows

```
┌─────────────────────────────────────────────────────────────────────────────┐
│ 1. SESSION SELECTION & INGESTION                                            │
│    [Sessions: "Mega Tree Intro" ▼] [+ New Session] [Rename] [Save]          │
│    (Loads video, restores ROI, prop model, recipes, and iteration history)  │
└──────────────────────────────────────┬──────────────────────────────────────┘
                                       │
                                       ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│ 2. UNOBSTRUCTED VIEWPORT & TOUCH-FRIENDLY ROI                               │
│    - HUD Collapsible / Floating Mini-Bar (Viewport 100% visible)            │
│    - Pinch & Pan Navigation + 44px Touch Hitbox Handles                     │
│    - Prop Geometry Editor with "Save As New Preset" & Live Model Rendering  │
└──────────────────────────────────────┬──────────────────────────────────────┘
                                       │
                                       ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│ 3. VISION ANALYSIS & ADAPTIVE BACKTRACKING OPTIMIZER                        │
│    - Multi-pass simulation (Pass 1 -> 10) with genuine parameter mutation   │
│    - Backtracking algorithm: Reverts parameter if score degrades            │
│    - Real-time score progression (75% -> 84% -> 91% -> 96%)                 │
└──────────────────────────────────────┬──────────────────────────────────────┘
                                       │
                                       ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│ 4. MULTI-LAYER RECIPES & LIVE RECIPE PREVIEW                                │
│    - Step-by-Step Instructions: Layer 1 (Base) -> Layer 2 (Mask) -> Layer 3 │
│    - Click ANY Recipe to Preview simulated render on prop model             │
│    - Submodel requirements, Model Groups, and Buffer assignments            │
└──────────────────────────────────────┬──────────────────────────────────────┘
                                       │
                                       ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│ 5. EXPORT HUB                                                               │
│    - Multi-Format Palette Export Prompt (.xpalette XML, .txt hex, .csv)     │
│    - Export Recipe as Formatted Text Guide (.txt)                           │
│    - Export xLights Effect Presets (.xeffect)                               │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Visual Interface Enhancements
- **Viewport Clarity**: The semi-opaque ROI HUD box (`ROI: [x,y,w,h]`) is removed from blocking the video surface. It is replaced with an unobtrusive top-right toggle button (`HUD / Coordinates`) that slides out an optional slim telemetry bar only when requested.
- **Session Switcher**: Sleek header selector displaying the active session name, prop type, and video source, with a `+ New Prop Slice` button for analyzing multiple props from the same clip.
- **Layer Timeline Stack**: Each recipe renders an expandable vertical stack representing xLights Sequencer layers with colored badges for Layer Index (`Layer 1`, `Layer 2`), Blending Mode (`2 is Mask`, `Average`, `Normal`), and Submodel target (`Star Only`, `All Strands`).

---

## 3. Key Technical Decisions & System Architecture

### Decision 1: Multi-Session State Store
- **Structure**: Client-side session store persisting active runs to `localStorage` / memory:
  ```typescript
  interface AnalysisSession {
    id: string;
    name: string;
    createdAt: string;
    videoType: 'preset' | 'direct' | 'youtube' | 'stream';
    videoUrl?: string;
    videoId?: string;
    presetId?: string;
    roi: RoiBox;
    timeRange: { startMs: number; endMs: number };
    currentTimeMs: number;
    userConfig: UserContextConfig;
    analysisResult: AnalysisDeductionResult | null;
  }
  ```
- **Benefit**: Switching presets or clicking different prop models no longer destroys previous analysis progress. Users can switch between props and videos effortlessly.

### Decision 2: Multi-Layer Sequencing Synthesis Engine
- **Structure**: Upgrade recipe generation to produce structured multi-layer recipes:
  ```typescript
  interface SequencerLayerInstruction {
    layerIndex: number;
    layerName: string;
    effectName: string;
    blendingMode: LayerBlendingMode;
    submodelTarget: string;
    timing: { startMs: number; endMs: number; timingTrack: string };
    settings: Record<string, any>;
    valueCurves?: Record<string, any>;
    stepInstruction: string;
  }
  ```
- **Output**: Generates full multi-layer recipes specifying which effect goes on Layer 1 (base wash), Layer 2 (directional chase/bars/spirals with mask or blend), and Layer 3 (highlight/strobe/shimmer), with exact step-by-step reproduction instructions.

### Decision 3: Live Emulated Recipe Previewing
- **Mechanism**: Connect each recipe and iteration pass to the `XLightsSimulator`. Clicking a recipe card sets the active preview recipe, immediately rendering that exact effect and layer combination on the configured prop model in the preview canvas.

### Decision 4: Adaptive Refinement Loop with Backtracking
- **Problem**: Previously, iteration pass scores remained static because candidate parameter mutations were not properly propagated into the frame evaluator.
- **Solution**:
  - Implement active parameter perturbation (Speed $\pm 0.25$, Band Size $\pm 4$, Radial Arms $\pm 2$, Strobe Freq $\pm 4\text{Hz}$).
  - Track `bestScore` and `bestSettings`.
  - If a pass yields an inferior score, the optimizer **backtracks** to `bestSettings` and explores an alternate parameter axis, guaranteeing monotonic score improvement.

### Decision 5: Safe Text-Draft Input Management
- **Problem**: Number inputs with `Math.max(1, Number(e.target.value))` prevented users from backspacing/erasing existing numbers.
- **Solution**: Inputs maintain local string state (`draftValue`), permitting empty fields while typing. On `blur` or `Enter`, input validates and commits, displaying an inline warning if invalid rather than injecting random numbers.

### Decision 6: Multi-Format Palette Export Prompt
- **Formats Supported**:
  1. **xLights Palette XML (`.xpalette`)**: Formatted `<ColorPalette>` XML recognized by xLights palette import.
  2. **Plain Text Hex (`.txt`)**: Clean list of hex color codes with names and RGB coordinates.
  3. **Comma-Separated Values (`.csv`)**: Structured table (`Index, Hex, Name, R, G, B, Percentage`).
- **Prompt**: Modal dialog allows checking/unchecking individual colors and choosing one, two, or all three file formats for download.

---

## 4. Technical Architecture & Component Hierarchy

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              SESSION MANAGER                                │
│  - ActiveSessionId / SessionList Store                                      │
│  - State serialization & instant restoration                                │
│  - "+ New Prop Slice" (preserves video, creates new ROI slice)              │
└──────────────────────────────────────┬──────────────────────────────────────┘
                                       │
                                       ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                            FRONTEND COMPONENTS                              │
│                                                                             │
│  ┌───────────────────────┐  ┌────────────────────────────────────────────┐  │
│  │   Header & Sessions   │  │           VideoPlayerWithRoi               │  │
│  │  - Session Dropdown   │  │  - Collapsible Telemetry HUD (Unobstructed)│  │
│  │  - Save / Save As     │  │  - 44px Touch Hitbox Handles               │  │
│  │  - Format Exporters   │  │  - Pan & Zoom Viewport (0.5x to 5.0x)      │  │
│  └───────────┬───────────┘  └─────────────────────┬──────────────────────┘  │
│              │                                    │                         │
│              ▼                                    ▼                         │
│  ┌────────────────────────────────────────────────────────────────────────┐ │
│  │                     UserContextPanel & Modeler                         │ │
│  │  - Safe Draft Text Inputs (Commit on Blur)                             │ │
│  │  - Prop Geometry Editor (180°/360°, Strands, Arch count)               │ │
│  │  - Live Physical Prop Re-rendering & Custom Preset Naming              │ │
│  └───────────────────────────────────┬────────────────────────────────────┘ │
│                                      │                                      │
│                                      ▼                                      │
│  ┌────────────────────────────────────────────────────────────────────────┐ │
│  │             Closed-Loop Simulator & Backtracking Optimizer             │ │
│  │  - Multi-Layer Frame Simulator (XLightsSimulator)                     │ │
│  │  - Adaptive Mutation Engine with Backtracking to best state            │ │
│  │  - Click ANY Recipe to Preview live emulated render                    │ │
│  └───────────────────────────────────┬────────────────────────────────────┘ │
│                                      │                                      │
│                                      ▼                                      │
│  ┌────────────────────────────────────────────────────────────────────────┐ │
│  │                     Multi-Layer Recipe Generator                       │ │
│  │  - Layer-by-Layer Timeline Stack (Layer 1, Layer 2, Layer 3)           │ │
│  │  - Step-by-Step Instructions & Submodel / Group recommendations        │ │
│  │  - Palette Exporter Prompt (.xpalette, .txt, .csv)                     │ │
│  │  - Effect Preset (.xeffect) & Recipe Guide (.txt) Export               │ │
│  └────────────────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 5. Implementation Phasing

1. **Phase 1: Session Management & Viewport Clarity**:
   - Relocate the ROI HUD overlay box to an optional collapsible toggle.
   - Implement the Top-Bar Session Selector dropdown with save, switch, and reload for multi-prop analysis runs.
   - Enlarge touch handles with $\ge 44\text{px}$ hitboxes for mobile touch interaction.

2. **Phase 2: Prop Geometry Editor & Safe Draft Inputs**:
   - Refactor geometry number fields to use safe draft strings with commit-on-blur validation.
   - Enable live visual re-rendering of updated physical geometry in the simulator.
   - Implement preset renaming and "Save As New Preset".

3. **Phase 3: Multi-Layer Recipe Decomposition & Live Recipe Previewing**:
   - Generate structured multi-layer recipes detailing Layer Index, Blending Modes, and Submodel targets.
   - Enable clicking any recipe to immediately render its emulated preview on the prop model.

4. **Phase 4: Adaptive Refinement Engine with Backtracking**:
   - Overhaul the simulation scorer with genuine parameter mutation across passes.
   - Implement backtrack logic so scores dynamically increase toward the user's target threshold.

5. **Phase 5: Multi-Format Palette & Recipe Export**:
   - Build the Color Palette Export modal prompting for format choice (`.xpalette`, `.txt`, `.csv`) and color selection.
   - Add Recipe Text Guide (`.txt`) and `.xeffect` preset downloads.
   - Verification and compilation check.
