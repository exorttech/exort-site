const root = document.documentElement;
const header = document.querySelector("[data-header]");
const stopToggle = document.querySelector("[data-stop-toggle]");
const stopRow = document.querySelector("[data-stop-row]");
const stopLabel = document.querySelector("[data-stop-label]");
const backToTop = document.querySelector("[data-back-to-top]");
const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const languageStorageKey = "exort_language";
const translations = {
  ru: { navHome: "Главная", navDemo: "Демо", navFeatures: "Возможности", navPricing: "Тарифы", navContacts: "Контакты", launchMenu: "Запустить меню", openDemoMenu: "Открыть демо-меню", discussLaunch: "Обсудить запуск", heroTitle: "Цифровое меню без хаоса", heroText: "Блюда, цены, фото, стоп-лист, языки и аналитика — в одной системе для ресторана.", flowTitle: "QR → меню → изменение → обновление для гостя", featuresTitle: "Четыре рабочих слоя системы", analyticsTitle: "Понимайте интерес гостей", analyticsText: "Смотрите, какие блюда открывают чаще, когда гости изучают меню и что стоит выделить.", launchTitle: "От текущего меню до QR и домена", pricingTitle: "Система меню для ресторана, а не разовый лендинг", finalTitle: "Меню должно обновляться быстрее, чем гости успевают спросить официанта." },
  kk: { navHome: "Басты бет", navDemo: "Демо", navFeatures: "Мүмкіндіктер", navPricing: "Тарифтер", navContacts: "Байланыс", launchMenu: "Мәзірді іске қосу", openDemoMenu: "Демо мәзірді ашу", discussLaunch: "Іске қосуды талқылау", heroTitle: "Артық қиындықсыз цифрлық мәзір", heroText: "Тағамдар, бағалар, фотосуреттер, стоп-лист, тілдер және аналитика — мейрамханаға арналған бір жүйеде.", flowTitle: "QR → мәзір → өзгеріс → қонаққа жаңарту", featuresTitle: "Жүйенің төрт жұмыс қабаты", analyticsTitle: "Қонақтардың қызығушылығын түсініңіз", analyticsText: "Қай тағамдар жиі ашылатынын, қонақтар мәзірді қашан қарайтынын және нені ерекшелеу керектігін көріңіз.", launchTitle: "Қазіргі мәзірден QR және доменге дейін", pricingTitle: "Бір реттік лендинг емес, мейрамханаға арналған мәзір жүйесі", finalTitle: "Мәзір қонақ даяшыдан сұрап үлгергенше жаңаруы керек." },
  en: { navHome: "Home", navDemo: "Demo", navFeatures: "Features", navPricing: "Pricing", navContacts: "Contacts", launchMenu: "Launch menu", openDemoMenu: "Open demo menu", discussLaunch: "Discuss launch", heroTitle: "A digital menu without the chaos", heroText: "Dishes, prices, photos, stop lists, languages and analytics in one restaurant system.", flowTitle: "QR → menu → change → instant guest update", featuresTitle: "Four working layers of the system", analyticsTitle: "Understand guest interest", analyticsText: "See which dishes guests open most, when they explore the menu, and what deserves attention.", launchTitle: "From your current menu to QR and domain", pricingTitle: "A restaurant menu system, not a one-off landing page", finalTitle: "Your menu should update before guests need to ask a waiter." },
};

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

function applyLanguage(language) {
  const nextLanguage = translations[language] ? language : "ru";
  root.lang = nextLanguage;
  document.body?.classList.toggle("lang-kz", nextLanguage === "kk");
  document.querySelectorAll("[data-language]").forEach(button => button.classList.toggle("is-active", button.dataset.language === nextLanguage));
  document.querySelectorAll("[data-i18n]").forEach(node => {
    const value = translations[nextLanguage][node.dataset.i18n];
    if (value) node.textContent = value;
  });
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

applyLanguage(localStorage.getItem(languageStorageKey) || root.lang || "ru");
updateHeader();
