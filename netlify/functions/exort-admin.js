 const crypto = require("crypto");

const SUPABASE_URL = (process.env.SUPABASE_URL || "").trim().replace(/\/$/, "");
const SUPABASE_SERVICE_ROLE_KEY = (process.env.SUPABASE_SERVICE_ROLE_KEY || "").trim();
const SERVICE_KEY = SUPABASE_SERVICE_ROLE_KEY;
const SESSION_SECRET = (process.env.EXORT_ADMIN_SESSION_SECRET || "").trim();
const BUCKET = "restaurant-assets";
const SESSION_TTL_SECONDS = 60 * 60 * 8;

exports.handler = async (event) => {
  if (event.httpMethod === "OPTIONS") return response(204, {});
  if (event.httpMethod !== "POST") return response(405, { error: "????? ?? ??????????????" });

  const configError = getConfigError();
  if (configError) return response(500, { error: configError });

  try {
    const body = JSON.parse(event.body || "{}");
    const action = body.action;
    const restaurantSlug = sanitizeSlug(body.restaurantSlug || "exort-demo");

    if (action === "login") return login(restaurantSlug, body.pin);

    const session = verifySession(body.sessionToken, restaurantSlug);
    if (!session) return response(401, { error: "?????? ?????????????? ???????. ??????? ?????." });

    if (action === "getData") return getData(restaurantSlug);
    if (action === "translate" || action === "translateMissing") return translate(action, body);
    if (action === "saveItem") return saveItem(restaurantSlug, body.item);
    if (action === "deleteItem") return deleteItem(restaurantSlug, body.itemId);
    if (action === "toggleStock") return toggleStock(restaurantSlug, body.itemId, body.is_stoplisted);
    if (action === "uploadItemPhoto") return uploadItemPhoto(restaurantSlug, body.itemId, body.imageData);
    if (action === "saveCategory") return saveCategory(restaurantSlug, body.category);
    if (action === "sortCategories") return sortCategories(restaurantSlug, body.categories || []);

    return response(400, { error: "??????????? ???????? ???????." });
  } catch (error) {
    console.error("[exort-admin]", error);
    return response(500, { error: error.message || "?????????????? ?????? ????????? ????? ???????." });
  }
};

async function login(slug, pin) {
  const restaurant = await getRestaurant(slug);
  const accessRows = await supabaseRest("restaurant_admin_access", {
    query: {
      select: "id,restaurant_id,pin_hash,is_active",
      restaurant_id: `eq.${restaurant.id}`,
      is_active: "eq.true",
      limit: "1",
    },
  });

  const access = accessRows[0];
  if (!access) return response(403, { error: "PIN-?????? ??? ????? ????????? ??? ?? ????????." });

  const valid = verifyPin(pin, access.pin_hash);
  if (!valid) return response(401, { error: "???????? PIN." });

  const token = signSession({ restaurant_id: restaurant.id, slug: restaurant.slug, exp: Math.floor(Date.now() / 1000) + SESSION_TTL_SECONDS });
  const data = await buildAdminData(restaurant);
  return response(200, { sessionToken: token, ...data });
}

async function getData(slug) {
  const restaurant = await getRestaurant(slug);
  return response(200, await buildAdminData(restaurant));
}

async function buildAdminData(restaurant) {
  const [categories, items] = await Promise.all([
    supabaseRest("menu_categories", {
      query: {
        select: "*",
        restaurant_id: `eq.${restaurant.id}`,
        order: "sort_order.asc",
      },
    }),
    supabaseRest("menu_items", {
      query: {
        select: "*",
        restaurant_id: `eq.${restaurant.id}`,
        order: "sort_order.asc",
      },
    }),
  ]);

  return { restaurant, categories, items };
}

