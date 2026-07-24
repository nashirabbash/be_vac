import { describe, expect, it, mock, beforeEach } from "bun:test";
import { createTherapySession, getTherapySessions } from "../../src/services/therapy";
import { mockPrisma } from "../utils";

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

describe("createTherapySession", () => {
  it("creates session in history table", async () => {
    const payload = {
      userId: 1,
      deviceId: 2,
      sessionDate: "2026-07-13T10:00:00Z",
      title: "Test Session",
      date: "13 Jul 2026",
      mode: "Intermiten",
      duration: "30 menit",
    };

    const session = await createTherapySession(payload);

    expect(session.id).toBe(1);
    expect(session.title).toBe("Test Session");
    expect(session.userId).toBe(1);
    expect(session.deviceId).toBe(2);
    expect(mockPrisma.history.create).toHaveBeenCalledWith({
      data: payload,
    });
  });
});

describe("getTherapySessions", () => {
  it("returns all sessions for a user when no year filter", async () => {
    const sessions: any = [
      { id: 1, userId: 1, deviceId: 2, sessionDate: "2026-07-01T00:00:00.000Z", title: "Test", date: "1 Jul 2026", mode: "Intermiten", duration: "1 jam", createdAt: new Date() },
    ];
    mockPrisma.history.findMany.mockImplementation(() => sessions);

    const result = await getTherapySessions(1);

    expect(result).toEqual(sessions);
    expect(mockPrisma.history.findMany).toHaveBeenCalledWith({
      where: { userId: 1 },
      orderBy: { sessionDate: "desc" },
    });
  });

  it("filters by year when year param provided", async () => {
    mockPrisma.history.findMany.mockImplementation(() => []);

    await getTherapySessions(1, "2026");

    expect(mockPrisma.history.findMany).toHaveBeenCalledWith({
      where: { userId: 1, sessionDate: { startsWith: "2026" } },
      orderBy: { sessionDate: "desc" },
    });
  });
});