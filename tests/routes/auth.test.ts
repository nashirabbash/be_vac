import { describe, expect, it, mock, beforeEach, beforeAll } from "bun:test";
import { authRoutes } from "../../src/routes/auth";
import { mockPrisma, generateTestToken } from "../utils";

let validToken = "";

beforeAll(async () => {
  validToken = await generateTestToken({ userId: 1, deviceId: 10, username: "nakesuser" });
});

mock.module("../../src/db", () => ({
  prisma: mockPrisma,
}));

beforeEach(() => {
  mockPrisma.user.findUnique.mockClear();
});

describe("GET /auth/me", () => {
  it("rejects request without authorization header with 401 Unauthorized", async () => {
    const res = await authRoutes.handle(
      new Request("http://localhost/auth/me")
    );
    expect(res.status).toBe(401);
  });

  it("returns 200 with user profile when valid token is provided", async () => {
    mockPrisma.user.findUnique.mockResolvedValue({
      id: 1,
      name: "Dr. Nakes",
      hospitalName: "RS STECHOQ",
      username: "nakesuser",
    });

    const res = await authRoutes.handle(
      new Request("http://localhost/auth/me", {
        headers: { Authorization: `Bearer ${validToken}` },
      })
    );

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.status).toBe("ok");
    expect(body.user.id).toBe(1);
    expect(body.user.name).toBe("Dr. Nakes");
    expect(body.user.hospitalName).toBe("RS STECHOQ");
    expect(body.user.username).toBe("nakesuser");
    expect(body.user.deviceId).toBe(10);
  });
});
