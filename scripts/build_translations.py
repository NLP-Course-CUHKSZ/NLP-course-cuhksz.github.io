"""Build checked-in machine translations; visitors never call a translation API.

Run with Python + beautifulsoup4. Existing entries are cached; reruns only add
new source strings. Review translations before publishing course policy changes.
"""
from pathlib import Path
from bs4 import BeautifulSoup, Comment
from concurrent.futures import ThreadPoolExecutor, as_completed
import json, re, time, urllib.request, urllib.parse, urllib.error

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / 'assets/i18n'
LANGS = ['zh-CN', 'es', 'hi', 'ar', 'fr', 'pt', 'ru', 'bn', 'ja']
SKIP = ['script', 'style', 'pre', 'code', 'svg', 'math', 'textarea']
def norm(s): return ' '.join(s.split())
def meaningful(s): return bool(re.search(r'[^\W\d_]', s, re.UNICODE)) and not re.match(r'^(https?://|\S+@\S+)', s)

def dynamic_strings():
    path = OUT / 'dynamic-source.json'
    if not path.exists(): return set()
    result = set()
    for raw in json.loads(path.read_text(encoding='utf-8')):
        parts = BeautifulSoup(raw, 'html.parser').stripped_strings if '<' in raw and '>' in raw else [raw]
        for text in parts:
            text = norm(text)
            if not text or len(text)>2500 or re.match(r'^(https?://|[.#/]|rgba?\(|[A-Za-z_-]+:)', text): continue
            if any(c in text for c in ['{','}',';','=>','\\']): continue
            if not re.search(r'[a-zA-Z\u3400-\u9fff]',text): continue
            if ' ' in text or re.search(r'[\u3400-\u9fff]',text) or re.match(r'^[A-Z][a-z]+$',text): result.add(text)
    return result

def curated_chinese():
    """Reuse unambiguous text-node pairs from the existing authored Chinese guide."""
    raw = (ROOT/'js/fp-zh.js').read_text(encoding='utf-8')
    zh = json.loads(raw[raw.index('{'):].strip().rstrip(';'))
    soup = BeautifulSoup((ROOT/'final-project.html').read_text(encoding='utf-8'), 'html.parser')
    pairs = {}
    for el in soup.select('[data-i18n]'):
        key = el['data-i18n']
        if key not in zh: continue
        en_nodes = [norm(s) for s in el.stripped_strings]
        zh_nodes = [norm(s) for s in BeautifulSoup(zh[key], 'html.parser').stripped_strings]
        if len(en_nodes) != len(zh_nodes): continue
        for en, translated in zip(en_nodes, zh_nodes):
            if meaningful(en) and translated: pairs.setdefault(en,set()).add(translated)
    return {en:next(iter(values)) for en,values in pairs.items() if len(values)==1}

def native_english():
    path = OUT / 'bilingual-source.json'
    if not path.exists(): return {}
    pairs={}
    for zh,en in json.loads(path.read_text(encoding='utf-8')):
        left=[norm(s) for s in BeautifulSoup(zh,'html.parser').stripped_strings]
        right=[norm(s) for s in BeautifulSoup(en,'html.parser').stripped_strings]
        if len(left)!=len(right): continue
        for a,b in zip(left,right):
            if a and b and a!=b: pairs.setdefault(a,set()).add(b)
    return {a:next(iter(values)) for a,values in pairs.items() if len(values)==1}

