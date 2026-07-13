import { describe, expect, it, mock, beforeEach } from "bun:test";
import { changeActiveDevice } from "../../src/services/device";

const mockPrisma = {
  device: {
    findUnique: mock(),
  },
  trDeviceUser: {
    updateMany: mock(),
    create: mock(),
  },
  $transaction: mock(async (queries) => {
    for (const query of queries) {
      await query;
    }
  }),
};

mock.module("../../src/db", () => ({
  prisma: mockPrisma,
}));

beforeEach(() => {
  mockPrisma.device.findUnique.mockClear();
  mockPrisma.trDeviceUser.updateMany.mockClear();
  mockPrisma.trDeviceUser.create.mockClear();
  mockPrisma.$transaction.mockClear();
});

describe("changeActiveDevice", () => {
  it("throws error if device is not found", async () => {
    mockPrisma.device.findUnique.mockResolvedValue(null);

    await expect(changeActiveDevice(1, "invalid-qr")).rejects.toThrow("Device not found.");
  });

  it("updates existing device bindings and creates a new one", async () => {
    mockPrisma.device.findUnique.mockResolvedValue({ id: 2, qrKey: "valid-qr" });
    mockPrisma.trDeviceUser.updateMany.mockResolvedValue({ count: 1 });
    mockPrisma.trDeviceUser.create.mockResolvedValue({ id: 1, userId: 1, deviceId: 2, isActive: true });

    const newDeviceId = await changeActiveDevice(1, "valid-qr");

    expect(newDeviceId).toBe(2);
    expect(mockPrisma.$transaction).toHaveBeenCalled();
    expect(mockPrisma.trDeviceUser.updateMany).toHaveBeenCalledWith({
      where: { userId: 1, isActive: true },
      data: { isActive: false },
    });
    expect(mockPrisma.trDeviceUser.create).toHaveBeenCalledWith({
      data: {
        userId: 1,
        deviceId: 2,
        isActive: true,
      },
    });
  });
});
