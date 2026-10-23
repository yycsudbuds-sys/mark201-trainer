// Imperium audio: WebAudio synthesis with an optional sample manifest (drop CC0 ogg/mp3 into app/audio/).
// All playback is gated by the Sound toggle. Master volume and mute live in mark201.cosmetic.v1.

const COSMETIC_KEY = 'mark201.cosmetic.v1';
function readCos() { try { return JSON.parse(localStorage.getItem(COSMETIC_KEY) || '{}') || {}; } catch { return {}; } }
function writeCos(patch) { try { const c = readCos(); Object.assign(c, patch); localStorage.setItem(COSMETIC_KEY, JSON.stringify(c)); } catch { /* ignore */ } }

const A = { ctx: null, master: null, sfx: null, amb: null, music: null, comp: null, unlocked: false, enabled: () => true, ambKind: null, ambNodes: [], ambTimers: [], ambGain: null, verb: null };
const cos = readCos();
let volume = typeof cos.volume === 'number' ? cos.volume : 0.75;
let muted = !!cos.muted;

/** Optional samples: name -> [ogg, mp3] relative to app/audio/. Missing files fall back to synthesis. */
const MANIFEST = {};
const buffers = new Map();

export function initAudio(getEnabled) { A.enabled = getEnabled || (() => true); }
export function getVolume() { return volume; }
export function isMuted() { return muted; }
export function setVolume(v) { volume = Math.max(0, Math.min(1, v)); writeCos({ volume }); applyMaster(); }
export function setMuted(b) { muted = !!b; writeCos({ muted }); applyMaster(); }
export function toggleMuted() { setMuted(!muted); return muted; }
function applyMaster() { if (A.master) A.master.gain.setTargetAtTime(muted ? 0 : volume * volume, A.ctx.currentTime, 0.03); }

function ensure() {
  if (A.ctx) { if (A.ctx.state === 'suspended') A.ctx.resume().catch(() => {}); return A.ctx; }
  const Ctx = window.AudioContext || window.webkitAudioContext; if (!Ctx) return null;
  const ctx = new Ctx(); A.ctx = ctx;
  A.comp = ctx.createDynamicsCompressor(); A.comp.threshold.value = -14; A.comp.knee.value = 18; A.comp.ratio.value = 4; A.comp.attack.value = 0.004; A.comp.release.value = 0.2;
  A.master = ctx.createGain(); A.master.gain.value = muted ? 0 : volume * volume;
  A.sfx = ctx.createGain(); A.sfx.gain.value = 1;
  A.amb = ctx.createGain(); A.amb.gain.value = 0.55;
  A.music = ctx.createGain(); A.music.gain.value = 0;
  // light room: two feedback delays
  A.verb = ctx.createGain(); A.verb.gain.value = 0.18;
  const d1 = ctx.createDelay(0.5); d1.delayTime.value = 0.071; const d2 = ctx.createDelay(0.5); d2.delayTime.value = 0.113;
  const f1 = ctx.createGain(); f1.gain.value = 0.42; const f2 = ctx.createGain(); f2.gain.value = 0.36;
  const lp = ctx.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 3200;
  A.verb.connect(d1); A.verb.connect(d2); d1.connect(f1); f1.connect(d1); d2.connect(f2); f2.connect(d2); d1.connect(lp); d2.connect(lp); lp.connect(A.comp);
  A.sfx.connect(A.comp); A.sfx.connect(A.verb); A.amb.connect(A.comp); A.music.connect(A.comp);
  A.comp.connect(A.master); A.master.connect(ctx.destination);
  return ctx;
}

