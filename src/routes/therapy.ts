import { Elysia, t } from "elysia";
import { createTherapySession, getTherapySessions } from "../services/therapy";
import { authMiddleware } from "../middleware/auth";

export const therapyRoutes = new Elysia({ prefix: "/therapy-sessions" })
  .use(authMiddleware)
  .post(
    "/",
    async ({ body, user, set }) => {
      const { userId, deviceId } = user!;
      if (deviceId === null) {
        set.status = 403;
        return { error: "Device required" };
      }
      const session = await createTherapySession({ 
        ...body, 
        userId, 
        deviceId
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
      const { userId } = user!;
      const sessions = await getTherapySessions(userId, query.year);
      return { status: "ok", data: sessions };
    },
    {
      query: t.Object({
        year: t.Optional(t.String()),
      }),
    }
  );