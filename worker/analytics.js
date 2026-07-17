const DEFAULT_TIME_ZONE = "Asia/Almaty";

export async function getAnalyticsV2(env, slug, input = {}) {
  const restaurant = await getRestaurant(env, slug);
  const timeZone = restaurant.timezone || DEFAULT_TIME_ZONE;
  const period = resolvePeriod(input, timeZone);
  const sourceId = isUuid(input.sourceId) ? input.sourceId : input.sourceId === "direct" ? "direct" : null;
  const [events, items, qrSources] = await Promise.all([
    fetchEvents(env, restaurant.id, utcDate(period.comparisonStart).toISOString(), sourceId === "direct" ? null : sourceId, timeZone),
    rest(env, "menu_items", { query: { select: "id,name_ru,title_ru,is_active", restaurant_id: `eq.${restaurant.id}` } }),
    rest(env, "qr_sources", { query: { select: "id,name,public_id,is_active,source_type", restaurant_id: `eq.${restaurant.id}` } }),
  ]);

  const selectedEvents = sourceId === "direct" ? events.filter((event) => !event.qr_source_id) : events;
  const current = selectedEvents.filter((event) => inRange(event, period.start, period.end));
  const previous = selectedEvents.filter((event) => inRange(event, period.comparisonStart, period.comparisonEnd));
  const currentMetrics = metrics(current);
  const previousMetrics = metrics(previous);
  const days = comparableDays(current, previous, period);
  const dishes = dishAnalytics(current, previous, items, currentMetrics.sessions);
  const sourceNames = Object.fromEntries(qrSources.map((source) => [source.id, source.name]));

  return response(200, {
    ok: true,
    analytics: {
      period: {
        ...period,
        label: periodLabel(period.start, shiftDate(period.end, -1), timeZone),
        comparisonLabel: periodLabel(period.comparisonStart, shiftDate(period.comparisonEnd, -1), timeZone),
      },
      selectedSourceId: sourceId || "all",
      summary: {
        sessions: metric(currentMetrics.sessions, previousMetrics.sessions, days.map((day) => day.sessions.current)),
        engagedRate: metric(currentMetrics.engagedRate, previousMetrics.engagedRate, days.map((day) => day.engagement.current), "percent"),
        dishOpens: metric(currentMetrics.dishOpens, previousMetrics.dishOpens, days.map((day) => day.dishOpens.current)),
        averageStudyMs: metric(currentMetrics.averageStudyMs, previousMetrics.averageStudyMs, days.map((day) => day.averageStudyMs.current), "duration", "neutral"),
      },
      activity: { days },
      heatmap: heatmap(current, period),
      dishes,
      funnel: funnel(current, currentMetrics.sessions),
      insights: insights(currentMetrics, previousMetrics, days, dishes, current),
      audience: {
        languages: audience(current, "language", (value) => String(value || "").toUpperCase()),
        devices: audience(current, "device_type", (value) => ({ mobile: "Телефон", tablet: "Планшет", desktop: "Компьютер" }[value] || "Другое")),
      },
      sources: sourceAnalytics(current, previous, sourceNames),
      sourceOptions: [
        { id: "all", name: "Все источники", isActive: true },
        { id: "direct", name: "Прямые переходы", isActive: true },
        ...qrSources.map((source) => ({ id: source.id, name: source.name, isActive: source.is_active })),
      ],
      dayDetails: dayDetails(current, period),
      timeZone,
    },
  });
}

async function fetchEvents(env, restaurantId, fromIso, sourceId, timeZone) {
  const rows = [];
  for (let offset = 0; offset < 20000; offset += 1000) {
    const page = await rest(env, "menu_analytics_events", {
      query: {
        select: "id,event_type,menu_item_id,category_id,language,device_type,session_id,qr_source_id,source_fallback,duration_ms,metadata,created_at",
        restaurant_id: `eq.${restaurantId}`,
        created_at: `gte.${fromIso}`,
        ...(sourceId ? { qr_source_id: `eq.${sourceId}` } : {}),
        order: "created_at.asc",
        limit: "1000",
        offset: String(offset),
      },
    });
    rows.push(...page);
    if (page.length < 1000) break;
  }
  return rows.map((event) => ({ ...event, ...localParts(event.created_at, timeZone) }));
}

