// Geography of the war table: the real coastline (Natural Earth 110m, cropped and simplified in app/geo/med.json),
// the eight Roman provinces as lon/lat polygons, capitals, roads between capitals in chapter order, the battle road
// inside each province, mountain ridges for the relief, and sea lanes for the triremes. Shared by the 3D table and
// the 2.5D SVG fallback. Also the canvas painters that turn all of it into textures.

export const ORDER = [1, 6, 7, 8, 9, 10, 11, 12];
export const ROMAN = { 1: 'I', 6: 'VI', 7: 'VII', 8: 'VIII', 9: 'IX', 10: 'X', 11: 'XI', 12: 'XII' };

/** chapter -> province. poly: lon/lat territory (clipped to land when drawn); cap: capital; label: label anchor;
 *  road: the battle road inside the province from its gate to the capital (forts are spaced along it). */
export const PROV = {
  1: { key: 'italia', name: 'Chapter 1', latin: 'Italia', capital: 'Roma', cap: [12.5, 41.9], label: [13.6, 43.9],
    poly: [[6.5, 44.3], [9, 46.2], [13.5, 46.6], [13.8, 45.5], [13, 44.2], [14.5, 42.4], [16.5, 41.3], [18.6, 40.3], [18.3, 39.7], [16.2, 38.2], [16, 37.8], [15.6, 38.3], [14.8, 38.6], [13, 38.9], [12.3, 38.2], [12.5, 37.5], [15.2, 36.6], [15.6, 37.8], [15.9, 38.4], [15.3, 39.6], [14.6, 40.8], [12.4, 41.6], [10.8, 42.6], [9.9, 43.9], [8.2, 44.3]],
    road: [[8.9, 44.4], [10.6, 44.8], [11.9, 44.2], [13.5, 43.5], [14.3, 42.4], [15.0, 41.0], [14.2, 40.9], [12.5, 41.9]] },
  6: { key: 'hispania', name: 'Chapter 6', latin: 'Hispania', capital: 'Tarraco', cap: [1.25, 41.1], label: [-4.2, 39.4],
    poly: [[-9.5, 43.9], [-7, 43.9], [-1.5, 43.5], [3.4, 42.5], [3.3, 41.7], [0.2, 40], [0, 38.6], [-0.5, 37.5], [-2.5, 36.6], [-5.5, 36], [-7.5, 37], [-9, 38.8], [-9.6, 41]],
    road: [[-8.4, 43.3], [-5.6, 43.2], [-3.6, 42.4], [-3.7, 40.4], [-4.8, 37.8], [-0.5, 38.4], [-0.4, 39.5], [1.25, 41.1]] },
  7: { key: 'gallia', name: 'Chapter 7', latin: 'Gallia', capital: 'Lugdunum', cap: [4.83, 45.76], label: [1.6, 47.6],
    poly: [[-5, 48.6], [-1.5, 49.7], [2.5, 51.2], [5.5, 50.8], [7.9, 49], [7.6, 47.7], [6.5, 46.4], [7.5, 44.1], [6.8, 43.1], [3.1, 43.2], [3.4, 42.5], [-1.5, 43.5], [-2, 46.3], [-4.8, 47.9]],
    road: [[-4.4, 48.3], [-1.6, 47.2], [0.8, 47.9], [2.3, 48.8], [5.0, 48.3], [6.2, 46.6], [4.83, 45.76]] },
  8: { key: 'britannia', name: 'Chapter 8', latin: 'Britannia', capital: 'Londinium', cap: [-0.12, 51.5], label: [-2.4, 54.2],
    poly: [[-5.8, 50], [-2, 50.6], [1.5, 51.2], [1.8, 52.9], [0, 54], [-1.5, 55.5], [-3, 56.2], [-3.2, 58.5], [-6.4, 58.4], [-6.5, 56], [-5, 54.8], [-3.3, 54], [-4.9, 52.3], [-5.3, 51.6]],
    road: [[-5.0, 50.4], [-3.5, 51.5], [-2.6, 53.4], [-1.5, 54.9], [-3.1, 55.9], [-1.3, 53.0], [-0.12, 51.5]] },
  9: { key: 'germania', name: 'Chapter 9', latin: 'Germania', capital: 'Colonia', cap: [6.96, 50.94], label: [10.6, 52.3],
    poly: [[5.5, 50.8], [6.5, 53.4], [8.7, 54], [10, 55.6], [13, 54.6], [14.5, 53.9], [15, 51.5], [13.5, 49.5], [13.2, 48.4], [12.5, 47.7], [9.5, 47.5], [7.6, 47.7], [7.9, 49]],
    road: [[13.4, 48.6], [11.6, 48.1], [9.2, 48.8], [8.7, 50.1], [9.9, 51.5], [8.0, 52.2], [6.96, 50.94]] },
  10: { key: 'graecia', name: 'Chapter 10', latin: 'Graecia', capital: 'Athenae', cap: [23.73, 37.98], label: [21.6, 40.1],
    poly: [[19.4, 42.2], [22.5, 42.3], [26, 41.6], [26.5, 40.9], [24.5, 40.3], [23.5, 39.4], [24.2, 38], [25.5, 36.5], [25, 34.8], [23, 34.9], [21.6, 36.3], [21, 38.2], [20, 39.3], [19.4, 40.4], [19, 41.3]],
    road: [[19.8, 41.6], [21.4, 40.6], [22.9, 39.6], [21.8, 38.7], [22.4, 37.6], [23.73, 37.98]] },
  11: { key: 'asia', name: 'Chapter 11', latin: 'Asia', capital: 'Ephesus', cap: [27.34, 37.95], label: [33.2, 39.6],
    poly: [[26.2, 40.5], [27.5, 41.5], [29, 41.3], [32, 42], [36, 42], [39, 41.1], [41.5, 41.5], [42.5, 39.5], [41, 37.5], [36.5, 36.2], [36, 36.8], [32.5, 36.2], [30, 36.3], [29, 36.7], [27.2, 37], [26.2, 39]],
    road: [[36.5, 38.5], [34.0, 38.9], [32.8, 39.9], [30.5, 39.7], [29.0, 38.8], [28.0, 37.0], [27.34, 37.95]] },
  12: { key: 'aegyptus', name: 'Chapter 12', latin: 'Aegyptus', capital: 'Alexandria', cap: [29.92, 31.2], label: [27.6, 28.6],
    poly: [[24.8, 31.9], [29, 30.8], [31, 31.6], [33.5, 31.1], [34.3, 31.3], [34.9, 29.6], [33, 27.5], [33.8, 25], [34.6, 24.2], [24.9, 24.2], [24.9, 29.2]],
    road: [[32.9, 24.3], [32.6, 26.0], [31.2, 27.5], [30.9, 29.0], [31.3, 30.4], [29.92, 31.2]] },
};
/** Roads between capitals in chapter order (waypoints keep them on land where possible). */
export const ROADS = [
  { from: 1, to: 6, pts: [[12.5, 41.9], [11.2, 43.2], [8.6, 44.3], [6.4, 43.3], [3.6, 43.3], [2.6, 42.4], [1.25, 41.1]] },
  { from: 6, to: 7, pts: [[1.25, 41.1], [1.6, 42], [1.8, 42.6], [2.4, 43.6], [3, 45.2], [4.83, 45.76]] },
  { from: 7, to: 8, pts: [[4.83, 45.76], [3.6, 47.4], [2.3, 48.9], [1.5, 50.3], [0.8, 50.95], [-0.12, 51.5]] },
  { from: 8, to: 9, pts: [[-0.12, 51.5], [1.3, 51.15], [3.2, 51.4], [4.9, 51.6], [6.96, 50.94]] },
  { from: 9, to: 10, pts: [[6.96, 50.94], [9.2, 48.9], [11.6, 48.2], [15.2, 47.3], [18.5, 45.6], [20.6, 44.6], [22, 42.6], [22.9, 40.6], [23.73, 37.98]] },
  { from: 10, to: 11, pts: [[23.73, 37.98], [23.3, 39.2], [24.6, 40.4], [26.3, 40.7], [26.8, 39.3], [27.34, 37.95]] },
  { from: 11, to: 12, pts: [[27.34, 37.95], [29.6, 37.1], [32.3, 36.6], [35.3, 36.7], [35.6, 34.4], [34.9, 32.6], [33.8, 31.4], [31.8, 31.1], [29.92, 31.2]] },
];
/** Mountain ridges as polylines with a strength and width (degrees). */
export const RIDGES = [
  { pts: [[5.8, 44.6], [7.2, 45.6], [9, 46.2], [11, 46.9], [13, 47.1], [15, 47]], h: 1, w: 0.9 },
  { pts: [[-1.8, 43.2], [0, 42.7], [2.6, 42.4]], h: 0.8, w: 0.55 },
  { pts: [[8.2, 44.6], [10.5, 44.1], [12.4, 43.2], [13.6, 42.2], [15, 41], [16, 39.5]], h: 0.55, w: 0.55 },
  { pts: [[-8.5, 31.5], [-6, 32.8], [-3, 34.2], [0, 35.2], [4, 35.8], [7, 36.4]], h: 0.75, w: 0.8 },
  { pts: [[29, 37.1], [31.5, 37.2], [34, 37.5], [36.5, 37.8], [39, 38.4]], h: 0.8, w: 0.7 },
  { pts: [[14.3, 45.6], [16.5, 44.4], [18.5, 43.3], [20.5, 42.6], [22.5, 41.9], [25, 42.5]], h: 0.6, w: 0.65 },
  { pts: [[22, 49.2], [24, 48.3], [25.5, 46.5]], h: 0.6, w: 0.7 },
  { pts: [[35, 41], [38, 40.8], [41, 41]], h: 0.55, w: 0.5 },
  { pts: [[-7, 43.1], [-4.5, 43], [-2.5, 42.9]], h: 0.5, w: 0.45 },
  { pts: [[-3.8, 37], [-2.8, 37.2]], h: 0.5, w: 0.4 },
  { pts: [[33, 39.5], [35.5, 39.2]], h: 0.35, w: 0.9 },
];
export const SEA_LANES = [
  [[10.2, 40.4], [12.2, 38.6], [14.6, 37.8], [12.8, 39.6]],
  [[24.2, 36.6], [25.8, 38.2], [24.6, 39.4], [23.4, 38.2]],
  [[1.8, 38.2], [4.6, 37.6], [7.8, 38.8], [5.2, 39.6]],
  [[-7.2, 47.6], [-5.4, 49.2], [-4.6, 48.2]],
  [[18.5, 34.5], [22, 33.4], [26.5, 33.2], [23, 34.4]],
];
const CH_COLOR = { 1: '#C9A227', 6: '#B5623A', 7: '#4F6A3F', 8: '#2E4A7A', 9: '#6B4B2A', 10: '#8A2A1E', 11: '#7A4A1E', 12: '#1E6A7A' };
/** A geography: the provinces of one course's campaign. Packs supply their own; this one is the marketing map. */
export const DEFAULT_GEO = { order: ORDER, prov: PROV, roads: ROADS, ridges: RIDGES, seaLanes: SEA_LANES, roman: ROMAN, colors: CH_COLOR };
/** Province slot (1-based position in G.order) for a chapter; slots are what the data map and shaders carry. */
export function slotOf(G, num) { const i = G.order.indexOf(num); return i < 0 ? 0 : i + 1; }

