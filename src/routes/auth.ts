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
      // Depending on the error, provide a generic or specific message
      const message = error.message || "Registration failed.";
      return { error: message.includes("Unique constraint") ? "Registration failed. Username may already exist." : message };
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
