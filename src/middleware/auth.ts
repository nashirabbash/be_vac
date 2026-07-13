import { Elysia } from "elysia";
import { jwt } from "@elysiajs/jwt";

const jwtSecret = process.env.JWT_SECRET;
if (!jwtSecret) throw new Error("JWT_SECRET environment variable is not defined");

export const authMiddleware = new Elysia({ name: "auth-middleware" })
  .use(jwt({ name: "jwt", secret: jwtSecret }))
  .resolve(async ({ jwt, headers }) => {
    const authorization = headers["authorization"];
    const bearerPrefixLength = "Bearer ".length;
    
    if (!authorization?.startsWith("Bearer ")) {
      return { user: null };
    }
    
    const token = authorization.slice(bearerPrefixLength);
    try {
      const payload = await jwt.verify(token);
      return {
        user: payload ? (payload as { userId: number; deviceId: number | null; username: string }) : null,
      };
    } catch (err) {
      return { user: null };
    }
  })
  .onBeforeHandle(({ user, set }) => {
    if (!user) {
      set.status = 401;
      return { error: "Unauthorized" };
    }
  })
  .as("scoped");
