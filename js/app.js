const mockSupabaseResponse = {
  restaurant: {
    name: "Меню сегодня",
    type: "Demo Restaurant",
    description:
      "Выберите категорию, найдите блюдо по названию или откройте карточку, чтобы посмотреть состав и фото.",
  },
  categories: [
    { id: "popular", name: "Популярное" },
    { id: "breakfast", name: "Завтраки" },
    { id: "mains", name: "Горячее" },
    { id: "salads", name: "Салаты" },
    { id: "drinks", name: "Напитки" },
    { id: "desserts", name: "Десерты" },
  ],
  items: [
    {
      id: 1,
      category: "popular",
      title: "Маргарита",
      description: "Томаты, моцарелла, базилик, фирменный томатный соус",
      price: 3200,
      weight: "420 г",
      available: true,
      badge: "Хит",
      tags: ["Вегетарианское", "20 минут", "Можно без глютена"],
      image:
        "https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?auto=format&fit=crop&w=900&q=84",
    },
    {
      id: 2,
      category: "popular",
      title: "Боул с овощами",
      description: "Киноа, авокадо, свежая зелень, томаты черри, цитрусовый соус",
      price: 2800,
      weight: "360 г",
      available: true,
      badge: "Новое",
      tags: ["Легкое", "Без мяса", "Свежая зелень"],
      image:
        "https://images.unsplash.com/photo-1540189549336-e6e99c3679fe?auto=format&fit=crop&w=900&q=84",
    },
    {
      id: 3,
      category: "breakfast",
      title: "Флэт уайт",
      description: "Эспрессо, молоко, плотная кремовая текстура",
      price: 1400,
      weight: "220 мл",
      available: false,
      badge: "Стоп",
      tags: ["Кофе", "Временно недоступно"],
      image:
        "https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?auto=format&fit=crop&w=900&q=84",
    },
    {
      id: 4,
      category: "breakfast",
      title: "Сырники с ягодами",
      description: "Творожные сырники, сметанный крем, сезонные ягоды",
      price: 2600,
      weight: "300 г",
      available: true,
      badge: "Утро",
      tags: ["Завтрак", "Сладкое", "15 минут"],
      image:
        "https://images.unsplash.com/photo-1528207776546-365bb710ee93?auto=format&fit=crop&w=900&q=84",
    },
    {
      id: 5,
      category: "mains",
      title: "Стейк с перечным соусом",
      description: "Говядина, картофельный крем, перечный соус, микс зелени",
      price: 6900,
      weight: "430 г",
      available: true,
      badge: "Chef",
      tags: ["Горячее", "Мясо", "Средняя прожарка"],
      image:
        "https://images.unsplash.com/photo-1546833999-b9f581a1996d?auto=format&fit=crop&w=900&q=84",
    },
    {
      id: 6,
      category: "salads",
      title: "Цезарь с курицей",
      description: "Романо, куриное филе, пармезан, сухари, соус цезарь",
      price: 3100,
      weight: "340 г",
      available: true,
      badge: "Классика",
      tags: ["Салат", "Курица", "Пармезан"],
      image:
        "https://images.unsplash.com/photo-1550304943-4f24f54ddde9?auto=format&fit=crop&w=900&q=84",
    },
    {
      id: 7,
      category: "drinks",
      title: "Лимонад маракуйя",
      description: "Маракуйя, цитрус, содовая, свежая мята",
      price: 1800,
      weight: "400 мл",
      available: true,
      badge: "Fresh",
      tags: ["Холодный напиток", "Без алкоголя"],
      image:
        "https://images.unsplash.com/photo-1621263764928-df1444c5e859?auto=format&fit=crop&w=900&q=84",
    },
    {
      id: 8,
      category: "desserts",
      title: "Шоколадный фондан",
      description: "Теплый шоколадный кекс, жидкий центр, ванильное мороженое",
      price: 2400,
      weight: "220 г",
      available: true,
      badge: "Dessert",
      tags: ["Сладкое", "Подается теплым"],
      image:
        "https://images.unsplash.com/photo-1606313564200-e75d5e30476c?auto=format&fit=crop&w=900&q=84",
    },
  ],
};

