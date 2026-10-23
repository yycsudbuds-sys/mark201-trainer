// War Briefing cutscene: the Legatus briefs you in his tent by torchlight before a lesson, battle, siege or drill.
// Skippable; the "War briefings" toggle disables it entirely.
import { h } from './ui.js';
import { svg } from './visuals.js';
import { PROVINCES, ROMAN } from './map.js';
import { masteryLevel } from './engine.js';
import { icon } from './icons.js';

const LEGATUS = 'Legatus Gaius Mercator';

/** A shaded bust: muscled cuirass with pteruges, paludamentum, crested galea, torchlight from the left. */
function legatusSvg() {
  const s = svg('svg', { viewBox: '0 0 360 400', 'aria-hidden': 'true' });
  const g = (id, stops, x1 = 0, y1 = 0, x2 = 1, y2 = 1) => svg('linearGradient', { id, x1, y1, x2, y2 }, stops.map(([o, c]) => svg('stop', { offset: o, 'stop-color': c })));
  s.appendChild(svg('defs', {},
    g('lg-cloak', [[0, '#A3332C'], [0.45, '#6E1816'], [1, '#2E0A09']]),
    g('lg-cloak2', [[0, '#8B1E1E'], [1, '#3A0C0C']], 0, 0, 0, 1),
    g('lg-helm', [[0, '#F0D98A'], [0.3, '#C9A227'], [0.7, '#8E6B1C'], [1, '#3E2D0C']]),
    g('lg-skin', [[0, '#D9A47C'], [0.55, '#9C6B4A'], [1, '#5A3A26']]),
    g('lg-armor', [[0, '#C8BCA4'], [0.4, '#8E8470'], [0.8, '#4A4238'], [1, '#2A251F']]),
    g('lg-leather', [[0, '#8B6B3A'], [1, '#3B2A17']], 0, 0, 0, 1),
    svg('radialGradient', { id: 'lg-rim', cx: 0.15, cy: 0.25, r: 0.9 }, svg('stop', { offset: 0, 'stop-color': '#FFB347', 'stop-opacity': 0.45 }), svg('stop', { offset: 0.6, 'stop-color': '#FFB347', 'stop-opacity': 0.08 }), svg('stop', { offset: 1, 'stop-color': '#000', 'stop-opacity': 0 })),
    svg('radialGradient', { id: 'lg-shade', cx: 0.9, cy: 0.5, r: 0.8 }, svg('stop', { offset: 0, 'stop-color': '#000', 'stop-opacity': 0.55 }), svg('stop', { offset: 1, 'stop-color': '#000', 'stop-opacity': 0 }))));
  // cloak (paludamentum) with folds
  s.appendChild(svg('path', { d: 'M 14 400 C 22 282, 84 236, 180 230 C 276 236, 338 282, 346 400 Z', fill: 'url(#lg-cloak)' }));
  [[60, 300], [96, 280], [300, 300], [262, 280]].forEach(([x, y]) => s.appendChild(svg('path', { d: `M ${x} 400 C ${x - 6} ${y + 60}, ${x + 6} ${y + 20}, ${x + 4} ${y}`, stroke: 'rgba(0,0,0,0.35)', 'stroke-width': 6, fill: 'none', 'stroke-linecap': 'round' })));
  s.appendChild(svg('path', { d: 'M 14 400 C 30 320, 70 270, 120 252 L 112 400 Z', fill: 'url(#lg-shade)' }));
  // pteruges (leather strips)
  for (let i = 0; i < 9; i++) s.appendChild(svg('rect', { x: 104 + i * 18, y: 330, width: 14, height: 70, rx: 3, fill: 'url(#lg-leather)', stroke: '#241508', 'stroke-width': 1 }));
  // cuirass
  s.appendChild(svg('path', { d: 'M 100 400 C 96 310, 118 258, 180 252 C 242 258, 264 310, 260 400 Z', fill: 'url(#lg-armor)', stroke: '#1A1410', 'stroke-width': 2 }));
  s.appendChild(svg('path', { d: 'M 140 300 q 40 24 80 0 M 132 332 q 48 26 96 0 M 150 268 q 30 16 60 0', fill: 'none', stroke: '#1A1410', 'stroke-width': 3, opacity: 0.75 }));
  s.appendChild(svg('path', { d: 'M 150 268 q 30 16 60 0', fill: 'none', stroke: 'rgba(255,230,180,0.35)', 'stroke-width': 1.2 }));
  // gorgon medallion and shoulder straps
  s.appendChild(svg('circle', { cx: 180, cy: 282, r: 12, fill: 'url(#lg-helm)', stroke: '#3E2D0C', 'stroke-width': 2 })); s.appendChild(svg('circle', { cx: 180, cy: 282, r: 5, fill: '#5E1313' }));
  s.appendChild(svg('path', { d: 'M 128 262 l 20 24 M 232 262 l -20 24', stroke: '#C9A227', 'stroke-width': 5, 'stroke-linecap': 'round' }));
  // neck
  s.appendChild(svg('path', { d: 'M 158 212 L 202 212 L 210 258 L 150 258 Z', fill: 'url(#lg-skin)' }));
  s.appendChild(svg('path', { d: 'M 158 212 L 202 212 L 198 238 L 162 238 Z', fill: '#000', opacity: 0.4 }));
  // head
  s.appendChild(svg('path', { d: 'M 130 158 C 126 92, 234 92, 230 158 C 230 200, 212 236, 180 240 C 148 236, 130 200, 130 158 Z', fill: 'url(#lg-skin)' }));
  s.appendChild(svg('path', { d: 'M 230 158 C 230 200, 212 236, 180 240 L 180 150 Z', fill: 'url(#lg-shade)' }));
  // brow, eyes, nose, mouth, jaw stubble
  s.appendChild(svg('path', { d: 'M 142 156 q 38 -14 76 0 l 0 9 q -38 -5 -76 0 z', fill: '#2A1409', opacity: 0.6 }));
  s.appendChild(svg('path', { d: 'M 148 168 q 12 -8 24 0 q -12 7 -24 0 z M 188 168 q 12 -8 24 0 q -12 7 -24 0 z', fill: '#1A1206' }));
  s.appendChild(svg('circle', { cx: 160, cy: 168, r: 2, fill: '#FFF' })); s.appendChild(svg('circle', { cx: 200, cy: 168, r: 2, fill: '#FFF' }));
  s.appendChild(svg('path', { d: 'M 180 170 L 170 206 L 190 206 Z', fill: '#6A4330', opacity: 0.85 }));
  s.appendChild(svg('path', { d: 'M 162 216 q 18 5 36 0', fill: 'none', stroke: '#3A1F12', 'stroke-width': 3, 'stroke-linecap': 'round' }));
  s.appendChild(svg('path', { d: 'M 136 190 C 148 240, 212 240, 224 190 L 224 210 C 212 250, 148 250, 136 210 Z', fill: '#2A1409', opacity: 0.4 }));
  // helmet: bowl, brow band, cheek guards, neck guard, crest
  s.appendChild(svg('path', { d: 'M 120 158 C 116 70, 244 70, 240 158 L 240 144 C 240 102, 120 102, 120 144 Z', fill: 'url(#lg-helm)', stroke: '#1A1410', 'stroke-width': 2 }));
  s.appendChild(svg('path', { d: 'M 116 146 L 244 146 L 248 162 L 112 162 Z', fill: 'url(#lg-helm)', stroke: '#1A1410', 'stroke-width': 1.5 }));
  s.appendChild(svg('path', { d: 'M 118 160 C 110 186, 118 214, 142 222 L 150 170 Z M 242 160 C 250 186, 242 214, 218 222 L 210 170 Z', fill: 'url(#lg-helm)', stroke: '#1A1410', 'stroke-width': 1.5 }));
  s.appendChild(svg('path', { d: 'M 106 160 L 254 160 L 266 176 L 94 176 Z', fill: '#3E2D0C', opacity: 0.65 }));
  s.appendChild(svg('path', { d: 'M 110 112 C 120 40, 240 40, 250 112 C 232 92, 128 92, 110 112 Z', fill: 'url(#lg-cloak2)', stroke: '#3A0C0C', 'stroke-width': 2 }));
  for (let i = 0; i < 18; i++) { const x = 112 + i * 7.6; const k = Math.sin(i / 17 * Math.PI); s.appendChild(svg('line', { x1: x, y1: 108 - k * 18, x2: x + 2, y2: 108 - k * 18 - 26 - k * 26, stroke: i % 3 === 0 ? '#C0392B' : '#8B1E1E', 'stroke-width': 4, 'stroke-linecap': 'round' })); }
  s.appendChild(svg('path', { d: 'M 126 150 C 126 108, 150 92, 180 90', fill: 'none', stroke: 'rgba(255,240,200,0.45)', 'stroke-width': 2 }));
  // torch rim light
  s.appendChild(svg('rect', { x: 0, y: 0, width: 360, height: 400, fill: 'url(#lg-rim)', style: 'mix-blend-mode:screen' }));
  return s;
}