let geoPromise = null;
/** Load the coastline once. Returns { bbox, polys } with polys as [outer ring, ...holes] in lon/lat. */
export function loadGeo() {
  if (!geoPromise) geoPromise = fetch(new URL('./geo/med.json', import.meta.url)).then(r => { if (!r.ok) throw new Error('geo ' + r.status); return r.json(); });
  return geoPromise;
}

/** Projection: lon/lat -> table units with x east, y north (v up), aspect corrected at 41.5°N. */
export function makeProjection(bbox, width = 64) {
  const [x0, y0, x1, y1] = bbox; const kx = Math.cos(41.5 * Math.PI / 180);
  const W = width; const Hh = W * ((y1 - y0) / ((x1 - x0) * kx));
  const toXY = (lon, lat) => [((lon - x0) / (x1 - x0) - 0.5) * W, ((lat - y0) / (y1 - y0) - 0.5) * Hh];
  const toUV = (lon, lat) => [(lon - x0) / (x1 - x0), (lat - y0) / (y1 - y0)];
  const fromUV = (u, v) => [x0 + u * (x1 - x0), y0 + v * (y1 - y0)];
  return { W, H: Hh, toXY, toUV, fromUV, bbox };
}
export function centroid(poly) { let x = 0, y = 0; for (const p of poly) { x += p[0]; y += p[1]; } return [x / poly.length, y / poly.length]; }
export function provinceBounds(num, G = DEFAULT_GEO) { const p = G.prov[num].poly; let a = [Infinity, Infinity], b = [-Infinity, -Infinity]; for (const q of p) { a[0] = Math.min(a[0], q[0]); a[1] = Math.min(a[1], q[1]); b[0] = Math.max(b[0], q[0]); b[1] = Math.max(b[1], q[1]); } return [a, b]; }
export function pointInPoly(x, y, poly) { let inside = false; for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) { const [xi, yi] = poly[i], [xj, yj] = poly[j]; if (((yi > y) !== (yj > y)) && (x < (xj - xi) * (y - yi) / (yj - yi) + xi)) inside = !inside; } return inside; }
export function provinceAt(lon, lat, G = DEFAULT_GEO) { for (const num of G.order) if (pointInPoly(lon, lat, G.prov[num].poly)) return num; return 0; }