function resolvePeriod(input, timeZone) {
  const range = ["today", "7d", "30d", "custom"].includes(input.range) ? input.range : "7d";
  const today = dateKey(new Date(), timeZone);
  let start = range === "today" ? today : shiftDate(today, range === "30d" ? -29 : -6);
  let end = shiftDate(today, 1);
  if (range === "custom" && datePattern(input.startDate) && datePattern(input.endDate)) {
    start = input.startDate;
    const requestedDays = Math.round((utcDate(shiftDate(input.endDate, 1)) - utcDate(start)) / 86400000);
    end = shiftDate(start, Math.max(1, Math.min(90, requestedDays)));
  }
  const dayCount = Math.max(1, Math.round((utcDate(end) - utcDate(start)) / 86400000));
  return { range, start, end, comparisonStart: shiftDate(start, -dayCount), comparisonEnd: start, dayCount };
}

function metrics(events) {
  const sessions = sessionIds(events);
  const engaged = new Set(events.filter((event) => event.event_type === "dish_open" && event.session_id).map((event) => event.session_id));
  const engagedCount = [...engaged].filter((id) => sessions.has(id)).length;
  const exits = events.filter((event) => event.event_type === "menu_exit" && Number.isFinite(Number(event.duration_ms)));
  return {
    sessions: sessions.size,
    engagedSessions: engagedCount,
    engagedRate: sessions.size ? round((engagedCount / sessions.size) * 100) : 0,
    dishOpens: events.filter((event) => event.event_type === "dish_open").length,
    averageStudyMs: exits.length ? Math.round(exits.reduce((sum, event) => sum + Number(event.duration_ms), 0) / exits.length) : null,
  };
}

function sessionIds(events) {
  const started = events.filter((event) => event.event_type === "session_start" && event.session_id).map((event) => event.session_id);
  const fallback = events.filter((event) => event.event_type === "menu_open" && event.session_id).map((event) => event.session_id);
  return new Set([...started, ...fallback]);
}

function metric(value, previous, sparkline, format = "number", sentiment = "positive") {
  return { value, previous, change: change(value, previous), sparkline, format, sentiment };
}

function change(value, previous) {
  if (value === null || value === undefined || previous === null || previous === undefined) return null;
  if (Number(previous) === 0) return Number(value) === 0 ? 0 : null;
  return round(((Number(value) - Number(previous)) / Math.abs(Number(previous))) * 100);
}

function comparableDays(current, previous, period) {
  return Array.from({ length: period.dayCount }, (_, index) => {
    const date = shiftDate(period.start, index);
    const oldDate = shiftDate(period.comparisonStart, index);
    const a = metrics(current.filter((event) => event.localDateKey === date));
    const b = metrics(previous.filter((event) => event.localDateKey === oldDate));
    const dayEvents = current.filter((event) => event.localDateKey === date);
    return {
      date,
      label: weekday(date),
      fullLabel: shortDate(date),
      sessions: point(a.sessions, b.sessions),
      dishOpens: point(a.dishOpens, b.dishOpens),
      engagement: point(a.engagedRate, b.engagedRate),
      averageStudyMs: point(a.averageStudyMs || 0, b.averageStudyMs || 0),
      busiestHour: busiestHour(dayEvents),
    };
  });
}

function point(current, previous) { return { current, previous, change: change(current, previous) }; }

function busiestHour(events) {
  const counts = countBy(events.filter((event) => ["session_start", "menu_open"].includes(event.event_type)).map((event) => ({ key: event.localHour })), "key");
  const winner = Object.entries(counts).sort((a, b) => b[1] - a[1])[0];
  return winner ? `${String(winner[0]).padStart(2, "0")}:00` : "—";
}

function heatmap(events, period) {
  const length = Math.min(7, period.dayCount);
  const start = shiftDate(period.end, -length);
  return Array.from({ length }, (_, dayIndex) => {
    const date = shiftDate(start, dayIndex);
    return {
      date,
      label: weekday(date),
      hours: Array.from({ length: 16 }, (_, index) => {
        const hour = index + 8;
        const slice = events.filter((event) => event.localDateKey === date && event.localHour === hour);
        return { hour, sessions: sessionIds(slice).size, dishOpens: slice.filter((event) => event.event_type === "dish_open").length };
      }),
    };
  });
}

