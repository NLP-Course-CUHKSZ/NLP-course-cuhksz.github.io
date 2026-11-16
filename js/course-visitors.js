/* One shared, visible counter per page. Local previews never send visits. */
(function () {
  'use strict';
  const root = new URL('../', document.currentScript.src);
  const home = location.pathname === root.pathname || location.pathname === root.pathname + 'index.html';
  const labels = {
    en: ['Visitors around the world', 'Visitor totals & country details', 'Since November 16, 2026 · Approximate location by IP. Visits are deduplicated within 24 hours; page views count page loads.'],
    'zh-CN': ['来自世界各地的访客', '查看访客人数与国家／地区详情', '自 2026 年 11 月 16 日起统计 · 按 IP 估算来源。访客在 24 小时内去重；浏览量按页面加载次数计算。'],
    es: ['Visitantes de todo el mundo', 'Total de visitantes y países', 'Desde el 16 de noviembre de 2026 · Ubicación aproximada por IP. Las visitas se deduplican durante 24 horas; las páginas vistas cuentan cada carga.'],
    hi: ['दुनिया भर से आगंतुक', 'आगंतुक संख्या और देशों का विवरण', '16 नवंबर 2026 से · IP से अनुमानित स्थान। आगंतुक 24 घंटे में एक बार गिने जाते हैं; पृष्ठ दृश्य हर लोड पर गिने जाते हैं।'],
    ar: ['زوار من حول العالم', 'إجمالي الزوار وتفاصيل البلدان', 'منذ 16 نوفمبر 2026 · موقع تقريبي بحسب IP. يُحتسب الزائر مرة واحدة خلال 24 ساعة؛ وتُحتسب مشاهدة عند كل تحميل للصفحة.'],
    fr: ['Visiteurs du monde entier', 'Nombre de visiteurs et pays', 'Depuis le 16 novembre 2026 · Localisation approximative par IP. Les visites sont dédupliquées sur 24 heures ; les pages vues comptent chaque chargement.'],
    pt: ['Visitantes de todo o mundo', 'Total de visitantes e países', 'Desde 16 de novembro de 2026 · Localização aproximada por IP. As visitas são deduplicadas em 24 horas; as visualizações contam cada carregamento.'],
    ru: ['Посетители со всего мира', 'Число посетителей и страны', 'С 16 ноября 2026 года · Примерное местоположение по IP. Повторные визиты исключаются в течение 24 часов; просмотры учитывают каждую загрузку страницы.'],
    bn: ['বিশ্বজুড়ে দর্শক', 'দর্শকসংখ্যা ও দেশের বিবরণ', '১৬ নভেম্বর ২০২৬ থেকে · IP অনুযায়ী আনুমানিক অবস্থান। ২৪ ঘণ্টায় একই দর্শক একবার গণনা করা হয়; প্রতিটি পৃষ্ঠা লোডে একটি ভিউ গণনা হয়।'],
    ja: ['世界各地からの訪問者', '訪問者数と国・地域の詳細', '2026年11月16日から集計 · IPによる推定位置。訪問者は24時間以内の重複を除外し、ページビューは読み込みごとに集計します。']
  };
  function mount() {
    if (document.getElementById('course-visitors')) return;
    const section = document.createElement('section');
    section.id = 'course-visitors';
    section.className = home ? 'course-visitors-map' : 'course-visitors-mini';
    section.setAttribute('translate', 'no');
    const heading = document.createElement(home ? 'h2' : 'span');
    const link = document.createElement('a');
    link.href = 'https://info.flagcounter.com/Ctel';
    link.target = '_blank'; link.rel = 'noopener noreferrer';
    const imageLink = link.cloneNode();
    const img = document.createElement('img');
    img.alt = 'Flag Counter'; img.style.border = '0';
    const note = document.createElement('p');
    const credit = document.createElement('a');
    credit.href = 'https://flagcounter.com/privacy.html';
    credit.textContent = 'Flag Counter · Privacy';
    credit.target = '_blank'; credit.rel = 'noopener noreferrer';
    section.append(heading, imageLink, link);
    if (home) section.append(note, credit);
    document.body.append(section);
    function localize(language) {
      const text = labels[language] || labels.en;
      section.lang = language || 'en';
      section.dir = language === 'ar' ? 'rtl' : 'ltr';
      heading.textContent = text[0]; link.textContent = text[1]; note.textContent = text[2];
    }
    localize(window.CourseLanguage ? window.CourseLanguage.language : 'en');
    document.addEventListener('course-language-change', event => localize(event.detail.language));
    if (location.hostname === 'nlp-course-cuhksz.github.io') {
      img.src = home
        ? 'https://s05.flagcounter.com/map/Ctel/size_l/txt_333333/border_DDDDDD/pageviews_1/viewers_0/flags_0/'
        : 'https://s05.flagcounter.com/mini/Ctel/bg_FFFFFF/txt_333333/border_DDDDDD/flags_0/';
      imageLink.append(img);
    }
    // Full-screen campus experiences need an unobtrusive visible counter.
    if (!home && getComputedStyle(document.body).overflowY === 'hidden') section.classList.add('course-visitors-overlay');
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', mount);
  else mount();
}());
