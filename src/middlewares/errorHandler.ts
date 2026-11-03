import type { ErrorRequestHandler, RequestHandler } from "express";
import { HttpError } from "../lib/httpError";

export const notFoundHandler: RequestHandler = (_req, res) => {
  res.status(404).json({ message: "Not found" });
};

// express.json() が投げる、ボディの読み込みのエラー（JSON の構文エラー 400、大きすぎるボディ 413、
// 対応していない文字コード 415 など）。4xx のステータスを持つので、それをそのまま返す
const getBodyParseErrorStatus = (err: unknown): number | undefined => {
  if (typeof err !== "object" || err === null) return undefined;
  const e = err as { type?: unknown; status?: unknown; expose?: unknown };
  if (typeof e.type !== "string" || e.expose !== true) return undefined;
  if (typeof e.status !== "number" || e.status < 400 || e.status >= 500) return undefined;
  return e.status;
};

export const errorHandler: ErrorRequestHandler = (err, _req, res, _next) => {
  if (err instanceof HttpError) {
    res.status(err.status).json({ message: err.message });
    return;
  }

  const bodyParseErrorStatus = getBodyParseErrorStatus(err);
  if (bodyParseErrorStatus !== undefined) {
    res.status(bodyParseErrorStatus).json({ message: "Invalid request" });
    return;
  }

  // 内部の情報はログにだけ出し、レスポンスには出さない
  console.error(err);
  res.status(500).json({ message: "Internal server error" });
};
