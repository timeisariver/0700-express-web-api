# 課題の Web API 一式 実装プラン

## 仕様書

_specs/express-web-api.md

## 全体像

- まだコードが無いので、第 1 段階で Express 5 + TypeScript + Prisma 7 + PostgreSQL（Docker）の土台と、共通処理（Prisma クライアント、JWT、ページネーション、エラー、認証ミドルウェア）、DB のテーブル・マイグレーション・Seed をまとめて作る。
- 第 2 段階で、リソースごと（認証・ユーザー / プロジェクト / タスク）に model・controller・router を並列に作る。各 router は自分で `requireAuth` を付けるので、結線は mount だけで済む。
- 第 3 段階で、`src/routes/index.ts` に 3 つの router を登録する。
- 構成は MVC: `src/routes`（URL と controller の対応）→ `src/controllers`（入力チェックとレスポンスの形）→ `src/models`（Prisma でのデータ操作）。

## タスク

### 第 1 段階

#### タスク 1-1: プロジェクトの土台・DB・共通処理

- **目的**: `npm run dev` で `http://localhost:3000/api/v1` が起動し、`npm run db:seed` でテストの前提のデータが入り、リクエストログとクエリログが出る状態にする。第 2 段階が使う共通処理を作る。
- **担当範囲**:
  - `package.json`, `package-lock.json`, `tsconfig.json`
  - `.gitignore`（`src/generated/` を足す）, `.env.example`, `docker-compose.yml`
  - `prisma.config.ts`, `prisma/schema.prisma`, `prisma/migrations/`, `prisma/seed.ts`
  - `src/server.ts`, `src/app.ts`, `src/routes/index.ts`（空の router だけ）
  - `src/lib/`（`prisma.ts`, `httpError.ts`, `jwt.ts`, `pagination.ts`）
  - `src/middlewares/`（`requireAuth.ts`, `errorHandler.ts`）
  - `src/types/express.d.ts`
- **満たす要件**:
  - 共通: サーバーが `http://localhost:3000` で起動し、`/api/v1` 配下で受け付ける
  - 共通: `Authorization` ヘッダーが無い・トークンが不正（署名・形式・期限切れ）なとき `401`（`requireAuth` として用意。各 router で使う）
  - 共通: リクエストログ（メソッド・パス・ステータス）が出る
  - 共通: Prisma の SQL のクエリログが出る
  - 共通: エラー時のボディは `{ "message": "<英語の短い文>" }`
  - エラー: `500` のとき内部の情報を返さない。不正な JSON ボディは `400`
  - Seed データのすべて（ユーザー 1 人、プロジェクト 3 件を programming → english → design の順で作成日時が古くなるように、タスク 4 件（`scheduled` 3 件・`completed` 1 件）、毎回消してから入れ直す、パスワードはハッシュ化）
