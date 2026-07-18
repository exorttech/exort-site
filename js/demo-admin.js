const SUPABASE_REST_URL = "https://jnxwbqcnpxezjvfgdabc.supabase.co/rest/v1/";
const SUPABASE_PUBLISHABLE_KEY = "sb_publishable_T2QhpE8LByMP8_uO_cBdPg_bbLkAbBv";
const DEFAULT_RESTAURANT_SLUG = "exort-demo";
const ADMIN_API_URL = getAdminApiUrl();
const sessionKeyPrefix = "exort-admin-session:";

const state = {
  restaurant: { slug: DEFAULT_RESTAURANT_SLUG, name: "", city: "", brand: "#ff5a36" },
  categories: [],
  items: [],
  sessionToken: sessionStorage.getItem(sessionKeyPrefix + getRestaurantSlug()) || "",
  activeView: "overview",
  loading: false,
  dirty: false,
  pendingConfirm: null,
  savingItem: false,
  savingCategory: false,
  overviewAnalytics: null,
  overviewAnalyticsLoading: false,
  overviewAnalyticsError: "",
};

const el = {
  login: document.querySelector("[data-login-screen]"),
  app: document.querySelector("[data-app-shell]"),
  pinForm: document.querySelector("[data-pin-form]"),
  pinInput: document.querySelector("[data-pin-input]"),
  pinVisibility: document.querySelector("[data-pin-visibility]"),
  loginError: document.querySelector("[data-login-error]"),
  loginLabel: document.querySelector("[data-login-label]"),
  restaurantNames: document.querySelectorAll("[data-restaurant-name]"),
  restaurantInitials: document.querySelectorAll("[data-restaurant-initial]"),
  viewTitle: document.querySelector("[data-view-title]"),
  viewKicker: document.querySelector("[data-view-kicker]"),
  metrics: document.querySelector("[data-metrics]"),
  menuHeroManager: document.querySelector("[data-menu-hero-manager]"),
  menuHeroPreview: document.querySelector("[data-menu-hero-preview]"),
  menuHeroFile: document.querySelector("[data-menu-hero-file]"),
  menuHeroFileLabel: document.querySelector("[data-menu-hero-file-label]"),
  attentionList: document.querySelector("[data-attention-list]"),
  attentionCount: document.querySelector("[data-attention-count]"),
  dishGrid: document.querySelector("[data-dish-grid]"),
  categoryList: document.querySelector("[data-category-list]"),
  stopList: document.querySelector("[data-stop-list]"),
  photoGrid: document.querySelector("[data-photo-grid]"),
  analyticsRoot: document.querySelector("[data-analytics-root]"),
  categoryFilter: document.querySelector("[data-category-filter]"),
  statusFilter: document.querySelector("[data-status-filter]"),
  menuSearch: document.querySelector("[data-menu-search]"),
  drawer: document.querySelector("[data-drawer]"),
  itemForm: document.querySelector("[data-item-form]"),
  drawerTitle: document.querySelector("[data-drawer-title]"),
  deleteItem: document.querySelector("[data-delete-item]"),
  editorImage: document.querySelector("[data-editor-image]"),
  editorFile: document.querySelector("[data-editor-file]"),
  editorFileLabel: document.querySelector("[data-editor-file-label]"),
  editorStatusBadge: document.querySelector("[data-editor-status-badge]"),
  dishPreview: document.querySelector("[data-dish-preview]"),
  uploadZone: document.querySelector("[data-upload-zone]"),
  photoInput: document.querySelector("[data-photo-input]"),
  confirmDialog: document.querySelector("[data-confirm-dialog]"),
  confirmTitle: document.querySelector("[data-confirm-title]"),
  confirmText: document.querySelector("[data-confirm-text]"),
  categoryDialog: document.querySelector("[data-category-dialog]"),
  categoryForm: document.querySelector("[data-category-form]"),
  categoryDialogTitle: document.querySelector("[data-category-dialog-title]"),
  toasts: document.querySelector("[data-toast-stack]"),
};

const viewMeta = {
  overview: ["Обзор", "Рабочее пространство"],
  menu: ["Меню", "Управление блюдами"],
  categories: ["Категории", "Структура меню"],
  stoplist: ["Стоп-лист", "Быстрая доступность"],
  analytics: ["Аналитика", "Поведение гостей и эффективность меню"],
  qr: ["QR-коды", "Источники переходов в меню"],
  settings: ["Настройки", "Реальные данные заведения"],
  integrations: ["Интеграции", "Состояние подключений"],
};

init();
window.ExortAdminBridge = {
  api: (action, payload = {}) => adminApi(action, payload),
  restaurantSlug: () => getRestaurantSlug(),
};

function getRestaurantSlug() {
  const querySlug = new URLSearchParams(window.location.search).get("restaurant");
  if (querySlug) return sanitizeSlug(querySlug);

  const adminMatch = window.location.pathname.match(/(?:^|\/)admin-([a-z0-9-]+)(?:\/|$)/i);
  const reservedAdminRoutes = new Set(["demo", "showcase", "legacy"]);
  if (adminMatch && !reservedAdminRoutes.has(adminMatch[1].toLowerCase())) {
    return sanitizeSlug(adminMatch[1]);
  }

  return DEFAULT_RESTAURANT_SLUG;
}


function getSpiceLevelLabel(value) {
  return {
    mild: "Легкая острота",
    medium: "Средняя острота",
    hot: "Острая",
  }[String(value || "").trim()] || "";
}





function buildOptionalItemPayload(data, existing) {
  const payload = {
    id: existing?.id || "",
    category_id: data.category_id,
    name_ru: data.name_ru.trim(),
    name_kz: data.name_kz.trim(),
    name_en: data.name_en.trim(),
    description_ru: data.description_ru.trim(),
    description_kz: data.description_kz.trim(),
    description_en: data.description_en.trim(),
    price: Number(data.price),
    sort_order: Number(data.sort_order) || 0,
    is_active: existing ? existing.is_active : true,
    is_stoplisted: data.is_stoplisted === "true",
    inactive_until: existing?.inactive_until || null,
    image_url: el.itemForm.dataset.image || "",
    imageData: el.itemForm.dataset.pendingImage || "",
  };

  const oldPrice = String(data.old_price || "").trim();
  const weight = String(data.weight || "").trim();
  const calories = String(data.calories || "").trim();
  const spiceLevel = String(data.spice_level || "").trim();

  if (oldPrice) payload.old_price = Number(oldPrice);
  if (weight) payload.weight = weight;
  if (calories) payload.calories = Number(calories);
  if (spiceLevel) payload.spice_level = spiceLevel;

  return payload;
}


function sanitizeSlug(value) {
  return String(value || DEFAULT_RESTAURANT_SLUG).toLowerCase().replace(/[^a-z0-9-]/g, "") || DEFAULT_RESTAURANT_SLUG;
}

function getAdminApiUrl() {
  const hostname = window.location.hostname.toLowerCase();
  if (hostname === "localhost" || hostname === "127.0.0.1" || hostname === "::1") {
    return "https://exort.kz/api/exort-admin";
  }
  return "/api/exort-admin";
}


async function init() {
  ensureAdminEnhancements();
  bindEvents();
  await loadPublicRestaurantIdentity();
  showLoginScreen();
  const requestedView = getRequestedViewFromHash();

  if (state.sessionToken) {
    try {
      await loadAdminData();
      openApp(false);
      navigate(requestedView || "overview");
      return;
    } catch (error) {
      console.warn("[exort-admin] Stored session is invalid or expired.", error);
      sessionStorage.removeItem(sessionKeyPrefix + getRestaurantSlug());
      state.sessionToken = "";
      clearAdminHash("Unauthorized admin hash was cleared because there is no valid session.");
      showLoginError(error.message || "Сессия устарела. Введите PIN еще раз.");
      showLoginScreen();
      return;
    }
  }

  if (requestedView) {
    clearAdminHash("Login is required before opening admin views.");
  }
}


async function requestPublicSupabase(table, query) {
  const url = new URL(table, SUPABASE_REST_URL);
  Object.entries(query).forEach(([key, value]) => url.searchParams.set(key, value));
  const controller = new AbortController();
  const timeout = window.setTimeout(() => controller.abort(), 8000);
  try {
    const response = await fetch(url, {
      headers: {
        apikey: SUPABASE_PUBLISHABLE_KEY,
        Authorization: `Bearer ${SUPABASE_PUBLISHABLE_KEY}`,
      },
      signal: controller.signal,
    });
    if (!response.ok) throw new Error(await response.text());
    return response.json();
  } finally {
    window.clearTimeout(timeout);
  }
}

async function loadPublicRestaurantIdentity() {
  try {
    const restaurants = await requestPublicSupabase("restaurants", {
      select: "id,slug,name,city,is_active",
      slug: `eq.${getRestaurantSlug()}`,
      is_active: "eq.true",
      limit: "1",
    });
    if (restaurants[0]) {
      state.restaurant = { ...state.restaurant, ...restaurants[0] };
    }
  } catch (error) {
    console.warn("Public restaurant load failed:", error);
  } finally {
    syncRestaurantIdentity();
  }
}

