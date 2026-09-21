export function onRequest(context) {
  const pageUrl = new URL("/pages/demo-menu", context.request.url);
  return context.env.ASSETS.fetch(new Request(pageUrl, context.request));
}