- **作る公開 API**:
  - **npm scripts**: `dev`（`tsx watch src/server.ts`）, `build`（`tsc`）, `start`（`node dist/server.js`）, `typecheck`（`tsc --noEmit`）, `db:migrate`（`prisma migrate dev`）, `db:seed`（`prisma db seed`）, `postinstall`（`prisma generate`）
  - **環境変数**（`.env.example` に見本を書く）: `PORT`（既定 `3000`）, `DATABASE_URL`, `POSTGRES_USER`, `POSTGRES_PASSWORD`, `POSTGRES_DB`, `JWT_SECRET`, `JWT_REFRESH_SECRET`
  - **Prisma のモデル**（`prisma/schema.prisma`、generator は `prisma-client`、出力先は `src/generated/prisma`、テーブル名は `@@map` で複数形の snake_case）:
    - `enum UserStatus { active deactive }`, `enum TaskKind { task milestone }`, `enum TaskStatus { scheduled completed archived }`
    - `User`（`users`）: `id String @id @default(uuid()) @db.Uuid`, `username String`, `email String @unique`, `passwordHash String`, `status UserStatus @default(active)`, `createdAt DateTime @default(now())`, `updatedAt DateTime @updatedAt`
    - `Project`（`projects`）: `id`（UUID）, `userId`（UUID、`User` への FK、削除は cascade）, `name String`, `slug String`, `goal String?`, `shouldbe String?`, `color String?`, `deadline DateTime?`, `startingAt DateTime?`, `startedAt DateTime?`, `finishedAt DateTime?`, `createdAt`, `updatedAt`。`@@unique([userId, slug])`
    - `Task`（`tasks`）: `id`（UUID）, `userId`（UUID、`User` への FK、cascade）, `projectId`（UUID、`Project` への FK、cascade）, `title String`, `kind TaskKind`, `description String`, `status TaskStatus`, `startingAt DateTime?`, `deadline DateTime`, `createdAt`, `updatedAt`
    - 生成される型: `import { Prisma, type User, type Project, type Task, TaskStatus, TaskKind } from "../generated/prisma/client"`（パスは呼び出し元からの相対）
  - `src/lib/prisma.ts`: `prisma: PrismaClient`（`@prisma/adapter-pg` の `PrismaPg` を使い、`log` でクエリを標準出力に出す）
  - `src/lib/httpError.ts`:
    - `class HttpError extends Error { status: number; constructor(status: number, message: string) }`
    - `badRequest(message?: string): HttpError`（既定 `"Invalid request"`）, `unauthorized(message?: string): HttpError`（既定 `"Unauthorized"`）, `notFound(message?: string): HttpError`（既定 `"Not found"`）, `conflict(message: string): HttpError`
  - `src/lib/jwt.ts`:
    - `signAccessToken(userId: string): string`（`JWT_SECRET`、有効期限 1 時間、`sub` にユーザー ID）
    - `signRefreshToken(userId: string): string`（`JWT_REFRESH_SECRET`、有効期限 7 日）
    - `verifyAccessToken(token: string): { userId: string }`（不正なら例外）
  - `src/lib/pagination.ts`:
    - `type Pagination = { limit: number; page: number }`
    - `type PageInfo = { totalCount: number; limit: number; page: number; hasNext: boolean; hasPrevious: boolean }`
    - `parsePagination(query: Request["query"]): Pagination`（既定 `limit=20`, `page=1`。`limit` が 1〜100 の整数でない、`page` が 1 以上の整数でない、配列で渡された、のどれかなら `badRequest()` を投げる）
    - `toPageInfo(totalCount: number, pagination: Pagination): PageInfo`（`hasNext = page * limit < totalCount`, `hasPrevious = page > 1`）
  - `src/middlewares/requireAuth.ts`: `requireAuth: RequestHandler`（`Authorization: Bearer <token>` を検証し、`req.user = { id: string }` を入れる。無い・不正なら `unauthorized()`）
  - `src/types/express.d.ts`: `Express.Request` に `user?: { id: string }` を足す
  - `src/middlewares/errorHandler.ts`:
    - `notFoundHandler: RequestHandler`（どのルートにも当たらないとき `404 { message: "Not found" }`）
    - `errorHandler: ErrorRequestHandler`（`HttpError` はその `status` と `message`。`express.json()` の JSON 構文エラーは `400`。それ以外はログに出して `500 { message: "Internal server error" }`）
  - `src/routes/index.ts`: `apiRouter: Router`（このタスクでは空。第 3 段階で登録する）
  - `src/app.ts`: `app: Express`（`morgan("dev")` → `express.json()` → `app.use("/api/v1", apiRouter)` → `notFoundHandler` → `errorHandler`）
  - `src/server.ts`: `PORT` で `app.listen`
- **使う公開 API**: なし
- **確かめ方**:
  - `.env.example` を `.env` にコピーし、`docker compose up -d` で DB が起動する
  - `npx prisma migrate dev --name init` が通り、`prisma/migrations/` ができる
  - `npm run db:seed` が 2 回続けて通る
  - `npm run typecheck` と `npm run build` が通る
  - （起動・テストは統合後にまとめて行うので、`npm run dev` と `test/` は未確認でよい）

### 第 2 段階

