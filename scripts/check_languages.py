"""Check route coverage, dictionary completeness, and translation asset paths."""
from pathlib import Path
from bs4 import BeautifulSoup
import json, subprocess, re
from collections import Counter
from build_translations import LANGS, sources

ROOT = Path(__file__).resolve().parents[1]
routes = subprocess.check_output(['git','ls-tree','-r','--name-only','HEAD'], cwd=ROOT, text=True).splitlines()
pages = [ROOT / p for p in routes if p.endswith('.html') and not p.startswith('tests/')]
assert len(pages) == 34, f'Review new HTML routes: {len(pages)}'
for p in pages:
    soup = BeautifulSoup(p.read_text(encoding='utf-8'), 'html.parser')
    original = BeautifulSoup(subprocess.check_output(['git','show','HEAD:'+p.relative_to(ROOT).as_posix()],cwd=ROOT,encoding='utf-8'), 'html.parser')
    assert Counter(a.get('href') for a in original.select('a[href]')) == Counter(a.get('href') for a in soup.select('a[href]')), f'Course link changed: {p}'
    assert [el.get_text() for el in original.select('pre,code')] == [el.get_text() for el in soup.select('pre,code')], f'Code changed: {p}'
    # Asset URLs carry a cache-busting query (?v=20261116-terms, added by fix_course_terms.py): compare paths only.
    path_of = lambda url: url.split('?', 1)[0].split('#', 1)[0]
    scripts = [el for el in soup.select('script[src]') if path_of(el['src']).endswith('/js/course-language.js')]
    styles = [el for el in soup.select('link[href]') if path_of(el['href']).endswith('/css/course-language.css')]
    assert len(scripts) == len(styles) == 1, f'Missing/duplicate language assets: {p}'
    for el, attr in [(scripts[0],'src'), (styles[0],'href')]:
        assert (p.parent / path_of(el[attr])).resolve().is_file(), f'Invalid nested asset path: {p}'
source = set(sources())
en = json.loads((ROOT/'assets/i18n/en.json').read_text(encoding='utf-8'))
for lang in LANGS:
    p = ROOT / 'assets/i18n' / (lang + '.json')
    catalog = json.loads(p.read_text(encoding='utf-8'))
    missing = {s for s in source if s not in catalog and en.get(s) not in catalog}
    assert not missing, f'{lang}: {len(missing)} missing strings: {list(missing)[:3]}'
    assert all(isinstance(v,str) and v.strip() for v in catalog.values()), lang
    assert catalog['Natural Language Processing'] != 'Natural Language Processing', lang
    for template in ['Slide {n} · {title}', 'Chapter {n} of {total} · {title}', 'Chapter {n} · slides {first}–{last}']:
        assert Counter(re.findall(r'\{\w+\}', template)) == Counter(re.findall(r'\{\w+\}', catalog[template])), f'Broken chapter template: {lang}'
    assert '2–3' in catalog['👥 teams of 2–3 (solo allowed)'], f'Changed team size: {lang}'
    assert '55%' in catalog['⚖ 55% of the course grade'], f'Changed grade weight: {lang}'
    print(f'{lang}: {len(source)} source strings covered')
chinese = {s for s in source if len(re.findall(r'[\u3400-\u9fff]',s)) > len(re.findall(r'[A-Za-z]',s))}
assert not chinese-en.keys(), 'Missing English translations for legacy Chinese pages'
print(f'PASS: {len(pages)} HTML pages; nine complete translation dictionaries plus English.')
