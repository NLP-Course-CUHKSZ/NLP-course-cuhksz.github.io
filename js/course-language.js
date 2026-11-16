/* Shared, local-file localization for every course HTML page. */
(function () {
  'use strict';
  const languages = {en:'English', 'zh-CN':'简体中文', es:'Español', hi:'हिन्दी', ar:'العربية', fr:'Français', pt:'Português', ru:'Русский', bn:'বাংলা', ja:'日本語'};
  const storageKey = 'nlp-course-language';
  const script = document.currentScript;
  const root = new URL('../', script.src);
  const url = new URL(location.href);
  const normalize = s => s.replace(/\s+/g, ' ').trim();
  const valid = s => s === 'zh' ? 'zh-CN' : Object.hasOwn(languages, s) ? s : null;
  let saved;
  try { saved = localStorage.getItem(storageKey); } catch (_) { /* Private mode. */ }
  let requestedLanguage = valid(url.searchParams.get('lang')) || valid(saved) || 'en';
  let language = 'en';
  let catalog = {}, generation = 0, observer, timer;
  const originals = new WeakMap();
  const attributes = new WeakMap();
  const excluded = 'script,style,pre,code,kbd,samp,textarea,svg,math,canvas,.math,.MathJax,.katex,mjx-container,[translate="no"],.notranslate,#transcript,.subtitles';
  const cache = new Map();
  // Project-page initialization reads this before its DOMContentLoaded handler.
  window.CourseLanguage = {get language() { return language; }, set: setLanguage};

  const panel = document.createElement('div');
  panel.id = 'course-language';
  panel.className = 'notranslate';
  panel.setAttribute('translate', 'no');
  const label = document.createElement('label');
  label.htmlFor = 'course-language-select';
  label.textContent = '🌐';
  const select = document.createElement('select');
  select.id = 'course-language-select';
  select.setAttribute('aria-label', 'Language / 语言');
  Object.entries(languages).forEach(([code, name]) => {
    const option = document.createElement('option');
    option.value = code; option.lang = code; option.textContent = name;
    select.append(option);
  });
  select.value = requestedLanguage;
  const status = document.createElement('span');
  status.className = 'course-language-status';
  status.setAttribute('role', 'status');
  const retry = document.createElement('button');
  retry.type = 'button'; retry.textContent = 'Retry'; retry.hidden = true;
  retry.addEventListener('click', () => setLanguage(requestedLanguage));
  panel.append(label, select, status, retry);
  select.addEventListener('change', () => setLanguage(select.value));

  function translated(source) {
    const key = normalize(source), english = cache.get('en') || {};
    const canonical = Object.hasOwn(english,key) ? english[key] : key;
    function format(template, values) {
      return (catalog[template] || template).replace(/\{(\w+)\}/g, (token,name) => values[name] ?? token);
    }
    let match;
    if ((match = /^(🎥 )?(\d+) chapters · (\d+) min$/.exec(canonical))) return (match[1] || '') + format('{chapters} chapters · {minutes} min', {chapters:match[2],minutes:match[3]});
    if ((match = /^(\d+) days? (\d+) h left$/.exec(canonical))) return format('{days} days {hours} h left', {days:match[1],hours:match[2]});
    if ((match = /^(\d+) h left$/.exec(canonical))) return format('{hours} h left', {hours:match[1]});
    if ((match = /^Slide (\d+) · (.+)$/.exec(canonical))) return format('Slide {n} · {title}', {n:match[1],title:translated(match[2])});
    if ((match = /^Chapter (\d+) of (\d+) · (.+)$/.exec(canonical))) return format('Chapter {n} of {total} · {title}', {n:match[1],total:match[2],title:translated(match[3])});
    if ((match = /^Chapter (\d+) · slides (\d+)–(\d+)$/.exec(canonical))) return format('Chapter {n} · slides {first}–{last}', {n:match[1],first:match[2],last:match[3]});
    if ((match = /^(\d+)( · | )(.+)$/.exec(canonical)) && Object.hasOwn(catalog,match[3])) return match[1]+match[2]+translated(match[3]);
    if (Object.hasOwn(catalog,canonical)) return catalog[canonical];
    if (Object.hasOwn(catalog,key)) return catalog[key];
    return canonical !== key ? canonical : source;
  }
  function replaceText(node) {
    const parent = node.parentElement;
    if (!parent || parent.closest(excluded) || !node.nodeValue.trim()) return;
    const old = originals.get(node);
    // A chapter change or another page control may replace a previously translated label.
    const source = old && old.output === node.nodeValue ? old.source : node.nodeValue;
    const value = translated(source);
    const result = value === source ? source : (source.match(/^\s*/)[0] + value + source.match(/\s*$/)[0]);
    if (node.nodeValue !== result) node.nodeValue = result;
    originals.set(node, {source, output: result});
  }
  function rewriteLink(a) {
    if (a.hasAttribute('download') || a.getAttribute('href').startsWith('#')) return;
    let target;
    try { target = new URL(a.href, location.href); } catch (_) { return; }
    if (target.origin !== location.origin || !(/\.html?$|\/$/.test(target.pathname))) return;
    target.searchParams.set('lang', language);
    if (a.href !== target.href) a.href = target.href;
  }
  function render() {
    if (observer) observer.disconnect();
    const walker = document.createTreeWalker(document.documentElement, NodeFilter.SHOW_TEXT);
    let node;
    while ((node = walker.nextNode())) replaceText(node);
    document.querySelectorAll('[title],[placeholder],[aria-label],img[alt]').forEach(el => {
      if (el.closest(excluded)) return;
      let records = attributes.get(el) || {};
      ['title','placeholder','aria-label','alt'].forEach(name => {
        if (!el.hasAttribute(name)) return;
        const now = el.getAttribute(name), old = records[name];
        const source = old && old.output === now ? old.source : now;
        const output = translated(source);
        if (now !== output) el.setAttribute(name, output);
        records[name] = {source, output};
      });
      attributes.set(el, records);
    });
    document.querySelectorAll('a[href]').forEach(rewriteLink);
    document.documentElement.lang = language;
    document.documentElement.dir = language === 'ar' ? 'rtl' : 'ltr';
    document.documentElement.dataset.courseLanguage = language;
    if (observer) observer.observe(document.body, {subtree:true, childList:true, characterData:true});
  }
  async function setLanguage(next) {
    next = valid(next) || 'en';
    const ticket = ++generation;
    requestedLanguage = next;
    select.value = next;
    retry.hidden = true;
    status.textContent = next === 'en' ? '' : 'Loading translation…';
    try {
      if (!cache.has('en')) {
        const base = await fetch(new URL('assets/i18n/en.json', root));
        if (!base.ok) throw new Error('English translations ' + base.status);
        cache.set('en', await base.json());
      }
      if (!cache.has(next)) {
        const response = await fetch(new URL('assets/i18n/' + next + '.json', root));
        if (!response.ok) throw new Error('Translation ' + response.status);
        cache.set(next, await response.json());
      }
      if (ticket !== generation) return;
      language = next;
      catalog = cache.get(next);
      render();
      try { localStorage.setItem(storageKey, next); } catch (_) { /* Links still persist the choice. */ }
      const target = new URL(location.href);
      target.searchParams.set('lang', next);
      history.replaceState(null, '', target.pathname + target.search + target.hash);
      status.textContent = next === 'en' ? '' : (catalog['Machine translation'] || 'Machine translation');
      document.dispatchEvent(new CustomEvent('course-language-change', {detail:{language:next}}));
    } catch (error) {
      if (ticket !== generation) return;
      // Restore readable English rather than showing a stale language under a new label.
      language = 'en'; catalog = {}; render();
      status.textContent = 'Translation unavailable. Try again.';
      retry.hidden = false;
    }
  }
  function initialize() {
    document.body.classList.add('has-course-language');
    const topbar = document.querySelector('.topbar');
    if (topbar) { topbar.append(panel); topbar.classList.add('course-topbar'); }
    else document.body.prepend(panel);
    // These are separately controlled bilingual lecture transcripts, not page prose.
    document.querySelectorAll('#transcript,pre,code,kbd,samp,math').forEach(el => el.setAttribute('translate','no'));
    document.querySelectorAll('.instructor a,.ta-team .text-center > b').forEach(el => el.setAttribute('translate','no'));
    observer = new MutationObserver(records => {
      if (records.every(r => (r.target.nodeType === 1 ? r.target : r.target.parentElement)?.closest(excluded))) return;
      if (!timer) timer = setTimeout(() => { timer = null; render(); }, 100);
    });
    setLanguage(requestedLanguage);
    // Include the preference in internal HTML links, preserving hashes and other query parameters.
    document.addEventListener('click', event => {
      if (event.target.closest('#bLang')) {
        event.preventDefault(); event.stopImmediatePropagation();
        setLanguage(language === 'zh-CN' ? 'en' : 'zh-CN'); return;
      }
      const a = event.target.closest('a[href]');
      if (a) rewriteLink(a);
    }, true);
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', initialize);
  else initialize();
}());
