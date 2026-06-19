const SUPABASE_REST_URL = "https://jnxwbqcnpxezjvfgdabc.supabase.co/rest/v1/";
const SUPABASE_PUBLISHABLE_KEY = "sb_publishable_T2QhpE8LByMP8_uO_cBdPg_bbLkAbBv";
const DEFAULT_RESTAURANT_SLUG = "exort-demo";
const ADMIN_API_URL = "/.netlify/functions/exort-admin";
const sessionKeyPrefix = "exort-admin-session:";
const themeStorageKey = "exort_theme";

// TEMP DEVELOPMENT MODE
// Set to false before production launch
const DEV_BYPASS_AUTH = true;

const state = {
  restaurant: { slug: DEFAULT_RESTAURANT_SLUG, name: "Exort Demo Restaurant", city: "Almaty", brand: "#2563eb" },
  categories: [],
  items: [],
  sessionToken: DEV_BYPASS_AUTH ? "dev-bypass" : sessionStorage.getItem(sessionKeyPrefix + getRestaurantSlug()) || "",
  activeView: "overview",
  loading: false,
  dirty: false,
  pendingConfirm: null,
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
  attentionList: document.querySelector("[data-attention-list]"),
  attentionCount: document.querySelector("[data-attention-count]"),
  dishGrid: document.querySelector("[data-dish-grid]"),
  categoryList: document.querySelector("[data-category-list]"),
  stopList: document.querySelector("[data-stop-list]"),
  photoGrid: document.querySelector("[data-photo-grid]"),
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
  photos: ["Фотографии", "Медиатека"],
};

Object.assign(viewMeta, {
  overview: ["Обзор", "Рабочее пространство"],
  menu: ["Меню", "Управление блюдами"],
  categories: ["Категории", "Структура меню"],
  stoplist: ["Стоп-лист", "Быстрая доступность"],
  photos: ["Фотографии", "Медиатека"],
});

init();

function getRestaurantSlug() {
  const querySlug = new URLSearchParams(window.location.search).get("restaurant");
  if (querySlug) return sanitizeSlug(querySlug);

  const adminMatch = window.location.pathname.match(/admin-([a-z0-9-]+)/i);
  if (adminMatch) return sanitizeSlug(adminMatch[1]);

  return DEFAULT_RESTAURANT_SLUG;
}

function sanitizeSlug(value) {
  return String(value || DEFAULT_RESTAURANT_SLUG).toLowerCase().replace(/[^a-z0-9-]/g, "") || DEFAULT_RESTAURANT_SLUG;
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
    nameInput.name = "name_ru";
    nameInput.closest("label").childNodes[0].textContent = "Название RU";
    nameInput.insertAdjacentHTML("afterend", `
      <span class="field-hint">RU обязательно, KZ/EN можно добавить позже.</span>
    `);
    categoryForm.querySelector(".field-hint")?.closest("label")?.insertAdjacentHTML("afterend", `
      <label>Название KZ<input name="name_kz" maxlength="80" autocomplete="off" /></label>
      <label>Название EN<input name="name_en" maxlength="80" autocomplete="off" /></label>
    `);
  }
}

