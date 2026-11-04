import type { Request, RequestHandler } from "express";
import { unauthorized } from "../lib/httpError";
import { verifyAccessToken } from "../lib/jwt";

// トークンの検証だけで、DB は見ない。ユーザーが実在するかは、必要なエンドポイント（/users/me）で確かめる
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

// requireAuth を通ったあとのハンドラーで使う。付け忘れたルートでは 401 にする
export const getUserId = (req: Request): string => {
  if (!req.user) throw unauthorized();
  return req.user.id;
};
