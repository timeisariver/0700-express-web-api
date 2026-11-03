import type { RequestHandler } from "express";
import { unauthorized } from "../lib/httpError";
import { verifyAccessToken } from "../lib/jwt";

// Authorization: Bearer <token> を検証して req.user に入れる。DB は見ない
export const requireAuth: RequestHandler = (req, _res, next) => {
  const match = req.headers.authorization?.match(/^Bearer\s+(\S+)$/i);
  const token = match?.[1];
  if (!token) {
    next(unauthorized());
    return;
  }

  try {
    const { userId } = verifyAccessToken(token);
    req.user = { id: userId };
    next();
  } catch {
    next(unauthorized());
  }
};
