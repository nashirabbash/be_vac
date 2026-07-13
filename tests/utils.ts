import { mock } from "bun:test";
import { SignJWT } from "jose";

export const secret = new TextEncoder().encode("test-secret");

export async function generateTestToken(payload: Record<string, unknown>) {
  return await new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .sign(secret);
}

export const mockPrisma = {
  history: {
    create: mock((args: { data: Record<string, unknown> }) => ({
      id: 1,
      ...args.data,
    })),
    findMany: mock(() => []),
  },
  device: { findUnique: mock() },
  trDeviceUser: { updateMany: mock(), create: mock() },
  $transaction: mock(async (queries) => {
    for (const query of queries) await query;
  }),
};
