import { prisma } from "../db";
import { logger } from "../logger";
import { Prisma } from "../generated/prisma/client";

export interface CreateTherapyPayload {
  userId: number;
  deviceId: number;
  sessionDate: string;
  title: string;
  date: string;
  mode: string;
  duration: string;
  latitude?: number;
  longitude?: number;
}

export async function createTherapySession(payload: CreateTherapyPayload) {
  const { latitude, longitude, ...sessionData } = payload;
  const session = await prisma.history.create({
    data: sessionData,
  });

  if (latitude !== undefined && longitude !== undefined) {
    await prisma.device.update({
      where: { id: payload.deviceId },
      data: {
        latitude,
        longitude,
        lastSeenAt: new Date(),
        isOnline: true,
      },
    });
  } else {
    await prisma.device.update({
      where: { id: payload.deviceId },
      data: {
        lastSeenAt: new Date(),
        isOnline: true,
      },
    });
  }

  logger.info({ sessionId: session.id, title: session.title }, "Therapy session created");
  return session;
}

export async function getTherapySessions(userId: number, year?: string) {
  const where: Prisma.HistoryWhereInput = { userId };
  if (year) {
    where.sessionDate = { startsWith: year };
  }

  return prisma.history.findMany({
    where,
    orderBy: { sessionDate: "desc" },
  });
}