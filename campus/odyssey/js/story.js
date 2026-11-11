/* in-world story sequences: club fair, Color Run, High Table journey, concert finale, drone tour, epilogue */
(function () {
  'use strict';
  const G = window.G, W = G.world, ui = G.ui, L = G.L, C = G.content, M = G.missions, mini = G.mini;
  const S_ = G.story = {};
  const auto = () => G.query.has('fastdlg');
  const lm = c => new THREE.MeshLambertMaterial({ color: c });
  Object.assign(ui.AV, {
    c_drone: { skin: 2, hair: 0, top: 9, glasses: true, name: ['无人机协会', 'Drone Society'] }, c_dance: { skin: 0, hair: 6, top: 7, style: 1, name: ['MAX 精舞团', 'MAX Dancing Club'] },
    c_canto: { skin: 1, hair: 1, top: 1, name: ['粤语社', 'The Cantonese Club'] }, c_music: { skin: 0, hair: 2, top: 0, style: 1, name: ['聚乐部', 'Music Union'] },
    c_cat: { skin: 4, hair: 3, top: 2, style: 1, name: ['流浪猫关爱协会', 'Campus Cat Care'] }, c_desk: { skin: 1, hair: 0, top: 6, kind: 'suit', tie: '#e5b53b', name: ['社团联合部', 'Clubs Union Desk'] }
  });

  function tent(x, z, ang, color) {
    const g = new THREE.Group(), pole = lm(0xe9e9e9);
    for (const [px, pz] of [[1.6, 1.3], [-1.6, 1.3], [1.6, -1.3], [-1.6, -1.3]]) { const p = new THREE.Mesh(new THREE.BoxGeometry(0.08, 2.4, 0.08), pole); p.position.set(px, 1.2, pz); g.add(p); }
    const roof = new THREE.Mesh(new THREE.ConeGeometry(2.6, 1.1, 4), lm(color)); roof.position.y = 2.95; roof.rotation.y = Math.PI / 4; roof.castShadow = true; g.add(roof);
    const table = new THREE.Mesh(new THREE.BoxGeometry(2.6, 0.08, 0.8), lm(0xf4f0e6)); table.position.set(0, 0.85, 0.9); g.add(table);
    const skirt = new THREE.Mesh(new THREE.BoxGeometry(2.6, 0.8, 0.04), lm(color)); skirt.position.set(0, 0.42, 1.3); g.add(skirt);
    g.position.set(x, W.ground(x, z), z); g.rotation.y = ang; G.scene.add(g); return g;
  }

  // cat locations revealed by the Cat Care club
  let catMarks = [];
  C.markCats = function () { for (const mk of catMarks) mk.remove(); catMarks = []; const S = G.S(); if (!S.flags.catmap) return; for (const o of C.catObjs) if (!S.cats[o.def.id]) { const mk = ui.mark({ x: o.x, z: o.z, icon: '🐱', color: '#ff8fb0', mm: '🐾', near: 4, h: 1.6, range: 70 }); mk.id = o.def.id; catMarks.push(mk); } };
  G.on('cat', c => { catMarks = catMarks.filter(mk => { if (mk.id === c.id) { mk.remove(); return false; } return true; }); });
  G.on('missionDone', () => C.markCats());

  // ================================================================ club fair
  S_.clubs = async function (m) {
    const P = G.player, S = G.S(), c = C.pos('fair'); await M.scene(m, 16, 2);
    const nx = c.nx == null ? 0 : c.nx, nz = c.nz == null ? 1 : c.nz, base = Math.atan2(nx, nz), booths = [['drone', 'c_drone', 0x55606e, '🛸'], ['dance', 'c_dance', 0xd9486b, '💃'], ['canto', 'c_canto', 0xe5b53b, '🗣'], ['music', 'c_music', 0x5b2d90, '🎸'], ['cat', 'c_cat', 0x19b5a5, '🐱']];
    const stamps = new Set(), st = { done: false, busy: false }, tents = []; m.cleanup(() => tents.forEach(t => G.scene.remove(t)));
    const setObj = () => m.objective(stamps.size < 3 ? L(`逛摊位、和社团聊聊，集满 <b>3</b> 个章（${stamps.size}/3）`, `Visit booths and chat — collect <b>3</b> stamps (${stamps.size}/3)`) : L(`已集 ${stamps.size} 个章！去<b>社团联合部</b>登记，或继续逛`, `${stamps.size} stamps! Register at the <b>Clubs Union Desk</b>, or keep browsing`));
    const run = fn => async () => { if (st.busy || st.done) return; st.busy = true; m.lock(true); try { await fn(); } catch (e) { console.error(e); } ui.endDialog(); m.lock(false); st.busy = false; setObj(); };
    const stamp = id => { if (!stamps.has(id)) { stamps.add(id); G.audio.sfx('stamp'); ui.toast(L(`🔖 集章 ${stamps.size}/5`, `🔖 Stamp ${stamps.size}/5`)); if (stamps.size === 3) { deskMark.hidden = false; ui.toast(L('✅ 集满 3 章！可以去社团联合部登记了。', '✅ Three stamps! Head to the Clubs Union Desk.'), 4); } } };
    const talks = {
      drone: run(async () => {
        const k = await m.choice('c_drone', ['我们航拍校园、做编队灯光秀，周末还去神仙岭上飞。想不想现在就试飞一圈？', 'We film the campus from the air, fly formation light shows, and head up Shenxian Ridge at weekends. Want a test flight right now?'], [['试飞！', "Let's fly!"], ['先看看', 'Just looking']]);
        if (k === 0) { ui.endDialog(); m.lock(false); const v = G.veh.launchDrone({ range: 170 }); if (v) { ui.toast(L('WASD 飞行 · Space 上升 · C 下降 · F 降落（30 秒体验）', 'WASD fly · Space up · C down · F land (30-second trial)'), 5); let t = 0; await m.until(dt => (t += dt) > (auto() ? 0.2 : 30) || !P.vehicle); if (P.vehicle) G.veh.dismount(); } m.lock(true); await m.say('c_drone', ['手感不错！加入我们，以后随时能在手机里呼叫无人机。', 'Nice hands! Join us and you can call up a drone from your phone any time.']); }
        stamp('drone');
      }),
      dance: run(async () => { await m.say('c_dance', ['MAX 精舞团！不需要基础，敢跳就行。来，跟我们试一个八拍——', "MAX Dancing Club! No experience needed, just the nerve. Come on, try eight bars with us —"]); ui.endDialog(); const r = await mini.rhythm('dance'); await m.say('c_dance', r.score > 0.7 ? ['节奏感可以啊！周四晚上学生中心排练室见？', "You've got rhythm! Thursday night in the Student Centre studio?"] : ['没关系，跳舞最重要的是开心！', 'No worries — dancing is about having fun!']); stamp('dance'); }),
      canto: run(async () => {
        await m.say('c_canto', ['你好呀！深圳离香港这么近，学两句粤语，饮茶都方便啲～ 考考你：', 'Hello! Shenzhen is right next to Hong Kong — a little Cantonese makes yum cha easier. Quick quiz:']); ui.endDialog();
        const p = ui.panel({ title: L('粤语三句半', 'Cantonese in Three Lines'), icon: '🗣', width: 640 }); let g = 0;
        for (const q of [
          { q: L('有人帮你扶了一下门，你说 <b>"唔该"</b>（m4 goi1）。意思是？', 'Someone holds the door and you say <b>"唔該" (m4 goi1)</b>. It means?'), opts: [{ t: L('谢谢 / 劳驾', 'Thanks / excuse me'), ok: 1 }, { t: L('对不起', 'Sorry') }, { t: L('再见', 'Goodbye') }], why: L('"唔该"用于感谢别人的帮忙；收到礼物说"多谢"。', '"M4 goi1" thanks someone for a favour; for a gift you say "do1 ze6".') },
          { q: L('同学见面问你 <b>"食咗饭未呀？"</b> 他其实是在……', 'A classmate greets you with <b>"食咗飯未呀?"</b> They are really…'), opts: [{ t: L('打招呼（"吃了吗？"）', 'Just saying hi ("Eaten yet?")'), ok: 1 }, { t: L('要请你吃饭', 'Inviting you to dinner') }, { t: L('问你饭卡余额', 'Asking about your meal card') }], why: L('和"吃了吗"一样，是一句亲切的问候。', 'Like "have you eaten?", it is a warm everyday greeting.') },
          { q: L('早上遇到老师，说 <b>"早晨"</b>（zou2 san4）是？', 'Meeting a teacher in the morning, <b>"早晨" (zou2 san4)</b> means?'), opts: [{ t: L('早上好', 'Good morning'), ok: 1 }, { t: L('我起晚了', 'I overslept') }, { t: L('清晨的空气', 'Morning air') }], why: L('"早晨！"就是"早上好！"', '"Zou2 san4!" is simply "Good morning!"') }]) { const r = await mini.ask(p.body, Object.assign({ cols: 1 }, q)); if (r.ok) g++; }
        p.close(); await m.say('c_canto', g >= 2 ? ['叻仔/叻女！（真棒！）', 'Lek1! (Well done!)'] : ['慢慢嚟，唔使急～（慢慢来，不着急）', 'Take your time, no rush~']); stamp('canto');
      }),
      music: run(async () => { await m.talk([{ av: 'c_music', text: ['聚乐部——弹琴、唱歌、组乐队的都在这儿。学生中心有排练室，周末常有草地音乐会。', 'Music Union — players, singers and bands all live here. There are rehearsal rooms in the Student Centre and lawn gigs at weekends.'] }, { av: 'c_music', text: ['对了，周末音乐学院有一场"神仙岭之夜"，指挥老师想请一位新同学上台和乐团互动。我看你就不错！', 'By the way, the School of Music is hosting "A Night Under the Ridge" this weekend, and the conductor wants a newcomer to join the orchestra on stage. You look perfect!'] }]); stamp('music'); }),
      cat: run(async () => { await m.talk([{ av: 'c_cat', text: ['我们照顾校园里的流浪猫：定点投喂、带它们绝育和看病。看到猫可以摸，但别喂人吃的零食哦。', "We look after the campus cats: feeding stations, neutering and vet visits. Pet them if they like — but please don't feed them human snacks."] }, { av: 'c_cat', text: ['我把猫咪常出没的地点标在你的地图上了。集齐十只，你就是"猫咪图鉴"大师！', "I've marked their favourite spots on your map. Find all ten and you are a certified cat whisperer!"] }]); S.flags.catmap = 1; C.markCats(); stamp('cat'); })
    };
    booths.forEach((b, i) => {
      const a = base + (i - 2) * 0.62, tx = c.x + Math.sin(a) * 12, tz = c.z + Math.cos(a) * 12, face = Math.atan2(c.x - tx, c.z - tz);
      tents.push(tent(tx, tz, face, b[2])); const n = m.npc(b[1], { x: tx + Math.sin(face) * 2.1, z: tz + Math.cos(face) * 2.1, h: face }, { pose: i % 2 ? 'wave' : 'talk', talk: talks[b[0]], verb: [b[3] + ' 逛摊位', b[3] + ' Visit'] });
      const mk = ui.mark({ x: n.x, z: n.z, icon: b[3], near: 3, h: 3.4 }); m.cleanup(() => mk.remove());
    });
    const dx = c.x - Math.sin(base) * 6, dz = c.z - Math.cos(base) * 6;
    tents.push(tent(dx, dz, base, 0x4b2a7b));
    m.npc('c_desk', { x: dx + Math.sin(base) * 2.1, z: dz + Math.cos(base) * 2.1, h: base }, {
      verb: ['📝 登记', '📝 Register'], talk: run(async () => {
        if (stamps.size < 3) { await m.say('c_desk', [`集满 3 个章再来登记哦（现在 ${stamps.size} 个）。`, `Come back with 3 stamps (you have ${stamps.size}).`]); return; }
        ui.endDialog();
        const picked = await new Promise(res => {
          const p = ui.panel({ title: L('社团登记', 'Club Registration'), sub: L('最多选 2 个——贵精不贵多', 'Choose up to 2 — quality over quantity'), icon: '📝', width: 700 }), sel = new Set();
          p.body.innerHTML = `<div class="grid g2"></div>`; const g = p.body.querySelector('.grid');
          for (const b of booths) { if (!stamps.has(b[0])) continue; const btn = ui.h(`<button class="card"><span class="em">${b[3]}</span><h4>${G.tx(ui.AV[b[1]].name)}</h4></button>`); btn.onclick = () => { G.audio.sfx('ui'); if (sel.has(b[0])) sel.delete(b[0]); else if (sel.size < 2) sel.add(b[0]); btn.classList.toggle('sel', sel.has(b[0])); }; btn.dataset.id = b[0]; g.appendChild(btn); }
          const ok = p.button(L('确认加入', 'Join'), 'gold', () => { if (!sel.size) { ui.toast(L('至少选一个吧！', 'Pick at least one!')); return; } p.close(); res([...sel]); });
          if (auto()) setTimeout(() => { const d = g.querySelector('[data-id=drone]') || g.firstChild; d.click(); ok.click(); }, 30);
        });
        S.clubs = picked; S.flags.drone = 1; // every member gets drone access via the Clubs Union equipment pool
        await m.say('c_desk', picked.includes('drone') ? ['登记好了！无人机协会的设备可以在手机"无人机"App 里呼叫。', "All set! The Drone Society's kit is available from the Drone app on your phone."] : ['登记好了！另外，社团联合部的公用无人机对所有社员开放——手机里的"无人机"App 已解锁。', "All set! The Clubs Union's shared drone is open to every member — the Drone app on your phone is now unlocked."]);
        st.done = true;
      })
    });
    const deskMark = ui.mark({ x: dx, z: dz, icon: '📝', near: 3, h: 3.6, hidden: true, color: '#3fbf7f' }); m.cleanup(() => deskMark.remove());
    // some visitors milling around
    for (let i = 0; i < 8; i++) { const a = Math.random() * 6.28, r = 3 + Math.random() * 7, n = G.crowd.make({ scripted: true, state: 'fixed', pose: ['talk', null, 'wave'][i % 3], x: c.x + Math.sin(a) * r, z: c.z + Math.cos(a) * r, h: Math.random() * 6.28 }); n.y = W.ground(n.x, n.z); n.cur = 0; m.cleanup(() => G.crowd.remove(n)); }
    m.lock(true);
    await m.talk([{ av: 'lin', text: ['百团招新！九十多个社团，每年最热闹的就是今天。规矩很简单：*逛摊位、聊一聊、集章*。', "The Club Fair! Ninety-odd clubs — the liveliest day of the year. Simple rules: *visit booths, chat, collect stamps*."] }, { av: 'lin', text: ['集满 3 个章就能去社团联合部登记。记住，社团贵精不贵多。', 'With three stamps you can register at the Clubs Union Desk. Remember: quality over quantity.'] }]);
    m.lock(false); setObj();
    if (auto()) { for (const id of ['cat', 'music', 'canto', 'drone', 'dance']) { await talks[id](); } }
    if (auto()) { const d = G.crowd.list.find(n => n.name === ui.AV.c_desk.name); await d.inter.act(); let t = 0; await m.until(dt => st.done || (t += dt) > 20); }
    await m.until(() => st.done);
    return { grade: stamps.size >= 5 ? 'S' : stamps.size >= 4 ? 'A' : 'B', note: [`集章 ${stamps.size}/5`, `${stamps.size}/5 stamps`] };
  };

  // ================================================================ Color Run
  S_.colorrun = async function (m) {
    const P = G.player, st = C.pos('adminsq'), en = C.pos('plaza'); await M.scene(m, 15.5, 3); G.sky.setWeather('clear');
    const route = G.nav.route(st.x, st.z, en.x, en.z), pts = G.nav.resample(route.pts, 4), cum = [0]; for (let i = 1; i < pts.length; i++) cum.push(cum[i - 1] + G.dist(pts[i][0], pts[i][1], pts[i - 1][0], pts[i - 1][1]));
    const LEN = cum[cum.length - 1], at = s => { s = G.clamp(s, 0, LEN - 0.01); let i = 1; while (cum[i] < s) i++; const a = pts[i - 1], b = pts[i], k = (s - cum[i - 1]) / (cum[i] - cum[i - 1] || 1); return [a[0] + (b[0] - a[0]) * k, a[1] + (b[1] - a[1]) * k, Math.atan2(b[0] - a[0], b[1] - a[1])]; };
    const COLS = [[0x8f4be0, L('紫', 'Purple'), '💜'], [0xf2b632, L('金', 'Gold'), '💛'], [0xff5fa2, L('粉', 'Pink'), '💗'], [0x22c7d6, L('青', 'Cyan'), '💙'], [0x4fd16b, L('绿', 'Green'), '💚']];
    const stations = COLS.map((c, i) => { const s = LEN * (0.15 + i * 0.17), p = at(s); return { s, x: p[0], z: p[1], h: p[2], col: c[0], name: c[1], em: c[2] }; });
    P.teleport(st.x, st.z, at(1)[2]); P.char.setOutfit('run'); m.cleanup(() => P.char.setOutfit(null)); m.lock(true);
    // volunteers at each station + arch poles
    const props = []; m.cleanup(() => props.forEach(o => G.scene.remove(o)));
    for (const s of stations) {
      const rx = Math.cos(s.h), rz = -Math.sin(s.h);
      for (const side of [-1, 1]) { const pole = new THREE.Mesh(new THREE.BoxGeometry(0.16, 3.4, 0.16), lm(s.col)); pole.position.set(s.x + rx * side * 3.6, W.ground(s.x, s.z) + 1.7, s.z + rz * side * 3.6); G.scene.add(pole); props.push(pole); for (let k = 0; k < 2; k++) { const n = G.crowd.make({ scripted: true, state: 'fixed', pose: 'throw', x: s.x + rx * side * (3 + k * 0.9) + Math.sin(s.h) * (k * 1.6 - 0.8), z: s.z + rz * side * (3 + k * 0.9) + Math.cos(s.h) * (k * 1.6 - 0.8), h: Math.atan2(-rx * side, -rz * side), top: s.col, pack: 0 }); n.y = W.ground(n.x, n.z); n.cur = 0; m.cleanup(() => G.crowd.remove(n)); } }
      const bar = new THREE.Mesh(new THREE.BoxGeometry(7.4, 0.3, 0.16), lm(s.col)); bar.position.set(s.x, W.ground(s.x, s.z) + 3.4, s.z); bar.rotation.y = s.h; G.scene.add(bar); props.push(bar);
    }
    // fellow runners
    const runners = [];
    for (let i = 0; i < 9; i++) { const n = G.crowd.make({ scripted: true, state: 'fixed', top: 0xfafafa, pack: 0, x: st.x, z: st.z }); n.rs = 2 + Math.random() * 6; n.rv = 0; n.vmax = 4.3 + Math.random() * 1.7; n.lat = (Math.random() - 0.5) * 4.4; n.next = 0; runners.push(n); m.cleanup(() => G.crowd.remove(n)); }
    const cc = new THREE.Color(); let go = false;
    const stopR = M.tick(dt => { for (const n of runners) { if (go && n.rs < LEN - 1) n.rv = G.damp(n.rv, n.vmax, 1.5, dt); else n.rv = G.damp(n.rv, 0, 4, dt); n.rs += n.rv * dt; const p = at(n.rs); n.x = p[0] + Math.cos(p[2]) * n.lat; n.z = p[1] - Math.sin(p[2]) * n.lat; n.h = p[2]; n.y = W.ground(n.x, n.z); n.cur = n.rv; n.phase += dt * (4.5 + n.rv * 1.55); n.pose = n.rs >= LEN - 1 ? 'cheer' : null; if (n.next < stations.length && n.rs > stations[n.next].s) { cc.set(n.top).lerp(new THREE.Color(stations[n.next].col), 0.42); n.top = cc.getHex(); n.dirty = true; n.next++; if (G.dist(n.x, n.z, P.pos.x, P.pos.z) < 40) G.fx.burst({ x: n.x, y: n.y + 1.2, z: n.z, n: 26, color: stations[n.next - 1].col, speed: 4, size: 0.3, life: 1.2, gravity: 2 }); } } });
    m.cleanup(stopR);
    await m.talk([{ av: 'coach', text: ['欢迎来到新生杯开幕式——*彩色跑*！不计名次，只管开心：沿路 5 个彩粉站，一个都别漏。', 'Welcome to the Freshman Cup opener — the *Color Run*! No rankings, just joy: five powder stations along the route, hit them all.'] }, { av: 'sofia', text: ['{name}！一起跑吧！在我们那儿可没有这么酷的开学活动。', "{name}! Let's run together! We have nothing this cool back home."] }, { av: 'roommate', text: ['白 T 恤已就位。配速别太猛，留点体力冲刺——按住 Shift 会掉体力条。', 'White tee: ready. Pace yourself and save some for the finish — holding Shift drains your stamina bar.'] }]);
    for (const t of ['3', '2', '1', L('跑！', 'GO!')]) { ui.banner('', t, ''); G.audio.sfx(t.length === 1 ? 'tick' : 'ok'); await G.sleep(auto() ? 10 : 650); }
    m.lock(false); go = true; P.speedMul = 1.32; P.noVehicle = true; M.quiet = true; const t0 = G.t;
    for (let i = 0; i < stations.length; i++) {
      const s = stations[i];
      await m.goto({ x: s.x, z: s.z }, { text: L(`冲向 <b>${s.name}色站</b>（${i + 1}/5）`, `Run to the <b>${s.name} station</b> (${i + 1}/5)`), icon: s.em, r: 4.2, color: s.col });
      G.audio.sfx('powder'); P.char.splat(s.col); G.cam.shake = 0.35; ui.toast(`${s.em} ${L(s.name + '色站！', s.name + ' station!')}`, 2);
      for (let k = 0; k < 3; k++) G.fx.burst({ x: P.pos.x + (Math.random() - 0.5) * 3, y: P.pos.y + 1.2, z: P.pos.z + (Math.random() - 0.5) * 3, n: 70, color: s.col, speed: 6, up: 0.9, size: 0.38, life: 1.7, gravity: 2.5, drag: 1.6 });
    }
    await m.goto({ x: en.x, z: en.z }, { text: L('最后冲刺！终点在<b>启动区广场</b>', 'Final sprint! The finish is at the <b>Start-up Zone Square</b>'), icon: '🏁', r: 5, color: 0xffffff });
    const time = G.t - t0, par = LEN / 5.6; P.speedMul = 1; m.lock(true); P.pose = 'cheer'; G.audio.sfx('win'); G.fx.confetti(P.pos.x, P.pos.y + 2.5, P.pos.z, 160);
    ui.banner(L('冲线！', 'FINISH!'), M.fmtSec(time), L(`全程 ${Math.round(LEN)} 米 · 5 个彩粉站`, `${Math.round(LEN)} m · 5 powder stations`)); await m.wait(2.6);
    ui.toast(L('💦 终点彩蛋：水球大战！', '💦 Finish-line surprise: water-balloon fight!'), 3);
    for (let k = 0; k < 9; k++) { G.audio.sfx('splash'); G.fx.burst({ x: P.pos.x + (Math.random() - 0.5) * 7, y: P.pos.y + 0.6, z: P.pos.z + (Math.random() - 0.5) * 7, n: 36, colors: [0x7fc4ee, 0xbfe6ff, 0xffffff], speed: 5, size: 0.24, life: 0.9 }); await G.sleep(auto() ? 5 : 260); }
    G.audio.sfx('shutter'); P.pose = null;
    const s = G.clamp(par / time, 0.3, 1); return { grade: M.gradeOf(s + 0.12), note: [`用时 ${M.fmtSec(time)}`, `Time ${M.fmtSec(time)}`] };
  };

  // ================================================================ High Table
  S_.hightable = async function (m) {
    const P = G.player; await M.scene(m, 17.55, 4); m.lock(true);
    await m.talk([{ av: 'roommate', text: ['今晚是书院的高桌晚宴！通知上写着：*学生袍 + 正装*。你准备穿什么？', "Tonight is our college's High Table Dinner! The notice says: *gown + formal dress*. What are you wearing?"] }]);
    const d = await mini.dress(); P.char.setOutfit('gown'); m.cleanup(() => P.char.setOutfit(null));
    const hall = C.pos('礼文堂'), dist = G.nav.route(P.pos.x, P.pos.z, hall.x, hall.z).len;
    const k = await m.choice('tutor', [`很精神！晚宴 18:30 在*礼文堂*开始（离这里约 ${Math.round(dist)} 米）。书院安排了大巴，你也可以自己过去。`, `Looking sharp! Dinner starts at 18:30 in *Liwen Hall* (about ${Math.round(dist)} m away). The college has a coach, or you can make your own way.`], [['🚌 坐书院大巴', '🚌 Take the college coach'], ['🚲 自己过去（看看傍晚的校园）', '🚲 Go on my own (enjoy the campus at dusk)']]);
    let late = false;
    if (k === 0) { await m.fade(true, 500); const p = C.off('礼文堂', 4, 0) || hall; P.teleport(p.x, p.z, hall.h); m.hour(18.42, 4); await G.sleep(300); await m.fade(false, 600); }
    else { m.lock(false); const ok = await m.goto('礼文堂', { text: L('在 <b>18:30</b> 前赶到<b>礼文堂</b>（可以骑车）', 'Reach <b>Liwen Hall</b> before <b>18:30</b> (bikes allowed)'), icon: '🍽️', r: 6, timer: Math.max(90, dist / 3.6 + 50) }); late = !ok; if (late) { await m.fade(true, 400); P.teleport(hall.x, hall.z, hall.h); await m.fade(false, 400); } }
    m.lock(true); if (P.vehicle) G.veh.dismount(true);
    await scene2(m, 18.5);
    await m.talk([late ? { av: 'tutor', text: ['你迟到了几分钟，悄悄从侧门进来吧。下次记得提前出发。', 'A few minutes late — slip in by the side door. Leave earlier next time.'] } : { av: 'tutor', text: ['准时到达。座位已经排好了，你在第三桌。', 'Right on time. Seating is arranged — you are at table three.'] }, { av: 'mc', text: ['各位来宾、各位同学，晚上好。请全体起立，欢迎高桌嘉宾入场——', 'Distinguished guests and students, good evening. Please rise to welcome the high-table party —'] }]);
    const e = await mini.etiquette();
    await m.talk([{ av: 'master', text: ['高桌晚宴不只是一顿饭。它让不同专业、不同年级、不同国家的人坐在同一张桌前——这就是书院。', 'High Table is more than a meal. It seats people of different majors, years and countries at one table — that is what a college is.'] }, { av: 'guest', text: e.score >= 0.6 ? ['刚才那位同学的问题很好。保持提问的习惯，它会带你走得很远。', 'That was a fine question earlier. Keep asking — the habit will take you far.'] : ['第一次参加难免紧张。多来几次，你会享受这样的夜晚。', 'Nerves are natural the first time. A few more of these and you will enjoy such evenings.'] }, { av: 'sofia', text: ['干杯！（葡萄汁也可以很有仪式感，对吧？）', 'Cheers! (Grape juice can be ceremonial too, right?)'] }]);
    G.audio.sfx('clink');
    const s = d.score * 0.3 + e.score * 0.6 + (late ? 0 : 0.1); return { grade: M.gradeOf(s), note: [late ? '迟到了一会儿' : '准时赴宴', late ? 'A little late' : 'On time'] };
  };
  async function scene2(m, hour) { await m.fade(true, 350); m.hour(hour); await G.sleep(auto() ? 5 : 200); await m.fade(false, 450); }

  // ================================================================ drone light show
  function lightShow(cx, cz, dur) {
    return new Promise(res => {
      const N = 1500, pos = new Float32Array(N * 3), col = new Float32Array(N * 3), cv = G.canvas(64, 64), x = cv.getContext('2d'), gr = x.createRadialGradient(32, 32, 0, 32, 32, 32); gr.addColorStop(0, 'rgba(255,255,255,1)'); gr.addColorStop(0.3, 'rgba(255,255,255,.6)'); gr.addColorStop(1, 'rgba(255,255,255,0)'); x.fillStyle = gr; x.fillRect(0, 0, 64, 64);
      const geo = new THREE.BufferGeometry(); geo.setAttribute('position', new THREE.BufferAttribute(pos, 3)); geo.setAttribute('color', new THREE.BufferAttribute(col, 3));
      const pts = new THREE.Points(geo, new THREE.PointsMaterial({ size: 2.3, map: G.canvasTex(cv), vertexColors: true, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, fog: false })); pts.frustumCulled = false; G.scene.add(pts);
      // pick a viewing direction with a clear line of sight to the sky above the hall
      let ang = 0, best = -1e9, camY = 26;
      for (let k = 0; k < 16; k++) { const a = k / 16 * G.TAU, px = cx + Math.sin(a) * 165, pz = cz + Math.cos(a) * 165; if (!W.inWorld(px, pz, 40) || W.buildingAt(px, pz)) continue; const gy = W.ground(px, pz), t = G.col.ray(px, pz, cx, cz, gy + 22, 80), sc = (t >= 0.999 ? 10 : t) - gy * 0.05; if (sc > best) { best = sc; ang = a; camY = gy + 22; } }
      const fx = -Math.sin(ang), fz = -Math.cos(ang), rx = -fz, rz = fx, D = 20, at = (u, v, d = D) => [cx + rx * u + fx * d, v, cz + rz * u + fz * d];
      const text = (str, width, font) => { const c = G.canvas(480, 128), t = c.getContext('2d'); t.fillStyle = '#fff'; t.font = font || '700 96px "Microsoft YaHei","PingFang SC","Noto Sans SC",sans-serif'; t.textAlign = 'center'; t.textBaseline = 'middle'; t.fillText(str, 240, 68); const d = t.getImageData(0, 0, 480, 128).data; let cand = []; for (let st = 2; st < 9; st++) { cand = []; for (let yy = 0; yy < 128; yy += st) for (let xx = 0; xx < 480; xx += st) if (d[(yy * 480 + xx) * 4 + 3] > 128) cand.push([xx, yy]); if (cand.length <= N) break; } const sh = G.shuffle(cand), out = []; for (let i = 0; i < N; i++) { const p = sh[i % sh.length]; out.push(at((p[0] - 240) / 480 * width, 88 - (p[1] - 64) / 480 * width)); } return out; };
      const heart = () => { const out = []; for (let i = 0; i < N; i++) { const t = i / N * G.TAU, k = [1, 0.8, 0.6, 0.4][i % 4]; out.push(at(16 * Math.pow(Math.sin(t), 3) * 2.9 * k, 90 + (13 * Math.cos(t) - 5 * Math.cos(2 * t) - 2 * Math.cos(3 * t) - Math.cos(4 * t)) * 2.9 * k)); } return out; };
      const ground = () => { const out = []; for (let i = 0; i < N; i++) out.push(at((Math.random() - 0.5) * 70, W.ground(cx, cz) + 2 + Math.random() * 4, D + (Math.random() - 0.5) * 30)); return out; };
      const F = [ground(), text(L('港中深', 'CUHK-SZ'), 250), heart(), text(L('欢迎你', 'WELCOME'), 250)], SEG = [[0, 3], [6.3, 8.3], [10.6, 12.4]], cols = [[1, 0.85, 0.4], [1, 0.85, 0.4], [1, 0.45, 0.6], [0.7, 0.55, 1]];
      const cam = G.cam, keep = cam.mode; cam.mode = 'manual'; cam.pos.set(cx + Math.sin(ang) * 165, camY, cz + Math.cos(ang) * 165); cam.target.set(cx + fx * D, 76, cz + fz * D); let t = 0;
      const stop = M.tick(dt => {
        t += dt * (auto() ? 30 : 1); let seg = 0, k0 = 1; for (let q = 0; q < SEG.length; q++) { seg = q; if (t < SEG[q][0]) { k0 = 0; break; } if (t <= SEG[q][1]) { k0 = (t - SEG[q][0]) / (SEG[q][1] - SEG[q][0]); break; } k0 = 1; }
        const a = F[seg], b = F[seg + 1], k = k0 * k0 * (3 - 2 * k0), ca = cols[seg], cb = cols[seg + 1], fade = t > dur - 1.5 ? Math.max(0, (dur - t) / 1.5) : 1;
        for (let i = 0; i < N; i++) { const w = Math.sin(t * 2 + i) * 0.16; pos[i * 3] = a[i][0] + (b[i][0] - a[i][0]) * k + w * rx; pos[i * 3 + 1] = a[i][1] + (b[i][1] - a[i][1]) * k + Math.cos(t * 1.7 + i * 0.7) * 0.16; pos[i * 3 + 2] = a[i][2] + (b[i][2] - a[i][2]) * k + w * rz; const tw = (0.5 + 0.2 * Math.sin(t * 5 + i * 1.3)) * fade; col[i * 3] = (ca[0] + (cb[0] - ca[0]) * k) * tw; col[i * 3 + 1] = (ca[1] + (cb[1] - ca[1]) * k) * tw; col[i * 3 + 2] = (ca[2] + (cb[2] - ca[2]) * k) * tw; }
        geo.attributes.position.needsUpdate = true; geo.attributes.color.needsUpdate = true;
        if (t >= dur) { stop(); G.scene.remove(pts); cam.mode = keep; cam.snap = true; res(); }
      });
    });
  }
  S_.lightShow = lightShow;

  // ================================================================ concert finale
  S_.concert = async function (m) {
    const P = G.player, c = C.pos('concert'); await M.scene(m, 19.45, 7); G.sky.setWeather('clear'); m.lock(true);
    await m.talk([{ av: 'c_music', text: ['你来啦！指挥老师在等你。别紧张——你只要跟着落下的音符，把主旋律"点"出来就行。', 'You made it! The conductor is waiting. Relax — just follow the falling notes and tap out the melody.'] }, { av: 'conductor', text: ['今晚的曲目是《茉莉花》和《欢乐颂》——一首东方，一首西方。这所大学的使命正是"结合传统与现代，融会中国与西方"。', 'Tonight we play "Jasmine Flower" and "Ode to Joy" — one from the East, one from the West. This university\'s mission is exactly that: to combine tradition with modernity and bring together China and the West.'] }, { av: 'conductor', text: ['你来演奏主旋律，乐团为你伴奏。准备好了吗？', 'You carry the melody; the orchestra accompanies you. Ready?'] }]);
    const r = await mini.rhythm('concert');
    await m.talk([{ av: 'conductor', text: r.score >= 0.75 ? ['Bravo！你听——这是为你响起的掌声。', 'Bravo! Listen — that applause is for you.'] : ['音乐不怕错音，只怕不敢开始。谢谢你站上来。', "Music forgives wrong notes; it only fears the ones never played. Thank you for stepping up."] }, { av: 'roommate', text: ['{name}！太帅了！快出来，外面还有惊喜——', '{name}! That was amazing! Come outside, there is one more surprise —'] }]);
    G.audio.sfx('win'); ui.banner(L('无人机灯光秀', 'DRONE LIGHT SHOW'), L('神仙岭之夜', 'A Night Under the Ridge'), ''); ui.objective(null);
    $hud(false); await lightShow(c.x, c.z, 15.5); $hud(true);
    return { grade: M.gradeOf(r.score), note: [`Perfect ${r.perf} · Good ${r.good} · Miss ${r.miss}`, `Perfect ${r.perf} · Good ${r.good} · Miss ${r.miss}`], stamp: L('圆满', 'BRAVO') };
  };
  const $hud = on => { document.getElementById('hud').classList.toggle('hidden', !on); ui.hideLabels = !on; };

  S_.epilogue = async function () {
    const S = G.S(); S.flags.finished = 1;
    await ui.dialog([
      { av: 'lin', text: ['一周前，你站在校门口，连宿舍都找不到。', "A week ago you stood at the gate and couldn't even find your dorm."] },
      { av: 'lin', text: ['现在你会找书、会看病、会求助、会和陌生人碰杯，还敢向校长提问。这就是*适应力*——它不是天生的，是一步步走出来的。', "Now you can find a book, see a doctor, ask for help, clink glasses with strangers and put a question to the President. That is *adaptability* — nobody is born with it; you walk your way into it."] },
      { av: 'roommate', text: ['大学才刚开始呢。走，夜宵去！', 'University has only just begun. Come on — late-night snacks!'] }
    ]);
    ui.banner(L('第一周 · 完', 'WEEK ONE · COMPLETE'), L('神仙岭下', 'Campus Odyssey'), L('自由探索已解锁：打卡地标、寻找校园猫、航拍校园', 'Free roam unlocked: landmarks, campus cats, aerial tours'));
    G.save.store(); if (!auto()) { await G.sleep(1800); ui.report(); }
  };

  // ================================================================ aerial tour (drone)
  S_.dronetour = async function (m) {
    const P = G.player, b = n => W.find(n), mk = (bb, extra, zh, en) => bb && ({ x: bb.cx, z: bb.cz, y: bb.h + extra, zh, en });
    const stops = [mk(b('钟楼'), 20, '钟楼：取意密檐塔，同学们叫它"薯塔"。', 'The Clock Tower, modelled on a pagoda — students call it the "Potato Tower".'), mk(b('逸夫书院A栋'), 22, '逸夫书院：下园的书院，离教学楼最近。', 'Shaw College, the Lower Campus college closest to class.'), mk(b('学生中心'), 26, '学生中心：CPDO、心理咨询、饭堂都在这里。', 'Student Centre: CPDO, counselling and a canteen.'), mk(b('大学图书馆'), 28, '大学图书馆与门前的镜面水池。', 'The University Library and its reflecting pool.'), mk(b('教学楼C'), 30, 'W 形的教学楼群（TA–TD）。', 'The W-shaped teaching cluster (TA–TD).'), mk(b('行政楼'), 30, '行政楼广场：彩色跑从这里出发。', 'Administration Square, start of the Color Run.'), mk(b('逸夫国际会议中心'), 34, '会议中心与北湖。背后就是铜鼓岭。', 'The conference centre and North Pond, with Tonggu Ridge behind.')].filter(Boolean);
    m.lock(true); await m.talk([{ av: 'c_drone', text: ['带你飞一圈下园！依次穿过空中的<b>金色光环</b>就行。', "Let's do a lap of the Lower Campus! Just fly through the <b>golden rings</b> in order."].map(s => s.replace(/<\/?b>/g, '*')) }]); m.lock(false);
    const v = G.veh.launchDrone({ range: 1200 }); if (!v) return false; v.noExit = false;
    const ringG = new THREE.TorusGeometry(7, 0.5, 8, 28), ringM = new THREE.MeshBasicMaterial({ color: 0xffd257, fog: false, transparent: true, opacity: 0.9 }), ring = new THREE.Mesh(ringG, ringM); G.scene.add(ring); m.cleanup(() => G.scene.remove(ring));
    let px = P.pos.x, pz = P.pos.z, aborted = false;
    for (let i = 0; i < stops.length; i++) {
      const s = stops[i]; ring.position.set(s.x, s.y, s.z); ring.rotation.y = Math.atan2(s.x - px, s.z - pz); px = s.x; pz = s.z;
      const mark = ui.mark({ x: s.x, z: s.z, y: s.y, h: 0, icon: '⭕', label: [`${i + 1}/${stops.length}`, `${i + 1}/${stops.length}`], near: 0 }); m.objective(L(`穿过第 <b>${i + 1}/${stops.length}</b> 个光环（Space 上升 · C 下降）`, `Fly through ring <b>${i + 1}/${stops.length}</b> (Space up · C down)`));
      if (auto()) { v.x = s.x; v.y = s.y; v.z = s.z; }
      try { await m.until(() => { ring.rotation.z += 0.02; ring.scale.setScalar(1 + 0.06 * Math.sin(G.t * 4)); if (!P.vehicle) { aborted = true; return true; } return Math.hypot(v.x - s.x, v.y - s.y, v.z - s.z) < 8.5; }); } finally { mark.remove(); }
      if (aborted) break; G.audio.sfx('pick'); G.fx.burst({ x: s.x, y: s.y, z: s.z, n: 40, color: 0xffd257, speed: 9, size: 0.5, life: 1.0, gravity: 0 }); ui.toast('🛸 ' + L(s.zh, s.en), 4.5);
    }
    if (aborted) { ui.toast(L('无人机提前降落了。回到起点可以重新开始。', 'The drone landed early. Head back to the start to retry.')); return false; }
    await m.wait(1.2); if (P.vehicle) G.veh.dismount(true);
    return { grade: 'S', note: [L('航线完成', 'Route complete'), 'Route complete'] };
  };
})();