/** Catmull-Rom through lon/lat points, returns n samples. */
export function smoothPath(pts, n = 48) {
  if (pts.length < 2) return pts.slice();
  const out = []; const P = i => pts[Math.max(0, Math.min(pts.length - 1, i))];
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = P(i - 1), p1 = P(i), p2 = P(i + 1), p3 = P(i + 2);
    const steps = Math.max(2, Math.round(n / (pts.length - 1)));
    for (let s = 0; s < steps; s++) { const t = s / steps, t2 = t * t, t3 = t2 * t;
      out.push([0.5 * ((2 * p1[0]) + (-p0[0] + p2[0]) * t + (2 * p0[0] - 5 * p1[0] + 4 * p2[0] - p3[0]) * t2 + (-p0[0] + 3 * p1[0] - 3 * p2[0] + p3[0]) * t3),
        0.5 * ((2 * p1[1]) + (-p0[1] + p2[1]) * t + (2 * p0[1] - 5 * p1[1] + 4 * p2[1] - p3[1]) * t2 + (-p0[1] + 3 * p1[1] - 3 * p2[1] + p3[1]) * t3)]); }
  }
  out.push(pts[pts.length - 1]); return out;
}
/** Evenly spaced points along a path (by arc length), t in [0,1]. */
export function alongPath(path, t) {
  const L = []; let total = 0; for (let i = 1; i < path.length; i++) { total += Math.hypot(path[i][0] - path[i - 1][0], path[i][1] - path[i - 1][1]); L.push(total); }
  const d = t * total; let i = 0; while (i < L.length - 1 && L[i] < d) i++;
  const prev = i === 0 ? 0 : L[i - 1]; const seg = L[i] - prev || 1; const k = Math.max(0, Math.min(1, (d - prev) / seg));
  return [path[i][0] + (path[i + 1][0] - path[i][0]) * k, path[i][1] + (path[i + 1][1] - path[i][1]) * k];
}