#### タスク 2-1: 認証とユーザー（signup / login / me）

- **目的**: ユーザー登録・ログインでトークンを発行し、ログイン中のユーザー情報を返す。
- **担当範囲**:
  - `src/routes/auth.ts`, `src/routes/users.ts`
  - `src/controllers/authController.ts`, `src/controllers/usersController.ts`
  - `src/models/userModel.ts`
- **満たす要件**:
  - 認証のすべて（login の `200`・`401`（パスワード誤り・存在しない email）、signup の `200`・`409`・`400`、登録ユーザーは `status: active`、パスワードのハッシュ化、signup のトークンで `/users/me` が使える）
  - ユーザーのすべて（`GET /users/me` の `200` と項目、Seed ユーザーの値、パスワードを返さない）
  - エラー: signup の入力不正 `400`、login の誤り `401`、登録済み email `409`
- **作る公開 API**:
  - `authRouter: Router`（`POST /signup`, `POST /login`。認証不要）
  - `usersRouter: Router`（`GET /me`。ルートごとに `requireAuth` を付ける。`router.use(requireAuth)` にはしない。`/users` に mount したとき `/users/projects` などへの影響を避けるため）
  - `src/models/userModel.ts`:
    - `findUserByEmail(email: string): Promise<User | null>`
    - `findUserById(id: string): Promise<User | null>`
    - `createUser(input: { username: string; email: string; passwordHash: string }): Promise<User>`
  - レスポンスの形: 認証は `{ data: { uuid, accessToken, refreshToken } }`、me は `{ data: { id, username, email, status } }`
- **使う公開 API**: `prisma`, `badRequest` / `unauthorized` / `conflict`, `signAccessToken`, `signRefreshToken`, `requireAuth`, Prisma の `User` 型
- **確かめ方**:
  - `npm run typecheck` が通る
  - （`test/tests/auth.test.ts`・`user.test.ts` は統合後に確かめるので未確認でよい）

#### タスク 2-2: プロジェクト（一覧 / slug で取得）

- **目的**: ログイン中のユーザーのプロジェクトを、ページネーション付きの一覧と slug で返す。
- **担当範囲**:
  - `src/routes/projects.ts`
  - `src/controllers/projectsController.ts`
  - `src/models/projectModel.ts`
- **満たす要件**:
  - プロジェクトのすべて（`limit`/`page` と `pageInfo`、作成日時の昇順 → `id` の昇順、既定値と `400`、自分のプロジェクトだけ、slug で取得、存在しない・他のユーザーの slug は `404`）
  - エラー: `limit`・`page` の不正 `400`、slug が無いとき `404`（`"Project not found"`）
- **作る公開 API**:
  - `projectsRouter: Router`（`GET /`, `GET /:slug`。`router.use(requireAuth)`）
  - `src/models/projectModel.ts`:
    - `findProjectsByUser(userId: string, pagination: Pagination): Promise<{ projects: Project[]; totalCount: number }>`（`orderBy: [{ createdAt: "asc" }, { id: "asc" }]`）
    - `findProjectBySlug(userId: string, slug: string): Promise<Project | null>`
  - レスポンスの形: Project は `id, name, slug, goal, shouldbe, color, createdAt, updatedAt, deadline, startingAt, startedAt, finishedAt`（`userId` は返さない、値が無ければ `null`）。一覧は `{ data, pageInfo }`
- **使う公開 API**: `prisma`, `parsePagination`, `toPageInfo`, `Pagination`, `notFound`, `requireAuth`, Prisma の `Project` 型
- **確かめ方**:
  - `npm run typecheck` が通る
  - （`test/tests/projects.test.ts` は統合後に確かめるので未確認でよい）

#### タスク 2-3: タスク（一覧 / 作成 / 取得 / 更新 / 削除）

- **目的**: ログイン中のユーザーのタスクの CRUD と、`status` で絞り込める一覧を作る。
- **担当範囲**:
  - `src/routes/tasks.ts`
  - `src/controllers/tasksController.ts`
  - `src/models/taskModel.ts`
