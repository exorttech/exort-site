const BUCKET = "restaurant-assets";
import { getAnalyticsV2 } from "./analytics.js";

const SESSION_TTL_SECONDS = 60 * 60 * 8;
const DEFAULT_RESTAURANT_SLUG = "exort-demo";
const DEFAULT_RESTAURANT_TIME_ZONE = "Asia/Almaty";
const MIN_DISH_VIEW_MS = 1500;
const MAX_DISH_VIEW_MS = 30 * 60 * 1000;

const textEncoder = new TextEncoder();
const textDecoder = new TextDecoder();

export default {
  async fetch(request, env) {
    if (request.method === "OPTIONS") {
      return jsonResponse(204, null);
    }

    if (request.method !== "POST") {
      return jsonResponse(405, { error: "Method not allowed" });
    }

    const configError = getConfigError(env);
    if (configError) {
      return jsonResponse(500, { error: configError });
    }

    try {
      const body = await request.json().catch(() => ({}));
      const action = body.action;
      const restaurantSlug = sanitizeSlug(body.restaurantSlug || DEFAULT_RESTAURANT_SLUG);

      if (action === "login") {
        return await login(env, restaurantSlug, body.pin);
      }

      if (action === "trackAnalyticsEvent") {
        return await trackAnalyticsEvent(env, restaurantSlug, body);
      }

      if (action === "getPublicMenuData") {
        return await getPublicMenuData(env, restaurantSlug);
      }

      const session = await verifySession(env, body.sessionToken, restaurantSlug);
      if (!session) {
        return jsonResponse(401, { error: "Admin session expired. Sign in again." });
      }

      if (action === "getData") return getData(env, restaurantSlug);
      if (action === "translate" || action === "translateMissing") return translate(env, action, body);
      if (action === "saveItem") return saveItem(env, restaurantSlug, body.item);
      if (action === "deleteItem") return deleteItem(env, restaurantSlug, body.itemId);
      if (action === "toggleStock") return toggleStock(env, restaurantSlug, body.itemId, body.is_stoplisted);
      if (action === "uploadItemPhoto") return uploadItemPhoto(env, restaurantSlug, body.itemId, body.imageData);
      if (action === "saveCategory") return saveCategory(env, restaurantSlug, body.category);
      if (action === "sortCategories") return sortCategories(env, restaurantSlug, body.categories || []);
      if (action === "getQrSources") return getQrSources(env, restaurantSlug);
      if (action === "createQrSource") return createQrSource(env, restaurantSlug, body);
      if (action === "updateQrSource") return updateQrSource(env, restaurantSlug, body);
      if (action === "archiveQrSource") return archiveQrSource(env, restaurantSlug, body.sourceId);
      if (action === "getAnalytics") return getAnalyticsV2(env, restaurantSlug, body);

      return jsonResponse(400, { error: "Unknown admin action." });
    } catch (error) {
      console.error("[exort-admin-worker]", error);
      return jsonResponse(500, { error: error?.message || "Unexpected admin backend error." });
    }
  },
};

async function login(env, slug, pin) {
  const restaurant = await getRestaurant(env, slug);
  const accessRows = await supabaseRest(env, "restaurant_admin_access", {
    query: {
      select: "id,restaurant_id,pin_hash,is_active",
      restaurant_id: `eq.${restaurant.id}`,
      is_active: "eq.true",
      limit: "1",
    },
  });

  const access = accessRows[0];
  if (!access) return jsonResponse(403, { error: "PIN access is not configured for this restaurant." });

  const valid = await verifyPin(env, pin, access.pin_hash);
  if (!valid) return jsonResponse(401, { error: "Invalid PIN." });

  const token = await signSession(env, {
    restaurant_id: restaurant.id,
    slug: restaurant.slug,
    exp: Math.floor(Date.now() / 1000) + SESSION_TTL_SECONDS,
  });

  const data = await buildAdminData(env, restaurant);
  return jsonResponse(200, { sessionToken: token, ...data });
}

async function getData(env, slug) {
  const restaurant = await getRestaurant(env, slug);
  return jsonResponse(200, await buildAdminData(env, restaurant));
}

async function getPublicMenuData(env, slug) {
  const restaurant = await getRestaurant(env, slug);
  const data = await buildAdminData(env, restaurant);
  const categories = data.categories.filter((category) => category.is_active !== false);
  const categoryIds = new Set(categories.map((category) => category.id));
  const items = data.items.filter((item) => item.content_key !== "menu-hero" && categoryIds.has(item.category_id));

  return jsonResponse(200, {
    restaurant: {
      id: restaurant.id,
      slug: restaurant.slug,
      name: restaurant.name,
    },
    categories,
    items,
  });
}

async function buildAdminData(env, restaurant) {
  const [categories, items] = await Promise.all([
    supabaseRest(env, "menu_categories", {
      query: {
        select: "*",
        restaurant_id: `eq.${restaurant.id}`,
        order: "sort_order.asc",
      },
    }),
    supabaseRest(env, "menu_items", {
      query: {
        select: "*",
        restaurant_id: `eq.${restaurant.id}`,
        order: "sort_order.asc",
      },
    }),
  ]);

  return { restaurant, categories, items };
}

