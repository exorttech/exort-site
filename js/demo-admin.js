const DEMO_PIN = "1234";
const restaurantSlug = "exort-demo";
const storageKey = "exort-demo:linked-menu";
const legacyStorageKey = "exort-admin-demo:exort-demo";
const sessionKey = "exort-demo:admin-session";

const seed = {
  schemaVersion: 2,
  restaurant: {
    slug: restaurantSlug,
    name: "Exort Demo Restaurant",
    city: "Almaty",
    brand: "#2563eb",
  },
  categories: [
    { id: "popular", name: "Популярное", active: true, sort: 10 },
    { id: "breakfast", name: "Завтраки", active: true, sort: 20 },
    { id: "mains", name: "Горячее", active: true, sort: 30 },
    { id: "salads", name: "Салаты", active: true, sort: 40 },
    { id: "drinks", name: "Напитки", active: true, sort: 50 },
    { id: "desserts", name: "Десерты", active: true, sort: 60 },
  ],
  items: [
    {
      id: "margherita", category_id: "popular", name_ru: "Маргарита", name_kz: "", name_en: "",
      description_ru: "Томаты, моцарелла, базилик, фирменный томатный соус", description_kz: "", description_en: "",
      price: 3200, is_active: true, in_stock: true, sort_order: 10, version: 1,
      image: "https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?auto=format&fit=crop&w=900&q=84",
    },
    {
      id: "vegetable-bowl", category_id: "popular", name_ru: "Боул с овощами", name_kz: "", name_en: "",
      description_ru: "Киноа, авокадо, свежая зелень, томаты черри, цитрусовый соус", description_kz: "", description_en: "",
      price: 2800, is_active: true, in_stock: true, sort_order: 20, version: 1,
      image: "https://images.unsplash.com/photo-1540189549336-e6e99c3679fe?auto=format&fit=crop&w=900&q=84",
    },
    {
      id: "flat-white", category_id: "breakfast", name_ru: "Флэт уайт", name_kz: "", name_en: "",
      description_ru: "Эспрессо, молоко, плотная кремовая текстура", description_kz: "", description_en: "",
      price: 1400, is_active: true, in_stock: false, sort_order: 10, version: 1,
      image: "https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?auto=format&fit=crop&w=900&q=84",
    },
    {
      id: "syrniki", category_id: "breakfast", name_ru: "Сырники с ягодами", name_kz: "", name_en: "",
      description_ru: "Творожные сырники, сметанный крем, сезонные ягоды", description_kz: "", description_en: "",
      price: 2600, is_active: true, in_stock: true, sort_order: 20, version: 1,
      image: "https://images.unsplash.com/photo-1528207776546-365bb710ee93?auto=format&fit=crop&w=900&q=84",
    },
    {
      id: "pepper-steak", category_id: "mains", name_ru: "Стейк с перечным соусом", name_kz: "", name_en: "",
      description_ru: "Говядина, картофельный крем, перечный соус, микс зелени", description_kz: "", description_en: "",
      price: 6900, is_active: true, in_stock: true, sort_order: 10, version: 1,
      image: "https://images.unsplash.com/photo-1546833999-b9f581a1996d?auto=format&fit=crop&w=900&q=84",
    },
    {
      id: "chicken-caesar", category_id: "salads", name_ru: "Цезарь с курицей", name_kz: "", name_en: "",
      description_ru: "Романо, куриное филе, пармезан, сухари, соус цезарь", description_kz: "", description_en: "",
      price: 3100, is_active: true, in_stock: true, sort_order: 10, version: 1,
      image: "https://images.unsplash.com/photo-1550304943-4f24f54ddde9?auto=format&fit=crop&w=900&q=84",
    },
    {
      id: "passion-lemonade", category_id: "drinks", name_ru: "Лимонад маракуйя", name_kz: "", name_en: "",
      description_ru: "Маракуйя, цитрус, содовая, свежая мята", description_kz: "", description_en: "",
      price: 1800, is_active: true, in_stock: true, sort_order: 10, version: 1,
      image: "https://images.unsplash.com/photo-1621263764928-df1444c5e859?auto=format&fit=crop&w=900&q=84",
    },
    {
      id: "chocolate-fondant", category_id: "desserts", name_ru: "Шоколадный фондан", name_kz: "", name_en: "",
      description_ru: "Теплый шоколадный кекс, жидкий центр, ванильное мороженое", description_kz: "", description_en: "",
      price: 2400, is_active: true, in_stock: true, sort_order: 10, version: 1,
      image: "https://images.unsplash.com/photo-1606313564200-e75d5e30476c?auto=format&fit=crop&w=900&q=84",
    },
  ],
};