/** Call from the first user gesture. */
export function unlock() {
  if (A.unlocked) return;
  if (!A.enabled || !A.enabled()) return; // sound effects off: touch nothing, unlock later if they are turned on
  A.unlocked = true;
  const ctx = ensure(); if (!ctx) return;
  try { const b = ctx.createBuffer(1, 1, 22050); const s = ctx.createBufferSource(); s.buffer = b; s.connect(ctx.destination); s.start(0); } catch { /* ignore */ }
  if (ctx.state === 'suspended') ctx.resume().catch(() => {});
}
function autoUnlock() { unlock(); if (A.unlocked) { window.removeEventListener('pointerdown', autoUnlock); window.removeEventListener('keydown', autoUnlock); } }
window.addEventListener('pointerdown', autoUnlock, { passive: true }); window.addEventListener('keydown', autoUnlock);
document.addEventListener('visibilitychange', () => { if (!A.ctx) return; if (document.hidden) A.amb && A.amb.gain.setTargetAtTime(0, A.ctx.currentTime, 0.2); else A.amb && A.amb.gain.setTargetAtTime(0.55, A.ctx.currentTime, 0.5); });

// ---------------- synthesis primitives ----------------
let noiseBuf = null;
function noiseBuffer(ctx) {
  if (noiseBuf) return noiseBuf;
  const len = ctx.sampleRate * 2; const b = ctx.createBuffer(1, len, ctx.sampleRate); const d = b.getChannelData(0);
  for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
  noiseBuf = b; return b;
}
function env(g, t0, a, d, s, r, peak = 1, sus = 0.4) {
  g.gain.cancelScheduledValues(t0); g.gain.setValueAtTime(0.0001, t0);
  g.gain.exponentialRampToValueAtTime(Math.max(0.0002, peak), t0 + a);
  g.gain.exponentialRampToValueAtTime(Math.max(0.0002, peak * sus), t0 + a + d);
  g.gain.setValueAtTime(Math.max(0.0002, peak * sus), t0 + a + d + s);
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + a + d + s + r);
  return t0 + a + d + s + r;
}
function tone(ctx, dest, { f = 440, f2 = null, type = 'sine', t0 = ctx.currentTime, a = 0.005, d = 0.08, s = 0, r = 0.1, gain = 0.2, sus = 0.3, detune = 0, lp = null }) {
  const o = ctx.createOscillator(); o.type = type; o.frequency.setValueAtTime(f, t0); if (f2) o.frequency.exponentialRampToValueAtTime(f2, t0 + a + d + s + r); o.detune.value = detune;
  const g = ctx.createGain(); const end = env(g, t0, a, d, s, r, gain, sus);
  let node = o;
  if (lp) { const flt = ctx.createBiquadFilter(); flt.type = 'lowpass'; flt.frequency.setValueAtTime(lp[0], t0); flt.frequency.exponentialRampToValueAtTime(lp[1], end); flt.Q.value = 0.8; o.connect(flt); node = flt; }
  node.connect(g); g.connect(dest); o.start(t0); o.stop(end + 0.05);
  return end;
}
function noise(ctx, dest, { t0 = ctx.currentTime, a = 0.005, d = 0.1, s = 0, r = 0.1, gain = 0.2, sus = 0.3, type = 'bandpass', f = 1000, f2 = null, q = 0.8 }) {
  const src = ctx.createBufferSource(); src.buffer = noiseBuffer(ctx); src.loop = true;
  const flt = ctx.createBiquadFilter(); flt.type = type; flt.frequency.setValueAtTime(f, t0); if (f2) flt.frequency.exponentialRampToValueAtTime(f2, t0 + a + d + s + r); flt.Q.value = q;
  const g = ctx.createGain(); const end = env(g, t0, a, d, s, r, gain, sus);
  src.connect(flt); flt.connect(g); g.connect(dest); src.start(t0); src.stop(end + 0.05);
  return end;
}
function metal(ctx, dest, { t0 = ctx.currentTime, base = 900, gain = 0.18, decay = 0.35 }) {
  // inharmonic partials for a struck blade / shield boss
  const ratios = [1, 1.47, 2.09, 2.56, 3.21, 4.4];
  ratios.forEach((rt, i) => tone(ctx, dest, { f: base * rt, type: i % 2 ? 'triangle' : 'sine', t0, a: 0.002, d: decay * (1 - i * 0.12), r: 0.05, gain: gain / (i + 1.5), sus: 0.05 }));
  noise(ctx, dest, { t0, a: 0.002, d: 0.04, r: 0.02, gain: gain * 0.9, type: 'highpass', f: 3000 });
}
function brass(ctx, dest, notes, { t0 = ctx.currentTime, dur = 0.22, gap = 0.16, gain = 0.16 } = {}) {
  let t = t0;
  for (const n of notes) {
    const f = 440 * Math.pow(2, (n - 69) / 12);
    [0, 7, -6].forEach(dt => tone(ctx, dest, { f, type: 'sawtooth', t0: t, a: 0.02, d: dur * 0.5, s: dur * 0.4, r: 0.12, gain: gain / 3, sus: 0.7, detune: dt, lp: [900, 3200] }));
    tone(ctx, dest, { f: f * 2, type: 'square', t0: t, a: 0.03, d: dur * 0.5, s: dur * 0.3, r: 0.1, gain: gain * 0.12, sus: 0.5, lp: [1200, 2400] });
    t += gap;
  }
  return t + dur;
}
function drum(ctx, dest, { t0 = ctx.currentTime, f = 140, gain = 0.35 }) {
  tone(ctx, dest, { f, f2: f * 0.45, type: 'sine', t0, a: 0.003, d: 0.22, r: 0.1, gain, sus: 0.1 });
  noise(ctx, dest, { t0, a: 0.002, d: 0.08, r: 0.05, gain: gain * 0.35, type: 'lowpass', f: 600 });
}
function coinSfx(ctx, dest, t0 = ctx.currentTime, n = 2) {
  for (let i = 0; i < n; i++) { const tt = t0 + i * 0.07; const f = 2200 + Math.random() * 600; tone(ctx, dest, { f, type: 'sine', t0: tt, a: 0.002, d: 0.12, r: 0.1, gain: 0.08, sus: 0.1 }); tone(ctx, dest, { f: f * 2.76, type: 'sine', t0: tt, a: 0.002, d: 0.06, r: 0.05, gain: 0.03, sus: 0.1 }); }
}
function whoosh(ctx, dest, { t0 = ctx.currentTime, dur = 0.35, f = 300, f2 = 2400, gain = 0.16 }) { noise(ctx, dest, { t0, a: dur * 0.3, d: dur * 0.4, r: dur * 0.3, gain, sus: 0.6, type: 'bandpass', f, f2, q: 1.2 }); }
function crackle(ctx, dest, { t0 = ctx.currentTime, dur = 0.6, gain = 0.1 }) {
  for (let i = 0; i < 10; i++) noise(ctx, dest, { t0: t0 + Math.random() * dur, a: 0.002, d: 0.02, r: 0.02, gain: gain * (0.4 + Math.random()), type: 'bandpass', f: 1500 + Math.random() * 2500, q: 3 });
}
function choir(ctx, dest, notes, { t0 = ctx.currentTime, dur = 1.6, gain = 0.07 } = {}) {
  for (const n of notes) { const f = 440 * Math.pow(2, (n - 69) / 12); [-9, 0, 8].forEach(dt => tone(ctx, dest, { f, type: 'triangle', t0, a: 0.35, d: dur * 0.3, s: dur * 0.4, r: 0.6, gain, sus: 0.8, detune: dt, lp: [600, 1800] })); }
}