function roman(n) { return ROMAN[n] || String(n); }

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
    lines.push('Read the scrolls, then the battle. Hold every stronghold to Solid and we plant the standard. The legion is yours.');
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

/** Show the war briefing. Resolves when the player takes command (immediately if briefings are off). */
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
      h('div', { class: 'tent-table' }, h('div', { class: 'tent-map' }), h('div', { class: 'tent-token t1' }), h('div', { class: 'tent-token t2' }), h('div', { class: 'tent-scroll' })),
      h('div', { class: 'torch left' }, h('div', { class: 'glow' }), h('div', { class: 'stick' }), h('div', { class: 'flame' })),
      h('div', { class: 'torch right' }, h('div', { class: 'glow' }), h('div', { class: 'stick' }), h('div', { class: 'flame' })),
      h('div', { class: 'shadow-sweep' }), avatar, h('div', { class: 'tent-vignette' }),
      h('div', { class: 'briefing' },
        h('div', { class: 'brief-name' }, icon('galea', { size: 18, tone: 'gold' }), LEGATUS, h('span', { class: 'muted', style: { letterSpacing: '0.1em' } }, ctx.chapter ? `· Provincia ${PROVINCES[ctx.chapter.chapter]?.name || ''}` : '· Castra')),
        textEl,
        h('div', { class: 'brief-actions' }, h('div', { class: 'row wrap' }, stepEl, objectives), h('div', { class: 'row' }, skipBtn, nextBtn, goBtn))));
    overlay.appendChild(tent);
    document.body.appendChild(overlay);
    requestAnimationFrame(() => overlay.classList.add('show'));
    app.sound && app.sound('unroll');
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
      if (li < lines.length - 1) { li++; app.sound && app.sound('tick'); render(); } else finish();
    }
    function finish() {
      if (done) return; done = true;
      clearInterval(typing);
      document.removeEventListener('keydown', onKey);
      window.removeEventListener('hashchange', finish);
      document.body.style.overflow = prevOverflow;
      overlay.classList.remove('show');
      app.sound && app.sound('knock');
      setTimeout(() => overlay.remove(), 450);
      resolve();
    }
    function onKey(e) { if (e.key === 'Enter' || e.key === ' ' || e.key === 'ArrowRight') { e.preventDefault(); advance(); } else if (e.key === 'Escape') finish(); }
    document.addEventListener('keydown', onKey);
    window.addEventListener('hashchange', finish); // leaving the route closes the tent
    render();
    setTimeout(() => goBtn.focus({ preventScroll: true }), 50);
  });
}
