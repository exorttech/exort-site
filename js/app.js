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
const SUPPORTED_LOCALES = ["ru", "en", "kk"];
const RESTAURANT_SLUG_PATTERN = /^[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?$/;

function getRequestedRestaurantSlug() {
  const requestedSlug = new URLSearchParams(window.location.search)
    .get("restaurant")
    ?.trim()
    .toLowerCase();

  return RESTAURANT_SLUG_PATTERN.test(requestedSlug || "")
    ? requestedSlug
    : DEFAULT_RESTAURANT_SLUG;
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
      is_active: "eq.true",
      order: "sort_order.asc",
    }),
    requestSupabase("menu_items", {
      select:
        "id,restaurant_id,category_id,content_key,title_ru,title_en,title_kk,description_ru,description_en,description_kk,price,currency,image_url,badge_ru,badge_en,badge_kk,sort_order,is_active,inactive_until",
      restaurant_id: `eq.${restaurant.id}`,
      is_active: "eq.true",
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
      .filter(isMenuItemActive)
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
        available: true,
        badge: getLocalizedValue(item, "badge", locale),
        tags: [],
        image: getSafeImageUrl(item.image_url),
      })),
  };
}

const serviceCopy = {
  RU: {
    kicker: "Информация для гостя",
    title: "Сервисный сбор",
    text: "К счету добавляется <strong>10%</strong> за обслуживание ресторана. Если у вас есть пищевая аллергия, пожалуйста, предупредите официанта заранее.",
    action: "Понятно",
  },
  KZ: {
    kicker: "Қонаққа ақпарат",
    title: "Қызмет ақысы",
    text: "Есепшотқа мейрамхана қызметі үшін қосымша <strong>10%</strong> үстеме ақы қосылады. Тағамдық аллергияңыз болса, даяшыға алдын ала хабарлаңыз.",
    action: "Түсіндім",
  },
  EN: {
    kicker: "Guest information",
    title: "Service fee",
    text: "A <strong>10%</strong> restaurant service fee is added to the bill. If you have a food allergy, please inform the waiter in advance.",
    action: "Got it",
  },
};

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
  languagePills: document.querySelector(".language-pills"),
  themeToggle: document.querySelector("[data-theme-toggle]"),
  restaurantType: document.querySelector("[data-restaurant-type]"),
  restaurantName: document.querySelector("[data-restaurant-name]"),
  restaurantDescription: document.querySelector("[data-restaurant-description]"),
  categories: document.querySelector("[data-categories]"),
  menuList: document.querySelector("[data-menu-list]"),
  statusRow: document.querySelector("[data-status-row]"),
  status: document.querySelector("[data-status]"),
  search: document.querySelector("[data-search]"),
  reset: document.querySelector("[data-reset]"),
  drawer: document.querySelector("[data-dish-drawer]"),
  drawerImage: document.querySelector("[data-drawer-image]"),
  drawerCategory: document.querySelector("[data-drawer-category]"),
  drawerTitle: document.querySelector("[data-drawer-title]"),
  drawerDescription: document.querySelector("[data-drawer-description]"),
  drawerPrice: document.querySelector("[data-drawer-price]"),
  drawerWeight: document.querySelector("[data-drawer-weight]"),
  drawerTags: document.querySelector("[data-drawer-tags]"),
  closeDishButtons: document.querySelectorAll("[data-close-dish]"),
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
  return `
    <article class="dish-card ${item.available ? "" : "is-unavailable"}" tabindex="0" role="button" data-dish-id="${item.id}">
      <img src="${escapeHtml(item.image)}" alt="${escapeHtml(item.title)}" loading="lazy" />
      <div class="dish-body">
        <div>
          <h3>${escapeHtml(item.title)}</h3>
          <p>${escapeHtml(item.available ? item.description : "Временно недоступно")}</p>
        </div>
        <div class="dish-bottom">
          <strong class="price">${escapeHtml(formatPrice(item.price, item.currency))}</strong>
          ${item.badge ? `<span class="badge ${item.available ? "success" : ""}">${escapeHtml(item.badge)}</span>` : ""}
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

  elements.statusRow.hidden = items.length > 0 && !hasSearch;
  elements.status.textContent = items.length ? "" : "По этому запросу ничего не найдено.";

  if (!items.length) {
    elements.menuList.innerHTML = `
      <div class="empty-state">
        <h2>Нет совпадений</h2>
        <p>Попробуйте выбрать другую категорию или очистить поиск.</p>
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
  elements.drawerCategory.textContent = category?.name ?? "Меню";
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

  elements.languagePills.querySelectorAll("button").forEach((button) => {
    button.classList.toggle("is-active", button.textContent.trim() === language);
  });
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
      state.data = mockSupabaseResponse;
      state.category = state.data.categories[0]?.id || "";
      renderAll();
    }, 420);
  }
}

elements.closeService.addEventListener("click", () => {
  elements.serviceModal.setAttribute("aria-hidden", "true");
});

elements.languagePills.addEventListener("click", (event) => {
  const button = event.target.closest("button");

  if (button) {
    setServiceLanguage(button.textContent.trim());
  }
});

elements.themeToggle.addEventListener("click", () => {
  const nextTheme = elements.body.dataset.theme === "dark" ? "" : "dark";

  if (nextTheme) {
    elements.body.dataset.theme = nextTheme;
  } else {
    elements.body.removeAttribute("data-theme");
  }
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

elements.reset.addEventListener("click", () => {
  state.category = state.data?.categories[0]?.id || "";
  state.query = "";
  elements.search.value = "";
  renderMenu();
  updateActiveCategory(state.category);
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

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape") {
    closeDish();
    elements.serviceModal.setAttribute("aria-hidden", "true");
  }
});

loadDemoMenu();