async function saveItem(env, slug, item) {
  const restaurant = await getRestaurant(env, slug);
  if (!item || !String(item.name_ru || "").trim()) throw new Error("RU dish name is required.");

  const current = item.id ? await getOwnedRow(env, "menu_items", restaurant.id, item.id) : null;
  let imageData = {};

  if (item.imageData && String(item.imageData).startsWith("data:image/")) {
    imageData = await uploadImage(
      env,
      slug,
      `menu-items/${slugify(item.name_ru || item.content_key || "dish")}-${Date.now()}.webp`,
      item.imageData,
    );
  } else if (item.image_url === "") {
    imageData = { image_url: "", image_path: "" };
  }

  const contentKey = current?.content_key || item.content_key || slugify(item.name_ru || `item-${Date.now()}`);
  const payload = {
    restaurant_id: restaurant.id,
    category_id: item.category_id || null,
    content_key: contentKey,
    name_ru: clean(item.name_ru),
    name_kz: clean(item.name_kz),
    name_en: clean(item.name_en),
    title_ru: clean(item.name_ru),
    title_kk: clean(item.name_kz),
    title_en: clean(item.name_en),
    description_ru: clean(item.description_ru),
    description_kz: clean(item.description_kz),
    description_kk: clean(item.description_kz),
    description_en: clean(item.description_en),
    price: Number(item.price || 0),
    currency: item.currency || "KZT",
    is_active: item.is_active !== false,
    is_stoplisted: item.is_stoplisted === true,
    inactive_until: item.inactive_until || null,
    sort_order: Number(item.sort_order || 0),
    version: Number(current?.version || 0) + 1,
    ...imageData,
  };

  if (item.old_price !== undefined) payload.old_price = cleanIntegerOrNull(item.old_price);
  if (item.weight !== undefined) payload.weight = cleanOrNull(item.weight);
  if (item.calories !== undefined) payload.calories = cleanIntegerOrNull(item.calories);
  if (item.spice_level !== undefined) payload.spice_level = cleanOrNull(item.spice_level);

  const rows = await supabaseRest(env, "menu_items", {
    method: current ? "PATCH" : "POST",
    query: current
      ? { id: `eq.${item.id}`, restaurant_id: `eq.${restaurant.id}`, select: "*" }
      : { select: "*" },
    body: current ? payload : [payload],
    prefer: "return=representation",
  });

  return jsonResponse(200, { item: Array.isArray(rows) ? rows[0] : rows });
}

async function deleteItem(env, slug, itemId) {
  const restaurant = await getRestaurant(env, slug);
  await getOwnedRow(env, "menu_items", restaurant.id, itemId);
  await supabaseRest(env, "menu_items", {
    method: "DELETE",
    query: { id: `eq.${itemId}`, restaurant_id: `eq.${restaurant.id}` },
  });
  return jsonResponse(200, { ok: true });
}

async function toggleStock(env, slug, itemId, isStoplisted) {
  const restaurant = await getRestaurant(env, slug);
  const current = await getOwnedRow(env, "menu_items", restaurant.id, itemId);
  const rows = await supabaseRest(env, "menu_items", {
    method: "PATCH",
    query: { id: `eq.${itemId}`, restaurant_id: `eq.${restaurant.id}`, select: "*" },
    body: {
      is_stoplisted: isStoplisted === true,
      version: Number(current.version || 0) + 1,
    },
    prefer: "return=representation",
  });
  return jsonResponse(200, { item: rows[0] });
}

async function uploadItemPhoto(env, slug, itemId, imageData) {
  const restaurant = await getRestaurant(env, slug);
  const current = await getOwnedRow(env, "menu_items", restaurant.id, itemId);
  const image = await uploadImage(
    env,
    slug,
    `menu-items/${slugify(current.content_key || current.name_ru || "dish")}-${Date.now()}.webp`,
    imageData,
  );

  const rows = await supabaseRest(env, "menu_items", {
    method: "PATCH",
    query: { id: `eq.${itemId}`, restaurant_id: `eq.${restaurant.id}`, select: "*" },
    body: { ...image, version: Number(current.version || 0) + 1 },
    prefer: "return=representation",
  });
  return jsonResponse(200, { item: rows[0] });
}

async function saveCategory(env, slug, category) {
  const restaurant = await getRestaurant(env, slug);
  if (!category || !String(category.name_ru || category.name || "").trim()) {
    throw new Error("RU category name is required.");
  }

  const current = category.id ? await getOwnedRow(env, "menu_categories", restaurant.id, category.id) : null;
  const nameRu = clean(category.name_ru || category.name);
  const payload = {
    restaurant_id: restaurant.id,
    name_ru: nameRu,
    name_kz: clean(category.name_kz),
    name_en: clean(category.name_en),
    title_ru: nameRu,
    title_kk: clean(category.name_kz),
    title_en: clean(category.name_en),
    sort_order: Number(category.sort_order || category.sort || 0),
    is_active: category.is_active !== false && category.active !== false,
  };

  const rows = await supabaseRest(env, "menu_categories", {
    method: current ? "PATCH" : "POST",
    query: current
      ? { id: `eq.${category.id}`, restaurant_id: `eq.${restaurant.id}`, select: "*" }
      : { select: "*" },
    body: current ? payload : [payload],
    prefer: "return=representation",
  });

  return jsonResponse(200, { category: rows[0] });
}

async function sortCategories(env, slug, categories) {
  const restaurant = await getRestaurant(env, slug);

  for (const category of categories) {
    if (!category.id) continue;
    await supabaseRest(env, "menu_categories", {
      method: "PATCH",
      query: { id: `eq.${category.id}`, restaurant_id: `eq.${restaurant.id}` },
      body: { sort_order: Number(category.sort_order || 0) },
    });
  }

  return getData(env, slug);
}

async function translate(env, action, body) {
  if (!env.EXORT_TRANSLATE_API_URL) {
    return jsonResponse(503, {
      error: "Translation backend is not configured yet. Add EXORT_TRANSLATE_API_URL to enable auto-translation.",
    });
  }

  const upstream = await fetch(env.EXORT_TRANSLATE_API_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ action, ...body }),
  });

  const data = await upstream.json().catch(() => ({}));
  return jsonResponse(upstream.status, data);
}

async function getQrSources(env, slug) {
  const restaurant = await getRestaurant(env, slug);
  const [sources, events] = await Promise.all([
    supabaseRest(env, "qr_sources", {
      query: { select: "*", restaurant_id: `eq.${restaurant.id}`, order: "created_at.desc" },
    }),
    fetchQrAnalyticsEvents(env, restaurant.id),
  ]);

  const stats = new Map();
  events.forEach((event) => {
    if (!event.qr_source_id) return;
    const current = stats.get(event.qr_source_id) || { sessions: new Set(), engaged: new Set(), lastVisitAt: "" };
    if (["session_start", "menu_open"].includes(event.event_type) && event.session_id) current.sessions.add(event.session_id);
    if (event.event_type === "dish_open" && event.session_id) current.engaged.add(event.session_id);
    if (!current.lastVisitAt || event.created_at > current.lastVisitAt) current.lastVisitAt = event.created_at;
    stats.set(event.qr_source_id, current);
  });

  return jsonResponse(200, {
    sources: sources.map((source) => {
      const sourceStats = stats.get(source.id);
      return {
        ...source,
        visits: sourceStats?.sessions.size || 0,
        engagedSessions: sourceStats?.engaged.size || 0,
        lastVisitAt: sourceStats?.lastVisitAt || null,
        url: buildPublicMenuUrl(slug, source.public_id, source.menu_path),
      };
    }),
  });
}

