(() => {
  "use strict";

  const RESTAURANT_SLUG = document.body.dataset.restaurantSlug || "leeyou";
  const PUBLIC_MENU_API = window.location.hostname.endsWith(".exort.kz")
    ? "https://exort.kz/api/exort-admin"
    : "/api/exort-admin";
  const SUPPORTED_LANGUAGES = ["ru", "kk", "en"];
  const ANALYTICS_EVENTS = new Set([
    "menu_open", "session_start", "category_view", "dish_open", "dish_close",
    "search", "search_no_results", "language_change", "menu_exit",
  ]);

  const copy = {
    ru: {
      viewMenu: "Смотреть меню",
      aboutLink: "О заведении",
      cancel: "Отмена",
      searchPlaceholder: "Блюдо, напиток или ингредиент",
      todayEyebrow: "ВЫБОР",
      todayTitle: "Популярные позиции",
      todayText: "То, что гости выбирают чаще всего.",
      nothingFound: "Ничего не нашли",
      tryAnother: "Попробуйте другое название или ингредиент.",
      resetSearch: "Сбросить поиск",
      aboutEyebrow: "О ЗАВЕДЕНИИ",
      addressLabel: "Адрес",
      hoursLabel: "Режим работы",
      phoneLabel: "Телефон",
      serviceLabel: "Сервис",
      serviceValue: (percent) => `Сервисный сбор · ${percent}%`,
      additionalLabel: "Дополнительно",
      poweredBy: "Меню работает на",
      wantMenu: "Хочу такое меню",
      popular: "Популярное",
      items: "позиций",
      ingredients: "Состав",
      allergens: "Аллергены",
      noAllergens: "Уточните у команды",
      pairs: "Сочетается с",
      spice: "Острота",
      spiceMild: "Низкая",
      spiceMedium: "Средняя",
      spiceHot: "Острая",
      available: "Доступно сегодня",
      unavailable: "Временно недоступно",
      loadError: "Меню временно не загрузилось. Обновите страницу.",
      loading: "Загружаем меню…",
    },
    kk: {
      viewMenu: "Мәзірді көру",
      aboutLink: "Мекеме туралы",
      cancel: "Бас тарту",
      searchPlaceholder: "Тағам, сусын немесе ингредиент",
      todayEyebrow: "ТАҢДАУ",
      todayTitle: "Танымал позициялар",
      todayText: "Қонақтар жиі таңдайтын дәмдер.",
      nothingFound: "Ештеңе табылмады",
      tryAnother: "Басқа атауды немесе ингредиентті қолданып көріңіз.",
      resetSearch: "Іздеуді тазарту",
      aboutEyebrow: "МЕКЕМЕ ТУРАЛЫ",
      addressLabel: "Мекенжай",
      hoursLabel: "Жұмыс уақыты",
      phoneLabel: "Телефон",
      serviceLabel: "Сервис",
      serviceValue: (percent) => `Қызмет көрсету ақысы · ${percent}%`,
      additionalLabel: "Қосымша",
      poweredBy: "Мәзір платформасы",
      wantMenu: "Осындай мәзір керек",
      popular: "Танымал",
      items: "позиция",
      ingredients: "Құрамы",
      allergens: "Аллергендер",
      noAllergens: "Командадан нақтылаңыз",
      pairs: "Үйлеседі",
      spice: "Ащылық",
      spiceMild: "Төмен",
      spiceMedium: "Орташа",
      spiceHot: "Ащы",
      available: "Бүгін бар",
      unavailable: "Уақытша жоқ",
      loadError: "Мәзір уақытша жүктелмеді. Бетті жаңартыңыз.",
      loading: "Мәзір жүктелуде…",
    },
    en: {
      viewMenu: "Explore menu",
      aboutLink: "About",
      cancel: "Cancel",
      searchPlaceholder: "Dish, drink or ingredient",
      todayEyebrow: "SELECTION",
      todayTitle: "Popular choices",
      todayText: "The dishes our guests choose most often.",
      nothingFound: "Nothing found",
      tryAnother: "Try another name or ingredient.",
      resetSearch: "Reset search",
      aboutEyebrow: "ABOUT",
      addressLabel: "Address",
      hoursLabel: "Opening hours",
      phoneLabel: "Phone",
      serviceLabel: "Service",
      serviceValue: (percent) => `Service charge · ${percent}%`,
      additionalLabel: "Additional",
      poweredBy: "Menu powered by",
      wantMenu: "I want this menu",
      popular: "Popular",
      items: "items",
      ingredients: "Details",
      allergens: "Allergens",
      noAllergens: "Please ask our team",
      pairs: "Pairs with",
      spice: "Spice level",
      spiceMild: "Mild",
      spiceMedium: "Medium",
      spiceHot: "Hot",
      available: "Available today",
      unavailable: "Temporarily unavailable",
      loadError: "The menu could not be loaded. Please refresh the page.",
      loading: "Loading menu…",
    },
  };

  const state = {
    language: "ru",
    restaurant: null,
    categories: [],
    items: [],
    query: "",
    sheetItem: null,
    infoOpen: false,
    lastTrigger: null,
    dishOpenedAt: 0,
    menuOpenedAt: 0,
    analyticsStarted: false,
    touchStartY: 0,
    touchDeltaY: 0,
  };

  const els = {
    loading: document.querySelector("[data-loading-message]"),
    hero: document.querySelector("[data-venue-hero]"),
    atmosphere: document.querySelector("[data-atmosphere-image]"),
    wordmark: document.querySelector("[data-venue-wordmark]"),
    wordmarkText: document.querySelector("[data-venue-wordmark-text]"),
    logo: document.querySelector("[data-venue-logo]"),
    aside: document.querySelector("[data-venue-aside]"),
    featuredEyebrow: document.querySelector("[data-featured-eyebrow]"),
    heading: document.querySelector("[data-venue-heading]"),
    statusRow: document.querySelector("[data-venue-status-row]"),
    status: document.querySelector("[data-venue-status]"),
    subtitle: document.querySelector("[data-venue-subtitle]"),
    address: document.querySelector("[data-venue-address]"),
    aboutTitle: document.querySelector("[data-venue-about-title]"),
    about: document.querySelector("[data-venue-about]"),
    nav: document.querySelector("[data-category-nav]"),
    featured: document.querySelector("[data-featured-grid]"),
    sections: document.querySelector("[data-menu-sections]"),
    empty: document.querySelector("[data-empty-state]"),
    drawer: document.querySelector("[data-search-drawer]"),
    search: document.querySelector("[data-search-input]"),
    sheetLayer: document.querySelector("[data-sheet-layer]"),
    sheet: document.querySelector("[data-product-sheet]"),
    sheetContent: document.querySelector("[data-sheet-content]"),
    infoLayer: document.querySelector("[data-info-layer]"),
    infoModal: document.querySelector("[data-info-modal]"),
    infoLogo: document.querySelector("[data-info-logo]"),
    infoName: document.querySelector("[data-info-name]"),
    infoAbout: document.querySelector("[data-info-about]"),
    infoList: document.querySelector("[data-info-list]"),
  };

  function t(key) {
    return copy[state.language]?.[key] || copy.ru[key] || key;
  }

  function getAnalyticsSessionId() {
    const key = `exort-menu-session:${RESTAURANT_SLUG}`;
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

  function trackAnalytics(eventType, extra = {}) {
    if (!ANALYTICS_EVENTS.has(eventType) || ["localhost", "127.0.0.1"].includes(location.hostname)) return false;
    const sourceParams = new URLSearchParams(location.search);
    const rawSource = sourceParams.get("source") || sourceParams.get("source_id") || sourceParams.get("qr_id") || "";
    const sourcePublicId = /^[A-Za-z0-9_-]{12,64}$/.test(rawSource) ? rawSource : "";
    const payload = {
      action: "trackAnalyticsEvent",
      restaurantSlug: RESTAURANT_SLUG,
      eventType,
      language: state.language,
      deviceType: innerWidth < 768 ? "mobile" : innerWidth < 1024 ? "tablet" : "desktop",
      sessionId: getAnalyticsSessionId(),
      menuPageId: RESTAURANT_SLUG,
      sourcePublicId,
      sourceFallback: sourcePublicId ? "QR-код" : rawSource ? "Источник не определён" : "Прямой переход",
      userAgent: navigator.userAgent || "",
      referrer: document.referrer || "",
      ...extra,
    };
    const body = JSON.stringify(payload);
    try {
      if (navigator.sendBeacon?.(PUBLIC_MENU_API, new Blob([body], { type: "application/json" }))) return true;
    } catch {}
    fetch(PUBLIC_MENU_API, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body,
      keepalive: true,
    }).catch(() => {});
    return true;
  }

  function startAnalytics() {
    if (state.analyticsStarted) return;
    state.analyticsStarted = true;
    state.menuOpenedAt = Date.now();
    trackAnalytics("session_start");
    trackAnalytics("menu_open");
  }

  function escapeHtml(value) {
    return String(value ?? "")
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
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

  function localized(record, base) {
    if (!record) return "";
    const suffixes = state.language === "kk" ? ["kk", "kz", "ru", "en"] : [state.language, "ru", "en", "kk", "kz"];
    for (const suffix of suffixes) {
      const value = record[`${base}_${suffix}`];
      if (typeof value === "string" && value.trim()) return value.trim();
    }
    return "";
  }

  function itemName(item) {
    return localized(item, "title") || localized(item, "name") || "";
  }

  function categoryName(category) {
    return localized(category, "title") || localized(category, "name") || "";
  }

  function itemDescription(item) {
    return localized(item, "description");
  }

  function isAvailable(item) {
    if (item.is_active === false || item.is_stoplisted === true) return false;
    if (!item.inactive_until) return true;
    return new Date(item.inactive_until).getTime() <= Date.now();
  }

  function formatPrice(item) {
    const amount = Number(item.price);
    if (!Number.isFinite(amount)) return "";
    const currency = item.currency || "₸";
    return `${new Intl.NumberFormat("ru-RU").format(amount)} ${currency}`;
  }

  function formatOldPrice(item) {
    const amount = Number(item.old_price);
    if (!Number.isFinite(amount) || amount <= Number(item.price)) return "";
    return `${new Intl.NumberFormat("ru-RU").format(amount)} ${item.currency || "₸"}`;
  }

  function itemMeta(item) {
    return [item.weight, item.calories ? `${item.calories} ккал` : ""].filter(Boolean).join(" · ");
  }

  function itemBadge(item) {
    return localized(item, "badge");
  }

  function spiceLabel(item) {
    const labels = { mild: "spiceMild", medium: "spiceMedium", hot: "spiceHot" };
    return labels[item.spice_level] ? t(labels[item.spice_level]) : "";
  }

  function profileValue(base) {
    return localized(state.restaurant, base);
  }

  function renderStackedBrand(target) {
    const first = state.restaurant?.brand_line_1 || state.restaurant?.name || "";
    const second = state.restaurant?.brand_line_2 || "";
    target.innerHTML = [first, second].filter(Boolean).map((line) => `<span>${escapeHtml(line)}</span>`).join("");
  }

  function serviceFeeValue() {
    const value = Number(state.restaurant?.service_fee_percent);
    if (!Number.isFinite(value) || value <= 0) return "";
    const formatter = copy[state.language]?.serviceValue || copy.ru.serviceValue;
    return formatter(new Intl.NumberFormat(state.language === "en" ? "en-US" : "ru-RU", { maximumFractionDigits: 2 }).format(value));
  }

  function setProfileField(name, value, url = "") {
    const row = document.querySelector(`[data-profile-field="${name}"]`);
    const target = document.querySelector(`[data-profile-${name}]`);
    if (!row || !target) return;
    row.hidden = !value;
    target.innerHTML = value
      ? url
        ? `<a class="profile-link" href="${escapeHtml(url)}" target="_blank" rel="noopener noreferrer">${escapeHtml(value)}</a>`
        : escapeHtml(value)
      : "";
  }

  function profileRows() {
    const restaurant = state.restaurant || {};
    return [
      { label: t("addressLabel"), value: profileValue("address"), url: restaurant.address_url },
      { label: t("hoursLabel"), value: profileValue("hours") },
      { label: t("serviceLabel"), value: serviceFeeValue() },
      { label: "Instagram", value: restaurant.instagram_handle || restaurant.instagram_url, url: restaurant.instagram_url },
      { label: t("phoneLabel"), value: restaurant.phone, url: restaurant.phone ? `tel:${restaurant.phone.replace(/[^+\d]/g, "")}` : "" },
      { label: "WhatsApp", value: restaurant.whatsapp_label || restaurant.whatsapp_url, url: restaurant.whatsapp_url },
      { label: "Wi-Fi", value: restaurant.wifi_name },
      { label: t("additionalLabel"), value: profileValue("additional_info") },
    ].filter((row) => row.value);
  }

  function applyRestaurantProfile() {
    const restaurant = state.restaurant;
    if (!restaurant) return;
    document.title = `${restaurant.name} | Цифровое меню`;
    const heroUrl = safePublicImage(restaurant.hero_image_url || restaurant.menu_cover_url);
    els.hero.src = heroUrl;
    els.hero.alt = restaurant.name ? `${restaurant.name}: интерьер заведения` : "";
    els.hero.hidden = !heroUrl;
    if (heroUrl) els.atmosphere.style.backgroundImage = `url("${heroUrl.replaceAll('"', "%22")}")`;

    renderStackedBrand(els.wordmarkText);
    renderStackedBrand(els.heading);
    els.wordmark.setAttribute("aria-label", `${restaurant.name}, наверх`);
    els.aside.setAttribute("aria-label", restaurant.name || "");
    const logoUrl = safePublicImage(restaurant.logo_url);
    els.logo.hidden = !logoUrl;
    els.wordmarkText.hidden = Boolean(logoUrl);
    if (logoUrl) {
      els.logo.src = logoUrl;
      els.logo.alt = restaurant.name || "";
    }
    els.status.textContent = profileValue("open_status");
    els.statusRow.hidden = !els.status.textContent;
    els.subtitle.textContent = profileValue("subtitle");
    els.subtitle.hidden = !els.subtitle.textContent;
    els.address.textContent = profileValue("address");
    els.address.hidden = !els.address.textContent;
    els.aboutTitle.textContent = restaurant.name || "";
    els.about.textContent = profileValue("about");
    els.about.hidden = !els.about.textContent;

    setProfileField("address", profileValue("address"), restaurant.address_url);
    setProfileField("hours", profileValue("hours"));
    setProfileField("service", serviceFeeValue());
    setProfileField("instagram", restaurant.instagram_handle || restaurant.instagram_url, restaurant.instagram_url);
    setProfileField("phone", restaurant.phone, restaurant.phone ? `tel:${restaurant.phone.replace(/[^+\d]/g, "")}` : "");
    setProfileField("whatsapp", restaurant.whatsapp_label || restaurant.whatsapp_url, restaurant.whatsapp_url);
    setProfileField("wifi", restaurant.wifi_name);
    setProfileField("additional", profileValue("additional_info"));

    els.infoName.textContent = restaurant.name || "";
    els.infoAbout.textContent = profileValue("about");
    els.infoAbout.hidden = !els.infoAbout.textContent;
    els.infoLogo.hidden = !logoUrl;
    if (logoUrl) {
      els.infoLogo.src = logoUrl;
      els.infoLogo.alt = restaurant.name || "";
    }
    els.infoList.innerHTML = profileRows()
      .map((row) => `
        <div class="info-row">
          <span>${escapeHtml(row.label)}</span>
          <strong>${row.url
            ? `<a class="profile-link" href="${escapeHtml(row.url)}" target="_blank" rel="noopener noreferrer">${escapeHtml(row.value)}</a>`
            : escapeHtml(row.value)}</strong>
        </div>
      `)
      .join("");
  }

  function itemMatches(item) {
    const query = state.query.trim().toLocaleLowerCase(state.language);
    if (!query) return true;
    return [itemName(item), itemDescription(item), itemMeta(item), itemBadge(item), spiceLabel(item), categoryName(state.categories.find((category) => category.id === item.category_id))]
      .join(" ")
      .toLocaleLowerCase(state.language)
      .includes(query);
  }

  function renderNav() {
    const visible = state.categories.filter((category) =>
      state.items.some((item) => item.category_id === category.id && itemMatches(item)),
    );
    els.nav.innerHTML = [
      !state.query.trim() && state.items.length
        ? `<button type="button" class="is-active" data-nav-target="popular">${escapeHtml(t("popular"))}</button>`
        : "",
      ...visible.map((category) => `<button type="button" data-nav-target="category-${category.id}">${escapeHtml(categoryName(category))}</button>`),
    ].join("");
  }

  function renderFeatured() {
    const featured = state.items.filter((item) => isAvailable(item) && item.image_url && itemMatches(item)).slice(0, 4);
    const section = els.featured.closest(".intro-section");
    section.id = "popular";
    section.style.display = featured.length && !state.query.trim() ? "" : "none";
    els.featured.innerHTML = featured.map((item) => `
      <button class="featured-card" type="button" data-item-id="${item.id}" aria-label="${escapeHtml(itemName(item))}">
        ${item.image_url ? `<img src="${escapeHtml(item.image_url)}" alt="${escapeHtml(itemName(item))}" loading="lazy" />` : ""}
        <span class="featured-card__content">
          ${itemBadge(item) ? `<span class="featured-card__badge">${escapeHtml(itemBadge(item))}</span>` : ""}
          <h3>${escapeHtml(itemName(item))}</h3>
          <span class="featured-card__meta">
            <span>${escapeHtml(itemMeta(item))}</span>
            <strong>${formatOldPrice(item) ? `<del>${escapeHtml(formatOldPrice(item))}</del>` : ""}${escapeHtml(formatPrice(item))}</strong>
          </span>
        </span>
      </button>
    `).join("");
  }

  function renderCard(item) {
    const available = isAvailable(item);
    return `
      <button class="menu-card${item.image_url ? "" : " menu-card--no-image"}${available ? "" : " menu-card--unavailable"}"
        type="button" data-item-id="${item.id}" aria-label="${escapeHtml(itemName(item))}">
        <span class="menu-card__copy">
          <span class="menu-card__title-row"><h3>${escapeHtml(itemName(item))}</h3></span>
          ${itemDescription(item) ? `<span class="menu-card__description">${escapeHtml(itemDescription(item))}</span>` : ""}
          <span class="menu-card__footer">
            <span class="menu-card__meta">${escapeHtml(itemMeta(item))}</span>
            <strong class="menu-card__price">${formatOldPrice(item) ? `<del>${escapeHtml(formatOldPrice(item))}</del>` : ""}${escapeHtml(formatPrice(item))}</strong>
          </span>
        </span>
        ${item.image_url ? `
          <span class="menu-card__image">
            <img src="${escapeHtml(item.image_url)}" alt="${escapeHtml(itemName(item))}" loading="lazy" />
            ${itemBadge(item) ? `<span class="item-badge">${escapeHtml(itemBadge(item))}</span>` : ""}
          </span>` : ""}
      </button>
    `;
  }

  function renderSections() {
    let count = 0;
    els.sections.innerHTML = state.categories.map((category) => {
      const items = state.items.filter((item) => item.category_id === category.id && itemMatches(item));
      if (!items.length) return "";
      count += items.length;
      return `
        <section class="menu-section" id="category-${category.id}" data-menu-section>
          <header class="menu-section__header">
            <div><h2>${escapeHtml(categoryName(category))}</h2></div>
            <p>${items.length} ${escapeHtml(t("items"))}</p>
          </header>
          <div class="menu-list">${items.map(renderCard).join("")}</div>
        </section>
      `;
    }).join("");
    els.empty.hidden = count > 0;
  }

  function updateStaticCopy() {
    document.documentElement.lang = state.language === "kk" ? "kk" : state.language;
    document.querySelectorAll("[data-copy]").forEach((node) => {
      node.textContent = t(node.dataset.copy);
    });
    els.featuredEyebrow.textContent = [t("todayEyebrow"), state.restaurant?.name].filter(Boolean).join(" ");
    els.search.placeholder = t("searchPlaceholder");
    els.loading.textContent = t("loading");
    document.querySelectorAll("[data-language]").forEach((button) => {
      button.classList.toggle("is-active", button.dataset.language === state.language);
    });
  }

  function renderAll() {
    updateStaticCopy();
    applyRestaurantProfile();
    renderNav();
    renderFeatured();
    renderSections();
    requestAnimationFrame(observeSections);
  }

  let sectionObserver;
  function observeSections() {
    sectionObserver?.disconnect();
    const sections = document.querySelectorAll("#popular, [data-menu-section]");
    if (!sections.length || !("IntersectionObserver" in window)) return;
    sectionObserver = new IntersectionObserver((entries) => {
      const visible = entries
        .filter((entry) => entry.isIntersecting)
        .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
      if (!visible) return;
      const target = visible.target.id;
      const active = els.nav.querySelector(`[data-nav-target="${target}"]`);
      if (!active) return;
      els.nav.querySelectorAll("button").forEach((button) => button.classList.toggle("is-active", button === active));
      active.scrollIntoView({ behavior: "smooth", inline: "center", block: "nearest" });
    }, { rootMargin: "-72px 0px -55%", threshold: [0.05, 0.2, 0.5] });
    sections.forEach((section) => {
      if (section.style.display !== "none") sectionObserver.observe(section);
    });
  }

  function openSearch() {
    els.drawer.classList.add("is-open");
    els.drawer.setAttribute("aria-hidden", "false");
    setTimeout(() => els.search.focus(), 220);
  }

  function closeSearch({ reset = false } = {}) {
    if (reset) {
      state.query = "";
      els.search.value = "";
      renderAll();
    }
    els.drawer.classList.remove("is-open");
    els.drawer.setAttribute("aria-hidden", "true");
  }

  function recommendedItems(item) {
    const candidates = state.items.filter((candidate) => candidate.id !== item.id && isAvailable(candidate));
    return [
      ...candidates.filter((candidate) => candidate.category_id === item.category_id),
      ...candidates.filter((candidate) => candidate.category_id !== item.category_id),
    ].slice(0, 2);
  }

  function renderRecommendation(item) {
    const placeholder = state.restaurant?.brand_line_1 || state.restaurant?.name?.slice(0, 1) || "•";
    return `
      <button type="button" data-recommendation-id="${escapeHtml(item.id)}">
        ${item.image_url
          ? `<img src="${escapeHtml(item.image_url)}" alt="" loading="lazy" />`
          : `<span class="sheet-pairing-placeholder" aria-hidden="true">${escapeHtml(placeholder)}</span>`}
        <span><strong>${escapeHtml(itemName(item))}</strong><small>${escapeHtml(formatPrice(item))}</small></span>
      </button>`;
  }

  function openSheet(itemId, trigger = null, shouldTrack = true) {
    const item = state.items.find((candidate) => candidate.id === itemId);
    if (!item) return;
    const recommendations = recommendedItems(item);
    state.sheetItem = item;
    if (shouldTrack) {
      state.lastTrigger = trigger || document.activeElement;
      state.dishOpenedAt = Date.now();
    }
    const placeholder = state.restaurant?.brand_line_1 || state.restaurant?.name?.slice(0, 1) || "•";
    els.sheetContent.innerHTML = `
      ${item.image_url ? `<img class="sheet-image" src="${escapeHtml(item.image_url)}" alt="${escapeHtml(itemName(item))}" />` : `<div class="sheet-image-placeholder">${escapeHtml(placeholder)}</div>`}
      <div class="sheet-body">
        <div class="sheet-body__top">
          <h2 id="sheet-title">${escapeHtml(itemName(item))}</h2>
          <strong class="sheet-price">${formatOldPrice(item) ? `<del>${escapeHtml(formatOldPrice(item))}</del>` : ""}${escapeHtml(formatPrice(item))}</strong>
        </div>
        ${itemDescription(item) ? `<p class="sheet-description">${escapeHtml(itemDescription(item))}</p>` : ""}
        <div class="sheet-meta">
          ${itemMeta(item) ? `<span>${escapeHtml(itemMeta(item))}</span>` : ""}
          ${itemBadge(item) ? `<span>${escapeHtml(itemBadge(item))}</span>` : ""}
          ${spiceLabel(item) ? `<span>${escapeHtml(t("spice"))}: ${escapeHtml(spiceLabel(item))}</span>` : ""}
        </div>
        ${itemDescription(item) ? `
          <div class="sheet-facts">
            <div class="sheet-fact"><span>${escapeHtml(t("ingredients"))}</span><strong>${escapeHtml(itemDescription(item))}</strong></div>
            <div class="sheet-fact"><span>${escapeHtml(t("allergens"))}</span><strong>${escapeHtml(t("noAllergens"))}</strong></div>
          </div>` : ""}
        <div class="availability${isAvailable(item) ? "" : " is-unavailable"}">${escapeHtml(t(isAvailable(item) ? "available" : "unavailable"))}</div>
        ${recommendations.length ? `
          <div class="sheet-pairings">
            <h3>${escapeHtml(t("pairs"))}</h3>
            <div class="sheet-pairing-list">${recommendations.map(renderRecommendation).join("")}</div>
          </div>` : ""}
      </div>
    `;
    els.sheetLayer.classList.add("is-open");
    els.sheetLayer.setAttribute("aria-hidden", "false");
    document.body.classList.add("is-sheet-open");
    els.sheet.scrollTop = 0;
    setTimeout(() => document.querySelector("[data-sheet-close].sheet-close")?.focus(), 330);
    if (shouldTrack) trackAnalytics("dish_open", { menuItemId: item.id });
  }

  function closeSheet() {
    els.sheetLayer.classList.remove("is-open");
    els.sheetLayer.setAttribute("aria-hidden", "true");
    document.body.classList.remove("is-sheet-open");
    if (state.sheetItem && state.dishOpenedAt) {
      trackAnalytics("dish_close", {
        menuItemId: state.sheetItem.id,
        durationMs: Date.now() - state.dishOpenedAt,
      });
    }
    state.sheetItem = null;
    state.dishOpenedAt = 0;
    els.sheet.style.transform = "";
    const returnTarget = state.lastTrigger;
    state.lastTrigger = null;
    setTimeout(() => returnTarget?.focus?.(), 0);
  }

  function openInfo() {
    state.infoOpen = true;
    state.lastTrigger = document.activeElement;
    els.infoLayer.classList.add("is-open");
    els.infoLayer.setAttribute("aria-hidden", "false");
    document.body.classList.add("is-info-open");
    els.infoModal.scrollTop = 0;
    setTimeout(() => els.infoLayer.querySelector(".restaurant-info-close")?.focus(), 50);
  }

  function closeInfo() {
    state.infoOpen = false;
    els.infoLayer.classList.remove("is-open");
    els.infoLayer.setAttribute("aria-hidden", "true");
    document.body.classList.remove("is-info-open");
    const returnTarget = state.lastTrigger;
    state.lastTrigger = null;
    setTimeout(() => returnTarget?.focus?.(), 0);
  }

  function trapFocus(event) {
    if (event.key !== "Tab") return;
    const modal = state.infoOpen ? els.infoModal : state.sheetItem ? els.sheet : null;
    if (!modal) return;
    const focusable = [...modal.querySelectorAll('button:not([disabled]), a[href], input:not([disabled]), [tabindex]:not([tabindex="-1"])')]
      .filter((element) => !element.hidden && element.getClientRects().length > 0);
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

  document.addEventListener("click", (event) => {
    const language = event.target.closest("[data-language]");
    if (language) {
      state.language = language.dataset.language;
      try { localStorage.setItem(`lee_you_menu_language_${RESTAURANT_SLUG}`, state.language); } catch {}
      renderAll();
      if (state.sheetItem) openSheet(state.sheetItem.id, null, false);
      trackAnalytics("language_change", { language: state.language });
      return;
    }
    if (event.target.closest("[data-search-toggle]")) return openSearch();
    if (event.target.closest("[data-search-close]")) return closeSearch();
    if (event.target.closest("[data-search-clear]")) {
      state.query = "";
      els.search.value = "";
      els.search.focus();
      return renderAll();
    }
    if (event.target.closest("[data-reset-search]")) return closeSearch({ reset: true });
    if (event.target.closest("[data-scroll-menu]")) return document.querySelector("#popular")?.scrollIntoView({ behavior: "smooth" });
    if (event.target.closest("[data-info-open]")) return openInfo();
    if (event.target.closest("[data-info-close]")) return closeInfo();
    const navButton = event.target.closest("[data-nav-target]");
    if (navButton) {
      document.getElementById(navButton.dataset.navTarget)?.scrollIntoView({ behavior: "smooth", block: "start" });
      trackAnalytics("category_view", { categoryId: navButton.dataset.navTarget.replace(/^category-/, "") });
      return;
    }
    const card = event.target.closest("[data-item-id]");
    if (card) return openSheet(card.dataset.itemId, card);
    const recommendation = event.target.closest("[data-recommendation-id]");
    if (recommendation) return openSheet(recommendation.dataset.recommendationId, state.lastTrigger);
    if (event.target.closest("[data-sheet-close]")) return closeSheet();
  });

  els.search.addEventListener("input", () => {
    state.query = els.search.value;
    renderAll();
    const queryLength = state.query.trim().length;
    if (queryLength >= 2) {
      trackAnalytics("search", { queryLength });
      if (!state.items.some(itemMatches)) trackAnalytics("search_no_results", { queryLength });
    }
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
      if (state.infoOpen) closeInfo();
      else if (state.sheetItem) closeSheet();
      else if (els.drawer.classList.contains("is-open")) closeSearch();
    }
    trapFocus(event);
  });

  window.addEventListener("pagehide", () => {
    if (!state.analyticsStarted || !state.menuOpenedAt) return;
    trackAnalytics("menu_exit", { durationMs: Date.now() - state.menuOpenedAt });
  });

  els.sheet.addEventListener("touchstart", (event) => {
    if (els.sheet.scrollTop > 0) return;
    state.touchStartY = event.touches[0].clientY;
    state.touchDeltaY = 0;
  }, { passive: true });

  els.sheet.addEventListener("touchmove", (event) => {
    if (!state.touchStartY || els.sheet.scrollTop > 0) return;
    state.touchDeltaY = Math.max(0, event.touches[0].clientY - state.touchStartY);
    if (state.touchDeltaY > 0) els.sheet.style.transform = `translateY(${Math.min(state.touchDeltaY, 180)}px)`;
  }, { passive: true });

  els.sheet.addEventListener("touchend", () => {
    if (state.touchDeltaY > 105) closeSheet();
    else els.sheet.style.transform = "";
    state.touchStartY = 0;
    state.touchDeltaY = 0;
  }, { passive: true });

  async function loadMenu() {
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 12000);
      const response = await fetch(PUBLIC_MENU_API, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "getPublicMenuData", restaurantSlug: RESTAURANT_SLUG }),
        signal: controller.signal,
      });
      clearTimeout(timeout);
      const payload = await response.json().catch(() => ({}));
      if (!response.ok || !payload.restaurant) throw new Error(payload.error || `HTTP ${response.status}`);
      state.restaurant = payload.restaurant;
      state.categories = (payload.categories || [])
        .filter((category) => category.is_active !== false)
        .sort((a, b) => Number(a.sort_order || 0) - Number(b.sort_order || 0));
      const categoryIds = new Set(state.categories.map((category) => category.id));
      state.items = (payload.items || [])
        .filter((item) => categoryIds.has(item.category_id))
        .map((item) => ({ ...item, image_url: safePublicImage(item.image_url) }))
        .sort((a, b) => Number(a.sort_order || 0) - Number(b.sort_order || 0));
      const supported = Array.isArray(state.restaurant.supported_languages)
        ? state.restaurant.supported_languages.filter((language) => SUPPORTED_LANGUAGES.includes(language))
        : SUPPORTED_LANGUAGES;
      document.querySelectorAll("[data-language]").forEach((button) => {
        button.hidden = supported.length > 0 && !supported.includes(button.dataset.language);
      });
      if (!supported.includes(state.language)) state.language = supported[0] || "ru";
      renderAll();
      document.body.classList.remove("is-menu-loading");
      document.body.classList.add("is-menu-ready");
      startAnalytics();
    } catch (error) {
      console.error("[public-menu] Failed to load restaurant data:", error);
      els.loading.classList.add("menu-loading__error");
      els.loading.textContent = t("loadError");
    }
  }

  try {
    const saved = localStorage.getItem(`lee_you_menu_language_${RESTAURANT_SLUG}`);
    if (SUPPORTED_LANGUAGES.includes(saved)) state.language = saved;
  } catch {}

  updateStaticCopy();
  loadMenu();
})();
