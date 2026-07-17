const DEFAULT_RESTAURANT_SLUG = "rkeeper-test";
const DEFAULT_SYNC_STATUS = {
  connectionStatus: "Не запускалось",
  lastSyncAt: null,
  receivedItems: 0,
  updatedItems: 0,
  lastError: null,
  lastMessage: "Тестовая синхронизация еще не запускалась.",
};

export async function onRequest(context) {
  const { request, env } = context;

  if (request.method === "OPTIONS") {
    return jsonResponse(204, null);
  }

  const configError = getConfigError(env);
  if (configError) {
    return jsonResponse(500, { error: configError });
  }

  try {
    const restaurantSlug = sanitizeSlug(
      new URL(request.url).searchParams.get("restaurant")
      || (await readJson(request)).restaurantSlug
      || DEFAULT_RESTAURANT_SLUG,
    );

    if (restaurantSlug !== DEFAULT_RESTAURANT_SLUG) {
      return jsonResponse(403, { error: "r_keeper test sync is available only for the rkeeper-test restaurant." });
    }

    const session = await verifySession(env, getBearerToken(request), restaurantSlug);
    if (!session) {
      return jsonResponse(401, { error: "Admin session expired. Sign in again." });
    }

    if (request.method === "GET") {
      const restaurant = await getRestaurant(env, restaurantSlug);
      const status = await getLatestSyncStatus(env, restaurant.id);
      return jsonResponse(200, { ok: true, status });
    }

    if (request.method !== "POST") {
      return jsonResponse(405, { error: "Method not allowed" });
    }

    const restaurant = await getRestaurant(env, restaurantSlug);
    const syncResult = await runRkeeperTestSync(env, restaurant);
    return jsonResponse(200, { ok: true, ...syncResult });
  } catch (error) {
    return jsonResponse(500, { error: error?.message || "Unexpected r_keeper sync error." });
  }
}

async function runRkeeperTestSync(env, restaurant) {
  const startedAt = new Date().toISOString();

  try {
    const remoteMenu = await fetchRkeeperMenu(env);
    const normalized = normalizeRkeeperMenu(remoteMenu);
    const synced = await saveRkeeperMenu(env, restaurant, normalized, startedAt);
    const status = {
      connectionStatus: "Подключено",
      lastSyncAt: startedAt,
      receivedItems: normalized.items.length,
      updatedItems: synced.updatedItems,
      lastError: null,
      lastMessage: "Синхронизация r_keeper выполнена успешно.",
    };

    await insertSyncRun(env, {
      restaurant_id: restaurant.id,
      status: "success",
      received_items: normalized.items.length,
      updated_items: synced.updatedItems,
      connection_status: "connected",
      last_error: null,
      raw_payload: remoteMenu,
    });

    return {
      status,
      categories: synced.categories,
      items: synced.items,
    };
  } catch (error) {
    const status = {
      ...DEFAULT_SYNC_STATUS,
      connectionStatus: "Ошибка",
      lastSyncAt: startedAt,
      lastError: error?.message || "Неизвестная ошибка",
      lastMessage: "Синхронизация r_keeper завершилась ошибкой.",
    };

    await insertSyncRun(env, {
      restaurant_id: restaurant.id,
      status: "error",
      received_items: 0,
      updated_items: 0,
      connection_status: "error",
      last_error: status.lastError,
      raw_payload: { error: status.lastError },
    }).catch(() => {});

    throw new Error(status.lastError);
  }
}

async function fetchRkeeperMenu(env) {
  const baseUrl = String(env.RKEEPER_WHITE_SERVER_BASE_URL || "").trim().replace(/\/$/, "");
  const menuPath = String(env.RKEEPER_WHITE_SERVER_MENU_PATH || "/api/v2/menu").trim();
  const token = String(env.RKEEPER_WHITE_SERVER_TOKEN || "").trim();
  const restaurantCode = String(env.RKEEPER_WHITE_SERVER_RESTAURANT_CODE || "").trim();

  const response = await fetch(`${baseUrl}${menuPath}`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      restaurantCode,
    }),
  });

  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(payload?.error || `White Server API v2 request failed with ${response.status}.`);
  }

  return payload;
}

function normalizeRkeeperMenu(payload) {
  const categoriesSource = payload?.categories || payload?.menu?.categories || payload?.result?.categories || [];
  const dishesSource = payload?.items || payload?.dishes || payload?.menu?.items || payload?.result?.items || payload?.result?.dishes || [];

  const categories = categoriesSource.map((category, index) => ({
    external_id: String(category.id || category.code || category.categoryId || `category-${index + 1}`),
    name_ru: clean(category.name || category.title || category.title_ru || category.name_ru || `Категория ${index + 1}`),
    sort_order: Number(category.sort_order || category.sortOrder || (index + 1) * 10),
    is_active: category.is_active !== false,
  }));

  const items = dishesSource.map((item, index) => ({
    external_id: String(item.id || item.code || item.itemId || item.productCode || `item-${index + 1}`),
    category_external_id: String(item.category_id || item.categoryCode || item.parentId || categories[0]?.external_id || ""),
    content_key: slugify(item.code || item.sku || item.id || item.name || `rkeeper-item-${index + 1}`),
    title_ru: clean(item.name || item.title || item.title_ru || `Блюдо ${index + 1}`),
    price: normalizePrice(item.price || item.amount || item.cost),
    is_stoplisted: item.is_stoplisted === true || item.available === false || item.in_stock === false,
    is_active: item.is_active !== false,
    payload: item,
  })).filter((item) => item.external_id && item.title_ru);

  return { categories, items };
}

