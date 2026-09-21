export function onRequest(context) {
  const pageUrl = new URL("/pages/lee-you-menu", context.request.url);
  return context.env.ASSETS.fetch(new Request(pageUrl, context.request));
}
