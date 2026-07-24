import { prisma } from "../db";

export async function validateDeviceByQr(qrKey: string) {
  const device = await prisma.device.findUnique({
    where: { qrKey },
  });

  if (!device || !device.isProduced) {
    throw new Error("Device not found.");
  }
  return device;
}

export async function createDeviceBindingTx(tx: any, userId: number, deviceId: number) {
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
