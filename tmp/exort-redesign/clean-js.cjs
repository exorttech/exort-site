const fs=require('fs');
let js=fs.readFileSync('tmp/exort-redesign/index.before.js','utf8');
js=js.replace('  const reducedMotionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");\n','').replace('  let reducedMotion = reducedMotionQuery.matches;\n','').replace('  let heroTypewriterTimer = 0;\n','').replace('  let heroTypewriterActive = false;\n','');
js=js.replace(/  function syncHeroTypewriterAccessibility\(\) \{[\s\S]*?(?=  function updateHeader)/,'');
js=js.replace(/  function initializeReveals\(\) \{[\s\S]*?(?=  function formatCounter)/,'');
js=js.replace(/  function animateCounter\(element\) \{[\s\S]*?(?=  function selectVenue)/,`  function updateCounters() {
    document.querySelectorAll('[data-count]').forEach((element) => {
      element.textContent = formatCounter(Number(element.dataset.count), element);
    });
  }

`);
js=js.replace(/      if \(heroTypewriterActive\) \{[\s\S]*?      \}\n/,'').replace('      finishHeroTypewriter();','      updateCounters();');
js=js.replace(/  reducedMotionQuery.addEventListener\?\.\("change", \(event\) => \{[\s\S]*?  \}\);\n/,'').replace('  initializeHeroTypewriter();\n','').replace('  initializeReveals();\n','').replace('  initializeProductAnimations();','  updateCounters();');
js=js.replace('    mobileNav.setAttribute("aria-hidden", String(!open));','    mobileNav.setAttribute("aria-hidden", String(!open));\n    mobileNav.inert = !open;');
js=js.replace('      node.nodeValue = token === translated ? source : source.replace(token, translated);','      node.nodeValue = token === translated ? source : source.replace(/\\S[\\s\\S]*\\S|\\S/, translated);');
const extra={
  'Ваше меню.':['Сіздің мәзіріңіз.','Your menu.','Sizin menünüz.'],
  'В характере':['Мекеменің','The character','İşletmenizin'],
  'заведения.':['стилінде.','of your venue.','karakterinde.'],
  '01 / Продукт':['01 / Өнім','01 / Product','01 / Ürün'],
  '02 / Управление':['02 / Басқару','02 / Management','02 / Yönetim'],
  '03 / Аналитика интереса':['03 / Қызығушылық аналитикасы','03 / Interest analytics','03 / İlgi analizi'],
  '04 / Подключение':['04 / Қосу','04 / Setup','04 / Kurulum'],
  '05 / Стоимость':['05 / Баға','05 / Pricing','05 / Fiyatlandırma'],
  'Посмотреть пример аналитики':['Аналитика мысалын көру','View example analytics','Örnek analizleri görün'],
  'Демонстрационные значения':['Демонстрациялық мәндер','Example values','Örnek değerler'],
  'Языки · Устройства':['Тілдер · Құрылғылар','Languages · Devices','Diller · Cihazlar'],
};
const complete={
 'Функции остаются одинаковыми. Годовой вариант снижает ежемесячную стоимость и даёт дополнительную скидку.':['Функциялар бірдей. Жылдық жоспар айлық құнын төмендетіп, қосымша жеңілдік береді.','The features are the same. The annual plan reduces the monthly cost and includes an additional discount.','Özellikler aynıdır. Yıllık seçenek aylık maliyeti düşürür ve ek indirim sağlar.'],
 'Годовой план оплачивается за 12 месяцев. Дополнительная скидка':['Жылдық жоспар 12 айға төленеді. Қосымша жеңілдік','The annual plan is paid for 12 months. The additional discount of','Yıllık plan 12 aylık olarak ödenir. Ek indirim'],
 'уже учтена в итоговой сумме.':['қорытынды сомаға енгізілген.','is already included in the total.','nihai tutara zaten dahil edilmiştir.'],
 'для ресторанов, кофеен, баров и гостиниц':['мейрамханалар, кофеханалар, барлар және қонақүйлер үшін','for restaurants, coffee shops, bars, and hotels','restoranlar, kafeler, barlar ve oteller için'],
 'Цифровое меню для гостей':['Қонақтарға арналған цифрлық мәзір','Digital menu for guests','Misafirler için dijital menü'],
 'Админ-панель и стоп-лист':['Админ-панель және стоп-лист','Admin panel and unavailable items','Yönetim paneli ve stok dışı listesi'],
 'Аналитика и QR-источники':['Аналитика және QR-дереккөздер','Analytics and QR sources','Analizler ve QR kaynakları'],
 'Exort · ПОДКЛЮЧЕНИЕ':['Exort · ҚОСУ','Exort · SETUP','Exort · KURULUM'],
 'Покажите гостю меню, которое соответствует вашему заведению.':['Қонаққа мекемеңізге сай мәзір көрсетіңіз.','Give your guests a menu that reflects your venue.','Misafirinize işletmenize yakışan bir menü gösterin.'],
 'Демонстрационный интерфейс. Все названия и значения вымышлены.':['Демо-интерфейс. Барлық атаулар мен мәндер ойдан шығарылған.','Demo interface. All names and values are fictional.','Demo arayüzü. Tüm adlar ve değerler kurgusaldır.'],
 'Все показатели и названия в блоке аналитики демонстрационные и не относятся к реальному клиенту.':['Аналитика бөліміндегі барлық көрсеткіштер мен атаулар демонстрациялық және нақты клиентке қатысы жоқ.','All figures and names in the analytics section are examples and do not relate to a real client.','Analiz bölümündeki tüm göstergeler ve adlar kurgusaldır; gerçek bir müşteriye ait değildir.'],
 'Все источники':['Барлық дереккөздер','All sources','Tüm kaynaklar'],
 'ДЕМО-ДАННЫЕ':['ДЕМО ДЕРЕКТЕР','DEMO DATA','DEMO VERİLERİ'],
 'DEMO-ДАННЫЕ · период 7 дней':['ДЕМО ДЕРЕКТЕР · 7 күн','DEMO DATA · 7-day period','DEMO VERİLERİ · 7 günlük dönem'],
 'Стоп-лист':['Стоп-лист','Unavailable items','Stok dışı listesi'],
 'Меню':['Мәзір','Menu','Menü'],
 'Меню для гостей':['Қонақтарға арналған мәзір','Guest menu','Misafir menüsü'],
 'Основное меню, сезонные предложения и стоп-лист без перепечатки.':['Негізгі мәзір, маусымдық ұсыныстар және қайта басусыз стоп-лист.','Main menu, seasonal specials, and unavailable items without reprints.','Ana menü, mevsimlik teklifler ve yeniden baskı gerektirmeyen stok dışı listesi.'],
 'Категории, фотографии, несколько языков и источники для залов или столов.':['Санаттар, фотосуреттер, бірнеше тіл және залдар не үстелдер үшін дереккөздер.','Categories, photos, multiple languages, and sources for dining areas or tables.','Kategoriler, fotoğraflar, birden fazla dil ve salonlar ya da masalar için kaynaklar.'],
 'Быстрое меню с акцентом на новинки, сезонные напитки и завтраки.':['Жаңалықтар, маусымдық сусындар және таңғы асқа арналған жылдам мәзір.','A quick menu highlighting new items, seasonal drinks, and breakfasts.','Yeni ürünleri, mevsimlik içecekleri ve kahvaltıları öne çıkaran hızlı bir menü.'],
 'Понятная мобильная подача и быстрые изменения цены или доступности.':['Түсінікті мобильді мәзір және баға не қолжетімділікті жылдам өзгерту.','A clear mobile experience with quick price and availability updates.','Anlaşılır mobil sunum ve fiyat ya da bulunabilirlikte hızlı değişiklikler.'],
 'Коктейльная карта, винная подборка и позиции, которые меняются вечером.':['Коктейль мәзірі, шарап таңдауы және кешке өзгеретін позициялар.','Cocktail menus, wine selections, and items that change in the evening.','Kokteyl menüsü, şarap seçkisi ve akşam değişen ürünler.'],
 'Фильтры, описания вкуса и оперативное управление стоп-листом.':['Сүзгілер, дәм сипаттамалары және стоп-листті жедел басқару.','Filters, tasting notes, and quick availability management.','Filtreler, lezzet açıklamaları ve stok dışı listesinin hızlı yönetimi.'],
 'Меню ресторана и завтраков плюс понятная информация для гостей.':['Мейрамхана мен таңғы ас мәзірі және қонақтарға түсінікті ақпарат.','Restaurant and breakfast menus with clear guest information.','Restoran ve kahvaltı menüsünün yanında misafirler için anlaşılır bilgiler.'],
 'Отдельные QR-коды для номеров, ресепшен, ресторана и других зон.':['Бөлмелер, ресепшен, мейрамхана және басқа аймақтар үшін бөлек QR-кодтар.','Separate QR codes for rooms, reception, the restaurant, and other areas.','Odalar, resepsiyon, restoran ve diğer alanlar için ayrı QR kodları.'],
 'QR по зонам':['Аймақтар бойынша QR','QR by area','Alanlara göre QR'],
 'Сезонное меню':['Маусымдық мәзір','Seasonal menu','Mevsimlik menü'],
 'Карточки напитков':['Сусын карточкалары','Drink cards','İçecek kartları'],
 'Автоперевод':['Автоаударма','Automatic translation','Otomatik çeviri'],
 'Instagram-ссылка':['Instagram сілтемесі','Instagram link','Instagram bağlantısı'],
 'Коктейльная карта':['Коктейль мәзірі','Cocktail menu','Kokteyl menüsü'],
 'Категории и фильтры':['Санаттар мен сүзгілер','Categories and filters','Kategoriler ve filtreler'],
 'Аналитика по времени':['Уақыт бойынша аналитика','Analytics over time','Zamana göre analiz'],
 'Меню ресторана':['Мейрамхана мәзірі','Restaurant menu','Restoran menüsü'],
 'Завтраки':['Таңғы ас','Breakfasts','Kahvaltılar'],
 'Информация для гостей':['Қонақтарға ақпарат','Guest information','Misafir bilgileri'],
 'QR по номерам и зонам':['Бөлмелер мен аймақтарға QR','QR by room and area','Odalara ve alanlara göre QR'],
 '01 · РЕСТОРАН':['01 · МЕЙРАМХАНА','01 · RESTAURANT','01 · RESTORAN'],
 '02 · КОФЕЙНЯ':['02 · КОФЕХАНА','02 · COFFEE SHOP','02 · KAFE'],
 '03 · БАР':['03 · БАР','03 · BAR','03 · BAR'],
 '04 · ГОСТИНИЦА':['04 · ҚОНАҚҮЙ','04 · HOTEL','04 · OTEL'],
};
const langAdd={kk:{},en:{},tr:{}};
for(const [key,values] of Object.entries({...extra,...complete})) ['kk','en','tr'].forEach((lang,i)=>langAdd[lang][key]=values[i]);
const insertion=Object.entries(langAdd).map(([lang,dict])=>`  Object.assign(LANGUAGE_COPY.${lang}, ${JSON.stringify(dict,null,2)});`).join('\n');
js=js.replace('  let currentLanguage = getStoredLanguage();',insertion+'\n\n  let currentLanguage = getStoredLanguage();');
fs.writeFileSync('js/index.js',js);
