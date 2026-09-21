export function onRequest(context) {
  const pageUrl = new URL("/pages/admin-v2", context.request.url);
  return context.env.ASSETS.fetch(new Request(pageUrl, context.request));
}
