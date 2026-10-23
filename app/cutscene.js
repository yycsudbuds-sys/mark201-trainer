// War Briefing cutscene: a Roman general's tent at night. A Legatus delivers the tactical briefing,
// then hands the reins to the player. Skippable; can be disabled in the Quartermaster (settings).
import { h } from './ui.js';
import { svg } from './visuals.js';
import { PROVINCES, ROMAN } from './map.js';
import { masteryLevel } from './engine.js';

const LEGATUS = 'Legatus Gaius Mercator';

function legatusSvg() {
  const s = svg('svg', { viewBox: '0 0 340 380', 'aria-hidden': 'true' });
  s.appendChild(svg('defs', {},
    svg('linearGradient', { id: 'cloak', x1: 0, y1: 0, x2: 1, y2: 1 }, svg('stop', { offset: 0, 'stop-color': '#7A1A17' }), svg('stop', { offset: 0.5, 'stop-color': '#4E0F0F' }), svg('stop', { offset: 1, 'stop-color': '#2A0808' })),
    svg('linearGradient', { id: 'helm', x1: 0, y1: 0, x2: 1, y2: 1 }, svg('stop', { offset: 0, 'stop-color': '#D8B85A' }), svg('stop', { offset: 0.45, 'stop-color': '#8E6B1C' }), svg('stop', { offset: 1, 'stop-color': '#3E2D0C' })),
    svg('linearGradient', { id: 'skin', x1: 0, y1: 0, x2: 1, y2: 1 }, svg('stop', { offset: 0, 'stop-color': '#B98762' }), svg('stop', { offset: 0.6, 'stop-color': '#7E5438' }), svg('stop', { offset: 1, 'stop-color': '#4A2E1C' })),
    svg('linearGradient', { id: 'armor', x1: 0, y1: 0, x2: 1, y2: 1 }, svg('stop', { offset: 0, 'stop-color': '#9A8E74' }), svg('stop', { offset: 0.5, 'stop-color': '#5C5244' }), svg('stop', { offset: 1, 'stop-color': '#2E2820' })),
    svg('radialGradient', { id: 'rim', cx: 0.2, cy: 0.3, r: 0.9 }, svg('stop', { offset: 0, 'stop-color': '#FFB347', 'stop-opacity': 0.35 }), svg('stop', { offset: 1, 'stop-color': '#000', 'stop-opacity': 0 }))));
  s.appendChild(svg('path', { d: 'M 20 380 C 30 270, 90 236, 170 232 C 250 236, 310 270, 320 380 Z', fill: 'url(#cloak)' }));
  s.appendChild(svg('path', { d: 'M 20 380 C 40 300, 80 260, 120 250 L 110 380 Z', fill: '#000', opacity: 0.35 }));
  s.appendChild(svg('path', { d: 'M 100 380 C 98 300, 118 250, 170 246 C 222 250, 242 300, 240 380 Z', fill: 'url(#armor)', stroke: '#1A1410', 'stroke-width': 2 }));
  s.appendChild(svg('path', { d: 'M 135 290 q 35 22 70 0 M 128 318 q 42 22 84 0', fill: 'none', stroke: '#1A1410', 'stroke-width': 3, opacity: 0.8 }));
  s.appendChild(svg('circle', { cx: 170, cy: 268, r: 9, fill: '#C9A227', stroke: '#3E2D0C', 'stroke-width': 2 }));
  s.appendChild(svg('path', { d: 'M 150 262 L 190 262', stroke: '#C9A227', 'stroke-width': 3 }));
  s.appendChild(svg('path', { d: 'M 150 200 L 190 200 L 196 250 L 144 250 Z', fill: 'url(#skin)' }));
  s.appendChild(svg('path', { d: 'M 150 200 L 190 200 L 186 226 L 154 226 Z', fill: '#000', opacity: 0.35 }));
  s.appendChild(svg('path', { d: 'M 122 150 C 118 90, 222 90, 218 150 C 218 190, 200 222, 170 226 C 140 222, 122 190, 122 150 Z', fill: 'url(#skin)' }));
  s.appendChild(svg('path', { d: 'M 132 148 q 38 -14 76 0 l 0 10 q -38 -6 -76 0 z', fill: '#2A1409', opacity: 0.55 }));
  s.appendChild(svg('path', { d: 'M 138 160 q 12 -8 24 0 q -12 6 -24 0 z', fill: '#120A06' }));
  s.appendChild(svg('path', { d: 'M 178 160 q 12 -8 24 0 q -12 6 -24 0 z', fill: '#120A06' }));
  s.appendChild(svg('path', { d: 'M 170 162 L 160 196 L 180 196 Z', fill: '#5A3521', opacity: 0.8 }));
  s.appendChild(svg('path', { d: 'M 152 206 q 18 4 36 0', fill: 'none', stroke: '#3A1F12', 'stroke-width': 3, 'stroke-linecap': 'round' }));
  s.appendChild(svg('path', { d: 'M 128 178 C 140 226, 200 226, 212 178 L 212 196 C 200 236, 140 236, 128 196 Z', fill: '#2A1409', opacity: 0.45 }));
  s.appendChild(svg('path', { d: 'M 112 150 C 108 66, 232 66, 228 150 L 228 136 C 228 96, 112 96, 112 136 Z', fill: 'url(#helm)', stroke: '#1A1410', 'stroke-width': 2 }));
  s.appendChild(svg('path', { d: 'M 108 138 L 232 138 L 236 154 L 104 154 Z', fill: 'url(#helm)', stroke: '#1A1410', 'stroke-width': 1.5 }));
  s.appendChild(svg('path', { d: 'M 112 150 C 104 176, 112 206, 134 214 L 142 162 Z', fill: 'url(#helm)', stroke: '#1A1410', 'stroke-width': 1.5 }));
  s.appendChild(svg('path', { d: 'M 228 150 C 236 176, 228 206, 206 214 L 198 162 Z', fill: 'url(#helm)', stroke: '#1A1410', 'stroke-width': 1.5 }));
  s.appendChild(svg('path', { d: 'M 100 150 L 240 150 L 250 166 L 90 166 Z', fill: '#3E2D0C', opacity: 0.6 }));
  s.appendChild(svg('path', { d: 'M 104 104 C 112 40, 228 40, 236 104 C 220 86, 120 86, 104 104 Z', fill: '#8B1E1E', stroke: '#3A0C0C', 'stroke-width': 2 }));
  for (let i = 0; i < 16; i++) { const x = 108 + i * 8; const hgt = 28 + Math.sin(i / 15 * Math.PI) * 26; s.appendChild(svg('line', { x1: x, y1: 100 - Math.sin(i / 15 * Math.PI) * 18, x2: x + 2, y2: 100 - Math.sin(i / 15 * Math.PI) * 18 - hgt, stroke: i % 3 === 0 ? '#C0392B' : '#8B1E1E', 'stroke-width': 4, 'stroke-linecap': 'round' })); }
  s.appendChild(svg('rect', { x: 0, y: 0, width: 340, height: 380, fill: 'url(#rim)', style: 'mix-blend-mode:screen' }));
  return s;
}

