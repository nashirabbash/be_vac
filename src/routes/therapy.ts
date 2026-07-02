import { Elysia, t } from "elysia";
import { createTherapySession, getTherapySessions } from "../services/therapy";

export const therapyRoutes = new Elysia({ prefix: "/therapy-sessions" })
  .post(
    "/",
    async ({ body }) => {
      const session = await createTherapySession(body);
      return { status: "ok", data: session };
    },
    {
      body: t.Object({
        start: t.Number(),
        end: t.Number(),
        mode: t.Number(),
      }),
    }
  )
  .get(
    "/",
    async ({ query }) => {
      const sessions = await getTherapySessions(query.year);
      return { status: "ok", data: sessions };
    },
    {
      query: t.Object({
        year: t.Optional(t.String()),
      }),
    }
  );