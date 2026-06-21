const BUCKET = "restaurant-assets";
const SESSION_TTL_SECONDS = 60 * 60 * 8;
const DEFAULT_RESTAURANT_SLUG = "exort-demo";

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
