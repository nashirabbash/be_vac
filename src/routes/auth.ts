import { Elysia, t } from "elysia";
import { jwt } from "@elysiajs/jwt";
import { registerUser, loginUser } from "../services/auth";

const jwtSecret = process.env.JWT_SECRET;
if (!jwtSecret) throw new Error("JWT_SECRET environment variable is not defined");

const credentialsSchema = {
  username: t.String(),
  password: t.String(),
};

export const authRoutes = new Elysia({ prefix: "/auth" })
  .use(
    jwt({
      name: "jwt",
      secret: jwtSecret,
    })
  )
  .post(
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
        ...credentialsSchema,
      }),
    }
  )
  .post(
    "/login",
    async ({ body, set, jwt }) => {
      try {
        const payload = await loginUser(body);
        const token = await jwt.sign(payload);
        return {
          message: "Login successful",
          token,
        };
      } catch (error: any) {
        set.status = 401;
        return { error: error.message || "Login failed." };
      }
    },
    {
      body: t.Object(credentialsSchema),
    }
  );