function roman(n) { return ROMAN[n] || String(n); }

/** Build briefing lines for a context. kind: lesson | checkpoint | boss | exam | drill | weak */
export function briefingLines(app, ctx) {
  const ch = ctx.chapter; const pv = ch ? PROVINCES[ch.chapter] : null; const t = ctx.topic;
  const name = app.state.name || 'Legionary';
  const lines = [];
  if (ctx.kind === 'lesson' && ch && t) {
    const terms = t.concepts.map(cid => app.conceptOf(cid).concept.term);
    const weak = t.concepts.filter(cid => { const cs = app.state.concepts[cid]; return cs && cs.a?.length && masteryLevel(cs) < 3; }).map(cid => app.conceptOf(cid).concept.term);
    lines.push(`${name}. We march on ${pv.name}, Chapter ${roman(ch.chapter)}: ${ch.title}. The ground ahead is “${t.title}”.`);
    lines.push(`Our scouts count ${terms.length} strongholds: ${terms.slice(0, 4).join(', ')}${terms.length > 4 ? ' and more' : ''}. Study each before you fight for it.`);
    if (weak.length) lines.push(`Intelligence says you faltered here before: ${weak.slice(0, 3).join(', ')}. Read those scrolls twice.`);
    lines.push('Read the briefing scrolls, then the checkpoint. Hold every stronghold to Solid and we plant the standard. The legion is yours.');
  } else if (ctx.kind === 'checkpoint' && ch && t) {
    const traps = t.concepts.map(cid => app.conceptOf(cid).concept.contrast).filter(Boolean);
    lines.push(`Battle for “${t.title}”, ${pv.name}. ${t.concepts.length} strongholds must each be held to Solid: three correct answers from two angles, the last two in a row.`);
    if (traps.length) lines.push(`Watch the flanks. The enemy will try to confuse you: ${firstClause(traps[0])}`);
    lines.push('Every wrong answer opens a pursuit: the same ground will be contested three more times from new angles. Steady. Take command.');
  } else if (ctx.kind === 'boss' && ch) {
    lines.push(`The siege of ${pv.capital}, capital of ${pv.name}. Twenty-four questions drawn from the whole province, weighted toward the hard ground.`);
    lines.push('Ninety percent takes the city. Fall short and we regroup: drill the misses, then return. No retreat is final.');
  } else if (ctx.kind === 'exam') {
    lines.push(`${name}. This is the great battle in miniature: timed, mixed across every province, no word from me until the field is cleared.`);
    lines.push('Read each scenario for its cue. Every miss becomes a pursuit in the field drills afterwards. Begin when ready.');
  } else if (ctx.kind === 'weak') {
    lines.push('We ride to reinforce the weak flank: only strongholds below Solid, or under pursuit. You will see the scroll first, then prove it.');
  } else {
    lines.push(`${name}. Field drill across the provinces. The engine chooses the ground: pursuits first, then due reviews, then weak and fresh strongholds, interleaved.`);
    lines.push('Three different questions after any miss. Answer with 1 to 5, advance with Enter. Take command.');
  }
  return lines;
}

