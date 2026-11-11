/* minigames I: quiz helper, dorm, library, the 8:30 dash (3D runner), course experience, basketball */
(function () {
  'use strict';
  const G = window.G, W = G.world, ui = G.ui, L = G.L, I = G.input;
  const mini = G.mini = {};
  const auto = () => G.query.has('fastdlg');
  mini.auto = auto;
  const css = document.createElement('style');
  css.textContent = `
  .shelf{display:flex;align-items:flex-end;justify-content:center;gap:0;padding:18px 8px 0;border-bottom:14px solid #8a5a34;background:linear-gradient(180deg,#efe2c8,#e2d0ae);border-radius:10px 10px 0 0;min-height:250px;overflow-x:auto}
  .spine{width:62px;height:206px;border-radius:5px 5px 2px 2px;display:flex;flex-direction:column;justify-content:space-between;align-items:center;padding:8px 3px 6px;color:#fff;font-size:11px;font-weight:700;box-shadow:inset -5px 0 8px rgba(0,0,0,.22),inset 3px 0 4px rgba(255,255,255,.18);flex:none}
  .spine .tt{writing-mode:vertical-rl;letter-spacing:2px;font-size:12px;max-height:120px;overflow:hidden}
  .spine .cn{background:#fff;color:#222;border-radius:3px;padding:2px 3px;font-size:10px;line-height:1.25;text-align:center;font-family:Consolas,monospace;width:100%}
  .gap{width:26px;height:206px;border:2px dashed rgba(75,42,123,.28);background:none;border-radius:6px;flex:none;font-size:18px;color:#7a5a2a;transition:.12s}
  .gap:hover{border-color:#4b2a7b;background:rgba(75,42,123,.14)}
  .hand{display:flex;gap:14px;align-items:center;justify-content:center;margin:14px 0 4px}
  .hand .spine{height:150px;transform:rotate(-6deg);box-shadow:0 8px 18px rgba(0,0,0,.3)}
  .big{font-size:64px;line-height:1.1;text-align:center}.cd{height:8px;border-radius:5px;background:rgba(75,42,123,.15);overflow:hidden;margin:10px auto;max-width:420px}.cd i{display:block;height:100%;background:linear-gradient(90deg,#19b5a5,#e5b53b)}
  .prob{display:flex;align-items:center;gap:8px;margin:5px 0;font-size:14px}.prob b{width:84px;text-align:right}.prob span{height:16px;border-radius:5px;background:linear-gradient(90deg,#6a3fa8,#e5b53b);transition:width .8s cubic-bezier(.2,.8,.2,1)}.prob i{font-style:normal;font-variant-numeric:tabular-nums;font-size:12px;opacity:.75}
  .ctx{font-size:22px;font-weight:700;text-align:center;padding:14px;border-radius:14px;background:#fff;border:1.5px solid rgba(75,42,123,.2);margin-bottom:12px;font-family:var(--serif)}.ctx u{color:#4b2a7b;text-decoration:none;border-bottom:3px solid #e5b53b;padding:0 18px}
  .chat{display:flex;flex-direction:column;gap:9px;max-height:46vh;overflow:auto;padding:4px 2px 10px}.msg{max-width:82%;padding:9px 14px;border-radius:16px;font-size:14.5px;line-height:1.5;animation:tin .25s}.msg.ai{align-self:flex-start;background:#e6f6f3;border:1px solid #9fd9d0;color:#103b36;border-bottom-left-radius:4px}.msg.me{align-self:flex-end;background:#4b2a7b;color:#fff;border-bottom-right-radius:4px}.msg.sys{align-self:center;background:rgba(229,181,59,.22);font-size:12.5px;border-radius:10px;text-align:center}
  .msg.ai b{color:#0c7d70}.chips{display:flex;flex-direction:column;gap:7px;margin-top:6px}.typing{align-self:flex-start;font-size:13px;opacity:.6;padding:4px 10px}
  .slot{display:flex;gap:8px;align-items:center;margin:7px 0}.slot>b{width:66px;font-size:13px;color:#4b2a7b}.slot .card{flex:1;text-align:center;padding:8px 6px}.slot .card .em{font-size:30px}
  .rs{display:flex;gap:10px;align-items:flex-start;padding:9px 12px;border-radius:12px;background:#fff;border:1.5px solid rgba(75,42,123,.16);margin:6px 0;font-size:14px;line-height:1.45;text-align:left;width:100%;color:#231a33}.rs.sel{border-color:#4b2a7b;background:#f1e8ff}.rs.ok{border-color:#3fbf7f;background:#e6f8ee}.rs.bad{border-color:#e5534b;background:#fdebea}
  .job{padding:12px 16px;border-radius:14px;background:linear-gradient(135deg,#4b2a7b,#6a3fa8);color:#fff;font-size:14px;line-height:1.55;margin-bottom:10px}.job b{color:#f6d57a}
  .pstage{display:grid;grid-template-columns:230px 1fr;gap:20px;align-items:start}.pstage img,.pstage canvas{width:230px;height:230px;border-radius:22px;border:3px solid #e5b53b;object-fit:cover;background:#3a2462}
  .quote{font-family:var(--serif);font-size:19px;line-height:1.75;padding:14px 18px;border-left:4px solid #e5b53b;background:rgba(255,255,255,.07);border-radius:0 14px 14px 0;min-height:120px}
  @media (max-width:760px){.pstage{grid-template-columns:1fr}.pstage img,.pstage canvas{width:150px;height:150px;margin:0 auto;display:block}.spine{width:50px}.gap{width:20px}}`;
  document.head.appendChild(css);

  // one multiple-choice question rendered into `host`
  mini.ask = function (host, q) {
    return new Promise(res => {
      host.innerHTML = `${q.pre || ''}<p class="lead">${G.tx(q.q)}</p><div class="grid ${q.cols === 1 ? '' : 'g2'}"></div><div class="fb"></div>`;
      const grid = host.querySelector('.grid'), fb = host.querySelector('.fb'); let locked = false;
      const order = q.keep ? q.opts.map((_, i) => i) : G.shuffle(q.opts.map((_, i) => i)); let autoBtn = null;
      order.forEach(oi => {
        const o = q.opts[oi], b = ui.h(`<button class="card">${o.em ? `<span class="em">${o.em}</span>` : ''}${G.tx(o.t)}</button>`);
        b.onclick = () => {
          if (locked) return; locked = true; const ok = !!o.ok; b.classList.add(ok ? 'ok' : 'bad'); G.audio.sfx(ok ? 'ok' : 'bad');
          if (!ok) [...grid.children].forEach((c, j) => { if (q.opts[order[j]].ok) c.classList.add('ok'); });
          fb.className = 'fb ' + (ok ? 'ok' : 'bad'); fb.innerHTML = (ok ? '✔ ' : '✘ ') + G.tx(o.why || q.why || '');
          if (q.after) q.after(host, oi, ok);
          setTimeout(() => res({ ok, idx: oi, part: o.part || 0 }), auto() ? 25 : (ok ? 1200 : 2500) + (q.hold || 0));
        };
        grid.appendChild(b); if (o.ok && !autoBtn) autoBtn = b;
      });
      if (auto() && autoBtn) setTimeout(() => autoBtn.click(), 25);
    });
  };
  const waitBtn = (p, label) => new Promise(res => { p.clearButtons(); const b = p.button(label || L('继续', 'Continue'), 'gold', () => { p.clearButtons(); res(); }); if (auto()) setTimeout(() => b.click(), 25); });
  mini.waitBtn = waitBtn;

  // ================================================================ dorm: roommate agreement + unpacking
  mini.dorm = async function () {
    const p = ui.panel({ title: L('室友公约', 'Roommate Agreement'), sub: L('把话说在前头', 'Talk it through first'), icon: '🤝' });
    const qs = [
      { q: ['<b>作息</b>：小航习惯凌晨 1 点睡，你习惯 11 点。你怎么说？', '<b>Sleep</b>: Hang sleeps at 1 a.m., you at 11 p.m. What do you say?'], opts: [
        { t: ['"12 点后你用台灯和耳机，我戴眼罩耳塞，怎么样？"', '"After midnight you use a desk lamp and headphones, and I\'ll wear an eye mask and earplugs — deal?"'], ok: 1, why: ['各退一步，具体可执行。', 'A concrete compromise both can keep.'] },
        { t: ['"你必须 11 点熄灯。"', '"You must turn the lights off at 11."'], why: ['单方面要求容易引发对抗。', 'One-sided demands invite pushback.'] },
        { t: ['"没事，我都行。"（其实很介意）', '"It\'s fine, whatever." (You actually mind.)'], part: 0.4, why: ['回避一时爽，矛盾会攒到后面。把需求说出来。', "Avoiding it now stores up trouble. Say what you need."] }] },
      { q: ['<b>空调</b>：你怕冷，小航怕热。', '<b>Air-con</b>: you get cold easily; Hang runs hot.'], opts: [
        { t: ['"定 26 度？我加件外套，你那边开个小风扇。"', '"Set it at 26°C? I\'ll wear a layer and you can use a small fan."'], ok: 1, why: ['找到中间值，各自再微调。', 'Meet in the middle, then adjust individually.'] },
        { t: ['趁他不注意偷偷调高。', 'Quietly turn it up when he is not looking.'], why: ['暗中较劲只会让信任流失。', 'A secret thermostat war erodes trust.'] },
        { t: ['"谁先回宿舍谁说了算。"', '"Whoever gets back first decides."'], part: 0.4, why: ['算个规则，但总有一方不舒服。', 'It is a rule, but someone always loses.'] }] },
      { q: ['<b>卫生</b>：公共区域谁来打扫？', '<b>Cleaning</b>: who looks after the shared areas?'], opts: [
        { t: ['"排个值日表，周日晚上一起大扫除。"', '"Let\'s make a rota and do a big clean together on Sunday nights."'], ok: 1, why: ['写下来的约定最不容易扯皮。', 'A written rota avoids arguments.'] },
        { t: ['"谁看不下去谁打扫。"', '"Whoever can\'t stand the mess cleans it."'], why: ['最后总是同一个人在打扫。', 'The same person always ends up cleaning.'] },
        { t: ['"各扫各的桌面，公共区域再说。"', '"We each clean our own desk; shared areas later."'], part: 0.4, why: ['"再说"通常等于"没人管"。', '"Later" usually means "never".'] }] }
    ];
    let pts = 0;
    for (let i = 0; i < qs.length; i++) { p.stat(`${i + 1}/${qs.length}`); const r = await mini.ask(p.body, Object.assign({ cols: 1 }, qs[i])); pts += r.ok ? 1 : r.part; }
    // unpacking
    const targets = [['📚', L('书架', 'Bookshelf')], ['👔', L('衣柜', 'Wardrobe')], ['🖥', L('书桌', 'Desk')], ['🚿', L('洗漱台', 'Sink')]];
    const items = G.shuffle([['📘', L('专业教材', 'Textbook'), 0], ['👕', L('衬衫', 'Shirt'), 1], ['💻', L('笔记本电脑', 'Laptop'), 2], ['🧼', L('香皂', 'Soap'), 3], ['🧥', L('外套', 'Jacket'), 1], ['🧴', L('洗发水', 'Shampoo'), 3], ['💡', L('台灯', 'Desk lamp'), 2], ['📖', L('小说', 'Novel'), 0]]);
    p.body.innerHTML = `<p class="lead">${L('<b>限时收纳</b>：行李里的东西该放哪儿？点击家具或按 <b>1–4</b>。', '<b>Speed unpacking</b>: where does each thing go? Click a spot or press <b>1–4</b>.')}</p><div class="big" id="uItem"></div><div style="text-align:center;font-weight:700" id="uName"></div><div class="cd"><i id="uBar" style="width:100%"></i></div><div class="grid g4" id="uT"></div><div class="fb" style="text-align:center"></div>`;
    const tEl = p.body.querySelector('#uT'), fb = p.body.querySelector('.fb'); let cur = null, right = 0;
    targets.forEach((t, k) => { const b = ui.h(`<button class="card" style="text-align:center"><span class="em">${t[0]}</span><b>${k + 1}</b> ${t[1]}</button>`); b.onclick = () => cur && cur(k); tEl.appendChild(b); });
    for (let i = 0; i < items.length; i++) {
      const it = items[i]; p.stat(`${i + 1}/${items.length}`); p.body.querySelector('#uItem').textContent = it[0]; p.body.querySelector('#uName').textContent = it[1];
      const ok = await new Promise(res => {
        let t = 4.2; const bar = p.body.querySelector('#uBar');
        const iv = setInterval(() => { t -= 0.1; bar.style.width = Math.max(0, t / 4.2 * 100) + '%'; if (t <= 0) fin(-1); }, 100);
        const key = c => { if (/^Digit[1-4]$/.test(c)) fin(+c.slice(5) - 1); };
        const fin = k => { if (!cur) return; cur = null; clearInterval(iv); G.off('key', key); const good = k === it[2]; G.audio.sfx(good ? 'drop' : 'bad'); fb.className = 'fb ' + (good ? 'ok' : 'bad'); fb.textContent = good ? '✔' : `✘ → ${targets[it[2]][1]}`; [...tEl.children].forEach((c, j) => { c.classList.remove('ok', 'bad'); if (j === it[2]) c.classList.add('ok'); else if (j === k) c.classList.add('bad'); }); setTimeout(() => { [...tEl.children].forEach(c => c.classList.remove('ok', 'bad')); res(good); }, auto() ? 20 : 420); };
        cur = fin; G.on('key', key); if (auto()) setTimeout(() => fin(it[2]), 20);
      });
      if (ok) right++;
    }
    p.close();
    return { score: (pts / qs.length) * 0.55 + (right / items.length) * 0.45 };
  };

  // ================================================================ library: shelving by call number + self-checkout
  mini.library = async function () {
    const p = ui.panel({ title: L('图书馆 · 归架挑战', 'Library · Shelving Challenge'), sub: L('索书号（美国国会图书馆分类法）', 'Call numbers (Library of Congress)'), icon: '📚' });
    const colors = ['#8a3b3b', '#3b5a8a', '#3f7a5a', '#8a6a2f', '#5a3f8a', '#2f7a8a', '#8a4a6a'];
    const rounds = [
      { tip: L('第 1 关 · <b>先比字母</b>：按字母表顺序 B → H → P → Q。', 'Round 1 · <b>Letters first</b>: alphabetical — B → H → P → Q.'), hand: ['PN1995', '.B6', L('电影的语言', 'Film Language')], shelf: [['B105', '.C45', L('哲学导论', 'Philosophy')], ['HB171', '.M33', L('经济学原理', 'Economics')], ['PL2658', '.E8', L('唐诗选', 'Tang Poems')], ['Q325.5', '.G66', L('深度学习', 'Deep Learning')], ['QA76.9', '.N38', L('自然语言处理', 'NLP')]], pos: 3, why: L('PN 在 PL 之后、Q 之前。', 'PN comes after PL and before Q.') },
      { tip: L('第 2 关 · <b>再比数字</b>：小数点后按小数比较——76.73 比 76.9 小！', 'Round 2 · <b>Then numbers</b>: decimals compare as decimals — 76.73 is smaller than 76.9!'), hand: ['QA76.73', '.P98', L('Python 编程', 'Python')], shelf: [['QA76.5', '.T36', L('计算机系统', 'Systems')], ['QA76.6', '.K58', L('算法设计', 'Algorithms')], ['QA76.9', '.D3', L('数据库', 'Databases')], ['QA77', '.B4', L('数值方法', 'Numerical')], ['QA90', '.S7', L('数学建模', 'Modelling')]], pos: 2, why: L('76.6 < 76.73 < 76.9。', '76.6 < 76.73 < 76.9.') },
      { tip: L('第 3 关 · <b>最后比作者号</b>：类号相同，就看 . 后面的字母。', 'Round 3 · <b>Finally the author code</b>: same class number, so compare the letter after the dot.'), hand: ['QA76.9', '.N38', L('语音与语言处理', 'Speech & Language')], shelf: [['QA76.9', '.A25', L('信息安全', 'Security')], ['QA76.9', '.D3', L('数据挖掘', 'Data Mining')], ['QA76.9', '.H85', L('人机交互', 'HCI')], ['QA76.9', '.S88', L('系统分析', 'Sys. Analysis')], ['QA76.9', '.U83', L('用户体验', 'UX')]], pos: 3, why: L('N 在 H 之后、S 之前。', 'N comes after H and before S.') }
    ];
    const spine = (b, i) => `<div class="spine" style="background:${colors[i % colors.length]}"><span class="tt">${b[2]}</span><span class="cn">${b[0]}<br>${b[1]}</span></div>`;
    let score = 0;
    for (let r = 0; r < rounds.length; r++) {
      const R = rounds[r]; p.stat(`${r + 1}/${rounds.length + 1}`); let tries = 0;
      const ok = await new Promise(res => {
        p.body.innerHTML = `<p class="lead">${R.tip}</p><div class="hand"><span>${L('手里的书 →', 'Book in hand →')}</span>${spine(R.hand, 6)}<span>${L('点书架上正确的<b>空位</b>', 'Click the right <b>gap</b> on the shelf')}</span></div><div class="shelf"></div><div class="fb" style="text-align:center"></div>`;
        const sh = p.body.querySelector('.shelf'), fb = p.body.querySelector('.fb');
        for (let g = 0; g <= R.shelf.length; g++) {
          const gap = ui.h(`<button class="gap">▾</button>`); gap.onclick = () => {
            if (g === R.pos) { G.audio.sfx('drop'); gap.outerHTML = spine(R.hand, 6); fb.className = 'fb ok'; fb.innerHTML = '✔ ' + R.why; sh.querySelectorAll('.gap').forEach(e => e.style.visibility = 'hidden'); setTimeout(() => res(true), auto() ? 20 : 1300); }
            else { tries++; G.audio.sfx('bad'); gap.style.animation = 'shake .3s'; setTimeout(() => gap.style.animation = '', 320); fb.className = 'fb bad'; fb.innerHTML = '✘ ' + L('再想想——', 'Try again — ') + R.why; }
          }; sh.appendChild(gap); if (g < R.shelf.length) sh.appendChild(ui.h(spine(R.shelf[g], g)));
          if (auto() && g === R.pos) setTimeout(() => gap.click(), 20);
        }
      });
      score += tries === 0 ? 1 : tries === 1 ? 0.6 : 0.3;
    }
    // self checkout
    p.stat(`${rounds.length + 1}/${rounds.length + 1}`);
    const steps = [['🪪', L('刷校园卡', 'Tap campus card'), 0], ['📗', L('把书放到感应区', 'Place the book on the pad'), 1], ['🧾', L('确认借阅，取凭条', 'Confirm and take the slip'), 2], ['🎒', L('直接把书塞进书包走人', 'Just stuff it in your bag and leave'), -1]];
    let miss = 0;
    await new Promise(res => {
      p.body.innerHTML = `<p class="lead">${L('最后一步：<b>自助借书机</b>。按正确顺序点击三个步骤。', 'Last step: the <b>self-checkout</b> machine. Click the three steps in the right order.')}</p><div class="grid g2"></div><div class="fb"></div>`;
      const grid = p.body.querySelector('.grid'), fb = p.body.querySelector('.fb'); let next = 0;
      for (const s of G.shuffle(steps)) {
        const b = ui.h(`<button class="card"><span class="em">${s[0]}</span>${s[1]}</button>`); b.onclick = () => {
          if (b.classList.contains('ok')) return;
          if (s[2] === next) { next++; b.classList.add('ok'); b.insertAdjacentHTML('afterbegin', `<span class="tagc">${next}</span>`); G.audio.sfx('ok'); if (next === 3) { fb.className = 'fb ok'; fb.textContent = '✔ ' + L('借阅成功！记得按期归还或续借。', 'Borrowed! Remember to return or renew on time.'); setTimeout(res, auto() ? 20 : 1300); } }
          else { miss++; b.classList.add('bad'); setTimeout(() => b.classList.remove('bad'), 400); G.audio.sfx('bad'); fb.className = 'fb bad'; fb.textContent = s[2] < 0 ? '✘ ' + L('嘀嘀嘀——门禁响了！没办借阅手续的书带不出去。', 'BEEP BEEP — the gate alarm! You can\'t leave with an unborrowed book.') : '✘ ' + L('顺序不对，再想想。', 'Wrong order — think again.'); }
        }; grid.appendChild(b);
      }
      if (auto()) setTimeout(() => { for (let k = 0; k < 3; k++) [...grid.children].find(c => c.textContent.includes(steps[k][1])).click(); }, 30);
    });
    p.close(); return { score: (score + Math.max(0, 1 - miss * 0.3)) / (rounds.length + 1) };
  };

  // ================================================================ the 8:30 dash — lane runner along a real campus route
  mini.runner = function (m, o) {
    return new Promise(resolve => {
      const P = G.player, cam = G.cam, scene = G.scene, LW = 1.7;
      let pts = G.nav.resample(G.nav.route(o.from.x, o.from.z, o.to.x, o.to.z).pts, 5);
      for (let k = 0; k < 2; k++) { const q = [pts[0]]; for (let i = 0; i < pts.length - 1; i++) { const a = pts[i], b = pts[i + 1]; q.push([a[0] * .75 + b[0] * .25, a[1] * .75 + b[1] * .25], [a[0] * .25 + b[0] * .75, a[1] * .25 + b[1] * .75]); } q.push(pts[pts.length - 1]); pts = q; }
      const cum = [0]; for (let i = 1; i < pts.length; i++) cum.push(cum[i - 1] + Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]));
      const LEN = cum[cum.length - 1];
      const at = s => { s = G.clamp(s, 0, LEN - 0.01); let lo = 0, hi = cum.length - 1; while (hi - lo > 1) { const mid = (lo + hi) >> 1; if (cum[mid] <= s) lo = mid; else hi = mid; } const a = pts[lo], b = pts[lo + 1], k = (s - cum[lo]) / (cum[lo + 1] - cum[lo] || 1); return [a[0] + (b[0] - a[0]) * k, a[1] + (b[1] - a[1]) * k]; };
      const frame = s => { const a = at(s - 2.5), b = at(s + 2.5), p = at(s); let tx = b[0] - a[0], tz = b[1] - a[1]; const l = Math.hypot(tx, tz) || 1; tx /= l; tz /= l; return { x: p[0], z: p[1], tx, tz, rx: -tz, rz: tx }; };
      const objs = [], obs = [], picks = [], npcs = [], mat = c => new THREE.MeshLambertMaterial({ color: c });
      const put = (mesh, s, lat, y = 0) => { const f = frame(s); mesh.position.set(f.x + f.rx * lat, W.ground(f.x, f.z) + y, f.z + f.rz * lat); mesh.rotation.y = Math.atan2(f.tx, f.tz); scene.add(mesh); objs.push(mesh); return mesh; };
      const bannerTex = txt => { const c = G.canvas(512, 64), x = c.getContext('2d'); x.fillStyle = '#c0392b'; x.fillRect(0, 0, 512, 64); x.fillStyle = '#ffe9a0'; x.font = '700 36px "Microsoft YaHei",sans-serif'; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillText(txt, 256, 34); return G.canvasTex(c); };
      const r = G.rng(8301 + (G.S().done.rush ? Math.floor(Math.random() * 999) : 0)), banners = [L('热烈欢迎新同学', 'WELCOME FRESHERS'), L('百团招新 本周五', 'CLUB FAIR FRIDAY'), L('新生杯 等你来战', 'FRESHMAN CUP'), L('图书馆 24 小时陪你', 'LIBRARY LOVES YOU')];
      let bi = 0;
      for (let s = 38; s < LEN - 28; s += 11.5 + r() * 6) {
        const k = r(), prog = s / LEN, lane = Math.floor(r() * 3) - 1, two = lane === 0 ? (r() < 0.5 ? [-1, 0] : [0, 1]) : lane < 0 ? [-1, 0] : [0, 1];
        if (k < 0.22) { const g = new THREE.Mesh(new THREE.ConeGeometry(0.3, 0.75, 8), mat(0xf07a1a)); g.castShadow = true; put(g, s, lane * LW, 0.38); obs.push({ s, lanes: [lane], low: true }); }
        else if (k < 0.38) { const g = new THREE.Mesh(new THREE.CircleGeometry(1, 20), new THREE.MeshBasicMaterial({ color: 0x5aa6d8, transparent: true, opacity: 0.8, polygonOffset: true, polygonOffsetFactor: -9, polygonOffsetUnits: -9 })); g.rotation.x = -Math.PI / 2; const h = put(g, s, (two[0] + two[1]) / 2 * LW, 0.14); h.rotation.set(-Math.PI / 2, 0, 0); h.scale.set(1.9, 0.9, 1); obs.push({ s, lanes: two, low: true, puddle: true }); }
        else if (k < 0.55) { const b = G.veh.bikeModel([0x19b5a5, 0xe5b53b, 0x3b78c9][Math.floor(r() * 3)]).group; put(b, s, lane * LW); b.rotation.y += Math.PI / 2; b.rotation.z = 0.12; obs.push({ s, lanes: [lane] }); }
        else if (k < 0.72 + prog * 0.08) { const f = frame(s); for (const l of two) { const n = G.crowd.make({ scripted: true, state: 'fixed', pose: 'talk', x: f.x + f.rx * l * LW, z: f.z + f.rz * l * LW, h: Math.atan2(-f.rx * (l - (two[0] + two[1]) / 2), -f.rz * (l - (two[0] + two[1]) / 2)) || 0, pack: 0x39424f }); n.y = W.ground(n.x, n.z); n.cur = 0; npcs.push(n); } obs.push({ s, lanes: two, crowd: true }); }
        else if (k < 0.88) { const g = new THREE.Group(), pm = mat(0x8a8f96); for (const sx of [-3.1, 3.1]) { const pole = new THREE.Mesh(new THREE.BoxGeometry(0.1, 2.5, 0.1), pm); pole.position.set(sx, 1.25, 0); g.add(pole); } const cloth = new THREE.Mesh(new THREE.PlaneGeometry(6.2, 0.78), new THREE.MeshLambertMaterial({ map: bannerTex(banners[bi++ % banners.length]), side: THREE.DoubleSide })); cloth.position.set(0, 1.92, 0); cloth.rotation.y = Math.PI; g.add(cloth); put(g, s, 0); obs.push({ s, lanes: [-1, 0, 1], high: true }); }
        else { const g = new THREE.Group(); for (let q = 0; q < 3; q++) { const bx = new THREE.Mesh(new THREE.BoxGeometry(0.62 - q * 0.08, 0.5, 0.55 - q * 0.06), mat([0xc49a6c, 0xb5895a, 0xd1a878][q])); bx.position.y = 0.25 + q * 0.5; bx.rotation.y = q * 0.3; bx.castShadow = true; g.add(bx); } put(g, s, lane * LW); obs.push({ s, lanes: [lane] }); }
        // a snack in a free lane just before the next obstacle
        if (r() < 0.75) { const free = [-1, 0, 1].filter(l => !obs[obs.length - 1].lanes.includes(l)); const l = free.length ? free[Math.floor(r() * free.length)] : lane; const coffee = r() < 0.25, sp = G.textSprite(coffee ? '☕' : '🥟', { size: 64, scale: 0.55 }); put(sp, s + 5.5, l * LW, 1.1); picks.push({ s: s + 5.5, lane: l, sp, coffee }); }
      }
      const goal = G.fx.beacon(o.to.x, o.to.z, { color: 0x3fbf7f, icon: '🏫', r: 2.4 });
      // state
      let s = 2, lat = 0, lane = 0, y = 0, vy = 0, slideT = 0, stumble = 0, boost = 0, speed = 0, elapsed = 0, hits = 0, buns = 0, started = false, done = false;
      const q = []; G.swipe = d => q.push(d);
      P.mode = 'script'; P.locked = true; cam.mode = 'manual'; M_quiet(true);
      const clock = () => { const t = 8 * 3600 + 18 * 60 + elapsed * 9.4; return [t, `${String(Math.floor(t / 3600)).padStart(2, '0')}:${String(Math.floor(t % 3600 / 60)).padStart(2, '0')}:${String(Math.floor(t % 60)).padStart(2, '0')}`]; };
      ui.objective(L('早八冲刺', 'THE 8:30 DASH'), G.isTouch ? L('左右滑动换道 · 上滑跳 · 下滑铲', 'Swipe left/right to switch lanes · up to jump · down to slide') : L('<b>A/D</b> 换道 · <b>W/空格</b> 跳（路锥、水坑）· <b>S</b> 滑铲（横幅）· 人群和单车只能绕', '<b>A/D</b> switch lane · <b>W/Space</b> jump (cones, puddles) · <b>S</b> slide (banners) · dodge crowds and bikes'));
      const place = dt => {
        const f = frame(s), gy = W.ground(f.x, f.z); lat = G.damp(lat, lane * LW, 13, dt || 1);
        P.pos.set(f.x + f.rx * lat, gy + y, f.z + f.rz * lat); P.heading = Math.atan2(f.tx, f.tz); P.speed = speed; P.pose = slideT > 0 ? 'slide' : y > 0.02 ? 'air' : 'walk';
        const cf = frame(s - 1.5), cx = cf.x - cf.tx * 7.2, cz = cf.z - cf.tz * 7.2, cy = gy + 3.5;
        if (!dt) { cam.pos.set(cx, cy, cz); cam.target.set(f.x + f.tx * 7, gy + 1.2, f.z + f.tz * 7); }
        else { const k = 1 - Math.exp(-9 * dt); cam.pos.x += (cx - cam.pos.x) * k; cam.pos.y += (cy - cam.pos.y) * k; cam.pos.z += (cz - cam.pos.z) * k; cam.target.x += (f.x + f.tx * 7 - cam.target.x) * k; cam.target.y += (gy + 1.2 - cam.target.y) * k; cam.target.z += (f.z + f.tz * 7 - cam.target.z) * k; }
      };
      place(0);
      const step = dt => {
        elapsed += dt;
        let left = I.actHit('left') || q.includes('left'), right = I.actHit('right') || q.includes('right'), up = I.actHit('up') || q.includes('up'), down = I.actHit('slide') || q.includes('down'); q.length = 0;
        if (auto()) { left = right = up = down = false; const nx = obs.find(ob => !ob.passed && ob.s > s && ob.s - s < 9 && ob.lanes.includes(lane)); if (nx) { const d = nx.s - s; if (nx.high) { if (d < 4.2 && slideT <= 0) down = true; } else if (nx.low) { if (d < 3.0 && y <= 0) up = true; } else { const free = [-1, 0, 1].filter(l => !nx.lanes.includes(l)).sort((a, b) => Math.abs(a - lane) - Math.abs(b - lane))[0]; if (free < lane) left = true; else if (free > lane) right = true; } } }
        if (left && lane > -1) { lane--; G.audio.sfx('whoosh'); } if (right && lane < 1) { lane++; G.audio.sfx('whoosh'); }
        if (up && y <= 0 && slideT <= 0) { vy = 7.5; y = 0.01; G.audio.sfx('jump'); }
        if (down) { if (y > 0) vy = -13; else if (slideT <= 0) { slideT = 0.82; G.audio.sfx('swish'); } }
        if (y > 0) { vy -= 21 * dt; y += vy * dt; if (y <= 0) { y = 0; vy = 0; } }
        slideT = Math.max(0, slideT - dt); stumble = Math.max(0, stumble - dt); boost = Math.max(0, boost - dt);
        const want = stumble > 0 ? 3.0 : 7.6 + 2.5 * (s / LEN) + (boost > 0 ? 2.6 : 0); speed = G.damp(speed, want, stumble > 0 ? 12 : 2.6, dt); s += speed * dt;
        for (const ob of obs) {
          if (ob.passed) continue; if (ob.s < s - 1.2) { ob.passed = true; continue; }
          if (Math.abs(ob.s - s) < 0.85 && ob.lanes.some(l => Math.abs(lat - l * LW) < 0.95)) {
            if (ob.low && y > 0.42) continue; if (ob.high && slideT > 0) continue;
            ob.passed = true; hits++; stumble = 0.95; speed = 2; cam.shake = 0.8; G.audio.sfx(ob.puddle ? 'splash' : 'hit');
            ui.toast(ob.puddle ? L('💦 踩进水坑！', '💦 Splash!') : ob.crowd ? L('"同学看路呀！"', '"Watch it!"') : ob.high ? L('横幅糊了一脸…', 'Face full of banner…') : L('撞上了！', 'Ouch!'), 1.4);
            G.fx.burst({ x: P.pos.x, y: P.pos.y + 0.8, z: P.pos.z, n: 14, color: ob.puddle ? 0x7fc4ee : 0xf2d9a0, speed: 4, size: 0.2, life: 0.7 });
          }
        }
        for (const pk of picks) { if (pk.got) continue; pk.sp.position.y += Math.sin(G.t * 5 + pk.s) * 0.004; if (Math.abs(pk.s - s) < 1.1 && Math.abs(lat - pk.lane * LW) < 1.0 && y < 1.4) { pk.got = true; pk.sp.visible = false; buns++; G.audio.sfx('pick'); if (pk.coffee) { boost = 2.6; ui.toast(L('☕ 咖啡加速！', '☕ Coffee boost!'), 1.2); } } }
        if (speed > 5 && Math.random() < dt * 8) G.fx.burst({ x: P.pos.x, y: P.pos.y + 0.05, z: P.pos.z, n: 1, color: 0xd8cfbc, speed: 0.8, size: 0.16, life: 0.5, gravity: -0.4 });
      };
      const off = G.missions.tick(dt => {
        if (done) return; if (!started) { place(dt); return; }
        const n = auto() ? 8 : 1; for (let k = 0; k < n && !done; k++) { step(dt); if (s >= LEN - 2.5) { done = true; } }
        place(dt); const [t, str] = clock(); ui.timer('🕗 ' + str, t > 8 * 3600 + 28 * 60);
        if (done) finish();
      });
      const finish = () => {
        off(); const [t] = clock(), late = Math.max(0, Math.ceil((t - (8 * 3600 + 30 * 60)) / 60)); G.swipe = null; goal.remove();
        G.audio.sfx('win'); G.fx.confetti(P.pos.x, P.pos.y + 2, P.pos.z, 70); P.pose = 'cheer'; P.speed = 0;
        ui.banner(late ? L('迟到了…', 'LATE…') : L('准时到达！', 'ON TIME!'), late ? L(`晚了 ${late} 分钟`, `${late} min late`) : clock()[1], L(`碰撞 ${hits} 次 · 早餐 ${buns} 份`, `${hits} bumps · ${buns} snacks`));
        setTimeout(() => { for (const mesh of objs) scene.remove(mesh); for (const n of npcs) G.crowd.remove(n); ui.timer(null); M_quiet(false); P.pose = null; P.mode = 'foot'; cam.release(); resolve({ late, hits, buns, score: G.clamp(1 - late * 0.14 - hits * 0.035 + buns * 0.004, 0.2, 1) }); }, auto() ? 60 : 2300);
      };
      (async () => { for (const [t, snd] of [['3', 'tick'], ['2', 'tick'], ['1', 'tick'], [L('跑！', 'GO!'), 'ok']]) { ui.banner('', t, ''); G.audio.sfx(snd); await G.sleep(auto() ? 10 : 650); } started = true; })();
    });
  };
  function M_quiet(b) { G.missions.quiet = b; }

  // ================================================================ course experience
  mini.course = async function () {
    const p = ui.panel({ title: L('课程体验', 'Course Taster'), sub: L('全英文授课 · 小班互动', 'Taught in English · interactive'), icon: '🎓' });
    const pick = await new Promise(res => {
      p.body.innerHTML = `<p class="lead">${L('王教授：今天来点不一样的——你们自己选一个主题。', "Prof. Wang: Let's do something different today — you choose the topic.")}</p><div class="grid g3"></div>`;
      const g = p.body.querySelector('.grid'), ls = [['🤖', L('自然语言处理', 'Natural Language Processing'), L('你来当一回"语言模型"：猜下一个词。', 'Be the language model: predict the next word.'), 'nlp'], ['📈', L('经济学原理', 'Principles of Economics'), L('机会成本：天下没有免费的午餐。', 'Opportunity cost: no free lunch.'), 'eco'], ['🌏', L('翻译工作坊', 'Translation Workshop'), L('在中文与英文之间"信、达、雅"。', 'Faithful, fluent, elegant — between Chinese and English.'), 'tra']];
      ls.forEach((l, i) => { const b = ui.h(`<button class="card"><span class="em">${l[0]}</span><h4>${l[1]}</h4>${l[2]}</button>`); b.onclick = () => { G.audio.sfx('ui'); res(l[3]); }; g.appendChild(b); if (auto() && i === 0) setTimeout(() => b.click(), 25); });
    });
    let got = 0, total = 0, raised = false;
    const bars = (host, arr) => { const d = ui.h(`<div style="margin-top:10px"></div>`); arr.forEach(([w, pr]) => d.appendChild(ui.h(`<div class="prob"><b>${w}</b><span style="width:0"></span><i>${(pr * 100).toFixed(pr < 0.01 ? 1 : 0)}%</i></div>`))); host.appendChild(d); requestAnimationFrame(() => d.querySelectorAll('span').forEach((sp, i) => sp.style.width = Math.max(3, arr[i][1] * 260) + 'px')); };
    if (pick === 'nlp') {
      const qs = [
        { ctx: L('深圳是一座年轻的<u>?</u>', 'Shenzhen is a young <u>?</u>'), q: L('语言模型的工作，就是给"下一个词"打分。你觉得哪个概率最高？', 'A language model scores candidates for the next word. Which is most likely?'), opts: [[L('城市', 'city'), 0.86, 1], [L('大学', 'university'), 0.06], [L('程序', 'program'), 0.02], [L('动物', 'animal'), 0.004]], why: L('模型从海量文本里学到："年轻的"后面最常跟"城市"。', 'From vast text the model learned that "young" is most often followed by "city" here.') },
        { ctx: L('早八之前，我需要一杯<u>?</u>', 'Before my 8:30 class I need a cup of <u>?</u>'), q: L('这次有两个都很合理——模型输出的是<b>概率分布</b>，不是唯一答案。选一个你觉得最可能的。', 'Two fit well here — the model outputs a <b>distribution</b>, not one answer. Pick the likeliest.'), opts: [[L('咖啡', 'coffee'), 0.52, 1], [L('茶', 'tea'), 0.31, 1], [L('键盘', 'keyboard'), 0.001], [L('雨', 'rain'), 0.002]], why: L('"温度"调高，模型就更愿意选"茶"甚至更意外的词——这就是它每次回答不一样的原因。', 'Raise the "temperature" and the model more often picks "tea" or something stranger — that is why answers vary.') },
        { ctx: 'un·believ·able', q: L('模型读的不是"字"，而是 <b>token</b>。"unbelievable" 最可能被切成什么？', 'Models read <b>tokens</b>, not words. How is "unbelievable" most likely split?'), opts: [['un + believ + able', 0, 1], ['u-n-b-e-l-i-e-v-a-b-l-e', 0], ['unbelievable', 0], ['unbe + lievab + le', 0]], nobars: true, why: L('子词切分（如 BPE）把常见片段当作一个 token，生僻词也能拼出来。', 'Subword tokenisation (e.g. BPE) treats frequent pieces as tokens, so even rare words can be spelled out.') },
        { ctx: L('港中大（深圳）位于深圳市<u>?</u>区', 'CUHK-Shenzhen is in <u>?</u> District, Shenzhen'), q: L('最后一题：事实题。模型也会"一本正经地说错"，这叫<b>幻觉</b>。正确答案是？', 'Last one, a fact. Models can be confidently wrong — a <b>hallucination</b>. The right answer?'), opts: [[L('龙岗', 'Longgang'), 0.71, 1], [L('南山', 'Nanshan'), 0.19], [L('福田', 'Futian'), 0.07], [L('罗湖', 'Luohu'), 0.03]], why: L('龙岗区。注意：模型给"南山"也分了不低的概率——所以重要事实一定要核查。', 'Longgang. Notice the model still gave "Nanshan" real probability — always verify important facts.') }
      ];
      for (const q of qs) { total++; p.stat(`${total}/${qs.length}`); const r = await mini.ask(p.body, { pre: `<div class="ctx">${q.ctx}</div>`, q: q.q, opts: q.opts.map(o => ({ t: o[0], ok: o[2], why: q.why })), hold: q.nobars ? 600 : 1500, after: host => { if (!q.nobars) bars(host, q.opts.slice().sort((a, b) => b[1] - a[1])); } }); if (r.ok) got++; }
    } else if (pick === 'eco') {
      const qs = [
        { q: L('周六你可以去兼职（赚 200 元），也可以去听一场免费讲座。去听讲座的<b>机会成本</b>是？', 'On Saturday you could work a shift (¥200) or attend a free talk. The <b>opportunity cost</b> of the talk is?'), opts: [{ t: L('放弃的 200 元兼职收入', 'The ¥200 you give up'), ok: 1 }, { t: L('0 元，因为讲座免费', '¥0 — the talk is free') }, { t: L('讲座的场地费', 'The venue cost') }], why: L('机会成本 = 为了这个选择所放弃的最好的另一个选择。', 'Opportunity cost is the best alternative you give up.') },
        { q: L('你已经花 80 元买了电影票，但当天发高烧。理性的做法是？', "You paid ¥80 for a film ticket but have a high fever that day. The rational choice?"), opts: [{ t: L('在家休息——80 元是沉没成本', 'Rest — the ¥80 is a sunk cost'), ok: 1 }, { t: L('硬撑着去，不能浪费钱', 'Go anyway, or the money is wasted') }, { t: L('再买一张票请朋友陪你', 'Buy another ticket for a friend') }], why: L('已经花掉、收不回的钱，不该影响接下来的决定。', "Money already spent shouldn't drive the next decision.") },
        { q: L('第 1 个包子很香，第 5 个就吃不下了。这说明？', 'The first bun is delicious; by the fifth you are stuffed. This shows?'), opts: [{ t: L('边际效用递减', 'Diminishing marginal utility'), ok: 1 }, { t: L('通货膨胀', 'Inflation') }, { t: L('比较优势', 'Comparative advantage') }], why: L('每多消费一单位，带来的额外满足感在下降。', 'Each extra unit adds less satisfaction.') }
      ];
      for (const q of qs) { total++; p.stat(`${total}/${qs.length}`); const r = await mini.ask(p.body, Object.assign({ cols: 1 }, q)); if (r.ok) got++; }
    } else {
      const qs = [
        { q: L('校训"<b>博文约礼</b>"的官方英译是？', 'The official English rendering of the motto "<b>博文约礼</b>" is?'), opts: [{ t: 'Through learning and temperance to virtue', ok: 1 }, { t: 'Read many books and be polite' }, { t: 'Knowledge is power' }], why: L('"博学于文，约之以礼"——既要广博，也要自律。', 'Broad learning, restrained by propriety.') },
        { q: L('"画蛇添足"最贴切的英文是？', 'The best English for "画蛇添足" is?'), opts: [{ t: 'to gild the lily', ok: 1 }, { t: 'to draw a snake and add feet' }, { t: 'to kill two birds with one stone' }], why: L('意译比字面直译更能传达"多此一举"。', 'An idiom-for-idiom rendering conveys "overdoing it" better than a literal one.') },
        { q: L('"It\'s raining cats and dogs." 怎么翻最自然？', 'How would you best put "It\'s raining cats and dogs" into Chinese?'), opts: [{ t: L('倾盆大雨。', '倾盆大雨。'), ok: 1 }, { t: L('天上在下猫和狗。', '天上在下猫和狗。') }, { t: L('猫狗都淋湿了。', '猫狗都淋湿了。') }], why: L('翻译传达的是意思，而不是字词。深圳的雨，你很快就会懂。', "Translate meaning, not words. You'll meet Shenzhen rain soon enough.") }
      ];
      for (const q of qs) { total++; p.stat(`${total}/${qs.length}`); const r = await mini.ask(p.body, Object.assign({ cols: 1 }, q)); if (r.ok) got++; }
    }
    p.stat(null);
    const k = await mini.ask(p.body, { cols: 1, keep: true, q: L('王教授："Any questions?" 全班安静。你……', 'Prof. Wang: "Any questions?" The room is silent. You…'), opts: [{ t: L('🙋 举手，用英语问出刚才没想明白的地方', '🙋 Raise your hand and ask about the part you didn\'t get'), ok: 1, why: L('"好问题！"——教授眼睛一亮。课后他还记住了你的名字。', '"Good question!" His eyes light up — and he remembers your name.') }, { t: L('🙈 低头假装记笔记', '🙈 Look down and pretend to take notes'), part: 0.3, why: L('没关系——下课后去 Office hour 问也一样。但下次试试举手？', 'No worries — office hours work too. But try raising your hand next time?') }] });
    raised = k.ok; p.close();
    return { score: got / total, raised, pick };
  };

  // ================================================================ basketball
  mini.hoops = function () {
    return new Promise(resolve => {
      const p = ui.panel({ title: L('投篮挑战', 'Free Throws'), sub: L('看准力度条再出手', 'Time the power bar'), icon: '🏀', width: 760 });
      p.body.innerHTML = `<canvas class="stage" width="720" height="380"></canvas>`; p.hint(G.isTouch ? L('点击画面出手', 'Tap to shoot') : L('<b>空格</b> 或点击出手', '<b>Space</b> or click to shoot'));
      const cv = p.body.querySelector('canvas'), x = cv.getContext('2d'); let shot = 0, made = 0, streak = 0, ph = 0, ball = null, msg = '', msgT = 0, over = false, last = performance.now();
      const zone = () => { const w = Math.max(0.09, 0.2 - shot * 0.012), c = 0.5 + 0.22 * Math.sin(shot * 1.7); return [c - w / 2, c + w / 2]; };
      const shoot = () => { if (ball || over) return; const v = 0.5 + 0.5 * Math.sin(ph), [a, b] = zone(), ok = v >= a && v <= b, near = Math.min(Math.abs(v - a), Math.abs(v - b)); ball = { t: 0, ok, off: ok ? 0 : (v < a ? -1 : 1) * (0.25 + near * 2) }; G.audio.sfx('jump'); };
      const key = c => { if (c === 'Space' || c === 'Enter') shoot(); }; G.on('key', key); cv.onpointerdown = shoot;
      const draw = now => {
        if (p.closed) return; const dt = Math.min(0.05, (now - last) / 1000); last = now; ph += dt * (3.2 + shot * 0.22);
        const g = x.createLinearGradient(0, 0, 0, 380); g.addColorStop(0, '#7ec3ee'); g.addColorStop(1, '#d9eefb'); x.fillStyle = g; x.fillRect(0, 0, 720, 380); x.fillStyle = '#c96f4a'; x.fillRect(0, 300, 720, 80); x.fillStyle = '#f4f4ee'; x.fillRect(0, 300, 720, 4);
        x.fillStyle = '#8a8f96'; x.fillRect(612, 96, 10, 208); x.fillStyle = '#fff'; x.fillRect(560, 70, 62, 52); x.strokeStyle = '#c0392b'; x.lineWidth = 3; x.strokeRect(576, 86, 30, 24); x.strokeStyle = '#e5532a'; x.lineWidth = 5; x.beginPath(); x.moveTo(520, 124); x.lineTo(572, 124); x.stroke(); x.strokeStyle = 'rgba(255,255,255,.85)'; x.lineWidth = 1.5; for (let i = 0; i <= 5; i++) { x.beginPath(); x.moveTo(522 + i * 10, 126); x.lineTo(530 + i * 6.4, 158); x.stroke(); }
        // player
        x.fillStyle = '#4b2a7b'; x.fillRect(118, 214, 30, 50); x.fillStyle = '#2f3a56'; x.fillRect(120, 262, 11, 40); x.fillRect(135, 262, 11, 40); x.fillStyle = '#f2c9a4'; x.beginPath(); x.arc(133, 198, 15, 0, 7); x.fill(); x.strokeStyle = '#f2c9a4'; x.lineWidth = 8; x.lineCap = 'round'; x.beginPath(); x.moveTo(146, 222); x.lineTo(166, ball ? 176 : 196); x.stroke();
        let bx = 170, by = 186;
        if (ball) { ball.t += dt * 1.15; const t = Math.min(1, ball.t), tx = 546 + ball.off * 60, ty = 122; bx = 170 + (tx - 170) * t; by = 186 + (ty - 186) * t - Math.sin(t * Math.PI) * 150; if (ball.t >= 1 && !ball.done) { ball.done = true; shot++; if (ball.ok) { made++; streak++; msg = streak >= 3 ? L('🔥 连中 ' + streak + '！', '🔥 ' + streak + ' in a row!') : L('空心入网！', 'Swish!'); G.audio.sfx('swish'); } else { streak = 0; msg = ball.off < 0 ? L('短了…', 'Short…') : L('大了…', 'Long…'); G.audio.sfx('bounce'); } msgT = 1; p.stat(`🏀 ${made}/${shot}`); } if (ball.t > 1) { by = ty + (ball.t - 1) * 420; if (!ball.ok) bx += ball.off * (ball.t - 1) * 160; } if (ball.t > 1.55) { ball = null; if (shot >= 10) { over = true; setTimeout(end, auto() ? 20 : 900); } } }
        x.fillStyle = '#e8762c'; x.beginPath(); x.arc(bx, by, 13, 0, 7); x.fill(); x.strokeStyle = '#7a3a12'; x.lineWidth = 1.5; x.beginPath(); x.arc(bx, by, 13, 0, 7); x.moveTo(bx - 13, by); x.lineTo(bx + 13, by); x.stroke();
        // power bar
        const [a, b] = zone(), v = 0.5 + 0.5 * Math.sin(ph); x.fillStyle = 'rgba(20,12,36,.75)'; x.fillRect(160, 330, 400, 22); x.fillStyle = '#3fbf7f'; x.fillRect(160 + a * 400, 330, (b - a) * 400, 22); x.fillStyle = '#fff'; x.fillRect(160 + v * 400 - 3, 324, 6, 34);
        if (msgT > 0) { msgT -= dt; x.globalAlpha = Math.min(1, msgT * 2); x.fillStyle = '#231a33'; x.font = '800 30px sans-serif'; x.textAlign = 'center'; x.fillText(msg, 360, 70); x.globalAlpha = 1; }
        if (auto() && !ball && !over) { if (v >= a && v <= b) shoot(); }
        requestAnimationFrame(draw);
      };
      const end = () => { G.off('key', key); p.close(); resolve({ made, score: Math.min(1, made / 8) }); };
      p.stat('🏀 0/0'); requestAnimationFrame(draw);
    });
  };
})();