- **満たす要件**:
  - タスクのすべて（一覧の `status` 絞り込み・並び順・既定値・`400`・自分のタスクだけ、作成の `201` と各 `400`（必須項目、`status`、`kind`、日付、存在しない・他のユーザーの・UUID の形でない `projectId`）、取得・更新・削除の `200` と `404`（存在しない・他のユーザーの・UUID の形でない ID）、更新で `title` を空にすると `400`）
  - エラー: タスクに関する `400` と `404`（`"Task not found"`）
- **作る公開 API**:
  - `tasksRouter: Router`（`GET /`, `POST /`, `GET /:id`, `PATCH /:id`, `DELETE /:id`。`router.use(requireAuth)`）
  - `src/models/taskModel.ts`:
    - `findTasksByUser(userId: string, query: Pagination & { status?: TaskStatus }): Promise<{ tasks: Task[]; totalCount: number }>`（`orderBy: [{ createdAt: "asc" }, { id: "asc" }]`）
    - `findTaskById(userId: string, id: string): Promise<Task | null>`
    - `createTask(userId: string, input: TaskCreateInput): Promise<Task>`
    - `updateTask(userId: string, id: string, input: Partial<TaskCreateInput>): Promise<Task | null>`（見つからなければ `null`）
    - `deleteTask(userId: string, id: string): Promise<Task | null>`（見つからなければ `null`。削除前の Task を返す）
    - `projectBelongsToUser(userId: string, projectId: string): Promise<boolean>`
    - `type TaskCreateInput = { title: string; kind: TaskKind; description: string; status: TaskStatus; projectId: string; startingAt?: Date; deadline: Date }`
  - レスポンスの形: Task は `id, title, kind, description, status, startingAt, deadline, createdAt, updatedAt`（`userId`・`projectId` は返さない、値が無ければ `null`）。一覧は `{ data, pageInfo }`、作成は `201 { data }`、他は `200 { data }`
- **使う公開 API**: `prisma`, `parsePagination`, `toPageInfo`, `Pagination`, `badRequest`, `notFound`, `requireAuth`, Prisma の `Task` 型と `TaskStatus` / `TaskKind`
- **確かめ方**:
  - `npm run typecheck` が通る
  - （`test/tests/tasks.test.ts` は統合後に確かめるので未確認でよい）

### 第 3 段階

#### タスク 3-1: router の登録

- **目的**: 第 2 段階の router を `/api/v1` 配下に登録し、全エンドポイントを使える状態にする。
- **担当範囲**:
  - `src/routes/index.ts`
- **満たす要件**:
  - 対象エンドポイントのすべてが `/api/v1` 配下で応答する
  - 共通: 認証必須のエンドポイントがトークンなしで `401` を返す（authRequired.test.ts）
- **作る公開 API**:
  - `apiRouter` に次を登録する（この順）: `/auth` → `authRouter`, `/users/projects` → `projectsRouter`, `/users/tasks` → `tasksRouter`, `/users` → `usersRouter`
- **使う公開 API**: `authRouter`, `usersRouter`, `projectsRouter`, `tasksRouter`
- **確かめ方**:
  - `npm run typecheck` と `npm run build` が通る
  - （起動と `test/` は `/implement` の統合後のテストで確かめる）

## 要件の割り当て

