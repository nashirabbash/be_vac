import { prisma } from "../db";

export interface RegisterUserInput {
  name: string;
  hospitalName: string;
  username: string;
  password: string;
}

export async function registerUser(data: RegisterUserInput) {
  const { name, hospitalName, username, password } = data;

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

  return { id: newUser.id, username: newUser.username };
}

export interface LoginUserInput {
  username: string;
  password: string;
}

const INVALID_CRED_ERROR = "Invalid username or password.";

export async function loginUser(data: LoginUserInput) {
  const { username, password } = data;

  const user = await prisma.user.findUnique({
    where: { username },
  });

  if (!user) {
    throw new Error(INVALID_CRED_ERROR);
  }

  const isPasswordValid = await Bun.password.verify(password, user.passwordHash);
  if (!isPasswordValid) {
    throw new Error(INVALID_CRED_ERROR);
  }

  const activeDeviceLink = await prisma.trDeviceUser.findFirst({
    where: {
      userId: user.id,
      isActive: true,
    },
  });

  return {
    userId: user.id,
    deviceId: activeDeviceLink ? activeDeviceLink.deviceId : null,
    username: user.username,
  };
}
