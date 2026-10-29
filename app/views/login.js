// The gate: one name, two buttons. Enter opens an existing profile; Create profile makes a new one and never opens
// someone else's. Old single-device saves found on this device can be brought into the profile.
import { h, clear } from '../ui.js';
import { icon } from '../icons.js';
import { enterProfile, createProfile } from '../account.js';
import { normalizeName } from '../store.js';

export function loginScreen(app, { onEntered }) {
  const store = app.store; const syncer = app.syncer;
  const input = h('input', { type: 'text', placeholder: 'e.g. Austin', maxlength: '20', autocomplete: 'off', autocapitalize: 'words', spellcheck: 'false', 'aria-label': 'Your name' });
  const msg = h('div', { class: 'login-msg', role: 'status', 'aria-live': 'polite' });
  const enterBtn = h('button', { class: 'btn primary big', type: 'button' }, 'Enter');
  const createBtn = h('button', { class: 'btn big', type: 'button' }, 'Create profile');
  const extra = h('div', { class: 'row wrap login-extra' });
  let busy = false; let pendingClaim = null;
  const setBusy = b => { busy = b; enterBtn.disabled = b; createBtn.disabled = b; input.disabled = b; };
  const say = (text, kind = '') => { msg.textContent = text || ''; msg.className = 'login-msg ' + kind; clear(extra); };

  async function finish(result) {
    if (!result.ok) { say(result.error, result.taken ? 'bad' : result.notFound ? '' : 'bad'); return false; }
    if (pendingClaim) { try { store.claimLegacy(pendingClaim); } catch (e) { console.error(e); } pendingClaim = null; }
    say(result.offline ? 'Opened from this device (offline). It will sync when you are back online.' : '');
    onEntered && onEntered();
    return true;
  }
  async function doEnter() {
    if (busy) return; setBusy(true); say('Looking for your camp…');
    try {
      const r = await enterProfile(store, syncer, input.value);
      if (r.notFound) {
        say(r.error);
        extra.appendChild(h('button', { class: 'btn sm primary', type: 'button', onClick: doCreate }, `Create “${normalizeName(input.value)}”`));
      } else await finish(r);
    } finally { setBusy(false); }
  }
  async function doCreate() {
    if (busy) return; setBusy(true); say('Raising the standard…');
    try {
      const r = await createProfile(store, syncer, input.value);
      if (r.taken) {
        say(r.error, 'bad');
        extra.appendChild(h('span', { class: 'small muted' }, 'Already yours from another device? '));
        extra.appendChild(h('button', { class: 'btn sm ghost', type: 'button', onClick: doEnter }, pendingClaim ? 'Enter it and merge this progress in' : 'Enter it instead'));
      } else await finish(r);
    } finally { setBusy(false); }
  }
  enterBtn.addEventListener('click', doEnter);
  createBtn.addEventListener('click', doCreate);
  input.addEventListener('keydown', e => { if (e.key === 'Enter') { e.preventDefault(); doEnter(); } });

  // profiles that were opened on this device before
  const recent = store.profiles.slice(0, 6);
  const recentRow = recent.length ? h('div', { class: 'login-recent' }, h('span', { class: 'tiny muted' }, 'Been here before:'), recent.map(p => h('button', { class: 'chip', type: 'button', onClick: () => { input.value = p.username; doEnter(); } }, icon('galea', { size: 12, tone: 'gold' }), p.username))) : null;

  // old saves on this device
  const legacy = store.legacyProfiles().filter(p => !p.claimed);
  const legacyCard = legacy.length ? h('div', { class: 'card stack login-legacy' },
    h('div', { class: 'eyebrow' }, icon('scroll', { size: 14, tone: 'gold' }), 'Progress found on this device'),
    h('p', { class: 'small muted' }, 'These saves were made before profiles existed. Bring one into a profile and it carries its XP, mastery and campaign with it. The old save stays on this device as a backup.'),
    h('div', { class: 'list' }, legacy.map(p => h('div', { class: 'li' },
      h('div', { class: 'grow' }, h('div', { class: 't' }, p.name), h('div', { class: 's' }, `${p.xp} XP · ${p.answered} answers · since ${new Date(p.createdAt || Date.now()).toLocaleDateString()}`)),
      h('button', { class: 'btn sm primary', type: 'button', onClick: () => { pendingClaim = p.id; input.value = p.name; say(`“${p.name}” will be merged into the profile you enter or create. Enter if it already exists, or create it now.`); input.focus(); } }, 'Bring this progress into a profile'))))) : null;

  const el = h('div', { class: 'login' },
    h('div', { class: 'login-card' },
      h('div', { class: 'login-brand' }, h('div', { class: 'brand-mark big', html: brandSvg() }), h('div', null, h('h1', null, 'Imperium'), h('div', { class: 'brand-sub' }, 'MARK 201 · FIN 201 · study campaigns'))),
      h('p', { class: 'muted login-lede' }, 'One name, every device. Your legionary, coins and every course campaign live in your profile.'),
      h('div', { class: 'field' }, h('label', null, 'Your name, legionary'), input),
      h('div', { class: 'row wrap login-actions' }, enterBtn, createBtn),
      msg, extra, recentRow,
      h('p', { class: 'tiny faint' }, '3–20 letters, numbers, spaces or underscores. Capitals and extra spaces do not matter. There is no password: anyone who types your name opens your camp, so pick something that is yours.')),
    legacyCard,
    h('div', { class: 'tiny faint center login-foot' }, syncer && syncer.status === 'off' ? 'Profile service not configured: progress stays on this device.' : navigator.onLine === false ? 'You are offline. Names opened here before still work.' : ''));
  setTimeout(() => input.focus(), 60);
  return el;
}

export function brandSvg() {
  return `<svg viewBox="0 0 64 64" aria-hidden="true"><path d="M 32 6 l 6 10 l 11 -3 l -3 11 l 10 6 l -10 6 l 3 11 l -11 -3 l -6 10 l -6 -10 l -11 3 l 3 -11 l -10 -6 l 10 -6 l -3 -11 l 11 3 z" fill="#C9A227" opacity="0.9"/><path d="M 22 44 h 20 v 4 h -20 z M 24 24 h 16 l -2 20 h -12 z" fill="#8B1E1E"/><path d="M 32 14 l 4 7 h -8 z" fill="#F0E1BC"/></svg>`;
}
