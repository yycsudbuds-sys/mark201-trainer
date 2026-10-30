// Course registry. Each course is a self-contained pack (content, campaign geography, scenes, commanders, exam
// settings, copy) loaded on demand. Every concept, topic, question and activity id inside a pack is prefixed with
// the course id, so nothing can bleed between courses.
export const COURSES = [
  { id: 'mark201', title: 'MARK 201', name: 'Imperium Marketing', sub: 'Midterm · Chapters 1, 6–12', ready: true, color: '#C9A227', load: () => import('./mark201/pack.js') },
  { id: 'fin201', title: 'FIN 201', name: 'Imperium Finance', sub: 'Midterm 2 · Chapters 8–13', ready: true, color: '#4FA3A5', load: () => import('./fin201/pack.js') },
];
export const COURSE_IDS = COURSES.map(c => c.id);
export function courseMeta(id) { return COURSES.find(c => c.id === id) || null; }

const cache = new Map(); const loaded = new Map();
/** Load (once) and return the pack for a course id. Rejects for unknown or not-yet-ready courses. */
export function loadPack(id) {
  const meta = courseMeta(id);
  if (!meta) return Promise.reject(new Error(`Unknown course: ${id}`));
  if (!meta.ready) return Promise.reject(new Error(`${meta.title} opens soon`));
  if (!cache.has(id)) cache.set(id, meta.load().then(m => { const p = m.PACK; p.meta = meta; loaded.set(id, p); return p; }).catch(err => { cache.delete(id); throw err; }));
  return cache.get(id);
}
/** The pack object when it has already loaded, else null (no loading is triggered). */
export function packIfLoaded(id) { return loaded.get(id) || null; }
