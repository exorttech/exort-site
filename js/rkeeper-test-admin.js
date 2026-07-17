const SUPABASE_REST_URL = "https://jnxwbqcnpxezjvfgdabc.supabase.co/rest/v1/";
const SUPABASE_PUBLISHABLE_KEY = "sb_publishable_T2QhpE8LByMP8_uO_cBdPg_bbLkAbBv";
const DEFAULT_RESTAURANT_SLUG = "rkeeper-test";
const ADMIN_API_URL = getAdminApiUrl();
const sessionKeyPrefix = "exort-admin-session:";

const state = {
  restaurant: { slug: DEFAULT_RESTAURANT_SLUG, name: "r_keeper Test Restaurant", city: "Almaty", brand: "#2563eb" },
  categories: [],
  items: [],
  sessionToken: sessionStorage.getItem(sessionKeyPrefix + getRestaurantSlug()) || "",
  activeView: "overview",
  loading: false,
  dirty: false,
  pendingConfirm: null,
  analyticsRange: "today",
  analyticsDrilldownDate: "",
  analytics: null,
  analyticsLoading: false,
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
};

Object.assign(viewMeta, {
  overview: ["Обзор", "Рабочее пространство"],
  menu: ["Меню", "Управление блюдами"],
  categories: ["Категории", "Структура меню"],
  stoplist: ["Стоп-лист", "Быстрая доступность"],
  analytics: ["Аналитика", "Поведение гостей и эффективность меню"],
});

init();

function getRestaurantSlug() {
  const querySlug = new URLSearchParams(window.location.search).get("restaurant");
  if (querySlug) return sanitizeSlug(querySlug);

  const adminMatch = window.location.pathname.match(/admin-([a-z0-9-]+)/i);
  if (adminMatch) return sanitizeSlug(adminMatch[1]);

  return DEFAULT_RESTAURANT_SLUG;
}

