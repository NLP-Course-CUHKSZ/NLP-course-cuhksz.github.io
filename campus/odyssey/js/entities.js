/* player, camera, vehicles, crowd NPCs, particles, beacons, interactables */
(function () {
  'use strict';
  const G = window.G, W = G.world, I = G.input;
  const V3 = THREE.Vector3;
  const SKIN = [0xf2c9a4, 0xe6b48a, 0xc98f62, 0x8d5a3b, 0xf7d9c0], HAIR = [0x1d1a19, 0x3a2a20, 0x5a3a22, 0x8a5a2a, 0xb9b2aa, 0x5b3fa0, 0xd94a6a],
    TOPS = [0x5b2d90, 0xe5b53b, 0x19b5a5, 0xff7a59, 0x3b78c9, 0xf2f2ee, 0x2f3542, 0xd9486b, 0x58a868, 0x9aa7b8], PANTS = [0x2f3a56, 0x3c3f47, 0x7a6a55, 0x1f2430, 0x4a5a78, 0x8a8f96];
  G.PAL = { SKIN, HAIR, TOPS, PANTS };

  // ================================================================== character model
  G.makeCharacter = function (look = {}) {
    const g = new THREE.Group(), mat = c => new THREE.MeshLambertMaterial({ color: c }), M = { skin: mat(SKIN[look.skin || 0]), hair: mat(HAIR[look.hair || 0]), top: mat(TOPS[look.top || 0]), pants: mat(PANTS[look.pants || 0]), shoe: mat(0xf4f4f0), pack: mat(0x39424f), dark: mat(0x1a1a1e) };
    const box = (w, h, d, m, x, y, z, py) => { const geo = new THREE.BoxGeometry(w, h, d); if (py) geo.translate(0, py, 0); const me = new THREE.Mesh(geo, m); me.position.set(x, y, z); me.castShadow = true; return me; };
    const body = new THREE.Group(); g.add(body);
    const legL = box(0.2, 0.78, 0.22, M.pants, 0.115, 0.8, 0, -0.39), legR = box(0.2, 0.78, 0.22, M.pants, -0.115, 0.8, 0, -0.39);
    legL.add(box(0.22, 0.13, 0.3, M.shoe, 0, -0.73, 0.04)); legR.add(box(0.22, 0.13, 0.3, M.shoe, 0, -0.73, 0.04));
    const torso = box(0.48, 0.6, 0.27, M.top, 0, 1.08, 0), armL = box(0.14, 0.56, 0.16, M.top, 0.32, 1.34, 0, -0.26), armR = box(0.14, 0.56, 0.16, M.top, -0.32, 1.34, 0, -0.26);
    armL.add(box(0.13, 0.13, 0.15, M.skin, 0, -0.56, 0)); armR.add(box(0.13, 0.13, 0.15, M.skin, 0, -0.56, 0));
    const head = box(0.4, 0.4, 0.38, M.skin, 0, 1.6, 0); head.add(box(0.055, 0.075, 0.02, M.dark, 0.095, 0.02, 0.195)); head.add(box(0.055, 0.075, 0.02, M.dark, -0.095, 0.02, 0.195));
    const hair = box(0.44, 0.16, 0.42, M.hair, 0, 0.23, -0.01); head.add(hair); const hairB = box(0.44, 0.3, 0.1, M.hair, 0, 0.05, -0.2); head.add(hairB);
    const longHair = box(0.42, 0.34, 0.09, M.hair, 0, -0.22, -0.2); head.add(longHair);
    const pack = box(0.36, 0.42, 0.17, M.pack, 0, 1.1, -0.22);
    const gown = box(0.56, 1.0, 0.34, mat(0x18181c), 0, 0.92, 0); gown.visible = false;
    const coat = box(0.54, 0.86, 0.32, mat(0xf6f6f2), 0, 0.98, 0); coat.visible = false;
    body.add(legL, legR, torso, armL, armR, head, pack, gown, coat);
    const ch = { group: g, body, legL, legR, torso, armL, armR, head, pack, gown, coat, M, longHair, phase: 0, look };
    ch.setLook = l => { ch.look = l; M.skin.color.set(SKIN[l.skin % SKIN.length]); M.hair.color.set(HAIR[l.hair % HAIR.length]); M.top.color.set(TOPS[l.top % TOPS.length]); M.pants.color.set(PANTS[(l.pants || 0) % PANTS.length]); longHair.visible = (l.style || 0) % 2 === 1; };
    ch.setOutfit = o => { gown.visible = o === 'gown'; coat.visible = o === 'coat'; pack.visible = !o || o === 'run'; if (o === 'run') M.top.color.set(0xfafafa); else M.top.color.set(TOPS[(ch.look.top || 0) % TOPS.length]); ch.outfit = o; };
    ch.splat = col => { M.top.color.lerp(new THREE.Color(col), 0.35); };
    // pose: speed (m/s), mode
    ch.animate = (dt, speed, mode, extra = 0) => {
      const amp = G.clamp(speed / 5.5, 0, 1), run = G.clamp((speed - 4.5) / 3, 0, 1);
      ch.phase += dt * (mode === 'bike' ? 2 + speed * 1.2 : 4.5 + speed * 1.55);
      const s = Math.sin(ch.phase), k = 0.25;
      let ll = 0, lr = 0, al = 0, ar = 0, lean = 0, by = 0, bx = 0;
      if (mode === 'bike') { ll = -1.25 + 0.5 * Math.sin(ch.phase) * Math.min(1, speed / 2); lr = -1.25 - 0.5 * Math.sin(ch.phase) * Math.min(1, speed / 2); al = ar = -1.05; lean = 0.28; by = 0.16; }
      else if (mode === 'sit') { ll = lr = -1.5; al = ar = -0.5; by = -0.32; }
      else if (mode === 'air') { ll = -0.7; lr = 0.35; al = -2.3; ar = -2.0; }
      else if (mode === 'slide') { bx = -1.15; by = -0.55; ll = 0.5; lr = 0.2; al = -0.6; ar = -0.9; }
      else if (mode === 'cheer') { al = ar = -2.7 + 0.25 * Math.sin(G.t * 9); by = 0.06 * Math.abs(Math.sin(G.t * 9)); }
      else if (mode === 'wave') { ar = -2.6 + 0.4 * Math.sin(G.t * 8); }
      else { const a = amp * (0.75 + run * 0.35); ll = s * a; lr = -s * a; al = -s * a * 0.85; ar = s * a * 0.85; lean = amp * 0.08 + run * 0.16; by = Math.abs(s) * 0.05 * amp; if (amp < 0.02) { al = 0.04 * Math.sin(G.t * 1.6); ar = -al; by = 0.008 * Math.sin(G.t * 1.8); } }
      const q = 1 - Math.exp(-16 * dt);
      legL.rotation.x += (ll - legL.rotation.x) * q; legR.rotation.x += (lr - legR.rotation.x) * q; armL.rotation.x += (al - armL.rotation.x) * q; armR.rotation.x += (ar - armR.rotation.x) * q;
      body.rotation.x += ((bx || lean) - body.rotation.x) * q; body.position.y += (by - body.position.y) * q; body.rotation.z += (extra - body.rotation.z) * q;
    };
    ch.setLook(Object.assign({ skin: 0, hair: 0, top: 0, pants: 0, style: 0 }, look));
    return ch;
  };

  // ================================================================== particles
  const fx = G.fx = { N: 2600, n: 0, items: [] };
  fx.init = function (scene) {
    const N = this.N; this.pos = new Float32Array(N * 3); this.col = new Float32Array(N * 3); this.siz = new Float32Array(N); this.alp = new Float32Array(N);
    this.vel = new Float32Array(N * 3); this.life = new Float32Array(N); this.max = new Float32Array(N); this.grav = new Float32Array(N); this.drag = new Float32Array(N); this.cur = 0;
    const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(this.pos, 3)); g.setAttribute('color', new THREE.BufferAttribute(this.col, 3)); g.setAttribute('aSize', new THREE.BufferAttribute(this.siz, 1)); g.setAttribute('aAlpha', new THREE.BufferAttribute(this.alp, 1));
    const m = new THREE.ShaderMaterial({
      transparent: true, depthWrite: false, vertexColors: true, uniforms: { uScale: { value: 600 } },
      vertexShader: `attribute float aSize; attribute float aAlpha; varying vec3 vC; varying float vA; uniform float uScale; void main(){ vC = color; vA = aAlpha; vec4 mv = modelViewMatrix * vec4(position,1.0); gl_PointSize = aSize * uScale / max(1.0, -mv.z); gl_Position = projectionMatrix * mv; }`,
      fragmentShader: `varying vec3 vC; varying float vA; void main(){ vec2 d = gl_PointCoord - 0.5; float r = dot(d,d); if (r > 0.25 || vA <= 0.0) discard; gl_FragColor = vec4(vC, vA * smoothstep(0.25, 0.08, r));
#include <encodings_fragment>
}`
    });
    this.points = new THREE.Points(g, m); this.points.frustumCulled = false; this.points.renderOrder = 20; scene.add(this.points); this.scene = scene;
    this.beaconGeo = new THREE.CylinderGeometry(1, 1, 1, 20, 1, true); this.beaconGeo.translate(0, 0.5, 0);
    const bc = G.canvas(8, 128), bx = bc.getContext('2d'), gr = bx.createLinearGradient(0, 0, 0, 128); gr.addColorStop(0, 'rgba(255,255,255,0)'); gr.addColorStop(1, 'rgba(255,255,255,.85)'); bx.fillStyle = gr; bx.fillRect(0, 0, 8, 128); this.beaconTex = G.canvasTex(bc);
    this.ringGeo = new THREE.RingGeometry(0.82, 1, 40); this.ringGeo.rotateX(-Math.PI / 2);
  };
  fx.emit = function (x, y, z, vx, vy, vz, color, size, life, grav = 9, drag = 0.6) {
    const i = this.cur; this.cur = (this.cur + 1) % this.N;
    this.pos[i * 3] = x; this.pos[i * 3 + 1] = y; this.pos[i * 3 + 2] = z; this.vel[i * 3] = vx; this.vel[i * 3 + 1] = vy; this.vel[i * 3 + 2] = vz;
    this.col[i * 3] = color.r; this.col[i * 3 + 1] = color.g; this.col[i * 3 + 2] = color.b; this.siz[i] = size; this.life[i] = this.max[i] = life; this.grav[i] = grav; this.drag[i] = drag; this.alp[i] = 1;
  };
  const tc = new THREE.Color();
  fx.burst = function (o) {
    const n = o.n || 30, cols = o.colors || [o.color || 0xffffff];
    for (let k = 0; k < n; k++) {
      const a = Math.random() * G.TAU, el = (o.up == null ? 0.6 : o.up) + (Math.random() - 0.5) * (o.spread == null ? 1.2 : o.spread), sp = (o.speed || 4) * (0.35 + Math.random() * 0.75);
      tc.set(cols[Math.floor(Math.random() * cols.length)]);
      this.emit(o.x + (Math.random() - 0.5) * (o.r || 0.4), o.y + Math.random() * (o.h || 0.3), o.z + (Math.random() - 0.5) * (o.r || 0.4), Math.cos(a) * Math.cos(el) * sp, Math.sin(el) * sp, Math.sin(a) * Math.cos(el) * sp, tc, (o.size || 0.25) * (0.6 + Math.random() * 0.8), (o.life || 1.2) * (0.6 + Math.random() * 0.7), o.gravity == null ? 9 : o.gravity, o.drag == null ? 0.8 : o.drag);
    }
  };
  fx.confetti = (x, y, z, n = 120) => fx.burst({ x, y, z, n, colors: [0x5b2d90, 0xe5b53b, 0x19b5a5, 0xff7a59, 0xffffff, 0xd9486b], speed: 8, up: 1.1, spread: 0.9, size: 0.2, life: 2.4, gravity: 5, drag: 1.2 });
  fx.update = function (dt) {
    const N = this.N; let any = false;
    for (let i = 0; i < N; i++) {
      if (this.life[i] <= 0) continue; any = true; this.life[i] -= dt;
      if (this.life[i] <= 0) { this.alp[i] = 0; continue; }
      const d = Math.exp(-this.drag[i] * dt), o = i * 3; this.vel[o] *= d; this.vel[o + 2] *= d; this.vel[o + 1] = this.vel[o + 1] * d - this.grav[i] * dt;
      this.pos[o] += this.vel[o] * dt; this.pos[o + 1] += this.vel[o + 1] * dt; this.pos[o + 2] += this.vel[o + 2] * dt;
      this.alp[i] = Math.min(1, this.life[i] / this.max[i] * 2.2);
    }
    if (any || this._dirty) { const a = this.points.geometry.attributes; a.position.needsUpdate = a.color.needsUpdate = a.aSize.needsUpdate = a.aAlpha.needsUpdate = true; this._dirty = any; }
    for (const b of this.items) { b.ring.rotation.y += dt * 1.2; const s = 1 + 0.08 * Math.sin(G.t * 3 + b.seed); b.ring.scale.set(b.r * s, 1, b.r * s); if (b.icon) b.icon.position.y = b.h + 0.5 + 0.25 * Math.sin(G.t * 2 + b.seed); }
  };
  // glowing objective beacon
  fx.beacon = function (x, z, o = {}) {
    const col = new THREE.Color(o.color || 0xe5b53b), r = o.r || 1.6, h = o.h || 14, g = new THREE.Group(), y = W.ground(x, z);
    const beam = new THREE.Mesh(this.beaconGeo, new THREE.MeshBasicMaterial({ map: this.beaconTex, color: col, transparent: true, opacity: 0.55, depthWrite: false, side: THREE.DoubleSide, blending: THREE.AdditiveBlending, fog: false })); beam.scale.set(r * 0.55, h, r * 0.55);
    const ring = new THREE.Mesh(this.ringGeo, new THREE.MeshBasicMaterial({ color: col, transparent: true, opacity: 0.9, depthWrite: false, side: THREE.DoubleSide, fog: false, polygonOffset: true, polygonOffsetFactor: -8, polygonOffsetUnits: -8 })); ring.position.y = 0.16; ring.scale.set(r, 1, r);
    g.add(beam, ring); const b = { group: g, ring, r, h: o.iconY || 3.2, seed: Math.random() * 9 };
    if (o.icon) { const sp = G.textSprite(o.icon, { size: 72, scale: 1.4, depthTest: false, stroke: 'rgba(0,0,0,.25)' }); sp.position.y = b.h; sp.renderOrder = 30; g.add(sp); b.icon = sp; }
    g.position.set(x, y, z); this.scene.add(g); this.items.push(b);
    b.remove = () => { this.scene.remove(g); const i = this.items.indexOf(b); if (i >= 0) this.items.splice(i, 1); };
    b.move = (nx, nz) => g.position.set(nx, W.ground(nx, nz), nz);
    return b;
  };

  // ================================================================== interactables & trigger zones
  const inter = G.inter = { list: [], zones: [], near: null };
  inter.add = function (o) { this.list.push(o); return o; };          // {x,z,r,label,act,pred}
  inter.remove = function (o) { let i = this.list.indexOf(o); if (i >= 0) this.list.splice(i, 1); i = this.zones.indexOf(o); if (i >= 0) this.zones.splice(i, 1); if (o && o.beacon) { o.beacon.remove(); o.beacon = null; } };
  inter.zone = function (o) { this.zones.push(o); return o; };        // {x,z,r,enter}
  inter.update = function () {
    const P = G.player, px = P.pos.x, pz = P.pos.z; let best = null, bd = 1e9;
    if (!(P.locked || G.ui.busy())) {
      for (const o of this.list) { if (o.pred && !o.pred()) continue; const ox = o.obj ? o.obj.x : o.x, oz = o.obj ? o.obj.z : o.z, d = Math.hypot(ox - px, oz - pz) - (o.r || 2); if (d < 0 && d < bd) { bd = d; best = o; } }
      for (const z of this.zones.slice()) { const d = Math.hypot(z.x - px, z.z - pz); if (d < z.r) { if (!z.inside) { z.inside = true; z.enter && z.enter(z); } } else if (z.inside) { z.inside = false; z.leave && z.leave(z); } }
    }
    this.near = best;
    if (best && I.actHit(best.key || 'interact') && !G.ui.busy()) { G.audio.sfx('ui'); best.act(best); }
  };

  // ================================================================== player
  const P = G.player = { pos: new V3(0, 0, 0), vy: 0, heading: 0, speed: 0, mode: 'foot', stamina: 1, onGround: true, vehicle: null, locked: false, stepT: 0, vel: new V3(), pose: null, hidden: false, moved: 0 };
  P.init = function (scene) { this.char = G.makeCharacter(G.S().look); scene.add(this.char.group); this.scene = scene; };
  P.teleport = function (x, z, h) { if (this.vehicle) G.veh.dismount(true); this.pos.set(x, W.ground(x, z), z); if (h != null) this.heading = h; this.speed = 0; this.vy = 0; const c = G.cam; if (h != null) c.yaw = h + Math.PI; c.snap = true; };
  P.face = function (x, z) { this.heading = Math.atan2(x - this.pos.x, z - this.pos.z); };
  const tmp = { x: 0, z: 0 };
  P.update = function (dt) {
    const ch = this.char; ch.group.visible = !this.hidden;
    if (this.mode === 'foot') {
      let mx = 0, my = 0; if (!(this.locked || G.ui.busy())) [mx, my] = I.move();
      const yaw = G.cam.yaw, fx_ = -Math.sin(yaw), fz = -Math.cos(yaw), rx = Math.cos(yaw), rz = -Math.sin(yaw);
      let dx = fx_ * my + rx * mx, dz = fz * my + rz * mx; const m = Math.hypot(dx, dz);
      const sprint = !(this.locked || G.ui.busy()) && I.act('sprint') && this.stamina > 0.03 && m > 0.2;
      const target = m > 0.08 ? (sprint ? 7.4 : 4.4) * Math.min(1, m) * (this.speedMul || 1) : 0;
      this.speed = G.damp(this.speed, target, target > this.speed ? 9 : 13, dt);
      if (m > 0.08) { dx /= m; dz /= m; this.heading = G.dampAng(this.heading, Math.atan2(dx, dz), 13, dt); this.dirx = dx; this.dirz = dz; }
      this.stamina = G.clamp(this.stamina + (sprint ? -0.085 : 0.11) * dt, 0, 1);
      const sp = this.speed * dt;
      if (sp > 1e-4) {
        const hx = this.dirx || Math.sin(this.heading), hz = this.dirz || Math.cos(this.heading), n = Math.max(1, Math.ceil(sp / 0.22));
        tmp.x = this.pos.x; tmp.z = this.pos.z;
        for (let i = 0; i < n; i++) { tmp.x += hx * sp / n; tmp.z += hz * sp / n; G.col.resolve(tmp, 0.36); }
        tmp.x = G.clamp(tmp.x, W.X0 + 12, W.X1 - 12); tmp.z = G.clamp(tmp.z, W.Z0 + 12, W.Z1 - 12);
        this.moved += Math.hypot(tmp.x - this.pos.x, tmp.z - this.pos.z); this.pos.x = tmp.x; this.pos.z = tmp.z;
      }
      const gy = W.ground(this.pos.x, this.pos.z);
      if (this.onGround) { if (!(this.locked || G.ui.busy()) && I.actHit('jump')) { this.vy = 6.4; this.onGround = false; G.audio.sfx('jump'); } else this.pos.y = gy; }
      if (!this.onGround) { this.vy -= 19 * dt; this.pos.y += this.vy * dt; if (this.pos.y <= gy) { this.pos.y = gy; this.onGround = true; this.vy = 0; G.audio.sfx('land'); } }
      if (this.onGround && this.speed > 1) { this.stepT -= dt * this.speed; if (this.stepT <= 0) { this.stepT = 2.3; G.audio.sfx('step', 0.6 + this.speed / 9); } }
      ch.group.position.copy(this.pos); ch.group.rotation.y = this.heading;
      ch.animate(dt, this.speed, this.pose || (this.onGround ? 'walk' : 'air'));
    } else if (this.mode === 'vehicle' && this.vehicle) {
      const v = this.vehicle; this.pos.set(v.x, v.y, v.z); this.heading = v.h; this.speed = Math.abs(v.sp);
      if (v.type === 'drone') { ch.group.position.set(v.homeX, W.ground(v.homeX, v.homeZ), v.homeZ); ch.group.rotation.y = Math.atan2(v.x - v.homeX, v.z - v.homeZ); ch.animate(dt, 0, 'walk'); this.pos.set(v.x, v.y, v.z); }
      else { ch.group.position.set(v.x, v.y + (v.type === 'bike' ? 0.34 : 0.42), v.z); ch.group.rotation.y = v.h; ch.group.rotation.z = 0; ch.animate(dt, Math.abs(v.sp), v.type === 'bike' ? 'bike' : 'sit', v.roll || 0); }
    } else if (this.mode === 'script') { ch.group.position.copy(this.pos); ch.group.rotation.y = this.heading; ch.animate(dt, this.speed, this.pose || 'walk'); }
  };

  // ================================================================== camera
  const cam = G.cam = { yaw: 0, pitch: 0.3, dist: 7.5, tdist: 7.5, target: new V3(), pos: new V3(), mode: 'follow', snap: true, shake: 0, cine: null, fov: 55 };
  const desired = new V3(), tgt = new V3();
  cam.init = function (camera, dom) {
    this.camera = camera; this.dom = dom;
    dom.addEventListener('mousedown', e => { if (G.mode !== 'play' || G.ui.busy()) return; I.dragLook = true; if (!G.isTouch && dom.requestPointerLock && !I.pointerLocked) { try { const p = dom.requestPointerLock(); if (p && p.catch) p.catch(() => { }); } catch (err) { } } });
    window.addEventListener('mouseup', () => { I.dragLook = false; });
  };
  cam.orbit = function (o) { this.cine = Object.assign({ t: 0 }, o); this.mode = 'cine'; };       // {x,y,z,r,h,speed,ang}
  cam.release = function () { this.mode = 'follow'; this.cine = null; this.snap = true; };
  cam.update = function (dt) {
    const c = this.camera;
    if (this.mode === 'cine' && this.cine) {
      const o = this.cine; o.t += dt; const a = (o.ang || 0) + o.t * (o.speed || 0.05);
      if (o.path) { const pth = o.path, u = (o.t * (o.pathSpeed || 0.02)) % 1, n = pth.length, f = u * n, i0 = Math.floor(f) % n, i1 = (i0 + 1) % n, k = f - Math.floor(f), s = k * k * (3 - 2 * k); desired.set(G.lerp(pth[i0][0], pth[i1][0], s), G.lerp(pth[i0][1], pth[i1][1], s), G.lerp(pth[i0][2], pth[i1][2], s)); tgt.set(G.lerp(pth[i0][3], pth[i1][3], s), G.lerp(pth[i0][4], pth[i1][4], s), G.lerp(pth[i0][5], pth[i1][5], s)); }
      else { desired.set(o.x + Math.sin(a) * o.r, o.y + o.h, o.z + Math.cos(a) * o.r); tgt.set(o.x, o.y + (o.ty || 0), o.z); }
      const gy = W.ground(desired.x, desired.z) + 1.5; if (desired.y < gy) desired.y = gy;
      if (this.snap || o.t < dt * 1.5) { this.pos.copy(desired); this.target.copy(tgt); this.snap = false; } else { this.pos.lerp(desired, 1 - Math.exp(-3 * dt)); this.target.lerp(tgt, 1 - Math.exp(-3 * dt)); }
      c.position.copy(this.pos); c.lookAt(this.target); return;
    }
    if (this.mode === 'manual') { c.position.copy(this.pos); c.lookAt(this.target); return; }
    const P = G.player, v = P.vehicle, sens = (G.S().opt.sens || 1), inv = G.S().opt.invertY ? -1 : 1;
    if (!G.ui.busy()) {
      this.yaw -= I.lookX * 0.0028 * sens; this.pitch += I.lookY * 0.0024 * sens * inv;
      if (I.down('ArrowLeft') || I.down('KeyQ')) { this.yaw += 1.9 * dt; I.lastLook = G.t; }
      if (I.down('ArrowRight')) { this.yaw -= 1.9 * dt; I.lastLook = G.t; }
      this.tdist = G.clamp(this.tdist + I.wheel * 0.9, 2.6, v && v.type === 'drone' ? 30 : 20);
    }
    this.pitch = G.clamp(this.pitch, -0.2, 1.3); this.dist = G.damp(this.dist, this.tdist, 8, dt);
    // auto-follow behind the player when the camera isn't being steered
    const idle = G.t - I.lastLook > 1.3, moving = P.speed > 1.2;
    if (idle && moving && !this.noAuto) { const want = P.heading + Math.PI, d = G.angDiff(this.yaw, want); if (Math.abs(d) < 2.5) this.yaw += d * (1 - Math.exp(-(v ? 2.6 : 1.1) * dt)); }
    const ty = v ? (v.type === 'drone' ? 0.3 : 1.5) : 1.5;
    tgt.set(P.pos.x, P.pos.y + ty, P.pos.z);
    let d = this.dist + (v && v.type === 'cart' ? 2.5 : 0);
    const cp = Math.cos(this.pitch), ox = Math.sin(this.yaw) * cp, oy = Math.sin(this.pitch), oz = Math.cos(this.yaw) * cp;
    desired.set(tgt.x + ox * d, tgt.y + oy * d, tgt.z + oz * d);
    const t = G.col.ray(tgt.x, tgt.z, desired.x, desired.z, tgt.y, desired.y);
    if (t < 1) { d = Math.max(1.1, d * t - 0.35); desired.set(tgt.x + ox * d, tgt.y + oy * d, tgt.z + oz * d); }
    const gy = W.height(desired.x, desired.z) + 0.45; if (desired.y < gy) desired.y = gy; if (desired.y < 0.3) desired.y = 0.3;
    if (this.snap) { this.pos.copy(desired); this.target.copy(tgt); this.snap = false; }
    else { this.pos.lerp(desired, 1 - Math.exp(-16 * dt)); this.target.lerp(tgt, 1 - Math.exp(-22 * dt)); }
    c.position.copy(this.pos);
    if (this.shake > 0) { this.shake = Math.max(0, this.shake - dt * 2.5); const s = this.shake * 0.12; c.position.x += (Math.random() - 0.5) * s; c.position.y += (Math.random() - 0.5) * s; }
    c.lookAt(this.target);
    const wantFov = this.fov + (v && v.type !== 'drone' ? Math.min(8, Math.abs(v.sp) * 0.8) : P.speed > 6 ? 4 : 0); if (Math.abs(c.fov - wantFov) > 0.05) { c.fov = G.damp(c.fov, wantFov, 4, dt); c.updateProjectionMatrix(); }
  };

  // ================================================================== vehicles
  const veh = G.veh = { list: [] };
  const lm = c => new THREE.MeshLambertMaterial({ color: c });
  const vcMat = new THREE.MeshLambertMaterial({ vertexColors: true }), wheelMat = lm(0x23262b);
  let wheelG = null;
  function bikeModel(color) { // one merged body mesh + two wheels (keeps draw calls low: there are dozens of parked bikes)
    const { part, merge, m4 } = G.geo, g = new THREE.Group(), dark = 0x23262b;
    if (!wheelG) { wheelG = new THREE.TorusGeometry(0.33, 0.035, 5, 14); wheelG.rotateY(Math.PI / 2); }
    const bar = (len, y, z, rx, c, th = 0.05) => part(new THREE.BoxGeometry(th, th, len), c, m4(0, y, z, 1, 1, 1, rx, 0, 0));
    const body = new THREE.Mesh(merge([bar(0.72, 0.72, 0.04, 0.18, color, 0.06), bar(0.7, 0.55, 0.14, -0.72, color, 0.06), bar(0.6, 0.62, -0.22, 1.05, color), bar(0.56, 0.36, -0.26, 0, color, 0.04), bar(0.62, 0.66, 0.5, 1.2, dark, 0.045),
      part(new THREE.BoxGeometry(0.5, 0.04, 0.04), dark, m4(0, 0.98, 0.42)), part(new THREE.BoxGeometry(0.16, 0.06, 0.28), dark, m4(0, 0.9, -0.28)), part(new THREE.BoxGeometry(0.3, 0.2, 0.22), 0xe9a23b, m4(0, 0.86, 0.62))], false), vcMat);
    body.castShadow = true; g.add(body);
    const w1 = new THREE.Mesh(wheelG, wheelMat), w2 = new THREE.Mesh(wheelG, wheelMat); w1.position.set(0, 0.36, 0.55); w2.position.set(0, 0.36, -0.52); g.add(w1, w2);
    return { group: g, wheels: [w1, w2] };
  }
  function cartModel() {
    const { part, merge, m4 } = G.geo, g = new THREE.Group(), body = 0xf7f5ef, purple = 0x5b2d90, dark = 0x25282d, seat = 0xe5b53b, P = [];
    const add = (w, h, d, c, x, y, z) => P.push(part(new THREE.BoxGeometry(w, h, d), c, m4(x, y, z)));
    add(1.4, 0.42, 3.0, body, 0, 0.55, 0); add(1.42, 0.12, 3.02, purple, 0, 0.36, 0); add(1.46, 0.07, 3.1, body, 0, 2.05, 0); add(1.3, 0.5, 0.1, body, 0, 0.95, 1.4);
    for (const [x, z] of [[0.64, 1.35], [-0.64, 1.35], [0.64, -1.4], [-0.64, -1.4]]) add(0.06, 1.3, 0.06, dark, x, 1.4, z);
    add(1.2, 0.12, 0.5, seat, 0, 0.84, 0.35); add(1.2, 0.5, 0.1, seat, 0, 1.1, 0.1); add(1.2, 0.12, 0.5, seat, 0, 0.84, -0.75); add(1.2, 0.5, 0.1, seat, 0, 1.1, -1.0);
    for (const [x, z] of [[0.66, 1.0], [-0.66, 1.0], [0.66, -1.0], [-0.66, -1.0]]) P.push(part(new THREE.CylinderGeometry(0.27, 0.27, 0.18, 10), dark, m4(x, 0.27, z, 1, 1, 1, 0, 0, Math.PI / 2)));
    const mesh = new THREE.Mesh(merge(P, false), vcMat); mesh.castShadow = true; g.add(mesh);
    const lightMat = new THREE.MeshLambertMaterial({ color: 0xfff2c0, emissive: 0xffe9a0, emissiveIntensity: 0 }), lg = new THREE.BoxGeometry(0.2, 0.1, 0.05);
    for (const x of [0.45, -0.45]) { const l = new THREE.Mesh(lg, lightMat); l.position.set(x, 0.62, 1.52); g.add(l); }
    return { group: g, wheels: [], lightMat };
  }
  function droneModel() {
    const g = new THREE.Group(), body = lm(0xf2f2f2), dark = lm(0x2b2e33);
    const b = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.14, 0.5), body); b.castShadow = true; g.add(b);
    const cam2 = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.12, 0.14), dark); cam2.position.set(0, -0.12, 0.2); g.add(cam2); const rot = [];
    for (const [x, z] of [[0.36, 0.36], [-0.36, 0.36], [0.36, -0.36], [-0.36, -0.36]]) { const arm = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.04, 0.5), dark); arm.position.set(x / 2, 0.02, z / 2); arm.rotation.y = Math.atan2(x, z); g.add(arm); const r = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.012, 0.05), lm(0x8a9099)); r.position.set(x, 0.09, z); g.add(r); rot.push(r); }
    const led = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.04, 0.03), new THREE.MeshBasicMaterial({ color: 0x33ff88 })); led.position.set(0, 0, -0.26); g.add(led);
    return { group: g, wheels: rot };
  }
  veh.bikeModel = bikeModel; veh.cartModel = cartModel;
  veh.spawn = function (type, x, z, h = 0, o = {}) {
    const m = type === 'bike' ? bikeModel(o.color || [0x19b5a5, 0xe5b53b, 0x3b78c9][Math.floor(Math.random() * 3)]) : type === 'cart' ? cartModel() : droneModel();
    const v = Object.assign({ type, x, z, y: W.ground(x, z), h, sp: 0, roll: 0, model: m, rider: null, r: type === 'bike' ? 0.5 : type === 'cart' ? 1.15 : 0.4 }, o);
    m.group.position.set(x, v.y, z); m.group.rotation.y = h; G.scene.add(m.group); this.list.push(v);
    if (type !== 'drone') v.inter = G.inter.add({ obj: v, r: type === 'bike' ? 2.0 : 3.0, key: 'vehicle', keyLabel: 'F', label: () => type === 'bike' ? G.L('骑上共享单车', 'Ride shared bike') : G.L('驾驶校园观光车', 'Drive campus cart'), pred: () => G.player.mode === 'foot' && !G.player.noVehicle && (!v.pred || v.pred()), act: () => veh.mount(v) });
    return v;
  };
  veh.remove = function (v) { const i = this.list.indexOf(v); if (i >= 0) this.list.splice(i, 1); G.scene.remove(v.model.group); if (v.inter) G.inter.remove(v.inter); if (G.player.vehicle === v) this.dismount(true); };
  veh.mount = function (v) { const P = G.player; if (P.vehicle) return; I.hits.KeyF = false; I.btnHit.vehicle = false; P.vehicle = v; P.mode = 'vehicle'; v.rider = P; v.sp = 0; G.audio.sfx(v.type === 'bike' ? 'bikebell' : 'ok'); G.emit('mount', v); if (v.type === 'drone') { v.homeX = P.pos.x; v.homeZ = P.pos.z; G.cam.tdist = 9; G.cam.pitch = 0.45; } else G.cam.tdist = Math.max(G.cam.tdist, v.type === 'cart' ? 9 : 7.5); };
  veh.dismount = function (silent) {
    const P = G.player, v = P.vehicle; if (!v) return; P.vehicle = null; P.mode = 'foot'; v.rider = null; v.sp = 0; P.char.group.rotation.z = 0; P.char.body.rotation.z = 0;
    if (v.type === 'drone') { P.pos.set(v.homeX, W.ground(v.homeX, v.homeZ), v.homeZ); G.cam.snap = true; G.cam.tdist = 7.5; this.remove(v); }
    else { const sx = v.x + Math.cos(v.h) * 1.1, sz = v.z - Math.sin(v.h) * 1.1; tmp.x = sx; tmp.z = sz; G.col.resolve(tmp, 0.36); P.pos.set(tmp.x, W.ground(tmp.x, tmp.z), tmp.z); v.roll = 0; }
    if (!silent) G.audio.sfx('back'); G.emit('dismount', v);
  };
  veh.update = function (dt) {
    const P = G.player;
    if (P.vehicle && !(P.locked || G.ui.busy()) && I.actHit('vehicle') && !G.ui.busy() && !P.vehicle.noExit) { this.dismount(); }
    for (const v of this.list) {
      const m = v.model;
      if (v.type === 'drone') { if (v.rider) this.updDrone(v, dt); for (const r of m.wheels) r.rotation.y += dt * 40; m.group.position.set(v.x, v.y, v.z); m.group.rotation.set(v.pitch || 0, v.h, v.roll || 0, 'YXZ'); continue; }
      if (v.rider) {
        let mx = 0, my = 0; if (!(P.locked || G.ui.busy())) [mx, my] = I.move();
        const bike = v.type === 'bike', boost = bike && I.act('sprint') && P.stamina > 0.03 && my > 0, vmax = (bike ? (boost ? 9.6 : 7.4) : 10.5) * (v.speedMul || 1), acc = bike ? 5.2 : 4.6;
        if (bike) P.stamina = G.clamp(P.stamina + (boost ? -0.07 : 0.09) * dt, 0, 1);
        if (my > 0.05) v.sp = Math.min(vmax, v.sp + acc * my * dt * (v.sp < 0 ? 2.5 : 1));
        else if (my < -0.05) v.sp = v.sp > 0.2 ? Math.max(0, v.sp - 11 * dt) : Math.max(-2.6, v.sp - 3 * dt);
        else v.sp = G.damp(v.sp, 0, 0.9, dt);
        if (I.act('brake') && !(P.locked || G.ui.busy())) v.sp = G.damp(v.sp, 0, 5, dt);
        if (v.sp > vmax) v.sp = G.damp(v.sp, vmax, 3, dt);
        const sf = Math.min(1, Math.abs(v.sp) / 2.2) * (v.sp < 0 ? -1 : 1), rate = (bike ? 2.3 : 1.55) / (1 + Math.abs(v.sp) * 0.06);
        v.h -= mx * rate * sf * dt; v.roll = G.damp(v.roll, bike ? -mx * Math.min(0.42, Math.abs(v.sp) * 0.06) : 0, 8, dt);
        if (I.actHit('horn') && !(P.locked || G.ui.busy())) G.audio.sfx(bike ? 'bikebell' : 'horn');
        const d = v.sp * dt, n = Math.max(1, Math.ceil(Math.abs(d) / 0.3)); tmp.x = v.x; tmp.z = v.z; let hit = 0;
        for (let i = 0; i < n; i++) { tmp.x += Math.sin(v.h) * d / n; tmp.z += Math.cos(v.h) * d / n; hit += G.col.resolve(tmp, v.r); }
        if (hit) { const dot = Math.sin(v.h) * G.col.nx + Math.cos(v.h) * G.col.nz; if (dot < -0.45 && Math.abs(v.sp) > 2.5) { G.audio.sfx('hit'); G.cam.shake = Math.min(1, Math.abs(v.sp) / 8); v.sp *= -0.25; } else v.sp *= (1 - Math.min(0.9, 3.5 * dt)); }
        v.x = G.clamp(tmp.x, W.X0 + 12, W.X1 - 12); v.z = G.clamp(tmp.z, W.Z0 + 12, W.Z1 - 12); v.y = W.ground(v.x, v.z);
        if (Math.abs(v.sp) > 3 && Math.random() < dt * 6) G.fx.burst({ x: v.x - Math.sin(v.h) * 0.6, y: v.y + 0.1, z: v.z - Math.cos(v.h) * 0.6, n: 1, color: 0xcfc8b8, speed: 0.6, size: 0.18, life: 0.6, gravity: -0.5 });
      }
      for (const w of m.wheels) w.rotation.x += v.sp * dt / 0.33;
      m.group.position.set(v.x, v.y, v.z); m.group.rotation.set(0, v.h, v.type === 'bike' ? (v.rider ? v.roll : 0.16) : 0, 'YXZ');
      if (m.lightMat) m.lightMat.emissiveIntensity = G.sky.night > 0.3 ? 1.5 : 0;
    }
  };
  veh.updDrone = function (v, dt) {
    const P = G.player; let mx = 0, my = 0; if (!(P.locked || G.ui.busy())) [mx, my] = I.move();
    const yaw = G.cam.yaw, fx_ = -Math.sin(yaw), fz = -Math.cos(yaw), rx = Math.cos(yaw), rz = -Math.sin(yaw), fast = I.act('sprint') ? 1.7 : 1;
    v.vx = G.damp(v.vx || 0, (fx_ * my + rx * mx) * 15 * fast, 2.6, dt); v.vz = G.damp(v.vz || 0, (fz * my + rz * mx) * 15 * fast, 2.6, dt);
    const up = (!(P.locked || G.ui.busy()) && (I.down('Space') || I.btn.jump) ? 1 : 0) - (!(P.locked || G.ui.busy()) && (I.down('ControlLeft') || I.down('KeyC') || I.btn.down) ? 1 : 0); v.vy = G.damp(v.vy || 0, up * 9, 3, dt);
    v.x += v.vx * dt; v.z += v.vz * dt; v.y += v.vy * dt;
    const far = Math.hypot(v.x - v.homeX, v.z - v.homeZ), lim = v.range || 900; if (far > lim) { v.x = v.homeX + (v.x - v.homeX) * lim / far; v.z = v.homeZ + (v.z - v.homeZ) * lim / far; }
    v.x = G.clamp(v.x, W.X0 + 20, W.X1 - 20); v.z = G.clamp(v.z, W.Z0 + 20, W.Z1 - 20);
    const b = W.buildingAt(v.x, v.z), floor = Math.max(W.ground(v.x, v.z), b ? b.h : 0) + 1.2; if (v.y < floor) { v.y = G.damp(v.y, floor + 0.3, 12, dt); if (v.vy < 0) v.vy = 0; } if (v.y > 190) v.y = 190;
    v.sp = Math.hypot(v.vx, v.vz); v.h = G.dampAng(v.h, yaw + Math.PI, 6, dt); v.pitch = G.damp(v.pitch || 0, G.clamp((v.vx * Math.sin(v.h) + v.vz * Math.cos(v.h)) * 0.03, -0.4, 0.4), 6, dt); v.roll = G.damp(v.roll || 0, G.clamp(-(v.vx * Math.cos(v.h) - v.vz * Math.sin(v.h)) * 0.03, -0.4, 0.4), 6, dt);
    if (Math.random() < dt * 5) G.audio.sfx('rotor');
  };
  veh.launchDrone = function (o = {}) { const P = G.player; if (P.vehicle) return null; const v = this.spawn('drone', P.pos.x + Math.sin(P.heading) * 1.2, P.pos.z + Math.cos(P.heading) * 1.2, P.heading, o); v.y = P.pos.y + 2.2; this.mount(v); G.audio.sfx('whoosh'); return v; };

  // ================================================================== ambient city traffic (cars follow the one-way carriageways)
  const traffic = G.traffic = { cars: [], roads: [], N: 26 };
  traffic.init = function (scene) {
    const byStart = new Map();
    for (const r of W.roads) {
      if (r.tunnel || !r.oneway || !/trunk|primary|secondary|tertiary/.test(r.kind)) continue;
      const pts = r.seq.map(i => [W.nodes[i * 2], W.nodes[i * 2 + 1]]), cum = [0]; for (let i = 1; i < pts.length; i++) cum.push(cum[i - 1] + Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]));
      const o = { r, pts, cum, len: cum[cum.length - 1], lanes: Math.max(1, Math.round(r.w / 3.7)), vmax: r.kind === 'trunk' ? 15 : r.kind === 'primary' ? 12 : 9, end: r.seq[r.seq.length - 1] };
      const k = r.seq[0]; if (!byStart.has(k)) byStart.set(k, []); byStart.get(k).push(this.roads.length); this.roads.push(o);
    }
    for (const o of this.roads) o.next = byStart.get(o.end) || [];
    this.long = this.roads.map((o, i) => i).filter(i => this.roads[i].len > 140);
    if (!this.long.length) return;
    const { part, merge, m4 } = G.geo;
    const geo = merge([part(new THREE.BoxGeometry(1.85, 0.62, 4.3), 0xffffff, m4(0, 0.62, 0)), part(new THREE.BoxGeometry(1.66, 0.56, 2.3), 0xb8c4cf, m4(0, 1.2, -0.25)), part(new THREE.BoxGeometry(1.9, 0.3, 0.5), 0x22252a, m4(0, 0.3, 1.4)), part(new THREE.BoxGeometry(1.9, 0.3, 0.5), 0x22252a, m4(0, 0.3, -1.4))], false);
    this.mesh = new THREE.InstancedMesh(geo, new THREE.MeshLambertMaterial({ vertexColors: true }), this.N); this.mesh.frustumCulled = false; this.mesh.castShadow = true; this.mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage); scene.add(this.mesh);
    const lg = new THREE.BoxGeometry(1.7, 0.16, 0.08); lg.translate(0, 0.72, 2.16); this.lightMat = new THREE.MeshBasicMaterial({ color: 0x555555 });
    this.lights = new THREE.InstancedMesh(lg, this.lightMat, this.N); this.lights.frustumCulled = false; scene.add(this.lights);
    const cols = [0xf4f4f0, 0xc9ced4, 0x2b2e33, 0x2f7fd6, 0x2f7fd6, 0xb5332e, 0x3d7f5a, 0xe5b53b, 0x8a8f96], c = new THREE.Color();
    for (let i = 0; i < this.N; i++) { const ri = this.long[Math.floor(Math.random() * this.long.length)], o = this.roads[ri]; this.cars.push({ ri, s: Math.random() * o.len, v: o.vmax, lane: Math.floor(Math.random() * o.lanes), wait: 0 }); this.mesh.setColorAt(i, c.set(cols[i % cols.length])); }
  };
  const tq = new THREE.Quaternion(), tv = new V3(), ts = new V3(1, 1, 1), tm = new THREE.Matrix4();
  traffic.update = function (dt) {
    if (!this.mesh) return; const P = G.player, px = P.pos.x, pz = P.pos.z;
    for (let i = 0; i < this.cars.length; i++) {
      const c = this.cars[i]; let o = this.roads[c.ri];
      if (c.s >= o.len) { if (o.next.length) { c.ri = o.next[Math.floor(Math.random() * o.next.length)]; c.s -= o.len; } else { c.ri = this.long[Math.floor(Math.random() * this.long.length)]; c.s = 0; } o = this.roads[c.ri]; c.lane = Math.min(c.lane, o.lanes - 1); }
      let k = 1; while (k < o.cum.length - 1 && o.cum[k] < c.s) k++;
      const a = o.pts[k - 1], b = o.pts[k], f = (c.s - o.cum[k - 1]) / (o.cum[k] - o.cum[k - 1] || 1), dx = b[0] - a[0], dz = b[1] - a[1], L = Math.hypot(dx, dz) || 1, ux = dx / L, uz = dz / L, lat = (c.lane - (o.lanes - 1) / 2) * 3.5;
      const x = a[0] + dx * f - uz * lat, z = a[1] + dz * f + ux * lat;
      // give way to the player
      const rx = px - x, rz = pz - z, ahead = rx * ux + rz * uz, side = Math.abs(-rx * uz + rz * ux); let want = o.vmax;
      if (ahead > -1 && ahead < 14 && side < 2.6) { want = 0; c.wait += dt; if (c.wait > 2.5) { c.wait = -4; if (G.mode === 'play') G.audio.sfx('horn'); } } else c.wait = Math.min(0, c.wait + dt);
      c.v = G.damp(c.v, want, want < c.v ? 5 : 1.2, dt); c.s += c.v * dt;
      if (P.mode === 'foot' && Math.abs(ahead) < 2.6 && side < 1.5) { const sg = (-rx * uz + rz * ux) < 0 ? -1 : 1; P.pos.x += -uz * sg * dt * 6; P.pos.z += ux * sg * dt * 6; }
      tv.set(x, W.ground(x, z) + 0.06, z); tq.setFromAxisAngle(AY, Math.atan2(ux, uz)); tm.compose(tv, tq, ts); this.mesh.setMatrixAt(i, tm); this.lights.setMatrixAt(i, tm);
    }
    this.mesh.instanceMatrix.needsUpdate = true; this.lights.instanceMatrix.needsUpdate = true;
    const n = G.sky.night; this.lightMat.color.setRGB(0.4 + 2.6 * n, 0.4 + 2.3 * n, 0.4 + 1.6 * n);
  };

  // ================================================================== crowd (instanced low-poly students)
  const crowd = G.crowd = { MAX: 150, list: [], target: 70, lines: null, tSpawn: 0 };
  const PARTS = [['torso', 0.48, 0.6, 0.27], ['head', 0.4, 0.4, 0.38], ['hair', 0.44, 0.2, 0.42], ['armL', 0.14, 0.56, 0.16], ['armR', 0.14, 0.56, 0.16], ['legL', 0.2, 0.78, 0.22], ['legR', 0.2, 0.78, 0.22], ['pack', 0.36, 0.42, 0.17]];
  const qY = new THREE.Quaternion(), qX = new THREE.Quaternion(), qq = new THREE.Quaternion(), vv = new V3(), ss = new V3(1, 1, 1), mm = new THREE.Matrix4(), AX = new V3(1, 0, 0), AY = new V3(0, 1, 0), cc = new THREE.Color();
  crowd.init = function (scene) {
    this.mesh = {}; const mat = new THREE.MeshLambertMaterial();
    for (const [n, w, h, d] of PARTS) { const m = new THREE.InstancedMesh(new THREE.BoxGeometry(w, h, d), mat, this.MAX); m.count = 0; m.frustumCulled = false; m.castShadow = true; m.instanceMatrix.setUsage(THREE.DynamicDrawUsage); for (let i = 0; i < this.MAX; i++) m.setColorAt(i, cc.set(0xffffff)); scene.add(m); this.mesh[n] = m; }
    // campus walking edges
    this.edges = []; G.nav.edges.forEach((e, i) => { if (e.road.campus && /foot|ped|steps|cycle|service|minor/.test(e.road.kind) && e.len > 3) this.edges.push(i); });
    this.byCell = new Map(); for (const ei of this.edges) { const e = G.nav.edges[ei], k = Math.floor(W.nodes[e.a * 2] / 80) + ':' + Math.floor(W.nodes[e.a * 2 + 1] / 80); let a = this.byCell.get(k); if (!a) this.byCell.set(k, a = []); a.push(ei); }
  };
  crowd.make = function (o = {}) {
    const r = Math.random;
    const n = Object.assign({ x: 0, z: 0, y: 0, h: 0, sp: 1.2 + r() * 0.6, phase: r() * 6, state: 'walk', ei: -1, t: 0, dir: 1, lat: (r() - 0.3) * 1.6, pose: null, skin: SKIN[Math.floor(r() * SKIN.length)], hair: HAIR[Math.floor(r() * r() * HAIR.length)], top: TOPS[Math.floor(r() * TOPS.length)], pants: PANTS[Math.floor(r() * PANTS.length)], pack: r() < 0.6 ? [0x39424f, 0x5b2d90, 0x8a4b3a, 0x2f6f6a][Math.floor(r() * 4)] : 0, scale: 0.94 + r() * 0.1, wait: 0, bob: 0 }, o);
    this.list.push(n); n.dirty = true; return n;
  };
  crowd.remove = function (n) { const i = this.list.indexOf(n); if (i >= 0) this.list.splice(i, 1); if (n.inter) G.inter.remove(n.inter); if (n.tag) { n.tag.remove(); n.tag = null; } };
  // named, stationary character with a dialogue callback
  crowd.addNamed = function (o) {
    const n = this.make(Object.assign({ state: 'fixed', named: true, sp: 0, lat: 0 }, o)); n.y = W.ground(n.x, n.z);
    if (o.talk) n.inter = G.inter.add({ obj: n, r: o.r || 2.6, label: () => (o.verb ? G.tx(o.verb) : G.L('交谈', 'Talk')) + ' · ' + G.tx(o.name), act: () => { n.h = Math.atan2(G.player.pos.x - n.x, G.player.pos.z - n.z); G.player.face(n.x, n.z); o.talk(n); }, pred: o.pred });
    if (o.name && G.ui && G.ui.tag) n.tag = G.ui.tag(n, o.name, o.tagColor);
    return n;
  };
  crowd.place = function (n) { // put an ambient NPC on a random campus edge at a comfortable distance from the player
    const P = G.player, cx = Math.floor(P.pos.x / 80), cz = Math.floor(P.pos.z / 80), cand = [];
    for (let i = -2; i <= 2; i++) for (let j = -2; j <= 2; j++) { const a = this.byCell.get((cx + i) + ':' + (cz + j)); if (a) cand.push(a); }
    if (!cand.length) { n.state = 'off'; return false; }
    for (let k = 0; k < 6; k++) {
      const arr = cand[Math.floor(Math.random() * cand.length)], ei = arr[Math.floor(Math.random() * arr.length)], e = G.nav.edges[ei], t = Math.random();
      const x = G.lerp(W.nodes[e.a * 2], W.nodes[e.b * 2], t), z = G.lerp(W.nodes[e.a * 2 + 1], W.nodes[e.b * 2 + 1], t), d = Math.hypot(x - P.pos.x, z - P.pos.z);
      if (d < (this.first ? 14 : 55) || d > 210) continue;
      n.ei = ei; n.t = t; n.dir = Math.random() < 0.5 ? 1 : -1; n.x = x; n.z = z; n.state = Math.random() < 0.12 ? 'idle' : 'walk'; n.wait = n.state === 'idle' ? 6 + Math.random() * 20 : 0; return true;
    }
    n.state = 'off'; return false;
  };
  crowd.setTarget = function (n) { this.target = Math.min(n, this.MAX - 30); };
  crowd.update = function (dt) {
    const P = G.player, px = P.pos.x, pz = P.pos.z, hour = G.sky.hour;
    const dens = hour < 6.5 ? 0.12 : hour < 8 ? 0.6 : hour < 22 ? 1 : hour < 23.5 ? 0.45 : 0.15, want = Math.round(this.target * dens);
    let amb = 0; for (const n of this.list) if (!n.named && !n.scripted) amb++;
    if (amb < want && (this.tSpawn -= dt) <= 0) { this.tSpawn = 0.05; const n = this.make(); this.first = this.booting; this.place(n); }
    const vehR = P.vehicle && P.vehicle.type !== 'drone' ? P.vehicle : null;
    for (let i = this.list.length - 1; i >= 0; i--) {
      const n = this.list[i];
      if (n.update) n.update(n, dt);
      if (!n.named && !n.scripted) {
        const d = Math.hypot(n.x - px, n.z - pz);
        if (n.state === 'off' || d > 250) { if (amb > want) { this.list.splice(i, 1); amb--; continue; } if (!this.place(n)) continue; }
        if (n.state === 'walk') {
          const e = G.nav.edges[n.ei], ax = W.nodes[e.a * 2], az = W.nodes[e.a * 2 + 1], bx = W.nodes[e.b * 2], bz = W.nodes[e.b * 2 + 1];
          let block = false;
          if (d < 1.2 && !vehR) { const ex = n.x - px, ez = n.z - pz, k = (1.2 - d) / (d || 1) * 0.5; n.ox = (n.ox || 0) + ex * k; n.oz = (n.oz || 0) + ez * k; }
          if (vehR && d < 4.5 && Math.abs(vehR.sp) > 1.5) { const ex = n.x - vehR.x, ez = n.z - vehR.z, side = Math.sign(ex * Math.cos(vehR.h) - ez * Math.sin(vehR.h)) || 1; n.ox = (n.ox || 0) + Math.cos(vehR.h) * side * dt * 3.5; n.oz = (n.oz || 0) - Math.sin(vehR.h) * side * dt * 3.5; if (d < 1.0 && !n.bumped) { n.bumped = 2; G.emit('bump', n); vehR.sp *= 0.35; } block = true; }
          if (n.bumped) n.bumped = Math.max(0, n.bumped - dt);
          if (!block) n.t += n.dir * n.sp * dt / e.len;
          if (n.t > 1 || n.t < 0) {
            const node = n.t > 1 ? e.b : e.a, opts = G.nav.adj[node].filter(k => k !== n.ei && G.nav.edges[k].road.campus && G.nav.edges[k].walk && !/trail|primary|secondary|tertiary/.test(G.nav.edges[k].road.kind));
            if (opts.length) { const k = opts[Math.floor(Math.random() * opts.length)], e2 = G.nav.edges[k]; n.ei = k; if (e2.a === node) { n.t = 0; n.dir = 1; } else { n.t = 1; n.dir = -1; } }
            else { n.dir = -n.dir; n.t = G.clamp(n.t, 0, 1); }
            if (Math.random() < 0.06) { n.state = 'idle'; n.wait = 4 + Math.random() * 14; }
          } else {
            const dx = bx - ax, dz = bz - az, L = Math.hypot(dx, dz) || 1, lx = -dz / L * n.lat * n.dir, lz = dx / L * n.lat * n.dir;
            n.ox = G.damp(n.ox || 0, 0, 1.5, dt); n.oz = G.damp(n.oz || 0, 0, 1.5, dt);
            const tx = ax + dx * n.t + lx + n.ox, tz = az + dz * n.t + lz + n.oz; n.h = G.dampAng(n.h, Math.atan2(dx * n.dir, dz * n.dir), 8, dt); n.x = tx; n.z = tz;
          }
          n.phase += dt * (4.5 + n.sp * 1.55); n.cur = n.sp;
        } else if (n.state === 'idle') { n.cur = 0; n.wait -= dt; if (n.wait <= 0) n.state = 'walk'; if (d < 5 && Math.random() < dt * 0.5) n.h = G.dampAng(n.h, Math.atan2(px - n.x, pz - n.z), 3, 0.3); }
        n.y = W.ground(n.x, n.z);
      } else if (n.state === 'fixed') { n.cur = 0; if (!n.keepY) n.y = W.ground(n.x, n.z); }
    }
    this.draw();
  };
  crowd.say = function (n, text, dur) { if (G.ui && G.ui.bubble) G.ui.bubble(n, text, dur || 3); };
  function setPart(mesh, i, n, bx, by, bz, rot, sy = 1) { // body-space pivot, x-rotation, heading
    qY.setFromAxisAngle(AY, n.h); if (rot) { qX.setFromAxisAngle(AX, rot); qq.copy(qY).multiply(qX); } else qq.copy(qY);
    vv.set(bx, by, bz); if (n.lean) { vv.applyAxisAngle(AX, n.lean); }
    vv.multiplyScalar(n.scale).applyQuaternion(qY); vv.x += n.x; vv.y += n.y + (n.bob || 0); vv.z += n.z; ss.set(n.scale, n.scale * sy, n.scale); mm.compose(vv, qq, ss); mesh.setMatrixAt(i, mm);
  }
  const off = new V3();
  crowd.draw = function () {
    const M = this.mesh, cam = G.cam.camera, cx = cam.position.x, cz = cam.position.z; let k = 0;
    for (const n of this.list) {
      if (n.state === 'off' || n.hidden) continue; const d2 = (n.x - cx) * (n.x - cx) + (n.z - cz) * (n.z - cz); if (d2 > 240 * 240 || k >= this.MAX) continue;
      const sp = n.cur || 0, amp = G.clamp(sp / 5.5, 0, 1) * (0.75 + G.clamp((sp - 4.5) / 3, 0, 1) * 0.35), s = Math.sin(n.phase);
      let ll = s * amp, lr = -s * amp, al = -s * amp * 0.85, ar = s * amp * 0.85, hy = 0; n.lean = 0; n.bob = Math.abs(s) * 0.05 * amp;
      const pose = n.pose;
      if (pose === 'sit') { ll = lr = -1.5; al = ar = -0.5; n.bob = -0.34; }
      else if (pose === 'cheer') { al = ar = -2.7 + 0.25 * Math.sin(G.t * 9 + n.phase); n.bob = 0.06 * Math.abs(Math.sin(G.t * 9 + n.phase)); }
      else if (pose === 'wave') { ar = -2.6 + 0.4 * Math.sin(G.t * 8 + n.phase); }
      else if (pose === 'talk') { ar = -0.5 + 0.3 * Math.sin(G.t * 3 + n.phase); }
      else if (pose === 'throw') { ar = -2.2 + 1.2 * Math.sin(G.t * 6 + n.phase); al = -0.4; }
      else if (pose === 'dance') { al = -1.6 + 1.1 * Math.sin(G.t * 7 + n.phase); ar = -1.6 - 1.1 * Math.sin(G.t * 7 + n.phase); ll = 0.35 * Math.sin(G.t * 7 + n.phase); lr = -ll; n.bob = 0.07 * Math.abs(Math.sin(G.t * 7 + n.phase)); }
      else if (pose === 'play') { al = -1.3; ar = -1.3 + 0.2 * Math.sin(G.t * 10 + n.phase); }
      else if (sp < 0.05) { al = 0.04 * Math.sin(G.t * 1.6 + n.phase); ar = -al; }
      // leg/arm boxes rotate about hip/shoulder: centre = pivot + R(rot)*(0,-len/2,0)
      const limb = (mesh, px_, py_, rot, len) => { off.set(0, -len / 2, 0).applyAxisAngle(AX, rot); setPart(mesh, k, n, px_ + off.x, py_ + off.y, off.z, rot); };
      setPart(M.torso, k, n, 0, 1.08, 0, 0); setPart(M.head, k, n, 0, 1.6, 0, 0); setPart(M.hair, k, n, 0, 1.85, -0.02, 0);
      limb(M.armL, 0.32, 1.34, al, 0.56); limb(M.armR, -0.32, 1.34, ar, 0.56); limb(M.legL, 0.115, 0.8, ll, 0.78); limb(M.legR, -0.115, 0.8, lr, 0.78);
      if (n.pack) setPart(M.pack, k, n, 0, 1.1, -0.22, 0); else { mm.makeScale(0, 0, 0); M.pack.setMatrixAt(k, mm); }
      if (n.dirty || n._slot !== k) { n._slot = k; n.dirty = false; M.torso.setColorAt(k, cc.set(n.top)); M.armL.setColorAt(k, cc); M.armR.setColorAt(k, cc); M.head.setColorAt(k, cc.set(n.skin)); M.hair.setColorAt(k, cc.set(n.hair)); M.legL.setColorAt(k, cc.set(n.pants)); M.legR.setColorAt(k, cc); M.pack.setColorAt(k, cc.set(n.pack || 0)); this.colDirty = true; }
      k++;
    }
    for (const key in M) { const m = M[key]; m.count = k; m.instanceMatrix.needsUpdate = true; if (this.colDirty && m.instanceColor) m.instanceColor.needsUpdate = true; }
    this.colDirty = false;
  };
})();
