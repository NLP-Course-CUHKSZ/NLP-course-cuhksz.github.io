/* scene meshes: terrain, ground features, roads, buildings, vegetation, water, props, backdrop */
(function () {
  'use strict';
  const G = window.G, W = G.world;
  const lin = hex => { const c = new THREE.Color(hex); return [c.r, c.g, c.b]; };
  const mix3 = (a, b, t) => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];
  const isVeh = k => /trunk|link|primary|secondary|tertiary|minor|service/.test(k);

  class MB {
    constructor() { this.p = []; this.n = []; this.c = []; this.u = []; this.i = []; this.k = 0; }
    v(x, y, z, nx, ny, nz, r, g, b, u, v) { this.p.push(x, y, z); this.n.push(nx, ny, nz); this.c.push(r, g, b); if (u !== undefined) this.u.push(u, v); else if (this.auv) this.u.push(x / this.auv, z / this.auv); return this.k++; }
    tri(a, b, c) { this.i.push(a, b, c); }
    quad(a, b, c, d) { this.i.push(a, b, c, a, c, d); }
    geo() {
      const g = new THREE.BufferGeometry();
      g.setAttribute('position', new THREE.Float32BufferAttribute(this.p, 3)); g.setAttribute('normal', new THREE.Float32BufferAttribute(this.n, 3));
      g.setAttribute('color', new THREE.Float32BufferAttribute(this.c, 3)); if (this.u.length) g.setAttribute('uv', new THREE.Float32BufferAttribute(this.u, 2));
      g.setIndex(this.i); g.computeBoundingSphere(); return g;
    }
    mesh(mat, o = {}) { const m = new THREE.Mesh(this.geo(), mat); m.matrixAutoUpdate = false; m.receiveShadow = o.receive !== false; m.castShadow = !!o.cast; return m; }
  }
  G.MB = MB;
  // triangulate polygon (flat [x,z,..]) -> {pts:[[x,z]], idx:[]} with triangles facing up
  function tri2(ring, holes) {
    const contour = []; for (let k = 0; k < ring.length; k += 2) contour.push(new THREE.Vector2(ring[k], -ring[k + 1]));
    const hs = (holes || []).map(h => { const a = []; for (let k = 0; k < h.length; k += 2) a.push(new THREE.Vector2(h[k], -h[k + 1])); return a; });
    let faces; try { faces = THREE.ShapeUtils.triangulateShape(contour, hs); } catch (e) { faces = []; }
    const all = contour.concat(...hs), idx = []; let flip = false;
    for (const f of faces) { const a = all[f[0]], b = all[f[1]], c = all[f[2]]; const cr = (b.x - a.x) * (c.y - a.y) - (b.y - a.y) * (c.x - a.x); if (Math.abs(cr) > 1e-6) { flip = cr < 0; break; } }
    for (const f of faces) flip ? idx.push(f[0], f[2], f[1]) : idx.push(f[0], f[1], f[2]);
    return { pts: all.map(v => [v.x, -v.y]), idx };
  }
  function polyUp(mb, ring, holes, y, col, jit, down) {
    const t = tri2(ring, holes), base = mb.k;
    for (const [x, z] of t.pts) { const k = jit ? 1 - jit + 2 * jit * G.noise2(x * 0.13, z * 0.13) : 1; mb.v(x, y, z, 0, down ? -1 : 1, 0, col[0] * k, col[1] * k, col[2] * k); }
    if (down) for (let i = 0; i < t.idx.length; i += 3) mb.i.push(base + t.idx[i], base + t.idx[i + 2], base + t.idx[i + 1]); else for (const i of t.idx) mb.i.push(base + i);
  }
  function quadUp(mb, P, y, col, uv) { // P: 4 points [x,z] in order around; uv optional [[u,v]x4]
    const cr = (P[1][0] - P[0][0]) * -(P[2][1] - P[0][1]) + (P[1][1] - P[0][1]) * (P[2][0] - P[0][0]);
    const ids = P.map((p, i) => mb.v(p[0], y, p[1], 0, 1, 0, col[0], col[1], col[2], uv ? uv[i][0] : 0, uv ? uv[i][1] : 0));
    if (cr > 0) mb.quad(ids[0], ids[1], ids[2], ids[3]); else mb.quad(ids[0], ids[3], ids[2], ids[1]);
  }
  function subdiv(pts, step) { const out = [pts[0]]; for (let i = 1; i < pts.length; i++) { const a = pts[i - 1], b = pts[i], L = Math.hypot(b[0] - a[0], b[1] - a[1]), n = Math.max(1, Math.ceil(L / step)); for (let s = 1; s <= n; s++) out.push([a[0] + (b[0] - a[0]) * s / n, a[1] + (b[1] - a[1]) * s / n]); } return out; }
  // ribbon along polyline. off = lateral offset of centre, drape follows terrain
  function strip(mb, pts, w, y, col, o = {}) {
    const n = pts.length, closed = !!o.closed, off = o.off || 0; let prevL = -1, prevR = -1, firstL = -1, firstR = -1;
    for (let i = 0; i < n; i++) {
      const a = pts[closed ? (i - 1 + n) % n : Math.max(0, i - 1)], b = pts[i], c = pts[closed ? (i + 1) % n : Math.min(n - 1, i + 1)];
      let d1x = b[0] - a[0], d1z = b[1] - a[1], d2x = c[0] - b[0], d2z = c[1] - b[1]; const l1 = Math.hypot(d1x, d1z), l2 = Math.hypot(d2x, d2z);
      if (l1 > 1e-6) { d1x /= l1; d1z /= l1; } if (l2 > 1e-6) { d2x /= l2; d2z /= l2; }
      if (l1 <= 1e-6) { d1x = d2x; d1z = d2z; } if (l2 <= 1e-6) { d2x = d1x; d2z = d1z; }
      let tx = d1x + d2x, tz = d1z + d2z; const tl = Math.hypot(tx, tz); if (tl < 1e-6) { tx = d1x; tz = d1z; } else { tx /= tl; tz /= tl; }
      const cosH = Math.max(0.55, tx * d1x + tz * d1z), nx = -tz, nz = tx, hw = w / 2 / cosH;
      const lx = b[0] + nx * (off + hw), lz = b[1] + nz * (off + hw), rx = b[0] + nx * (off - hw), rz = b[1] + nz * (off - hw);
      const yl = o.drape ? W.ground(lx, lz) + y : y, yr = o.drape ? W.ground(rx, rz) + y : y;
      const L = mb.v(lx, yl, lz, 0, 1, 0, col[0], col[1], col[2]), R = mb.v(rx, yr, rz, 0, 1, 0, col[0], col[1], col[2]);
      if (i === 0) { firstL = L; firstR = R; } else mb.i.push(prevL, L, prevR, prevR, L, R);
      prevL = L; prevR = R;
    }
    if (closed && n > 2) mb.i.push(prevL, firstL, prevR, prevR, firstL, firstR);
  }
  function disc(mb, x, z, r, y, col, drape) {
    const c = mb.v(x, (drape ? W.ground(x, z) : 0) + y, z, 0, 1, 0, col[0], col[1], col[2]); let prev = -1, first = -1;
    for (let k = 0; k < 10; k++) { const a = k / 10 * G.TAU, px = x + Math.cos(a) * r, pz = z + Math.sin(a) * r, id = mb.v(px, (drape ? W.ground(px, pz) : 0) + y, pz, 0, 1, 0, col[0], col[1], col[2]); if (k === 0) first = id; else mb.i.push(c, id, prev); prev = id; }
    mb.i.push(c, first, prev);
  }
  function dashes(mb, pts, off, w, y, col, dash, gap) {
    let acc = 0;
    for (let i = 1; i < pts.length; i++) {
      const a = pts[i - 1], b = pts[i], dx = b[0] - a[0], dz = b[1] - a[1], L = Math.hypot(dx, dz); if (L < 1e-6) continue; const ux = dx / L, uz = dz / L, nx = -uz, nz = ux;
      let d = -acc;
      while (d < L) {
        const s = Math.max(0, d), e = Math.min(L, d + dash);
        if (e - s > 0.4) { const P = [[a[0] + ux * s + nx * (off + w / 2), a[1] + uz * s + nz * (off + w / 2)], [a[0] + ux * e + nx * (off + w / 2), a[1] + uz * e + nz * (off + w / 2)], [a[0] + ux * e + nx * (off - w / 2), a[1] + uz * e + nz * (off - w / 2)], [a[0] + ux * s + nx * (off - w / 2), a[1] + uz * s + nz * (off - w / 2)]]; const yy = W.ground((P[0][0] + P[2][0]) / 2, (P[0][1] + P[2][1]) / 2) + y; quadUp(mb, P, yy, col); }
        d += dash + gap;
      }
      acc = (acc + L) % (dash + gap);
    }
  }
  function obb(ring) {
    let bl = 0, ux = 1, uz = 0; const n = ring.length;
    for (let k = 0; k < n; k += 2) { const dx = ring[(k + 2) % n] - ring[k], dz = ring[(k + 3) % n] - ring[k + 1], L = Math.hypot(dx, dz); if (L > bl) { bl = L; ux = dx / L; uz = dz / L; } }
    let minu = 1e9, maxu = -1e9, minv = 1e9, maxv = -1e9;
    for (let k = 0; k < n; k += 2) { const u = ring[k] * ux + ring[k + 1] * uz, v = -ring[k] * uz + ring[k + 1] * ux; if (u < minu) minu = u; if (u > maxu) maxu = u; if (v < minv) minv = v; if (v > maxv) maxv = v; }
    const o = { ux, uz, cu: (minu + maxu) / 2, cv: (minv + maxv) / 2, hu: (maxu - minu) / 2, hv: (maxv - minv) / 2 };
    o.pt = (u, v) => [u * ux - v * uz, u * uz + v * ux]; return o;
  }
  W.obb = obb;

  // ================================================================== terrain
  W.detailTex = function () { // tiling grain that multiplies vertex colours (keeps the ground from looking flat up close)
    if (W._detail) return W._detail;
    const S = 256, c = G.canvas(S, S), x = c.getContext('2d'), r = G.rng(31); x.fillStyle = '#f2f2f2'; x.fillRect(0, 0, S, S);
    for (let i = 0; i < 2600; i++) { const px = r() * S, py = r() * S, w = 2 + r() * 9, h = 1 + r() * 5, a = 0.03 + r() * 0.06; x.fillStyle = r() < 0.6 ? 'rgba(0,0,0,' + a + ')' : 'rgba(255,255,255,' + a * 1.6 + ')'; for (const ox of [-S, 0, S]) for (const oy of [-S, 0, S]) x.fillRect(px + ox, py + oy, w, h); }
    for (let i = 0; i < 70; i++) { const px = r() * S, py = r() * S, rad = 14 + r() * 30; for (const ox of [-S, 0, S]) for (const oy of [-S, 0, S]) { const g = x.createRadialGradient(px + ox, py + oy, 0, px + ox, py + oy, rad); g.addColorStop(0, i % 2 ? 'rgba(0,0,0,.07)' : 'rgba(255,255,255,.09)'); g.addColorStop(1, 'rgba(0,0,0,0)'); x.fillStyle = g; x.fillRect(px + ox - rad, py + oy - rad, rad * 2, rad * 2); } }
    W._detail = G.canvasTex(c, { repeat: true, aniso: 8 }); return W._detail;
  };
  const PAL = { 0: lin(0xbfc2ad), 1: lin(0x86bd5f), 2: lin(0x3f6d3b), 3: lin(0x93cb68), 6: lin(0x4b7b42) };
  function buildTerrain(scene) {
    const CH = 64, w = W.NX + 1, H = W.H, cov = W.cover, CELL = W.CELL;
    const mat = new THREE.MeshLambertMaterial({ vertexColors: true, map: W.detailTex() });
    const shore = lin(0xb7ab86), deep = lin(0x35584f), cityG = lin(0x9dbb7c), rock = lin(0x77745f);
    W.terrain = new THREE.Group(); scene.add(W.terrain);
    for (let cj = 0; cj * CH < W.NZ; cj++) for (let ci = 0; ci * CH < W.NX; ci++) {
      const i0 = ci * CH, i1 = Math.min(W.NX, i0 + CH), j0 = cj * CH, j1 = Math.min(W.NZ, j0 + CH), nx = i1 - i0 + 1, nz = j1 - j0 + 1;
      const pos = new Float32Array(nx * nz * 3), nor = new Float32Array(nx * nz * 3), colr = new Float32Array(nx * nz * 3), uvs = new Float32Array(nx * nz * 2), idx = new Uint16Array((nx - 1) * (nz - 1) * 6);
      let p = 0;
      for (let j = j0; j <= j1; j++) for (let i = i0; i <= i1; i++) {
        const o = j * w + i, x = W.X0 + i * CELL, z = W.Z0 + j * CELL, h = H[o];
        pos[p] = x; pos[p + 1] = h; pos[p + 2] = z; uvs[p / 3 * 2] = x / 9; uvs[p / 3 * 2 + 1] = z / 9;
        const ax = (H[o - (i > 0 ? 1 : 0)] - H[o + (i < W.NX ? 1 : 0)]) / (2 * CELL), az = (H[o - (j > 0 ? w : 0)] - H[o + (j < W.NZ ? w : 0)]) / (2 * CELL), il = 1 / Math.hypot(ax, 1, az);
        nor[p] = ax * il; nor[p + 1] = il; nor[p + 2] = az * il;
        const cls = cov[o], n1 = G.noise2(x * 0.045, z * 0.045), n2 = G.noise2(x * 0.31 + 9, z * 0.31 + 4);
        let c = PAL[cls] || PAL[0], k = 0.88 + 0.17 * n1 + 0.07 * n2;
        if (cls === 4) { c = mix3(shore, deep, G.clamp(-h / 2.0, 0, 1)); k = 1; }
        else if (cls === 0) { if (n1 > 0.55) c = mix3(c, cityG, G.clamp((n1 - 0.55) * 3, 0, 0.8)); }
        else if (cls === 2 || cls === 6) { if (il < 0.86) c = mix3(c, rock, G.clamp((0.86 - il) * 2.2, 0, 0.5)); }
        colr[p] = c[0] * k; colr[p + 1] = c[1] * k; colr[p + 2] = c[2] * k; p += 3;
      }
      let q = 0;
      for (let j = 0; j < nz - 1; j++) for (let i = 0; i < nx - 1; i++) { const a = j * nx + i, b = a + 1, c = a + nx, d = c + 1; idx[q++] = a; idx[q++] = c; idx[q++] = b; idx[q++] = b; idx[q++] = c; idx[q++] = d; }
      const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(pos, 3)); g.setAttribute('normal', new THREE.BufferAttribute(nor, 3)); g.setAttribute('color', new THREE.BufferAttribute(colr, 3)); g.setAttribute('uv', new THREE.BufferAttribute(uvs, 2)); g.setIndex(new THREE.BufferAttribute(idx, 1)); g.computeBoundingSphere();
      // half-resolution index buffer for distant chunks
      const hx = Math.floor((nx - 1) / 2), hz = Math.floor((nz - 1) / 2), idx2 = new Uint16Array(hx * hz * 6); q = 0;
      for (let j = 0; j < hz; j++) for (let i = 0; i < hx; i++) { const a = (j * 2) * nx + i * 2, b = a + 2, c = a + 2 * nx, d = c + 2; idx2[q++] = a; idx2[q++] = c; idx2[q++] = b; idx2[q++] = b; idx2[q++] = c; idx2[q++] = d; }
      const m = new THREE.Mesh(g, mat); m.receiveShadow = true; m.matrixAutoUpdate = false; m.renderOrder = 50; W.terrain.add(m);
      m.userData = { full: g.index, half: new THREE.BufferAttribute(idx2, 1), cx: W.X0 + (i0 + i1) / 2 * CELL, cz: W.Z0 + (j0 + j1) / 2 * CELL, lod: 0 };
    }
  }

  // ================================================================== sports court textures
  function courtTex(sport) {
    const c = G.canvas(256, 512), x = c.getContext('2d'), Wd = 256, Hd = 512; x.lineWidth = 4; x.strokeStyle = '#f4f4ee';
    if (sport === 'basketball') {
      x.fillStyle = '#3f7fb8'; x.fillRect(0, 0, Wd, Hd); x.fillStyle = '#c96f4a'; x.fillRect(18, 18, Wd - 36, Hd - 36); x.strokeRect(18, 18, Wd - 36, Hd - 36);
      x.beginPath(); x.moveTo(18, Hd / 2); x.lineTo(Wd - 18, Hd / 2); x.stroke(); x.beginPath(); x.arc(Wd / 2, Hd / 2, 30, 0, 7); x.stroke();
      for (const s of [0, 1]) { x.save(); if (s) { x.translate(0, Hd); x.scale(1, -1); } x.fillStyle = '#3f7fb8'; x.fillRect(Wd / 2 - 40, 18, 80, 96); x.strokeRect(Wd / 2 - 40, 18, 80, 96); x.beginPath(); x.arc(Wd / 2, 114, 30, 0, Math.PI); x.stroke(); x.beginPath(); x.arc(Wd / 2, 42, 104, 0.12, Math.PI - 0.12); x.stroke(); x.fillStyle = '#f4f4ee'; x.fillRect(Wd / 2 - 16, 34, 32, 4); x.restore(); }
    } else if (sport === 'tennis') {
      x.fillStyle = '#4f9a62'; x.fillRect(0, 0, Wd, Hd); x.fillStyle = '#3f79b8'; x.fillRect(46, 66, Wd - 92, Hd - 132); x.strokeRect(46, 66, Wd - 92, Hd - 132);
      x.strokeRect(66, 66, Wd - 132, Hd - 132); x.beginPath(); x.moveTo(66, 160); x.lineTo(Wd - 66, 160); x.moveTo(66, Hd - 160); x.lineTo(Wd - 66, Hd - 160); x.moveTo(Wd / 2, 160); x.lineTo(Wd / 2, Hd - 160); x.stroke();
      x.strokeStyle = '#222'; x.lineWidth = 5; x.beginPath(); x.moveTo(36, Hd / 2); x.lineTo(Wd - 36, Hd / 2); x.stroke();
    } else if (sport === 'volleyball') {
      x.fillStyle = '#3f8fb0'; x.fillRect(0, 0, Wd, Hd); x.fillStyle = '#e39a52'; x.fillRect(40, 70, Wd - 80, Hd - 140); x.strokeRect(40, 70, Wd - 80, Hd - 140);
      x.beginPath(); x.moveTo(40, Hd / 2 - 60); x.lineTo(Wd - 40, Hd / 2 - 60); x.moveTo(40, Hd / 2 + 60); x.lineTo(Wd - 40, Hd / 2 + 60); x.stroke(); x.strokeStyle = '#222'; x.lineWidth = 5; x.beginPath(); x.moveTo(30, Hd / 2); x.lineTo(Wd - 30, Hd / 2); x.stroke();
    } else {
      for (let i = 0; i < 12; i++) { x.fillStyle = i % 2 ? '#4fa863' : '#58b56d'; x.fillRect(0, i * Hd / 12, Wd, Hd / 12 + 1); }
      x.strokeRect(14, 14, Wd - 28, Hd - 28); x.beginPath(); x.moveTo(14, Hd / 2); x.lineTo(Wd - 14, Hd / 2); x.stroke(); x.beginPath(); x.arc(Wd / 2, Hd / 2, 34, 0, 7); x.stroke();
      for (const s of [0, 1]) { x.save(); if (s) { x.translate(0, Hd); x.scale(1, -1); } x.strokeRect(Wd / 2 - 62, 14, 124, 62); x.strokeRect(Wd / 2 - 28, 14, 56, 22); x.restore(); }
    }
    return G.canvasTex(c, { aniso: 8 });
  }

  // ================================================================== ground polygons, pitches
  function buildAreas(scene) {
    const mb = new MB(), courts = {}; mb.auv = 5;
    const cLawn = lin(0x97cf6b), cPark = lin(0x8e9097), cPlaza = lin(0xd9d1c0), cTrack = lin(0xb9573f), cField = lin(0x58b06a), cLine = lin(0xeeeee6), cPitch = lin(0x5aa96c);
    const court = (sport, o, cu, cv, hl, hs, longU) => { // one court quad; long axis along u if longU
      const m = courts[sport] || (courts[sport] = new MB());
      const c = longU ? [[cu - hl, cv - hs], [cu + hl, cv - hs], [cu + hl, cv + hs], [cu - hl, cv + hs]] : [[cu - hs, cv - hl], [cu - hs, cv + hl], [cu + hs, cv + hl], [cu + hs, cv - hl]];
      quadUp(m, c.map(p => o.pt(p[0], p[1])), 0.1, [1, 1, 1], [[0, 0], [0, 1], [1, 1], [1, 0]]);
    };
    for (const a of W.areas) {
      if (a.kind === 'grass') polyUp(mb, a.ring, a.holes, 0.03, cLawn, 0.07);
      else if (a.kind === 'parking') polyUp(mb, a.ring, null, 0.04, cPark, 0.03);
      else if (a.kind === 'plaza') polyUp(mb, a.ring, null, 0.05, cPlaza, 0.03);
      else if (a.kind === 'track') polyUp(mb, a.ring, a.holes, 0.07, cTrack, 0.02);
      else if (a.kind === 'trackfield') {
        polyUp(mb, a.ring, null, 0.07, cTrack, 0.02);
        const sc = (k) => { const r = new Float32Array(a.ring.length); for (let i = 0; i < r.length; i += 2) { r[i] = a.cx + (a.ring[i] - a.cx) * k; r[i + 1] = a.cz + (a.ring[i + 1] - a.cz) * k; } return r; };
        const inner = sc(0.72); polyUp(mb, inner, null, 0.085, cField, 0.04);
        for (const k of [0.79, 0.86, 0.93, 0.995]) { const r = sc(k), pts = []; for (let i = 0; i < r.length; i += 2) pts.push([r[i], r[i + 1]]); strip(mb, pts, 0.14, 0.095, cLine, { closed: true }); }
        const o = obb(inner); court('soccer', o, o.cu, o.cv, o.hu * 0.82, o.hv * 0.9, true);
      } else if (a.kind === 'pitch') {
        const o = obb(a.ring), fill = a.area / (4 * o.hu * o.hv);
        if (fill < 0.82 || a.area < 90) { polyUp(mb, a.ring, null, 0.08, cPitch, 0.03); continue; }
        const A2 = o.hu * 2, B2 = o.hv * 2, longIsU = A2 >= B2, Lg = Math.max(A2, B2), Sh = Math.min(A2, B2), sp = /basket|tennis|volley/.test(a.sport) ? a.sport : 'soccer';
        const unitS = { basketball: 18, tennis: 18, volleyball: 14 }[sp], unitL = { basketball: 31, tennis: 36, volleyball: 26 }[sp];
        if (sp === 'soccer') { court(sp, o, o.cu, o.cv, Lg / 2, Sh / 2, longIsU); continue; }
        if (Sh > unitL * 0.8) { const n = Math.max(1, Math.round(Lg / unitS)); for (let i = 0; i < n; i++) { const c = -Lg / 2 + (i + 0.5) * Lg / n; longIsU ? court(sp, o, o.cu + c, o.cv, Sh / 2, Lg / n / 2, false) : court(sp, o, o.cu, o.cv + c, Sh / 2, Lg / n / 2, true); } }
        else { const n = Math.max(1, Math.round(Lg / unitL)); for (let i = 0; i < n; i++) { const c = -Lg / 2 + (i + 0.5) * Lg / n; longIsU ? court(sp, o, o.cu + c, o.cv, Lg / n / 2, Sh / 2, true) : court(sp, o, o.cu, o.cv + c, Lg / n / 2, Sh / 2, false); } }
      }
    }
    // paved aprons around campus buildings
    const cApron = lin(0xcfc8b8);
    for (const b of W.buildings) { if (!b.campus || /canopy|guard/.test(b.kind)) continue; const pts = []; for (let k = 0; k < b.ring.length; k += 2) pts.push([b.ring[k], b.ring[k + 1]]); strip(mb, pts, 3.0, 0.045, cApron, { closed: true, off: -1.5 }); }
    const mat = new THREE.MeshLambertMaterial({ vertexColors: true, map: W.detailTex(), polygonOffset: true, polygonOffsetFactor: -1, polygonOffsetUnits: -1 });
    scene.add(mb.mesh(mat));
    for (const sp in courts) { const m = new THREE.MeshLambertMaterial({ map: courtTex(sp), polygonOffset: true, polygonOffsetFactor: -3, polygonOffsetUnits: -3 }); scene.add(courts[sp].mesh(m)); }
  }

  // ================================================================== roads
  function buildRoads(scene) {
    const mb = new MB(), mk = new MB(); mb.auv = 3.5;
    const COL = { asphalt: lin(0x4a4d55), campus: lin(0x62656c), ped: lin(0xd9ceb8), foot: lin(0xd8cbb0), footOut: lin(0xc6c1b3), steps: lin(0xbdb6a7), cycle: lin(0xb4664d), trail: lin(0xad936a), mark: lin(0xe4e4dc), yellow: lin(0xe0b84a) };
    for (const r of W.roads) {
      if (r.tunnel) continue;
      const raw = r.seq.map(i => [W.nodes[i * 2], W.nodes[i * 2 + 1]]), veh = isVeh(r.kind);
      const col = veh ? ((r.campus || r.kind === 'service' || r.kind === 'minor') ? COL.campus : COL.asphalt) : r.kind === 'foot' ? (r.campus ? COL.foot : COL.footOut) : COL[r.kind] || COL.foot;
      const y = veh ? 0.06 : 0.1, pts = subdiv(raw, veh ? 9 : 5);
      strip(mb, pts, r.w, y, col, { drape: true });
      if (veh) { for (const p of raw) disc(mb, p[0], p[1], r.w / 2, y, col, true); }
      else { disc(mb, raw[0][0], raw[0][1], r.w / 2, y, col, true); disc(mb, raw[raw.length - 1][0], raw[raw.length - 1][1], r.w / 2, y, col, true); }
      if (veh && r.kind !== 'service' && r.w >= 6) {
        if (r.oneway) { const lanes = Math.max(1, Math.round(r.w / 3.7)), lw = r.w / lanes; for (let k = 1; k < lanes; k++) dashes(mk, raw, (k - lanes / 2) * lw, 0.16, y + 0.02, COL.mark, 3.5, 6); }
        else dashes(mk, raw, 0, 0.16, y + 0.02, r.campus || r.kind === 'minor' ? COL.mark : COL.yellow, 3.5, 5.5);
        if (/trunk|primary|secondary|tertiary/.test(r.kind)) { strip(mk, pts, 0.15, y + 0.02, COL.mark, { drape: true, off: r.w / 2 - 0.35 }); strip(mk, pts, 0.15, y + 0.02, COL.mark, { drape: true, off: -r.w / 2 + 0.35 }); }
      }
      if (r.kind === 'steps') dashes(mk, raw, 0, r.w * 0.96, y + 0.02, lin(0xa39d8e), 0.18, 0.5);
    }
    scene.add(mb.mesh(new THREE.MeshLambertMaterial({ vertexColors: true, map: W.detailTex(), polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2 })));
    scene.add(mk.mesh(new THREE.MeshLambertMaterial({ vertexColors: true, polygonOffset: true, polygonOffsetFactor: -4, polygonOffsetUnits: -4 })));
  }

  // ================================================================== buildings
  const STY = {
    teaching: { wall: '#ddd7ca', glass: ['#2c4458', '#6c90aa'], frame: '#8a6646', ww: .76, wh: .5, band: '#b7ad9c', fins: '#a06f48', roof: 0xb5b0a4, bay: 3.6, fl: 4.0, lit: .3 },
    college: { wall: '#f1e7d5', glass: ['#34505f', '#8aaaba'], frame: '#fbf7ee', ww: .44, wh: .5, band: '#c9764d', balcony: true, roof: 0xc4a088, bay: 3.3, fl: 3.2, lit: .6 },
    resid: { wall: '#eadcc5', glass: ['#3a4f5c', '#8fa6b3'], frame: '#f6f0e2', ww: .5, wh: .5, band: '#b89b78', balcony: true, roof: 0xb9aa96, bay: 3.4, fl: 3.2, lit: .55 },
    library: { wall: '#f6f4ef', glass: ['#356782', '#9fcadb'], frame: '#ffffff', ww: .9, wh: .84, fins: '#ffffff', roof: 0xdfdcd3, bay: 3.0, fl: 4.2, lit: .75, mull: 3 },
    admin: { wall: '#d7cdb9', glass: ['#2f3d4a', '#7d94a6'], frame: '#6b5a44', ww: .62, wh: .56, band: '#a8987a', roof: 0xb0a792, bay: 3.6, fl: 4.0, lit: .25 },
    research: { wall: '#d0d7db', glass: ['#234c69', '#80b4d2'], frame: '#edf2f5', ww: .92, wh: .62, band: '#eef2f4', roof: 0xb4bcc2, bay: 3.2, fl: 4.0, lit: .5, mull: 3 },
    sports: { wall: '#dbe0e4', glass: ['#42607a', '#9db9ca'], frame: '#b9c2c8', ww: .56, wh: .3, band: '#e9a23b', roof: 0xc3cad0, bay: 4.2, fl: 4.0, lit: .3 },
    service: { wall: '#f0eadb', glass: ['#345555', '#8fb8b0'], frame: '#3f8f7f', ww: .72, wh: .56, band: '#3f8f7f', roof: 0xc8c2b2, bay: 3.6, fl: 3.6, lit: .5 },
    campus: { wall: '#e5dfcf', glass: ['#33485a', '#8aa3b4'], frame: '#8f8672', ww: .62, wh: .5, band: '#c2b8a2', roof: 0xbdb6a6, bay: 3.6, fl: 3.6, lit: .35 },
    tower: { wall: '#a8563c', glass: ['#3a2a22', '#7a5a48'], frame: '#e9dcc4', ww: .3, wh: .5, band: '#8f452f', brick: true, roof: 0x7d3f2c, bay: 3.2, fl: 4.0, lit: .2 },
    city: { wall: '#c5c8cd', glass: ['#35414d', '#7a8a98'], frame: '#aeb3b9', ww: .68, wh: .5, band: '#b4b8bd', roof: 0xa9adb3, bay: 3.6, fl: 3.6, lit: .35 },
    cityres: { wall: '#ddd0c3', glass: ['#3c4a55', '#8696a3'], frame: '#efe8de', ww: .5, wh: .5, band: '#c2ad9b', balcony: true, roof: 0xb7aca2, bay: 3.4, fl: 3.2, lit: .55 },
    retail: { wall: '#d3cbbc', glass: ['#2e4450', '#7fa0ae'], frame: '#8d8573', ww: .84, wh: .62, band: '#c05b45', roof: 0xb3ab9c, bay: 4.0, fl: 3.6, lit: .7 },
    guard: { wall: '#e9e4d8', glass: ['#2e4450', '#7fa0ae'], frame: '#6b6558', ww: .7, wh: .5, roof: 0x8f6a4e, bay: 3.0, fl: 3.0, lit: .8 }
  };
  const colSt = (wall, band, roof) => Object.assign({}, STY.college, { wall, band, roof });
  Object.assign(STY, { // each college's real facade colours
    'col_学勤': colSt('#f3e7b4', '#d8b24a', 0xc9b98a), 'col_思廷': colSt('#e4e7e3', '#2f9c6a', 0xaab5ad), 'col_祥波': colSt('#e9c6ba', '#c8402e', 0xb0705f), 'col_道扬': colSt('#f1f5f9', '#3f7fc9', 0xb4c2d0),
    'col_厚含': colSt('#f6efe3', '#e8892f', 0xd0b08a), 'col_永平': colSt('#f0ecf6', '#7a4fb5', 0xb9aed0), 'col_第八': colSt('#eef2f3', '#5a8fa8', 0xb5c4ca),
    music: { wall: '#f7f7f4', glass: ['#3a5566', '#8fb0c2'], frame: '#ffffff', ww: .5, wh: .34, roof: 0xf2f2ee, bay: 5.0, fl: 4.5, lit: .5 }
  });
  const styleKey = b => { if (b.kind === 'college') { const m = /学勤|思廷|祥波|道扬|厚含|永平|第八/.exec(b.zh); if (m) return 'col_' + m[0]; } return STY[b.kind] ? b.kind : 'city'; };
  W.STY = STY;
  function facadeTex(st, seed) {
    const N = 4, S = 128, c = G.canvas(N * S, N * S), x = c.getContext('2d'), e = G.canvas(N * S, N * S), ex = e.getContext('2d'), r = G.rng(seed);
    x.fillStyle = st.wall; x.fillRect(0, 0, c.width, c.height);
    if (st.brick) { x.strokeStyle = 'rgba(0,0,0,.16)'; x.lineWidth = 1; for (let yy = 0; yy < c.height; yy += 8) { x.beginPath(); x.moveTo(0, yy); x.lineTo(c.width, yy); x.stroke(); for (let xx = (yy / 8 % 2) * 10; xx < c.width; xx += 20) { x.beginPath(); x.moveTo(xx, yy); x.lineTo(xx, yy + 8); x.stroke(); } } }
    for (let i = 0; i < 900; i++) { x.fillStyle = r() < .5 ? 'rgba(0,0,0,.025)' : 'rgba(255,255,255,.04)'; x.fillRect(r() * c.width, r() * c.height, 3 + r() * 14, 2 + r() * 4); }
    ex.fillStyle = '#000'; ex.fillRect(0, 0, e.width, e.height);
    for (let fy = 0; fy < N; fy++) for (let bx = 0; bx < N; bx++) {
      const X = bx * S, Y = fy * S, ww = st.ww * S, wh = st.wh * S, wx = X + (S - ww) / 2, wy = Y + (S - wh) / 2 - S * 0.05;
      if (st.band) { x.fillStyle = st.band; x.fillRect(X, Y + S - S * 0.09, S, S * 0.09); x.fillStyle = 'rgba(0,0,0,.10)'; x.fillRect(X, Y + S - S * 0.09, S, 2); }
      const g = x.createLinearGradient(0, wy, 0, wy + wh); g.addColorStop(0, st.glass[0]); g.addColorStop(1, st.glass[1]); x.fillStyle = g; x.fillRect(wx, wy, ww, wh);
      x.fillStyle = 'rgba(255,255,255,.11)'; x.beginPath(); x.moveTo(wx, wy + wh * 0.65); x.lineTo(wx + ww * 0.45, wy); x.lineTo(wx + ww * 0.7, wy); x.lineTo(wx, wy + wh); x.fill();
      x.strokeStyle = st.frame; x.lineWidth = 4; x.strokeRect(wx, wy, ww, wh); const mu = st.mull || 2; x.lineWidth = 2.5; x.beginPath(); for (let m = 1; m < mu; m++) { x.moveTo(wx + ww * m / mu, wy); x.lineTo(wx + ww * m / mu, wy + wh); } x.stroke();
      x.fillStyle = 'rgba(0,0,0,.14)'; x.fillRect(wx, wy + wh, ww, 3);
      const lit = r() < (st.lit || .4);
      if (lit) { const k = r(); ex.fillStyle = k < .62 ? '#ffd58a' : k < .86 ? '#fff0cf' : '#cfe6ff'; ex.globalAlpha = .5 + r() * .5; ex.fillRect(wx + 3, wy + 3, ww - 6, wh - 6); ex.globalAlpha = 1; if (r() < .5) { ex.fillStyle = 'rgba(0,0,0,.35)'; ex.fillRect(wx + ww * (0.2 + r() * 0.5), wy + wh * 0.45, ww * 0.14, wh * 0.55); } }
      if (st.balcony) { x.fillStyle = 'rgba(250,247,240,.92)'; x.fillRect(wx - 9, wy + wh * 0.66, ww + 18, wh * 0.4); x.fillStyle = 'rgba(0,0,0,.13)'; x.fillRect(wx - 9, wy + wh * 1.06, ww + 18, 3); x.strokeStyle = 'rgba(0,0,0,.08)'; x.lineWidth = 1; for (let q = 0; q < 6; q++) { x.beginPath(); x.moveTo(wx - 9 + (ww + 18) * q / 6, wy + wh * 0.66); x.lineTo(wx - 9 + (ww + 18) * q / 6, wy + wh * 1.06); x.stroke(); } ex.fillStyle = '#000'; ex.fillRect(wx - 9, wy + wh * 0.66, ww + 18, wh * 0.4); if (r() < .3) { x.fillStyle = '#d9dcdf'; x.fillRect(wx + ww + 12, wy + wh * 0.5, 16, 13); } }
      if (st.fins) { x.fillStyle = st.fins; x.fillRect(X, Y, S * 0.065, S); x.fillRect(X + S * 0.5 - S * 0.02, Y, S * 0.04, S); x.fillStyle = 'rgba(0,0,0,.10)'; x.fillRect(X + S * 0.065, Y, 2, S); ex.fillStyle = '#000'; ex.fillRect(X, Y, S * 0.065, S); ex.fillRect(X + S * 0.5 - S * 0.02, Y, S * 0.04, S); }
    }
    const map = G.canvasTex(c, { repeat: true, aniso: 8 }), emap = G.canvasTex(e, { repeat: true, aniso: 4 });
    return { map, emap };
  }
  W.winMats = [];
  function buildBuildings(scene) {
    const groups = {}, roof = new MB(), special = new MB();
    for (const b of W.buildings) {
      G.col.addRing(b.ring, b.h, 0);
      if (b.kind === 'stadium') { buildStadium(special, b); continue; }
      if (b.kind === 'canopy') { buildCanopy(roof, b); continue; }
      if (b.kind === 'tower') { buildPagoda(roof, b); W.tower = b; continue; }
      const sk = styleKey(b), st = STY[sk], mb = groups[sk] || (groups[sk] = new MB());
      const ring = b.ring, n = ring.length / 2, floors = Math.max(1, Math.round((b.h - 1) / st.fl)), vTop = (b.h / st.fl) / 4, hs = G.hash2(b.i * 31, 7), u0 = Math.floor(hs * 4) / 4, v0 = Math.floor(G.hash2(b.i, 99) * 4) / 4;
      for (let k = 0; k < n; k++) {
        const ax = ring[k * 2], az = ring[k * 2 + 1], bx = ring[((k + 1) % n) * 2], bz = ring[((k + 1) % n) * 2 + 1], dx = bx - ax, dz = bz - az, L = Math.hypot(dx, dz); if (L < 0.05) continue;
        const nx = dz / L, nz = -dx / L, bays = Math.max(1, Math.round(L / st.bay)), u1 = u0 + bays / 4, yb = Math.min(3.4, b.h * 0.4), vb = yb / st.fl / 4, sh = 0.9 + 0.1 * Math.max(0, nz * 0.6 + nx * 0.4);
        const d = 0.74 * sh, f = sh;
        const b0 = mb.v(bx, -1.5, bz, nx, 0, nz, d, d, d, u1, v0), a0 = mb.v(ax, -1.5, az, nx, 0, nz, d, d, d, u0, v0), a1 = mb.v(ax, yb, az, nx, 0, nz, f, f, f, u0, v0 + vb), b1 = mb.v(bx, yb, bz, nx, 0, nz, f, f, f, u1, v0 + vb);
        const a2 = mb.v(ax, b.h, az, nx, 0, nz, f, f, f, u0, v0 + vTop), b2 = mb.v(bx, b.h, bz, nx, 0, nz, f, f, f, u1, v0 + vTop);
        mb.quad(b0, a0, a1, b1); mb.quad(b1, a1, a2, b2);
      }
      // roof + parapet rim + rooftop block
      const rc = lin(st.roof), jit = 0.92 + 0.14 * G.hash2(b.i, 5), col = [rc[0] * jit, rc[1] * jit, rc[2] * jit];
      polyUp(roof, ring, null, b.h, col, 0.03);
      if (b.area > 260 && b.h > 9 && !/sports|service|guard/.test(b.kind)) {
        const k = 0.42, ir = []; let ok = true;
        for (let q = 0; q < n; q++) { const x = b.cx + (ring[q * 2] - b.cx) * k, z = b.cz + (ring[q * 2 + 1] - b.cz) * k; if (!G.pip(x, z, ring)) { ok = false; break; } ir.push(x, z); }
        if (ok && n <= 12) { const hh = b.h + 2.6, c2 = [col[0] * 0.9, col[1] * 0.9, col[2] * 0.92]; polyUp(roof, ir, null, hh, c2); for (let q = 0; q < n; q++) { const ax = ir[q * 2], az = ir[q * 2 + 1], bx = ir[((q + 1) % n) * 2], bz = ir[((q + 1) % n) * 2 + 1], dx = bx - ax, dz = bz - az, L = Math.hypot(dx, dz) || 1, nx = dz / L, nz = -dx / L; const s = 0.82; roof.quad(roof.v(bx, b.h, bz, nx, 0, nz, c2[0] * s, c2[1] * s, c2[2] * s), roof.v(ax, b.h, az, nx, 0, nz, c2[0] * s, c2[1] * s, c2[2] * s), roof.v(ax, hh, az, nx, 0, nz, c2[0] * s, c2[1] * s, c2[2] * s), roof.v(bx, hh, bz, nx, 0, nz, c2[0] * s, c2[1] * s, c2[2] * s)); } }
      }
    }
    let seed = 11;
    for (const k in groups) {
      const t = facadeTex(STY[k], seed += 17), mat = new THREE.MeshLambertMaterial({ map: t.map, emissiveMap: t.emap, emissive: 0xffffff, emissiveIntensity: 0, vertexColors: true });
      W.winMats.push(mat); const m = groups[k].mesh(mat, { cast: true }); scene.add(m);
    }
    scene.add(roof.mesh(new THREE.MeshLambertMaterial({ vertexColors: true }), { cast: true }));
    const sg = special.geo().toNonIndexed(); sg.computeVertexNormals();
    const sm = new THREE.Mesh(sg, new THREE.MeshLambertMaterial({ vertexColors: true, emissive: 0x9fc4e8, emissiveIntensity: 0 })); sm.castShadow = true; sm.receiveShadow = true; sm.matrixAutoUpdate = false; scene.add(sm); W.stadiumMat = sm.material;
  }
  function buildPagoda(mb, b) { // the Clock Tower: a dense-eave pagoda silhouette — tapering tiers with projecting eaves
    const N = 14, base = lin(0xb98a62), base2 = lin(0xae7f58), dark = lin(0x6a4a38), n = b.ring.length / 2, H = b.h, first = H * 0.2, th = (H - first) / N;
    const ringAt = s => { const r = []; for (let q = 0; q < n; q++) r.push(b.cx + (b.ring[q * 2] - b.cx) * s, b.cz + (b.ring[q * 2 + 1] - b.cz) * s); return r; };
    const sides = (r0, r1, y0, y1, c) => { for (let q = 0; q < n; q++) { const q2 = (q + 1) % n, ax = r0[q * 2], az = r0[q * 2 + 1], bx = r0[q2 * 2], bz = r0[q2 * 2 + 1], ex = bx - ax, ez = bz - az, L = Math.hypot(ex, ez) || 1, nx = ez / L, nz = -ex / L, s = 0.78 + 0.22 * Math.max(0, nz * 0.6 + nx * 0.4); mb.quad(mb.v(bx, y0, bz, nx, 0, nz, c[0] * s, c[1] * s, c[2] * s), mb.v(ax, y0, az, nx, 0, nz, c[0] * s, c[1] * s, c[2] * s), mb.v(r1[q * 2], y1, r1[q * 2 + 1], nx, 0, nz, c[0] * s, c[1] * s, c[2] * s), mb.v(r1[q2 * 2], y1, r1[q2 * 2 + 1], nx, 0, nz, c[0] * s, c[1] * s, c[2] * s)); } };
    const scale = k => 1 - 0.3 * Math.pow(k / N, 1.7);
    sides(ringAt(1), ringAt(1), -1, first, base);
    for (let k = 0; k < N; k++) { const y0 = first + k * th, e = ringAt(scale(k) * 1.17); polyUp(mb, e, null, y0 + 0.4, dark); polyUp(mb, e, null, y0, [dark[0] * 0.6, dark[1] * 0.6, dark[2] * 0.6], 0, true); sides(e, e, y0, y0 + 0.4, dark); sides(ringAt(scale(k)), ringAt(scale(k + 1)), y0 + 0.4, y0 + th, k % 2 ? base : base2); }
    const top = ringAt(scale(N) * 1.17); polyUp(mb, top, null, H + 0.4, dark); polyUp(mb, top, null, H, [dark[0] * 0.6, dark[1] * 0.6, dark[2] * 0.6], 0, true); sides(top, top, H, H + 0.4, dark);
    const apex = mb.v(b.cx, H + 8, b.cz, 0, 1, 0, dark[0], dark[1], dark[2]), t2 = ringAt(scale(N) * 0.8);
    for (let q = 0; q < n; q++) { const q2 = (q + 1) % n; mb.tri(mb.v(t2[q2 * 2], H + 0.4, t2[q2 * 2 + 1], 0, 1, 0, dark[0], dark[1], dark[2]), mb.v(t2[q * 2], H + 0.4, t2[q * 2 + 1], 0, 1, 0, dark[0] * 0.8, dark[1] * 0.8, dark[2] * 0.8), apex); }
  }
  function buildCanopy(roof, b) {
    const c = lin(0xe8e4da), n = b.ring.length / 2, y = Math.max(3.4, b.h - 1.5);
    polyUp(roof, b.ring, null, y + 0.3, c);
    const post = lin(0x8a8f96);
    for (let q = 0; q < n; q += Math.max(1, Math.floor(n / 6))) { const x = b.cx + (b.ring[q * 2] - b.cx) * 0.9, z = b.cz + (b.ring[q * 2 + 1] - b.cz) * 0.9, s = 0.14; for (const [dx, dz, nx, nz] of [[1, 0, 0, 1], [0, 1, -1, 0], [-1, 0, 0, -1], [0, -1, 1, 0]]) { const x1 = x + (dx - dz) * s, z1 = z + (dz + dx) * s, x2 = x + (-dx - dz) * s, z2 = z + (-dz + dx) * s; roof.quad(roof.v(x1, 0, z1, nx, 0, nz, post[0], post[1], post[2]), roof.v(x2, 0, z2, nx, 0, nz, post[0], post[1], post[2]), roof.v(x2, y + 0.3, z2, nx, 0, nz, post[0], post[1], post[2]), roof.v(x1, y + 0.3, z1, nx, 0, nz, post[0], post[1], post[2])); } }
  }
  function buildStadium(mb, b) { // faceted "crystal" shell
    const n = b.ring.length / 2, lv = [[0, 1.0], [b.h * 0.42, 1.07], [b.h * 0.8, 0.96], [b.h, 0.74]], cols = [lin(0xf4f7fa), lin(0xdfe9f2), lin(0xc9dcec), lin(0xeef3f7)];
    const pt = (q, l) => [b.cx + (b.ring[(q % n) * 2] - b.cx) * lv[l][1], lv[l][0], b.cz + (b.ring[(q % n) * 2 + 1] - b.cz) * lv[l][1]];
    for (let l = 0; l < 3; l++) for (let q = 0; q < n; q++) {
      const A = pt(q, l), B = pt(q + 1, l), C2 = pt(q + 1, l + 1), D = pt(q, l + 1), c1 = cols[(q + l) % 4], c2 = cols[(q + l + 2) % 4];
      const ia = mb.v(B[0], B[1], B[2], 0, 1, 0, c1[0], c1[1], c1[2]), ib = mb.v(A[0], A[1], A[2], 0, 1, 0, c1[0], c1[1], c1[2]), ic = mb.v(D[0], D[1], D[2], 0, 1, 0, c1[0], c1[1], c1[2]); mb.tri(ia, ib, ic);
      const id = mb.v(B[0], B[1], B[2], 0, 1, 0, c2[0], c2[1], c2[2]), ie = mb.v(D[0], D[1], D[2], 0, 1, 0, c2[0], c2[1], c2[2]), ig = mb.v(C2[0], C2[1], C2[2], 0, 1, 0, c2[0], c2[1], c2[2]); mb.tri(id, ie, ig);
    }
    const top = []; for (let q = 0; q < n; q++) { const p = pt(q, 3); top.push(p[0], p[2]); }
    polyUp(mb, top, null, b.h, lin(0xb9cfdf)); const inner = []; for (let q = 0; q < n; q++) { inner.push(b.cx + (b.ring[q * 2] - b.cx) * 0.42, b.cz + (b.ring[q * 2 + 1] - b.cz) * 0.42); } polyUp(mb, inner, null, b.h + 0.2, lin(0x4f9a62));
  }

  // ================================================================== vegetation & street furniture (instanced)
  function part(geo, color, m4) { const g = geo.index ? geo.toNonIndexed() : geo.clone(); if (m4) g.applyMatrix4(m4); const n = g.attributes.position.count, c = new Float32Array(n * 3), col = lin(color); for (let i = 0; i < n; i++) c.set(col, i * 3); g.setAttribute('color', new THREE.BufferAttribute(c, 3)); return g; }
  function merge(parts, flat) {
    let n = 0; parts.forEach(g => n += g.attributes.position.count); const P = new Float32Array(n * 3), N = new Float32Array(n * 3), Cc = new Float32Array(n * 3); let o = 0;
    for (const g of parts) { P.set(g.attributes.position.array, o * 3); N.set(g.attributes.normal.array, o * 3); Cc.set(g.attributes.color.array, o * 3); o += g.attributes.position.count; }
    const out = new THREE.BufferGeometry();
    if (flat) { // weld identical vertices -> indexed geometry (flat look comes from material.flatShading)
      const map = new Map(), p2 = [], c2 = [], n2 = [], idx = [];
      for (let i = 0; i < n; i++) { const key = Math.round(P[i * 3] * 500) + ',' + Math.round(P[i * 3 + 1] * 500) + ',' + Math.round(P[i * 3 + 2] * 500) + ',' + Math.round(Cc[i * 3] * 255) + ',' + Math.round(Cc[i * 3 + 1] * 255); let j = map.get(key); if (j === undefined) { j = p2.length / 3; map.set(key, j); p2.push(P[i * 3], P[i * 3 + 1], P[i * 3 + 2]); c2.push(Cc[i * 3], Cc[i * 3 + 1], Cc[i * 3 + 2]); n2.push(N[i * 3], N[i * 3 + 1], N[i * 3 + 2]); } idx.push(j); }
      out.setAttribute('position', new THREE.Float32BufferAttribute(p2, 3)); out.setAttribute('normal', new THREE.Float32BufferAttribute(n2, 3)); out.setAttribute('color', new THREE.Float32BufferAttribute(c2, 3)); out.setIndex(idx);
    } else { out.setAttribute('position', new THREE.BufferAttribute(P, 3)); out.setAttribute('normal', new THREE.BufferAttribute(N, 3)); out.setAttribute('color', new THREE.BufferAttribute(Cc, 3)); }
    out.computeBoundingSphere(); return out;
  }
  const m4 = (tx, ty, tz, sx = 1, sy = 1, sz = 1, rx = 0, ry = 0, rz = 0) => new THREE.Matrix4().compose(new THREE.Vector3(tx, ty, tz), new THREE.Quaternion().setFromEuler(new THREE.Euler(rx, ry, rz, 'YXZ')), new THREE.Vector3(sx, sy, sz));
  G.geo = { part, merge, m4 };
  function vegGeos() {
    const ico = new THREE.IcosahedronGeometry(1, 0), ico1 = new THREE.IcosahedronGeometry(1, 1), bark = 0x6b4f3a, WH = 0xffffff;
    const g = {};
    g[0] = merge([part(new THREE.CylinderGeometry(0.2, 0.3, 4.8, 4, 1, true), 0x5d4734, m4(0, 2.4, 0)), part(ico, WH, m4(0, 6.2, 0, 3.6, 4.0, 3.6, 0.3, 0.5, 0))], true);
    g[1] = merge([part(new THREE.CylinderGeometry(0.18, 0.3, 3.2, 5, 1, true), bark, m4(0, 1.6, 0)), part(ico, WH, m4(0, 4.8, 0, 2.6, 2.3, 2.6)), part(ico, 0xe6f2dc, m4(1.5, 4.0, 0.5, 1.8, 1.6, 1.8, 0.4, 0.7, 0)), part(ico, 0xd8ebcc, m4(-1.2, 4.3, -0.9, 1.8, 1.6, 1.8, 0.2, 1.9, 0.5))], true);
    const palm = [part(new THREE.CylinderGeometry(0.13, 0.25, 8.2, 5, 1, true), 0x9a8468, m4(0, 4.1, 0))];
    for (let i = 0; i < 8; i++) palm.push(part(new THREE.ConeGeometry(0.42, 3.6, 4, 1, true), WH, m4(0, 8.2, 0, 1, 1, 1, 0, i / 8 * G.TAU, 0).multiply(m4(0, 0, 0, 1, 1, 1, 0, 0, -1.95 + (i % 2) * 0.22)).multiply(m4(0, 1.8, 0, 1, 1, 0.22))));
    for (let i = 0; i < 4; i++) palm.push(part(new THREE.ConeGeometry(0.36, 3.0, 4, 1, true), 0xeaf5dc, m4(0, 8.25, 0, 1, 1, 1, 0, (i + 0.5) / 4 * G.TAU, 0).multiply(m4(0, 0, 0, 1, 1, 1, 0, 0, -1.0)).multiply(m4(0, 1.5, 0, 1, 1, 0.22))));
    g[2] = merge(palm, true);
    g[3] = g[1];
    g[4] = merge([part(ico, WH, m4(0, 0.6, 0, 1.1, 0.75, 1.1, 0.3, 0.2, 0)), part(ico, 0xe8f3de, m4(0.7, 0.45, 0.4, 0.7, 0.55, 0.7, 0.9, 1.2, 0))], true);
    g[5] = merge([part(new THREE.CylinderGeometry(0.06, 0.1, 5.4, 5), 0x4a4f57, m4(0, 2.7, 0)), part(new THREE.BoxGeometry(0.08, 0.08, 1.1), 0x4a4f57, m4(0, 5.32, 0.5)), part(new THREE.BoxGeometry(0.3, 0.1, 0.56), 0x3a3e45, m4(0, 5.3, 1.0))], false);
    g[6] = merge([part(new THREE.BoxGeometry(1.7, 0.07, 0.5), 0x9a6b42, m4(0, 0.46, 0)), part(new THREE.BoxGeometry(1.7, 0.42, 0.07), 0x9a6b42, m4(0, 0.8, -0.24, 1, 1, 1, -0.12)), part(new THREE.BoxGeometry(0.08, 0.46, 0.46), 0x3f434a, m4(-0.7, 0.23, 0)), part(new THREE.BoxGeometry(0.08, 0.46, 0.46), 0x3f434a, m4(0.7, 0.23, 0))], false);
    g.bulb = new THREE.BoxGeometry(0.26, 0.05, 0.5); g.bulb.translate(0, 5.235, 1.0);
    g.pool = new THREE.PlaneGeometry(1, 1); g.pool.rotateX(-Math.PI / 2);
    return g;
  }
  W.vegChunks = [];
  function buildVegetation(scene) {
    const geos = vegGeos(), CHS = 302, r = G.rng(424242), d = new THREE.Object3D(), col = new THREE.Color();
    const sway = (mat, amt) => { mat.onBeforeCompile = sh => { sh.uniforms.uTime = G.uTime; sh.vertexShader = 'uniform float uTime;\n' + sh.vertexShader.replace('#include <begin_vertex>', `#include <begin_vertex>\n#ifdef USE_INSTANCING\nfloat ph = instanceMatrix[3][0]*0.21 + instanceMatrix[3][2]*0.17; float kk = max(0.0, transformed.y - 2.2) * ${amt.toFixed(4)};\ntransformed.x += sin(uTime*1.3 + ph) * kk; transformed.z += cos(uTime*1.07 + ph*1.3) * kk;\n#endif`); }; return mat; };
    const mats = {
      0: sway(new THREE.MeshLambertMaterial({ vertexColors: true, flatShading: true }), 0.02), 1: sway(new THREE.MeshLambertMaterial({ vertexColors: true, flatShading: true }), 0.022), 2: sway(new THREE.MeshLambertMaterial({ vertexColors: true, flatShading: true, side: THREE.DoubleSide }), 0.03),
      4: new THREE.MeshLambertMaterial({ vertexColors: true, flatShading: true }), 5: new THREE.MeshLambertMaterial({ vertexColors: true }), 6: new THREE.MeshLambertMaterial({ vertexColors: true })
    }; mats[3] = mats[1];
    W.bulbMat = new THREE.MeshBasicMaterial({ color: 0x555555, fog: true });
    const pc = G.canvas(128, 128), px = pc.getContext('2d'), gr = px.createRadialGradient(64, 64, 2, 64, 64, 64); gr.addColorStop(0, 'rgba(255,214,150,.95)'); gr.addColorStop(0.35, 'rgba(255,200,120,.38)'); gr.addColorStop(1, 'rgba(255,190,110,0)'); px.fillStyle = gr; px.fillRect(0, 0, 128, 128);
    W.poolMat = new THREE.MeshBasicMaterial({ map: G.canvasTex(pc), transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, opacity: 0, polygonOffset: true, polygonOffsetFactor: -6, polygonOffsetUnits: -6, fog: false });
    const chunks = new Map();
    for (const it of W.items) { const cx = Math.floor((it.x - W.X0) / CHS), cz = Math.floor((it.z - W.Z0) / CHS), k = cx + ':' + cz + ':' + it.t; let a = chunks.get(k); if (!a) chunks.set(k, a = { cx, cz, t: it.t, list: [] }); a.list.push(it); }
    const flower = [0xf29bb8, 0xe8694c, 0xc79be0, 0xf5c04a, 0xf2a0c0], shrubC = [0x6fae54, 0x7fbf5a, 0xd9479a, 0xe85a9f, 0x8fc864];
    for (const ch of chunks.values()) {
      if (ch.t === 0) ch.list = G.shuffle(ch.list, r);
      const t = ch.t, n = ch.list.length, mesh = new THREE.InstancedMesh(geos[t], mats[t], n), cxw = W.X0 + (ch.cx + 0.5) * CHS, czw = W.Z0 + (ch.cz + 0.5) * CHS; let ymax = 0;
      const bulbs = t === 5 ? new THREE.InstancedMesh(geos.bulb, W.bulbMat, n) : null, pools = t === 5 ? new THREE.InstancedMesh(geos.pool, W.poolMat, n) : null;
      ch.list.forEach((it, i) => {
        const y = W.ground(it.x, it.z); if (y > ymax) ymax = y;
        if (t <= 4) {
          const s = it.s / 100; d.position.set(it.x, y - 0.05, it.z); d.rotation.set(0, r() * G.TAU, 0); d.scale.set(s * (0.9 + r() * 0.25), s * (0.88 + r() * 0.3), s * (0.9 + r() * 0.25)); d.updateMatrix(); mesh.setMatrixAt(i, d.matrix);
          if (t === 0) col.setHSL(0.26 + r() * 0.1, 0.4 + r() * 0.18, 0.2 + r() * 0.12, THREE.SRGBColorSpace);
          else if (t === 1) col.setHSL(0.25 + r() * 0.08, 0.48 + r() * 0.16, 0.3 + r() * 0.12, THREE.SRGBColorSpace);
          else if (t === 2) col.setHSL(0.28 + r() * 0.05, 0.5 + r() * 0.15, 0.36 + r() * 0.1, THREE.SRGBColorSpace);
          else if (t === 3) col.set(flower[Math.floor(r() * flower.length)]);
          else col.set(shrubC[Math.floor(r() * shrubC.length)]);
          mesh.setColorAt(i, col);
          if (t >= 1 && t <= 3) G.col.addCircle(it.x, it.z, 0.3);
        } else {
          const a = it.s / 255 * G.TAU; d.position.set(it.x, y, it.z); d.rotation.set(0, a, 0); d.scale.set(1, 1, 1); d.updateMatrix(); mesh.setMatrixAt(i, d.matrix);
          col.setRGB(1, 1, 1); mesh.setColorAt(i, col); G.col.addCircle(it.x, it.z, t === 5 ? 0.16 : 0.75);
          if (bulbs) { bulbs.setMatrixAt(i, d.matrix); d.position.set(it.x + Math.sin(a) * 1.0, y + 0.14, it.z + Math.cos(a) * 1.0); d.rotation.set(0, 0, 0); d.scale.set(15, 1, 15); d.updateMatrix(); pools.setMatrixAt(i, d.matrix); }
        }
      });
      mesh.frustumCulled = false; mesh.matrixAutoUpdate = false; mesh.receiveShadow = false; mesh.castShadow = t >= 1 && t <= 3;
      mesh.userData = { sph: new THREE.Sphere(new THREE.Vector3(cxw, ymax / 2 + 6, czw), CHS * 0.72 + ymax / 2 + 12), maxd: [1500, 1000, 1000, 1000, 420, 520, 260][t], t, n };
      scene.add(mesh); W.vegChunks.push(mesh);
      if (bulbs) { for (const m of [bulbs, pools]) { m.frustumCulled = false; m.matrixAutoUpdate = false; m.userData = { sph: mesh.userData.sph, maxd: m === pools ? 330 : 520, t: 5, lampFx: m === pools ? 'pool' : 'bulb' }; scene.add(m); W.vegChunks.push(m); } }
    }
  }
  const fr = new THREE.Frustum(), pm = new THREE.Matrix4();
  W.cullVeg = function (cam, q) {
    pm.multiplyMatrices(cam.projectionMatrix, cam.matrixWorldInverse); fr.setFromProjectionMatrix(pm);
    const px = cam.position.x, py = cam.position.y, pz = cam.position.z, k = (q || 1) * (1 + Math.min(2.2, py / 180)), lamps = G.sky ? G.sky.night > 0.25 : false;
    const lodD = 620 * (q || 1);
    for (const m of W.terrain.children) { const u = m.userData, lod = Math.hypot(u.cx - px, u.cz - pz) > lodD ? 1 : 0; if (lod !== u.lod) { u.lod = lod; m.geometry.setIndex(lod ? u.half : u.full); } }
    for (const m of W.vegChunks) { const u = m.userData, s = u.sph, dx = s.center.x - px, dz = s.center.z - pz, d = Math.sqrt(dx * dx + dz * dz) - s.radius; m.visible = d < u.maxd * k && fr.intersectsSphere(s) && (u.lampFx !== 'pool' || lamps); if (m.visible) { if (u.t === 0) m.count = d < 380 ? u.n : d < 800 ? Math.ceil(u.n * 0.6) : Math.ceil(u.n * 0.34); else if (u.t <= 3) m.castShadow = d < 150; } }
  };

  // ================================================================== water
  function buildWater(scene) {
    const uni = THREE.UniformsUtils.merge([THREE.UniformsLib.fog, { uTime: { value: 0 }, uDeep: { value: new THREE.Color(0x1f6f8f) }, uShallow: { value: new THREE.Color(0x58b5c9) }, uSky: { value: new THREE.Color(0xbfe0f5) }, uSun: { value: new THREE.Color(0xffffff) }, uNight: { value: 0 } }]);
    const mat = new THREE.ShaderMaterial({
      uniforms: uni, fog: true, transparent: true,
      vertexShader: `varying vec3 vW;
#include <fog_pars_vertex>
void main(){ vec4 wp = modelMatrix * vec4(position,1.0); vW = wp.xyz; vec4 mvPosition = viewMatrix * wp; gl_Position = projectionMatrix * mvPosition;
#include <fog_vertex>
}`,
      fragmentShader: `uniform float uTime; uniform vec3 uDeep; uniform vec3 uShallow; uniform vec3 uSky; uniform vec3 uSun; uniform float uNight; varying vec3 vW;
#include <fog_pars_fragment>

        void main(){ float t = uTime; vec2 p = vW.xz;
          float n = sin(p.x*0.33 + t*1.1)*sin(p.y*0.29 - t*0.8) + 0.5*sin((p.x+p.y)*0.83 + t*1.9) + 0.3*sin((p.x-p.y)*1.7 - t*2.4);
          vec3 V = normalize(cameraPosition - vW); float fres = pow(1.0 - clamp(V.y, 0.0, 1.0), 3.0);
          vec3 col = mix(uDeep, uShallow, 0.45 + 0.18*n); col = mix(col, uSky, 0.25 + 0.6*fres);
          float sp = pow(max(0.0, sin(p.x*1.9 + t*2.1 + n)*sin(p.y*2.3 - t*1.6)), 14.0); col += uSun * sp * 0.55 * (1.0 - uNight*0.7);
          gl_FragColor = vec4(col, 0.93);

#include <tonemapping_fragment>
#include <encodings_fragment>
#include <fog_fragment>
        }`
    });
    W.waterMat = mat;
    for (const a of W.areas) {
      if (a.kind !== 'water') continue;
      G.col.addRing(a.ring, 0, 1);
      const m = 8, g = new THREE.PlaneGeometry(a.maxx - a.minx + m * 2, a.maxz - a.minz + m * 2); g.rotateX(-Math.PI / 2);
      const mesh = new THREE.Mesh(g, mat); mesh.position.set((a.minx + a.maxx) / 2, -0.32, (a.minz + a.maxz) / 2); mesh.updateMatrix(); mesh.matrixAutoUpdate = false; scene.add(mesh);
    }
  }

  // ================================================================== props: tunnel portals, gates, bus shelters, entrance sign
  function buildProps(scene) {
    const mb = new MB(), box = (cx, y0, cz, hx, hy, hz, ang, col) => { // oriented box
      const c = Math.cos(ang), s = Math.sin(ang), P = (lx, lz) => [cx + lx * c + lz * s, cz - lx * s + lz * c], cl = lin(col);
      const faces = [[[-hx, -hz], [hx, -hz], 0, -1], [[hx, -hz], [hx, hz], 1, 0], [[hx, hz], [-hx, hz], 0, 1], [[-hx, hz], [-hx, -hz], -1, 0]];
      for (const [a, b, nx0, nz0] of faces) { const A = P(a[0], a[1]), B = P(b[0], b[1]), nx = nx0 * c + nz0 * s, nz = -nx0 * s + nz0 * c, sh = 0.82 + 0.18 * Math.max(0, nz * 0.7 + nx * 0.3); mb.quad(mb.v(A[0], y0, A[1], nx, 0, nz, cl[0] * sh, cl[1] * sh, cl[2] * sh), mb.v(B[0], y0, B[1], nx, 0, nz, cl[0] * sh, cl[1] * sh, cl[2] * sh), mb.v(B[0], y0 + hy, B[1], nx, 0, nz, cl[0] * sh, cl[1] * sh, cl[2] * sh), mb.v(A[0], y0 + hy, A[1], nx, 0, nz, cl[0] * sh, cl[1] * sh, cl[2] * sh)); }
      quadUp(mb, [P(-hx, -hz), P(hx, -hz), P(hx, hz), P(-hx, hz)], y0 + hy, cl);
    };
    W.propBox = box;
    // tunnel portals
    for (const r of W.roads) {
      if (!r.tunnel || !isVeh(r.kind)) continue;
      for (const end of [0, 1]) {
        const s = r.seq, i0 = end ? s[s.length - 1] : s[0], i1 = end ? s[s.length - 2] : s[1], x = W.nodes[i0 * 2], z = W.nodes[i0 * 2 + 1], dx = W.nodes[i1 * 2] - x, dz = W.nodes[i1 * 2 + 1] - z, L = Math.hypot(dx, dz) || 1, ang = Math.atan2(dx / L, dz / L);
        const px = x + dx / L * 4, pz = z + dz / L * 4, y = 0;
        box(px, y, pz, r.w / 2 + 2.2, 8.5, 1.4, ang, 0x9a9c9f); box(px - dx / L * 1.1, y, pz - dz / L * 1.1, r.w / 2 + 0.3, 6.2, 0.5, ang, 0x15171a);
      }
    }
    // gates: boom barrier or pillars
    for (const p of W.pois) {
      if (p.kind !== 'gate') continue;
      const e = G.nav.nearestEdge(p.x, p.z, { maxd: 12, veh: true }) || G.nav.nearestEdge(p.x, p.z, { maxd: 12 }); if (!e) continue;
      const ax = W.nodes[e.e.a * 2], az = W.nodes[e.e.a * 2 + 1], dx = W.nodes[e.e.b * 2] - ax, dz = W.nodes[e.e.b * 2 + 1] - az, L = Math.hypot(dx, dz) || 1, ang = Math.atan2(dx / L, dz / L), w = e.e.road.w / 2 + 0.6, nx = -dz / L, nz = dx / L;
      box(p.x + nx * w, 0, p.z + nz * w, 0.28, 1.25, 0.28, ang, 0xe8b23a); box(p.x - nx * w, 0, p.z - nz * w, 0.28, 1.25, 0.28, ang, 0xe8b23a);
      if (e.e.veh) { box(p.x + nx * (w - 0.1), 1.25, p.z + nz * (w - 0.1), 0.09, 2.6, 0.09, ang, 0xf2f2f2); G.col.addCircle(p.x + nx * w, p.z + nz * w, 0.35); G.col.addCircle(p.x - nx * w, p.z - nz * w, 0.35); }
    }
    // city bus shelters
    for (const p of W.pois) {
      if (p.kind !== 'bus') continue; const e = G.nav.nearestEdge(p.x, p.z, { maxd: 25, veh: true }); if (!e) continue;
      const ax = W.nodes[e.e.a * 2], az = W.nodes[e.e.a * 2 + 1], dx = W.nodes[e.e.b * 2] - ax, dz = W.nodes[e.e.b * 2 + 1] - az, L = Math.hypot(dx, dz) || 1, ang = Math.atan2(dx / L, dz / L) + Math.PI / 2;
      let nx = p.x - e.x, nz = p.z - e.z; const nl = Math.hypot(nx, nz) || 1; nx /= nl; nz /= nl; const bx = e.x + nx * (e.e.road.w / 2 + 2.2), bz = e.z + nz * (e.e.road.w / 2 + 2.2);
      box(bx, 2.5, bz, 0.9, 0.12, 2.6, ang, 0x3d7fb5); box(bx + nx * 0.7, 0, bz + nz * 0.7, 0.06, 2.5, 2.4, ang, 0xcfe3ee); box(bx, 0.42, bz, 0.22, 0.08, 1.6, ang, 0x8a8f96); G.col.addCircle(bx + nx * 0.7, bz + nz * 0.7, 1.0);
    }
    scene.add(mb.mesh(new THREE.MeshLambertMaterial({ vertexColors: true }), { cast: true }));
  }
  // free-standing sign wall with text (used for the main entrance)
  W.signWall = function (scene, x, z, ang, lines, o = {}) {
    const w = o.w || 15, h = o.h || 2.6, c = G.canvas(1024, Math.round(1024 * h / w)), cx = c.getContext('2d');
    const g = cx.createLinearGradient(0, 0, 0, c.height); g.addColorStop(0, '#5d4a7a'); g.addColorStop(1, '#3d2c5c'); cx.fillStyle = g; cx.fillRect(0, 0, c.width, c.height);
    for (let i = 0; i < 500; i++) { cx.fillStyle = `rgba(255,255,255,${Math.random() * 0.04})`; cx.fillRect(Math.random() * c.width, Math.random() * c.height, 2 + Math.random() * 20, 1 + Math.random() * 2); }
    cx.fillStyle = '#e6c15a'; cx.textAlign = 'center'; cx.textBaseline = 'middle';
    cx.font = `700 ${Math.round(c.height * 0.36)}px "Songti SC","STSong","SimSun","Noto Serif SC",serif`; cx.fillText(lines[0], c.width / 2, c.height * 0.38);
    cx.font = `600 ${Math.round(c.height * 0.15)}px Georgia,"Times New Roman",serif`; cx.fillText(lines[1], c.width / 2, c.height * 0.74);
    const grp = new THREE.Group(), body = new THREE.Mesh(new THREE.BoxGeometry(w, h, 0.9), new THREE.MeshLambertMaterial({ color: 0x4a3a66 })); body.position.y = h / 2 + 0.3; body.castShadow = true; grp.add(body);
    const face = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshLambertMaterial({ map: G.canvasTex(c, { aniso: 8 }) })); face.position.set(0, h / 2 + 0.3, 0.46); grp.add(face);
    const base = new THREE.Mesh(new THREE.BoxGeometry(w + 1, 0.3, 1.6), new THREE.MeshLambertMaterial({ color: 0x8f8a80 })); base.position.y = 0.15; grp.add(base);
    grp.position.set(x, W.ground(x, z), z); grp.rotation.y = ang; scene.add(grp);
    const c2 = Math.cos(ang), s2 = Math.sin(ang); G.col.addSeg(x - c2 * w / 2, z + s2 * w / 2, x + c2 * w / 2, z - s2 * w / 2, h, 0); return grp;
  };

  // ================================================================== backdrop
  function buildBackdrop(scene) {
    const g = new THREE.PlaneGeometry(16000, 16000); g.rotateX(-Math.PI / 2);
    const skirt = new THREE.Mesh(g, new THREE.MeshLambertMaterial({ color: 0x9fb08a })); skirt.position.set((W.X0 + W.X1) / 2, -2.6, (W.Z0 + W.Z1) / 2); skirt.updateMatrix(); skirt.matrixAutoUpdate = false; scene.add(skirt);
    // far mountain ring
    const mb = new MB(), cxw = (W.X0 + W.X1) / 2, czw = (W.Z0 + W.Z1) / 2, N = 96;
    for (let ringI = 0; ringI < 2; ringI++) {
      const R = 2900 + ringI * 1100, base = lin(ringI ? 0x6f8fae : 0x5f8a78); let prevT = -1, prevB = -1, f0 = -1, f1 = -1;
      for (let i = 0; i < N; i++) {
        const a = i / N * G.TAU, h = 120 + ringI * 110 + 330 * Math.pow(G.noise2(i * 0.21 + ringI * 9, 3.1), 1.5) + 60 * G.noise2(i * 0.9, 8 + ringI), x = cxw + Math.cos(a) * R, z = czw + Math.sin(a) * R;
        const k = 0.85 + 0.25 * G.noise2(i * 0.9, 4), t = mb.v(x, h, z, -Math.cos(a), 0.6, -Math.sin(a), base[0] * k, base[1] * k, base[2] * k), b = mb.v(x, -5, z, -Math.cos(a), 0.3, -Math.sin(a), base[0] * 0.8, base[1] * 0.8, base[2] * 0.8);
        if (i === 0) { f0 = t; f1 = b; } else mb.i.push(prevT, prevB, t, t, prevB, b); prevT = t; prevB = b;
      }
      mb.i.push(prevT, prevB, f0, f0, prevB, f1);
    }
    const mm = mb.mesh(new THREE.MeshLambertMaterial({ vertexColors: true, side: THREE.DoubleSide }), { receive: false }); scene.add(mm);
    // distant skyline towers
    const sk = new MB(), r = G.rng(99);
    for (let i = 0; i < 70; i++) { const a = -2.6 + r() * 3.4, R = 1700 + r() * 900, x = cxw + Math.cos(a) * R, z = czw + Math.sin(a) * R; if (W.inWorld(x, z, -200)) continue; const w = 14 + r() * 22, h = 50 + r() * r() * 260, c = lin([0x8fa3b8, 0xa2b3c4, 0x7f95ac, 0xb5bfc9][i % 4]); for (const [dx, dz, nx, nz] of [[1, 0, 0, 1], [0, 1, -1, 0], [-1, 0, 0, -1], [0, -1, 1, 0]]) { const x1 = x + (dx - dz) * w, z1 = z + (dz + dx) * w, x2 = x + (-dx - dz) * w, z2 = z + (-dz + dx) * w, s = 0.8 + 0.2 * Math.max(0, nz); sk.quad(sk.v(x1, 0, z1, nx, 0, nz, c[0] * s, c[1] * s, c[2] * s), sk.v(x2, 0, z2, nx, 0, nz, c[0] * s, c[1] * s, c[2] * s), sk.v(x2, h, z2, nx, 0, nz, c[0] * s, c[1] * s, c[2] * s), sk.v(x1, h, z1, nx, 0, nz, c[0] * s, c[1] * s, c[2] * s)); } }
    W.skylineMat = new THREE.MeshLambertMaterial({ vertexColors: true, side: THREE.DoubleSide, emissive: 0xffd9a0, emissiveIntensity: 0 });
    scene.add(sk.mesh(W.skylineMat, { receive: false }));
  }

  // labels for campus buildings and landmarks (projected to HTML by the UI)
  function buildLabels() {
    W.labels = []; const seen = {};
    for (const b of W.buildings) {
      if (!b.zh || (!b.campus && !/大运中心体育场/.test(b.zh))) continue;
      const m = b.zh.match(/^(.*书院)[A-F](栋|座)$/), base = m ? m[1] : b.zh, en = m ? (b.en || '').replace(/\s+(Block|Building)?\s*[A-F]\s*(Block|Building)?$/i, '') : b.en;
      const old = seen[base];
      if (old && Math.hypot(old.x / old.n - b.cx, old.z / old.n - b.cz) < 260) { old.n++; old.x += b.cx; old.z += b.cz; old.y = Math.max(old.y, b.h); continue; }
      const L = { zh: base, en: en || base, x: b.cx, z: b.cz, y: b.h, n: 1, b, major: /图书馆|行政楼|学生中心|书院|体育馆|钟楼|礼文堂|会议中心|教学楼|教学综合楼|道远楼|体育场|音乐厅|科研楼/.test(base) };
      seen[base] = L; W.labels.push(L);
    }
    for (const L of W.labels) { L.x /= L.n; L.z /= L.n; L.y += 6; }
    for (const p of W.pois) if (p.kind === 'peak') W.labels.push({ zh: '⛰ ' + p.zh, en: '⛰ ' + (p.en || p.zh), x: p.x, z: p.z, y: W.ground(p.x, p.z) + 8, major: true, peak: true });
    for (const a of W.areas) if (a.kind === 'water' && a.name) W.labels.push({ zh: '神仙湖', en: 'Shenxian Lake', x: a.cx, z: a.cz, y: 6, major: true });
  }

  W.buildScene = async function (scene, progress) {
    const step = async (t, f) => { progress(t); await G.nextFrame(); f(); };
    await step(G.L('铺设地形…', 'Shaping terrain…'), () => buildTerrain(scene));
    await step(G.L('修建道路…', 'Paving roads…'), () => { buildAreas(scene); buildRoads(scene); });
    await step(G.L('建造楼宇…', 'Raising buildings…'), () => buildBuildings(scene));
    await step(G.L('种树、亮灯…', 'Planting trees…'), () => { buildWater(scene); buildVegetation(scene); });
    await step(G.L('布置校园…', 'Dressing the campus…'), () => { buildProps(scene); buildBackdrop(scene); buildLabels(); });
  };
})();