function normalizeItem(item) {
  const parsedOldPrice = Number(item.old_price || 0);
  const parsedCalories = Number(item.calories || 0);
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
    old_price: parsedOldPrice > 0 ? parsedOldPrice : null,
    weight: String(item.weight || "").trim(),
    calories: parsedCalories > 0 ? parsedCalories : null,
    spice_level: String(item.spice_level || "").trim(),
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

function getSpiceLevelLabel(value) {
  return {
    mild: "Легкая острота",
    medium: "Средняя острота",
    hot: "Острая",
  }[String(value || "").trim()] || "";
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
    description: getLocalizedEditorValue("description") || "",
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
  const extraDetails = document.querySelector("[data-extra-details]");
  if (extraDetails) {
    extraDetails.open = Boolean(item?.old_price || item?.weight || item?.calories || item?.spice_level);
  }
  el.itemForm.elements.category_id.value = item?.category_id || state.categories[0]?.id || "";
  el.itemForm.elements.sort_order.value = item ? item.sort_order || 0 : "";
  syncSortOrderForSelectedCategory(true);
  el.itemForm.dataset.image = item?.image || "";
  delete el.itemForm.dataset.pendingImage;
  renderEditorImage(item?.image || "");
  setEditorStatus(item?.is_stoplisted === true);
  resetEditorTranslationMeta();
  el.drawerTitle.textContent = item ? "Редактирование блюда" : "Новое блюдо";
  el.deleteItem.hidden = !item;
  el.drawer.setAttribute("aria-hidden", "false");
  state.dirty = false;
  renderDishPreview();
}
(() => {
  if (window.__rkeeperTestAdminPatchedAtEnd) return;
  window.__rkeeperTestAdminPatchedAtEnd = true;

  const syncUrl = "/api/rkeeper-test-sync";
  const ui = () => ({
    list: document.querySelector("[data-rkeeper-status-list]"),
    note: document.querySelector("[data-rkeeper-status-note]"),
    button: document.querySelector("[data-rkeeper-sync-button]"),
    priceHint: document.querySelector("[data-rkeeper-price-hint]"),
  });

  function applyReadonlyPrice() {
    const input = el.itemForm?.elements?.price;
    if (!input) return;
    input.disabled = true;
    input.readOnly = true;
    input.placeholder = "Цена из r_keeper";
    if (ui().priceHint) ui().priceHint.textContent = "Цена из r_keeper";
  }

  function renderStatus(status = {}) {
    const nodes = ui();
    if (!nodes.list || !nodes.note) return;
    const rows = [
      ["Статус подключения", status.connectionStatus || "Не настроено"],
      ["Последняя синхронизация", status.lastSyncAt || "Еще не запускалась"],
      ["Получено блюд", status.receivedItems ?? 0],
      ["Обновлено блюд", status.updatedItems ?? 0],
      ["Последняя ошибка", status.lastError || "Нет"],
    ];
    nodes.list.innerHTML = rows.map(([label, value]) => `<div class="attention-item"><strong>${escapeHtml(label)}</strong><span>${escapeHtml(String(value))}</span></div>`).join("");
    nodes.note.textContent = status.lastMessage || "Тестовый контур работает только с рестораном rkeeper-test.";
  }

  const previousBuildPayload = buildOptionalItemPayload;
  buildOptionalItemPayload = function buildOptionalRkeeperPayload(data, existing) {
    const payload = previousBuildPayload(data, existing);
    delete payload.price;
    payload.rkeeper_readonly_price = true;
    return payload;
  };

  const previousOpenDrawer = openItemDrawer;
  openItemDrawer = function openRkeeperDrawer(id = "") {
    previousOpenDrawer(id);
    applyReadonlyPrice();
  };

  async function refreshStatus() {
    const response = await fetch(`${syncUrl}?restaurant=${encodeURIComponent(getRestaurantSlug())}`, {
      headers: { Authorization: `Bearer ${state.sessionToken}` },
    });
    const payload = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(payload.error || "Не удалось получить статус r_keeper.");
    renderStatus(payload.status || {});
  }

  async function syncNow() {
    const nodes = ui();
    if (nodes.button) nodes.button.disabled = true;
    try {
      const response = await fetch(syncUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${state.sessionToken}`,
        },
        body: JSON.stringify({ restaurantSlug: getRestaurantSlug() }),
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(payload.error || "Не удалось выполнить sync.");
      renderStatus(payload.status || {});
      if (Array.isArray(payload.items)) {
        state.items = payload.items.map(normalizeItem);
        renderAll();
      }
      toast("Тестовая синхронизация r_keeper завершена", "success");
    } catch (error) {
      toast(toFriendlyError(error.message) || "Ошибка синхронизации r_keeper", "danger");
    } finally {
      if (nodes.button) nodes.button.disabled = false;
    }
  }

  const previousLoadData = loadAdminData;
  loadAdminData = async function loadAdminDataRkeeper() {
    await previousLoadData();
    const nodes = ui();
    if (nodes.button && nodes.button.dataset.bound !== "true") {
      nodes.button.dataset.bound = "true";
      nodes.button.addEventListener("click", syncNow);
    }
    applyReadonlyPrice();
    await refreshStatus().catch((error) => {
      renderStatus({
        connectionStatus: "Ошибка",
        lastError: error.message,
        lastMessage: "Не удалось получить статус тестовой интеграции r_keeper.",
      });
    });
  };

  state.restaurant.slug = DEFAULT_RESTAURANT_SLUG;
  state.restaurant.name = "r_keeper Test Restaurant";
  setTimeout(applyReadonlyPrice, 0);
})();
(() => {
  if (window.__rkeeperTestAdminPatched) return;
  window.__rkeeperTestAdminPatched = true;

  const syncUrl = "/api/rkeeper-test-sync";
  const ui = () => ({
    list: document.querySelector("[data-rkeeper-status-list]"),
    note: document.querySelector("[data-rkeeper-status-note]"),
    button: document.querySelector("[data-rkeeper-sync-button]"),
    priceHint: document.querySelector("[data-rkeeper-price-hint]"),
  });

  function applyReadonlyPrice() {
    const input = el.itemForm?.elements?.price;
    if (!input) return;
    input.disabled = true;
    input.readOnly = true;
    input.placeholder = "Цена из r_keeper";
    if (ui().priceHint) ui().priceHint.textContent = "Цена из r_keeper";
  }

  function renderStatus(status = {}) {
    const nodes = ui();
    if (!nodes.list || !nodes.note) return;
    const rows = [
      ["Статус подключения", status.connectionStatus || "Не настроено"],
      ["Последняя синхронизация", status.lastSyncAt || "Еще не запускалась"],
      ["Получено блюд", status.receivedItems ?? 0],
      ["Обновлено блюд", status.updatedItems ?? 0],
      ["Последняя ошибка", status.lastError || "Нет"],
    ];
    nodes.list.innerHTML = rows.map(([label, value]) => `<div class="attention-item"><strong>${escapeHtml(label)}</strong><span>${escapeHtml(String(value))}</span></div>`).join("");
    nodes.note.textContent = status.lastMessage || "Тестовый контур работает только с рестораном rkeeper-test.";
  }

  const previousBuildPayload = buildOptionalItemPayload;
  buildOptionalItemPayload = function buildOptionalRkeeperPayload(data, existing) {
    const payload = previousBuildPayload(data, existing);
    delete payload.price;
    payload.rkeeper_readonly_price = true;
    return payload;
  };

  const previousOpenDrawer = openItemDrawer;
  openItemDrawer = function openRkeeperDrawer(id = "") {
    previousOpenDrawer(id);
    applyReadonlyPrice();
  };

  async function refreshStatus() {
    const response = await fetch(`${syncUrl}?restaurant=${encodeURIComponent(getRestaurantSlug())}`, {
      headers: { Authorization: `Bearer ${state.sessionToken}` },
    });
    const payload = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(payload.error || "Не удалось получить статус r_keeper.");
    renderStatus(payload.status || {});
  }

  async function syncNow() {
    const nodes = ui();
    if (nodes.button) nodes.button.disabled = true;
    try {
      const response = await fetch(syncUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${state.sessionToken}`,
        },
        body: JSON.stringify({ restaurantSlug: getRestaurantSlug() }),
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(payload.error || "Не удалось выполнить sync.");
      renderStatus(payload.status || {});
      if (Array.isArray(payload.items)) {
        state.items = payload.items.map(normalizeItem);
        renderAll();
      }
      toast("Тестовая синхронизация r_keeper завершена", "success");
    } catch (error) {
      toast(toFriendlyError(error.message) || "Ошибка синхронизации r_keeper", "danger");
    } finally {
      if (nodes.button) nodes.button.disabled = false;
    }
  }

  const previousLoadData = loadAdminData;
  loadAdminData = async function loadAdminDataRkeeper() {
    await previousLoadData();
    const nodes = ui();
    if (nodes.button && nodes.button.dataset.bound !== "true") {
      nodes.button.dataset.bound = "true";
      nodes.button.addEventListener("click", syncNow);
    }
    applyReadonlyPrice();
    await refreshStatus().catch((error) => {
      renderStatus({
        connectionStatus: "Ошибка",
        lastError: error.message,
        lastMessage: "Не удалось получить статус тестовой интеграции r_keeper.",
      });
    });
  };

  state.restaurant.slug = DEFAULT_RESTAURANT_SLUG;
  state.restaurant.name = "r_keeper Test Restaurant";
  setTimeout(applyReadonlyPrice, 0);
})();

(() => {
  const nodes = () => ({
    list: document.querySelector("[data-rkeeper-status-list]"),
    note: document.querySelector("[data-rkeeper-status-note]"),
    button: document.querySelector("[data-rkeeper-sync-button]"),
    priceHint: document.querySelector("[data-rkeeper-price-hint]"),
  });

  const syncUrl = "/api/rkeeper-test-sync";

  function applyReadonlyPrice() {
    const input = el.itemForm?.elements?.price;
    if (!input) return;
    input.disabled = true;
    input.readOnly = true;
    input.placeholder = "Цена из r_keeper";
    if (nodes().priceHint) nodes().priceHint.textContent = "Цена из r_keeper";
  }

  function renderStatus(status = {}) {
    const ui = nodes();
    if (!ui.list || !ui.note) return;

    const rows = [
      ["Статус подключения", status.connectionStatus || "Не настроено"],
      ["Последняя синхронизация", status.lastSyncAt || "Еще не запускалась"],
      ["Получено блюд", status.receivedItems ?? 0],
      ["Обновлено блюд", status.updatedItems ?? 0],
      ["Последняя ошибка", status.lastError || "Нет"],
    ];

    ui.list.innerHTML = rows.map(([label, value]) => `
      <div class="attention-item">
        <strong>${escapeHtml(label)}</strong>
        <span>${escapeHtml(String(value))}</span>
      </div>
    `).join("");
    ui.note.textContent = status.lastMessage || "Тестовый контур работает только с рестораном rkeeper-test.";
  }

  const originalPayloadBuilder = buildOptionalItemPayload;
  buildOptionalItemPayload = function buildOptionalRkeeperPayload(data, existing) {
    const payload = originalPayloadBuilder(data, existing);
    delete payload.price;
    payload.rkeeper_readonly_price = true;
    return payload;
  };

  const originalDrawerOpen = openItemDrawer;
  openItemDrawer = function openRkeeperDrawer(id = "") {
    originalDrawerOpen(id);
    applyReadonlyPrice();
  };

  async function refreshStatus() {
    const response = await fetch(`${syncUrl}?restaurant=${encodeURIComponent(getRestaurantSlug())}`, {
      headers: { Authorization: `Bearer ${state.sessionToken}` },
    });
    const payload = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(payload.error || "Не удалось получить статус r_keeper.");
    renderStatus(payload.status || {});
  }

  async function syncNow() {
    const ui = nodes();
    if (ui.button) ui.button.disabled = true;
    try {
      const response = await fetch(syncUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${state.sessionToken}`,
        },
        body: JSON.stringify({ restaurantSlug: getRestaurantSlug() }),
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(payload.error || "Не удалось выполнить sync.");
      renderStatus(payload.status || {});
      if (Array.isArray(payload.items)) {
        state.items = payload.items.map(normalizeItem);
        renderAll();
      }
      toast("Тестовая синхронизация r_keeper завершена", "success");
    } catch (error) {
      toast(toFriendlyError(error.message) || "Ошибка синхронизации r_keeper", "danger");
    } finally {
      if (ui.button) ui.button.disabled = false;
    }
  }

  function bindSyncButton() {
    const ui = nodes();
    if (!ui.button || ui.button.dataset.bound === "true") return;
    ui.button.dataset.bound = "true";
    ui.button.addEventListener("click", syncNow);
  }

  const originalLoadData = loadAdminData;
  loadAdminData = async function loadAdminDataRkeeper() {
    await originalLoadData();
    bindSyncButton();
    applyReadonlyPrice();
    await refreshStatus().catch((error) => {
      renderStatus({
        connectionStatus: "Ошибка",
        lastError: error.message,
        lastMessage: "Не удалось получить статус тестовой интеграции r_keeper.",
      });
    });
  };

  state.restaurant.slug = DEFAULT_RESTAURANT_SLUG;
  state.restaurant.name = "r_keeper Test Restaurant";
  window.setTimeout(() => {
    bindSyncButton();
    applyReadonlyPrice();
  }, 0);
})();

const RKEEPER_TEST_SYNC_URL = "/api/rkeeper-test-sync";

function getRkeeperStatusElements() {
  return {
    panel: document.querySelector("[data-rkeeper-panel]"),
    list: document.querySelector("[data-rkeeper-status-list]"),
    note: document.querySelector("[data-rkeeper-status-note]"),
    button: document.querySelector("[data-rkeeper-sync-button]"),
    priceHint: document.querySelector("[data-rkeeper-price-hint]"),
  };
}

function setRkeeperPriceMode() {
  const priceInput = el.itemForm?.elements?.price;
  if (!priceInput) return;

  priceInput.disabled = true;
  priceInput.readOnly = true;
  priceInput.placeholder = "Цена из r_keeper";

  const nodes = getRkeeperStatusElements();
  if (nodes.priceHint) {
    nodes.priceHint.hidden = false;
    nodes.priceHint.textContent = "Цена из r_keeper";
  }
}

function formatRkeeperStatusValue(value, fallback = "Нет данных") {
  if (value === null || value === undefined || value === "") return fallback;
  return String(value);
}

function renderRkeeperSyncStatus(status) {
  const nodes = getRkeeperStatusElements();
  if (!nodes.list || !nodes.note) return;

  const items = [
    ["Статус подключения", status?.connectionStatus || "Не настроено"],
    ["Последняя синхронизация", status?.lastSyncAt || "Еще не запускалась"],
    ["Получено блюд", status?.receivedItems ?? 0],
    ["Обновлено блюд", status?.updatedItems ?? 0],
    ["Последняя ошибка", status?.lastError || "Нет"],
  ];

  nodes.list.innerHTML = items.map(([label, value]) => `
    <div class="attention-item">
      <strong>${escapeHtml(label)}</strong>
      <span>${escapeHtml(formatRkeeperStatusValue(value))}</span>
    </div>
  `).join("");

  nodes.note.textContent = status?.lastMessage || "Тестовая синхронизация работает только с рестораном rkeeper-test.";
}

async function fetchRkeeperSyncStatus() {
  const response = await fetch(`${RKEEPER_TEST_SYNC_URL}?restaurant=${encodeURIComponent(getRestaurantSlug())}`, {
    headers: {
      Authorization: `Bearer ${state.sessionToken}`,
    },
  });

  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(payload.error || "Не удалось получить статус r_keeper.");
  }

  renderRkeeperSyncStatus(payload.status || {});
}

async function runRkeeperSync() {
  const nodes = getRkeeperStatusElements();
  if (nodes.button) nodes.button.disabled = true;

  try {
    const response = await fetch(RKEEPER_TEST_SYNC_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${state.sessionToken}`,
      },
      body: JSON.stringify({
        restaurantSlug: getRestaurantSlug(),
      }),
    });

    const payload = await response.json().catch(() => ({}));
    if (!response.ok) {
      throw new Error(payload.error || "Тестовая синхронизация завершилась ошибкой.");
    }

    renderRkeeperSyncStatus(payload.status || {});
    if (payload.items) {
      state.items = payload.items.map(normalizeItem);
      renderAll();
    }
    toast("Тестовая синхронизация r_keeper завершена", "success");
  } catch (error) {
    toast(toFriendlyError(error.message) || "Не удалось выполнить синхронизацию r_keeper", "danger");
  } finally {
    if (nodes.button) nodes.button.disabled = false;
  }
}

function attachRkeeperSyncControls() {
  const nodes = getRkeeperStatusElements();
  if (!nodes.button || nodes.button.dataset.bound === "true") return;

  nodes.button.dataset.bound = "true";
  nodes.button.addEventListener("click", runRkeeperSync);
}

const originalOpenItemDrawer = openItemDrawer;
openItemDrawer = function openRkeeperItemDrawer(id = "") {
  originalOpenItemDrawer(id);
  setRkeeperPriceMode();
};

const originalBuildOptionalItemPayload = buildOptionalItemPayload;
buildOptionalItemPayload = function buildRkeeperOptionalItemPayload(data, existing) {
  const payload = originalBuildOptionalItemPayload(data, existing);
  delete payload.price;
  payload.rkeeper_readonly_price = true;
  return payload;
};

const originalLoadPublicRestaurantIdentity = loadPublicRestaurantIdentity;
loadPublicRestaurantIdentity = async function loadRkeeperRestaurantIdentity() {
  await originalLoadPublicRestaurantIdentity();
  state.restaurant = {
    ...state.restaurant,
    slug: DEFAULT_RESTAURANT_SLUG,
    name: state.restaurant?.name || "r_keeper Test Restaurant",
  };
};

const originalLoadAdminData = loadAdminData;
loadAdminData = async function loadRkeeperAdminData() {
  await originalLoadAdminData();
  attachRkeeperSyncControls();
  await fetchRkeeperSyncStatus().catch((error) => {
    renderRkeeperSyncStatus({
      connectionStatus: "Ошибка",
      lastError: error.message,
      lastMessage: "Не удалось получить статус тестовой интеграции r_keeper.",
    });
  });
};

window.setTimeout(() => {
  attachRkeeperSyncControls();
  setRkeeperPriceMode();
}, 0);

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

async function handleItemSubmit(event) {
  event.preventDefault();

  await flushPendingAutoTranslateBeforeSave();

  const data = Object.fromEntries(new FormData(el.itemForm));
  const existing = state.items.find((entry) => entry.id === data.id);
  const payload = buildOptionalItemPayload(data, existing);

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
  el.photoInput?.addEventListener("change", () => handleBulkUploads(el.photoInput.files));
  el.menuHeroFile?.addEventListener("change", handleMenuHeroFile);

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
  const requestPayload = {
    action,
    restaurantSlug: getRestaurantSlug(),
    sessionToken: state.sessionToken,
    ...payload,
  };
  let response;
  try {
    response = await fetch(ADMIN_API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(requestPayload),
    });
  } catch (error) {
    console.error("[exort-admin] API request failed.", {
      action,
      url: ADMIN_API_URL,
      method: "POST",
      error: error?.message || String(error),
      payload: requestPayload,
    });
    throw new Error("Сервис временно недоступен. Попробуйте обновить страницу или обратитесь в поддержку Exort.");
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
    if ([404, 405, 500, 502, 503].includes(response.status)) {
      console.error("[exort-admin] API endpoint is unavailable.", { action, endpoint: ADMIN_API_URL, status: response.status, data });
      throw new Error("Сервис временно недоступен. Попробуйте обновить страницу или обратитесь в поддержку Exort.");
    }
    console.warn("[exort-admin] API request was rejected.", { action, endpoint: ADMIN_API_URL, status: response.status, data });
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
    navigate("overview");
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
}

function showLoginScreen() {
  el.app.hidden = true;
  el.login.hidden = false;
}

function logout() {
  const run = () => {
    sessionStorage.removeItem(sessionKeyPrefix + getRestaurantSlug());
    state.sessionToken = "";
    clearAdminHash();
    showLoginScreen();
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
  if (view === "analytics") loadAnalytics();
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
  renderAnalytics();
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
    { name: "Нет фото", count: state.items.filter((item) => !item.image).length, view: "menu", type: "issue" },
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

  return getDishItems().filter((item) => {
    const matchesQuery = !query || [getItemDisplayName(item), getItemDisplayDescription(item), item.content_key].join(" ").toLowerCase().includes(query);
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

function renderAnalytics() {
  if (!el.analyticsRoot) return;
  const analytics = state.analytics;
  const range = state.analyticsRange || "today";
  const rangeLabel = getAnalyticsRangeLabel(range);
  const menuVisits = analytics ? getAnalyticsRangeValue(analytics.menuVisits, range) : 0;
  const uniqueGuests = analytics ? getAnalyticsRangeValue(analytics.uniqueGuests, range) : 0;
  const dishOpens = analytics ? getAnalyticsRangeValue(analytics.dishOpens, range) : 0;

  el.analyticsRoot.innerHTML = `
    <div class="analytics-toolbar">
      <div>
        <p class="kicker">Реальные данные</p>
        <h2>Статистика меню</h2>
      </div>
      <div class="analytics-range" role="group" aria-label="Период аналитики">
        ${[
          ["today", "Сегодня"],
          ["7d", "Неделя"],
          ["30d", "Месяц"],
          ["year", "Год"],
        ].map(([value, label]) => `<button class="${range === value ? "is-active" : ""}" type="button" data-analytics-range="${value}">${label}</button>`).join("")}
      </div>
    </div>
    ${state.analyticsLoading ? `<div class="analytics-loading">Загружаем аналитику...</div>` : ""}
    <div class="analytics-summary-grid">
      ${renderAnalyticsMetric("Посещения меню", menuVisits, rangeLabel, "menu_open")}
      ${renderAnalyticsMetric("Сессии", uniqueGuests, rangeLabel, "session_id")}
      ${renderAnalyticsMetric("Открытия блюд", dishOpens, rangeLabel, "dish_open")}
      ${renderAnalyticsMetric("Среднее время просмотра", analytics?.averageViewTime || null, "будет доступно позже", "view_time")}
    </div>

    <div class="analytics-main-grid">
      ${renderPopularDishes(analytics?.popularDishes || [])}
      ${renderAnalyticsActivity(analytics, range)}
    </div>

    <div class="analytics-secondary-grid">
      ${renderAnalyticsBreakdown("Языки", "Языки гостей", analytics?.languages || [], "language", "Пока нет данных")}
      ${renderAnalyticsBreakdown("Устройства", "Устройства гостей", analytics?.devices || [], "device", "Пока нет данных")}
      ${renderRecentEvents(analytics?.recentEvents || [])}
    </div>
  `;
}

async function loadAnalytics(force = false) {
  if (!el.analyticsRoot || state.analyticsLoading) return;
  if (state.analytics && !force) {
    renderAnalytics();
    return;
  }

  state.analyticsLoading = true;
  renderAnalytics();
  try {
    const result = await adminApi("getAnalytics", { range: state.analyticsRange });
    state.analytics = result.analytics || null;
  } catch (error) {
    console.warn("[exort-admin] analytics load failed", error);
    toast(toFriendlyError(error.message) || "Не удалось загрузить аналитику", "danger");
    state.analytics = null;
  } finally {
    state.analyticsLoading = false;
    renderAnalytics();
  }
}

function getAnalyticsRangeValue(group = {}, range = "7d") {
  if (range === "today") return group.today || 0;
  if (range === "30d") return group.last30Days || 0;
  if (range === "year") return group.year || 0;
  if (range === "all") return group.allTime || group.total || group.year || group.last30Days || 0;
  return group.last7Days || 0;
}

function getAnalyticsRangeLabel(range = "7d") {
  if (range === "today") return "сегодня";
  if (range === "30d") return "за месяц";
  if (range === "year") return "за год";
  if (range === "all") return "за все время";
  return "за неделю";
}

function renderAnalyticsMetric(label, value, hint, code) {
  const empty = value === null || value === undefined;
  const formattedValue = typeof value === "string" ? value : formatAnalyticsNumber(value);
  return `<article class="analytics-metric-card" data-analytics-code="${code}">
    <span>${label}</span>
    <strong>${empty ? "Нет данных" : formattedValue}</strong>
    <small>${empty ? hint : hint}</small>
  </article>`;
}

function renderPopularDishes(items) {
  const maxOpens = Math.max(...items.map((item) => item.opens || 0), 0);
  return `<article class="analytics-card analytics-card--wide">
    <div class="analytics-card-head"><div><p class="kicker">Интерес гостей</p><h2>Популярные блюда</h2></div></div>
    ${items.length ? `<div class="analytics-ranked-list">
      ${items.map((item, index) => `<div class="analytics-ranked-row">
        <span>${index + 1}</span>
        <strong>${escapeHtml(item.title || "Блюдо")}</strong>
        <em>${formatAnalyticsNumber(item.opens || 0)} ${pluralizeOpen(item.opens || 0)}</em>
        <i style="--value:${getChartFillPercent(item.opens || 0, maxOpens)}%"></i>
      </div>`).join("")}
    </div>` : `<div class="analytics-empty"><strong>События появятся после первых открытий карточек</strong><p>Здесь будет рейтинг блюд по количеству просмотров.</p></div>`}
  </article>`;
}

function renderAnalyticsActivity(analytics, range) {
  const activeRange = range || "today";
  const drilldown = state.analyticsDrilldownDate && activeRange !== "today"
    ? analytics?.dayDetails?.[state.analyticsDrilldownDate]
    : null;

  if (drilldown) return renderDayDetail(drilldown, activeRange);
  if (activeRange === "today") return renderVisitsByHour(analytics?.visitsByHour || []);
  if (activeRange === "30d") return renderVisitsByWeek(analytics?.visitsByWeek || []);
  if (activeRange === "year") {
    return renderVisitsByMonth(analytics?.visitsByMonth || [], {
      totalVisits: getAnalyticsRangeValue(analytics?.menuVisits, "year"),
      totalUniqueGuests: getAnalyticsRangeValue(analytics?.uniqueGuests, "year"),
      totalDishOpens: getAnalyticsRangeValue(analytics?.dishOpens, "year"),
      busiestMonth: analytics?.allTimeSummary?.busiestMonth || "Нет данных",
    }, activeRange);
  }
  if (activeRange === "all") return renderVisitsByMonth(analytics?.visitsByMonth || [], analytics?.allTimeSummary || {}, activeRange);
  return renderVisitsByDay(analytics?.visitsByDay || []);
}

function renderDayDetail(detail, range) {
  return `<article class="analytics-card analytics-card--wide">
    <div class="analytics-card-head">
      <div><p class="kicker">Детализация</p><h2>Статистика за ${escapeHtml(detail.label || detail.date || "день")}</h2></div>
      <button class="secondary-button compact analytics-back-button" type="button" data-analytics-back="${range}">Назад к ${range === "30d" ? "месяцу" : "неделе"}</button>
    </div>
    ${renderHourChart(detail.hours || [])}
  </article>`;
}

function renderVisitsByHour(hours) {
  const normalized = hours.length ? hours : Array.from({ length: 24 }, (_, hour) => ({ hour, visits: 0 }));
  const max = Math.max(...normalized.map((entry) => entry.visits), 0);
  return `<article class="analytics-card analytics-card--wide">
    <div class="analytics-card-head"><div><p class="kicker">Активность</p><h2>Посещения по времени</h2></div></div>
    <div class="analytics-chart-shell">
      <div class="analytics-bars" aria-label="Посещения по часам">
        ${normalized.map((entry) => `<span style="--height:${max ? Math.max(8, Math.round((entry.visits / max) * 100)) : 8}%" title="${entry.hour}:00 - ${entry.visits}"></span>`).join("")}
      </div>
      <div class="analytics-time-axis" aria-hidden="true"><span>00:00</span><span>06:00</span><span>12:00</span><span>18:00</span><span>24:00</span></div>
      ${max ? "" : "<p>График появится после сбора статистики</p>"}
    </div>
  </article>`;
}

function renderHourChart(hours) {
  const normalized = normalizeHours(hours);
  const max = Math.max(...normalized.map((entry) => entry.visits), 0);
  return `<div class="analytics-chart-shell">
    <div class="analytics-bars" aria-label="Посещения по часам">
      ${normalized.map((entry) => `<span style="--height:${getChartFillPercent(entry.visits, max)}%" title="${formatHourRange(entry.hour)}&#10;${formatVisitCount(entry.visits)}" aria-label="${formatHourRange(entry.hour)}. ${formatVisitCount(entry.visits)}"></span>`).join("")}
    </div>
    <div class="analytics-period-axis" aria-hidden="true">
      <span>00:00–06:00</span>
      <span>06:00–12:00</span>
      <span>12:00–18:00</span>
      <span>18:00–24:00</span>
    </div>
    ${max ? "" : `<p class="analytics-period-note">Пока нет посещений за этот период.</p>`}
  </div>`;
}

function renderVisitsByHour(hours) {
  return `<article class="analytics-card analytics-card--wide">
    <div class="analytics-card-head"><div><p class="kicker">Сегодня</p><h2>Посещения по времени</h2></div></div>
    ${renderHourChart(hours)}
  </article>`;
}

function renderVisitsByDay(days) {
  const normalized = normalizeLastDays(days, 7);
  const max = Math.max(...normalized.map((entry) => entry.visits), 0);
  return `<article class="analytics-card analytics-card--wide">
    <div class="analytics-card-head"><div><p class="kicker">Неделя</p><h2>Посещения по дням недели</h2></div></div>
    <div class="analytics-chart-shell analytics-chart-shell--days">
      <div class="analytics-day-bars" style="--columns:${Math.max(1, normalized.length)}">
        ${normalized.map((entry) => `<button class="analytics-day-bar" type="button" data-analytics-day="${escapeHtml(entry.date)}" title="${escapeHtml(formatDateTooltip(entry))}&#10;${formatVisitCount(entry.visits)}" aria-label="${escapeHtml(formatDateTooltip(entry))}. ${formatVisitCount(entry.visits)}" style="--height:${getChartFillPercent(entry.visits, max)}%">
          <span></span><strong>${formatAnalyticsNumber(entry.visits)}</strong><em>${escapeHtml(formatShortDate(entry.date))}</em>
        </button>`).join("")}
      </div>
      ${max ? "" : `<p class="analytics-period-note">Пока нет посещений за этот период.</p>`}
    </div>
  </article>`;
}

function renderVisitsByWeek(weeks) {
  const normalizedWeeks = normalizeWeeks(weeks);
  const allDays = normalizedWeeks.flatMap((week) => week.days || []);
  const max = Math.max(...allDays.map((entry) => entry.visits), 0);
  return `<article class="analytics-card analytics-card--wide">
    <div class="analytics-card-head"><div><p class="kicker">Месяц</p><h2>Посещения по дням месяца</h2></div></div>
    <div class="analytics-weeks">
      ${normalizedWeeks.map((week) => `<section class="analytics-week">
        <h3>${escapeHtml(week.weekLabel)}</h3>
        <div class="analytics-week-days">
          ${(week.days || []).map((entry) => `<button class="analytics-week-day" type="button" data-analytics-day="${escapeHtml(entry.date)}" title="${escapeHtml(week.weekLabel)} / ${escapeHtml(formatDateTooltip(entry))}&#10;${formatVisitCount(entry.visits)}" aria-label="${escapeHtml(week.weekLabel)}. ${escapeHtml(formatDateTooltip(entry))}. ${formatVisitCount(entry.visits)}">
            <i style="--value:${getChartFillPercent(entry.visits, max)}%"></i>
            <span>${escapeHtml(formatShortDate(entry.date))}</span>
            <strong>${formatAnalyticsNumber(entry.visits)}</strong>
          </button>`).join("")}
        </div>
      </section>`).join("")}
    </div>
    ${max ? "" : `<p class="analytics-period-note">Пока нет посещений за этот период.</p>`}
  </article>`;
}

function renderVisitsByMonth(months, summary, range = "year") {
  const normalized = normalizeMonths(months);
  const max = Math.max(...normalized.map((entry) => entry.visits), 0);
  const title = range === "year" ? "Посещения за год" : "Посещения по месяцам";
  const kicker = range === "year" ? "Год" : "Все время";
  return `<article class="analytics-card analytics-card--wide">
    <div class="analytics-card-head"><div><p class="kicker">${kicker}</p><h2>${title}</h2></div></div>
    <div class="analytics-month-layout">
      <div class="analytics-chart-shell analytics-chart-shell--months">
        <div class="analytics-day-bars analytics-day-bars--months" style="--columns:${Math.max(1, normalized.length)}">
          ${normalized.map((entry) => `<div class="analytics-day-bar analytics-day-bar--static" title="${escapeHtml(entry.fullLabel || entry.label)}&#10;${formatVisitCount(entry.visits)}" style="--height:${getChartFillPercent(entry.visits, max)}%">
            <span></span><strong>${formatAnalyticsNumber(entry.visits)}</strong><em>${escapeHtml(entry.label)}</em>
          </div>`).join("")}
        </div>
        ${max ? "" : `<p class="analytics-period-note">Пока нет посещений за этот период.</p>`}
      </div>
      <div class="analytics-all-summary">
        <div><span>Всего посещений</span><strong>${formatAnalyticsNumber(summary.totalVisits || 0)}</strong></div>
        <div><span>Сессии</span><strong>${formatAnalyticsNumber(summary.totalUniqueGuests || 0)}</strong></div>
        <div><span>Открытия блюд</span><strong>${formatAnalyticsNumber(summary.totalDishOpens || 0)}</strong></div>
        <div><span>Самый активный месяц</span><strong>${escapeHtml(summary.busiestMonth || "Нет данных")}</strong></div>
      </div>
    </div>
  </article>`;
}

function renderAnalyticsBreakdown(kicker, title, rows, key, emptyText) {
  if (key === "device") return renderDeviceBreakdown(rows);

  return `<article class="analytics-card">
    <div class="analytics-card-head"><div><p class="kicker">${kicker}</p><h2>${title}</h2></div></div>
    ${rows.length ? `<div class="analytics-breakdown-list">
      ${rows.map((row) => `<div class="analytics-breakdown-row">
        <span>${escapeHtml(String(row[key] || "").toUpperCase())}</span>
        <div class="analytics-breakdown-value">
          <strong>${row.percent || 0}%</strong>
          <em>${formatAnalyticsNumber(row.count || 0)}</em>
        </div>
        <i style="--value:${row.percent || 0}%"></i>
      </div>`).join("")}
    </div>` : `<p class="analytics-muted">${emptyText}</p>`}
  </article>`;
}

function renderDeviceBreakdown(rows) {
  const byDevice = Object.fromEntries((rows || []).map((row) => [String(row.device || "").toLowerCase(), row]));
  const devices = [
    ["desktop", "Desktop"],
    ["mobile", "Mobile"],
    ["tablet", "Tablet"],
  ].map(([key, label]) => ({
    device: label,
    count: byDevice[key]?.count || 0,
    percent: byDevice[key]?.percent || 0,
  }));

  return `<article class="analytics-card analytics-card--compact">
    <div class="analytics-card-head"><div><p class="kicker">Устройства</p><h2>Устройства гостей</h2></div></div>
    <div class="analytics-breakdown-list analytics-breakdown-list--compact">
      ${devices.map((row) => `<div class="analytics-breakdown-row">
        <span>${escapeHtml(row.device)}</span>
        <div class="analytics-breakdown-value">
          <strong>${row.percent}%</strong>
          <em>${formatAnalyticsNumber(row.count)}</em>
        </div>
        <i style="--value:${row.percent}%"></i>
      </div>`).join("")}
    </div>
  </article>`;
}

function renderRecentEvents(events) {
  return `<article class="analytics-card analytics-card--span">
    <div class="analytics-card-head"><div><p class="kicker">Лента</p><h2>Последние действия</h2></div></div>
    ${events.length ? `<div class="analytics-event-list">
      ${events.slice(0, 10).map((event) => `<div class="analytics-event-row"><span>${escapeHtml(event.displayTime || formatEventTime(event.createdAt))}</span><strong>${escapeHtml(normalizeEventLabel(event.label || "Событие меню"))}</strong></div>`).join("")}
    </div>` : `<div class="analytics-empty analytics-empty--compact"><strong>Действий пока нет</strong><p>Список появится после подключения событий меню.</p></div>`}
  </article>`;
}

function renderPopularDishesToday(items) {
  const maxOpens = Math.max(...items.map((item) => item.opens || 0), 0);
  return `<article class="analytics-card analytics-card--span">
    <div class="analytics-card-head"><div><p class="kicker">Сегодня</p><h2>Самые популярные блюда сегодня</h2></div></div>
    ${items.length ? `<div class="analytics-ranked-list analytics-ranked-list--compact">
      ${items.slice(0, 5).map((item, index) => `<div class="analytics-ranked-row">
        <span>${index + 1}</span>
        <strong>${escapeHtml(item.title || "Блюдо")}</strong>
        <em>${formatAnalyticsNumber(item.opens || 0)} ${pluralizeOpen(item.opens || 0)}</em>
        <i style="--value:${getChartFillPercent(item.opens || 0, maxOpens)}%"></i>
      </div>`).join("")}
    </div>` : `<div class="analytics-empty analytics-empty--compact"><strong>Сегодня ещё нет данных</strong><p>Топ появится после открытий карточек блюд за сегодняшний день.</p></div>`}
  </article>`;
}

function normalizeEventLabel(label = "") {
  return String(label || "");
}

function getAnalyticsRangeLabel(range = "7d") {
  if (range === "today") return "сегодня";
  if (range === "30d") return "за месяц";
  if (range === "year") return "за год";
  if (range === "all") return "за все время";
  return "за неделю";
}

function formatAnalyticsNumber(value) {
  if (value === null || value === undefined) return "0";
  return new Intl.NumberFormat("ru-RU").format(Number(value || 0));
}

function normalizeHours(hours) {
  const byHour = Object.fromEntries((hours || []).map((entry) => [Number(entry.hour), Number(entry.visits || 0)]));
  return Array.from({ length: 24 }, (_, hour) => ({
    hour,
    visits: byHour[hour] || 0,
  }));
}

function normalizeLastDays(days, count) {
  const byDate = Object.fromEntries((days || []).filter((entry) => entry.date).map((entry) => [entry.date, entry]));
  const endKey = getAlmatyDateKey();
  const startKey = shiftDateKeyClient(endKey, -(count - 1));
  return Array.from({ length: count }, (_, index) => {
    const date = shiftDateKeyClient(startKey, index);
    const existing = byDate[date] || {};
    return {
      date,
      label: existing.label || getWeekdayLabel(date),
      fullLabel: existing.fullLabel || formatDateLabelClient(date),
      shortLabel: existing.shortLabel || date.slice(8, 10),
      visits: Number(existing.visits || 0),
      isToday: date === endKey,
    };
  });
}

function normalizeWeeks(weeks) {
  const sourceDays = (weeks || []).flatMap((week) => week.days || []);
  const days = normalizeLastDays(sourceDays, 30);
  const normalizedWeeks = [];
  for (let index = 0; index < days.length; index += 7) {
    normalizedWeeks.push({
      weekLabel: index + 7 >= days.length ? "Остаток" : `Неделя ${normalizedWeeks.length + 1}`,
      days: days.slice(index, index + 7),
    });
  }
  return normalizedWeeks;
}

function normalizeMonths(months) {
  const labels = ["Янв", "Фев", "Мар", "Апр", "Май", "Июн", "Июл", "Авг", "Сен", "Окт", "Ноя", "Дек"];
  const fullLabels = ["Январь", "Февраль", "Март", "Апрель", "Май", "Июнь", "Июль", "Август", "Сентябрь", "Октябрь", "Ноябрь", "Декабрь"];
  const byMonth = Object.fromEntries((months || []).map((entry) => [Number(entry.month), entry]));
  return labels.map((label, index) => {
    const month = index + 1;
    const existing = byMonth[month] || {};
    return {
      month,
      label: existing.label || label,
      fullLabel: existing.fullLabel || fullLabels[index],
      visits: Number(existing.visits || 0),
    };
  });
}

function getChartFillPercent(value, max) {
  const numericValue = Number(value || 0);
  const numericMax = Number(max || 0);
  if (!numericValue || !numericMax) return 0;
  const scale = numericMax <= 2 ? 0.42 : numericMax <= 5 ? 0.64 : 1;
  return Math.max(6, Math.round((numericValue / numericMax) * 100 * scale));
}

function pluralizeOpen(value) {
  const number = Math.abs(Number(value || 0));
  const mod10 = number % 10;
  const mod100 = number % 100;
  if (mod10 === 1 && mod100 !== 11) return "открытие";
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) return "открытия";
  return "открытий";
}

function formatEventTime(value) {
  if (!value) return "";
  return new Date(value).toLocaleTimeString("ru-RU", { timeZone: "Asia/Almaty", hour: "2-digit", minute: "2-digit" });
}

function getAlmatyDateKey(value = new Date()) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Almaty",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(value);
  const map = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  return `${map.year}-${map.month}-${map.day}`;
}

function shiftDateKeyClient(dateKey, offsetDays) {
  const [year, month, day] = String(dateKey).split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1, day + offsetDays));
  return date.toISOString().slice(0, 10);
}

function getWeekdayLabel(dateKey) {
  const [year, month, day] = String(dateKey).split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  return ["Вс", "Пн", "Вт", "Ср", "Чт", "Пт", "Сб"][date.getUTCDay()];
}

function formatDateLabelClient(dateKey) {
  const [year, month, day] = String(dateKey).split("-").map(Number);
  return new Intl.DateTimeFormat("ru-RU", { day: "2-digit", month: "long", timeZone: "UTC" }).format(new Date(Date.UTC(year, month - 1, day)));
}

function formatHourRange(hour) {
  const current = String(Number(hour || 0)).padStart(2, "0");
  const next = String((Number(hour || 0) + 1) % 24).padStart(2, "0");
  return `${current}:00–${next}:00`;
}

function formatDateTooltip(entry = {}) {
  const shortDate = formatShortDate(entry.date);
  const weekday = entry.label || getWeekdayLabel(entry.date);
  return weekday ? `${shortDate}, ${weekday}` : shortDate;
}

function formatShortDate(dateKey = "") {
  const [, month, day] = String(dateKey).split("-");
  if (!month || !day) return String(dateKey || "");
  return `${day}.${month}`;
}

function formatVisitCount(count) {
  const value = Number(count || 0);
  const mod10 = value % 10;
  const mod100 = value % 100;
  if (mod10 === 1 && mod100 !== 11) return `${formatAnalyticsNumber(value)} посещение`;
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) return `${formatAnalyticsNumber(value)} посещения`;
  return `${formatAnalyticsNumber(value)} посещений`;
}

