const root = document.documentElement;
const header = document.querySelector("[data-header]");
const themeToggle = document.querySelector("[data-theme-toggle]");
const stopToggle = document.querySelector("[data-stop-toggle]");
const stopRow = document.querySelector("[data-stop-row]");
const stopLabel = document.querySelector("[data-stop-label]");
const backToTop = document.querySelector("[data-back-to-top]");
const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const themeStorageKey = "exort_theme";
const languageStorageKey = "exort_language";
const translations = {
  ru: { navHome: "Главная", navDemo: "Демо", navFeatures: "Возможности", navPricing: "Тарифы", navContacts: "Контакты", launchMenu: "Запустить меню", openDemoMenu: "Открыть демо-меню", discussLaunch: "Обсудить запуск", heroTitle: "Цифровое меню без хаоса", heroText: "Блюда, цены, фото, стоп-лист, языки и аналитика — в одной системе для ресторана.", flowTitle: "QR → меню → изменение → обновление для гостя", featuresTitle: "Четыре рабочих слоя системы", analyticsTitle: "Понимайте интерес гостей", analyticsText: "Смотрите, какие блюда открывают чаще, когда гости изучают меню и что стоит выделить.", launchTitle: "От текущего меню до QR и домена", pricingTitle: "Система меню для ресторана, а не разовый лендинг", finalTitle: "Меню должно обновляться быстрее, чем гости успевают спросить официанта." },
  kk: { navHome: "Басты бет", navDemo: "Демо", navFeatures: "Мүмкіндіктер", navPricing: "Тарифтер", navContacts: "Байланыс", launchMenu: "Мәзірді іске қосу", openDemoMenu: "Демо мәзірді ашу", discussLaunch: "Іске қосуды талқылау", heroTitle: "Артық қиындықсыз цифрлық мәзір", heroText: "Тағамдар, бағалар, фотосуреттер, стоп-лист, тілдер және аналитика — мейрамханаға арналған бір жүйеде.", flowTitle: "QR → мәзір → өзгеріс → қонаққа жаңарту", featuresTitle: "Жүйенің төрт жұмыс қабаты", analyticsTitle: "Қонақтардың қызығушылығын түсініңіз", analyticsText: "Қай тағамдар жиі ашылатынын, қонақтар мәзірді қашан қарайтынын және нені ерекшелеу керектігін көріңіз.", launchTitle: "Қазіргі мәзірден QR және доменге дейін", pricingTitle: "Бір реттік лендинг емес, мейрамханаға арналған мәзір жүйесі", finalTitle: "Мәзір қонақ даяшыдан сұрап үлгергенше жаңаруы керек." },
  en: { navHome: "Home", navDemo: "Demo", navFeatures: "Features", navPricing: "Pricing", navContacts: "Contacts", launchMenu: "Launch menu", openDemoMenu: "Open demo menu", discussLaunch: "Discuss launch", heroTitle: "A digital menu without the chaos", heroText: "Dishes, prices, photos, stop lists, languages and analytics in one restaurant system.", flowTitle: "QR → menu → change → instant guest update", featuresTitle: "Four working layers of the system", analyticsTitle: "Understand guest interest", analyticsText: "See which dishes guests open most, when they explore the menu, and what deserves attention.", launchTitle: "From your current menu to QR and domain", pricingTitle: "A restaurant menu system, not a one-off landing page", finalTitle: "Your menu should update before guests need to ask a waiter." },
};

