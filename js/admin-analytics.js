(function () {
  const state = { root: null, data: null, range: "7d", sourceId: "all", metric: "sessions", dishTab: "leaders", customStart: "", customEnd: "", loading: false, error: "", mounted: false, requestId: 0 };

  async function mount(options = {}) {
    state.root = options.root || document.querySelector("[data-analytics-root]");
    if (!state.root) return;
    if (!state.mounted) {
      state.root.addEventListener("click", onClick);
      state.root.addEventListener("change", onChange);
      state.mounted = true;
    }
    if (!state.data) await load(); else render();
  }

  async function load() {
    const requestId = ++state.requestId;
    state.loading = true;
    state.error = "";
    render();
    try {
      const payload = { range: state.range, sourceId: state.sourceId === "all" ? "" : state.sourceId };
      if (state.range === "custom") Object.assign(payload, { startDate: state.customStart, endDate: state.customEnd });
      const result = await withTimeout(api("getAnalytics", payload), 20000);
      if (requestId !== state.requestId) return;
      if (!result?.analytics?.period || !result.analytics.summary || !Array.isArray(result.analytics.activity?.days)) {
        throw new Error("Сервер аналитики ещё не обновлён до новой версии. Сначала примените SQL-миграцию и опубликуйте Worker.");
      }
      state.data = result.analytics;
    } catch (error) {
      if (requestId !== state.requestId) return;
      state.error = error?.message || "Не удалось загрузить аналитику.";
    } finally {
      if (requestId === state.requestId) {
        state.loading = false;
        try {
          render();
        } catch (error) {
          state.data = null;
          state.error = error?.message || "Не удалось отобразить аналитику.";
          render();
        }
      }
    }
  }

  function render() {
    if (!state.root) return;
    if (state.loading && !state.data) {
      state.root.innerHTML = '<div class="analytics-loading"><span></span><strong>Собираем аналитику меню...</strong><small>Показываем только реальные агрегированные данные</small></div>';
      return;
    }
    if (state.error && !state.data) {
      state.root.innerHTML = `<div class="analytics-error" role="alert"><strong>Аналитика временно недоступна</strong><p>${escapeHtml(state.error)}</p><button class="secondary-button" type="button" data-analytics-retry>Повторить</button></div>`;
      return;
    }
    const data = state.data;
    if (!data) return;
    state.root.innerHTML = `
      <header class="analytics-v2-header">
        <div><p class="kicker">Результаты меню</p><h2>Аналитика меню</h2><p>${escapeHtml(data.period.label)} · сравнение с ${escapeHtml(data.period.comparisonLabel)}</p></div>
        <div class="analytics-v2-actions">
          <div class="analytics-period-switch" role="group" aria-label="Период аналитики">
            ${periodButton("today", "Сегодня")}${periodButton("7d", "7 дней")}${periodButton("30d", "30 дней")}${periodButton("custom", "Свой период")}
          </div>
          <button class="secondary-button compact" type="button" data-analytics-export>Экспорт</button>
        </div>
      </header>
      ${state.range === "custom" ? customRange() : ""}
      <div class="analytics-filter-row">
        <label>Источник<select data-analytics-source>${(data.sourceOptions || []).map((item) => `<option value="${escapeHtml(item.id)}" ${state.sourceId === item.id ? "selected" : ""}>${escapeHtml(item.name)}${item.isActive ? "" : " · архив"}</option>`).join("")}</select></label>
        ${state.error ? `<span class="analytics-inline-error">${escapeHtml(state.error)}</span>` : ""}
      </div>
      <div class="analytics-v2-metrics">
        ${metricCard("Сессии меню", data.summary.sessions, "Полноценные открытия меню")}
        ${metricCard("Вовлечённые гости", data.summary.engagedRate, "Открыли хотя бы одно блюдо")}
        ${metricCard("Открытия блюд", data.summary.dishOpens, "Все открытия карточек")}
        ${metricCard("Среднее время изучения", data.summary.averageStudyMs, "По событию выхода из меню")}
      </div>
      ${activityCard(data.activity?.days || [])}
      <div class="analytics-v2-two-column">
        ${heatmapCard(data.heatmap || [])}
        ${insightsCard(data.insights || [])}
      </div>
      ${dishCard(data.dishes || [])}
      <div class="analytics-v2-two-column analytics-v2-two-column--bottom">
        ${funnelCard(data.funnel || [])}
        ${audienceCard(data.audience || {})}
      </div>
      ${sourceCard(data.sources || [])}`;
  }

  function periodButton(value, label) { return `<button class="${state.range === value ? "is-active" : ""}" type="button" data-analytics-period="${value}">${label}</button>`; }
  function customRange() { return `<div class="analytics-custom-range"><label>С <input type="date" data-custom-start value="${escapeHtml(state.customStart)}"></label><label>По <input type="date" data-custom-end value="${escapeHtml(state.customEnd)}"></label><button class="primary-button compact" type="button" data-custom-apply>Применить</button></div>`; }

  function metricCard(label, item, hint) {
    const hasValue = item?.value !== null && item?.value !== undefined;
    const changeValue = item?.change;
    const direction = item?.sentiment === "neutral" || changeValue === null || changeValue === 0 ? "neutral" : changeValue > 0 ? "positive" : "negative";
    const changeText = changeValue === null ? "Новый показатель" : changeValue === 0 ? "Без изменений" : `${changeValue > 0 ? "+" : ""}${changeValue}%`;
    const max = Math.max(...(item?.sparkline || []).map(Number), 1);
    return `<article class="analytics-v2-metric">
      <span>${label}</span><strong>${hasValue ? formatMetric(item.value, item.format) : "Нет данных"}</strong>
      <div class="metric-change is-${direction}"><b>${changeText}</b><small>к предыдущему периоду</small></div>
      <div class="metric-sparkline" aria-hidden="true">${(item?.sparkline || []).slice(-14).map((value) => `<i style="height:${Math.max(8, Math.round((Number(value || 0) / max) * 100))}%"></i>`).join("")}</div>
      <p>${hint}</p>
    </article>`;
  }

  function activityCard(days) {
    const points = days.map((day) => day[state.metric] || { current: 0, previous: 0 });
    const max = Math.max(...points.flatMap((point) => [Number(point.current || 0), Number(point.previous || 0)]), 1);
    return `<section class="analytics-v2-card analytics-activity-card">
      <div class="analytics-v2-card-head"><div><p class="kicker">Главный график</p><h3>Активность гостей за ${state.range === "7d" ? "неделю" : "период"}</h3></div>
        <div class="analytics-metric-switch">${metricSwitch("sessions", "Сессии")}${metricSwitch("dishOpens", "Открытия блюд")}${metricSwitch("engagement", "Вовлечённость")}</div>
      </div>
      <div class="activity-legend"><span><i></i>Текущий период</span><span><i></i>Предыдущий период</span></div>
      <div class="activity-chart" style="--columns:${Math.min(days.length, 30)}">${days.map((day) => {
        const point = day[state.metric] || { current: 0, previous: 0, change: 0 };
        const title = `${day.fullLabel}\nТекущий период: ${formatChartValue(point.current)}\nПредыдущий период: ${formatChartValue(point.previous)}\nИзменение: ${point.change === null ? "новый показатель" : `${point.change}%`}\nПиковый час: ${day.busiestHour}`;
        return `<button class="activity-day" type="button" data-analytics-day="${day.date}" title="${escapeHtml(title)}"><span class="activity-bars"><i class="is-previous" style="height:${barHeight(point.previous, max)}%"></i><i class="is-current" style="height:${barHeight(point.current, max)}%"></i></span><strong>${escapeHtml(day.label)}</strong><small>${formatChartValue(point.current)}</small></button>`;
      }).join("")}</div>
      <div data-day-detail></div>
    </section>`;
  }

  function metricSwitch(value, label) { return `<button class="${state.metric === value ? "is-active" : ""}" type="button" data-analytics-metric="${value}">${label}</button>`; }

  function heatmapCard(rows) {
    const max = Math.max(...rows.flatMap((row) => row.hours.map((hour) => hour.sessions)), 1);
    return `<section class="analytics-v2-card heatmap-card"><div class="analytics-v2-card-head"><div><p class="kicker">Дни и часы</p><h3>Когда гости изучают меню</h3></div></div>
      <div class="heatmap-scroll"><div class="heatmap-grid"><div></div>${Array.from({ length: 16 }, (_, index) => `<span>${String(index + 8).padStart(2, "0")}</span>`).join("")}${rows.map((row) => `<strong>${row.label}</strong>${row.hours.map((hour) => `<i style="--intensity:${Math.max(0.04, hour.sessions / max)}" title="${escapeHtml(`${row.label}, ${String(hour.hour).padStart(2, "0")}:00 · ${hour.sessions} сессий · ${hour.dishOpens} открытий блюд`)}"></i>`).join("")}`).join("")}</div></div>
      <p class="analytics-note">Интенсивность цвета показывает количество сессий с 08:00 до 23:00.</p></section>`;
  }

  function insightsCard(items) {
    return `<section class="analytics-v2-card insights-card"><div class="analytics-v2-card-head"><div><p class="kicker">Автоматический анализ</p><h3>Что изменилось за период</h3></div></div>${items.length ? `<ol>${items.map((item) => `<li><span>↗</span><p>${escapeHtml(item)}</p></li>`).join("")}</ol>` : '<div class="analytics-empty analytics-empty--compact"><strong>Пока недостаточно данных</strong><p>Подробные выводы появятся после накопления как минимум пяти сессий.</p></div>'}</section>`;
  }

  function dishCard(items) {
    const filtered = dishRows(items);
    return `<section class="analytics-v2-card dish-analytics-card"><div class="analytics-v2-card-head"><div><p class="kicker">Интерес гостей</p><h3>Аналитика блюд</h3></div><div class="dish-tabs">${dishTab("leaders", "Лидеры")}${dishTab("growing", "Растущие")}${dishTab("falling", "Теряют интерес")}${dishTab("unopened", "Не открывают")}</div></div>
      <div class="analytics-table-scroll"><table class="analytics-dish-table"><thead><tr><th>Блюдо</th><th>Открытия</th><th>Доля сессий</th><th>Среднее время</th><th>Динамика</th></tr></thead><tbody>${filtered.length ? filtered.slice(0, 12).map((item) => `<tr><td><strong>${escapeHtml(item.title)}</strong></td><td>${number(item.opens)}</td><td>${item.sessionShare}%</td><td>${item.averageViewMs ? duration(item.averageViewMs) : "—"}</td><td>${changeBadge(item.change)}</td></tr>`).join("") : '<tr><td colspan="5">Для выбранной вкладки пока нет данных.</td></tr>'}</tbody></table></div></section>`;
  }
  function dishTab(value, label) { return `<button class="${state.dishTab === value ? "is-active" : ""}" type="button" data-dish-tab="${value}">${label}</button>`; }
  function dishRows(items) {
    if (state.dishTab === "growing") return items.filter((item) => Number(item.change) > 0).sort((a, b) => b.change - a.change);
    if (state.dishTab === "falling") return items.filter((item) => Number(item.change) < 0).sort((a, b) => a.change - b.change);
    if (state.dishTab === "unopened") return items.filter((item) => item.opens < 2).sort((a, b) => a.opens - b.opens);
    return [...items].sort((a, b) => b.opens - a.opens);
  }

  function funnelCard(items) {
    const max = Number(items[0]?.value || 1);
    return `<section class="analytics-v2-card"><div class="analytics-v2-card-head"><div><p class="kicker">Путь по меню</p><h3>Вовлечение гостей</h3></div></div><div class="engagement-funnel">${items.map((item, index) => `<div><span>${index + 1}</span><p><strong>${escapeHtml(item.label)}</strong><small>${index ? `${item.rate}% от предыдущего этапа` : "Все сессии"}</small></p><b>${number(item.value)}</b><i style="width:${Math.max(4, Math.round((item.value / max) * 100))}%"></i></div>`).join("")}</div></section>`;
  }

  function audienceCard(data) {
    return `<section class="analytics-v2-card audience-card"><div class="analytics-v2-card-head"><div><p class="kicker">Вторичный срез</p><h3>Аудитория</h3></div></div><div class="audience-columns"><div><h4>Языки</h4>${audienceRows(data.languages || [])}</div><div><h4>Устройства</h4>${audienceRows(data.devices || [])}</div></div></section>`;
  }
  function audienceRows(items) { return items.length ? items.map((item) => `<div class="audience-row"><span>${escapeHtml(item.label)}</span><i><b style="width:${item.percent}%"></b></i><strong>${item.percent}% <small>${number(item.count)}</small></strong></div>`).join("") : '<p class="analytics-note">Нет данных</p>'; }

  function sourceCard(items) {
    return `<section class="analytics-v2-card source-analytics-card"><div class="analytics-v2-card-head"><div><p class="kicker">Точки входа</p><h3>Откуда открывают меню</h3></div></div><div class="analytics-table-scroll"><table><thead><tr><th>Источник</th><th>Сессии</th><th>Доля</th><th>Вовлечённость</th><th>Динамика</th></tr></thead><tbody>${items.length ? items.map((item) => `<tr data-source-filter="${escapeHtml(item.id)}"><td><button type="button" data-filter-source="${escapeHtml(item.id)}">${escapeHtml(item.name)}</button></td><td>${number(item.sessions)}</td><td>${item.share}%</td><td>${item.engagement}%</td><td>${changeBadge(item.change)}</td></tr>`).join("") : '<tr><td colspan="5">Источники появятся после первых сессий.</td></tr>'}</tbody></table></div></section>`;
  }

  function showDay(date) {
    const detail = state.data?.dayDetails?.[date];
    const root = state.root.querySelector("[data-day-detail]");
    if (!root || !detail) return;
    const max = Math.max(...detail.hours.map((hour) => hour.sessions), 1);
    root.innerHTML = `<div class="day-detail"><div><h4>${escapeHtml(detail.label)} · по часам</h4><button type="button" data-close-day>Закрыть</button></div><div class="day-detail-chart">${detail.hours.map((hour) => `<span title="${hour.hour}:00 · ${hour.sessions} сессий · ${hour.dishOpens} открытий"><i style="height:${barHeight(hour.sessions, max)}%"></i><small>${String(hour.hour).padStart(2, "0")}</small></span>`).join("")}</div></div>`;
    root.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }

  function onClick(event) {
    const period = event.target.closest("[data-analytics-period]")?.dataset.analyticsPeriod;
    if (period) { state.range = period; if (period !== "custom") load(); else render(); return; }
    const metricName = event.target.closest("[data-analytics-metric]")?.dataset.analyticsMetric;
    if (metricName) { state.metric = metricName; render(); return; }
    const dish = event.target.closest("[data-dish-tab]")?.dataset.dishTab;
    if (dish) { state.dishTab = dish; render(); return; }
    const day = event.target.closest("[data-analytics-day]")?.dataset.analyticsDay;
    if (day) return showDay(day);
    if (event.target.closest("[data-close-day]")) { event.target.closest(".day-detail").remove(); return; }
    if (event.target.closest("[data-analytics-retry]")) return load();
    if (event.target.closest("[data-analytics-export]")) return exportCsv();
    if (event.target.closest("[data-custom-apply]")) {
      state.customStart = state.root.querySelector("[data-custom-start]")?.value || "";
      state.customEnd = state.root.querySelector("[data-custom-end]")?.value || "";
      if (state.customStart && state.customEnd) load();
    }
    const source = event.target.closest("[data-filter-source]")?.dataset.filterSource;
    if (source) { state.sourceId = source; load(); }
  }

  function onChange(event) {
    if (event.target.matches("[data-analytics-source]")) { state.sourceId = event.target.value; load(); }
  }

  function exportCsv() {
    const data = state.data; if (!data) return;
    const rows = [["Период", data.period.label], ["Источник", data.sourceOptions?.find((item) => item.id === state.sourceId)?.name || "Все источники"], [], ["Показатель", "Значение", "Предыдущий период", "Изменение"]];
    [["Сессии меню", data.summary.sessions], ["Вовлечённые гости", data.summary.engagedRate], ["Открытия блюд", data.summary.dishOpens], ["Среднее время изучения", data.summary.averageStudyMs]].forEach(([label, item]) => rows.push([label, formatMetric(item.value, item.format), formatMetric(item.previous, item.format), item.change ?? ""]));
    rows.push([], ["Блюдо", "Открытия", "Доля сессий", "Среднее время", "Динамика"]);
    data.dishes.forEach((item) => rows.push([item.title, item.opens, item.sessionShare, item.averageViewMs || "", item.change ?? ""]));
    rows.push([], ["Источник", "Сессии", "Доля", "Вовлечённость", "Динамика"]);
    data.sources.forEach((item) => rows.push([item.name, item.sessions, item.share, item.engagement, item.change ?? ""]));
    const csv = rows.map((row) => row.map((cell) => `"${String(cell ?? "").replace(/"/g, '""')}"`).join(",")).join("\n");
    const link = document.createElement("a"); link.href = URL.createObjectURL(new Blob(["\ufeff" + csv], { type: "text/csv;charset=utf-8" })); link.download = `exort-analytics-${data.period.start}-${data.period.end}.csv`; link.click(); URL.revokeObjectURL(link.href);
  }

  function api(action, payload) { return window.ExortAdminBridge?.api ? window.ExortAdminBridge.api(action, payload) : Promise.reject(new Error("Admin API is not ready.")); }
  function withTimeout(promise, timeoutMs) {
    let timeoutId;
    const timeout = new Promise((_, reject) => {
      timeoutId = window.setTimeout(() => reject(new Error("Сервер аналитики не ответил за 20 секунд. Повторите запрос.")), timeoutMs);
    });
    return Promise.race([promise, timeout]).finally(() => window.clearTimeout(timeoutId));
  }
  function formatMetric(value, format) { if (value === null || value === undefined) return "Нет данных"; if (format === "percent") return `${value}%`; if (format === "duration") return duration(value); return number(value); }
  function formatChartValue(value) { return state.metric === "engagement" ? `${value}%` : number(value); }
  function duration(ms) { const seconds = Math.max(0, Math.round(Number(ms || 0) / 1000)); return seconds < 60 ? `${seconds} сек` : `${Math.floor(seconds / 60)} мин ${seconds % 60 ? `${seconds % 60} сек` : ""}`.trim(); }
  function number(value) { return new Intl.NumberFormat("ru-RU", { maximumFractionDigits: 1 }).format(Number(value || 0)); }
  function barHeight(value, max) { return Math.max(Number(value) ? 8 : 2, Math.round((Number(value || 0) / max) * 100)); }
  function changeBadge(value) { return value === null || value === undefined ? '<span class="change-badge is-neutral">Новый</span>' : `<span class="change-badge ${value > 0 ? "is-positive" : value < 0 ? "is-negative" : "is-neutral"}">${value > 0 ? "+" : ""}${value}%</span>`; }
  function escapeHtml(value) { return String(value || "").replace(/[&<>'"]/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;" }[char])); }

  window.ExortAnalytics = { mount, reload: load };
})();
