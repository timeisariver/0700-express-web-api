export const apiBaseUrl =
  process.env.API_BASE_URL?.replace(/\/$/, "") ?? "http://localhost:3000/api/v1";

export const setupMessage =
  "テスト対象サーバに接続できません。先に学習者サーバを http://localhost:3000 で起動し、学習者サーバ側で npm run db:seed を実行してください。";