async function loadDevAdminData() {
  try {
    const restaurants = await requestPublicSupabase("restaurants", {
      select: "*",
      slug: `eq.${getRestaurantSlug()}`,
      is_active: "eq.true",
      limit: "1",
    });
    const restaurant = restaurants[0];
    if (!restaurant) {
      renderAll();
      return;
    }

    const [categories, items] = await Promise.all([
      requestPublicSupabase("menu_categories", {
        select: "*",
        restaurant_id: `eq.${restaurant.id}`,
        order: "sort_order.asc",
      }),
      requestPublicSupabase("menu_items", {
        select: "*",
        restaurant_id: `eq.${restaurant.id}`,
        order: "sort_order.asc",
      }),
    ]);

    applyAdminData({ restaurant, categories, items });
  } catch (error) {
    console.warn("[exort-admin] dev data load failed", error);
    renderAll();
  }
}


async function handleLogin(event) {
  event.preventDefault();
  el.loginError.textContent = "";
  el.loginLabel.textContent = "Проверяем...";

  try {
    const result = await adminApi("login", { pin: el.pinInput.value.trim() });
    state.sessionToken = result.sessionToken;
    sessionStorage.setItem(sessionKeyPrefix + getRestaurantSlug(), state.sessionToken);
    applyAdminData(result);
    openApp(false);
    navigate("overview");
    toast("Доступ открыт", "success");
  } catch (error) {
    showLoginError(error.message || "Не удалось проверить PIN.");
  } finally {
    el.loginLabel.textContent = "Войти";
  }
}


async function loadAdminData() {
  const result = await adminApi("getData");
  applyAdminData(result);
}

function applyAdminData(result) {
  if (result.restaurant) {
    state.restaurant = { ...state.restaurant, ...normalizeRestaurant(result.restaurant) };
  }
  state.categories = (result.categories || []).map(normalizeCategory).sort((a, b) => a.sort - b.sort);
  state.items = (result.items || []).map(normalizeItem).sort((a, b) => a.sort_order - b.sort_order);
  syncRestaurantIdentity();
  renderAll();
}

function normalizeRestaurant(restaurant) {
  return {
    id: restaurant.id,
    slug: restaurant.slug || getRestaurantSlug(),
    name: restaurant.name || "Заведение",
    city: restaurant.city || "",
    brand: restaurant.brand_color || restaurant.brand || "#ff5a36",
    hero_image_url: restaurant.hero_image_url || restaurant.menu_cover_url || "",
  };
}

function normalizeCategory(category) {
  return {
    id: category.id,
    name_ru: category.name_ru || category.title_ru || category.name || "Категория",
    name_kz: category.name_kz || category.title_kk || "",
    name_en: category.name_en || category.title_en || "",
    name: category.name_ru || category.title_ru || category.name || "Категория",
    active: category.is_active !== false,
    sort: Number(category.sort_order || 0),
  };
}

function normalizeItem(item) {
  return {
    id: item.id,
    restaurant_id: item.restaurant_id,
    category_id: item.category_id,
    content_key: item.content_key || item.id,
    name_ru: item.name_ru || item.title_ru || "",
    name_kz: item.name_kz || item.title_kk || "",
    name_en: item.name_en || item.title_en || "",
    description_ru: item.description_ru || "",
    description_kz: item.description_kz || item.description_kk || "",
    description_en: item.description_en || "",
    price: Number(item.price || 0),
    currency: item.currency || "KZT",
    image: item.image_url || "",
    image_path: item.image_path || "",
    is_active: item.is_active !== false,
    is_stoplisted: item.is_stoplisted === true || item.in_stock === false,
    inactive_until: item.inactive_until || "",
    old_price: item.old_price == null ? null : Number(item.old_price),
    weight: item.weight || "",
    calories: item.calories == null ? null : Number(item.calories),
    spice_level: item.spice_level || "",
    sort_order: Number(item.sort_order || 0),
    version: Number(item.version || 1),
  };
}

function isMenuHeroItem(item) {
  const values = [
    item?.content_key,
    item?.id,
    item?.name_ru,
    item?.title_ru,
    item?.name_en,
    item?.title_en,
  ].map((value) => String(value || "").trim().toLowerCase());

  return values.some((value) => value === "menu-hero" || value === "menu_hero" || value === "menu hero");
}

function getMenuHeroItem() {
  return state.items.find(isMenuHeroItem);
}

function getDishItems() {
  return state.items.filter((item) => !isMenuHeroItem(item));
}

function openApp(render = true) {
  el.login.hidden = true;
  el.app.hidden = false;
  syncRestaurantIdentity();
  if (render) renderAll();
  loadOverviewAnalytics();
}

async function loadOverviewAnalytics() {
  if (!state.sessionToken || state.overviewAnalyticsLoading || state.overviewAnalytics) return;
  state.overviewAnalyticsLoading = true;
  state.overviewAnalyticsError = "";
  renderMetrics();
  try {
    const result = await adminApi("getAnalytics", { range: "today" });
    state.overviewAnalytics = result?.analytics || null;
  } catch (error) {
    state.overviewAnalyticsError = toFriendlyError(error?.message || "Аналитика недоступна");
  } finally {
    state.overviewAnalyticsLoading = false;
    renderMetrics();
  }
}

function showLoginScreen() {
  el.app.hidden = true;
  el.login.hidden = false;
}

function logout() {
  const run = () => {
    sessionStorage.removeItem(sessionKeyPrefix + getRestaurantSlug());
    state.sessionToken = "";
    state.overviewAnalytics = null;
    state.overviewAnalyticsError = "";
    clearAdminHash();
    showLoginScreen();
    el.pinInput.value = "";
  };
  state.dirty ? confirmAction("Выйти без сохранения?", "Несохраненные изменения будут потеряны.", run) : run();
}

function syncRestaurantIdentity() {
  const restaurantName = state.restaurant.name?.trim() || "Заведение";
  const initial = restaurantName.charAt(0).toUpperCase() || "E";
  el.restaurantNames.forEach((node) => { node.textContent = restaurantName; });
  el.restaurantInitials.forEach((node) => { node.textContent = initial; });
  document.documentElement.style.setProperty("--brand", state.restaurant.brand || "#ff5a36");
  document.querySelectorAll("[data-menu-link]").forEach((link) => {
    link.href = `/demo-menu?restaurant=${encodeURIComponent(state.restaurant.slug || getRestaurantSlug())}`;
  });
}

function navigate(view) {
  if (!viewMeta[view]) return;
  state.activeView = view;
  document.querySelectorAll("[data-view]").forEach((node) => node.classList.toggle("is-active", node.dataset.view === view));
  document.querySelectorAll("[data-nav]").forEach((node) => {
    const isActive = node.dataset.nav === view;
    node.classList.toggle("is-active", isActive);
    if (isActive) node.setAttribute("aria-current", "page");
    else node.removeAttribute("aria-current");
  });
  el.viewTitle.textContent = viewMeta[view][0];
  el.viewKicker.textContent = viewMeta[view][1];
  history.replaceState(null, "", `#${view}`);
  window.scrollTo({ top: 0, behavior: "smooth" });
  if (view === "analytics") window.ExortAnalytics?.mount({ root: el.analyticsRoot });
  if (view === "qr") window.ExortQr?.mount({ root: document.querySelector("[data-qr-root]") });
}