const SUPABASE_REST_URL = "https://jnxwbqcnpxezjvfgdabc.supabase.co/rest/v1/";
const SUPABASE_PUBLISHABLE_KEY = "sb_publishable_T2QhpE8LByMP8_uO_cBdPg_bbLkAbBv";
const DEFAULT_RESTAURANT_SLUG = "exort-demo";
const DEMO_ADMIN_STORAGE_KEY = "exort-demo:linked-menu";
const THEME_STORAGE_KEY = "exort_theme";
const LANGUAGE_STORAGE_KEY = "exort_language";
const SERVICE_ACCEPTED_KEY = "exort_service_charge_accepted";
const SUPPORTED_LOCALES = ["ru", "en", "kk"];

function getRequestedRestaurantSlug() {
  return DEFAULT_RESTAURANT_SLUG;
}

function getRequestedLocale() {
  const queryLocale = new URLSearchParams(window.location.search).get("lang")?.toLowerCase();
  const htmlLocale = document.documentElement.lang?.toLowerCase().split("-")[0];

  return SUPPORTED_LOCALES.includes(queryLocale)
    ? queryLocale
    : SUPPORTED_LOCALES.includes(htmlLocale)
      ? htmlLocale
      : "ru";
}

function getLocalizedValue(record, field, locale = getRequestedLocale()) {
  const fallbackOrder = {
    ru: ["ru", "en", "kk"],
    en: ["en", "ru", "kk"],
    kk: ["kk", "ru", "en"],
  };

  for (const language of fallbackOrder[locale] || fallbackOrder.ru) {
    const value = record?.[`${field}_${language}`];

    if (typeof value === "string" && value.trim()) {
      return value.trim();
    }
  }

  return "";
}

async function requestSupabase(table, query) {
  const url = new URL(table, SUPABASE_REST_URL);

  Object.entries(query).forEach(([key, value]) => {
    url.searchParams.set(key, value);
  });

  const response = await fetch(url, {
    headers: {
      apikey: SUPABASE_PUBLISHABLE_KEY,
      Authorization: `Bearer ${SUPABASE_PUBLISHABLE_KEY}`,
    },
  });

  if (!response.ok) {
    const details = await response.text();
    throw new Error(`Supabase ${table} request failed (${response.status}): ${details}`);
  }

  return response.json();
}

function isMenuItemActive(item) {
  return item.is_active && (!item.inactive_until || new Date(item.inactive_until) <= new Date());
}

function isMenuItemAvailable(item) {
  return item.is_active !== false
    && item.is_stoplisted !== true
    && item.in_stock !== false
    && item.unavailable !== true
    && item.stop_list !== true
    && (!item.inactive_until || new Date(item.inactive_until).getTime() <= Date.now());
}

function getUnavailableBadge(locale) {
  return {
    ru: "Временно недоступно",
    kk: "Уақытша қолжетімсіз",
    en: "Temporarily unavailable",
  }[locale] || "Временно недоступно";
}

const DISH_IMAGE_PLACEHOLDER = `data:image/svg+xml,${encodeURIComponent(`
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 600">
    <rect width="600" height="600" fill="#f1e7dc"/>
    <circle cx="300" cy="284" r="150" fill="#fffdfa" stroke="#d8c4b6" stroke-width="18"/>
    <circle cx="300" cy="284" r="96" fill="none" stroke="#b66f62" stroke-width="12" stroke-dasharray="16 18"/>
    <path d="M196 470h208" stroke="#8c4f45" stroke-width="18" stroke-linecap="round"/>
  </svg>
`)}`;

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function getSafeImageUrl(value) {
  try {
    const url = new URL(value);
    return url.protocol === "https:" || url.protocol === "http:" ? url.href : DISH_IMAGE_PLACEHOLDER;
  } catch {
    return DISH_IMAGE_PLACEHOLDER;
  }
}