async function fetchQrAnalyticsEvents(env, restaurantId) {
  const rows = [];
  for (let offset = 0; offset < 20000; offset += 1000) {
    const page = await supabaseRest(env, "menu_analytics_events", {
      query: {
        select: "id,qr_source_id,event_type,session_id,created_at",
        restaurant_id: `eq.${restaurantId}`,
        order: "created_at.asc",
        limit: "1000",
        offset: String(offset),
      },
    });
    rows.push(...page);
    if (page.length < 1000) break;
  }
  return rows;
}

async function createQrSource(env, slug, body) {
  const restaurant = await getRestaurant(env, slug);
  const name = cleanLimited(body.name, 100);
  if (!name) throw new Error("QR source name is required.");
  const publicId = createPublicSourceId();
  const menuPath = normalizeMenuPath(body.menuPath);
  const rows = await supabaseRest(env, "qr_sources", {
    method: "POST",
    query: { select: "*" },
    body: [{
      restaurant_id: restaurant.id,
      name,
      public_id: publicId,
      source_type: normalizeSourceType(body.sourceType),
      menu_path: menuPath,
      is_active: true,
    }],
    prefer: "return=representation",
  });
  const source = rows[0];
  return jsonResponse(200, { source: { ...source, visits: 0, engagedSessions: 0, lastVisitAt: null, url: buildPublicMenuUrl(slug, source.public_id, menuPath) } });
}

async function updateQrSource(env, slug, body) {
  const restaurant = await getRestaurant(env, slug);
  const current = await getOwnedRow(env, "qr_sources", restaurant.id, body.sourceId);
  const name = cleanLimited(body.name, 100);
  if (!name) throw new Error("QR source name is required.");
  const rows = await supabaseRest(env, "qr_sources", {
    method: "PATCH",
    query: { id: `eq.${current.id}`, restaurant_id: `eq.${restaurant.id}`, select: "*" },
    body: { name },
    prefer: "return=representation",
  });
  return jsonResponse(200, { source: rows[0] });
}

async function archiveQrSource(env, slug, sourceId) {
  const restaurant = await getRestaurant(env, slug);
  const current = await getOwnedRow(env, "qr_sources", restaurant.id, sourceId);
  const rows = await supabaseRest(env, "qr_sources", {
    method: "PATCH",
    query: { id: `eq.${current.id}`, restaurant_id: `eq.${restaurant.id}`, select: "*" },
    body: { is_active: false },
    prefer: "return=representation",
  });
  return jsonResponse(200, { source: rows[0] });
}

function createPublicSourceId() {
  const bytes = crypto.getRandomValues(new Uint8Array(12));
  return encodeBase64Url(bytes);
}

function normalizeSourceType(value) {
  const type = clean(value).toLowerCase();
  return ["qr", "link", "social"].includes(type) ? type : "qr";
}

function normalizeMenuPath(value) {
  const path = cleanLimited(value, 180) || "";
  return path.startsWith("/") && !path.startsWith("//") ? path : "";
}

function buildPublicMenuUrl(slug, publicId, menuPath = "") {
  const path = menuPath || "/demo-menu";
  const separator = path.includes("?") ? "&" : "?";
  const restaurantPart = path.includes("restaurant=") ? "" : `restaurant=${encodeURIComponent(slug)}&`;
  return `https://exort.kz${path}${separator}${restaurantPart}source=${encodeURIComponent(publicId)}`;
}

async function resolveQrSource(env, restaurantId, publicId) {
  const normalized = cleanLimited(publicId, 64);
  if (!normalized) return null;
  const rows = await supabaseRest(env, "qr_sources", {
    query: {
      select: "id,name,public_id,source_type,is_active",
      restaurant_id: `eq.${restaurantId}`,
      public_id: `eq.${normalized}`,
      is_active: "eq.true",
      limit: "1",
    },
  });
  return rows[0] || null;
}

async function trackAnalyticsEvent(env, slug, body) {
  try {
    const restaurant = await getRestaurant(env, slug);
    const eventType = normalizeEventType(body.eventType);
    const deviceType = normalizeDeviceType(body.deviceType);
    const language = normalizeAnalyticsLanguage(body.language);
    const menuItemId = await resolveAnalyticsMenuItemId(env, restaurant.id, body.menuItemId);
    const categoryId = await resolveAnalyticsCategoryId(env, restaurant.id, body.categoryId);
    const qrSource = await resolveQrSource(env, restaurant.id, body.sourcePublicId);

    if (!eventType) return jsonResponse(200, { ok: true, tracked: false });

    await supabaseRest(env, "menu_analytics_events", {
      method: "POST",
      body: [{
        restaurant_id: restaurant.id,
        event_type: eventType,
        menu_item_id: menuItemId,
        category_id: categoryId,
        language,
        device_type: deviceType,
        session_id: cleanLimited(body.sessionId, 120),
        menu_page_id: cleanLimited(body.menuPageId || slug, 120),
        qr_source_id: qrSource?.id || null,
        source_fallback: qrSource?.name || cleanLimited(body.sourceFallback || (body.sourcePublicId ? "Источник не определён" : "Прямой переход"), 120),
        duration_ms: normalizeDuration(body.durationMs),
        metadata: normalizeAnalyticsMetadata(body.metadata),
        user_agent: cleanLimited(body.userAgent, 500),
        referrer: cleanLimited(body.referrer, 500),
      }],
      prefer: "return=minimal",
    });

    return jsonResponse(200, { ok: true });
  } catch (error) {
    console.warn("[exort-admin-worker] analytics tracking skipped", error?.message || error);
    return jsonResponse(200, { ok: true, tracked: false });
  }
}

