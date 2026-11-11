/* minigames II: HuatuoGPT clinic, high-table dress & etiquette, biomedical lab, counselling, career, president, rhythm */
(function () {
  'use strict';
  const G = window.G, ui = G.ui, L = G.L, I = G.input, mini = G.mini, auto = mini.auto;

  // ================================================================ clinic — HuatuoGPT pre-consultation (scripted demo)
  mini.clinic = async function () {
    const p = ui.panel({ title: L('华佗GPT · 预问诊', 'HuatuoGPT · Pre-consultation'), sub: L('AI 分诊助手（演示脚本，非医疗建议）', 'AI triage assistant (scripted demo, not medical advice)'), icon: '🩺', width: 740 });
    p.body.innerHTML = `<div class="chat"></div><div class="chips"></div>`;
    const chat = p.body.querySelector('.chat'), chips = p.body.querySelector('.chips'); let good = 0, total = 0;
    const add = (cls, html) => { const e = ui.h(`<div class="msg ${cls}">${html}</div>`); chat.appendChild(e); chat.scrollTop = chat.scrollHeight; return e; };
    const ai = async html => { const t = ui.h(`<div class="typing">${L('华佗GPT 正在输入…', 'HuatuoGPT is typing…')}</div>`); chat.appendChild(t); chat.scrollTop = chat.scrollHeight; await G.sleep(auto() ? 5 : 650 + Math.random() * 400); t.remove(); G.audio.sfx('msg'); add('ai', html); };
    const pick = opts => new Promise(res => { chips.innerHTML = ''; let best = null; opts.forEach(o => { const b = ui.h(`<button class="card">${o.t}</button>`); b.onclick = () => { G.audio.sfx('ui'); chips.innerHTML = ''; add('me', o.t); res(o); }; chips.appendChild(b); if (o.ok && !best) best = b; }); if (auto()) setTimeout(() => (best || chips.firstChild).click(), 15); });
    add('sys', L('⚕️ 提示：AI 只帮医生整理信息。诊断与用药以医生为准。', '⚕️ Note: the AI only organises information for the doctor. Diagnosis and medication are the doctor\'s call.'));
    await ai(L('你好，我是<b>华佗GPT</b>预问诊助手，由本校团队研发。看医生之前，我先帮你把情况整理清楚。<br>请问哪里不舒服？', "Hello, I'm <b>HuatuoGPT</b>, a pre-consultation assistant developed at this university. Before you see the doctor, let me help organise your situation.<br>What seems to be the trouble?"));
    total++; let r = await pick([{ t: L('从下午彩色跑淋雨后开始，喉咙痛、流清鼻涕，有点发冷。', 'Since getting soaked at the Color Run this afternoon: sore throat, runny nose, a bit chilly.'), ok: 1 }, { t: L('我感觉不太好。', "I don't feel well.") }]);
    if (r.ok) { good++; await ai(L('描述得很清楚 👍：<b>部位</b>（咽喉、鼻）、<b>起始时间</b>（今天下午）、<b>诱因</b>（淋雨受凉）都有了。', 'Very clear 👍: <b>where</b> (throat, nose), <b>since when</b> (this afternoon) and the <b>trigger</b> (rain and chill).')); }
    else { await ai(L('别着急，我来帮你理一理。试着告诉我三件事：<b>哪里</b>不舒服、<b>从什么时候</b>开始、<b>可能的诱因</b>。', "No rush — let's sort it out. Tell me three things: <b>where</b> it hurts, <b>since when</b>, and the <b>likely trigger</b>.")); await pick([{ t: L('喉咙痛、流鼻涕；今天下午开始；彩色跑时淋了雨。', 'Sore throat and runny nose; since this afternoon; I got rained on at the Color Run.'), ok: 1 }]); await ai(L('这样就清楚多了，谢谢。', 'Much clearer — thank you.')); }
    await ai(L('量过体温吗？桌上有电子体温计，可以现在量一下。', 'Have you taken your temperature? There is a digital thermometer on the desk.'));
    await new Promise(res => { chips.innerHTML = ''; const b = ui.h(`<button class="card" style="text-align:center"><span class="em">🌡️</span>${L('量体温', 'Take temperature')}</button>`); b.onclick = () => { b.onclick = null; G.audio.sfx('tick'); let v = 35.0; const iv = setInterval(() => { v += 0.2; b.innerHTML = `<span class="em">🌡️</span><b style="font-size:22px">${v.toFixed(1)}℃</b>`; if (v >= 37.75) { clearInterval(iv); G.audio.sfx('ok'); setTimeout(res, auto() ? 5 : 500); } }, auto() ? 2 : 70); }; chips.appendChild(b); if (auto()) setTimeout(() => b.click(), 15); });
    total++; r = await pick([{ t: L('37.8℃。', '37.8 °C.'), ok: 1 }, { t: L('应该没发烧吧。', "I don't think I have a fever.") }]);
    if (r.ok) { good++; await ai(L('收到：<b>低热 37.8℃</b>。具体数字比"好像有点烧"有用得多。', 'Noted: <b>low-grade fever, 37.8 °C</b>. A number is far more useful than "maybe a bit warm".')); } else await ai(L('体温计显示 <b>37.8℃</b>，属于低热。下次直接报数字，医生判断更快。', 'The thermometer reads <b>37.8 °C</b>, a low-grade fever. Next time give the number — it helps the doctor.'));
    await ai(L('有没有<b>药物过敏史</b>或长期服用的药？', 'Any <b>drug allergies</b> or regular medication?'));
    total++; r = await pick([{ t: L('没有已知过敏，也没有长期服药。', 'No known allergies and no regular medication.'), ok: 1 }, { t: L('这个……重要吗？', 'Does that… matter?') }]);
    if (r.ok) good++; else await ai(L('很重要：过敏史决定了医生<b>能不能开某些药</b>。不确定就说"不确定"，也比不说好。', 'It matters a lot: allergies decide <b>which drugs are safe</b>. If unsure, say "not sure" — that still helps.'));
    await ai(L('最后确认<b>危险信号</b>：有没有呼吸困难、胸痛、持续 39℃ 以上高热、意识模糊？', 'Finally, the <b>red flags</b>: any trouble breathing, chest pain, a persistent fever above 39 °C, or confusion?'));
    await pick([{ t: L('都没有。', 'None of those.'), ok: 1 }]);
    await ai(L('好的。出现以上任何一项都不要等——<b>立刻就医或拨打 120</b>。你目前没有。', "Good. Any one of those means don't wait — <b>seek care at once or dial 120</b>. You have none."));
    await ai(`<b>${L('预问诊小结（已发送给值班医生）', 'Pre-consultation summary (sent to the duty doctor)')}</b><br>• ${L('主诉：咽痛、流涕、畏寒，今天下午起，淋雨后', 'Complaint: sore throat, runny nose, chills since this afternoon, after rain')}<br>• ${L('体温 37.8℃；无过敏史；无危险信号', 'Temp 37.8 °C; no allergies; no red flags')}<br>• ${L('分诊建议：<b>普通门诊</b>', 'Triage: <b>general clinic</b>')}<br><small>${L('我可能出错。最终判断请以医生为准。', 'I can be wrong. The doctor makes the final call.')}</small>`);
    chips.innerHTML = ''; const host = ui.h('<div style="margin-top:8px"></div>'); chips.appendChild(host); total++;
    const k = await mini.ask(host, { cols: 1, q: L('小测：如果 AI 的建议和医生说的不一样，应该听谁的？', "Quick check: if the AI's advice differs from the doctor's, whom do you follow?"), opts: [{ t: L('听医生的，并把 AI 说了什么告诉医生', 'The doctor — and tell the doctor what the AI said'), ok: 1, why: L('对。AI 是助手，医生负责诊断。', 'Right. The AI assists; the doctor diagnoses.') }, { t: L('听 AI 的，它读的书多', 'The AI — it has read more'), why: L('AI 可能出错，也没法给你做检查。', "AI can be wrong and can't examine you.") }, { t: L('谁说得好听听谁的', 'Whoever sounds nicer'), why: L('健康可不能看心情。', "Health isn't a matter of taste.") }] });
    if (k.ok) good++; p.close(); return { score: good / total };
  };

  // ================================================================ high table — dressing up
  mini.dress = async function () {
    const p = ui.panel({ title: L('赴宴着装', 'Dress for High Table'), sub: L('学生袍 + 正装', 'Gown + formal dress'), icon: '🎩', width: 760 });
    const slots = [
      [L('上装', 'Top'), [['👔', L('衬衫 / 礼服', 'Shirt / dress'), 1], ['🎽', L('运动背心', 'Gym vest'), 0], ['👕', L('印花 T 恤', 'Graphic tee'), 0]]],
      [L('下装', 'Bottom'), [['🩳', L('沙滩短裤', 'Beach shorts'), 0], ['👖', L('西裤 / 礼服裙', 'Trousers / skirt'), 1], ['🩲', L('睡裤', 'Pyjamas'), 0]]],
      [L('鞋子', 'Shoes'), [['👡', L('拖鞋', 'Flip-flops'), 0], ['👟', L('荧光跑鞋', 'Neon trainers'), 0], ['👞', L('皮鞋 / 正装鞋', 'Dress shoes'), 1]]],
      [L('外披', 'Over it'), [['🦺', L('反光背心', 'Hi-vis vest'), 0], ['🎓', L('学生袍', 'Academic gown'), 1], ['🧥', L('羽绒服', 'Puffer jacket'), 0]]]
    ];
    p.body.innerHTML = `<p class="lead">${L('高桌晚宴是书院最正式的场合。为每一栏选一件，然后<b>照镜子</b>检查。', 'High Table is the most formal college occasion. Pick one per row, then <b>check the mirror</b>.')}</p><div id="sl"></div><div class="fb"></div>`;
    const sl = p.body.querySelector('#sl'), fb = p.body.querySelector('.fb'), sel = [-1, -1, -1, -1]; let tries = 0;
    slots.forEach((s, i) => { const row = ui.h(`<div class="slot"><b>${s[0]}</b></div>`); s[1].forEach((o, k) => { const b = ui.h(`<button class="card"><span class="em">${o[0]}</span>${o[1]}</button>`); b.onclick = () => { G.audio.sfx('ui'); sel[i] = k; [...row.querySelectorAll('.card')].forEach((c, j) => { c.classList.toggle('sel', j === k); c.classList.remove('bad', 'ok'); }); }; row.appendChild(b); }); sl.appendChild(row); });
    await new Promise(res => {
      const check = () => {
        if (sel.includes(-1)) { fb.className = 'fb bad'; fb.textContent = L('还有没选的。', 'Something is still missing.'); return; }
        let ok = true; slots.forEach((s, i) => { const good = s[1][sel[i]][2]; const c = sl.children[i].querySelectorAll('.card')[sel[i]]; c.classList.add(good ? 'ok' : 'bad'); if (!good) ok = false; });
        if (ok) { G.audio.sfx('win'); fb.className = 'fb ok'; fb.textContent = L('✔ 得体！镜子里的你很精神。', '✔ Sharp! You look the part.'); p.clearButtons(); setTimeout(res, auto() ? 20 : 1300); }
        else { tries++; G.audio.sfx('bad'); fb.className = 'fb bad'; fb.textContent = L('✘ 镜子里的你……有点不对劲。把标红的换掉。', '✘ Hmm… something is off. Swap the ones marked red.'); }
      };
      p.button('✨ ' + L('照镜子', 'Check the mirror'), 'gold', check);
      if (auto()) setTimeout(() => { slots.forEach((s, i) => sl.children[i].querySelectorAll('.card')[s[1].findIndex(o => o[2])].click()); check(); }, 20);
    });
    p.close(); return { score: tries === 0 ? 1 : tries === 1 ? 0.7 : 0.45 };
  };
  // ---- etiquette at the table
  mini.etiquette = async function () {
    const p = ui.panel({ title: L('高桌晚宴', 'High Table Dinner'), sub: L('礼文堂 · 18:30', 'Liwen Hall · 18:30'), icon: '🍽️', width: 780 });
    let got = 0; const N = 5;
    const ask = async (i, q) => { p.stat(`${i}/${N}`); const r = await mini.ask(p.body, Object.assign({ cols: 1 }, q)); if (r.ok) got++; };
    await ask(1, { q: L('钟声响起，主持人宣布：<b>高桌嘉宾入场</b>。院长和主礼嘉宾走进礼堂。你……', 'A bell rings and the host announces the <b>high-table procession</b>. The Master and the guest of honour walk in. You…'), opts: [{ t: L('起立，鼓掌欢迎，等嘉宾落座后再坐下', 'Stand, applaud, and sit after they are seated'), ok: 1, why: L('入场时全体起立，是高桌晚宴最经典的仪式。', 'Standing for the procession is the classic High Table ritual.') }, { t: L('坐着继续和旁边的人聊天', 'Stay seated and keep chatting'), why: L('全场都站起来了，只有你坐着……', 'Everyone else is standing…') }, { t: L('趁没人注意先吃一口面包', 'Sneak a bite of bread'), why: L('开席要等祝酒之后哦。', 'Dinner begins after the toast.') }] });
    await ask(2, { q: L('院长开始致欢迎辞。你的手机在口袋里震个不停。', 'The Master begins the welcome address. Your phone keeps buzzing in your pocket.'), opts: [{ t: L('调成静音收好，专心听', 'Silence it, put it away and listen'), ok: 1, why: L('专注，是对讲者最好的尊重。', 'Attention is the best form of respect.') }, { t: L('掏出来开直播', 'Start a livestream'), why: L('拍照可以等合影环节。', 'Photos can wait for the group shot.') }, { t: L('在桌下偷偷刷视频', 'Scroll videos under the table'), why: L('屏幕的光在昏暗的礼堂里很显眼……', 'The glow is very visible in a dim hall…') }] });
    // toast: click the right part of the glass
    p.stat(`3/${N}`);
    const okToast = await new Promise(res => {
      p.body.innerHTML = `<p class="lead">${L('主礼嘉宾提议<b>祝酒</b>！（杯子里是葡萄汁。）和邻座碰杯时，应该碰杯子的哪里？<b>点一下</b>。', 'The guest of honour proposes a <b>toast</b>! (It is grape juice.) Where on the glass do you clink with your neighbour? <b>Click it</b>.')}</p>
      <div style="text-align:center"><svg viewBox="0 0 240 230" style="width:min(300px,70%)"><g class="gl" transform="translate(60,10)"><path data-z="bowl" d="M10,22 Q10,96 60,108 Q110,96 110,22 Z" fill="rgba(160,60,110,.35)" stroke="#6a3fa8" stroke-width="3"/><path d="M16,52 Q18,92 60,102 Q102,92 104,52 Z" fill="rgba(120,30,90,.6)" pointer-events="none"/><ellipse data-z="rim" cx="60" cy="22" rx="50" ry="9" fill="rgba(255,255,255,.55)" stroke="#6a3fa8" stroke-width="3"/><rect data-z="stem" x="55" y="108" width="10" height="72" fill="rgba(255,255,255,.6)" stroke="#6a3fa8" stroke-width="3"/><ellipse data-z="stem" cx="60" cy="186" rx="38" ry="9" fill="rgba(255,255,255,.6)" stroke="#6a3fa8" stroke-width="3"/></g></svg></div><div class="fb" style="text-align:center"></div>`;
      const fb = p.body.querySelector('.fb'); let done = false;
      p.body.querySelectorAll('[data-z]').forEach(e => { e.style.cursor = 'pointer'; e.onclick = () => { if (done) return; done = true; const z = e.dataset.z, ok = z === 'bowl'; G.audio.sfx(ok ? 'clink' : 'bad'); e.setAttribute('fill', ok ? 'rgba(63,191,127,.7)' : 'rgba(229,83,75,.7)'); fb.className = 'fb ' + (ok ? 'ok' : 'bad'); fb.textContent = ok ? L('✔ 叮——轻碰杯肚，声音清脆又不易碰碎。', '✔ Clink — the bowl rings clearly and is the sturdiest part.') : z === 'rim' ? L('✘ 杯口最薄、最容易碰裂。应该轻碰杯肚。', '✘ The rim is the thinnest part and chips easily. Clink at the bowl.') : L('✘ 碰杯脚可碰不响。应该轻碰杯肚。', "✘ The stem won't ring. Clink at the bowl."); setTimeout(() => res(ok), auto() ? 20 : 1900); }; });
      if (auto()) setTimeout(() => p.body.querySelector('[data-z=bowl]').onclick(), 20);
    });
    if (okToast) got++;
    await ask(4, { q: L('开席了。你面前摆着好几副刀叉。', 'Dinner is served. Several sets of cutlery sit before you.'), opts: [{ t: L('从最外侧开始，每上一道菜向内换一副', 'Start from the outside and work inward with each course'), ok: 1, why: L('"由外向内"——不确定时，看看旁边的人怎么做。', '"Outside in" — and when unsure, watch your neighbours.') }, { t: L('挑一副最大的用到底', 'Pick the biggest set and stick with it'), why: L('每道菜配的餐具不一样。', 'Each course has its own set.') }, { t: L('问服务员要一双筷子', 'Ask for chopsticks'), why: L('也不是不行……但今晚不妨入乡随俗试试。', 'Not forbidden… but tonight is a chance to try the custom.') }] });
    await ask(5, { q: L('主礼嘉宾恰好坐在你这一桌。席间出现了短暂的沉默。', 'The guest of honour happens to sit at your table. There is a brief silence.'), opts: [{ t: L('"教授您好，我是大一的{name}。您刚才提到 AI 时代的诚信，我想请教……"', '"Good evening, Professor. I\'m {name}, a first-year. You mentioned integrity in the age of AI — may I ask…"').replace('{name}', G.S().name || ''), ok: 1, why: L('自我介绍 + 一个具体问题，是最好的开场。', 'An introduction plus one specific question is the best opener.') }, { t: L('"教授，能加个微信吗？"', '"Professor, can I add you on WeChat?"'), why: L('先有交流，再谈联系方式会更自然。', 'A real exchange first makes that request natural.') }, { t: L('低头认真切牛排，假装很忙', 'Study your steak very intently'), why: L('这样的机会很难得，鼓起勇气说一句吧。', 'Such chances are rare — find the courage for one sentence.') }] });
    p.close(); return { score: got / N };
  };

  // ================================================================ biomedical lab
  mini.lab = async function () {
    const p = ui.panel({ title: L('生物教学实验室', 'Biology Teaching Lab'), sub: L('李贤义楼', 'LEE Yin Yee Building'), icon: '🧪', width: 820 }); let sc = 0;
    // 1) PPE multi-select
    p.stat('1/3');
    const ppe = [['🥼', L('穿实验服', 'Lab coat'), 1], ['🥽', L('戴护目镜', 'Safety goggles'), 1], ['🧤', L('戴手套', 'Gloves'), 1], ['👟', L('穿不露脚趾的鞋', 'Closed-toe shoes'), 1], ['🥤', L('带杯奶茶进去', 'Bring bubble tea'), 0], ['👡', L('穿拖鞋凉快', 'Flip-flops'), 0], ['💇', L('长发披着就好', 'Leave long hair loose'), 0]];
    const s1 = await new Promise(res => {
      p.body.innerHTML = `<p class="lead">${L('<b>安全第一</b>：进实验室前，选出该做的 <b>4</b> 件事。', '<b>Safety first</b>: choose the <b>4</b> things to do before entering the lab.')}</p><div class="grid g4"></div><div class="fb"></div>`;
      const grid = p.body.querySelector('.grid'), fb = p.body.querySelector('.fb'), chosen = new Set(); let tries = 0; const order = G.shuffle(ppe.map((_, i) => i));
      order.forEach(i => { const b = ui.h(`<button class="card" style="text-align:center"><span class="em">${ppe[i][0]}</span>${ppe[i][1]}</button>`); b.dataset.i = i; b.onclick = () => { G.audio.sfx('ui'); chosen.has(i) ? chosen.delete(i) : chosen.add(i); b.classList.toggle('sel'); b.classList.remove('bad'); }; grid.appendChild(b); });
      const check = () => { const wrong = [...chosen].filter(i => !ppe[i][2]), missing = ppe.map((q, i) => i).filter(i => ppe[i][2] && !chosen.has(i)); if (!wrong.length && !missing.length) { G.audio.sfx('ok'); fb.className = 'fb ok'; fb.textContent = L('✔ 装备齐全！长发要扎起，食物饮料留在门外。', '✔ All set! Tie long hair back and leave food and drink outside.'); p.clearButtons(); setTimeout(() => res(tries === 0 ? 1 : tries === 1 ? 0.6 : 0.35), auto() ? 20 : 1400); } else { tries++; G.audio.sfx('bad'); [...grid.children].forEach(c => { if (wrong.includes(+c.dataset.i)) c.classList.add('bad'); }); fb.className = 'fb bad'; fb.textContent = wrong.length ? L('✘ 标红的会带来危险（污染、化学品溅到皮肤、卷入设备）。', '✘ The red ones are hazards (contamination, splashes on skin, entanglement).') : L(`✘ 还差 ${missing.length} 件防护。`, `✘ ${missing.length} more piece(s) of protection needed.`); } };
      p.button(L('进入实验室', 'Enter the lab'), 'gold', check);
      if (auto()) setTimeout(() => { [...grid.children].forEach(c => { if (ppe[+c.dataset.i][2]) c.click(); }); check(); }, 20);
    });
    sc += s1;
    // 2) pipetting
    p.stat('2/3'); p.clearButtons();
    const s2 = await new Promise(res => {
      const targets = [200, 50, 120]; let ti = 0, v = 0, holding = false, total = 0, msg = '', msgT = 0, wait = 0, last = performance.now();
      p.body.innerHTML = `<p class="lead">${L('<b>移液</b>：按住 <b>空格</b>（或按住画面）吸液，到目标体积时<b>松开</b>。越接近越好。', '<b>Pipetting</b>: hold <b>Space</b> (or press the canvas) to draw liquid and <b>release</b> at the target volume.')}</p><canvas class="stage" width="760" height="300"></canvas>`;
      const cv = p.body.querySelector('canvas'), x = cv.getContext('2d'); cv.onpointerdown = () => holding = true; const up = () => holding = false; window.addEventListener('pointerup', up);
      const rel = () => { const t = targets[ti], err = Math.abs(v - t) / t, s = err <= 0.03 ? 1 : err <= 0.08 ? 0.75 : err <= 0.16 ? 0.45 : 0.15; total += s; msg = (err <= 0.03 ? L('完美！', 'Perfect!') : err <= 0.08 ? L('不错', 'Good') : err <= 0.16 ? L('偏差有点大', 'A bit off') : L('差太多了', 'Way off')) + ` ${v.toFixed(0)} μL`; msgT = 1.2; G.audio.sfx(s >= 0.75 ? 'ok' : 'bad'); wait = auto() ? 0.02 : 1.1; };
      let was = false;
      const loop = now => {
        if (p.closed) return; const dt = Math.min(0.05, (now - last) / 1000); last = now; const h = holding || I.keys.Space, t = targets[ti];
        if (wait > 0) { wait -= dt; if (wait <= 0) { ti++; v = 0; was = false; if (ti >= targets.length) { window.removeEventListener('pointerup', up); res(total / targets.length); return; } } }
        else { if (auto()) { if (v < t) v = Math.min(t, v + 900 * dt); else { rel(); } } else if (h) { v = Math.min(320, v + (55 + v * 0.85) * dt); was = true; if (Math.random() < dt * 14) G.audio.sfx('tick'); } else if (was) { was = false; rel(); } }
        x.fillStyle = '#eef3f6'; x.fillRect(0, 0, 760, 300); x.fillStyle = '#d5dde3'; x.fillRect(0, 250, 760, 50);
        // pipette
        x.fillStyle = '#4b2a7b'; x.fillRect(150, 20, 36, 90); x.fillStyle = '#fff'; x.fillRect(156, 50, 24, 22); x.fillStyle = '#231a33'; x.font = '700 13px monospace'; x.textAlign = 'center'; x.fillText(String(Math.round(v)).padStart(3, '0'), 168, 66);
        x.fillStyle = '#cfd6dc'; x.beginPath(); x.moveTo(158, 110); x.lineTo(178, 110); x.lineTo(171, 215); x.lineTo(165, 215); x.fill(); const lv = Math.min(1, v / 300) * 100; x.fillStyle = '#5ac8b8'; x.beginPath(); x.moveTo(165, 215); x.lineTo(171, 215); x.lineTo(171 + lv * 0.066, 215 - lv); x.lineTo(165 - lv * 0.066, 215 - lv); x.fill();
        x.fillStyle = 'rgba(90,200,184,.35)'; x.fillRect(140, 216, 56, 34); x.strokeStyle = '#8a97a3'; x.lineWidth = 3; x.strokeRect(140, 190, 56, 60);
        // gauge
        x.fillStyle = '#231a33'; x.font = '700 20px sans-serif'; x.textAlign = 'left'; x.fillText(L('目标体积', 'Target') + `  ${ti + 1}/${targets.length}`, 280, 60); x.font = '800 54px sans-serif'; x.fillStyle = '#4b2a7b'; x.fillText(t + ' μL', 280, 122);
        x.fillStyle = '#d5dde3'; x.fillRect(280, 160, 420, 26); x.fillStyle = '#3fbf7f'; x.fillRect(280 + (t * 0.97) / 320 * 420, 160, Math.max(4, t * 0.06 / 320 * 420), 26); x.fillStyle = '#19b5a5'; x.fillRect(280, 164, v / 320 * 420, 18); x.fillStyle = '#231a33'; x.font = '600 14px sans-serif'; x.fillText(L('当前', 'Now') + ': ' + v.toFixed(0) + ' μL', 280, 212);
        if (msgT > 0) { msgT -= dt; x.globalAlpha = Math.min(1, msgT * 2); x.font = '800 26px sans-serif'; x.fillStyle = '#231a33'; x.fillText(msg, 280, 256); x.globalAlpha = 1; }
        requestAnimationFrame(loop);
      };
      requestAnimationFrame(loop);
    });
    sc += s2;
    // 3) centrifuge balancing
    p.stat('3/3');
    const s3 = await new Promise(res => {
      const levels = [2, 3, 5], sols = [[0, 6], [0, 4, 8], [0, 6, 1, 5, 9]]; let li = 0, on = new Set(), tries = 0, total = 0, spin = 0, wob = 0, ang = 0, last = performance.now(), busy = false;
      p.body.innerHTML = `<p class="lead" id="cl"></p><div style="display:flex;gap:18px;align-items:center;flex-wrap:wrap;justify-content:center"><canvas class="stage" width="380" height="380" style="width:min(380px,80vw)"></canvas><div style="flex:1;min-width:220px"><div class="fb" id="cf"></div><div class="note">${L('配平原理：所有离心管的"位置向量"加起来要等于零——对称放置，或者组成等边三角形。', 'Balancing: the position vectors of all tubes must sum to zero — opposite pairs, or an equilateral triangle.')}</div></div></div>`;
      const cv = p.body.querySelector('canvas'), x = cv.getContext('2d'), fb = p.body.querySelector('#cf'), lead = p.body.querySelector('#cl');
      const setLead = () => { lead.innerHTML = L(`<b>离心机配平</b>：在 12 孔转子里放 <b>${levels[li]}</b> 支离心管，让转子保持平衡。点孔位放/取。`, `<b>Balance the centrifuge</b>: place <b>${levels[li]}</b> tubes in the 12-slot rotor so it stays balanced. Click slots to add/remove.`); fb.textContent = ''; }; setLead();
      const slot = k => { const a = k / 12 * G.TAU - Math.PI / 2; return [190 + Math.cos(a) * 128, 190 + Math.sin(a) * 128]; };
      cv.onpointerdown = e => { if (busy) return; const r = cv.getBoundingClientRect(), mx = (e.clientX - r.left) * 380 / r.width, my = (e.clientY - r.top) * 380 / r.height; for (let k = 0; k < 12; k++) { const [sx, sy] = slot(k); if (Math.hypot(mx - sx, my - sy) < 26) { on.has(k) ? on.delete(k) : on.add(k); G.audio.sfx('drop'); } } };
      const start = () => {
        if (busy) return; if (on.size !== levels[li]) { fb.className = 'fb bad'; fb.textContent = L(`✘ 需要正好 ${levels[li]} 支管（现在 ${on.size} 支）。`, `✘ Exactly ${levels[li]} tubes needed (now ${on.size}).`); G.audio.sfx('bad'); return; }
        let sx = 0, sy = 0; for (const k of on) { sx += Math.cos(k / 12 * G.TAU); sy += Math.sin(k / 12 * G.TAU); } const ok = Math.hypot(sx, sy) < 0.01; busy = true;
        if (ok) { spin = 1.6; G.audio.sfx('whoosh'); fb.className = 'fb ok'; fb.textContent = L('✔ 平衡！转子平稳加速……', '✔ Balanced! The rotor spins up smoothly…'); total += tries === 0 ? 1 : tries === 1 ? 0.65 : 0.35; setTimeout(() => { li++; on = new Set(); tries = 0; busy = false; spin = 0; if (li >= levels.length) { p.clearButtons(); res(total / levels.length); } else setLead(); }, auto() ? 20 : 1700); }
        else { wob = 1; tries++; G.audio.sfx('hit'); fb.className = 'fb bad'; fb.textContent = L('✘ 不平衡！机器剧烈抖动并自动停机。', '✘ Unbalanced! The machine shudders and cuts out.') + (tries >= 2 ? (levels[li] === 5 ? L(' 提示：5 = 2 + 3，一对对称 + 一个三角形。', ' Hint: 5 = 2 + 3 — an opposite pair plus a triangle.') : levels[li] === 3 ? L(' 提示：每隔 4 个孔放一支。', ' Hint: one tube every 4 slots.') : L(' 提示：放在正对面。', ' Hint: directly opposite.')) : ''); setTimeout(() => busy = false, 700); }
      };
      p.button('▶ ' + L('启动离心机', 'Start centrifuge'), 'gold', start);
      const loop = now => {
        if (p.closed) return; const dt = Math.min(0.05, (now - last) / 1000); last = now; if (spin > 0) ang += dt * 22; wob = Math.max(0, wob - dt * 1.6);
        if (auto() && !busy && li < levels.length) { on = new Set(sols[li]); start(); }
        x.fillStyle = '#eef3f6'; x.fillRect(0, 0, 380, 380); x.save(); x.translate(190 + (wob ? Math.sin(now * 0.08) * wob * 9 : 0), 190 + (wob ? Math.cos(now * 0.11) * wob * 7 : 0)); x.rotate(ang); x.translate(-190, -190);
        x.fillStyle = '#c9d2d9'; x.beginPath(); x.arc(190, 190, 176, 0, 7); x.fill(); x.fillStyle = '#9aa7b2'; x.beginPath(); x.arc(190, 190, 160, 0, 7); x.fill(); x.fillStyle = '#4b2a7b'; x.beginPath(); x.arc(190, 190, 34, 0, 7); x.fill();
        for (let k = 0; k < 12; k++) { const [sx, sy] = slot(k); x.fillStyle = '#5c6873'; x.beginPath(); x.arc(sx, sy, 22, 0, 7); x.fill(); if (on.has(k)) { x.fillStyle = '#5ac8b8'; x.beginPath(); x.arc(sx, sy, 16, 0, 7); x.fill(); x.fillStyle = '#e9fbf8'; x.beginPath(); x.arc(sx - 5, sy - 5, 5, 0, 7); x.fill(); } else { x.fillStyle = '#2f3840'; x.beginPath(); x.arc(sx, sy, 15, 0, 7); x.fill(); } }
        x.restore(); requestAnimationFrame(loop);
      };
      requestAnimationFrame(loop);
    });
    sc += s3; p.close(); return { score: sc / 3 };
  };

  // ================================================================ counselling: breathing + reframing
  mini.counsel = async function () {
    const p = ui.panel({ title: L('心理咨询室', 'Counselling Room'), sub: L('学生中心四楼 · 这里很安全', 'Student Centre 4F · a safe space'), icon: '💗', width: 760, dark: true });
    await new Promise(res => {
      p.body.innerHTML = `<p class="lead">${L('<b>4-2-6 呼吸</b>：圆圈变大时<b>吸气</b>（按住空格或按住画面），停住时屏息，变小时松开、慢慢<b>呼气</b>。一共三轮。', '<b>4-2-6 breathing</b>: <b>inhale</b> as the circle grows (hold Space or press the canvas), hold while it rests, then release and <b>exhale</b> slowly as it shrinks. Three rounds.')}</p><canvas class="stage" width="700" height="330" style="background:radial-gradient(circle,#2d4a6e,#141a33)"></canvas>`;
      const cv = p.body.querySelector('canvas'), x = cv.getContext('2d'); let t = 0, last = performance.now(), hold = false, sync = 0, n = 0, toneT = 0; cv.onpointerdown = () => hold = true; const up = () => hold = false; window.addEventListener('pointerup', up);
      const CY = 12, done = () => { window.removeEventListener('pointerup', up); p.clearButtons(); res(sync / Math.max(1, n)); };
      p.button(L('跳过', 'Skip'), 'ghost', done);
      const loop = now => {
        if (p.closed) return; const dt = Math.min(0.05, (now - last) / 1000) * (auto() ? 60 : 1); last = now; t += dt; if (t >= CY * 3) { done(); return; }
        const c = t % CY, ph = c < 4 ? 0 : c < 6 ? 1 : 2, k = ph === 0 ? c / 4 : ph === 1 ? 1 : 1 - (c - 6) / 6, e = k * k * (3 - 2 * k), h = hold || I.keys.Space; n += dt; if ((ph < 2) === !!h) sync += dt;
        toneT -= dt; if (toneT <= 0 && !auto()) { toneT = 1; G.audio.tone(ph === 2 ? 220 - (c - 6) * 6 : 196 + c * 12, 1.3, { vol: 0.045, attack: 0.5 }); }
        x.clearRect(0, 0, 700, 330); for (let i = 3; i >= 0; i--) { x.fillStyle = `rgba(126,214,200,${0.08 + i * 0.05})`; x.beginPath(); x.arc(350, 165, 46 + e * 78 + i * 16, 0, 7); x.fill(); }
        x.fillStyle = h ? '#bff3ea' : '#7fd6c8'; x.beginPath(); x.arc(350, 165, 40 + e * 76, 0, 7); x.fill();
        x.fillStyle = '#123'; x.font = '700 26px sans-serif'; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillText(ph === 0 ? L('吸气…', 'Breathe in…') : ph === 1 ? L('屏息', 'Hold') : L('呼气…', 'Breathe out…'), 350, 165);
        x.fillStyle = 'rgba(255,255,255,.8)'; x.font = '600 15px sans-serif'; x.fillText(L(`第 ${Math.floor(t / CY) + 1} / 3 轮`, `Round ${Math.floor(t / CY) + 1} / 3`), 350, 306);
        requestAnimationFrame(loop);
      };
      requestAnimationFrame(loop);
    });
    p.body.innerHTML = `<p class="lead">${L('周老师：感觉好一点了吗？接下来我们看看脑子里那些"自动冒出来的话"。给每一句，找一个<b>更公平</b>的说法。', 'Ms Zhou: Feeling a little better? Now let us look at those automatic thoughts. For each, find a <b>fairer</b> way to say it.')}</p><div id="rq"></div>`;
    const host = p.body.querySelector('#rq'); let got = 0;
    const qs = [
      { q: L('💭 "小测才 60 分，我根本不适合这里。"', '💭 "Only 60% on the quiz. I clearly don\'t belong here."'), opts: [{ t: L('"一次小测说明这次的准备方式要调整。我可以找助教复盘，下次换个方法。"', '"One quiz tells me my preparation needs adjusting. I can review it with the TA and try another approach."'), ok: 1, why: L('具体、可行动，不否定自己这个人。', 'Specific and actionable, without condemning yourself.') }, { t: L('"完了，接下来四年都会这样。"', '"That\'s it. The next four years will all be like this."'), why: L('这是"灾难化"：把一次结果放大成永远。', 'That is catastrophising: one result blown up into forever.') }, { t: L('"无所谓，反正分数不重要。"', '"Whatever, grades don\'t matter anyway."'), why: L('假装不在乎，并不能让难受消失。', "Pretending not to care doesn't make it hurt less.") }] },
      { q: L('💭 "大家好像都交到朋友了，只有我一个人。"', '💭 "Everyone seems to have made friends except me."'), opts: [{ t: L('"融入需要时间，很多人和我一样在适应。我可以先从一个社团、一位同学开始。"', '"Settling in takes time, and many others are adjusting too. I can start with one club and one classmate."'), ok: 1, why: L('朋友圈里的热闹，只是别人生活的一小部分。', "The highlights in someone's feed are a small slice of their life.") }, { t: L('"肯定是我性格有问题。"', '"There must be something wrong with my personality."'), why: L('这是"贴标签"：用一时的处境定义整个自己。', 'That is labelling: defining your whole self by a passing situation.') }, { t: L('"那我也不需要朋友。"', '"Then I don\'t need friends either."'), why: L('把门关上，只会更孤单。', 'Closing the door only makes it lonelier.') }] },
      { q: L('💭 "这么大了还想家，我太脆弱了。"', '💭 "Homesick at my age — I am so weak."'), opts: [{ t: L('"想家很正常，说明我有在乎的人。我可以约个固定时间和家人视频，同时在这里建立新的日常。"', '"Missing home is normal — it means I have people I care about. I can set a regular video call and build new routines here."'), ok: 1, why: L('接纳情绪，再给它一个去处。', 'Accept the feeling, then give it somewhere to go.') }, { t: L('"别人都不想家，就我不行。"', '"Nobody else is homesick. Just me."'), why: L('其实大多数新生都想家，只是很少有人说出口。', 'Most new students are homesick; few say it out loud.') }, { t: L('"忍一忍就过去了，不能跟任何人说。"', '"Just endure it. I mustn\'t tell anyone."'), why: L('说出来，往往就轻了一半。', 'Saying it aloud often halves the weight.') }] }
    ];
    for (let i = 0; i < qs.length; i++) { p.stat(`${i + 1}/${qs.length}`); const r = await mini.ask(host, Object.assign({ cols: 1 }, qs[i])); if (r.ok) got++; }
    p.close(); return { score: got / qs.length };
  };

  // ================================================================ career: résumé + mock interview
  mini.career = async function () {
    const p = ui.panel({ title: L('CPDO · 简历与模拟面试', 'CPDO · Résumé & Mock Interview'), sub: L('学生中心 304', 'Student Centre 304'), icon: '💼', width: 840 }); let sc = 0;
    const job = `<div class="job"><b>${L('AI 产品实习生（暑期）· Early Bird 项目', 'AI Product Intern (Summer) · Early Bird')}</b><br>${L('要求：<b>数据分析</b>能力、<b>沟通协作</b>、对 <b>AI 产品</b>有热情。', 'Looking for: <b>data analysis</b>, <b>communication & teamwork</b>, passion for <b>AI products</b>.')}</div>`;
    const bl = [[L('课程项目：用 Python 分析 5000 条用户评论，提出 3 条产品改进建议', 'Course project: analysed 5,000 user reviews in Python and proposed 3 product improvements'), 1], [L('社团：组织 200 人规模的招新活动，协调 6 个小组', 'Club: organised a 200-person recruitment event, coordinating 6 teams'), 1], [L('个人项目：用大模型 API 做了一个选课助手，30 位同学试用', 'Side project: built a course-picking assistant with an LLM API, tried by 30 classmates'), 1], [L('高中获得校运会跳高第三名', 'Third place in high jump at a high-school sports day'), 0], [L('爱好：打游戏、看剧', 'Hobbies: gaming, binge-watching'), 0], [L('熟练使用微信和 Word', 'Proficient in WeChat and Word'), 0]];
    p.stat('1/3');
    sc += await new Promise(res => {
      p.body.innerHTML = job + `<p class="lead">${L('简历只有一页。从下面选出<b>最相关的 3 条</b>经历。', 'A résumé is one page. Pick the <b>3 most relevant</b> experiences.')}</p><div id="bl"></div><div class="fb"></div>`;
      const host = p.body.querySelector('#bl'), fb = p.body.querySelector('.fb'), chosen = new Set(); let tries = 0; const order = G.shuffle(bl.map((_, i) => i));
      order.forEach(i => { const b = ui.h(`<button class="rs">▫️ ${bl[i][0]}</button>`); b.dataset.i = i; b.onclick = () => { G.audio.sfx('ui'); if (chosen.has(i)) chosen.delete(i); else if (chosen.size < 3) chosen.add(i); b.classList.toggle('sel', chosen.has(i)); b.classList.remove('bad'); }; host.appendChild(b); });
      const check = () => { if (chosen.size !== 3) { fb.className = 'fb bad'; fb.textContent = L('请选满 3 条。', 'Pick exactly 3.'); return; } const wrong = [...chosen].filter(i => !bl[i][1]); if (!wrong.length) { G.audio.sfx('ok'); fb.className = 'fb ok'; fb.textContent = L('✔ 每一条都对应岗位要求：数据、协作、AI 热情。', '✔ Each one maps to a requirement: data, teamwork, AI passion.'); p.clearButtons(); setTimeout(() => res(tries === 0 ? 1 : tries === 1 ? 0.65 : 0.4), auto() ? 20 : 1500); } else { tries++; G.audio.sfx('bad'); [...host.children].forEach(c => { if (wrong.includes(+c.dataset.i)) c.classList.add('bad'); }); fb.className = 'fb bad'; fb.textContent = L('✘ 标红的和这个岗位关系不大。对着"要求"逐条找证据。', '✘ The red ones barely relate to this role. Match evidence to each requirement.'); } };
      p.button(L('提交简历', 'Submit résumé'), 'gold', check);
      if (auto()) setTimeout(() => { [...host.children].forEach(c => { if (bl[+c.dataset.i][1]) c.click(); }); check(); }, 20);
    });
    p.clearButtons(); p.stat('2/3');
    const r1 = await mini.ask(p.body, { cols: 1, pre: job, q: L('同一段经历，哪种写法更有说服力？', 'Same experience — which wording is more convincing?'), opts: [{ t: L('"主导 5 人小组完成用户调研，访谈 40 人，输出的报告被社团采纳"', '"Led a 5-person team through user research, interviewed 40 people; the report was adopted by the club"'), ok: 1, why: L('动词开头 + 数字 + 结果。', 'Verb first + numbers + result.') }, { t: L('"参与了一些调研工作，学到了很多"', '"Took part in some research work and learned a lot"'), why: L('"一些""很多"都是空话，面试官看不到你做了什么。', '"Some" and "a lot" say nothing about what you did.') }] });
    sc += r1.ok ? 1 : 0.3;
    p.stat('3/3');
    const iq = [
      { q: L('面试官："讲一次团队合作中的冲突，你是怎么处理的？"', 'Interviewer: "Tell me about a conflict in a team and how you handled it."'), opts: [{ t: L('"上学期小组作业，两位组员对选题意见相反（情境）。我是组长，要保证按时交（任务）。我让双方各列三条理由，再一起对照评分标准投票（行动）。最后提前两天完成，拿了 A-（结果）。"', '"Last term two teammates disagreed on our topic (Situation). As leader I had to deliver on time (Task). I had each list three reasons, then we voted against the rubric (Action). We finished two days early and got an A- (Result)."'), ok: 1, why: L('这就是 STAR：情境-任务-行动-结果。', 'That is STAR: Situation, Task, Action, Result.') }, { t: L('"我一般不跟人起冲突，我脾气很好。"', '"I don\'t really have conflicts. I\'m easy-going."'), why: L('回避了问题，也没有任何例子。', 'It dodges the question and gives no example.') }, { t: L('"有个组员特别不靠谱，全靠我一个人做完的。"', '"One teammate was useless, so I did everything myself."'), why: L('抱怨队友，面试官会担心你怎么评价未来的同事。', 'Blaming a teammate makes interviewers wonder how you would describe future colleagues.') }] },
      { q: L('面试官："你最大的缺点是什么？"', 'Interviewer: "What is your biggest weakness?"'), opts: [{ t: L('"我做汇报容易紧张。这学期我报名了辩论社，并且每次小组展示都主动讲第一部分，现在好多了。"', '"I get nervous presenting. This term I joined the debate club and always volunteer to open our group presentations — it is getting much better."'), ok: 1, why: L('真实的缺点 + 正在做的改进。', 'A real weakness plus what you are doing about it.') }, { t: L('"我最大的缺点是太追求完美。"', '"My biggest weakness is that I\'m a perfectionist."'), why: L('这句话面试官每天听十遍。', 'Interviewers hear this ten times a day.') }, { t: L('"我没什么缺点。"', '"I don\'t really have any."'), why: L('缺乏自我认知，才是最大的缺点。', 'Lack of self-awareness is the real weakness.') }] },
      { q: L('面试官："你有什么想问我们的吗？"', 'Interviewer: "Do you have any questions for us?"'), opts: [{ t: L('"这个岗位的实习生，做得最好的人通常有什么共同点？"', '"What do your most successful interns in this role have in common?"'), ok: 1, why: L('好问题既显示你认真想过，又帮你判断这份工作。', 'A good question shows thought and helps you judge the job.') }, { t: L('"没有了，谢谢。"', '"No, thank you."'), why: L('错过了最后一次展示兴趣的机会。', 'A missed last chance to show interest.') }, { t: L('"实习期间可以经常请假吗？"', '"Can I take lots of days off during the internship?"'), why: L('第一个问题就问请假……先聊工作吧。', 'Leading with time off… talk about the work first.') }] }
    ];
    let ig = 0; for (const q of iq) { const r = await mini.ask(p.body, Object.assign({ cols: 1 }, q)); if (r.ok) ig++; }
    sc += ig / iq.length; p.close(); return { score: sc / 3 };
  };

  // ================================================================ meet the President (portrait/voice slots; script in data/president.js)
  mini.president = async function () {
    const PR = window.PRESIDENT, p = ui.panel({ title: L('校长面对面', 'Meet the President'), sub: L('逸夫国际会议中心', 'Shaw Conference Centre'), icon: '🎓', width: 900, dark: true });
    p.body.innerHTML = `<div class="pstage"><div><img alt=""><canvas width="240" height="240" style="display:none"></canvas><div style="text-align:center;margin-top:8px;font-weight:800;color:#f6d57a">${G.tx(PR.name)}</div></div><div><div class="quote"></div><div id="pq" style="margin-top:12px"></div></div></div>${PR.draft ? `<div class="note" style="font-size:11.5px;opacity:.85">${L('※ 演示文稿：台词为草稿（改写自校长公开演讲的主题），并非其原话；正式发布前请替换为经校长办公室审定的文稿与授权录音（data/president.js）。', '※ Demo script: these lines are drafts paraphrasing themes from the President\'s public speeches, not his own words. Replace with wording and recordings approved by the President\'s Office (data/president.js).')}</div>` : ''}`;
    const img = p.body.querySelector('img'), cv = p.body.querySelector('canvas'), quote = p.body.querySelector('.quote'), pq = p.body.querySelector('#pq');
    img.onerror = () => { img.style.display = 'none'; cv.style.display = ''; ui.drawAvatar(cv, ui.AV.president); }; img.src = PR.portrait;
    const speak = (text, key) => new Promise(res => { const full = G.tx(text); let i = 0; quote.textContent = ''; if (key) ui.playVoice(PR.voiceDir + key + '.mp3'); const tick = () => { i += 1; quote.textContent = '"' + full.slice(0, i) + (i >= full.length ? '"' : ''); if (i < full.length && !auto()) setTimeout(tick, 42); else { quote.textContent = '"' + full + '"'; res(); } }; tick(); });
    await speak(PR.open, 'open'); let asked = 0; const used = new Set();
    for (let round = 0; round < 2; round++) {
      const k = await new Promise(res => { pq.innerHTML = `<p class="lead">${round === 0 ? L('🙋 主持人把话筒递到了你手里。你想问：', '🙋 The host hands you the microphone. You ask:') : L('🙋 还可以再问一个：', '🙋 One more question:')}</p>`; let first = null; PR.qa.forEach((q, i) => { if (used.has(i)) return; const b = ui.h(`<button class="ch" style="width:100%;margin-bottom:7px">${G.tx(q.q)}</button>`); b.onclick = () => { G.audio.sfx('ui'); res(i); }; pq.appendChild(b); if (!first) first = b; }); if (auto()) setTimeout(() => first.click(), 20); });
      used.add(k); asked++; pq.innerHTML = `<p class="lead" style="opacity:.8">❝ ${G.tx(PR.qa[k].q)} ❞</p>`; await speak(PR.qa[k].a, PR.qa[k].key); await mini.waitBtn(p, round === 0 ? L('再问一个', 'Ask another') : L('谢谢校长', 'Thank you'));
    }
    pq.innerHTML = ''; await speak(PR.close, 'close'); G.audio.sfx('shutter'); await mini.waitBtn(p, '📸 ' + L('合影留念', 'Group photo')); ui.stopVoice(); p.close(); return { asked };
  };

  // ================================================================ rhythm game (concert / dance)
  const FR = { '5,': 293.66, '6,': 329.63, '7,': 369.99, '1': 392, '2': 440, '3': 493.88, '4': 523.25, '5': 587.33, '6': 659.25, '7': 739.99, "1'": 783.99, "2'": 880 };
  const MOLIHUA = [[3, 1], [3, .5], [5, .5], [6, .5], ["1'", .5], ["1'", .5], [6, .5], [5, 1], [5, .5], [6, .5], [5, 2], [3, 1], [3, .5], [5, .5], [6, .5], ["1'", .5], ["1'", .5], [6, .5], [5, 1], [5, .5], [6, .5], [5, 2],
  [5, 1], [5, 1], [5, 1], [3, .5], [5, .5], [6, 1], [6, 1], [5, 2], [3, 1], [2, .5], [3, .5], [5, 1], [3, .5], [2, .5], [1, 1], [1, .5], [2, .5], [1, 2],
  [3, .5], [2, .5], [1, .5], [3, .5], [2, 1.5], [3, .5], [5, 1], [6, .5], ["1'", .5], [5, 2], [2, 1], [3, .5], [5, .5], [2, .5], [3, .5], [1, .5], ['6,', .5], ['5,', 3]];
  const ODE = [[3, 1], [3, 1], [4, 1], [5, 1], [5, 1], [4, 1], [3, 1], [2, 1], [1, 1], [1, 1], [2, 1], [3, 1], [3, 1.5], [2, .5], [2, 2], [3, 1], [3, 1], [4, 1], [5, 1], [5, 1], [4, 1], [3, 1], [2, 1], [1, 1], [1, 1], [2, 1], [3, 1], [2, 1.5], [1, .5], [1, 2]];
  const DANCE = (() => { const a = [], seq = [1, 3, 5, 3, 6, 5, 3, 1, 2, 3, 5, 6, "1'", 6, 5, 3, 1, 3, 5, "1'", 6, 5, 3, 2, 1, 2, 3, 5, 3, 2, 1, 1]; for (const s of seq) a.push([s, .5]); return a; })();
  mini.rhythm = function (kind = 'concert') {
    return new Promise(resolve => {
      const parts = kind === 'dance' ? [{ name: L('MAX 精舞团 · 试跳八拍', 'MAX Dancing · try-out'), notes: DANCE, bpm: 124, beat: true }] : [{ name: L('《茉莉花》· 江苏民歌', 'Jasmine Flower · Jiangsu folk song'), notes: MOLIHUA, bpm: 92 }, { name: L('《欢乐颂》· 贝多芬', 'Ode to Joy · Beethoven'), notes: ODE, bpm: 124 }];
      const notes = [], secs = []; let t = 2.4;
      for (const pt of parts) { const spb = 60 / pt.bpm, ps = [...new Set(pt.notes.map(n => FR[n[0]]))].sort((a, b) => a - b); secs.push({ t, name: pt.name, spb, beat: pt.beat, end: 0 }); for (const [d, b] of pt.notes) { const f = FR[d], lane = Math.min(3, Math.floor(ps.indexOf(f) / ps.length * 4)); notes.push({ t, f, lane, dur: b * spb, hit: 0 }); t += b * spb; } secs[secs.length - 1].end = t; t += 2.2; }
      const END = t - 1.0, TRAVEL = 1.55, HIT = 372, W = 720, H = 460, LX = 150, LW = 105, COL = ['#8f6be0', '#e5b53b', '#19b5a5', '#ff7a59'], KEYS = ['KeyD', 'KeyF', 'KeyJ', 'KeyK'];
      const p = ui.panel({ title: kind === 'dance' ? L('跟上节拍', 'Catch the Beat') : L('神仙岭之夜 · 东西合璧', 'East Meets West'), sub: kind === 'dance' ? '' : L('你来演奏主旋律', 'You play the melody'), icon: kind === 'dance' ? '💃' : '🎻', width: 800, dark: true });
      p.body.innerHTML = `<canvas class="stage" width="${W}" height="${H}"></canvas>`; p.hint(G.isTouch ? L('音符落到横线时，点对应的轨道', 'Tap a lane when its note reaches the line') : L('音符落到横线时按 <b>D F J K</b>（或点击轨道）。你按对了，旋律才会响！', 'Press <b>D F J K</b> (or click a lane) as notes reach the line. The melody only sounds when you hit!'));
      const cv = p.body.querySelector('canvas'), x = cv.getContext('2d'), A = G.audio; A.musicHold = true;
      const t0 = performance.now() / 1000, c0 = A.now(); let perf = 0, good = 0, miss = 0, combo = 0, maxc = 0, fxs = [], judge = '', judgeT = 0, press = [0, 0, 0, 0], ended = false, bar = -1;
      const now = () => performance.now() / 1000 - t0;
      const hitLane = l => {
        press[l] = 0.15; const tn = now(); let best = null, bd = 0.17; for (const n of notes) { if (n.hit || n.lane !== l) continue; const d = Math.abs(n.t - tn); if (d < bd) { bd = d; best = n; } if (n.t > tn + 0.2) break; }
        if (!best) { A.tone(120, 0.06, { vol: 0.05, type: 'square' }); return; }
        best.hit = bd <= 0.075 ? 2 : 1; if (best.hit === 2) { perf++; judge = 'PERFECT'; } else { good++; judge = 'GOOD'; } judgeT = 0.5; combo++; maxc = Math.max(maxc, combo);
        A.tone(best.f, Math.max(0.35, best.dur * 1.25), { vol: 0.2, type: 'triangle' }); A.tone(best.f * 2, Math.max(0.2, best.dur * 0.6), { vol: 0.045 }); fxs.push({ l, t: 0 });
      };
      const key = c => { const i = KEYS.indexOf(c); if (i >= 0) hitLane(i); }; G.on('key', key);
      cv.onpointerdown = e => { const r = cv.getBoundingClientRect(), mx = (e.clientX - r.left) * W / r.width, l = Math.floor((mx - LX) / LW); if (l >= 0 && l < 4) hitLane(l); };
      const stars = Array.from({ length: 40 }, () => [Math.random() * W, Math.random() * 200, Math.random() * 1.5 + 0.5]);
      const loop = () => {
        if (p.closed) return; const tn = now(), dt = 1 / 60;
        // accompaniment: a soft bass + fifth every two beats; a kick/hat for the dance track
        const sec = secs.find(s => tn >= s.t - 0.1 && tn < s.end); if (sec && A.ok) { const b = Math.floor((tn - sec.t + 0.1) / (sec.spb * 2)); if (b !== bar && b >= 0) { bar = b; const when = c0 + sec.t + b * sec.spb * 2 + 0.02, root = [196, 196, 146.83, 196, 164.81, 146.83, 196, 196][b % 8]; A.tone(root / 2, sec.spb * 2.1, { when, vol: 0.085, attack: 0.02 }); A.tone(root * 0.75, sec.spb * 2.1, { when, vol: 0.03, type: 'triangle' }); if (sec.beat) { A.noise(0.09, { when, freq: 120, vol: 0.3 }); A.noise(0.04, { when: when + sec.spb, freq: 6000, vol: 0.09 }); } } } else if (!sec) bar = -1;
        if (auto()) for (const n of notes) if (!n.hit && Math.abs(n.t - tn) < 0.02) hitLane(n.lane);
        for (const n of notes) if (!n.hit && tn - n.t > 0.18) { n.hit = -1; miss++; combo = 0; judge = 'MISS'; judgeT = 0.4; }
        const g = x.createLinearGradient(0, 0, 0, H); g.addColorStop(0, '#120a26'); g.addColorStop(1, '#2a1650'); x.fillStyle = g; x.fillRect(0, 0, W, H);
        for (const s of stars) { x.fillStyle = `rgba(255,255,255,${0.3 + 0.3 * Math.sin(tn * s[2] + s[0])})`; x.fillRect(s[0], s[1], 2, 2); }
        for (let l = 0; l < 4; l++) { x.fillStyle = press[l] > 0 ? 'rgba(255,255,255,.14)' : 'rgba(255,255,255,.045)'; x.fillRect(LX + l * LW + 3, 0, LW - 6, H); press[l] = Math.max(0, press[l] - dt); x.fillStyle = COL[l]; x.globalAlpha = 0.9; x.fillRect(LX + l * LW + 3, HIT - 4, LW - 6, 8); x.globalAlpha = 1; x.fillStyle = 'rgba(255,255,255,.7)'; x.font = '800 18px sans-serif'; x.textAlign = 'center'; x.fillText('DFJK'[l], LX + l * LW + LW / 2, HIT + 44); }
        for (const n of notes) { if (n.hit > 0) continue; const y = HIT - (n.t - tn) / TRAVEL * (HIT + 30); if (y < -30 || y > H + 20) continue; const cx = LX + n.lane * LW + LW / 2; x.globalAlpha = n.hit < 0 ? 0.25 : 1; x.fillStyle = COL[n.lane]; x.beginPath(); x.roundRect ? x.roundRect(cx - 40, y - 13, 80, 26, 13) : x.rect(cx - 40, y - 13, 80, 26); x.fill(); x.fillStyle = 'rgba(255,255,255,.55)'; x.fillRect(cx - 26, y - 8, 52, 4); x.globalAlpha = 1; }
        fxs = fxs.filter(f => (f.t += dt * 3.2) < 1); for (const f of fxs) { x.strokeStyle = COL[f.l]; x.globalAlpha = 1 - f.t; x.lineWidth = 5; x.beginPath(); x.arc(LX + f.l * LW + LW / 2, HIT, 18 + f.t * 46, 0, 7); x.stroke(); x.globalAlpha = 1; }
        const cs = secs.filter(s => tn >= s.t - 2.2).pop(); if (cs) { x.fillStyle = '#f6d57a'; x.font = '700 17px sans-serif'; x.textAlign = 'left'; x.fillText('♪ ' + cs.name, 16, 30); }
        x.textAlign = 'right'; x.fillStyle = '#fff'; x.font = '800 30px sans-serif'; if (combo > 1) x.fillText(combo + ' COMBO', W - 18, 44);
        if (judgeT > 0) { judgeT -= dt; x.globalAlpha = Math.min(1, judgeT * 4); x.textAlign = 'center'; x.font = '900 34px sans-serif'; x.fillStyle = judge === 'PERFECT' ? '#f6d57a' : judge === 'GOOD' ? '#7fe0c5' : '#ff8a80'; x.fillText(judge, LX + LW * 2, HIT - 70); x.globalAlpha = 1; }
        x.fillStyle = 'rgba(255,255,255,.15)'; x.fillRect(0, H - 5, W, 5); x.fillStyle = '#e5b53b'; x.fillRect(0, H - 5, W * G.clamp(tn / END, 0, 1), 5);
        if (tn < 2.0) { x.textAlign = 'center'; x.fillStyle = '#fff'; x.font = '800 40px sans-serif'; x.fillText(tn < 0.8 ? L('准备', 'Ready') : String(Math.max(1, Math.ceil(2.0 - tn))), LX + LW * 2, 190); }
        if (tn >= END && !ended) { ended = true; end(); return; }
        requestAnimationFrame(loop);
      };
      const end = () => { G.off('key', key); A.musicHold = false; const n = notes.length, score = (perf + good * 0.6) / n; p.close(); resolve({ score, perf, good, miss, maxc, n }); };
      if (auto()) { // fast-forward in automated tests: play everything perfectly
        G.off('key', key); A.musicHold = false; setTimeout(() => { p.close(); resolve({ score: 1, perf: notes.length, good: 0, miss: 0, maxc: notes.length, n: notes.length }); }, 60); return;
      }
      requestAnimationFrame(loop);
    });
  };
})();
