/* Lecture 10 video page: chapter switching with fades, "up next" toast, slide jumps, synced transcript, deep links. */
(function () {
  var VIDEO_BASE = window.L10_VIDEO_BASE || 'materials/videos/lecture10/';
  var POSTER_BASE = 'imgs/lecture10/';
  var parts = window.L10.parts;
  var video = document.getElementById('video');
  var stage = document.getElementById('stage');
  var cur = 0, curSlide = -1, curSent = -1, lang = 'both', showSlides = true;

  function fmt(t) { t = Math.max(0, Math.floor(t)); var m = Math.floor(t / 60), s = t % 60; return m + ':' + (s < 10 ? '0' : '') + s; }
  function $(id) { return document.getElementById(id); }
  function esc(s) { return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;'); }

  /* ---------- build static UI: the chapters panel next to the player, and the side TOC ---------- */
  var chList = $('chList'), tocParts = $('tocParts');
  parts.forEach(function (p, i) {
    var ch = document.createElement('div');
    ch.className = 'ch';
    var row = document.createElement('a');
    row.className = 'ch-row';
    row.href = '#p' + p.n;
    row.title = p.blurb;
    row.innerHTML = '<span class="th" style="background-image:url(' + POSTER_BASE + p.poster + ')"><span class="dur">' + fmt(p.duration) +
      '</span><span class="pb"></span></span><span class="tx"><span class="k">Chapter ' + p.n + ' &middot; slides ' + p.first + '&ndash;' + p.last +
      '</span><span class="t">' + esc(p.title) + '</span></span><span class="ch-tg" title="Show / hide the slides">&#9662;</span>';
    /* the chevron folds the slide list; clicking the playing chapter folds it too, any other chapter starts playing */
    row.onclick = function (e) {
      e.preventDefault();
      if (i === cur || e.target.classList.contains('ch-tg')) {
        var open = !ch.classList.contains('open');
        ch.classList.toggle('open', open);
        if (i === cur) showSlides = open;
      } else load(i, 0, true);
    };
    ch.appendChild(row);
    var sl = document.createElement('div');
    sl.className = 'ch-slides';
    p.slides.forEach(function (s) {
      var a = document.createElement('a');
      a.href = '#p' + p.n + '-s' + s.n;
      a.title = s.title;
      a.innerHTML = '<span class="t2">' + fmt(s.t) + '</span><span class="ti">' + s.n + ' &middot; ' + esc(s.title) + '</span>';
      a.onclick = function (e) { e.preventDefault(); load(i, s.t + 0.05, true); };
      sl.appendChild(a);
    });
    ch.appendChild(sl);
    chList.appendChild(ch);

    if (tocParts) {
      var a = document.createElement('a');
      a.href = '#p' + p.n;
      a.className = 'sub part-link';
      a.innerHTML = p.n + '&nbsp; ' + esc(p.title.replace(/:.*$/, '')) + '<span class="pbar"><i></i></span>';
      a.onclick = function (e) { e.preventDefault(); load(i, 0, true); scrollToPlayer(); };
      tocParts.appendChild(a);
    }
  });

  function scrollToPlayer() { $('watch').scrollIntoView({ behavior: 'smooth', block: 'start' }); }
  /* keep an element visible inside the chapters list without moving the page */
  function keepInList(el) {
    if (!el || !el.offsetParent || chList.matches(':hover')) return;
    var top = el.offsetTop, bot = top + el.offsetHeight;
    if (top < chList.scrollTop + 8 || bot > chList.scrollTop + chList.clientHeight - 8) chList.scrollTop = top - chList.clientHeight / 3;
  }

  /* ---------- transcript of the current chapter ---------- */
  function buildLists(p) {
    var tr = $('transcript');
    tr.innerHTML = '';
    var last = -1;
    p.sents.forEach(function (x) {
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
    [].forEach.call(chList.children, function (c, k) { c.classList.toggle('active', k === cur); c.classList.toggle('open', k === cur && showSlides); });
    var ch = chList.children[cur];
    if (ch) chList.scrollTop = ch.offsetTop - 6;
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
      $('nowPart').textContent = 'Chapter ' + p.n + ' of ' + parts.length + ' · ' + p.title;
      var sl = chList.children[cur].querySelector('.ch-slides');
      [].forEach.call(sl.children, function (a, k) { a.classList.toggle('cur', k === si); });
      if (!force) keepInList(sl.children[si]);
      history.replaceState(null, '', '#p' + p.n + '-s' + s.n);
    }
    var ni = -1;
    for (var j = 0; j < p.sents.length; j++) if (t >= p.sents[j][0] - 0.1 && t <= p.sents[j][1] + 0.3) { ni = j; break; }
    if (ni !== -1 && ni !== curSent) {
      curSent = ni;
      var ps = $('transcript').querySelectorAll('p');
      [].forEach.call(ps, function (x, k) { x.classList.toggle('cur', k === ni); });
      var box = $('transcript'), el2 = ps[ni];
      if (el2 && box.offsetParent !== null && !box.matches(':hover')) box.scrollTop = el2.offsetTop - box.offsetTop - box.clientHeight / 3;
    }
    if (video.duration) {
      var w = (100 * t / video.duration) + '%';
      var pb = chList.children[cur].querySelector('.pb');
      if (pb) pb.style.width = w;
      var bar = tocParts && tocParts.children[cur] && tocParts.children[cur].querySelector('.pbar i');
      if (bar) bar.style.width = w;
    }
  }
  video.addEventListener('timeupdate', function () { updateNow(false); });

  /* ---------- "up next": a small corner toast in the last seconds, then a cross-fade into the next part ---------- */
  var toast = $('upNext'), autoNext = true, LEAD_IN = 12;
  function hideCard() { toast.classList.remove('show'); }
  function fillToast() {
    if (cur >= parts.length - 1) {
      toast.innerHTML = '<div class="un-k">Lecture 10 complete</div><div class="un-t">Thank you for watching!</div>' +
        '<div class="un-row"><button class="un-btn" id="unAgain">&#8634; Watch again</button><a class="un-btn" href="#tutorials">Try the notebooks &rarr;</a></div>';
      $('unAgain').onclick = function () { load(0, 0, true); };
      return;
    }
    var n = parts[cur + 1];
    toast.innerHTML = '<button class="un-x" id="unX" title="Don\'t play the next part">&times;</button>' +
      '<div class="un-k">Up next &middot; Chapter ' + n.n + '</div><div class="un-t">' + esc(n.title) + '</div>' +
      '<div class="un-bar"><i id="unBar"></i></div><div class="un-row"><button class="un-btn" id="unPlay">&#9654; Play now</button></div>';
    $('unPlay').onclick = function () { load(cur + 1, 0, true); };
    $('unX').onclick = function () { autoNext = false; toast.classList.remove('show'); };
  }
  video.addEventListener('timeupdate', function () {
    if (!video.duration || cur >= parts.length - 1 || !autoNext) return;
    var left = video.duration - video.currentTime;
    if (left <= LEAD_IN && !video.paused) {
      if (!toast.classList.contains('show')) { fillToast(); toast.classList.add('show'); }
      var bar = $('unBar');
      if (bar) bar.style.width = Math.min(100, 100 * (1 - left / LEAD_IN)) + '%';
    } else if (left > LEAD_IN + 1) {
      toast.classList.remove('show');
    }
  });
  video.addEventListener('ended', function () {
    if (cur >= parts.length - 1) { fillToast(); toast.classList.add('show'); return; }
    if (autoNext) load(cur + 1, 0, true);
  });
  video.addEventListener('play', function () { if (video.duration - video.currentTime > LEAD_IN) toast.classList.remove('show'); });
  video.addEventListener('seeking', function () { autoNext = true; });

  /* ---------- jump from the lecture map / concept index ---------- */
  window.L10go = function (partNo, slideNo) {
    var i = partNo - 1, p = parts[i];
    var s = slideNo ? p.slides.filter(function (x) { return x.n === slideNo; })[0] : null;
    load(i, s ? s.t + 0.05 : 0, true);
    scrollToPlayer();
    return false;
  };
  [].forEach.call(document.querySelectorAll('[data-go]'), function (a) {
    var m2 = /^(\d+)(?:-(\d+))?$/.exec(a.getAttribute('data-go'));
    if (!m2) return;
    a.href = '#p' + m2[1] + (m2[2] ? '-s' + m2[2] : '');
    a.onclick = function (e) { e.preventDefault(); window.L10go(+m2[1], m2[2] ? +m2[2] : 0); };
  });

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
