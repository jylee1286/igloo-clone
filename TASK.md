# Build an Igloo.inc Clone — Immersive 3D WebGL Experience

## Reference
The target site is https://www.igloo.inc/ — a full-screen immersive 3D WebGL experience featuring:
- A detailed 3D igloo model centered on screen
- Scroll-driven camera orbit (scroll rotates the camera around the igloo)
- Snowy mountainous landscape/environment
- Atmospheric fog/haze for depth
- Cool desaturated monochromatic color palette (grey/white/blue)
- Monospace terminal-style typography overlay
- Fixed UI: logo top-left, manifesto top-right, "Scroll down to discover" bottom-left, sound toggle bottom-left
- `//////` prefix on section headers
- Ambient background audio with toggle
- Loading screen with animated text before 3D loads

## 3D Model
A refined igloo 3D model has already been generated and is at:
`/Users/jeremylee/.openclaw/workspace/models/`

BUT — for this project, generate a NEW igloo model using Meshy AI:
```bash
cd /tmp/igloo-clone
source /Users/jeremylee/.openclaw/workspace/.env.local
python3 /Users/jeremylee/.openclaw/workspace/meshy.py text "a detailed realistic igloo made of ice blocks on a snowy hill, arctic environment, photorealistic" -n "low quality, cartoon, blurry, ugly" -s realistic -o ./public/models
```
Wait for it to complete (takes ~3-5 min). Use the refined_model.glb.

## Tech Stack
- **Vite** + vanilla JS (no React needed — keep it lean)
- **Three.js** for WebGL rendering
- **GSAP** + ScrollTrigger for scroll-driven animations
- All in a single page

## Required Components

### 1. Loading Screen
- Full screen, grey background
- Animated loading text (like igloo.inc's `--==+==--=` style)
- Fades out when 3D scene is ready

### 2. 3D Scene (Three.js)
- Load the igloo .glb model via GLTFLoader
- Create a snowy ground plane (large, with snow-like material — white/grey with subtle noise)
- Add distant mountains (can use simple geometry with fog to fake depth)
- **Lighting:** Ambient light (cool blue-grey) + directional light for rim highlights on the igloo
- **Fog:** Exponential fog, matching the monochromatic palette
- **Sky:** Gradient sky or solid grey-blue

### 3. Scroll-Driven Camera Orbit
- Hijack scroll (page has large scroll height but content is fixed)
- Map scroll position to camera orbit angle around the igloo
- Smooth easing on the camera movement
- Camera should slowly orbit 360° over the full scroll range

### 4. UI Overlay (Fixed Position)
- **Top-left:** "IGLOO" logo in bold monospace + "// Copyright © 2026" + "Igloo, Inc. All Rights Reserved."
- **Top-right:** "////// Manifesto" header + manifesto text in monospace
- **Bottom-left:** "Scroll down to discover." + "🔊 Sound: On" toggle
- All text white, monospace font (use `'Space Mono'` or similar from Google Fonts)
- Text has slight text-shadow for readability over 3D

### 5. Ambient Sound
- Use a royalty-free arctic wind/ambient sound (find a URL or generate a simple one)
- Auto-play on user interaction (click anywhere)
- Toggle button in bottom-left
- Use Web Audio API or simple <audio> element

### 6. Responsive
- Works on desktop and mobile
- On mobile, touch scroll drives the camera

## File Structure
```
/tmp/igloo-clone/
├── index.html
├── package.json
├── vite.config.js
├── public/
│   └── models/
│       └── refined_model.glb (from Meshy)
├── src/
│   ├── main.js          (entry point)
│   ├── scene.js          (Three.js scene setup)
│   ├── controls.js       (scroll-driven camera)
│   ├── ui.js             (overlay UI)
│   ├── audio.js          (ambient sound)
│   ├── loader.js         (loading screen)
│   └── style.css         (all styles)
└── vercel.json
```

## Quality Bar
This needs to look PREMIUM. Think:
- Smooth 60fps
- Beautiful lighting that makes the igloo glow
- Fog that creates real depth
- Typography that feels intentional
- The kind of site that makes someone say "how did they build this?"

## After Building
1. Test locally with `npm run dev`
2. Make sure it loads, renders, scrolls, and sounds work
3. Commit everything to git
4. DO NOT deploy — just make sure it builds with `npm run build`