| 要件 | タスク |
| ---- | ------ |
| 共通: `localhost:3000` の `/api/v1` で受け付ける | 1-1, 3-1 |
| 共通: ヘッダーが無いとき `401` | 1-1（`requireAuth`）, 2-1〜2-3（付ける）, 3-1 |
| 共通: トークンが不正なとき `401` | 1-1 |
| 共通: リクエストログ | 1-1 |
| 共通: クエリログ | 1-1 |
| 共通: エラーのボディは `{ message }` | 1-1 |
| 認証: login 成功 `200` と `uuid`・トークン | 2-1 |
| 認証: login のパスワード誤り・存在しない email は `401` | 2-1 |
| 認証: signup 成功 `200` と `uuid`・トークン | 2-1 |
| 認証: signup のトークンで `/users/me` が使える | 2-1 |
| 認証: signup したユーザーは `active` | 1-1（既定値）, 2-1 |
| 認証: 登録済み email は `409` | 2-1 |
| 認証: signup の入力不正は `400` | 2-1 |
| 認証: パスワードをハッシュ化して保存 | 2-1, 1-1（Seed） |
| ユーザー: `/users/me` の `200` と項目 | 2-1 |
| ユーザー: Seed ユーザーの値 | 1-1, 2-1 |
| ユーザー: パスワードを返さない | 2-1 |
| プロジェクト: `limit=1&page=1` と `pageInfo` | 2-2 |
| プロジェクト: 3 ページを programming → english → design の順 | 1-1（Seed の作成日時）, 2-2（並び順） |
| プロジェクト: 作成日時の昇順 → `id` の昇順 | 2-2 |
| プロジェクト: 既定値 `limit=20`・`page=1` | 1-1（`parsePagination`）, 2-2 |
| プロジェクト: `limit`・`page` の不正は `400` | 1-1（`parsePagination`）, 2-2 |
| プロジェクト: `pageInfo` の値 | 1-1（`toPageInfo`）, 2-2 |
| プロジェクト: 自分のプロジェクトだけ | 2-2 |
| プロジェクト: slug で取得 `200` | 2-2 |
| プロジェクト: 存在しない・他のユーザーの slug は `404` | 2-2 |
| タスク: `status=scheduled` の一覧 `200` | 2-3 |
| タスク: `status` の絞り込み・省略時は全件 | 2-3 |
| タスク: 3 ページを並行して取って ID が重ならない | 1-1（Seed の `scheduled` 3 件）, 2-3（並び順） |
| タスク: 作成日時の昇順 → `id` の昇順 | 2-3 |
| タスク: `limit`・`page` の既定値と `400` | 1-1（`parsePagination`）, 2-3 |
| タスク: 不正・複数の `status` は `400` | 2-3 |
| タスク: 自分のタスクだけ | 2-3 |
| タスク: 作成 `201` と `data` | 2-3 |
| タスク: 作成の必須項目の欠け `400` | 2-3 |
| タスク: 作成の不正な `status`・`kind`・日付 `400` | 2-3 |
| タスク: 作成の存在しない・他のユーザーの・UUID の形でない `projectId` は `400` | 2-3 |
| タスク: 取得 `200`・存在しない ID は `404` | 2-3 |
| タスク: 更新 `200`・存在しない ID は `404` | 2-3 |
| タスク: 更新の不正な `status`・`projectId`・`kind`・`deadline` は `400` | 2-3 |
| タスク: 更新で `title` を空にすると `400` | 2-3 |
| タスク: 削除 `200`・その後の取得は `404` | 2-3 |
| タスク: 削除の存在しない ID は `404` | 2-3 |
| タスク: 他のユーザーの・UUID の形でない ID は `404` | 2-3 |
| エラー: `400` | 1-1（JSON 構文エラー）, 2-1, 2-2, 2-3 |
| エラー: `401` | 1-1, 2-1 |
| エラー: `404` | 1-1（未定義のルート）, 2-2, 2-3 |
| エラー: `409` | 2-1 |
| エラー: `500` で内部の情報を返さない | 1-1 |
| Seed: ユーザー | 1-1 |
| Seed: プロジェクト 3 件と並び順 | 1-1 |
| Seed: タスク 4 件（`scheduled` 3 件・`completed` 1 件） | 1-1 |
| Seed: 何度実行しても同じ状態 | 1-1 |

## 判断した点