const staticTranslations = {
  "Демо": { ru: "Демо", kk: "Демо", en: "Demo" },
  "Exort для ресторанов": { ru: "Exort для ресторанов", kk: "Мейрамханаларға арналған Exort", en: "Exort for restaurants" },
  "QR-меню": { ru: "QR-меню", kk: "QR-мәзір", en: "QR menu" },
  "Стоп-лист": { ru: "Стоп-лист", kk: "Стоп-лист", en: "Stop list" },
  "Меню синхронизировано": { ru: "Меню синхронизировано", kk: "Мәзір синхрондалды", en: "Menu synchronized" },
  "Product flow": { ru: "Путь продукта", kk: "Өнімнің жұмыс барысы", en: "Product flow" },
  "Гость сканирует QR": { ru: "Гость сканирует QR", kk: "Қонақ QR кодын сканерлейді", en: "Guest scans the QR code" },
  "Меню открывается без приложения.": { ru: "Меню открывается без приложения.", kk: "Мәзір қолданбасыз ашылады.", en: "The menu opens without an app." },
  "Ресторан меняет данные": { ru: "Ресторан меняет данные", kk: "Мейрамхана деректерді өзгертеді", en: "The restaurant updates details" },
  "Цена, фото, описание или стоп-лист.": { ru: "Цена, фото, описание или стоп-лист.", kk: "Баға, фото, сипаттама немесе стоп-лист.", en: "Price, photo, description or stop list." },
  "Система публикует": { ru: "Система публикует", kk: "Жүйе жариялайды", en: "The system publishes" },
  "Изменение уходит в живую страницу.": { ru: "Изменение уходит в живую страницу.", kk: "Өзгеріс бірден белсенді бетке шығады.", en: "The change appears on the live page." },
  "Гость видит актуальное": { ru: "Гость видит актуальное", kk: "Қонақ өзекті ақпаратты көреді", en: "The guest sees current information" },
  "Без PDF, печати и ручных правок.": { ru: "Без PDF, печати и ручных правок.", kk: "PDF, баспа және қолмен түзетусіз.", en: "No PDFs, printing or manual edits." },
  "Обычно": { ru: "Обычно", kk: "Әдеттегі мәзір", en: "Traditional menu" },
  "Меню быстро устаревает": { ru: "Меню быстро устаревает", kk: "Мәзір тез ескіреді", en: "Menus quickly become outdated" },
  "Печать": { ru: "Печать", kk: "Баспа", en: "Print" },
  "Данные": { ru: "Данные", kk: "Деректер", en: "Data" },
  "Нужно пересобирать файл после правок": { ru: "Нужно пересобирать файл после правок", kk: "Әр түзетуден кейін файлды қайта жинау керек", en: "The file must be rebuilt after every edit" },
  "Каждая версия стоит времени и денег": { ru: "Каждая версия стоит времени и денег", kk: "Әр нұсқа уақыт пен қаражатты талап етеді", en: "Every version costs time and money" },
  "Гости спрашивают то, чего уже нет": { ru: "Гости спрашивают то, чего уже нет", kk: "Қонақтар сатылымда жоқ тағамды сұрайды", en: "Guests ask for dishes that are no longer available" },
  "Нет поиска, языков и аналитики": { ru: "Нет поиска, языков и аналитики", kk: "Іздеу, тілдер және аналитика жоқ", en: "No search, languages or analytics" },
  "С Exort": { ru: "С Exort", kk: "Exort-пен", en: "With Exort" },
  "Меню работает как продукт": { ru: "Меню работает как продукт", kk: "Мәзір өнім сияқты жұмыс істейді", en: "The menu works like a product" },
  "Изменения публикуются за секунды": { ru: "Изменения публикуются за секунды", kk: "Өзгерістер бірнеше секундта жарияланады", en: "Changes go live in seconds" },
  "Гость всегда открывает актуальную версию": { ru: "Гость всегда открывает актуальную версию", kk: "Қонақ әрқашан өзекті нұсқаны ашады", en: "Guests always open the latest version" },
  "Недоступное скрывается одним действием": { ru: "Недоступное скрывается одним действием", kk: "Қолжетімсіз тағам бір әрекетпен жасырылады", en: "Unavailable dishes are hidden in one action" },
  "Видно, что смотрят чаще": { ru: "Видно, что смотрят чаще", kk: "Нені жиі қарайтыны көрінеді", en: "See what guests view most" },
  "Возможности": { ru: "Возможности", kk: "Мүмкіндіктер", en: "Features" },
  "Управление меню": { ru: "Управление меню", kk: "Мәзірді басқару", en: "Menu management" },
  "Категории, блюда и цены в одном контуре": { ru: "Категории, блюда и цены в одном контуре", kk: "Санаттар, тағамдар және бағалар бір жүйеде", en: "Categories, dishes and prices in one place" },
  "Команда ресторана обновляет структуру меню без разработчика и без пересборки страницы.": { ru: "Команда ресторана обновляет структуру меню без разработчика и без пересборки страницы.", kk: "Мейрамхана командасы мәзір құрылымын әзірлеушісіз және бетті қайта жасамай жаңартады.", en: "The restaurant team updates the menu structure without a developer or rebuilding the page." },
  "Блюдо": { ru: "Блюдо", kk: "Тағам", en: "Dish" },
  "Цена": { ru: "Цена", kk: "Баға", en: "Price" },
  "Отключайте позиции до того, как гость спросит": { ru: "Отключайте позиции до того, как гость спросит", kk: "Қонақ сұрамай тұрып тағамды тоқтатыңыз", en: "Disable dishes before a guest asks" },
  "Языки": { ru: "Языки", kk: "Тілдер", en: "Languages" },
  "RU / KZ / EN в одной системе": { ru: "RU / KZ / EN в одной системе", kk: "RU / KZ / EN бір жүйеде", en: "RU / KZ / EN in one system" },
  "Аналитика": { ru: "Аналитика", kk: "Аналитика", en: "Analytics" },
  "Просмотры меню": { ru: "Просмотры меню", kk: "Мәзір қаралымдары", en: "Menu views" },
  "+18% за месяц": { ru: "+18% за месяц", kk: "Айына +18%", en: "+18% this month" },
  "Открытия блюд": { ru: "Открытия блюд", kk: "Тағам карточкасын ашу", en: "Dish opens" },
  "39% гостей": { ru: "39% гостей", kk: "Қонақтардың 39%-ы", en: "39% of guests" },
  "Пиковое время": { ru: "Пиковое время", kk: "Ең белсенді уақыт", en: "Peak time" },
  "пятница и суббота": { ru: "пятница и суббота", kk: "жұма және сенбі", en: "Friday and Saturday" },
  "Активность гостей": { ru: "Активность гостей", kk: "Қонақтар белсенділігі", en: "Guest activity" },
  "Последние 7 дней": { ru: "Последние 7 дней", kk: "Соңғы 7 күн", en: "Last 7 days" },
  "Пн": { ru: "Пн", kk: "Дс", en: "Mon" }, "Вт": { ru: "Вт", kk: "Сс", en: "Tue" }, "Ср": { ru: "Ср", kk: "Ср", en: "Wed" }, "Чт": { ru: "Чт", kk: "Бс", en: "Thu" }, "Пт": { ru: "Пт", kk: "Жм", en: "Fri" }, "Сб": { ru: "Сб", kk: "Сб", en: "Sat" }, "Вс": { ru: "Вс", kk: "Жс", en: "Sun" },
  "Популярные блюда": { ru: "Популярные блюда", kk: "Танымал тағамдар", en: "Popular dishes" },
  "Просмотры": { ru: "Просмотры", kk: "Қаралымдар", en: "Views" },
  "Integrations ready": { ru: "Готово к интеграциям", kk: "Интеграцияларға дайын", en: "Integrations ready" },
  "Архитектура готовится к будущим интеграциям": { ru: "Архитектура готовится к будущим интеграциям", kk: "Архитектура болашақ интеграцияларға дайындалады", en: "Architecture ready for future integrations" },
  "Exort проектируется так, чтобы дальше подключать r_keeper, iiko, delivery-сценарии и future API без смены продуктовой логики.": { ru: "Exort проектируется так, чтобы дальше подключать r_keeper, iiko, delivery-сценарии и future API без смены продуктовой логики.", kk: "Exort өнім логикасын өзгертпей, r_keeper, iiko, жеткізу сценарийлері және болашақ API-ларды қосуға дайындалады.", en: "Exort is designed to connect r_keeper, iiko, delivery workflows and future APIs without changing the product logic." },
  "Запуск": { ru: "Запуск", kk: "Іске қосу", en: "Launch" },
  "Получаем текущее меню": { ru: "Получаем текущее меню", kk: "Қазіргі мәзірді аламыз", en: "Collect the current menu" },
  "Собираем позиции, цены, языки и фотографии.": { ru: "Собираем позиции, цены, языки и фотографии.", kk: "Тағамдарды, бағаларды, тілдерді және фотоларды жинаймыз.", en: "We collect dishes, prices, languages and photos." },
  "Собираем структуру": { ru: "Собираем структуру", kk: "Құрылымды жасаймыз", en: "Build the structure" },
  "Переводим меню в управляемую цифровую модель.": { ru: "Переводим меню в управляемую цифровую модель.", kk: "Мәзірді басқарылатын цифрлық үлгіге ауыстырамыз.", en: "We turn the menu into a manageable digital model." },
  "Подключаем систему": { ru: "Подключаем систему", kk: "Жүйені қосамыз", en: "Connect the system" },
  "Ресторан получает рабочий процесс обновления меню.": { ru: "Ресторан получает рабочий процесс обновления меню.", kk: "Мейрамхана мәзірді жаңартудың дайын процесін алады.", en: "The restaurant gets a complete menu update workflow." },
  "Запускаем QR и домен": { ru: "Запускаем QR и домен", kk: "QR мен доменді іске қосамыз", en: "Launch QR and domain" },
  "Гости открывают меню с телефона и видят актуальные данные.": { ru: "Гости открывают меню с телефона и видят актуальные данные.", kk: "Қонақтар мәзірді телефоннан ашып, өзекті ақпаратты көреді.", en: "Guests open the menu on their phone and see current information." },
  "Запуск под ключ": { ru: "Запуск под ключ", kk: "Толық іске қосу", en: "Turnkey launch" },
  "QR-меню, система управления, стоп-лист, мультиязычность, базовая аналитика и подключение домена.": { ru: "QR-меню, система управления, стоп-лист, мультиязычность, базовая аналитика и подключение домена.", kk: "QR-мәзір, басқару жүйесі, стоп-лист, көптілділік, негізгі аналитика және доменді қосу.", en: "QR menu, management system, stop list, multilingual support, basic analytics and domain connection." },
  "Старт": { ru: "Старт", kk: "Бастау", en: "Start" },
  "/ месяц": { ru: "/ месяц", kk: "/ ай", en: "/ month" },
  "Next step": { ru: "Следующий шаг", kk: "Келесі қадам", en: "Next step" },
};

