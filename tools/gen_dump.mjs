// Dump every FIN 201 generator for N seeds as JSON (consumed by tools/verify_fin201.py).
// Usage: node tools/gen_dump.mjs [seeds=20]
import { GENERATORS, generate } from '../app/courses/fin201/generators.js';
const N = parseInt(process.argv[2] || '20', 10);
const out = {};
for (const [name, g] of Object.entries(GENERATORS)) {
  out[name] = [];
  for (let seed = 1; seed <= N; seed++) {
    const q = generate({ id: `g-${name}-${seed}`, concept: g.concept, generator: name }, seed);
    out[name].push({ seed, concept: g.concept, type: q.type, givens: q.givens, answer: q.answer, unit: q.unit, tolerance: q.tolerance, steps: q.steps.map(s => ({ label: s.label, value: s.value, tolerance: s.tolerance })), errors: q.errors.map(e => ({ id: e.id, value: e.value })), stem: q.stem, solutionLines: q.solution.length, keystrokes: q.keystrokes.length });
  }
}
process.stdout.write(JSON.stringify(out));
