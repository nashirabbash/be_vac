import { mock } from "bun:test";
import { SignJWT } from "jose";

export const secret = new TextEncoder().encode("test-secret");

export async function generateTestToken(payload: Record<string, unknown>) {
  return await new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .sign(secret);
}

import type { History } from "../src/generated/prisma/client";

export const mockSessions: History[] = [
  {
    id: 1,
    userId: 1,
    deviceId: 2,
    sessionDate: "2026-07-01T00:00:00.000Z",
    title: "Test",
    date: "1 Jul 2026",
    mode: "Intermiten",
    duration: "1 jam",
    createdAt: new Date(),
  },
];

export const mockPrisma = {
  history: {
    create: mock((args: { data: Record<string, unknown> }) => ({
      id: 1,
      ...args.data,
    })),
    findMany: mock((_args?: any) => [] as History[]),
  },
  device: { findUnique: mock(), update: mock((args?: any) => ({ id: args?.where?.id || 1, ...args?.data })), findMany: mock(() => []) },
  trDeviceUser: { updateMany: mock(), create: mock() },
  $transaction: mock(async (queries) => {
    if (typeof queries === "function") {
      return queries(mockPrisma);
    }
    for (const query of queries) await query;
  }),
  user: {
    create: mock((args: { data: Record<string, unknown> }) => ({
      id: 1,
      ...args.data,
    })),
    findUnique: mock(),
  },
  auditLog: {
    create: mock((args: { data: Record<string, unknown> }) => ({
      id: 1,
      timestamp: new Date(),
      createdAt: new Date(),
      ...args.data,
    })),
    createMany: mock((args: { data: Record<string, unknown>[] }) => ({
      count: args.data.length,
    })),
  },
};
