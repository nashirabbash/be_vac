import { prisma } from "../db";
import { logger } from "../logger";

export interface CreateAuditLogPayload {
  userId?: number;
  username?: string;
  hospitalName?: string;
  deviceId?: string;
  action: string;
  details?: string;
  timestamp?: string;
}

export async function createAuditLog(payload: CreateAuditLogPayload) {
  const timestampDate = payload.timestamp ? new Date(payload.timestamp) : new Date();
  const log = await prisma.auditLog.create({
    data: {
      userId: payload.userId,
      username: payload.username,
      hospitalName: payload.hospitalName,
      deviceId: payload.deviceId,
      action: payload.action,
      details: payload.details,
      timestamp: isNaN(timestampDate.getTime()) ? new Date() : timestampDate,
    },
  });

  logger.info({ auditLogId: log.id, action: log.action }, "Audit log recorded");
  return log;
}

export async function createAuditLogs(payloads: CreateAuditLogPayload[]) {
  const records = payloads.map((payload) => {
    const timestampDate = payload.timestamp ? new Date(payload.timestamp) : new Date();
    return {
      userId: payload.userId,
      username: payload.username,
      hospitalName: payload.hospitalName,
      deviceId: payload.deviceId,
      action: payload.action,
      details: payload.details,
      timestamp: isNaN(timestampDate.getTime()) ? new Date() : timestampDate,
    };
  });

  const count = await prisma.auditLog.createMany({
    data: records,
  });

  logger.info({ count: count.count }, "Bulk audit logs recorded");
  return count;
}