let state = loadState();
let activeView = "overview";
let dirty = false;
let pendingConfirm = null;

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

function loadState() {
  try {
    const stored = localStorage.getItem(storageKey) || localStorage.getItem(legacyStorageKey);
    const parsed = stored ? JSON.parse(stored) : null;
    const initialState = parsed?.schemaVersion === seed.schemaVersion ? parsed : structuredClone(seed);
    localStorage.setItem(storageKey, JSON.stringify(initialState));
    return initialState;
  } catch {
    return structuredClone(seed);
  }
}

function saveState(message = "") {
  localStorage.setItem(storageKey, JSON.stringify(state));
  dirty = false;
  if (message) toast(message, "success");
  renderAll();
}

function escapeHtml(value) {
  return String(value ?? "").replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;").replaceAll("'", "&#039;");
}

function formatPrice(value) {
  return `${new Intl.NumberFormat("ru-KZ").format(Number(value) || 0)} ₸`;
}

function categoryName(id) {
  return state.categories.find(category => category.id === id)?.name || "Без категории";
}

function syncRestaurantIdentity() {
  el.restaurantNames.forEach(node => node.textContent = state.restaurant.name);
  el.restaurantInitials.forEach(node => node.textContent = state.restaurant.name.charAt(0).toUpperCase());
  document.documentElement.style.setProperty("--brand", state.restaurant.brand || "#2563eb");
  document.querySelectorAll("[data-menu-link]").forEach(link => {
    link.href = "/menu-demo";
  });
}

async function verifyPin(pin) {
  return pin === DEMO_PIN;
}

function openApp() {
  sessionStorage.setItem(sessionKey, "active");
  el.login.hidden = true;
  el.app.hidden = false;
  syncRestaurantIdentity();
  renderAll();
}

function logout() {
  const run = () => {
    sessionStorage.removeItem(sessionKey);
    el.app.hidden = true;
    el.login.hidden = false;
    el.pinInput.value = "";
  };
  dirty ? confirmAction("Выйти без сохранения?", "Несохранённые изменения будут потеряны.", run) : run();
}

