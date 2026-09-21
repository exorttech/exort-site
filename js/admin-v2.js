(() => {
  "use strict";
  let protectedRoot;
  const $ = (selector, root = document) =>
    root.querySelector(selector) ||
    (root === document ? protectedRoot?.querySelector(selector) : null);
  const $$ = (selector, root = document) => {
    const found = [...root.querySelectorAll(selector)];
    if (root === document && protectedRoot && !protectedRoot.isConnected)
      found.push(...protectedRoot.querySelectorAll(selector));
    return found;
  };
  protectedRoot = $("#admin-protected");
  protectedRoot.remove();
  const esc = (value) =>
    String(value ?? "").replace(
      /[&<>"']/g,
      (c) =>
        ({
          "&": "&amp;",
          "<": "&lt;",
          ">": "&gt;",
          '"': "&quot;",
          "'": "&#39;",
        })[c],
    );
  const slugify = (value) =>
    String(value || "exort-demo")
      .toLowerCase()
      .replace(/[^a-z0-9-]/g, "") || "exort-demo";
  const local = ["localhost", "127.0.0.1", "::1", ""].includes(
    location.hostname,
  );
  const endpoint = local
    ? "https://exort.kz/api/exort-admin"
    : "/api/exort-admin";
  const storage = {
    get(key) {
      try {
        return sessionStorage.getItem(key) || "";
      } catch {
        return "";
      }
    },
    set(key, value) {
      try {
        value
          ? sessionStorage.setItem(key, value)
          : sessionStorage.removeItem(key);
      } catch {
        /* A session can also live only in this tab. */
      }
    },
  };
  const views = {
    overview: ["Обзор", "Всё важное о вашем меню сегодня", "grid"],
    menu: ["Меню", "Блюда, цены и доступность для гостей", "menu"],
    categories: ["Категории", "Порядок и структура вашего меню", "layers"],
    stoplist: ["Стоп-лист", "Управляйте доступностью в течение дня", "pause"],
    analytics: ["Аналитика", "Как гости взаимодействуют с вашим меню", "chart"],
    qr: ["QR-источники", "Откуда гости приходят в меню", "qr"],
    restaurant: ["Ресторан", "Информация, которую видят ваши гости", "store"],
    settings: [
      "Настройки",
      "Доступ и параметры рабочего пространства",
      "settings",
    ],
  };
  const paths = {
    grid: '<rect x="3" y="3" width="6" height="6" rx="1"/><rect x="15" y="3" width="6" height="6" rx="1"/><rect x="3" y="15" width="6" height="6" rx="1"/><rect x="15" y="15" width="6" height="6" rx="1"/>',
    menu: '<rect x="4" y="3" width="16" height="18" rx="2"/><path d="M8 8h8M8 12h8M8 16h5"/>',
    layers: '<path d="m3 7 9-4 9 4-9 4-9-4Zm0 5 9 4 9-4M3 17l9 4 9-4"/>',
    pause: '<circle cx="12" cy="12" r="9"/><path d="M9 8v8M15 8v8"/>',
    chart: '<path d="M4 3v17h17M8 15v-4M13 15V7M18 15V4"/>',
    qr: '<path d="M3 3h6v6H3zM15 3h6v6h-6zM3 15h6v6H3zM15 15h3v3h3v3h-6zM12 3v3M12 12h3M3 12h3M12 18v3M21 12v3"/>',
    store:
      '<path d="M4 10v11h16V10M3 10l2-7h14l2 7M9 21v-7h6v7M3 10c0 3 5 3 5 0 0 3 8 3 8 0 0 3 5 3 5 0"/>',
    settings:
      '<path d="M4 7h16M4 17h16"/><circle cx="9" cy="7" r="3" fill="currentColor"/><circle cx="16" cy="17" r="3" fill="currentColor"/>',
    plus: '<path d="M12 5v14M5 12h14"/>',
    search: '<circle cx="10" cy="10" r="6"/><path d="m15 15 5 5"/>',
    edit: '<path d="m14 5 5 5M4 20l5-1L21 7l-5-5L4 14v6Z"/>',
    trash: '<path d="M3 6h18M9 6V3h6v3M6 6l1 15h10l1-15M10 10v7M14 10v7"/>',
    image:
      '<rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8" cy="8" r="1.5"/><path d="m3 17 6-6 4 4 3-3 5 5"/>',
    check: '<path d="m5 12 4 4L19 6"/>',
    arrow: '<path d="M5 12h14m-5-5 5 5-5 5"/>',
    filter: '<path d="M4 5h16M7 12h10M10 19h4"/>',
    refresh:
      '<path d="M20 7v5h-5M4 17v-5h5M5 7a8 8 0 0 1 14-1l1 6M4 12l1 6a8 8 0 0 0 14-1"/>',
    close: '<path d="m6 6 12 12M6 18 18 6"/>',
  };
  const icon = (name) =>
    `<svg class="icon" viewBox="0 0 24 24" aria-hidden="true">${paths[name] || paths.arrow}</svg>`;
  const state = {
    slug: slugify(new URLSearchParams(location.search).get("restaurant")),
    token: "",
    restaurant: {},
    categories: [],
    items: [],
    view: "overview",
    query: "",
    category: "all",
    status: "all",
    stock: "all",
    issue: "",
    analytics: null,
    analyticsLoading: false,
    analyticsError: "",
    analyticsRequest: 0,
    range: "7d",
    source: "all",
    qr: null,
    qrError: "",
    qrLoading: false,
    qrRequest: 0,
    dirty: false,
    utilityDirty: false,
    busy: false,
    editorItem: null,
    image: "",
    imageData: "",
    photoBusy: false,
    generation: 0,
    hourDay: "",
    filtersOpen: false,
  };
  const sessionKey = () => `exort-admin-session:${state.slug}`;
  const fmt = (value) =>
    new Intl.NumberFormat("ru-RU", { maximumFractionDigits: 1 }).format(
      Number(value || 0),
    );
  const money = (item) =>
    `${fmt(item.price)} ${item.currency === "KZT" || !item.currency ? "₸" : esc(item.currency)}`;
  const duration = (value) =>
    value == null
      ? "—"
      : Number(value) < 60000
        ? `${Math.round(value / 1000)} сек`
        : `${Math.floor(value / 60000)} мин ${Math.round((value % 60000) / 1000)} сек`;
  const date = (value) =>
    value && !Number.isNaN(Date.parse(value))
      ? new Date(value).toLocaleDateString("ru-RU", {
          day: "numeric",
          month: "short",
        })
      : "—";
  const name = (item) =>
    item?.name_ru || item?.title_ru || item?.name || "Без названия";
  const categoryName = (id) => name(state.categories.find((c) => c.id === id));
  const dishes = () =>
    state.items.filter(
      (i) => i.content_key !== "menu-hero" && !/^menu[-_ ]hero$/i.test(name(i)),
    );
  const stopped = (item) =>
    item.is_stoplisted === true || item.in_stock === false;
  const temporary = (item) =>
    Boolean(
      item.inactive_until && Date.parse(item.inactive_until) > Date.now(),
    );
  const imageUrl = (url) => {
    try {
      const parsed = new URL(url, "https://exort.kz");
      return ["https:", "http:"].includes(parsed.protocol) ? parsed.href : "";
    } catch {
      return "";
    }
  };
  const photo = (item) =>
    item.image_url
      ? `<span class="thumbnail"><img src="${esc(imageUrl(item.image_url))}" alt="" loading="lazy" /></span>`
      : `<span class="thumbnail" title="Нет фотографии">${icon("image")}</span>`;
  const menuUrl = () =>
    `https://exort.kz/demo-menu?restaurant=${encodeURIComponent(state.slug)}`;
  function friendly(error) {
    const msg = String(error?.message || error || "");
    if (/Invalid PIN/i.test(msg))
      return "Неверный PIN. Проверьте код и попробуйте снова.";
    if (/PIN access is not configured/i.test(msg))
      return "Вход для этого ресторана ещё не настроен. Обратитесь в Exort.";
    if (/not found/i.test(msg))
      return "Ресторан или запись не найдены. Проверьте адрес и обновите данные.";
    if (
      /Supabase|Worker|service.role|SQL|backend|Admin API|Unexpected|Failed to fetch|NetworkError/i.test(
        msg,
      )
    )
      return "Сервис временно недоступен. Повторите запрос.";
    return msg || "Не удалось выполнить действие. Повторите попытку.";
  }
  async function api(action, payload = {}) {
    const controller = new AbortController();
    const timeout = setTimeout(
      () => controller.abort(),
      action === "getAnalytics" ? 22000 : 45000,
    );
    const requestGeneration = state.generation;
    try {
      const response = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action,
          restaurantSlug: state.slug,
          sessionToken: state.token,
          ...payload,
        }),
        signal: controller.signal,
      });
      const data = await response.json().catch(() => ({}));
      if (requestGeneration !== state.generation)
        throw new Error("Запрос относится к предыдущей сессии.");
      if (response.status === 401 && action !== "login") {
        logout(true);
        throw new Error("Сессия истекла. Введите PIN снова.");
      }
      if (!response.ok || data.error)
        throw new Error(
          data.error || "Сервис временно недоступен. Повторите запрос.",
        );
      return data;
    } catch (error) {
      throw new Error(
        error.name === "AbortError"
          ? "Сервер не ответил вовремя. Повторите запрос."
          : friendly(error),
      );
    } finally {
      clearTimeout(timeout);
    }
  }
  function status(text = "Данные обновлены") {
    $("#sync-status").textContent = text;
  }
  function toast(text, error = false) {
    const el = document.createElement("div");
    el.className = `toast${error ? " error" : ""}`;
    el.textContent = text;
    $("#toasts").append(el);
    setTimeout(() => el.remove(), 5000);
  }
  function applyData(data) {
    state.restaurant = data.restaurant || state.restaurant;
    state.categories = (data.categories || []).sort(
      (a, b) => Number(a.sort_order) - Number(b.sort_order),
    );
    state.items = (data.items || []).sort(
      (a, b) => Number(a.sort_order) - Number(b.sort_order),
    );
    $$("[data-restaurant-name]").forEach(
      (el) => (el.textContent = state.restaurant.name || state.slug),
    );
    $$("[data-restaurant-city]").forEach(
      (el) =>
        (el.textContent = state.restaurant.city || "Рабочее пространство"),
    );
    $(".restaurant-avatar").textContent = (state.restaurant.name || "E").slice(
      0,
      1,
    );
    $("#demo-badge").hidden = state.restaurant.is_demo !== true;
    $$("[data-menu-link]").forEach((el) => (el.href = menuUrl()));
    document.title = `${state.restaurant.name || "Exort"} — управление меню`;
    renderNav();
  }
  function renderNav() {
    $("#main-nav").innerHTML = Object.entries(views)
      .map(
        ([key, value]) =>
          `<a class="nav-link" href="#${key}" ${state.view === key ? 'aria-current="page"' : ""}>${icon(value[2])}${value[0]}${key === "stoplist" && dishes().some(stopped) ? `<span class="nav-count">${dishes().filter(stopped).length}</span>` : ""}</a>`,
      )
      .join("");
  }
  function shell() {
    mountAdmin();
    document.body.classList.remove("admin-auth-only");
    $("#login").hidden = true;
    $("#app").hidden = false;
    renderNav();
    status();
  }
  function mountAdmin() {
    if (!protectedRoot.isConnected) document.body.insertBefore(protectedRoot, document.querySelector("noscript"));
    protectedRoot.hidden = false;
  }
  function unmountAdmin() {
    protectedRoot.hidden = true;
    protectedRoot.remove();
  }
  function syncAuthViewport() {
    const height = window.visualViewport?.height || window.innerHeight;
    if (height)
      document.documentElement?.style?.setProperty("--admin-auth-viewport-height", `${Math.round(height)}px`);
  }
  function loading(message = "Загружаем данные…") {
    return `<div class="loading" role="status">${esc(message)}</div>`;
  }
  function empty(title, text = "", action = "") {
    return `<div class="empty">${icon("menu")}<strong>${esc(title)}</strong><p>${esc(text)}</p>${action}</div>`;
  }
  function errorBox(message, action = "refresh") {
    return `<div class="error-box" role="alert"><strong>Не удалось загрузить данные</strong><p>${esc(message)}</p><button class="button compact" data-action="${action}">Повторить</button></div>`;
  }
  function heading(action = "") {
    const v = views[state.view];
    return `<div class="page-heading ${state.view === "analytics" ? "analytics-heading" : ""}"><div><div class="eyebrow">Рабочее пространство</div><h1>${v[0]}</h1><p>${v[1]}</p></div>${action ? `<div class="heading-actions">${action}</div>` : ""}</div>`;
  }
  const addItemButton = () =>
    `<button class="button primary" data-action="item-add" aria-label="Добавить блюдо">${icon("plus")}Добавить блюдо</button>`;
  async function navigate(view, focus = true) {
    state.view = views[view] ? view : "overview";
    navClose(false);
    $("#section-label").textContent = views[state.view][0];
    renderNav();
    render();
    if (focus) {
      $("#workspace").focus({ preventScroll: true });
      window.scrollTo(0, 0);
    }
    if (
      ["overview", "analytics"].includes(state.view) &&
      !state.analytics &&
      !state.analyticsLoading
    )
      loadAnalytics();
    if (state.view === "qr" && !state.qr && !state.qrLoading) loadQr();
  }
  function go(view) {
    if (location.hash === `#${view}`) navigate(view);
    else location.hash = view;
  }
  function render() {
    if (!state.token) return;
    const content = $("#content");
    if (state.view === "overview") content.innerHTML = overview();
    if (state.view === "menu" || state.view === "stoplist")
      content.innerHTML = renderMenu();
    if (state.view === "categories") content.innerHTML = categoriesView();
    if (state.view === "analytics") content.innerHTML = analyticsView();
    if (state.view === "qr") {
      content.innerHTML = qrView();
      renderCodes();
    }
    if (state.view === "restaurant" || state.view === "settings")
      content.innerHTML = restaurantView();
  }
  function metrics(items) {
    return `<div class="metrics">${items.map(([label, value, note, detail]) => detail ? `<button class="metric metric-button" type="button" data-action="stat-open" data-stat="${esc(detail)}"><span>${esc(label)}</span><strong>${value}</strong><small>${note || ""}</small><i class="metric-open" aria-hidden="true">↗</i></button>` : `<div class="metric"><span>${esc(label)}</span><strong>${value}</strong><small>${note || ""}</small></div>`).join("")}</div>`;
  }
  function statDishList(items, emptyText) {
    if (!items.length) return empty(emptyText);
    return `<div class="stat-list">${items.map((item, index) => `<div class="stat-list-row"><span>${String(index + 1).padStart(2, "0")}</span><div><strong>${esc(name(item))}</strong><small>${esc(categoryName(item.category_id))}</small></div><b>${money(item)}</b></div>`).join("")}</div>`;
  }
  function statDetail(kind) {
    const a = state.analytics;
    const period = a?.period?.label || "Текущий период";
    const allDishes = dishes();
    const active = allDishes.filter((item) => item.is_active !== false && !stopped(item) && !temporary(item));
    const titles = {
      available: ["Доступно гостям", "Позиции, которые сейчас видны и доступны в меню"],
      stoplist: ["Стоп-лист", "Позиции, временно недоступные гостям"],
      categories: ["Категории меню", "Структура публичного меню"],
      sessions: ["Сессии меню", period],
      engagement: ["Вовлечённые гости", period],
      opens: ["Открытия блюд", period],
      duration: ["Среднее время изучения", period],
      activity: [state.range === "today" ? "Активность по часам" : state.range === "all" ? "Активность по месяцам" : "Активность по дням", "Сессии и открытия карточек блюд"],
      insights: ["Выводы за период", period],
      popular: ["Популярные блюда", "По количеству открытий карточки"],
      hourly: ["Активность в течение дня", `Часовой пояс: ${a?.timeZone || "ресторана"}`],
      sources: ["Источники переходов", "Распределение сессий в выбранном периоде"],
    };
    let body = "";
    if (kind === "available") body = `<div class="stat-hero"><strong>${active.length}</strong><span>из ${allDishes.length} позиций доступны гостям</span></div>${statDishList(active, "Нет доступных блюд")}`;
    if (kind === "stoplist") body = `<div class="stat-hero"><strong>${allDishes.filter(stopped).length}</strong><span>позиций временно скрыты из продажи</span></div>${statDishList(allDishes.filter(stopped), "Стоп-лист пуст")}`;
    if (kind === "categories") body = `<div class="stat-hero"><strong>${state.categories.length}</strong><span>${state.categories.filter((c) => c.is_active !== false).length} видны гостям</span></div><div class="stat-list">${state.categories.map((category, index) => `<div class="stat-list-row"><span>${String(index + 1).padStart(2, "0")}</span><div><strong>${esc(name(category))}</strong><small>${category.is_active === false ? "Скрыта" : "Активна"}</small></div><b>${allDishes.filter((item) => item.category_id === category.id).length}</b></div>`).join("")}</div>`;
    if (["sessions", "activity"].includes(kind) && a) body = `<div class="stat-hero"><strong>${fmt(a.summary.sessions.value)}</strong><span>сессий за период</span></div>${chart(a.timeline || [])}`;
    if (kind === "engagement" && a) body = `<div class="stat-hero"><strong>${metricValue(a.summary.engagedRate)}</strong><span>гостей открыли хотя бы одну карточку блюда</span></div><div class="funnel-list">${(a.funnel || []).map((step) => `<div><span>${esc(step.label)}</span><strong>${fmt(step.value)}</strong><i style="width:${Math.max(2, Number(step.rate || 0))}%"></i><small>${fmt(step.rate)}% от предыдущего шага</small></div>`).join("")}</div>`;
    if (["opens", "popular", "duration"].includes(kind) && a) {
      const rows = [...(a.dishes || [])].sort((left, right) => kind === "duration" ? Number(right.averageViewMs || 0) - Number(left.averageViewMs || 0) : Number(right.opens || 0) - Number(left.opens || 0));
      const mainValue = kind === "duration" ? metricValue(a.summary.averageStudyMs) : metricValue(a.summary.dishOpens);
      const mainLabel = kind === "duration" ? "среднее время изучения меню" : "открытий карточек блюд";
      body = `<div class="stat-hero"><strong>${mainValue}</strong><span>${mainLabel}</span></div><div class="stat-list">${rows.map((item, index) => `<div class="stat-list-row"><span>${String(index + 1).padStart(2, "0")}</span><div><strong>${esc(item.title)}</strong><small>${fmt(item.sessionShare)}% сессий · ${duration(item.averageViewMs)}</small></div><b>${fmt(item.opens)}</b></div>`).join("")}</div>`;
    }
    if (kind === "insights" && a) body = a.insights?.length ? `<ul class="stat-insights">${a.insights.map((text) => `<li>${icon("arrow")}<span>${esc(text)}</span></li>`).join("")}</ul>` : empty("Пока недостаточно данных", "Выводы появятся после накопления как минимум пяти сессий.");
    if (kind === "hourly" && a) body = `<div class="stat-hero"><strong>${esc(a.dayDetails?.[state.hourDay]?.label || "—")}</strong><span>выбранный день</span></div>${chart(a.dayDetails?.[state.hourDay]?.hours || [], "sessions", true)}`;
    if (kind === "sources" && a) body = a.sources?.length ? `<div class="source-row muted"><span>Источник</span><span>Сессии</span><span>Вовлечённость</span></div>${a.sources.map((source) => `<div class="source-row"><strong>${esc(source.name)}</strong><span>${fmt(source.sessions)}</span><span>${fmt(source.engagement)}%</span></div>`).join("")}` : empty("Нет переходов", "Данные появятся после посещений меню.");
    if (!body) body = empty("Данные ещё загружаются", "Попробуйте открыть статистику через несколько секунд.");
    return { title: titles[kind]?.[0] || "Статистика", subtitle: titles[kind]?.[1] || period, body };
  }
  function openStatPopup(kind) {
    const detail = statDetail(kind);
    const dialog = $("#stat-dialog");
    dialog.innerHTML = `<section class="stat-dialog-shell"><header><div><span class="eyebrow">Подробная статистика</span><h2 id="stat-dialog-title">${esc(detail.title)}</h2><p>${esc(detail.subtitle)}</p></div><button class="icon-button" type="button" data-action="stat-close" aria-label="Закрыть статистику">${icon("close")}</button></header><div class="stat-dialog-body">${detail.body}</div></section>`;
    if (!dialog.open) dialog.showModal();
  }
  function overview() {
    const items = dishes();
    const active = items.filter(
      (i) =>
        i.is_active !== false &&
        !stopped(i) &&
        !temporary(i) &&
        state.categories.find((c) => c.id === i.category_id)?.is_active !==
          false,
    );
    const missingPhotos = items.filter((i) => !i.image_url).length;
    const missingTranslations = items.filter(
      (i) => !(i.name_kz || i.title_kk) || !(i.name_en || i.title_en),
    ).length;
    const recent = [...items]
      .filter((i) => i.updated_at)
      .sort((a, b) => Date.parse(b.updated_at) - Date.parse(a.updated_at))
      .slice(0, 4);
    const a = state.analytics;
    return `${heading(addItemButton())}<section class="menu-status"><div class="status-copy"><span class="status-icon">${icon("check")}</span><div><div class="eyebrow">Ваше цифровое меню</div><h2>${state.restaurant.is_active === false ? "Ресторан неактивен" : "Меню доступно гостям"}</h2><p>${esc(state.restaurant.name)} · ${active.length} ${plural(active.length, "блюдо", "блюда", "блюд")} доступны к выбору</p></div></div><a class="button" href="${menuUrl()}" target="_blank" rel="noopener">Открыть меню ${icon("arrow")}</a></section>
      ${metrics([
        ["Доступно гостям", active.length, `из ${items.length} позиций меню`, "available"],
        [
          "В стоп-листе",
          items.filter(stopped).length,
          "Временно нет в наличии",
          "stoplist",
        ],
        [
          "Категории",
          state.categories.length,
          `${state.categories.filter((c) => c.is_active !== false).length} видны гостям`,
          "categories",
        ],
        [
          {
            today: "Сессии сегодня",
            "7d": "Сессии за 7 дней",
            "30d": "Сессии за 30 дней",
            all: "Сессии за всё время",
          }[state.range],
          a ? fmt(a.summary.sessions.value) : "—",
          state.source === "all"
            ? "Полноценные открытия меню"
            : "По выбранному источнику",
          "sessions",
        ],
      ])}
      <div class="two-columns"><section class="panel stat-expandable" tabindex="0" data-action="stat-open" data-stat="activity"><div class="panel-head"><div><h3>Посещаемость меню</h3><p>${a ? esc(a.period.label) : "Данные о взаимодействии гостей"}</p></div><button class="text-button" data-action="view" data-view="analytics">Аналитика ${icon("arrow")}</button></div>${state.analyticsLoading ? loading("Загружаем аналитику…") : state.analyticsError ? `<div class="panel-body">${errorBox(state.analyticsError, "analytics-retry")}</div>` : a ? `<div class="chart-stats"><strong>${fmt(a.summary.sessions.value)}</strong><span>сессий за период</span></div>${chart(a.timeline || [], "sessions")}` : empty("Нет данных аналитики")}</section>
      <section class="panel"><div class="panel-head"><div><h3>Требует внимания</h3><p>Проверьте перед началом смены</p></div><span class="badge">${missingPhotos + missingTranslations + items.filter(stopped).length}</span></div><div class="panel-body">${attention("stop", items.filter(stopped).length, "В стоп-листе", "Верните доступные блюда в меню")}${attention("photo", missingPhotos, "Без фотографии", "Покажите гостям, что они выбирают")}${attention("translation", missingTranslations, "Неполные переводы", "Проверьте названия на KZ и EN")}</div></section></div>
      <section class="panel"><div class="panel-head"><div><h3>Последние изменения</h3><p>По времени обновления блюд</p></div><button class="text-button" data-action="view" data-view="menu">Все блюда ${icon("arrow")}</button></div>${recent.length ? recent.map((i) => `<div class="recent-row">${photo(i)}<div><button class="dish-name" data-action="item-edit" data-id="${esc(i.id)}">${esc(name(i))}</button><small>${esc(categoryName(i.category_id))} · ${money(i)}</small></div><span class="badge ${stopped(i) ? "stop" : ""}">${stopped(i) ? "Стоп-лист" : i.is_active === false ? "Скрыто" : "Активно"}</span><time datetime="${esc(i.updated_at)}">${date(i.updated_at)}</time></div>`).join("") : empty("История обновлений пока недоступна", "Здесь появятся записи с датой последнего изменения.")}</section>`;
  }
  function plural(n, one, few, many) {
    return n % 100 >= 11 && n % 100 <= 14
      ? many
      : n % 10 === 1
        ? one
        : n % 10 >= 2 && n % 10 <= 4
          ? few
          : many;
  }
  function attention(issue, count, title, detail) {
    return `<div class="attention-row"><span>${count}</span><div><strong>${title}</strong><small>${count ? detail : "Всё в порядке"}</small></div><button class="icon-button" data-action="issue" data-issue="${issue}" aria-label="${title}">${icon("arrow")}</button></div>`;
  }
  function filtered() {
    return dishes().filter(
      (i) =>
        (!state.query ||
          [name(i), i.name_kz, i.name_en, categoryName(i.category_id)]
            .join(" ")
            .toLowerCase()
            .includes(state.query.toLowerCase())) &&
        (state.category === "all" || i.category_id === state.category) &&
        (state.status === "all" ||
          (state.status === "active"
            ? i.is_active !== false
            : i.is_active === false)) &&
        (state.view === "stoplist"
          ? stopped(i)
          : state.stock === "all" ||
            (state.stock === "stop" ? stopped(i) : !stopped(i))) &&
        (state.issue !== "photo" || !i.image_url) &&
        (state.issue !== "translation" ||
          !(i.name_kz || i.title_kk) ||
          !(i.name_en || i.title_en)),
    );
  }
  function renderMenu() {
    return `${heading(addItemButton())}<section class="panel"><div class="filters ${state.filtersOpen ? "filters-open" : ""}"><label class="search-field">${icon("search")}<input id="menu-search" type="search" aria-label="Поиск блюда" placeholder="Найти блюдо или категорию…" value="${esc(state.query)}" /></label><button class="icon-button filter-toggle" data-action="filters" aria-expanded="${state.filtersOpen}" aria-label="Показать фильтры">${icon("filter")}</button><div class="filter-controls"><select id="category-filter" aria-label="Категория"><option value="all">Все категории</option>${state.categories.map((c) => `<option value="${esc(c.id)}" ${state.category === c.id ? "selected" : ""}>${esc(name(c))}</option>`).join("")}</select><select id="status-filter" aria-label="Статус"><option value="all">Все статусы</option><option value="active" ${state.status === "active" ? "selected" : ""}>Активные</option><option value="hidden" ${state.status === "hidden" ? "selected" : ""}>Скрытые</option></select>${state.view !== "stoplist" ? `<select id="stock-filter" aria-label="Доступность"><option value="all">Любая доступность</option><option value="available" ${state.stock === "available" ? "selected" : ""}>В наличии</option><option value="stop" ${state.stock === "stop" ? "selected" : ""}>В стоп-листе</option></select>` : ""}</div></div><div id="menu-results">${menuResults()}</div></section>`;
  }
  function stockButton(i) {
    return `<button class="stock-control" data-action="stock" data-id="${esc(i.id)}" aria-pressed="${stopped(i)}" aria-label="${stopped(i) ? "Вернуть в наличие" : "В стоп-лист"}: ${esc(name(i))}"><span class="switch" aria-hidden="true"></span>${stopped(i) ? "Стоп-лист" : "В наличии"}</button>`;
  }
  function menuResults() {
    const rows = filtered();
    const activeFilters =
      state.query ||
      state.category !== "all" ||
      state.status !== "all" ||
      state.stock !== "all" ||
      state.issue;
    const top = `<div class="result-line"><span>${rows.length} ${plural(rows.length, "позиция", "позиции", "позиций")} ${state.issue ? `· ${state.issue === "photo" ? "Без фотографии" : "Неполные переводы"}` : `из ${dishes().length}`}</span>${activeFilters ? '<button class="text-button" data-action="filters-reset">Сбросить фильтры</button>' : "<span>Изменения сохраняются в меню</span>"}</div>`;
    if (!rows.length)
      return (
        top +
        empty(
          state.view === "stoplist" && !activeFilters
            ? "Стоп-лист пуст"
            : activeFilters
              ? "Ничего не найдено"
              : "Добавьте первое блюдо",
          activeFilters
            ? "Измените запрос или сбросьте фильтры."
            : state.view === "stoplist"
              ? "Все блюда в наличии. Доступностью можно управлять в меню."
              : "Создайте категорию и заполните ваше меню.",
          activeFilters
            ? '<button class="button" data-action="filters-reset">Сбросить фильтры</button>'
            : state.view === "stoplist"
              ? '<button class="button" data-action="view" data-view="menu">Открыть меню</button>'
              : addItemButton(),
        )
      );
    return (
      top +
      `<table class="menu-table"><thead><tr><th>Блюдо</th><th>Категория</th><th>Цена</th><th>Доступность</th><th><span class="muted">Действия</span></th></tr></thead><tbody>${rows.map((i) => `<tr><td><div class="dish-cell">${photo(i)}<div><button class="dish-name" data-action="item-edit" data-id="${esc(i.id)}">${esc(name(i))}</button><small>${i.name_kz || i.title_kk ? "KZ" : "KZ —"} · ${i.name_en || i.title_en ? "EN" : "EN —"}${!i.image_url ? " · Без фото" : ""}</small></div></div></td><td><span class="muted">${esc(categoryName(i.category_id))}</span></td><td><strong>${money(i)}</strong></td><td>${stockButton(i)}${i.is_active === false ? '<span class="badge hidden-badge">Скрыто</span>' : temporary(i) ? `<span class="badge stop">Пауза до ${date(i.inactive_until)}</span>` : ""}</td><td><div class="row-actions"><button class="icon-button" data-action="item-edit" data-id="${esc(i.id)}" aria-label="Редактировать ${esc(name(i))}">${icon("edit")}</button><button class="icon-button" data-action="item-delete" data-id="${esc(i.id)}" aria-label="Удалить ${esc(name(i))}">${icon("trash")}</button></div></td></tr>`).join("")}</tbody></table><div class="mobile-items">${rows.map((i) => `<article class="mobile-dish"><div class="mobile-dish-main">${photo(i)}<div><button class="dish-name" data-action="item-edit" data-id="${esc(i.id)}">${esc(name(i))}</button><small>${esc(categoryName(i.category_id))}${i.is_active === false ? " · Скрыто" : ""}</small></div><button class="icon-button" data-action="item-edit" data-id="${esc(i.id)}" aria-label="Редактировать ${esc(name(i))}">${icon("edit")}</button></div><div class="mobile-dish-foot"><strong>${money(i)}</strong>${stockButton(i)}</div></article>`).join("")}</div>`
    );
  }
  function categoriesView() {
    return `${heading('<button class="button primary" data-action="category-add">' + icon("plus") + "Добавить категорию</button>")}<section class="panel">${state.categories.length ? state.categories.map((c, index) => `<div class="category-row"><span class="category-index">${String(index + 1).padStart(2, "0")}</span><div><strong>${esc(name(c))}</strong><small>${esc(c.name_kz || c.title_kk || "Нет KZ")} · ${esc(c.name_en || c.title_en || "Нет EN")}</small></div><span class="muted">${dishes().filter((i) => i.category_id === c.id).length} блюд</span><span class="badge ${c.is_active === false ? "hidden-badge" : ""}">${c.is_active === false ? "Скрыта" : "Активна"}</span><div class="row-actions"><button class="icon-button" data-action="category-up" data-id="${esc(c.id)}" ${index === 0 ? "disabled" : ""} aria-label="Переместить ${esc(name(c))} выше">↑</button><button class="icon-button" data-action="category-down" data-id="${esc(c.id)}" ${index === state.categories.length - 1 ? "disabled" : ""} aria-label="Переместить ${esc(name(c))} ниже">↓</button><button class="icon-button" data-action="category-edit" data-id="${esc(c.id)}" aria-label="Редактировать категорию ${esc(name(c))}">${icon("edit")}</button></div></div>`).join("") : empty("Категорий пока нет", "Добавьте первую категорию, чтобы распределить блюда.")}</section><p class="note section-gap">Порядок категорий совпадает с меню гостей. Скрытая категория не отображается в публичном меню.</p>`;
  }
  async function loadAnalytics() {
    const id = ++state.analyticsRequest;
    const generation = state.generation;
    state.analyticsLoading = true;
    state.analyticsError = "";
    state.analytics = null;
    status("Загрузка аналитики…");
    if (["overview", "analytics"].includes(state.view)) render();
    try {
      const result = await api("getAnalytics", {
        range: state.range,
        sourceId: state.source === "all" ? "" : state.source,
        heatmapRange: "current_week",
      });
      if (id !== state.analyticsRequest || generation !== state.generation)
        return;
      if (!result.analytics?.summary || !result.analytics.period)
        throw new Error("Получен неполный ответ аналитики. Повторите запрос.");
      state.analytics = result.analytics;
      state.hourDay =
        Object.keys(state.analytics.dayDetails || {}).at(-1) || "";
    } catch (e) {
      if (id === state.analyticsRequest) state.analyticsError = e.message;
    } finally {
      if (id === state.analyticsRequest && generation === state.generation) {
        state.analyticsLoading = false;
        status();
        if (["overview", "analytics"].includes(state.view)) render();
      }
    }
  }
  function chart(rows, key = "sessions", hourly = false) {
    if (!rows.length)
      return empty(
        "Нет данных за период",
        "Попробуйте другой период или источник.",
      );
    const max = Math.max(...rows.map((r) => Number(r[key] || 0)), 1);
    const peak = rows.findIndex((r) => Number(r[key]) === max);
    const labels = rows.map(
      (r) => r.label || `${String(r.hour).padStart(2, "0")}:00`,
    );
    return `<div class="chart-wrap ${hourly ? "hour-chart" : ""}"><div class="chart" role="group" aria-label="${hourly ? "Почасовая активность" : "Сессии меню за период"}">${rows.map((r, index) => `<button class="chart-point ${index === peak ? "peak" : ""}" type="button" aria-label="${esc(labels[index])}: ${fmt(r[key])} сессий, ${fmt(r.dishOpens)} открытий блюд"><span class="chart-bar" style="height:${(Number(r[key] || 0) / max) * 88}%"></span><span class="chart-tip" role="tooltip">${esc(labels[index])}\n${fmt(r[key])} сессий\n${fmt(r.dishOpens)} открытий</span></button>`).join("")}</div><div class="chart-labels" aria-hidden="true">${labels.map((label, i) => `<span>${hourly ? String(rows[i].hour).padStart(2, "0") : rows.length > 14 && i % Math.ceil(rows.length / 7) ? "" : esc(label.replace(/ 20\d\d.*$/, ""))}</span>`).join("")}</div><div class="chart-caption"><span class="legend">Сессии меню</span><span>${rows.every((r) => !r[key]) ? "За период нет сессий" : "Оранжевым — пик периода"}</span></div></div>`;
  }
  const periods = () =>
    `<div class="periods" role="group" aria-label="Период аналитики">${[
      ["today", "Сегодня"],
      ["7d", "7 дней"],
      ["30d", "30 дней"],
      ["all", "Всё время"],
    ]
      .map(
        ([value, label]) =>
          `<button data-action="period" data-range="${value}" aria-pressed="${state.range === value}">${label}</button>`,
      )
      .join("")}</div>`;
  function metricValue(metric) {
    return metric?.value == null
      ? "—"
      : metric.format === "percent"
        ? `${fmt(metric.value)}%`
        : metric.format === "duration"
          ? duration(metric.value)
          : fmt(metric.value);
  }
  function analyticsView() {
    const a = state.analytics;
    const header = heading(periods());
    if (state.analyticsLoading)
      return (
        header +
        `<section class="panel">${loading("Собираем аналитику меню…")}</section>`
      );
    if (state.analyticsError)
      return header + errorBox(state.analyticsError, "analytics-retry");
    if (!a)
      return (
        header +
        empty(
          "Аналитика ещё не загружена",
          "",
          '<button class="button" data-action="analytics-retry">Загрузить</button>',
        )
      );
    const summary = [
      ["Сессии меню", a.summary.sessions],
      ["Вовлечённые гости", a.summary.engagedRate],
      ["Открытия блюд", a.summary.dishOpens],
      ["Среднее время изучения", a.summary.averageStudyMs],
    ];
    const topDishes = [...(a.dishes || [])]
      .sort((x, y) => y.opens - x.opens)
      .slice(0, 6);
    const maxOpens = Math.max(...topDishes.map((d) => d.opens), 1);
    const hourDetails = a.dayDetails || {};
    return (
      header +
      `<div class="analytics-toolbar"><p>${esc(a.period.label)}<br />${state.range === "all" ? "Без сравнения периодов" : `Сравнение: ${esc(a.period.comparisonLabel)}`} · ${esc(a.timeZone || "")}</p><select id="analytics-source" aria-label="Источник аналитики"><option value="all">Все источники</option>${(
        a.sourceOptions || []
      )
        .filter((s) => s.id !== "all")
        .map(
          (s) =>
            `<option value="${esc(s.id)}" ${state.source === s.id ? "selected" : ""}>${esc(s.name)}${s.isActive === false ? " · архив" : ""}</option>`,
        )
        .join("")}</select></div>
      ${metrics(summary.map(([label, m], index) => [label, metricValue(m), state.range === "all" ? "За всё время" : m?.change == null ? "Нет данных для сравнения" : `<span class="delta">${m.change > 0 ? "+" : ""}${fmt(m.change)}%</span> к предыдущему периоду`, ["sessions", "engagement", "opens", "duration"][index]]))}
      <div class="two-columns"><section class="panel stat-expandable" tabindex="0" data-action="stat-open" data-stat="activity"><div class="panel-head"><div><h3>${state.range === "today" ? "Активность по часам" : state.range === "all" ? "Активность по месяцам" : "Активность по дням"}</h3><p>Сессии и открытия карточек блюд</p></div><span class="badge">${fmt(a.summary.sessions.value)} сессий</span></div>${chart(a.timeline || [])}</section><section class="panel stat-expandable" tabindex="0" data-action="stat-open" data-stat="insights"><div class="panel-head"><div><h3>Выводы за период</h3><p>На основе поведения гостей</p></div>${icon("chart")}</div>${a.insights?.length ? `<ul class="insights">${a.insights.map((text) => `<li>${icon("arrow")}<span>${esc(text)}</span></li>`).join("")}</ul>` : empty("Пока недостаточно данных", "Выводы появятся после накопления как минимум пяти сессий.")}</section></div>
      <div class="two-columns equal-columns"><section class="panel stat-expandable" tabindex="0" data-action="stat-open" data-stat="popular"><div class="panel-head"><div><h3>Популярные блюда</h3><p>По количеству открытий карточки</p></div></div><div class="panel-body">${topDishes.some((d) => d.opens > 0) ? topDishes.map((d, i) => `<div class="rank-row"><span class="muted">${String(i + 1).padStart(2, "0")}</span><div><strong>${esc(d.title)}</strong><div class="rank-track"><i style="width:${(d.opens / maxOpens) * 100}%"></i></div><small>${fmt(d.sessionShare)}% сессий · ${duration(d.averageViewMs)}</small></div><strong>${fmt(d.opens)}</strong></div>`).join("") : empty("Нет открытий блюд", "За выбранный период гости ещё не открывали карточки.")}</div></section><section class="panel stat-expandable" tabindex="0" data-action="stat-open" data-stat="hourly"><div class="panel-head"><div><h3>Активность в течение дня</h3><p>Часовой пояс: ${esc(a.timeZone || "ресторана")}</p></div></div><div class="panel-body"><label>День<select id="hour-day">${Object.entries(
        hourDetails,
      )
        .map(
          ([key, value]) =>
            `<option value="${esc(key)}" ${key === state.hourDay ? "selected" : ""}>${esc(value.label)}</option>`,
        )
        .join(
          "",
        )}</select></label></div><div id="hour-chart">${chart(hourDetails[state.hourDay]?.hours || [], "sessions", true)}</div></section></div>
      <section class="panel stat-expandable" tabindex="0" data-action="stat-open" data-stat="sources"><div class="panel-head"><div><h3>Источники переходов</h3><p>Распределение сессий в выбранном периоде</p></div><button class="text-button" data-action="view" data-view="qr">QR-источники ${icon("arrow")}</button></div>${a.sources?.length ? `<div class="source-row muted"><span>Источник</span><span>Сессии</span><span>Вовлечённость</span></div>${a.sources.map((s) => `<div class="source-row"><strong>${esc(s.name)}</strong><span>${fmt(s.sessions)}</span><span>${fmt(s.engagement)}%</span></div>`).join("")}` : empty("Нет переходов", "Данные появятся после посещений меню.")}</section>`
    );
  }
  function restaurantView() {
    const r = state.restaurant;
    const fields =
      state.view === "restaurant"
        ? [
            ["Название", r.name],
            ["Город", r.city],
            ["Адрес", r.address_ru],
            ["Режим работы", r.hours_ru],
            ["Телефон", r.phone],
            ["Описание", r.about_ru],
            [
              "Обслуживание",
              r.service_fee_percent == null ? "" : `${r.service_fee_percent}%`,
            ],
            [
              "Языки меню",
              (r.supported_languages || [])
                .map((l) => l.toUpperCase())
                .join(" · "),
            ],
          ]
        : [
            ["Доступ", "Администратор · PIN ресторана"],
            ["Заведение", r.name],
            ["Идентификатор", state.slug],
            ["Режим", r.is_demo ? "Демо-ресторан" : "Рабочий ресторан"],
            ["Статус", r.is_active === false ? "Неактивен" : "Активен"],
            ["Ссылка на меню", menuUrl()],
          ];
    return `${heading(state.view === "restaurant" ? `<a class="button" href="${menuUrl()}" target="_blank" rel="noopener">Открыть меню ↗</a>` : '<button class="button" data-action="logout">Выйти из аккаунта</button>')}<section class="panel"><div class="panel-head"><div><h3>${state.view === "restaurant" ? "Данные заведения" : "Параметры доступа"}</h3><p>Текущие данные ресторана</p></div><span class="badge">Только просмотр</span></div><dl class="details-grid">${fields.map(([label, value]) => `<div class="detail-field"><dt>${label}</dt><dd>${esc(value || "Не указано")}</dd></div>`).join("")}</dl></section><p class="note section-gap">${state.view === "restaurant" ? "Изменение реквизитов ресторана в этой панели недоступно. Для обновления обратитесь в Exort." : "Сессия сохраняется в текущей вкладке. После выхода для доступа снова потребуется PIN ресторана."}</p>`;
  }
  function field(label, key, value, type = "text", extra = "") {
    return `<label>${label}<input name="${key}" type="${type}" value="${esc(value ?? "")}" ${extra} aria-describedby="error-${key}" /><span class="form-error" id="error-${key}"></span></label>`;
  }
  function openEditor(id = "") {
    const item = state.items.find((i) => i.id === id) || {
      is_active: true,
      is_stoplisted: false,
      currency: "KZT",
      sort_order:
        Math.max(0, ...state.items.map((i) => Number(i.sort_order || 0))) + 10,
    };
    state.editorItem = item;
    state.image = item.image_url || "";
    state.imageData = "";
    state.dirty = false;
    $("#editor").innerHTML =
      `<form id="item-form" novalidate><header class="dialog-header"><div><div class="eyebrow">Меню / ${item.id ? "Редактирование" : "Новое блюдо"}</div><h2 id="editor-title">${item.id ? esc(name(item)) : "Добавить блюдо"}</h2></div><button type="button" class="icon-button" data-action="editor-close" aria-label="Закрыть редактор">${icon("close")}</button></header><div class="editor-layout"><aside class="editor-aside"><div class="editor-photo" id="photo-preview"></div><label class="button upload-button">${icon("image")}Загрузить фото<input id="item-photo" type="file" accept="image/jpeg,image/png,image/webp,image/avif" aria-label="Загрузить фотографию блюда" /></label><p class="note">JPG, PNG, WebP или AVIF · до 10 МБ.<br />Фотография сохраняется вместе с блюдом.</p><button class="text-button" type="button" data-action="photo-remove">Удалить фотографию</button><p class="form-error" id="photo-error" role="alert"></p><div class="availability"><h3>Доступность</h3><label class="check-line"><input name="is_active" type="checkbox" ${item.is_active !== false ? "checked" : ""} />Показывать в меню</label><label class="check-line"><input name="is_stoplisted" type="checkbox" ${stopped(item) ? "checked" : ""} />Временно в стоп-листе</label><p class="note">Стоп-лист сохраняет блюдо в меню, но помечает его недоступным.</p></div></aside><div class="editor-form-fields"><div class="language-tabs" role="tablist" aria-label="Язык блюда">${[
        ["ru", "Русский"],
        ["kz", "Қазақша"],
        ["en", "English"],
      ]
        .map(
          ([lang, label], index) =>
            `<button id="tab-${lang}" role="tab" aria-selected="${index === 0}" aria-controls="fields-${lang}" tabindex="${index === 0 ? 0 : -1}" type="button" data-action="language" data-lang="${lang}">${label}</button>`,
        )
        .join(
          "",
        )}</div>${["ru", "kz", "en"].map((lang) => `<div id="fields-${lang}" role="tabpanel" aria-labelledby="tab-${lang}" ${lang !== "ru" ? "hidden" : ""}>${field(`Название${lang === "ru" ? " *" : ""}`, `name_${lang}`, item[`name_${lang}`] || item[`title_${lang === "kz" ? "kk" : lang}`] || "", "text", 'maxlength="200"')}<label>Описание<textarea name="description_${lang}" rows="3" maxlength="4000" placeholder="Ингредиенты и особенности блюда">${esc(item[`description_${lang}`] || item[`description_${lang === "kz" ? "kk" : lang}`] || "")}</textarea></label></div>`).join("")}<div class="field-row"><label>Категория *<select name="category_id" aria-describedby="error-category_id"><option value="">Выберите категорию</option>${state.categories.map((c) => `<option value="${esc(c.id)}" ${c.id === item.category_id ? "selected" : ""}>${esc(name(c))}</option>`).join("")}</select><span class="form-error" id="error-category_id"></span></label>${field("Цена *", "price", item.price, "number", 'min="0" step="0.01"')}</div><div class="field-row"><label>Валюта<select name="currency">${[...new Set([item.currency || "KZT", "KZT", "USD", "EUR", "RUB"])].map((c) => `<option ${c === (item.currency || "KZT") ? "selected" : ""}>${esc(c)}</option>`).join("")}</select></label></div><details class="section-gap"><summary class="note">Дополнительные параметры</summary><div class="field-row">${field("Вес / объём", "weight", item.weight)}${field("Калории, ккал", "calories", item.calories, "number", 'min="0" step="1"')}</div><div class="field-row">${field("Порядок в категории", "sort_order", item.sort_order, "number", 'min="0" step="1"')}<label>Острота<select name="spice_level">${[
        ["", "Не указана"],
        ["mild", "Лёгкая"],
        ["medium", "Средняя"],
        ["hot", "Острая"],
      ]
        .map(
          ([v, label]) =>
            `<option value="${v}" ${item.spice_level === v ? "selected" : ""}>${label}</option>`,
        )
        .join(
          "",
        )}</select></label></div>${field("Недоступно до (ваше местное время)", "inactive_until", localDateTime(item.inactive_until), "datetime-local")}</details><p class="form-error" id="item-save-error" role="alert"></p></div></div><footer class="editor-footer"><div>${item.id ? `<button class="button danger" type="button" data-action="item-delete" data-id="${esc(item.id)}" aria-label="Удалить блюдо">${icon("trash")}<span class="desktop-only">Удалить</span></button>` : ""}<span id="dirty-status" class="note">Нет изменений</span></div><div><button class="button" type="button" data-action="editor-close">Отмена</button><button class="button primary" type="submit">Сохранить блюдо</button></div></footer></form>`;
    renderPhoto();
    $("#editor").showModal();
    $("[name=name_ru]", $("#editor")).focus();
  }
  function localDateTime(value) {
    if (!value || Number.isNaN(Date.parse(value))) return "";
    const d = new Date(value);
    return new Date(d.getTime() - d.getTimezoneOffset() * 60000)
      .toISOString()
      .slice(0, 16);
  }
  function renderPhoto() {
    $("#photo-preview").innerHTML =
      state.imageData || state.image
        ? `<img src="${esc(state.imageData || imageUrl(state.image))}" alt="Предпросмотр фотографии" />`
        : `<div>${icon("image")}Фото блюда</div>`;
  }
  function markDirty() {
    state.dirty = true;
    if ($("#dirty-status"))
      $("#dirty-status").textContent = "Есть несохранённые изменения";
  }
  function setLanguage(lang) {
    $$("[role=tab]", $("#editor")).forEach((tab) => {
      const active = tab.dataset.lang === lang;
      tab.setAttribute("aria-selected", active);
      tab.tabIndex = active ? 0 : -1;
    });
    $$("[role=tabpanel]", $("#editor")).forEach(
      (panel) => (panel.hidden = panel.id !== `fields-${lang}`),
    );
  }
  async function confirmation(title, message, label = "Продолжить") {
    const dialog = $("#confirmation");
    if (dialog.open) return false;
    $("#confirm-title").textContent = title;
    $("#confirm-message").textContent = message;
    $("#confirm-accept").textContent = label;
    dialog.returnValue = "cancel";
    dialog.showModal();
    return new Promise((resolve) =>
      dialog.addEventListener(
        "close",
        () => resolve(dialog.returnValue === "accept"),
        { once: true },
      ),
    );
  }
  async function closeEditor() {
    if (state.busy || state.photoBusy) return;
    if (
      state.dirty &&
      !(await confirmation(
        "Не сохранять изменения?",
        "Изменения блюда будут потеряны. Вы можете вернуться к редактированию.",
        "Не сохранять",
      ))
    )
      return;
    state.dirty = false;
    $("#editor").close();
  }
  function fieldError(form, key, text) {
    const input = form.elements.namedItem(key);
    input?.classList.add("invalid");
    input?.setAttribute("aria-invalid", "true");
    const el = $(`#error-${key}`, form);
    if (el) el.textContent = text;
  }
  async function saveItem(form) {
    if (state.busy || state.photoBusy) return;
    const data = Object.fromEntries(new FormData(form));
    $$(".form-error", form).forEach((el) => (el.textContent = ""));
    $$(".invalid", form).forEach((el) => {
      el.classList.remove("invalid");
      el.removeAttribute("aria-invalid");
    });
    if (!data.name_ru.trim()) {
      fieldError(form, "name_ru", "Введите название на русском.");
      setLanguage("ru");
    }
    if (!data.category_id)
      fieldError(form, "category_id", "Выберите категорию.");
    for (const key of ["price", "calories", "sort_order"])
      if (
        (key === "price" && data[key] === "") ||
        (data[key] !== "" &&
          (!Number.isFinite(Number(data[key])) || Number(data[key]) < 0))
      )
        fieldError(form, key, "Укажите число не меньше нуля.");
    if ($(".invalid", form)) {
      $(".invalid", form).focus();
      return;
    }
    const item = {
      id: state.editorItem.id || "",
      category_id: data.category_id,
      ...Object.fromEntries(
        [
          "name_ru",
          "name_kz",
          "name_en",
          "description_ru",
          "description_kz",
          "description_en",
          "weight",
          "spice_level",
          "currency",
        ].map((key) => [key, String(data[key] || "").trim()]),
      ),
      price: Number(data.price),
      calories: data.calories === "" ? null : Number(data.calories),
      sort_order: Number(data.sort_order) || 0,
      is_active: data.is_active === "on",
      is_stoplisted: data.is_stoplisted === "on",
      inactive_until: data.inactive_until
        ? new Date(data.inactive_until).toISOString()
        : null,
      image_url: state.image,
      imageData: state.imageData,
    };
    state.busy = true;
    busyForm(form, true);
    status("Сохраняем блюдо…");
    try {
      const result = await api("saveItem", { item });
      if (!result.item?.id)
        throw new Error(
          "Сервер не подтвердил сохранение. Обновите данные перед повторной попыткой.",
        );
      const index = state.items.findIndex((i) => i.id === result.item.id);
      index < 0
        ? state.items.push(result.item)
        : state.items.splice(index, 1, result.item);
      state.dirty = false;
      $("#editor").close();
      renderNav();
      render();
      toast("Блюдо сохранено");
    } catch (e) {
      $("#item-save-error").textContent = e.message;
    } finally {
      state.busy = false;
      busyForm(form, false);
      status();
    }
  }
  function busyForm(form, busy) {
    $$("button, input, select, textarea", form).forEach((el) => {
      if (busy) {
        el.dataset.wasDisabled = el.disabled ? "true" : "false";
        el.disabled = true;
      } else el.disabled = el.dataset.wasDisabled === "true";
    });
    form.setAttribute("aria-busy", busy);
    const button = $("button[type=submit]", form);
    if (button) {
      if (busy) {
        button.dataset.label = button.textContent;
        button.textContent = "Сохранение…";
      } else button.textContent = button.dataset.label || "Сохранить";
    }
  }
  async function deleteItem(id) {
    if (state.busy) return;
    const item = state.items.find((i) => i.id === id);
    if (!item) return;
    if (
      !(await confirmation(
        `Удалить «${name(item)}»?`,
        "Блюдо будет удалено из меню ресторана. Это действие нельзя отменить.",
        "Удалить блюдо",
      ))
    )
      return;
    state.busy = true;
    status("Удаляем блюдо…");
    const form = $("#item-form");
    if ($("#editor").open) busyForm(form, true);
    try {
      await api("deleteItem", { itemId: id });
      state.items = state.items.filter((i) => i.id !== id);
      state.dirty = false;
      $("#editor").close();
      renderNav();
      render();
      toast("Блюдо удалено");
    } catch (e) {
      if ($("#editor").open) $("#item-save-error").textContent = e.message;
      else toast(e.message, true);
    } finally {
      state.busy = false;
      if (form) busyForm(form, false);
      status();
    }
  }
  const stockPending = new Set();
  async function toggleStock(id) {
    if (stockPending.has(id)) return;
    const item = state.items.find((i) => i.id === id);
    if (!item) return;
    stockPending.add(id);
    $$(`[data-action=stock][data-id="${CSS.escape(id)}"]`).forEach(
      (b) => (b.disabled = true),
    );
    status("Обновляем доступность…");
    try {
      const result = await api("toggleStock", {
        itemId: id,
        is_stoplisted: !stopped(item),
      });
      if (!result.item)
        throw new Error("Сервер не подтвердил изменение доступности.");
      Object.assign(item, result.item);
      renderNav();
      render();
      toast(stopped(item) ? "Блюдо в стоп-листе" : "Блюдо снова в наличии");
    } catch (e) {
      toast(e.message, true);
    } finally {
      stockPending.delete(id);
      $$(`[data-action=stock][data-id="${CSS.escape(id)}"]`).forEach(
        (b) => (b.disabled = false),
      );
      status();
    }
  }
  async function uploadPhoto(file) {
    if (!file || state.photoBusy) return;
    state.photoBusy = true;
    $("#photo-error").textContent = "Подготавливаем фотографию…";
    const save = $("#item-form button[type=submit]");
    save.disabled = true;
    try {
      state.imageData = await window.AdminImageOptimizer.prepare(file);
      renderPhoto();
      markDirty();
      $("#photo-error").textContent = "";
    } catch (e) {
      $("#photo-error").textContent = e.message;
    } finally {
      state.photoBusy = false;
      save.disabled = false;
    }
  }
  function utility(title, body, type, id = "") {
    state.utilityDirty = false;
    $("#utility-dialog").innerHTML =
      `<form id="utility-form" data-type="${type}" data-id="${esc(id)}"><header class="dialog-header"><h2 id="utility-title">${title}</h2><button class="icon-button" type="button" data-action="utility-close" aria-label="Закрыть">${icon("close")}</button></header><div class="utility-body">${body}<p class="form-error" id="utility-error" role="alert"></p><div class="dialog-actions"><button class="button" type="button" data-action="utility-close">Отмена</button><button class="button primary" type="submit">Сохранить</button></div></div></form>`;
    if (!$("#utility-dialog").open) $("#utility-dialog").showModal();
  }
  async function closeUtility() {
    if (state.busy) return;
    if (
      state.utilityDirty &&
      !(await confirmation(
        "Закрыть без сохранения?",
        "Изменения формы будут потеряны.",
        "Закрыть",
      ))
    )
      return;
    state.utilityDirty = false;
    $("#utility-dialog").close();
  }
  function openCategory(id = "") {
    const c = state.categories.find((c) => c.id === id) || {};
    utility(
      id ? "Редактировать категорию" : "Новая категория",
      `${field("Название на русском *", "name_ru", name(c) === "Без названия" ? "" : name(c), "text", "required maxlength=200")}${field("Название на казахском", "name_kz", c.name_kz || c.title_kk)}${field("Название на английском", "name_en", c.name_en || c.title_en)}<label class="check-line section-gap"><input name="is_active" type="checkbox" ${c.is_active !== false ? "checked" : ""} />Показывать категорию в меню</label>${id ? `<hr class="subtle-rule" /><div class="heading-actions"><button type="button" class="button compact" data-action="category-split" data-id="${esc(id)}">Разделить категорию</button><button type="button" class="button compact danger" data-action="category-delete" data-id="${esc(id)}">Удалить</button></div>` : ""}`,
      "category",
      id,
    );
  }
  async function reorder(id, direction) {
    if (state.busy) return;
    const list = [...state.categories];
    const index = list.findIndex((c) => c.id === id);
    const target = index + direction;
    if (target < 0 || target >= list.length) return;
    [list[index], list[target]] = [list[target], list[index]];
    state.busy = true;
    status("Сохраняем порядок…");
    try {
      await api("sortCategories", {
        categories: list.map((c, i) => ({
          id: c.id,
          sort_order: (i + 1) * 10,
        })),
      });
      state.categories = list.map((c, i) => ({
        ...c,
        sort_order: (i + 1) * 10,
      }));
      render();
      toast("Порядок категорий обновлён");
    } catch (e) {
      toast(e.message, true);
    } finally {
      state.busy = false;
      status();
    }
  }
  async function openCategoryDelete(id) {
    if (
      state.utilityDirty &&
      !(await confirmation(
        "Перейти к удалению?",
        "Несохранённые изменения названия будут потеряны.",
        "Продолжить",
      ))
    )
      return;
    const rows = dishes().filter((i) => i.category_id === id);
    utility(
      "Удалить категорию",
      `<p class="note">В категории «${esc(name(state.categories.find((c) => c.id === id)))}» ${rows.length} блюд.</p>${
        rows.length
          ? `<label class="section-gap">Что сделать с блюдами?<select name="mode"><option value="move">Перенести в другую категорию</option><option value="cascade">Удалить вместе с категорией</option></select></label><label id="target-category-field">Куда перенести<select name="targetCategoryId"><option value="">Выберите категорию</option>${state.categories
              .filter((c) => c.id !== id)
              .map(
                (c) => `<option value="${esc(c.id)}">${esc(name(c))}</option>`,
              )
              .join("")}</select></label>`
          : '<input type="hidden" name="mode" value="empty" />'
      }<p class="note section-gap">Удаление требует подтверждения и не может быть отменено.</p>`,
      "category-delete",
      id,
    );
    $("#utility-form button[type=submit]").textContent = "Продолжить";
  }
  async function openSplit(id) {
    if (
      state.utilityDirty &&
      !(await confirmation(
        "Перейти к разделению?",
        "Несохранённые изменения формы будут потеряны.",
        "Продолжить",
      ))
    )
      return;
    utility(
      "Разделить категорию",
      `${field("Новая категория · RU *", "name_ru", "", "text", "required")}${field("Новая категория · KZ *", "name_kz", "", "text", "required")}${field("Новая категория · EN *", "name_en", "", "text", "required")}<h3 class="form-section-title">Перенести блюда</h3>${
        dishes()
          .filter((i) => i.category_id === id)
          .map(
            (i) =>
              `<label class="check-line"><input type="checkbox" name="itemIds" value="${esc(i.id)}" />${esc(name(i))}</label>`,
          )
          .join("") || '<p class="note">В категории нет блюд для переноса.</p>'
      }`,
      "category-split",
      id,
    );
  }
  async function saveUtility(form) {
    if (state.busy) return;
    const formData = new FormData(form);
    const data = Object.fromEntries(formData);
    const selectedItemIds = formData.getAll("itemIds");
    const type = form.dataset.type;
    const id = form.dataset.id;
    $("#utility-error").textContent = "";
    if (type === "category-delete") {
      if (data.mode === "move" && !data.targetCategoryId) {
        $("#utility-error").textContent = "Выберите категорию для переноса.";
        return;
      }
      if (
        !(await confirmation(
          "Удалить категорию?",
          data.mode === "cascade"
            ? "Категория и все её блюда будут удалены без возможности восстановления."
            : "Категория будет удалена. Блюда будут перенесены, если выбран перенос.",
          "Удалить",
        ))
      )
        return;
    }
    if (type === "category-split" && !selectedItemIds.length) {
      $("#utility-error").textContent = "Выберите хотя бы одно блюдо.";
      return;
    }
    if (type === "wifi") {
      createWifi(data);
      return;
    }
    state.busy = true;
    busyForm(form, true);
    status("Сохранение…");
    try {
      if (type === "category") {
        const current = state.categories.find((c) => c.id === id);
        const result = await api("saveCategory", {
          category: {
            id,
            name_ru: data.name_ru.trim(),
            name_kz: data.name_kz.trim(),
            name_en: data.name_en.trim(),
            is_active: data.is_active === "on",
            sort_order:
              current?.sort_order ??
              Math.max(
                0,
                ...state.categories.map((c) => Number(c.sort_order)),
              ) + 10,
          },
        });
        if (!result.category?.id)
          throw new Error("Сервер не подтвердил сохранение категории.");
        const index = state.categories.findIndex((c) => c.id === id);
        index < 0
          ? state.categories.push(result.category)
          : state.categories.splice(index, 1, result.category);
      }
      if (type === "category-delete")
        applyData(
          await api("deleteCategory", {
            categoryId: id,
            mode: data.mode,
            targetCategoryId: data.targetCategoryId || null,
          }),
        );
      if (type === "category-split")
        applyData(
          await api("splitCategory", {
            categoryId: id,
            category: {
              name_ru: data.name_ru.trim(),
              name_kz: data.name_kz.trim(),
              name_en: data.name_en.trim(),
            },
            itemIds: selectedItemIds,
          }),
        );
      if (type === "qr") {
        await api("createQrSource", {
          name: data.name.trim(),
          sourceType: data.sourceType,
          menuPath: "/demo-menu",
        });
        state.qr = null;
      }
      state.utilityDirty = false;
      $("#utility-dialog").close();
      renderNav();
      render();
      if (type === "qr") loadQr();
      toast("Изменения сохранены");
    } catch (e) {
      $("#utility-error").textContent = e.message;
    } finally {
      state.busy = false;
      busyForm(form, false);
      status();
    }
  }
  async function loadQr() {
    const id = ++state.qrRequest;
    const generation = state.generation;
    state.qrLoading = true;
    state.qrError = "";
    if (state.view === "qr") render();
    try {
      const result = await api("getQrSources");
      if (id === state.qrRequest && generation === state.generation)
        state.qr = result.sources || [];
    } catch (e) {
      if (id === state.qrRequest) state.qrError = e.message;
    } finally {
      if (id === state.qrRequest && generation === state.generation) {
        state.qrLoading = false;
        if (state.view === "qr") render();
      }
    }
  }
  function qrView() {
    const header = heading(
      '<button class="button" data-action="wifi-add">Wi-Fi QR</button><button class="button primary" data-action="qr-add">' +
        icon("plus") +
        "Создать источник</button>",
    );
    if (state.qrLoading)
      return (
        header +
        `<section class="panel">${loading("Загружаем QR-источники…")}</section>`
      );
    if (state.qrError) return header + errorBox(state.qrError, "qr-retry");
    const sources = (state.qr || []).filter((s) => s.is_active !== false);
    return (
      header +
      `<div class="qr-grid">${sources.map((s) => `<article class="panel qr-card"><div class="qr-image" data-qr-code="${esc(s.url || menuUrl())}"></div><h3>${esc(s.name)}</h3><span class="badge">${s.is_system || s.id === "direct" ? "Прямой вход" : s.source_type === "social" ? "Соцсеть" : "QR-источник"}</span><p class="qr-url">${esc(s.url || menuUrl())}</p><div class="heading-actions"><button class="button compact" data-action="qr-download" data-id="${esc(s.id)}">Скачать PNG</button><button class="button compact" data-action="qr-copy" data-id="${esc(s.id)}">Ссылка</button></div><footer><span>${fmt(s.visits)} сессий · ${date(s.lastVisitAt)}</span>${!s.is_system && s.id !== "direct" ? `<button class="icon-button" data-action="qr-delete" data-id="${esc(s.id)}" aria-label="Удалить источник ${esc(s.name)}">${icon("trash")}</button>` : ""}</footer></article>`).join("")}</div>${!sources.length ? `<section class="panel">${empty("Источников пока нет", "Создайте отдельные QR-коды для столов, залов и рекламы.")}</section>` : ""}<p class="note section-gap">Отдельный источник позволяет видеть его посещаемость в аналитике. Счётчик здесь показывает все сессии источника.</p>`
    );
  }
  function renderCodes() {
    $$("[data-qr-code]").forEach((el) => {
      if (!window.QRCode) {
        el.textContent = "QR недоступен";
        return;
      }
      new window.QRCode(el, {
        text: el.dataset.qrCode,
        width: 220,
        height: 220,
        colorDark: "#13261f",
        colorLight: "#ffffff",
        correctLevel: window.QRCode.CorrectLevel.H,
      });
    });
  }
  function openQr() {
    utility(
      "Новый QR-источник",
      `${field("Название источника *", "name", "", "text", 'required maxlength="100" placeholder="Например, Терраса"')}<label>Тип источника<select name="sourceType"><option value="qr">QR-код</option><option value="social">Социальная сеть</option><option value="link">Обычная ссылка</option></select></label><p class="note section-gap">Источник ведёт в меню ${esc(state.restaurant.name)}.</p>`,
      "qr",
    );
  }
  function openWifi() {
    utility(
      "Wi-Fi QR для гостей",
      `${field("Название сети · SSID *", "ssid", "", "text", 'required maxlength="64"')}<label>Защита<select name="security"><option value="WPA">WPA / WPA2</option><option value="WEP">WEP</option><option value="nopass">Без пароля</option></select></label>${field("Пароль сети", "password", "", "password", 'maxlength="63" autocomplete="new-password"')}<label class="check-line section-gap"><input type="checkbox" name="hidden" />Скрытая сеть</label><p class="note section-gap">Обрабатывается только в этом браузере. Данные сети не отправляются на сервер.</p>`,
      "wifi",
    );
  }
  function createWifi(data) {
    if (!window.QRCode) {
      $("#utility-error").textContent =
        "Не удалось загрузить генератор QR. Обновите страницу.";
      return;
    }
    const quote = (v) => String(v || "").replace(/([\\;,:"])/g, "\\$1");
    const payload = `WIFI:T:${data.security};S:${quote(data.ssid)};P:${data.security === "nopass" ? "" : quote(data.password)};H:${data.hidden === "on"};;`;
    state.utilityDirty = false;
    $("#utility-dialog").innerHTML =
      `<div class="dialog-header"><h2 id="utility-title">${esc(data.ssid)}</h2><button class="icon-button" data-action="utility-close" aria-label="Закрыть">${icon("close")}</button></div><div class="utility-body"><div class="qr-full" data-qr-code="${esc(payload)}"></div><button class="button primary" data-action="wifi-download">Скачать PNG</button><p class="note section-gap">QR-код содержит данные подключения к Wi-Fi.</p></div>`;
    renderCodes();
  }
  function downloadQr(url, title) {
    if (!window.QRCode) {
      toast("Генератор QR недоступен. Обновите страницу.", true);
      return;
    }
    const el = document.createElement("div");
    new window.QRCode(el, {
      text: url,
      width: 660,
      height: 660,
      colorDark: "#13261f",
      colorLight: "#ffffff",
      correctLevel: window.QRCode.CorrectLevel.H,
    });
    const source = $("canvas", el);
    if (!source) {
      toast("Не удалось подготовить QR-код.", true);
      return;
    }
    const canvas = document.createElement("canvas");
    canvas.width = canvas.height = 740;
    const ctx = canvas.getContext("2d");
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, 740, 740);
    ctx.drawImage(source, 40, 40);
    const a = document.createElement("a");
    a.download = `exort-${String(title).replace(/[^a-zа-я0-9-]/gi, "-")}.png`;
    a.href = canvas.toDataURL("image/png");
    a.click();
  }
  async function deleteQr(id) {
    const s = state.qr?.find((s) => s.id === id);
    if (!s || s.is_system || s.id === "direct" || state.busy) return;
    if (
      !(await confirmation(
        `Удалить «${s.name}»?`,
        "QR-источник и история его переходов будут удалены. Это действие нельзя отменить.",
        "Удалить источник",
      ))
    )
      return;
    state.busy = true;
    try {
      await api("deleteQrSource", { sourceId: id });
      state.qr = state.qr.filter((s) => s.id !== id);
      render();
      toast("Источник удалён");
    } catch (e) {
      toast(e.message, true);
    } finally {
      state.busy = false;
    }
  }
  async function refresh() {
    if (state.busy) return;
    status("Обновление…");
    try {
      applyData(await api("getData"));
      render();
      status();
    } catch (e) {
      toast(e.message, true);
      status("Ошибка обновления");
    }
  }
  function navClose(returnFocus = true) {
    $("#sidebar").inert = innerWidth <= 900;
    const wasOpen = document.body.classList.contains("nav-open");
    document.body.classList.remove("nav-open");
    $(".nav-scrim").hidden = true;
    $("[data-action=nav-open]").setAttribute("aria-expanded", "false");
    $(".main-shell").inert = false;
    if (wasOpen && returnFocus) $("[data-action=nav-open]").focus();
  }
  async function logout(expired = false) {
    if (
      !expired &&
      (state.dirty || state.utilityDirty) &&
      !(await confirmation(
        "Выйти без сохранения?",
        "Несохранённые изменения будут потеряны.",
        "Выйти",
      ))
    )
      return;
    storage.set(sessionKey(), "");
    state.token = "";
    state.generation++;
    state.analyticsRequest++;
    state.qrRequest++;
    state.analytics = null;
    state.analyticsLoading = false;
    state.qr = null;
    state.qrLoading = false;
    state.dirty = false;
    state.utilityDirty = false;
    $$("dialog[open]").forEach((d) => d.close());
    navClose(false);
    $("#app").hidden = true;
    unmountAdmin();
    document.body.classList.add("admin-auth-only");
    syncAuthViewport();
    $("#login").hidden = false;
    $("#content").innerHTML = "";
    state.items = [];
    state.categories = [];
    state.restaurant = {};
    $("#login-form").elements.pin.value = "";
    $("#login-error").textContent = expired
      ? "Сессия истекла. Введите PIN снова."
      : "";
    $("#login-form").elements.pin.focus();
  }
  document.addEventListener("click", async (event) => {
    const button = event.target.closest("[data-action]");
    if (!button || button.disabled) return;
    const { action, id } = button.dataset;
    if (action === "stat-open") {
      if (event.target.closest("select, input, label, a")) return;
      openStatPopup(button.dataset.stat);
    }
    if (action === "stat-close") $("#stat-dialog").close();
    if (action === "pin") {
      const pin = $("#login-form").elements.pin;
      pin.type = pin.type === "password" ? "text" : "password";
      button.textContent = pin.type === "password" ? "Показать" : "Скрыть";
      button.setAttribute("aria-label", `${button.textContent} PIN`);
    }
    if (action === "view") go(button.dataset.view);
    if (action === "nav-open") {
      $("#sidebar").inert = false;
      document.body.classList.add("nav-open");
      $(".nav-scrim").hidden = false;
      button.setAttribute("aria-expanded", "true");
      $(".main-shell").inert = true;
      $("#main-nav [aria-current=page]").focus();
    }
    if (action === "nav-close") navClose();
    if (action === "logout") logout();
    if (action === "item-add") openEditor();
    if (action === "item-edit") openEditor(id);
    if (action === "editor-close") closeEditor();
    if (action === "language") setLanguage(button.dataset.lang);
    if (action === "item-delete") deleteItem(id);
    if (action === "stock") toggleStock(id);
    if (action === "photo-remove" && !state.photoBusy) {
      state.image = "";
      state.imageData = "";
      renderPhoto();
      markDirty();
    }
    if (action === "filters") {
      state.filtersOpen = !state.filtersOpen;
      $(".filters").classList.toggle("filters-open", state.filtersOpen);
      button.setAttribute("aria-expanded", state.filtersOpen);
    }
    if (action === "filters-reset") {
      state.query = "";
      state.category = state.status = state.stock = "all";
      state.issue = "";
      render();
    }
    if (action === "issue") {
      state.query = "";
      state.category = state.status = state.stock = "all";
      state.issue = button.dataset.issue === "stop" ? "" : button.dataset.issue;
      go(button.dataset.issue === "stop" ? "stoplist" : "menu");
    }
    if (action === "category-add") openCategory();
    if (action === "category-edit") openCategory(id);
    if (action === "category-up" || action === "category-down")
      reorder(id, action === "category-up" ? -1 : 1);
    if (action === "category-delete") openCategoryDelete(id);
    if (action === "category-split") openSplit(id);
    if (action === "utility-close") closeUtility();
    if (action === "period" && state.range !== button.dataset.range) {
      state.range = button.dataset.range;
      loadAnalytics();
    }
    if (action === "analytics-retry") loadAnalytics();
    if (action === "refresh") refresh();
    if (action === "qr-retry") loadQr();
    if (action === "qr-add") openQr();
    if (action === "wifi-add") openWifi();
    if (action === "qr-delete") deleteQr(id);
    if (action === "qr-download" || action === "qr-copy") {
      const source = state.qr?.find((s) => s.id === id);
      if (!source) return;
      if (action === "qr-download")
        downloadQr(source.url || menuUrl(), source.name);
      else
        try {
          await navigator.clipboard.writeText(source.url || menuUrl());
          toast("Ссылка скопирована");
        } catch {
          toast("Не удалось скопировать. Ссылка указана на карточке.", true);
        }
    }
    if (action === "wifi-download") {
      const el = $("#utility-dialog [data-qr-code]");
      downloadQr(el.dataset.qrCode, "wifi");
    }
  });
  document.addEventListener("input", (e) => {
    if (e.target.id === "menu-search") {
      state.query = e.target.value;
      $("#menu-results").innerHTML = menuResults();
    }
    if (e.target.closest("#item-form") && e.target.type !== "file") markDirty();
    if (e.target.closest("#utility-form")) state.utilityDirty = true;
  });
  document.addEventListener("change", (e) => {
    if (
      ["category-filter", "status-filter", "stock-filter"].includes(e.target.id)
    ) {
      state[e.target.id.split("-")[0]] = e.target.value;
      $("#menu-results").innerHTML = menuResults();
    }
    if (e.target.id === "item-photo") uploadPhoto(e.target.files[0]);
    if (e.target.id === "analytics-source") {
      state.source = e.target.value;
      loadAnalytics();
    }
    if (e.target.id === "hour-day") {
      state.hourDay = e.target.value;
      $("#hour-chart").innerHTML = chart(
        state.analytics?.dayDetails?.[state.hourDay]?.hours || [],
        "sessions",
        true,
      );
    }
    if (e.target.name === "mode" && $("#target-category-field"))
      $("#target-category-field").hidden = e.target.value !== "move";
  });
  document.addEventListener("submit", async (e) => {
    if (e.target.id === "item-form") {
      e.preventDefault();
      saveItem(e.target);
    }
    if (e.target.id === "utility-form") {
      e.preventDefault();
      saveUtility(e.target);
    }
    if (e.target.id === "login-form") {
      e.preventDefault();
      const form = e.target;
      const button = $("button[type=submit]", form);
      if (button.disabled) return;
      state.slug = slugify(form.elements.restaurant.value);
      state.token = "";
      state.generation++;
      $("#login-error").textContent = "";
      button.disabled = true;
      button.textContent = "Проверяем доступ…";
      try {
        const result = await api("login", {
          pin: form.elements.pin.value.trim(),
        });
        if (!result.sessionToken)
          throw new Error("Сервер не подтвердил доступ.");
        state.token = result.sessionToken;
        storage.set(sessionKey(), state.token);
        form.elements.pin.value = "";
        mountAdmin();
        applyData(result);
        shell();
        const url = new URL(location.href);
        url.searchParams.set("restaurant", state.slug);
        history.replaceState(null, "", url);
        navigate(
          views[location.hash.slice(1)] ? location.hash.slice(1) : "overview",
        );
      } catch (error) {
        $("#login-error").textContent = error.message;
      } finally {
        button.disabled = false;
        button.textContent = "Войти в пространство →";
      }
    }
  });
  $("#editor").addEventListener("cancel", (e) => {
    e.preventDefault();
    closeEditor();
  });
  $("#utility-dialog").addEventListener("cancel", (e) => {
    e.preventDefault();
    closeUtility();
  });
  document.addEventListener("keydown", (e) => {
    const stat = e.target.closest(".stat-expandable[data-stat]");
    const nestedAction = e.target.closest("[data-action]");
    if (
      stat &&
      nestedAction === stat &&
      !e.target.matches("select, input, label, a") &&
      ["Enter", " "].includes(e.key)
    ) {
      e.preventDefault();
      openStatPopup(stat.dataset.stat);
      return;
    }
    const tab = e.target.closest("[role=tab]");
    if (tab && ["ArrowLeft", "ArrowRight", "Home", "End"].includes(e.key)) {
      e.preventDefault();
      const tabs = $$("[role=tab]", $("#editor"));
      const index = tabs.indexOf(tab);
      const next =
        e.key === "Home"
          ? 0
          : e.key === "End"
            ? tabs.length - 1
            : (index + (e.key === "ArrowRight" ? 1 : -1) + tabs.length) %
              tabs.length;
      setLanguage(tabs[next].dataset.lang);
      tabs[next].focus();
    }
    if (document.body.classList.contains("nav-open")) {
      if (e.key === "Escape") navClose();
      if (e.key === "Tab") {
        const nodes = $$(
          "a[href],button:not([disabled])",
          $("#sidebar"),
        ).filter((n) => n.getClientRects().length);
        const index = nodes.indexOf(document.activeElement);
        if (e.shiftKey && index <= 0) {
          e.preventDefault();
          nodes.at(-1).focus();
        } else if (!e.shiftKey && index === nodes.length - 1) {
          e.preventDefault();
          nodes[0].focus();
        }
      }
    }
  });
  window.addEventListener("hashchange", () => {
    if (state.token) navigate(location.hash.slice(1));
  });
  window.addEventListener("beforeunload", (e) => {
    if (state.dirty || state.utilityDirty || state.busy) {
      e.preventDefault();
      e.returnValue = "";
    }
  });
  window.addEventListener("resize", () => {
    syncAuthViewport();
    if (innerWidth > 900 || !document.body.classList.contains("nav-open"))
      navClose(false);
  });
  window.visualViewport?.addEventListener("resize", syncAuthViewport);
  window.visualViewport?.addEventListener("scroll", syncAuthViewport);
  document.addEventListener(
    "error",
    (event) => {
      if (
        event.target instanceof HTMLImageElement &&
        event.target.closest(".thumbnail")
      ) {
        event.target.parentElement.innerHTML = icon("image");
      }
    },
    true,
  );
  async function init() {
    document.body.classList.add("admin-auth-only");
    syncAuthViewport();
    $('#login-form button[type="submit"]').disabled = false;
    const cleanUrl = new URL(location.href);
    if (cleanUrl.searchParams.has("pin")) {
      cleanUrl.searchParams.delete("pin");
      history.replaceState(null, "", cleanUrl);
    }
    $("#login-form").elements.restaurant.value = state.slug;
    state.token = storage.get(sessionKey());
    if (!state.token) return;
    $("#login").hidden = true;
    try {
      const data = await api("getData");
      mountAdmin();
      $("#app").hidden = false;
      $("#content").innerHTML = loading("Проверяем сессию и загружаем ресторан…");
      applyData(data);
      shell();
      navigate(location.hash.slice(1) || "overview", false);
    } catch (e) {
      await logout(true);
      $("#login-error").textContent = e.message;
    }
  }
  init();
})();
