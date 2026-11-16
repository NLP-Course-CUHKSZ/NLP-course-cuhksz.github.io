# -*- coding: utf-8 -*-
"""Apply reviewed course terminology without retranslating the full catalogs."""
import json
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
I18N = ROOT / 'assets' / 'i18n'
overrides = json.loads((I18N / 'overrides.json').read_text(encoding='utf-8'))

for locale in ['zh-CN', 'es', 'fr', 'pt', 'ar', 'ru', 'hi', 'bn', 'ja']:
    path = I18N / (locale + '.json')
    catalog = json.loads(path.read_text(encoding='utf-8'))
    changed = 0
    for source, previous in list(catalog.items()):
        value = previous
        if locale == 'zh-CN':
            value = value.replace('法学硕士', '大模型').replace('法學碩士', '大模型')
            if re.search(r'\bagents?\b', source, re.I):
                value = re.sub('代理商|代理人|代理程序|代理|经纪人|经纪商|特工', '智能体', value)
                value = re.sub(r'(?<![\w-])agents?\b(?![.-])', '智能体', value, flags=re.I)
        # Model/runtime/project names are proper nouns, not animals or translated phrases.
        if re.fullmatch(r'(?:LLaMA(?:-Factory)?|Llama\s+\d+|llama\.cpp|Sheared LLaMA)', source, re.I):
            value = source
        if locale == 'zh-CN' and re.search(r'\bllama\b', source, re.I):
            spelling = re.search(r'\bllama\b', source, re.I).group()
            value = re.sub('美洲驼|羊驼|骆驼|拉玛|拉马', spelling, value)
        if locale == 'zh-CN' and source in ('Agent', 'Agents', 'agents', 'agent'):
            value = '智能体'
        if re.fullmatch(r'(?:AGENTS\.md|SWE-agent|R&D-Agent)', source):
            value = source
        if value != previous:
            catalog[source] = value
            overrides.setdefault(locale, {})[source] = value
            changed += 1
    path.write_text(json.dumps(catalog, ensure_ascii=False, indent=1) + '\n', encoding='utf-8')
    print(locale, changed)
(I18N / 'overrides.json').write_text(json.dumps(overrides, ensure_ascii=False, indent=1) + '\n', encoding='utf-8')

# Version shared assets so returning visitors receive the corrected UI immediately.
for path in ROOT.rglob('*.html'):
    text = path.read_bytes().decode('utf-8')
    text = re.sub(r'(js/course-language\.js)(?:\?[^"\s]*)?(?=")', r'\1?v=20261116-terms', text)
    text = re.sub(r'(css/course-language\.css)(?:\?[^"\s]*)?(?=")', r'\1?v=20261116-terms', text)
    path.write_bytes(text.encode('utf-8'))
