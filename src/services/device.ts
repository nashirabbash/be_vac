import { prisma } from "../db";
import type { Prisma } from "../generated/prisma/client";
import { resolveQrKey } from "../utils/qrResolver";

export async function validateDeviceByQr(rawQr: string) {
  const deviceId = resolveQrKey(rawQr);
  const device = await prisma.device.findUnique({
    where: { id: deviceId },
  });

  if (!device || !device.isProduced) {
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