function loadMenuFromDemoAdmin() {
  const raw = localStorage.getItem(DEMO_ADMIN_STORAGE_KEY);

  if (!raw) {
    return null;
  }

  try {
    const demo = JSON.parse(raw);
    const locale = getRequestedLocale();
    const localeField = locale === "kk" ? "kz" : locale;
    const categories = [...(demo.categories || [])]
      .filter((category) => category.active)
      .sort((a, b) => a.sort - b.sort);
    const activeCategoryIds = new Set(categories.map((category) => category.id));
    const localized = (item, field) => {
      const orders = {
        ru: ["ru", "en", "kz"],
        en: ["en", "ru", "kz"],
        kz: ["kz", "ru", "en"],
      };

      for (const language of orders[localeField] || orders.ru) {
        const value = item?.[`${field}_${language}`];
        if (typeof value === "string" && value.trim()) return value.trim();
      }
      return "";
    };

    const restaurantCopy = {
      ru: ["Меню сегодня", "Выберите категорию, найдите блюдо или откройте его карточку."],
      kk: ["Бүгінгі мәзір", "Санатты таңдаңыз, тағамды іздеңіз немесе карточкасын ашыңыз."],
      en: ["Today's menu", "Choose a category, search for a dish or open its card."],
    }[locale] || ["Меню сегодня", "Выберите категорию, найдите блюдо или откройте его карточку."];

    return {
      restaurant: {
        name: restaurantCopy[0],
        type: demo.restaurant?.name || "Demo Restaurant",
        description: restaurantCopy[1],
      },
      categories: categories.map((category) => ({ id: category.id, name: getLocalizedCategoryName(category, locale) })),
      items: [...(demo.items || [])]
        .filter((item) => activeCategoryIds.has(item.category_id))
        .sort((a, b) => a.sort_order - b.sort_order)
        .map((item) => ({
          id: item.id,
          contentKey: item.id,
          category: item.category_id,
          title: localized(item, "name"),
          description: localized(item, "description"),
          price: Number(item.price || 0),
          currency: "₸",
          weight: "",
          available: item.is_active !== false && item.in_stock !== false && item.unavailable !== true && item.stop_list !== true,
          badge: item.in_stock === false ? localizeDishMeta("Стоп", locale) : "",
          tags: [],
          image: item.image || DISH_IMAGE_PLACEHOLDER,
        })),
    };
  } catch (error) {
    console.warn("Demo admin data is invalid:", error);
    return null;
  }
}

async function loadMenuFromSupabase() {
  const slug = getRequestedRestaurantSlug();
  const locale = getRequestedLocale();
  const restaurants = await requestSupabase("restaurants", {
    select: "id,slug,name,is_active",
    slug: `eq.${slug}`,
    is_active: "eq.true",
    limit: "1",
  });
  const restaurant = restaurants[0];

  if (!restaurant) {
    throw new Error(`Active restaurant "${slug}" was not found.`);
  }

  const [categories, items] = await Promise.all([
    requestSupabase("menu_categories", {
      select: "id,restaurant_id,title_ru,title_en,title_kk,sort_order,is_active",
      restaurant_id: `eq.${restaurant.id}`,
      order: "sort_order.asc",
    }),
    requestSupabase("menu_items", {
      select: "*",
      restaurant_id: `eq.${restaurant.id}`,
      order: "sort_order.asc",
    }),
  ]);

  const activeCategories = categories.filter((category) => category.is_active);
  const activeCategoryIds = new Set(activeCategories.map((category) => category.id));

  return {
    restaurant: {
      name: restaurant.name,
      type: "Exort Menu",
      description:
        locale === "en"
          ? "Choose a category, search for a dish or open its card."
          : locale === "kk"
            ? "Санатты таңдаңыз, тағамды іздеңіз немесе карточкасын ашыңыз."
            : "Выберите категорию, найдите блюдо или откройте его карточку.",
    },
    categories: activeCategories.map((category) => ({
      id: category.id,
      name: getLocalizedValue(category, "title", locale),
    })),
    items: items
      .filter((item) => item.category_id === null || activeCategoryIds.has(item.category_id))
      .map((item) => ({
        id: item.id,
        contentKey: item.content_key,
        category: item.category_id,
        title: getLocalizedValue(item, "title", locale),
        description: getLocalizedValue(item, "description", locale),
        price: Number(item.price || 0),
        currency: item.currency || "₸",
        weight: "",
        available: isMenuItemAvailable(item),
        badge: isMenuItemAvailable(item) ? localizeDishMeta(getLocalizedValue(item, "badge", locale), locale) : getUnavailableBadge(locale),
        tags: [],
        image: getSafeImageUrl(item.image_url),
      })),
  };
}

