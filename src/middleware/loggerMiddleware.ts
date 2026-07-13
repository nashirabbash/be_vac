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
    logger.info(`[onParse] ${request.method} ${request.url}`);
  })
  .onTransform(({ request }) => {
    logger.info(`[onTransform] ${request.method} ${request.url}`);
  })
  .onBeforeHandle(({ request }) => {
    logger.info(`[onBeforeHandle] ${request.method} ${request.url}`);
  })
  .onAfterHandle(({ request }) => {
    logger.info(`[onAfterHandle] ${request.method} ${request.url}`);
  })
  .onAfterResponse(({ request, set }) => {
    logger.info(`[onAfterResponse] ${request.method} ${request.url} - Status: ${set.status || 200}`);
  })
  .onError(({ request, error }) => {
    logger.error(`[onError] ${request.method} ${request.url} - Error: ${error.message}`);
  })
  .onStop(() => {
    logger.info("Server stopped");
  });
