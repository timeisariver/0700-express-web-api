import type { RequestHandler } from "express";
import { unauthorized } from "../lib/httpError";
import { getUserId } from "../middlewares/requireAuth";
import { findUserById } from "../models/userModel";

export const getMe: RequestHandler = async (req, res) => {
  const userId = getUserId(req);

  // トークンは有効でも、ユーザーが消えている（Seed のやり直しなど）ことがある
  const user = await findUserById(userId);
  if (!user) throw unauthorized();

  // passwordHash は返さない
  res.status(200).json({
    data: { id: user.id, username: user.username, email: user.email, status: user.status },
  });
};