const serviceCopy = {
  RU: {
    kicker: "Важная информация",
    title: "Плата за обслуживание",
    text: "В заведении действует плата за обслуживание.<br>Продолжая пользоваться меню, вы подтверждаете, что ознакомились с этим условием.",
    action: "Я согласен(a)",
  },
  KZ: {
    kicker: "Маңызды ақпарат",
    title: "Қызмет көрсету ақысы",
    text: "Мекемеде қызмет көрсету ақысы қолданылады.<br>Мәзірді пайдалануды жалғастыра отырып, сіз осы шартпен танысқаныңызды растайсыз.",
    action: "Келісемін",
  },
  EN: {
    kicker: "Important information",
    title: "Service charge",
    text: "A service charge applies at this venue.<br>By continuing to use the menu, you confirm that you have read and understood this condition.",
    action: "I agree",
  },
};
const uiCopy = {
  ru: {
    title: "Demo Restaurant | Живое QR-меню", description: "QR-меню ресторана: категории, поиск, карточки блюд, стоп-лист и фото блюд.",
    search: "Найти блюдо или ингредиент", searchLabel: "Поиск", unavailable: "Временно недоступно",
    empty: "По этому запросу ничего не найдено.", noMatches: "Нет совпадений",
    tryAgain: "Попробуйте выбрать другую категорию или изменить поиск.", menu: "Меню",
    openUntil: "Открыто до 23:00", city: "Алматы", service: "10% сервис",
    quickActions: "Быстрые действия", chooseLanguage: "Выбор языка", changeTheme: "Сменить тему",
    menuSearch: "Поиск и фильтры меню", menuCategories: "Категории меню", dishList: "Список блюд",
    closeDish: "Закрыть карточку блюда", close: "Закрыть", backToTop: "Наверх",
  },
  kk: {
    title: "Demo Restaurant | Интерактивті QR-мәзір", description: "Мейрамхананың QR-мәзірі: санаттар, іздеу, тағам карточкалары, стоп-лист және фотосуреттер.",
    search: "Тағамды немесе ингредиентті іздеу", searchLabel: "Іздеу", unavailable: "Уақытша қолжетімсіз",
    empty: "Бұл сұрау бойынша ештеңе табылмады.", noMatches: "Сәйкестік жоқ",
    tryAgain: "Басқа санатты таңдаңыз немесе іздеуді өзгертіңіз.", menu: "Мәзір",
    openUntil: "23:00-ге дейін ашық", city: "Алматы", service: "10% қызмет көрсету",
    quickActions: "Жылдам әрекеттер", chooseLanguage: "Тілді таңдау", changeTheme: "Тақырыпты ауыстыру",
    menuSearch: "Мәзірден іздеу және сүзгілер", menuCategories: "Мәзір санаттары", dishList: "Тағамдар тізімі",
    closeDish: "Тағам карточкасын жабу", close: "Жабу", backToTop: "Жоғарыға",
  },
  en: {
    title: "Demo Restaurant | Live QR menu", description: "Restaurant QR menu with categories, search, dish details, stop list and photos.",
    search: "Find a dish or ingredient", searchLabel: "Search", unavailable: "Temporarily unavailable",
    empty: "Nothing was found for this search.", noMatches: "No matches",
    tryAgain: "Choose another category or change your search.", menu: "Menu",
    openUntil: "Open until 23:00", city: "Almaty", service: "10% service charge",
    quickActions: "Quick actions", chooseLanguage: "Choose language", changeTheme: "Change theme",
    menuSearch: "Menu search and filters", menuCategories: "Menu categories", dishList: "Dish list",
    closeDish: "Close dish details", close: "Close", backToTop: "Back to top",
  },
};