function dishAnalytics(current, previous, items, totalSessions) {
  const currentOpens = current.filter((event) => event.event_type === "dish_open" && event.menu_item_id);
  const previousOpens = previous.filter((event) => event.event_type === "dish_open" && event.menu_item_id);
  const a = countBy(currentOpens, "menu_item_id");
  const b = countBy(previousOpens, "menu_item_id");
  return items.filter((item) => item.is_active !== false).map((item) => {
    const opens = a[item.id] || 0;
    const itemEvents = currentOpens.filter((event) => event.menu_item_id === item.id);
    const sessions = new Set(itemEvents.filter((event) => event.session_id).map((event) => event.session_id)).size;
    const durations = current.filter((event) => event.event_type === "dish_close" && event.menu_item_id === item.id && Number(event.duration_ms) > 0).map((event) => Number(event.duration_ms));
    return {
      id: item.id,
      title: String(item.name_ru || item.title_ru || "Блюдо").trim(),
      opens,
      previousOpens: b[item.id] || 0,
      sessionShare: totalSessions ? round((sessions / totalSessions) * 100) : 0,
      averageViewMs: durations.length ? Math.round(durations.reduce((sum, value) => sum + value, 0) / durations.length) : null,
      change: change(opens, b[item.id] || 0),
    };
  }).sort((left, right) => right.opens - left.opens);
}

function funnel(events, totalSessions) {
  const validSessions = sessionIds(events);
  const bySession = new Map();
  events.filter((event) => event.event_type === "dish_open" && validSessions.has(event.session_id) && event.menu_item_id).forEach((event) => {
    const set = bySession.get(event.session_id) || new Set(); set.add(event.menu_item_id); bySession.set(event.session_id, set);
  });
  const comparedDishes = new Set([...bySession.entries()].filter(([, set]) => set.size >= 2).map(([sessionId]) => sessionId));
  const studied = new Set(events.filter((event) => event.event_type === "menu_exit" && comparedDishes.has(event.session_id) && Number(event.duration_ms) >= 60000).map((event) => event.session_id));
  const values = [totalSessions, bySession.size, comparedDishes.size, studied.size];
  const labels = ["Открыли меню", "Открыли хотя бы одно блюдо", "Открыли два или больше блюд", "Изучали меню больше 60 секунд"];
  return labels.map((label, index) => ({ label, value: values[index], rate: index === 0 ? 100 : values[index - 1] ? round((values[index] / values[index - 1]) * 100) : 0 }));
}

function sourceAnalytics(current, previous, names) {
  const ids = new Set([...current, ...previous].map((event) => event.qr_source_id || "direct"));
  const total = metrics(current).sessions;
  return [...ids].map((id) => {
    const a = current.filter((event) => (event.qr_source_id || "direct") === id);
    const b = previous.filter((event) => (event.qr_source_id || "direct") === id);
    const am = metrics(a); const bm = metrics(b);
    return {
      id,
      name: id === "direct" ? (a.find((event) => event.source_fallback)?.source_fallback || "Прямой переход") : (names[id] || "Архивный источник"),
      sessions: am.sessions,
      share: total ? round((am.sessions / total) * 100) : 0,
      engagement: am.engagedRate,
      change: change(am.sessions, bm.sessions),
    };
  }).sort((left, right) => right.sessions - left.sessions);
}

function audience(events, field, formatter) {
  const values = new Map();
  events.filter((event) => event.session_id && event[field]).forEach((event) => { if (!values.has(event.session_id)) values.set(event.session_id, event[field]); });
  const counts = {}; values.forEach((value) => { counts[value] = (counts[value] || 0) + 1; });
  return Object.entries(counts).map(([value, count]) => ({ label: formatter(value), count, percent: values.size ? round((count / values.size) * 100) : 0 })).sort((a, b) => b.count - a.count);
}

function dayDetails(events, period) {
  return Object.fromEntries(Array.from({ length: period.dayCount }, (_, index) => shiftDate(period.start, index)).map((date) => {
    const day = events.filter((event) => event.localDateKey === date);
    return [date, { label: shortDate(date), hours: Array.from({ length: 24 }, (_, hour) => {
      const slice = day.filter((event) => event.localHour === hour);
      return { hour, sessions: sessionIds(slice).size, dishOpens: slice.filter((event) => event.event_type === "dish_open").length };
    }) }];
  }));
}

