import { prisma } from "../db";
import { resolveQrKeyToIndex } from "../utils/qrResolver";

export interface RegisterUserInput {
  name: string;
  hospitalName: string;
  username: string;
  password: string;
  qrKey: string;
}

const INVALID_DEVICE_ERROR = "Invalid qrKey or device is not produced.";

export async function registerUser(data: RegisterUserInput) {
  const { name, hospitalName, username, password, qrKey } = data;

  const deviceIndex = resolveQrKeyToIndex(qrKey);

  if (!deviceIndex) {
    throw new Error(INVALID_DEVICE_ERROR);
  }

  // Validate qrKey by checking if the resolved device ID exists in Device table and isProduced is true
  const device = await prisma.device.findUnique({
    where: { id: deviceIndex },
  });

  if (!device || !device.isProduced) {
    throw new Error(INVALID_DEVICE_ERROR);
  }

  // Hash the password using Bun's built-in bcrypt/argon2 hashing
  const passwordHash = await Bun.password.hash(password);

  const newUser = await prisma.user.create({
    data: {
      name,
      hospitalName,
      username,
      passwordHash,
    },
  });

  // Create a new TrDeviceUser record linking the new userId and resolved deviceId
  await prisma.trDeviceUser.create({
    data: {
      userId: newUser.id,
      deviceId: deviceIndex,
      isActive: true,
    },
  });

  return { id: newUser.id, username: newUser.username };
}
