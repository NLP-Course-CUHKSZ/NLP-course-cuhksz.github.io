/* Search panel and tag chips for final-project.html.
   The tag vocabulary comes from js/fp-tags.js (generated from .fp-guide/tags.py; edit the tags there, not here).
   The page's inline script calls FPSearch.init() once, after it has folded the page, and FPSearch.setLang() on
   every language switch. Every brief and every other block of the page is indexed in English and in Chinese,
   whichever language is on screen: Chinese comes from window.FP_ZH, English from the original text the page
   keeps for switching back (passed in as opt.en). Links: final-project.html?q=kaggle, ?tag=demo,3d, #A11. */
(function () {
	'use strict';
	var T = window.FP_TAGS || { groups: [], tags: {}, order: [], popular: [], implied: {} };
	var UI = {
		en: {
			search: 'Search', ph: 'Search {n} briefs, competitions, tools and the FAQ', input: 'Search: game, medical, Kaggle, "world model", A11 …',
			pop: 'Browse by tag:', all: 'all {n} tags', hint: 'Every brief carries tags. Click one, here or on any brief, to list the briefs that share it.',
			runs: 'Compute you have', c_api: 'API key or a laptop', c_gpu1: 'one GPU', c_multi: 'several GPUs',
			s_api: 'no GPU', s_gpu1: '1 GPU', s_multi: 'multi-GPU',
			track: 'Track', nb: '{n} briefs', nb1: '1 brief', ofall: 'of {n}', other: 'Elsewhere on this page',
			none: 'No brief matches.', noneHint: 'Try fewer words, or remove a filter.', clear: 'clear', clearAll: 'clear all', close: 'Close',
			keys: '↑ ↓ move  ·  Enter open  ·  Esc close', back: 'Back to the {n} results', back1: 'Back to search',
			legend: 'What the tags mean', filters: 'Tags and filters', showAll: 'show all {n}', kwTip: 'Search for "{x}"',
			tr: { A: 'Agents', B: 'Training', C: 'HCI & education', D: 'Evaluation & data', E: 'AI for society', F: 'Efficiency', H: 'Startup' },
			sec: { question: 'Overview', schedule: 'Schedule & grading', courses: 'Other courses', toolbox: 'Toolbox', playbook: 'Playbook', faq: 'FAQ', track: 'Track ' }
		},
		zh: {
			search: '搜索', ph: '搜索 {n} 个选题、比赛、工具和常见问题', input: '搜索：游戏、医疗、Kaggle、世界模型、A11 …',
			pop: '按标签浏览：', all: '全部 {n} 个标签', hint: '每个选题都带标签。点这里或任一选题上的标签，就能列出所有同类选题。',
			runs: '你有的算力', c_api: '只有 API 或笔记本', c_gpu1: '一块 GPU', c_multi: '多块 GPU',
			s_api: '无需 GPU', s_gpu1: '1 块 GPU', s_multi: '多 GPU',
			track: '方向', nb: '{n} 个选题', nb1: '1 个选题', ofall: '共 {n} 个', other: '页面其他位置',
			none: '没有匹配的选题。', noneHint: '少输几个词，或去掉一个筛选条件。', clear: '清空', clearAll: '清除筛选', close: '关闭',
			keys: '↑ ↓ 移动  ·  Enter 打开  ·  Esc 关闭', back: '回到 {n} 条搜索结果', back1: '回到搜索',
			legend: '标签说明', filters: '标签与筛选', showAll: '显示全部 {n} 条', kwTip: '搜索“{x}”',
			tr: { A: '智能体', B: '训练模型', C: '人机交互与教育', D: '评估与数据', E: 'AI 与社会', F: '效率', H: '创业' },
			sec: { question: '概览', schedule: '时间表与评分', courses: '其他课程', toolbox: '工具箱', playbook: '研究手册', faq: '常见问题', track: '方向 ' }
		}
	};
	var S = { lang: 'en', q: '', tags: [], tracks: [], comp: '', sel: -1, open: false, allOther: false, fopen: false, nb: 0 };
	var briefs = [], others = [], ZH = {}, hook = {}, el = {}, tmp = document.createElement('div'), lastFocus = null, lastCount = 0, lastScroll = 0;
	var CORD = { api: 0, gpu1: 1, multi: 2 };

	/* ---------- small helpers ---------- */
	function L() { return UI[S.lang]; }
	function fmt(s, n, x) { return s.replace('{n}', n).replace('{x}', x); }
	function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
	function squeeze(s) { return (s || '').replace(/\s+/g, ' ').trim(); }
	function same(s) { return s.toLowerCase().replace(/[‐-―_\/-]/g, ' '); }   /* same length as the input */
	function norm(s) { return squeeze(same(s || '')); }
	/* text of a node with a space where a block or a label ends, so that "<b>Measure</b>accuracy" does not read "Measureaccuracy" */
	var SEP = 'b.k, b.t, .weeks b, div, p, li, td, th, tr, h3, h4, summary, blockquote, br, dt, dd, span.tag, text, figcaption';
	function textOf(node, inPlace) {
		var c = inPlace ? node : node.cloneNode(true);
		Array.prototype.forEach.call(c.querySelectorAll(SEP), function (x) { x.parentNode.insertBefore(document.createTextNode(' '), x.nextSibling); });
		return c.textContent;
	}
	function plain(html) { tmp.innerHTML = html; var t = textOf(tmp, true); tmp.textContent = ''; return t; }
	function zhOf(node) {   /* the translated parts of a node, in Chinese (the parts that are never translated are already in the English text) */
		var out = [];
		function one(n) { var k = n.getAttribute && n.getAttribute('data-i18n'); if (k && ZH[k]) out.push(plain(ZH[k])); }
		one(node); Array.prototype.forEach.call(node.querySelectorAll('[data-i18n]'), one);
		return squeeze(out.join(' '));
	}
	/* a detached copy of a node, put into one language: English from the page's own store of the original text, Chinese from the dictionary */
	function inLang(node, lang) {
		var c = node.cloneNode(true);
		function one(n) {
			var k = n.getAttribute && n.getAttribute('data-i18n'); if (!k) return;
			var h = lang === 'zh' ? ZH[k] : (hook.en ? hook.en(k) : null);
			if (h != null) n.innerHTML = h;
		}
		one(c); Array.prototype.forEach.call(c.querySelectorAll('[data-i18n]'), one);
		return c;
	}
	function enOf(node) { return S.lang === 'zh' ? textOf(inLang(node, 'en'), true) : textOf(node); }
	/* heading text without the brief id, section number, counters and side notes; lang 'en' or 'zh', or none for what the page shows now */
	function heading(node, lang, max, sel) {
		var c = !lang || (lang === 'en' && S.lang !== 'zh') ? node.cloneNode(true) : inLang(node, lang);
		if (sel) c = c.querySelector(sel) || c;   /* the heading sits inside the translated block (a callout's title) */
		Array.prototype.forEach.call(c.querySelectorAll('.id, .lab, .num, .cnt, .sub'), function (x) { x.remove(); });
		var t = squeeze(c.textContent);
		return max && t.length > max ? t.slice(0, max - 2) + '…' : t;
	}
	function label(k) { var t = T.tags[k]; return t ? t.e + ' ' + (S.lang === 'zh' ? t.zh : t.en) : k; }
	function desc(k) { var t = T.tags[k]; return t ? (S.lang === 'zh' ? t.dzh : t.den) : ''; }

	/* ---------- index ----------
	   Nothing is indexed while the page loads. The work is cut into small jobs (one per brief, one per section) that run in
	   idle time afterwards; if the panel is opened before they are done, the rest runs at once. */
	var jobs = null;
	function addBrief(b, i) {
		var h4 = b.querySelector('h4'), idEl = b.querySelector('h4 .id'); if (!h4 || !idEl) return;
		var id = squeeze(idEl.textContent), tags = (b.getAttribute('data-tags') || '').split(/\s+/).filter(Boolean);
		var shown = Array.prototype.map.call(b.querySelectorAll('.meta .tag[data-t]'), function (x) { return x.getAttribute('data-t'); });
		var words = [];
		tags.forEach(function (k) { var t = T.tags[k]; if (t) words.push(t.en, t.zh, t.kw); });
		Array.prototype.forEach.call(b.querySelectorAll('.meta .tag:not([data-t])'), function (x) { words.push(x.getAttribute('data-en') || x.textContent, x.getAttribute('data-zh') || ''); });
		var body = [], bodyZh = [];
		Array.prototype.forEach.call(b.querySelectorAll('details.brief-fold > *:not(summary)'), function (x) { body.push(enOf(x)); bodyZh.push(zhOf(x)); });
		var rec = { kind: 'b', i: briefs.length, el: b, head: h4, id: id, idl: id.toLowerCase(), track: id.charAt(0), comp: b.getAttribute('data-c') || 'api', tags: tags, shown: shown,
			ten: norm(heading(h4, 'en')), tzh: norm(heading(h4, 'zh')), tagtxt: norm(words.join(' ')), enRaw: squeeze(body.join(' ')), zhRaw: squeeze(bodyZh.join(' ')) };
		rec.en = norm(rec.enRaw); rec.zh = norm(rec.zhRaw);
		briefs.push(rec);
	}
	/* everything else on the page: sections, folded blocks, cards, reading lists, competition rows, FAQ entries.
	   head: the element whose text is the title; hsel: a selector inside it, looked up afresh each time because a language switch
	   replaces the children of translated elements; scope + sel: where to read the title in a given language, if not head itself */
	function other(target, head, nodes, sec, max, scope, sel, hsel) {
		var en = [], zh = [];
		nodes.forEach(function (n) { en.push(enOf(n)); zh.push(zhOf(n)); });
		var rec = { kind: 'o', i: others.length, el: target, head: head, hsel: hsel, max: max, sec: sec, enRaw: squeeze(en.join(' ')), zhRaw: squeeze(zh.join(' ')) };
		if (!rec.enRaw) return;
		rec.en = norm(rec.enRaw); rec.zh = norm(rec.zhRaw);
		rec.ten = norm(heading(scope || head, 'en', 0, sel)); rec.tzh = norm(heading(scope || head, 'zh', 0, sel));
		others.push(rec);
	}
	var DROP = '.brief, .res3, .grid, .media, .tblwrap, .fs-bar, .tracks, .finder, .filters, summary';
	function pruned(node) { var c = node.cloneNode(true); Array.prototype.forEach.call(c.querySelectorAll(DROP), function (x) { x.remove(); }); return c; }
	function addSection(sec) {
		var sid = sec.id, h2 = sec.querySelector('h2.sec'); if (!h2) return;
		var kids = Array.prototype.slice.call(sec.children);
		/* the section itself: heading plus the paragraphs, lists and tables that sit directly under it */
		other(h2, h2, kids.filter(function (c) { return /^(P|UL|OL)$/.test(c.tagName) || (sid === 'schedule' && c.classList.contains('tblwrap')); }), sid);
		/* folded blocks */
		Array.prototype.forEach.call(sec.querySelectorAll('details.sec-fold'), function (d) {
			var sum = d.querySelector('summary'), co = d.classList.contains('callout-fold') && d.querySelector('.callout'); if (!sum) return;
			if (co) other(d, sum, [pruned(d)], sid, 0, co, 'b.t'); else other(d, sum, [pruned(d)], sid);
		});
		/* h3 blocks of the sections that stay open */
		kids.forEach(function (h, j) {
			if (h.tagName !== 'H3') return;
			var group = [];
			for (var m = j + 1; m < kids.length && !/^H[23]$/.test(kids[m].tagName); m++) if (!kids[m].matches(DROP) && kids[m].tagName !== 'DETAILS') group.push(kids[m]);
			if (group.length) other(h, h, group, sid);
		});
		Array.prototype.forEach.call(sec.querySelectorAll('.res3 > .card, .grid > .card'), function (c) { var h = c.querySelector('h4'); if (h) other(c, h, [c], sid); });
		Array.prototype.forEach.call(sec.querySelectorAll('.media > div'), function (m) { other(m, m.querySelector('b') || m.querySelector('.mcap') || m, [m], sid, 90); });
		Array.prototype.forEach.call(sec.querySelectorAll('table tr'), function (tr) {
			var td = tr.querySelector('td'); if (!td || tr.closest('.brief') || sid === 'schedule') return;
			var bold = td.querySelector('b') ? 'b' : null;   /* competition rows: the name is the bold part of the first cell */
			other(tr, td, [tr], sid, 90, td, bold, bold);
		});
		Array.prototype.forEach.call(sec.querySelectorAll('details.q'), function (d) { var sum = d.querySelector('summary'); if (sum) other(d, sum, [d], sid); });
	}
	function planIndex() {
		jobs = [];
		Array.prototype.forEach.call(document.querySelectorAll('.brief'), function (b) { jobs.push(function () { addBrief(b); }); });
		Array.prototype.forEach.call(document.querySelectorAll('section[id]'), function (sec) { jobs.push(function () { addSection(sec); }); });
	}
	function ensureIndex() { if (!jobs) planIndex(); while (jobs.length) jobs.shift()(); }
	function idleIndex() {
		if (!jobs) planIndex();
		var idle = window.requestIdleCallback ? function (f) { window.requestIdleCallback(f, { timeout: 3000 }); } : function (f) { setTimeout(function () { f(null); }, 80); };
		(function step() {
			if (!jobs.length) return;
			idle(function (d) {
				var t0 = Date.now();
				do { if (jobs.length) jobs.shift()(); } while (jobs.length && Date.now() - t0 < 10 && (!d || d.didTimeout || d.timeRemaining() > 3));
				step();
			});
		})();
	}

	/* ---------- matching ---------- */
	function parseQuery(q) {
		var comp = '', s = ' ' + q + ' ';
		s = s.replace(/(^|\s)(?:no|without|zero)[\s-]+gpus?(?=\s)|无需\s*gpu|不用\s*gpu|没有\s*gpu|无\s*gpu/gi, function () { comp = 'api'; return ' '; });
		s = s.replace(/(^|\s)(?:one|1|single)[\s-]+gpu(?=\s)|一块\s*gpu|单\s*gpu/gi, function () { comp = comp || 'gpu1'; return ' '; });
		var terms = [];
		s.replace(/"([^"]+)"|“([^”]+)”|(\S+)/g, function (_, a, b, c) { var t = norm(a || b || c); if (t) terms.push(t); return ''; });
		return { terms: terms, comp: comp };
	}
	function count(hay, t) { var n = 0, i = -1; while (n < 6 && (i = hay.indexOf(t, i + 1)) >= 0) n++; return n; }
	function titleHit(r, t) {
		var p = r.ten.indexOf(t);
		if (p >= 0) return (p === 0 || r.ten.charAt(p - 1) === ' ') ? 80 : 60;
		return r.tzh && r.tzh.indexOf(t) >= 0 ? 70 : 0;
	}
	function score(r, terms) {
		var s = 0;
		for (var i = 0; i < terms.length; i++) {
			var t = terms[i], hit = 0;
			if (r.kind === 'b') {
				if (r.idl === t) hit += 1000; else if (/^[a-h]\d+$/.test(t) && r.idl.indexOf(t) === 0) hit += 150;
				if (r.tagtxt.indexOf(t) >= 0) hit += 40;
			}
			hit += titleHit(r, t);
			var c = count(r.en, t) + count(r.zh, t);
			if (c) hit += 8 + 2 * c;
			if (!hit) return 0;
			s += hit;
		}
		return s || 1;
	}
	function passes(b, f) {
		for (var i = 0; i < f.tags.length; i++) if (b.tags.indexOf(f.tags[i]) < 0) return false;
		if (f.tracks.length && f.tracks.indexOf(b.track) < 0) return false;
		if (f.comp && CORD[b.comp] > CORD[f.comp]) return false;
		return true;
	}
	function ranges(text, terms) {
		var low = same(text), out = [];
		if (low.length !== text.length) return out;
		terms.forEach(function (t) { var i = -1; while ((i = low.indexOf(t, i + 1)) >= 0) out.push([i, i + t.length]); });
		out.sort(function (a, b) { return a[0] - b[0]; });
		var merged = [];
		out.forEach(function (r) { var m = merged[merged.length - 1]; if (m && r[0] <= m[1]) m[1] = Math.max(m[1], r[1]); else merged.push([r[0], r[1]]); });
		return merged;
	}
	function hl(text, terms) {
		if (!terms.length) return esc(text);
		var rs = ranges(text, terms), out = '', p = 0;
		rs.forEach(function (r) { out += esc(text.slice(p, r[0])) + '<mark>' + esc(text.slice(r[0], r[1])) + '</mark>'; p = r[1]; });
		return out + esc(text.slice(p));
	}
	function snippet(r, terms) {
		if (!terms.length) return '';
		var order = S.lang === 'zh' ? [r.zhRaw, r.enRaw] : [r.enRaw, r.zhRaw];
		for (var k = 0; k < order.length; k++) {
			var raw = order[k]; if (!raw) continue;
			var low = same(raw); if (low.length !== raw.length) continue;
			var pos = -1;
			for (var i = 0; i < terms.length; i++) { var p = low.indexOf(terms[i]); if (p >= 0 && (pos < 0 || p < pos)) pos = p; }
			if (pos < 0) continue;
			var cjk = /[㐀-鿿]/.test(raw.substr(Math.max(0, pos - 6), 20));   /* Chinese needs fewer characters for the same width */
			var a = Math.max(0, pos - (cjk ? 26 : 60)), b = Math.min(raw.length, pos + (cjk ? 66 : 130));
			if (a > 0) { var sp = raw.indexOf(' ', a); if (sp >= 0 && sp < pos - 8) a = sp + 1; }
			if (b < raw.length) { var sq = raw.lastIndexOf(' ', b); if (sq > pos + 30) b = sq; }
			return (a > 0 ? '… ' : '') + hl(raw.slice(a, b), terms) + (b < raw.length ? ' …' : '');
		}
		return '';
	}

	/* ---------- rendering ---------- */
	function chip(k, extra) { var t = T.tags[k]; return t ? '<span class="tag f f-' + t.g + (extra || '') + '">' + esc(label(k)) + '</span>' : ''; }
	function secLabel(sid) { var s = L().sec; return /^track/.test(sid) ? s.track + sid.slice(5) : (s[sid] || ''); }
	function current() {
		var pq = parseQuery(S.q), f = { tags: S.tags, tracks: S.tracks, comp: S.comp || pq.comp };
		return { terms: pq.terms, f: f, autoComp: !S.comp && pq.comp };
	}
	function render() {
		var cur = current(), terms = cur.terms, f = cur.f, lang = L();
		var scored = [];
		briefs.forEach(function (b) { var s = score(b, terms); if (s) scored.push({ r: b, s: s }); });
		var res = scored.filter(function (x) { return passes(x.r, f); });
		if (terms.length) res.sort(function (x, y) { return y.s - x.s || x.r.i - y.r.i; });
		var oth = [];
		if (terms.length) {
			others.forEach(function (o) { var s = score(o, terms); if (s) oth.push({ r: o, s: s }); });
			oth.sort(function (x, y) { return y.s - x.s || x.r.i - y.r.i; });
		}

		/* facets, with the number of briefs each choice would leave */
		function n(mod) { var g = { tags: f.tags, tracks: f.tracks, comp: f.comp }; mod(g); return scored.filter(function (x) { return passes(x.r, g); }).length; }
		var fh = '<div class="fs-g"><div class="fs-gt">' + lang.runs + '</div><div class="fs-cs">';
		['api', 'gpu1', 'multi'].forEach(function (c) {
			var k = n(function (g) { g.comp = c; });
			fh += '<button type="button" class="fs-c c-' + c + (f.comp === c ? ' on' : '') + (k ? '' : ' zero') + '" data-comp="' + c + '">' + lang['c_' + c] + ' <i>' + k + '</i></button>';
		});
		fh += '</div></div><div class="fs-g"><div class="fs-gt">' + lang.track + '</div><div class="fs-cs">';
		Object.keys(lang.tr).forEach(function (t) {
			var k = n(function (g) { g.tracks = [t]; });
			fh += '<button type="button" class="fs-c fs-trk' + (f.tracks.indexOf(t) >= 0 ? ' on' : '') + (k ? '' : ' zero') + '" data-track="' + t + '"><b>' + t + '</b> ' + lang.tr[t] + ' <i>' + k + '</i></button>';
		});
		fh += '</div></div>';
		T.groups.forEach(function (g) {
			fh += '<div class="fs-g"><div class="fs-gt">' + esc(S.lang === 'zh' ? g[2] : g[1]) + '</div><div class="fs-cs">';
			T.order.forEach(function (k) {
				var t = T.tags[k]; if (t.g !== g[0]) return;
				var on = f.tags.indexOf(k) >= 0, c = on ? res.length : n(function (x) { x.tags = f.tags.concat([k]); });
				fh += '<button type="button" class="fs-c f-' + t.g + (on ? ' on' : '') + (c ? '' : ' zero') + '" data-k="' + k + '" title="' + esc(desc(k)) + '">' + esc(label(k)) + ' <i>' + c + '</i></button>';
			});
			fh += '</div></div>';
		});
		fh += '<details class="fs-legend"' + (el.legendOpen ? ' open' : '') + '><summary>' + lang.legend + '</summary><dl>';
		T.order.forEach(function (k) { fh += '<dt>' + esc(label(k)) + '</dt><dd>' + esc(desc(k)) + '</dd>'; });
		fh += '</dl></details>';
		var keep = document.activeElement && el.facets.contains(document.activeElement) ? document.activeElement : null;
		var sel = keep && (keep.getAttribute('data-k') ? '[data-k="' + keep.getAttribute('data-k') + '"]' : keep.getAttribute('data-track') ? '[data-track="' + keep.getAttribute('data-track') + '"]' : keep.getAttribute('data-comp') ? '[data-comp="' + keep.getAttribute('data-comp') + '"]' : '');
		var ftop = el.facets.scrollTop;
		el.facets.innerHTML = fh; el.facets.scrollTop = ftop;
		if (sel) { var again = el.facets.querySelector(sel); if (again) again.focus(); }

		/* summary line: count and the active filters */
		var nsel = f.tags.length + f.tracks.length + (f.comp ? 1 : 0);
		var sh = '<b>' + (res.length === 1 ? lang.nb1 : fmt(lang.nb, res.length)) + '</b>' + (res.length < briefs.length ? ' <span class="fs-of">' + fmt(lang.ofall, briefs.length) + '</span>' : '');
		if (f.comp) sh += ' <button type="button" class="fs-on" data-comp="' + f.comp + '">' + lang['c_' + f.comp] + ' ×</button>';
		f.tracks.forEach(function (t) { sh += ' <button type="button" class="fs-on" data-track="' + t + '">' + lang.sec.track + t + ' ×</button>'; });
		f.tags.forEach(function (k) { sh += ' <button type="button" class="fs-on" data-k="' + k + '">' + esc(label(k)) + ' ×</button>'; });
		if (nsel) sh += ' <button type="button" class="fs-clr" data-clear="1">' + lang.clearAll + '</button>';
		var h = '<div class="fs-sum">' + sh + '</div>';

		if (!res.length) h += '<div class="fs-none"><b>' + lang.none + '</b> ' + lang.noneHint + '</div>';
		res.forEach(function (x) {
			var b = x.r, title = heading(b.head), tags = b.shown.slice();
			f.tags.forEach(function (k) { if (tags.indexOf(k) < 0 && k !== 'rank') tags.push(k); });
			var th = tags.map(function (k) { return k === 'rank' ? '<span class="tag c-comp' + (f.tags.indexOf(k) >= 0 ? ' hit' : '') + '">' + esc(label(k)) + '</span>' : chip(k, f.tags.indexOf(k) >= 0 ? ' hit' : ''); }).join('');
			th += '<span class="tag c-' + (b.comp === 'gpu1' ? 'gpu' : b.comp) + '">' + lang['s_' + b.comp] + '</span>';
			var sn = snippet(b, terms);
			h += '<a class="fs-r" href="#' + b.id + '" data-b="' + b.i + '"><span class="fs-id">' + hl(b.id, terms) + '</span><span class="fs-m"><span class="fs-t">' + hl(title, terms) + '</span>' +
				'<span class="fs-tags">' + th + '</span>' + (sn ? '<span class="fs-sn">' + sn + '</span>' : '') + '</span></a>';
		});
		if (oth.length) {
			h += '<div class="fs-sum fs-sum2"><b>' + lang.other + '</b> <span class="fs-of">' + oth.length + '</span></div>';
			var lim = S.allOther ? oth.length : Math.min(oth.length, 8);
			for (var i = 0; i < lim; i++) {
				var o = oth[i].r, t = heading(o.head, null, o.max, o.hsel), sn2 = snippet(o, terms);
				h += '<a class="fs-r fs-o" href="#" data-o="' + o.i + '"><span class="fs-id fs-sec">' + esc(secLabel(o.sec)) + '</span><span class="fs-m"><span class="fs-t">' + hl(t, terms) + '</span>' +
					(sn2 ? '<span class="fs-sn">' + sn2 + '</span>' : '') + '</span></a>';
			}
			if (lim < oth.length) h += '<button type="button" class="fs-more" data-more="1">' + fmt(lang.showAll, oth.length) + '</button>';
		}
		el.results.innerHTML = h;
		el.clear.hidden = !S.q;
		el.ftoggle.innerHTML = lang.filters + (nsel ? ' <i>' + nsel + '</i>' : '') + ' <span>▾</span>';
		lastCount = res.length + oth.length;
		setSel(terms.length && lastCount ? 0 : -1, true);
	}
	function rows() { return Array.prototype.slice.call(el.results.querySelectorAll('.fs-r')); }
	function setSel(i, quiet) {
		var rs = rows(); S.sel = rs.length ? Math.max(-1, Math.min(i, rs.length - 1)) : -1;
		rs.forEach(function (r, j) { r.classList.toggle('sel', j === S.sel); });
		if (!quiet && S.sel >= 0) rs[S.sel].scrollIntoView({ block: 'nearest' });
	}

	/* ---------- open, close, go ---------- */
	function open(opt) {
		if (!el.overlay) return;
		ensureIndex();
		if (opt) { S.q = opt.q || ''; S.tags = opt.tags || []; S.tracks = opt.tracks || []; S.comp = opt.comp || ''; S.allOther = false; el.input.value = S.q; lastScroll = 0; }
		if (!S.open) lastFocus = document.activeElement;
		S.open = true; el.overlay.hidden = false; el.backBox.hidden = true;
		el.panel.classList.toggle('fopen', S.fopen);
		render(); if (lastScroll) el.results.scrollTop = lastScroll;
		setTimeout(function () { el.input.focus(); if (!opt) el.input.select(); }, 0);
	}
	function close(refocus) {
		if (!S.open) return;
		lastScroll = el.results.scrollTop; S.open = false; el.overlay.hidden = true;
		if (refocus && lastFocus && lastFocus.focus) try { lastFocus.focus(); } catch (e) {}
	}
	function go(row) {
		var rec = row.hasAttribute('data-b') ? briefs[+row.getAttribute('data-b')] : others[+row.getAttribute('data-o')];
		if (!rec) return;
		var n = lastCount; close(false);
		if (hook.reveal) hook.reveal(rec.el);
		if (rec.kind === 'b') try { history.replaceState(null, '', location.pathname + location.search + '#' + rec.id); } catch (e) {}
		el.backGo.textContent = '↩ ' + (n > 1 ? fmt(L().back, n) : L().back1);
		el.backBox.hidden = false;
	}
	function toggle(list, v) { var i = list.indexOf(v); if (i >= 0) list.splice(i, 1); else list.push(v); }

	/* ---------- static parts: chips on the briefs, the bar under the track cards, the panel ---------- */
	function paintChips() {
		var zh = S.lang === 'zh';
		Array.prototype.forEach.call(document.querySelectorAll('.brief .meta .tag'), function (c) {
			var k = c.getAttribute('data-t');
			if (!c.hasAttribute('data-en')) c.setAttribute('data-en', c.textContent);
			if (k && k !== 'rank') { c.textContent = label(k); c.title = desc(k); }
			else {
				var z = c.getAttribute('data-zh'); c.textContent = zh && z ? z : c.getAttribute('data-en');
				if (k === 'rank') c.title = desc(k); else if (c.classList.contains('kw')) c.title = fmt(L().kwTip, 0, c.textContent);
			}
			/* clickable, but not a tab stop: several hundred chips would bury the page for keyboard users, and the panel offers every tag */
			if (k || c.classList.contains('kw')) { c.setAttribute('role', 'button'); c.setAttribute('tabindex', '-1'); }
		});
	}
	function paintBar() {
		var lang = L(), box = document.getElementById('fs-pop');
		if (box) {
			var h = '<span class="fs-lbl">' + lang.pop + '</span>';
			(T.popular || []).forEach(function (k) {
				var t = T.tags[k]; if (!t) return;
				var c = document.querySelectorAll('.brief[data-tags~="' + k + '"]').length;
				h += '<span class="tag ' + (k === 'rank' ? 'c-comp' : 'f f-' + t.g) + '" data-t="' + k + '" role="button" tabindex="0" title="' + esc(desc(k)) + '">' + esc(label(k)) + ' <i>' + c + '</i></span>';
			});
			h += '<button type="button" class="fs-all" data-fs-open="1">' + fmt(lang.all, T.order.length) + ' ›</button>';
			box.innerHTML = h;
		}
		Array.prototype.forEach.call(document.querySelectorAll('[data-fs]'), function (x) {
			var k = x.getAttribute('data-fs'); if (lang[k]) x.textContent = fmt(lang[k], S.nb);
		});
		var sb = document.getElementById('searchbtn'); if (sb) { sb.innerHTML = '<span aria-hidden="true">&#128269;</span> ' + lang.search; sb.title = fmt(lang.ph, S.nb) + '  ( / )'; }
	}
	function buildPanel() {
		var o = document.createElement('div'); o.className = 'fs-overlay'; o.id = 'fs'; o.hidden = true;
		o.innerHTML = '<div class="fs-panel" role="dialog" aria-modal="true" aria-label="Search">' +
			'<div class="fs-head"><span class="fs-ic" aria-hidden="true">&#128269;</span><input id="fs-q" type="text" autocomplete="off" autocapitalize="off" spellcheck="false" enterkeyhint="search">' +
			'<button type="button" class="fs-x" id="fs-clear" hidden></button><button type="button" class="fs-esc" id="fs-close"><kbd>Esc</kbd></button></div>' +
			'<button type="button" class="fs-ftoggle" id="fs-ftoggle"></button>' +
			'<div class="fs-body"><div class="fs-facets" id="fs-facets"></div><div class="fs-results" id="fs-results"></div></div>' +
			'<div class="fs-foot" id="fs-foot"></div></div>';
		document.body.appendChild(o);
		var bk = document.createElement('div'); bk.className = 'fs-back'; bk.id = 'fs-back'; bk.hidden = true;
		bk.innerHTML = '<button type="button" class="fs-back-go"></button><button type="button" class="fs-back-x" aria-label="dismiss">×</button>';
		document.body.appendChild(bk);
		el.overlay = o; el.panel = o.firstChild; el.input = o.querySelector('#fs-q'); el.clear = o.querySelector('#fs-clear'); el.closeBtn = o.querySelector('#fs-close');
		el.facets = o.querySelector('#fs-facets'); el.results = o.querySelector('#fs-results'); el.foot = o.querySelector('#fs-foot'); el.ftoggle = o.querySelector('#fs-ftoggle');
		el.backBox = bk; el.backGo = bk.firstChild;

		var timer = null;
		el.input.addEventListener('input', function () { clearTimeout(timer); timer = setTimeout(function () { S.q = el.input.value; S.allOther = false; render(); el.results.scrollTop = 0; }, 70); });
		el.input.addEventListener('keydown', function (e) {
			if (e.key === 'ArrowDown') { e.preventDefault(); setSel(S.sel + 1); }
			else if (e.key === 'ArrowUp') { e.preventDefault(); setSel(S.sel - 1); }
			else if (e.key === 'Enter') { e.preventDefault(); clearTimeout(timer); if (S.q !== el.input.value) { S.q = el.input.value; render(); } var rs = rows(); if (rs.length) go(rs[S.sel >= 0 ? S.sel : 0]); }
		});
		el.clear.addEventListener('click', function () { el.input.value = ''; S.q = ''; render(); el.input.focus(); });
		el.closeBtn.addEventListener('click', function () { close(true); });
		el.ftoggle.addEventListener('click', function () { S.fopen = !S.fopen; el.panel.classList.toggle('fopen', S.fopen); });
		o.addEventListener('mousedown', function (e) { if (e.target === o) close(true); });
		el.facets.addEventListener('toggle', function (e) { if (e.target.classList && e.target.classList.contains('fs-legend')) el.legendOpen = e.target.open; }, true);
		function pick(e) {
			var t = e.target.closest('[data-k],[data-track],[data-comp],[data-clear],[data-more]'); if (!t) return false;
			if (t.hasAttribute('data-k')) toggle(S.tags, t.getAttribute('data-k'));
			else if (t.hasAttribute('data-track')) toggle(S.tracks, t.getAttribute('data-track'));
			else if (t.hasAttribute('data-comp')) { var c = t.getAttribute('data-comp'), cur = current(); if (cur.autoComp) { S.q = S.q.replace(/(?:no|without|zero|one|1|single)[\s-]+gpus?|无需\s*gpu|不用\s*gpu|没有\s*gpu|无\s*gpu|一块\s*gpu|单\s*gpu/gi, ' ').replace(/\s+/g, ' ').trim(); el.input.value = S.q; S.comp = cur.f.comp === c ? '' : c; } else S.comp = S.comp === c ? '' : c; }
			else if (t.hasAttribute('data-clear')) { S.tags = []; S.tracks = []; S.comp = ''; S.q = ''; el.input.value = ''; }
			else if (t.hasAttribute('data-more')) S.allOther = true;
			var top = el.results.scrollTop; render(); if (t.hasAttribute('data-more')) el.results.scrollTop = top;
			return true;
		}
		el.facets.addEventListener('click', pick);
		el.results.addEventListener('click', function (e) {
			if (pick(e)) return;
			var r = e.target.closest('.fs-r'); if (!r) return;
			if (e.ctrlKey || e.metaKey || e.shiftKey || e.button) return;
			e.preventDefault(); go(r);
		});
		bk.addEventListener('click', function (e) { if (e.target.classList.contains('fs-back-x')) { bk.hidden = true; return; } open(); });
	}

	function setLang(lang) {
		S.lang = lang === 'zh' ? 'zh' : 'en';
		if (!el.overlay) return;
		paintChips(); paintBar();
		el.input.placeholder = L().input; el.clear.textContent = L().clear; el.closeBtn.title = L().close; el.foot.textContent = L().keys;
		el.panel.setAttribute('aria-label', L().search);
		if (S.open) render();
	}

	function init(opt) {
		if (el.overlay) return;
		ZH = (opt && opt.zh) || window.FP_ZH || {}; hook = opt || {};
		S.nb = document.querySelectorAll('.brief').length;
		buildPanel();
		setTimeout(idleIndex, 1500);   /* after the page's own start-up work */
		/* tags and keywords on the page open the panel */
		function fromChip(c) {
			if (c.hasAttribute('data-t')) open({ tags: [c.getAttribute('data-t')] });
			else open({ q: '"' + squeeze(c.textContent) + '"' });
		}
		document.addEventListener('click', function (e) {
			if (!e.target.closest) return;
			var c = e.target.closest('.brief .meta .tag[role=button], .fs-pop .tag[data-t]');
			if (c) { e.preventDefault(); fromChip(c); return; }
			var b = e.target.closest('[data-fs-open], #searchbtn, #hero-search');
			if (b) { e.preventDefault(); open(); }
		});
		document.addEventListener('keydown', function (e) {
			if (S.open) {
				if (e.key === 'Escape') { e.preventDefault(); close(true); }
				else if (e.key === 'Tab') {   /* keep the focus inside the dialog */
					var fs = Array.prototype.filter.call(el.panel.querySelectorAll('input, button, a[href], summary'), function (x) { return x.offsetParent !== null; });
					if (!fs.length) return;
					var first = fs[0], last = fs[fs.length - 1];
					if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
					else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
				}
				return;
			}
			var a = document.activeElement, typing = a && (/^(INPUT|TEXTAREA|SELECT)$/.test(a.tagName) || a.isContentEditable);
			if ((e.key === 'k' || e.key === 'K') && (e.ctrlKey || e.metaKey) && !e.altKey) { e.preventDefault(); open(); return; }
			if (e.key === '/' && !typing && !e.ctrlKey && !e.metaKey && !e.altKey) { e.preventDefault(); open(); return; }
			if ((e.key === 'Enter' || e.key === ' ') && a && a.matches && a.matches('.brief .meta .tag[role=button], .fs-pop .tag[data-t]')) { e.preventDefault(); fromChip(a); }
		});
		/* links such as final-project.html?q=kaggle or ?tag=demo,3d open the panel directly */
		var p = new URLSearchParams(location.search), q = p.get('q'), tg = p.get('tag');
		if (q || tg) {
			var want = { q: q || '', tags: (tg || '').split(',').filter(function (k) { return T.tags[k]; }) };
			setTimeout(function () { open(want); }, 0);
		}
	}

	window.FPSearch = { init: init, setLang: setLang, open: open, close: close, _state: S, _index: function () { ensureIndex(); return { briefs: briefs, others: others }; }, _pending: function () { return jobs ? jobs.length : -1; } };
})();