async function saveRkeeperMenu(env, restaurant, menu, syncedAt) {
  const existingCategories = await supabaseRest(env, "menu_categories", {
    query: {
      select: "*",
      restaurant_id: `eq.${restaurant.id}`,
      source_system: "eq.rkeeper",
    },
  });
  const existingItems = await supabaseRest(env, "menu_items", {
    query: {
      select: "*",
      restaurant_id: `eq.${restaurant.id}`,
      source_system: "eq.rkeeper",
    },
  });

  const categoryByExternalId = new Map(existingCategories.map((row) => [String(row.external_id), row]));
  const itemByExternalId = new Map(existingItems.map((row) => [String(row.external_id), row]));
  const syncedCategories = [];
  let updatedItems = 0;

  for (const category of menu.categories) {
    const existing = categoryByExternalId.get(category.external_id);
    const payload = {
      restaurant_id: restaurant.id,
      name_ru: category.name_ru,
      title_ru: category.name_ru,
      sort_order: category.sort_order,
      is_active: category.is_active,
      source_system: "rkeeper",
      external_id: category.external_id,
      sync_metadata: {
        source: "rkeeper",
        synced_at: syncedAt,
      },
    };

    const rows = await supabaseRest(env, "menu_categories", {
      method: existing ? "PATCH" : "POST",
      query: existing
        ? { id: `eq.${existing.id}`, restaurant_id: `eq.${restaurant.id}`, select: "*" }
        : { select: "*" },
      body: existing ? payload : [payload],
      prefer: "return=representation",
    });

    const saved = rows[0];
    categoryByExternalId.set(category.external_id, saved);
    syncedCategories.push(saved);
  }

  for (const item of menu.items) {
    const existing = itemByExternalId.get(item.external_id);
    const category = categoryByExternalId.get(item.category_external_id);
    const payload = {
      restaurant_id: restaurant.id,
      category_id: category?.id || existing?.category_id || null,
      content_key: existing?.content_key || item.content_key,
      title_ru: existing?.title_ru || item.title_ru,
      name_ru: existing?.name_ru || item.title_ru,
      title_en: existing?.title_en || null,
      title_kk: existing?.title_kk || null,
      name_en: existing?.name_en || null,
      name_kz: existing?.name_kz || null,
      description_ru: existing?.description_ru || null,
      description_kk: existing?.description_kk || null,
      description_kz: existing?.description_kz || null,
      description_en: existing?.description_en || null,
      image_url: existing?.image_url || null,
      image_path: existing?.image_path || null,
      price: item.price,
      currency: existing?.currency || "KZT",
      is_active: item.is_active,
      is_stoplisted: item.is_stoplisted,
      source_system: "rkeeper",
      external_id: item.external_id,
      rkeeper_synced_at: syncedAt,
      sync_metadata: item.payload,
      version: Number(existing?.version || 0) + 1,
    };

    const rows = await supabaseRest(env, "menu_items", {
      method: existing ? "PATCH" : "POST",
      query: existing
        ? { id: `eq.${existing.id}`, restaurant_id: `eq.${restaurant.id}`, select: "*" }
        : { select: "*" },
      body: existing ? payload : [payload],
      prefer: "return=representation",
    });

    updatedItems += 1;
    itemByExternalId.set(item.external_id, rows[0]);
  }

  const items = await supabaseRest(env, "menu_items", {
    query: {
      select: "*",
      restaurant_id: `eq.${restaurant.id}`,
      order: "sort_order.asc",
    },
  });

  return {
    updatedItems,
    categories: syncedCategories,
    items,
  };
}

async function getLatestSyncStatus(env, restaurantId) {
  const rows = await supabaseRest(env, "rkeeper_sync_runs", {
    query: {
      select: "*",
      restaurant_id: `eq.${restaurantId}`,
      order: "created_at.desc",
      limit: "1",
    },
  }).catch(() => []);

  const latest = rows[0];
  if (!latest) return DEFAULT_SYNC_STATUS;

  return {
    connectionStatus: latest.connection_status === "connected" ? "Подключено" : latest.connection_status === "error" ? "Ошибка" : "Не настроено",
    lastSyncAt: latest.created_at || null,
    receivedItems: Number(latest.received_items || 0),
    updatedItems: Number(latest.updated_items || 0),
    lastError: latest.last_error || null,
    lastMessage: latest.status === "success" ? "Последняя тестовая синхронизация выполнена успешно." : "Последняя синхронизация завершилась ошибкой.",
  };
}