// ---------------- sound effects ----------------
const SFX = {
  tick: (c, d) => tone(c, d, { f: 1900, f2: 1400, type: 'sine', a: 0.001, d: 0.03, r: 0.02, gain: 0.05, sus: 0.1 }),
  knock: (c, d) => { tone(c, d, { f: 180, f2: 90, type: 'sine', a: 0.002, d: 0.06, r: 0.05, gain: 0.25, sus: 0.1 }); noise(c, d, { a: 0.001, d: 0.03, r: 0.02, gain: 0.12, type: 'lowpass', f: 900 }); },
  rustle: (c, d) => { noise(c, d, { a: 0.03, d: 0.12, r: 0.12, gain: 0.08, type: 'highpass', f: 2200 }); noise(c, d, { t0: c.currentTime + 0.08, a: 0.02, d: 0.08, r: 0.1, gain: 0.06, type: 'bandpass', f: 3200, q: 1.5 }); },
  unroll: (c, d) => { noise(c, d, { a: 0.05, d: 0.25, s: 0.1, r: 0.2, gain: 0.07, type: 'bandpass', f: 1200, f2: 2600, q: 0.9 }); tone(c, d, { f: 120, f2: 90, type: 'triangle', a: 0.05, d: 0.3, r: 0.2, gain: 0.05, sus: 0.3 }); },
  seal: (c, d) => { noise(c, d, { a: 0.001, d: 0.03, r: 0.03, gain: 0.2, type: 'bandpass', f: 2600, q: 2 }); tone(c, d, { f: 420, f2: 200, type: 'triangle', a: 0.001, d: 0.06, r: 0.05, gain: 0.12, sus: 0.1 }); },
  correct: (c, d) => { metal(c, d, { base: 1100, gain: 0.14, decay: 0.28 }); brass(c, d, [67, 74], { t0: c.currentTime + 0.06, dur: 0.16, gap: 0.12, gain: 0.1 }); },
  wrong: (c, d) => { noise(c, d, { a: 0.002, d: 0.12, r: 0.12, gain: 0.22, type: 'lowpass', f: 700 }); drum(c, d, { f: 95, gain: 0.3 }); tone(c, d, { f: 160, f2: 110, type: 'sawtooth', a: 0.01, d: 0.2, r: 0.2, gain: 0.06, sus: 0.3, lp: [800, 300] }); },
  combo: (c, d, o = {}) => { const n = Math.min(10, o.n || 1); tone(c, d, { f: 520 * Math.pow(1.06, n), type: 'triangle', a: 0.005, d: 0.08, r: 0.08, gain: 0.08, sus: 0.2 }); tone(c, d, { f: 780 * Math.pow(1.06, n), type: 'sine', t0: c.currentTime + 0.05, a: 0.005, d: 0.1, r: 0.1, gain: 0.06, sus: 0.2 }); },
  pila: (c, d) => { whoosh(c, d, { dur: 0.3, f: 400, f2: 3000, gain: 0.14 }); whoosh(c, d, { t0: c.currentTime + 0.08, dur: 0.3, f: 500, f2: 2600, gain: 0.1 }); },
  impact: (c, d) => { drum(c, d, { f: 120, gain: 0.3 }); metal(c, d, { t0: c.currentTime + 0.01, base: 650, gain: 0.1, decay: 0.2 }); noise(c, d, { a: 0.002, d: 0.1, r: 0.15, gain: 0.12, type: 'lowpass', f: 1200 }); },
  cries: (c, d) => { for (let i = 0; i < 6; i++) tone(c, d, { f: 220 + Math.random() * 220, f2: 180 + Math.random() * 100, type: 'sawtooth', t0: c.currentTime + Math.random() * 0.4, a: 0.05, d: 0.2, r: 0.3, gain: 0.025, sus: 0.4, lp: [900, 500] }); noise(c, d, { a: 0.1, d: 0.3, r: 0.4, gain: 0.05, type: 'bandpass', f: 600, q: 0.6 }); },
  ballista: (c, d) => { tone(c, d, { f: 90, f2: 40, type: 'triangle', a: 0.002, d: 0.12, r: 0.1, gain: 0.3, sus: 0.1 }); whoosh(c, d, { t0: c.currentTime + 0.05, dur: 0.5, f: 200, f2: 1800, gain: 0.14 }); },
  crumble: (c, d) => { for (let i = 0; i < 8; i++) { const tt = c.currentTime + i * 0.06 + Math.random() * 0.05; drum(c, d, { t0: tt, f: 70 + Math.random() * 60, gain: 0.14 }); noise(c, d, { t0: tt, a: 0.002, d: 0.08, r: 0.1, gain: 0.08, type: 'lowpass', f: 900 }); } },
  gate: (c, d) => { noise(c, d, { a: 0.002, d: 0.08, r: 0.1, gain: 0.25, type: 'lowpass', f: 1500 }); drum(c, d, { f: 60, gain: 0.4 }); crackle(c, d, { t0: c.currentTime + 0.05, dur: 0.5, gain: 0.12 }); metal(c, d, { t0: c.currentTime + 0.1, base: 380, gain: 0.08, decay: 0.5 }); },
  horn: (c, d) => brass(c, d, [60, 67, 72], { dur: 0.32, gap: 0.26, gain: 0.14 }),
  fanfare: (c, d) => { brass(c, d, [60, 64, 67, 72, 72, 74, 76], { dur: 0.2, gap: 0.17, gain: 0.13 }); drum(c, d, { t0: c.currentTime + 1.2, f: 100, gain: 0.3 }); },
  coin: (c, d) => coinSfx(c, d, c.currentTime, 2),
  coins: (c, d) => coinSfx(c, d, c.currentTime, 6),
  promotion: (c, d) => { choir(c, d, [60, 64, 67, 72], { dur: 1.8, gain: 0.06 }); brass(c, d, [67, 72, 76], { t0: c.currentTime + 0.4, dur: 0.3, gap: 0.3, gain: 0.1 }); coinSfx(c, d, c.currentTime + 1.2, 3); },
  flame: (c, d) => { whoosh(c, d, { dur: 0.5, f: 150, f2: 1200, gain: 0.14 }); crackle(c, d, { t0: c.currentTime + 0.2, dur: 0.4, gain: 0.08 }); },
  shieldcrack: (c, d) => { metal(c, d, { base: 420, gain: 0.14, decay: 0.3 }); noise(c, d, { a: 0.002, d: 0.06, r: 0.08, gain: 0.2, type: 'bandpass', f: 1800, q: 1.2 }); drum(c, d, { t0: c.currentTime + 0.02, f: 110, gain: 0.22 }); },
  stylus: (c, d) => noise(c, d, { a: 0.01, d: 0.1, r: 0.06, gain: 0.08, type: 'bandpass', f: 4200, f2: 2800, q: 2 }),
  rout: (c, d) => { SFX.cries(c, d); whoosh(c, d, { t0: c.currentTime + 0.2, dur: 0.6, f: 200, f2: 900, gain: 0.1 }); },
  charge: (c, d) => { for (let i = 0; i < 12; i++) drum(c, d, { t0: c.currentTime + i * 0.11, f: 90 + (i % 3) * 20, gain: 0.14 }); brass(c, d, [67, 72, 79], { t0: c.currentTime + 0.3, dur: 0.25, gap: 0.2, gain: 0.1 }); },
  thumbs: (c, d, o = {}) => { if (o.up) { SFX.cries(c, d); brass(c, d, [72, 76], { t0: c.currentTime + 0.1, dur: 0.3, gap: 0.25, gain: 0.1 }); } else { noise(c, d, { a: 0.1, d: 0.5, r: 0.5, gain: 0.12, type: 'bandpass', f: 400, q: 0.5 }); drum(c, d, { f: 80, gain: 0.3 }); } },
};
// legacy kinds used by existing calls
const ALIAS = { level: 'promotion', clear: 'horn', heart: 'shieldcrack' };

