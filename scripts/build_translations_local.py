"""Offline fallback using NLLB-200 distilled 600M converted to CTranslate2 int8.

Usage: python scripts/build_translations_local.py --model PATH [--packages PATH]
Requires ctranslate2, transformers and sentencepiece. Model reference:
https://huggingface.co/JustFrederik/nllb-200-distilled-600M-ct2-int8
"""
import argparse, json, re, sys, time
from build_translations import OUT, sources, curated_chinese, native_english

args = argparse.ArgumentParser()
args.add_argument('--model', required=True)
args.add_argument('--packages')
args.add_argument('--use-vmap', action='store_true', help='Use a prepared CTranslate2 vmap.txt for this course vocabulary')
options = args.parse_args()
if options.packages: sys.path.insert(0, options.packages)
import ctranslate2
from transformers import AutoTokenizer

LANGS = {'en':'eng_Latn','zh-CN':'zho_Hans','es':'spa_Latn','hi':'hin_Deva','ar':'arb_Arab','fr':'fra_Latn','pt':'por_Latn','ru':'rus_Cyrl','bn':'ben_Beng','ja':'jpn_Jpan'}
strings = sources()
(OUT/'source.json').write_text(json.dumps(strings,ensure_ascii=False,indent=1)+'\n',encoding='utf-8')
catalogs = {lang:json.loads((OUT/(lang+'.json')).read_text(encoding='utf-8')) if (OUT/(lang+'.json')).exists() else {} for lang in LANGS}
catalogs['zh-CN'].update(curated_chinese())
aliases=native_english()
catalogs['en'].update(aliases)
overrides=json.loads((OUT/'overrides.json').read_text(encoding='utf-8')) if (OUT/'overrides.json').exists() else {}
for lang,catalog in catalogs.items(): catalog.update(overrides.get(lang,{}))
tokenizers = {src:AutoTokenizer.from_pretrained(options.model,local_files_only=True,src_lang=src) for src in ['eng_Latn','zho_Hans']}
translator = ctranslate2.Translator(options.model,device='cpu',compute_type='int8',inter_threads=1,intra_threads=6)

def save():
    overrides=json.loads((OUT/'overrides.json').read_text(encoding='utf-8')) if (OUT/'overrides.json').exists() else {}
    for lang,catalog in catalogs.items():
        catalog.update(overrides.get(lang,{}))
        path=OUT/(lang+'.json'); tmp=path.with_suffix('.tmp')
        tmp.write_text(json.dumps(catalog,ensure_ascii=False,sort_keys=True,indent=1)+'\n',encoding='utf-8');tmp.replace(path)

jobs=[]
for text in strings:
    src='zho_Hans' if len(re.findall(r'[\u3400-\u9fff]',text))>len(re.findall(r'[A-Za-z]',text)) else 'eng_Latn'
    tokens=tokenizers[src].convert_ids_to_tokens(tokenizers[src].encode(text))
    for lang in LANGS:
        if lang=='en' and src=='eng_Latn': continue
        if lang!='en' and text in aliases: continue
        if text not in catalogs[lang]:
            if src==LANGS[lang]: catalogs[lang][text]=text
            else: jobs.append((len(tokens),lang,text,tokens))
jobs.sort(key=lambda j:j[0])
print(f'Offline translation: {len(jobs)} missing strings; {sum(j[0] for j in jobs)} input tokens',flush=True)
save(); start=time.time()
for offset in range(0,len(jobs),64):
    batch=jobs[offset:offset+64]
    limit=min(768,max(48,max(j[0] for j in batch)*3))
    results=translator.translate_batch([j[3] for j in batch],target_prefix=[[LANGS[j[1]]] for j in batch],beam_size=1,max_decoding_length=limit,max_input_length=1024,max_batch_size=64,repetition_penalty=1.1,no_repeat_ngram_size=4,use_vmap=options.use_vmap)
    for (token_count,lang,text,source_tokens),result in zip(batch,results):
        output=tokenizers['eng_Latn'].decode(tokenizers['eng_Latn'].convert_tokens_to_ids(result.hypotheses[0][1:]),skip_special_tokens=True).strip()
        if not output:
            if len(re.findall(r'[^\W\d_]',text)) <= 2 or re.fullmatch(r'[A-Za-z0-9_.+/-]{1,40}',text) or re.fullmatch(r'(?:[A-Z] )+[A-Z]',text): output=text
            else:
                retry=translator.translate_batch([source_tokens],target_prefix=[[LANGS[lang]]],beam_size=3,min_decoding_length=2,max_decoding_length=limit)
                output=tokenizers['eng_Latn'].decode(tokenizers['eng_Latn'].convert_tokens_to_ids(retry[0].hypotheses[0][1:]),skip_special_tokens=True).strip()
                if not output: raise RuntimeError('Empty translation: '+lang+' '+text[:80])
        catalogs[lang][text]=output
    if offset%512==0 or offset+64>=len(jobs):
        save()
        print(f'Offline: {min(offset+64,len(jobs))}/{len(jobs)} in {round(time.time()-start)}s',flush=True)
print('All local translations complete.',flush=True)
