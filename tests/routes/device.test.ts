import { describe, expect, it, mock, beforeEach, beforeAll } from "bun:test";
import { deviceRoutes } from "../../src/routes/device";
import { mockPrisma, generateTestToken, secret } from "../utils";

let validToken = "";

beforeAll(async () => {
  validToken = await generateTestToken({ userId: 1, deviceId: 1, username: "testuser" });
});

mock.module("../../src/db", () => ({
  prisma: mockPrisma,
}));

beforeEach(() => {
  mockPrisma.device.findUnique.mockClear();
  mockPrisma.trDeviceUser.updateMany.mockClear();
  mockPrisma.trDeviceUser.create.mockClear();
  mockPrisma.$transaction.mockClear();
});

describe("POST /device/bind", () => {
  it("rejects request without authorization header", async () => {
    const res = await deviceRoutes.handle(
      new Request("http://localhost/device/bind", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ qrKey: "valid-qr" }),
      })
    );
    expect(res.status).toBe(401);
  });

  it("returns 400 if service throws error", async () => {
    mockPrisma.device.findUnique.mockResolvedValue(null);

    const res = await deviceRoutes.handle(
      new Request("http://localhost/device/bind", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "Authorization": `Bearer ${validToken}`
        },
        body: JSON.stringify({ qrKey: "invalid-qr" }),
      })
    );

    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toBe("Device not found.");
  });

  it("binds device and returns new token", async () => {
    mockPrisma.device.findUnique.mockResolvedValue({ id: 2, qrKey: "valid-qr", isProduced: true });
    mockPrisma.trDeviceUser.updateMany.mockResolvedValue({ count: 1 });
    mockPrisma.trDeviceUser.create.mockResolvedValue({ id: 1, userId: 1, deviceId: 2, isActive: true });

    const res = await deviceRoutes.handle(
      new Request("http://localhost/device/bind", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "Authorization": `Bearer ${validToken}`
        },
        body: JSON.stringify({ qrKey: "valid-qr" }),
      })
    );

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.status).toBe("ok");
    expect(body.token).toBeDefined();

    // Optionally verify the token payload
    const { jwtVerify } = await import("jose");
    const { payload } = await jwtVerify(body.token, secret);
    expect(payload.userId).toBe(1);
    expect(payload.deviceId).toBe(2); // Successfully updated deviceId
    expect(payload.username).toBe("testuser");
  });
});

describe("GET /device/live-locations", () => {
  it("rejects request without authorization header", async () => {
    const res = await deviceRoutes.handle(
      new Request("http://localhost/device/live-locations")
    );
    expect(res.status).toBe(401);
  });

  it("returns 200 with list of live device locations for authenticated user", async () => {
    mockPrisma.device.findMany.mockResolvedValue([
      {
        id: 1,
        qrKey: "BTPTHI",
        latitude: -7.2756,
        longitude: 112.7912,
        lastSeenAt: new Date(),
        isOnline: true,
        deviceUsers: [
          {
            user: { id: 1, name: "Rafa", hospitalName: "RSUD Soetomo", username: "rafa" },
          },
        ],
        histories: [
          { mode: "Continuous", title: "Continuous 125 mmHg" },
        ],
      },
    ]);

    const res = await deviceRoutes.handle(
      new Request("http://localhost/device/live-locations", {
        headers: { Authorization: `Bearer ${validToken}` },
      })
    );

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.status).toBe("ok");
    expect(body.data.length).toBe(1);
    expect(body.data[0].qrKey).toBe("BTPTHI");
    expect(body.data[0].isOnline).toBe(true);
    expect(body.data[0].currentUser.name).toBe("Rafa");
  });
});