async function resolveAnalyticsCategoryId(env, restaurantId, categoryId) {
  if (!isUuid(categoryId)) return null;
  const rows = await supabaseRest(env, "menu_categories", {
    query: { select: "id", id: `eq.${categoryId}`, restaurant_id: `eq.${restaurantId}`, limit: "1" },
  });
  return rows[0]?.id || null;
}

function normalizeDuration(value) {
  const duration = Math.round(Number(value));
  return Number.isFinite(duration) && duration >= 0 && duration <= 86400000 ? duration : null;
}

function normalizeAnalyticsMetadata(value) {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};
  const serialized = JSON.stringify(value);
  if (serialized.length > 2000) return {};
  return value;
}

async function getAnalytics(env, slug, range = "today") {
  const restaurant = await getRestaurant(env, slug);
  const timeZone = restaurant.timezone || DEFAULT_RESTAURANT_TIME_ZONE;
  const normalizedRange = normalizeAnalyticsRange(range);
  const now = new Date();
  const todayKey = formatDateKeyInTimeZone(now, timeZone);
  const yesterdayKey = shiftDateKey(todayKey, -1);
  const last7StartKey = shiftDateKey(todayKey, -6);
  const last30StartKey = shiftDateKey(todayKey, -29);
  const yearStartKey = `${todayKey.slice(0, 4)}-01-01`;
  const selectedStartKey = getRangeStartKey(normalizedRange, todayKey, last7StartKey, last30StartKey, yearStartKey);
  const queryStartKey = normalizedRange === "year" ? yearStartKey : shiftDateKey(last30StartKey, -1);
  const queryStart = dateKeyToUtcDate(queryStartKey);

  const rawEvents = await supabaseRest(env, "menu_analytics_events", {
    query: {
      select: "id,event_type,menu_item_id,language,device_type,session_id,created_at",
      restaurant_id: `eq.${restaurant.id}`,
      ...(normalizedRange === "all" ? {} : { created_at: `gte.${queryStart.toISOString()}` }),
      order: "created_at.desc",
      limit: "10000",
    },
  });
  const events = rawEvents.map((event) => withAnalyticsLocalTime(event, timeZone));

  const selectedEvents = selectedStartKey
    ? events.filter((event) => isEventOnOrAfterLocalDate(event, selectedStartKey))
    : events;
  const selectedMenuOpens = selectedEvents.filter((event) => event.event_type === "menu_open");
  const selectedDishOpens = selectedEvents.filter((event) => event.event_type === "dish_open");
  const selectedDishViewDurations = buildDishViewDurations(selectedEvents);
  const todayDishOpens = events.filter((event) => (
    event.event_type === "dish_open" &&
    event.localDateKey === todayKey
  ));
  const dishCounts = countBy(selectedDishOpens.filter((event) => event.menu_item_id), "menu_item_id");
  const todayDishCounts = countBy(todayDishOpens.filter((event) => event.menu_item_id), "menu_item_id");
  const dishIds = Array.from(new Set([...Object.keys(dishCounts), ...Object.keys(todayDishCounts)]));
  const dishNames = await getDishNames(env, restaurant.id, dishIds);

  return jsonResponse(200, {
    ok: true,
    analytics: {
      menuVisits: {
        today: countEventsByLocalDateRange(events, "menu_open", todayKey, shiftDateKey(todayKey, 1)),
        yesterday: countEventsByLocalDateRange(events, "menu_open", yesterdayKey, todayKey),
        last7Days: countEventsByLocalDateRange(events, "menu_open", last7StartKey, shiftDateKey(todayKey, 1)),
        last30Days: countEventsByLocalDateRange(events, "menu_open", last30StartKey, shiftDateKey(todayKey, 1)),
        year: countEventsByLocalDateRange(events, "menu_open", yearStartKey, shiftDateKey(todayKey, 1)),
        allTime: events.filter((event) => event.event_type === "menu_open").length,
      },
      uniqueGuests: {
        today: countUniqueSessionsByLocalDateRange(events, todayKey, shiftDateKey(todayKey, 1)),
        last7Days: countUniqueSessionsByLocalDateRange(events, last7StartKey, shiftDateKey(todayKey, 1)),
        last30Days: countUniqueSessionsByLocalDateRange(events, last30StartKey, shiftDateKey(todayKey, 1)),
        year: countUniqueSessionsByLocalDateRange(events, yearStartKey, shiftDateKey(todayKey, 1)),
        allTime: countUniqueSessionsByLocalDateRange(events, null, null),
      },
      dishOpens: {
        today: countEventsByLocalDateRange(events, "dish_open", todayKey, shiftDateKey(todayKey, 1)),
        last7Days: countEventsByLocalDateRange(events, "dish_open", last7StartKey, shiftDateKey(todayKey, 1)),
        last30Days: countEventsByLocalDateRange(events, "dish_open", last30StartKey, shiftDateKey(todayKey, 1)),
        year: countEventsByLocalDateRange(events, "dish_open", yearStartKey, shiftDateKey(todayKey, 1)),
        allTime: events.filter((event) => event.event_type === "dish_open").length,
      },
      averageViewTime: formatAverageDishViewTime(selectedDishViewDurations),
      popularDishes: dishIds
        .map((id) => ({ id, title: dishNames[id] || "Блюдо", opens: dishCounts[id] }))
        .sort((a, b) => b.opens - a.opens)
        .slice(0, 10),
      popularDishesToday: Object.keys(todayDishCounts)
        .map((id) => ({ id, title: dishNames[id] || "Блюдо", opens: todayDishCounts[id] }))
        .sort((a, b) => b.opens - a.opens)
        .slice(0, 5),
      visitsByHour: buildVisitsByHour(events.filter((event) => (
        event.event_type === "menu_open" &&
        event.localDateKey === todayKey
      )), timeZone),
      visitsByDay: buildVisitsByDay(events, last7StartKey, todayKey, timeZone),
      visitsByWeek: buildVisitsByWeek(events, last30StartKey, todayKey, timeZone),
      visitsByMonth: buildVisitsByMonth(events, Number(todayKey.slice(0, 4)), timeZone),
      dayDetails: buildDayDetails(events, last30StartKey, todayKey, timeZone),
      allTimeSummary: buildAllTimeSummary(events, timeZone),
      languages: buildPercentRows(selectedEvents, "language", "language", (value) => String(value || "").toUpperCase()),
      devices: buildPercentRows(selectedEvents, "device_type", "device"),
      recentEvents: buildRecentEvents(selectedEvents.filter((event) => event.event_type !== "dish_close").slice(0, 10), dishNames, timeZone),
      timeZone,
    },
  });
}