const attributeTranslations = {
  "Навигация": { ru: "Навигация", kk: "Навигация", en: "Navigation" },
  "Выбор языка": { ru: "Выбор языка", kk: "Тілді таңдау", en: "Choose language" },
  "Сменить тему": { ru: "Сменить тему", kk: "Тақырыпты ауыстыру", en: "Change theme" },
  "Ключевые сигналы продукта": { ru: "Ключевые сигналы продукта", kk: "Өнімнің негізгі мүмкіндіктері", en: "Key product capabilities" },
  "Продуктовый интерфейс Exort": { ru: "Продуктовый интерфейс Exort", kk: "Exort өнім интерфейсі", en: "Exort product interface" },
  "Скриншот административной панели Exort": { ru: "Скриншот административной панели Exort", kk: "Exort әкімшілік панелінің скриншоты", en: "Exort administrative panel screenshot" },
  "Административная панель Exort с блюдами ресторана": { ru: "Административная панель Exort с блюдами ресторана", kk: "Мейрамхана тағамдары бар Exort әкімшілік панелі", en: "Exort administrative panel with restaurant dishes" },
  "Скриншот QR-меню": { ru: "Скриншот QR-меню", kk: "QR-мәзір скриншоты", en: "QR menu screenshot" },
  "Скриншот демо-страницы QR-меню Exort": { ru: "Скриншот демо-страницы QR-меню Exort", kk: "Exort QR-мәзір демо бетінің скриншоты", en: "Exort QR menu demo screenshot" },
  "Будущие интеграции": { ru: "Будущие интеграции", kk: "Болашақ интеграциялар", en: "Future integrations" },
  "Наверх": { ru: "Наверх", kk: "Жоғарыға", en: "Back to top" },
};