const categoryCopy = {
  popular: { ru: "Популярное", kk: "Танымал", en: "Popular" },
  breakfast: { ru: "Завтраки", kk: "Таңғы ас", en: "Breakfast" },
  mains: { ru: "Горячее", kk: "Ыстық тағамдар", en: "Mains" },
  salads: { ru: "Салаты", kk: "Салаттар", en: "Salads" },
  drinks: { ru: "Напитки", kk: "Сусындар", en: "Drinks" },
  desserts: { ru: "Десерты", kk: "Десерттер", en: "Desserts" },
};

const dishMetaCopy = {
  "Хит": { kk: "Хит", en: "Popular" }, "Новое": { kk: "Жаңа", en: "New" },
  "Стоп": { kk: "Стоп", en: "Stop" }, "Утро": { kk: "Таңғы", en: "Morning" },
  "Классика": { kk: "Классика", en: "Classic" }, "Вегетарианское": { kk: "Вегетариандық", en: "Vegetarian" },
  "20 минут": { kk: "20 минут", en: "20 minutes" }, "Можно без глютена": { kk: "Глютенсіз дайындауға болады", en: "Gluten-free option" },
  "Легкое": { kk: "Жеңіл", en: "Light" }, "Без мяса": { kk: "Етсіз", en: "Meat-free" },
  "Свежая зелень": { kk: "Балғын көк шөп", en: "Fresh herbs" }, "Кофе": { kk: "Кофе", en: "Coffee" },
  "Временно недоступно": { kk: "Уақытша қолжетімсіз", en: "Temporarily unavailable" },
  "Завтрак": { kk: "Таңғы ас", en: "Breakfast" }, "Сладкое": { kk: "Тәтті", en: "Sweet" },
  "15 минут": { kk: "15 минут", en: "15 minutes" }, "Горячее": { kk: "Ыстық тағам", en: "Main course" },
  "Мясо": { kk: "Ет", en: "Meat" }, "Средняя прожарка": { kk: "Орташа қуырылған", en: "Medium doneness" },
  "Салат": { kk: "Салат", en: "Salad" }, "Курица": { kk: "Тауық", en: "Chicken" },
  "Пармезан": { kk: "Пармезан", en: "Parmesan" }, "Холодный напиток": { kk: "Салқын сусын", en: "Cold drink" },
  "Без алкоголя": { kk: "Алкогольсіз", en: "Non-alcoholic" }, "Подается теплым": { kk: "Жылы күйде беріледі", en: "Served warm" },
};

function localizeDishMeta(value, locale) {
  return locale === "ru" ? value : dishMetaCopy[value]?.[locale] || value;
}

function getLocalizedCategoryName(category, locale = getRequestedLocale()) {
  const databaseName = getLocalizedValue(category, "title", locale) || getLocalizedValue(category, "name", locale);
  return databaseName || categoryCopy[category?.id]?.[locale] || category?.name || uiCopy[locale]?.menu || uiCopy.ru.menu;
}

const state = {
  category: "popular",
  query: "",
  loaded: false,
  data: null,
  scrollSpy: null,
};

const elements = {
  body: document.body,
  serviceModal: document.querySelector("[data-service-modal]"),
  serviceKicker: document.querySelector(".service-card .kicker"),
  serviceTitle: document.querySelector("#service-title"),
  serviceText: document.querySelector(".service-card > p"),
  closeService: document.querySelector("[data-close-service]"),
  languageButtons: document.querySelectorAll("[data-language]"),
  themeToggle: document.querySelector("[data-theme-toggle]"),
  restaurantType: document.querySelector("[data-restaurant-type]"),
  restaurantName: document.querySelector("[data-restaurant-name]"),
  restaurantDescription: document.querySelector("[data-restaurant-description]"),
  categories: document.querySelector("[data-categories]"),
  menuList: document.querySelector("[data-menu-list]"),
  statusRow: document.querySelector("[data-status-row]"),
  status: document.querySelector("[data-status]"),
  search: document.querySelector("[data-search]"),
  searchLabel: document.querySelector("[data-search-label]"),
  heroOpenUntil: document.querySelector("[data-hero-open-until]"),
  heroCity: document.querySelector("[data-hero-city]"),
  heroService: document.querySelector("[data-hero-service]"),
  drawer: document.querySelector("[data-dish-drawer]"),
  drawerImage: document.querySelector("[data-drawer-image]"),
  drawerCategory: document.querySelector("[data-drawer-category]"),
  drawerTitle: document.querySelector("[data-drawer-title]"),
  drawerDescription: document.querySelector("[data-drawer-description]"),
  drawerPrice: document.querySelector("[data-drawer-price]"),
  drawerWeight: document.querySelector("[data-drawer-weight]"),
  drawerTags: document.querySelector("[data-drawer-tags]"),
  closeDishButtons: document.querySelectorAll("[data-close-dish]"),
  backToTop: document.querySelector("[data-back-to-top]"),
};