async function saveItem(slug, item) {
  const restaurant = await getRestaurant(slug);
  if (!item || !String(item.name_ru || "").trim()) throw new Error("??????? ???????? ????? ???????????.");

  let imageData = {};
  const current = item.id ? await getOwnedRow("menu_items", restaurant.id, item.id) : null;
  if (item.imageData && String(item.imageData).startsWith("data:image/")) {
    imageData = await uploadImage(slug, `menu-items/${slugify(item.name_ru || item.content_key || "dish")}-${Date.now()}.webp`, item.imageData);
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

  const rows = await supabaseRest("menu_items", {
    method: current ? "PATCH" : "POST",
    query: current ? { id: `eq.${item.id}`, restaurant_id: `eq.${restaurant.id}`, select: "*" } : { select: "*" },
    body: current ? payload : [payload],
    prefer: "return=representation",
  });

  return response(200, { item: Array.isArray(rows) ? rows[0] : rows });
}

async function deleteItem(slug, itemId) {
  const restaurant = await getRestaurant(slug);
  await getOwnedRow("menu_items", restaurant.id, itemId);
  await supabaseRest("menu_items", {
    method: "DELETE",
    query: { id: `eq.${itemId}`, restaurant_id: `eq.${restaurant.id}` },
  });
  return response(200, { ok: true });
}

async function toggleStock(slug, itemId, isStoplisted) {
  const restaurant = await getRestaurant(slug);
  const current = await getOwnedRow("menu_items", restaurant.id, itemId);
  const rows = await supabaseRest("menu_items", {
    method: "PATCH",
    query: { id: `eq.${itemId}`, restaurant_id: `eq.${restaurant.id}`, select: "*" },
    body: {
      is_stoplisted: isStoplisted === true,
      version: Number(current.version || 0) + 1,
    },
    prefer: "return=representation",
  });
  return response(200, { item: rows[0] });
}

async function uploadItemPhoto(slug, itemId, imageData) {
  const restaurant = await getRestaurant(slug);
  const current = await getOwnedRow("menu_items", restaurant.id, itemId);
  const image = await uploadImage(slug, `menu-items/${slugify(current.content_key || current.name_ru || "dish")}-${Date.now()}.webp`, imageData);
  const rows = await supabaseRest("menu_items", {
    method: "PATCH",
    query: { id: `eq.${itemId}`, restaurant_id: `eq.${restaurant.id}`, select: "*" },
    body: { ...image, version: Number(current.version || 0) + 1 },
    prefer: "return=representation",
  });
  return response(200, { item: rows[0] });
}

async function saveCategory(slug, category) {
  const restaurant = await getRestaurant(slug);
  if (!category || !String(category.name_ru || category.name || "").trim()) throw new Error("??????? ???????? ????????? ???????????.");
  const current = category.id ? await getOwnedRow("menu_categories", restaurant.id, category.id) : null;
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

  const rows = await supabaseRest("menu_categories", {
    method: current ? "PATCH" : "POST",
    query: current ? { id: `eq.${category.id}`, restaurant_id: `eq.${restaurant.id}`, select: "*" } : { select: "*" },
    body: current ? payload : [payload],
    prefer: "return=representation",
  });
  return response(200, { category: rows[0] });
}

async function sortCategories(slug, categories) {
  const restaurant = await getRestaurant(slug);
  for (const category of categories) {
    if (!category.id) continue;
    await supabaseRest("menu_categories", {
      method: "PATCH",
      query: { id: `eq.${category.id}`, restaurant_id: `eq.${restaurant.id}` },
      body: { sort_order: Number(category.sort_order || 0) },
    });
  }
  return getData(slug);
}

async function translate(action, body) {
  if (!process.env.EXORT_TRANSLATE_API_URL) {
    return response(503, { error: "?????? ???????????? ???? ?? ????????. ???????? EXORT_TRANSLATE_API_URL, ????? ???????? ???????????." });
  }

  const upstream = await fetch(process.env.EXORT_TRANSLATE_API_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ action, ...body }),
  });
  const data = await upstream.json().catch(() => ({}));
  return response(upstream.status, data);
}