async function getDishNames(env, restaurantId, dishIds) {
  if (!dishIds.length) return {};
  const rows = await supabaseRest(env, "menu_items", {
    query: {
      select: "id,name_ru,title_ru,name_en,title_en,name_kz,title_kk",
      restaurant_id: `eq.${restaurantId}`,
      id: `in.(${dishIds.join(",")})`,
    },
  });

  return Object.fromEntries(rows.map((row) => [
    row.id,
    clean(row.name_ru || row.title_ru || row.name_en || row.title_en || row.name_kz || row.title_kk || "Блюдо"),
  ]));
}

async function resolveAnalyticsMenuItemId(env, restaurantId, menuItemId) {
  if (!isUuid(menuItemId)) return null;
  const rows = await supabaseRest(env, "menu_items", {
    query: {
      select: "id",
      id: `eq.${menuItemId}`,
      restaurant_id: `eq.${restaurantId}`,
      limit: "1",
    },
  });
  return rows[0]?.id || null;
}

async function getRestaurant(env, slug) {
  const rows = await supabaseRest(env, "restaurants", {
    query: {
      select: "*",
      slug: `eq.${slug}`,
      is_active: "eq.true",
      limit: "1",
    },
  });

  if (!rows[0]) throw new Error(`Active restaurant "${slug}" was not found.`);
  return rows[0];
}

async function getOwnedRow(env, table, restaurantId, id) {
  const rows = await supabaseRest(env, table, {
    query: { select: "*", id: `eq.${id}`, restaurant_id: `eq.${restaurantId}`, limit: "1" },
  });

  if (!rows[0]) throw new Error("Record was not found for this restaurant.");
  return rows[0];
}

async function uploadImage(env, slug, filename, dataUrl) {
  const match = String(dataUrl || "").match(/^data:(image\/[a-zA-Z0-9.+-]+);base64,(.+)$/);
  if (!match) throw new Error("Invalid image payload.");

  const bytes = base64ToBytes(match[2]);
  if (bytes.byteLength > 10 * 1024 * 1024) throw new Error("Image is larger than 10 MB.");

  const path = `${slug}/${filename}`;
  const upload = await fetch(`${normalizeSupabaseUrl(env)}/storage/v1/object/${BUCKET}/${path}`, {
    method: "POST",
    headers: createSupabaseHeaders(env, {
      "Content-Type": "image/webp",
      "x-upsert": "true",
    }),
    body: bytes,
  });

  if (!upload.ok) throw new Error(`Image upload failed: ${await upload.text()}`);

  return {
    image_url: `${normalizeSupabaseUrl(env)}/storage/v1/object/public/${BUCKET}/${path}`,
    image_path: path,
  };
}

async function supabaseRest(env, table, { method = "GET", query = {}, body, prefer = "" } = {}) {
  const url = new URL(`${normalizeSupabaseUrl(env)}/rest/v1/${table}`);
  Object.entries(query).forEach(([key, value]) => url.searchParams.set(key, value));

  const headers = createSupabaseHeaders(env, {
    "Content-Type": "application/json",
  });

  if (prefer) {
    assertHeaderValue("Prefer", prefer);
    headers.Prefer = prefer;
  }

  const result = await fetch(url.toString(), {
    method,
    headers,
    body: body === undefined ? undefined : JSON.stringify(body),
  });

  if (!result.ok) throw new Error(`Supabase ${table} ${method} failed: ${await result.text()}`);
  if (result.status === 204) return [];
  const text = await result.text();
  return text ? JSON.parse(text) : [];
}

function getConfigError(env) {
  const supabaseUrl = String(env.SUPABASE_URL || "").trim().replace(/\/$/, "");
  const serviceRoleKey = String(env.SUPABASE_SERVICE_ROLE_KEY || "").trim();
  const sessionSecret = String(env.EXORT_ADMIN_SESSION_SECRET || "").trim();

  if (!supabaseUrl) return "Admin backend is not configured: SUPABASE_URL is missing.";
  if (!isAsciiPrintable(supabaseUrl)) return "Admin backend is not configured: SUPABASE_URL contains non-ASCII characters.";

  try {
    const parsedUrl = new URL(supabaseUrl);
    if (!["https:", "http:"].includes(parsedUrl.protocol)) {
      return "Admin backend is not configured: SUPABASE_URL must start with https:// or http://.";
    }
  } catch {
    return "Admin backend is not configured: SUPABASE_URL is not a valid URL.";
  }

  if (!serviceRoleKey) return "Admin backend is not configured: SUPABASE_SERVICE_ROLE_KEY is missing.";
  if (!isAsciiToken(serviceRoleKey)) {
    return "Admin backend is not configured: SUPABASE_SERVICE_ROLE_KEY contains spaces or non-ASCII characters.";
  }

  if (!sessionSecret) return "Admin backend is not configured: EXORT_ADMIN_SESSION_SECRET is missing.";
  if (!isAsciiPrintable(sessionSecret)) {
    return "Admin backend is not configured: EXORT_ADMIN_SESSION_SECRET contains non-ASCII characters.";
  }

  return "";
}

