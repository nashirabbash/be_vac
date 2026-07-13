import { Elysia } from "elysia";
import { logger } from "../logger";

export const loggerMiddleware = new Elysia({ name: "logger" })
  .onStart(({ server }) => {
    logger.info(`Server started at ${server?.hostname}:${server?.port}`);
  })
  .onRequest(({ request }) => {
    logger.info(`[onRequest] ${request.method} ${request.url}`);
  })
  .onParse(({ request }) => {
    logger.debug(`[onParse] ${request.method} ${request.url}`);
  })
  .onTransform(({ request }) => {
    logger.debug(`[onTransform] ${request.method} ${request.url}`);
  })
  .onBeforeHandle(({ request }) => {
    logger.debug(`[onBeforeHandle] ${request.method} ${request.url}`);
  })
  .onAfterHandle(({ request }) => {
    logger.debug(`[onAfterHandle] ${request.method} ${request.url}`);
  })
  .onResponse(({ request, set }) => {
    logger.info(`[onResponse] ${request.method} ${request.url} - Status: ${set.status || 200}`);
  })
  .onError(({ request, error }) => {
    logger.error(`[onError] ${request.method} ${request.url} - Error: ${error.message}`);
  })
  .onStop(() => {
    logger.info("Server stopped");
  });
