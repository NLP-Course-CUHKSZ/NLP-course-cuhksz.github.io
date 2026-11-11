/* HUD, minimap, dialogue, panels, phone, map, title, character creation, touch controls */
(function () {
  'use strict';
  const G = window.G, W = G.world, I = G.input, L = G.L;
  const $ = id => document.getElementById(id);
  const ui = G.ui = { modal: 0, tags: [], bubbles: [], marks: [], route: null, lbls: [], AV: {} };
  const h = (html) => { const t = document.createElement('template'); t.innerHTML = html.trim(); return t.content.firstChild; };
  ui.h = h; ui.$ = $;
  ui.busy = () => ui.modal > 0;
  ui.push = () => { ui.modal++; if (document.pointerLockElement) document.exitPointerLock(); I.keys = {}; I.btn = {}; I.joy.on = false; };
  ui.pop = () => { ui.modal = Math.max(0, ui.modal - 1); I.hits = {}; I.btnHit = {}; };
  const esc = s => String(s).replace(/[&<>]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c]));
  ui.esc = esc;

  // ------------------------------------------------------------ toasts / banner / objective / timer / fade
  ui.toast = function (html, dur = 3.4) { const t = h(`<div class="toast">${html}</div>`); $('toasts').appendChild(t); while ($('toasts').children.length > 4) $('toasts').firstChild.remove(); setTimeout(() => { t.classList.add('out'); setTimeout(() => t.remove(), 450); }, dur * 1000); };
  ui.banner = function (k, t, s) { const b = $('banner'); $('bannerK').textContent = k || ''; $('bannerK').style.display = k ? '' : 'none'; $('bannerT').textContent = t; $('bannerS').textContent = s || ''; b.classList.remove('hidden'); b.style.animation = 'none'; void b.offsetWidth; b.style.animation = ''; clearTimeout(ui._bt); ui._bt = setTimeout(() => b.classList.add('hidden'), 3700); };
  ui.objective = function (title, text) { const o = $('obj'); if (!text) { o.classList.add('hidden'); return; } o.classList.remove('hidden'); $('objT').textContent = title || ''; $('objS').innerHTML = text; };
  ui.timer = function (text, hot) { const t = $('timer'); if (text == null) { t.classList.add('hidden'); return; } t.classList.remove('hidden'); t.textContent = text; t.classList.toggle('hot', !!hot); };
  ui.fade = function (on, ms = 500) { const f = $('fade'); f.style.transition = `opacity ${ms}ms`; f.style.opacity = on ? 1 : 0; f.style.pointerEvents = on ? 'auto' : 'none'; return G.sleep(ms + 30); };

  // ------------------------------------------------------------ avatars (drawn, no image assets needed)
  ui.drawAvatar = function (cv, a = {}) {
    const x = cv.getContext('2d'), S = cv.width, P = G.PAL; x.clearRect(0, 0, S, S);
    const hex = n => '#' + n.toString(16).padStart(6, '0'), top = typeof a.top === 'string' ? a.top : hex(P.TOPS[(a.top || 0) % P.TOPS.length]), skin = hex(P.SKIN[(a.skin || 0) % P.SKIN.length]), hair = typeof a.hair === 'string' ? a.hair : hex(P.HAIR[(a.hair || 0) % P.HAIR.length]);
    const g = x.createLinearGradient(0, 0, 0, S); g.addColorStop(0, a.bg || '#6a3fa8'); g.addColorStop(1, a.bg2 || '#2c1850'); x.fillStyle = g; x.fillRect(0, 0, S, S);
    const u = S / 120;
    if (a.kind === 'ai') { // HuatuoGPT: a gourd + pulse line
      x.fillStyle = '#19b5a5'; x.beginPath(); x.arc(60 * u, 74 * u, 26 * u, 0, 7); x.fill(); x.beginPath(); x.arc(60 * u, 40 * u, 16 * u, 0, 7); x.fill(); x.fillStyle = '#0e8d80'; x.fillRect(56 * u, 14 * u, 8 * u, 12 * u);
      x.strokeStyle = '#fff'; x.lineWidth = 4 * u; x.lineJoin = 'round'; x.beginPath(); x.moveTo(40 * u, 76 * u); x.lineTo(52 * u, 76 * u); x.lineTo(57 * u, 64 * u); x.lineTo(64 * u, 88 * u); x.lineTo(69 * u, 76 * u); x.lineTo(80 * u, 76 * u); x.stroke(); return;
    }
    if (a.kind === 'cat') { x.fillStyle = a.fur || '#e9a55a'; x.beginPath(); x.arc(60 * u, 68 * u, 34 * u, 0, 7); x.fill(); x.beginPath(); x.moveTo(30 * u, 52 * u); x.lineTo(34 * u, 20 * u); x.lineTo(56 * u, 40 * u); x.fill(); x.beginPath(); x.moveTo(90 * u, 52 * u); x.lineTo(86 * u, 20 * u); x.lineTo(64 * u, 40 * u); x.fill(); x.fillStyle = '#2a2238'; x.beginPath(); x.arc(47 * u, 64 * u, 4 * u, 0, 7); x.arc(73 * u, 64 * u, 4 * u, 0, 7); x.fill(); x.fillStyle = '#f48aa0'; x.beginPath(); x.moveTo(56 * u, 74 * u); x.lineTo(64 * u, 74 * u); x.lineTo(60 * u, 79 * u); x.fill(); return; }
    if (a.kind === 'sys') { x.font = `${64 * u}px serif`; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillText(a.icon || '📱', 60 * u, 64 * u); return; }
    // shoulders
    x.fillStyle = top; x.beginPath(); x.moveTo(12 * u, 120 * u); x.quadraticCurveTo(14 * u, 84 * u, 60 * u, 84 * u); x.quadraticCurveTo(106 * u, 84 * u, 108 * u, 120 * u); x.fill();
    if (a.kind === 'doctor' || a.kind === 'lab') { x.fillStyle = '#f7f7f4'; x.beginPath(); x.moveTo(12 * u, 120 * u); x.quadraticCurveTo(14 * u, 84 * u, 46 * u, 86 * u); x.lineTo(60 * u, 110 * u); x.lineTo(74 * u, 86 * u); x.quadraticCurveTo(106 * u, 84 * u, 108 * u, 120 * u); x.fill(); }
    if (a.kind === 'suit' || a.kind === 'pres') { x.fillStyle = '#f4f4f0'; x.beginPath(); x.moveTo(48 * u, 86 * u); x.lineTo(60 * u, 108 * u); x.lineTo(72 * u, 86 * u); x.fill(); x.fillStyle = a.tie || '#8a2a3a'; x.beginPath(); x.moveTo(57 * u, 90 * u); x.lineTo(63 * u, 90 * u); x.lineTo(65 * u, 114 * u); x.lineTo(60 * u, 120 * u); x.lineTo(55 * u, 114 * u); x.fill(); }
    if (a.kind === 'gown') { x.fillStyle = '#17171b'; x.beginPath(); x.moveTo(12 * u, 120 * u); x.quadraticCurveTo(14 * u, 84 * u, 48 * u, 86 * u); x.lineTo(60 * u, 104 * u); x.lineTo(72 * u, 86 * u); x.quadraticCurveTo(106 * u, 84 * u, 108 * u, 120 * u); x.fill(); x.strokeStyle = '#e5b53b'; x.lineWidth = 3 * u; x.beginPath(); x.moveTo(48 * u, 86 * u); x.lineTo(60 * u, 104 * u); x.lineTo(72 * u, 86 * u); x.stroke(); }
    x.fillStyle = skin; x.fillRect(52 * u, 70 * u, 16 * u, 18 * u);
    if (a.style === 1) { x.fillStyle = hair; x.beginPath(); x.ellipse(60 * u, 58 * u, 33 * u, 40 * u, 0, 0, 7); x.fill(); }
    x.fillStyle = skin; x.beginPath(); x.ellipse(60 * u, 52 * u, 25 * u, 28 * u, 0, 0, 7); x.fill();
    x.fillStyle = hair; x.beginPath(); x.ellipse(60 * u, 38 * u, 27 * u, 19 * u, 0, Math.PI, 0); x.fill(); x.beginPath(); x.moveTo(33 * u, 40 * u); x.quadraticCurveTo(48 * u, 26 * u + (a.style === 2 ? 14 * u : 0), 87 * u, 40 * u); x.lineTo(87 * u, 32 * u); x.lineTo(33 * u, 32 * u); x.fill();
    if (a.gray) { x.fillStyle = 'rgba(255,255,255,.35)'; x.beginPath(); x.ellipse(60 * u, 36 * u, 26 * u, 16 * u, 0, Math.PI, 0); x.fill(); }
    x.fillStyle = '#2a2238'; x.beginPath(); x.arc(50 * u, 54 * u, 3 * u, 0, 7); x.arc(70 * u, 54 * u, 3 * u, 0, 7); x.fill();
    x.strokeStyle = '#7a3b3b'; x.lineWidth = 2.4 * u; x.lineCap = 'round'; x.beginPath(); x.arc(60 * u, 62 * u, 9 * u, 0.25, Math.PI - 0.25); x.stroke();
    if (a.glasses) { x.strokeStyle = '#2a2238'; x.lineWidth = 2.2 * u; x.strokeRect(42 * u, 48 * u, 15 * u, 11 * u); x.strokeRect(63 * u, 48 * u, 15 * u, 11 * u); x.beginPath(); x.moveTo(57 * u, 53 * u); x.lineTo(63 * u, 53 * u); x.stroke(); }
    if (a.kind === 'doctor') { x.strokeStyle = '#3d6f8a'; x.lineWidth = 3 * u; x.beginPath(); x.arc(60 * u, 96 * u, 12 * u, 0.2, Math.PI - 0.2); x.stroke(); }
    if (a.cap) { x.fillStyle = a.cap; x.beginPath(); x.ellipse(60 * u, 30 * u, 28 * u, 12 * u, 0, Math.PI, 0); x.fill(); x.fillRect(32 * u, 28 * u, 56 * u, 5 * u); }
  };

  // ------------------------------------------------------------ dialogue
  let dlg = null;
  ui.say = function (ln) {
    return new Promise(res => {
      const box = $('dialog'), tx = $('dlgText'), who = $('dlgWho'), chs = $('dlgChoices'), cv = $('dlgP'), img = $('dlgImg');
      if (!dlg) ui.push();
      box.classList.remove('hidden');
      let av = ln.av; if (typeof av === 'string') av = ui.AV[av] || {};
      if (av && av.img) { img.style.display = ''; cv.style.display = 'none'; img.onerror = () => { img.style.display = 'none'; cv.style.display = ''; ui.drawAvatar(cv, av); }; if (img.getAttribute('src') !== av.img) img.src = av.img; }
      else { img.style.display = 'none'; cv.style.display = ''; ui.drawAvatar(cv, av || { kind: 'sys' }); }
      who.textContent = G.tx(ln.who || (av && av.name) || ''); chs.innerHTML = ''; $('dlgNext').style.display = 'none';
      const full = G.tx(ln.text).replace(/\{name\}/g, G.S().name || L('同学', 'friend')); let i = 0, done = false; tx.textContent = '';
      const finish = () => {
        done = true; tx.innerHTML = esc(full).replace(/\*(.+?)\*/g, '<em>$1</em>');
        if (ln.choices) { ln.choices.forEach((c, k) => { const b = h(`<button class="ch"><b>${k + 1}</b>${esc(G.tx(c.t || c))}</button>`); b.onclick = ev => { ev.stopPropagation(); close(k); }; chs.appendChild(b); }); }
        else $('dlgNext').style.display = '';
      };
      const tick = () => { if (done) return; i += 2; if (i >= full.length) { finish(); return; } tx.textContent = full.slice(0, i); if (i % 6 === 0) G.audio.sfx('tick'); dlg.tm = setTimeout(tick, 22); };
      const adv = () => { if (!done) { clearTimeout(dlg.tm); finish(); } else if (!ln.choices) close(-1); };
      const key = code => { if (/^(Space|Enter|KeyE)$/.test(code)) adv(); else if (done && ln.choices && /^Digit[1-9]$/.test(code)) { const k = +code.slice(5) - 1; if (k < ln.choices.length) close(k); } };
      const close = k => { clearTimeout(dlg.tm); G.off('key', key); $('dlgBox').onclick = null; G.audio.sfx('ui'); if (ln.voice) ui.stopVoice(); if (!ln.keep) { /* stay open between lines; closed by endDialog */ } res(k); };
      dlg = { tm: 0 }; G.on('key', key); $('dlgBox').onclick = adv;
      if (ln.voice) ui.playVoice(ln.voice);
      if (G.query.has('fastdlg')) { finish(); setTimeout(() => close(ln.choices ? (ln.auto || 0) : -1), 30); } else tick();
    });
  };
  ui.endDialog = function () { if (dlg) { dlg = null; $('dialog').classList.add('hidden'); ui.pop(); } };
  ui.dialog = async function (lines) { let last = -1; for (const ln of lines) last = await ui.say(typeof ln === 'string' || Array.isArray(ln) ? { text: ln } : ln); ui.endDialog(); return last; };
  ui.choice = async function (ln) { const k = await ui.say(ln); ui.endDialog(); return k; };
  // optional recorded voice lines (drop mp3 files into assets/ — silently skipped when missing)
  ui.playVoice = function (src) { try { ui.stopVoice(); const a = new Audio(src); a.volume = G.S().opt.sfx; a.play().catch(() => { }); ui._voice = a; } catch (e) { } };
  ui.stopVoice = function () { if (ui._voice) { try { ui._voice.pause(); } catch (e) { } ui._voice = null; } };

  // ------------------------------------------------------------ panels
  ui.panel = function (o) {
    const root = h(`<div class="scrim"><div class="panel ${o.dark ? 'dark' : ''}" style="${o.width ? 'width:min(' + o.width + 'px,100%)' : ''}"><div class="ph"><span class="ic">${o.icon || ''}</span><h3>${o.title || ''}<small>${o.sub || ''}</small></h3><span class="stat" style="display:none"></span>${o.close ? '<button class="x">✕</button>' : ''}</div><div class="pb"></div><div class="pf" style="display:none"><span class="hint"></span></div></div></div>`);
    $('overlay').appendChild(root); ui.push();
    const p = { root, body: root.querySelector('.pb'), foot: root.querySelector('.pf'), closed: false };
    p.stat = t => { const s = root.querySelector('.stat'); s.style.display = t == null ? 'none' : ''; s.innerHTML = t; };
    p.hint = t => { p.foot.style.display = ''; p.foot.querySelector('.hint').innerHTML = t; };
    p.button = (label, cls, fn) => { p.foot.style.display = ''; const b = h(`<button class="btn ${cls || ''}">${label}</button>`); b.onclick = () => { G.audio.sfx('ui'); fn(b); }; p.foot.appendChild(b); return b; };
    p.clearButtons = () => p.foot.querySelectorAll('.btn').forEach(b => b.remove());
    p.close = () => { if (p.closed) return; p.closed = true; root.remove(); ui.pop(); if (p.onclose) p.onclose(); };
    if (o.close) root.querySelector('.x').onclick = () => { G.audio.sfx('back'); if (o.onX) o.onX(); else p.close(); };
    if (o.html) p.body.innerHTML = o.html;
    return p;
  };
  ui.confirm = function (text, yes, no) { return new Promise(res => { const p = ui.panel({ title: L('确认', 'Confirm'), icon: '❓', width: 460, html: `<p class="lead">${text}</p>` }); p.button(no || L('取消', 'Cancel'), 'ghost', () => { p.close(); res(false); }); p.button(yes || L('确定', 'OK'), 'gold', () => { p.close(); res(true); }); }); };
  const STAT = { acad: ['📚', '学业', 'Academic'], social: ['🤝', '社交', 'Social'], well: ['🌿', '身心', 'Wellbeing'], career: ['💼', '生涯', 'Career'], culture: ['🏮', '文化', 'Culture'] };
  ui.STAT = STAT;
  ui.reward = function (o) {
    return new Promise(res => {
      G.audio.sfx('stamp'); setTimeout(() => G.audio.sfx('win'), 350);
      const gains = Object.entries(o.gains || {}).map(([k, v], i) => `<span style="animation-delay:${0.5 + i * 0.12}s">${STAT[k][0]} ${L(STAT[k][1], STAT[k][2])}<b>+${v}</b></span>`).join('');
      const tips = (o.tips || []).map(t => `<li>${G.tx(t)}</li>`).join('');
      const p = ui.panel({ title: L('任务完成', 'Mission Complete'), icon: '🎓', width: 760, html: `<div class="reward"><div class="stamp">${o.stamp || L('通关', 'DONE')}</div><h2>${G.tx(o.title)}</h2><div class="grade">${o.grade ? G.tx(o.grade) : ''}</div><div class="gain">${gains}</div>${tips ? `<ul class="tips">${tips}</ul>` : ''}</div>` });
      p.button(L('继续', 'Continue'), 'gold', () => { p.close(); res(); });
      if (G.query.has('fastdlg')) setTimeout(() => { p.close(); res(); }, 60);
    });
  };

  // ------------------------------------------------------------ world-anchored labels, tags, bubbles, markers
  const v3 = new THREE.Vector3();
  ui.project = function (x, y, z) { v3.set(x, y, z).project(G.cam.camera); return { x: (v3.x * 0.5 + 0.5) * innerWidth, y: (-v3.y * 0.5 + 0.5) * innerHeight, vis: v3.z < 1 && v3.z > -1 }; };
  ui.initLabels = function () { const root = $('labels'); for (const l of W.labels) { const e = h(`<div class="lbl ${l.major ? 'major' : ''}" style="display:none"></div>`); root.appendChild(e); ui.lbls.push({ l, e, on: false }); } ui.relabel(); };
  ui.relabel = function () { for (const o of ui.lbls) o.e.innerHTML = G.lang === 'zh' ? `${esc(o.l.zh)}<small>${esc(o.l.en && o.l.en !== o.l.zh ? o.l.en : '')}</small>` : `${esc(o.l.en || o.l.zh)}<small>${esc(o.l.zh)}</small>`; for (const t of ui.tags) t.e.textContent = G.tx(t.name); };
  ui.tag = function (obj, name, color) { const e = h(`<div class="tag" style="display:none"></div>`); e.textContent = G.tx(name); if (color) e.style.background = color; $('labels').appendChild(e); const t = { obj, e, name, remove() { e.remove(); const i = ui.tags.indexOf(t); if (i >= 0) ui.tags.splice(i, 1); } }; ui.tags.push(t); return t; };
  ui.bubble = function (obj, text, dur = 3) { for (const b of ui.bubbles) if (b.obj === obj) { b.e.remove(); b.dead = true; } const e = h(`<div class="bubble"></div>`); e.textContent = G.tx(text); $('labels').appendChild(e); ui.bubbles.push({ obj, e, t: dur }); };
  // on-screen objective marker; clamps to the screen edge when the target is out of view
  ui.mark = function (o) { const e = h(`<div class="mk"><i>${o.icon || '📍'}</i><span></span></div>`); $('labels').appendChild(e); const m = Object.assign({ e, color: '#e5b53b' }, o); m.remove = () => { e.remove(); const i = ui.marks.indexOf(m); if (i >= 0) ui.marks.splice(i, 1); }; ui.marks.push(m); return m; };
  ui.updateWorldUI = function (dt) {
    const cam = G.cam.camera, cx = cam.position.x, cz = cam.position.z, hide = G.mode !== 'play' && G.mode !== 'title';
    for (const o of ui.lbls) {
      const l = o.l, d = Math.hypot(l.x - cx, l.z - cz), max = l.major ? 520 : 190; let show = !hide && d < max && G.mode === 'play' && !ui.hideLabels;
      if (show && d > 30) { if ((o.oc = (o.oc || 0) - dt) <= 0) { o.oc = 0.35 + Math.random() * 0.2; o.blocked = G.col.ray(cx, cz, l.x, l.z, cam.position.y, l.y) < 0.999; } if (o.blocked) show = false; }
      if (show) { const p = ui.project(l.x, l.y, l.z); if (!p.vis || p.x < -80 || p.x > innerWidth + 80 || p.y < -30 || p.y > innerHeight * 0.8) show = false; else { o.e.style.transform = `translate(${p.x.toFixed(1)}px,${p.y.toFixed(1)}px) translate(-50%,-100%)`; o.e.style.opacity = G.clamp((max - d) / (max * 0.35), 0, 1).toFixed(2); } }
      if (show !== o.on) { o.on = show; o.e.style.display = show ? '' : 'none'; }
    }
    for (const t of ui.tags) { const n = t.obj, d = Math.hypot(n.x - cx, n.z - cz); let show = d < 42 && !n.hidden && G.mode === 'play'; if (show) { const p = ui.project(n.x, n.y + 2.15 * (n.scale || 1), n.z); if (!p.vis) show = false; else t.e.style.transform = `translate(${p.x.toFixed(1)}px,${p.y.toFixed(1)}px) translate(-50%,-100%)`; } t.e.style.display = show ? '' : 'none'; }
    for (let i = ui.bubbles.length - 1; i >= 0; i--) { const b = ui.bubbles[i]; b.t -= dt; if (b.t <= 0 || b.dead) { b.e.remove(); ui.bubbles.splice(i, 1); continue; } const n = b.obj, p = ui.project(n.x, (n.y || 0) + 2.45, n.z); b.e.style.display = p.vis ? '' : 'none'; b.e.style.transform = `translate(${p.x.toFixed(1)}px,${p.y.toFixed(1)}px) translate(-50%,-100%)`; b.e.style.opacity = Math.min(1, b.t * 2).toFixed(2); }
    const P = G.player;
    for (const m of ui.marks) {
      if (G.mode !== 'play' || m.hidden || ui.hideLabels) { m.e.style.display = 'none'; continue; }
      const y = (m.y != null ? m.y : W.ground(m.x, m.z)) + (m.h || 4.2), p = ui.project(m.x, y, m.z), d = Math.hypot(m.x - P.pos.x, m.z - P.pos.z);
      let sx = p.x, sy = p.y; const mx = 46, my = 60;
      if (!p.vis) { sx = innerWidth - sx; sy = innerHeight - 40; }
      const off = !p.vis || sx < mx || sx > innerWidth - mx || sy < my || sy > innerHeight - my;
      sx = G.clamp(sx, mx, innerWidth - mx); sy = G.clamp(sy, my, innerHeight - my); if (off && sx < 250 && sy > innerHeight - 250 && !G.isTouch) sy = innerHeight - 250;
      m.e.style.display = d < (m.near || 6) || (m.range && d > m.range) ? 'none' : ''; m.e.style.transform = `translate(${sx.toFixed(1)}px,${sy.toFixed(1)}px) translate(-50%,-50%)`; m.e.style.opacity = off ? 0.95 : 0.85;
      m.e.lastChild.textContent = (m.label ? G.tx(m.label) + ' · ' : '') + (d >= 1000 ? (d / 1000).toFixed(1) + ' km' : Math.round(d) + ' m');
    }
  };

  // ------------------------------------------------------------ route + minimap
  ui.setRoute = function (x, z, o = {}) { ui.route = { x, z, pts: null, t: 0, veh: o.veh, keep: o.keep }; };
  ui.clearRoute = function () { ui.route = null; ui.updateTrail(); };
  // chevrons painted on the ground along the first stretch of the route
  ui.initTrail = function (scene) {
    const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute([0, 0, 0.95, -0.6, 0, -0.45, 0, 0, -0.05, 0.6, 0, -0.45], 3)); g.setIndex([0, 2, 1, 0, 3, 2]);
    ui.trailMat = new THREE.MeshBasicMaterial({ color: 0x9a6bff, transparent: true, opacity: 0.85, depthWrite: false, side: THREE.DoubleSide, fog: false, polygonOffset: true, polygonOffsetFactor: -10, polygonOffsetUnits: -10 });
    ui.trail = new THREE.InstancedMesh(g, ui.trailMat, 46); ui.trail.count = 0; ui.trail.frustumCulled = false; ui.trail.renderOrder = 5; scene.add(ui.trail);
  };
  const tObj = new THREE.Object3D();
  ui.updateTrail = function () {
    const tr = ui.trail; if (!tr) return; const r = ui.route, v = G.player.vehicle;
    if (!r || !r.pts || r.pts.length < 2 || (v && v.type === 'drone') || G.player.mode === 'script') { tr.count = 0; return; }
    let n = 0, next = 5, acc = 0; const p = r.pts;
    for (let i = 1; i < p.length && n < 46; i++) {
      const ax = p[i - 1][0], az = p[i - 1][1], dx = p[i][0] - ax, dz = p[i][1] - az, L = Math.hypot(dx, dz); if (L < 0.01) continue;
      while (next <= acc + L && n < 46) { const k = (next - acc) / L, x = ax + dx * k, z = az + dz * k; tObj.position.set(x, W.ground(x, z) + 0.2, z); tObj.rotation.set(0, Math.atan2(dx, dz), 0); tObj.updateMatrix(); tr.setMatrixAt(n++, tObj.matrix); next += 6.5; }
      acc += L;
    }
    tr.count = n; tr.instanceMatrix.needsUpdate = true;
  };
  ui.drawMinimap = function (dt) {
    const cv = $('mmc'), x = cv.getContext('2d'), S = cv.width, P = G.player, yaw = G.cam.yaw, v = P.vehicle;
    const sc = S / (v ? (v.type === 'drone' ? 620 : 330) : 230);
    if (ui.route) { const r = ui.route; r.t -= dt; if (r.t <= 0) { r.t = 0.8; const res = G.nav.route(P.pos.x, P.pos.z, r.x, r.z, {}); r.pts = res.pts; r.len = res.len; ui.updateTrail(); } if (!r.keep && Math.hypot(P.pos.x - r.x, P.pos.z - r.z) < 10) { ui.route = null; ui.updateTrail(); } }
    if (ui.trailMat) ui.trailMat.opacity = 0.62 + 0.25 * Math.sin(G.t * 4);
    x.save(); x.clearRect(0, 0, S, S); x.beginPath(); x.arc(S / 2, S / 2, S / 2, 0, 7); x.clip(); x.fillStyle = '#d9d4c5'; x.fillRect(0, 0, S, S);
    x.translate(S / 2, S / 2); x.rotate(yaw); x.scale(sc, sc); x.translate(-P.pos.x, -P.pos.z);
    if (W.mapBase) x.drawImage(W.mapBase, W.X0, W.Z0, W.X1 - W.X0, W.Z1 - W.Z0);
    if (ui.route && ui.route.pts) { const p = ui.route.pts; x.strokeStyle = '#7b3fe0'; x.lineWidth = 5 / sc; x.lineJoin = 'round'; x.lineCap = 'round'; x.globalAlpha = 0.85; x.beginPath(); x.moveTo(p[0][0], p[0][1]); for (let i = 1; i < p.length; i++) x.lineTo(p[i][0], p[i][1]); x.stroke(); x.globalAlpha = 1; }
    for (const vv of G.veh.list) { if (vv.rider || vv.type === 'drone') continue; x.fillStyle = vv.type === 'bike' ? '#0f9d8f' : '#5b2d90'; x.beginPath(); x.arc(vv.x, vv.z, 2.6 / sc, 0, 7); x.fill(); }
    for (const n of G.crowd.list) { if (!n.named || n.hidden) continue; x.fillStyle = '#ff7a59'; x.beginPath(); x.arc(n.x, n.z, 2.6 / sc, 0, 7); x.fill(); }
    x.restore();
    // markers (screen space, clamped to rim)
    const R = S / 2 - 12, cs = Math.cos(yaw), sn = Math.sin(yaw);
    for (const m of ui.marks) { if (m.hidden) continue; let dx = (m.x - P.pos.x) * sc, dz = (m.z - P.pos.z) * sc; let rx = dx * cs - dz * sn, ry = dx * sn + dz * cs; const d = Math.hypot(rx, ry); if (d > R) { if (m.range) continue; rx *= R / d; ry *= R / d; } x.fillStyle = m.color || '#e5b53b'; x.strokeStyle = '#1a1030'; x.lineWidth = 2; x.beginPath(); x.arc(S / 2 + rx, S / 2 + ry, 7, 0, 7); x.fill(); x.stroke(); x.font = '11px sans-serif'; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillStyle = '#000'; x.fillText(m.mm || '★', S / 2 + rx, S / 2 + ry + 0.5); }
    if (v && v.type === 'drone') { let dx = (v.homeX - P.pos.x) * sc, dz = (v.homeZ - P.pos.z) * sc; const rx = dx * cs - dz * sn, ry = dx * sn + dz * cs; x.fillStyle = '#fff'; x.beginPath(); x.arc(S / 2 + rx, S / 2 + ry, 5, 0, 7); x.fill(); }
    // player arrow
    x.save(); x.translate(S / 2, S / 2); x.rotate(yaw + Math.PI - P.heading); x.fillStyle = '#fff'; x.strokeStyle = '#4b2a7b'; x.lineWidth = 3; x.beginPath(); x.moveTo(0, -11); x.lineTo(8, 9); x.lineTo(0, 4); x.lineTo(-8, 9); x.closePath(); x.stroke(); x.fill(); x.restore();
    const n = $('mmN'), r2 = $('mmwrap').clientWidth / 2; n.style.transform = `translate(${(Math.sin(yaw) * r2).toFixed(1)}px,${(-Math.cos(yaw) * r2).toFixed(1)}px)`;
  };

  // ------------------------------------------------------------ HUD tick
  let zoneT = 0, zoneKey = '', lastHint = '';
  const ZN = { lower: ['下园', 'Lower Campus'], upper: ['上园', 'Upper Campus'], middle: ['中园 · 音乐学院', 'Middle Campus · School of Music'] };
  const WD = [['周一', 'Mon'], ['周二', 'Tue'], ['周三', 'Wed'], ['周四', 'Thu'], ['周五', 'Fri'], ['周六', 'Sat'], ['周日', 'Sun']];
  ui.updateHUD = function (dt) {
    const P = G.player, S = G.S(), sk = G.sky;
    $('ckTime').textContent = G.fmtTime(sk.hour); $('ckDay').textContent = G.tx(WD[(S.day - 1) % 7]) + ' · ' + L('第' + S.day + '天', 'Day ' + S.day);
    $('ckWx').textContent = sk.weather === 'rain' ? '🌧' : sk.night > 0.5 ? '🌙' : sk.weather === 'cloudy' ? '⛅' : '☀️';
    $('barSt').firstChild.style.width = (P.stamina * 100).toFixed(0) + '%'; $('barSt').style.opacity = P.stamina < 0.995 ? 1 : 0.35;
    const lv = ui.level(); $('lvl').innerHTML = `${L('适应力', 'Adaptability')} <b>Lv.${lv.lv}</b> · ${lv.name}`;
    const v = P.vehicle, sp = $('speed'); if (v) { sp.classList.remove('hidden'); sp.innerHTML = v.type === 'drone' ? `${Math.round(v.y - W.ground(v.x, v.z))}<small>m ${L('高度', 'ALT')}</small>` : `${Math.round(Math.abs(v.sp) * 3.6)}<small>km/h</small>`; } else sp.classList.add('hidden');
    const pr = $('prompt'), near = G.inter.near; if (near && !ui.busy() && !P.locked) { pr.classList.remove('hidden'); $('promptK').textContent = near.keyLabel || 'E'; $('promptT').textContent = typeof near.label === 'function' ? near.label() : G.tx(near.label); } else pr.classList.add('hidden');
    const hint = v ? (v.type === 'drone' ? 'drone' : 'veh') : 'foot';
    if (hint !== lastHint || ui._hl !== G.lang) { lastHint = hint; ui._hl = G.lang; const k = (a, b) => `<kbd>${a}</kbd>${b}`; $('keys').innerHTML = hint === 'foot' ? [k('WASD', L('移动', 'Move')), k('Shift', L('冲刺', 'Sprint')) + k('Space', L('跳', 'Jump')), k('E', L('互动', 'Interact')) + k('F', L('载具', 'Vehicle')), k('Tab', L('手机', 'Phone')) + k('M', L('地图', 'Map'))].join('<br>') : hint === 'veh' ? [k('W/S', L('加速/刹车', 'Throttle/Brake')), k('A/D', L('转向', 'Steer')), k('H', L('铃', 'Bell')) + k('F', L('下车', 'Exit'))].join('<br>') : [k('WASD', L('飞行', 'Fly')), k('Space', L('升', 'Up')) + k('C', L('降', 'Down')), k('Shift', L('加速', 'Boost')) + k('F', L('降落', 'Land'))].join('<br>'); $('keys').style.display = v ? 'none' : ''; if (v) { $('keys').style.display = ''; $('keys').style.bottom = '84px'; } else $('keys').style.bottom = ''; }
    zoneT -= dt; if (zoneT <= 0) {
      zoneT = 0.7; const z = W.zoneAt(P.pos.x, P.pos.z); let a = '', b = '';
      const nb = W.nearBuilding(P.pos.x, P.pos.z, 34, q => q.zh && (q.campus || /大运|体育/.test(q.zh)));
      if (nb) { a = L(nb.zh, nb.en || nb.zh); b = z ? G.tx(ZN[z]) : L(nb.en || '', nb.zh); }
      else if (z) { a = G.tx(ZN[z]); b = L(ZN[z][1], ZN[z][0]); }
      else { const e = G.nav.nearestEdge(P.pos.x, P.pos.z, { maxd: 40, pred: q => q.road.name }); const c = W.coverAt(P.pos.x, P.pos.z); if (e) { a = e.e.road.name; b = L('龙岗 · 大运', 'Longgang · Dayun'); } else if (c === 2 || c === 6) { a = L('大运山 · 神仙岭', 'Dayun Hill · Shenxian Ridge'); b = L('郊野径', 'Country trail'); } else { a = L('龙岗 · 大运', 'Longgang · Dayun'); b = L('深圳', 'Shenzhen'); } }
      const key = a + '|' + b; if (key !== zoneKey) { zoneKey = key; $('zoneA').textContent = a; $('zoneB').textContent = b; $('zone').style.opacity = 1; clearTimeout(ui._zt); ui._zt = setTimeout(() => $('zone').style.opacity = 0.55, 4500); G.emit('zone', { z, nb }); }
    }
  };
  const LVN = [['初来乍到', 'Newcomer'], ['渐入佳境', 'Settling In'], ['如鱼得水', 'At Home'], ['校园达人', 'Campus Pro'], ['神仙岭居民', 'Ridge Local'], ['港中深之星', 'CUHK-SZ Star']];
  ui.level = function () { const xp = G.S().xp, lv = Math.min(LVN.length, 1 + Math.floor(xp / 120)); return { lv, name: G.tx(LVN[lv - 1]), frac: (xp % 120) / 120 }; };
  ui.gain = function (gains, quiet) { const S = G.S(), before = ui.level().lv; let tot = 0; for (const k in gains) { S.stats[k] = (S.stats[k] || 0) + gains[k]; tot += gains[k]; } S.xp += tot; if (!quiet) ui.toast(Object.entries(gains).map(([k, v]) => `${STAT[k][0]} ${L(STAT[k][1], STAT[k][2])} <b>+${v}</b>`).join(' &nbsp; ')); const after = ui.level(); if (after.lv > before) { G.audio.sfx('level'); ui.banner(L('适应力提升', 'LEVEL UP'), 'Lv.' + after.lv + ' ' + after.name, ''); } G.save.store(); };

  // ------------------------------------------------------------ full map
  ui.openMap = function (o = {}) {
    if (ui.mapOpen) return; ui.mapOpen = true; ui.push();
    const root = h(`<div class="mapwrap"><canvas></canvas><div class="maptop"><h3>🗺 ${L('校园地图', 'Campus Map')}</h3><span class="sp"></span><button class="mapbtn" data-a="me">◎</button><button class="mapbtn" data-a="in">＋</button><button class="mapbtn" data-a="out">－</button><button class="mapbtn" data-a="x">✕</button></div><div class="legend"><i style="background:#f3c66b"></i>${L('港中大（深圳）楼宇', 'CUHK-Shenzhen')}<br><i style="background:#cfcfd6"></i>${L('周边建筑', 'Neighbours')}<br><i style="background:#c98a6b"></i>${L('绿道', 'Greenway')}<br><i style="background:#7b3fe0"></i>${L('导航路线', 'Route')}</div><div class="mapinfo" style="display:none"></div></div>`);
    $('overlay').appendChild(root); const cv = root.querySelector('canvas'), x = cv.getContext('2d'), info = root.querySelector('.mapinfo'), P = G.player;
    let sc = 0.75, ox = P.pos.x, oz = P.pos.z, sel = null, drag = null, dpr = Math.min(2, devicePixelRatio || 1);
    const draw = () => {
      cv.width = cv.clientWidth * dpr; cv.height = cv.clientHeight * dpr; const w = cv.width, hh = cv.height, s = sc * dpr;
      x.setTransform(1, 0, 0, 1, 0, 0); x.fillStyle = '#e6e1d2'; x.fillRect(0, 0, w, hh); x.setTransform(s, 0, 0, s, w / 2 - ox * s, hh / 2 - oz * s); W.drawMap(x, s, { hi: sel });
      if (ui.route && ui.route.pts) { const p = ui.route.pts; x.strokeStyle = '#7b3fe0'; x.lineWidth = 5 / s; x.lineJoin = 'round'; x.beginPath(); x.moveTo(p[0][0], p[0][1]); for (let i = 1; i < p.length; i++) x.lineTo(p[i][0], p[i][1]); x.stroke(); }
      x.setTransform(1, 0, 0, 1, 0, 0); const T = (wx, wz) => [w / 2 + (wx - ox) * s, hh / 2 + (wz - oz) * s];
      x.textAlign = 'center'; x.textBaseline = 'middle';
      if (sc > 0.33) for (const l of W.labels) { if (!l.major && sc < 0.8) continue; const [px, py] = T(l.x, l.z); if (px < -50 || py < -20 || px > w + 50 || py > hh + 20) continue; x.font = `700 ${Math.round((l.major ? 13 : 11) * dpr)}px ${getComputedStyle(document.body).fontFamily}`; x.lineWidth = 3 * dpr; x.strokeStyle = 'rgba(255,255,255,.9)'; const t = L(l.zh, l.en || l.zh); x.strokeText(t, px, py); x.fillStyle = l.peak ? '#5a4a2a' : '#3a2462'; x.fillText(t, px, py); }
      for (const m of ui.marks) { if (m.hidden) continue; const [px, py] = T(m.x, m.z); x.font = `${22 * dpr}px serif`; x.fillStyle = '#000'; x.fillText(m.icon || '📍', px, py - 12 * dpr); x.fillStyle = m.color || '#e5b53b'; x.beginPath(); x.arc(px, py, 5 * dpr, 0, 7); x.fill(); x.strokeStyle = '#1a1030'; x.lineWidth = 2 * dpr; x.stroke(); }
      const [px, py] = T(P.pos.x, P.pos.z); x.save(); x.translate(px, py); x.rotate(Math.PI - P.heading); x.fillStyle = '#fff'; x.strokeStyle = '#4b2a7b'; x.lineWidth = 3 * dpr; x.beginPath(); x.moveTo(0, -13 * dpr); x.lineTo(9 * dpr, 10 * dpr); x.lineTo(0, 5 * dpr); x.lineTo(-9 * dpr, 10 * dpr); x.closePath(); x.stroke(); x.fill(); x.restore();
    };
    const toWorld = (cx, cy) => [ox + (cx - cv.clientWidth / 2) / sc, oz + (cy - cv.clientHeight / 2) / sc];
    const pick = (cx, cy) => {
      const [wx, wz] = toWorld(cx, cy), b = W.buildingAt(wx, wz); sel = b && b.zh ? b : null; info.style.display = '';
      const d = sel && G.content && G.content.places ? G.content.places[(sel.zh.match(/^(.*书院)/) || [0, sel.zh])[1]] : null;
      info.innerHTML = sel ? `<h4>${esc(L(sel.zh, sel.en || sel.zh))}</h4><small>${esc(L(sel.en || '', sel.zh))}</small><div style="margin-top:6px">${d ? G.tx(d) : sel.campus ? L('港中大（深圳）校园建筑。', 'A CUHK-Shenzhen campus building.') : L('校园周边建筑。', 'A neighbouring building.')}</div>` : `<h4>${L('自定义地点', 'Custom point')}</h4><small>${Math.round(wx)}, ${Math.round(wz)}</small>`;
      const btn = h(`<button class="btn gold">🧭 ${L('导航到这里', 'Navigate here')}</button>`); btn.onclick = () => { const t = sel ? W.door(sel) : { x: wx, z: wz }; ui.setRoute(t.x, t.z); ui.route.t = 0; ui.drawMinimap(0); G.audio.sfx('ok'); ui.toast(L('已设置导航，看小地图上的紫色路线。', 'Route set — follow the purple line on the minimap.')); close(); }; info.appendChild(btn);
      if (ui.route) { const c = h(`<button class="btn ghost" style="margin-left:8px">${L('取消导航', 'Clear route')}</button>`); c.onclick = () => { ui.clearRoute(); draw(); c.remove(); }; info.appendChild(c); }
      draw();
    };
    const close = () => { if (!ui.mapOpen) return; ui.mapOpen = false; root.remove(); ui.pop(); G.off('key', key); window.removeEventListener('resize', draw); };
    const key = c => { if (c === 'KeyM' || c === 'Escape') close(); };
    setTimeout(() => G.on('key', key), 50); window.addEventListener('resize', draw);
    cv.addEventListener('pointerdown', e => { drag = { x: e.clientX, y: e.clientY, ox, oz, moved: false }; cv.setPointerCapture(e.pointerId); });
    cv.addEventListener('pointermove', e => { if (!drag) return; const dx = e.clientX - drag.x, dy = e.clientY - drag.y; if (Math.abs(dx) + Math.abs(dy) > 5) drag.moved = true; ox = drag.ox - dx / sc; oz = drag.oz - dy / sc; draw(); });
    cv.addEventListener('pointerup', e => { if (drag && !drag.moved) pick(e.clientX, e.clientY); drag = null; });
    cv.addEventListener('wheel', e => { sc = G.clamp(sc * (e.deltaY < 0 ? 1.2 : 1 / 1.2), 0.22, 4); draw(); }, { passive: true });
    root.querySelectorAll('.mapbtn').forEach(b => b.onclick = () => { const a = b.dataset.a; if (a === 'x') return close(); if (a === 'in') sc = Math.min(4, sc * 1.35); if (a === 'out') sc = Math.max(0.22, sc / 1.35); if (a === 'me') { ox = P.pos.x; oz = P.pos.z; } draw(); });
    draw(); ui._mapClose = close;
  };

  // ------------------------------------------------------------ phone
  ui.openPhone = function (app) {
    if (ui.phoneOpen || ui.busy()) return; ui.phoneOpen = true; ui.push(); G.audio.sfx('msg');
    const root = h(`<div class="scrim" style="background:rgba(10,5,20,.45)"><div class="phone"><div class="phTop"><span class="t"></span><span>📶 CUHK(SZ) 🔋</span></div><div class="phNav" style="display:none"><button>‹ ${L('返回', 'Back')}</button><h4></h4></div><div class="phBody"></div></div></div>`);
    $('overlay').appendChild(root); const body = root.querySelector('.phBody'), nav = root.querySelector('.phNav'); root.querySelector('.t').textContent = G.fmtTime(G.sky.hour);
    const close = () => { if (!ui.phoneOpen) return; ui.phoneOpen = false; root.remove(); ui.pop(); G.off('key', key); };
    const key = c => { if (c === 'Tab' || c === 'KeyP' || c === 'Escape') close(); };
    setTimeout(() => G.on('key', key), 80); root.onclick = e => { if (e.target === root) close(); };
    const home = () => {
      nav.style.display = 'none'; const S = G.S(), cur = G.missions.current();
      const apps = [['quests', '🎯', L('任务', 'Quests'), '#6a3fa8'], ['map', '🗺', L('地图', 'Map'), '#2f8f6f'], ['growth', '🌱', L('成长', 'Growth'), '#d9862f'], ['album', '🏅', L('图鉴', 'Collection'), '#b9483f'], ['guide', '📖', L('校园指南', 'Guide'), '#3b78c9'], ['bus', '🚌', L('校巴快线', 'Shuttle'), '#19a595'], ['drone', '🛸', L('无人机', 'Drone'), '#55606e'], ['photo', '📷', L('拍照', 'Photo'), '#c7578f'], ['rest', '🛏', L('休息', 'Rest'), '#4a5a9a'], ['settings', '⚙️', L('设置', 'Settings'), '#5a5a66']];
      body.innerHTML = `<div class="sec">${esc(S.name || '')} · ${G.tx(G.content.colleges[S.college].name)}</div>` + (cur ? `<div class="li cur"><span class="em">${cur.icon}</span><div><b>${G.tx(cur.title)}</b><small>${G.tx(cur.where)}</small></div></div>` : '') + '<div class="apps"></div>';
      const gridEl = body.querySelector('.apps'); for (const [id, ic, nm, bg] of apps) { const b = h(`<button class="app"><i style="background:${bg}">${ic}</i>${nm}</button>`); b.onclick = () => { G.audio.sfx('ui'); open(id); }; gridEl.appendChild(b); }
    };
    const page = (title) => { nav.style.display = ''; nav.querySelector('h4').textContent = title; nav.querySelector('button').onclick = () => { G.audio.sfx('back'); home(); }; body.innerHTML = ''; };
    const open = id => {
      const S = G.S();
      if (id === 'map') { close(); ui.openMap(); return; }
      if (id === 'photo') { close(); G.photoMode(); return; }
      if (id === 'drone') { if (!S.flags.drone) { ui.toast(L('加入无人机协会后解锁（去社团招新看看）。', 'Join the Drone Society at the club fair to unlock.')); return; } if (G.missions.active || G.player.vehicle) { ui.toast(L('现在不方便起飞。', "Can't launch right now.")); return; } close(); G.veh.launchDrone(); ui.toast(L('无人机已起飞：WASD 飞行，Space/C 升降，F 降落。', 'Drone up: WASD fly, Space/C up/down, F to land.')); return; }
      if (id === 'quests') { page(L('任务', 'Quests')); G.missions.renderList(body, close); return; }
      if (id === 'growth') { page(L('成长档案', 'Growth')); ui.renderGrowth(body); return; }
      if (id === 'album') { page(L('图鉴', 'Collection')); G.missions.renderAlbum(body, close); return; }
      if (id === 'guide') { page(L('校园指南', 'Campus Guide')); for (const g of G.content.guide) body.appendChild(h(`<div class="li"><span class="em">${g.icon}</span><div><b>${G.tx(g.t)}</b>${G.tx(g.d)}</div></div>`)); body.appendChild(h(`<div class="li"><span class="em">ℹ️</span><div><small>${L('信息整理自公开资料，可能与现状有出入，请以学校官网及各部门通知为准。', 'Compiled from public sources and may be out of date — always check the official university website.')}</small></div></div>`)); return; }
      if (id === 'bus') { page(L('校巴快线', 'Campus Shuttle')); if (G.missions.active) { body.innerHTML = `<div class="li"><span class="em">⏳</span><div>${L('任务进行中，先完成手头的事吧。', 'Finish your current mission first.')}</div></div>`; return; } for (const s of G.content.stops) { const li = h(`<div class="li"><span class="em">🚏</span><div><b>${G.tx(s.name)}</b><small>${G.tx(s.d)}</small></div><button class="go">${L('上车', 'Ride')}</button></div>`); li.querySelector('.go').onclick = () => { close(); G.fastTravel(s); }; body.appendChild(li); } return; }
      if (id === 'rest') { page(L('休息一下', 'Rest')); if (G.missions.active) { body.innerHTML = `<div class="li"><span class="em">⏳</span><div>${L('任务进行中。', 'A mission is in progress.')}</div></div>`; return; } for (const [hh, ic, nm] of [[8, '🌅', L('到早上 8:00', 'Until 8:00')], [14, '☀️', L('到下午 14:00', 'Until 14:00')], [18.4, '🌇', L('到傍晚 18:30', 'Until 18:30')], [21, '🌙', L('到晚上 21:00', 'Until 21:00')]]) { const li = h(`<div class="li"><span class="em">${ic}</span><div><b>${nm}</b></div><button class="go">${L('确定', 'Go')}</button></div>`); li.querySelector('.go').onclick = async () => { close(); await ui.fade(true, 500); if (hh <= G.sky.hour) { G.S().day++; } G.sky.setHour(hh); G.player.stamina = 1; await G.sleep(350); await ui.fade(false, 600); ui.toast(L('精神饱满！', 'Feeling refreshed!')); }; body.appendChild(li); } return; }
      if (id === 'settings') { page(L('设置', 'Settings')); ui.renderSettings(body, close); return; }
    };
    if (app) open(app); else home();
  };
  ui.renderSettings = function (body, close) {
    const o = G.S().opt, row = (label, ctl) => { const r = h(`<div class="set"><span>${label}</span></div>`); r.appendChild(ctl); body.appendChild(r); return ctl; };
    const lang = row('语言 / Language', h(`<select><option value="zh">中文</option><option value="en">English</option></select>`)); lang.value = G.lang; lang.onchange = () => { G.setLang(lang.value); if (close) close(); };
    const q = row(L('画质', 'Graphics'), h(`<select><option value="auto">${L('自动', 'Auto')}</option><option value="low">${L('流畅', 'Low')}</option><option value="med">${L('均衡', 'Medium')}</option><option value="high">${L('精致', 'High')}</option></select>`)); q.value = o.quality; q.onchange = () => { o.quality = q.value; G.applyQuality(); G.save.store(); };
    const mu = row(L('音乐', 'Music'), h(`<input type="range" min="0" max="1" step="0.05">`)); mu.value = o.music; mu.oninput = () => { o.music = +mu.value; G.audio.applyVol(); G.save.store(); };
    const sf = row(L('音效', 'Sound FX'), h(`<input type="range" min="0" max="1" step="0.05">`)); sf.value = o.sfx; sf.oninput = () => { o.sfx = +sf.value; G.audio.applyVol(); G.save.store(); };
    const se = row(L('镜头灵敏度', 'Look sensitivity'), h(`<input type="range" min="0.3" max="2.5" step="0.1">`)); se.value = o.sens; se.oninput = () => { o.sens = +se.value; G.save.store(); };
    const iv = row(L('反转 Y 轴', 'Invert Y'), h(`<button>${o.invertY ? 'ON' : 'OFF'}</button>`)); iv.onclick = () => { o.invertY = !o.invertY; iv.textContent = o.invertY ? 'ON' : 'OFF'; G.save.store(); };
    if (G.mode === 'play') { const sv = row(L('存档', 'Save game'), h(`<button>${L('立即保存', 'Save now')}</button>`)); sv.onclick = () => { G.saveNow(); ui.toast(L('已保存。', 'Saved.')); }; const tt = row(L('回到标题', 'Back to title'), h(`<button>${L('退出', 'Quit')}</button>`)); tt.onclick = () => { G.saveNow(); location.reload(); }; }
    body.appendChild(h(`<div class="sec">${L('关于', 'ABOUT')}</div>`)); body.appendChild(h(`<div style="font-size:11px;opacity:.7;line-height:1.6">${L('《神仙岭下》是以港中大（深圳）真实校园为蓝本的原创开放世界校园游戏。', 'Campus Odyssey is an original open-world game modelled on the real CUHK-Shenzhen campus.')}<br>${W ? esc(window.CAMPUS.meta.attribution) : ''}</div>`));
  };
  ui.radar = function (cv, stats, o = {}) {
    const x = cv.getContext('2d'), S = cv.width, c = S / 2, R = S * 0.34, keys = Object.keys(STAT), max = Math.max(60, ...keys.map(k => stats[k] || 0)) * 1.05;
    x.clearRect(0, 0, S, S); x.lineWidth = 1.5;
    for (let r = 1; r <= 4; r++) { x.beginPath(); keys.forEach((k, i) => { const a = -Math.PI / 2 + i / keys.length * G.TAU, px = c + Math.cos(a) * R * r / 4, py = c + Math.sin(a) * R * r / 4; i ? x.lineTo(px, py) : x.moveTo(px, py); }); x.closePath(); x.strokeStyle = o.grid || 'rgba(255,255,255,.22)'; x.stroke(); }
    x.beginPath(); keys.forEach((k, i) => { const a = -Math.PI / 2 + i / keys.length * G.TAU, v = Math.max(0.06, (stats[k] || 0) / max), px = c + Math.cos(a) * R * v, py = c + Math.sin(a) * R * v; i ? x.lineTo(px, py) : x.moveTo(px, py); }); x.closePath(); x.fillStyle = 'rgba(229,181,59,.45)'; x.fill(); x.strokeStyle = '#e5b53b'; x.lineWidth = 3; x.stroke();
    x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillStyle = o.text || '#fff'; x.font = `700 ${Math.round(S * 0.045)}px sans-serif`;
    keys.forEach((k, i) => { const a = -Math.PI / 2 + i / keys.length * G.TAU; x.fillText(STAT[k][0] + ' ' + L(STAT[k][1], STAT[k][2]), c + Math.cos(a) * (R + S * 0.1), c + Math.sin(a) * (R + S * 0.075) - S * 0.012); x.fillStyle = '#e5b53b'; x.fillText(String(stats[k] || 0), c + Math.cos(a) * (R + S * 0.1), c + Math.sin(a) * (R + S * 0.075) + S * 0.04); x.fillStyle = o.text || '#fff'; });
  };
  ui.renderGrowth = function (body) {
    const S = G.S(), lv = ui.level(); body.appendChild(h(`<div class="li cur"><span class="em">🌟</span><div><b>Lv.${lv.lv} ${lv.name}</b><small>${L('适应力经验', 'Adaptability XP')} ${S.xp} · ${L('完成任务', 'Missions')} ${Object.keys(S.done).length}</small><div class="bar" style="width:220px;margin-top:6px"><i style="width:${lv.frac * 100}%;background:linear-gradient(90deg,#e5b53b,#f6d57a)"></i></div></div></div>`));
    const cv = h(`<canvas width="640" height="560" style="width:100%"></canvas>`); body.appendChild(cv); ui.radar(cv, S.stats);
    const btn = h(`<button class="btn gold" style="width:100%;margin-top:6px">📊 ${L('生成我的适应力报告', 'Generate my report card')}</button>`); btn.onclick = () => ui.report(); body.appendChild(btn);
  };
  // shareable report card (PNG)
  ui.report = function () {
    const S = G.S(), cv = G.canvas(1080, 1500), x = cv.getContext('2d'), g = x.createLinearGradient(0, 0, 0, 1500); g.addColorStop(0, '#3a2064'); g.addColorStop(1, '#150b26'); x.fillStyle = g; x.fillRect(0, 0, 1080, 1500);
    x.fillStyle = 'rgba(229,181,59,.12)'; for (let i = 0; i < 40; i++) { x.beginPath(); x.arc(Math.random() * 1080, Math.random() * 1500, 2 + Math.random() * 60, 0, 7); x.fill(); }
    x.textAlign = 'center'; x.fillStyle = '#e5b53b'; x.font = '600 30px sans-serif'; x.fillText('CAMPUS ODYSSEY · CUHK-SHENZHEN', 540, 110);
    x.fillStyle = '#fff'; x.font = '900 104px "Songti SC","STSong","SimSun",serif'; x.fillText(L('神仙岭下', 'Campus Odyssey'), 540, 230);
    x.font = '700 44px sans-serif'; x.fillText(L('适应力报告', 'Adaptability Report'), 540, 310);
    const lv = ui.level(); x.font = '600 34px sans-serif'; x.fillStyle = '#f6d57a'; x.fillText(`${S.name || L('同学', 'Student')} · ${G.tx(G.content.colleges[S.college].name)} · Lv.${lv.lv} ${lv.name}`, 540, 380);
    const rc = G.canvas(820, 760); ui.radar(rc, S.stats); x.drawImage(rc, 130, 400);
    const done = Object.keys(S.done).length, found = Object.keys(S.found).length, cats = Object.keys(S.cats).length;
    const cells = [[done + '/' + G.missions.total(), L('完成任务', 'Missions')], [found + '/' + G.content.landmarks.length, L('地标打卡', 'Landmarks')], [cats + '/' + G.content.cats.length, L('校园猫', 'Campus cats')], [S.day, L('在校天数', 'Days')]];
    cells.forEach(([v, k], i) => { const cx = 150 + i * 260; x.fillStyle = 'rgba(255,255,255,.08)'; x.beginPath(); x.roundRect ? x.roundRect(cx - 110, 1190, 220, 150, 24) : x.rect(cx - 110, 1190, 220, 150); x.fill(); x.fillStyle = '#fff'; x.font = '800 56px sans-serif'; x.fillText(String(v), cx, 1262); x.font = '500 26px sans-serif'; x.fillStyle = '#f6d57a'; x.fillText(k, cx, 1312); });
    x.fillStyle = 'rgba(255,255,255,.6)'; x.font = '500 24px sans-serif'; x.fillText(L('博文约礼 · 结合传统与现代 融会中国与西方', 'Through learning and temperance to virtue'), 540, 1420); x.fillText(new Date().toLocaleDateString(), 540, 1460);
    const p = ui.panel({ title: L('我的适应力报告', 'My Report Card'), icon: '📊', width: 520, close: true, dark: true }); const img = new Image(); img.src = cv.toDataURL('image/png'); img.style.cssText = 'width:100%;border-radius:14px;display:block'; p.body.appendChild(img);
    p.button(L('保存图片', 'Download'), 'gold', () => { const a = document.createElement('a'); a.href = img.src; a.download = 'campus-odyssey-report.png'; a.click(); });
  };

  // ------------------------------------------------------------ title & character creation
  ui.showTitle = function () {
    const t = $('title'); t.classList.remove('hidden'); $('hud').classList.add('hidden');
    $('tZh').textContent = L('神仙岭下', '神仙岭下'); $('tEn').textContent = 'CAMPUS ODYSSEY';
    $('tSub').innerHTML = L('一座真实校园，一段属于你的第一周。<br>在港中大（深圳）自由漫游：赶早八、泡图书馆、跑彩色跑、赴高桌晚宴、和校长面对面。', 'A real campus. Your very first week.<br>Roam CUHK-Shenzhen freely — sprint to an 8:30 class, learn the library, run the Color Run, dress up for High Table and meet the President.');
    const bt = $('tBtns'); bt.innerHTML = ''; const add = (label, sub, cls, fn) => { const b = h(`<button class="tb ${cls}">${label}<small>${sub}</small></button>`); b.onclick = () => { G.audio.init(); G.audio.sfx('ok'); fn(); }; bt.appendChild(b); };
    if (G.save.has()) add(L('继续旅程', 'Continue'), G.S().name ? esc(G.S().name) + ' · ' + L('第' + G.S().day + '天', 'Day ' + G.S().day) : '', 'main', () => G.startGame(false));
    add(L('新的旅程', 'New Journey'), L('新生 / 交换生', 'Freshman / Exchange'), G.save.has() ? '' : 'main', async () => { if (G.save.has() && !(await ui.confirm(L('开始新旅程会覆盖现有存档，确定吗？', 'Starting over will overwrite your save. Continue?')))) return; ui.create(); });
    add(L('校园开放日', 'Open Day Tour'), L('自由参观 · 无任务', 'Free roam'), '', () => G.startGame(true, { visitor: true }));
    add(G.lang === 'zh' ? 'English' : '中文', L('切换语言', 'Switch language'), '', () => { G.setLang(G.lang === 'zh' ? 'en' : 'zh'); ui.showTitle(); });
    $('tFoot').innerHTML = L('原创校园开放世界游戏 · 地图数据 © OpenStreetMap 贡献者 · 部分设施信息整理自公开资料，以学校官方为准', 'An original open-world campus game · Map data © OpenStreetMap contributors · Facility details compiled from public sources');
  };
  ui.hideTitle = function () { $('title').classList.add('hidden'); };
  ui.create = function () {
    const S = G.S(), C = G.content.colleges, P = G.PAL, hex = n => '#' + n.toString(16).padStart(6, '0');
    const st = { name: '', identity: 'freshman', college: 'shaw', look: { skin: 0, hair: 0, top: 0, pants: 0, style: 0 } };
    $('title').classList.add('hidden');
    const p = ui.panel({ title: L('新生报到', 'Check-in'), sub: L('创建你的角色', 'Create your character'), icon: '📝', width: 860 });
    p.body.innerHTML = `<div class="cc"><div>
      <label>${L('你的名字', 'YOUR NAME')}</label><input type="text" maxlength="12" id="ccName" placeholder="${L('例如：小深', 'e.g. Alex')}">
      <label>${L('你的身份', 'YOU ARE')}</label><div class="seg" id="ccId"><button data-v="freshman" class="sel">🎒 ${L('大一新生', 'Freshman')}</button><button data-v="exchange">✈️ ${L('交换生', 'Exchange student')}</button></div>
      <label>${L('外观', 'LOOK')}</label>
      <div class="sw" id="ccSkin">${P.SKIN.map((c, i) => `<button data-i="${i}" style="background:${hex(c)}"></button>`).join('')}</div><div style="height:6px"></div>
      <div class="sw" id="ccHair">${P.HAIR.map((c, i) => `<button data-i="${i}" style="background:${hex(c)}"></button>`).join('')}</div><div style="height:6px"></div>
      <div class="sw" id="ccTop">${P.TOPS.map((c, i) => `<button data-i="${i}" style="background:${hex(c)}"></button>`).join('')}</div>
      <div class="seg" style="margin-top:8px" id="ccStyle"><button data-v="0" class="sel">${L('短发', 'Short hair')}</button><button data-v="1">${L('长发', 'Long hair')}</button></div>
      </div><div><label>${L('选择书院（你的家）', 'CHOOSE YOUR COLLEGE (YOUR HOME)')}</label><div class="grid g2" id="ccCol"></div>
      <div class="note" id="ccNote"></div></div></div>`;
    const colEl = p.body.querySelector('#ccCol');
    for (const k in C) { const c = C[k]; if (c.grad) continue; const b = h(`<button class="col ${k === st.college ? 'sel' : ''}" data-k="${k}"><b><i style="background:${c.color}"></i>${G.tx(c.name)}</b>${G.tx(c.tag)}</button>`); colEl.appendChild(b); }
    const sync = () => {
      p.body.querySelectorAll('#ccCol .col').forEach(b => b.classList.toggle('sel', b.dataset.k === st.college));
      p.body.querySelectorAll('#ccId button').forEach(b => b.classList.toggle('sel', b.dataset.v === st.identity)); p.body.querySelectorAll('#ccStyle button').forEach(b => b.classList.toggle('sel', +b.dataset.v === st.look.style));
      for (const [id, key] of [['ccSkin', 'skin'], ['ccHair', 'hair'], ['ccTop', 'top']]) p.body.querySelectorAll('#' + id + ' button').forEach(b => b.classList.toggle('sel', +b.dataset.i === st.look[key]));
      p.body.querySelector('#ccNote').innerHTML = `<b>${G.tx(C[st.college].name)}</b> — ${G.tx(C[st.college].d)}<br>${st.identity === 'exchange' ? L('✈️ 交换生模式：剧情会多一些跨文化适应的小提示。', '✈️ Exchange mode: the story adds a few cross-cultural tips.') : L('🎒 新生模式：从报到第一天开始你的大学生活。', '🎒 Freshman mode: your university life starts at check-in.')}`;
      G.player.char.setLook(st.look);
    };
    p.body.addEventListener('click', e => { const b = e.target.closest('button'); if (!b) return; G.audio.sfx('ui'); if (b.dataset.k) st.college = b.dataset.k; else if (b.parentElement.id === 'ccId') st.identity = b.dataset.v; else if (b.parentElement.id === 'ccStyle') st.look.style = +b.dataset.v; else if (b.parentElement.id === 'ccSkin') st.look.skin = +b.dataset.i; else if (b.parentElement.id === 'ccHair') st.look.hair = +b.dataset.i; else if (b.parentElement.id === 'ccTop') st.look.top = +b.dataset.i; sync(); });
    sync();
    p.button(L('返回', 'Back'), 'ghost', () => { p.close(); ui.showTitle(); });
    p.button(L('开始大学生活 →', 'Begin →'), 'gold', () => { st.name = (p.body.querySelector('#ccName').value || '').trim() || L('小深', 'Alex'); p.close(); G.save.reset(); Object.assign(G.S(), { name: st.name, identity: st.identity, college: st.college, look: st.look, started: true }); G.save.store(); G.startGame(true); });
  };

  // ------------------------------------------------------------ touch controls
  ui.initTouch = function () {
    document.body.classList.add('touch'); $('touch').classList.remove('hidden');
    const joy = $('joy'), knob = $('joyK'); let jid = null, jc = null;
    const setJ = (cx, cy) => { let dx = cx - jc.x, dy = cy - jc.y; const m = Math.hypot(dx, dy), R = 46; if (m > R) { dx *= R / m; dy *= R / m; } knob.style.transform = `translate(${dx}px,${dy}px)`; I.joy.x = dx / R; I.joy.y = -dy / R; I.joy.on = true; };
    joy.addEventListener('touchstart', e => { const t = e.changedTouches[0]; jid = t.identifier; const r = joy.getBoundingClientRect(); jc = { x: r.left + r.width / 2, y: r.top + r.height / 2 }; setJ(t.clientX, t.clientY); e.preventDefault(); }, { passive: false });
    joy.addEventListener('touchmove', e => { for (const t of e.changedTouches) if (t.identifier === jid) setJ(t.clientX, t.clientY); e.preventDefault(); }, { passive: false });
    const endJ = e => { for (const t of e.changedTouches) if (t.identifier === jid) { jid = null; I.joy.on = false; I.joy.x = I.joy.y = 0; knob.style.transform = ''; } };
    joy.addEventListener('touchend', endJ); joy.addEventListener('touchcancel', endJ);
    document.querySelectorAll('#touch button').forEach(b => { const k = b.dataset.b; b.addEventListener('touchstart', e => { I.press(k); G.audio.init(); e.preventDefault(); }, { passive: false }); b.addEventListener('touchend', e => { I.release(k); e.preventDefault(); }, { passive: false }); });
    // drag anywhere else on the canvas to look around; swipe gestures for runner mode
    const gl = $('gl'); let lid = null, lx = 0, ly = 0, sx = 0, sy = 0;
    gl.addEventListener('touchstart', e => { const t = e.changedTouches[0]; if (lid === null) { lid = t.identifier; lx = sx = t.clientX; ly = sy = t.clientY; } }, { passive: true });
    gl.addEventListener('touchmove', e => { for (const t of e.changedTouches) if (t.identifier === lid) { I.lookX += (t.clientX - lx) * 2.2; I.lookY += (t.clientY - ly) * 2.2; lx = t.clientX; ly = t.clientY; I.lastLook = G.t; } }, { passive: true });
    gl.addEventListener('touchend', e => { for (const t of e.changedTouches) if (t.identifier === lid) { lid = null; const dx = t.clientX - sx, dy = t.clientY - sy; if (G.swipe && Math.hypot(dx, dy) > 34) G.swipe(Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? 'right' : 'left') : (dy > 0 ? 'down' : 'up')); } }, { passive: true });
  };
  ui.init = function () {
    $('mmwrap').onclick = () => { if (!ui.busy() && G.mode === 'play') ui.openMap(); };
    ui.initTrail(G.scene);
    if (G.isTouch) ui.initTouch();
    $('mmHint').textContent = G.isTouch ? '' : 'M';
  };
})();
