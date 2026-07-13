import { Elysia } from "elysia";
import { logger } from "../logger";

export const loggerMiddleware = (app: Elysia) => app
  .onStart(({ server }) => {
    logger.info({ server: { hostname: server?.hostname, port: server?.port } }, `Server started at ${server?.hostname}:${server?.port}`);
  })
  .onRequest(({ request }) => {
    logger.info({ req: request }, `[REQUEST] 📥 Masuk: ${request.method} ${request.url}`);
  })
  .onParse(({ request, contentType }) => {
    logger.debug({ contentType }, `[onParse] ${request.method} ${request.url}`);
  })
  .onTransform((ctx) => {
    const { request, body, query, params } = ctx as any;
    logger.debug({ body, query, params }, `[onTransform] ${request.method} ${request.url}`);
  })
  .onBeforeHandle((ctx) => {
    const { request, body, query, params, headers } = ctx as any;
    logger.debug({ headers, body, query, params }, `[onBeforeHandle] ${request.method} ${request.url}`);
  })
  .onAfterHandle((ctx) => {
    const { request, response } = ctx as any;
    logger.debug({ response }, `[onAfterHandle] ${request.method} ${request.url}`);
  })
  .onAfterResponse(({ request, response, set }) => {
    const status = set.status || 200;
    if (status >= 500) {
      logger.error({ status, headers: set.headers }, `[FAILED] 💥 Server Error: ${request.method} ${request.url} - Status: ${status}`);
    } else if (status >= 400) {
      logger.warn({ status, headers: set.headers }, `[FAILED] ❌ Gagal: ${request.method} ${request.url} - Status: ${status}`);
    } else {
      logger.info({ status, headers: set.headers }, `[RESPONSE] ✅ Selesai: ${request.method} ${request.url} - Status: ${status}`);
    }
  })
  .onError(({ request, error, code }) => {
    const errorMsg = error instanceof Error ? error.message : (error as any).message || String(error);
    logger.error({ err: error, code }, `[FAILED] ❌ Gagal: ${request.method} ${request.url} - Error: ${errorMsg}`);
  })
  .onStop(() => {
    logger.info("Server stopped");
  });
