import { describe, expect, it, mock, beforeEach, beforeAll } from "bun:test";
import { auditRoutes } from "../../src/routes/audit";
import { mockPrisma, generateTestToken } from "../utils";

process.env.JWT_SECRET = "test-secret";

let validToken = "";

const mockAuditPayload = {
  action: "VIEW_SESSION",
  details: "Viewed therapy session 1",
  deviceId: "VAC-001",
  timestamp: "2026-08-13T10:00:00Z",
};

beforeAll(async () => {
  validToken = await generateTestToken({ userId: 1, deviceId: 2, username: "dr_john" });
});

mock.module("../../src/db", () => ({
  prisma: mockPrisma,
}));

mock.module("../../src/logger", () => ({
  logger: { info: mock(() => {}) },
}));

beforeEach(() => {
  mockPrisma.auditLog.create.mockClear();
  mockPrisma.auditLog.createMany.mockClear();
});

describe("POST /audit-logs", () => {
  it("rejects request without authorization header", async () => {
    const res = await auditRoutes.handle(
      new Request("http://localhost/audit-logs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(mockAuditPayload),
      })
    );
    expect(res.status).toBe(401);
  });

  it("records single audit log and returns 200", async () => {
    const res = await auditRoutes.handle(
      new Request("http://localhost/audit-logs", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${validToken}`,
        },
        body: JSON.stringify(mockAuditPayload),
      })
    );

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.status).toBe("ok");
    expect(body.data.action).toBe("VIEW_SESSION");
    expect(mockPrisma.auditLog.create).toHaveBeenCalled();
  });

  it("records batch audit logs and returns 200", async () => {
    const res = await auditRoutes.handle(
      new Request("http://localhost/audit-logs", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${validToken}`,
        },
        body: JSON.stringify([mockAuditPayload, { ...mockAuditPayload, action: "EXPORT_REPORT" }]),
      })
    );

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.status).toBe("ok");
    expect(body.count).toBe(2);
    expect(mockPrisma.auditLog.createMany).toHaveBeenCalled();
  });
});
