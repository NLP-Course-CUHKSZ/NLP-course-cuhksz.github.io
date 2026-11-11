/* mission framework + the "first week" story */
(function () {
  'use strict';
  const G = window.G, W = G.world, ui = G.ui, L = G.L, C = G.content;
  const M = G.missions = { defs: {}, order: [], active: null, starts: [], waiters: [], tickers: [], quiet: false };
  class Abort extends Error { }
  M.Abort = Abort;

  M.define = function (id, def) { def.id = id; M.defs[id] = def; M.order.push(id); };
  M.total = () => M.order.filter(id => !M.defs[id].hidden).length;
  M.isDone = id => !!G.S().done[id];
  M.avail = function (d) { if (G.visitor) return !!d.open && !M.isDone(d.id); if (M.isDone(d.id) && !d.repeat) return false; if (d.flag && !G.S().flags[d.flag]) return false; return (d.need || []).every(M.isDone); };
  M.current = function () { if (M.active) return M.active.def; for (const id of M.order) { const d = M.defs[id]; if (!d.side && !M.isDone(id) && M.avail(d)) return d; } return null; };

  // ---------------------------------------------------------------- per-frame
  M.update = function (dt) {
    for (let i = M.waiters.length - 1; i >= 0; i--) { const w = M.waiters[i]; let r; try { r = w.pred(dt); } catch (e) { M.waiters.splice(i, 1); w.rej(e); continue; } if (r) { M.waiters.splice(i, 1); w.res(r); } }
    for (const t of M.tickers.slice()) t(dt);
    C.update(dt); C.chatterTick(dt);
  };
  M.until = pred => new Promise((res, rej) => M.waiters.push({ pred, res, rej }));
  M.tick = fn => { M.tickers.push(fn); return () => { const i = M.tickers.indexOf(fn); if (i >= 0) M.tickers.splice(i, 1); }; };

  // ---------------------------------------------------------------- start markers
  M.refresh = function () {
    for (const s of M.starts) { G.inter.remove(s.inter); s.mark.remove(); } M.starts = [];
    if (M.active || G.mode !== 'play') return;
    for (const id of M.order) {
      const d = M.defs[id]; if (!M.avail(d)) continue; const p = C.pos(typeof d.at === 'function' ? d.at() : d.at); if (!p) continue;
      const col = d.side ? 0x19b5a5 : 0xe5b53b, beacon = G.fx.beacon(p.x, p.z, { color: col, icon: d.icon, r: 1.7 });
      const inter = G.inter.add({ x: p.x, z: p.z, r: 2.6, beacon, label: () => (d.verb ? G.tx(d.verb) : L('开始', 'Start')) + ' · ' + G.tx(d.title), act: () => M.start(id) });
      const mark = ui.mark({ x: p.x, z: p.z, icon: d.icon, label: d.title, color: d.side ? '#19b5a5' : '#e5b53b', mm: d.side ? '◆' : '★', range: d.side ? 260 : 0 });
      M.starts.push({ id, inter, mark });
    }
  };
  M.clearStarts = function () { for (const s of M.starts) { G.inter.remove(s.inter); s.mark.remove(); } M.starts = []; };
  M.guide = function () { const d = M.current(); if (!d || M.active) return; const p = C.pos(typeof d.at === 'function' ? d.at() : d.at); if (p) { ui.setRoute(p.x, p.z); ui.objective(L('下一步', 'NEXT'), `${d.icon} ${G.tx(d.title)} — ${G.tx(d.where)}`); } };

  // ---------------------------------------------------------------- mission context
  function makeCtx(def) {
    const P = G.player, cleanups = [], m = { def, cancelled: false, data: {} };
    m.cleanup = f => { cleanups.push(f); return f; };
    m._end = () => { for (const f of cleanups.reverse()) { try { f(); } catch (e) { console.error(e); } } ui.objective(null); ui.timer(null); ui.clearRoute(); P.locked = false; P.noVehicle = false; P.pose = null; P.speedMul = 1; M.quiet = false; if (P.mode === 'script') P.mode = 'foot'; if (G.cam.mode !== 'follow') G.cam.release(); };
    m.talk = lines => ui.dialog(lines);
    m.say = (av, text, extra) => ui.dialog([Object.assign({ av, text }, extra || {})]);
    m.choice = (av, text, choices, extra) => ui.choice(Object.assign({ av, text, choices }, extra || {}));
    m.objective = (text, title) => ui.objective(title || G.tx(def.title), text);
    m.wait = sec => { let t = 0; return M.until(dt => (t += dt) >= sec || G.query.has('fastdlg')); };
    m.until = pred => M.until(dt => { if (m.cancelled) throw new Abort(); return pred(dt); });
    m.fade = (on, ms) => ui.fade(on, ms);
    m.lock = b => { P.locked = !!b; };
    m.hour = (h, day) => { G.sky.setHour(h); if (day && G.S().day < day) G.S().day = day; };
    m.npc = (av, pos, o = {}) => { const a = ui.AV[av] || {}, PAL = G.PAL, p = C.pos(pos); const n = G.crowd.addNamed(Object.assign({ x: p.x, z: p.z, h: p.h == null ? 0 : p.h, name: a.name, skin: PAL.SKIN[(a.skin || 0) % PAL.SKIN.length], hair: a.gray ? 0xb9b2aa : PAL.HAIR[(a.hair || 0) % PAL.HAIR.length], top: a.kind === 'gown' ? 0x18181c : a.kind === 'doctor' || a.kind === 'lab' ? 0xf4f4f0 : a.kind === 'suit' || a.kind === 'pres' ? 0x2f3542 : PAL.TOPS[(a.top || 0) % PAL.TOPS.length], pants: 0x2f3542, pack: 0 }, o)); m.cleanup(() => G.crowd.remove(n)); return n; };
    // walk/ride to a place. o: {text, icon, r, timer(sec), onTick, route}
    m.goto = async function (place, o = {}) {
      const p = C.pos(place), r = o.r || 4.5; if (!p) return true;
      const beacon = G.fx.beacon(p.x, p.z, { color: o.color || 0xe5b53b, icon: o.icon || def.icon, r: Math.max(1.6, r * 0.6) }), mark = ui.mark({ x: p.x, z: p.z, icon: o.icon || def.icon, label: o.label });
      const done = () => { beacon.remove(); mark.remove(); if (o.route !== false) ui.clearRoute(); ui.timer(null); };
      m.cleanup(done); if (o.route !== false) ui.setRoute(p.x, p.z, { keep: true }); if (o.text) m.objective(o.text);
      let left = o.timer || 0, ok = true;
      if (G.query.has('fastdlg') && !o.real) { await m.wait(0.05); P.teleport(p.x, p.z); done(); return true; }
      try { await m.until(dt => { if (o.timer) { left -= dt; ui.timer(fmtSec(left), left < 15); if (left <= 0) { ok = false; return true; } } if (o.onTick) o.onTick(dt); const dx = P.pos.x - p.x, dz = P.pos.z - p.z; return dx * dx + dz * dz < r * r; }); } finally { done(); }
      if (ok) G.audio.sfx('pick'); return ok;
    };
    return m;
  }
  const fmtSec = s => { s = Math.max(0, Math.ceil(s)); return Math.floor(s / 60) + ':' + String(s % 60).padStart(2, '0'); };
  M.fmtSec = fmtSec;

  M.start = async function (id, force) {
    const def = M.defs[id]; if (!def || M.active) return false; if (!force && !M.avail(def)) return false;
    const P = G.player, m = makeCtx(def); M.active = m; M.clearStarts(); ui.clearRoute(); ui.objective(null);
    if (P.vehicle && !def.keepVehicle) G.veh.dismount(true);
    let result = null, ok = false;
    try {
      if (!def.noBanner) ui.banner(def.side ? L('校园活动', 'ACTIVITY') : G.tx(def.chapter || ''), G.tx(def.title), G.tx(def.sub || ''));
      result = await def.run(m); ok = result !== false;
    } catch (e) { if (!(e instanceof Abort)) { console.error('[mission ' + id + ']', e); ui.toast('⚠️ ' + e.message); } }
    m._end(); M.active = null; ui.endDialog();
    if (ok) {
      const S = G.S(), first = !S.done[id]; S.done[id] = (result && result.grade) || 'A'; if (result && result.grade) S.grades[id] = result.grade;
      let gains = Object.assign({}, def.gains || {}); if (!first) for (const k in gains) gains[k] = Math.max(1, Math.round(gains[k] * 0.25));
      if (result && result.bonus) for (const k in result.bonus) gains[k] = (gains[k] || 0) + result.bonus[k];
      ui.gain(gains, true);
      await ui.reward({ title: def.title, grade: result && result.note, gains, tips: def.tips, stamp: result && result.stamp });
      G.emit('missionDone', id); G.saveNow();
      if (def.after) { try { await def.after(m, result); } catch (e) { console.error(e); } }
    } else if (!m.cancelled) ui.toast(L('任务未完成，可以回到起点重新开始。', 'Mission not completed — head back to the start marker to retry.'));
    M.refresh(); M.guide(); return ok;
  };
  M.cancel = function () { if (M.active) { M.active.cancelled = true; ui.toast(L('已放弃当前任务。', 'Mission abandoned.')); } };

  M.init = function () { };
  M.begin = async function (isNew, o = {}) {
    if (G.visitor) { G.S().flags.drone = 1; M.refresh(); ui.banner(L('校园开放日', 'OPEN DAY'), L('欢迎参观港中大（深圳）', 'Welcome to CUHK-Shenzhen'), L('自由漫游 · 打卡地标 · 体验校园活动', 'Roam freely · discover landmarks · try campus activities')); ui.objective(L('开放日', 'OPEN DAY'), L('自由参观校园。按 <b>M</b> 看地图，按 <b>Tab</b> 打开手机（无人机航拍、校巴快线、图鉴）。', 'Explore freely. <b>M</b> for the map, <b>Tab</b> for your phone (drone, shuttle, collection).')); return; }
    if (!M.isDone('arrival') && !o.skipIntro) { await M.start('arrival', true); }
    else { M.refresh(); M.guide(); }
  };

  // ---------------------------------------------------------------- phone lists
  M.renderList = function (body, close) {
    const h = ui.h, cur = M.current(); let lastCh = '';
    if (M.active) { const li = h(`<div class="li cur"><span class="em">${M.active.def.icon}</span><div><b>${G.tx(M.active.def.title)}</b><small>${L('进行中', 'In progress')}</small></div>${M.active.def.auto ? '' : `<button class="go">${L('放弃', 'Quit')}</button>`}</div>`); const q = li.querySelector('.go'); if (q) q.onclick = () => { M.cancel(); close(); }; body.appendChild(li); }
    for (const id of M.order) {
      const d = M.defs[id]; if (d.hidden) continue; const done = M.isDone(id), av = M.avail(d), ch = d.side ? L('校园活动', 'ACTIVITIES') : G.tx(d.chapter || '');
      if (ch !== lastCh) { lastCh = ch; body.appendChild(h(`<div class="sec">${ch}</div>`)); }
      const li = h(`<div class="li ${done ? 'done' : av ? (cur === d ? 'cur' : '') : 'lock'}"><span class="em">${done ? '✅' : av ? d.icon : '🔒'}</span><div><b>${G.tx(d.title)}</b><small>${done ? L('已完成', 'Done') + (G.S().grades[id] ? ' · ' + G.S().grades[id] : '') : av ? G.tx(d.where) : L('完成前置任务后解锁', 'Locked')}</small></div></div>`);
      if (done && !d.side && !M.active && !G.visitor) { const b = h(`<button class="go" title="replay">↻</button>`); b.onclick = () => { close(); M.start(id, true); }; li.appendChild(b); li.classList.remove('done'); li.style.opacity = 0.8; }
      if (av && !M.active) { const b = h(`<button class="go">🧭</button>`); b.onclick = () => { const p = C.pos(typeof d.at === 'function' ? d.at() : d.at); if (p) { ui.setRoute(p.x, p.z); ui.toast(L('已导航到：', 'Navigating to: ') + G.tx(d.title)); } close(); }; li.appendChild(b); }
      body.appendChild(li);
    }
  };
  M.renderAlbum = function (body, close) {
    const h = ui.h, S = G.S();
    body.appendChild(h(`<div class="sec">${L('地标', 'LANDMARKS')} ${Object.keys(S.found).length}/${C.landmarks.length}</div>`));
    for (const lm of C.landmarks) { const f = S.found[lm.id]; const li = h(`<div class="li ${f ? '' : 'lock'}"><span class="em">${f ? '📍' : '❔'}</span><div><b>${f ? G.tx(lm.name) : '？？？'}</b><small>${f ? G.tx(lm.d) : L('尚未发现', 'Undiscovered')}</small></div></div>`); if (lm.p) { const b = h(`<button class="go">🧭</button>`); b.onclick = () => { ui.setRoute(lm.p.x, lm.p.z); close(); }; li.appendChild(b); } body.appendChild(li); }
    body.appendChild(h(`<div class="sec">${L('校园猫', 'CAMPUS CATS')} ${Object.keys(S.cats).length}/${C.cats.length}</div>`));
    for (const c of C.cats) { const f = S.cats[c.id]; body.appendChild(h(`<div class="li ${f ? '' : 'lock'}"><span class="em">${f ? '🐱' : '🐾'}</span><div><b>${f ? G.tx(c.name) : '？？？'}</b><small>${f ? G.tx(c.d) : L('在校园里找找看', 'Somewhere on campus…')}</small></div></div>`)); }
  };

  // ---------------------------------------------------------------- shared helpers for story scripts
  const CH = { 1: ['第一章 · 报到日', 'CHAPTER 1 · ARRIVAL'], 2: ['第二章 · 第一堂课', 'CHAPTER 2 · FIRST CLASS'], 3: ['第三章 · 彩色的一天', 'CHAPTER 3 · A DAY IN COLOUR'], 4: ['第四章 · 融入', 'CHAPTER 4 · BELONGING'], 5: ['第五章 · 成长', 'CHAPTER 5 · GROWING'], 6: ['终章 · 神仙岭下', 'FINALE · UNDER THE RIDGE'] };
  const scene = async (m, hour, day, kicker, title) => { await m.fade(true, 500); m.hour(hour, day); if (title) { await G.sleep(G.query.has('fastdlg') ? 10 : 250); } await m.fade(false, 600); if (title) ui.banner(kicker, title, ''); };
  M.scene = scene;
  const gradeOf = s => s >= 0.9 ? 'S' : s >= 0.7 ? 'A' : s >= 0.45 ? 'B' : 'C';
  M.gradeOf = gradeOf;
  const note = (s) => { const g = gradeOf(s); return { grade: g, note: [`评级 ${g}`, `Grade ${g}`] }; };

  // ================================================================ CH1 — arrival & dorm
  M.define('arrival', {
    title: ['报到：回"家"', 'Check-in: Finding Home'], icon: '🏠', chapter: CH[1], where: ['学校正门', 'Main Gate'], at: 'gate', auto: true, sub: ['找到你的书院宿舍', 'Find your college dorm'],
    gains: { social: 12, well: 8 }, tips: [['室友之间把需求说出来、各退一步，比忍着更长久。', 'With roommates, say what you need and meet halfway — it beats silently putting up with things.'], ['书院是你在大学的"家"：导师、活动、伙伴都从这里开始。', 'Your college is home base: tutors, events and friends all start here.']],
    async run(m) {
      const P = G.player, S = G.S(), col = C.colleges[S.college], g = C.pos('gate');
      m.lock(true); G.cam.orbit({ x: g.x, y: 0, z: g.z, r: 15, h: 5, ang: g.h + 2.6, speed: 0.12, ty: 1.4 });
      const lin = m.npc('lin', { x: g.x + Math.sin(g.h) * 4.5 + Math.cos(g.h) * 1.5, z: g.z + Math.cos(g.h) * 4.5 - Math.sin(g.h) * 1.5, h: g.h + Math.PI }, { pose: 'wave' });
      await m.talk([
        { av: 'lin', text: ['欢迎来到港中大（深圳）！我是 O 营组长林晓。你就是 {name} 吧？', "Welcome to CUHK-Shenzhen! I'm Lin, your orientation leader. You must be {name}?"] },
        S.identity === 'exchange' ? { av: 'lin', text: ['听说你是这学期的交换生——别担心，这里全英文授课，饭堂天南海北都有，很快就习惯啦。', "I hear you're on exchange this term — classes are in English and the canteens serve a bit of everything. You'll feel at home fast."] } : { av: 'lin', text: ['从今天起，这座山水之间的校园就是你的大学了。', 'From today, this campus between the hills and the water is your university.'] },
        { av: 'lin', text: G.isTouch ? ['先教你两招：左下摇杆走路，拖动屏幕转视角。右下角的按钮可以冲刺和互动。', 'Two quick tips: use the stick to walk and drag the screen to look around. The buttons on the right sprint and interact.'] : ['先教你两招：*WASD* 走路，按住 *Shift* 冲刺，点一下画面后用鼠标转视角。', 'Two quick tips: *WASD* to walk, hold *Shift* to sprint, click the view and use the mouse to look around.'] },
        { av: 'lin', text: [`你分在 *${col.name[0]}*。旁边有共享单车，走过去按 *F* 就能骑。跟着小地图上的紫色路线，去宿舍报到吧！`, `You're in *${col.name[1]}*. Shared bikes are right there — walk up and press *F* to ride. Follow the purple route on the minimap to your dorm!`] }
      ]);
      lin.pose = null; G.cam.release();
      if (/upper|middle/.test((C.pos('dorm').b || {}).campus || '')) {
        const far = Math.round(G.nav.route(P.pos.x, P.pos.z, C.pos('dorm').x, C.pos('dorm').z).len / 100) / 10;
        const k = await m.choice('lin', [`${col.name[0]}在${C.pos('dorm').b.campus === 'upper' ? '上园' : '中园'}，离这儿有 ${far} 公里呢。要不要搭校巴？`, `${col.name[1]} is in the ${C.pos('dorm').b.campus === 'upper' ? 'Upper' : 'Middle'} Campus, ${far} km from here. Want to take the shuttle?`], [['🚌 坐校巴过去', '🚌 Take the shuttle'], ['🚲 我想骑车逛过去', '🚲 I would rather ride there']]);
        if (k === 0) { await m.fade(true, 450); const dp = C.off(col.b, 26, 0) || C.pos('dorm'); P.teleport(dp.x, dp.z, C.pos('dorm').h); m.hour(G.sky.hour + 0.15); await G.sleep(350); await m.fade(false, 600); ui.toast(L('校巴到站。以后可以按 <b>Tab</b> 打开手机，用"校巴快线"在三个园区之间穿梭。', 'Here we are. Later, press <b>Tab</b> and use the Shuttle app to hop between campuses.'), 6); }
      }
      m.lock(false);
      await m.goto('dorm', { text: L(`前往 <b>${col.name[0]}</b> 报到（F 骑共享单车）`, `Go to <b>${col.name[1]}</b> (press F to ride a bike)`), icon: '🏠', r: 5 });
      await scene(m, 10.5, 1); m.lock(true);
      await m.talk([{ av: 'roommate', text: ['嗨！你就是我室友吧？我叫小航，计算机专业的。床位我给你留了靠窗的那个！', "Hey! You must be my roommate — I'm Hang, CS major. I saved you the bed by the window!"] }, { av: 'roommate', text: ['趁行李还没拆，咱们先把"室友公约"聊清楚？学长说这个特别重要。', "Before we unpack, shall we sort out a roommate agreement? Seniors say it really matters."] }]);
      const r = await G.mini.dorm();
      await m.talk([{ av: 'roommate', text: r.score > 0.7 ? ['合作愉快！感觉我们会成为很好的室友。', 'Deal! I think we are going to get along great.'] : ['慢慢磨合吧，有事直接说就行！', "We'll figure it out — just tell me straight if something bugs you!"] }, { av: 'tutor', text: ['同学们好，我是书院导师陈老师。生活上有任何问题随时来找我。对了——去图书馆办个入馆手续吧，接下来四年你会常去的。', "Hello, I'm Ms Chen, your college tutor. Come to me with anything. Oh — go get set up at the library; you'll be there a lot over the next four years."] }]);
      return note(r.score);
    }
  });

  M.define('library', {
    title: ['图书馆初体验', 'Library 101'], icon: '📚', chapter: CH[1], where: ['大学图书馆', 'University Library'], at: '大学图书馆', need: ['arrival'], sub: ['学会按索书号找书', 'Learn to find books by call number'],
    gains: { acad: 18, culture: 4 }, tips: [['索书号像门牌：先比字母，再比数字（76.73 排在 76.9 前面！），最后比作者号。', 'A call number is an address: letters first, then numbers (76.73 comes before 76.9!), then the author code.'], ['找不到书、订研讨间、查数据库——直接问馆员，他们是最被低估的"外挂"。', "Can't find a book, need a discussion room or a database? Ask a librarian — the most underrated cheat code."]],
    async run(m) {
      await scene(m, Math.max(G.sky.hour, 14), 1); m.lock(true);
      await m.talk([{ av: 'librarian', text: ['欢迎来到大学图书馆。新同学？来，我教你最有用的一招：*按索书号找书*。', 'Welcome to the University Library. New here? Let me teach you the most useful trick: *finding books by call number*.'] }, { av: 'librarian', text: ['还书车上正好有几本书要归架。放对了位置，下一位同学才能找到它。', 'There are a few books on the returns trolley. Shelve them correctly and the next student can find them.'] }]);
      const r = await G.mini.library();
      await m.talk([{ av: 'librarian', text: r.score >= 0.7 ? ['不错！你已经比很多高年级同学熟练了。', "Nice! You're already better than many seniors."] : ['没关系，多来几次就熟了。书架侧面都有索书号范围。', "No worries, it comes with practice. Each shelf end shows its call-number range."] }]);
      return note(r.score);
    }
  });

  // ================================================================ CH2 — rush to class + course, club fair
  M.define('rush', {
    title: ['早八冲刺', 'The 8:30 Dash'], icon: '⏰', chapter: CH[2], where: ['回书院休息（到第二天）', 'Rest at your dorm (next day)'], at: 'dorm', verb: ['休息到明早', 'Sleep until morning'], need: ['library'], sub: ['别迟到！', "Don't be late!"],
    gains: { acad: 16, well: 8 }, tips: [['早八的秘诀不是跑得快，是前一晚把闹钟和书包准备好。', "The secret to an 8:30 class isn't running fast — it's setting the alarm and packing your bag the night before."], ['这里全英文授课。听不懂很正常：录音回放、Office hour、同学笔记都是你的后援。', 'Classes are taught in English. Getting lost is normal: recordings, office hours and classmates have your back.'], ['大语言模型输出的是"概率"，会一本正经地说错——用它，但要核查。', 'LLMs output probabilities and can be confidently wrong — use them, but verify.']],
    async run(m) {
      const P = G.player; await m.fade(true, 600); m.hour(8.3, 2); G.sky.setWeather('clear');
      const start = C.pos('plaza'), end = C.pos('教学楼B'); P.teleport(start.x, start.z, start.h); m.lock(true); await G.sleep(300); await m.fade(false, 500);
      await m.talk([{ av: 'roommate', text: ['{name}！！醒醒！8:18 了！8:30 是王教授的课，点名的！', "{name}!! Wake up! It's 8:18! Prof. Wang's class is at 8:30 and he takes attendance!"] }, { av: 'narr', text: ['你抓起书包冲出门——校巴把你放在了启动区钟楼。离教学楼 B 还有好几百米……', 'You grab your bag and bolt — the shuttle drops you at the Bell Tower. Teaching B is still several hundred metres away…'] }]);
      const run = await G.mini.runner(m, { from: start, to: end });
      await m.fade(true, 400); P.teleport(end.x, end.z, end.h); m.hour(8.52, 2); await m.fade(false, 400);
      await m.talk([{ av: 'prof', text: run.late <= 0 ? ['很好，踩点到。请坐——我们今天聊点有意思的。', "Good, right on time. Take a seat — today's topic is a fun one."] : [`迟到 ${run.late} 分钟。下次早点，快坐下吧。`, `${run.late} minute(s) late. Earlier next time — sit down quickly.`] }]);
      const c = await G.mini.course();
      const s = run.score * 0.5 + c.score * 0.5;
      return Object.assign(note(s), { bonus: c.raised ? { social: 4 } : {} });
    }
  });

  M.define('clubs', {
    title: ['百团招新', 'Club Fair'], icon: '🎪', chapter: CH[2], where: ['学生中心前广场', 'Student Centre plaza'], at: 'fair', need: ['library'], sub: ['集章，找到你的圈子', 'Collect stamps, find your people'],
    gains: { social: 20, culture: 6, career: 6 }, tips: [['社团不在多：选一两个真心喜欢的，坚持下去。', "Don't over-join: pick one or two clubs you truly enjoy and stick with them."], ['不认识人？招新摊位是最容易开口的地方——大家都在等你搭话。', "Don't know anyone? A fair booth is the easiest place to say hi — they're waiting for you."]],
    async run(m) { return G.story.clubs(m); }
  });

  // ================================================================ CH3 — color run + clinic
  M.define('colorrun', {
    title: ['新生杯彩色跑', 'Freshman Cup Color Run'], icon: '🌈', chapter: CH[3], where: ['行政楼广场', 'Administration Square'], at: 'adminsq', need: ['rush', 'clubs'], sub: ['五个彩粉站，跑出你的颜色', 'Five powder stations'],
    gains: { well: 20, social: 10 }, tips: [['运动是最便宜的"情绪调节器"：每周三次、每次三十分钟就很有效。', 'Exercise is the cheapest mood regulator: three 30-minute sessions a week go a long way.'], ['跑步配速比冲刺重要：留点体力给终点。', 'Pacing beats sprinting: save something for the finish.']],
    async run(m) { return G.story.colorrun(m); },
    async after() { G.sky.setWeather('rain'); await ui.dialog([{ av: 'roommate', text: ['哇，说下就下！快跑——你怎么在发抖？……阿嚏？', "Whoa, it's pouring! Run — wait, are you shivering? …Achoo?"] }, { av: 'sofia', text: ['你淋湿了又吹风，小心感冒。教学楼 D 下首层有社康中心，不舒服就去看看。', "You're soaked and it's windy — careful not to catch a cold. There's a health centre under Teaching D if you feel off."] }]); G.S().flags.cold = 1; }
  });

  M.define('clinic', {
    title: ['医务室与华佗GPT', 'The Clinic & HuatuoGPT'], icon: '🏥', chapter: CH[3], where: ['教学楼 D · 下园社康中心', 'Teaching D · health centre'], at: '教学楼D', need: ['colorrun'], sub: ['学会看病，也学会和 AI 打交道', 'Seeing a doctor — and working with AI'],
    gains: { well: 16, acad: 8 }, tips: [['描述症状三要素：哪里不舒服、从什么时候开始、可能的诱因。', 'Describe symptoms with three things: where, since when, and the likely trigger.'], ['AI 预问诊帮医生整理信息，但诊断和用药以医生为准。', 'AI pre-consultation organises information for the doctor — diagnosis and medication are the doctor\'s call.'], ['呼吸困难、胸痛、持续高热、意识模糊：别等，立刻就医或拨打 120。', 'Trouble breathing, chest pain, persistent high fever or confusion: seek care at once or dial 120.']],
    async run(m) {
      await scene(m, 19.2, 3); G.sky.setWeather('rain'); m.lock(true);
      await m.talk([{ av: 'narr', text: ['晚上，你的喉咙越来越痛。社康中心的分诊台上放着一块平板：', 'By evening your throat is getting worse. At the triage desk of the health centre sits a tablet:'] }]);
      const r = await G.mini.clinic();
      await m.talk([
        { av: 'doctor', text: ['我看了华佗GPT整理的预问诊小结，很清楚。来，张嘴——咽部有点红，是普通的上呼吸道感染。', "I've read the HuatuoGPT summary — very clear. Open wide… your throat is a bit red. It's an ordinary upper respiratory infection."] },
        { av: 'doctor', text: ['多喝温水、好好睡觉。我开点对症的药；*48 小时不退烧或者加重，一定回来复诊*。', "Warm fluids and proper sleep. I'll prescribe something for the symptoms; *if the fever lasts 48 hours or it gets worse, come back*."] },
        { av: 'doctor', text: ['记住：AI 是帮我整理信息的助手，诊断和用药还是我来负责。结算刷社保卡就行。', 'Remember: the AI helps me organise information, but diagnosis and medication are my responsibility. Just swipe your social-security card to pay.'] }
      ]);
      G.sky.setWeather('clear'); G.S().flags.cold = 0;
      return note(r.score);
    }
  });

  // ================================================================ CH4 — high table, lab, career
  M.define('hightable', {
    title: ['高桌晚宴', 'High Table Dinner'], icon: '🍽️', chapter: CH[4], where: ['回书院换装', 'Dress up at your dorm'], at: 'dorm', verb: ['换装赴宴', 'Dress for dinner'], need: ['clinic'], sub: ['袍子、祝酒与餐桌上的对话', 'Gowns, toasts and table talk'],
    gains: { culture: 22, social: 10 }, tips: [['高桌晚宴源自英式学院传统：着学生袍与正装，嘉宾入场时起立。', 'High Table comes from the British collegiate tradition: gown and formal dress, and stand as the high-table guests enter.'], ['祝酒用的是葡萄汁；碰杯时轻碰杯肚，而不是杯口。', 'The toast is grape juice; clink gently at the bowl of the glass, not the rim.'], ['和嘉宾聊天的万能开场：自我介绍 + 一个具体的问题。', 'A universal opener with a guest: introduce yourself, then ask one specific question.']],
    async run(m) { return G.story.hightable(m); }
  });
  M.define('lab', {
    title: ['生物医学实验课', 'Biomedical Lab'], icon: '🧪', chapter: CH[4], where: ['李贤义楼 · 教学实验室', 'LEE Yin Yee Bldg · teaching lab'], at: '李贤义楼', need: ['clinic'], sub: ['防护、移液与离心机配平', 'PPE, pipetting, balancing the centrifuge'],
    gains: { acad: 20, career: 10 }, tips: [['进实验室：实验服、护目镜、手套、不露脚趾的鞋；长发扎起，食物饮料留在外面。', 'In the lab: coat, goggles, gloves, closed-toe shoes; tie back long hair and leave food and drink outside.'], ['离心机必须对称配平——不平衡的转子是实验室里最常见的事故源之一。', 'Always balance the centrifuge — an unbalanced rotor is one of the most common lab accidents.']],
    async run(m) {
      await scene(m, 14, 4); m.lock(true);
      await m.talk([{ av: 'labta', text: ['欢迎来到生物教学实验室。今天做一个小实验：从样本里提取 DNA。动手之前，先过安全关。', "Welcome to the biology teaching lab. Today's mini-experiment: extracting DNA from a sample. Safety check first."] }]);
      const r = await G.mini.lab();
      await m.talk([{ av: 'labta', text: r.score >= 0.7 ? ['漂亮！离心管底部那一小团白色沉淀就是 DNA。你的手很稳，考虑来我们课题组做本科生科研吗？', "Beautiful! That little white pellet at the bottom is DNA. Steady hands — ever thought of joining a lab for undergraduate research?"] : ['第一次已经不错了。实验就是这样：耐心、规范、多练。', "Not bad for a first time. That's lab work: patience, protocol, practice."] }]);
      return note(r.score);
    }
  });
  M.define('career', {
    title: ['生涯第一课', 'Career Kick-off'], icon: '💼', chapter: CH[4], where: ['学生中心 · CPDO', 'Student Centre · CPDO'], at: () => C.off('学生中心', 2.5, 7), need: ['clinic'], sub: ['简历与模拟面试', 'Résumé and mock interview'],
    gains: { career: 34, social: 4 }, tips: [['简历写"做了什么 + 结果如何"：动词开头，带上数字。', 'Write résumé bullets as action + result: start with a verb, include a number.'], ['面试答题用 STAR：情境、任务、行动、结果。', 'Answer interview questions with STAR: Situation, Task, Action, Result.'], ['生涯规划从大一开始不嫌早：CPDO 有一对一咨询、模拟面试和招聘会。', "First year isn't too early: CPDO offers 1-on-1 advising, mock interviews and job fairs."]],
    async run(m) {
      await scene(m, 15.5, 5); m.lock(true);
      await m.talk([{ av: 'cpdo', text: ['你好，我是 CPDO 的 Grace。大一就来？太好了——生涯规划越早开始越从容。', "Hi, I'm Grace from CPDO. A first-year? Wonderful — the earlier you start, the calmer you'll be."] }, { av: 'cpdo', text: ['正好有个 Early Bird 暑期实习训练项目。我们先改简历，再来一场模拟面试。', "There's an Early Bird summer internship training programme. Let's polish your résumé, then do a mock interview."] }]);
      const r = await G.mini.career();
      await m.talk([{ av: 'cpdo', text: r.score >= 0.7 ? ['表现很好！把今天的简历存好，下次招聘会直接用。', "Great job! Save today's résumé — you can use it at the next job fair."] : ['思路有了，再练几次会更好。随时约我一对一。', "You've got the idea — a few more rounds will polish it. Book a 1-on-1 any time."] }]);
      return note(r.score);
    }
  });

  // ================================================================ CH5 — counselling, president
  M.define('counseling', {
    title: ['和自己聊聊', 'A Talk With Yourself'], icon: '💗', chapter: CH[5], where: ['学生中心 · 心理咨询室', 'Student Centre · counselling'], at: () => C.off('学生中心', 2.5, -7), need: ['hightable', 'lab'], sub: ['求助是一种能力', 'Asking for help is a skill'],
    gains: { well: 28, social: 4 }, tips: [['情绪低落、想家、压力大都很正常。求助不是软弱，是对自己负责。', "Feeling low, homesick or stressed is normal. Asking for help isn't weakness — it's taking care of yourself."], ['"4-2-6"呼吸：吸气 4 秒、屏息 2 秒、呼气 6 秒，重复几轮。', '"4-2-6" breathing: inhale 4 s, hold 2 s, exhale 6 s, for a few rounds.'], ['把"我完了"换成"这一次没做好，我可以怎么调整"。', 'Swap "I\'m doomed" for "this one went badly — what can I adjust?"']],
    async run(m) {
      await scene(m, 16.5, 5); m.lock(true);
      await m.talk([
        { av: 'narr', text: ['这一周事情一件接一件：小测只拿了 60 分，朋友圈里别人好像都过得很精彩，夜里有点想家。', "It's been one thing after another: 60% on the quiz, everyone else's feed looks amazing, and at night you miss home."] },
        { av: 'roommate', text: ['你这两天话好少……要不要去学生中心四楼的心理咨询室聊聊？我上学期去过，真的有用。我陪你到门口。', "You've been so quiet… Want to talk to someone at the counselling rooms on 4F of the Student Centre? I went last term; it really helped. I'll walk you there."] },
        { av: 'counselor', text: ['你好，{name}。先坐。来这里不需要"有大问题"，想聊聊就可以。我们从一次呼吸开始，好吗？', "Hello, {name}. Have a seat. You don't need a 'big problem' to come here. Shall we start with a breath?"] }
      ]);
      const r = await G.mini.counsel();
      await m.talk([
        { av: 'counselor', text: ['谢谢你愿意说出来。刚才你做的，其实就是心理学里说的"认知重构"——不是假装没事，而是换一个更公平的角度看自己。', "Thank you for sharing. What you just did is called cognitive reframing — not pretending you're fine, but looking at yourself more fairly."] },
        { av: 'counselor', text: ['想聊随时再来。如果某天觉得撑不住，*不要一个人扛*：找室友、导师、我们，紧急时拨打 120。', "Come back whenever you like. And if a day ever feels unbearable, *don't carry it alone*: your roommate, your tutor, us — and 120 in an emergency."] },
        { av: 'roommate', text: ['怎么样？……走，请你喝糖水！', 'How was it? …Come on, dessert is on me!'] }
      ]);
      G.player.stamina = 1; return { grade: 'S', note: [L('你照顾了自己', 'You took care of yourself'), 'You took care of yourself'], stamp: L('安好', 'WELL') };
    }
  });
  M.define('president', {
    title: ['校长面对面', 'Meet the President'], icon: '🎓', chapter: CH[5], where: ['逸夫国际会议中心', 'Shaw Conference Centre'], at: '逸夫国际会议中心', need: ['hightable', 'lab', 'career'], sub: ['带上你的问题', 'Bring your questions'],
    gains: { culture: 18, career: 14, acad: 6 }, tips: [['敢提问，是大学里最值钱的习惯之一。', 'Daring to ask questions is one of the most valuable habits at university.']],
    async run(m) {
      await scene(m, 10, 6); m.lock(true);
      const r = await G.mini.president();
      return { grade: 'S', note: [L('你问出了自己的问题', 'You asked your own question'), 'You asked your own question'], bonus: r.asked >= 2 ? { social: 6 } : {} };
    }
  });

  // ================================================================ FINALE — concert
  M.define('concert', {
    title: ['神仙岭之夜音乐会', 'Concert Under the Ridge'], icon: '🎻', chapter: CH[6], where: ['中园 · 音乐学院', 'Middle Campus · School of Music'], at: 'concert', need: ['counseling', 'president'], sub: ['和乐团一起演奏', 'Play with the orchestra'],
    gains: { culture: 24, social: 12, well: 8 }, tips: [['一周前你还不认识这里的任何一条路。适应，就是这样一点点发生的。', "A week ago you didn't know a single path here. That's how settling in happens — bit by bit."]],
    async run(m) { return G.story.concert(m); },
    async after() { await G.story.epilogue(); }
  });

  // ================================================================ side activities
  M.define('hoops', {
    title: ['球场约起', 'Shoot Some Hoops'], icon: '🏀', side: true, repeat: true, open: true, where: ['下园篮球场', 'Lower Campus courts'], at: 'court', need: ['arrival'],
    gains: { well: 10, social: 4 },
    async run(m) { m.lock(true); await m.talk([{ av: 'coach', text: ['来投几个？十个球，看你能进几个。出手看准力度条！', 'Fancy a few shots? Ten balls — watch the power bar!'] }]); const r = await G.mini.hoops(); return Object.assign(note(r.score), { note: [`命中 ${r.made}/10`, `Made ${r.made}/10`] }); }
  });
  M.define('dronetour', {
    title: ['航拍校园', 'Aerial Campus Tour'], icon: '🛸', side: true, repeat: true, open: true, flag: 'drone', where: ['启动区广场', 'Start-up Zone Square'], at: 'plaza', need: [],
    gains: { culture: 12, acad: 4 }, tips: [['换个高度看校园：上园、中园、下园被青山连在一起。', 'See the campus from above: the Upper, Middle and Lower campuses are stitched together by green hills.']],
    async run(m) { return G.story.dronetour(m); }
  });
})();
