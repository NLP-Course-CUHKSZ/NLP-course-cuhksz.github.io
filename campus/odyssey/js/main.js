/* boot, main loop, quality, game start, fast travel, photo mode, debug helpers */
(function () {
  'use strict';
  const G = window.G, W = G.world, ui = G.ui, I = G.input, L = G.L, $ = id => document.getElementById(id);
  THREE.ColorManagement.legacyMode = false;
  G.save.load();
  G.lang = G.query.get('lang') || G.S().opt.lang || ((navigator.language || 'zh').toLowerCase().startsWith('zh') ? 'zh' : 'en');
  G.setLang = l => { G.lang = l; G.S().opt.lang = l; G.save.store(); document.documentElement.lang = l === 'zh' ? 'zh-CN' : 'en'; ui.relabel(); G.emit('lang'); };

  let renderer, scene, camera, last = 0, fpsAcc = 0, fpsN = 0, lowT = 0, scale = 1, autoStep = 0;
  const focus = new THREE.Vector3();
  const prog = (p, msg) => { $('ldFill').style.width = Math.round(p * 100) + '%'; if (msg) $('ldMsg').textContent = msg; };

  G.applyQuality = function () {
    let q = G.S().opt.quality; if (q === 'auto') q = G.isMobile ? 'low' : (autoStep >= 2 ? 'low' : 'med');
    G.q = q; const dpr = window.devicePixelRatio || 1;
    const pr = (q === 'low' ? Math.min(dpr, 1) : q === 'med' ? Math.min(dpr, 1.25) : Math.min(dpr, 1.75)) * scale;
    renderer.setPixelRatio(pr); renderer.setSize(innerWidth, innerHeight, false);
    G.sky.setShadows(q); G.vegQ = q === 'low' ? 0.6 : q === 'med' ? 0.85 : 1.1; G.crowd.setTarget(q === 'low' ? 34 : q === 'med' ? 60 : 90);
  };
  function resize() { camera.aspect = innerWidth / innerHeight; camera.updateProjectionMatrix(); renderer.setSize(innerWidth, innerHeight, false); }

  async function boot() {
    try {
      renderer = G.renderer = new THREE.WebGLRenderer({ canvas: $('gl'), antialias: !G.isMobile, powerPreference: 'high-performance' });
      renderer.outputEncoding = THREE.sRGBEncoding; renderer.toneMapping = THREE.LinearToneMapping;
      scene = G.scene = new THREE.Scene(); camera = G.camera = new THREE.PerspectiveCamera(55, innerWidth / innerHeight, 0.35, 9000);
      prog(0.06, L('读取真实校园地图…', 'Reading the real campus map…')); await G.nextFrame();
      W.parse(); await W.loadTerrain(); G.nav.build();
      let n = 0; await W.buildScene(scene, t => prog(0.12 + (n++) * 0.14, t));
      prog(0.86, L('点亮天空…', 'Lighting the sky…')); await G.nextFrame();
      G.sky.init(scene, renderer, 'med'); G.fx.init(scene); G.cam.init(camera, renderer.domElement);
      G.crowd.init(scene); G.traffic.init(scene); G.player.init(scene); ui.init(); ui.initLabels();
      W.makeBaseMap(G.isMobile ? 0.5 : 1);
      G.content.resolve(); G.missions.init();
      G.applyQuality(); window.addEventListener('resize', resize); resize();
      prog(1, L('欢迎来到港中大（深圳）', 'Welcome to CUHK-Shenzhen'));
      G.ready = true; requestAnimationFrame(frame);
      G.sky.setHour(+G.query.get('hour') || 16.6); G.sky.frozen = true;
      await G.sleep(350); $('loading').style.opacity = 0; setTimeout(() => $('loading').remove(), 800);
      if (G.query.has('autostart')) { if (!G.S().started || G.query.has('fresh')) { G.save.reset(); Object.assign(G.S(), { name: G.query.get('name') || L('小深', 'Alex'), identity: G.query.get('id') || 'freshman', college: G.query.get('college') || 'shaw', started: true }); } G.startGame(true, { skipIntro: G.query.has('skipintro') }); }
      else showTitle();
    } catch (e) { console.error(e); $('ldMsg').innerHTML = !renderer ? L('无法启动 3D 画面：请使用支持 WebGL 的新版 Chrome / Edge / Safari。', 'Could not start 3D graphics: please use a recent Chrome / Edge / Safari with WebGL enabled.') : 'Error: ' + e.message; throw e; }
  }
  function showTitle() {
    G.mode = 'title'; const P = G.player; const g = G.content.pos('gate'); P.pos.set(g.x, 0, g.z); P.hidden = true;
    const b = n => W.find(n), lib = b('大学图书馆'), tow = b('钟楼'), adm = b('行政楼'), gym = b('大学体育馆'), sh = b('逸夫书院A栋');
    G.cam.orbit({ pathSpeed: 0.011, path: [[lib.cx + 250, 120, lib.cz + 250, lib.cx, 10, lib.cz], [lib.cx + 40, 46, lib.cz + 190, lib.cx - 20, 14, lib.cz - 20], [sh.cx + 170, 60, sh.cz + 150, sh.cx - 40, 22, sh.cz], [tow.cx + 150, 74, tow.cz + 110, tow.cx - 20, 30, tow.cz], [gym.cx - 60, 96, gym.cz + 230, gym.cx + 80, 0, gym.cz - 80], [adm.cx + 260, 150, adm.cz - 30, adm.cx - 80, 0, adm.cz + 80]] });
    ui.showTitle();
  }
  // ------------------------------------------------------------ start / save
  G.startGame = async function (isNew, o = {}) {
    await ui.fade(true, 450); ui.hideTitle(); const S = G.S(), P = G.player;
    G.visitor = !!o.visitor; if (G.visitor) { G.save.temp(); G.S().name = L('访客', 'Visitor'); G.S().look = S.look; }
    P.hidden = false; P.char.setLook(S.look); P.mode = 'foot'; G.cam.release();
    const st = (!isNew && S.pos && !G.visitor) ? S.pos : null, g = G.content.pos('gate');
    if (st) { P.teleport(st[0], st[1], st[2] || 0); G.sky.setHour(S.hour || 9); } else { P.teleport(g.x, g.z, g.h); G.sky.setHour(isNew ? 9.2 : S.hour || 9); }
    if (G.query.has('hour')) G.sky.setHour(+G.query.get('hour'));
    G.sky.frozen = false; G.mode = 'play'; $('hud').classList.remove('hidden'); G.crowd.booting = true; setTimeout(() => G.crowd.booting = false, 4000);
    G.content.spawnWorld(); if (G.content.markCats) G.content.markCats(); G.audio.init(); G.audio.startMusic();
    await G.sleep(200); await ui.fade(false, 700);
    G.missions.begin(isNew, o);
    if (G.query.has('tp')) G.dbg.tp(G.query.get('tp'));
    if (G.query.has('m')) setTimeout(() => G.dbg.run(G.query.get('m')), 600);
  };
  G.saveNow = function () { if (G.mode !== 'play' || G.visitor) return; const S = G.S(), P = G.player; if (!G.missions.active && P.mode === 'foot') S.pos = [Math.round(P.pos.x * 10) / 10, Math.round(P.pos.z * 10) / 10, Math.round(P.heading * 100) / 100]; S.hour = Math.round(G.sky.hour * 100) / 100; S.started = true; G.save.store(); };
  setInterval(() => G.saveNow(), 20000); window.addEventListener('beforeunload', () => G.saveNow());
  G.fastTravel = async function (s) { const P = G.player; G.audio.sfx('horn'); await ui.fade(true, 450); const p = G.content.pos(s.at); P.teleport(p.x, p.z, p.h); G.sky.setHour(G.sky.hour + 0.12); await G.sleep(450); await ui.fade(false, 600); ui.banner(L('校巴到站', 'SHUTTLE'), G.tx(s.name), G.tx(s.d)); };

  // ------------------------------------------------------------ photo mode
  G.photoMode = function () {
    if (G.missions.active && !G.missions.allowPhoto) { ui.toast(L('任务进行中，稍后再拍吧。', 'Finish the mission first.')); return; }
    const P = G.player, c = G.cam, keep = { pose: P.pose, lock: P.locked }; P.locked = true; $('hud').classList.add('hidden'); ui.hideLabels = true;
    c.orbit({ x: P.pos.x, y: P.pos.y + 1.2, z: P.pos.z, r: 5.5, h: 0.8, ang: c.yaw, speed: 0.0001, ty: 0 }); const o = c.cine;
    const bar = ui.h(`<div style="position:absolute;left:0;right:0;bottom:22px;display:flex;gap:10px;justify-content:center;flex-wrap:wrap"></div>`); $('overlay').appendChild(bar); ui.push();
    const add = (t, f, cls = '') => { const b = ui.h(`<button class="btn ${cls}">${t}</button>`); b.onclick = f; bar.appendChild(b); };
    const dom = renderer.domElement; let drag = null;
    const pd = e => { drag = { x: e.clientX, y: e.clientY }; }, pm = e => { if (!drag) return; o.ang -= (e.clientX - drag.x) * 0.006; o.h = G.clamp(o.h + (e.clientY - drag.y) * 0.03, -0.8, 30); drag = { x: e.clientX, y: e.clientY }; c.snap = true; }, pu = () => drag = null, wh = e => { o.r = G.clamp(o.r + Math.sign(e.deltaY) * 0.7, 2.2, 60); c.snap = true; };
    dom.addEventListener('pointerdown', pd); window.addEventListener('pointermove', pm); window.addEventListener('pointerup', pu); dom.addEventListener('wheel', wh, { passive: true });
    const poses = [null, 'wave', 'cheer']; let pi = 0;
    add('🙋 ' + L('姿势', 'Pose'), () => { pi = (pi + 1) % poses.length; P.pose = poses[pi]; });
    add('⏱ ' + L('时间', 'Time'), () => { G.sky.setHour((G.sky.hour + 2.5) % 24); });
    add('📸 ' + L('拍照', 'Snap'), () => {
      G.audio.sfx('shutter'); renderer.render(scene, camera); const src = dom, cv = G.canvas(src.width, src.height + Math.round(src.height * 0.09)), x = cv.getContext('2d'); x.drawImage(src, 0, 0);
      x.fillStyle = '#2c1850'; x.fillRect(0, src.height, cv.width, cv.height - src.height); x.fillStyle = '#e5b53b'; x.font = `700 ${Math.round(src.height * 0.038)}px sans-serif`; x.textBaseline = 'middle'; x.fillText(L('神仙岭下 · 港中大（深圳）', 'Campus Odyssey · CUHK-Shenzhen'), src.height * 0.04, src.height * 1.045);
      x.textAlign = 'right'; x.fillStyle = '#fff'; x.font = `500 ${Math.round(src.height * 0.028)}px sans-serif`; x.fillText((G.S().name || '') + ' · ' + G.fmtTime(G.sky.hour), cv.width - src.height * 0.04, src.height * 1.045);
      const a = document.createElement('a'); a.href = cv.toDataURL('image/jpeg', 0.92); a.download = 'campus-odyssey-photo.jpg'; a.click(); G.S().photos++; G.emit('photo');
    }, 'gold');
    add('✕ ' + L('退出', 'Exit'), () => { dom.removeEventListener('pointerdown', pd); window.removeEventListener('pointermove', pm); window.removeEventListener('pointerup', pu); dom.removeEventListener('wheel', wh); bar.remove(); ui.pop(); P.pose = keep.pose; P.locked = keep.lock; c.release(); $('hud').classList.remove('hidden'); ui.hideLabels = false; }, 'ghost');
  };

  // ------------------------------------------------------------ main loop
  function frame(now) {
    requestAnimationFrame(frame);
    let dt = Math.min(0.05, (now - last) / 1000 || 0.016); last = now;
    G.dt = dt; G.t += dt; G.uTime.value = G.t; G.frame++;
    const P = G.player;
    if (G.mode === 'play') {
      if (!ui.busy()) { if (I.actHit('phone')) ui.openPhone(); else if (I.actHit('map')) ui.openMap(); else if (I.actHit('pause')) ui.openPhone('settings'); else if (I.actHit('photo') && !P.locked) G.photoMode(); }
      G.inter.update(); G.veh.update(dt); P.update(dt); G.crowd.update(dt); G.missions.update(dt);
      focus.copy(P.pos);
    } else { if (G.mode === 'title') G.crowd.update(dt); focus.copy(G.cam.target); }
    G.traffic.update(dt); G.cam.update(dt); camera.updateMatrixWorld();
    if (G.mode === 'title') focus.copy(G.cam.target);
    G.fx.update(dt); W.cullVeg(camera, G.vegQ); G.sky.update(dt, focus, camera);
    G.audio.mood = G.sky.night > 0.5 ? 'night' : 'day'; if (G.frame % 30 === 0) G.audio.ambientTick(G.sky.hour, G.sky.rain > 0.5);
    renderer.render(scene, camera);
    ui.updateWorldUI(dt);
    if (G.mode === 'play') { ui.updateHUD(dt); if (G.frame % 2 === 0) ui.drawMinimap(dt * 2); }
    I.endFrame();
    // adaptive resolution when the frame rate is low (auto quality only)
    fpsAcc += dt; fpsN++;
    if (fpsAcc > 1.5) { const fps = fpsN / fpsAcc; G.fps = fps; fpsAcc = 0; fpsN = 0; if (G.S().opt.quality === 'auto' && !document.hidden) { if (fps < 27) { if (++lowT >= 2) { lowT = 0; if (scale > 0.62) { scale = Math.max(0.6, scale - 0.15); G.applyQuality(); } else if (autoStep < 2) { autoStep = 2; G.applyQuality(); } } } else lowT = 0; } }
  }

  // ------------------------------------------------------------ debug helpers (also used by automated tests)
  G.dbg = {
    tp(name, dx = 0, dz = 0) { const p = G.content.pos(name); if (!p) return 'unknown place ' + name; G.player.teleport(p.x + dx, p.z + dz, p.h); return [Math.round(p.x), Math.round(p.z)]; },
    xz(x, z, h) { G.player.teleport(x, z, h); },
    hour(h) { G.sky.setHour(h); },
    run(id) { return G.missions.start(id, true); },
    stats() { const i = renderer.info; return { fps: Math.round(G.fps || 0), calls: i.render.calls, tris: i.render.triangles, q: G.q, scale, npc: G.crowd.list.length, pos: [Math.round(G.player.pos.x), Math.round(G.player.pos.z)], mode: G.mode, mission: G.missions.active ? G.missions.active.def.id : null, modal: ui.modal }; },
    view(x, y, z, tx, ty, tz) { G.cam.mode = 'manual'; G.cam.pos.set(x, y, z); G.cam.target.set(tx, ty, tz); },
    free() { G.cam.release(); },
    bench(n = 40) { const gl = renderer.getContext(), px = new Uint8Array(4), t0 = performance.now(); for (let i = 0; i < n; i++) { G.frame++; G.sky.apply(0.016, focus, camera); renderer.render(scene, camera); gl.readPixels(0, 0, 1, 1, gl.RGBA, gl.UNSIGNED_BYTE, px); } return Math.round((performance.now() - t0) / n * 10) / 10; }
  };
  boot();
})();