async function insertSyncRun(env, row) {
  await supabaseRest(env, "rkeeper_sync_runs", {
    method: "POST",
    body: [row],
    prefer: "return=minimal",
  });
}

async function getRestaurant(env, slug) {
  const rows = await supabaseRest(env, "restaurants", {
    query: {
      select: "*",
      slug: `eq.${slug}`,
      limit: "1",
    },
  });

  if (!rows[0]) throw new Error(`Restaurant "${slug}" was not found.`);
  return rows[0];
}

async function supabaseRest(env, table, { method = "GET", query = {}, body, prefer = "" } = {}) {
  const url = new URL(`${normalizeSupabaseUrl(env)}/rest/v1/${table}`);
  Object.entries(query).forEach(([key, value]) => url.searchParams.set(key, value));

  const headers = {
    apikey: String(env.SUPABASE_SERVICE_ROLE_KEY || "").trim(),
    Authorization: `Bearer ${String(env.SUPABASE_SERVICE_ROLE_KEY || "").trim()}`,
    "Content-Type": "application/json",
  };
  if (prefer) headers.Prefer = prefer;

  const response = await fetch(url.toString(), {
    method,
    headers,
    body: body === undefined ? undefined : JSON.stringify(body),
  });

  if (!response.ok) {
    throw new Error(`Supabase ${table} ${method} failed: ${await response.text()}`);
  }

  if (response.status === 204) return [];
  const text = await response.text();
  return text ? JSON.parse(text) : [];
}

function getConfigError(env) {
  if (!String(env.SUPABASE_URL || "").trim()) return "SUPABASE_URL is missing.";
  if (!String(env.SUPABASE_SERVICE_ROLE_KEY || "").trim()) return "SUPABASE_SERVICE_ROLE_KEY is missing.";
  if (!String(env.EXORT_ADMIN_SESSION_SECRET || "").trim()) return "EXORT_ADMIN_SESSION_SECRET is missing.";
  if (!String(env.RKEEPER_WHITE_SERVER_BASE_URL || "").trim()) return "RKEEPER_WHITE_SERVER_BASE_URL is missing.";
  if (!String(env.RKEEPER_WHITE_SERVER_TOKEN || "").trim()) return "RKEEPER_WHITE_SERVER_TOKEN is missing.";
  if (!String(env.RKEEPER_WHITE_SERVER_RESTAURANT_CODE || "").trim()) return "RKEEPER_WHITE_SERVER_RESTAURANT_CODE is missing.";
  return "";
}

async function readJson(request) {
  if (request.method === "GET" || request.method === "HEAD") return {};
  return request.json().catch(() => ({}));
}

function getBearerToken(request) {
  const header = request.headers.get("Authorization") || "";
  return header.startsWith("Bearer ") ? header.slice(7).trim() : "";
}

async function verifySession(env, token, slug) {
  const parts = String(token || "").split(".");
  if (parts.length !== 2) return null;

  const [encoded, signature] = parts;
  const expected = await hmac(env, encoded);
  if (signature !== expected) return null;

  const payload = JSON.parse(new TextDecoder().decode(decodeBase64Url(encoded)));
  if (payload.exp < Math.floor(Date.now() / 1000)) return null;
  if (payload.slug !== slug) return null;
  return payload;
}

async function hmac(env, value) {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(String(env.EXORT_ADMIN_SESSION_SECRET || "").trim()),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const signature = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(String(value)));
  return encodeBase64Url(new Uint8Array(signature));
}

function encodeBase64Url(bytes) {
  let binary = "";
  bytes.forEach((byte) => {
    binary += String.fromCharCode(byte);
  });
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

function decodeBase64Url(value) {
  const normalized = String(value || "").replace(/-/g, "+").replace(/_/g, "/");
  const padding = normalized.length % 4 ? "=".repeat(4 - (normalized.length % 4)) : "";
  const binary = atob(normalized + padding);
  const bytes = new Uint8Array(binary.length);

  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index);
  }

  return bytes;
}

function normalizeSupabaseUrl(env) {
  return String(env.SUPABASE_URL || "").trim().replace(/\/$/, "");
}

function sanitizeSlug(value) {
  return String(value || DEFAULT_RESTAURANT_SLUG).toLowerCase().replace(/[^a-z0-9-]/g, "") || DEFAULT_RESTAURANT_SLUG;
}

function clean(value) {
  return String(value || "").trim();
}

function normalizePrice(value) {
  const parsed = Number(value || 0);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : 0;
}

function slugify(value) {
  return String(value || "rkeeper-item")
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80) || `rkeeper-item-${Date.now()}`;
}

function jsonResponse(status, body) {
  return new Response(status === 204 ? null : JSON.stringify(body), {
    status,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Headers": "Content-Type, Authorization",
      "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    },
  });
}
