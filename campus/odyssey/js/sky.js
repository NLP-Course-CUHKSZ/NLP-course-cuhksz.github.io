/* sky dome, sun/moon, day-night cycle, clouds, stars, rain, lighting */
(function () {
  'use strict';
  const G = window.G, W = G.world;
  const sky = G.sky = { hour: 9, night: 0, weather: 'clear', rain: 0, rainT: 0, speed: 1 / 150, frozen: false, sunDir: new THREE.Vector3(0.4, 0.8, 0.4) };
  // hour, top, horizon, sun colour, sun intensity, hemi sky, hemi ground, hemi intensity
  const KF = [
    [0, 0x060a1c, 0x152340, 0x8fa8e0, 0.16, 0x34456f, 0x161a22, 0.34],
    [5.0, 0x0a1230, 0x22335a, 0x8fa8e0, 0.16, 0x3a4c78, 0x181c26, 0.36],
    [6.2, 0x33558f, 0xf0a676, 0xffb070, 0.42, 0x8fa3c8, 0x4a4238, 0.42],
    [7.6, 0x3d82d4, 0xcde2f1, 0xffe6c0, 0.72, 0xcfe2f5, 0x7a745f, 0.50],
    [12, 0x2c79d0, 0xc6e1f3, 0xfffaf0, 0.82, 0xd8e8f8, 0x86806a, 0.54],
    [16.4, 0x3877c4, 0xe8dbbf, 0xffe2b0, 0.78, 0xd6dff0, 0x857a62, 0.52],
    [18.1, 0x334f96, 0xff9858, 0xff9550, 0.58, 0xb39ab8, 0x5a4a3c, 0.44],
    [19.1, 0x151c44, 0x5a416c, 0x9aa8e0, 0.2, 0x4a4f80, 0x1e1e28, 0.38],
    [20.4, 0x070b1e, 0x17233e, 0x8fa8e0, 0.16, 0x34456f, 0x161a22, 0.34],
    [24, 0x060a1c, 0x152340, 0x8fa8e0, 0.16, 0x34456f, 0x161a22, 0.34]
  ].map(k => ({ h: k[0], top: new THREE.Color(k[1]), hor: new THREE.Color(k[2]), sun: new THREE.Color(k[3]), si: k[4], hs: new THREE.Color(k[5]), hg: new THREE.Color(k[6]), hi: k[7] }));
  const cur = { top: new THREE.Color(), hor: new THREE.Color(), sun: new THREE.Color(), hs: new THREE.Color(), hg: new THREE.Color(), si: 1, hi: 1 };
  const gray = new THREE.Color(0x8d98a3), tmpC = new THREE.Color();

  sky.init = function (scene, renderer, quality) {
    this.scene = scene; this.renderer = renderer;
    const uni = this.uni = { uTop: { value: new THREE.Color() }, uHor: { value: new THREE.Color() }, uSunDir: { value: new THREE.Vector3(0, 1, 0) }, uSunCol: { value: new THREE.Color() }, uSunVis: { value: 1 }, uMoonDir: { value: new THREE.Vector3(0.3, 0.7, -0.5).normalize() }, uNight: { value: 0 } };
    const dome = this.dome = new THREE.Mesh(new THREE.SphereGeometry(6400, 28, 14), new THREE.ShaderMaterial({
      uniforms: uni, side: THREE.BackSide, depthWrite: false, fog: false,
      vertexShader: `varying vec3 vDir; void main(){ vDir = position; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }`,
      fragmentShader: `uniform vec3 uTop; uniform vec3 uHor; uniform vec3 uSunDir; uniform vec3 uSunCol; uniform float uSunVis; uniform vec3 uMoonDir; uniform float uNight; varying vec3 vDir;
        void main(){ vec3 d = normalize(vDir); float t = pow(clamp(d.y, 0.0, 1.0), 0.5); vec3 col = mix(uHor, uTop, t);
          col = mix(col, uHor * 0.92, smoothstep(0.0, -0.1, d.y));
          float sd = max(dot(d, uSunDir), 0.0); col += uSunCol * (pow(sd, 420.0) * 3.5 + pow(sd, 22.0) * 0.26 + pow(sd, 5.0) * 0.07) * uSunVis;
          float md = max(dot(d, uMoonDir), 0.0); col += vec3(0.86, 0.92, 1.0) * (smoothstep(0.99925, 0.9995, md) * 1.3 + pow(md, 80.0) * 0.10) * uNight;
          gl_FragColor = vec4(col, 1.0);
          #include <tonemapping_fragment>\n #include <encodings_fragment>\n }`
    }));
    dome.renderOrder = 100; dome.frustumCulled = false; scene.add(dome);
    // stars
    const sp = [], r = G.rng(5); for (let i = 0; i < 900; i++) { const a = r() * G.TAU, y = 0.05 + r() * 0.95, k = Math.sqrt(1 - y * y); sp.push(Math.cos(a) * k * 6000, y * 6000, Math.sin(a) * k * 6000); }
    const sg = new THREE.BufferGeometry(); sg.setAttribute('position', new THREE.Float32BufferAttribute(sp, 3));
    this.stars = new THREE.Points(sg, new THREE.PointsMaterial({ color: 0xffffff, size: 1.8, sizeAttenuation: false, transparent: true, opacity: 0, fog: false, depthWrite: false })); this.stars.frustumCulled = false; this.stars.renderOrder = -9; scene.add(this.stars);
    // clouds
    const cc = G.canvas(256, 128), cx = cc.getContext('2d');
    for (let i = 0; i < 26; i++) { const x = 40 + r() * 176, y = 50 + r() * 38, rad = 18 + r() * 34, g = cx.createRadialGradient(x, y, 0, x, y, rad); g.addColorStop(0, 'rgba(255,255,255,.55)'); g.addColorStop(1, 'rgba(255,255,255,0)'); cx.fillStyle = g; cx.fillRect(x - rad, y - rad, rad * 2, rad * 2); }
    const ct = G.canvasTex(cc); this.clouds = []; this.cloudMat = new THREE.SpriteMaterial({ map: ct, transparent: true, opacity: 0.9, fog: false, depthWrite: false });
    for (let i = 0; i < 18; i++) { const s = new THREE.Sprite(this.cloudMat); s.position.set(-4000 + r() * 8000, 620 + r() * 520, -4000 + r() * 8000); const k = 700 + r() * 900; s.scale.set(k, k * 0.42, 1); s.renderOrder = -8; scene.add(s); this.clouds.push(s); }
    // lights
    this.hemi = new THREE.HemisphereLight(0xffffff, 0x808080, 0.9); scene.add(this.hemi);
    const sun = this.sun = new THREE.DirectionalLight(0xffffff, 1); scene.add(sun); scene.add(sun.target);
    this.setShadows(quality);
    scene.fog = new THREE.Fog(0xc6e1f3, 260, 3200);
    // rain
    const N = 1100, rp = new Float32Array(N * 6); this.rainN = N; this.rainPos = rp; this.rainSeed = new Float32Array(N * 3); for (let i = 0; i < N * 3; i++) this.rainSeed[i] = Math.random();
    const rg = new THREE.BufferGeometry(); rg.setAttribute('position', new THREE.BufferAttribute(rp, 3));
    this.rainMesh = new THREE.LineSegments(rg, new THREE.LineBasicMaterial({ color: 0xcfe4f2, transparent: true, opacity: 0.45, fog: false })); this.rainMesh.frustumCulled = false; this.rainMesh.visible = false; scene.add(this.rainMesh);
    this.apply(0, new THREE.Vector3());
  };
  sky.setShadows = function (q) {
    const sun = this.sun, r = this.renderer; this.q = q;
    if (q === 'low') { r.shadowMap.enabled = false; sun.castShadow = false; return; }
    r.shadowMap.enabled = true; r.shadowMap.type = q === 'high' ? THREE.PCFSoftShadowMap : THREE.PCFShadowMap; sun.castShadow = true;
    const size = q === 'high' ? 2048 : 1024; if (sun.shadow.mapSize.x !== size) { sun.shadow.mapSize.set(size, size); if (sun.shadow.map) { sun.shadow.map.dispose(); sun.shadow.map = null; } }
    const d = q === 'high' ? 95 : 70; this.shadowD = d; Object.assign(sun.shadow.camera, { left: -d, right: d, top: d, bottom: -d, near: 20, far: 700 }); sun.shadow.camera.updateProjectionMatrix(); sun.shadow.bias = -0.0006; sun.shadow.normalBias = 0.06; sun.shadow.autoUpdate = q === 'high';
  };
  sky.setWeather = function (w) { this.weather = w; };
  sky.setHour = function (h) { this.hour = ((h % 24) + 24) % 24; this._lastH = Math.floor(this.hour); };
  sky.isNight = function () { return this.night > 0.5; };
  sky.apply = function (dt, focus, cam) {
    const h = this.hour; let i = 0; while (i < KF.length - 2 && KF[i + 1].h <= h) i++;
    const a = KF[i], b = KF[i + 1], t = G.clamp((h - a.h) / (b.h - a.h), 0, 1);
    cur.top.copy(a.top).lerp(b.top, t); cur.hor.copy(a.hor).lerp(b.hor, t); cur.sun.copy(a.sun).lerp(b.sun, t); cur.hs.copy(a.hs).lerp(b.hs, t); cur.hg.copy(a.hg).lerp(b.hg, t); cur.si = G.lerp(a.si, b.si, t); cur.hi = G.lerp(a.hi, b.hi, t);
    const night = this.night = h < 5.3 ? 1 : h < 6.5 ? 1 - (h - 5.3) / 1.2 : h < 18.3 ? 0 : h < 19.5 ? (h - 18.3) / 1.2 : 1;
    // rain blend
    const target = this.weather === 'rain' ? 1 : this.weather === 'cloudy' ? 0.45 : 0; this.rain = G.damp(this.rain, target, 0.7, dt || 1);
    const rk = this.rain; if (rk > 0.01) { tmpC.copy(gray).multiplyScalar(0.25 + 0.75 * (1 - night)); cur.top.lerp(tmpC, rk * 0.75); cur.hor.lerp(tmpC, rk * 0.6); cur.si *= 1 - rk * 0.6; cur.hi *= 1 - rk * 0.12; }
    // sun / moon direction
    const day = h > 5.6 && h < 19.0, sd = this.sunDir;
    if (day) { const th = (h - 5.8) / 13.0 * Math.PI; sd.set(Math.cos(th) * 0.9, Math.sin(th) * 0.95 + 0.06, 0.38 + 0.2 * Math.sin(th)).normalize(); }
    else sd.set(0.32, 0.72, -0.5).normalize();
    const u = this.uni; u.uTop.value.copy(cur.top); u.uHor.value.copy(cur.hor); u.uSunCol.value.copy(cur.sun); u.uSunVis.value = day ? (1 - rk * 0.9) : 0; u.uNight.value = night * (1 - rk);
    if (day) u.uSunDir.value.copy(sd);
    this.hemi.color.copy(cur.hs); this.hemi.groundColor.copy(cur.hg); this.hemi.intensity = cur.hi;
    this.sun.color.copy(cur.sun); this.sun.intensity = cur.si;
    if (this.sun.castShadow && !this.sun.shadow.autoUpdate && G.frame % 2 === 0) this.sun.shadow.needsUpdate = true;
    if (focus && (this.sun.shadow.autoUpdate || G.frame % 2 === 0 || !this.sun.castShadow)) { this.sun.target.position.copy(focus); this.sun.position.copy(focus).addScaledVector(sd, 320); this.sun.target.updateMatrixWorld(); }
    const fog = this.scene.fog; fog.color.copy(cur.hor); if (night > 0.5) fog.color.multiplyScalar(0.85);
    fog.near = G.lerp(G.lerp(300, 180, night), 40, rk); fog.far = G.lerp(G.lerp(3400, 2200, night), 620, rk);
    if (cam) { this.dome.position.copy(cam.position); this.stars.position.copy(cam.position); }
    this.stars.material.opacity = night * (1 - rk) * 0.9; this.stars.visible = night > 0.02;
    tmpC.copy(cur.hs).lerp(cur.sun, 0.35); this.cloudMat.color.copy(tmpC).multiplyScalar(night > 0.5 ? 0.5 : 1.05); this.cloudMat.opacity = 0.55 + 0.4 * rk;
    for (const c of this.clouds) { c.position.x += (dt || 0) * 9; if (c.position.x > 4200) c.position.x = -4200; }
    // night-time emissives
    const wl = G.smooth(0.35, 0.9, night);
    for (const m of W.winMats) m.emissiveIntensity = wl * 0.95;
    if (W.stadiumMat) W.stadiumMat.emissiveIntensity = wl * 0.35; if (W.skylineMat) W.skylineMat.emissiveIntensity = wl * 0.25;
    if (W.bulbMat) W.bulbMat.color.setRGB(G.lerp(0.25, 3.2, wl), G.lerp(0.25, 2.5, wl), G.lerp(0.26, 1.5, wl));
    if (W.poolMat) W.poolMat.opacity = wl * 0.5;
    if (W.waterMat) { const wu = W.waterMat.uniforms; wu.uTime.value = G.t; wu.uSky.value.copy(cur.hor).lerp(cur.top, 0.5); wu.uSun.value.copy(cur.sun); wu.uNight.value = night; wu.uDeep.value.set(0x1f6f8f).multiplyScalar(1 - night * 0.75); wu.uShallow.value.set(0x58b5c9).multiplyScalar(1 - night * 0.75); }
    this.renderer.toneMappingExposure = 1.0;
    // rain streaks
    const rm = this.rainMesh; rm.visible = rk > 0.08 && !!cam;
    if (rm.visible) {
      const p = this.rainPos, s = this.rainSeed, n = Math.floor(this.rainN * G.clamp(rk, 0, 1)), cx = cam.position.x, cy = cam.position.y, cz = cam.position.z; this.rainT += (dt || 0) * 26;
      for (let k = 0; k < n; k++) { const x = cx + (s[k * 3] - 0.5) * 46, z = cz + (s[k * 3 + 2] - 0.5) * 46, y = cy + 14 - ((s[k * 3 + 1] * 30 + this.rainT) % 30); p[k * 6] = x; p[k * 6 + 1] = y; p[k * 6 + 2] = z; p[k * 6 + 3] = x - 0.12; p[k * 6 + 4] = y - 0.9; p[k * 6 + 5] = z; }
      rm.geometry.setDrawRange(0, n * 2); rm.geometry.attributes.position.needsUpdate = true; rm.material.opacity = 0.2 + 0.3 * rk;
    }
  };
  sky.update = function (dt, focus, cam) {
    if (!this.frozen) {
      this.hour += dt * this.speed;
      if (this.hour >= 24) { this.hour -= 24; G.S().day++; G.emit('newday'); }
      const hh = Math.floor(this.hour); if (hh !== this._lastH) { this._lastH = hh; G.emit('hour', hh); }
    }
    this.apply(dt, focus, cam);
  };
})();
