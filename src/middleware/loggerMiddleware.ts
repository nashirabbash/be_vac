import { Elysia } from "elysia";
import { logger } from "../logger";

export const loggerMiddleware = new Elysia({ name: "logger" })
  .onStart(({ server }) => {
    logger.info({ server: { hostname: server?.hostname, port: server?.port } }, `Server started at ${server?.hostname}:${server?.port}`);
  })
  .onRequest(({ request }) => {
    logger.info({ req: request }, `[onRequest] ${request.method} ${request.url}`);
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
  .onAfterResponse(({ request, set }) => {
    logger.info({ status: set.status || 200, headers: set.headers }, `[onAfterResponse] ${request.method} ${request.url} - Status: ${set.status || 200}`);
  })
  .onError(({ request, error, code }) => {
    const errorMsg = error instanceof Error ? error.message : (error as any).message || String(error);
    logger.error({ err: error, code }, `[onError] ${request.method} ${request.url} - Error: ${errorMsg}`);
  })
  .onStop(() => {
    logger.info("Server stopped");
  });