function firstClause(s) { const t = String(s).split(/[.;]/)[0].trim(); return t.length > 140 ? t.slice(0, 138) + '…' : t + '.'; }

/**
 * Show the war briefing. Returns a promise resolved when the player takes command (or immediately if briefings are off).
 * ctx: { kind, chapter, topic, objectives: [string], title }
 */
export function warBriefing(app, ctx) {
  return new Promise(resolve => {
    if (app.state.settings.briefings === false) { resolve(); return; }
    const lines = ctx.lines || briefingLines(app, ctx);
    const textEl = h('div', { class: 'brief-text' });
    const stepEl = h('span', { class: 'brief-step' }, `Briefing 1 / ${lines.length}`);
    let li = 0; let typing = null; let done = false;
    const overlay = h('div', { class: 'cutscene', role: 'dialog', 'aria-modal': 'true', 'aria-label': 'War briefing' });
    const avatar = h('div', { class: 'legatus' }, legatusSvg());
    const nextBtn = h('button', { class: 'btn', onClick: () => advance() }, 'Continue ', h('span', { class: 'kbd' }, 'Enter'));
    const goBtn = h('button', { class: 'btn primary big', onClick: () => finish() }, ctx.cta || 'Take command');
    const skipBtn = h('button', { class: 'btn ghost sm', onClick: () => finish() }, 'Skip briefing');
    const objectives = ctx.objectives ? h('div', { class: 'brief-objectives' }, ctx.objectives.map(o => h('span', { class: 'chip ch', style: ctx.chapter ? { '--ch': ctx.chapter.color } : null }, o))) : null;
    const tent = h('div', { class: 'tent' },
      h('div', { class: 'tent-canvas' }), h('div', { class: 'tent-seam' }), h('div', { class: 'tent-floor' }),
      h('div', { class: 'standard a' }), h('div', { class: 'standard b' }),
      h('div', { class: 'tent-table' }), h('div', { class: 'tent-map' }),
      h('div', { class: 'torch left' }, h('div', { class: 'glow' }), h('div', { class: 'stick' }), h('div', { class: 'flame' })),
      h('div', { class: 'torch right' }, h('div', { class: 'glow' }), h('div', { class: 'stick' }), h('div', { class: 'flame' })),
      h('div', { class: 'shadow-sweep' }), avatar, h('div', { class: 'tent-vignette' }),
      h('div', { class: 'briefing' },
        h('div', { class: 'brief-name' }, LEGATUS, h('span', { class: 'muted', style: { letterSpacing: '0.1em' } }, ctx.chapter ? `· Provincia ${PROVINCES[ctx.chapter.chapter]?.name || ''}` : '· Castra')),
        textEl,
        h('div', { class: 'brief-actions' }, h('div', { class: 'row wrap' }, stepEl, objectives), h('div', { class: 'row' }, skipBtn, nextBtn, goBtn))));
    overlay.appendChild(tent);
    document.body.appendChild(overlay);
    requestAnimationFrame(() => overlay.classList.add('show'));
    const prevOverflow = document.body.style.overflow; document.body.style.overflow = 'hidden';

    function typeLine(text) {
      clearInterval(typing);
      textEl.innerHTML = '';
      const span = h('span'); const cur = h('span', { class: 'cursor' });
      textEl.append(span, cur);
      if (document.documentElement.dataset.motion === 'off') { span.textContent = text; cur.remove(); return; }
      let i = 0;
      typing = setInterval(() => { i += 2; span.textContent = text.slice(0, i); if (i >= text.length) { clearInterval(typing); typing = null; cur.remove(); } }, 14);
    }
    function render() {
      typeLine(lines[li]);
      stepEl.textContent = `Briefing ${li + 1} / ${lines.length}`;
      const last = li === lines.length - 1;
      nextBtn.classList.toggle('hidden', last); goBtn.classList.toggle('hidden', !last);
    }
    function advance() {
      if (typing) { clearInterval(typing); typing = null; textEl.querySelector('span').textContent = lines[li]; textEl.querySelector('.cursor')?.remove(); return; }
      if (li < lines.length - 1) { li++; render(); } else finish();
    }
    function finish() {
      if (done) return; done = true;
      clearInterval(typing);
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = prevOverflow;
      overlay.classList.remove('show');
      setTimeout(() => overlay.remove(), 450);
      resolve();
    }
    function onKey(e) { if (e.key === 'Enter' || e.key === ' ' || e.key === 'ArrowRight') { e.preventDefault(); advance(); } else if (e.key === 'Escape') finish(); }
    document.addEventListener('keydown', onKey);
    render();
    setTimeout(() => goBtn.focus({ preventScroll: true }), 50);
  });
}
