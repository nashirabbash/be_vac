import { Elysia } from "elysia";
import { swagger } from "@elysiajs/swagger";
import { cors } from "@elysiajs/cors";
import { therapyRoutes } from "./routes/therapy";
import { authRoutes } from "./routes/auth";
import { deviceRoutes } from "./routes/device";
import { loggerMiddleware } from "./middleware/loggerMiddleware";

const app = new Elysia()
  .use(cors())
  .use(loggerMiddleware)
  .use(swagger({ path: "/docs" }))
  .get("/", () => "Hello Elysia")
  .group("/api", (app) => app.use(authRoutes).use(therapyRoutes).use(deviceRoutes))
  .listen({ port: 3000, hostname: "0.0.0.0" });