// ---------------------------------------------------------------- painters
function ringPath(ctx, ring, P) { ring.forEach((p, i) => { const [x, y] = P(p[0], p[1]); if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y); }); ctx.closePath(); }
function landPath(ctx, geo, P) { ctx.beginPath(); for (const poly of geo.polys) for (const ring of poly) ringPath(ctx, ring, P); }
function makeNoise(seed) { let s = seed; return () => { s = (s * 1103515245 + 12345) & 0x7fffffff; return s / 0x7fffffff; }; }

/**
 * Paint the vellum colour map. canvas pixel space: x = u*w, y = (1-v)*h (north up). Status is NOT painted here
 * (the shader / SVG handle it); only the drawn map: vellum, sea hatching, land, coast ink, province tints and borders,
 * roads, relief marks, capital rings.
 */
export function paintColorMap(canvas, geo, { next = null, G = DEFAULT_GEO } = {}) {
  const { order: ORDER, prov: PROV, roads: ROADS, colors: CH_COLOR } = G;
  const w = canvas.width, hgt = canvas.height; const ctx = canvas.getContext('2d');
  const proj = makeProjection(geo.bbox); const P = (lon, lat) => { const [u, v] = proj.toUV(lon, lat); return [u * w, (1 - v) * hgt]; };
  const g = ctx.createLinearGradient(0, 0, w, hgt); g.addColorStop(0, '#D9C59A'); g.addColorStop(0.5, '#CDB47C'); g.addColorStop(1, '#BFA66F');
  ctx.fillStyle = g; ctx.fillRect(0, 0, w, hgt);
  // sea hatching (painted waves)
  ctx.strokeStyle = 'rgba(90, 70, 40, 0.16)'; ctx.lineWidth = Math.max(1, w / 1400);
  for (let y = 0; y < hgt; y += hgt / 90) { ctx.beginPath(); for (let x = 0; x <= w; x += w / 120) { ctx.lineTo(x, y + Math.sin(x / (w / 60) + y) * (hgt / 400)); } ctx.stroke(); }
  // land
  landPath(ctx, geo, P); ctx.fillStyle = '#D9C292'; ctx.fill('evenodd');
  ctx.save(); landPath(ctx, geo, P); ctx.clip('evenodd');
  const lg = ctx.createLinearGradient(0, 0, 0, hgt); lg.addColorStop(0, 'rgba(255,250,235,0.18)'); lg.addColorStop(1, 'rgba(120,90,50,0.22)'); ctx.fillStyle = lg; ctx.fillRect(0, 0, w, hgt);
  // province tints and inked borders (clipped to land)
  for (const num of ORDER) { const pv = PROV[num]; ctx.beginPath(); ringPath(ctx, pv.poly, P); ctx.fillStyle = CH_COLOR[num] || '#8C6B4A'; ctx.globalAlpha = 0.2; ctx.fill(); ctx.globalAlpha = 1; }
  ctx.lineJoin = 'round';
  for (const num of ORDER) { const pv = PROV[num]; ctx.beginPath(); ringPath(ctx, pv.poly, P); ctx.strokeStyle = 'rgba(46, 33, 20, 0.55)'; ctx.lineWidth = w / 600; ctx.setLineDash([w / 300, w / 500]); ctx.stroke(); ctx.setLineDash([]); }
  // relief comes from the shaded height map; no hatching (it read as noise)
  ctx.strokeStyle = 'rgba(70, 50, 25, 0.55)'; ctx.lineWidth = w / 1200;
  for (const r of []) { const path = smoothPath(r.pts, 60); const n = Math.floor(path.length / 4); for (let i = 0; i < n; i++) { const [x, y] = P(...path[i * 4]); const s = (w / 260) * (0.6 + r.h * 0.6); for (let k = -1; k <= 1; k++) { const xx = x + k * s * 0.9, yy = y + (k ? s * 0.25 : 0); ctx.beginPath(); ctx.moveTo(xx - s * 0.45, yy + s * 0.3); ctx.lineTo(xx, yy - s * 0.35); ctx.lineTo(xx + s * 0.45, yy + s * 0.3); ctx.stroke(); } } }
  ctx.restore();
  // coast ink
  landPath(ctx, geo, P); ctx.strokeStyle = 'rgba(255, 248, 230, 0.55)'; ctx.lineWidth = w / 260; ctx.stroke();
  landPath(ctx, geo, P); ctx.strokeStyle = '#4A3418'; ctx.lineWidth = w / 700; ctx.stroke();
  // roads: paved, lighter centre; the next road slightly brighter
  for (const rd of ROADS) { const path = smoothPath(rd.pts, 64); const isNext = next && rd.to === next; ctx.beginPath(); path.forEach((p, i) => { const [x, y] = P(p[0], p[1]); if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y); });
    ctx.strokeStyle = 'rgba(46, 33, 20, 0.6)'; ctx.lineWidth = w / 330; ctx.stroke(); ctx.strokeStyle = isNext ? '#E3C76A' : '#C8AE78'; ctx.lineWidth = w / 800; ctx.stroke(); }
  // capital rings
  for (const num of ORDER) { const [x, y] = P(...PROV[num].cap); ctx.beginPath(); ctx.arc(x, y, w / 180, 0, Math.PI * 2); ctx.strokeStyle = '#2E2114'; ctx.lineWidth = w / 900; ctx.stroke(); }
  // grain
  const rnd = makeNoise(7); ctx.fillStyle = 'rgba(60, 40, 20, 0.05)';
  for (let i = 0; i < w * hgt / 180; i++) { ctx.fillRect(rnd() * w, rnd() * hgt, 1.5, 1.5); }
  return canvas;
}

