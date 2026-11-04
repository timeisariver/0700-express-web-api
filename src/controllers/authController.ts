import bcrypt from "bcryptjs";
import type { RequestHandler } from "express";
import { z } from "zod";
import { Prisma } from "../generated/prisma/client";
import { conflict, unauthorized } from "../lib/httpError";
import { signAccessToken, signRefreshToken } from "../lib/jwt";
import { parseOrThrow } from "../lib/validation";
import { createUser, findUserByEmail } from "../models/userModel";

const BCRYPT_ROUNDS = 10;

// email は小文字にそろえてから確かめ・保存・検索する（Test@Example.com と test@example.com を同じ人として扱う）
const normalizedEmail = z.string().toLowerCase();

const signupSchema = z
  .object({
    username: z.string().min(1),
    email: normalizedEmail.pipe(z.email()),
    email_confirmation: normalizedEmail.min(1),
    password: z.string().min(1),
    password_confirmation: z.string().min(1),
  })
  .refine((body) => body.email === body.email_confirmation)
  .refine((body) => body.password === body.password_confirmation);

const loginSchema = z.object({
  email: normalizedEmail.min(1),
  password: z.string().min(1),
});

const toAuthData = (userId: string) => ({
  uuid: userId,
  accessToken: signAccessToken(userId),
  refreshToken: signRefreshToken(userId),
});

const isUniqueConstraintError = (err: unknown): boolean =>
  err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002";

export const signup: RequestHandler = async (req, res) => {
  const { username, email, password } = parseOrThrow(signupSchema, req.body);

  // email の重複は 2 段階で止める。ここで先に検索するのは、重複のときに遅いハッシュ計算をせず 409 を返すため
  if (await findUserByEmail(email)) throw conflict("Email already exists");

  const passwordHash = await bcrypt.hash(password, BCRYPT_ROUNDS);
  try {
    const user = await createUser({ username, email, passwordHash });
    res.status(200).json({ data: toAuthData(user.id) });
  } catch (err) {
    // 同じ email の登録が同時に来ると上の検索をどちらも通り抜けるので、最後は DB のユニーク制約で止める
    if (isUniqueConstraintError(err)) throw conflict("Email already exists");
    throw err;
  }
};

export const login: RequestHandler = async (req, res) => {
  const { email, password } = parseOrThrow(loginSchema, req.body, () =>
    unauthorized("Invalid email or password"),
  );

  const user = await findUserByEmail(email);
  if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
    throw unauthorized("Invalid email or password");
  }

  res.status(200).json({ data: toAuthData(user.id) });
};
