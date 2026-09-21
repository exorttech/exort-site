/* Frontend contract tests. No network requests and no production writes. */
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

class Element {
  constructor() {
    this.dataset = {};
    this.attributes = {};
    this.textContent = "";
    this.disabled = false;
    this.value = "";
    this.open = false;
    const classes = new Set();
    this.classList = {
      add: (c) => classes.add(c),
      remove: (c) => classes.delete(c),
      contains: (c) => classes.has(c),
      toggle: () => {},
    };
    this.elements = { pin: { value: "", focus() {} } };
  }
  setAttribute(k, v) {
    this.attributes[k] = v;
  }
  removeAttribute(k) {
    delete this.attributes[k];
  }
  addEventListener() {}
  append() {}
  remove() {}
  focus() {}
  close() {
    this.open = false;
  }
  querySelectorAll() {
    return [];
  }
  querySelector() {
    return null;
  }
}
class Form extends Element {
  constructor(values, type = "", id = "") {
    super();
    this.dataset = { type, id };
    this.values = values;
    this.controls = [...new Set(Object.keys(values))].map((name) =>
      Object.assign(new Element(), { name, value: values[name] }),
    );
    this.elements.namedItem = (name) =>
      this.controls.find((el) => el.name === name);
    this.button = new Element();
    this.button.textContent = "Сохранить";
    this.errors = new Map();
  }
  querySelector(selector) {
    if (selector === ".invalid")
      return (
        this.controls.find((el) => el.classList.contains("invalid")) || null
      );
    if (selector.startsWith("#error-")) {
      if (!this.errors.has(selector)) this.errors.set(selector, new Element());
      return this.errors.get(selector);
    }
    if (selector.includes("button")) return this.button;
    return null;
  }
  querySelectorAll(selector) {
    if (selector === ".invalid")
      return this.controls.filter((el) => el.classList.contains("invalid"));
    if (selector === ".form-error") return [...this.errors.values()];
    return [...this.controls, this.button];
  }
}
class TestFormData {
  constructor(form) {
    this.entries = Object.entries(form.values)
      .filter(([key]) => !form.elements.namedItem(key)?.disabled)
      .flatMap(([key, value]) =>
        (Array.isArray(value) ? value : [value]).map((v) => [key, v]),
      );
  }
  [Symbol.iterator]() {
    return this.entries[Symbol.iterator]();
  }
  getAll(key) {
    return this.entries.filter(([k]) => k === key).map(([, v]) => v);
  }
}