function getRequestedViewFromHash() {
  const rawHash = window.location.hash.replace(/^#/, "");
  return viewMeta[rawHash] ? rawHash : "";
}

function clearAdminHash(reason = "") {
  if (!window.location.hash) return;
  if (reason) {
    console.warn("[exort-admin]", reason, window.location.hash);
  }
  history.replaceState(null, "", `${window.location.pathname}${window.location.search}`);
}

function renderAll() {
  syncRestaurantIdentity();
  renderMetrics();
  renderMenuHeroManager();
  renderAttention();
  renderFilters();
  renderDishes();
  renderCategories();
  renderStopList();
}

function renderMenuHeroManager() {
  if (!el.menuHeroManager || !el.menuHeroPreview) return;

  const heroItem = getMenuHeroItem();
  const image = heroItem?.image || "";
  el.menuHeroPreview.innerHTML = image
    ? `<img src="${escapeHtml(image)}" alt="Главное фото меню" />`
    : `<div class="menu-hero-manager__placeholder"><strong>Фото пока не загружено</strong><span>Добавьте главное изображение для публичного меню</span></div>`;
  if (el.menuHeroFileLabel) {
    el.menuHeroFileLabel.textContent = image ? "Заменить фото" : "Загрузить фото";
  }
}

async function handleMenuHeroFile() {
  const file = el.menuHeroFile?.files?.[0];
  if (!file) return;

  const heroItem = getMenuHeroItem();
  if (!heroItem) {
    toast("Запись Menu hero не найдена", "danger");
    el.menuHeroFile.value = "";
    return;
  }

  const label = el.menuHeroFileLabel;
  const previousLabel = label?.textContent || "Заменить фото";
  try {
    if (label) label.textContent = "Загружаем...";
    el.menuHeroFile.disabled = true;
    const imageData = await prepareImage(file);
    const result = await adminApi("saveItem", {
      item: {
        id: heroItem.id,
        category_id: heroItem.category_id || null,
        content_key: heroItem.content_key || "menu-hero",
        name_ru: heroItem.name_ru || "Menu hero",
        name_kz: heroItem.name_kz || heroItem.name_ru || "Menu hero",
        name_en: heroItem.name_en || heroItem.name_ru || "Menu hero",
        description_ru: heroItem.description_ru || "",
        description_kz: heroItem.description_kz || "",
        description_en: heroItem.description_en || "",
        price: Number(heroItem.price || 0),
        sort_order: Number(heroItem.sort_order || 0),
        is_active: heroItem.is_active !== false,
        is_stoplisted: heroItem.is_stoplisted === true,
        inactive_until: heroItem.inactive_until || null,
        image_url: heroItem.image || "",
        imageData,
      },
    });
    upsertLocalItem(result.item);
    renderAll();
    toast("Главное фото меню обновлено", "success");
  } catch (error) {
    toast(toFriendlyError(error.message) || "Не удалось обновить главное фото", "danger");
  } finally {
    el.menuHeroFile.disabled = false;
    el.menuHeroFile.value = "";
    if (label) label.textContent = previousLabel;
    renderMenuHeroManager();
  }
}



function getAttentionStatus(count, type) {
  if (count === 0) return { className: "success", label: "Успешно", description: type === "neutral" ? "Все в норме" : "Проблем не найдено" };
  if (type === "neutral") {
    return count <= 5
      ? { className: "neutral", label: "Нейтрально", description: "Не ошибка, но стоит контролировать" }
      : { className: "neutral-strong", label: "Много позиций", description: "Стоит проверить состояние меню" };
  }
  return count <= 5
    ? { className: "warning", label: "Требует внимания", description: "Есть несколько незаполненных позиций" }
    : { className: "critical", label: "Критично", description: "Требуется системное заполнение" };
}

function renderFilters() {
  const selected = el.categoryFilter.value || "all";
  el.categoryFilter.innerHTML = `<option value="all">Все категории</option><option value="missing">Без категории</option>${state.categories.map((category) => `<option value="${category.id}">${escapeHtml(category.name)}</option>`).join("")}`;
  el.categoryFilter.value = [...el.categoryFilter.options].some((option) => option.value === selected) ? selected : "all";
  const editorCategory = el.itemForm.elements.category_id.value;
  el.itemForm.elements.category_id.innerHTML = `<option value="">Выберите категорию</option>${state.categories.map((category) => `<option value="${category.id}">${escapeHtml(category.name)}</option>`).join("")}`;
  el.itemForm.elements.category_id.value = state.categories.some((category) => category.id === editorCategory) ? editorCategory : "";
}

function filteredItems() {
  const query = el.menuSearch.value.trim().toLowerCase();
  const category = el.categoryFilter.value || "all";
  const status = el.statusFilter.value || "all";
  const photo = el.photoFilter?.value || "all";
  const translation = el.translationFilter?.value || "all";

  return getDishItems().filter((item) => {
    const matchesQuery = !query || [getItemDisplayName(item), getItemDisplayDescription(item), item.content_key].join(" ").toLowerCase().includes(query);
    const matchesCategory = category === "all" || (category === "missing" ? !item.category_id : item.category_id === category);
    const matchesStatus =
      status === "all" ||
      (status === "active" && item.is_active && !item.is_stoplisted && !isTemporarilyUnavailable(item)) ||
      (status === "stop" && (item.is_stoplisted || isTemporarilyUnavailable(item))) ||
      (status === "inactive" && !item.is_active) ||
      (status === "temporary" && isTemporarilyUnavailable(item));
    const matchesPhoto = photo === "all" || (photo === "with" && item.image) || (photo === "missing" && !item.image);
    const matchesTranslation = translation === "all" ||
      (translation === "complete" && !hasMissingTranslation(item)) ||
      (translation === "missing" && hasMissingTranslation(item)) ||
      (translation === "missing-ru" && !String(item.name_ru || "").trim()) ||
      (translation === "missing-kz" && (!String(item.name_kz || "").trim() || !String(item.description_kz || "").trim())) ||
      (translation === "missing-en" && (!String(item.name_en || "").trim() || !String(item.description_en || "").trim()));
    return matchesQuery && matchesCategory && matchesStatus && matchesPhoto && matchesTranslation;
  });
}


function renderCategories() {
  el.categoryList.innerHTML = [...state.categories].sort((a, b) => a.sort - b.sort).map((category) => {
    const count = getDishItems().filter((item) => item.category_id === category.id).length;
    return `<article class="category-row">
      <span class="drag-handle">⋮⋮</span>
      <div><strong>${escapeHtml(getCategoryDisplayName(category))}</strong><small>${count} блюд</small></div>
      <button class="stop-switch ${category.active ? "is-on" : ""}" type="button" data-toggle-category="${category.id}" aria-label="Активность категории"></button>
      <div class="row-actions">
        <button type="button" data-move-category="${category.id}" data-direction="-1">↑</button>
        <button type="button" data-move-category="${category.id}" data-direction="1">↓</button>
        <button type="button" data-edit-category="${category.id}">Изменить</button>
      </div>
    </article>`;
  }).join("");
}

function renderStopList() {
  const stoppedItems = getDishItems().filter((item) => item.is_stoplisted || isTemporarilyUnavailable(item));
  el.stopList.innerHTML = stoppedItems.length ? stoppedItems.map((item) => `<article class="stop-row">
    <div class="dish-placeholder">${escapeHtml((getItemDisplayName(item) || "?").charAt(0))}</div>
    <div><strong>${escapeHtml(item.name_ru || "Без названия")}</strong><small>${escapeHtml(categoryName(item.category_id))} · ${formatPrice(item.price, item.currency)}</small></div>
    <span class="stop-state">На стопе</span>
    <button class="large-switch" type="button" data-toggle-stock="${item.id}" aria-label="Вернуть блюдо в продажу"></button>
  </article>`).join("") : `<div class="empty-state stop-empty-state">
    <h2>В стоп-листе пока нет блюд</h2>
    <p>Добавьте блюдо в стоп-лист из раздела меню.</p>
    <button class="primary-button compact" type="button" data-action="open-stop-filter">Добавить в стоп-лист</button>
  </div>`;
}


function visual(item) {
  return item.image ? `<img src="${escapeHtml(item.image)}" alt="" />` : `<div class="dish-placeholder">${escapeHtml((getItemDisplayName(item) || "?").charAt(0))}</div>`;
}


function isTemporarilyUnavailable(item) {
  return Boolean(item.inactive_until && new Date(item.inactive_until).getTime() > Date.now());
}

function hasMissingTranslation(item) {
  return !String(item.name_kz || "").trim() || !String(item.name_en || "").trim() || !String(item.description_kz || "").trim() || !String(item.description_en || "").trim();
}

function categoryName(id) {
  const category = state.categories.find((entry) => entry.id === id);
  return getCategoryDisplayName(category);
}


function renderEditorImage(image = "") {
  if (!el.editorImage) return;
  const hasImage = Boolean(image);
  el.editorImage.innerHTML = hasImage
    ? `<img src="${escapeHtml(image)}" alt="" />`
    : `<div class="editor-photo-placeholder" aria-hidden="true">
        <svg viewBox="0 0 24 24"><rect x="3" y="5" width="18" height="14" rx="3"/><circle cx="9" cy="10" r="2"/><path d="m21 15-4.5-4.5L6 19"/></svg>
        <span>Фото</span>
      </div>`;
  if (el.editorFileLabel) el.editorFileLabel.textContent = hasImage ? "Заменить фото" : "Загрузить фото";
  document.querySelector("[data-remove-editor-image]")?.toggleAttribute("hidden", !hasImage);
  renderDishPreview();
}

function setEditorStatus(isStoplisted = false) {
  const value = isStoplisted ? "true" : "false";
  const radio = el.itemForm?.querySelector(`input[name="is_stoplisted"][value="${value}"]`);
  if (radio) radio.checked = true;
  el.itemForm?.querySelectorAll("[data-status-choice]").forEach((choice) => {
    const input = choice.querySelector("input");
    choice.classList.toggle("is-active", input?.checked === true);
  });
  if (!el.editorStatusBadge) return;
  el.editorStatusBadge.textContent = isStoplisted ? "Временно недоступно" : "В продаже";
  el.editorStatusBadge.className = `editor-status-badge ${isStoplisted ? "is-stop" : "is-sale"}`;
  renderDishPreview();
}

function updateEditorStatusFromForm() {
  const value = el.itemForm?.querySelector('input[name="is_stoplisted"]:checked')?.value;
  setEditorStatus(value === "true");
}

function getActiveEditorLanguage() {
  return document.querySelector("[data-lang-tab].is-active")?.dataset.langTab || "ru";
}


function getNextSortOrder(categoryId) {
  const used = state.items
    .filter((item) => item.category_id === categoryId && item.id !== el.itemForm?.elements.id.value)
    .map((item) => Number(item.sort_order || 0));
  return used.length ? Math.max(...used) + 1 : 1;
}

function syncSortOrderForSelectedCategory(force = false) {
  if (!el.itemForm || el.itemForm.elements.id.value) return;
  if (!force && el.itemForm.dataset.sortMode === "manual") return;
  const categoryId = el.itemForm.elements.category_id.value || "";
  if (!categoryId) {
    el.itemForm.elements.sort_order.value = "";
    return;
  }
  el.itemForm.elements.sort_order.value = getNextSortOrder(categoryId);
  el.itemForm.dataset.sortMode = "auto";
}





function closeDrawer(force = false) {
  if (state.dirty && !force) return confirmAction("Закрыть без сохранения?", "Изменения в карточке блюда будут потеряны.", () => closeDrawer(true));
  el.drawer.setAttribute("aria-hidden", "true");
  state.dirty = false;
}




function addCategory() {
  el.categoryForm.reset();
  el.categoryForm.elements.id.value = "";
  el.categoryDialogTitle.textContent = "Новая категория";
  el.categoryDialog.showModal();
  el.categoryForm.elements.name_ru.focus();
}

function editCategory(id) {
  const category = state.categories.find((entry) => entry.id === id);
  if (!category) return;
  el.categoryForm.elements.id.value = category.id;
  el.categoryForm.elements.name_ru.value = category.name_ru || category.name || "";
  el.categoryForm.elements.name_kz.value = category.name_kz || "";
  el.categoryForm.elements.name_en.value = category.name_en || "";
  el.categoryDialogTitle.textContent = "Редактирование категории";
  el.categoryDialog.showModal();
  el.categoryForm.elements.name_ru.focus();
}

async function handleCategorySubmit(event) {
  event.preventDefault();
  if (state.savingCategory) return;
  const data = Object.fromEntries(new FormData(el.categoryForm));
  const existing = state.categories.find((entry) => entry.id === data.id);
  const payload = {
    id: existing?.id || "",
    name_ru: data.name_ru.trim(),
    name_kz: data.name_kz.trim(),
    name_en: data.name_en.trim(),
    sort_order: existing?.sort || (state.categories.length + 1) * 10,
    is_active: existing?.active ?? true,
  };
  if (!payload.name_ru) return;

  const submitButton = el.categoryForm.querySelector('button[type="submit"]');
  state.savingCategory = true;
  if (submitButton) submitButton.disabled = true;
  try {
    const result = await adminApi("saveCategory", { category: payload });
    upsertLocalCategory(result.category);
    el.categoryDialog.close();
    toast(existing ? "Категория обновлена" : "Категория добавлена", "success");
    navigate("categories");
    renderAll();
  } catch (error) {
    toast(error.message || "Не удалось сохранить категорию", "danger");
  } finally {
    state.savingCategory = false;
    if (submitButton) submitButton.disabled = false;
  }
}

async function toggleCategory(id) {
  const category = state.categories.find((entry) => entry.id === id);
  if (!category) return;
  try {
    const result = await adminApi("saveCategory", { category: { ...category, is_active: !category.active, sort_order: category.sort } });
    upsertLocalCategory(result.category);
    toast("Статус категории обновлен", "success");
    renderAll();
  } catch (error) {
    toast(error.message || "Не удалось обновить категорию", "danger");
  }
}

async function moveCategory(id, direction) {
  const sorted = [...state.categories].sort((a, b) => a.sort - b.sort);
  const index = sorted.findIndex((category) => category.id === id);
  const target = sorted[index + direction];
  if (!target) return;
  [sorted[index].sort, target.sort] = [target.sort, sorted[index].sort];

  try {
    await adminApi("sortCategories", { categories: sorted.map((category) => ({ id: category.id, sort_order: category.sort })) });
    state.categories = sorted;
    toast("Порядок категорий обновлен", "success");
    renderAll();
  } catch (error) {
    toast(error.message || "Не удалось изменить порядок", "danger");
  }
}

async function handleBulkUploads(files) {
  const targets = getDishItems().filter((item) => !item.image).slice(0, files.length);
  if (!targets.length) {
    toast("Нет блюд без фото", "success");
    return;
  }

  for (const [index, file] of [...files].slice(0, targets.length).entries()) {
    try {
      const imageData = await prepareImage(file);
      const result = await adminApi("uploadItemPhoto", { itemId: targets[index].id, imageData });
      upsertLocalItem(result.item);
      toast(`Фото добавлено: ${getItemDisplayName(result.item || targets[index])}`, "success");
    } catch (error) {
      toast(error.message || "Не удалось загрузить фото", "danger");
    }
  }
  renderAll();
}

async function handleEditorFile() {
  try {
    const imageData = await prepareImage(el.editorFile.files[0]);
    el.itemForm.dataset.pendingImage = imageData;
    el.itemForm.dataset.image = imageData;
    renderEditorImage(imageData);
    state.dirty = true;
  } catch (error) {
    toast(error.message || "Не удалось подготовить фото", "danger");
  }
}

function removeEditorImage() {
  el.itemForm.dataset.image = "";
  el.itemForm.dataset.pendingImage = "";
  renderEditorImage("");
  state.dirty = true;
}



function handleDocumentClick(event) {
  const nav = event.target.closest("[data-nav]");
  const action = event.target.closest("[data-action]")?.dataset.action;
  const stock = event.target.closest("[data-toggle-stock]")?.dataset.toggleStock;
  const edit = event.target.closest("[data-edit-item]")?.dataset.editItem;
  const attention = event.target.closest("[data-attention-view]")?.dataset.attentionView;
  const attentionFilter = event.target.closest("[data-attention-filter]")?.dataset.attentionFilter;
  const toggleCat = event.target.closest("[data-toggle-category]")?.dataset.toggleCategory;
  const editCat = event.target.closest("[data-edit-category]")?.dataset.editCategory;
  const move = event.target.closest("[data-move-category]");

  if (nav) navigate(nav.dataset.nav);
  if (action === "add-item") openItemDrawer();
  if (action === "add-category") addCategory();
  if (action === "open-stop-filter") openStopFilter();
  if (stock) toggleStock(stock);
  if (edit) openItemDrawer(edit);
  if (attention) navigate(attention);
  if (attentionFilter) openAttentionFilter(attentionFilter);
  if (event.target.closest("[data-logout]")) logout();
  if (event.target.closest("[data-support-status]")) toast("Канал поддержки будет доступен после подключения контакта заведения.");
  if (event.target.closest("[data-close-drawer]")) closeDrawer();
  if (toggleCat) toggleCategory(toggleCat);
  if (editCat) editCategory(editCat);
  if (move) moveCategory(move.dataset.moveCategory, Number(move.dataset.direction));
  if (event.target.closest("[data-remove-editor-image]")) removeEditorImage();
  if (event.target.closest("[data-translate-current-item]")) translateCurrentItem();
  if (event.target.closest("[data-translate-missing]")) translateMissingItems();
  if (event.target.closest("[data-toggle-preview]")) toggleMobilePreview();
}

function openStopFilter() {
  navigate("menu");
  if (el.statusFilter) {
    el.statusFilter.value = "stop";
    renderDishes();
  }
  toast("Выберите блюдо и выключите продажу.", "success");
}

function upsertLocalItem(rawItem) {
  const item = normalizeItem(rawItem);
  const index = state.items.findIndex((entry) => entry.id === item.id);
  if (index >= 0) state.items[index] = item;
  else state.items.push(item);
}

function upsertLocalCategory(rawCategory) {
  const category = normalizeCategory(rawCategory);
  const index = state.categories.findIndex((entry) => entry.id === category.id);
  if (index >= 0) state.categories[index] = category;
  else state.categories.push(category);
  state.categories.sort((a, b) => a.sort - b.sort);
}


function confirmAction(title, text, action) {
  state.pendingConfirm = action;
  el.confirmTitle.textContent = title;
  el.confirmText.textContent = text;
  el.confirmDialog.showModal();
}


function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function firstFilledValue(...values) {
  return values.find((value) => String(value || "").trim()) || "";
}

function getItemDisplayName(item) {
  return firstFilledValue(
    item?.name_ru,
    item?.title_ru,
    item?.name_kz,
    item?.title_kk,
    item?.name_en,
    item?.title_en,
    item?.content_key,
    item?.id,
    "Без названия"
  );
}

function getItemDisplayDescription(item) {
  return firstFilledValue(
    item?.description_ru,
    item?.description_kz,
    item?.description_kk,
    item?.description_en
  );
}

function getCategoryDisplayName(category) {
  return firstFilledValue(
    category?.name_ru,
    category?.title_ru,
    category?.name_kz,
    category?.title_kk,
    category?.name_en,
    category?.title_en,
    category?.name,
    category?.section_key,
    category?.id,
    "Без категории"
  );
}

function getAnalyticsDishDisplayName(item) {
  return firstFilledValue(
    item?.title_ru,
    item?.name_ru,
    item?.title_kk,
    item?.name_kz,
    item?.title_en,
    item?.name_en,
    item?.title,
    item?.name,
    item?.content_key,
    item?.id,
    "Блюдо"
  );
}

function getNextMidnightIso() {
  const date = new Date();
  date.setDate(date.getDate() + 1);
  date.setHours(0, 0, 0, 0);
  return date.toISOString();
}

function toDatetimeLocal(value) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  const pad = (number) => String(number).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

function prepareImage(file) {
  return new Promise((resolve, reject) => {
    if (!file) return reject(new Error("Файл не выбран"));
    if (file.size > 10 * 1024 * 1024) return reject(new Error("Файл больше 10 МБ"));
    if (!["image/jpeg", "image/png", "image/webp", "image/avif"].includes(file.type)) return reject(new Error("Поддерживаются JPG, PNG, WebP и AVIF"));

    const image = new Image();
    image.onload = () => {
      const maxSide = 1600;
      const scale = Math.min(1, maxSide / Math.max(image.width, image.height));
      const canvas = document.createElement("canvas");
      canvas.width = Math.max(1, Math.round(image.width * scale));
      canvas.height = Math.max(1, Math.round(image.height * scale));
      const context = canvas.getContext("2d");
      context.drawImage(image, 0, 0, canvas.width, canvas.height);
      resolve(canvas.toDataURL("image/webp", 0.84));
      URL.revokeObjectURL(image.src);
    };
    image.onerror = () => reject(new Error("Не удалось прочитать изображение"));
    image.src = URL.createObjectURL(file);
  });
}

function ensureAdminEnhancements() {
  if (document.querySelector("[data-photo-filter]")) return;

  const photoFilter = document.createElement("select");
  photoFilter.dataset.photoFilter = "";
  photoFilter.setAttribute("aria-label", "Фильтр фото");
  photoFilter.innerHTML = `
    <option value="all">Все фото</option>
    <option value="with">С фото</option>
    <option value="missing">Без фото</option>
  `;
  el.statusFilter?.insertAdjacentElement("afterend", photoFilter);
  el.photoFilter = photoFilter;

  const translationFilter = document.createElement("select");
  translationFilter.dataset.translationFilter = "";
  translationFilter.setAttribute("aria-label", "Фильтр переводов");
  translationFilter.innerHTML = `
    <option value="all">Все переводы</option>
    <option value="complete">Перевод полный</option>
    <option value="missing">Нет перевода</option>
    <option value="missing-ru">Нет русского названия</option>
    <option value="missing-kz">Нет казахского перевода</option>
    <option value="missing-en">Нет английского перевода</option>
  `;
  photoFilter.insertAdjacentElement("afterend", translationFilter);
  el.translationFilter = translationFilter;

  const translateMissing = document.createElement("button");
  translateMissing.type = "button";
  translateMissing.className = "secondary-button compact toolbar-action";
  translateMissing.dataset.translateMissing = "";
  translateMissing.textContent = "Заполнить переводы";
  document.querySelector(".menu-toolbar")?.append(translateMissing);

  const langTabs = document.querySelector(".language-tabs");
  if (langTabs && !document.querySelector("[data-translate-current-item]")) {
    const tools = document.createElement("div");
    tools.className = "drawer-tools";
    tools.innerHTML = `
      <button class="secondary-button compact" type="button" data-translate-current-item>Перевести с RU</button>
      <small>Перевод будет заполнен автоматически.</small>
    `;
    langTabs.insertAdjacentElement("afterend", tools);
  }

  const imageEditor = document.querySelector(".image-editor");
  if (imageEditor && !document.querySelector("[data-remove-editor-image]")) {
    imageEditor.insertAdjacentHTML("beforeend", `
      <div class="media-actions">
        <button class="secondary-button compact" type="button" data-remove-editor-image>Удалить фото</button>
        <small>Фото будет оптимизировано перед загрузкой.</small>
      </div>
    `);
  }

  const categoryForm = el.categoryForm;
  if (categoryForm && !categoryForm.elements.name_kz) {
    const nameInput = categoryForm.elements.name;
    if (nameInput) {
      nameInput.name = "name_ru";
      nameInput.closest("label").childNodes[0].textContent = "Название (рус.)";
      nameInput.insertAdjacentHTML("afterend", `<span class="field-hint">Русское название обязательно, переводы можно добавить позже.</span>`);
      categoryForm.querySelector(".field-hint")?.closest("label")?.insertAdjacentHTML("afterend", `
        <label>Название (каз.)<input name="name_kz" maxlength="80" autocomplete="off" /></label>
        <label>Название (англ.)<input name="name_en" maxlength="80" autocomplete="off" /></label>
      `);
    }
  }
}


function renderMetrics() {
  const dishItems = getDishItems();
  const active = dishItems.filter((item) => item.is_active && !item.is_stoplisted && !isTemporarilyUnavailable(item)).length;
  const summary = state.overviewAnalytics?.summary;
  const analyticsValue = (entry, formatter = (value) => Number(value).toLocaleString("ru-RU")) => {
    if (state.overviewAnalyticsLoading) return "Загрузка…";
    if (!entry || entry.value === null || entry.value === undefined) return "Нет данных";
    return formatter(entry.value);
  };
  const values = [
    ["Сессии меню сегодня", analyticsValue(summary?.sessions), state.overviewAnalyticsError || "Реальные открытия меню"],
    ["Открытия блюд", analyticsValue(summary?.dishOpens), "События открытия карточек"],
    ["Среднее время изучения", analyticsValue(summary?.averageStudyMs, (value) => `${Math.floor(Number(value) / 60000)}:${String(Math.floor((Number(value) % 60000) / 1000)).padStart(2, "0")}`), "По событию выхода из меню"],
    ["Позиции в продаже", active, `${dishItems.length} всего`],
  ];
  el.metrics.innerHTML = values.map(([label, value, hint]) => `<article class="metric-card"><span>${label}</span><strong>${value}</strong><small>${escapeHtml(hint || "")}</small></article>`).join("");
}

function openAttentionFilter(filter) {
  navigate("menu");
  el.categoryFilter.value = filter === "category" ? "missing" : "all";
  el.statusFilter.value = filter === "inactive" ? "inactive" : filter === "stop" ? "stop" : "all";
  if (el.photoFilter) el.photoFilter.value = filter === "photo" ? "missing" : "all";
  if (el.translationFilter) el.translationFilter.value = ["missing-ru", "missing-kz", "missing-en"].includes(filter) ? filter : "all";
  renderDishes();
}

function renderAttention() {
  const dishItems = getDishItems();
  const issues = [
    { name: "Без фотографии", count: dishItems.filter((item) => !item.image).length, filter: "photo", type: "issue" },
    { name: "Без русского названия", count: dishItems.filter((item) => !String(item.name_ru || "").trim()).length, filter: "missing-ru", type: "issue" },
    { name: "Без казахского перевода", count: dishItems.filter((item) => !String(item.name_kz || "").trim() || !String(item.description_kz || "").trim()).length, filter: "missing-kz", type: "issue" },
    { name: "Без английского перевода", count: dishItems.filter((item) => !String(item.name_en || "").trim() || !String(item.description_en || "").trim()).length, filter: "missing-en", type: "issue" },
    { name: "Без категории", count: dishItems.filter((item) => !item.category_id).length, filter: "category", type: "issue" },
    { name: "Неактивные", count: dishItems.filter((item) => !item.is_active).length, filter: "inactive", type: "neutral" },
    { name: "Стоп-лист", count: dishItems.filter((item) => item.is_stoplisted || isTemporarilyUnavailable(item)).length, filter: "stop", type: "neutral" },
  ];
  const total = issues.reduce((sum, issue) => sum + issue.count, 0);
  el.attentionCount.textContent = total ? `${formatPositionCount(total)}` : "Все хорошо";
  el.attentionList.innerHTML = issues.map((issue) => {
    const status = getAttentionStatus(issue.count, issue.type);
    return `<button class="attention-item attention-item--${status.className}" type="button" data-attention-filter="${issue.filter}">
      <i></i>
      <span class="attention-copy"><strong>${issue.name}</strong><small>${status.description}</small></span>
      <span class="attention-result"><b>${formatPositionCount(issue.count)}</b><em>${status.label}</em></span>
    </button>`;
  }).join("");
}

function renderDishes() {
  const items = filteredItems();
  el.dishGrid.innerHTML = items.length ? items.map((item) => {
    const [statusClass] = status(item);
    const badges = getDishBadges(item);
    const isSale = !item.is_stoplisted && !isTemporarilyUnavailable(item) && item.is_active;
    return `<article class="dish-card ${statusClass !== "active" ? "is-muted" : ""}">
      <div class="dish-visual">${visual(item)}</div>
      <div class="dish-body">
        <div class="dish-title-row"><h3>${escapeHtml(getItemDisplayName(item))}</h3><button type="button" data-edit-item="${item.id}">Изменить</button></div>
        <div class="dish-meta">
          <span>${escapeHtml(categoryName(item.category_id))}</span>
          <button class="stock-control ${isSale ? "is-on" : ""}" type="button" data-toggle-stock="${item.id}" aria-label="${isSale ? "Перевести блюдо в стоп-лист" : "Вернуть блюдо в продажу"}">
            <span>${isSale ? "В продаже" : "На стопе"}</span>
            <i aria-hidden="true"></i>
          </button>
        </div>
        <div class="dish-badge-row">${badges.map((badge) => `<span class="exort-badge exort-badge--${badge.type}">${badge.label}</span>`).join("")}</div>
        <div class="dish-price">${formatPrice(item.price, item.currency)}</div>
      </div>
    </article>`;
  }).join("") : `<div class="empty-state"><h2>Ничего не найдено</h2><p>Измените фильтр или добавьте новое блюдо.</p></div>`;
}

function getDishBadges(item) {
  const badges = [];
  const [, statusText] = status(item);
  const statusType = item.is_stoplisted || isTemporarilyUnavailable(item) ? "danger" : (!item.is_active ? "neutral" : "success");
  badges.push({ label: statusText, type: statusType });
  if (!item.image) badges.push({ label: "Нет фото", type: "warning" });
  if (hasMissingTranslation(item)) badges.push({ label: "Нет перевода", type: "attention" });
  return badges;
}

function formatPrice(value, currency = "KZT") {
  const symbol = currency === "KZT" ? "₸" : currency;
  return `${new Intl.NumberFormat("ru-KZ").format(Number(value) || 0)} ${symbol}`;
}

function status(item) {
  if (!item.is_active) return ["inactive", "Неактивно"];
  if (isTemporarilyUnavailable(item)) return ["temp", "Временно недоступно"];
  if (item.is_stoplisted) return ["stop", "Стоп-лист"];
  return ["active", "В продаже"];
}

function formatPositionCount(count) {
  const mod10 = count % 10;
  const mod100 = count % 100;
  if (mod10 === 1 && mod100 !== 11) return `${count} позиция`;
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) return `${count} позиции`;
  return `${count} позиций`;
}



