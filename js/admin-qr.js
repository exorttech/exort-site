(function () {
  const state = { root: null, sources: [], loading: false, error: "", mounted: false };

  async function mount(options = {}) {
    state.root = options.root || document.querySelector("[data-qr-root]");
    if (!state.root) return;
    if (!state.mounted) {
      state.root.addEventListener("submit", handleSubmit);
      state.root.addEventListener("click", handleClick);
      state.mounted = true;
    }
    await load();
  }

  async function load() {
    state.loading = true;
    state.error = "";
    render();
    try {
      const result = await api("getQrSources");
      state.sources = result.sources || [];
    } catch (error) {
      state.error = friendly(error);
    } finally {
      state.loading = false;
      render();
    }
  }

  function render() {
    if (!state.root) return;
    if (state.loading) {
      state.root.innerHTML = '<div class="analytics-loading">Загружаем QR-коды...</div>';
      return;
    }
    state.root.innerHTML = `
      <header class="qr-page-header">
        <div><p class="kicker">Источники меню</p><h2>QR-коды</h2><p>Создавайте отдельные ссылки для залов, столов, гостиницы и социальных сетей.</p></div>
      </header>
      ${state.error ? `<div class="analytics-error" role="alert">${escapeHtml(state.error)} <button type="button" data-qr-retry>Повторить</button></div>` : ""}
      <div class="qr-layout">
        <form class="qr-create-card" data-qr-form>
          <div><p class="kicker">Новый источник</p><h3>Создать QR-код</h3></div>
          <label>Страница меню
            <select name="menuPath"><option value="/demo-menu">Основное меню · exort.kz/demo-menu</option></select>
          </label>
          <label>Название источника
            <input name="name" maxlength="100" placeholder="Например, Гостиница" required />
          </label>
          <label>Тип ссылки
            <select name="sourceType"><option value="qr">QR-код</option><option value="social">Социальная сеть</option><option value="link">Обычная ссылка</option></select>
          </label>
          <button class="primary-button" type="submit">Создать источник</button>
          <p class="qr-form-status" data-qr-form-status aria-live="polite"></p>
        </form>
        <aside class="qr-help-card">
          <span class="qr-help-icon"><svg><use href="#icon-qr"/></svg></span>
          <h3>Один QR — один понятный источник</h3>
          <p>Название не попадает в URL. Exort использует безопасный публичный идентификатор, поэтому QR продолжит работать после переименования.</p>
        </aside>
      </div>
      <section class="qr-list-section">
        <div class="qr-list-heading"><div><p class="kicker">Все точки входа</p><h3>Созданные источники</h3></div><span>${state.sources.length}</span></div>
        ${state.sources.length ? `<div class="qr-source-list">${state.sources.map(sourceCard).join("")}</div>` : '<div class="analytics-empty"><strong>QR-кодов пока нет</strong><p>Создайте первый источник, чтобы начать сравнивать точки входа.</p></div>'}
      </section>`;
    requestAnimationFrame(renderQrs);
  }

  function sourceCard(source) {
    return `<article class="qr-source-card ${source.is_active ? "" : "is-archived"}" data-source-card="${escapeHtml(source.id)}">
      <div class="qr-source-preview" data-qr-preview="${escapeHtml(source.id)}" aria-label="QR-код ${escapeHtml(source.name)}"></div>
      <div class="qr-source-main">
        <div class="qr-source-title"><div><h4>${escapeHtml(source.name)}</h4><span class="qr-status ${source.is_active ? "is-active" : ""}">${source.is_active ? "Активен" : "Архив"}</span></div><small>${formatDate(source.created_at)}</small></div>
        <p>Основное меню</p>
        <div class="qr-source-url"><input readonly value="${escapeHtml(source.url || "")}" aria-label="Ссылка источника"/><button type="button" data-qr-copy="${escapeHtml(source.id)}">Копировать</button></div>
        <div class="qr-source-stats"><span><strong>${number(source.visits)}</strong> переходов</span><span><strong>${number(source.engagedSessions)}</strong> вовлечённых</span><span><strong>${source.lastVisitAt ? formatDate(source.lastVisitAt) : "—"}</strong> последний переход</span></div>
        <div class="qr-source-actions">
          <button class="secondary-button compact" type="button" data-qr-open="${escapeHtml(source.id)}">Открыть</button>
          <button class="secondary-button compact" type="button" data-qr-download="${escapeHtml(source.id)}">Скачать PNG</button>
          ${source.is_active ? `<button class="secondary-button compact" type="button" data-qr-rename="${escapeHtml(source.id)}">Переименовать</button><button class="danger-button" type="button" data-qr-archive="${escapeHtml(source.id)}">В архив</button>` : ""}
        </div>
      </div>
    </article>`;
  }

  function renderQrs() {
    if (!window.QRCode) return;
    state.sources.forEach((source) => {
      const node = state.root.querySelector(`[data-qr-preview="${cssEscape(source.id)}"]`);
      if (!node || !source.url) return;
      node.innerHTML = "";
      new window.QRCode(node, { text: source.url, width: 160, height: 160, colorDark: "#111827", colorLight: "#ffffff", correctLevel: window.QRCode.CorrectLevel.H });
    });
  }

  async function handleSubmit(event) {
    const form = event.target.closest("[data-qr-form]");
    if (!form) return;
    event.preventDefault();
    const status = form.querySelector("[data-qr-form-status]");
    const button = form.querySelector('button[type="submit"]');
    button.disabled = true;
    status.textContent = "Создаём безопасную ссылку...";
    try {
      const data = Object.fromEntries(new FormData(form));
      const result = await api("createQrSource", data);
      state.sources.unshift(result.source);
      form.reset();
      render();
    } catch (error) {
      status.textContent = friendly(error);
    } finally {
      button.disabled = false;
    }
  }

  async function handleClick(event) {
    if (event.target.closest("[data-qr-retry]")) return load();
    const action = ["copy", "open", "download", "rename", "archive"].find((name) => event.target.closest(`[data-qr-${name}]`));
    if (!action) return;
    const button = event.target.closest(`[data-qr-${action}]`);
    const source = state.sources.find((item) => item.id === button.dataset[`qr${capitalize(action)}`]);
    if (!source) return;
    if (action === "copy") {
      await navigator.clipboard.writeText(source.url);
      button.textContent = "Скопировано";
      setTimeout(() => { button.textContent = "Копировать"; }, 1200);
    }
    if (action === "open") window.open(source.url, "_blank", "noopener,noreferrer");
    if (action === "download") downloadPng(source);
    if (action === "rename") {
      const name = window.prompt("Новое название источника", source.name)?.trim();
      if (!name || name === source.name) return;
      const result = await api("updateQrSource", { sourceId: source.id, name });
      Object.assign(source, result.source);
      render();
    }
    if (action === "archive" && window.confirm(`Архивировать «${source.name}»? Старая статистика сохранится.`)) {
      const result = await api("archiveQrSource", { sourceId: source.id });
      Object.assign(source, result.source);
      render();
    }
  }

  function downloadPng(source) {
    const card = state.root.querySelector(`[data-source-card="${cssEscape(source.id)}"]`);
    const canvas = card?.querySelector("canvas");
    const image = card?.querySelector("img");
    const url = canvas?.toDataURL("image/png") || image?.src;
    if (!url) return;
    const link = document.createElement("a");
    link.href = url;
    link.download = `exort-${slugify(source.name)}.png`;
    link.click();
  }

  function api(action, payload = {}) {
    if (!window.ExortAdminBridge?.api) return Promise.reject(new Error("Admin API is not ready."));
    return window.ExortAdminBridge.api(action, payload);
  }
  function friendly(error) { return error?.message || "Не удалось выполнить действие."; }
  function number(value) { return new Intl.NumberFormat("ru-RU").format(Number(value || 0)); }
  function formatDate(value) { return value ? new Intl.DateTimeFormat("ru-RU", { day: "numeric", month: "short", year: "numeric" }).format(new Date(value)) : "—"; }
  function escapeHtml(value) { return String(value || "").replace(/[&<>'"]/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;" }[char])); }
  function cssEscape(value) { return window.CSS?.escape ? window.CSS.escape(String(value)) : String(value).replace(/[^a-zA-Z0-9_-]/g, ""); }
  function capitalize(value) { return value.charAt(0).toUpperCase() + value.slice(1); }
  function slugify(value) { return String(value || "qr").toLowerCase().replace(/[^a-z0-9а-яё]+/gi, "-").replace(/^-|-$/g, "") || "qr"; }

  window.ExortQr = { mount, reload: load };
})();
