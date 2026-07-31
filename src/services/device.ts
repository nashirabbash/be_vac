import { prisma } from "../db";
import type { Prisma } from "../generated/prisma/client";
import { resolveQrKey } from "../utils/qrResolver";

export async function validateDeviceByQr(rawQr: string) {
  const qrKey = resolveQrKey(rawQr);
  const device = await prisma.device.findUnique({
    where: { qrKey },
  });

  if (!device?.isProduced) {
    throw new Error("Device not found.");
  }
  return device;
}

export async function createDeviceBindingTx(tx: Prisma.TransactionClient, userId: number, deviceId: number) {
  return tx.trDeviceUser.create({
    data: {
      userId,
      deviceId,
      isActive: true,
    },
  });
}

export async function bindDevice(userId: number, qrKey: string) {
  const device = await validateDeviceByQr(qrKey);

  await prisma.$transaction(async (tx) => {
    await tx.trDeviceUser.updateMany({
      where: { userId, isActive: true },
      data: { isActive: false },
    });
    await createDeviceBindingTx(tx, userId, device.id);
  });

  return device.id;
}

export async function getLiveLocations() {
  const devices = await prisma.device.findMany({
    include: {
      deviceUsers: {
        where: { isActive: true },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              hospitalName: true,
              username: true,
            },
          },
        },
      },
      histories: {
        orderBy: { createdAt: "desc" },
        take: 1,
      },
    },
  });

  const now = new Date();
  const fiveMinutesMs = 5 * 60 * 1000;

  return devices.map((dev) => {
    const activeBinding = dev.deviceUsers[0];
    const currentUser = activeBinding ? activeBinding.user : null;
    const lastSession = dev.histories[0] || null;

    const isOnline =
      dev.lastSeenAt !== null &&
      now.getTime() - new Date(dev.lastSeenAt).getTime() < fiveMinutesMs;

    return {
      id: dev.id,
      qrKey: dev.qrKey,
      latitude: dev.latitude,
      longitude: dev.longitude,
      lastSeenAt: dev.lastSeenAt,
      isOnline,
      currentUser,
      lastSession,
    };
  });
}
