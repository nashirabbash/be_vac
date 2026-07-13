import { describe, expect, it, mock, beforeEach, beforeAll } from "bun:test";
import { jwt } from "@elysiajs/jwt";
import { Elysia } from "elysia";
import { therapyRoutes } from "../../src/routes/therapy";

process.env.JWT_SECRET = "test-secret";

let validToken = "";
let noDeviceToken = "";

beforeAll(async () => {
  const app = new Elysia().use(jwt({ name: "jwt", secret: "test-secret" }));
  await app.get("/sign", async ({ jwt }) => {
    validToken = await jwt.sign({ userId: 1, deviceId: 2, username: "testuser" });
    noDeviceToken = await jwt.sign({ userId: 1, deviceId: null, username: "testuser" });
    return "ok";
  }).handle(new Request("http://localhost/sign"));
});

const mockPrisma = {
  history: {
    create: mock((args: { data: Record<string, unknown> }) => ({
      id: 1,
      ...args.data,
    })),
    findMany: mock(() => []),
  },
};

mock.module("../../src/db", () => ({
  prisma: mockPrisma,
}));

mock.module("../../src/logger", () => ({
  logger: { info: mock(() => {}) },
}));

beforeEach(() => {
  mockPrisma.history.create.mockClear();
  mockPrisma.history.findMany.mockClear();
});

describe("POST /therapy-sessions", () => {
  it("rejects request without authorization header", async () => {
    const res = await therapyRoutes.handle(
      new Request("http://localhost/therapy-sessions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionDate: "2026-07-13T10:00:00Z",
          title: "Test",
          date: "13 Jul 2026",
          mode: "Intermiten",
          duration: "30 menit"
        }),
      })
    );
    expect(res.status).toBe(401);
  });

  it("creates session and returns 200 with valid token", async () => {
    const payload = {
      sessionDate: "2026-07-13T10:00:00Z",
      title: "Test Session",
      date: "13 Jul 2026",
      mode: "Intermiten",
      duration: "30 menit",
    };

    const res = await therapyRoutes.handle(
      new Request("http://localhost/therapy-sessions", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "Authorization": `Bearer ${validToken}`
        },
        body: JSON.stringify(payload),
      })
    );

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.status).toBe("ok");
    expect(body.data.title).toBe("Test Session");
    expect(body.data.userId).toBe(1);
    expect(body.data.deviceId).toBe(2);
  });

  it("rejects request with missing fields", async () => {
    const res = await therapyRoutes.handle(
      new Request("http://localhost/therapy-sessions", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "Authorization": `Bearer ${validToken}`
        },
        body: JSON.stringify({ sessionDate: "2026-07-13T10:00:00Z" }),
      })
    );

    expect(res.status).toBe(422);
  });
});

describe("GET /therapy-sessions", () => {
  it("rejects request without authorization header", async () => {
    const res = await therapyRoutes.handle(
      new Request("http://localhost/therapy-sessions")
    );
    expect(res.status).toBe(401);
  });

  it("returns all sessions for authenticated user", async () => {
    const sessions = [
      { id: 1, userId: 1, deviceId: 2, title: "Test", sessionDate: "2026-07-01T00:00:00.000Z", date: "1 Jul", mode: "1", duration: "1h" },
    ];
    mockPrisma.history.findMany.mockImplementation(() => sessions);

    const res = await therapyRoutes.handle(
      new Request("http://localhost/therapy-sessions", {
        headers: { "Authorization": `Bearer ${validToken}` }
      })
    );

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.status).toBe("ok");
    expect(body.data).toHaveLength(1);
    expect(mockPrisma.history.findMany).toHaveBeenCalledWith({
      where: { userId: 1 },
      orderBy: { sessionDate: "desc" },
    });
  });

  it("filters by year", async () => {
    mockPrisma.history.findMany.mockImplementation(() => []);

    const res = await therapyRoutes.handle(
      new Request("http://localhost/therapy-sessions?year=2025", {
        headers: { "Authorization": `Bearer ${validToken}` }
      })
    );

    expect(res.status).toBe(200);
    expect(mockPrisma.history.findMany).toHaveBeenCalledWith({
      where: { userId: 1, sessionDate: { startsWith: "2025" } },
      orderBy: { sessionDate: "desc" },
    });
  });
});