async function getRestaurant(slug) {
  const rows = await supabaseRest("restaurants", {
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

async function getOwnedRow(table, restaurantId, id) {
  const rows = await supabaseRest(table, {
    query: { select: "*", id: `eq.${id}`, restaurant_id: `eq.${restaurantId}`, limit: "1" },
  });
  if (!rows[0]) throw new Error("Record was not found for this restaurant.");
  return rows[0];
}

async function uploadImage(slug, filename, dataUrl) {
  const match = String(dataUrl || "").match(/^data:(image\/[a-zA-Z0-9.+-]+);base64,(.+)$/);
  if (!match) throw new Error("Invalid image payload.");
  const contentType = "image/webp";
  const buffer = Buffer.from(match[2], "base64");
  if (buffer.length > 10 * 1024 * 1024) throw new Error("Image is larger than 10 MB.");

  const path = `${slug}/${filename}`;
  const upload = await fetch(`${SUPABASE_URL}/storage/v1/object/${BUCKET}/${path}`, {
    method: "POST",
    headers: createSupabaseHeaders({
      "Content-Type": contentType,
      "x-upsert": "true",
    }),
    body: buffer,
  });
  if (!upload.ok) throw new Error(`Image upload failed: ${await upload.text()}`);

  return {
    image_url: `${SUPABASE_URL}/storage/v1/object/public/${BUCKET}/${path}`,
    image_path: path,
  };
}

async function supabaseRest(table, { method = "GET", query = {}, body, prefer = "" } = {}) {
  const url = new URL(`${SUPABASE_URL}/rest/v1/${table}`);
  Object.entries(query).forEach(([key, value]) => url.searchParams.set(key, value));
  const headers = createSupabaseHeaders({
    "Content-Type": "application/json",
  });
  if (prefer) {
    assertHeaderValue("Prefer", prefer);
    headers.Prefer = prefer;
  }

  const result = await fetch(url, {
    method,
    headers,
    body: body === undefined ? undefined : JSON.stringify(body),
  });

  if (!result.ok) throw new Error(`Supabase ${table} ${method} failed: ${await result.text()}`);
  if (result.status === 204) return [];
  const text = await result.text();
  return text ? JSON.parse(text) : [];
}

function getConfigError() {
  if (!SUPABASE_URL) return "Admin backend is not configured: SUPABASE_URL is missing.";
  if (!isAsciiPrintable(SUPABASE_URL)) return "Admin backend is not configured: SUPABASE_URL contains non-ASCII characters.";

  try {
    const parsedUrl = new URL(SUPABASE_URL);
    if (!["https:", "http:"].includes(parsedUrl.protocol)) {
      return "Admin backend is not configured: SUPABASE_URL must start with https:// or http://.";
    }
  } catch {
    return "Admin backend is not configured: SUPABASE_URL is not a valid URL.";
  }

  if (!SUPABASE_SERVICE_ROLE_KEY) return "Admin backend is not configured: SUPABASE_SERVICE_ROLE_KEY is missing.";
  if (!isAsciiToken(SUPABASE_SERVICE_ROLE_KEY)) {
    return "Admin backend is not configured: SUPABASE_SERVICE_ROLE_KEY contains spaces or non-ASCII characters.";
  }

  if (!SESSION_SECRET) return "Admin backend is not configured: EXORT_ADMIN_SESSION_SECRET is missing.";
  if (!isAsciiPrintable(SESSION_SECRET)) {
    return "Admin backend is not configured: EXORT_ADMIN_SESSION_SECRET contains non-ASCII characters.";
  }

  return "";
}

function createSupabaseHeaders(extraHeaders = {}) {
  const headers = {
    apikey: SUPABASE_SERVICE_ROLE_KEY,
    Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
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

function verifyPin(pin, pinHash) {
  const value = String(pin || "");
  const stored = String(pinHash || "");
  if (!value || !stored) return false;

  if (stored.startsWith("sha256:")) {
    return safeEqual(stored.slice(7), sha256(value));
  }

  // Legacy demo seed support. Production must store a backend-generated hash,
  // preferably bcrypt/argon2 or at least a salted hash, never a plain PIN.
  if (stored === "demo_hash_1234" && process.env.EXORT_ALLOW_LEGACY_DEMO_PIN !== "false") {
    return value === "1234";
  }

  return false;
}

function signSession(payload) {
  const encoded = base64url(JSON.stringify(payload));
  const signature = hmac(encoded);
  return `${encoded}.${signature}`;
}

function verifySession(token, slug) {
  const [encoded, signature] = String(token || "").split(".");
  if (!encoded || !signature || !safeEqual(signature, hmac(encoded))) return null;
  const payload = JSON.parse(Buffer.from(fromBase64url(encoded), "base64").toString("utf8"));
  if (payload.exp < Math.floor(Date.now() / 1000)) return null;
  if (payload.slug !== slug) return null;
  return payload;
}

function sha256(value) {
  return crypto.createHash("sha256").update(String(value)).digest("hex");
}

function hmac(value) {
  return toBase64url(crypto.createHmac("sha256", SESSION_SECRET).update(value).digest("base64"));
}

function safeEqual(left, right) {
  const a = Buffer.from(String(left));
  const b = Buffer.from(String(right));
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}

function base64url(value) {
  return toBase64url(Buffer.from(value).toString("base64"));
}

function toBase64url(value) {
  return String(value).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

function fromBase64url(value) {
  const normalized = String(value).replace(/-/g, "+").replace(/_/g, "/");
  const padding = normalized.length % 4 ? "=".repeat(4 - (normalized.length % 4)) : "";
  return normalized + padding;
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
  return String(value || "exort-demo").toLowerCase().replace(/[^a-z0-9-]/g, "") || "exort-demo";
}

function response(statusCode, body) {
  return {
    statusCode,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Headers": "Content-Type",
      "Access-Control-Allow-Methods": "POST, OPTIONS",
    },
    body: statusCode === 204 ? "" : JSON.stringify(body),
  };
}
