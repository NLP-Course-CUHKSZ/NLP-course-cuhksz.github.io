/* 神仙岭下 · Campus Odyssey — core: namespace, utils, i18n, events, save, input, audio */
(function () {
  'use strict';
  const G = window.G = { ver: '1.0', ready: false, lang: 'zh', t: 0, dt: 0.016, frame: 0, mode: 'boot', uTime: { value: 0 } };
  const Q = new URLSearchParams(location.search);
  G.query = Q;
  G.isTouch = ('ontouchstart' in window || navigator.maxTouchPoints > 0) && !Q.has('desktop');
  G.isMobile = G.isTouch && Math.min(screen.width, screen.height) < 900;

  // ------------------------------------------------------------ math utils
  const TAU = Math.PI * 2;
  G.TAU = TAU;
  G.clamp = (v, a, b) => v < a ? a : v > b ? b : v;
  G.lerp = (a, b, t) => a + (b - a) * t;
  G.smooth = (a, b, x) => { const t = G.clamp((x - a) / (b - a), 0, 1); return t * t * (3 - 2 * t); };
  G.damp = (a, b, k, dt) => a + (b - a) * (1 - Math.exp(-k * dt));
  G.angDiff = (a, b) => { let d = (b - a) % TAU; if (d > Math.PI) d -= TAU; if (d < -Math.PI) d += TAU; return d; };
  G.dampAng = (a, b, k, dt) => a + G.angDiff(a, b) * (1 - Math.exp(-k * dt));
  G.dist = (ax, az, bx, bz) => Math.hypot(ax - bx, az - bz);
  G.rng = seed => { let s = seed >>> 0; return () => { s = (s + 0x6D2B79F5) | 0; let t = Math.imul(s ^ (s >>> 15), 1 | s); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; };
  G.rand = (a = 1, b) => b === undefined ? Math.random() * a : a + Math.random() * (b - a);
  G.pick = (arr, r) => arr[Math.floor((r ? r() : Math.random()) * arr.length)];
  G.shuffle = (arr, r) => { const a = arr.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor((r ? r() : Math.random()) * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
  G.hash2 = (x, z) => { let h = Math.imul(x | 0, 374761393) + Math.imul(z | 0, 668265263); h = Math.imul(h ^ (h >>> 13), 1274126177); return ((h ^ (h >>> 16)) >>> 0) / 4294967296; };
  G.noise2 = (x, z) => { const xi = Math.floor(x), zi = Math.floor(z), fx = x - xi, fz = z - zi, u = fx * fx * (3 - 2 * fx), v = fz * fz * (3 - 2 * fz); const a = G.hash2(xi, zi), b = G.hash2(xi + 1, zi), c = G.hash2(xi, zi + 1), d = G.hash2(xi + 1, zi + 1); return a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v; };
  G.sleep = ms => new Promise(r => setTimeout(r, ms));
  G.nextFrame = () => new Promise(r => requestAnimationFrame(r));
  G.fmtTime = h => { const hh = Math.floor(h) % 24, mm = Math.floor((h % 1) * 60); return (hh < 10 ? '0' : '') + hh + ':' + (mm < 10 ? '0' : '') + mm; };
  G.pip = (x, z, ring) => { let ins = false; for (let i = 0, j = ring.length - 2; i < ring.length; j = i, i += 2) { const xi = ring[i], zi = ring[i + 1], xj = ring[j], zj = ring[j + 1]; if ((zi > z) !== (zj > z) && x < (xj - xi) * (z - zi) / (zj - zi) + xi) ins = !ins; } return ins; };

  // ------------------------------------------------------------ i18n
  G.L = (zh, en) => G.lang === 'zh' ? zh : (en == null ? zh : en);
  G.tx = v => Array.isArray(v) ? (G.lang === 'zh' ? v[0] : (v[1] == null ? v[0] : v[1])) : (typeof v === 'function' ? v() : v);

  // ------------------------------------------------------------ events
  const handlers = {};
  G.on = (n, f) => { (handlers[n] = handlers[n] || []).push(f); return f; };
  G.off = (n, f) => { const a = handlers[n]; if (a) { const i = a.indexOf(f); if (i >= 0) a.splice(i, 1); } };
  G.emit = (n, d) => { const a = handlers[n]; if (a) for (const f of a.slice()) { try { f(d); } catch (e) { console.error('[event ' + n + ']', e); } } };

  // ------------------------------------------------------------ save
  const SAVE_KEY = 'campus-odyssey-save-v1';
  const defSave = () => ({
    v: 1, started: false, name: '', identity: 'freshman', college: 'shaw', look: { skin: 0, hair: 0, top: 0, style: 0 },
    done: {}, flags: {}, stats: { acad: 0, social: 0, well: 0, career: 0, culture: 0 }, xp: 0, coins: 50,
    found: {}, cats: {}, clubs: [], photos: 0, day: 1, hour: 9, pos: null, playSec: 0, grades: {},
    opt: { lang: 'zh', quality: 'auto', music: 0.5, sfx: 0.8, invertY: false, sens: 1 }
  });
  G.save = {
    data: defSave(),
    load() { try { const s = localStorage.getItem(SAVE_KEY); if (s) { const d = JSON.parse(s); const base = defSave(); this.data = Object.assign(base, d); this.data.opt = Object.assign(defSave().opt, d.opt || {}); this.data.stats = Object.assign(defSave().stats, d.stats || {}); this.data.look = Object.assign(defSave().look, d.look || {}); return !!d.started; } } catch (e) { } return false; },
    temp() { const opt = this.data.opt; this.data = defSave(); this.data.opt = opt; this.volatile = true; },
    store() { if (this.volatile || G.query.has('nosave')) return; try { localStorage.setItem(SAVE_KEY, JSON.stringify(this.data)); } catch (e) { } },
    reset() { const opt = this.data.opt; this.data = defSave(); this.data.opt = opt; this.store(); },
    has() { try { const s = localStorage.getItem(SAVE_KEY); return !!(s && JSON.parse(s).started); } catch (e) { return false; } }
  };
  G.S = () => G.save.data;

  // ------------------------------------------------------------ input
  const I = G.input = {
    keys: {}, hits: {}, mx: 0, my: 0, lookX: 0, lookY: 0, wheel: 0, locked: false, joy: { x: 0, y: 0, on: false }, btn: {}, btnHit: {},
    lastLook: -10, pointerLocked: false, any: false,
    down(c) { return !!this.keys[c]; },
    hit(c) { return !!this.hits[c]; },
    act(a) { // held actions
      switch (a) {
        case 'sprint': return this.keys.ShiftLeft || this.keys.ShiftRight || this.btn.sprint;
        case 'jump': return this.keys.Space || this.btn.jump;
        case 'down': return this.keys.ControlLeft || this.keys.KeyC || this.btn.down;
        case 'brake': return this.keys.Space || this.btn.jump;
      } return false;
    },
    actHit(a) {
      switch (a) {
        case 'interact': return this.hits.KeyE || this.hits.Enter || this.btnHit.interact;
        case 'vehicle': return this.hits.KeyF || this.btnHit.vehicle;
        case 'jump': return this.hits.Space || this.btnHit.jump;
        case 'slide': return this.hits.KeyS || this.hits.ArrowDown || this.hits.ControlLeft || this.btnHit.down;
        case 'left': return this.hits.KeyA || this.hits.ArrowLeft || this.btnHit.left;
        case 'right': return this.hits.KeyD || this.hits.ArrowRight || this.btnHit.right;
        case 'up': return this.hits.KeyW || this.hits.ArrowUp || this.hits.Space || this.btnHit.jump || this.btnHit.up;
        case 'phone': return this.hits.Tab || this.hits.KeyP || this.btnHit.phone;
        case 'map': return this.hits.KeyM || this.btnHit.map;
        case 'pause': return this.hits.Escape || this.btnHit.pause;
        case 'horn': return this.hits.KeyH || this.btnHit.horn;
        case 'photo': return this.hits.KeyV || this.btnHit.photo;
      } return false;
    },
    move() { // returns [x, y] in -1..1 (x right, y forward)
      let x = 0, y = 0;
      if (this.keys.KeyW || this.keys.ArrowUp) y += 1; if (this.keys.KeyS || this.keys.ArrowDown) y -= 1;
      if (this.keys.KeyD) x += 1; if (this.keys.KeyA) x -= 1;
      if (this.joy.on) { x += this.joy.x; y += this.joy.y; }
      const m = Math.hypot(x, y); if (m > 1) { x /= m; y /= m; }
      return [x, y];
    },
    endFrame() { this.hits = {}; this.btnHit = {}; this.lookX = 0; this.lookY = 0; this.wheel = 0; },
    press(b) { this.btn[b] = true; this.btnHit[b] = true; this.any = true; }, release(b) { this.btn[b] = false; }
  };
  const GAME_KEYS = /^(Key[A-Z]|Arrow|Space|Shift|Control|Tab|Enter|Escape|Digit)/;
  window.addEventListener('keydown', e => {
    if (e.target && /INPUT|TEXTAREA/.test(e.target.tagName)) return;
    if (!I.keys[e.code]) I.hits[e.code] = true;
    I.keys[e.code] = true; I.any = true;
    if (e.code === 'Tab' || e.code === 'Space' || e.code.startsWith('Arrow')) e.preventDefault();
    G.emit('key', e.code);
  });
  window.addEventListener('keyup', e => { I.keys[e.code] = false; });
  window.addEventListener('blur', () => { I.keys = {}; I.btn = {}; });
  document.addEventListener('pointerlockchange', () => { I.pointerLocked = !!document.pointerLockElement; });
  window.addEventListener('mousemove', e => {
    if (I.pointerLocked || I.dragLook) { I.lookX += e.movementX || 0; I.lookY += e.movementY || 0; I.lastLook = G.t; }
  });
  window.addEventListener('wheel', e => { I.wheel += Math.sign(e.deltaY); }, { passive: true });

  // ------------------------------------------------------------ audio (all sounds are synthesized; no samples)
  const A = G.audio = {
    ctx: null, master: null, music: null, sfxG: null, amb: null, ok: false, musicOn: false, _mt: null, mood: 'day', muted: false,
    init() {
      if (this.ctx) { if (this.ctx.state === 'suspended') this.ctx.resume(); return; }
      try {
        const AC = window.AudioContext || window.webkitAudioContext; if (!AC) return;
        const c = this.ctx = new AC();
        this.master = c.createGain(); this.master.gain.value = 0.9;
        const comp = c.createDynamicsCompressor(); comp.threshold.value = -14; comp.ratio.value = 4;
        this.master.connect(comp); comp.connect(c.destination);
        this.sfxG = c.createGain(); this.sfxG.connect(this.master);
        this.music = c.createGain(); this.music.connect(this.master);
        this.amb = c.createGain(); this.amb.connect(this.master);
        // reverb-ish feedback delay for music
        const d = c.createDelay(1); d.delayTime.value = 0.33; const fb = c.createGain(); fb.gain.value = 0.32; const lp = c.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 2200;
        this.music.connect(d); d.connect(lp); lp.connect(fb); fb.connect(d); lp.connect(this.master);
        const n = c.sampleRate * 2, buf = c.createBuffer(1, n, c.sampleRate), ch = buf.getChannelData(0);
        for (let i = 0; i < n; i++) ch[i] = Math.random() * 2 - 1;
        this.noiseBuf = buf; this.ok = true; this.applyVol();
      } catch (e) { console.warn('audio init failed', e); }
    },
    applyVol() { if (!this.ok) return; const o = G.S().opt; const m = this.muted ? 0 : 1; this.sfxG.gain.value = o.sfx * m; this.music.gain.value = o.music * 0.55 * m; this.amb.gain.value = o.sfx * 0.5 * m; },
    now() { return this.ctx ? this.ctx.currentTime : 0; },
    tone(f, dur = 0.15, o = {}) {
      if (!this.ok) return; const c = this.ctx, t = (o.when || c.currentTime) + (o.delay || 0);
      const osc = c.createOscillator(), g = c.createGain(); osc.type = o.type || 'sine'; osc.frequency.setValueAtTime(f, t);
      if (o.to) osc.frequency.exponentialRampToValueAtTime(Math.max(20, o.to), t + dur);
      const v = (o.vol == null ? 0.2 : o.vol), a = o.attack == null ? 0.005 : o.attack;
      g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(v, t + a); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
      osc.connect(g); g.connect(o.dest || this.sfxG); osc.start(t); osc.stop(t + dur + 0.05);
    },
    noise(dur = 0.1, o = {}) {
      if (!this.ok) return; const c = this.ctx, t = (o.when || c.currentTime) + (o.delay || 0);
      const s = c.createBufferSource(); s.buffer = this.noiseBuf; s.loop = true;
      const f = c.createBiquadFilter(); f.type = o.ftype || 'bandpass'; f.frequency.setValueAtTime(o.freq || 1200, t); f.Q.value = o.q || 1;
      if (o.to) f.frequency.exponentialRampToValueAtTime(o.to, t + dur);
      const g = c.createGain(); const v = o.vol == null ? 0.2 : o.vol;
      g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(v, t + (o.attack || 0.005)); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
      s.connect(f); f.connect(g); g.connect(o.dest || this.sfxG); s.start(t, Math.random()); s.stop(t + dur + 0.05);
    },
    bell(f, dur = 2.5, vol = 0.25, when) { [1, 2.01, 2.76, 4.07, 5.4].forEach((m, i) => this.tone(f * m, dur / (1 + i * 0.5), { vol: vol / (1 + i * 1.3), when, type: 'sine' })); },
    sfx(name, p = 1) {
      if (!this.ok) return;
      switch (name) {
        case 'ui': this.tone(880, 0.07, { to: 1250, vol: 0.12 }); break;
        case 'back': this.tone(700, 0.08, { to: 480, vol: 0.1 }); break;
        case 'ok': this.tone(660, 0.1, { vol: 0.16 }); this.tone(990, 0.16, { vol: 0.16, delay: 0.09 }); break;
        case 'bad': this.tone(190, 0.22, { type: 'sawtooth', to: 120, vol: 0.13 }); break;
        case 'pick': [1318, 1568, 2093].forEach((f, i) => this.tone(f, 0.16, { vol: 0.12, delay: i * 0.06, type: 'triangle' })); break;
        case 'step': this.noise(0.05, { freq: 500 + Math.random() * 500, vol: 0.05 * p, q: 0.8 }); break;
        case 'jump': this.tone(300, 0.16, { to: 620, vol: 0.1, type: 'triangle' }); break;
        case 'land': this.noise(0.09, { freq: 260, vol: 0.12 }); break;
        case 'bikebell': this.tone(2400, 0.5, { vol: 0.14 }); this.tone(3600, 0.4, { vol: 0.07 }); this.tone(2400, 0.5, { vol: 0.14, delay: 0.16 }); break;
        case 'horn': this.tone(420, 0.35, { type: 'square', vol: 0.08 }); this.tone(530, 0.35, { type: 'square', vol: 0.08 }); break;
        case 'whoosh': this.noise(0.3, { freq: 400, to: 2400, vol: 0.14, q: 0.6 }); break;
        case 'powder': this.noise(0.5, { freq: 1800, to: 300, vol: 0.22, q: 0.4 }); break;
        case 'meow': this.tone(640, 0.34, { type: 'triangle', to: 880, vol: 0.14 }); this.tone(880, 0.3, { type: 'triangle', to: 520, vol: 0.12, delay: 0.3 }); break;
        case 'page': this.noise(0.16, { freq: 3000, to: 900, vol: 0.09, q: 0.5 }); break;
        case 'clink': this.tone(2637, 0.9, { vol: 0.14 }); this.tone(3951, 0.6, { vol: 0.08 }); this.tone(5274, 0.4, { vol: 0.04 }); break;
        case 'shutter': this.noise(0.05, { freq: 5000, vol: 0.2 }); this.noise(0.07, { freq: 2500, vol: 0.14, delay: 0.09 }); break;
        case 'drop': this.tone(900, 0.12, { to: 300, vol: 0.14 }); break;
        case 'tick': this.tone(1500, 0.03, { vol: 0.08, type: 'square' }); break;
        case 'hit': this.noise(0.16, { freq: 300, vol: 0.3 }); this.tone(140, 0.2, { to: 70, vol: 0.2, type: 'triangle' }); break;
        case 'swish': this.noise(0.28, { freq: 2600, to: 700, vol: 0.18, q: 1.5 }); break;
        case 'bounce': this.tone(170, 0.12, { to: 90, vol: 0.22, type: 'triangle' }); break;
        case 'chime': this.bell(392, 3.2, 0.2); break;
        case 'stamp': this.noise(0.12, { freq: 180, vol: 0.4 }); this.tone(110, 0.25, { to: 60, vol: 0.25 }); break;
        case 'win': [523, 659, 784, 1047, 1319].forEach((f, i) => this.tone(f, 0.5, { vol: 0.14, delay: i * 0.09, type: 'triangle' })); this.tone(1047, 1.2, { vol: 0.1, delay: 0.5 }); this.tone(1568, 1.2, { vol: 0.07, delay: 0.5 }); break;
        case 'level': [392, 523, 659, 784].forEach((f, i) => this.tone(f, 0.3, { vol: 0.13, delay: i * 0.07 })); break;
        case 'msg': this.tone(1175, 0.09, { vol: 0.12 }); this.tone(1568, 0.14, { vol: 0.12, delay: 0.1 }); break;
        case 'splash': this.noise(0.5, { freq: 900, to: 200, vol: 0.25, q: 0.5 }); break;
        case 'rotor': this.tone(160, 0.25, { type: 'sawtooth', vol: 0.03 }); break;
      }
    },
    // ---- generative background music (original): pentatonic plucks over slow pads
    startMusic() { if (!this.ok || this.musicOn) return; this.musicOn = true; this._beat = 0; this._next = this.ctx.currentTime + 0.1; this._mt = setInterval(() => this._sched(), 120); },
    stopMusic() { this.musicOn = false; clearInterval(this._mt); },
    _sched() {
      if (!this.ok || !this.musicOn || this.musicHold) return; const c = this.ctx; const night = this.mood === 'night';
      const bpm = night ? 60 : 76, spb = 60 / bpm / 2;
      const chords = night ? [[220, 261.6, 329.6], [174.6, 220, 261.6], [196, 246.9, 293.7], [164.8, 196, 246.9]] : [[261.6, 329.6, 392], [220, 261.6, 329.6], [174.6, 220, 261.6], [196, 246.9, 293.7]];
      const scale = night ? [220, 261.6, 293.7, 329.6, 392, 440, 523.3] : [261.6, 293.7, 329.6, 392, 440, 523.3, 587.3, 659.3];
      while (this._next < c.currentTime + 0.4) {
        const b = this._beat, t = this._next;
        if (b % 16 === 0) { const ch = chords[(b / 16) % chords.length | 0]; ch.forEach((f, i) => { this.tone(f / 2, spb * 17, { when: t, vol: 0.05, attack: 1.2, type: 'sine', dest: this.music }); this.tone(f, spb * 17, { when: t, vol: 0.022, attack: 1.6, type: 'triangle', dest: this.music }); }); }
        const r = G.hash2(b * 7 + (this._seed || 0), b * 13);
        if (b % 2 === 0 ? r < 0.62 : r < 0.2) { const f = scale[Math.floor(G.hash2(b, 77 + (this._seed || 0)) * scale.length)]; this.tone(f * (r < 0.1 ? 2 : 1), 1.4, { when: t, vol: night ? 0.05 : 0.06, type: 'triangle', dest: this.music }); }
        if (b % 64 === 63) this._seed = (this._seed || 0) + 1;
        this._beat++; this._next += spb;
      }
    },
    // ambient: birds by day, crickets by night
    ambientTick(hour, raining) {
      if (!this.ok || this.muted) return;
      const day = hour > 6 && hour < 18.5;
      if (raining) { if (Math.random() < 0.5) this.noise(0.7, { freq: 2500 + Math.random() * 1500, vol: 0.05, q: 0.3, dest: this.amb, attack: 0.2 }); return; }
      if (day && Math.random() < 0.05) { const f = 2400 + Math.random() * 1800; const n = 2 + Math.floor(Math.random() * 4); for (let i = 0; i < n; i++) this.tone(f * (1 + i * 0.03), 0.09, { to: f * 1.25, vol: 0.035, delay: i * 0.12, dest: this.amb }); }
      if (!day && Math.random() < 0.25) { for (let i = 0; i < 3; i++) this.tone(4300, 0.04, { vol: 0.012, delay: i * 0.06, type: 'square', dest: this.amb }); }
    }
  };
  const unlock = () => { A.init(); };
  window.addEventListener('pointerdown', unlock); window.addEventListener('keydown', unlock); window.addEventListener('touchstart', unlock, { passive: true });

  // ------------------------------------------------------------ THREE helpers
  G.c3 = hex => new THREE.Color(hex);
  G.hsl = (h, s, l) => new THREE.Color().setHSL(h, s, l, THREE.SRGBColorSpace);
  G.canvas = (w, h) => { const c = document.createElement('canvas'); c.width = w; c.height = h; return c; };
  G.canvasTex = (c, opt = {}) => { const t = new THREE.CanvasTexture(c); t.encoding = THREE.sRGBEncoding; if (opt.repeat) { t.wrapS = t.wrapT = THREE.RepeatWrapping; } t.anisotropy = opt.aniso || 4; if (opt.nearest) { t.magFilter = THREE.NearestFilter; } return t; };
  G.textSprite = (text, o = {}) => {
    const fs = o.size || 44, pad = 18, c = G.canvas(8, 8), x = c.getContext('2d'); const font = `${o.weight || 700} ${fs}px "PingFang SC","Microsoft YaHei","Noto Sans SC",sans-serif`;
    x.font = font; const w = Math.ceil(x.measureText(text).width) + pad * 2; c.width = w; c.height = fs + pad * 2; x.font = font; x.textBaseline = 'middle';
    if (o.bg) { x.fillStyle = o.bg; const r = (fs + pad * 2) / 2; x.beginPath(); x.moveTo(r, 0); x.arcTo(w, 0, w, c.height, r); x.arcTo(w, c.height, 0, c.height, r); x.arcTo(0, c.height, 0, 0, r); x.arcTo(0, 0, w, 0, r); x.fill(); }
    x.lineWidth = 6; x.strokeStyle = o.stroke || 'rgba(0,0,0,.55)'; if (!o.bg) x.strokeText(text, pad, c.height / 2 + 2); x.fillStyle = o.color || '#fff'; x.fillText(text, pad, c.height / 2 + 2);
    const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: G.canvasTex(c), transparent: true, depthWrite: false, depthTest: o.depthTest !== false, fog: false }));
    const s = (o.scale || 1) * 0.02; sp.scale.set(w * s, c.height * s, 1); return sp;
  };
})();