function insights(current, previous, days, dishes, events) {
  if (current.sessions < 5) return [];
  const result = [];
  const average = current.sessions / Math.max(days.length, 1);
  const busiest = [...days].sort((a, b) => b.sessions.current - a.sessions.current)[0];
  if (busiest?.sessions.current > average * 1.2) result.push(`${busiest.label}: посещений на ${Math.round(((busiest.sessions.current - average) / average) * 100)}% больше среднего за период.`);
  const growing = dishes.filter((dish) => dish.change !== null && dish.change >= 20).sort((a, b) => b.change - a.change)[0];
  if (growing) result.push(`${growing.title}: интерес вырос на ${growing.change}% относительно предыдущего периода.`);
  const low = dishes.filter((dish) => dish.opens < 5).length;
  if (low) result.push(`${low} ${low === 1 ? "блюдо получило" : "блюд получили"} меньше пяти открытий.`);
  const kz = new Set(events.filter((event) => ["kk", "kz"].includes(event.language) && event.session_id).map((event) => event.session_id)).size;
  if (kz) result.push(`${Math.round((kz / current.sessions) * 100)}% гостей использовали казахскую версию меню.`);
  const delta = change(current.sessions, previous.sessions);
  if (delta) result.push(`Сессии меню ${delta > 0 ? "выросли" : "снизились"} на ${Math.abs(delta)}% относительно предыдущего периода.`);
  return result.slice(0, 5);
}

async function getRestaurant(env, slug) {
  const rows = await rest(env, "restaurants", { query: { select: "*", slug: `eq.${slug}`, is_active: "eq.true", limit: "1" } });
  if (!rows[0]) throw new Error(`Active restaurant "${slug}" was not found.`);
  return rows[0];
}

async function rest(env, table, { query = {} } = {}) {
  const base = String(env.SUPABASE_URL || "").trim().replace(/\/$/, "");
  const key = String(env.SUPABASE_SERVICE_ROLE_KEY || "").trim();
  const url = new URL(`${base}/rest/v1/${table}`);
  Object.entries(query).forEach(([name, value]) => url.searchParams.set(name, value));
  const result = await fetch(url, { headers: { apikey: key, Authorization: `Bearer ${key}` } });
  if (!result.ok) throw new Error(`Supabase analytics request failed: ${await result.text()}`);
  return result.json();
}

function response(status, body) {
  return new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json; charset=utf-8", "Access-Control-Allow-Origin": "*", "Cache-Control": "no-store" } });
}

function inRange(event, start, end) { return event.localDateKey >= start && event.localDateKey < end; }
function pointKey(value) { return String(value || ""); }
function countBy(rows, key) { return rows.reduce((result, row) => { const value = pointKey(row[key]); if (value) result[value] = (result[value] || 0) + 1; return result; }, {}); }
function round(value) { return Math.round(Number(value) * 10) / 10; }
function datePattern(value) { return /^\d{4}-\d{2}-\d{2}$/.test(String(value || "")); }
function isUuid(value) { return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(String(value || "")); }
function utcDate(key) { const [year, month, day] = String(key).split("-").map(Number); return new Date(Date.UTC(year, month - 1, day)); }
function shiftDate(key, days) { const date = utcDate(key); date.setUTCDate(date.getUTCDate() + days); return date.toISOString().slice(0, 10); }
function localParts(value, timeZone) {
  const parts = new Intl.DateTimeFormat("en-CA", { timeZone, year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", hourCycle: "h23" }).formatToParts(new Date(value));
  const map = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  return { localDateKey: `${map.year}-${map.month}-${map.day}`, localHour: Number(map.hour) };
}
function dateKey(value, timeZone) { return localParts(value, timeZone).localDateKey; }
function weekday(key) { return new Intl.DateTimeFormat("ru-RU", { weekday: "short", timeZone: "UTC" }).format(utcDate(key)).replace(".", ""); }
function shortDate(key) { return new Intl.DateTimeFormat("ru-RU", { day: "numeric", month: "short", timeZone: "UTC" }).format(utcDate(key)); }
function periodLabel(start, end, timeZone) {
  const format = new Intl.DateTimeFormat("ru-RU", { day: "numeric", month: "long", year: "numeric", timeZone });
  return start === end ? format.format(utcDate(start)) : `${format.format(utcDate(start))} — ${format.format(utcDate(end))}`;
}