function createSupabaseHeaders(env, extraHeaders = {}) {
  const serviceRoleKey = String(env.SUPABASE_SERVICE_ROLE_KEY || "").trim();
  const headers = {
    apikey: serviceRoleKey,
    Authorization: `Bearer ${serviceRoleKey}`,
  };

  Object.entries(extraHeaders).forEach(([name, value]) => {
    assertHeaderName(name);
    assertHeaderValue(name, value);
    headers[name] = value;
  });

  assertHeaderValue("apikey", headers.apikey);
  assertHeaderValue("Authorization", headers.Authorization);
  return headers;
}

async function verifyPin(env, pin, pinHash) {
  const value = String(pin || "");
  const stored = String(pinHash || "");
  if (!value || !stored) return false;

  if (stored.startsWith("sha256:")) {
    return safeEqual(stored.slice(7), await sha256(value));
  }

  if (stored === "demo_hash_1234" && env.EXORT_ALLOW_LEGACY_DEMO_PIN !== "false") {
    return value === "1234";
  }

  return false;
}

async function signSession(env, payload) {
  const encoded = encodeBase64Url(textEncoder.encode(JSON.stringify(payload)));
  const signature = await hmac(env, encoded);
  return `${encoded}.${signature}`;
}

async function verifySession(env, token, slug) {
  const [encoded, signature] = String(token || "").split(".");
  if (!encoded || !signature) return null;
  if (!(await safeEqual(signature, await hmac(env, encoded)))) return null;

  const payload = JSON.parse(textDecoder.decode(decodeBase64Url(encoded)));
  if (payload.exp < Math.floor(Date.now() / 1000)) return null;
  if (payload.slug !== slug) return null;
  return payload;
}

async function sha256(value) {
  const digest = await crypto.subtle.digest("SHA-256", textEncoder.encode(String(value)));
  return bytesToHex(new Uint8Array(digest));
}