async function adminApi(action, payload = {}) {
  const requestPayload = {
    action,
    restaurantSlug: getRestaurantSlug(),
    sessionToken: state.sessionToken,
    ...payload,
  };

  let response;
  const controller = new AbortController();
  const timeoutId = window.setTimeout(() => controller.abort(), action === "getAnalytics" ? 20000 : 45000);
  try {
    response = await fetch(ADMIN_API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(requestPayload),
      signal: controller.signal,
    });
  } catch (error) {
    console.error("[exort-admin] API request failed.", {
      action,
      url: ADMIN_API_URL,
      method: "POST",
      error: error?.message || String(error),
      payload: requestPayload,
    });
    if (error?.name === "AbortError") {
      throw new Error(action === "getAnalytics"
        ? "Сервер аналитики не ответил за 20 секунд. Обновите страницу или повторите запрос."
        : "Сервер не ответил вовремя. Обновите страницу или повторите запрос.");
    }
    throw new Error("Сервис временно недоступен. Попробуйте обновить страницу или обратитесь в поддержку Exort.");
  } finally {
    window.clearTimeout(timeoutId);
  }

  const rawText = await response.text();
  let data = null;
  try {
    data = rawText ? JSON.parse(rawText) : {};
  } catch {
    data = { error: rawText };
  }

  if (!response.ok || data?.error) {
    const message = data?.error || `Admin API error ${response.status}`;
    console.error("[exort-admin] API rejected request.", {
      action,
      url: ADMIN_API_URL,
      method: "POST",
      status: response.status,
      statusText: response.statusText,
      responseText: rawText,
      data,
    });

    if (response.status === 401 && action !== "login") {
      sessionStorage.removeItem(sessionKeyPrefix + getRestaurantSlug());
      state.sessionToken = "";
      showLoginScreen();
      throw new Error("Сессия истекла. Войдите снова.");
    }

    if ([404, 405, 500, 502, 503].includes(response.status)) {
      console.error("[exort-admin] API endpoint is unavailable.", {
        action,
        url: ADMIN_API_URL,
        method: "POST",
        status: response.status,
        statusText: response.statusText,
        responseText: rawText,
        data,
      });
      throw new Error("Сервис временно недоступен. Попробуйте обновить страницу или обратитесь в поддержку Exort.");
    }

    throw new Error(response.status === 502
      ? "Сервис временно недоступен. Попробуйте обновить страницу или обратитесь в поддержку Exort."
      : message);
  }

  return data;
}

