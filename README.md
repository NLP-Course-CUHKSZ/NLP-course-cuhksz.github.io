# CSC5051/MDS5110 Natural Language Processing

## Website languages

All 34 HTML entry points share `js/course-language.js` and
`css/course-language.css`. English is the default, independent of browser locale.
The top-right selector supports English, Simplified Chinese, Spanish, Hindi,
Arabic, French, Portuguese, Russian, Bengali and Japanese. `?lang=xx` overrides
the saved preference; internal HTML links preserve the choice, query parameters
and fragment. Arabic uses right-to-left page layout.

Translations are checked-in JSON dictionaries under `assets/i18n/` and are
loaded from this site only. Visitors do not contact a translation service.
Non-English text is marked as machine translation; the Chinese project-guide
dictionary also reuses unambiguous text pairs from the existing authored guide.
Existing bilingual campus UI text is reused through the English dictionary,
so equivalent Chinese and English labels share the same translations.
Code, mathematics, video/audio, slide images, downloadable PDFs/notebooks and
the lecture player's separately controlled English/Chinese transcript remain
in their original formats. Names and contact links are preserved.

To update dictionaries after editing course content, install Python
`beautifulsoup4` and run `python scripts/build_translations.py`. This development
script sends public source text to Google's translation endpoint, caches each
completed batch and retries failed requests. It is not needed to build or serve
the website. Review translations of deadlines and assessment policy before
publishing. If that endpoint becomes unavailable, existing dictionaries continue
working and can be edited directly.

An offline alternative is `scripts/build_translations_local.py --model PATH`,
using CTranslate2 int8 and the NLLB-200 distilled 600M model. It fills only missing
entries and also supplies English translations for legacy Chinese text.
Dependencies: `ctranslate2`, `transformers`, `sentencepiece`, `beautifulsoup4`.
Model: https://huggingface.co/JustFrederik/nllb-200-distilled-600M-ct2-int8
The model is distributed under CC-BY-NC-4.0 and is used here for educational
course translations. The dictionaries combine Google Translate, NLLB and
existing authored bilingual text; contextual corrections live in
`assets/i18n/overrides.json`.

For changes to dynamically generated controls, first run
`node scripts/extract_dynamic_strings.cjs` with the `acorn` Node package available,
then rebuild translations. The static page corpus, chapter/slide titles and
dynamic UI literals are included; uncatalogued new strings fall back to English.

Validation: `python scripts/check_languages.py`,
`node --check js/course-language.js`, and `node --check js/fp-search.js`.

## University branding and visitor statistics

The home-page signature is the official CUHK-Shenzhen logo, sourced from
https://www.cuhk.edu.cn/sites/default/files/zh-hans_logo.png and stored locally
as `assets/cuhk-shenzhen-logo.png`.

`js/course-visitors.js` and `css/course-visitors.css` are included on all 34
public HTML pages. They share Flag Counter ID `Ctel` (server `s05`), with a
world map on the homepage and a compact visible counter on subpages. Public
visitor totals and country details: https://info.flagcounter.com/Ctel .
Exactly one counter image is loaded per page, only on the production hostname;
local previews and language changes do not create additional counter requests.

Collection began November 16, 2026, including initial setup/verification visits.
There is no historical backfill. The provider deduplicates repeat visits within
24 hours; page views count image/page loads. Country/region estimates use IP
geolocation, not nationality or precise location. Images may lag about five
minutes; blockers and caching can affect counts. This is a free anonymous
counter, without an account or paid plan. The provider may expire counters
inactive for 30 days. Provider documentation: https://flagcounter.com/faq.html .
The visible map links to its statistics; its privacy link is displayed below.
The new interface labels are localized directly in the shared script for all
ten course languages, without reloading the counter image on language changes.