function formatPrice(value, currency = "₸") {
  return `${new Intl.NumberFormat("ru-KZ").format(value)} ${currency}`;
}

function formatCount(value) {
  const mod10 = value % 10;
  const mod100 = value % 100;

  if (mod10 === 1 && mod100 !== 11) {
    return `${value} позиция`;
  }

  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) {
    return `${value} позиции`;
  }

  return `${value} позиций`;
}

function setLoadingState() {
  elements.menuList.innerHTML = Array.from({ length: 6 }, () => '<div class="skeleton"></div>').join("");
}

function getFilteredItems() {
  if (!state.data) {
    return [];
  }

  const normalizedQuery = state.query.trim().toLowerCase();

  return state.data.items.filter((item) => {
    const searchable = [item.title, item.description, item.badge, ...item.tags].join(" ").toLowerCase();

    return !normalizedQuery || searchable.includes(normalizedQuery);
  });
}

function renderRestaurant() {
  const { restaurant } = state.data;

  elements.restaurantType.textContent = restaurant.type;
  elements.restaurantName.textContent = restaurant.name;
  elements.restaurantDescription.textContent = restaurant.description;
}

function renderCategories() {
  const categoryButtons = state.data.categories
    .map(
      (category) => `
        <button class="${category.id === state.category ? "is-active" : ""}" type="button" data-category="${category.id}">
          ${escapeHtml(category.name)}
        </button>
      `,
    )
    .join("");

  elements.categories.innerHTML = categoryButtons;
}

function updateActiveCategory(categoryId) {
  state.category = categoryId;

  elements.categories.querySelectorAll("[data-category]").forEach((button) => {
    button.classList.toggle("is-active", button.dataset.category === categoryId);
  });
}

function createDishCard(item) {
  const copy = uiCopy[getRequestedLocale()] || uiCopy.ru;
  return `
    <article class="dish-card ${item.available ? "" : "is-unavailable"}" tabindex="0" role="button" data-dish-id="${item.id}">
      <div class="dish-image"><img src="${escapeHtml(item.image)}" alt="${escapeHtml(item.title)}" loading="lazy" />${item.available ? "" : `<span class="unavailable-badge">${copy.unavailable}</span>`}</div>
      <div class="dish-body">
        <div>
          <h3>${escapeHtml(item.title)}</h3>
          <p>${escapeHtml(item.description)}</p>
        </div>
        <div class="dish-bottom">
          <strong class="price">${escapeHtml(formatPrice(item.price, item.currency))}</strong>
          ${item.available && item.badge ? `<span class="badge success">${escapeHtml(item.badge)}</span>` : ""}
        </div>
      </div>
    </article>
  `;
}

function setupScrollSpy() {
  if (state.scrollSpy) {
    window.removeEventListener("scroll", state.scrollSpy);
    window.removeEventListener("resize", state.scrollSpy);
  }

  state.scrollSpy = () => {
    const sections = [...document.querySelectorAll("[data-menu-section]")];
    const marker = window.scrollY + window.innerHeight * 0.38;
    let currentSection = sections[0];

    sections.forEach((section) => {
      if (section.offsetTop <= marker) {
        currentSection = section;
      }
    });

    if (currentSection) {
      updateActiveCategory(currentSection.dataset.menuSection);
    }
  };

  window.addEventListener("scroll", state.scrollSpy, { passive: true });
  window.addEventListener("resize", state.scrollSpy);
  state.scrollSpy();
}

