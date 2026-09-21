const fs = require('fs');
const old = fs.readFileSync('tmp/exort-redesign/index.before.html','utf8');
const take = (a,b) => old.slice(old.indexOf(a),old.indexOf(b,old.indexOf(a)));
let head = old.slice(0,old.indexOf('  <body>')).replace('#f2efe8','#13261f').replace('index.css?v=1','index.css?v=4').replace('index.js?v=3','index.js?v=4');
let venues=take('          <div class="venue-tabs','      <section class="process-section');
venues=venues.slice(0,venues.lastIndexOf('        </div>'));
let analytics=take('          <div class="analytics-dashboard','          <p class="demo-note');
let process=take('          <ol class="process-list','      <section class="pricing-section');
process=process.slice(0,process.lastIndexOf('        </div>'));
let prices=take('          <article class="price-card','      <section class="final-section');
prices=prices.slice(0,prices.lastIndexOf('        </div>'));
const features=take('            <ul class="feature-lines">','            <a class="button button--ink"');
const notes=[...old.matchAll(/<article><i>(0[1-6])<\/i><strong>(.*?)<\/strong><span>(.*?)<\/span><\/article>/g)].map(m=>`<li><span class="row-number">${m[1]}</span><div><h3>${m[2]}</h3><p>${m[3]}</p></div></li>`).join('\n');
fs.writeFileSync('index.html',head+`  <body>
    <a class="skip-link" href="#content">Перейти к содержанию</a>
    <header class="site-header" data-header>
      <div class="header-inner shell">
        <a class="wordmark" href="#top" aria-label="Exort, наверх"><img src="./assets/exort-logo.png" width="1214" height="429" alt="Exort" /></a>
        <nav class="desktop-nav" aria-label="Основная навигация"><a href="#product">Продукт</a><a href="#management">Управление</a><a href="#analytics">Аналитика</a><a href="#pricing">Стоимость</a></nav>
        <div class="header-actions">
          <div class="language-switcher" data-language-switcher aria-label="Выбор языка"><button type="button" data-language="kk" aria-pressed="false">KZ</button><button type="button" class="is-active" data-language="ru" aria-pressed="true">RU</button><button type="button" data-language="en" aria-pressed="false">EN</button><button type="button" data-language="tr" aria-pressed="false">TR</button></div>
          <a class="header-demo" href="/demo-menu?restaurant=exort-demo">Открыть демо <span aria-hidden="true">↗</span></a>
          <button class="menu-toggle" type="button" data-menu-toggle aria-expanded="false" aria-controls="mobile-navigation"><span aria-hidden="true">☰</span><b>Меню</b></button>
        </div>
      </div>
      <nav class="mobile-nav" id="mobile-navigation" data-mobile-nav aria-label="Мобильная навигация" aria-hidden="true" inert><a href="#product">Продукт</a><a href="#management">Управление</a><a href="#analytics">Аналитика</a><a href="#sources">QR-коды</a><a href="#pricing">Стоимость</a><a href="/demo-menu?restaurant=exort-demo">Демо-меню</a></nav>
    </header>
    <main id="content">
      <section class="hero shell" id="top">
        <div class="hero-copy">
          <p class="eyebrow">Цифровое меню для заведений</p>
          <h1><span>Ваше меню.</span><br><span>В характере</span><br><em>заведения.</em></h1>
          <p class="hero-lead">Exort создаёт цифровое меню под стиль заведения и даёт владельцу админ-панель, аналитику и отдельные QR-коды для разных точек входа.</p>
          <div class="hero-actions"><a class="button button--orange" href="/demo-menu?restaurant=exort-demo">Посмотреть демо-меню <span aria-hidden="true">↗</span></a><a class="inline-link" href="#pricing">Обсудить подключение <span aria-hidden="true">→</span></a></div>
          <div class="hero-foot"><span>Без приложения</span><span>KZ · RU · EN · TR</span><a href="#management">Как управляется меню <span aria-hidden="true">↓</span></a></div>
        </div>
        <figure class="hero-product">
          <div class="product-caption"><span>Меню для гостя</span><span>EXORT / DEMO</span></div>
          <a class="menu-preview" href="/demo-menu?restaurant=exort-demo" aria-label="Открыть живое демо"><img src="./assets/menu-demo-preview.jpeg" width="738" height="1600" alt="Демонстрационное мобильное меню Exort" fetchpriority="high" /></a>
          <figcaption><span>Стиль заведения</span><a href="/demo-menu?restaurant=exort-demo">Открыть живое демо <span aria-hidden="true">↗</span></a></figcaption>
        </figure>
      </section>
      <section class="product-section section" id="product">
        <div class="shell">
          <div class="section-heading"><p class="eyebrow">01 / Продукт</p><h2><span>Красиво для гостя.</span><br><span>Понятно для владельца.</span></h2><p>Гость быстро находит нужное. Команда заведения обновляет меню и видит интерес аудитории в одном рабочем пространстве.</p></div>
          <div class="guest-layout"><div class="guest-intro"><h3>Меню для гостя</h3><p>Дизайн адаптируется под характер ресторана, кофейни, бара или гостиницы. Структура остаётся быстрой и понятной на любом телефоне.</p><p class="guest-note">Без установки приложения и без тяжёлого PDF.</p><a class="inline-link" href="/demo-menu?restaurant=exort-demo">Открыть живое демо <span aria-hidden="true">↗</span></a></div>${features}</div>
        </div>
      </section>
      <section class="management-section section" id="management"><div class="shell">
        <div class="section-heading"><p class="eyebrow">02 / Управление</p><h2>Меню меняется тогда, когда это нужно заведению.</h2><p>Команда управляет содержанием самостоятельно и сразу видит результат на гостевой странице.</p></div>
        <figure class="admin-preview"><div class="preview-bar"><span>Админ-панель владельца</span><span>EXORT / DEMO</span></div><img src="./assets/admin-demo-preview.png" width="1902" height="920" alt="Админ-панель Exort для управления блюдами и стоп-листом" loading="lazy" /><figcaption>Демонстрационный интерфейс. Все названия и значения вымышлены.</figcaption></figure>
        <ol class="management-list">${notes}</ol>
      </div></section>
      <section class="analytics-section section" id="analytics"><div class="shell">
        <div class="section-heading"><p class="eyebrow">03 / Аналитика интереса</p><h2>Владелец видит интерес</h2><p>Exort показывает открытия меню, вовлечение, интерес к позициям и источники переходов. Это не данные о заказах или выручке.</p></div>
        <div class="analytics-topics"><div><span>01</span><h3>Популярные блюда</h3><p>Интерес к позициям</p></div><div><span>02</span><h3>Когда изучают меню</h3><p>Дни и часы</p></div><div><span>03</span><h3>Главный источник</h3><p>Языки · Устройства</p></div></div>
        <details class="analytics-example"><summary><span>Посмотреть пример аналитики</span><span class="details-plus" aria-hidden="true">+</span></summary><p class="demo-note">Все показатели и названия в блоке аналитики демонстрационные и не относятся к реальному клиенту.</p>${analytics}</details>
        <div class="sources-layout" id="sources"><div><p class="eyebrow">QR-коды и источники</p><h2>Каждая точка входа получает своё имя.</h2><p>Один дизайн меню, разные QR-коды и ссылки. В аналитике видно, откуда открывали меню: из зала, Instagram, номера гостиницы или зоны ресепшен.</p><p class="source-clarification">Источники показывают переходы и вовлечение, а не покупки или выручку.</p></div><div class="source-register"><div class="register-head"><span>Источники меню</span><span>7 активных</span></div><ul class="source-tags" aria-label="Примеры источников"><li>Главный зал</li><li>Столы</li><li>Летняя терраса</li><li>Instagram</li><li>Гостиничные номера</li><li>Ресепшен</li><li>Вход</li></ul><details><summary>Демонстрационные значения</summary><dl class="source-values"><div><dt>Главный зал</dt><dd>326 <span>сессий</span></dd></div><div><dt>Instagram</dt><dd>94 <span>сессии</span></dd></div><div><dt>Гостиница</dt><dd>61 <span>сессия</span></dd></div><div><dt>Летняя терраса</dt><dd>48 <span>сессий</span></dd></div></dl><p class="demo-note">DEMO-ДАННЫЕ · период 7 дней</p></details></div></div>
      </div></section>
      <section class="venues-section section" id="venues"><div class="shell"><div class="section-heading"><p class="eyebrow">Для разных форматов</p><h2>Продукт один. Сценарий зависит от заведения.</h2></div>${venues}</div></section>
      <section class="process-section section" id="process"><div class="shell"><div class="section-heading"><p class="eyebrow">04 / Подключение</p><h2>От вашего меню до запуска — четыре понятных шага.</h2></div>${process}</div></section>
      <section class="pricing-section section" id="pricing"><div class="shell"><div class="section-heading"><p class="eyebrow">05 / Стоимость</p><h2>Один продукт. Два способа оплаты.</h2><p>Функции остаются одинаковыми. Годовой вариант снижает ежемесячную стоимость и даёт дополнительную скидку.</p></div>${prices}</div></section>
      <section class="final-section section" id="next-step"><div class="shell final-inner"><p class="eyebrow">Следующий шаг</p><h2>Покажите гостю меню, которое соответствует вашему заведению.</h2><div class="final-bottom"><p>Посмотрите гостевое меню. Возможности админ-панели показаны выше — доступ к ней получает только владелец после подключения.</p><a class="button button--orange" href="/demo-menu?restaurant=exort-demo">Посмотреть демо-меню <span aria-hidden="true">↗</span></a></div></div></section>
    </main>
    <footer class="site-footer"><div class="shell"><div class="footer-top"><a class="wordmark" href="#top" aria-label="Exort, наверх"><img src="./assets/exort-logo.png" width="1214" height="429" alt="Exort" loading="lazy" /></a><p>Цифровое меню как продукт заведения.</p><nav aria-label="Ссылки в подвале"><a href="/demo-menu?restaurant=exort-demo">Демо-меню</a><a href="#pricing">Стоимость</a></nav></div><div class="footer-bottom"><small>© Exort. Все данные на странице продукта демонстрационные.</small><span>Цифровое меню · Управление · Аналитика · QR-источники</span></div></div></footer>
  </body>
</html>` .replaceAll(' reveal','').replaceAll('button--coral','button--orange'));
