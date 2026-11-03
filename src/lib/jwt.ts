import jwt from "jsonwebtoken";

const ACCESS_TOKEN_EXPIRES_IN = "1h";
const REFRESH_TOKEN_EXPIRES_IN = "7d";

// 秘密鍵は環境変数から読む。無ければ設定ミスなので例外にする
const getSecret = (name: "JWT_SECRET" | "JWT_REFRESH_SECRET"): string => {
  const secret = process.env[name];
  if (!secret) {
    throw new Error(`${name} is not set`);
  }
  return secret;
};

// 起動時に呼び、秘密鍵が無ければ例外で止める（リクエストの途中で 500 になるのを防ぐ）
export const assertJwtSecrets = (): void => {
  getSecret("JWT_SECRET");
  getSecret("JWT_REFRESH_SECRET");
};

export const signAccessToken =(userId: string): string =>
  jwt.sign({}, getSecret("JWT_SECRET"), {
    subject: userId,
    expiresIn: ACCESS_TOKEN_EXPIRES_IN,
  });

export const signRefreshToken = (userId: string): string =>
  jwt.sign({}, getSecret("JWT_REFRESH_SECRET"), {
    subject: userId,
    expiresIn: REFRESH_TOKEN_EXPIRES_IN,
  });

// 署名・形式・期限のどれかが不正なら例外を投げる
export const verifyAccessToken = (token: string): { userId: string } => {
  const payload = jwt.verify(token, getSecret("JWT_SECRET"), {
    algorithms: ["HS256"],
  });
  if (typeof payload === "string" || typeof payload.sub !== "string" || payload.sub === "") {
    throw new Error("Invalid token payload");
  }
  return { userId: payload.sub };
};