function navigate(view) {
  if (!viewMeta[view]) return;
  activeView = view;
  document.querySelectorAll("[data-view]").forEach(node => node.classList.toggle("is-active", node.dataset.view === view));
  document.querySelectorAll("[data-nav]").forEach(node => {
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
  const active = state.items.filter(item => item.is_active && item.in_stock).length;
  const stopped = state.items.filter(item => !item.in_stock).length;
  const values = [["Всего блюд", state.items.length, "В каталоге"], ["Активные блюда", active, "Доступны гостям"], ["В стоп-листе", stopped, "Скрыты из продажи"], ["Категории", state.categories.length, "Разделов меню"]];
  el.metrics.innerHTML = values.map(([label, value, note]) => `<article class="metric-card"><span>${label}</span><strong>${value}</strong><small>${note}</small></article>`).join("");
}

function renderAttention() {
  const issues = [
    ["Нет фото", state.items.filter(item => !item.image).length, "photos"],
    ["Нет перевода", state.items.filter(item => !item.name_kz || !item.name_en).length, "menu"],
    ["Неактивные позиции", state.items.filter(item => !item.is_active).length, "menu"],
  ];
  el.attentionCount.textContent = `${issues.reduce((sum, issue) => sum + issue[1], 0)} замечаний`;
  el.attentionList.innerHTML = issues.map(([name, count, view]) => `<button class="attention-item" type="button" data-attention-view="${view}"><i></i><strong>${name}</strong><span>${count} поз.</span></button>`).join("");
}

function renderFilters() {
  const selected = el.categoryFilter.value || "all";
  el.categoryFilter.innerHTML = `<option value="all">Все категории</option>${state.categories.map(c => `<option value="${c.id}">${escapeHtml(c.name)}</option>`).join("")}`;
  el.categoryFilter.value = [...el.categoryFilter.options].some(option => option.value === selected) ? selected : "all";
  el.itemForm.elements.category_id.innerHTML = state.categories.map(c => `<option value="${c.id}">${escapeHtml(c.name)}</option>`).join("");
}

function filteredItems() {
  const query = el.menuSearch.value.trim().toLowerCase();
  const category = el.categoryFilter.value || "all";
  const status = el.statusFilter.value || "all";
  return state.items.filter(item => {
    const matchesQuery = !query || [item.name_ru, item.name_kz, item.name_en].join(" ").toLowerCase().includes(query);
    const matchesCategory = category === "all" || item.category_id === category;
    const matchesStatus = status === "all" || (status === "active" && item.is_active && item.in_stock) || (status === "stop" && !item.in_stock) || (status === "inactive" && !item.is_active);
    return matchesQuery && matchesCategory && matchesStatus;
  });
}

function visual(item, small = false) {
  return item.image ? `<img src="${escapeHtml(item.image)}" alt="" />` : `<div class="dish-placeholder">${escapeHtml(item.name_ru.charAt(0))}</div>`;
}

function status(item) {
  if (!item.is_active) return ["inactive", "неактивно"];
  if (!item.in_stock) return ["stop", "стоп"];
  return ["active", "в продаже"];
}

function renderDishes() {
  const items = filteredItems();
  el.dishGrid.innerHTML = items.length ? items.map(item => {
    const [statusClass, statusText] = status(item);
    return `<article class="dish-card"><div class="dish-visual">${visual(item)}<span class="dish-status ${statusClass}">${statusText}</span></div><div class="dish-body"><div class="dish-title-row"><h3>${escapeHtml(item.name_ru)}</h3><button type="button" data-edit-item="${item.id}">Изменить</button></div><div class="dish-meta"><span>${escapeHtml(categoryName(item.category_id))}</span><button class="stop-switch ${item.in_stock ? "is-on" : ""}" type="button" data-toggle-stock="${item.id}" aria-label="Изменить стоп-лист"></button></div><div class="dish-price">${formatPrice(item.price)}</div></div></article>`;
  }).join("") : `<div class="empty-state"><h2>Ничего не найдено</h2><p>Измените фильтр или добавьте новое блюдо.</p></div>`;
}

function renderCategories() {
  el.categoryList.innerHTML = [...state.categories].sort((a,b) => a.sort-b.sort).map((category, index) => {
    const count = state.items.filter(item => item.category_id === category.id).length;
    return `<article class="category-row"><span class="drag-handle">⋮⋮</span><div><strong>${escapeHtml(category.name)}</strong><small>${count} блюд</small></div><button class="stop-switch ${category.active ? "is-on" : ""}" type="button" data-toggle-category="${category.id}" aria-label="Активность категории"></button><div class="row-actions"><button type="button" data-move-category="${category.id}" data-direction="-1">↑</button><button type="button" data-move-category="${category.id}" data-direction="1">↓</button><button type="button" data-edit-category="${category.id}">Изменить</button></div></article>`;
  }).join("");
}

function renderStopList() {
  el.stopList.innerHTML = state.items.map(item => `<article class="stop-row"><div class="dish-placeholder">${escapeHtml(item.name_ru.charAt(0))}</div><div><strong>${escapeHtml(item.name_ru)}</strong><small>${escapeHtml(categoryName(item.category_id))} · ${formatPrice(item.price)}</small></div><span class="stop-state ${item.in_stock ? "is-sale" : ""}">${item.in_stock ? "В продаже" : "Стоп"}</span><button class="large-switch ${item.in_stock ? "is-on" : ""}" type="button" data-toggle-stock="${item.id}" aria-label="Изменить доступность"></button></article>`).join("");
}

function renderPhotos() {
  const noPhoto = state.items.filter(item => !item.image);
  el.photoGrid.innerHTML = noPhoto.length ? noPhoto.map(item => `<article class="photo-card"><div>${visual(item)}</div><footer><strong>${escapeHtml(item.name_ru)}</strong><span>Нет фотографии</span></footer></article>`).join("") : `<div class="empty-state"><h2>Все блюда с фото</h2><p>Медиатека заполнена.</p></div>`;
}

function openItemDrawer(id = "") {
  const item = state.items.find(entry => entry.id === id);
  el.itemForm.reset();
  el.itemForm.elements.id.value = item?.id || "";
  el.itemForm.elements.name_ru.value = item?.name_ru || "";
  el.itemForm.elements.name_kz.value = item?.name_kz || "";
  el.itemForm.elements.name_en.value = item?.name_en || "";
  el.itemForm.elements.description_ru.value = item?.description_ru || "";
  el.itemForm.elements.description_kz.value = item?.description_kz || "";
  el.itemForm.elements.description_en.value = item?.description_en || "";
  el.itemForm.elements.price.value = item?.price || "";
  el.itemForm.elements.category_id.value = item?.category_id || state.categories[0]?.id || "";
  el.itemForm.elements.sort_order.value = item?.sort_order || 10;
  el.itemForm.elements.is_active.checked = item?.is_active ?? true;
  el.itemForm.dataset.image = item?.image || "";
  el.editorImage.innerHTML = item?.image ? `<img src="${escapeHtml(item.image)}" alt="" />` : "Фото";
  el.drawerTitle.textContent = item ? "Редактирование блюда" : "Новое блюдо";
  el.deleteItem.hidden = !item;
  el.drawer.setAttribute("aria-hidden", "false");
  dirty = false;
}

function closeDrawer(force = false) {
  if (dirty && !force) return confirmAction("Закрыть без сохранения?", "Изменения в карточке блюда будут потеряны.", () => closeDrawer(true));
  el.drawer.setAttribute("aria-hidden", "true");
  dirty = false;
}

function toggleStock(id) {
  const item = state.items.find(entry => entry.id === id);
  if (!item) return;
  item.in_stock = !item.in_stock;
  item.version += 1;
  saveState(item.in_stock ? "Блюдо возвращено в продажу" : "Блюдо добавлено в стоп-лист");
}

function addCategory() {
  el.categoryForm.reset();
  el.categoryForm.elements.id.value = "";
  el.categoryDialogTitle.textContent = "Новая категория";
  el.categoryDialog.showModal();
  el.categoryForm.elements.name.focus();
}

function editCategory(id) {
  const category = state.categories.find(entry => entry.id === id);
  if (!category) return;
  el.categoryForm.elements.id.value = category.id;
  el.categoryForm.elements.name.value = category.name;
  el.categoryDialogTitle.textContent = "Редактирование категории";
  el.categoryDialog.showModal();
  el.categoryForm.elements.name.focus();
}

function moveCategory(id, direction) {
  const sorted = [...state.categories].sort((a,b) => a.sort-b.sort);
  const index = sorted.findIndex(c => c.id === id);
  const target = sorted[index + direction];
  if (!target) return;
  [sorted[index].sort, target.sort] = [target.sort, sorted[index].sort];
  saveState("Порядок категорий обновлён");
}

function confirmAction(title, text, action) {
  pendingConfirm = action;
  el.confirmTitle.textContent = title;
  el.confirmText.textContent = text;
  el.confirmDialog.showModal();
}

function toast(message, type = "") {
  const node = document.createElement("div");
  node.className = `toast ${type}`;
  node.textContent = message;
  el.toasts.append(node);
  setTimeout(() => node.remove(), 2600);
}

function readImage(file, callback) {
  if (!file || file.size > 10 * 1024 * 1024) return toast("Файл больше 10 МБ", "danger");
  const reader = new FileReader();
  reader.onload = () => callback(reader.result);
  reader.readAsDataURL(file);
}

el.pinForm.addEventListener("submit", async event => {
  event.preventDefault();
  el.loginError.textContent = "";
  el.loginLabel.textContent = "Проверяем...";
  const valid = await verifyPin(el.pinInput.value.trim());
  el.loginLabel.textContent = "Войти";
  valid ? openApp() : el.loginError.textContent = "Неверный PIN. Для demo используйте 1234.";
});

el.pinVisibility.addEventListener("click", () => {
  el.pinInput.type = el.pinInput.type === "password" ? "text" : "password";
  el.pinVisibility.textContent = el.pinInput.type === "password" ? "Показать" : "Скрыть";
});

document.addEventListener("click", event => {
  const nav = event.target.closest("[data-nav]");
  const action = event.target.closest("[data-action]")?.dataset.action;
  const stock = event.target.closest("[data-toggle-stock]")?.dataset.toggleStock;
  const edit = event.target.closest("[data-edit-item]")?.dataset.editItem;
  const attention = event.target.closest("[data-attention-view]")?.dataset.attentionView;
  if (nav) navigate(nav.dataset.nav);
  if (action === "add-item") openItemDrawer();
  if (action === "add-category") addCategory();
  if (stock) toggleStock(stock);
  if (edit) openItemDrawer(edit);
  if (attention) navigate(attention);
  if (event.target.closest("[data-logout]")) logout();
  if (event.target.closest("[data-close-drawer]")) closeDrawer();
  const toggleCategory = event.target.closest("[data-toggle-category]")?.dataset.toggleCategory;
  if (toggleCategory) {
    const category = state.categories.find(entry => entry.id === toggleCategory);
    category.active = !category.active;
    saveState("Статус категории обновлён");
  }
  const editCat = event.target.closest("[data-edit-category]")?.dataset.editCategory;
  if (editCat) editCategory(editCat);
  const move = event.target.closest("[data-move-category]");
  if (move) moveCategory(move.dataset.moveCategory, Number(move.dataset.direction));
});

[el.menuSearch, el.categoryFilter, el.statusFilter].forEach(control => control.addEventListener("input", renderDishes));
el.itemForm.addEventListener("input", () => dirty = true);
el.itemForm.addEventListener("submit", event => {
  event.preventDefault();
  const data = Object.fromEntries(new FormData(el.itemForm));
  const existing = state.items.find(entry => entry.id === data.id);
  const payload = {
    ...(existing || {}),
    id: existing?.id || `item-${Date.now()}`, category_id: data.category_id, name_ru: data.name_ru.trim(),
    name_kz: data.name_kz.trim(), name_en: data.name_en.trim(), description_ru: data.description_ru.trim(),
    description_kz: data.description_kz.trim(), description_en: data.description_en.trim(), price: Number(data.price),
    sort_order: Number(data.sort_order) || 0, is_active: el.itemForm.elements.is_active.checked,
    in_stock: existing?.in_stock ?? true, image: el.itemForm.dataset.image || "", version: (existing?.version || 0) + 1,
  };
  existing ? Object.assign(existing, payload) : state.items.push(payload);
  dirty = false;
  saveState(existing ? "Блюдо обновлено" : "Блюдо добавлено");
  closeDrawer(true);
});

el.deleteItem.addEventListener("click", () => {
  const id = el.itemForm.elements.id.value;
  confirmAction("Удалить блюдо?", "Это действие нельзя отменить.", () => {
    state.items = state.items.filter(item => item.id !== id);
    dirty = false;
    saveState("Блюдо удалено");
    closeDrawer(true);
  });
});

document.querySelectorAll("[data-lang-tab]").forEach(tab => tab.addEventListener("click", () => {
  document.querySelectorAll("[data-lang-tab]").forEach(node => node.classList.toggle("is-active", node === tab));
  document.querySelectorAll("[data-lang-pane]").forEach(node => node.classList.toggle("is-active", node.dataset.langPane === tab.dataset.langTab));
}));

el.editorFile.addEventListener("change", () => readImage(el.editorFile.files[0], source => {
  el.itemForm.dataset.image = source;
  el.editorImage.innerHTML = `<img src="${source}" alt="" />`;
  dirty = true;
}));

function handleUploads(files) {
  [...files].slice(0, 5).forEach((file, index) => readImage(file, source => {
    const target = state.items.filter(item => !item.image)[index];
    if (target) target.image = source;
    saveState(target ? `Фото добавлено: ${target.name_ru}` : "Фотография загружена");
  }));
}
el.photoInput.addEventListener("change", () => handleUploads(el.photoInput.files));
["dragenter", "dragover"].forEach(type => el.uploadZone.addEventListener(type, event => { event.preventDefault(); el.uploadZone.classList.add("is-dragging"); }));
["dragleave", "drop"].forEach(type => el.uploadZone.addEventListener(type, event => { event.preventDefault(); el.uploadZone.classList.remove("is-dragging"); }));
el.uploadZone.addEventListener("drop", event => handleUploads(event.dataTransfer.files));

el.confirmDialog.addEventListener("close", () => {
  if (el.confirmDialog.returnValue === "confirm") pendingConfirm?.();
  pendingConfirm = null;
});
el.categoryForm.addEventListener("submit", event => {
  event.preventDefault();
  const id = el.categoryForm.elements.id.value;
  const name = el.categoryForm.elements.name.value.trim();
  if (!name) return;
  const category = state.categories.find(entry => entry.id === id);
  if (category) category.name = name;
  else state.categories.push({ id: `category-${Date.now()}`, name, active: true, sort: (state.categories.length + 1) * 10 });
  el.categoryDialog.close();
  saveState(category ? "Категория обновлена" : "Категория добавлена");
  navigate("categories");
});
document.querySelector("[data-close-category]").addEventListener("click", () => el.categoryDialog.close());
window.addEventListener("beforeunload", event => {
  if (!dirty) return;
  event.preventDefault();
  event.returnValue = "";
});

syncRestaurantIdentity();
if (sessionStorage.getItem(sessionKey) === "active") openApp();
navigate(location.hash.slice(1) || "overview");
