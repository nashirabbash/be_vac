import { describe, expect, it, mock, beforeEach } from "bun:test";
import { therapyRoutes } from "../../src/routes/therapy";

const mockPrisma = {
  therapySession: {
    count: mock(() => 0),
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
  mockPrisma.therapySession.count.mockClear();
  mockPrisma.therapySession.create.mockClear();
  mockPrisma.therapySession.findMany.mockClear();
  mockPrisma.therapySession.count.mockImplementation(() => 0);
});

describe("POST /therapy-sessions", () => {
  it("creates session and returns 200", async () => {
    const res = await therapyRoutes.handle(
      new Request("http://localhost/therapy-sessions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ start: 1751436000, end: 1751439600, mode: 1 }),
      })
    );

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.status).toBe("ok");
    expect(body.data.title).toBe("Terapi #1");
    expect(body.data.mode).toBe("Intermiten");
  });

  it("rejects request with missing fields", async () => {
    const res = await therapyRoutes.handle(
      new Request("http://localhost/therapy-sessions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ start: 1751436000 }),
      })
    );

    expect(res.status).toBe(422);
  });

  it("rejects request with wrong types", async () => {
    const res = await therapyRoutes.handle(
      new Request("http://localhost/therapy-sessions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ start: "abc", end: 123, mode: 1 }),
      })
    );

    expect(res.status).toBe(422);
  });

  it("creates session with mode 0 (Kontinyu)", async () => {
    mockPrisma.therapySession.count.mockImplementation(() => 4);

    const res = await therapyRoutes.handle(
      new Request("http://localhost/therapy-sessions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ start: 1751436000, end: 1751436060, mode: 0 }),
      })
    );

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.data.title).toBe("Terapi #5");
    expect(body.data.mode).toBe("Kontinyu");
  });

  it("rejects empty body", async () => {
    const res = await therapyRoutes.handle(
      new Request("http://localhost/therapy-sessions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: "{}",
      })
    );

    expect(res.status).toBe(422);
  });
});

describe("GET /therapy-sessions", () => {
  it("returns all sessions", async () => {
    const sessions = [
      { id: 1, sessionDate: "2026-07-01T00:00:00.000Z", title: "Terapi #1", date: "1 Jul 2026", mode: "Intermiten", duration: "1 jam 0 menit" },
      { id: 2, sessionDate: "2026-06-30T00:00:00.000Z", title: "Terapi #2", date: "30 Jun 2026", mode: "Kontinyu", duration: "30 menit" },
    ];
    mockPrisma.therapySession.findMany.mockImplementation(() => sessions);

    const res = await therapyRoutes.handle(
      new Request("http://localhost/therapy-sessions")
    );

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.status).toBe("ok");
    expect(body.data).toHaveLength(2);
    expect(body.data[0].title).toBe("Terapi #1");
  });

  it("filters by year", async () => {
    mockPrisma.therapySession.findMany.mockImplementation(() => []);

    const res = await therapyRoutes.handle(
      new Request("http://localhost/therapy-sessions?year=2025")
    );

    expect(res.status).toBe(200);
    expect(mockPrisma.therapySession.findMany).toHaveBeenCalledWith({
      where: { sessionDate: { startsWith: "2025" } },
      orderBy: { sessionDate: "desc" },
    });
  });

  it("returns empty array when no sessions", async () => {
    mockPrisma.therapySession.findMany.mockImplementation(() => []);

    const res = await therapyRoutes.handle(
      new Request("http://localhost/therapy-sessions")
    );

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.data).toEqual([]);
  });
});