/**
 * Paint the data map used by the shaders and for picking: R = height (sea 0, land 90, ridges up to 255),
 * G = land with border proximity (0 sea, 128 at a province border, 255 interior), B = province id * 20, A = 255.
 * Returns the ImageData too so JS can sample it (picking, road heights).
 */
export function paintDataMap(canvas, geo, G = DEFAULT_GEO) {
  const { order: ORDER, prov: PROV, ridges: RIDGES } = G;
  const w = canvas.width, hgt = canvas.height;
  const proj = makeProjection(geo.bbox); const P = (lon, lat) => { const [u, v] = proj.toUV(lon, lat); return [u * w, (1 - v) * hgt]; };
  const mk = () => { const c = document.createElement('canvas'); c.width = w; c.height = hgt; return c; };
  const land = mk(), ids = mk(), height = mk(), border = mk();
  let ctx = land.getContext('2d'); ctx.fillStyle = '#000'; ctx.fillRect(0, 0, w, hgt); landPath(ctx, geo, P); ctx.fillStyle = '#fff'; ctx.fill('evenodd');
  ctx = ids.getContext('2d'); ctx.fillStyle = '#000'; ctx.fillRect(0, 0, w, hgt); ORDER.forEach((num, i) => { ctx.beginPath(); ringPath(ctx, PROV[num].poly, P); const v = (i + 1) * 20; ctx.fillStyle = `rgb(${v},${v},${v})`; ctx.fill(); });
  ctx = height.getContext('2d'); ctx.fillStyle = '#000'; ctx.fillRect(0, 0, w, hgt);
  for (const r of RIDGES) { const path = smoothPath(r.pts, 80); const rad = (r.w / (geo.bbox[2] - geo.bbox[0])) * w; for (const p of path) { const [x, y] = P(p[0], p[1]); const gr = ctx.createRadialGradient(x, y, 0, x, y, rad); gr.addColorStop(0, `rgba(255,255,255,${0.5 * r.h})`); gr.addColorStop(1, 'rgba(255,255,255,0)'); ctx.fillStyle = gr; ctx.fillRect(x - rad, y - rad, rad * 2, rad * 2); } }
  // gentle inland rise so coasts are low and interiors a little higher
  ctx.save(); landPath(ctx, geo, P); ctx.clip('evenodd'); ctx.fillStyle = 'rgba(255,255,255,0.08)'; ctx.fillRect(0, 0, w, hgt); ctx.restore();
  ctx = border.getContext('2d'); ctx.fillStyle = '#000'; ctx.fillRect(0, 0, w, hgt); ctx.lineJoin = 'round';
  [[w / 70, 80], [w / 110, 140], [w / 180, 200], [w / 400, 255]].forEach(([lw, val]) => { ctx.strokeStyle = `rgb(${val},${val},${val})`; ctx.lineWidth = lw; for (const num of ORDER) { ctx.beginPath(); ringPath(ctx, PROV[num].poly, P); ctx.stroke(); } });
  const L = land.getContext('2d').getImageData(0, 0, w, hgt).data, I = ids.getContext('2d').getImageData(0, 0, w, hgt).data, Hh = height.getContext('2d').getImageData(0, 0, w, hgt).data, B = border.getContext('2d').getImageData(0, 0, w, hgt).data;
  const out = canvas.getContext('2d'); const img = out.createImageData(w, hgt); const d = img.data;
  for (let i = 0; i < d.length; i += 4) {
    const isLand = L[i] > 127;
    d[i] = isLand ? Math.min(255, 90 + Math.round(Hh[i] * 0.65)) : 90; // sea shares the plate base so the coast is a clean cut, not a slope
    d[i + 1] = isLand ? Math.max(128, 255 - Math.round(B[i] / 2)) : 0;
    d[i + 2] = isLand ? I[i] : 0;
    d[i + 3] = 255;
  }
  out.putImageData(img, 0, 0);
  return { canvas, data: img.data, w, h: hgt, proj, order: ORDER };
}
/** Sample the data map at lon/lat: { land, height01, slot, id (chapter number, 0 at sea or outside), edge01 }. */
export function sampleData(dm, lon, lat) {
  const [u, v] = dm.proj.toUV(lon, lat); const x = Math.max(0, Math.min(dm.w - 1, Math.round(u * dm.w))); const y = Math.max(0, Math.min(dm.h - 1, Math.round((1 - v) * dm.h)));
  const i = (y * dm.w + x) * 4; const g = dm.data[i + 1]; const slot = Math.round(dm.data[i + 2] / 20);
  return { land: g > 0, height01: Math.max(0, dm.data[i] - 90) / 255, slot, id: slot ? (dm.order[slot - 1] || 0) : 0, edge01: g > 0 ? (255 - g) / 127 : 0 };
}
/** A tileable value-noise texture for fog of war. */
export function paintNoise(canvas, seed = 3) {
  const w = canvas.width, hgt = canvas.height; const ctx = canvas.getContext('2d'); const img = ctx.createImageData(w, hgt); const d = img.data; const rnd = makeNoise(seed);
  const n = 16; const grid = []; for (let i = 0; i < n * n; i++) grid.push(rnd());
  const at = (x, y) => grid[((y % n) + n) % n * n + ((x % n) + n) % n];
  for (let y = 0; y < hgt; y++) for (let x = 0; x < w; x++) {
    let v = 0, amp = 0.55, f = n / w;
    for (let o = 0; o < 3; o++) { const gx = x * f, gy = y * f; const x0 = Math.floor(gx), y0 = Math.floor(gy); const tx = gx - x0, ty = gy - y0; const sx = tx * tx * (3 - 2 * tx), sy = ty * ty * (3 - 2 * ty);
      const a = at(x0, y0), b = at(x0 + 1, y0), c = at(x0, y0 + 1), dd = at(x0 + 1, y0 + 1); v += amp * ((a * (1 - sx) + b * sx) * (1 - sy) + (c * (1 - sx) + dd * sx) * sy); amp *= 0.5; f *= 2; }
    const i = (y * w + x) * 4; const val = Math.round(v * 255); d[i] = d[i + 1] = d[i + 2] = val; d[i + 3] = 255;
  }
  ctx.putImageData(img, 0, 0); return canvas;
}
export const CHAPTER_COLOR = CH_COLOR;