async function toggleStock(id) {
  const item = state.items.find((entry) => entry.id === id);
  if (!item) return;
  try {
    const result = await adminApi("toggleStock", { itemId: id, is_stoplisted: !item.is_stoplisted });
    upsertLocalItem(result.item);
    toast(result.item.is_stoplisted ? "Блюдо добавлено в стоп-лист" : "Блюдо возвращено в продажу", "success");
    renderAll();
  } catch (error) {
    toast(toFriendlyError(error.message) || "Не удалось изменить стоп-лист", "danger");
  }
}

function handleDeleteItem() {
  const id = el.itemForm.elements.id.value;
  if (!id) return;
  confirmAction("Удалить блюдо?", "Это действие нельзя отменить.", async () => {
    try {
      await adminApi("deleteItem", { itemId: id });
      state.items = state.items.filter((item) => item.id !== id);
      state.dirty = false;
      toast("Блюдо удалено", "success");
      closeDrawer(true);
      renderAll();
    } catch (error) {
      toast(toFriendlyError(error.message) || "Не удалось удалить блюдо", "danger");
    }
  });
}


async function translateMissingItems() {
  const ids = getDishItems().filter(hasMissingTranslation).map((item) => item.id);
  if (!ids.length) {
    toast("Все переводы заполнены", "success");
    return;
  }

  try {
    const result = await adminApi("translateMissing", { itemIds: ids });
    state.items = (result.items || state.items).map(normalizeItem);
    toast("Отсутствующие переводы заполнены", "success");
    renderAll();
  } catch {
    toast("Автоперевод пока недоступен. Заполните перевод вручную.", "danger");
  }
}