function visual(item) {
  return item.image ? `<img src="${escapeHtml(item.image)}" alt="" />` : `<div class="dish-placeholder">${escapeHtml((getItemDisplayName(item) || "?").charAt(0))}</div>`;
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
  const category = state.categories.find((entry) => entry.id === id);
  return getCategoryDisplayName(category);
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
  const analyticsRange = event.target.closest("[data-analytics-range]")?.dataset.analyticsRange;
  const analyticsDay = event.target.closest("[data-analytics-day]")?.dataset.analyticsDay;
  const analyticsBack = event.target.closest("[data-analytics-back]")?.dataset.analyticsBack;

  if (nav) navigate(nav.dataset.nav);
  if (analyticsRange) {
    state.analyticsRange = analyticsRange;
    state.analyticsDrilldownDate = "";
    state.analytics = null;
    loadAnalytics(true);
  }
  if (analyticsDay) {
    state.analyticsDrilldownDate = analyticsDay;
    renderAnalytics();
  }
  if (analyticsBack) {
    state.analyticsDrilldownDate = "";
    renderAnalytics();
  }
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

function showLoginError(message) {
  el.loginError.textContent = toFriendlyError(message);
}

function renderMetrics() {
  const dishItems = getDishItems();
  const active = dishItems.filter((item) => item.is_active && !item.is_stoplisted && !isTemporarilyUnavailable(item)).length;
  const stopped = dishItems.filter((item) => item.is_stoplisted || isTemporarilyUnavailable(item)).length;
  const needsAttention = dishItems.filter((item) => !item.image || hasMissingTranslation(item) || item.is_stoplisted || isTemporarilyUnavailable(item)).length;
  const values = [
    ["Всего блюд", dishItems.length],
    ["В продаже", active],
    ["Стоп-лист", stopped],
    ["Требует внимания", needsAttention],
  ];
  el.metrics.innerHTML = values.map(([label, value]) => `<article class="metric-card"><span>${label}</span><strong>${value}</strong></article>`).join("");
}

function renderAttention() {
  const dishItems = getDishItems();
  const issues = [
    { name: "Нет фото", count: dishItems.filter((item) => !item.image).length, view: "menu", type: "issue" },
    { name: "Нет перевода", count: dishItems.filter((item) => hasMissingTranslation(item)).length, view: "menu", type: "issue" },
    { name: "Стоп-лист", count: dishItems.filter((item) => item.is_stoplisted || isTemporarilyUnavailable(item)).length, view: "stoplist", type: "neutral" },
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

async function adminApi(action, payload = {}) {
  const requestPayload = {
    action,
    restaurantSlug: getRestaurantSlug(),
    sessionToken: state.sessionToken,
    ...payload,
  };

  let response;
  try {
    response = await fetch(ADMIN_API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(requestPayload),
    });
  } catch (error) {
    console.error("[exort-admin] API request failed.", {
      action,
      url: ADMIN_API_URL,
      method: "POST",
      error: error?.message || String(error),
      payload: requestPayload,
    });
    throw new Error("Сервис временно недоступен. Попробуйте обновить страницу или обратитесь в поддержку Exort.");
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

function renderDishPreview() {
  if (!el.dishPreview || !el.itemForm) return;

  const item = getEditorPreviewItem();
  const previewLang = item.previewLang || "ru";
  const statusType = item.is_stoplisted ? "danger" : "success";
  const statusText = item.is_stoplisted ? "Временно недоступно" : "В продаже";
  const badges = [
    { label: statusText, type: statusType },
    ...(item.missingPhoto ? [{ label: "Нет фото", type: "warning" }] : []),
    ...(item.missingTranslation ? [{ label: "Нет перевода", type: "attention" }] : []),
  ];

  el.dishPreview.innerHTML = `
    <div class="preview-header">
      <div class="preview-kicker">Предпросмотр</div>
      <div class="preview-lang-switch" aria-label="Язык превью">
        ${["ru", "en", "kz"].map((lang) => `
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
  setEditorLanguage("ru");
  resetEditorTranslationMeta();
  el.drawerTitle.textContent = item ? "Редактирование блюда" : "Новое блюдо";
  el.deleteItem.hidden = !item;
  el.drawer.setAttribute("aria-hidden", "false");
  state.dirty = false;
  renderDishPreview();
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

  await flushPendingAutoTranslateBeforeSave();

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
    old_price: String(data.old_price || "").trim() ? Number(data.old_price) : null,
    weight: String(data.weight || "").trim(),
    calories: String(data.calories || "").trim() ? Number(data.calories) : null,
    spice_level: String(data.spice_level || "").trim(),
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
Object.assign(viewMeta, {
  overview: ["Обзор", "Рабочее пространство"],
  menu: ["Меню", "Управление блюдами"],
  categories: ["Категории", "Структура меню"],
  stoplist: ["Стоп-лист", "Быстрая доступность"],
  analytics: ["Аналитика", "Поведение гостей и эффективность меню"],
});

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
  el.itemForm.elements.category_id.value = item?.category_id || state.categories[0]?.id || "";
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

(() => {
  if (window.__rkeeperTestAdminFinalPatch) return;
  window.__rkeeperTestAdminFinalPatch = true;

  const syncUrl = "/api/rkeeper-test-sync";
  const ui = () => ({
    list: document.querySelector("[data-rkeeper-status-list]"),
    note: document.querySelector("[data-rkeeper-status-note]"),
    button: document.querySelector("[data-rkeeper-sync-button]"),
    priceHint: document.querySelector("[data-rkeeper-price-hint]"),
  });

  function applyReadonlyPrice() {
    const input = el.itemForm?.elements?.price;
    if (!input) return;
    input.disabled = true;
    input.readOnly = true;
    input.placeholder = "���� �� r_keeper";
    if (ui().priceHint) ui().priceHint.textContent = "���� �� r_keeper";
  }

  function renderStatus(status = {}) {
    const nodes = ui();
    if (!nodes.list || !nodes.note) return;
    const rows = [
      ["������ �����������", status.connectionStatus || "�� ���������"],
      ["��������� �������������", status.lastSyncAt || "��� �� �����������"],
      ["�������� ����", status.receivedItems ?? 0],
      ["��������� ����", status.updatedItems ?? 0],
      ["��������� ������", status.lastError || "���"],
    ];
    nodes.list.innerHTML = rows.map(([label, value]) => `<div class="attention-item"><strong>${escapeHtml(label)}</strong><span>${escapeHtml(String(value))}</span></div>`).join("");
    nodes.note.textContent = status.lastMessage || "�������� ������ �������� ������ � ���������� rkeeper-test.";
  }

  const previousBuildPayload = buildOptionalItemPayload;
  buildOptionalItemPayload = function buildOptionalRkeeperPayload(data, existing) {
    const payload = previousBuildPayload(data, existing);
    delete payload.price;
    payload.rkeeper_readonly_price = true;
    return payload;
  };

  const previousOpenDrawer = openItemDrawer;
  openItemDrawer = function openRkeeperDrawer(id = "") {
    previousOpenDrawer(id);
    applyReadonlyPrice();
  };

  async function refreshStatus() {
    const response = await fetch(`${syncUrl}?restaurant=${encodeURIComponent(getRestaurantSlug())}`, {
      headers: { Authorization: `Bearer ${state.sessionToken}` },
    });
    const payload = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(payload.error || "�� ������� �������� ������ r_keeper.");
    renderStatus(payload.status || {});
  }

  async function syncNow() {
    const nodes = ui();
    if (nodes.button) nodes.button.disabled = true;
    try {
      const response = await fetch(syncUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${state.sessionToken}`,
        },
        body: JSON.stringify({ restaurantSlug: getRestaurantSlug() }),
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(payload.error || "�� ������� ��������� sync.");
      renderStatus(payload.status || {});
      if (Array.isArray(payload.items)) {
        state.items = payload.items.map(normalizeItem);
        renderAll();
      }
      toast("�������� ������������� r_keeper ���������", "success");
    } catch (error) {
      toast(toFriendlyError(error.message) || "������ ������������� r_keeper", "danger");
    } finally {
      if (nodes.button) nodes.button.disabled = false;
    }
  }

  const previousLoadData = loadAdminData;
  loadAdminData = async function loadAdminDataRkeeper() {
    await previousLoadData();
    const nodes = ui();
    if (nodes.button && nodes.button.dataset.bound !== "true") {
      nodes.button.dataset.bound = "true";
      nodes.button.addEventListener("click", syncNow);
    }
    applyReadonlyPrice();
    await refreshStatus().catch((error) => {
      renderStatus({
        connectionStatus: "������",
        lastError: error.message,
        lastMessage: "�� ������� �������� ������ �������� ���������� r_keeper.",
      });
    });
  };

  state.restaurant.slug = DEFAULT_RESTAURANT_SLUG;
  state.restaurant.name = "r_keeper Test Restaurant";
  setTimeout(applyReadonlyPrice, 0);
})();
