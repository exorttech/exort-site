(function () {
  "use strict";

  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => Array.from(root.querySelectorAll(selector));
  const asset = (name) => `../assets/demo-menu/${name}`;
  const clone = (value) => JSON.parse(JSON.stringify(value));
  const uid = (prefix) => `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;
  const escapeHtml = (value = "") => String(value).replace(/[&<>'"]/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;" }[char]));
  const money = (value) => `${Number(value || 0).toLocaleString("ru-RU")} ₸`;
  const dateTime = (value) => value ? new Intl.DateTimeFormat("ru-RU", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" }).format(new Date(value)) : "До ручного возврата";

  const seed = {
    categories: [
      { id: "breakfast", order: 0, active: true, names: { ru: "Завтраки", kk: "Таңғы ас", en: "Breakfast", tr: "Kahvaltı" } },
      { id: "salads", order: 1, active: true, names: { ru: "Салаты", kk: "Салаттар", en: "Salads", tr: "Salatalar" } },
      { id: "hot", order: 2, active: true, names: { ru: "Горячее", kk: "Ыстық тағамдар", en: "Hot dishes", tr: "Sıcak yemekler" } },
      { id: "mains", order: 3, active: true, names: { ru: "Основные блюда", kk: "Негізгі тағамдар", en: "Main courses", tr: "Ana yemekler" } },
      { id: "drinks", order: 4, active: true, names: { ru: "Напитки", kk: "Сусындар", en: "Drinks", tr: "İçecekler" } },
      { id: "desserts", order: 5, active: true, names: { ru: "Десерты", kk: "Десерттер", en: "Desserts", tr: "Tatlılar" } }
    ],
    items: [
      { id: "syrniki", category: "breakfast", order: 0, price: 2600, oldPrice: 0, weight: "260 г", badge: "Хит", image: asset("pancakes.webp"), active: true, availability: "active", until: "", names: { ru: "Сырники с ягодами", kk: "Жидек қосылған сырники", en: "Berry syrniki", tr: "Meyveli syrniki" }, descriptions: { ru: "Творожные сырники, сезонные ягоды и ванильный крем", kk: "Сүзбелі сырники, маусымдық жидектер және ванильді крем", en: "Cottage cheese pancakes, seasonal berries and vanilla cream", tr: "Lor pankekleri, mevsim meyveleri ve vanilyalı krema" } },
      { id: "english", category: "breakfast", order: 1, price: 3900, oldPrice: 0, weight: "420 г", badge: "", image: asset("eggs.webp"), active: true, availability: "active", until: "", names: { ru: "Английский завтрак", kk: "Ағылшын таңғы асы", en: "English breakfast", tr: "İngiliz kahvaltısı" }, descriptions: { ru: "Яйца, фасоль, томаты, грибы и хлеб на закваске", kk: "Жұмыртқа, бұршақ, қызанақ, саңырауқұлақ және нан", en: "Eggs, beans, tomatoes, mushrooms and sourdough", tr: "Yumurta, fasulye, domates, mantar ve ekşi mayalı ekmek" } },
      { id: "avocado", category: "breakfast", order: 2, price: 3400, oldPrice: 3700, weight: "280 г", badge: "Новинка", image: asset("sandwich.webp"), active: true, availability: "active", until: "", names: { ru: "Тост с авокадо", kk: "Авокадо қосылған тост", en: "Avocado toast", tr: "Avokadolu tost" }, descriptions: { ru: "Авокадо, яйцо пашот, томаты и хлеб на закваске", kk: "Авокадо, пашот жұмыртқасы, қызанақ және нан", en: "Avocado, poached egg, tomatoes and sourdough", tr: "Avokado, poşe yumurta, domates ve ekşi mayalı ekmek" } },
      { id: "caesar", category: "salads", order: 0, price: 3100, oldPrice: 0, weight: "300 г", badge: "", image: asset("salad.webp"), active: true, availability: "active", until: "", names: { ru: "Цезарь с курицей", kk: "Тауық еті қосылған Цезарь", en: "Chicken Caesar", tr: "Tavuklu Sezar" }, descriptions: { ru: "Романо, куриное филе, пармезан и фирменный соус", kk: "Романо, тауық еті, пармезан және фирмалық тұздық", en: "Romaine, chicken fillet, parmesan and house dressing", tr: "Romaine, tavuk fileto, parmesan ve özel sos" } },
      { id: "vegetable", category: "salads", order: 1, price: 2200, oldPrice: 0, weight: "250 г", badge: "V", image: "", active: true, availability: "active", until: "", names: { ru: "Салат с печёными овощами", kk: "Пісірілген көкөніс салаты", en: "Roasted vegetable salad", tr: "Köz sebze salatası" }, descriptions: { ru: "Сезонные овощи, зелень, киноа и цитрусовая заправка", kk: "Маусымдық көкөністер, көк, киноа және цитрус тұздығы", en: "Seasonal vegetables, greens, quinoa and citrus dressing", tr: "Mevsim sebzeleri, yeşillik, kinoa ve narenciye sosu" } },
      { id: "ribeye", category: "hot", order: 0, price: 6900, oldPrice: 0, weight: "320 г", badge: "Chef's", image: asset("main.webp"), active: true, availability: "stop", until: "", names: { ru: "Рибай с перечным соусом", kk: "Бұрыш тұздығы қосылған рибай", en: "Ribeye with pepper sauce", tr: "Biber soslu antrikot" }, descriptions: { ru: "Стейк, молодой картофель и сливочно-перечный соус", kk: "Стейк, жас картоп және кілегейлі бұрыш тұздығы", en: "Steak, baby potatoes and creamy pepper sauce", tr: "Biftek, taze patates ve kremalı biber sosu" } },
      { id: "pasta", category: "hot", order: 1, price: 4200, oldPrice: 0, weight: "360 г", badge: "", image: asset("hero.webp"), active: true, availability: "temporary", until: "2026-07-18T22:30", names: { ru: "Паста с цыплёнком", kk: "Тауық еті қосылған паста", en: "Chicken pasta", tr: "Tavuklu makarna" }, descriptions: { ru: "Тальятелле, цыплёнок, грибы и соус пармезан", kk: "Тальятелле, тауық еті, саңырауқұлақ және пармезан тұздығы", en: "Tagliatelle, chicken, mushrooms and parmesan sauce", tr: "Tagliatelle, tavuk, mantar ve parmesan sosu" } },
      { id: "burger", category: "mains", order: 0, price: 4100, oldPrice: 0, weight: "430 г", badge: "", image: asset("sandwich.webp"), active: false, availability: "inactive", until: "", names: { ru: "Бургер с говядиной", kk: "Сиыр еті қосылған бургер", en: "Beef burger", tr: "Dana burger" }, descriptions: { ru: "Говяжья котлета, чеддер, овощи и картофель фри", kk: "Сиыр котлеті, чеддер, көкөністер және фри", en: "Beef patty, cheddar, vegetables and fries", tr: "Dana köfte, cheddar, sebze ve patates kızartması" } },
      { id: "flatwhite", category: "drinks", order: 0, price: 1400, oldPrice: 0, weight: "250 мл", badge: "", image: asset("coffee.webp"), active: true, availability: "active", until: "", names: { ru: "Флэт уайт", kk: "Флэт уайт", en: "Flat white", tr: "Flat white" }, descriptions: { ru: "Двойной эспрессо и молоко", kk: "Қос эспрессо және сүт", en: "Double espresso and milk", tr: "Çift espresso ve süt" } },
      { id: "lemonade", category: "drinks", order: 1, price: 1700, oldPrice: 0, weight: "400 мл", badge: "", image: asset("mocktail.webp"), active: true, availability: "active", until: "", names: { ru: "Лимонад юдзу–груша", kk: "Юдзу–алмұрт лимонады", en: "Yuzu pear lemonade", tr: "Yuzu armut limonata" }, descriptions: { ru: "Юдзу, груша, лимон и содовая", kk: "Юдзу, алмұрт, лимон және сода", en: "Yuzu, pear, lemon and soda", tr: "Yuzu, armut, limon ve soda" } },
      { id: "tea", category: "drinks", order: 2, price: 1900, oldPrice: 0, weight: "600 мл", badge: "", image: asset("matcha.webp"), active: true, availability: "active", until: "", names: { ru: "Ягодный чай", kk: "Жидек шайы", en: "Berry tea", tr: "" }, descriptions: { ru: "Смородина, малина, апельсин и чёрный чай", kk: "Қарақат, таңқурай, апельсин және қара шай", en: "Blackcurrant, raspberry, orange and black tea", tr: "" } },
      { id: "cheesecake", category: "desserts", order: 0, price: 2400, oldPrice: 0, weight: "150 г", badge: "Хит", image: asset("cake.webp"), active: true, availability: "active", until: "", names: { ru: "Баскский чизкейк", kk: "Баск чизкейкі", en: "Basque cheesecake", tr: "Bask cheesecake" }, descriptions: { ru: "Нежный чизкейк с карамельной корочкой", kk: "Карамель қабығы бар нәзік чизкейк", en: "Creamy cheesecake with a caramelized top", tr: "Karamelize yüzeyli kremalı cheesecake" } }
    ],
    sources: [
      { id: "main-hall", name: "Основной зал", type: "hall", publicId: "hall-a1", sessions: 1248, engagement: 62, active: true, created: "2026-06-04" },
      { id: "terrace", name: "Летняя терраса", type: "hall", publicId: "terrace-b2", sessions: 684, engagement: 71, active: true, created: "2026-06-18" },
      { id: "table-07", name: "Стол 07 · окно", type: "table", publicId: "table-c7", sessions: 219, engagement: 78, active: true, created: "2026-07-02" },
      { id: "social", name: "Социальные сети", type: "social", publicId: "social-d4", sessions: 367, engagement: 54, active: false, created: "2026-07-08" }
    ]
  };

  const state = {
    categories: clone(seed.categories), items: clone(seed.items), sources: clone(seed.sources),
    view: "overview", layout: "list", period: "today", source: "all",
    editorItemId: null, editorImage: "", editorImageObjectUrl: "", activeModal: null,
    modalTrigger: null, confirmAction: null, draggingCategory: null, saving: false
  };

  const pageMeta = {
    overview: ["Сегодня · локальное время заведения", "Обзор", "Состояние меню и интерес гостей в одном экране.", "Добавить позицию", "item"],
    menu: ["Управление контентом", "Меню", "Позиции, цены, переводы и доступность.", "Добавить позицию", "item"],
    categories: ["Структура меню", "Категории", "Порядок разделов и их видимость для гостей.", "Добавить категорию", "category"],
    stoplist: ["Доступность", "Стоп-лист", "Быстро возвращайте и временно скрывайте позиции.", "Добавить в стоп", "stop"],
    analytics: ["Интерес гостей", "Аналитика", "Демонстрационные данные без отправки событий.", "", ""],
    qr: ["Точки входа", "QR-коды и источники", "Отдельные ссылки для залов, столов и каналов.", "Создать QR-код", "qr"],
    settings: ["Профиль заведения", "Настройки", "Информация и правила, которые видит гость.", "Сохранить настройки", "settings"],
    integrations: ["Экосистема", "Интеграции", "Возможности подключения учётных систем.", "", ""]
  };

  const analytics = {
    today: { labels: ["07", "08", "09", "10", "11", "12", "13", "14", "15", "16", "17", "18", "19", "20", "21", "22", "23"], values: [8, 16, 31, 44, 38, 52, 67, 59, 47, 42, 56, 83, 112, 138, 127, 91, 43], metrics: [["Открытия меню", "1 124", "+18%"], ["Просмотры блюд", "3 486", "+11%"], ["Глубина просмотра", "3,1", "+0,4"], ["Среднее время", "4:18", "+36 сек"]] },
    "7d": { labels: ["Пн", "Вт", "Ср", "Чт", "Пт", "Сб", "Вс"], values: [842, 916, 878, 1042, 1387, 1694, 1421], metrics: [["Открытия меню", "8 180", "+12%"], ["Просмотры блюд", "24 930", "+9%"], ["Глубина просмотра", "3,0", "+0,2"], ["Среднее время", "4:06", "+18 сек"]] },
    "30d": { labels: ["1", "3", "5", "7", "9", "11", "13", "15", "17", "19", "21", "23", "25", "27", "30"], values: [782, 914, 833, 1012, 1104, 937, 1248, 1196, 1412, 1287, 1538, 1471, 1692, 1784, 1618], metrics: [["Открытия меню", "38 420", "+21%"], ["Просмотры блюд", "116 870", "+17%"], ["Глубина просмотра", "3,04", "+0,3"], ["Среднее время", "4:02", "+22 сек"]] },
    all: { labels: ["Авг", "Сен", "Окт", "Ноя", "Дек", "Янв", "Фев", "Мар", "Апр", "Май", "Июн", "Июл"], values: [5100, 6200, 7400, 8100, 9900, 8700, 9400, 11800, 13700, 16200, 19400, 22400], metrics: [["Открытия меню", "137 860", "+64%"], ["Просмотры блюд", "418 230", "+57%"], ["Глубина просмотра", "3,03", "+0,5"], ["Среднее время", "3:56", "+44 сек"]] }
  };

  const events = [
    ["19:42", "Открыта карточка", "Рибай с перечным соусом", "main-hall"],
    ["19:39", "Сменён язык", "RU → EN", "terrace"],
    ["19:35", "Поиск", "«без сахара»", "social"],
    ["19:31", "Открыта карточка", "Баскский чизкейк", "table-07"],
    ["19:26", "Просмотрено меню", "4 категории", "main-hall"],
    ["19:18", "Открыта карточка", "Лимонад юдзу–груша", "terrace"]
  ];

  function categoryById(id) { return state.categories.find((category) => category.id === id); }
  function itemById(id) { return state.items.find((item) => item.id === id); }
  function translationMissing(item) { return ["kk", "en", "tr"].some((lang) => !item.names[lang] || !item.descriptions[lang]); }
  function statusLabel(item) {
    if (!item.active || item.availability === "inactive") return ["Скрыто", "muted"];
    if (item.availability === "stop") return ["Стоп", "danger"];
    if (item.availability === "temporary") return ["Временно", "warning"];
    return ["В продаже", "success"];
  }

  function toast(message, tone = "success") {
    const region = $("[data-toast-region]");
    const node = document.createElement("div");
    node.className = `asa-toast is-${tone}`;
    node.innerHTML = `<i></i><p><strong>${escapeHtml(message)}</strong><small>Изменения действуют только в демо-сессии</small></p><button type="button" aria-label="Закрыть">×</button>`;
    $("button", node).addEventListener("click", () => node.remove());
    region.append(node);
    window.setTimeout(() => { node.classList.add("is-hiding"); window.setTimeout(() => node.remove(), 220); }, 3200);
  }

  function navigate(view) {
    if (!pageMeta[view]) return;
    state.view = view;
    $$('[data-view]').forEach((node) => node.classList.toggle("is-active", node.dataset.view === view));
    $$('[data-nav]').forEach((node) => node.classList.toggle("is-active", node.dataset.nav === view));
    const [kicker, title, description, actionLabel, actionType] = pageMeta[view];
    $("[data-page-kicker]").textContent = kicker;
    $("[data-page-title]").textContent = title;
    $("[data-page-description]").textContent = description;
    const primary = $("[data-primary-action]");
    primary.hidden = !actionLabel;
    primary.dataset.action = actionType;
    $("span", primary).textContent = actionLabel || "";
    document.title = `${title} — Exort Demo`;
    history.replaceState(null, "", `#${view}`);
    document.body.classList.remove("asa-sidebar-open");
    $("[data-sidebar-open]").setAttribute("aria-expanded", "false");
    renderView(view);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function renderView(view) {
    if (view === "overview") renderOverview();
    if (view === "menu") renderMenu();
    if (view === "categories") renderCategories();
    if (view === "stoplist") renderStoplist();
    if (view === "analytics") renderAnalytics();
    if (view === "qr") renderSources();
    if (view === "settings") renderSchedule();
    if (view === "integrations") renderIntegrations();
    updateCounts();
  }

  function updateCounts() {
    $("[data-menu-count]").textContent = state.items.length;
    const stopped = state.items.filter((item) => ["stop", "temporary"].includes(item.availability)).length;
    $("[data-stop-count]").textContent = stopped;
  }

  function renderOverview() {
    const active = state.items.filter((item) => item.active && item.availability === "active").length;
    const stopped = state.items.filter((item) => ["stop", "temporary"].includes(item.availability)).length;
    const missingPhotos = state.items.filter((item) => !item.image).length;
    const missingTranslations = state.items.filter(translationMissing).length;
    $("[data-overview-status]").innerHTML = `<div><i>✓</i><p><strong>Меню онлайн</strong><span>Последнее локальное изменение · только что</span></p></div><button type="button" data-nav-target="menu">Открыть управление <b>→</b></button>`;
    $("[data-overview-metrics]").innerHTML = [["Открытия сегодня", "1 124", "+18%"], ["Позиции в продаже", active, `${state.items.length} всего`], ["Среднее время", "4:18", "+36 сек"], ["Источники онлайн", state.sources.filter((s) => s.active).length, `${state.sources.length} создано`]].map(([label, value, note], index) => `<article class="asa-metric"><span>${escapeHtml(label)}</span><strong>${escapeHtml(value)}</strong><small>${index === 0 || index === 2 ? `<b>↗</b>` : ""}${escapeHtml(note)}</small><i></i></article>`).join("");
    renderBars($("[data-overview-chart]"), analytics.today.labels.slice(-10), analytics.today.values.slice(-10), true);
    const attention = [
      [stopped, "Позиции недоступны", "stop"], [missingPhotos, "Без фотографии", "photo"], [missingTranslations, "Нужен перевод", "translation"]
    ];
    $("[data-attention-total]").textContent = attention.reduce((sum, row) => sum + row[0], 0);
    $("[data-attention-list]").innerHTML = attention.map(([count, label, filter], index) => `<button class="asa-attention-item ${index === 0 && count ? "is-critical" : count ? "" : "is-good"}" type="button" data-attention-filter="${filter}"><i></i><span><strong>${escapeHtml(label)}</strong><small>${count ? "Проверить и исправить" : "Всё заполнено"}</small></span><b>${count}</b></button>`).join("");
    $("[data-overview-popular]").innerHTML = state.items.filter((i) => i.active).slice(0, 5).map((item, index) => `<button class="asa-popular-row" type="button" data-edit-item="${item.id}"><span>${index + 1}</span>${item.image ? `<img src="${item.image}" alt="" />` : `<i></i>`}<div><strong>${escapeHtml(item.names.ru)}</strong><small>${630 - index * 71} открытий</small></div><b>+${24 - index * 3}%</b></button>`).join("");
    $("[data-overview-events]").innerHTML = events.slice(0, 4).map(eventMarkup).join("");
  }

  function populateCategorySelects() {
    const options = `<option value="all">Все категории</option>${state.categories.slice().sort((a, b) => a.order - b.order).map((category) => `<option value="${category.id}">${escapeHtml(category.names.ru)}</option>`).join("")}`;
    const filter = $("[data-menu-category]");
    const previous = filter.value || "all";
    filter.innerHTML = options;
    filter.value = state.categories.some((c) => c.id === previous) ? previous : "all";
    const editor = $('[data-item-form] [name="category_id"]');
    const editorPrevious = editor.value;
    editor.innerHTML = `<option value="">Выберите категорию</option>${state.categories.map((category) => `<option value="${category.id}">${escapeHtml(category.names.ru)}</option>`).join("")}`;
    editor.value = editorPrevious;
  }

  function filteredItems() {
    const query = $("[data-menu-search]").value.trim().toLowerCase();
    const category = $("[data-menu-category]").value;
    const status = $("[data-menu-status]").value;
    const missingPhoto = $("[data-menu-photo-missing]").checked;
    const missingTranslation = $("[data-menu-translation-missing]").checked;
    const sort = $("[data-menu-sort]").value;
    let items = state.items.filter((item) => {
      const haystack = `${Object.values(item.names).join(" ")} ${Object.values(item.descriptions).join(" ")}`.toLowerCase();
      const itemStatus = !item.active ? "inactive" : item.availability;
      return (!query || haystack.includes(query)) && (category === "all" || item.category === category) && (status === "all" || itemStatus === status) && (!missingPhoto || !item.image) && (!missingTranslation || translationMissing(item));
    });
    items.sort((a, b) => sort === "name" ? a.names.ru.localeCompare(b.names.ru, "ru") : sort === "price-high" ? b.price - a.price : sort === "price-low" ? a.price - b.price : a.order - b.order);
    return items;
  }

  function renderMenu() {
    populateCategorySelects();
    const items = filteredItems();
    const activeExtra = Number($("[data-menu-photo-missing]").checked) + Number($("[data-menu-translation-missing]").checked);
    $("[data-filter-count]").textContent = activeExtra ? String(activeExtra) : "";
    $("[data-menu-result-count]").textContent = `Найдено: ${items.length} из ${state.items.length}`;
    const list = $("[data-menu-list]");
    list.classList.toggle("is-grid", state.layout === "grid");
    list.innerHTML = items.length ? items.map((item) => {
      const category = categoryById(item.category);
      const [status, tone] = statusLabel(item);
      return `<article class="asa-menu-row" data-edit-item="${item.id}" tabindex="0">
        <div class="asa-menu-thumb">${item.image ? `<img src="${item.image}" alt="" />` : `<span>—</span>`}</div>
        <div class="asa-menu-name"><strong>${escapeHtml(item.names.ru)}</strong><small>${escapeHtml(item.descriptions.ru)}</small></div>
        <div class="asa-menu-category">${escapeHtml(category ? category.names.ru : "Без категории")} · ${escapeHtml(item.weight)}</div>
        <div class="asa-menu-price">${money(item.price)}</div>
        <span class="asa-status is-${item.active ? item.availability : "inactive"}">${status}</span>
        <div class="asa-translation-state" title="Статус переводов"><span>${["RU", "KZ", "EN", "TR"].map((lang, index) => `<i class="${index && translationMissing(item) && lang === "TR" ? "is-missing" : ""}">${lang}</i>`).join("")}</span><small>${translationMissing(item) ? "нужна проверка" : "переводы готовы"}</small></div>
        <button class="asa-row-action" type="button" data-edit-item="${item.id}" aria-label="Редактировать ${escapeHtml(item.names.ru)}">•••</button>
      </article>`;
    }).join("") : `<div class="asa-empty-state"><span>⌕</span><strong>Ничего не найдено</strong><p>Измените фильтры или добавьте новую позицию.</p><button class="asa-button asa-button--primary" type="button" data-open-modal="item">Добавить позицию</button></div>`;
    if (items.length && state.layout === "list") list.insertAdjacentHTML("afterbegin", `<div class="asa-menu-header"><span>Фото</span><span>Позиция</span><span>Категория</span><span>Цена</span><span>Статус</span><span>Переводы</span><span></span></div>`);
  }

  function renderCategories() {
    const categories = state.categories.slice().sort((a, b) => a.order - b.order);
    $("[data-category-list]").innerHTML = `${categories.map((category, index) => {
      const count = state.items.filter((item) => item.category === category.id).length;
      const missing = ["kk", "en", "tr"].filter((lang) => !category.names[lang]).length;
      return `<article class="asa-category-row" draggable="true" data-category-row="${category.id}">
        <span class="asa-drag-handle" aria-hidden="true">⋮⋮</span>
        <div class="asa-category-name"><strong>${escapeHtml(category.names.ru)}</strong><small>${missing ? `Не заполнено переводов: ${missing}` : "RU · KZ · EN · TR"}</small></div>
        <span class="asa-category-count">${count} позиций</span>
        <button class="asa-switch ${category.active ? "is-on" : ""}" type="button" data-category-toggle="${category.id}" aria-label="${category.active ? "Скрыть" : "Показать"} категорию"></button>
        <div class="asa-category-actions"><button type="button" data-category-move="up" data-category-id="${category.id}" ${index === 0 ? "disabled" : ""} aria-label="Выше">↑</button><button type="button" data-category-move="down" data-category-id="${category.id}" ${index === categories.length - 1 ? "disabled" : ""} aria-label="Ниже">↓</button><button type="button" data-edit-category="${category.id}">Изменить</button><button type="button" data-delete-category="${category.id}" aria-label="Удалить">×</button></div>
      </article>`;
    }).join("")}`;
  }

  function renderStoplist() {
    const items = state.items.filter((item) => ["stop", "temporary"].includes(item.availability));
    $("[data-stop-total]").textContent = items.length;
    $("[data-stop-list]").innerHTML = items.length ? items.map((item) => `<article class="asa-stop-row">
      <div class="asa-menu-thumb">${item.image ? `<img src="${item.image}" alt="" />` : `<span>—</span>`}</div>
      <div><strong>${escapeHtml(item.names.ru)}</strong><small>${escapeHtml(categoryById(item.category)?.names.ru || "Без категории")} · ${money(item.price)}</small></div>
      <span class="asa-status is-${item.availability}">${item.availability === "stop" ? "На стопе" : "Временно"}</span>
      <p class="asa-stop-time">${item.until ? `До ${dateTime(item.until)}` : "До ручного возврата"}</p>
      <button class="asa-button asa-button--secondary" type="button" data-restore-item="${item.id}">Вернуть в продажу</button>
    </article>`).join("") : `<div class="asa-empty-state"><span>✓</span><strong>Стоп-лист пуст</strong><p>Все активные позиции доступны гостям.</p></div>`;
  }

  function renderBars(container, labels, values, compact = false) {
    const max = Math.max(...values, 1);
    container.style.setProperty("--columns", values.length);
    container.innerHTML = values.map((value, index) => `<div class="asa-chart-column ${value === max ? "is-peak" : ""}" title="${escapeHtml(labels[index])}: ${value}"><i style="--value:${Math.max(5, Math.round(value / max * 100))}%;--delay:${index * 18}ms"></i><span>${escapeHtml(labels[index])}${compact ? "" : `<small>${value.toLocaleString("ru-RU")}</small>`}</span></div>`).join("");
  }

  function renderAnalytics() {
    const data = analytics[state.period];
    $$('[data-period]').forEach((node) => node.classList.toggle("is-active", node.dataset.period === state.period));
    const factor = state.source === "all" ? 1 : { "main-hall": .46, terrace: .28, "table-07": .11, social: .15 }[state.source] || .2;
    $("[data-analytics-metrics]").innerHTML = data.metrics.map(([label, value, delta], index) => `<article class="asa-analytics-metric"><span>${escapeHtml(label)}</span><strong>${index < 2 && factor !== 1 ? Math.round(Number(value.replace(/\s/g, "")) * factor).toLocaleString("ru-RU") : escapeHtml(value)}</strong><small>↗ ${escapeHtml(delta)} к прошлому периоду</small></article>`).join("");
    $("[data-chart-title]").textContent = state.period === "today" ? "Активность по часам" : state.period === "7d" ? "Активность по дням недели" : state.period === "30d" ? "Динамика за 30 дней" : "Динамика за 12 месяцев";
    renderBars($("[data-analytics-chart]"), data.labels, data.values.map((value) => Math.round(value * factor)));
    const insightText = state.period === "today" ? [
      ["Пик интереса", "С 19:00 до 21:00 меню открывают на 34% чаще."], ["Сильная позиция", "Баскский чизкейк обошёл среднее по категории в 2,1 раза."], ["Точка роста", "Гости с террасы глубже просматривают напитки после 18:00."]
    ] : [["Устойчивый рост", "Интерес к меню выше прошлого периода, особенно вечером."], ["Категории", "Завтраки лидируют по глубине просмотра, горячее — по открытиям карточек."], ["Источники", "QR основного зала приносит больше сессий, терраса — выше вовлечённость."]];
    $("[data-insights-list]").innerHTML = insightText.map(([title, text], index) => `<article class="asa-insight"><span>${index + 1}</span><div><strong>${title}</strong><p>${text}</p></div></article>`).join("");
    $("[data-analytics-dishes]").innerHTML = state.items.filter((item) => item.active).slice(0, 8).map((item, index) => `<button class="asa-dish-interest-row" type="button" data-edit-item="${item.id}"><span>${index + 1}</span>${item.image ? `<img src="${item.image}" alt="" />` : `<i></i>`}<div><strong>${escapeHtml(item.names.ru)}</strong><small>${escapeHtml(categoryById(item.category)?.names.ru || "")}</small></div><b>${Math.round((630 - index * 49) * factor).toLocaleString("ru-RU")}</b><em>+${24 - index * 2}%</em></button>`).join("");
    $("[data-analytics-events]").innerHTML = events.filter((event) => state.source === "all" || event[3] === state.source).map(eventMarkup).join("") || `<p class="asa-muted-copy">Для этого источника пока нет событий в демо-выборке.</p>`;
    $("[data-audience-grid]").innerHTML = audienceBlock("Языки", [["RU", 58], ["KZ", 24], ["EN", 13], ["TR", 5]]) + audienceBlock("Устройства", [["iPhone", 54], ["Android", 39], ["Desktop", 7]]) + audienceBlock("Источники", [["Основной зал", 46], ["Терраса", 28], ["Соцсети", 15], ["Другие", 11]]);
  }

  function eventMarkup(event) {
    return `<article class="asa-event-row"><span>↗</span><div><strong>${escapeHtml(event[1])}</strong><small>${escapeHtml(event[2])}</small></div><time>${event[0]}</time></article>`;
  }
  function audienceBlock(title, rows) {
    return `<section class="asa-audience-group"><strong>${escapeHtml(title)}</strong>${rows.map(([label, value]) => `<div class="asa-audience-row"><span>${escapeHtml(label)}</span><i><b style="--value:${value}%"></b></i><b>${value}%</b></div>`).join("")}</section>`;
  }

  function initializeSourceFilter() {
    const select = $("[data-analytics-source]");
    select.innerHTML = `<option value="all">Все источники</option>${state.sources.map((source) => `<option value="${source.id}">${escapeHtml(source.name)}</option>`).join("")}`;
    select.value = state.source;
  }

  function renderSources() {
    initializeSourceFilter();
    const container = $("[data-source-list]");
    container.innerHTML = state.sources.map((source) => `<article class="asa-source-card">
      <div class="asa-source-qr" data-source-qr="${source.id}"></div>
      <div class="asa-source-info"><div><h4>${escapeHtml(source.name)}</h4><span class="asa-status is-${source.active ? "active" : "inactive"}">${source.active ? "Активен" : "Выключен"}</span></div><span>${sourceType(source.type)} · создан ${new Intl.DateTimeFormat("ru-RU", { day: "numeric", month: "short" }).format(new Date(source.created))}</span><code>exort.kz/demo-menu?source=${escapeHtml(source.publicId)}</code></div>
      <div class="asa-source-stats"><span><strong>${source.sessions.toLocaleString("ru-RU")}</strong><small>сессий</small></span><span><strong>${source.engagement}%</strong><small>вовлечённость</small></span></div>
      <div class="asa-source-actions"><button type="button" data-copy-source="${source.id}">Скопировать</button><button type="button" data-download-source="${source.id}">PNG</button><button type="button" data-edit-source="${source.id}">Изменить</button><button type="button" data-toggle-source="${source.id}">${source.active ? "Выключить" : "Включить"}</button><button type="button" data-delete-source="${source.id}" aria-label="Удалить источник">×</button></div>
    </article>`).join("");
    state.sources.forEach((source) => renderQr($(`[data-source-qr="${source.id}"]`), sourceUrl(source), 132));
  }

  function sourceType(type) { return ({ hall: "Зал", table: "Стол", social: "Социальная сеть", hotel: "Гостиничная зона", other: "Другое" })[type] || "Другое"; }
  function sourceUrl(source) { return `https://exort.kz/demo-menu?source=${encodeURIComponent(source.publicId)}`; }

  function renderQr(container, text, size) {
    if (!container) return;
    container.innerHTML = "";
    if (window.QRCode) {
      new window.QRCode(container, { text, width: size, height: size, colorDark: "#1d211e", colorLight: "#ffffff", correctLevel: window.QRCode.CorrectLevel.M });
      return;
    }
    const canvas = document.createElement("canvas");
    const cells = 29; const scale = Math.max(3, Math.floor(size / cells));
    canvas.width = canvas.height = cells * scale;
    const context = canvas.getContext("2d");
    context.fillStyle = "#fff"; context.fillRect(0, 0, canvas.width, canvas.height);
    let hash = 2166136261;
    for (let index = 0; index < text.length; index += 1) hash = Math.imul(hash ^ text.charCodeAt(index), 16777619);
    const finder = (x, y) => { context.fillStyle = "#1d211e"; context.fillRect(x * scale, y * scale, 7 * scale, 7 * scale); context.fillStyle = "#fff"; context.fillRect((x + 1) * scale, (y + 1) * scale, 5 * scale, 5 * scale); context.fillStyle = "#1d211e"; context.fillRect((x + 2) * scale, (y + 2) * scale, 3 * scale, 3 * scale); };
    context.fillStyle = "#1d211e";
    for (let y = 0; y < cells; y += 1) for (let x = 0; x < cells; x += 1) { hash ^= hash << 13; hash ^= hash >>> 17; hash ^= hash << 5; if ((hash >>> 0) % 3 === 0) context.fillRect(x * scale, y * scale, scale, scale); }
    finder(1, 1); finder(cells - 8, 1); finder(1, cells - 8);
    container.append(canvas);
  }

  function qrDataUrl(container) {
    const canvas = $("canvas", container);
    if (canvas) return canvas.toDataURL("image/png");
    const image = $("img", container);
    return image ? image.src : "";
  }

  function downloadData(url, filename) {
    if (!url) return toast("QR-код ещё не готов", "warning");
    const link = document.createElement("a"); link.href = url; link.download = filename; document.body.append(link); link.click(); link.remove();
  }

  function renderSchedule() {
    const days = ["Понедельник", "Вторник", "Среда", "Четверг", "Пятница", "Суббота", "Воскресенье"];
    const list = $("[data-schedule-list]");
    if (list.dataset.ready) return;
    list.dataset.ready = "true";
    list.innerHTML = days.map((day, index) => `<div><label class="asa-switch"><input name="day_${index}" type="checkbox" ${index < 6 ? "checked" : ""} /><span></span></label><strong>${day}</strong><label>с <input name="open_${index}" type="time" value="${index > 4 ? "09:00" : "08:00"}" /></label><label>до <input name="close_${index}" type="time" value="${index > 4 ? "00:00" : "23:00"}" /></label><small>${index === 6 ? "Выходной" : "Открыто"}</small></div>`).join("");
  }

  function renderIntegrations() {
    $("[data-integration-list]").innerHTML = [
      ["r_keeper", "Синхронизация меню, цен и стоп-листа", "RK"], ["iiko", "Обмен позициями и доступностью", "II"]
    ].map(([name, description, mark]) => `<article><div>${mark}</div><span>Интеграция · Demo</span><h3>${name}</h3><p>${description}. Подключение выполняется отдельно и не входит в демонстрационный режим.</p><ul><li>Импорт структуры меню</li><li>Обновление доступности</li><li>Контроль последней синхронизации</li></ul><button class="asa-button asa-button--secondary" type="button" data-integration-demo="${name}">Узнать о подключении</button></article>`).join("");
  }

  function openModal(name, trigger = document.activeElement) {
    const modal = $(`[data-modal="${name}"]`);
    if (!modal) return;
    state.activeModal = name; state.modalTrigger = trigger;
    const layer = $("[data-modal-layer]");
    layer.setAttribute("aria-hidden", "false");
    $$('[data-modal]', layer).forEach((node) => { node.hidden = node !== modal; });
    modal.hidden = false;
    document.body.classList.add("asa-modal-open");
    $("[data-app]").setAttribute("inert", "");
    requestAnimationFrame(() => modal.classList.add("is-open"));
    window.setTimeout(() => { const target = $("input:not([type=hidden]), select, textarea, button", modal); if (target) target.focus(); }, 30);
  }

  function closeModal() {
    if (!state.activeModal) return;
    const modal = $(`[data-modal="${state.activeModal}"]`);
    modal?.classList.remove("is-open");
    $("[data-modal-layer]").setAttribute("aria-hidden", "true");
    $("[data-app]").removeAttribute("inert");
    document.body.classList.remove("asa-modal-open");
    window.setTimeout(() => { if (modal) modal.hidden = true; }, 180);
    if (state.editorImageObjectUrl) { URL.revokeObjectURL(state.editorImageObjectUrl); state.editorImageObjectUrl = ""; }
    const trigger = state.modalTrigger;
    state.activeModal = null;
    state.confirmAction = null;
    if (trigger && trigger.isConnected) trigger.focus();
  }

  function confirmAction(title, text, action, buttonLabel = "Подтвердить") {
    $("[data-confirm-title]").textContent = title;
    $("[data-confirm-text]").textContent = text;
    $("[data-confirm-action]").textContent = buttonLabel;
    state.confirmAction = action;
    openModal("confirm");
  }

  function openItemEditor(id = null, trigger) {
    state.editorItemId = id;
    const item = id ? itemById(id) : null;
    const form = $("[data-item-form]");
    form.reset(); populateCategorySelects();
    state.editorImage = item?.image || "";
    $("[data-item-modal-title]").textContent = item ? "Редактирование позиции" : "Новая позиция";
    $("[data-delete-item]").hidden = !item;
    ["ru", "kk", "en", "tr"].forEach((lang) => {
      form.elements[`name_${lang}`].value = item?.names[lang] || "";
      form.elements[`description_${lang}`].value = item?.descriptions[lang] || "";
    });
    form.elements.category_id.value = item?.category || "";
    form.elements.price.value = item?.price || "";
    form.elements.old_price.value = item?.oldPrice || "";
    form.elements.weight.value = item?.weight || "";
    form.elements.badge.value = item?.badge || "";
    form.elements.unavailable_until.value = item?.until || "";
    form.elements.active.checked = item ? item.active : true;
    form.elements.stoplisted.checked = item ? ["stop", "temporary"].includes(item.availability) : false;
    showItemLanguage("ru"); updatePhotoPreview(); updateTranslationStatus(); updateLivePreview();
    $$('[data-field-error]').forEach((node) => { node.textContent = ""; });
    openModal("item", trigger);
  }

  function showItemLanguage(lang) {
    $$('[data-item-lang]').forEach((node) => { const active = node.dataset.itemLang === lang; node.classList.toggle("is-active", active); node.setAttribute("aria-selected", String(active)); });
    $$('[data-item-lang-panel]').forEach((node) => node.classList.toggle("is-active", node.dataset.itemLangPanel === lang));
    const names = { ru: ["RU", "Основной текст", "Измените русский текст, затем обновите переводы вручную."], kk: ["KZ", "Казахский перевод", "Проверьте естественность формулировок перед публикацией."], en: ["EN", "Английский перевод", "Проверьте название, описание и гастрономические термины."], tr: ["TR", "Турецкий перевод", "Незаполненные поля не будут показаны гостю."] };
    const note = $("[data-translation-note]"); note.querySelector("span").textContent = names[lang][0]; note.querySelector("strong").textContent = names[lang][1]; note.querySelector("small").textContent = names[lang][2];
  }

  function updatePhotoPreview() {
    const preview = $("[data-item-photo-preview]");
    preview.innerHTML = state.editorImage ? `<img src="${state.editorImage}" alt="Предпросмотр фотографии" />` : `<span>Фото</span>`;
    $("[data-item-photo-remove]").hidden = !state.editorImage;
  }

  function updateTranslationStatus() {
    const form = $("[data-item-form]");
    ["ru", "kk", "en", "tr"].forEach((lang) => {
      const complete = form.elements[`name_${lang}`].value.trim() && form.elements[`description_${lang}`].value.trim();
      const tab = $(`[data-item-lang="${lang}"]`); tab.classList.toggle("is-complete", Boolean(complete));
    });
  }

  function updateLivePreview() {
    const form = $("[data-item-form]");
    $("[data-item-live-preview]").innerHTML = `${state.editorImage ? `<img src="${state.editorImage}" alt="" />` : `<span>Фото блюда</span>`}<p><strong>${escapeHtml(form.elements.name_ru.value || "Название позиции")}</strong><small>${escapeHtml(form.elements.description_ru.value || "Описание появится здесь")}</small><b>${money(form.elements.price.value || 0)}</b></p>`;
  }

  function autoTranslate() {
    const form = $("[data-item-form]");
    const name = form.elements.name_ru.value.trim(); const description = form.elements.description_ru.value.trim();
    if (!name) return toast("Сначала заполните название на русском", "warning");
    const labels = { kk: "KZ", en: "EN", tr: "TR" };
    let filled = 0;
    Object.keys(labels).forEach((lang) => {
      if (!form.elements[`name_${lang}`].value.trim()) { form.elements[`name_${lang}`].value = `${name} · ${labels[lang]}`; filled += 1; }
      if (!form.elements[`description_${lang}`].value.trim() && description) form.elements[`description_${lang}`].value = `${description} · ${labels[lang]}`;
    });
    updateTranslationStatus();
    toast(filled ? "Пустые переводы заполнены в демо-режиме" : "Ручные переводы сохранены без перезаписи", filled ? "success" : "info");
  }

  function saveItem(event) {
    event.preventDefault(); if (state.saving) return;
    const form = event.currentTarget; let valid = true;
    const name = form.elements.name_ru.value.trim(); const category = form.elements.category_id.value; const price = Number(form.elements.price.value);
    $("[data-field-error=category_id]").textContent = category ? "" : "Выберите категорию";
    $("[data-field-error=price]").textContent = Number.isFinite(price) && price >= 0 ? "" : "Укажите корректную цену";
    if (!name) { showItemLanguage("ru"); form.elements.name_ru.focus(); valid = false; }
    if (!category || !Number.isFinite(price) || price < 0) valid = false;
    if (!valid) return toast("Проверьте обязательные поля", "warning");
    state.saving = true; $("[data-save-item]").disabled = true;
    const existing = state.editorItemId ? itemById(state.editorItemId) : null;
    const record = existing || { id: uid("item"), order: state.items.length, names: {}, descriptions: {} };
    ["ru", "kk", "en", "tr"].forEach((lang) => { record.names[lang] = form.elements[`name_${lang}`].value.trim(); record.descriptions[lang] = form.elements[`description_${lang}`].value.trim(); });
    Object.assign(record, { category, price, oldPrice: Number(form.elements.old_price.value || 0), weight: form.elements.weight.value.trim(), badge: form.elements.badge.value.trim(), image: state.editorImage, active: form.elements.active.checked, availability: form.elements.stoplisted.checked ? (form.elements.unavailable_until.value ? "temporary" : "stop") : (form.elements.active.checked ? "active" : "inactive"), until: form.elements.unavailable_until.value });
    if (!existing) state.items.push(record);
    window.setTimeout(() => { state.saving = false; $("[data-save-item]").disabled = false; closeModal(); renderView(state.view); toast(existing ? "Позиция обновлена" : "Позиция добавлена"); }, 450);
  }

  function openCategoryEditor(id = null, trigger) {
    const form = $("[data-category-form]"); form.reset();
    const category = id ? categoryById(id) : null;
    form.elements.id.value = category?.id || "";
    ["ru", "kk", "en", "tr"].forEach((lang) => { form.elements[`name_${lang}`].value = category?.names[lang] || ""; });
    form.elements.active.checked = category ? category.active : true;
    $("[data-category-modal-title]").textContent = category ? "Редактирование категории" : "Новая категория";
    showCategoryLanguage("ru"); openModal("category", trigger);
  }

  function showCategoryLanguage(lang) {
    $$('[data-category-lang]').forEach((node) => node.classList.toggle("is-active", node.dataset.categoryLang === lang));
    $$('[data-category-lang-field]').forEach((node) => { node.hidden = node.dataset.categoryLangField !== lang; });
  }

  function saveCategory(event) {
    event.preventDefault(); const form = event.currentTarget; const ru = form.elements.name_ru.value.trim();
    if (!ru) { showCategoryLanguage("ru"); form.elements.name_ru.focus(); return toast("Укажите название категории", "warning"); }
    const id = form.elements.id.value; let category = id ? categoryById(id) : null;
    if (!category) { category = { id: uid("category"), order: state.categories.length, active: true, names: {} }; state.categories.push(category); }
    ["ru", "kk", "en", "tr"].forEach((lang) => { category.names[lang] = form.elements[`name_${lang}`].value.trim(); });
    category.active = form.elements.active.checked; closeModal(); renderView(state.view); toast(id ? "Категория обновлена" : "Категория создана");
  }

  function moveCategory(id, direction) {
    const sorted = state.categories.slice().sort((a, b) => a.order - b.order); const index = sorted.findIndex((c) => c.id === id); const target = index + (direction === "up" ? -1 : 1);
    if (index < 0 || target < 0 || target >= sorted.length) return;
    [sorted[index].order, sorted[target].order] = [sorted[target].order, sorted[index].order]; renderCategories(); toast("Порядок категорий обновлён");
  }

  function openStopEditor(trigger) {
    const form = $("[data-stop-form]"); form.reset();
    const candidates = state.items.filter((item) => item.active && !["stop", "temporary"].includes(item.availability));
    form.elements.item_id.innerHTML = candidates.length ? `<option value="">Выберите позицию</option>${candidates.map((item) => `<option value="${item.id}">${escapeHtml(item.names.ru)}</option>`).join("")}` : `<option value="">Нет доступных позиций</option>`;
    $("[data-stop-until]").hidden = true; openModal("stop", trigger);
  }

  function openQrEditor(id = null, trigger) {
    const form = $("[data-qr-form]"); form.reset(); const source = id ? state.sources.find((entry) => entry.id === id) : null;
    form.elements.id.value = source?.id || ""; form.elements.name.value = source?.name || ""; form.elements.type.value = source?.type || "hall";
    $("[data-qr-modal-title]").textContent = source ? "Редактирование источника" : "Новый QR-код"; openModal("qr", trigger);
  }

  function saveQr(event) {
    event.preventDefault(); const form = event.currentTarget; const name = form.elements.name.value.trim(); if (!name) return form.elements.name.focus();
    const id = form.elements.id.value; let source = id ? state.sources.find((entry) => entry.id === id) : null;
    if (!source) { source = { id: uid("source"), publicId: uid("qr"), sessions: 0, engagement: 0, active: true, created: new Date().toISOString().slice(0, 10) }; state.sources.push(source); }
    source.name = name; source.type = form.elements.type.value; closeModal(); initializeSourceFilter(); renderSources(); toast(id ? "Источник обновлён" : "QR-код создан");
  }

  async function copyText(text, message = "Скопировано") {
    try { await navigator.clipboard.writeText(text); toast(message); }
    catch (_) { const area = document.createElement("textarea"); area.value = text; document.body.append(area); area.select(); document.execCommand("copy"); area.remove(); toast(message); }
  }

  function escapeWifi(value) { return String(value).replace(/([\\;,:\"])/g, "\\$1"); }
  function createWifiQr(event) {
    event.preventDefault(); const form = event.currentTarget; const data = new FormData(form); const security = data.get("security"); const password = data.get("password") || "";
    if (security !== "nopass" && !password) return toast("Укажите пароль Wi‑Fi", "warning");
    const payload = `WIFI:T:${security};S:${escapeWifi(data.get("ssid"))};P:${security === "nopass" ? "" : escapeWifi(password)};H:${data.get("hidden") ? "true" : "false"};;`;
    const result = $("[data-wifi-result]"); result.hidden = false; renderQr($("[data-wifi-qr]"), payload, 184);
    $("[data-wifi-summary]").textContent = `Сеть «${data.get("ssid")}» · ${security === "nopass" ? "без пароля" : security} · пароль нигде не сохраняется`;
    toast("Wi‑Fi QR-код создан локально");
  }

  function exportAnalytics() {
    const data = analytics[state.period]; const rows = [["Период", "Значение", "Источник"], ...data.labels.map((label, index) => [label, data.values[index], state.source])];
    const csv = `\uFEFF${rows.map((row) => row.map((value) => `"${String(value).replace(/"/g, '""')}"`).join(";")).join("\n")}`;
    downloadData(URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" })), `exort-demo-analytics-${state.period}.csv`); toast("CSV подготовлен");
  }

  function renderCommandResults(query = "") {
    const q = query.trim().toLowerCase();
    const commands = [
      ...Object.entries(pageMeta).map(([id, meta]) => ({ label: meta[1], hint: "Раздел", action: () => navigate(id) })),
      { label: "Добавить позицию", hint: "Действие", action: () => openItemEditor() }, { label: "Создать категорию", hint: "Действие", action: () => openCategoryEditor() }, { label: "Добавить в стоп-лист", hint: "Действие", action: () => openStopEditor() }, { label: "Создать QR-код", hint: "Действие", action: () => openQrEditor() },
      ...state.items.map((item) => ({ label: item.names.ru, hint: "Позиция меню", action: () => openItemEditor(item.id) }))
    ].filter((command) => !q || `${command.label} ${command.hint}`.toLowerCase().includes(q)).slice(0, 12);
    const container = $("[data-command-results]"); container.innerHTML = commands.length ? commands.map((command, index) => `<button type="button" data-command-index="${index}"><span>${escapeHtml(command.label)}</span><small>${escapeHtml(command.hint)}</small><b>↵</b></button>`).join("") : `<p>Ничего не найдено</p>`;
    container._commands = commands;
  }

  function saveSettings() { $("[data-settings-form]").requestSubmit(); }

  function bindEvents() {
    document.addEventListener("click", (event) => {
      const nav = event.target.closest("[data-nav], [data-nav-target]"); if (nav) { event.preventDefault(); navigate(nav.dataset.nav || nav.dataset.navTarget); return; }
      const close = event.target.closest("[data-modal-close]"); if (close) return closeModal();
      const editItem = event.target.closest("[data-edit-item]"); if (editItem) return openItemEditor(editItem.dataset.editItem, editItem);
      const open = event.target.closest("[data-open-modal]"); if (open) { const name = open.dataset.openModal; if (name === "item") openItemEditor(null, open); return; }
      const editCategory = event.target.closest("[data-edit-category]"); if (editCategory) return openCategoryEditor(editCategory.dataset.editCategory, editCategory);
      const categoryToggle = event.target.closest("[data-category-toggle]"); if (categoryToggle) { const category = categoryById(categoryToggle.dataset.categoryToggle); category.active = !category.active; renderCategories(); return toast(category.active ? "Категория включена" : "Категория скрыта", category.active ? "success" : "info"); }
      const move = event.target.closest("[data-category-move]"); if (move) return moveCategory(move.dataset.categoryId, move.dataset.categoryMove);
      const deleteCategory = event.target.closest("[data-delete-category]"); if (deleteCategory) {
        const id = deleteCategory.dataset.deleteCategory; const count = state.items.filter((item) => item.category === id).length;
        return confirmAction("Удалить категорию?", count ? `В категории ${count} позиций. Сначала перенесите или удалите их.` : "Категория будет удалена только из локальной демо-сессии.", () => { if (count) return toast("Категория не удалена: внутри есть позиции", "warning"); state.categories = state.categories.filter((category) => category.id !== id); closeModal(); renderCategories(); toast("Категория удалена"); }, count ? "Понятно" : "Удалить");
      }
      const restore = event.target.closest("[data-restore-item]"); if (restore) { const item = itemById(restore.dataset.restoreItem); item.availability = "active"; item.until = ""; renderStoplist(); updateCounts(); return toast("Позиция возвращена в продажу"); }
      if (event.target.closest("[data-add-stop]")) return openStopEditor(event.target.closest("[data-add-stop]"));
      if (event.target.closest("[data-add-qr]")) return openQrEditor(null, event.target.closest("[data-add-qr]"));
      const editSource = event.target.closest("[data-edit-source]"); if (editSource) return openQrEditor(editSource.dataset.editSource, editSource);
      const copySource = event.target.closest("[data-copy-source]"); if (copySource) return copyText(sourceUrl(state.sources.find((s) => s.id === copySource.dataset.copySource)), "Ссылка источника скопирована");
      const downloadSource = event.target.closest("[data-download-source]"); if (downloadSource) return downloadData(qrDataUrl($(`[data-source-qr="${downloadSource.dataset.downloadSource}"]`)), `exort-${downloadSource.dataset.downloadSource}.png`);
      const toggleSource = event.target.closest("[data-toggle-source]"); if (toggleSource) { const source = state.sources.find((s) => s.id === toggleSource.dataset.toggleSource); source.active = !source.active; renderSources(); return toast(source.active ? "Источник включён" : "Источник выключен", source.active ? "success" : "info"); }
      const deleteSource = event.target.closest("[data-delete-source]"); if (deleteSource) return confirmAction("Удалить источник?", "QR-код перестанет отображаться в этой демо-сессии.", () => { state.sources = state.sources.filter((s) => s.id !== deleteSource.dataset.deleteSource); closeModal(); renderSources(); toast("Источник удалён"); }, "Удалить");
      const period = event.target.closest("[data-period]"); if (period) { state.period = period.dataset.period; return renderAnalytics(); }
      const layout = event.target.closest("[data-menu-layout]"); if (layout) { state.layout = layout.dataset.menuLayout; $$('[data-menu-layout]').forEach((node) => node.classList.toggle("is-active", node === layout)); return renderMenu(); }
      if (event.target.closest("[data-clear-filters]")) { $("[data-menu-search]").value = ""; $("[data-menu-category]").value = "all"; $("[data-menu-status]").value = "all"; $("[data-menu-photo-missing]").checked = false; $("[data-menu-translation-missing]").checked = false; return renderMenu(); }
      const attention = event.target.closest("[data-attention-filter]"); if (attention) { navigate("menu"); const filter = attention.dataset.attentionFilter; if (filter === "stop") $("[data-menu-status]").value = "stop"; if (filter === "photo") $("[data-menu-photo-missing]").checked = true; if (filter === "translation") $("[data-menu-translation-missing]").checked = true; return renderMenu(); }
      const quick = event.target.closest("[data-quick-action]"); if (quick) { const action = quick.dataset.quickAction; if (action === "add-item") return openItemEditor(null, quick); if (action === "add-category") return openCategoryEditor(null, quick); if (action === "add-stop") return openStopEditor(quick); if (action === "add-qr") return openQrEditor(null, quick); return navigate("analytics"); }
      const itemLang = event.target.closest("[data-item-lang]"); if (itemLang) return showItemLanguage(itemLang.dataset.itemLang);
      const categoryLang = event.target.closest("[data-category-lang]"); if (categoryLang) return showCategoryLanguage(categoryLang.dataset.categoryLang);
      if (event.target.closest("[data-auto-translate]")) return autoTranslate();
      if (event.target.closest("[data-item-photo-remove]")) { state.editorImage = ""; $("[data-item-photo]").value = ""; updatePhotoPreview(); updateLivePreview(); return; }
      if (event.target.closest("[data-delete-item]")) return confirmAction("Удалить позицию?", "Позиция исчезнет только из текущей демо-сессии.", () => { state.items = state.items.filter((item) => item.id !== state.editorItemId); closeModal(); renderView(state.view); toast("Позиция удалена"); }, "Удалить");
      if (event.target.closest("[data-confirm-action]")) { const action = state.confirmAction; if (action) action(); return; }
      if (event.target.closest("[data-command-open]")) { renderCommandResults(); return openModal("command", event.target.closest("[data-command-open]")); }
      const command = event.target.closest("[data-command-index]"); if (command) { const selected = $("[data-command-results]")._commands[Number(command.dataset.commandIndex)]; closeModal(); window.setTimeout(() => selected?.action(), 190); return; }
      const primary = event.target.closest("[data-primary-action]"); if (primary) { const action = primary.dataset.action; if (action === "item") return openItemEditor(null, primary); if (action === "category") return openCategoryEditor(null, primary); if (action === "stop") return openStopEditor(primary); if (action === "qr") return openQrEditor(null, primary); if (action === "settings") return saveSettings(); }
      const settingsTab = event.target.closest("[data-settings-tab]"); if (settingsTab) { $$('[data-settings-tab]').forEach((node) => node.classList.toggle("is-active", node === settingsTab)); $$('[data-settings-panel]').forEach((node) => node.classList.toggle("is-active", node.dataset.settingsPanel === settingsTab.dataset.settingsTab)); return; }
      if (event.target.closest("[data-copy-demo-domain]")) return copyText("https://exort.kz/demo-menu", "Демо-адрес скопирован");
      if (event.target.closest("[data-demo-info]")) return toast("Это безопасная локальная витрина: изменения сбросятся после перезагрузки", "info");
      if (event.target.closest("[data-venue-switch]")) return toast("В демо доступно одно вымышленное заведение", "info");
      if (event.target.closest("[data-demo-logout]")) return toast("Выход отключён в демонстрационном режиме", "info");
      const integration = event.target.closest("[data-integration-demo]"); if (integration) return toast(`${integration.dataset.integrationDemo}: подключение показывается только как возможность`, "info");
      if (event.target.closest("[data-sidebar-open]")) { document.body.classList.add("asa-sidebar-open"); $("[data-sidebar-open]").setAttribute("aria-expanded", "true"); return; }
      if (event.target.closest("[data-sidebar-close]")) { document.body.classList.remove("asa-sidebar-open"); $("[data-sidebar-open]").setAttribute("aria-expanded", "false"); }
    });

    ["[data-menu-search]", "[data-menu-category]", "[data-menu-status]", "[data-menu-sort]", "[data-menu-photo-missing]", "[data-menu-translation-missing]"].forEach((selector) => $(selector).addEventListener(selector.includes("search") ? "input" : "change", renderMenu));
    $("[data-filter-popover]").addEventListener("click", (event) => { const panel = $("[data-filter-panel]"); panel.hidden = !panel.hidden; event.currentTarget.setAttribute("aria-expanded", String(!panel.hidden)); });
    $("[data-analytics-source]").addEventListener("change", (event) => { state.source = event.target.value; renderAnalytics(); });
    $("[data-export-analytics]").addEventListener("click", exportAnalytics);
    $("[data-item-form]").addEventListener("submit", saveItem);
    $("[data-category-form]").addEventListener("submit", saveCategory);
    $("[data-qr-form]").addEventListener("submit", saveQr);
    $("[data-stop-form]").addEventListener("submit", (event) => { event.preventDefault(); const form = event.currentTarget; const item = itemById(form.elements.item_id.value); if (!item) return toast("Выберите позицию", "warning"); item.availability = form.elements.mode.value; item.until = form.elements.mode.value === "temporary" ? form.elements.until.value : ""; closeModal(); renderView(state.view); toast("Позиция добавлена в стоп-лист"); });
    $('[data-stop-form] [name="mode"]').addEventListener("change", (event) => { const temporary = event.target.value === "temporary"; $("[data-stop-until]").hidden = !temporary; $('[data-stop-form] [name="until"]').required = temporary; });
    $("[data-wifi-form]").addEventListener("submit", createWifiQr);
    $('[data-wifi-form] [name="security"]').addEventListener("change", (event) => { const noPass = event.target.value === "nopass"; $("[data-wifi-password]").hidden = noPass; $('[data-wifi-form] [name="password"]').required = !noPass; });
    $("[data-download-wifi]").addEventListener("click", () => downloadData(qrDataUrl($("[data-wifi-qr]")), "exort-wifi-demo.png"));
    $("[data-item-photo]").addEventListener("change", (event) => { const file = event.target.files[0]; if (!file) return; if (!/^image\/(png|jpeg|webp)$/.test(file.type) || file.size > 5 * 1024 * 1024) { event.target.value = ""; return toast("Фото должно быть PNG, JPG или WebP до 5 МБ", "warning"); } if (state.editorImageObjectUrl) URL.revokeObjectURL(state.editorImageObjectUrl); state.editorImageObjectUrl = URL.createObjectURL(file); state.editorImage = state.editorImageObjectUrl; $("[data-photo-status]").textContent = `${file.name} · ${(file.size / 1024 / 1024).toFixed(1)} МБ`; updatePhotoPreview(); updateLivePreview(); });
    $("[data-item-form]").addEventListener("input", (event) => { if (event.target.name?.startsWith("name_") || event.target.name?.startsWith("description_")) updateTranslationStatus(); if (["name_ru", "description_ru", "price"].includes(event.target.name)) updateLivePreview(); });
    $("[data-settings-form]").addEventListener("submit", (event) => { event.preventDefault(); toast("Настройки сохранены в демо-сессии"); });
    $('[data-settings-form] [name="accent"]').addEventListener("input", (event) => { document.documentElement.style.setProperty("--asa-live-accent", event.target.value); $("[data-style-preview]").style.setProperty("--preview-accent", event.target.value); });
    $('[data-settings-form] [name="service_percent"]').addEventListener("input", updateServicePreview);
    $('[data-settings-form] [name="service_text"]').addEventListener("input", updateServicePreview);
    $("[data-command-input]").addEventListener("input", (event) => renderCommandResults(event.target.value));

    $("[data-category-list]").addEventListener("dragstart", (event) => { const row = event.target.closest("[data-category-row]"); if (!row) return; state.draggingCategory = row.dataset.categoryRow; row.classList.add("is-dragging"); });
    $("[data-category-list]").addEventListener("dragover", (event) => { if (event.target.closest("[data-category-row]")) event.preventDefault(); });
    $("[data-category-list]").addEventListener("drop", (event) => { event.preventDefault(); const target = event.target.closest("[data-category-row]")?.dataset.categoryRow; if (!target || target === state.draggingCategory) return; const sorted = state.categories.slice().sort((a, b) => a.order - b.order); const from = sorted.findIndex((c) => c.id === state.draggingCategory); const to = sorted.findIndex((c) => c.id === target); const [moved] = sorted.splice(from, 1); sorted.splice(to, 0, moved); sorted.forEach((category, index) => { category.order = index; }); state.draggingCategory = null; renderCategories(); toast("Порядок категорий обновлён"); });
    $("[data-category-list]").addEventListener("dragend", () => { state.draggingCategory = null; $$('[data-category-row]').forEach((row) => row.classList.remove("is-dragging")); });

    document.addEventListener("keydown", (event) => {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "k") { event.preventDefault(); renderCommandResults(); openModal("command"); return; }
      if (event.key === "Escape" && state.activeModal) { event.preventDefault(); closeModal(); return; }
      if (event.key === "Enter" && event.target.matches("[data-edit-item]") && !event.target.matches("button")) openItemEditor(event.target.dataset.editItem, event.target);
      if (event.key === "Tab" && state.activeModal) trapFocus(event);
    });
  }

  function trapFocus(event) {
    const modal = $(`[data-modal="${state.activeModal}"]`); const focusable = $$('button:not([disabled]), input:not([disabled]):not([type="hidden"]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])', modal).filter((node) => !node.hidden && node.offsetParent !== null);
    if (!focusable.length) return; const first = focusable[0]; const last = focusable[focusable.length - 1];
    if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); } else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
  }

  function updateServicePreview() {
    const form = $("[data-settings-form]"); const percent = form.elements.service_percent.value || "0"; const text = form.elements.service_text.value || "Уведомление отключено";
    $("[data-service-preview] span").textContent = `${percent}%`; $("[data-service-preview] p").textContent = text;
  }

  function initialize() {
    populateCategorySelects(); initializeSourceFilter(); renderSchedule(); renderIntegrations(); bindEvents(); updateServicePreview();
    const initial = location.hash.slice(1); navigate(pageMeta[initial] ? initial : "overview");
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", initialize); else initialize();
}());
