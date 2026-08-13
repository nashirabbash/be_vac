import { Elysia, t } from "elysia";
import { createAuditLog, createAuditLogs } from "../services/audit";
import { authMiddleware } from "../middleware/auth";

const auditLogItemSchema = t.Object({
  userId: t.Optional(t.Nullable(t.Number())),
  username: t.Optional(t.Nullable(t.String())),
  hospitalName: t.Optional(t.Nullable(t.String())),
  deviceId: t.Optional(t.Nullable(t.Union([t.String(), t.Number()]))),
  action: t.String(),
  details: t.Optional(t.Nullable(t.String())),
  timestamp: t.Optional(t.Nullable(t.String())),
});

export const auditRoutes = new Elysia({ prefix: "/audit-logs" })
  .use(authMiddleware)
  .post(
    "/",
    async ({ body, user }) => {
      if (Array.isArray(body)) {
        const payloads = body.map((item) => ({
          userId: item.userId ?? user?.userId,
          username: item.username ?? user?.username,
          hospitalName: item.hospitalName ?? user?.hospitalName,
          deviceId: item.deviceId ? String(item.deviceId) : (user?.deviceId ? String(user.deviceId) : undefined),
          action: item.action,
          details: item.details ?? undefined,
          timestamp: item.timestamp ?? undefined,
        }));
        const result = await createAuditLogs(payloads);
        return { status: "ok", count: result.count };
      } else {
        const payload = {
          userId: body.userId ?? user?.userId,
          username: body.username ?? user?.username,
          hospitalName: body.hospitalName ?? user?.hospitalName,
          deviceId: body.deviceId ? String(body.deviceId) : (user?.deviceId ? String(user.deviceId) : undefined),
          action: body.action,
          details: body.details ?? undefined,
          timestamp: body.timestamp ?? undefined,
        };
        const log = await createAuditLog(payload);
        return { status: "ok", data: log };
      }
    },
    {
      body: t.Union([auditLogItemSchema, t.Array(auditLogItemSchema)]),
    }
  );