const originalText = new WeakMap();
const originalAttributes = new WeakMap();
const metadataTranslations = {
  ru: {
    title: "Exort — QR-меню и система управления для ресторанов",
    description: "Exort помогает ресторанам управлять меню, ценами, стоп-листом, языками и аналитикой из одной системы.",
  },
  kk: {
    title: "Exort — мейрамханаларға арналған QR-мәзір және басқару жүйесі",
    description: "Exort мейрамханаларға мәзірді, бағаларды, стоп-листті, тілдерді және аналитиканы бір жүйеден басқаруға көмектеседі.",
  },
  en: {
    title: "Exort — QR menu and management system for restaurants",
    description: "Exort helps restaurants manage menus, prices, stop lists, languages and analytics from one system.",
  },
};

function translateStaticContent(language) {
  const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
  let node;
  while ((node = walker.nextNode())) {
    if (!node.parentElement || node.parentElement.closest("script, style, [data-i18n]")) continue;
    const source = originalText.get(node) ?? node.nodeValue.trim().replace(/\s+/g, " ");
    if (!source) continue;
    if (!originalText.has(node)) originalText.set(node, source);
    const value = staticTranslations[source]?.[language];
    if (value) {
      const leading = node.nodeValue.match(/^\s*/)?.[0] || "";
      const trailing = node.nodeValue.match(/\s*$/)?.[0] || "";
      node.nodeValue = `${leading}${value}${trailing}`;
    }
  }

  document.querySelectorAll("[aria-label], img[alt]").forEach((node) => {
    ["aria-label", "alt"].forEach((attribute) => {
      if (!node.hasAttribute(attribute)) return;
      let stored = originalAttributes.get(node);
      if (!stored) {
        stored = {};
        originalAttributes.set(node, stored);
      }
      const source = stored[attribute] ?? node.getAttribute(attribute);
      stored[attribute] = source;
      const value = attributeTranslations[source]?.[language];
      if (value) node.setAttribute(attribute, value);
    });
  });
}

