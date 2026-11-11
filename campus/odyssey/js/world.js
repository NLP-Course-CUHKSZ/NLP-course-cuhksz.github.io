/* world data: parsing, terrain height, collision grid, navigation graph, 2D map drawing */
(function () {
  'use strict';
  const G = window.G, C = window.CAMPUS, M = C.meta;
  const W = G.world = { X0: M.x0, Z0: M.z0, NX: M.nx, NZ: M.nz, CELL: M.cell };
  W.X1 = W.X0 + W.NX * W.CELL; W.Z1 = W.Z0 + W.NZ * W.CELL;
  const f10 = a => { const o = new Float32Array(a.length); for (let i = 0; i < a.length; i++) o[i] = a[i] / 10; return o; };

  function ringInfo(ring) {
    let minx = 1e9, maxx = -1e9, minz = 1e9, maxz = -1e9, a = 0, cx = 0, cz = 0; const n = ring.length;
    for (let k = 0; k < n; k += 2) {
      const x = ring[k], z = ring[k + 1], x2 = ring[(k + 2) % n], z2 = ring[(k + 3) % n], cr = x * z2 - x2 * z;
      a += cr; cx += (x + x2) * cr; cz += (z + z2) * cr;
      if (x < minx) minx = x; if (x > maxx) maxx = x; if (z < minz) minz = z; if (z > maxz) maxz = z;
    }
    a /= 2; if (Math.abs(a) > 1e-6) { cx /= 6 * a; cz /= 6 * a; } else { cx = (minx + maxx) / 2; cz = (minz + maxz) / 2; }
    return { minx, maxx, minz, maxz, area: Math.abs(a), cx, cz };
  }
  W.ringInfo = ringInfo;
  W.closestOnRing = function (x, z, ring) {
    let bd = 1e18, bx = 0, bz = 0, bnx = 0, bnz = 0; const n = ring.length;
    for (let k = 0; k < n; k += 2) {
      const ax = ring[k], az = ring[k + 1], cx = ring[(k + 2) % n], cz = ring[(k + 3) % n], dx = cx - ax, dz = cz - az;
      let t = ((x - ax) * dx + (z - az) * dz) / (dx * dx + dz * dz || 1e-9); t = t < 0 ? 0 : t > 1 ? 1 : t;
      const qx = ax + dx * t, qz = az + dz * t, d = (x - qx) * (x - qx) + (z - qz) * (z - qz);
      if (d < bd) { bd = d; bx = qx; bz = qz; const L = Math.hypot(dx, dz) || 1; bnx = dz / L; bnz = -dx / L; }
    }
    return { x: bx, z: bz, d: Math.sqrt(bd), nx: bnx, nz: bnz };
  };

  // ------------------------------------------------------------------ parse
  W.parse = function () {
    W.nodes = f10(C.nodes);
    W.campus = {}; for (const k in C.campus) W.campus[k] = f10(C.campus[k]);
    W.buildings = C.buildings.map((b, i) => Object.assign({ i, ring: f10(b.p), h: b.h, kind: b.k, zh: b.n || '', en: b.e || '', campus: b.c || null }, ringInfo(f10(b.p))));
    W.roads = C.roads.map((r, i) => ({ i, kind: r.k, w: r.w, seq: r.s, name: r.n || '', tunnel: !!r.t, bridge: !!r.b, oneway: !!r.o, campus: r.c || null }));
    W.areas = C.areas.map(a => Object.assign({ kind: a.k, ring: f10(a.p), holes: (a.holes || []).map(f10), name: a.n || '', sport: a.s || '', campus: a.c || null }, ringInfo(f10(a.p))));
    W.pois = C.pois.map(p => ({ kind: p.k, x: p.x / 10, z: p.z / 10, zh: p.n || '', en: p.e || '' }));
    const bin = atob(C.items), n = bin.length / 6; W.items = [];
    for (let i = 0; i < n; i++) { const o = i * 6; W.items.push({ x: W.X0 + (bin.charCodeAt(o) | bin.charCodeAt(o + 1) << 8) / 20, z: W.Z0 + (bin.charCodeAt(o + 2) | bin.charCodeAt(o + 3) << 8) / 20, t: bin.charCodeAt(o + 4), s: bin.charCodeAt(o + 5) }); }
    W.byName = {};
    for (const b of W.buildings) if (b.zh) (W.byName[b.zh] = W.byName[b.zh] || []).push(b);
    // building lookup grid
    W.bgrid = new Map(); const BS = 40;
    for (const b of W.buildings) for (let cx = Math.floor(b.minx / BS); cx <= Math.floor(b.maxx / BS); cx++) for (let cz = Math.floor(b.minz / BS); cz <= Math.floor(b.maxz / BS); cz++) { const k = cx * 1000 + cz; let a = W.bgrid.get(k); if (!a) W.bgrid.set(k, a = []); a.push(b); }
  };
  W.find = function (name, campus) { const a = W.byName[name]; if (!a) return null; if (campus) return a.find(b => b.campus === campus) || null; return a.find(b => b.campus) || a[0]; };
  W.buildingAt = function (x, z) { const a = W.bgrid.get(Math.floor(x / 40) * 1000 + Math.floor(z / 40)); if (a) for (const b of a) if (x >= b.minx && x <= b.maxx && z >= b.minz && z <= b.maxz && G.pip(x, z, b.ring)) return b; return null; };
  W.nearBuilding = function (x, z, maxd, pred) {
    let best = null, bd = maxd; const r = Math.ceil(maxd / 40) + 1, cx0 = Math.floor(x / 40), cz0 = Math.floor(z / 40), seen = new Set();
    for (let cx = cx0 - r; cx <= cx0 + r; cx++) for (let cz = cz0 - r; cz <= cz0 + r; cz++) { const a = W.bgrid.get(cx * 1000 + cz); if (!a) continue; for (const b of a) { if (seen.has(b.i)) continue; seen.add(b.i); if (pred && !pred(b)) continue; const d = W.closestOnRing(x, z, b.ring).d; if (d < bd) { bd = d; best = b; } } }
    return best;
  };
  W.zoneAt = function (x, z) { for (const k in W.campus) if (G.pip(x, z, W.campus[k])) return k; return null; };
  W.inWorld = (x, z, m = 0) => x > W.X0 + m && x < W.X1 - m && z > W.Z0 + m && z < W.Z1 - m;

  // ------------------------------------------------------------------ terrain
  W.loadTerrain = function () {
    return new Promise((res, rej) => {
      const img = new Image();
      img.onload = () => {
        const c = G.canvas(img.width, img.height), x = c.getContext('2d', { willReadFrequently: true }); x.drawImage(img, 0, 0);
        const d = x.getImageData(0, 0, c.width, c.height).data, n = c.width * c.height;
        W.H = new Float32Array(n); W.cover = new Uint8Array(n);
        for (let i = 0; i < n; i++) { W.H[i] = ((d[i * 4] << 8 | d[i * 4 + 1]) - 1000) / 10; W.cover[i] = d[i * 4 + 2]; }
        res();
      };
      img.onerror = rej; img.src = C.terrain;
    });
  };
  W.height = function (x, z) {
    const fx = (x - W.X0) / W.CELL, fz = (z - W.Z0) / W.CELL;
    let i = Math.floor(fx), j = Math.floor(fz);
    if (i < 0) i = 0; else if (i > W.NX - 1) i = W.NX - 1; if (j < 0) j = 0; else if (j > W.NZ - 1) j = W.NZ - 1;
    let u = fx - i, v = fz - j; u = u < 0 ? 0 : u > 1 ? 1 : u; v = v < 0 ? 0 : v > 1 ? 1 : v;
    const w = W.NX + 1, H = W.H, o = j * w + i, a = H[o], b = H[o + 1], c = H[o + w], d = H[o + w + 1];
    return (u + v <= 1) ? a + (b - a) * u + (c - a) * v : d + (c - d) * (1 - u) + (b - d) * (1 - v);
  };
  W.ground = (x, z) => { const h = W.height(x, z); return h < 0 ? 0 : h; };
  W.coverAt = function (x, z) { const i = G.clamp(Math.round((x - W.X0) / W.CELL), 0, W.NX), j = G.clamp(Math.round((z - W.Z0) / W.CELL), 0, W.NZ); return W.cover[j * (W.NX + 1) + i]; };

  // ------------------------------------------------------------------ collision grid
  const col = G.col = { cs: 8, map: new Map(), seg: [], circ: [], nx: 0, nz: 0 };
  const ckey = (cx, cz) => (cx + 4096) * 8192 + (cz + 4096);
  col.cell = function (cx, cz, make) { const k = ckey(cx, cz); let a = this.map.get(k); if (!a && make) this.map.set(k, a = { s: [], c: [] }); return a; };
  col.addSeg = function (x1, z1, x2, z2, h, type) {
    const idx = this.seg.length / 6; this.seg.push(x1, z1, x2, z2, h, type);
    const L = Math.hypot(x2 - x1, z2 - z1), n = Math.max(1, Math.ceil(L)); let last = null;
    for (let s = 0; s <= n; s++) { const t = s / n, a = this.cell(Math.floor((x1 + (x2 - x1) * t) / this.cs), Math.floor((z1 + (z2 - z1) * t) / this.cs), true); if (a !== last) { if (a.s[a.s.length - 1] !== idx) a.s.push(idx); last = a; } }
    return idx;
  };
  col.addRing = function (ring, h, type) { const n = ring.length; for (let k = 0; k < n; k += 2) this.addSeg(ring[k], ring[k + 1], ring[(k + 2) % n], ring[(k + 3) % n], h, type); };
  col.addCircle = function (x, z, r) { const idx = this.circ.length / 3; this.circ.push(x, z, r); this.cell(Math.floor(x / this.cs), Math.floor(z / this.cs), true).c.push(idx); return idx; };
  // push circle (p.x,p.z,r) out of static geometry. returns number of contacts; last contact normal in col.nx/nz
  col.resolve = function (p, r, skipWater) {
    const cs = this.cs, seg = this.seg, circ = this.circ; let hits = 0;
    for (let it = 0; it < 3; it++) {
      let any = false;
      const cx0 = Math.floor((p.x - r - 0.9) / cs), cx1 = Math.floor((p.x + r + 0.9) / cs), cz0 = Math.floor((p.z - r - 0.9) / cs), cz1 = Math.floor((p.z + r + 0.9) / cs);
      for (let cx = cx0; cx <= cx1; cx++) for (let cz = cz0; cz <= cz1; cz++) {
        const cell = this.map.get(ckey(cx, cz)); if (!cell) continue;
        const s = cell.s;
        for (let q = 0; q < s.length; q++) {
          const o = s[q] * 6; if (skipWater && seg[o + 5] === 1) continue;
          const ax = seg[o], az = seg[o + 1], dx = seg[o + 2] - ax, dz = seg[o + 3] - az;
          let t = ((p.x - ax) * dx + (p.z - az) * dz) / (dx * dx + dz * dz || 1e-9); t = t < 0 ? 0 : t > 1 ? 1 : t;
          const qx = ax + dx * t, qz = az + dz * t; let ex = p.x - qx, ez = p.z - qz; const d2 = ex * ex + ez * ez;
          if (d2 < r * r) {
            const d = Math.sqrt(d2);
            if (d < 1e-4) { const L = Math.hypot(dx, dz) || 1; ex = dz / L; ez = -dx / L; p.x = qx + ex * r; p.z = qz + ez * r; }
            else { const k = (r - d) / d; p.x += ex * k; p.z += ez * k; ex /= d; ez /= d; }
            this.nx = ex; this.nz = ez; any = true; hits++;
          }
        }
        const c = cell.c;
        for (let q = 0; q < c.length; q++) {
          const o = c[q] * 3, rr = r + circ[o + 2]; let ex = p.x - circ[o], ez = p.z - circ[o + 1]; const d2 = ex * ex + ez * ez;
          if (d2 < rr * rr && d2 > 1e-8) { const d = Math.sqrt(d2), k = (rr - d) / d; p.x += ex * k; p.z += ez * k; this.nx = ex / d; this.nz = ez / d; any = true; hits++; }
        }
      }
      if (!any) break;
    }
    return hits;
  };
  // first wall hit along segment; yAt(t) gives the ray height at t so short walls can be skipped. returns t in [0,1]
  col.ray = function (x0, z0, x1, z1, y0, y1) {
    const cs = this.cs, seg = this.seg, L = Math.hypot(x1 - x0, z1 - z0), n = Math.max(1, Math.ceil(L / (cs * 0.5))); let best = 1; const seen = this._seen || (this._seen = new Set()); seen.clear();
    const rx = x1 - x0, rz = z1 - z0;
    for (let s = 0; s <= n; s++) {
      const t0 = s / n, cell = this.map.get(ckey(Math.floor((x0 + rx * t0) / cs), Math.floor((z0 + rz * t0) / cs))); if (!cell) continue;
      for (const idx of cell.s) {
        if (seen.has(idx)) continue; seen.add(idx); const o = idx * 6; if (seg[o + 5] !== 0) continue;
        const ax = seg[o], az = seg[o + 1], sx = seg[o + 2] - ax, sz = seg[o + 3] - az, den = rx * sz - rz * sx; if (Math.abs(den) < 1e-9) continue;
        const t = ((ax - x0) * sz - (az - z0) * sx) / den, u = ((ax - x0) * rz - (az - z0) * rx) / den;
        if (t > 0 && t < best && u >= 0 && u <= 1 && seg[o + 4] > y0 + (y1 - y0) * t) best = t;
      }
    }
    return best;
  };

  // ------------------------------------------------------------------ navigation graph
  const nav = G.nav = { adj: [], cs: 32, map: new Map() };
  const WALK_COST = { foot: 1, ped: 1, cycle: 1.02, steps: 1.15, service: 1.08, minor: 1.1, trail: 1.5, tertiary: 1.5, secondary: 1.7, primary: 1.7 };
  nav.build = function () {
    const N = W.nodes.length / 2; this.N = N; this.adj = Array.from({ length: N }, () => []); this.edges = [];
    for (const r of W.roads) {
      if (r.tunnel) continue; const cost = WALK_COST[r.kind]; const veh = /trunk|link|primary|secondary|tertiary|minor|service/.test(r.kind);
      for (let i = 0; i + 1 < r.seq.length; i++) {
        const a = r.seq[i], b = r.seq[i + 1], len = Math.hypot(W.nodes[a * 2] - W.nodes[b * 2], W.nodes[a * 2 + 1] - W.nodes[b * 2 + 1]);
        const e = { a, b, len, road: r, walk: cost || 0, veh }; const ei = this.edges.length; this.edges.push(e);
        this.adj[a].push(ei); this.adj[b].push(ei);
        const n = Math.max(1, Math.ceil(len / 12)); let last = -1;
        for (let s = 0; s <= n; s++) { const t = s / n, k = ckey(Math.floor((W.nodes[a * 2] + (W.nodes[b * 2] - W.nodes[a * 2]) * t) / this.cs), Math.floor((W.nodes[a * 2 + 1] + (W.nodes[b * 2 + 1] - W.nodes[a * 2 + 1]) * t) / this.cs)); if (k !== last) { let arr = this.map.get(k); if (!arr) this.map.set(k, arr = []); arr.push(ei); last = k; } }
      }
    }
  };
  nav.nodeXZ = i => [W.nodes[i * 2], W.nodes[i * 2 + 1]];
  nav.nearestEdge = function (x, z, o = {}) {
    let best = null, bd = o.maxd || 400; const cs = this.cs, cx0 = Math.floor(x / cs), cz0 = Math.floor(z / cs);
    for (let ring = 0; ring <= Math.ceil(bd / cs) + 1; ring++) {
      if (best && (ring - 1) * cs > bd) break;
      for (let cx = cx0 - ring; cx <= cx0 + ring; cx++) for (let cz = cz0 - ring; cz <= cz0 + ring; cz++) {
        if (Math.max(Math.abs(cx - cx0), Math.abs(cz - cz0)) !== ring) continue;
        const arr = this.map.get(ckey(cx, cz)); if (!arr) continue;
        for (const ei of arr) {
          const e = this.edges[ei]; if (o.veh ? !e.veh : !e.walk) continue; if (o.pred && !o.pred(e)) continue;
          const ax = W.nodes[e.a * 2], az = W.nodes[e.a * 2 + 1], dx = W.nodes[e.b * 2] - ax, dz = W.nodes[e.b * 2 + 1] - az;
          let t = ((x - ax) * dx + (z - az) * dz) / (dx * dx + dz * dz || 1e-9); t = t < 0 ? 0 : t > 1 ? 1 : t;
          const px = ax + dx * t, pz = az + dz * t, d = Math.hypot(x - px, z - pz);
          if (d < bd) { bd = d; best = { e, ei, t, x: px, z: pz, d }; }
        }
      }
    }
    return best;
  };
  class Heap { constructor() { this.a = []; } push(k, v) { const a = this.a; a.push([k, v]); let i = a.length - 1; while (i > 0) { const p = (i - 1) >> 1; if (a[p][0] <= a[i][0]) break; [a[p], a[i]] = [a[i], a[p]]; i = p; } } pop() { const a = this.a, top = a[0], last = a.pop(); if (a.length) { a[0] = last; let i = 0; for (; ;) { const l = i * 2 + 1, r = l + 1; let m = i; if (l < a.length && a[l][0] < a[m][0]) m = l; if (r < a.length && a[r][0] < a[m][0]) m = r; if (m === i) break; [a[m], a[i]] = [a[i], a[m]]; i = m; } } return top; } get size() { return this.a.length; } }
  nav.route = function (ax, az, bx, bz, o = {}) {
    const ea = this.nearestEdge(ax, az, o), eb = this.nearestEdge(bx, bz, o);
    const direct = { pts: [[ax, az], [bx, bz]], len: G.dist(ax, az, bx, bz), ok: false };
    if (!ea || !eb) return direct;
    if (ea.ei === eb.ei) { const pts = [[ax, az], [ea.x, ea.z], [eb.x, eb.z], [bx, bz]]; return { pts, len: pathLen(pts), ok: true }; }
    const N = this.N, g = new Float32Array(N).fill(Infinity), prev = new Int32Array(N).fill(-1), done = new Uint8Array(N), heap = new Heap();
    const hx = eb.x, hz = eb.z, h = i => Math.hypot(W.nodes[i * 2] - hx, W.nodes[i * 2 + 1] - hz);
    const cost = e => o.veh ? 1 : e.walk;
    const seed = (i, d) => { if (d < g[i]) { g[i] = d; heap.push(d + h(i), i); } };
    seed(ea.e.a, ea.t * ea.e.len * cost(ea.e)); seed(ea.e.b, (1 - ea.t) * ea.e.len * cost(ea.e));
    const tail = { [eb.e.a]: eb.t * eb.e.len * cost(eb.e), [eb.e.b]: (1 - eb.t) * eb.e.len * cost(eb.e) };
    let best = Infinity, bestNode = -1;
    while (heap.size) {
      const [f, u] = heap.pop(); if (done[u]) continue; done[u] = 1; if (f >= best) break;
      if (tail[u] !== undefined && g[u] + tail[u] < best) { best = g[u] + tail[u]; bestNode = u; }
      for (const ei of this.adj[u]) {
        const e = this.edges[ei]; if (o.veh ? !e.veh : !e.walk) continue; const v = e.a === u ? e.b : e.a; if (done[v]) continue;
        const nd = g[u] + e.len * cost(e); if (nd < g[v]) { g[v] = nd; prev[v] = u; heap.push(nd + h(v), v); }
      }
    }
    if (bestNode < 0) return direct;
    const mid = []; for (let u = bestNode; u >= 0; u = prev[u]) mid.push([W.nodes[u * 2], W.nodes[u * 2 + 1]]);
    mid.reverse();
    const pts = [[ax, az], [ea.x, ea.z], ...mid, [eb.x, eb.z], [bx, bz]].filter((p, i, a) => i === 0 || G.dist(p[0], p[1], a[i - 1][0], a[i - 1][1]) > 0.3);
    return { pts, len: pathLen(pts), ok: true };
  };
  function pathLen(p) { let s = 0; for (let i = 1; i < p.length; i++) s += G.dist(p[i][0], p[i][1], p[i - 1][0], p[i - 1][1]); return s; }
  nav.pathLen = pathLen;
  // resample a polyline to roughly even spacing, returns {pts, cum}
  nav.resample = function (pts, step) {
    const out = [pts[0].slice()]; let carry = 0;
    for (let i = 1; i < pts.length; i++) { const ax = pts[i - 1][0], az = pts[i - 1][1], dx = pts[i][0] - ax, dz = pts[i][1] - az, L = Math.hypot(dx, dz); let d = step - carry; while (d < L) { out.push([ax + dx * d / L, az + dz * d / L]); d += step; } carry = L - (d - step); }
    out.push(pts[pts.length - 1].slice()); return out;
  };

  // door / entrance point of a building: nearest walkable path point projected onto the footprint
  W.door = function (b) {
    if (b.door) return b.door;
    let best = null, bd = 1e9; const cs = nav.cs, m = 70;
    for (let cx = Math.floor((b.minx - m) / cs); cx <= Math.floor((b.maxx + m) / cs); cx++) for (let cz = Math.floor((b.minz - m) / cs); cz <= Math.floor((b.maxz + m) / cs); cz++) {
      const arr = nav.map.get(ckey(cx, cz)); if (!arr) continue;
      for (const ei of arr) {
        const e = nav.edges[ei]; if (!e.walk || e.road.kind === 'trail') continue;
        for (const ni of [e.a, e.b]) {
          const x = W.nodes[ni * 2], z = W.nodes[ni * 2 + 1]; if (G.pip(x, z, b.ring)) continue;
          const q = W.closestOnRing(x, z, b.ring), pen = /foot|ped/.test(e.road.kind) ? 0 : 6;
          if (q.d + pen < bd) { bd = q.d + pen; best = q; }
        }
      }
    }
    if (!best) { const q = W.closestOnRing(b.cx, b.maxz + 30, b.ring); best = q; }
    // outward direction: ring normal, flipped if it points inside
    let nx = best.nx, nz = best.nz; if (G.pip(best.x + nx * 0.5, best.z + nz * 0.5, b.ring)) { nx = -nx; nz = -nz; }
    b.door = { x: best.x + nx * 2.2, z: best.z + nz * 2.2, nx, nz, wx: best.x, wz: best.z };
    return b.door;
  };

  // ------------------------------------------------------------------ 2D map rendering (minimap base + full map)
  const MAPC = { land: '#e6e1d2', campus: '#f1ecdc', forest: '#b4d3a2', park: '#c3dcae', lawn: '#cfe5b3', water: '#9bc8ec', bcu: '#f3c66b', bcuL: '#a87b22', bot: '#cfcfd6', botL: '#a9a9b3', road: '#ffffff', roadL: '#b9b6ad', path: '#d9b38c', green: '#c98a6b', trail: '#b99b72', pitch: '#7cc592', court: '#e2a077', track: '#c96a55', plaza: '#ebe3cf', park2: '#b5b5bc' };
  W.mapBase = null;
  W.makeTerrainImage = function () {
    const w = W.NX + 1, h = W.NZ + 1, c = G.canvas(w, h), x = c.getContext('2d'), im = x.createImageData(w, h), d = im.data;
    const pal = { 0: [230, 225, 210], 1: [241, 236, 220], 2: [176, 209, 158], 3: [207, 229, 179], 4: [155, 200, 236], 6: [190, 218, 170] };
    for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) {
      const o = j * w + i, p = pal[W.cover[o]] || pal[0]; let s = 1;
      if (i > 0 && j > 0 && i < w - 1 && j < h - 1) { const gx = W.H[o + 1] - W.H[o - 1], gz = W.H[o + w] - W.H[o - w]; s = G.clamp(1 - (gx - gz) * 0.035, 0.72, 1.18); }
      d[o * 4] = Math.min(255, p[0] * s); d[o * 4 + 1] = Math.min(255, p[1] * s); d[o * 4 + 2] = Math.min(255, p[2] * s); d[o * 4 + 3] = 255;
    }
    x.putImageData(im, 0, 0); return c;
  };
  // draw the vector map. transform already set so that world metres map to canvas units (x→x, z→y)
  W.drawMap = function (x, sc, o = {}) {
    const ring = (r) => { x.beginPath(); x.moveTo(r[0], r[1]); for (let k = 2; k < r.length; k += 2) x.lineTo(r[k], r[k + 1]); x.closePath(); };
    x.imageSmoothingEnabled = true; if (!W.terrImg) W.terrImg = W.makeTerrainImage();
    x.drawImage(W.terrImg, W.X0 - W.CELL / 2, W.Z0 - W.CELL / 2, (W.NX + 1) * W.CELL, (W.NZ + 1) * W.CELL);
    for (const a of W.areas) {
      const col = a.kind === 'water' ? MAPC.water : a.kind === 'grass' ? MAPC.lawn : a.kind === 'pitch' ? (/basket|volley/.test(a.sport) ? MAPC.court : MAPC.pitch) : a.kind === 'parking' ? MAPC.park2 : a.kind === 'plaza' ? MAPC.plaza : MAPC.track;
      ring(a.ring); x.fillStyle = col; x.fill();
      if (a.kind === 'trackfield') { x.save(); x.translate(a.cx, a.cz); x.scale(0.72, 0.72); x.translate(-a.cx, -a.cz); ring(a.ring); x.fillStyle = MAPC.pitch; x.fill(); x.restore(); }
    }
    x.lineCap = 'round'; x.lineJoin = 'round';
    const pass = (pred, col, wAdd, wMul, dash) => {
      x.strokeStyle = col; x.setLineDash(dash || []);
      for (const r of W.roads) { if (!pred(r)) continue; x.lineWidth = Math.max(r.w * wMul + wAdd, 1.2 / sc); x.beginPath(); const s = r.seq; x.moveTo(W.nodes[s[0] * 2], W.nodes[s[0] * 2 + 1]); for (let i = 1; i < s.length; i++) x.lineTo(W.nodes[s[i] * 2], W.nodes[s[i] * 2 + 1]); x.stroke(); }
      x.setLineDash([]);
    };
    const veh = r => /trunk|link|primary|secondary|tertiary|minor|service/.test(r.kind);
    pass(r => veh(r) && r.tunnel, 'rgba(160,160,175,.55)', 0, 1);
    pass(r => veh(r) && !r.tunnel, MAPC.roadL, 2.4, 1);
    pass(r => veh(r) && !r.tunnel, MAPC.road, 0, 1);
    pass(r => r.kind === 'cycle', MAPC.green, 0, 1);
    pass(r => r.kind === 'foot' || r.kind === 'ped' || r.kind === 'steps', MAPC.path, 0, 1);
    pass(r => r.kind === 'trail', MAPC.trail, 0.4, 1, [4, 3]);
    for (const b of W.buildings) { ring(b.ring); x.fillStyle = b.campus ? (o.hi === b ? '#ff9d5c' : MAPC.bcu) : MAPC.bot; x.fill(); x.lineWidth = Math.max(0.6, 1 / sc); x.strokeStyle = b.campus ? MAPC.bcuL : MAPC.botL; x.stroke(); }
  };
  W.makeBaseMap = function (sc) {
    const c = G.canvas(Math.round((W.X1 - W.X0) * sc), Math.round((W.Z1 - W.Z0) * sc)), x = c.getContext('2d');
    x.setTransform(sc, 0, 0, sc, -W.X0 * sc, -W.Z0 * sc); W.drawMap(x, sc); W.mapBase = c; W.mapScale = sc; return c;
  };
})();
