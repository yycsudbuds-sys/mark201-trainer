// SceneDirector: one persistent backdrop layer behind every route. Crossfades between scenes,
// honours Night camp / Day march, drops to a still frame when motion is off, pauses when the tab is hidden,
// and drives per-scene ambience through audio.js.
import { h } from './ui.js';
import { sceneFor, PROVINCE_SCENE } from './scenes.js';

const ROUTE_SCENES = {
  home: { kind: 'camp', amb: 'camp', tint: 0.5, blur: 3 },
  campaign: { kind: 'wartable', amb: 'sea', tint: 0.55, blur: 4 },
  drill: { kind: 'training', amb: 'training', tint: 0.5, blur: 3 },
  exam: { kind: 'stormplain', amb: 'plain', tint: 0.5, blur: 3 },
  arcade: { kind: 'colosseum', amb: 'arena', tint: 0.5, blur: 4 },
  learn: { kind: 'library', amb: 'library', tint: 0.5, blur: 5 },
  progress: { kind: 'curia', amb: 'senate', tint: 0.5, blur: 4 },
  settings: { kind: 'armoury', amb: 'armoury', tint: 0.55, blur: 4 },
};

/** Decide the scene for a route. Battle routes get the province landscape as the sky behind the front line. */
export function sceneForRoute(key, params) {
  const base = ROUTE_SCENES[key] || ROUTE_SCENES.home;
  if (key === 'campaign' && params[0]) {
    const num = parseInt(params[0], 10);
    const kind = PROVINCE_SCENE[num] || 'italia';
    if (params[1] === 'boss') return { kind, amb: 'plain', tint: 0.48, blur: 4, battle: true };
    if (params[2] === 'drill') return { kind, amb: 'plain', tint: 0.48, blur: 4, battle: true };
    if (params[2] === 'read' || params[1]) return { kind, amb: 'study', tint: 0.42, blur: 9 };
    return { kind, amb: 'sea', tint: 0.5, blur: 6 };
  }
  if (key === 'drill' && params[0]) return { kind: 'training', amb: 'training', tint: 0.5, blur: 4, battle: ['go', 'chapter', 'concepts'].includes(params[0]) };
  if (key === 'exam' && params[0] === 'go') return { kind: 'stormplain', amb: 'plain', tint: 0.5, blur: 3, battle: true };
  if (key === 'arcade') {
    if (params[0] === 'blitz') return { kind: 'colosseum', amb: 'arena', tint: 0.5, blur: 4 };
    if (params[0] === 'duel') return { kind: 'arenafloor', amb: 'arena', tint: 0.5, blur: 3 };
    if (params[0] === 'build') return { kind: 'yard', amb: 'yard', tint: 0.5, blur: 4 };
    if (params[0] === 'flash') return { kind: 'study', amb: 'study', tint: 0.45, blur: 5 };
  }
  if (key === 'learn' && params[0]) return { kind: 'library', amb: 'library', tint: 0.45, blur: 7 };
  return base;
}

export class SceneDirector {
  constructor({ getTheme, getMotion, audio }) {
    this.getTheme = getTheme; this.getMotion = getMotion; this.audio = audio;
    this.stage = h('div', { class: 'scene-stage', 'aria-hidden': 'true' });
    this.current = null; this.currentKind = null; this.currentOpts = null;
    document.body.prepend(this.stage);
    document.addEventListener('visibilitychange', () => this.stage.classList.toggle('paused', document.hidden));
    this.refreshTheme();
  }
  refreshTheme() {
    const night = (this.getTheme ? this.getTheme() : 'dark') !== 'light';
    this.stage.classList.toggle('night', night); this.stage.classList.toggle('day', !night);
    this.stage.classList.toggle('still', !!(this.getMotion && this.getMotion() === false));
  }
  /** Show a scene (crossfade). opts: {amb, tint, blur, battle} */
  setScene(kind, opts = {}) {
    this.refreshTheme();
    if (kind === this.currentKind && this.current) {
      this.current.style.setProperty('--scene-tint', opts.tint ?? 0.5);
      this.current.style.setProperty('--scene-blur', (opts.blur ?? 5) + 'px');
      this.stage.classList.toggle('battle', !!opts.battle);
      if (this.audio) this.audio.ambience(opts.amb || null);
      return;
    }
    const next = sceneFor(kind, { blur: opts.blur ?? 5, tint: opts.tint ?? 0.5 });
    next.classList.add('director');
    const prev = this.current;
    this.stage.appendChild(next);
    requestAnimationFrame(() => next.classList.add('on'));
    if (prev) { prev.classList.remove('on'); setTimeout(() => prev.remove(), 700); }
    this.current = next; this.currentKind = kind; this.currentOpts = opts;
    this.stage.classList.toggle('battle', !!opts.battle);
    if (this.audio) this.audio.ambience(opts.amb || null);
  }
  react(kind) { if (this.current && this.current[kind]) this.current[kind](); }
  /** A brief lightning flicker (Great Battle, timer low). */
  lightning() { if (this.getMotion && this.getMotion() === false) return; this.stage.classList.remove('lightning'); void this.stage.offsetWidth; this.stage.classList.add('lightning'); }
}
