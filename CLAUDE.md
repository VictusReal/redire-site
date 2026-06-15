# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

`redire-site` is a zero-dependency, single-file interactive 3D space exploration visualization. The entire application lives in `index.html` (~8,200 lines of vanilla JavaScript). There is no build step, no package manager, and no server — open `index.html` directly in a modern browser to run it.

## Running the App

```bash
# Open directly in browser (any modern browser with WebGL2 support)
open index.html           # macOS
xdg-open index.html       # Linux
start index.html          # Windows

# Or serve locally to avoid CORS issues with module imports
python3 -m http.server 8080
# then visit http://localhost:8080
```

There are no build, lint, or test commands — none exist in this project.

## Architecture

### Single-File Structure (`index.html`)

The file has three logical sections:

1. **Import map + CSS** — Three.js v0.170.0 loaded from CDN via `<script type="importmap">`. All styles are inline.
2. **DOM** — Loading screen, HUD overlay, mobile joystick controls, info cards.
3. **JavaScript module** (`<script type="module">`) — The entire application logic (~8,200 lines).

### Rendering Pipeline

```
Three.js WebGLRenderer
  └── EffectComposer (post-processing)
        ├── RenderPass
        ├── UnrealBloomPass (intensity 0.55)
        └── OutputPass (ACES Filmic tone mapping)
```

Custom `ShaderMaterial` is used for particle rendering (galaxies, accretion disc) and the animated Sun surface. Additive blending is standard for all glow/particle objects.

### Scene Object Registry

Three global arrays track interactive objects for the nearest-object HUD and click detection:
- `galaxyReg` — galaxy point clouds (Milky Way + 15 others)
- `nebReg` — nebula meshes (7 named nebulae)
- `ssObjects` — solar system bodies (Sun + 8 planets)

Each entry carries `{ name, mesh, type, description }` for the info card system.

### Key Subsystems

**Procedural generation** — Galaxies are `THREE.Points` with `BufferGeometry`. Star positions, colors, and sizes are computed at startup using logarithmic spiral math and stored directly in typed arrays as geometry attributes. Nebulae use randomized `SphereGeometry` clusters with color gradients.

**Sagittarius A\*** — Black hole visual composed of: black sphere (event horizon), `Points` accretion disc (80,000 particles with Doppler color shift), bloom-lit photon ring torus, and two elongated `CylinderGeometry` relativistic jets.

**Solar system** — 8 planets stored in a `planets[]` array. Each has `{ mesh, orbitRadius, speed, angle }`. Orbits are computed each frame in the animation loop. Saturn/Uranus have `RingGeometry`.

**Audio** — Web Audio API, lazy-initialized on first user gesture. Five drone oscillators (36 Hz sub-bass + harmonics), a convolver reverb, and low-pass filtered noise. Bass gain responds to distance from the Milky Way core.

**Auto-tour** — Array of 6 `{ position, target, name }` waypoints. Camera interpolates with a 9-second travel phase and 14-second dwell at each stop. Tour state is managed via a `tourActive` boolean and `tourPhase` enum.

**Mobile controls** — On-screen joystick (left side) drives movement; right-side touch drag drives camera look. A boost button overlays the joystick. All touch handlers use `pointerId` tracking.

### Global State

Key globals (not encapsulated in classes):
- `camera`, `renderer`, `scene`, `composer` — Three.js core objects
- `keys` — `{ w, a, s, d, q, e, shift, space, ctrl }` keyboard state map
- `isPointerLocked` — tracks pointer lock state for desktop mouse look
- `timeScale` — multiplier (1/10/100/1000×) for orbital/rotational animation speeds
- `nearestObj` — currently closest registry object, updated every 60 ms

### Performance Constraints

- Pixel ratio clamped to 2.0 (`Math.min(window.devicePixelRatio, 2)`)
- HUD updates throttled to 60 ms intervals (avoid per-frame DOM writes)
- All particles use a single `Points` object per galaxy (not individual meshes)
- Star field split into two `Points` objects (near: 8,000 stars; far: 100,000 stars)

## Conventions

- All coordinate units are **kiloparsecs** for galactic scale; the solar system uses an internal scale where 1 unit ≈ 1 AU but is not physically accurate relative to the galaxy.
- Camera movement speed is in **parsecs/second** and displayed on the HUD.
- Color values for stars use a temperature-based palette (blue/white = hot, orange/red = cool); accretion disc uses Doppler blue-shift (approaching side) and red-shift (receding side).
- The Sun shader uses a GLSL `snoise` function defined inline for animated surface detail — any edits to the Sun material must stay within that `ShaderMaterial`'s `vertexShader`/`fragmentShader` strings.
- Mobile breakpoint: `window.innerWidth < 768` at init time determines whether touch controls are shown.
