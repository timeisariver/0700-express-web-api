import type { User } from "../generated/prisma/client";
import { prisma } from "../lib/prisma";

export const findUserByEmail = (email: string): Promise<User | null> =>
  prisma.user.findUnique({ where: { email } });

export const findUserById = (id: string): Promise<User | null> =>
  prisma.user.findUnique({ where: { id } });

export const createUser = (input: {
  username: string;
  email: string;
  passwordHash: string;
}): Promise<User> => prisma.user.create({ data: input });
