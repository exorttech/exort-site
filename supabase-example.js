/**
 * Framework-independent Exort Menu loader example.
 *
 * Pass an initialized Supabase client:
 *   const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
 *   const result = await loadRestaurantMenu(supabase);
 *
 * The function always returns a result object. Supabase/network failures become
 * result.status === "error" instead of crashing the whole menu page.
 */

const EXORT_BASE_DOMAIN = "exort.kz";
const DEMO_SLUG = "exort-demo";
const SUPPORTED_LOCALES = ["ru", "en", "kk"];
const SLUG_PATTERN = /^[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?$/;

function getBrowserSearch() {
  return typeof window === "undefined" ? "" : window.location.search;
}

function getBrowserHostname() {
  return typeof window === "undefined" ? "" : window.location.hostname;
}

function getDocumentLanguage() {
  return typeof document === "undefined" ? "" : document.documentElement.lang;
}

function normalizeSlug(value) {
  const slug = String(value || "").trim().toLowerCase();
  return SLUG_PATTERN.test(slug) ? slug : "";
}

function normalizeLocale(value) {
  const locale = String(value || "").trim().toLowerCase().split("-")[0];
  return SUPPORTED_LOCALES.includes(locale) ? locale : "";
}

export function getRestaurantSlug({
  search = getBrowserSearch(),
  hostname = getBrowserHostname(),
} = {}) {
  const querySlug = normalizeSlug(new URLSearchParams(search).get("restaurant"));

  if (querySlug) {
    return querySlug;
  }

  const normalizedHostname = String(hostname || "").toLowerCase().split(":")[0];
  const domainSuffix = `.${EXORT_BASE_DOMAIN}`;

  if (normalizedHostname.endsWith(domainSuffix)) {
    const subdomain = normalizedHostname.slice(0, -domainSuffix.length);
    const subdomainSlug = normalizeSlug(subdomain);

    if (subdomainSlug && subdomainSlug !== "www") {
      return subdomainSlug;
    }
  }

  return DEMO_SLUG;
}

export function getMenuLocale({
  search = getBrowserSearch(),
  htmlLang = getDocumentLanguage(),
} = {}) {
  return (
    normalizeLocale(new URLSearchParams(search).get("lang")) ||
    normalizeLocale(htmlLang) ||
    "ru"
  );
}

export function getLocalizedValue(record, field, locale = "ru") {
  const fallbackOrder = {
    ru: ["ru", "en", "kk"],
    en: ["en", "ru", "kk"],
    kk: ["kk", "ru", "en"],
  };

  const activeLocale = normalizeLocale(locale) || "ru";

  for (const language of fallbackOrder[activeLocale]) {
    const value = record?.[`${field}_${language}`];

    if (typeof value === "string" && value.trim()) {
      return value.trim();
    }
  }

  return "";
}

function isCurrentlyActive(record, now = new Date()) {
  if (!record?.is_active) {
    return false;
  }

  if (!record.inactive_until) {
    return true;
  }

  const inactiveUntil = new Date(record.inactive_until);
  return !Number.isNaN(inactiveUntil.getTime()) && inactiveUntil <= now;
}

function createErrorResult({ slug, locale, code, message, cause = null }) {
  return {
    status: "error",
    slug,
    locale,
    restaurant: null,
    categories: [],
    items: [],
    error: {
      code,
      message,
      cause,
    },
  };
}

export async function loadRestaurantMenu(
  supabase,
  {
    search = getBrowserSearch(),
    hostname = getBrowserHostname(),
    htmlLang = getDocumentLanguage(),
  } = {}
) {
  const slug = getRestaurantSlug({ search, hostname });
  const locale = getMenuLocale({ search, htmlLang });

  if (!supabase || typeof supabase.from !== "function") {
    return createErrorResult({
      slug,
      locale,
      code: "SUPABASE_CLIENT_MISSING",
      message: "Подключение к меню временно недоступно.",
    });
  }

  try {
    const { data: restaurant, error: restaurantError } = await supabase
      .from("restaurants")
      .select("id, slug, name, is_active")
      .eq("slug", slug)
      .eq("is_active", true)
      .maybeSingle();

    if (restaurantError) {
      return createErrorResult({
        slug,
        locale,
        code: "RESTAURANT_REQUEST_FAILED",
        message: "Не удалось загрузить ресторан.",
        cause: restaurantError.message,
      });
    }

    if (!restaurant) {
      return createErrorResult({
        slug,
        locale,
        code: "RESTAURANT_NOT_FOUND",
        message: `Активный ресторан "${slug}" не найден.`,
      });
    }

    const [categoriesResponse, itemsResponse] = await Promise.all([
      supabase
        .from("menu_categories")
        .select("id, restaurant_id, title_ru, title_en, title_kk, sort_order, is_active")
        .eq("restaurant_id", restaurant.id)
        .eq("is_active", true)
        .order("sort_order", { ascending: true }),
      supabase
        .from("menu_items")
        .select(
          [
            "id",
            "restaurant_id",
            "category_id",
            "content_key",
            "title_ru",
            "title_en",
            "title_kk",
            "description_ru",
            "description_en",
            "description_kk",
            "price",
            "currency",
            "image_url",
            "image_path",
            "badge_ru",
            "badge_en",
            "badge_kk",
            "sort_order",
            "is_active",
            "inactive_until",
          ].join(",")
        )
        .eq("restaurant_id", restaurant.id)
        .eq("is_active", true)
        .order("sort_order", { ascending: true }),
    ]);

    if (categoriesResponse.error || itemsResponse.error) {
      return createErrorResult({
        slug,
        locale,
        code: "MENU_REQUEST_FAILED",
        message: "Не удалось загрузить меню ресторана.",
        cause: categoriesResponse.error?.message || itemsResponse.error?.message,
      });
    }

    const categories = (categoriesResponse.data || [])
      .filter(isCurrentlyActive)
      .map((category) => ({
        ...category,
        title: getLocalizedValue(category, "title", locale),
      }));

    const activeCategoryIds = new Set(categories.map((category) => category.id));

    const items = (itemsResponse.data || [])
      .filter(isCurrentlyActive)
      .filter((item) => item.category_id === null || activeCategoryIds.has(item.category_id))
      .map((item) => ({
        ...item,
        title: getLocalizedValue(item, "title", locale),
        description: getLocalizedValue(item, "description", locale),
        badge: getLocalizedValue(item, "badge", locale),
      }));

    return {
      status: "success",
      slug,
      locale,
      restaurant,
      categories,
      items,
      error: null,
    };
  } catch (error) {
    return createErrorResult({
      slug,
      locale,
      code: "SUPABASE_UNAVAILABLE",
      message: "Меню временно недоступно. Попробуйте обновить страницу позже.",
      cause: error instanceof Error ? error.message : String(error),
    });
  }
}