async function init() {
  ensureAdminEnhancements();
  applyTheme(localStorage.getItem(themeStorageKey) || document.documentElement.dataset.theme || "light");
  bindEvents();
  await loadPublicRestaurantIdentity();

  if (DEV_BYPASS_AUTH) {
    await loadDevAdminData();
    openApp(false);
    navigate(location.hash.slice(1) || "overview");
    return;
  }

  if (state.sessionToken) {
    try {
      await loadAdminData();
      openApp(false);
    } catch (error) {
      sessionStorage.removeItem(sessionKeyPrefix + getRestaurantSlug());
      state.sessionToken = "";
      showLoginError(error.message || "Сессия устарела. Введите PIN еще раз.");
    }
  }

  navigate(location.hash.slice(1) || "overview");
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
    renderDishPreview();
    state.dirty = true;
  });
  el.itemForm.addEventListener("change", () => {
    syncSortOrderForSelectedCategory();
    updateEditorStatusFromForm();
    renderDishPreview();
    state.dirty = true;
  });
  el.itemForm.addEventListener("submit", handleItemSubmit);
  el.deleteItem.addEventListener("click", handleDeleteItem);
  el.editorFile.addEventListener("change", handleEditorFile);
  el.photoInput.addEventListener("change", () => handleBulkUploads(el.photoInput.files));

  ["dragenter", "dragover"].forEach((type) => {
    el.uploadZone.addEventListener(type, (event) => {
      event.preventDefault();
      el.uploadZone.classList.add("is-dragging");
    });
  });

  ["dragleave", "drop"].forEach((type) => {
    el.uploadZone.addEventListener(type, (event) => {
      event.preventDefault();
      el.uploadZone.classList.remove("is-dragging");
    });
  });

  el.uploadZone.addEventListener("drop", (event) => handleBulkUploads(event.dataTransfer.files));

  el.confirmDialog.addEventListener("close", () => {
    if (el.confirmDialog.returnValue === "confirm") state.pendingConfirm?.();
    state.pendingConfirm = null;
  });

  el.categoryForm.addEventListener("submit", handleCategorySubmit);
  document.querySelector("[data-close-category]").addEventListener("click", () => el.categoryDialog.close());

  document.querySelectorAll("[data-lang-tab]").forEach((tab) => {
    tab.addEventListener("click", () => {
      document.querySelectorAll("[data-lang-tab]").forEach((node) => node.classList.toggle("is-active", node === tab));
      document.querySelectorAll("[data-lang-pane]").forEach((node) => node.classList.toggle("is-active", node.dataset.langPane === tab.dataset.langTab));
      renderDishPreview();
    });
  });

  window.addEventListener("beforeunload", (event) => {
    if (!state.dirty) return;
    event.preventDefault();
    event.returnValue = "";
  });
}

async function requestPublicSupabase(table, query) {
  const url = new URL(table, SUPABASE_REST_URL);
  Object.entries(query).forEach(([key, value]) => url.searchParams.set(key, value));
  const response = await fetch(url, {
    headers: {
      apikey: SUPABASE_PUBLISHABLE_KEY,
      Authorization: `Bearer ${SUPABASE_PUBLISHABLE_KEY}`,
    },
  });
  if (!response.ok) throw new Error(await response.text());
  return response.json();
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
      syncRestaurantIdentity();
    }
  } catch (error) {
    console.warn("Public restaurant load failed:", error);
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

async function adminApi(action, payload = {}) {
  const response = await fetch(ADMIN_API_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      action,
      restaurantSlug: getRestaurantSlug(),
      sessionToken: state.sessionToken,
      ...payload,
    }),
  });

  const rawText = await response.text();
  let data = null;
  try {
    data = rawText ? JSON.parse(rawText) : {};
  } catch {
    data = { error: rawText };
  }

  if (!response.ok || data?.error) {
    const message = data?.error || `Admin API error ${response.status}`;
    throw new Error(response.status === 502
      ? "Сервис временно недоступен. Попробуйте обновить страницу или обратитесь в поддержку Exort."
      : message);
  }

  return data;
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
    toast("Доступ открыт", "success");
  } catch (error) {
    showLoginError(error.message || "Не удалось проверить PIN.");
  } finally {
    el.loginLabel.textContent = "Войти";
  }
}

function showLoginError(message) {
  el.loginError.textContent = message.includes("Failed to fetch")
    ? "Сервис временно недоступен. Попробуйте обновить страницу или обратитесь в поддержку Exort."
    : message;
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
    name: restaurant.name || "Exort Demo Restaurant",
    city: restaurant.city || "Almaty",
    brand: restaurant.brand_color || restaurant.brand || "#2563eb",
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
    sort_order: Number(item.sort_order || 0),
    version: Number(item.version || 1),
  };
}

function openApp(render = true) {
  el.login.hidden = true;
  el.app.hidden = false;
  syncRestaurantIdentity();
  if (render) renderAll();
}

