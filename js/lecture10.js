/* Lecture 10 video page: part switching with fades, "up next" title card, slide jumps, synced transcript, deep links. */
(function () {
  var VIDEO_BASE = window.L10_VIDEO_BASE || 'materials/videos/lecture10/';
  var POSTER_BASE = 'imgs/lecture10/';
  var parts = window.L10.parts;
  var video = document.getElementById('video');
  var stage = document.getElementById('stage');
  var card = document.getElementById('titleCard');
  var cur = 0, curSlide = -1, curSent = -1, countdown = null, lang = 'both';

  function fmt(t) { t = Math.max(0, Math.floor(t)); var m = Math.floor(t / 60), s = t % 60; return m + ':' + (s < 10 ? '0' : '') + s; }
  function $(id) { return document.getElementById(id); }
  function esc(s) { return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;'); }

  /* ---------- build static UI ---------- */
  var chips = $('chips'), grid = $('partsGrid'), tocParts = $('tocParts');
  parts.forEach(function (p, i) {
    var b = document.createElement('button');
    b.textContent = p.n + '. ' + p.title.replace(/:.*$/, '');
    b.title = p.title;
    b.onclick = function () { load(i, 0, true); };
    chips.appendChild(b);

    var c = document.createElement('div');
    c.className = 'pcard reveal';
    c.innerHTML = '<div class="thumb" style="background-image:url(' + POSTER_BASE + p.poster + ')"><span class="dur">' + fmt(p.duration) +
      '</span><span class="playic">&#9654;</span></div><div class="body"><div class="k">Part ' + p.n + ' &middot; slides ' + p.first + '&ndash;' + p.last +
      '</div><h4>' + esc(p.title) + '</h4><p>' + esc(p.blurb) + '</p></div>';
    c.onclick = function () { load(i, 0, true); scrollToPlayer(); };
    grid.appendChild(c);

    if (tocParts) {
      var a = document.createElement('a');
      a.href = '#watch';
      a.className = 'sub part-link';
      a.innerHTML = p.n + '&nbsp; ' + esc(p.title.replace(/:.*$/, '')) + '<span class="pbar"><i></i></span>';
      a.onclick = function (e) { e.preventDefault(); load(i, 0, true); scrollToPlayer(); };
      tocParts.appendChild(a);
    }
  });

  function scrollToPlayer() { $('watch').scrollIntoView({ behavior: 'smooth', block: 'start' }); }

  /* ---------- per-part lists ---------- */
  function buildLists(p) {
    var sl = $('slidesList');
    sl.innerHTML = '';
    p.slides.forEach(function (s, k) {
      var a = document.createElement('a');
      a.href = '#p' + p.n + '-s' + s.n;
      a.innerHTML = '<span class="t">' + fmt(s.t) + '</span><span class="n">' + s.n + '</span><span class="ti">' + esc(s.title) + '</span>';
      a.title = s.title;
      a.onclick = function (e) { e.preventDefault(); seek(s.t + 0.05, true); };
      sl.appendChild(a);
    });
    var tr = $('transcript');
    tr.innerHTML = '';
    var last = -1;
    p.sents.forEach(function (x, k) {
      if (x[2] !== last) {
        last = x[2];
        var h = document.createElement('div');
        h.className = 'slide-h';
        var st = p.slides.filter(function (s) { return s.n === x[2]; })[0];
        h.textContent = 'Slide ' + x[2] + (st ? ' · ' + st.title : '');
        tr.appendChild(h);
      }
      var el = document.createElement('p');
      el.innerHTML = '<span class="en">' + esc(x[3]) + '</span><span class="zh">' + esc(x[4]) + '</span>';
      el.onclick = function () { seek(x[0], true); };
      tr.appendChild(el);
    });
    $('partTitle').textContent = 'Part ' + p.n + ' · ' + p.title;
  }

  /* ---------- loading parts with a fade ---------- */
  function load(i, t, play) {
    hideCard();
    if (i === cur && video.getAttribute('src')) { seek(t || 0, play); return; }
    stage.classList.add('switching');
    setTimeout(function () {
      cur = i; curSlide = -1; curSent = -1;
      var p = parts[i];
      video.src = VIDEO_BASE + p.file;
      video.poster = POSTER_BASE + p.poster;
      buildLists(p);
      markActive();
      var done = false;
      function ready() {
        if (done) return;
        done = true;
        video.removeEventListener('loadedmetadata', ready);
        if (t) video.currentTime = t;
        stage.classList.remove('switching');
        updateNow(true);
        if (play) video.play().catch(function () {});
      }
      video.addEventListener('loadedmetadata', ready);
      video.load();
      if (video.readyState >= 1) ready();
      setTimeout(function () { if (!done) stage.classList.remove('switching'); }, 2500);
      updateNow(true);
    }, 300);
  }

  function seek(t, play) { video.currentTime = t; if (play) video.play().catch(function () {}); }

  function markActive() {
    [].forEach.call(chips.children, function (b, k) { b.classList.toggle('active', k === cur); });
    [].forEach.call(grid.children, function (c, k) { c.classList.toggle('active', k === cur); });
    if (tocParts) [].forEach.call(tocParts.children, function (a, k) { a.classList.toggle('active', k === cur); });
  }

  /* ---------- sync on timeupdate ---------- */
  function updateNow(force) {
    var p = parts[cur], t = video.currentTime || 0;
    var si = 0;
    for (var k = 0; k < p.slides.length; k++) if (t >= p.slides[k].t - 0.05) si = k;
    if (si !== curSlide || force) {
      curSlide = si;
      var s = p.slides[si];
      var el = $('nowSlide');
      el.style.opacity = 0;
      setTimeout(function () { el.textContent = 'Slide ' + s.n + ' · ' + s.title; el.style.opacity = 1; }, 150);
      $('nowPart').textContent = 'Part ' + p.n + ' of ' + parts.length + ' · ' + p.title;
      [].forEach.call($('slidesList').children, function (a, k) { a.classList.toggle('cur', k === si); });
      history.replaceState(null, '', '#p' + p.n + '-s' + s.n);
    }
    var ni = -1;
    for (var j = 0; j < p.sents.length; j++) if (t >= p.sents[j][0] - 0.1 && t <= p.sents[j][1] + 0.3) { ni = j; break; }
    if (ni !== -1 && ni !== curSent) {
      curSent = ni;
      var ps = $('transcript').querySelectorAll('p');
      [].forEach.call(ps, function (x, k) { x.classList.toggle('cur', k === ni); });
      var box = $('transcript'), el2 = ps[ni];
      if (el2 && !box.matches(':hover')) box.scrollTop = el2.offsetTop - box.offsetTop - box.clientHeight / 3;
    }
    if (tocParts) {
      var bar = tocParts.children[cur] && tocParts.children[cur].querySelector('.pbar i');
      if (bar && video.duration) bar.style.width = (100 * t / video.duration) + '%';
    }
  }
  video.addEventListener('timeupdate', function () { updateNow(false); });

  /* ---------- "up next" title card ---------- */
  function hideCard() { card.classList.remove('show'); if (countdown) { clearInterval(countdown); countdown = null; } }
  function showNext() {
    if (cur >= parts.length - 1) {
      card.innerHTML = '<div class="kicker">Lecture 10 complete</div><div class="big">Thank you for watching!</div>' +
        '<div class="blurb">See, talk, hear and speak, imagine, act — and understand space.</div>' +
        '<div class="row-btn"><button class="btn btn-default" id="cardRestart">Watch again from Part 1</button></div>';
      card.classList.add('show');
      $('cardRestart').onclick = function () { load(0, 0, true); };
      return;
    }
    var n = parts[cur + 1], left = 8, total = 8, C = 2 * Math.PI * 20;
    card.innerHTML = '<div class="kicker">Up next · Part ' + n.n + '</div><div class="big">' + esc(n.title) + '</div><div class="blurb">' + esc(n.blurb) + '</div>' +
      '<div class="ring"><svg width="46" height="46"><circle class="bg" cx="23" cy="23" r="20"/><circle class="fg" id="ringFg" cx="23" cy="23" r="20" ' +
      'stroke-dasharray="' + C + '" stroke-dashoffset="0"/></svg><span id="ringN">' + left + '</span></div>' +
      '<div class="row-btn"><button class="btn btn-default" id="cardPlay">&#9654; Play now</button><button class="btn btn-ghost" id="cardStay">Stay here</button></div>';
    card.classList.add('show');
    $('cardPlay').onclick = function () { load(cur + 1, 0, true); };
    $('cardStay').onclick = hideCard;
    countdown = setInterval(function () {
      left -= 1;
      $('ringN').textContent = left;
      $('ringFg').style.strokeDashoffset = C * (1 - left / total);
      if (left <= 0) { clearInterval(countdown); countdown = null; load(cur + 1, 0, true); }
    }, 1000);
  }
  video.addEventListener('ended', showNext);
  video.addEventListener('play', hideCard);

  /* ---------- controls ---------- */
  $('prevSlide').onclick = function () { var p = parts[cur]; if (curSlide > 0) seek(p.slides[curSlide - 1].t + 0.05, true); else if (cur > 0) load(cur - 1, 0, true); };
  $('nextSlide').onclick = function () { var p = parts[cur]; if (curSlide < p.slides.length - 1) seek(p.slides[curSlide + 1].t + 0.05, true); else if (cur < parts.length - 1) load(cur + 1, 0, true); };
  [].forEach.call(document.querySelectorAll('[data-rate]'), function (b) {
    b.onclick = function () {
      video.playbackRate = parseFloat(b.getAttribute('data-rate'));
      [].forEach.call(document.querySelectorAll('[data-rate]'), function (x) { x.classList.toggle('on', x === b); });
    };
  });
  [].forEach.call(document.querySelectorAll('[data-lang]'), function (b) {
    b.onclick = function () {
      lang = b.getAttribute('data-lang');
      var tr = $('transcript');
      tr.classList.remove('en', 'zh');
      if (lang !== 'both') tr.classList.add(lang);
      [].forEach.call(document.querySelectorAll('[data-lang]'), function (x) { x.classList.toggle('on', x === b); });
    };
  });
  document.addEventListener('keydown', function (e) {
    if (/INPUT|TEXTAREA|SELECT/.test(e.target.tagName)) return;
    if (e.key === 'ArrowRight' && e.shiftKey) { $('nextSlide').click(); e.preventDefault(); }
    if (e.key === 'ArrowLeft' && e.shiftKey) { $('prevSlide').click(); e.preventDefault(); }
  });

  /* ---------- reveal on scroll ---------- */
  if ('IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (es) { es.forEach(function (x) { if (x.isIntersecting) { x.target.classList.add('in'); io.unobserve(x.target); } }); }, { threshold: 0.12 });
    [].forEach.call(document.querySelectorAll('.reveal'), function (el) { io.observe(el); });
  } else { [].forEach.call(document.querySelectorAll('.reveal'), function (el) { el.classList.add('in'); }); }

  /* ---------- side TOC highlight ---------- */
  var secs = [].slice.call(document.querySelectorAll('section[id]'));
  var tocLinks = [].slice.call(document.querySelectorAll('#toc > a[href^="#"]'));
  window.addEventListener('scroll', function () {
    var y = window.scrollY + 120, id = secs[0] && secs[0].id;
    secs.forEach(function (s) { if (s.offsetTop <= y) id = s.id; });
    tocLinks.forEach(function (a) { a.classList.toggle('active', a.getAttribute('href') === '#' + id); });
  }, { passive: true });

  /* ---------- start: deep link #p3-s40 or #p3 ---------- */
  var m = /#p(\d+)(?:-s(\d+))?/.exec(location.hash);
  var pi = 0, t0 = 0;
  if (m) {
    pi = Math.min(parts.length, Math.max(1, +m[1])) - 1;
    if (m[2]) { var hit = parts[pi].slides.filter(function (s) { return s.n === +m[2]; })[0]; if (hit) t0 = hit.t + 0.05; }
  }
  cur = -1;
  load(pi, t0, false);
})();
