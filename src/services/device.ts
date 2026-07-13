import { prisma } from "../db";

export async function changeActiveDevice(userId: number, newQrKey: string) {
  const device = await prisma.device.findUnique({
    where: { qrKey: newQrKey },
  });

  if (!device) {
    throw new Error("Device not found.");
  }

  await prisma.$transaction([
    prisma.trDeviceUser.updateMany({
      where: { userId, isActive: true },
      data: { isActive: false },
    }),
    prisma.trDeviceUser.create({
      data: {
        userId,
        deviceId: device.id,
        isActive: true,
      },
    }),
  ]);

  return device.id;
}