function logout() {
  if (DEV_BYPASS_AUTH) {
    toast("Авторизация временно отключена для разработки.", "success");
    return;
  }

  const run = () => {
    sessionStorage.removeItem(sessionKeyPrefix + getRestaurantSlug());
    state.sessionToken = "";
    el.app.hidden = true;
    el.login.hidden = false;
    el.pinInput.value = "";
  };
  state.dirty ? confirmAction("Выйти без сохранения?", "Несохраненные изменения будут потеряны.", run) : run();
}

function syncRestaurantIdentity() {
  const initial = state.restaurant.name?.charAt(0)?.toUpperCase() || "E";
  el.restaurantNames.forEach((node) => { node.textContent = state.restaurant.name; });
  el.restaurantInitials.forEach((node) => { node.textContent = initial; });
  document.documentElement.style.setProperty("--brand", state.restaurant.brand || "#2563eb");
  document.querySelectorAll("[data-menu-link]").forEach((link) => {
    link.href = `/menu-demo?restaurant=${encodeURIComponent(state.restaurant.slug || getRestaurantSlug())}`;
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
}

function renderAll() {
  syncRestaurantIdentity();
  renderMetrics();
  renderAttention();
  renderFilters();
  renderDishes();
  renderCategories();
  renderStopList();
  renderPhotos();
}

function renderMetrics() {
  const active = state.items.filter((item) => item.is_active && !item.is_stoplisted && !isTemporarilyUnavailable(item)).length;
  const stopped = state.items.filter((item) => item.is_stoplisted || isTemporarilyUnavailable(item)).length;
  const values = [
    ["Всего блюд", state.items.length],
    ["В продаже", active],
    ["Стоп-лист", stopped],
    ["Требует внимания", state.items.filter((item) => !item.image || hasMissingTranslation(item) || item.is_stoplisted || isTemporarilyUnavailable(item)).length],
  ];
  el.metrics.innerHTML = values.map(([label, value]) => `<article class="metric-card"><span>${label}</span><strong>${value}</strong></article>`).join("");
}

function renderAttention() {
  const issues = [
    { name: "Нет фото", count: state.items.filter((item) => !item.image).length, view: "photos", type: "issue" },
    { name: "Нет перевода", count: state.items.filter((item) => hasMissingTranslation(item)).length, view: "menu", type: "issue" },
    { name: "Временно недоступные", count: state.items.filter(isTemporarilyUnavailable).length, view: "menu", type: "neutral" },
    { name: "Стоп-лист", count: state.items.filter((item) => item.is_stoplisted || isTemporarilyUnavailable(item)).length, view: "stoplist", type: "neutral" },
    { name: "Выключенные категории", count: state.categories.filter((category) => !category.active).length, view: "categories", type: "neutral" },
  ];
  el.attentionCount.textContent = `${issues.reduce((sum, issue) => sum + issue.count, 0)} замечаний`;
  el.attentionList.innerHTML = issues.map((issue) => {
    const status = getAttentionStatus(issue.count, issue.type);
    return `<button class="attention-item attention-item--${status.className}" type="button" data-attention-view="${issue.view}">
      <i></i>
      <span class="attention-copy"><strong>${issue.name}</strong><small>${status.description}</small></span>
      <span class="attention-result"><b>${formatPositionCount(issue.count)}</b><em>${status.label}</em></span>
    </button>`;
  }).join("");
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
  el.categoryFilter.innerHTML = `<option value="all">Все категории</option>${state.categories.map((category) => `<option value="${category.id}">${escapeHtml(category.name)}</option>`).join("")}`;
  el.categoryFilter.value = [...el.categoryFilter.options].some((option) => option.value === selected) ? selected : "all";
  el.itemForm.elements.category_id.innerHTML = state.categories.map((category) => `<option value="${category.id}">${escapeHtml(category.name)}</option>`).join("");
}

function filteredItems() {
  const query = el.menuSearch.value.trim().toLowerCase();
  const category = el.categoryFilter.value || "all";
  const status = el.statusFilter.value || "all";
  const photo = el.photoFilter?.value || "all";
  const translation = el.translationFilter?.value || "all";

  return state.items.filter((item) => {
    const matchesQuery = !query || [item.name_ru, item.name_kz, item.name_en, item.description_ru].join(" ").toLowerCase().includes(query);
    const matchesCategory = category === "all" || item.category_id === category;
    const matchesStatus =
      status === "all" ||
      (status === "active" && item.is_active && !item.is_stoplisted && !isTemporarilyUnavailable(item)) ||
      (status === "stop" && (item.is_stoplisted || isTemporarilyUnavailable(item))) ||
      (status === "inactive" && !item.is_active) ||
      (status === "temporary" && isTemporarilyUnavailable(item));
    const matchesPhoto = photo === "all" || (photo === "with" && item.image) || (photo === "missing" && !item.image);
    const matchesTranslation = translation === "all" || (translation === "complete" && !hasMissingTranslation(item)) || (translation === "missing" && hasMissingTranslation(item));
    return matchesQuery && matchesCategory && matchesStatus && matchesPhoto && matchesTranslation;
  });
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
        <div class="dish-title-row"><h3>${escapeHtml(item.name_ru || "Без названия")}</h3><button type="button" data-edit-item="${item.id}">Изменить</button></div>
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

function renderCategories() {
  el.categoryList.innerHTML = [...state.categories].sort((a, b) => a.sort - b.sort).map((category) => {
    const count = state.items.filter((item) => item.category_id === category.id).length;
    return `<article class="category-row">
      <span class="drag-handle">⋮⋮</span>
      <div><strong>${escapeHtml(category.name)}</strong><small>${count} блюд</small></div>
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
  const stoppedItems = state.items.filter((item) => item.is_stoplisted || isTemporarilyUnavailable(item));
  el.stopList.innerHTML = stoppedItems.length ? stoppedItems.map((item) => `<article class="stop-row">
    <div class="dish-placeholder">${escapeHtml((item.name_ru || "?").charAt(0))}</div>
    <div><strong>${escapeHtml(item.name_ru || "Без названия")}</strong><small>${escapeHtml(categoryName(item.category_id))} · ${formatPrice(item.price, item.currency)}</small></div>
    <span class="stop-state">На стопе</span>
    <button class="large-switch" type="button" data-toggle-stock="${item.id}" aria-label="Вернуть блюдо в продажу"></button>
  </article>`).join("") : `<div class="empty-state stop-empty-state">
    <h2>В стоп-листе пока нет блюд</h2>
    <p>Добавьте блюдо в стоп-лист из раздела меню.</p>
    <button class="primary-button compact" type="button" data-action="open-stop-filter">Добавить в стоп-лист</button>
  </div>`;
}

function renderPhotos() {
  const noPhoto = state.items.filter((item) => !item.image);
  el.photoGrid.innerHTML = noPhoto.length
    ? noPhoto.map((item) => `<article class="photo-card"><div>${visual(item)}</div><footer><strong>${escapeHtml(item.name_ru || "Без названия")}</strong><span>Нет фотографии</span></footer></article>`).join("")
    : `<div class="empty-state"><h2>Все блюда с фото</h2><p>Медиатека заполнена.</p></div>`;
}

function visual(item) {
  return item.image ? `<img src="${escapeHtml(item.image)}" alt="" />` : `<div class="dish-placeholder">${escapeHtml((item.name_ru || "?").charAt(0))}</div>`;
}

function status(item) {
  if (!item.is_active) return ["inactive", "неактивно"];
  if (isTemporarilyUnavailable(item)) return ["temp", "временно недоступно"];
  if (item.is_stoplisted) return ["stop", "стоп"];
  return ["active", "в продаже"];
}

function isTemporarilyUnavailable(item) {
  return Boolean(item.inactive_until && new Date(item.inactive_until).getTime() > Date.now());
}

function hasMissingTranslation(item) {
  return !String(item.name_kz || "").trim() || !String(item.name_en || "").trim() || !String(item.description_kz || "").trim() || !String(item.description_en || "").trim();
}

function categoryName(id) {
  return state.categories.find((category) => category.id === id)?.name || "Без категории";
}

function formatPrice(value, currency = "KZT") {
  const symbol = currency === "KZT" ? "₸" : currency;
  return `${new Intl.NumberFormat("ru-KZ").format(Number(value) || 0)} ${symbol}`;
}

function formatPositionCount(count) {
  const mod10 = count % 10;
  const mod100 = count % 100;
  if (mod10 === 1 && mod100 !== 11) return `${count} позиция`;
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) return `${count} позиции`;
  return `${count} позиций`;
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

function getLocalizedEditorValue(field) {
  const language = getActiveEditorLanguage();
  const direct = el.itemForm?.elements[`${field}_${language}`]?.value?.trim();
  const fallback = el.itemForm?.elements[`${field}_ru`]?.value?.trim();
  return direct || fallback || "";
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
  const categoryId = el.itemForm.elements.category_id.value || state.categories[0]?.id || "";
  el.itemForm.elements.sort_order.value = getNextSortOrder(categoryId);
  el.itemForm.dataset.sortMode = "auto";
}

function getEditorPreviewItem() {
  const isStoplisted = el.itemForm?.querySelector('input[name="is_stoplisted"]:checked')?.value === "true";
  return {
    image: el.itemForm?.dataset.image || "",
    name: getLocalizedEditorValue("name") || "Название блюда",
    description: getLocalizedEditorValue("description") || "Описание появится здесь",
    price: Number(el.itemForm?.elements.price.value || 0),
    currency: "KZT",
    category_id: el.itemForm?.elements.category_id.value || "",
    is_active: true,
    is_stoplisted: isStoplisted,
    inactive_until: null,
    missingPhoto: !el.itemForm?.dataset.image,
    missingTranslation: ["name_kz", "name_en", "description_kz", "description_en"].some((name) => !String(el.itemForm?.elements[name]?.value || "").trim()),
  };
}

function renderDishPreview() {
  if (!el.dishPreview || !el.itemForm) return;
  const item = getEditorPreviewItem();
  const statusType = item.is_stoplisted ? "danger" : "success";
  const statusText = item.is_stoplisted ? "Временно недоступно" : "В продаже";
  const badges = [
    { label: statusText, type: statusType },
    ...(item.missingPhoto ? [{ label: "Нет фото", type: "warning" }] : []),
    ...(item.missingTranslation ? [{ label: "Нет перевода", type: "attention" }] : []),
  ];
  el.dishPreview.innerHTML = `
    <div class="preview-kicker">Предпросмотр</div>
    <article class="preview-dish-card ${item.is_stoplisted ? "is-muted" : ""}">
      <div class="preview-dish-visual">${visual({ image: item.image, name_ru: item.name })}</div>
      <div class="preview-dish-body">
        <span class="preview-category">${escapeHtml(categoryName(item.category_id))}</span>
        <h3>${escapeHtml(item.name)}</h3>
        <p>${escapeHtml(item.description)}</p>
        <div class="dish-badge-row">${badges.map((badge) => `<span class="exort-badge exort-badge--${badge.type}">${badge.label}</span>`).join("")}</div>
        <strong>${formatPrice(item.price, item.currency)}</strong>
      </div>
    </article>
  `;
}

function openItemDrawer(id = "") {
  const item = state.items.find((entry) => entry.id === id);
  el.itemForm.reset();
  el.itemForm.dataset.sortMode = item ? "manual" : "auto";
  el.itemForm.elements.id.value = item?.id || "";
  el.itemForm.elements.name_ru.value = item?.name_ru || "";
  el.itemForm.elements.name_kz.value = item?.name_kz || "";
  el.itemForm.elements.name_en.value = item?.name_en || "";
  el.itemForm.elements.description_ru.value = item?.description_ru || "";
  el.itemForm.elements.description_kz.value = item?.description_kz || "";
  el.itemForm.elements.description_en.value = item?.description_en || "";
  el.itemForm.elements.price.value = item?.price || "";
  el.itemForm.elements.category_id.value = item?.category_id || state.categories[0]?.id || "";
  el.itemForm.elements.sort_order.value = item ? item.sort_order || 0 : "";
  syncSortOrderForSelectedCategory(true);
  el.itemForm.dataset.image = item?.image || "";
  delete el.itemForm.dataset.pendingImage;
  renderEditorImage(item?.image || "");
  setEditorStatus(item?.is_stoplisted === true);
  el.drawerTitle.textContent = item ? "Редактирование блюда" : "Новое блюдо";
  el.deleteItem.hidden = !item;
  el.drawer.setAttribute("aria-hidden", "false");
  state.dirty = false;
}

function closeDrawer(force = false) {
  if (state.dirty && !force) return confirmAction("Закрыть без сохранения?", "Изменения в карточке блюда будут потеряны.", () => closeDrawer(true));
  el.drawer.setAttribute("aria-hidden", "true");
  state.dirty = false;
}

function closeDrawer(force = false) {
  if (state.dirty && !force) return confirmAction("Закрыть без сохранения?", "Изменения в карточке блюда будут потеряны.", () => closeDrawer(true));
  el.drawer.setAttribute("aria-hidden", "true");
  state.dirty = false;
}

async function handleItemSubmit(event) {
  event.preventDefault();
  const data = Object.fromEntries(new FormData(el.itemForm));
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
    sort_order: Number(data.sort_order) || 0,
    is_active: existing ? existing.is_active : true,
    is_stoplisted: data.is_stoplisted === "true",
    inactive_until: existing?.inactive_until || null,
    image_url: el.itemForm.dataset.image || "",
    imageData: el.itemForm.dataset.pendingImage || "",
  };

  try {
    const result = await adminApi("saveItem", { item: payload });
    upsertLocalItem(result.item);
    state.dirty = false;
    toast(existing ? "Блюдо обновлено" : "Блюдо добавлено", "success");
    closeDrawer(true);
    renderAll();
  } catch (error) {
    toast(error.message || "Не удалось сохранить блюдо", "danger");
  }
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
    toast(error.message || "Не удалось изменить стоп-лист", "danger");
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
      toast(error.message || "Не удалось удалить блюдо", "danger");
    }
  });
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

  try {
    const result = await adminApi("saveCategory", { category: payload });
    upsertLocalCategory(result.category);
    el.categoryDialog.close();
    toast(existing ? "Категория обновлена" : "Категория добавлена", "success");
    navigate("categories");
    renderAll();
  } catch (error) {
    toast(error.message || "Не удалось сохранить категорию", "danger");
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
  const targets = state.items.filter((item) => !item.image).slice(0, files.length);
  if (!targets.length) {
    toast("Нет блюд без фото", "success");
    return;
  }

  for (const [index, file] of [...files].slice(0, targets.length).entries()) {
    try {
      const imageData = await prepareImage(file);
      const result = await adminApi("uploadItemPhoto", { itemId: targets[index].id, imageData });
      upsertLocalItem(result.item);
      toast(`Фото добавлено: ${result.item.name_ru || targets[index].name_ru}`, "success");
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

async function translateCurrentItem() {
  const ruTitle = el.itemForm.elements.name_ru.value.trim();
  const ruDescription = el.itemForm.elements.description_ru.value.trim();
  if (!ruTitle && !ruDescription) {
    toast("Заполните RU название или описание", "danger");
    return;
  }

  try {
    const result = await adminApi("translate", {
      source: {
        name_ru: ruTitle,
        description_ru: ruDescription,
      },
    });
    if (result.name_kz && !el.itemForm.elements.name_kz.value) el.itemForm.elements.name_kz.value = result.name_kz;
    if (result.name_en && !el.itemForm.elements.name_en.value) el.itemForm.elements.name_en.value = result.name_en;
    if (result.description_kz && !el.itemForm.elements.description_kz.value) el.itemForm.elements.description_kz.value = result.description_kz;
    if (result.description_en && !el.itemForm.elements.description_en.value) el.itemForm.elements.description_en.value = result.description_en;
    state.dirty = true;
    renderDishPreview();
    toast("Перевод заполнен", "success");
  } catch (error) {
    toast(error.message || "Переводчик временно недоступен", "danger");
  }
}

async function translateMissingItems() {
  const ids = state.items.filter(hasMissingTranslation).map((item) => item.id);
  if (!ids.length) {
    toast("Все переводы заполнены", "success");
    return;
  }

  try {
    const result = await adminApi("translateMissing", { itemIds: ids });
    state.items = (result.items || state.items).map(normalizeItem);
    toast("Отсутствующие переводы заполнены", "success");
    renderAll();
  } catch (error) {
    toast(error.message || "Автоперевод пока недоступен", "danger");
  }
}

function handleDocumentClick(event) {
  const nav = event.target.closest("[data-nav]");
  const action = event.target.closest("[data-action]")?.dataset.action;
  const stock = event.target.closest("[data-toggle-stock]")?.dataset.toggleStock;
  const edit = event.target.closest("[data-edit-item]")?.dataset.editItem;
  const attention = event.target.closest("[data-attention-view]")?.dataset.attentionView;
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
  if (event.target.closest("[data-logout]")) logout();
  if (event.target.closest("[data-close-drawer]")) closeDrawer();
  if (toggleCat) toggleCategory(toggleCat);
  if (editCat) editCategory(editCat);
  if (move) moveCategory(move.dataset.moveCategory, Number(move.dataset.direction));
  if (event.target.closest("[data-remove-editor-image]")) removeEditorImage();
  if (event.target.closest("[data-translate-current-item]")) translateCurrentItem();
  if (event.target.closest("[data-translate-missing]")) translateMissingItems();
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

function togglePinVisibility() {
  el.pinInput.type = el.pinInput.type === "password" ? "text" : "password";
  el.pinVisibility.textContent = el.pinInput.type === "password" ? "Показать" : "Скрыть";
}

function confirmAction(title, text, action) {
  state.pendingConfirm = action;
  el.confirmTitle.textContent = title;
  el.confirmText.textContent = text;
  el.confirmDialog.showModal();
}

function toast(message, type = "") {
  const node = document.createElement("div");
  node.className = `toast ${type}`;
  node.textContent = message;
  el.toasts.append(node);
  setTimeout(() => node.remove(), 3200);
}

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
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

function applyTheme(theme) {
  const nextTheme = theme === "dark" ? "dark" : "light";
  document.documentElement.dataset.theme = nextTheme;
  document.querySelector('meta[name="theme-color"]')?.setAttribute("content", nextTheme === "dark" ? "#0b1120" : "#f7f8fb");
  localStorage.setItem(themeStorageKey, nextTheme);
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
      nameInput.closest("label").childNodes[0].textContent = "Название RU";
      nameInput.insertAdjacentHTML("afterend", `<span class="field-hint">RU обязательно, KZ/EN можно добавить позже.</span>`);
      categoryForm.querySelector(".field-hint")?.closest("label")?.insertAdjacentHTML("afterend", `
        <label>Название KZ<input name="name_kz" maxlength="80" autocomplete="off" /></label>
        <label>Название EN<input name="name_en" maxlength="80" autocomplete="off" /></label>
      `);
    }
  }
}

function showLoginError(message) {
  el.loginError.textContent = toFriendlyError(message);
}

function renderMetrics() {
  const active = state.items.filter((item) => item.is_active && !item.is_stoplisted && !isTemporarilyUnavailable(item)).length;
  const stopped = state.items.filter((item) => item.is_stoplisted || isTemporarilyUnavailable(item)).length;
  const needsAttention = state.items.filter((item) => !item.image || hasMissingTranslation(item) || item.is_stoplisted || isTemporarilyUnavailable(item)).length;
  const values = [
    ["Всего блюд", state.items.length],
    ["В продаже", active],
    ["Стоп-лист", stopped],
    ["Требует внимания", needsAttention],
  ];
  el.metrics.innerHTML = values.map(([label, value]) => `<article class="metric-card"><span>${label}</span><strong>${value}</strong></article>`).join("");
}

function renderAttention() {
  const issues = [
    { name: "Нет фото", count: state.items.filter((item) => !item.image).length, view: "photos", type: "issue" },
    { name: "Нет перевода", count: state.items.filter((item) => hasMissingTranslation(item)).length, view: "menu", type: "issue" },
    { name: "Стоп-лист", count: state.items.filter((item) => item.is_stoplisted || isTemporarilyUnavailable(item)).length, view: "stoplist", type: "neutral" },
  ];
  const total = issues.reduce((sum, issue) => sum + issue.count, 0);
  el.attentionCount.textContent = total ? `${formatPositionCount(total)}` : "Все хорошо";
  el.attentionList.innerHTML = issues.map((issue) => {
    const status = getAttentionStatus(issue.count, issue.type);
    return `<button class="attention-item attention-item--${status.className}" type="button" data-attention-view="${issue.view}">
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
        <div class="dish-title-row"><h3>${escapeHtml(item.name_ru || "Без названия")}</h3><button type="button" data-edit-item="${item.id}">Изменить</button></div>
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

function openItemDrawer(id = "") {
  const item = state.items.find((entry) => entry.id === id);
  el.itemForm.reset();
  el.itemForm.dataset.sortMode = item ? "manual" : "auto";
  el.itemForm.elements.id.value = item?.id || "";
  el.itemForm.elements.name_ru.value = item?.name_ru || "";
  el.itemForm.elements.name_kz.value = item?.name_kz || "";
  el.itemForm.elements.name_en.value = item?.name_en || "";
  el.itemForm.elements.description_ru.value = item?.description_ru || "";
  el.itemForm.elements.description_kz.value = item?.description_kz || "";
  el.itemForm.elements.description_en.value = item?.description_en || "";
  el.itemForm.elements.price.value = item?.price || "";
  el.itemForm.elements.category_id.value = item?.category_id || state.categories[0]?.id || "";
  el.itemForm.elements.sort_order.value = item ? item.sort_order || 0 : "";
  syncSortOrderForSelectedCategory(true);
  el.itemForm.dataset.image = item?.image || "";
  delete el.itemForm.dataset.pendingImage;
  renderEditorImage(item?.image || "");
  setEditorStatus(item?.is_stoplisted === true);
  el.drawerTitle.textContent = item ? "Редактирование блюда" : "Новое блюдо";
  el.deleteItem.hidden = !item;
  el.drawer.setAttribute("aria-hidden", "false");
  state.dirty = false;
}

async function handleItemSubmit(event) {
  event.preventDefault();
  const data = Object.fromEntries(new FormData(el.itemForm));
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
    sort_order: Number(data.sort_order) || 0,
    is_active: existing ? existing.is_active : true,
    is_stoplisted: data.is_stoplisted === "true",
    inactive_until: existing?.inactive_until || null,
    image_url: el.itemForm.dataset.image || "",
    imageData: el.itemForm.dataset.pendingImage || "",
  };

  try {
    const result = await adminApi("saveItem", { item: payload });
    upsertLocalItem(result.item);
    state.dirty = false;
    toast(existing ? "Блюдо обновлено" : "Блюдо добавлено", "success");
    closeDrawer(true);
    renderAll();
  } catch (error) {
    toast(toFriendlyError(error.message) || "Не удалось сохранить блюдо", "danger");
  }
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

async function translateCurrentItem() {
  const ruTitle = el.itemForm.elements.name_ru.value.trim();
  const ruDescription = el.itemForm.elements.description_ru.value.trim();
  if (!ruTitle && !ruDescription) {
    toast("Заполните RU название или описание", "danger");
    return;
  }

  try {
    const result = await adminApi("translate", {
      source: {
        name_ru: ruTitle,
        description_ru: ruDescription,
      },
    });
    if (result.name_kz && !el.itemForm.elements.name_kz.value) el.itemForm.elements.name_kz.value = result.name_kz;
    if (result.name_en && !el.itemForm.elements.name_en.value) el.itemForm.elements.name_en.value = result.name_en;
    if (result.description_kz && !el.itemForm.elements.description_kz.value) el.itemForm.elements.description_kz.value = result.description_kz;
    if (result.description_en && !el.itemForm.elements.description_en.value) el.itemForm.elements.description_en.value = result.description_en;
    state.dirty = true;
    renderDishPreview();
    toast("Перевод заполнен", "success");
  } catch {
    toast("Автоперевод пока недоступен. Заполните перевод вручную.", "danger");
  }
}

async function translateMissingItems() {
  const ids = state.items.filter(hasMissingTranslation).map((item) => item.id);
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

function togglePinVisibility() {
  el.pinInput.type = el.pinInput.type === "password" ? "text" : "password";
  el.pinVisibility.textContent = el.pinInput.type === "password" ? "Показать" : "Скрыть";
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
