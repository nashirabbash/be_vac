import { describe, expect, it, mock, beforeEach } from "bun:test";
import { createTherapySession, getTherapySessions } from "../../src/services/therapy";

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
});

describe("createTherapySession", () => {
  it("creates session with mode 1 (Intermiten)", async () => {
    mockPrisma.therapySession.count.mockImplementation(() => 0);

    const session = await createTherapySession({
      start: 1751436000,
      end: 1751439600,
      mode: 1,
    });

    expect(session.title).toBe("Terapi #1");
    expect(session.mode).toBe("Intermiten");
    expect(session.duration).toBe("1 jam 0 menit");
    expect(session.id).toBe(1);
    expect(mockPrisma.therapySession.count).toHaveBeenCalled();
    expect(mockPrisma.therapySession.create).toHaveBeenCalled();
  });

  it("creates session with mode 0 (Kontinyu)", async () => {
    mockPrisma.therapySession.count.mockImplementation(() => 2);

    const session = await createTherapySession({
      start: 1751436000,
      end: 1751436060,
      mode: 0,
    });

    expect(session.title).toBe("Terapi #3");
    expect(session.mode).toBe("Kontinyu");
    expect(session.duration).toBe("1 menit");
  });

  it("creates session with short duration (<60s)", async () => {
    mockPrisma.therapySession.count.mockImplementation(() => 0);

    const session = await createTherapySession({
      start: 1751436000,
      end: 1751436030,
      mode: 1,
    });

    expect(session.duration).toBe("30 detik");
  });

  it("formats date correctly from epoch", async () => {
    mockPrisma.therapySession.count.mockImplementation(() => 0);

    const session = await createTherapySession({
      start: 1751436000,
      end: 1751439600,
      mode: 1,
    });

    const date = new Date(1751436000 * 1000);
    expect(session.date).toBe(
      `${date.getDate()} ${["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Agu", "Sep", "Okt", "Nov", "Des"][date.getMonth()]} ${date.getFullYear()}`
    );
  });
});

describe("getTherapySessions", () => {
  it("returns all sessions when no year filter", async () => {
    const sessions = [
      { id: 1, sessionDate: "2026-07-01T00:00:00.000Z", title: "Terapi #1", date: "1 Jul 2026", mode: "Intermiten", duration: "1 jam 0 menit" },
    ];
    mockPrisma.therapySession.findMany.mockImplementation(() => sessions);

    const result = await getTherapySessions();

    expect(result).toEqual(sessions);
    expect(mockPrisma.therapySession.findMany).toHaveBeenCalledWith({
      where: {},
      orderBy: { sessionDate: "desc" },
    });
  });

  it("filters by year when year param provided", async () => {
    mockPrisma.therapySession.findMany.mockImplementation(() => []);

    await getTherapySessions("2026");

    expect(mockPrisma.therapySession.findMany).toHaveBeenCalledWith({
      where: { sessionDate: { startsWith: "2026" } },
      orderBy: { sessionDate: "desc" },
    });
  });
});