def sources():
    strings = set()
    for path in sorted(ROOT.rglob('*.html')):
        if '.git' in path.parts or 'tests' in path.relative_to(ROOT).parts: continue
        soup = BeautifulSoup(path.read_text(encoding='utf-8'), 'html.parser')
        for t in soup.find_all(string=True):
            if isinstance(t, Comment) or t.find_parent(SKIP): continue
            if t.find_parent(attrs={'translate': 'no'}): continue
            s = norm(t)
            if meaningful(s): strings.add(s)
        for el in soup.find_all():
            for attr in ['title', 'placeholder', 'aria-label', 'alt']:
                s = norm(el.get(attr, ''))
                if meaningful(s): strings.add(s)
    # Chapter titles and summaries are inserted into lecture pages at runtime.
    for path in (ROOT / 'js').glob('lecture*-data.js'):
        raw = path.read_text(encoding='utf-8')
        data = json.loads(raw[raw.index('{'):].rstrip().rstrip(';'))
        for p in data.get('parts', []):
            strings.update(norm(p[k]) for k in ['title', 'blurb'] if p.get(k))
            strings.add(norm(p['title'].split(':')[0]))
            for slide in p.get('slides', []):
                title = norm(slide['title'])
                strings.add(title)
    strings.update(['Slide {n} · {title}', 'Chapter {n} of {total} · {title}', 'Chapter {n} · slides {first}–{last}'])
    strings.update(f'{i} of 79 briefs shown' for i in range(80))
    strings.update(['expand all', 'collapse all', 'Show / hide the slides', 'Thank you for watching!', '↺ Watch again', 'Try the notebooks →', 'Model inference optimization, multilingual models'])
    strings.update(['Language', 'Machine translation', 'Loading translation…', 'Translation unavailable. Try again.', 'English original', 'Retry', 'Back to the course page'])
    strings.update(dynamic_strings())
    strings.update(native_english().values())
    return sorted(strings)

def request(items, lang):
    query = urllib.parse.urlencode({'client': 'gtx', 'sl': 'auto', 'tl': lang, 'dt': 't', 'q': '\n'.join(items)})
    req = urllib.request.Request('https://translate.googleapis.com/translate_a/single?' + query, headers={'User-Agent':'Mozilla/5.0'})
    for attempt in range(5):
        try:
            with urllib.request.urlopen(req, timeout=45) as r: data = json.load(r)
            result = ''.join(x[0] or '' for x in data[0]).strip().split('\n')
            if len(result) == len(items) and all(x.strip() for x in result): return dict(zip(items, map(str.strip, result)))
            if len(items) == 1: return {items[0]: ' '.join(result)}
            break
        except Exception as error:
            if isinstance(error, urllib.error.HTTPError) and error.code == 429:
                raise RuntimeError('Translation rate limit reached. Resume later or use build_translations_local.py.') from error
            if attempt == 4: raise
            time.sleep(2 ** attempt)
    half = len(items)//2
    return request(items[:half], lang) | request(items[half:], lang)

def build(lang, strings):
    path = OUT / (lang + '.json')
    catalog = json.loads(path.read_text(encoding='utf-8')) if path.exists() else {}
    missing = [s for s in strings if s not in catalog]
    batches, batch, size = [], [], 0
    for s in missing:
        # Keep encoded GET URLs safely below common proxy limits.
        n = len(urllib.parse.quote(s)) + 3
        if batch and size + n > 5500:
            batches.append(batch); batch, size = [], 0
        batch.append(s); size += n
    if batch: batches.append(batch)
    with ThreadPoolExecutor(max_workers=2) as workers:
        jobs = [workers.submit(request, batch, lang) for batch in batches]
        for i, job in enumerate(as_completed(jobs)):
            try: catalog.update(job.result())
            except Exception:
                for pending in jobs: pending.cancel()
                raise
            temp = path.with_suffix('.tmp')
            temp.write_text(json.dumps(catalog, ensure_ascii=False, sort_keys=True, indent=1)+'\n', encoding='utf-8')
            temp.replace(path)
            if i % 10 == 0 or i == len(batches)-1: print(f'{lang}: {i+1}/{len(batches)} batches; {len(catalog)}/{len(strings)} strings', flush=True)
    if lang == 'zh-CN':
        catalog.update(curated_chinese())
    overrides = OUT / 'overrides.json'
    if overrides.exists(): catalog.update(json.loads(overrides.read_text(encoding='utf-8')).get(lang,{}))
    path.write_text(json.dumps(catalog, ensure_ascii=False, sort_keys=True, indent=1)+'\n', encoding='utf-8')
    return lang, len(catalog)

if __name__ == '__main__':
    OUT.mkdir(parents=True, exist_ok=True)
    strings = sources()
    (OUT / 'source.json').write_text(json.dumps(strings, ensure_ascii=False, indent=1)+'\n', encoding='utf-8')
    print(f'Source: {len(strings)} strings, {sum(map(len, strings))} characters', flush=True)
    with ThreadPoolExecutor(max_workers=1) as pool:
        jobs = [pool.submit(build, lang, strings) for lang in LANGS]
        for job in as_completed(jobs): print('Complete:', job.result(), flush=True)
