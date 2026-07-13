import { Elysia, t } from "elysia";
import { registerUser } from "../services/auth";

export const authRoutes = new Elysia({ prefix: "/auth" }).post(
  "/register",
  async ({ body, set }) => {
    try {
      const user = await registerUser(body);
      set.status = 201;
      return {
        message: "Registration successful",
        user,
      };
    } catch (error: any) {
      set.status = 400;
      return { error: error.message || "Registration failed." };
    }
  },
  {
    body: t.Object({
      name: t.String(),
      hospitalName: t.String(),
      username: t.String(),
      password: t.String(),
      qrKey: t.String(),
    }),
  }
);
