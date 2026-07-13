import { Elysia, t } from "elysia";
import { authMiddleware } from "../middleware/auth";
import { bindDevice } from "../services/device";

export const deviceRoutes = new Elysia({ prefix: "/device" })
  .use(authMiddleware)
  .post(
    "/bind",
    async ({ body, user, jwt, set }) => {
      const { qrKey } = body;
      try {
        const newDeviceId = await bindDevice(user!.userId, qrKey);

        const newToken = await jwt.sign({
          ...user,
          deviceId: newDeviceId,
        });

        return { status: "ok", token: newToken };
      } catch (error: any) {
        set.status = 400;
        return { error: error.message || "Failed to bind device" };
      }
    },
    {
      body: t.Object({
        qrKey: t.String(),
      }),
    }
  );
