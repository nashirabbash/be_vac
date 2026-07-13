import { Elysia, t } from "elysia";
import { authMiddleware } from "../middleware/auth";
import { changeActiveDevice } from "../services/device";

export const deviceRoutes = new Elysia({ prefix: "/device" })
  .use(authMiddleware)
  .post(
    "/change",
    async ({ body, user, jwt, set }) => {
      const { newQrKey } = body;
      try {
        const newDeviceId = await changeActiveDevice(user!.userId, newQrKey);

        const newToken = await jwt.sign({
          ...user,
          deviceId: newDeviceId,
        });

        return { status: "ok", token: newToken };
      } catch (error: any) {
        set.status = 400;
        return { error: error.message || "Failed to change device" };
      }
    },
    {
      body: t.Object({
        newQrKey: t.String(),
      }),
    }
  );