function getSavedTheme() {
  try {
    const savedTheme = localStorage.getItem(themeStorageKey);

    if (savedTheme === "dark" || savedTheme === "light") {
      return savedTheme;
    }
  } catch (error) {
    // localStorage may be blocked. Light theme remains the default.
  }

  return "light";
}

function applyTheme(theme, shouldPersist = true) {
  const nextTheme = theme === "dark" ? "dark" : "light";
  const isDark = nextTheme === "dark";

  root.dataset.theme = nextTheme;
  themeToggle?.setAttribute("aria-pressed", String(isDark));

  document.querySelector('meta[name="theme-color"]')?.setAttribute(
    "content",
    isDark ? "#07111F" : "#EAF2FF"
  );

  if (shouldPersist) {
    try {
      localStorage.setItem(themeStorageKey, nextTheme);
    } catch (error) {
      // Theme persistence is progressive enhancement.
    }
  }
}

function applyLanguage(language) {
  const nextLanguage = translations[language] ? language : "ru";
  root.lang = nextLanguage;
  document.body?.classList.toggle("lang-kz", nextLanguage === "kk");
  document.querySelectorAll("[data-language]").forEach(button => button.classList.toggle("is-active", button.dataset.language === nextLanguage));
  document.querySelectorAll("[data-i18n]").forEach(node => {
    const value = translations[nextLanguage][node.dataset.i18n];
    if (value) node.textContent = value;
  });
  translateStaticContent(nextLanguage);
  document.title = metadataTranslations[nextLanguage].title;
  document.querySelector('meta[name="description"]')?.setAttribute("content", metadataTranslations[nextLanguage].description);
  localStorage.setItem(languageStorageKey, nextLanguage);
}

function updateHeader() {
  header?.classList.toggle("is-scrolled", window.scrollY > 12);
  backToTop?.classList.toggle("is-visible", window.scrollY > 520);
}

function toggleStopState() {
  if (!stopToggle || !stopRow || !stopLabel) {
    return;
  }

  const isActive = stopToggle.classList.toggle("is-on");
  stopRow.classList.toggle("is-stop", !isActive);
  stopRow.classList.toggle("is-live", isActive);
  stopLabel.textContent = isActive ? "active" : "stop";
}

themeToggle?.addEventListener("click", () => {
  applyTheme(root.dataset.theme === "dark" ? "light" : "dark");
});
document.querySelectorAll("[data-language]").forEach(button => button.addEventListener("click", () => applyLanguage(button.dataset.language)));

stopToggle?.addEventListener("click", toggleStopState);
backToTop?.addEventListener("click", () => window.scrollTo({ top: 0, behavior: reducedMotion ? "auto" : "smooth" }));
window.addEventListener("scroll", updateHeader, { passive: true });

if (reducedMotion) {
  document.querySelectorAll(".reveal").forEach((element) => {
    element.classList.add("is-visible");
  });
} else {
  const revealObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) {
          return;
        }

        entry.target.classList.add("is-visible");
        revealObserver.unobserve(entry.target);
      });
    },
    {
      threshold: 0.16,
      rootMargin: "0px 0px -60px",
    }
  );

  document.querySelectorAll(".reveal").forEach((element, index) => {
    element.style.setProperty("--delay", `${Math.min(index % 6, 5) * 70}ms`);
    revealObserver.observe(element);
  });
}

applyTheme(getSavedTheme(), false);
applyLanguage(localStorage.getItem(languageStorageKey) || root.lang || "ru");
updateHeader();