async function run() {
  const nodes = new Map();
  const node = (key) => {
    if (!nodes.has(key)) nodes.set(key, new Element());
    return nodes.get(key);
  };
  const calls = [];
  const responses = [];
  const document = {
    querySelector: node,
    querySelectorAll: () => [],
    addEventListener() {},
    createElement: () => new Element(),
    body: new Element(),
  };
  const context = vm.createContext({
    document,
    URL,
    URLSearchParams,
    Intl,
    Date,
    Set,
    Map,
    Object,
    Number,
    String,
    Array,
    Promise,
    Error,
    AbortController,
    FormData: TestFormData,
    innerWidth: 1440,
    location: {
      hostname: "localhost",
      search: "?restaurant=demo-unit",
      hash: "",
      href: "http://localhost/pages/admin-v2.html",
    },
    sessionStorage: { getItem: () => "", setItem() {}, removeItem() {} },
    setTimeout: (fn, ms) => {
      const id = setTimeout(fn, ms);
      id.unref();
      return id;
    },
    clearTimeout,
    window: { addEventListener() {} },
    CSS: { escape: (x) => x },
    history: {},
    fetch: async (url, options) => {
      calls.push({ url, body: JSON.parse(options.body) });
      const response = responses.shift() || { status: 200, body: {} };
      return {
        ok: response.status < 400,
        status: response.status,
        json: async () => response.body,
      };
    },
  });
  const code = fs.readFileSync(
    path.join(__dirname, "../js/admin-v2.js"),
    "utf8",
  );
  const html = fs.readFileSync(
    path.join(__dirname, "../pages/admin-v2.html"),
    "utf8",
  );
  const redirects = fs.readFileSync(
    path.join(__dirname, "../_redirects"),
    "utf8",
  );
  assert(
    code.includes("  init();"),
    "Expected frontend initialization entry point",
  );
  assert.match(html, /id="admin-protected" hidden/);
  assert.match(code, /protectedRoot\.remove\(\)/);
  assert.match(code, /https:\/\/exort\.kz\/demo-menu\?restaurant=/);
  assert.match(redirects, /^\/demo-admin \/pages\/admin-v2\.html 200$/m);
  for (const action of [
    "login", "getData", "saveItem", "deleteItem", "toggleStock",
    "saveCategory", "sortCategories", "splitCategory", "deleteCategory",
    "getAnalytics", "getQrSources", "createQrSource", "deleteQrSource",
  ]) {
    assert.match(code, new RegExp(`api\\(\\"${action}\\"`), `Admin V2 must call ${action}`);
  }
  vm.runInContext(
    code.replace(
      "  init();",
      "Object.assign(globalThis, { testApi: api, testState: state, testFilter: filtered, testSave: saveItem, testUtility: saveUtility, testEscape: esc, testStock: toggleStock });",
    ),
    context,
  );
  const s = context.testState;
  s.token = "test-session";
  await context.testApi("getData");
  assert.equal(calls[0].url, "https://exort.kz/api/exort-admin");
  assert.equal(calls[0].body.restaurantSlug, "demo-unit");
  assert.equal(calls[0].body.sessionToken, "test-session");
  assert.equal(
    context.testEscape('<img onerror="x">'),
    "&lt;img onerror=&quot;x&quot;&gt;",
  );

  s.categories = [
    { id: "c1", name_ru: "Супы" },
    { id: "c2", name_ru: "Напитки" },
  ];
  s.items = [
    {
      id: "a",
      category_id: "c1",
      name_ru: "Суп",
      name_kz: "Сорпа",
      name_en: "Soup",
      is_active: true,
      image_url: "image.webp",
    },
    {
      id: "b",
      category_id: "c2",
      name_ru: "Чай",
      is_active: false,
      is_stoplisted: true,
    },
    { id: "hero", content_key: "menu-hero" },
  ];
  s.view = "menu";
  assert.equal(context.testFilter().length, 2);
  s.query = "СОРПА";
  assert.equal(context.testFilter()[0].id, "a");
  s.query = "";
  s.category = "c2";
  assert.equal(context.testFilter()[0].id, "b");
  s.category = "all";
  s.status = "hidden";
  assert.equal(context.testFilter()[0].id, "b");
  s.status = "all";
  s.stock = "stop";
  assert.equal(context.testFilter()[0].id, "b");
  s.stock = "all";
  s.issue = "photo";
  assert.equal(context.testFilter()[0].id, "b");
  s.issue = "translation";
  assert.equal(context.testFilter()[0].id, "b");
  s.issue = "";
  s.view = "stoplist";
  assert.equal(context.testFilter().length, 1);
  s.view = "menu";

  const itemValues = {
    name_ru: "",
    name_kz: "",
    name_en: "",
    category_id: "",
    price: "-1",
    old_price: "",
    calories: "",
    sort_order: "0",
    currency: "KZT",
    is_active: "on",
    description_ru: "",
    description_kz: "",
    description_en: "",
  };
  const invalid = new Form(itemValues);
  const beforeInvalid = calls.length;
  await context.testSave(invalid);
  assert.equal(
    calls.length,
    beforeInvalid,
    "Invalid form must not make a write request",
  );
  assert(invalid.elements.namedItem("name_ru").classList.contains("invalid"));
  assert(invalid.elements.namedItem("price").classList.contains("invalid"));

  s.editorItem = { id: "a" };
  s.image = "old.webp";
  s.imageData = "data:image/webp;base64,TEST";
  const valid = new Form({
    ...itemValues,
    name_ru: "Суп",
    name_kz: "Сорпа",
    name_en: "Soup",
    category_id: "c1",
    price: "123.45",
    is_stoplisted: "on",
  });
  responses.push({
    status: 200,
    body: { item: { id: "a", name_ru: "Суп", price: 123.45 } },
  });
  await context.testSave(valid);
  const save = calls.at(-1).body;
  assert.equal(save.action, "saveItem");
  assert.equal(save.item.price, 123.45);
  assert.equal(save.item.is_active, true);
  assert.equal(save.item.is_stoplisted, true);
  assert.equal(save.item.old_price, null);
  assert.equal(save.item.imageData, "data:image/webp;base64,TEST");
  assert.equal(valid.button.disabled, false);

  s.dirty = true;
  responses.push({ status: 500, body: { error: "Service unavailable" } });
  await context.testSave(valid);
  assert.equal(s.dirty, true, "Failed save must keep the draft dirty");
  assert(node("#item-save-error").textContent);
  assert.equal(s.busy, false);

  const splitForm = new Form(
    { name_ru: "Новая", name_kz: "Жаңа", name_en: "New", itemIds: ["a", "b"] },
    "category-split",
    "c1",
  );
  responses.push({
    status: 200,
    body: { categories: [], items: [], restaurant: { name: "Unit test" } },
  });
  await context.testUtility(splitForm);
  assert.deepEqual(
    calls.at(-1).body.itemIds,
    ["a", "b"],
    "Selected dishes must survive controls becoming disabled during save",
  );
  assert.equal(calls.at(-1).body.action, "splitCategory");
  assert.equal(calls.at(-1).body.categoryId, "c1");

  s.items = [{ id: "stock-item", is_stoplisted: false }];
  responses.push({
    status: 200,
    body: { item: { id: "stock-item", is_stoplisted: true } },
  });
  await context.testStock("stock-item");
  assert.equal(calls.at(-1).body.action, "toggleStock");
  assert.equal(calls.at(-1).body.is_stoplisted, true);
  assert.equal(s.items[0].is_stoplisted, true);

  s.token = "expired";
  responses.push({ status: 401, body: { error: "Expired" } });
  await assert.rejects(context.testApi("getData"), /Сессия истекла/);
  assert.equal(s.token, "");
  assert.equal(node("#app").hidden, true);
  assert.equal(node("#login").hidden, false);
  console.log(
    "Admin V2: auth, tenant scope, escaping, filters, validation, save payloads/errors, category split, stock and expiry passed. No network calls.",
  );
}
run().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
