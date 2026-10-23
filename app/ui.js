// Small DOM + feedback helpers.

export function h(tag, attrs, ...children) {
  const el = document.createElement(tag);
  if (attrs) {
    for (const [k, v] of Object.entries(attrs)) {
      if (v === null || v === undefined || v === false) continue;
      if (k === 'class') el.className = v;
      else if (k === 'style' && typeof v === 'object') Object.assign(el.style, v);
      else if (k.startsWith('on') && typeof v === 'function') el.addEventListener(k.slice(2).toLowerCase(), v);
      else if (k === 'html') el.innerHTML = v;
      else if (k === 'dataset') Object.assign(el.dataset, v);
      else if (v === true) el.setAttribute(k, '');
      else el.setAttribute(k, v);
    }
  }
  append(el, children);
  return el;
}

export function append(el, children) {
  for (const c of children.flat(Infinity)) {
    if (c === null || c === undefined || c === false) continue;
    el.appendChild(typeof c === 'string' || typeof c === 'number' ? document.createTextNode(String(c)) : c);
  }
  return el;
}

export function clear(el) { while (el.firstChild) el.removeChild(el.firstChild); return el; }

export function fmtPct(x) { return Math.round(x * 100) + '%'; }
export function fmtTime(sec) {
  sec = Math.max(0, Math.round(sec));
  const m = Math.floor(sec / 60); const s = sec % 60;
  return `${m}:${String(s).padStart(2, '0')}`;
}
export function plural(n, word, pl) { return `${n} ${n === 1 ? word : (pl || word + 's')}`; }
export function timeAgo(t) {
  const d = Date.now() - t;
  if (d < 60000) return 'just now';
  if (d < 3600000) return `${Math.floor(d / 60000)} min ago`;
  if (d < 86400000) return `${Math.floor(d / 3600000)} h ago`;
  return `${Math.floor(d / 86400000)} d ago`;
}

// ---- toasts ----
let toastHost = null;
export function toast(msg, kind = 'info', ms = 2600) {
  if (!toastHost) { toastHost = h('div', { class: 'toasts', 'aria-live': 'polite' }); document.body.appendChild(toastHost); }
  const t = h('div', { class: `toast toast-${kind}` }, msg);
  toastHost.appendChild(t);
  requestAnimationFrame(() => t.classList.add('show'));
  setTimeout(() => { t.classList.remove('show'); setTimeout(() => t.remove(), 300); }, ms);
}

// ---- XP coin flight: a bronze coin lifts from the answer and flies to the XP bar ----
export function coinFlight(anchor, amount) {
  if (!anchor) return;
  const target = document.querySelector('.xpbar');
  const r = anchor.getBoundingClientRect();
  const el = h('div', { class: 'xp-coin' }, h('span', { class: 'xp-coin-disc' }), h('span', { class: 'xp-coin-text' }, `+${amount} XP`));
  el.style.left = (r.left + Math.min(r.width - 40, 60)) + 'px';
  el.style.top = (r.top + r.height / 2) + 'px';
  document.body.appendChild(el);
  if (prefersReducedMotion() || !target) { el.classList.add('static'); setTimeout(() => el.remove(), 900); return; }
  const t = target.getBoundingClientRect();
  const dx = (t.left + t.width * 0.4) - (r.left + Math.min(r.width - 40, 60));
  const dy = (t.top + t.height / 2) - (r.top + r.height / 2);
  requestAnimationFrame(() => { el.classList.add('lift'); setTimeout(() => { el.style.setProperty('--dx', dx + 'px'); el.style.setProperty('--dy', dy + 'px'); el.classList.add('fly'); }, 420); });
  setTimeout(() => { target.classList.remove('shimmer'); void target.offsetWidth; target.classList.add('shimmer'); }, 1050);
  setTimeout(() => el.remove(), 1300);
}
export function floatXp(anchor, text) { coinFlight(anchor, String(text).replace(/[^\d]/g, '') || text); }

