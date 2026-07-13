import { Elysia, t } from "elysia";
import { jwt } from "@elysiajs/jwt";
import { createTherapySession, getTherapySessions } from "../services/therapy";

const jwtSecret = process.env.JWT_SECRET;
if (!jwtSecret) throw new Error("JWT_SECRET environment variable is not defined");

export const therapyRoutes = new Elysia({ prefix: "/therapy-sessions" })
  .use(jwt({ name: "jwt", secret: jwtSecret }))
  .derive(async ({ jwt, headers }) => {
    const authorization = headers['authorization'];
    if (!authorization?.startsWith('Bearer ')) {
      return { user: null };
    }
    const token = authorization.slice(7);
    const payload = await jwt.verify(token);
    return {
      user: payload ? (payload as { userId: number; deviceId: number | null; username: string }) : null,
    };
  })
  .onBeforeHandle(({ user, set }) => {
    if (!user) {
      set.status = 401;
      return { error: "Unauthorized" };
    }
  })
  .post(
    "/",
    async ({ body, user, set }) => {
      if (!user!.deviceId) {
        set.status = 403;
        return { error: "No active device associated with user" };
      }
      const session = await createTherapySession({ 
        ...body, 
        userId: user!.userId, 
        deviceId: user!.deviceId 
      });
      return { status: "ok", data: session };
    },
    {
      body: t.Object({
        sessionDate: t.String(),
        title: t.String(),
        date: t.String(),
        mode: t.String(),
        duration: t.String(),
      }),
    }
  )
  .get(
    "/",
    async ({ query, user }) => {
      const sessions = await getTherapySessions(user!.userId, query.year);
      return { status: "ok", data: sessions };
    },
    {
      query: t.Object({
        year: t.Optional(t.String()),
      }),
    }
  );