function renderMenu() {
  const items = getFilteredItems();
  const hasSearch = Boolean(state.query.trim());
  const copy = uiCopy[getRequestedLocale()] || uiCopy.ru;

  elements.statusRow.hidden = items.length > 0;
  elements.status.textContent = items.length ? "" : copy.empty;

  if (!items.length) {
    elements.menuList.innerHTML = `
      <div class="empty-state">
        <h2>${copy.noMatches}</h2>
        <p>${copy.tryAgain}</p>
      </div>
    `;
    return;
  }

  elements.menuList.innerHTML = state.data.categories
    .map((category) => {
      const sectionItems = items.filter((item) => item.category === category.id);

      if (!sectionItems.length) {
        return "";
      }

      return `
        <section class="menu-section" id="section-${category.id}" data-menu-section="${category.id}">
          <h2>${escapeHtml(category.name)}</h2>
          <div class="section-items">
            ${sectionItems.map(createDishCard).join("")}
          </div>
        </section>
      `;
    })
    .join("");

  requestAnimationFrame(() => {
    document.querySelectorAll(".dish-card").forEach((card, index) => {
      window.setTimeout(() => card.classList.add("is-visible"), index * 55);
    });
    setupScrollSpy();
  });
}

function renderAll() {
  renderRestaurant();
  renderCategories();
  renderMenu();
}

function openDish(itemId) {
  const item = state.data.items.find((dish) => String(dish.id) === String(itemId));

  if (!item) {
    return;
  }

  const category = state.data.categories.find((entry) => entry.id === item.category);

  elements.drawerImage.src = item.image;
  elements.drawerImage.alt = item.title;
  elements.drawerCategory.textContent = category?.name ?? (uiCopy[getRequestedLocale()] || uiCopy.ru).menu;
  elements.drawerTitle.textContent = item.title;
  elements.drawerDescription.textContent = item.description;
  elements.drawerPrice.textContent = formatPrice(item.price, item.currency);
  elements.drawerWeight.textContent = item.weight;
  elements.drawerTags.innerHTML = item.tags.map((tag) => `<span>${tag}</span>`).join("");
  elements.drawer.setAttribute("aria-hidden", "false");
}

function closeDish() {
  elements.drawer.setAttribute("aria-hidden", "true");
}

function setServiceLanguage(language) {
  const copy = serviceCopy[language];

  elements.serviceKicker.textContent = copy.kicker;
  elements.serviceTitle.textContent = copy.title;
  elements.serviceText.innerHTML = copy.text;
  elements.closeService.textContent = copy.action;

  elements.languageButtons.forEach((button) => {
    const languageCode = language === "KZ" ? "kk" : language.toLowerCase();
    button.classList.toggle("is-active", button.dataset.language === languageCode);
  });
}

function applyLanguage(language, reloadMenu = true) {
  const nextLanguage = SUPPORTED_LOCALES.includes(language) ? language : "ru";
  const copy = uiCopy[nextLanguage];
  document.documentElement.lang = nextLanguage;
  document.body.classList.toggle("lang-kz", nextLanguage === "kk");
  localStorage.setItem(LANGUAGE_STORAGE_KEY, nextLanguage);
  const url = new URL(window.location.href);
  url.searchParams.set("lang", nextLanguage);
  window.history.replaceState({}, "", url);
  elements.search.placeholder = copy.search;
  document.title = copy.title;
  document.querySelector('meta[name="description"]')?.setAttribute("content", copy.description);
  if (elements.searchLabel) elements.searchLabel.textContent = copy.searchLabel;
  if (elements.heroOpenUntil) elements.heroOpenUntil.textContent = copy.openUntil;
  if (elements.heroCity) elements.heroCity.textContent = copy.city;
  if (elements.heroService) elements.heroService.textContent = copy.service;
  document.querySelectorAll("[data-ui-aria]").forEach((node) => {
    const value = copy[node.dataset.uiAria];
    if (value) node.setAttribute("aria-label", value);
  });
  setServiceLanguage(nextLanguage === "kk" ? "KZ" : nextLanguage.toUpperCase());
  if (reloadMenu && state.loaded) loadDemoMenu();
}

function applyTheme(theme) {
  const nextTheme = theme === "dark" ? "dark" : "light";
  document.documentElement.dataset.theme = nextTheme;
  elements.themeToggle?.setAttribute("aria-pressed", String(nextTheme === "dark"));
  document.querySelector('meta[name="theme-color"]')?.setAttribute("content", nextTheme === "dark" ? "#120f0d" : "#f4f1ec");
  localStorage.setItem(THEME_STORAGE_KEY, nextTheme);
}