async function hmac(env, value) {
  const key = await crypto.subtle.importKey(
    "raw",
    textEncoder.encode(String(env.EXORT_ADMIN_SESSION_SECRET || "").trim()),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const signature = await crypto.subtle.sign("HMAC", key, textEncoder.encode(String(value)));
  return encodeBase64Url(new Uint8Array(signature));
}

async function safeEqual(left, right) {
  const a = textEncoder.encode(String(left));
  const b = textEncoder.encode(String(right));
  const max = Math.max(a.length, b.length);
  let diff = a.length ^ b.length;

  for (let index = 0; index < max; index += 1) {
    diff |= (a[index] || 0) ^ (b[index] || 0);
  }

  return diff === 0;
}

function assertHeaderName(name) {
  if (!/^[A-Za-z0-9!#$%&'*+.^_`|~-]+$/.test(String(name))) {
    throw new Error(`Invalid HTTP header name: ${name}`);
  }
}

function assertHeaderValue(name, value) {
  if (!isAsciiPrintable(String(value))) {
    throw new Error(`Invalid HTTP header value for ${name}: only ASCII characters are allowed.`);
  }
}

function isAsciiToken(value) {
  return /^[\x21-\x7E]+$/.test(String(value || ""));
}

function isAsciiPrintable(value) {
  return /^[\x20-\x7E]*$/.test(String(value || ""));
}

function clean(value) {
  return String(value || "").trim();
}

function cleanLimited(value, maxLength) {
  const normalized = clean(value).replace(/[\u0000-\u001F\u007F]/g, " ");
  return normalized ? normalized.slice(0, maxLength) : null;
}

function normalizeEventType(value) {
  const normalized = clean(value);
  return [
    "menu_open", "session_start", "category_view", "dish_open", "dish_close",
    "search", "search_no_results", "language_change", "menu_exit",
  ].includes(normalized) ? normalized : "";
}

function normalizeDeviceType(value) {
  const normalized = clean(value).toLowerCase();
  return ["mobile", "tablet", "desktop"].includes(normalized) ? normalized : null;
}

function normalizeAnalyticsLanguage(value) {
  const normalized = clean(value).toLowerCase();
  if (normalized === "kz") return "kk";
  return ["ru", "kk", "en"].includes(normalized) ? normalized : null;
}

function isUuid(value) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(String(value || ""));
}

function startOfUtcDay(date) {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
}

function getRangeStart(range, todayStart, last7Start, last30Start) {
  if (range === "today") return todayStart;
  if (range === "30d") return last30Start;
  if (range === "all") return null;
  return last7Start;
}

function normalizeAnalyticsRange(range) {
  const value = String(range || "today").toLowerCase();
  if (value === "week") return "7d";
  if (value === "month") return "30d";
  if (value === "year") return "year";
  if (value === "today" || value === "7d" || value === "30d" || value === "all") return value;
  return "today";
}

function getRangeStartKey(range, todayKey, last7StartKey, last30StartKey, yearStartKey) {
  if (range === "today") return todayKey;
  if (range === "30d") return last30StartKey;
  if (range === "year") return yearStartKey;
  if (range === "all") return null;
  return last7StartKey;
}

function isWithin(value, from, to) {
  const time = new Date(value).getTime();
  return time >= from.getTime() && time < to.getTime();
}

function isWithinDateKeys(value, fromKey, toKey, timeZone) {
  const key = formatDateKeyInTimeZone(value, timeZone);
  if (fromKey && key < fromKey) return false;
  if (toKey && key >= toKey) return false;
  return true;
}

function withAnalyticsLocalTime(event, timeZone = DEFAULT_RESTAURANT_TIME_ZONE) {
  const parts = getTimeZoneParts(event.created_at, timeZone);
  return {
    ...event,
    localDateKey: `${parts.year}-${String(parts.month).padStart(2, "0")}-${String(parts.day).padStart(2, "0")}`,
    localHour: parts.hour,
    localMonth: parts.month,
    localYear: parts.year,
  };
}

function isEventWithinLocalDateRange(event, fromKey, toKey) {
  const key = event.localDateKey;
  if (!key) return false;
  if (fromKey && key < fromKey) return false;
  if (toKey && key >= toKey) return false;
  return true;
}

function isEventOnOrAfterLocalDate(event, fromKey) {
  if (!fromKey) return true;
  return Boolean(event.localDateKey && event.localDateKey >= fromKey);
}

function countEventsByLocalDateRange(events, eventType, fromKey, toKey) {
  return events.filter((event) => (
    event.event_type === eventType &&
    isEventWithinLocalDateRange(event, fromKey, toKey)
  )).length;
}

function countUniqueSessionsByLocalDateRange(events, fromKey, toKey) {
  return new Set(events
    .filter((event) => (
      event.event_type === "menu_open" &&
      event.session_id &&
      isEventWithinLocalDateRange(event, fromKey, toKey)
    ))
    .map((event) => event.session_id)).size;
}

function countEvents(events, eventType, from) {
  const fromTime = from.getTime();
  return events.filter((event) => event.event_type === eventType && new Date(event.created_at).getTime() >= fromTime).length;
}

function countEventsByDateRange(events, eventType, fromKey, toKey, timeZone) {
  return events.filter((event) => (
    event.event_type === eventType &&
    isWithinDateKeys(event.created_at, fromKey, toKey, timeZone)
  )).length;
}

function countUniqueSessions(events, from) {
  const fromTime = from ? from.getTime() : 0;
  return new Set(events
    .filter((event) => event.event_type === "menu_open" && event.session_id && new Date(event.created_at).getTime() >= fromTime)
    .map((event) => event.session_id)).size;
}

function countUniqueSessionsByDateRange(events, fromKey, toKey, timeZone) {
  return new Set(events
    .filter((event) => (
      event.event_type === "menu_open" &&
      event.session_id &&
      isWithinDateKeys(event.created_at, fromKey, toKey, timeZone)
    ))
    .map((event) => event.session_id)).size;
}

function countBy(rows, key) {
  return rows.reduce((acc, row) => {
    const value = row[key];
    if (!value) return acc;
    acc[value] = (acc[value] || 0) + 1;
    return acc;
  }, {});
}

function buildPercentRows(events, key, outputKey, format = (value) => value) {
  const counts = countBy(events.filter((event) => event[key]), key);
  const total = Object.values(counts).reduce((sum, count) => sum + count, 0);
  if (!total) return [];
  return Object.entries(counts)
    .map(([value, count]) => ({ [outputKey]: format(value), count, percent: Math.round((count / total) * 100) }))
    .sort((a, b) => b.count - a.count);
}

function buildVisitsByHour(menuOpenEvents, timeZone = DEFAULT_RESTAURANT_TIME_ZONE) {
  const hours = Array.from({ length: 24 }, (_, hour) => ({ hour, visits: 0 }));
  menuOpenEvents.forEach((event) => {
    const hour = Number.isInteger(event.localHour) ? event.localHour : getTimeZoneParts(event.created_at, timeZone).hour;
    hours[hour].visits += 1;
  });
  return hours;
}

function buildVisitsByDay(events, startKey, todayKey, timeZone = DEFAULT_RESTAURANT_TIME_ZONE) {
  return Array.from({ length: 7 }, (_, index) => {
    const dateKey = shiftDateKey(startKey, index);
    const nextKey = shiftDateKey(dateKey, 1);
    return {
      date: dateKey,
      label: formatWeekdayFromDateKey(dateKey),
      fullLabel: formatDateLabelFromDateKey(dateKey),
      visits: countEventsByLocalDateRange(events, "menu_open", dateKey, nextKey),
      isToday: dateKey === todayKey,
    };
  });
}

function buildVisitsByWeek(events, startKey, todayKey, timeZone = DEFAULT_RESTAURANT_TIME_ZONE) {
  const days = Array.from({ length: 30 }, (_, index) => {
    const dateKey = shiftDateKey(startKey, index);
    const nextKey = shiftDateKey(dateKey, 1);
    return {
      date: dateKey,
      label: formatWeekdayFromDateKey(dateKey),
      fullLabel: formatDateLabelFromDateKey(dateKey),
      shortLabel: dateKey.slice(8, 10),
      visits: countEventsByLocalDateRange(events, "menu_open", dateKey, nextKey),
      isToday: dateKey === todayKey,
    };
  });

  const weeks = [];
  for (let index = 0; index < days.length; index += 7) {
    weeks.push({
      weekLabel: `Неделя ${weeks.length + 1}`,
      days: days.slice(index, index + 7),
    });
  }
  return weeks;
}

function buildVisitsByMonth(events, year, timeZone = DEFAULT_RESTAURANT_TIME_ZONE) {
  const labels = ["Янв", "Фев", "Мар", "Апр", "Май", "Июн", "Июл", "Авг", "Сен", "Окт", "Ноя", "Дек"];
  return labels.map((label, index) => {
    const startKey = `${year}-${String(index + 1).padStart(2, "0")}-01`;
    const endKey = index === 11 ? `${year + 1}-01-01` : `${year}-${String(index + 2).padStart(2, "0")}-01`;
    return {
      month: index + 1,
      label,
      visits: countEventsByLocalDateRange(events, "menu_open", startKey, endKey),
    };
  });
}

function buildDayDetails(events, startKey, todayKey, timeZone = DEFAULT_RESTAURANT_TIME_ZONE) {
  const details = {};
  Array.from({ length: 30 }, (_, index) => {
    const dateKey = shiftDateKey(startKey, index);
    const nextKey = shiftDateKey(dateKey, 1);
    const dayEvents = events.filter((event) => (
      event.event_type === "menu_open" &&
      isEventWithinLocalDateRange(event, dateKey, nextKey)
    ));
    details[dateKey] = {
      date: dateKey,
      label: formatDateLabelFromDateKey(dateKey),
      hours: buildVisitsByHour(dayEvents, timeZone),
      isToday: dateKey === todayKey,
    };
  });
  return details;
}

function buildAllTimeSummary(events, timeZone = DEFAULT_RESTAURANT_TIME_ZONE) {
  const menuOpenEvents = events.filter((event) => event.event_type === "menu_open");
  const dishOpenEvents = events.filter((event) => event.event_type === "dish_open");
  const monthCounts = countBy(menuOpenEvents.map((event) => ({ month: getTimeZoneParts(event.created_at, timeZone).month })), "month");
  const busiestMonthEntry = Object.entries(monthCounts).sort((a, b) => b[1] - a[1])[0];
  const monthLabels = ["Янв", "Фев", "Мар", "Апр", "Май", "Июн", "Июл", "Авг", "Сен", "Окт", "Ноя", "Дек"];

  return {
    totalVisits: menuOpenEvents.length,
    totalUniqueGuests: new Set(menuOpenEvents.filter((event) => event.session_id).map((event) => event.session_id)).size,
    totalDishOpens: dishOpenEvents.length,
    busiestMonth: busiestMonthEntry ? monthLabels[Number(busiestMonthEntry[0]) - 1] : "Нет данных",
  };
}

function buildDishViewDurations(events) {
  const openEventsByKey = new Map();
  const durations = [];
  const chronological = [...events]
    .filter((event) => (
      (event.event_type === "dish_open" || event.event_type === "dish_close") &&
      event.menu_item_id &&
      event.session_id
    ))
    .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());

  chronological.forEach((event) => {
    const key = `${event.session_id}:${event.menu_item_id}`;
    if (event.event_type === "dish_open") {
      openEventsByKey.set(key, event);
      return;
    }

    const openEvent = openEventsByKey.get(key);
    if (!openEvent) return;
    openEventsByKey.delete(key);

    const durationMs = new Date(event.created_at).getTime() - new Date(openEvent.created_at).getTime();
    if (durationMs >= MIN_DISH_VIEW_MS && durationMs <= MAX_DISH_VIEW_MS) {
      durations.push(durationMs);
    }
  });

  return durations;
}