export function play(name, opts = {}) {
  if (!A.enabled() || muted) return;
  const ctx = ensure(); if (!ctx) return;
  const key = ALIAS[name] || name;
  if (MANIFEST[key] && playSample(ctx, key)) return;
  const fn = SFX[key]; if (!fn) return;
  try { fn(ctx, A.sfx, opts); } catch { /* ignore */ }
}
function playSample(ctx, key) {
  const buf = buffers.get(key);
  if (buf === undefined) { loadSample(key); return false; }
  if (!buf) return false;
  const s = ctx.createBufferSource(); s.buffer = buf; s.connect(A.sfx); s.start(); return true;
}
async function loadSample(key) {
  buffers.set(key, null);
  for (const file of MANIFEST[key] || []) {
    try { const res = await fetch(new URL('./audio/' + file, import.meta.url)); if (!res.ok) continue; const ab = await res.arrayBuffer(); const buf = await A.ctx.decodeAudioData(ab); buffers.set(key, buf); return; } catch { /* try next */ }
  }
}

// ---------------- ambience ----------------
function stopAmbience(fade = 0.8) {
  const ctx = A.ctx; if (!ctx) return;
  const nodes = A.ambNodes; const g = A.ambGain; A.ambNodes = []; A.ambGain = null;
  A.ambTimers.forEach(clearTimeout); A.ambTimers = [];
  if (g) { g.gain.setTargetAtTime(0, ctx.currentTime, fade / 3); setTimeout(() => { nodes.forEach(n => { try { n.stop && n.stop(); n.disconnect(); } catch { /* ignore */ } }); try { g.disconnect(); } catch { /* ignore */ } }, fade * 1000 + 100); }
}
function bed(ctx, dest, { type = 'lowpass', f = 400, q = 0.5, gain = 0.1, lfo = null }) {
  const src = ctx.createBufferSource(); src.buffer = noiseBuffer(ctx); src.loop = true;
  const flt = ctx.createBiquadFilter(); flt.type = type; flt.frequency.value = f; flt.Q.value = q;
  const g = ctx.createGain(); g.gain.value = gain;
  if (lfo) { const o = ctx.createOscillator(); o.frequency.value = lfo.rate; const og = ctx.createGain(); og.gain.value = lfo.depth; o.connect(og); og.connect(lfo.target === 'gain' ? g.gain : flt.frequency); o.start(); A.ambNodes.push(o); }
  src.connect(flt); flt.connect(g); g.connect(dest); src.start(); A.ambNodes.push(src);
  return g;
}
function every(minMs, maxMs, fn) { const loop = () => { if (!A.ambGain) return; try { fn(); } catch { /* ignore */ } A.ambTimers.push(setTimeout(loop, minMs + Math.random() * (maxMs - minMs))); }; A.ambTimers.push(setTimeout(loop, minMs)); }
const AMBIENCE = {
  camp: (c, d) => { bed(c, d, { type: 'lowpass', f: 300, gain: 0.05, lfo: { rate: 0.2, depth: 0.02, target: 'gain' } }); bed(c, d, { type: 'bandpass', f: 500, q: 0.4, gain: 0.03, lfo: { rate: 0.07, depth: 120, target: 'f' } }); every(400, 1600, () => crackle(c, d, { dur: 0.4, gain: 0.05 })); },
  sea: (c, d) => { bed(c, d, { type: 'lowpass', f: 420, gain: 0.08, lfo: { rate: 0.11, depth: 0.045, target: 'gain' } }); every(5000, 12000, () => tone(c, d, { f: 1400, f2: 900, type: 'sine', a: 0.08, d: 0.25, r: 0.2, gain: 0.02, sus: 0.4 })); },
  arena: (c, d) => { bed(c, d, { type: 'bandpass', f: 520, q: 0.5, gain: 0.09, lfo: { rate: 0.09, depth: 0.04, target: 'gain' } }); bed(c, d, { type: 'bandpass', f: 1100, q: 0.8, gain: 0.03, lfo: { rate: 0.23, depth: 0.015, target: 'gain' } }); },
  plain: (c, d) => { bed(c, d, { type: 'lowpass', f: 260, gain: 0.07, lfo: { rate: 0.05, depth: 160, target: 'f' } }); every(9000, 20000, () => drum(c, d, { f: 50, gain: 0.12 })); },
  library: (c, d) => { bed(c, d, { type: 'lowpass', f: 200, gain: 0.025 }); every(2500, 6000, () => crackle(c, d, { dur: 0.3, gain: 0.02 })); every(12000, 30000, () => SFX.rustle(c, d)); },
  senate: (c, d) => { bed(c, d, { type: 'lowpass', f: 180, gain: 0.03 }); every(6000, 14000, () => { for (let i = 0; i < 4; i++) tone(c, d, { f: 140, f2: 90, type: 'sine', t0: c.currentTime + i * 0.5, a: 0.002, d: 0.08, r: 0.2, gain: 0.05, sus: 0.1 }); }); },
  training: (c, d) => { bed(c, d, { type: 'lowpass', f: 300, gain: 0.04, lfo: { rate: 0.08, depth: 100, target: 'f' } }); every(1800, 4500, () => SFX.knock(c, d)); },
  armoury: (c, d) => { bed(c, d, { type: 'lowpass', f: 240, gain: 0.03 }); every(4000, 9000, () => metal(c, d, { base: 500 + Math.random() * 400, gain: 0.03, decay: 0.3 })); },
  study: (c, d) => { bed(c, d, { type: 'lowpass', f: 180, gain: 0.02 }); every(1500, 4000, () => crackle(c, d, { dur: 0.3, gain: 0.015 })); },
  yard: (c, d) => { bed(c, d, { type: 'lowpass', f: 320, gain: 0.04 }); every(2500, 6000, () => { SFX.knock(c, d); setTimeout(() => SFX.knock(c, d), 180); }); },
};