async function loadDemoMenu() {
  setLoadingState();

  try {
    state.data = await loadMenuFromSupabase();
    state.loaded = true;
    state.category = state.data.categories[0]?.id || "";
    renderAll();
  } catch (error) {
    console.warn("Supabase menu fallback:", error);

    window.setTimeout(() => {
      state.loaded = true;
      const locale = getRequestedLocale();
      state.data = {
        ...mockSupabaseResponse,
        restaurant: {
          ...mockSupabaseResponse.restaurant,
          name: locale === "kk" ? "Бүгінгі мәзір" : locale === "en" ? "Today's menu" : mockSupabaseResponse.restaurant.name,
          description: locale === "kk"
            ? "Санатты таңдаңыз, тағамды атауы бойынша іздеңіз немесе құрамы мен фотосын көру үшін карточкасын ашыңыз."
            : locale === "en"
              ? "Choose a category, find a dish by name or open its card to see ingredients and photos."
              : mockSupabaseResponse.restaurant.description,
        },
        categories: mockSupabaseResponse.categories.map((category) => ({
          ...category,
          name: getLocalizedCategoryName(category, locale),
        })),
        items: mockSupabaseResponse.items.map((item) => ({
          ...item,
          badge: localizeDishMeta(item.badge, locale),
          tags: item.tags.map((tag) => localizeDishMeta(tag, locale)),
          weight: locale === "en" ? item.weight.replace(" г", " g") : item.weight,
        })),
      };
      state.category = state.data.categories[0]?.id || "";
      renderAll();
    }, 420);
  }
}

window.addEventListener("storage", (event) => {
  if (event.key !== DEMO_ADMIN_STORAGE_KEY) return;
  loadDemoMenu();
});

elements.closeService.addEventListener("click", () => {
  localStorage.setItem(SERVICE_ACCEPTED_KEY, "true");
  document.documentElement.dataset.serviceAccepted = "true";
  elements.serviceModal.setAttribute("aria-hidden", "true");
});

elements.languageButtons.forEach(button => button.addEventListener("click", () => applyLanguage(button.dataset.language)));

elements.themeToggle.addEventListener("click", () => {
  applyTheme(document.documentElement.dataset.theme === "dark" ? "light" : "dark");
});

elements.categories.addEventListener("click", (event) => {
  const button = event.target.closest("[data-category]");

  if (!button) {
    return;
  }

  updateActiveCategory(button.dataset.category);
  document.querySelector(`#section-${button.dataset.category}`)?.scrollIntoView({
    behavior: "smooth",
    block: "start",
  });
});

elements.search.addEventListener("input", (event) => {
  state.query = event.target.value;
  renderMenu();
});

elements.menuList.addEventListener("click", (event) => {
  const card = event.target.closest("[data-dish-id]");

  if (card) {
    openDish(card.dataset.dishId);
  }
});

elements.menuList.addEventListener("keydown", (event) => {
  if (event.key !== "Enter" && event.key !== " ") {
    return;
  }

  const card = event.target.closest("[data-dish-id]");

  if (card) {
    event.preventDefault();
    openDish(card.dataset.dishId);
  }
});

elements.closeDishButtons.forEach((button) => {
  button.addEventListener("click", closeDish);
});

const updateBackToTop = () => elements.backToTop?.classList.toggle("is-visible", window.scrollY > 520);
elements.backToTop?.addEventListener("click", () => window.scrollTo({
  top: 0,
  behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth",
}));
window.addEventListener("scroll", updateBackToTop, { passive: true });

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape") {
    closeDish();
  }
});

applyTheme(localStorage.getItem(THEME_STORAGE_KEY) || document.documentElement.dataset.theme || "light");
applyLanguage(getRequestedLocale(), false);
if (localStorage.getItem(SERVICE_ACCEPTED_KEY) === "true") elements.serviceModal.setAttribute("aria-hidden", "true");
loadDemoMenu();
updateBackToTop();