function toast(message, type = "") {
  const node = document.createElement("div");
  node.className = `toast ${type}`;
  node.textContent = toFriendlyError(message);
  el.toasts.append(node);
  setTimeout(() => {
    node.classList.add("is-hiding");
    setTimeout(() => node.remove(), 180);
  }, 3200);
}


function bindEvents() {
  el.pinForm.addEventListener("submit", handleLogin);
  el.pinVisibility.addEventListener("click", togglePinVisibility);

  document.addEventListener("click", handleDocumentClick);
  [el.menuSearch, el.categoryFilter, el.statusFilter, el.photoFilter, el.translationFilter]
    .filter(Boolean)
    .forEach((control) => control.addEventListener("input", renderDishes));

  el.itemForm.addEventListener("input", (event) => {
    if (event.target?.name === "sort_order") el.itemForm.dataset.sortMode = "manual";
    handleItemFormInput(event);
    renderDishPreview();
    state.dirty = true;
  });

  el.itemForm.addEventListener("change", (event) => {
    if (event.target?.matches("[data-auto-translate-toggle]")) {
      renderDishPreview();
      return;
    }
    if (event.target?.name === "category_id") syncSortOrderForSelectedCategory();
    updateEditorStatusFromForm();
    renderDishPreview();
    state.dirty = true;
  });

  document.querySelector("[data-auto-translate-toggle]")?.addEventListener("change", (event) => {
    setAutoTranslateEnabled(event.target.checked);
  });

  el.dishPreview?.addEventListener("click", (event) => {
    const tab = event.target.closest("[data-preview-lang-tab]");
    if (!tab) return;
    setPreviewLanguage(tab.dataset.previewLangTab);
  });

  el.itemForm.addEventListener("submit", handleItemSubmit);
  el.deleteItem.addEventListener("click", handleDeleteItem);
  el.editorFile.addEventListener("change", handleEditorFile);
  el.photoInput?.addEventListener("change", () => handleBulkUploads(el.photoInput.files));

  ["dragenter", "dragover"].forEach((type) => {
    el.uploadZone?.addEventListener(type, (event) => {
      event.preventDefault();
      el.uploadZone.classList.add("is-dragging");
    });
  });

  ["dragleave", "drop"].forEach((type) => {
    el.uploadZone?.addEventListener(type, (event) => {
      event.preventDefault();
      el.uploadZone.classList.remove("is-dragging");
    });
  });

  el.uploadZone?.addEventListener("drop", (event) => handleBulkUploads(event.dataTransfer.files));

  el.confirmDialog.addEventListener("close", () => {
    if (el.confirmDialog.returnValue === "confirm") state.pendingConfirm?.();
    state.pendingConfirm = null;
  });

  el.categoryForm.addEventListener("submit", handleCategorySubmit);
  document.querySelector("[data-close-category]").addEventListener("click", () => el.categoryDialog.close());

  document.querySelectorAll("[data-lang-tab]").forEach((tab) => {
    tab.addEventListener("click", () => {
      setEditorLanguage(tab.dataset.langTab);
      renderDishPreview();
    });
  });

  syncAutoTranslateControl();
  setTranslateStatus(getAutoTranslateEnabled() ? "idle" : "off");

  window.addEventListener("beforeunload", (event) => {
    if (!state.dirty) return;
    event.preventDefault();
    event.returnValue = "";
  });
}

function getEditorTranslationMeta() {
  if (!state.editorTranslationMeta) {
    state.editorTranslationMeta = {
      manual: {
        name_en: false,
        name_kz: false,
        description_en: false,
        description_kz: false,
      },
      previewLang: "ru",
      debounceTimer: 0,
      statusTimer: 0,
      requestId: 0,
      activePromise: null,
    };
  }
  return state.editorTranslationMeta;
}

