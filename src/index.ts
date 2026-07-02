import { Elysia } from "elysia";
import { swagger } from "@elysiajs/swagger";
import { logger } from "./logger";
import { therapyRoutes } from "./routes/therapy";

const app = new Elysia()
  .use(swagger({ path: "/docs" }))
  .get("/", () => "Hello Elysia")
  .group("/api", (app) => app.use(therapyRoutes))
  .listen({ port: 3000, hostname: "0.0.0.0" });

logger.info(`Elysia running at ${app.server?.hostname}:${app.server?.port}`);