(() => {
  "use strict";

  const l = (ru, kk, en, tr) => ({ ru, kk, en, tr });
  const money = (value) => value == null ? null : `${new Intl.NumberFormat("ru-RU").format(value)} ₸`;
  const imagePath = (name) => `../assets/demo-menu/${name}.webp`;
  const DEFAULT_RESTAURANT_SLUG = "exort-demo";
  const LOCAL_IMAGE_BY_CONTENT_KEY = Object.freeze({
    "chicken-caesar": "salad",
    "flat-white": "coffee",
    lemonade: "mocktail",
    "homemade-lemonade": "mocktail",
    "ribeye-steak": "main",
    syrniki: "pancakes",
    cheesecake: "cake",
    "fresh-vegetable-salad": "salad",
    "english-breakfast": "eggs",
    "chicken-pasta": "main",
    "berry-tea": "mocktail",
    "beef-burger": "sandwich",
    "avocado-toast": "sandwich"
  });

  const ANALYTICS_ADAPTER = Object.freeze({
    mode: "production-only",
    track(eventType, extra = {}) {
      if (["localhost", "127.0.0.1"].includes(location.hostname)) return false;
      const sourceParams = new URLSearchParams(location.search);
      const rawSource = sourceParams.get("source") || sourceParams.get("source_id") || sourceParams.get("qr_id") || "";
      const sourcePublicId = /^[A-Za-z0-9_-]{12,64}$/.test(rawSource) ? rawSource : "";
      const payload = {
        action: "trackAnalyticsEvent",
        restaurantSlug: getRequestedRestaurantSlug(),
        eventType,
        language: state.language,
        deviceType: innerWidth < 768 ? "mobile" : innerWidth < 1024 ? "tablet" : "desktop",
        sessionId: getAnalyticsSessionId(),
        menuPageId: getRequestedRestaurantSlug(),
        sourcePublicId,
        sourceFallback: sourcePublicId ? "QR-код" : rawSource ? "Источник не определён" : "Прямой переход",
        userAgent: navigator.userAgent || "",
        referrer: document.referrer || "",
        ...extra
      };
      const body = JSON.stringify(payload);
      try {
        if (navigator.sendBeacon?.("/api/exort-admin", new Blob([body], { type: "application/json" }))) return true;
      } catch {}
      fetch("/api/exort-admin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body,
        keepalive: true
      }).catch(() => {});
      return true;
    }
  });

  const copy = {
    ru: {
      openNow: "Открыто до 23:00", viewMenu: "Смотреть меню", aboutVenue: "О заведении",
      menuEyebrow: "МЕНЮ · СЕГОДНЯ", menuTitle: "Выбирайте глазами. Оставайтесь ради вкуса.",
      menuLead: "Завтраки весь день, понятная еда и напитки с неожиданным характером.",
      serviceTitle: "Сервисный сбор", serviceText: "К стоимости заказа добавляется сервисный сбор 10%. Демонстрационный текст.",
      loaderService: "К стоимости заказа добавляется сервисный сбор.", allergyNotice: "Если у вас есть аллергия, пожалуйста, сообщите официанту.", beforeMenu: "Перед просмотром меню", understood: "Понятно",
      featuredEyebrow: "ВЫБОР", featuredTitle: "Популярно сегодня", nothingFound: "Ничего не найдено",
      tryAnother: "Попробуйте другое название или ингредиент.", resetSearch: "Сбросить поиск", reset: "Сбросить", cancel: "Отмена",
      venueEyebrow: "EXORT DEMO · ДЕМО-КОНЦЕПТ", venueStatement: "Утро, обед и поздний кофе — в одном городском ритме.",
      venueDetails: "Адрес и часы", fictionalVenue: "Вымышленное демонстрационное заведение", information: "Информация",
      poweredBy: "Меню работает на", wantMenu: "Хочу такое меню",
      disclaimer: "Все названия, контакты, блюда и данные на этой странице демонстрационные.",
      aboutEyebrow: "О ЗАВЕДЕНИИ", aboutTitle: "Городская кухня",
      aboutText: "Вымышленное all-day заведение с открытой кухней, спешелти-кофе и небольшим вечерним баром.",
      addressLabel: "Адрес", addressValue: "Демо-город, квартал Северный Свет, дом 00",
      hoursLabel: "Режим работы", hoursValue: "Ежедневно · 08:00–23:00", phoneLabel: "Телефон",
      serviceLanguages: "Языки обслуживания", mapButton: "Показать на карте", mapDemo: "Демо — без перехода к реальному адресу",
      mapClicked: "Это демонстрационный адрес — карта не открывается", searchPlaceholder: "Блюдо, напиток или ингредиент",
      searchOpen: "Открыть поиск", searchClose: "Закрыть поиск", clearSearch: "Очистить поиск", chooseLanguage: "Выбор языка",
      infoOpen: "Информация о заведении", close: "Закрыть", categories: "Категории меню", dishes: "позиций",
      resultOne: "Найдена 1 позиция", results: (count) => `Найдено позиций: ${count}`,
      available: "Доступно", unavailable: "Временно недоступно", priceOnRequest: "Цена по запросу",
      composition: "Состав", allergens: "Аллергены", calories: "Калорийность", pairs: "Хорошо сочетается с",
      noAllergens: "Уточните у команды", copied: "Ссылка скопирована", copyFallback: "Выделите ссылку и скопируйте вручную"
    },
    kk: {
      openNow: "23:00-ге дейін ашық", viewMenu: "Мәзірді көру", aboutVenue: "Орын туралы",
      menuEyebrow: "МӘЗІР · БҮГІН", menuTitle: "Көзіңізбен таңдаңыз. Дәмі үшін қалыңыз.",
      menuLead: "Күні бойы таңғы ас, түсінікті тағам және ерекше мінезді сусындар.",
      serviceTitle: "Қызмет көрсету ақысы", serviceText: "Тапсырыс құнына 10% қызмет көрсету ақысы қосылады. Демонстрациялық мәтін.",
      loaderService: "Тапсырыс құнына қызмет көрсету ақысы қосылады.", allergyNotice: "Аллергияңыз болса, даяшыға алдын ала хабарлаңыз.", beforeMenu: "Мәзірді көрмес бұрын", understood: "Түсінікті",
      featuredEyebrow: "ТАҢДАУ", featuredTitle: "Бүгін танымал", nothingFound: "Ештеңе табылмады",
      tryAnother: "Басқа атауды немесе ингредиентті байқап көріңіз.", resetSearch: "Іздеуді тазарту", reset: "Тазарту", cancel: "Болдырмау",
      venueEyebrow: "EXORT DEMO · ДЕМО-ТҰЖЫРЫМ", venueStatement: "Таң, түскі ас және кешкі кофе — бір қалалық ырғақта.",
      venueDetails: "Мекенжай және уақыт", fictionalVenue: "Ойдан шығарылған демонстрациялық орын", information: "Ақпарат",
      poweredBy: "Мәзірді іске қосқан", wantMenu: "Осындай мәзір керек",
      disclaimer: "Бұл беттегі барлық атаулар, байланыстар, тағамдар мен деректер демонстрациялық.",
      aboutEyebrow: "ОРЫН ТУРАЛЫ", aboutTitle: "Қалалық ас үй",
      aboutText: "Ашық ас үйі, спешелти кофесі және шағын кешкі бары бар ойдан шығарылған all-day орын.",
      addressLabel: "Мекенжай", addressValue: "Демо-қала, Солтүстік Жарық орамы, 00 үй",
      hoursLabel: "Жұмыс уақыты", hoursValue: "Күн сайын · 08:00–23:00", phoneLabel: "Телефон",
      serviceLanguages: "Қызмет көрсету тілдері", mapButton: "Картадан көрсету", mapDemo: "Демо — нақты мекенжайға өтпейді",
      mapClicked: "Бұл демонстрациялық мекенжай — карта ашылмайды", searchPlaceholder: "Тағам, сусын немесе ингредиент",
      searchOpen: "Іздеуді ашу", searchClose: "Іздеуді жабу", clearSearch: "Іздеуді тазарту", chooseLanguage: "Тілді таңдау",
      infoOpen: "Орын туралы ақпарат", close: "Жабу", categories: "Мәзір санаттары", dishes: "позиция",
      resultOne: "1 позиция табылды", results: (count) => `${count} позиция табылды`,
      available: "Қолжетімді", unavailable: "Уақытша қолжетімсіз", priceOnRequest: "Бағасын нақтылаңыз",
      composition: "Құрамы", allergens: "Аллергендер", calories: "Калориясы", pairs: "Мыналармен үйлеседі",
      noAllergens: "Командадан нақтылаңыз", copied: "Сілтеме көшірілді", copyFallback: "Сілтемені белгілеп, қолмен көшіріңіз"
    },
    en: {
      openNow: "Open until 23:00", viewMenu: "View menu", aboutVenue: "About",
      menuEyebrow: "MENU · TODAY", menuTitle: "Choose with your eyes. Stay for the flavour.",
      menuLead: "All-day breakfast, approachable food and drinks with an unexpected edge.",
      serviceTitle: "Service charge", serviceText: "A 10% service charge is added to the order total. Demonstration text.",
      loaderService: "A service charge is added to the order total.", allergyNotice: "If you have an allergy, please tell your waiter.", beforeMenu: "Before viewing the menu", understood: "Got it",
      featuredEyebrow: "PICKS", featuredTitle: "Popular today", nothingFound: "Nothing found",
      tryAnother: "Try another dish, drink or ingredient.", resetSearch: "Reset search", reset: "Reset", cancel: "Cancel",
      venueEyebrow: "EXORT DEMO · DEMO CONCEPT", venueStatement: "Morning, lunch and late coffee in one city rhythm.",
      venueDetails: "Address & hours", fictionalVenue: "Fictional demonstration venue", information: "Information",
      poweredBy: "Menu powered by", wantMenu: "I want this menu",
      disclaimer: "All names, contacts, dishes and data on this page are for demonstration only.",
      aboutEyebrow: "ABOUT THE VENUE", aboutTitle: "City kitchen",
      aboutText: "A fictional all-day venue with an open kitchen, specialty coffee and a small evening bar.",
      addressLabel: "Address", addressValue: "Demo City, Northern Light quarter, building 00",
      hoursLabel: "Opening hours", hoursValue: "Daily · 08:00–23:00", phoneLabel: "Phone",
      serviceLanguages: "Service languages", mapButton: "Show on map", mapDemo: "Demo — no real address will open",
      mapClicked: "This is a demonstration address — no map is opened", searchPlaceholder: "Dish, drink or ingredient",
      searchOpen: "Open search", searchClose: "Close search", clearSearch: "Clear search", chooseLanguage: "Choose language",
      infoOpen: "Venue information", close: "Close", categories: "Menu categories", dishes: "items",
      resultOne: "1 item found", results: (count) => `${count} items found`,
      available: "Available", unavailable: "Temporarily unavailable", priceOnRequest: "Ask for today’s price",
      composition: "Ingredients", allergens: "Allergens", calories: "Calories", pairs: "Pairs well with",
      noAllergens: "Please ask our team", copied: "Link copied", copyFallback: "Select the link and copy it manually"
    },
    tr: {
      openNow: "23:00'e kadar açık", viewMenu: "Menüyü gör", aboutVenue: "Mekân hakkında",
      menuEyebrow: "MENÜ · BUGÜN", menuTitle: "Gözlerinle seç. Lezzet için kal.",
      menuLead: "Tüm gün kahvaltı, yalın tabaklar ve beklenmedik karakterli içecekler.",
      serviceTitle: "Servis ücreti", serviceText: "Sipariş toplamına %10 servis ücreti eklenir. Gösterim metnidir.",
      loaderService: "Sipariş toplamına servis ücreti eklenir.", allergyNotice: "Alerjiniz varsa lütfen garsona bildiriniz.", beforeMenu: "Menüyü görmeden önce", understood: "Anladım",
      featuredEyebrow: "SEÇİM", featuredTitle: "Bugünün popülerleri", nothingFound: "Sonuç bulunamadı",
      tryAnother: "Başka bir yemek, içecek veya malzeme deneyin.", resetSearch: "Aramayı sıfırla", reset: "Sıfırla", cancel: "İptal",
      venueEyebrow: "EXORT DEMO · DEMO KONSEPT", venueStatement: "Sabah, öğle ve geç kahve — tek bir şehir ritminde.",
      venueDetails: "Adres ve saatler", fictionalVenue: "Kurgusal gösterim mekânı", information: "Bilgi",
      poweredBy: "Menü altyapısı", wantMenu: "Böyle bir menü istiyorum",
      disclaimer: "Bu sayfadaki tüm isimler, iletişim bilgileri, yemekler ve veriler gösterim amaçlıdır.",
      aboutEyebrow: "MEKÂN HAKKINDA", aboutTitle: "Şehir mutfağı",
      aboutText: "Açık mutfak, nitelikli kahve ve küçük bir akşam barına sahip kurgusal all-day mekân.",
      addressLabel: "Adres", addressValue: "Demo Şehir, Kuzey Işığı mahallesi, bina 00",
      hoursLabel: "Çalışma saatleri", hoursValue: "Her gün · 08:00–23:00", phoneLabel: "Telefon",
      serviceLanguages: "Hizmet dilleri", mapButton: "Haritada göster", mapDemo: "Demo — gerçek bir adrese yönlendirmez",
      mapClicked: "Bu bir demo adresidir — harita açılmaz", searchPlaceholder: "Yemek, içecek veya malzeme",
      searchOpen: "Aramayı aç", searchClose: "Aramayı kapat", clearSearch: "Aramayı temizle", chooseLanguage: "Dil seçimi",
      infoOpen: "Mekân bilgileri", close: "Kapat", categories: "Menü kategorileri", dishes: "ürün",
      resultOne: "1 ürün bulundu", results: (count) => `${count} ürün bulundu`,
      available: "Mevcut", unavailable: "Geçici olarak mevcut değil", priceOnRequest: "Güncel fiyatı sorunuz",
      composition: "İçindekiler", allergens: "Alerjenler", calories: "Kalori", pairs: "Yanına iyi gider",
      noAllergens: "Ekibimize danışın", copied: "Bağlantı kopyalandı", copyFallback: "Bağlantıyı seçip elle kopyalayın"
    }
  };

  let categories = [];
  let dishes = [];
  const state = {
    language: "ru",
    query: "",
    activeCategory: "popular",
    openDishId: null,
    lastTrigger: null,
    activeModal: null,
    dishOpenedAt: 0,
    menuAccepted: false,
    venue: {
      name: "Exort Demo",
      subtitle: "ALL-DAY KITCHEN · COFFEE · CITY BAR",
      city: "Демо-город",
      instagram: "@exort.demo.menu",
      accent: "#ff5a36"
    }
  };

  const elements = {
    loader: document.querySelector("[data-loader]"),
    loaderAccept: document.querySelector("[data-loader-accept]"),
    hero: document.querySelector(".showcase-hero"),
    sticky: document.querySelector("[data-sticky-header]"),
    menu: document.querySelector("#menu"),
    categoryNav: document.querySelector("[data-category-nav]"),
    featuredSection: document.querySelector("[data-featured-section]"),
    featuredGrid: document.querySelector("[data-featured-grid]"),
    sections: document.querySelector("[data-menu-sections]"),
    empty: document.querySelector("[data-empty]"),
    searchPanel: document.querySelector("[data-search-panel]"),
    searchInput: document.querySelector("[data-search-input]"),
    resultsStatus: document.querySelector("[data-results-status]"),
    dishModal: document.querySelector("[data-dish-modal]"),
    dishModalContent: document.querySelector("[data-dish-modal-content]"),
    infoModal: document.querySelector("[data-info-modal]"),
    editor: document.querySelector("[data-editor]"),
    editorStatus: document.querySelector("[data-editor-status]"),
    shareLink: document.querySelector("[data-share-link]")
  };

  let sectionObserver = null;
  let revealObserver = null;
  let touchStart = null;

  function localeValue(value) {
    if (value == null || typeof value !== "object") return value ?? "";
    return value[state.language] ?? value.ru ?? "";
  }

  function escapeHtml(value) {
    return String(value ?? "")
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }

  function currentCopy() {
    return copy[state.language] || copy.ru;
  }

  function getRequestedRestaurantSlug() {
    const raw = new URLSearchParams(location.search).get("restaurant") || DEFAULT_RESTAURANT_SLUG;
    return String(raw).toLowerCase().replace(/[^a-z0-9-]/g, "") || DEFAULT_RESTAURANT_SLUG;
  }

  function getAnalyticsSessionId() {
    const key = `exort-showcase-session:${getRequestedRestaurantSlug()}`;
    try {
      let value = sessionStorage.getItem(key);
      if (!value) {
        value = crypto.randomUUID?.() || `session-${Date.now()}-${Math.random().toString(16).slice(2)}`;
        sessionStorage.setItem(key, value);
      }
      return value;
    } catch {
      return `session-${Date.now()}-${Math.random().toString(16).slice(2)}`;
    }
  }

  async function requestPublicMenuData() {
    const controller = new AbortController();
    const timeout = window.setTimeout(() => controller.abort(), 6500);
    try {
      const response = await fetch("/api/exort-admin", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json"
        },
        body: JSON.stringify({
          action: "getPublicMenuData",
          restaurantSlug: getRequestedRestaurantSlug()
        }),
        signal: controller.signal
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(payload.error || `Menu API: ${response.status}`);
      return payload;
    } finally {
      window.clearTimeout(timeout);
    }
  }

  function localizedFromRecord(record, kind) {
    const fields = kind === "name"
      ? { ru: ["title_ru", "name_ru"], kk: ["title_kk", "name_kz"], en: ["title_en", "name_en"], tr: ["title_tr", "name_tr"] }
      : { ru: [`${kind}_ru`], kk: [`${kind}_kk`, `${kind}_kz`], en: [`${kind}_en`], tr: [`${kind}_tr`] };
    const pick = (language) => fields[language].map((field) => record[field]).find((value) => String(value || "").trim()) || "";
    const ru = pick("ru");
    const en = pick("en") || ru;
    return l(ru || en, pick("kk") || ru || en, en, pick("tr") || en || ru);
  }

  function safePublicImage(value) {
    const raw = String(value || "").trim();
    if (!raw) return "";
    try {
      const url = new URL(raw, location.href);
      return ["http:", "https:"].includes(url.protocol) ? url.href : "";
    } catch {
      return "";
    }
  }

  function localImageForItem(item) {
    const asset = LOCAL_IMAGE_BY_CONTENT_KEY[item.content_key];
    return asset ? imagePath(asset) : "";
  }

  async function hydrateLiveMenu() {
    const slug = getRequestedRestaurantSlug();
    const payload = await requestPublicMenuData();
    const restaurant = payload.restaurant;
    if (!restaurant) throw new Error(`Restaurant ${slug} not found`);
    const categoryRows = Array.isArray(payload.categories) ? payload.categories : [];
    const itemRows = Array.isArray(payload.items) ? payload.items : [];

    const liveCategories = categoryRows.map((category) => ({
      id: category.id,
      name: localizedFromRecord(category, "name")
    }));
    const categoryIds = new Set(liveCategories.map((category) => category.id));
    const now = Date.now();
    const liveDishes = itemRows
      .filter((item) => item.content_key !== "menu-hero" && categoryIds.has(item.category_id))
      .map((item) => {
        const price = Number(item.price);
        const inactiveUntil = item.inactive_until ? Date.parse(item.inactive_until) : 0;
        const badge = localizedFromRecord(item, "badge");
        return {
          id: item.id,
          category: item.category_id,
          name: localizedFromRecord(item, "name"),
          description: localizedFromRecord(item, "description"),
          price: Number.isFinite(price) ? price : null,
          weight: safeText(item.weight, "", 40),
          image: safePublicImage(item.image_url) || localImageForItem(item),
          featured: false,
          available: item.is_active !== false && !item.is_stoplisted && !(inactiveUntil > now),
          badge: Object.values(badge).some(Boolean) ? badge : null,
          calories: Number.isFinite(Number(item.calories)) ? Number(item.calories) : null,
          ingredients: localizedFromRecord(item, "description"),
          allergens: null,
          pairings: [],
          tags: []
        };
      });
    if (!liveDishes.length) throw new Error(`Restaurant ${slug} has no active menu items`);

    liveDishes.filter((item) => item.available && item.image).slice(0, 4).forEach((item) => { item.featured = true; });
    liveDishes.forEach((item, index) => {
      const candidates = liveDishes.filter((candidate) => candidate.id !== item.id && candidate.available);
      item.pairings = candidates.slice(index % Math.max(candidates.length, 1), (index % Math.max(candidates.length, 1)) + 2).map((candidate) => candidate.id);
      if (item.pairings.length < 2) item.pairings.push(...candidates.slice(0, 2 - item.pairings.length).map((candidate) => candidate.id));
    });

    categories = [{ id: "popular", name: l("Популярное", "Танымал", "Popular", "Popüler") }, ...liveCategories];
    dishes = liveDishes;
    if (!new URLSearchParams(location.search).has("name")) {
      state.venue.name = slug === DEFAULT_RESTAURANT_SLUG ? "Exort Demo" : safeText(restaurant.name, state.venue.name, 48);
    }
    return true;
  }

  function formatPrice(value) {
    return money(value) || currentCopy().priceOnRequest;
  }

  function getCategory(id) {
    return categories.find((category) => category.id === id);
  }

  function getDish(id) {
    return dishes.find((item) => item.id === id);
  }

  function normalize(value) {
    return String(value || "").toLocaleLowerCase(state.language === "tr" ? "tr-TR" : state.language === "kk" ? "kk-KZ" : state.language === "en" ? "en-US" : "ru-RU");
  }

  function filteredDishes() {
    const query = normalize(state.query).trim();
    if (!query) return dishes;
    return dishes.filter((item) => {
      const category = getCategory(item.category);
      const searchable = [localeValue(item.name), localeValue(item.description), localeValue(item.ingredients), localeValue(item.badge), localeValue(category?.name), ...item.tags].join(" ");
      return normalize(searchable).includes(query);
    });
  }

  function renderCategoryNav() {
    elements.categoryNav.innerHTML = categories.map((category) => `
      <button type="button" data-category="${category.id}" class="${state.activeCategory === category.id ? "is-active" : ""}">
        ${escapeHtml(localeValue(category.name))}
      </button>`).join("");
  }

  function featureCard(item, index) {
    return `
      <button class="showcase-feature-card" type="button" data-dish-id="${item.id}" aria-label="${escapeHtml(localeValue(item.name))}">
        <img src="${item.image}" alt="${escapeHtml(localeValue(item.name))}" loading="${index ? "lazy" : "eager"}" />
        <span class="showcase-feature-card__body">
          <span class="showcase-feature-card__meta"><small>${escapeHtml(localeValue(item.badge) || currentCopy().available)}</small><strong>${escapeHtml(formatPrice(item.price))}</strong></span>
          <h3>${escapeHtml(localeValue(item.name))}</h3>
        </span>
      </button>`;
  }

  function dishCard(item, index) {
    const name = localeValue(item.name);
    const description = localeValue(item.description);
    const visual = item.image
      ? `<span class="showcase-dish-card__visual"><img src="${item.image}" alt="${escapeHtml(name)}" loading="lazy" /></span>`
      : `<span class="showcase-dish-card__visual showcase-dish-card__visual--abstract" data-letter="${escapeHtml(name.slice(0, 1))}" aria-hidden="true"></span>`;
    return `
      <button class="showcase-dish-card ${item.image ? "" : "has-no-image"} ${item.available ? "" : "is-unavailable"}" type="button" data-dish-id="${item.id}" aria-label="${escapeHtml(name)}">
        <span class="showcase-dish-card__content">
          <span class="showcase-dish-card__number">${String(index + 1).padStart(2, "0")}</span>
          <h3>${escapeHtml(name)}</h3>
          ${description ? `<p>${escapeHtml(description)}</p>` : ""}
          ${item.badge ? `<span class="showcase-badge">${escapeHtml(localeValue(item.badge))}</span>` : ""}
          <span class="showcase-dish-card__meta"><strong>${escapeHtml(formatPrice(item.price))}</strong><small>${item.available ? escapeHtml(item.weight) : escapeHtml(currentCopy().unavailable)}</small></span>
        </span>
        ${visual}
      </button>`;
  }

  function renderMenu() {
    const filtered = filteredDishes();
    const isSearching = Boolean(state.query.trim());
    const featured = filtered.filter((item) => item.featured && item.image).slice(0, 4);

    elements.featuredSection.hidden = isSearching || !featured.length;
    elements.featuredGrid.innerHTML = featured.map(featureCard).join("");

    const sectionMarkup = categories.filter((category) => category.id !== "popular").map((category) => {
      const items = filtered.filter((item) => item.category === category.id);
      if (!items.length) return "";
      return `
        <section class="showcase-menu-section showcase-reveal" id="category-${category.id}" data-category-section="${category.id}" aria-labelledby="heading-${category.id}">
          <div class="showcase-menu-section__heading">
            <h2 id="heading-${category.id}">${escapeHtml(localeValue(category.name))}</h2>
            <span>${items.length} ${escapeHtml(currentCopy().dishes)}</span>
          </div>
          <div class="showcase-dish-grid">${items.map(dishCard).join("")}</div>
        </section>`;
    }).join("");

    elements.sections.innerHTML = sectionMarkup;
    elements.empty.hidden = filtered.length > 0;
    elements.sections.hidden = filtered.length === 0;
    document.querySelector("[data-reset-search]")?.toggleAttribute("hidden", !isSearching);

    if (isSearching) {
      elements.resultsStatus.textContent = filtered.length === 1 ? currentCopy().resultOne : currentCopy().results(filtered.length);
    } else {
      elements.resultsStatus.textContent = "";
    }

    bindDynamicObservers();
  }

  function applyCopy() {
    const languageCopy = currentCopy();
    document.documentElement.lang = state.language;
    document.querySelectorAll("[data-copy]").forEach((element) => {
      const value = languageCopy[element.dataset.copy];
      if (typeof value === "string") element.textContent = value;
    });
    document.querySelectorAll("[data-language-switcher]").forEach((switcher) => {
      switcher.setAttribute("aria-label", languageCopy.chooseLanguage);
    });
    document.querySelectorAll("[data-language]").forEach((button) => {
      const active = button.dataset.language === state.language;
      button.classList.toggle("is-active", active);
      button.setAttribute("aria-pressed", String(active));
    });
    document.querySelectorAll("[data-info-open]").forEach((button) => button.setAttribute("aria-label", languageCopy.infoOpen));
    document.querySelectorAll("[data-modal-close], [data-info-close]").forEach((button) => button.setAttribute("aria-label", languageCopy.close));
    document.querySelectorAll("[data-search-toggle]").forEach((button) => {
      button.setAttribute("aria-label", elements.searchPanel.classList.contains("is-open") ? languageCopy.searchClose : languageCopy.searchOpen);
    });
    document.querySelector("[data-search-clear]")?.setAttribute("aria-label", languageCopy.clearSearch);
    elements.searchInput.placeholder = languageCopy.searchPlaceholder;
    elements.searchInput.setAttribute("aria-label", languageCopy.searchPlaceholder);
    elements.categoryNav.setAttribute("aria-label", languageCopy.categories);
    document.querySelector('[data-copy="featuredEyebrow"]').textContent = `${languageCopy.featuredEyebrow} ${state.venue.name}`;
    const popularCategory = getCategory("popular");
    document.title = popularCategory
      ? `${state.venue.name} — ${localeValue(popularCategory.name)} · Exort demo`
      : `${state.venue.name} — Exort demo`;
  }

  function setLanguage(language) {
    if (!copy[language]) return;
    state.language = language;
    try { localStorage.setItem("exort-demo-menu-language", language); } catch {}
    applyCopy();
    renderCategoryNav();
    renderMenu();
    if (state.openDishId && state.activeModal === elements.dishModal) renderDishModal(getDish(state.openDishId));
    if (state.menuAccepted) ANALYTICS_ADAPTER.track("language_change", { language });
  }

  function updateActiveCategory(id) {
    state.activeCategory = id;
    elements.categoryNav.querySelectorAll("[data-category]").forEach((button) => {
      const active = button.dataset.category === id;
      button.classList.toggle("is-active", active);
      if (active) button.scrollIntoView({ behavior: matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth", block: "nearest", inline: "center" });
    });
  }

  function goToCategory(id) {
    const performScroll = () => {
      const target = id === "popular" ? elements.featuredSection : document.querySelector(`#category-${CSS.escape(id)}`);
      target?.scrollIntoView({ behavior: matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth", block: "start" });
      updateActiveCategory(id);
    };
    if (state.query) {
      clearSearch(false);
      requestAnimationFrame(() => requestAnimationFrame(performScroll));
    } else {
      performScroll();
    }
    const category = getCategory(id);
    if (state.menuAccepted && category) ANALYTICS_ADAPTER.track("category_view", { categoryId: category.id });
  }

  function setSearchOpen(open, focus = true) {
    elements.searchPanel.classList.toggle("is-open", open);
    elements.searchPanel.setAttribute("aria-hidden", String(!open));
    document.body.classList.toggle("is-search-open", open);
    document.querySelectorAll("[data-search-toggle]").forEach((button) => {
      button.setAttribute("aria-expanded", String(open));
      button.setAttribute("aria-label", open ? currentCopy().searchClose : currentCopy().searchOpen);
    });
    if (open && focus) requestAnimationFrame(() => elements.searchInput.focus());
  }

  function clearSearch(close = false) {
    state.query = "";
    elements.searchInput.value = "";
    renderMenu();
    if (close) setSearchOpen(false, false);
  }

  function pairingMarkup(id) {
    const item = getDish(id);
    if (!item) return "";
    const visual = item.image ? `<img src="${item.image}" alt="" />` : "<i></i>";
    return `<button type="button" data-pairing-id="${item.id}">${visual}<span><strong>${escapeHtml(localeValue(item.name))}</strong><small>${escapeHtml(formatPrice(item.price))}</small></span></button>`;
  }

  function renderDishModal(item) {
    if (!item) return;
    const name = localeValue(item.name);
    const description = localeValue(item.description);
    const visual = item.image
      ? `<img class="showcase-dish-modal__image" src="${item.image}" alt="${escapeHtml(name)}" />`
      : `<div class="showcase-dish-modal__visual" aria-label="${escapeHtml(name)}">${escapeHtml(name.slice(0, 1))}</div>`;
    elements.dishModalContent.innerHTML = `
      ${visual}
      <div class="showcase-dish-modal__body">
        <p class="showcase-kicker">${escapeHtml(localeValue(getCategory(item.category)?.name))}</p>
        <h2 id="dish-modal-title">${escapeHtml(name)}</h2>
        ${description ? `<p class="showcase-dish-modal__description">${escapeHtml(description)}</p>` : ""}
        <div class="showcase-dish-modal__facts">
          <span>${escapeHtml(item.available ? currentCopy().available : currentCopy().unavailable)}</span>
          <span>${escapeHtml(item.weight)}</span>
          ${item.badge ? `<span>${escapeHtml(localeValue(item.badge))}</span>` : ""}
          ${item.calories ? `<span>${item.calories} kcal</span>` : ""}
        </div>
        <div class="showcase-dish-price"><strong>${escapeHtml(formatPrice(item.price))}</strong><span>${escapeHtml(item.weight)}</span></div>
        <div class="showcase-dish-modal__detail"><h3>${escapeHtml(currentCopy().composition)}</h3><p>${escapeHtml(localeValue(item.ingredients) || description)}</p></div>
        <div class="showcase-dish-modal__detail"><h3>${escapeHtml(currentCopy().allergens)}</h3><p>${escapeHtml(localeValue(item.allergens) || currentCopy().noAllergens)}</p></div>
        ${item.pairings.length ? `<div class="showcase-pairings"><h3>${escapeHtml(currentCopy().pairs)}</h3><div class="showcase-pairing-list">${item.pairings.map(pairingMarkup).join("")}</div></div>` : ""}
      </div>`;
  }

  function openDish(item, trigger) {
    if (!item) return;
    state.openDishId = item.id;
    state.lastTrigger = trigger || document.activeElement;
    state.dishOpenedAt = Date.now();
    renderDishModal(item);
    openModal(elements.dishModal);
    ANALYTICS_ADAPTER.track("dish_open", { menuItemId: item.id });
  }

  function openModal(modal) {
    if (!modal) return;
    state.activeModal = modal;
    modal.classList.add("is-open");
    modal.setAttribute("aria-hidden", "false");
    document.body.classList.add("is-modal-open");
    const focusFirstControl = () => getFocusable(modal)[0]?.focus();
    window.setTimeout(focusFirstControl, 0);
    window.setTimeout(focusFirstControl, 140);
  }

  function closeModal(modal = state.activeModal) {
    if (!modal) return;
    modal.classList.remove("is-open");
    modal.setAttribute("aria-hidden", "true");
    document.body.classList.remove("is-modal-open");
    const wasDish = modal === elements.dishModal;
    if (wasDish && state.openDishId && state.dishOpenedAt) {
      ANALYTICS_ADAPTER.track("dish_close", {
        menuItemId: state.openDishId,
        durationMs: Date.now() - state.dishOpenedAt
      });
    }
    state.activeModal = null;
    if (wasDish) {
      state.openDishId = null;
      state.dishOpenedAt = 0;
    }
    const returnTarget = state.lastTrigger;
    state.lastTrigger = null;
    setTimeout(() => returnTarget?.focus?.(), 0);
  }

  function getFocusable(container) {
    return Array.from(container.querySelectorAll('button:not([disabled]):not([tabindex="-1"]), a[href]:not([tabindex="-1"]), input:not([disabled]):not([tabindex="-1"]), [tabindex]:not([tabindex="-1"])'))
      .filter((element) => {
        if (element.hidden || element.getClientRects().length === 0) return false;
        const style = getComputedStyle(element);
        return style.visibility !== "hidden" && style.display !== "none";
      });
  }

  function trapFocus(event) {
    if (!state.activeModal || event.key !== "Tab") return;
    const focusable = getFocusable(state.activeModal);
    if (!focusable.length) return;
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  }

  function bindDynamicObservers() {
    sectionObserver?.disconnect();
    sectionObserver = new IntersectionObserver((entries) => {
      const visible = entries.filter((entry) => entry.isIntersecting).sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
      if (visible) updateActiveCategory(visible.target.dataset.categorySection || "popular");
    }, { rootMargin: "-30% 0px -58% 0px", threshold: [0.05, 0.25, 0.5] });
    if (!elements.featuredSection.hidden) sectionObserver.observe(elements.featuredSection);
    document.querySelectorAll("[data-category-section]").forEach((section) => sectionObserver.observe(section));

    document.querySelectorAll(".showcase-reveal:not([data-reveal-bound])").forEach((element) => {
      element.dataset.revealBound = "true";
      revealObserver?.observe(element);
    });
  }

  function safeText(value, fallback, maxLength) {
    const normalized = String(value ?? "").replace(/[\u0000-\u001f\u007f]/g, " ").trim().slice(0, maxLength);
    return normalized || fallback;
  }

  function safeAccent(value) {
    return /^#[0-9a-f]{6}$/i.test(String(value || "")) ? value : "#ff5a36";
  }

  function applyVenue() {
    document.querySelectorAll("[data-venue-name]").forEach((element) => { element.textContent = state.venue.name; });
    document.querySelectorAll("[data-venue-subtitle]").forEach((element) => { element.textContent = state.venue.subtitle; });
    document.querySelectorAll("[data-venue-city]").forEach((element) => { element.textContent = state.venue.city; });
    document.querySelectorAll("[data-venue-instagram]").forEach((element) => { element.textContent = state.venue.instagram; });
    document.body.style.setProperty("--sc-accent", state.venue.accent);
    document.querySelector('[data-copy="featuredEyebrow"]').textContent = `${currentCopy().featuredEyebrow} ${state.venue.name}`;
    document.title = `${state.venue.name} — Exort demo`;
  }

  function readVenueParams() {
    const params = new URLSearchParams(location.search);
    state.venue.name = safeText(params.get("name"), state.venue.name, 36);
    state.venue.subtitle = safeText(params.get("subtitle"), state.venue.subtitle, 80);
    state.venue.city = safeText(params.get("city"), state.venue.city, 40);
    state.venue.instagram = safeText(params.get("instagram"), state.venue.instagram, 50);
    state.venue.accent = safeAccent(params.get("accent") || state.venue.accent);
    return params.get("editor") === "1";
  }

  function updateShareLink() {
    const url = new URL(location.href);
    url.search = "";
    url.searchParams.set("name", state.venue.name);
    url.searchParams.set("subtitle", state.venue.subtitle);
    url.searchParams.set("city", state.venue.city);
    url.searchParams.set("instagram", state.venue.instagram);
    url.searchParams.set("accent", state.venue.accent);
    elements.shareLink.value = url.toString();
    return url.toString();
  }

  function setupEditor(enabled) {
    if (!enabled) return;
    elements.editor.hidden = false;
    const fields = {
      name: elements.editor.querySelector("[data-editor-name]"),
      subtitle: elements.editor.querySelector("[data-editor-subtitle]"),
      city: elements.editor.querySelector("[data-editor-city]"),
      instagram: elements.editor.querySelector("[data-editor-instagram]"),
      accent: elements.editor.querySelector("[data-editor-accent]")
    };
    Object.entries(fields).forEach(([key, field]) => {
      field.value = state.venue[key];
      field.addEventListener("input", () => {
        state.venue[key] = key === "accent" ? safeAccent(field.value) : safeText(field.value, state.venue[key], key === "subtitle" ? 80 : 50);
        applyVenue();
        updateShareLink();
      });
    });
    elements.editor.querySelector("[data-editor-toggle]").addEventListener("click", (event) => {
      const collapsed = elements.editor.classList.toggle("is-collapsed");
      event.currentTarget.setAttribute("aria-expanded", String(!collapsed));
    });
    elements.editor.querySelector("[data-copy-link]").addEventListener("click", async () => {
      const url = updateShareLink();
      try {
        await navigator.clipboard.writeText(url);
        elements.editorStatus.textContent = currentCopy().copied;
      } catch {
        elements.shareLink.focus();
        elements.shareLink.select();
        elements.editorStatus.textContent = currentCopy().copyFallback;
      }
    });
    updateShareLink();
  }

  function acceptLoader() {
    if (elements.loaderAccept.disabled || state.menuAccepted) return;
    state.menuAccepted = true;
    elements.loader.classList.add("is-done");
    elements.loader.setAttribute("aria-hidden", "true");
    elements.sticky.removeAttribute("inert");
    document.querySelector(".showcase-shell")?.removeAttribute("inert");
    document.body.classList.remove("is-loader-open");
    ANALYTICS_ADAPTER.track("session_start");
    ANALYTICS_ADAPTER.track("menu_open");
    window.setTimeout(() => document.querySelector("[data-scroll-menu]")?.focus(), 460);
  }

  function bindEvents() {
    document.addEventListener("click", (event) => {
      if (event.target.closest("[data-loader-accept]")) {
        if (elements.loaderAccept.dataset.loaderRetry === "true") return location.reload();
        return acceptLoader();
      }

      const languageButton = event.target.closest("[data-language]");
      if (languageButton) return setLanguage(languageButton.dataset.language);

      const dishButton = event.target.closest("[data-dish-id]");
      if (dishButton) return openDish(getDish(dishButton.dataset.dishId), dishButton);

      const pairingButton = event.target.closest("[data-pairing-id]");
      if (pairingButton) return openDish(getDish(pairingButton.dataset.pairingId), state.lastTrigger);

      const categoryButton = event.target.closest("[data-category]");
      if (categoryButton) return goToCategory(categoryButton.dataset.category);

      if (event.target.closest("[data-search-toggle]")) return setSearchOpen(!elements.searchPanel.classList.contains("is-open"));
      if (event.target.closest("[data-search-close]")) return setSearchOpen(false, false);
      if (event.target.closest("[data-search-clear]")) return clearSearch(false);
      if (event.target.closest("[data-reset-search]")) return clearSearch(false);
      if (event.target.closest("[data-scroll-menu]")) return elements.menu.scrollIntoView({ behavior: matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth" });

      const infoButton = event.target.closest("[data-info-open]");
      if (infoButton) {
        state.lastTrigger = infoButton;
        return openModal(elements.infoModal);
      }
      if (event.target.closest("[data-modal-close]")) return closeModal(elements.dishModal);
      if (event.target.closest("[data-info-close]")) return closeModal(elements.infoModal);
      if (event.target.closest("[data-map-demo]")) {
        const note = event.target.closest("[data-map-demo]").querySelector("small");
        note.textContent = currentCopy().mapClicked;
      }
    });

    elements.searchInput.addEventListener("input", () => {
      state.query = elements.searchInput.value;
      renderMenu();
      if (state.menuAccepted && state.query.trim().length >= 2) ANALYTICS_ADAPTER.track("search", { queryLength: state.query.trim().length });
    });

    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape") {
        if (state.activeModal) closeModal();
        else if (elements.searchPanel.classList.contains("is-open")) setSearchOpen(false, false);
      }
      trapFocus(event);
    });

    window.addEventListener("scroll", () => {
      const threshold = Math.min(340, elements.hero.offsetHeight * 0.56);
      elements.sticky.classList.toggle("is-visible", window.scrollY > threshold);
    }, { passive: true });

    window.addEventListener("pagehide", () => {
      if (state.menuAccepted) ANALYTICS_ADAPTER.track("menu_exit");
    });

    document.querySelectorAll("[data-modal-panel]").forEach((panel) => {
      panel.addEventListener("pointerdown", (event) => {
        if (event.pointerType === "mouse" || panel.scrollTop > 0) return;
        touchStart = { x: event.clientX, y: event.clientY, panel };
      });
      panel.addEventListener("pointerup", (event) => {
        if (!touchStart || touchStart.panel !== panel) return;
        const deltaY = event.clientY - touchStart.y;
        const deltaX = Math.abs(event.clientX - touchStart.x);
        touchStart = null;
        if (deltaY > 110 && deltaX < 70) closeModal();
      });
      panel.addEventListener("pointercancel", () => { touchStart = null; });
    });
  }

  function initObservers() {
    revealObserver = new IntersectionObserver((entries, observer) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add("is-visible");
        observer.unobserve(entry.target);
      });
    }, { rootMargin: "0px 0px -9% 0px", threshold: 0.08 });
  }

  async function init() {
    const editorEnabled = readVenueParams();
    try {
      const storedLanguage = localStorage.getItem("exort-demo-menu-language");
      if (copy[storedLanguage]) state.language = storedLanguage;
    } catch {}
    initObservers();
    applyVenue();
    applyCopy();
    bindEvents();
    try {
      await hydrateLiveMenu();
      applyVenue();
      applyCopy();
      renderCategoryNav();
      renderMenu();
      elements.loaderAccept.disabled = false;
      requestAnimationFrame(() => elements.loaderAccept.focus());
    } catch (error) {
      console.error("[exort-demo-menu] Не удалось загрузить актуальное меню", error);
      elements.loaderAccept.dataset.loaderRetry = "true";
      elements.loaderAccept.disabled = false;
      elements.loaderAccept.textContent = "Повторить загрузку";
      const loaderTitle = document.querySelector("#loader-title");
      if (loaderTitle) loaderTitle.textContent = "Меню временно не загрузилось";
    }
    setupEditor(editorEnabled);
  }

  init();
})();