function resetEditorTranslationMeta() {
  const meta = getEditorTranslationMeta();
  clearTimeout(meta.debounceTimer);
  clearTimeout(meta.statusTimer);
  meta.manual = {
    name_en: false,
    name_kz: false,
    description_en: false,
    description_kz: false,
  };
  meta.previewLang = "ru";
  meta.requestId = 0;
  meta.activePromise = null;
  syncAutoTranslateControl();
  setTranslateStatus(getAutoTranslateEnabled() ? "idle" : "off");
}

function getAutoTranslateEnabled() {
  return sessionStorage.getItem("exort.admin.autoTranslate") !== "false";
}

function setAutoTranslateEnabled(enabled) {
  sessionStorage.setItem("exort.admin.autoTranslate", enabled ? "true" : "false");
  syncAutoTranslateControl();
  if (!enabled) clearPendingAutoTranslate();
  setTranslateStatus(enabled ? "idle" : "off");
}

function syncAutoTranslateControl() {
  const toggle = document.querySelector("[data-auto-translate-toggle]");
  if (toggle) toggle.checked = getAutoTranslateEnabled();
}

function setTranslateStatus(mode = "idle") {
  const node = document.querySelector("[data-translate-status]");
  if (!node) return;

  const meta = getEditorTranslationMeta();
  clearTimeout(meta.statusTimer);

  const textByMode = {
    idle: "Автоперевод включен",
    off: "Автоперевод выключен",
    loading: "Переводим...",
    success: "Перевод выполнен",
    error: "Ошибка перевода",
  };

  node.textContent = textByMode[mode] || textByMode.idle;
  node.className = `translate-status${mode === "idle" ? "" : ` is-${mode}`}`;

  if (mode === "success" || mode === "error") {
    meta.statusTimer = setTimeout(() => {
      setTranslateStatus(getAutoTranslateEnabled() ? "idle" : "off");
    }, 1800);
  }
}

function clearPendingAutoTranslate() {
  const meta = getEditorTranslationMeta();
  clearTimeout(meta.debounceTimer);
  meta.debounceTimer = 0;
}

function setEditorLanguage(language = "ru") {
  const normalizedLanguage = ["ru", "kz", "en"].includes(language) ? language : "ru";
  if (el.itemForm) el.itemForm.dataset.editorLanguage = normalizedLanguage;
  document.querySelectorAll("[data-lang-tab]").forEach((node) => {
    node.classList.toggle("is-active", node.dataset.langTab === normalizedLanguage);
  });
  document.querySelectorAll("[data-lang-pane]").forEach((node) => {
    node.classList.toggle("is-active", node.dataset.langPane === normalizedLanguage);
  });
}

function getPreviewLanguage() {
  return getEditorTranslationMeta().previewLang || "ru";
}

function setPreviewLanguage(language = "ru") {
  getEditorTranslationMeta().previewLang = ["ru", "en", "kz"].includes(language) ? language : "ru";
  renderDishPreview();
}

function toggleMobilePreview() {
  if (!el.itemForm) return;
  const isOpen = el.itemForm.classList.toggle("is-preview-open");
  const button = document.querySelector("[data-toggle-preview]");
  if (button) button.textContent = isOpen ? "Скрыть превью" : "Показать превью";
}

function handleItemFormInput(event) {
  const field = event.target?.name;
  if (!field) return;

  const meta = getEditorTranslationMeta();
  const translatableFields = ["name_en", "name_kz", "description_en", "description_kz"];

  if (translatableFields.includes(field)) {
    meta.manual[field] = true;
    return;
  }

  if (field === "name_ru" || field === "description_ru") {
    if (!getAutoTranslateEnabled()) {
      setTranslateStatus("off");
      return;
    }
    scheduleAutoTranslateFromRu();
  }
}

function scheduleAutoTranslateFromRu() {
  clearPendingAutoTranslate();

  const hasRuSource = Boolean(
    el.itemForm?.elements.name_ru.value.trim() ||
    el.itemForm?.elements.description_ru.value.trim()
  );

  if (!hasRuSource) {
    setTranslateStatus(getAutoTranslateEnabled() ? "idle" : "off");
    return;
  }

  const meta = getEditorTranslationMeta();
  meta.debounceTimer = setTimeout(() => {
    translateCurrentItem({ showToast: false, quietOnEmpty: true });
  }, 900);
}

function getLocalizedEditorValue(field, language = getPreviewLanguage()) {
  const direct = el.itemForm?.elements[`${field}_${language}`]?.value?.trim();
  const fallback = el.itemForm?.elements[`${field}_ru`]?.value?.trim();
  return direct || fallback || "";
}

function getEditorPreviewItem() {
  const isStoplisted = el.itemForm?.querySelector('input[name="is_stoplisted"]:checked')?.value === "true";
  const oldPriceValue = String(el.itemForm?.elements.old_price?.value || "").trim();
  const caloriesValue = String(el.itemForm?.elements.calories?.value || "").trim();
  return {
    previewLang: getPreviewLanguage(),
    image: el.itemForm?.dataset.image || "",
    name: getLocalizedEditorValue("name") || "Название блюда",
    description: getLocalizedEditorValue("description") || "Описание появится здесь",
    price: Number(el.itemForm?.elements.price.value || 0),
    old_price: oldPriceValue ? Number(oldPriceValue) : null,
    weight: String(el.itemForm?.elements.weight?.value || "").trim(),
    calories: caloriesValue ? Number(caloriesValue) : null,
    spice_level: String(el.itemForm?.elements.spice_level?.value || "").trim(),
    currency: "KZT",
    category_id: el.itemForm?.elements.category_id.value || "",
    is_active: true,
    is_stoplisted: isStoplisted,
    inactive_until: null,
    missingPhoto: !el.itemForm?.dataset.image,
    missingTranslation: ["name_kz", "name_en", "description_kz", "description_en"]
      .some((name) => !String(el.itemForm?.elements[name]?.value || "").trim()),
  };
}



async function requestGoogleTranslation(text, targetLanguage) {
  if (!text) return "";

  const url = new URL("https://translate.googleapis.com/translate_a/single");
  url.searchParams.set("client", "gtx");
  url.searchParams.set("sl", "ru");
  url.searchParams.set("tl", targetLanguage);
  url.searchParams.set("dt", "t");
  url.searchParams.set("q", text);

  const response = await fetch(url.toString());
  if (!response.ok) throw new Error(`Translate request failed: ${response.status}`);

  const payload = await response.json();
  if (!Array.isArray(payload?.[0])) return "";
  return payload[0]
    .map((part) => Array.isArray(part) ? (part[0] || "") : "")
    .join("")
    .trim();
}

async function translateRuSource(source) {
  const tasks = [];

  if (source.name_ru) {
    tasks.push(requestGoogleTranslation(source.name_ru, "en").then((value) => ["name_en", value]));
    tasks.push(requestGoogleTranslation(source.name_ru, "kk").then((value) => ["name_kz", value]));
  }

  if (source.description_ru) {
    tasks.push(requestGoogleTranslation(source.description_ru, "en").then((value) => ["description_en", value]));
    tasks.push(requestGoogleTranslation(source.description_ru, "kk").then((value) => ["description_kz", value]));
  }

  const translatedEntries = await Promise.all(tasks);
  return Object.fromEntries(translatedEntries.filter(([, value]) => value));
}

function applyTranslatedFields(translations) {
  const meta = getEditorTranslationMeta();
  let applied = false;

  ["name_en", "name_kz", "description_en", "description_kz"].forEach((field) => {
    if (!translations[field]) return;
    if (meta.manual[field]) return;
    if (!el.itemForm?.elements[field]) return;
    el.itemForm.elements[field].value = translations[field];
    applied = true;
  });

  return applied;
}

async function translateCurrentItem(options = {}) {
  const ruTitle = el.itemForm.elements.name_ru.value.trim();
  const ruDescription = el.itemForm.elements.description_ru.value.trim();
  const showToast = options.showToast !== false;

  clearPendingAutoTranslate();

  if (!ruTitle && !ruDescription) {
    if (!options.quietOnEmpty) toast("Заполните RU название или описание", "danger");
    setTranslateStatus(getAutoTranslateEnabled() ? "idle" : "off");
    return null;
  }

  const meta = getEditorTranslationMeta();
  meta.requestId += 1;
  const requestId = meta.requestId;
  setTranslateStatus("loading");

  const translationPromise = (async () => {
    try {
      const translations = await translateRuSource({
        name_ru: ruTitle,
        description_ru: ruDescription,
      });

      if (requestId !== getEditorTranslationMeta().requestId) return null;

      const changed = applyTranslatedFields(translations);
      if (changed) state.dirty = true;
      renderDishPreview();
      setTranslateStatus("success");
      if (showToast) toast("Перевод выполнен", "success");
      return translations;
    } catch (error) {
      console.warn("[exort-admin] auto-translate failed", error);
      if (requestId !== getEditorTranslationMeta().requestId) return null;
      setTranslateStatus("error");
      if (showToast) toast("Автоперевод пока недоступен. Заполните перевод вручную.", "danger");
      return null;
    }
  })();

  meta.activePromise = translationPromise.finally(() => {
    if (getEditorTranslationMeta().activePromise === translationPromise) {
      getEditorTranslationMeta().activePromise = null;
    }
  });

  return meta.activePromise;
}