- **第 1 段階は 1 タスクにまとめる**: まだ `package.json` が無く、共通処理を別タスクに分けると、並列の worktree では依存パッケージが入らず型チェックできないため。
- **使うライブラリ**（2026-11-04 時点の npm で確認）:
  - `express@5`（async のハンドラーで投げたエラーが自動で `errorHandler` に届く）、`@types/express@5`
  - `prisma@7` / `@prisma/client@7` / `@prisma/adapter-pg@7`（`latest` タグは 8.0.0 の RC なので、安定版の 7.x に固定する。Prisma 7 の形に合わせて `prisma.config.ts` で接続先と Seed のコマンドを決め、クライアントは driver adapter で作る）
  - `jsonwebtoken@9`（JWT）、`bcryptjs@3`（パスワードのハッシュ。ネイティブビルドが要らない）、`zod@4`（入力チェック）、`morgan`（リクエストログ）、`dotenv`（`.env` の読み込み）
  - 開発用: `tsx`（`npm run dev` の実行と Seed）、`typescript@5`（7.x はネイティブ版への移行直後なので、`test/` と同じ 5 系にする）
- **DB**: `docker-compose.yml` で `postgres:17` を 5432 番に立てる。ユーザー名・パスワード・DB 名は `.env` から読む。
- **ID**: Prisma の `@default(uuid())`（UUID v4）。テストの UUID の形（バージョン 1〜5）に合う。
- **プロジェクトとタスクのどちらにも `userId` を持たせる**: タスクの取得・更新・削除を「ID とユーザー ID」の 1 回の条件で絞れるので、所有者のチェックがシンプルになる。
- **トークン**: アクセストークンは `JWT_SECRET` で署名し 1 時間、リフレッシュトークンは `JWT_REFRESH_SECRET` で署名し 7 日。リフレッシュトークンは返すだけで、検証も保存もしない。
- **`requireAuth` は DB を見ない**: トークンの検証だけで `req.user.id` を入れる。`GET /users/me` でユーザーが見つからない（Seed をやり直した後の古いトークンなど）ときは `401` を返す。
- **入力チェック**: controller の中で zod を使う。UUID の形でない `:id` は DB に問い合わせる前に `404`、UUID の形でない `projectId` は `400` にする（DB の UUID 型に渡すと `500` になるため）。
- **日付**: `startingAt`・`deadline` は `new Date(value)` で読めるか（`NaN` でないか）で判定し、`Date` にして保存する。`2024-12-31` は UTC の 0 時になる。返すときは `res.json` の標準の変換（`toISOString()`）で `...Z` の形になる。
- **レスポンスの形**: Prisma の `select` で返す項目だけを取り出す（`passwordHash`・`userId`・`projectId` を出さない）。値が無い項目は `null` のまま返す（テストは `null` を許す）。
- **Seed**: `deleteMany` でタスク → プロジェクト → ユーザーの順に全件消してから入れ直す。プロジェクトとタスクは `createdAt` を明示して、programming → english → design の順、タスクは今より前の日時にする（テスト中に作るタスクより必ず前に並び、`limit=1` の 1〜3 ページが Seed のタスクになる）。
- **ログ**: リクエストログは `morgan("dev")`（例: `GET /api/v1/users/me 200 3.1 ms`）。クエリログは `PrismaClient` の `log: ["query"]` で SQL を出す。
- **router の登録順**: `/users` より先に `/users/projects`・`/users/tasks` を登録する。`usersRouter` は `/me` にだけ `requireAuth` を付けるので、順番が変わっても動くが、読みやすさのためにそろえる。
- **Prisma の生成物**: `src/generated/prisma` に出し、`.gitignore` に入れる。`postinstall` で `prisma generate` するので、`npm install` だけで型が使える。

## 最終確認

- `.env.example` を `.env` にコピーする（`.env` はコミットしない）
- `docker compose up -d` → `npx prisma migrate dev` → `npm run db:seed` が通る
- `npm run typecheck` と `npm run build` が通る
- `npm run dev` のあと、`test/` で `npm install` → `npm run test` が全部通る
- `npm run dev` のターミナルに、リクエストログ（例: `GET /api/v1/users/me 200`）と SQL のクエリログが出る
- `curl` でログイン → `Authorization: Bearer <accessToken>` を付けて `GET /api/v1/users/me` が `200`、ヘッダーを外すと `401`
- `npm run db:seed` をもう一度実行してもエラーにならない