/** Start (or crossfade to) a looping ambience. null stops. */
export function ambience(kind) {
  if (!A.enabled() || muted) { stopAmbience(0.3); A.ambKind = null; return; }
  if (kind === A.ambKind && A.ambGain) return;
  stopAmbience(0.8); A.ambKind = kind;
  if (!kind || !AMBIENCE[kind]) return;
  const ctx = ensure(); if (!ctx) return;
  const g = ctx.createGain(); g.gain.value = 0; g.connect(A.amb); A.ambGain = g;
  try { AMBIENCE[kind](ctx, g); } catch { /* ignore */ }
  g.gain.setTargetAtTime(1, ctx.currentTime, 0.6);
}
export function currentAmbience() { return A.ambKind; }

/** Optional lyre + drum music bed, off by default. */
let musicOn = !!cos.music; let musicTimer = null;
export function setMusic(on) { musicOn = !!on; writeCos({ music: musicOn }); if (musicOn) startMusic(); else stopMusic(); }
export function isMusicOn() { return musicOn; }
function startMusic() {
  if (!A.enabled() || muted) return; const ctx = ensure(); if (!ctx) return; stopMusic();
  A.music.gain.setTargetAtTime(0.35, ctx.currentTime, 1);
  const scale = [57, 60, 62, 64, 67, 69, 72]; let step = 0;
  musicTimer = setInterval(() => {
    if (document.hidden) return;
    const t = ctx.currentTime; const n = scale[(step * 3 + Math.floor(step / 7)) % scale.length];
    tone(ctx, A.music, { f: 440 * Math.pow(2, (n - 69) / 12), type: 'triangle', t0: t, a: 0.004, d: 0.5, r: 0.5, gain: 0.08, sus: 0.2 });
    if (step % 2 === 0) drum(ctx, A.music, { t0: t, f: 70, gain: 0.08 });
    step++;
  }, 620);
}
function stopMusic() { if (musicTimer) clearInterval(musicTimer); musicTimer = null; if (A.ctx && A.music) A.music.gain.setTargetAtTime(0, A.ctx.currentTime, 0.4); }
export const SFX_NAMES = Object.keys(SFX);