async function flushPendingAutoTranslateBeforeSave() {
  const meta = getEditorTranslationMeta();

  if (meta.debounceTimer && getAutoTranslateEnabled()) {
    clearPendingAutoTranslate();
    await translateCurrentItem({ showToast: false, quietOnEmpty: true });
    return;
  }

  if (meta.activePromise) {
    try {
      await meta.activePromise;
    } catch {
      // Saving should still continue even if translation failed.
    }
  }
}

async function handleItemSubmit(event) {
  event.preventDefault();
  if (state.savingItem) return;

  await flushPendingAutoTranslateBeforeSave();

  const data = Object.fromEntries(new FormData(el.itemForm));
  if (!String(data.name_ru || "").trim()) {
    setEditorLanguage("ru");
    el.itemForm.elements.name_ru.focus();
    toast("Укажите название блюда на русском", "danger");
    return;
  }
  if (!data.category_id) {
    el.itemForm.elements.category_id.focus();
    toast("Выберите категорию", "danger");
    return;
  }
  const existing = state.items.find((entry) => entry.id === data.id);
  const payload = {
    id: existing?.id || "",
    category_id: data.category_id,
    name_ru: data.name_ru.trim(),
    name_kz: data.name_kz.trim(),
    name_en: data.name_en.trim(),
    description_ru: data.description_ru.trim(),
    description_kz: data.description_kz.trim(),
    description_en: data.description_en.trim(),
    price: Number(data.price),
    old_price: String(data.old_price || "").trim() ? Number(data.old_price) : null,
    weight: String(data.weight || "").trim(),
    calories: String(data.calories || "").trim() ? Number(data.calories) : null,
    spice_level: String(data.spice_level || "").trim(),
    currency: data.currency || existing?.currency || "KZT",
    sort_order: Number(data.sort_order) || 0,
    is_active: data.is_active === "on",
    is_stoplisted: data.is_stoplisted === "true",
    inactive_until: data.inactive_until || null,
    image_url: el.itemForm.dataset.image || "",
    imageData: el.itemForm.dataset.pendingImage || "",
  };

  const submitButton = el.itemForm.querySelector('button[type="submit"]');
  state.savingItem = true;
  if (submitButton) submitButton.disabled = true;
  try {
    const result = await adminApi("saveItem", { item: payload });
    upsertLocalItem(result.item);
    state.dirty = false;
    toast(existing ? "Блюдо обновлено" : "Блюдо добавлено", "success");
    closeDrawer(true);
    renderAll();
  } catch (error) {
    toast(toFriendlyError(error.message) || "Не удалось сохранить блюдо", "danger");
  } finally {
    state.savingItem = false;
    if (submitButton) submitButton.disabled = false;
  }
}
if (el.viewTitle && viewMeta[state.activeView]) {
  el.viewTitle.textContent = viewMeta[state.activeView][0];
  el.viewKicker.textContent = viewMeta[state.activeView][1];
}

function showLoginError(message) {
  el.loginError.textContent = String(message || "").includes("Failed to fetch")
    ? "Сервис временно недоступен. Попробуйте обновить страницу или обратитесь в поддержку Exort."
    : message;
}

function togglePinVisibility() {
  el.pinInput.type = el.pinInput.type === "password" ? "text" : "password";
  el.pinVisibility.textContent = el.pinInput.type === "password" ? "Показать" : "Скрыть";
}

function toFriendlyError(message = "") {
  const text = String(message || "");
  if (/Translation backend|EXORT_TRANSLATE_API_URL|translate/i.test(text)) {
    return "Автоперевод пока недоступен. Заполните перевод вручную.";
  }
  if (/Admin API|Netlify Function|backend|Supabase|configured|env|SERVICE_ROLE|SUPABASE|API/i.test(text)) {
    return "Сервис временно недоступен. Попробуйте обновить страницу или обратитесь в поддержку Exort.";
  }
  return text;
}
function renderDishPreview() {
  if (!el.dishPreview || !el.itemForm) return;

  const item = getEditorPreviewItem();
  const previewLang = item.previewLang || "ru";
  const badges = [
    { label: item.is_stoplisted ? "Временно недоступно" : "В продаже", type: item.is_stoplisted ? "danger" : "success" },
    ...(item.missingPhoto ? [{ label: "Нет фото", type: "warning" }] : []),
    ...(item.missingTranslation ? [{ label: "Нет перевода", type: "attention" }] : []),
  ];
  const traits = [
    item.weight ? `<span class="preview-trait">${escapeHtml(item.weight)}</span>` : "",
    item.calories ? `<span class="preview-trait">${escapeHtml(`${item.calories} ккал`)}</span>` : "",
    item.spice_level ? `<span class="preview-trait preview-trait--spice">${escapeHtml(getSpiceLevelLabel(item.spice_level))}</span>` : "",
  ].filter(Boolean).join("");
  const hasOldPrice = Number(item.old_price) > 0;

  el.dishPreview.innerHTML = `
    <div class="preview-header">
      <div class="preview-kicker">Живое превью</div>
      <div class="preview-lang-switch" aria-label="Язык превью">
        ${["ru", "kz", "en"].map((lang) => `
          <button
            type="button"
            class="${previewLang === lang ? "is-active" : ""}"
            data-preview-lang-tab="${lang}"
          >${lang.toUpperCase()}</button>
        `).join("")}
      </div>
    </div>
    <article class="preview-dish-card ${item.is_stoplisted ? "is-muted" : ""}">
      <div class="preview-dish-visual">${visual({ image: item.image, name_ru: item.name })}</div>
      <div class="preview-dish-body">
        <span class="preview-category">${escapeHtml(categoryName(item.category_id))}</span>
        <h3>${escapeHtml(item.name)}</h3>
        ${item.description ? `<p>${escapeHtml(item.description)}</p>` : ""}
        ${traits ? `<div class="preview-traits">${traits}</div>` : ""}
        <div class="dish-badge-row">${badges.map((badge) => `<span class="exort-badge exort-badge--${badge.type}">${badge.label}</span>`).join("")}</div>
        <div class="preview-price-stack">
          ${hasOldPrice ? `<span class="preview-old-price">${escapeHtml(formatPrice(item.old_price, item.currency))}</span>` : ""}
          <strong>${escapeHtml(formatPrice(item.price, item.currency))}</strong>
        </div>
      </div>
    </article>
  `;
}

function openItemDrawer(id = "") {
  const item = state.items.find((entry) => entry.id === id);
  el.itemForm.reset();
  el.itemForm.classList.remove("is-preview-open");
  el.itemForm.dataset.editorLanguage = "ru";
  el.itemForm.dataset.sortMode = item ? "manual" : "auto";
  el.itemForm.elements.id.value = item?.id || "";
  el.itemForm.elements.name_ru.value = item?.name_ru || "";
  el.itemForm.elements.name_kz.value = item?.name_kz || "";
  el.itemForm.elements.name_en.value = item?.name_en || "";
  el.itemForm.elements.description_ru.value = item?.description_ru || "";
  el.itemForm.elements.description_kz.value = item?.description_kz || "";
  el.itemForm.elements.description_en.value = item?.description_en || "";
  el.itemForm.elements.price.value = item?.price || "";
  if (el.itemForm.elements.old_price) el.itemForm.elements.old_price.value = item?.old_price || "";
  if (el.itemForm.elements.weight) el.itemForm.elements.weight.value = item?.weight || "";
  if (el.itemForm.elements.calories) el.itemForm.elements.calories.value = item?.calories || "";
  if (el.itemForm.elements.spice_level) el.itemForm.elements.spice_level.value = item?.spice_level || "";
  if (el.itemForm.elements.currency) el.itemForm.elements.currency.value = item?.currency || "KZT";
  if (el.itemForm.elements.inactive_until) el.itemForm.elements.inactive_until.value = toDatetimeLocal(item?.inactive_until || "");
  if (el.itemForm.elements.is_active) el.itemForm.elements.is_active.checked = item ? item.is_active !== false : true;
  el.itemForm.elements.category_id.value = item?.category_id || "";
  el.itemForm.elements.sort_order.value = item ? item.sort_order || 0 : "";
  syncSortOrderForSelectedCategory(true);
  el.itemForm.dataset.image = item?.image || "";
  delete el.itemForm.dataset.pendingImage;
  renderEditorImage(item?.image || "");
  setEditorStatus(item?.is_stoplisted === true);
  setEditorLanguage("ru");
  resetEditorTranslationMeta();
  const extraDetails = document.querySelector("[data-extra-details]");
  if (extraDetails) extraDetails.open = false;
  const previewButton = document.querySelector("[data-toggle-preview]");
  if (previewButton) previewButton.textContent = "Показать превью";
  el.drawerTitle.textContent = item ? "Редактирование блюда" : "Новое блюдо";
  el.deleteItem.hidden = !item;
  el.drawer.setAttribute("aria-hidden", "false");
  state.dirty = false;
  renderDishPreview();
}
