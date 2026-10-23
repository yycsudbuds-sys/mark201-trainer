// The war table: a Three.js scene (lazy-loaded from jsDelivr, only on #/campaign) of a heavy wooden table with a
// painted relief map of the Roman world. Real coastline, soft mountain relief, an animated sea with triremes, the
// eight provinces with state shown by material (fog / gold rim / crimson), raised roads, capitals from primitives,
// a legion token, HTML labels with a collision pass, hover lift, a 1.2 s dolly into a province whose battle road
// then unfolds into forts, and the reverse on Back. Everything reads existing engine data; nothing is written.
import { h } from './ui.js';
import { loadGeo, makeProjection, PROV, ORDER, ROADS, SEA_LANES, ROMAN, paintColorMap, paintDataMap, paintNoise, sampleData, smoothPath, alongPath, centroid, provinceBounds } from './geo.js';
import { createLabelLayer } from './maplabels.js';
import { chapterProgress, provinceState, nextIsland } from './map.js';
import { masteryLevel } from './engine.js';

const THREE_URL = 'https://cdn.jsdelivr.net/npm/three@0.160.1/build/three.module.js';
let threeP = null;
export function loadThree() { return threeP || (threeP = import(/* @vite-ignore */ THREE_URL)); }
export function webglOk() { try { const c = document.createElement('canvas'); return !!(c.getContext('webgl2') || c.getContext('webgl')); } catch { return false; } }
/** Use the 3D table unless WebGL is missing, motion is off or reduced, the device looks weak, or the player turned it off. */
export function wantsWarTable(app, cosmetic) {
  if (cosmetic && cosmetic.warTable3d === false) return false;
  if (app.state.settings.motion === false) return false;
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return false;
  if (navigator.deviceMemory && navigator.deviceMemory < 2) return false;
  if (navigator.hardwareConcurrency && navigator.hardwareConcurrency <= 2) return false;
  return webglOk();
}

const easeInOut = t => t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
const easeOut = t => 1 - Math.pow(1 - t, 3);
const spring = t => 1 - Math.exp(-6 * t) * Math.cos(9 * t);

