import type { ErrorRequestHandler, RequestHandler } from "express";
import { HttpError } from "../lib/httpError";

export const notFoundHandler: RequestHandler = (_req, res) => {
  res.status(404).json({ message: "Not found" });
};

// express.json() が投げる、ボディの読み込みのエラー（JSON の構文エラーなど）
const isBodyParseError = (err: unknown): boolean => {
  if (typeof err !== "object" || err === null) return false;
  const e = err as { type?: unknown; status?: unknown };
  return e.type === "entity.parse.failed" || (err instanceof SyntaxError && e.status === 400);
};

export const errorHandler: ErrorRequestHandler = (err, _req, res, _next) => {
  if (err instanceof HttpError) {
    res.status(err.status).json({ message: err.message });
    return;
  }

  if (isBodyParseError(err)) {
    res.status(400).json({ message: "Invalid request" });
    return;
  }

  // 内部の情報はログにだけ出し、レスポンスには出さない
  console.error(err);
  res.status(500).json({ message: "Internal server error" });
};
