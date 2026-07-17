import adminWorker from "../../worker/exort-admin.js";

export async function onRequest(context) {
  return adminWorker.fetch(context.request, context.env, context);
}