export async function createWarTable(app, opts = {}) {
  const THREE = await loadThree();
  const geo = await loadGeo();
  const proj = makeProjection(geo.bbox, 64);
  const W = proj.W, Hh = proj.H;
  const el = h('div', { class: 'wartable' });
  const canvas = h('canvas', { class: 'wartable-canvas' });
  el.appendChild(canvas);
  const labels = createLabelLayer(el);
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: 'high-performance' });
  renderer.setPixelRatio(Math.min(2, window.devicePixelRatio || 1));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(40, 1, 0.5, 400);
  const uTime = { value: 0 };
  const night = () => (app.state.settings.theme || 'dark') !== 'light';

  // ---- textures
  const TW = 2048, TH = Math.round(TW * Hh / W);
  const colorCanvas = document.createElement('canvas'); colorCanvas.width = TW; colorCanvas.height = TH;
  const dataCanvas = document.createElement('canvas'); dataCanvas.width = TW; dataCanvas.height = TH;
  const noiseCanvas = document.createElement('canvas'); noiseCanvas.width = 256; noiseCanvas.height = 256;
  paintColorMap(colorCanvas, geo, { next: nextIsland(app) });
  const dm = paintDataMap(dataCanvas, geo);
  paintNoise(noiseCanvas, 3);
  const colorTex = new THREE.CanvasTexture(colorCanvas); colorTex.colorSpace = THREE.SRGBColorSpace; colorTex.anisotropy = Math.min(8, renderer.capabilities.getMaxAnisotropy());
  const dataTex = new THREE.CanvasTexture(dataCanvas); dataTex.colorSpace = THREE.NoColorSpace; dataTex.minFilter = THREE.LinearFilter; dataTex.generateMipmaps = false;
  const noiseTex = new THREE.CanvasTexture(noiseCanvas); noiseTex.wrapS = noiseTex.wrapT = THREE.RepeatWrapping; noiseTex.colorSpace = THREE.NoColorSpace;

  // ---- helpers: lon/lat -> world
  const HEIGHT = 1.4, BASE = 0.32; // the land is a raised vellum plate; ridges rise above it
  const heightAt = (lon, lat) => { const s = sampleData(dm, lon, lat); return s.land ? BASE + s.height01 * HEIGHT : 0; };
  const world = (lon, lat, up = 0) => { const [x, y] = proj.toXY(lon, lat); return new THREE.Vector3(x, heightAt(lon, lat) + up, -y); };

  // ---- land
  const provState = new Float32Array(13), dissolve = new Float32Array(13);
  const landUniforms = { colorMap: { value: colorTex }, dataMap: { value: dataTex }, noiseMap: { value: noiseTex }, time: uTime, heightScale: { value: HEIGHT }, baseH: { value: BASE }, hoverId: { value: 0 }, liftAmt: { value: 0 }, focusId: { value: 0 }, dimOthers: { value: 0 }, provState: { value: provState }, dissolve: { value: dissolve }, lightDir: { value: new THREE.Vector3(-0.45, 0.8, -0.35).normalize() }, texel: { value: new THREE.Vector2(1 / TW, 1 / TH) }, nightMix: { value: 1 } };
  const landMat = new THREE.ShaderMaterial({ uniforms: landUniforms, vertexShader: `
    uniform sampler2D dataMap; uniform float heightScale; uniform float baseH; uniform float hoverId; uniform float liftAmt;
    varying vec2 vUv; varying float vH;
    void main() { vUv = uv; vec4 d = texture2D(dataMap, uv); float land = step(0.01, d.g); float hgt = baseH + max(d.r - 90.0 / 255.0, 0.0) * heightScale;
      float id = floor(d.b * 255.0 / 20.0 + 0.5); float lift = abs(id - hoverId) < 0.5 ? liftAmt : 0.0;
      vec3 p = position + vec3(0.0, 0.0, hgt + lift * land); vH = hgt;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(p, 1.0); }`,
    fragmentShader: `
    uniform sampler2D colorMap; uniform sampler2D dataMap; uniform sampler2D noiseMap; uniform float time; uniform float hoverId; uniform float focusId; uniform float dimOthers;
    uniform float provState[13]; uniform float dissolve[13]; uniform vec3 lightDir; uniform vec2 texel; uniform float nightMix;
    varying vec2 vUv; varying float vH;
    void main() { vec4 d = texture2D(dataMap, vUv); if (d.g < 0.02) discard; vec3 col = texture2D(colorMap, vUv).rgb;
      float hl = texture2D(dataMap, vUv - vec2(texel.x, 0.0)).r, hr = texture2D(dataMap, vUv + vec2(texel.x, 0.0)).r, hd = texture2D(dataMap, vUv - vec2(0.0, texel.y)).r, hu = texture2D(dataMap, vUv + vec2(0.0, texel.y)).r;
      vec3 n = normalize(vec3((hl - hr) * 13.0, 1.0, (hd - hu) * 13.0)); float diff = max(dot(n, lightDir), 0.0);
      col *= mix(0.7 + 0.26 * diff, 0.54 + 0.4 * diff, nightMix);
      float id = floor(d.b * 255.0 / 20.0 + 0.5); int ii = int(id); float st = 0.0; float dis = 0.0;
      for (int k = 0; k < 13; k++) { if (k == ii) { st = provState[k]; dis = dissolve[k]; } }
      float edge = clamp((1.0 - d.g) * 255.0 / 127.0, 0.0, 1.0);
      float nz = texture2D(noiseMap, vUv * 6.0 + vec2(time * 0.012, -time * 0.008)).r;
      if (id > 0.5) {
        if (st < 0.5) { float fog = 0.4 + 0.32 * nz; vec3 grey = vec3(dot(col, vec3(0.333))) * 0.75 + 0.12; col = mix(col, mix(grey, vec3(0.64, 0.62, 0.58), 0.5), fog); }
        else if (st < 1.5) { float pulse = 0.65 + 0.35 * sin(time * 2.2); float rim = smoothstep(0.25, 1.0, edge) * pulse; col += vec3(0.79, 0.64, 0.15) * rim * 0.95; col += vec3(0.06, 0.04, 0.0) * pulse * 0.5; }
        else { float m = step(nz * 0.9 + 0.05, dis); col = mix(col, mix(col, vec3(0.55, 0.12, 0.12), 0.55), m); float rim = smoothstep(0.5, 1.0, edge); col += vec3(0.35, 0.06, 0.05) * rim * m; }
        if (abs(id - hoverId) < 0.5) col += vec3(0.07, 0.06, 0.04);
        if (focusId > 0.5 && abs(id - focusId) > 0.5) { vec3 g2 = vec3(dot(col, vec3(0.333))); col = mix(col, g2 * 0.55, dimOthers); }
      } else if (focusId > 0.5) { vec3 g2 = vec3(dot(col, vec3(0.333))); col = mix(col, g2 * 0.6, dimOthers * 0.85); }
      gl_FragColor = vec4(col, 1.0);
      #include <colorspace_fragment>
    }` });
  const landGeo = new THREE.PlaneGeometry(W, Hh, 190, Math.round(190 * Hh / W));
  const land = new THREE.Mesh(landGeo, landMat); land.rotation.x = -Math.PI / 2; scene.add(land);

  // ---- sea
  const seaMat = new THREE.ShaderMaterial({ transparent: true, uniforms: { time: uTime, lightDir: landUniforms.lightDir, nightMix: landUniforms.nightMix, camPos: { value: camera.position } }, vertexShader: `
    uniform float time; varying vec3 vW; varying vec2 vUv;
    float wave(vec2 p) { return 0.05 * sin(p.x * 0.8 + time * 0.6) + 0.04 * sin(p.y * 1.1 - time * 0.5) + 0.03 * sin((p.x + p.y) * 0.5 + time * 0.9); }
    void main() { vUv = uv; vec3 p = position; p.z += wave(position.xy); vec4 w = modelMatrix * vec4(p, 1.0); vW = w.xyz; gl_Position = projectionMatrix * viewMatrix * w; }`,
    fragmentShader: `
    uniform float time; uniform vec3 lightDir; uniform vec3 camPos; uniform float nightMix; varying vec3 vW; varying vec2 vUv;
    float wave(vec2 p) { return 0.05 * sin(p.x * 0.8 + time * 0.6) + 0.04 * sin(p.y * 1.1 - time * 0.5) + 0.03 * sin((p.x + p.y) * 0.5 + time * 0.9); }
    void main() { vec2 p = vec2(vW.x, -vW.z); float e = 0.15; float hx = wave(p + vec2(e, 0.0)) - wave(p - vec2(e, 0.0)); float hz = wave(p + vec2(0.0, e)) - wave(p - vec2(0.0, e));
      vec3 n = normalize(vec3(-hx * 6.0, 1.0, -hz * 6.0)); vec3 v = normalize(camPos - vW); vec3 hv = normalize(lightDir + v);
      float spec = pow(max(dot(n, hv), 0.0), 70.0) * 0.4; float diff = 0.7 + 0.3 * max(dot(n, lightDir), 0.0);
      vec3 base = mix(vec3(0.60, 0.60, 0.49), vec3(0.40, 0.52, 0.53), 0.45 + 0.25 * sin(vUv.y * 9.0 + time * 0.2)); base = mix(base * 1.1, base * 0.8, nightMix);
      float lines = 0.03 * sin((wave(p) * 60.0) + p.x * 3.0); vec3 col = base * diff + spec + lines;
      gl_FragColor = vec4(col, 1.0);
      #include <colorspace_fragment>
    }` });
  const sea = new THREE.Mesh(new THREE.PlaneGeometry(W * 1.6, Hh * 1.6, 100, 90), seaMat); sea.rotation.x = -Math.PI / 2; sea.position.y = -0.03; scene.add(sea);

  // ---- table
  const woodCanvas = document.createElement('canvas'); woodCanvas.width = 1024; woodCanvas.height = 1024;
  { const c = woodCanvas.getContext('2d'); const g = c.createLinearGradient(0, 0, 1024, 0); g.addColorStop(0, '#5A3F22'); g.addColorStop(0.5, '#6B4B2A'); g.addColorStop(1, '#4A3418'); c.fillStyle = g; c.fillRect(0, 0, 1024, 1024);
    for (let i = 0; i < 9; i++) { c.fillStyle = `rgba(0,0,0,${0.12 + (i % 2) * 0.08})`; c.fillRect(0, i * 114, 1024, 4); } c.strokeStyle = 'rgba(30,18,8,0.35)'; c.lineWidth = 1.2;
    for (let i = 0; i < 160; i++) { const y = Math.random() * 1024; c.beginPath(); c.moveTo(0, y); for (let x = 0; x <= 1024; x += 64) c.lineTo(x, y + Math.sin(x / 90 + i) * 4); c.stroke(); } }
  const woodTex = new THREE.CanvasTexture(woodCanvas); woodTex.colorSpace = THREE.SRGBColorSpace; woodTex.wrapS = woodTex.wrapT = THREE.RepeatWrapping; woodTex.repeat.set(2, 2);
  const table = new THREE.Mesh(new THREE.BoxGeometry(W * 1.7, 1.4, Hh * 1.7), new THREE.MeshStandardMaterial({ map: woodTex, roughness: 0.85, metalness: 0.05 })); table.position.y = -1.12; scene.add(table);
  const rimMat = new THREE.MeshStandardMaterial({ color: 0x2a1c0e, roughness: 0.9 });
  [[0, -Hh * 0.81, W * 1.7, 0.6], [0, Hh * 0.81, W * 1.7, 0.6], [-W * 0.835, 0, 0.6, Hh * 1.7], [W * 0.835, 0, 0.6, Hh * 1.7]].forEach(([x, z, w, d]) => { const r = new THREE.Mesh(new THREE.BoxGeometry(w, 0.32, d), rimMat); r.position.set(x, -0.3, z); scene.add(r); });

  // ---- lights
  const hemi = new THREE.HemisphereLight(0xfff1d6, 0x3a2a1a, 0.9); scene.add(hemi);
  const sun = new THREE.DirectionalLight(0xffe2b0, 1.3); sun.position.set(-30, 60, -22); scene.add(sun);
  const torch = new THREE.PointLight(0xffb347, 60, 90, 1.6); torch.position.set(-W * 0.5, 14, Hh * 0.55); scene.add(torch);
  function applyTheme() { const n = night(); landUniforms.nightMix.value = n ? 1 : 0.15; hemi.intensity = n ? 0.9 : 1.5; sun.intensity = n ? 1.3 : 1.9; sun.color.set(n ? 0xffe2b0 : 0xfff6e0); torch.intensity = n ? 60 : 10; }
  applyTheme();

  // ---- materials shared by models
  const M = { marble: new THREE.MeshStandardMaterial({ color: 0xece6da, roughness: 0.7 }), stone: new THREE.MeshStandardMaterial({ color: 0xa89d8a, roughness: 0.85 }), roof: new THREE.MeshStandardMaterial({ color: 0xb5623a, roughness: 0.8 }), wood: new THREE.MeshStandardMaterial({ color: 0x5a3f22, roughness: 0.9 }), gold: new THREE.MeshStandardMaterial({ color: 0xc9a227, roughness: 0.35, metalness: 0.6 }), iron: new THREE.MeshStandardMaterial({ color: 0x5a5a5e, roughness: 0.6, metalness: 0.4 }), cream: new THREE.MeshStandardMaterial({ color: 0xe6d3a8, roughness: 0.9 }), red: new THREE.MeshStandardMaterial({ color: 0x8b1e1e, roughness: 0.8 }), skin: new THREE.MeshStandardMaterial({ color: 0x8a5a3c, roughness: 0.8 }), road: new THREE.MeshStandardMaterial({ color: 0x6b4b2a, roughness: 0.95 }), roadTop: new THREE.MeshStandardMaterial({ color: 0xc8ae78, roughness: 0.9 }) };
  function clothMat(color, opacity = 1) { return new THREE.ShaderMaterial({ side: THREE.DoubleSide, transparent: opacity < 1, uniforms: { time: uTime, color: { value: new THREE.Color(color) }, opacity: { value: opacity } }, vertexShader: `uniform float time; varying vec2 vUv; void main() { vUv = uv; vec3 p = position; float k = uv.x; p.z += sin(uv.x * 7.0 + time * 6.0) * 0.06 * k; p.y += sin(uv.x * 5.0 + time * 4.0) * 0.02 * k; gl_Position = projectionMatrix * modelViewMatrix * vec4(p, 1.0); }`, fragmentShader: `uniform vec3 color; uniform float opacity; uniform float time; varying vec2 vUv; void main() { float sh = 0.85 + 0.15 * sin(vUv.x * 7.0 + time * 6.0); gl_FragColor = vec4(color * sh, opacity);
#include <colorspace_fragment>
}` }); }
  const cloth = { red: clothMat(0x8b1e1e), grey: clothMat(0x8c8c90, 0.6), cream: clothMat(0xf0e1bc), gold: clothMat(0xc9a227) };
  const roofShape = new THREE.Shape([new THREE.Vector2(-0.8, 0), new THREE.Vector2(0.8, 0), new THREE.Vector2(0, 0.42)]);
  const roofGeo = new THREE.ExtrudeGeometry(roofShape, { depth: 1.05, bevelEnabled: false }); roofGeo.translate(0, 0, -0.525);
  const G = { col: new THREE.CylinderGeometry(0.07, 0.07, 0.55, 8), base: new THREE.BoxGeometry(1.5, 0.18, 1.0), wall: new THREE.CylinderGeometry(1.3, 1.3, 0.26, 24, 1, true), tower: new THREE.CylinderGeometry(0.15, 0.16, 0.5, 8), gate: new THREE.BoxGeometry(0.34, 0.3, 0.2), pole: new THREE.CylinderGeometry(0.02, 0.02, 0.6, 5), cloth: new THREE.PlaneGeometry(0.34, 0.2, 6, 2), eagleBody: new THREE.ConeGeometry(0.12, 0.26, 6), wing: new THREE.BoxGeometry(0.3, 0.03, 0.1), fortWall: new THREE.CylinderGeometry(0.44, 0.44, 0.26, 10, 1, true), fortTower: new THREE.BoxGeometry(0.12, 0.42, 0.12), tent: new THREE.ConeGeometry(0.14, 0.22, 4), hull: new THREE.BoxGeometry(0.9, 0.18, 0.28), bow: new THREE.BoxGeometry(0.3, 0.12, 0.18), mast: new THREE.CylinderGeometry(0.015, 0.015, 0.62, 4), sail: new THREE.PlaneGeometry(0.46, 0.38, 6, 2), body: new THREE.CylinderGeometry(0.12, 0.17, 0.44, 8), head: new THREE.SphereGeometry(0.1, 8, 8), helm: new THREE.ConeGeometry(0.11, 0.14, 8), tokenCloth: new THREE.PlaneGeometry(0.42, 0.26, 6, 2) };
  G.cloth.translate(0.17, 0, 0); G.tokenCloth.translate(0.21, 0, 0); G.sail.translate(0.23, 0, 0);
  function standard(mat, scale = 1) { const g = new THREE.Group(); const p = new THREE.Mesh(G.pole, M.gold); p.position.y = 0.3; g.add(p); const c = new THREE.Mesh(G.cloth, mat); c.position.set(0, 0.5, 0); g.add(c); g.scale.setScalar(scale); return g; }
  function eagleStandard() { const g = new THREE.Group(); const p = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 1.3, 6), M.gold); p.position.y = 0.65; g.add(p); const b = new THREE.Mesh(G.eagleBody, M.gold); b.position.y = 1.4; g.add(b); const w1 = new THREE.Mesh(G.wing, M.gold); w1.position.set(0, 1.36, 0); w1.rotation.z = 0.25; g.add(w1); const w2 = w1.clone(); w2.rotation.z = -0.25; g.add(w2); const v = new THREE.Mesh(new THREE.BoxGeometry(0.34, 0.2, 0.02), M.red); v.position.y = 1.1; g.add(v); return g; }
  function capitalModel() { const g = new THREE.Group();
    const walls = new THREE.Mesh(G.wall, new THREE.MeshStandardMaterial({ color: 0xa89d8a, roughness: 0.85, side: THREE.DoubleSide })); walls.position.y = 0.13; g.add(walls);
    for (let i = 0; i < 4; i++) { const t = new THREE.Mesh(G.tower, M.stone); const a = i * Math.PI / 2 + Math.PI / 4; t.position.set(Math.cos(a) * 1.3, 0.25, Math.sin(a) * 1.3); g.add(t); }
    const gate = new THREE.Mesh(G.gate, M.wood); gate.position.set(0, 0.15, 1.3); g.add(gate);
    const base = new THREE.Mesh(G.base, M.marble); base.position.y = 0.09; g.add(base);
    [[-0.55, -0.32], [0, -0.32], [0.55, -0.32], [-0.55, 0.32], [0, 0.32], [0.55, 0.32]].forEach(([x, z]) => { const c = new THREE.Mesh(G.col, M.marble); c.position.set(x, 0.45, z); g.add(c); });
    const roof = new THREE.Mesh(roofGeo, M.roof); roof.position.y = 0.72; roof.rotation.y = Math.PI / 2; g.add(roof);
    return g; }
  function fortModel() { const g = new THREE.Group(); const w = new THREE.Mesh(G.fortWall, new THREE.MeshStandardMaterial({ color: 0x9a7448, roughness: 0.9, side: THREE.DoubleSide })); w.position.y = 0.13; g.add(w);
    for (let i = 0; i < 4; i++) { const t = new THREE.Mesh(G.fortTower, new THREE.MeshStandardMaterial({ color: 0x7a5a33, roughness: 0.9 })); const a = i * Math.PI / 2 + Math.PI / 4; t.position.set(Math.cos(a) * 0.44, 0.21, Math.sin(a) * 0.44); g.add(t); }
    [[-0.14, -0.1], [0.12, 0.08], [0.02, -0.18]].forEach(([x, z]) => { const t = new THREE.Mesh(G.tent, M.cream); t.position.set(x, 0.11, z); t.rotation.y = Math.PI / 4; g.add(t); });
    const gate = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.2, 0.08), M.iron); gate.position.set(0, 0.1, 0.44); g.add(gate); return g; }
  function tokenModel() { const g = new THREE.Group(); const b = new THREE.Mesh(G.body, M.red); b.position.y = 0.22; g.add(b); const hd = new THREE.Mesh(G.head, M.skin); hd.position.y = 0.52; g.add(hd); const hm = new THREE.Mesh(G.helm, M.gold); hm.position.y = 0.62; g.add(hm); const p = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 1.0, 5), M.gold); p.position.set(0.18, 0.5, 0); g.add(p); const c = new THREE.Mesh(G.tokenCloth, cloth.red); c.position.set(0.18, 0.86, 0); g.add(c); const e = new THREE.Mesh(G.eagleBody, M.gold); e.position.set(0.18, 1.08, 0); e.scale.setScalar(0.8); g.add(e); return g; }
  function triremeModel() { const g = new THREE.Group(); g.add(new THREE.Mesh(G.hull, M.wood)); const bow = new THREE.Mesh(G.bow, M.wood); bow.position.set(0.55, 0.02, 0); bow.rotation.z = 0.3; g.add(bow); const m = new THREE.Mesh(G.mast, M.wood); m.position.y = 0.38; g.add(m); const s = new THREE.Mesh(G.sail, cloth.cream); s.position.set(0, 0.42, 0); s.rotation.y = Math.PI / 2; g.add(s); const oars = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.02, 0.5), M.wood); oars.position.y = 0.05; g.add(oars); return g; }

  // ---- roads between capitals
  const roadGroup = new THREE.Group(); scene.add(roadGroup);
  const roadCurves = new Map();
  for (const rd of ROADS) { const path = smoothPath(rd.pts, 56); const pts = path.map(p => world(p[0], p[1], 0.1)); const curve = new THREE.CatmullRomCurve3(pts); roadCurves.set(rd.to, curve);
    const tube = new THREE.Mesh(new THREE.TubeGeometry(curve, 72, 0.12, 6, false), M.road); roadGroup.add(tube);
    const top = new THREE.Mesh(new THREE.TubeGeometry(curve, 72, 0.055, 5, false), M.roadTop); top.position.y = 0.05; roadGroup.add(top); }
  // marching dust on the next road
  const dustN = 70; const dustGeo = new THREE.BufferGeometry(); const dustPos = new Float32Array(dustN * 3); dustGeo.setAttribute('position', new THREE.BufferAttribute(dustPos, 3));
  const dust = new THREE.Points(dustGeo, new THREE.PointsMaterial({ color: 0xe6d3a8, size: 0.42, transparent: true, opacity: 0.7, depthWrite: false })); scene.add(dust);
  const dustT = Array.from({ length: dustN }, () => Math.random());

  // ---- capitals, standards rings, eagles, token
  const capitals = new Map();
  for (const num of ORDER) { const pv = PROV[num]; const g = new THREE.Group(); g.position.copy(world(pv.cap[0], pv.cap[1], 0)); g.userData = { capital: num }; const model = capitalModel(); model.scale.setScalar(0.72); g.add(model);
    const ring = new THREE.Group(); g.add(ring); const eagle = eagleStandard(); eagle.visible = false; g.add(eagle);
    scene.add(g); capitals.set(num, { group: g, model, ring, eagle, baseScale: 1 }); }
  const token = tokenModel(); scene.add(token);
  const triremes = SEA_LANES.map((lane, i) => { const pts = lane.map(p => { const [x, y] = proj.toXY(p[0], p[1]); return new THREE.Vector3(x, 0.02, -y); }); const curve = new THREE.CatmullRomCurve3(pts, true); const m = triremeModel(); m.scale.setScalar(0.9); scene.add(m); return { curve, mesh: m, t: i * 0.23 }; });

  // ---- province view objects (built on zoom)
  let prov = { num: 0, forts: [], road: null, roadTop: null, group: null, built: 0 };
  function buildProvince(num) {
    clearProvince();
    const ch = app.index.chapter.get(num); const pv = PROV[num]; const group = new THREE.Group(); scene.add(group);
    const path = smoothPath(pv.road, 64); const pts = path.map(p => world(p[0], p[1], 0.1)); const curve = new THREE.CatmullRomCurve3(pts);
    const road = new THREE.Mesh(new THREE.TubeGeometry(curve, 96, 0.1, 6, false), M.road); road.geometry.setDrawRange(0, 0); group.add(road);
    const roadTop = new THREE.Mesh(new THREE.TubeGeometry(curve, 96, 0.045, 5, false), M.roadTop); roadTop.position.y = 0.04; roadTop.geometry.setDrawRange(0, 0); group.add(roadTop);
    const forts = ch.topics.map((t, i) => { const [lon, lat] = alongPath(path, (i + 1) / (ch.topics.length + 1)); const g = new THREE.Group(); g.position.copy(world(lon, lat, 0)); const model = fortModel(); g.add(model); g.userData = { topic: t, index: i }; model.scale.set(2, 0.01, 2);
      const cleared = !!app.state.campaign.topics[t.id]?.cleared; const std = standard(cleared ? cloth.red : cloth.grey, cleared ? 1.6 : 1); std.position.set(0.8, 0, -0.5); std.visible = cleared; g.add(std); group.add(g);
      return { group: g, model, std, topic: t, index: i, cleared, pos: [lon, lat] }; });
    prov = { num, forts, road, roadTop, group, built: performance.now(), curve };
  }
  function clearProvince() { if (prov.group) { scene.remove(prov.group); prov.group.traverse(o => { if (o.geometry && o.geometry !== G.fortWall && o.geometry !== G.fortTower && o.geometry !== G.tent && o.geometry !== G.pole && o.geometry !== G.cloth) o.geometry.dispose && o.geometry.dispose(); }); } prov = { num: 0, forts: [], road: null, roadTop: null, group: null, built: 0 }; }

  // ---- progress -> materials and models
  let lastSnapshot = null;
  function refresh({ animate = true } = {}) {
    const next = nextIsland(app); const snap = {};
    for (const num of ORDER) { const ch = app.index.chapter.get(num); const st = provinceState(app, ch); const p = chapterProgress(app, ch);
      provState[num] = st === 'locked' ? 0 : st === 'open' ? 1 : 2; snap[num] = { st, cleared: ch.topics.filter(t => app.state.campaign.topics[t.id]?.cleared).map(t => t.id) };
      const cap = capitals.get(num); cap.eagle.visible = st === 'conquered';
      // standards ring: one small standard per battle, red when planted
      cap.ring.clear(); ch.topics.forEach((t, i) => { const a = -Math.PI / 2 + (i / ch.topics.length) * Math.PI * 2; const up = !!app.state.campaign.topics[t.id]?.cleared; const s = standard(up ? cloth.red : cloth.grey, up ? 0.9 : 0.55); s.position.set(Math.cos(a) * 1.75, 0, Math.sin(a) * 1.75); cap.ring.add(s); });
      const wasConquered = lastSnapshot ? lastSnapshot[num].st === 'conquered' : st === 'conquered';
      if (st === 'conquered' && !wasConquered && animate) { dissolve[num] = 0; anims.push({ t: 0, dur: 1.8, fn: k => { dissolve[num] = k; }, done: () => { cap.eagle.position.y = 0; } }); cap.eagle.position.y = 6; anims.push({ t: 0, dur: 1.4, fn: k => { cap.eagle.position.y = 6 * (1 - spring(k)); }, done: () => { cap.eagle.position.y = 0; } }); burstCoins(cap.group.position); app.sound && app.sound('fanfare'); }
      else dissolve[num] = st === 'conquered' ? 1 : 0;
    }
    const nc = capitals.get(next || 1); token.position.copy(nc.group.position).add(new THREE.Vector3(1.6, 0, 1.1)); token.visible = !!next;
    // labels
    labels.set(prov.num ? fortLabels() : ORDER.map(num => { const ch = app.index.chapter.get(num); const pv = PROV[num]; const st = snap[num].st; const p = chapterProgress(app, ch);
      return { id: 'p' + num, name: pv.name, numeral: `Chapter ${ROMAN[num]}`, state: st, next: next === num, priority: next === num ? 3 : st === 'open' ? 2 : 1, pos: world(pv.label[0], pv.label[1], 0.3), status: st === 'conquered' ? 'Conquered' : st === 'locked' ? 'Locked' : `${p.cleared} / ${p.topics} standards` }; }));
    // standards newly planted in the open province view
    if (prov.num && lastSnapshot && animate) { const ch = app.index.chapter.get(prov.num); for (const f of prov.forts) { const now = !!app.state.campaign.topics[f.topic.id]?.cleared; if (now && !lastSnapshot[prov.num].cleared.includes(f.topic.id)) { f.std.visible = true; f.std.scale.setScalar(0.01); const s = f.std; anims.push({ t: 0, dur: 0.9, fn: k => s.scale.setScalar(1.1 * spring(k)) }); app.sound && app.sound('horn'); } } }
    lastSnapshot = snap; labelsDirty = true;
    paintColorMap(colorCanvas, geo, { next }); colorTex.needsUpdate = true;
  }
  function fortLabels() { const ch = app.index.chapter.get(prov.num); return prov.forts.map(f => { const t = f.topic; const solid = t.concepts.filter(cid => masteryOf(cid) >= 3).length; return { id: 'f' + f.index, name: t.title, numeral: `Battle ${ROMAN_SMALL[f.index + 1]}`, state: f.cleared ? 'conquered' : 'open', small: true, priority: 0.5, pos: f.group.position.clone().add(new THREE.Vector3(0, 1.0, 0)), status: f.cleared ? 'Standard planted' : `${solid} / ${t.concepts.length} held`, dy: f.index % 2 ? 46 : -52 }; }).concat([{ id: 'boss', name: `Siege of ${PROV[prov.num].capital}`, numeral: prov.forts.every(f => f.cleared) ? '24 questions · 90% takes the city' : 'Win every battle first', state: chapterProgress(app, ch).boss ? 'conquered' : prov.forts.every(f => f.cleared) ? 'open' : 'locked', small: true, priority: 1.5, pos: capitals.get(prov.num).group.position.clone().add(new THREE.Vector3(0, 2.2, 0)), status: '', dy: -40 }]); }
  const ROMAN_SMALL = ['', 'I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII'];
  function masteryOf(cid) { return masteryLevel(app.state.concepts[cid]); }

  // ---- coins burst (conquest)
  const coinN = 90; const coinGeo = new THREE.BufferGeometry(); const coinPos = new Float32Array(coinN * 3); coinGeo.setAttribute('position', new THREE.BufferAttribute(coinPos, 3));
  const coins = new THREE.Points(coinGeo, new THREE.PointsMaterial({ color: 0xe3c76a, size: 0.5, transparent: true, opacity: 0, depthWrite: false })); scene.add(coins);
  let coinVel = null; let coinLife = 0;
  function burstCoins(origin) { coinVel = []; for (let i = 0; i < coinN; i++) { coinPos[i * 3] = origin.x; coinPos[i * 3 + 1] = origin.y + 0.5; coinPos[i * 3 + 2] = origin.z; coinVel.push(new THREE.Vector3((Math.random() - 0.5) * 8, 4 + Math.random() * 6, (Math.random() - 0.5) * 8)); } coinLife = 2.2; coins.material.opacity = 1; app.sound && app.sound('coins'); }

  // ---- camera rig
  const cam = { target: new THREE.Vector3(0, 0.4, 0), dist: 70, pitch: 76, yaw: 0 };
  let camFrom = null, camTo = null, camT = 0, camDur = 1.2, camDone = null;
  function fitOverview() { const fov = camera.fov * Math.PI / 180; const a = camera.aspect || 1; const dW = (W * 0.56) / (Math.tan(fov / 2) * a); const dH = (Hh * 0.62) / Math.tan(fov / 2); return { target: new THREE.Vector3(0, 0.4, 0), dist: Math.max(dW, dH, 20), pitch: 76, yaw: 0 }; }
  function fitProvince(num) { const [a, b] = provinceBounds(num); const [x0, y0] = proj.toXY(a[0], a[1]); const [x1, y1] = proj.toXY(b[0], b[1]); const cx = (x0 + x1) / 2, cz = -(y0 + y1) / 2; const fov = camera.fov * Math.PI / 180; const asp = camera.aspect || 1; const dW = ((x1 - x0) * 0.7) / (2 * Math.tan(fov / 2) * asp); const dH = ((y1 - y0) * 0.86) / (2 * Math.tan(fov / 2)); return { target: new THREE.Vector3(cx, 0.6, cz + (y1 - y0) * 0.06), dist: Math.max(11, dW, dH), pitch: 47, yaw: -12 }; }
  function applyCam(extraYaw = 0, extraDist = 0) { const p = (cam.pitch) * Math.PI / 180, y = (cam.yaw + extraYaw) * Math.PI / 180; const d = cam.dist + extraDist; camera.position.set(cam.target.x + Math.sin(y) * Math.cos(p) * d, cam.target.y + Math.sin(p) * d, cam.target.z + Math.cos(y) * Math.cos(p) * d); camera.lookAt(cam.target); }
  function tweenCam(to, dur, done) { camFrom = { target: cam.target.clone(), dist: cam.dist, pitch: cam.pitch, yaw: cam.yaw }; camTo = to; camT = 0; camDur = dur; camDone = done || null; if (dur <= 0) { Object.assign(cam, { dist: to.dist, pitch: to.pitch, yaw: to.yaw }); cam.target.copy(to.target); camFrom = camTo = null; done && done(); } }

  // ---- state machine: overview <-> province
  let mode = 'overview'; let focus = 0; let anims = []; let labelsDirty = true; let hoverId = 0; let hoverFort = null;
  function enterProvince(num, { instant = false } = {}) {
    mode = 'province'; focus = num; buildProvince(num); landUniforms.focusId.value = num;
    const to = fitProvince(num); const dur = instant ? 0 : 1.2;
    anims.push({ t: 0, dur: dur || 0.01, fn: k => { landUniforms.dimOthers.value = k * 0.85; } });
    tweenCam(to, dur, () => unfold(instant));
    refresh({ animate: false });
    if (instant) unfold(true);
  }
  function unfold(instant) {
    if (!prov.group) return;
    const road = prov.road, top = prov.roadTop; const total = road.geometry.index ? road.geometry.index.count : road.geometry.attributes.position.count; const totalTop = top.geometry.index ? top.geometry.index.count : top.geometry.attributes.position.count;
    anims.push({ t: 0, dur: instant ? 0.01 : 1.0, fn: k => { road.geometry.setDrawRange(0, Math.floor(total * k)); top.geometry.setDrawRange(0, Math.floor(totalTop * k)); } });
    prov.forts.forEach((f, i) => { anims.push({ t: -(instant ? 0 : 0.25 + i * 0.14), dur: instant ? 0.01 : 0.6, fn: k => { f.model.scale.set(2, 2 * (0.01 + 0.99 * spring(k)), 2); } }); });
    const cap = capitals.get(prov.num); anims.push({ t: -(instant ? 0 : 0.4 + prov.forts.length * 0.14), dur: instant ? 0.01 : 0.7, fn: k => { const s = 0.72 + 0.6 * spring(k); cap.model.scale.set(s, s, s); } });
    app.sound && !instant && app.sound('unroll');
    labelsDirty = true;
  }
  function leaveProvince({ instant = false } = {}) {
    const cap = prov.num ? capitals.get(prov.num) : null;
    mode = 'overview'; focus = 0;
    anims.push({ t: 0, dur: instant ? 0.01 : 0.6, fn: k => { landUniforms.dimOthers.value = (1 - k) * 0.85; }, done: () => { landUniforms.focusId.value = 0; } });
    if (cap) anims.push({ t: 0, dur: instant ? 0.01 : 0.5, fn: k => { const s = 1.32 - 0.6 * k; cap.model.scale.set(s, s, s); } });
    clearProvince();
    tweenCam(fitOverview(), instant ? 0 : 1.1);
    refresh({ animate: false });
  }

  // ---- interaction
  const ray = new THREE.Raycaster(); const ndc = new THREE.Vector2(); let dragging = null; let moved = false; let pinch = null;
  function pick(ev) { const r = canvas.getBoundingClientRect(); ndc.set(((ev.clientX - r.left) / r.width) * 2 - 1, -((ev.clientY - r.top) / r.height) * 2 + 1); ray.setFromCamera(ndc, camera); return ray; }
  function provinceUnder(ev) { const hit = pick(ev).intersectObject(land, false)[0]; if (!hit || !hit.uv) return 0; const [lon, lat] = proj.fromUV(hit.uv.x, hit.uv.y); return sampleData(dm, lon, lat).id; }
  function fortUnder(ev) { if (!prov.group) return null; const hits = pick(ev).intersectObjects([prov.group, capitals.get(prov.num).group], true); for (const hh of hits) { let o = hh.object; while (o && !(o.userData && (o.userData.topic || o.userData.capital))) o = o.parent; if (o) return o; } return null; }
  function onMove(ev) {
    if (dragging) { const dx = ev.clientX - dragging.x, dy = ev.clientY - dragging.y; if (Math.hypot(dx, dy) > 6) moved = true; if (moved && mode === 'overview') { const k = cam.dist / 900; cam.target.x = THREE.MathUtils.clamp(dragging.tx - dx * k, -W * 0.45, W * 0.45); cam.target.z = THREE.MathUtils.clamp(dragging.tz - dy * k, -Hh * 0.45, Hh * 0.45); labelsDirty = true; } return; }
    if (mode === 'overview') { const id = provinceUnder(ev); if (id !== hoverId) { hoverId = id; landUniforms.hoverId.value = id; canvas.style.cursor = id ? 'pointer' : 'grab'; if (id) app.sound && app.sound('tick'); } }
    else { const o = fortUnder(ev); const key = o ? (o.userData.topic ? o.userData.topic.id : 'boss') : null; if (key !== hoverFort) { hoverFort = key; canvas.style.cursor = key ? 'pointer' : 'default'; if (key) app.sound && app.sound('tick'); } for (const f of prov.forts) { const s = f.topic.id === hoverFort ? 1.08 : 1; f.group.scale.set(s, s, s); } }
  }
  function onDown(ev) { if (ev.button !== undefined && ev.button !== 0) return; dragging = { x: ev.clientX, y: ev.clientY, tx: cam.target.x, tz: cam.target.z }; moved = false; try { canvas.setPointerCapture(ev.pointerId); } catch { /* ignore */ } }
  function onUp(ev) { const wasDrag = moved; dragging = null; if (wasDrag) return;
    if (mode === 'overview') { const id = provinceUnder(ev); if (id) { const ch = app.index.chapter.get(id); opts.onProvince && opts.onProvince(ch, provinceState(app, ch)); } }
    else { const o = fortUnder(ev); if (!o) return; if (o.userData.topic) opts.onFort && opts.onFort(o.userData.topic, o.userData.index); else opts.onBoss && opts.onBoss(); } }
  function onWheel(ev) { ev.preventDefault(); const lim = mode === 'overview' ? fitOverview().dist * 1.15 : fitProvince(focus).dist * 1.4; cam.dist = THREE.MathUtils.clamp(cam.dist * (1 + Math.sign(ev.deltaY) * 0.08), 10, lim); labelsDirty = true; }
  const touches = new Map();
  function onTouchDown(ev) { touches.set(ev.pointerId, { x: ev.clientX, y: ev.clientY }); if (touches.size === 2) { const [a, b] = [...touches.values()]; pinch = { d: Math.hypot(a.x - b.x, a.y - b.y), dist: cam.dist }; dragging = null; } }
  function onTouchMove(ev) { if (!touches.has(ev.pointerId)) return; touches.set(ev.pointerId, { x: ev.clientX, y: ev.clientY }); if (pinch && touches.size === 2) { const [a, b] = [...touches.values()]; const d = Math.hypot(a.x - b.x, a.y - b.y); const lim = mode === 'overview' ? fitOverview().dist * 1.15 : fitProvince(focus).dist * 1.4; cam.dist = THREE.MathUtils.clamp(pinch.dist * (pinch.d / Math.max(10, d)), 10, lim); labelsDirty = true; } }
  function onTouchUp(ev) { touches.delete(ev.pointerId); if (touches.size < 2) pinch = null; }
  canvas.addEventListener('pointermove', onMove); canvas.addEventListener('pointerdown', onDown); canvas.addEventListener('pointerup', onUp); canvas.addEventListener('pointercancel', () => { dragging = null; });
  canvas.addEventListener('pointerdown', onTouchDown); canvas.addEventListener('pointermove', onTouchMove); canvas.addEventListener('pointerup', onTouchUp); canvas.addEventListener('pointercancel', onTouchUp);
  canvas.addEventListener('wheel', onWheel, { passive: false });
  canvas.addEventListener('pointerleave', () => { if (hoverId) { hoverId = 0; landUniforms.hoverId.value = 0; } });
  el.addEventListener('click', ev => { const lab = ev.target.closest && ev.target.closest('.mlabel'); if (!lab) return; const id = lab.dataset.id; if (id.startsWith('p') && mode === 'overview') { const num = parseInt(id.slice(1), 10); const ch = app.index.chapter.get(num); opts.onProvince && opts.onProvince(ch, provinceState(app, ch)); } else if (id.startsWith('f') && mode === 'province') { const f = prov.forts[parseInt(id.slice(1), 10)]; f && opts.onFort && opts.onFort(f.topic, f.index); } else if (id === 'boss' && mode === 'province') opts.onBoss && opts.onBoss(); });

  // ---- sizing and loop
  let visible = false, raf = 0, last = 0, lift = 0;
  function resize() { const r = el.getBoundingClientRect(); const w = Math.max(100, r.width), hh = Math.max(100, r.height); renderer.setSize(w, hh, false); camera.aspect = w / hh; camera.updateProjectionMatrix(); if (!camTo) { const fit = mode === 'overview' ? fitOverview() : fitProvince(focus); cam.dist = Math.min(cam.dist, fit.dist * 1.15); if (mode === 'overview') cam.dist = fit.dist; } labelsDirty = true; }
  const ro = new ResizeObserver(() => { if (visible) resize(); }); ro.observe(el);
  const tmpV = new THREE.Vector3();
  function project(pos) { tmpV.copy(pos).project(camera); const r = el.getBoundingClientRect(); const x = (tmpV.x + 1) / 2 * r.width, y = (1 - tmpV.y) / 2 * r.height; const vis = tmpV.z < 1 && x > -40 && x < r.width + 40 && y > -20 && y < r.height + 20; return [x, y, vis]; }
  function frame(now) {
    raf = 0; if (!visible) return;
    const dt = Math.min(0.05, (now - (last || now)) / 1000); last = now; uTime.value += dt;
    // camera tween
    let camMoved = false;
    if (camTo) { camT += dt; const k = easeInOut(Math.min(1, camT / camDur)); cam.target.lerpVectors(camFrom.target, camTo.target, k); cam.dist = camFrom.dist + (camTo.dist - camFrom.dist) * k; cam.pitch = camFrom.pitch + (camTo.pitch - camFrom.pitch) * k; cam.yaw = camFrom.yaw + (camTo.yaw - camFrom.yaw) * k; camMoved = true; if (camT >= camDur) { camFrom = camTo = null; const d = camDone; camDone = null; d && d(); } }
    const breathe = mode === 'overview' && !camTo; applyCam(breathe ? Math.sin(uTime.value * 0.37) * 0.8 : 0, breathe ? Math.sin(uTime.value * 0.5) * 0.35 : 0);
    if (breathe) camMoved = true;
    // hover lift
    const liftTarget = hoverId && mode === 'overview' ? 0.5 : 0; lift += (liftTarget - lift) * Math.min(1, dt * 10); landUniforms.liftAmt.value = lift;
    // generic anims
    const keep = []; for (const a of anims) { a.t += dt; if (a.t < 0) { keep.push(a); continue; } const k = Math.min(1, a.t / a.dur); a.fn(easeOut(k)); if (k < 1) keep.push(a); else a.done && a.done(); } anims = keep;
    // dust on the next road
    const nextC = roadCurves.get(nextIsland(app)); dust.visible = !!nextC && mode === 'overview';
    if (dust.visible) { for (let i = 0; i < dustN; i++) { dustT[i] = (dustT[i] + dt * 0.035 * (0.7 + (i % 5) * 0.12)) % 1; const p = nextC.getPointAt(dustT[i]); dustPos[i * 3] = p.x + Math.sin(i * 7.1 + uTime.value * 2) * 0.25; dustPos[i * 3 + 1] = p.y + 0.2 + Math.sin(i + uTime.value * 3) * 0.12; dustPos[i * 3 + 2] = p.z + Math.cos(i * 3.3 + uTime.value * 1.7) * 0.25; } dustGeo.attributes.position.needsUpdate = true; }
    // triremes
    for (const tr of triremes) { tr.t = (tr.t + dt * 0.012) % 1; const p = tr.curve.getPointAt(tr.t); const q = tr.curve.getPointAt((tr.t + 0.01) % 1); tr.mesh.position.set(p.x, 0.02 + Math.sin(uTime.value * 1.3 + tr.t * 20) * 0.03, p.z); tr.mesh.lookAt(q.x, tr.mesh.position.y, q.z); tr.mesh.rotation.z = Math.sin(uTime.value * 1.1 + tr.t * 9) * 0.05; }
    token.position.y = capitals.get(nextIsland(app) || 1).group.position.y + Math.sin(uTime.value * 2.2) * 0.04;
    // coins
    if (coinLife > 0) { coinLife -= dt; for (let i = 0; i < coinN; i++) { const v = coinVel[i]; v.y -= 14 * dt; coinPos[i * 3] += v.x * dt; coinPos[i * 3 + 1] = Math.max(0.05, coinPos[i * 3 + 1] + v.y * dt); coinPos[i * 3 + 2] += v.z * dt; if (coinPos[i * 3 + 1] <= 0.06 && v.y < 0) v.y = -v.y * 0.35; } coinGeo.attributes.position.needsUpdate = true; coins.material.opacity = Math.min(1, coinLife); } else coins.material.opacity = 0;
    seaMat.uniforms.camPos.value = camera.position;
    renderer.render(scene, camera);
    if (camMoved || labelsDirty) { labels.update(project); labelsDirty = false; }
    raf = requestAnimationFrame(frame);
  }
  function kick() { if (visible && !raf && !document.hidden) { last = 0; raf = requestAnimationFrame(frame); } }
  const onVis = () => kick(); document.addEventListener('visibilitychange', onVis);

  // ---- public API
  const api = {
    el, get mode() { return mode; }, get province() { return focus; },
    mount(host) { host.appendChild(el); visible = true; resize(); applyTheme(); kick(); },
    unmount() { visible = false; if (raf) cancelAnimationFrame(raf); raf = 0; el.remove(); },
    showOverview({ instant = false } = {}) { if (mode === 'province') leaveProvince({ instant }); else { if (instant || !camTo) tweenCam(fitOverview(), instant ? 0 : 0.6); refresh({ animate: true }); } },
    showProvince(num, { instant = false } = {}) { if (mode === 'province' && focus === num) { refresh({ animate: true }); return; } if (mode === 'province') { clearProvince(); } enterProvince(num, { instant }); },
    refresh() { refresh({ animate: true }); },
    theme() { applyTheme(); },
    destroy() { visible = false; if (raf) cancelAnimationFrame(raf); ro.disconnect(); document.removeEventListener('visibilitychange', onVis); labels.destroy(); renderer.dispose(); landGeo.dispose(); el.remove(); },
  };
  resize(); Object.assign(cam, fitOverview()); cam.target = fitOverview().target; applyCam(); refresh({ animate: false });
  if (opts.initialProvince) enterProvince(opts.initialProvince, { instant: true });
  return api;
}
