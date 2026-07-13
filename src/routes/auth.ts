import { Elysia, t } from "elysia";
import { prisma } from "../db";
import { resolveQrKeyToIndex } from "../utils/qrResolver";

export const authRoutes = new Elysia({ prefix: "/auth" }).post(
  "/register",
  async ({ body, set }) => {
    const { name, hospitalName, username, password, qrKey } = body;

    // Simulate decoding the qr_key into a device index
    const deviceIndex = resolveQrKeyToIndex(qrKey);

    // Validate qrKey by checking if it exists in Device table and isProduced is true
    // We lookup by qrKey because it is marked as @unique in our schema.
    const device = await prisma.device.findUnique({
      where: { qrKey },
    });

    if (!device || !device.isProduced) {
      set.status = 400;
      return { error: "Invalid qrKey or device is not produced." };
    }

    // Hash the password using Bun's built-in bcrypt/argon2 hashing
    const passwordHash = await Bun.password.hash(password);

    try {
      const newUser = await prisma.user.create({
        data: {
          name,
          hospitalName,
          username,
          passwordHash,
        },
      });

      // Create a new TrDeviceUser record linking the new userId and deviceId
      await prisma.trDeviceUser.create({
        data: {
          userId: newUser.id,
          deviceId: device.id,
          isActive: true,
        },
      });

      set.status = 201;
      return {
        message: "Registration successful",
        user: { id: newUser.id, username: newUser.username },
      };
    } catch (error: any) {
      set.status = 400;
      return { error: "Registration failed. Username may already exist." };
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
