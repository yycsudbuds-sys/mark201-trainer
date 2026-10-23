"""Build app/geo/med.json: Natural Earth 110m land (via the world-atlas TopoJSON), cropped to the Roman world and simplified.
Usage: python tools/make_geo.py <path to land-110m.json>
Output: { "bbox": [lonMin, latMin, lonMax, latMax], "polys": [ [ring, hole, ...], ... ] } with rings as [[lon, lat], ...]."""
import json, sys, os

SRC = sys.argv[1]
OUT = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "app", "geo", "med.json")
BBOX = (-11.0, 24.0, 43.0, 59.0)   # lon min, lat min, lon max, lat max
TOL = 0.12                         # Douglas-Peucker tolerance in degrees
MIN_AREA = 0.08                    # drop islets smaller than this (square degrees)

topo = json.load(open(SRC, encoding="utf-8"))
sx, sy = topo["transform"]["scale"]; tx, ty = topo["transform"]["translate"]
arcs = []
for arc in topo["arcs"]:
    x = y = 0; pts = []
    for dx, dy in arc:
        x += dx; y += dy; pts.append((x * sx + tx, y * sy + ty))
    arcs.append(pts)

def ring_from(arc_ids):
    pts = []
    for a in arc_ids:
        seg = arcs[a] if a >= 0 else list(reversed(arcs[~a]))
        if pts and pts[-1] == seg[0]: seg = seg[1:]
        pts.extend(seg)
    return pts

def clip(ring, bbox):
    """Sutherland-Hodgman clip of a ring to the bbox."""
    xmin, ymin, xmax, ymax = bbox
    def clip_edge(pts, inside, intersect):
        out = []
        if not pts: return out
        prev = pts[-1]
        for cur in pts:
            if inside(cur):
                if not inside(prev): out.append(intersect(prev, cur))
                out.append(cur)
            elif inside(prev): out.append(intersect(prev, cur))
            prev = cur
        return out
    def ix(p, q, x):
        t = (x - p[0]) / (q[0] - p[0]); return (x, p[1] + t * (q[1] - p[1]))
    def iy(p, q, y):
        t = (y - p[1]) / (q[1] - p[1]); return (p[0] + t * (q[0] - p[0]), y)
    r = ring
    r = clip_edge(r, lambda p: p[0] >= xmin, lambda p, q: ix(p, q, xmin))
    r = clip_edge(r, lambda p: p[0] <= xmax, lambda p, q: ix(p, q, xmax))
    r = clip_edge(r, lambda p: p[1] >= ymin, lambda p, q: iy(p, q, ymin))
    r = clip_edge(r, lambda p: p[1] <= ymax, lambda p, q: iy(p, q, ymax))
    return r

def simplify(pts, tol):
    if len(pts) < 3: return pts
    def dp(a, b):
        (x1, y1), (x2, y2) = pts[a], pts[b]
        dx, dy = x2 - x1, y2 - y1; n = (dx * dx + dy * dy) ** 0.5 or 1e-9
        idx = -1; best = 0
        for i in range(a + 1, b):
            x, y = pts[i]; d = abs(dy * x - dx * y + x2 * y1 - y2 * x1) / n
            if d > best: best, idx = d, i
        if best > tol and idx > 0: return dp(a, idx)[:-1] + dp(idx, b)
        return [pts[a], pts[b]]
    closed = pts[0] == pts[-1]
    pts = pts if closed else pts + [pts[0]]
    # a closed ring has a zero-length chord from first to last point, so split it at the farthest point first
    x0, y0 = pts[0]
    m = max(range(1, len(pts) - 1), key=lambda i: (pts[i][0] - x0) ** 2 + (pts[i][1] - y0) ** 2)
    return dp(0, m)[:-1] + dp(m, len(pts) - 1)

def area(ring):
    s = 0
    for i in range(len(ring)):
        x1, y1 = ring[i]; x2, y2 = ring[(i + 1) % len(ring)]
        s += x1 * y2 - x2 * y1
    return s / 2

polys = []
obj = topo["objects"]["land"]
geoms = obj["geometries"] if obj["type"] == "GeometryCollection" else [obj]
for g in geoms:
    parts = g["arcs"] if g["type"] == "MultiPolygon" else [g["arcs"]]
    for poly in parts:
        rings = []
        for k, ring_arcs in enumerate(poly):
            ring = clip(ring_from(ring_arcs), BBOX)
            if len(ring) < 4: continue
            ring = simplify(ring, TOL)
            if len(ring) < 4: continue
            if abs(area(ring)) < (MIN_AREA if k == 0 else MIN_AREA * 0.5): continue
            rings.append([[round(x, 3), round(y, 3)] for x, y in ring])
        if rings: polys.append(rings)

os.makedirs(os.path.dirname(OUT), exist_ok=True)
json.dump({"bbox": list(BBOX), "polys": polys}, open(OUT, "w", encoding="utf-8"), separators=(",", ":"))
n = sum(len(r) for p in polys for r in p)
print(f"wrote {OUT}: {len(polys)} polygons, {n} points, {os.path.getsize(OUT)} bytes")