export function prefersReducedMotion() {
  return document.documentElement.dataset.motion === 'off' || window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

// ---- confetti (lightweight canvas) ----
export function confetti(opts = {}) {
  if (prefersReducedMotion()) return;
  const n = opts.count || 120;
  const colors = opts.colors || ['#FF6B6B', '#FFB84D', '#A3E635', '#2DD4BF', '#38BDF8', '#A78BFA', '#F472B6', '#FB923C'];
  const c = document.createElement('canvas');
  c.className = 'confetti';
  c.width = window.innerWidth; c.height = window.innerHeight;
  document.body.appendChild(c);
  const ctx = c.getContext('2d');
  const parts = Array.from({ length: n }, () => ({
    x: c.width / 2 + (Math.random() - 0.5) * c.width * 0.4,
    y: c.height * 0.35,
    vx: (Math.random() - 0.5) * 14,
    vy: -Math.random() * 14 - 4,
    w: 6 + Math.random() * 6, hgt: 8 + Math.random() * 8,
    rot: Math.random() * Math.PI, vr: (Math.random() - 0.5) * 0.3,
    color: colors[Math.floor(Math.random() * colors.length)],
  }));
  const start = performance.now();
  function frame(t) {
    const dt = (t - start) / 1000;
    ctx.clearRect(0, 0, c.width, c.height);
    for (const p of parts) {
      p.vy += 0.35; p.x += p.vx; p.y += p.vy; p.vx *= 0.99; p.rot += p.vr;
      ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(p.rot); ctx.fillStyle = p.color;
      ctx.globalAlpha = Math.max(0, 1 - dt / 2.2);
      ctx.fillRect(-p.w / 2, -p.hgt / 2, p.w, p.hgt); ctx.restore();
    }
    if (dt < 2.3) requestAnimationFrame(frame); else c.remove();
  }
  requestAnimationFrame(frame);
}

// ---- sound (WebAudio blips, no assets) ----
let audioCtx = null;
export function sound(kind, enabled = true) {
  if (!enabled) return;
  try {
    audioCtx = audioCtx || new (window.AudioContext || window.webkitAudioContext)();
    if (audioCtx.state === 'suspended') audioCtx.resume();
    const now = audioCtx.currentTime;
    const seq = {
      correct: [[660, 0, 0.08], [880, 0.08, 0.12]],
      wrong: [[220, 0, 0.18], [180, 0.12, 0.2]],
      level: [[523, 0, 0.1], [659, 0.1, 0.1], [784, 0.2, 0.1], [1047, 0.3, 0.25]],
      tick: [[1200, 0, 0.03]],
      clear: [[784, 0, 0.1], [988, 0.1, 0.1], [1175, 0.2, 0.3]],
      heart: [[330, 0, 0.1], [262, 0.1, 0.25]],
    }[kind] || [[600, 0, 0.05]];
    for (const [f, t0, dur] of seq) {
      const o = audioCtx.createOscillator(); const g = audioCtx.createGain();
      o.type = kind === 'wrong' || kind === 'heart' ? 'sawtooth' : 'sine';
      o.frequency.value = f;
      g.gain.setValueAtTime(0.0001, now + t0);
      g.gain.exponentialRampToValueAtTime(0.12, now + t0 + 0.01);
      g.gain.exponentialRampToValueAtTime(0.0001, now + t0 + dur);
      o.connect(g); g.connect(audioCtx.destination);
      o.start(now + t0); o.stop(now + t0 + dur + 0.02);
    }
  } catch { /* audio unavailable */ }
}

// ---- progress ring (SVG) ----
export function ring(value, { size = 56, stroke = 6, color = 'var(--accent)', label = null, track = 'var(--ring-track)' } = {}) {
  const r = (size - stroke) / 2; const c = 2 * Math.PI * r;
  const v = Math.max(0, Math.min(1, value || 0));
  const svg = `<svg class="ring" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" aria-hidden="true">
    <circle cx="${size / 2}" cy="${size / 2}" r="${r}" fill="none" stroke="${track}" stroke-width="${stroke}"/>
    <circle cx="${size / 2}" cy="${size / 2}" r="${r}" fill="none" stroke="${color}" stroke-width="${stroke}" stroke-linecap="round"
      stroke-dasharray="${c}" stroke-dashoffset="${c * (1 - v)}" transform="rotate(-90 ${size / 2} ${size / 2})"/>
  </svg>`;
  const wrap = h('div', { class: 'ring-wrap', style: { width: size + 'px', height: size + 'px' }, html: svg });
  if (label !== null) wrap.appendChild(h('div', { class: 'ring-label' }, label));
  return wrap;
}

export function bar(value, { color = 'var(--accent)', height = 8, label = null } = {}) {
  const v = Math.max(0, Math.min(1, value || 0));
  const el = h('div', { class: 'bar', style: { height: height + 'px' } }, h('div', { class: 'bar-fill', style: { width: (v * 100) + '%', background: color } }));
  if (label) return h('div', { class: 'bar-row' }, h('span', { class: 'bar-label' }, label), el);
  return el;
}

export function modal({ title, body, actions = [], onClose, wide = false }) {
  const overlay = h('div', { class: 'modal-overlay', role: 'dialog', 'aria-modal': 'true' });
  const close = () => { overlay.classList.remove('show'); setTimeout(() => overlay.remove(), 200); onClose && onClose(); document.removeEventListener('keydown', esc); };
  const esc = e => { if (e.key === 'Escape') close(); };
  document.addEventListener('keydown', esc);
  const box = h('div', { class: 'modal' + (wide ? ' modal-wide' : '') },
    h('div', { class: 'modal-head' }, h('h3', null, title), h('button', { class: 'icon-btn', 'aria-label': 'Close', onClick: close }, '✕')),
    h('div', { class: 'modal-body' }, body),
    actions.length ? h('div', { class: 'modal-actions' }, actions.map(a => h('button', { class: 'btn ' + (a.kind || ''), onClick: () => { const r = a.onClick && a.onClick(); if (r !== false) close(); } }, a.label))) : null,
  );
  overlay.appendChild(box);
  overlay.addEventListener('click', e => { if (e.target === overlay) close(); });
  document.body.appendChild(overlay);
  requestAnimationFrame(() => overlay.classList.add('show'));
  return { close, el: overlay };
}

export function escapeHtml(s) {
  return String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

// Fisher-Yates
export function shuffle(arr, rng = Math.random) {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(rng() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; }
  return a;
}
