const LEE_YOU_HOSTNAME = "leeyou.exort.kz";

export function onRequest(context) {
  const requestUrl = new URL(context.request.url);

  if (requestUrl.hostname.toLowerCase() !== LEE_YOU_HOSTNAME) {
    return context.next();
  }

  const menuUrl = new URL("/pages/lee-you-menu", requestUrl);
  return context.env.ASSETS.fetch(new Request(menuUrl, context.request));
}
