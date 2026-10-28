# Express Web API Black-box Tests

学習者が実装した Express Web API に対して HTTP リクエストを送り、レスポンスが課題仕様を満たしているか検証する Vitest プロジェクトです。

## 参照仕様

テストは次の OpenAPI 仕様を参考にしています。

https://vws-api-spec-host.netlify.app//specs/yml?id=express-web-api

ただし、参照仕様内で Task ID の定義に不整合があります。このテストでは Task ID を UUID として扱います。

## 実行手順

学習者サーバ側で次を実行してください。

```bash
npm run db:seed
npm run dev
```

サーバが `http://localhost:3000` で起動している状態で、このテストプロジェクト側から次を実行します。

```bash
npm install
npm run test
```

テスト対象 URL はデフォルトで `http://localhost:3000/api/v1` です。別 URL を使う場合は `API_BASE_URL` で上書きできます。

```bash
API_BASE_URL=http://localhost:3001/api/v1 npm run test
```

## Seed データ契約

テストコードを正として、学習者は `npm run db:seed` で以下のデータを投入してください。

- ログイン可能なユーザー
  - email: `test@example.com`
  - password: `password`
  - username: `Test User`
  - status: `active`
- 取得可能なプロジェクト
  - `limit=1` のページネーションで次の順に取得できる 3 件
    - page 1: slug `programming`, id: UUID
    - page 2: slug `english`, id: UUID
    - page 3: slug `design`, id: UUID
- タスク一覧確認用のタスク
  - status: `scheduled` のタスクが 1 件以上

CRUD の検証対象タスクは、テスト実行中に API から作成します。

## API 振る舞い契約

テストは、次の API 振る舞いを前提にしています。

### 認証

- `POST /auth/login`
  - seed ユーザーの `email` / `password` で `200` を返す
  - 不正な password で `401` を返す
  - レスポンス `data` に `uuid`, `accessToken`, `refreshToken` を含む
- `POST /auth/signup`
  - 一意な email と確認用フィールドが一致する payload で `200` を返す
  - レスポンス `data` に `uuid`, `accessToken`, `refreshToken` を含む
  - 既存ユーザーと重複する email で `409` を返す

### 認証必須エンドポイント

次のエンドポイントは、トークンなしのリクエストで `401` を返してください。

- `GET /users/me`
- `GET /users/projects`
- `GET /users/projects/:slug`
- `GET /users/tasks`
- `POST /users/tasks`
- `GET /users/tasks/:id`
- `PATCH /users/tasks/:id`
- `DELETE /users/tasks/:id`

### ユーザー

- `GET /users/me`
  - 認証済みの場合は `200` を返す
  - レスポンス `data` に UUID 形式の `id`, `username`, `email`, `status` を含む
  - seed ユーザーの `username`, `email`, `status` と一致する

### プロジェクト

- `GET /users/projects?limit=1&page=1`
  - `200` を返す
  - レスポンス `data` は最大 1 件
  - レスポンス `pageInfo` に `totalCount`, `limit`, `page`, `hasNext`, `hasPrevious` を含む
- `GET /users/projects?limit=1&page=1..3`
  - page 1, 2, 3 の各レスポンス `data` は 1 件
  - page 1, 2, 3 の slug は `programming`, `english`, `design` の順で返る
  - page 1, 2, 3 の id は重複しない
- `GET /users/projects/programming`
  - `200` を返す
  - レスポンス `data` に UUID 形式の `id`, `name`, `slug` を含む
- 存在しない slug は `404` を返す

### タスク

- `GET /users/tasks?limit=20&page=1&status=scheduled`
  - `200` を返す
  - `scheduled` のタスクを 1 件以上返す
  - レスポンス `pageInfo` に `totalCount`, `limit`, `page`, `hasNext`, `hasPrevious` を含む
- `GET /users/tasks?limit=1&page=1..3&status=scheduled`
  - page 1, 2, 3 の各レスポンス `data` は 1 件
  - page 1, 2, 3 の task id は重複しない
- `POST /users/tasks`
  - 正しい payload で `201` を返す
  - 不正な payload で `400` を返す
  - 不正な `status` で `400` を返す
  - 存在しない `projectId` で `400` を返す
  - 不正な `kind` で `400` を返す
  - 不正な `deadline` で `400` を返す
- `GET /users/tasks/:id`
  - 作成済みタスク ID で `200` を返す
  - 存在しない UUID 形式の ID は `404` を返す
- `PATCH /users/tasks/:id`
  - 作成済みタスク ID と正しい payload で `200` を返す
  - 存在しない UUID 形式の ID は `404` を返す
  - 不正な `status` で `400` を返す
  - 存在しない `projectId` で `400` を返す
  - 不正な `kind` で `400` を返す
  - 不正な `deadline` で `400` を返す
- `DELETE /users/tasks/:id`
  - 作成済みタスク ID で `200` を返す
  - 存在しない UUID 形式の ID は `404` を返す