function formatAverageDishViewTime(durations) {
  if (!durations.length) return null;

  const seconds = Math.round(durations.reduce((sum, value) => sum + value, 0) / durations.length / 1000);
  if (seconds < 60) return `${seconds} сек`;

  const minutes = Math.floor(seconds / 60);
  const restSeconds = seconds % 60;
  return restSeconds ? `${minutes} мин ${restSeconds} сек` : `${minutes} мин`;
}

function buildRecentEvents(events, dishNames, timeZone = DEFAULT_RESTAURANT_TIME_ZONE) {
  return events.map((event) => {
    let label = "Открыли меню";
    if (event.event_type === "dish_open") label = `Открыли карточку ${dishNames[event.menu_item_id] || "блюда"}`;
    if (event.event_type === "language_change") label = `Сменили язык на ${String(event.language || "").toUpperCase() || "другой"}`;
    return {
      type: event.event_type,
      label,
      createdAt: event.created_at,
      displayTime: formatTimeInTimeZone(event.created_at, timeZone),
    };
  });
}

function getTimeZoneParts(value, timeZone = DEFAULT_RESTAURANT_TIME_ZONE) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hourCycle: "h23",
  }).formatToParts(new Date(value));
  const map = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  return {
    year: Number(map.year),
    month: Number(map.month),
    day: Number(map.day),
    hour: Number(map.hour),
    minute: Number(map.minute),
    second: Number(map.second),
  };
}

function formatDateKeyInTimeZone(value, timeZone = DEFAULT_RESTAURANT_TIME_ZONE) {
  const parts = getTimeZoneParts(value, timeZone);
  return `${parts.year}-${String(parts.month).padStart(2, "0")}-${String(parts.day).padStart(2, "0")}`;
}

function shiftDateKey(dateKey, offsetDays) {
  const [year, month, day] = String(dateKey).split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1, day + offsetDays));
  return date.toISOString().slice(0, 10);
}

function dateKeyToUtcDate(dateKey) {
  const [year, month, day] = String(dateKey).split("-").map(Number);
  return new Date(Date.UTC(year, month - 1, day));
}

function formatWeekdayFromDateKey(dateKey) {
  const date = dateKeyToUtcDate(dateKey);
  return ["Вс", "Пн", "Вт", "Ср", "Чт", "Пт", "Сб"][date.getUTCDay()];
}

function formatDateLabelFromDateKey(dateKey) {
  return new Intl.DateTimeFormat("ru-RU", { day: "2-digit", month: "long", timeZone: "UTC" }).format(dateKeyToUtcDate(dateKey));
}

function formatTimeInTimeZone(value, timeZone = DEFAULT_RESTAURANT_TIME_ZONE) {
  return new Intl.DateTimeFormat("ru-RU", {
    timeZone,
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).format(new Date(value));
}

function cleanOrNull(value) {
  const normalized = clean(value);
  return normalized || null;
}

function cleanIntegerOrNull(value) {
  const normalized = clean(value);
  if (!normalized) return null;
  const parsed = Number(normalized);
  if (!Number.isFinite(parsed) || parsed <= 0) return null;
  return Math.round(parsed);
}

function slugify(value) {
  return String(value || "item")
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80) || `item-${Date.now()}`;
}

function sanitizeSlug(value) {
  return String(value || DEFAULT_RESTAURANT_SLUG).toLowerCase().replace(/[^a-z0-9-]/g, "") || DEFAULT_RESTAURANT_SLUG;
}

function normalizeSupabaseUrl(env) {
  return String(env.SUPABASE_URL || "").trim().replace(/\/$/, "");
}

function bytesToHex(bytes) {
  return Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0")).join("");
}

function encodeBase64Url(bytes) {
  let binary = "";
  bytes.forEach((byte) => {
    binary += String.fromCharCode(byte);
  });
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

function decodeBase64Url(value) {
  const normalized = String(value).replace(/-/g, "+").replace(/_/g, "/");
  const padding = normalized.length % 4 ? "=".repeat(4 - (normalized.length % 4)) : "";
  const binary = atob(normalized + padding);
  const bytes = new Uint8Array(binary.length);

  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index);
  }

  return bytes;
}

function base64ToBytes(value) {
  const binary = atob(String(value || ""));
  const bytes = new Uint8Array(binary.length);

  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index);
  }

  return bytes;
}

function corsHeaders() {
  return {
    "Content-Type": "application/json; charset=utf-8",
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
  };
}

function jsonResponse(status, body) {
  return new Response(status === 204 ? null : JSON.stringify(body), {
    status,
    headers: corsHeaders(),
  });
}
