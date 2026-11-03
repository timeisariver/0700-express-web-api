# 課題の Web API 一式

## 概要

課題の API 仕様にあるエンドポイント（認証・ユーザー・プロジェクト・タスク）をすべて実装し、`test/` の判定用テストが全部通る状態にする。あわせて、Seed データ・リクエストログ・クエリログを用意する。

## 対象エンドポイント

ベース URL は `http://localhost:3000/api/v1`。

| メソッド | パス                     | 認証 |
| -------- | ------------------------ | ---- |
| POST     | `/auth/signup`           | 不要 |
| POST     | `/auth/login`            | 不要 |
| GET      | `/users/me`              | 必須 |
| GET      | `/users/projects`        | 必須 |
| GET      | `/users/projects/:slug`  | 必須 |
| GET      | `/users/tasks`           | 必須 |
| POST     | `/users/tasks`           | 必須 |
| GET      | `/users/tasks/:id`       | 必須 |
| PATCH    | `/users/tasks/:id`       | 必須 |
| DELETE   | `/users/tasks/:id`       | 必須 |

認証は `Authorization: Bearer <accessToken>` ヘッダーで受け取る（Cookie は使わない）。

プロジェクトとタスクはユーザーごとに持つ。`/users/...` のエンドポイントは、ログイン中のユーザーのものだけを扱う。

## リクエスト

### `POST /auth/signup`

ボディ（JSON）:

| 項目                    | 型     | 必須 | 制約                         |
| ----------------------- | ------ | ---- | ---------------------------- |
| `username`              | string | ○    | 空文字は不可                 |
| `email`                 | string | ○    | メール形式                   |
| `email_confirmation`    | string | ○    | `email` と一致               |
| `password`              | string | ○    | 空文字は不可（最小文字数は設けない） |
| `password_confirmation` | string | ○    | `password` と一致            |

### `POST /auth/login`

ボディ（JSON）: `email`（string）、`password`（string）

### `GET /users/me`

なし

### `GET /users/projects`

クエリ:

| 項目    | 型      | 必須 | 既定値 | 制約            |
| ------- | ------- | ---- | ------ | --------------- |
| `limit` | integer | ×    | `20`   | 1 以上 100 以下 |
| `page`  | integer | ×    | `1`    | 1 以上 1,000,000 以下 |

### `GET /users/projects/:slug`

パス: `slug`（string）

### `GET /users/tasks`

クエリ:

| 項目     | 型      | 必須 | 既定値 | 制約                                         |
| -------- | ------- | ---- | ------ | -------------------------------------------- |
| `limit`  | integer | ×    | `20`   | 1 以上 100 以下                              |
| `page`   | integer | ×    | `1`    | 1 以上 1,000,000 以下                        |
| `status` | string  | ×    | なし   | `scheduled` / `completed` / `archived` のどれか 1 つ |

### `POST /users/tasks`

ボディ（JSON）:

| 項目          | 型     | 必須 | 制約                                         |
| ------------- | ------ | ---- | -------------------------------------------- |
| `title`       | string | ○    | 空文字は不可                                 |
| `kind`        | string | ○    | `task` / `milestone`                         |
| `description` | string | ○    |                                              |
| `status`      | string | ○    | `scheduled` / `completed` / `archived`       |
| `projectId`   | string | ○    | UUID。ログイン中のユーザーのプロジェクトの ID |
| `startingAt`  | string | ×    | 日付（`2024-01-01`）または ISO 8601 の日時   |
| `deadline`    | string | ○    | 日付（`2024-12-31`）または ISO 8601 の日時   |

### `GET /users/tasks/:id`・`DELETE /users/tasks/:id`

パス: `id`（UUID）

### `PATCH /users/tasks/:id`

パス: `id`（UUID）

ボディ（JSON）: `POST /users/tasks` と同じ項目。すべて任意で、送られた項目だけを更新する。送られた項目の制約は `POST` と同じ。

## レスポンス

成功時のボディは `{ "data": ... }` の形にする。一覧は `{ "data": [...], "pageInfo": {...} }` にする。

| エンドポイント                 | ステータス | `data`                                              |
| ------------------------------ | ---------- | --------------------------------------------------- |
| `POST /auth/signup`            | `200`      | `uuid`（ユーザーの UUID）, `accessToken`, `refreshToken` |
| `POST /auth/login`             | `200`      | `uuid`, `accessToken`, `refreshToken`               |
| `GET /users/me`                | `200`      | User: `id`（UUID）, `username`, `email`, `status`（`active` / `deactive`） |
| `GET /users/projects`          | `200`      | Project の配列 + `pageInfo`                         |
| `GET /users/projects/:slug`    | `200`      | Project                                             |
| `GET /users/tasks`             | `200`      | Task の配列 + `pageInfo`                            |
| `POST /users/tasks`            | `201`      | 作成した Task                                       |
| `GET /users/tasks/:id`         | `200`      | Task                                                |
| `PATCH /users/tasks/:id`       | `200`      | 更新後の Task                                       |
| `DELETE /users/tasks/:id`      | `200`      | 削除した Task                                       |

- **Project**: `id`（UUID）, `name`, `slug`, `goal`, `shouldbe`, `color`, `createdAt`, `updatedAt`, `deadline`, `startingAt`, `startedAt`, `finishedAt`。値が無い項目は `null`。`stats` は返さない。
- **Task**: `id`（UUID）, `title`, `kind`, `description`, `status`, `startingAt`, `deadline`, `createdAt`, `updatedAt`。値が無い項目は `null`。`project`, `parent`, `children`, `startedAt`, `finishedAt`, `archivedAt` は返さない。
- 日時はすべて `2016-08-29T09:12:33.001Z` の形（ISO 8601、UTC）で返す。
- **pageInfo**: `totalCount`（条件に合う全件数）, `limit`, `page`, `hasNext`, `hasPrevious`。`limit` と `page` は実際に使った値を数値で返す。

## 要件

### 共通

- [ ] サーバーが `http://localhost:3000` で起動し、API は `/api/v1` 配下で受け付ける（test: 全体）
- [ ] 認証必須のエンドポイントは、`Authorization` ヘッダーが無いとき `401` を返す（test: authRequired.test.ts）
- [ ] 認証必須のエンドポイントは、トークンが不正（署名が違う・形式が違う・期限切れ）なとき `401` を返す
- [ ] `npm run dev` のターミナルに、リクエストごとのログ（メソッド・パス・ステータス）が出る
- [ ] `npm run dev` のターミナルに、Prisma が発行した SQL のクエリログが出る
- [ ] エラー時のボディは `{ "message": "<英語の短い文>" }` の形にする

### 認証

- [ ] `POST /auth/login` に Seed ユーザーの `email` / `password` を送ると `200` を返し、`data` に UUID の `uuid`、空でない `accessToken`・`refreshToken` を含む（test: auth.test.ts）
- [ ] `POST /auth/login` に誤ったパスワードを送ると `401` を返す（test: auth.test.ts）
- [ ] `POST /auth/login` に存在しない `email` を送ると `401` を返す
- [ ] `POST /auth/signup` に未登録の `email` と、確認用フィールドが一致する payload を送ると `200` を返し、`data` に UUID の `uuid`、空でない `accessToken`・`refreshToken` を含む（test: auth.test.ts）
- [ ] `POST /auth/signup` で登録したユーザーの `accessToken` を付けると、`GET /users/me` が `200` でそのユーザーを返す
- [ ] `POST /auth/signup` で登録したユーザーの `status` は `active` になる
- [ ] `POST /auth/signup` に登録済みの `email` を送ると `409` を返す（test: auth.test.ts）
- [ ] `POST /auth/signup` で必須項目が無い・空、メール形式が違う、`email_confirmation` / `password_confirmation` が一致しないときは `400` を返す
- [ ] パスワードはハッシュ化して保存する（DB に平文で残らない）

### ユーザー

- [ ] `GET /users/me` は `200` を返し、`data` にログイン中のユーザーの `id`（UUID）, `username`, `email`, `status` を含む（test: user.test.ts）
- [ ] Seed ユーザーでは `username: "Test User"`, `email: "test@example.com"`, `status: "active"` を返す（test: user.test.ts）
- [ ] `data` にパスワード（ハッシュを含む）を含めない

### プロジェクト

- [ ] `GET /users/projects?limit=1&page=1` は `200` を返し、`data` は 1 件以下の Project の配列、`pageInfo` は `limit: 1`, `page: 1` を含む（test: projects.test.ts）
- [ ] Seed ユーザーで `GET /users/projects?limit=1&page=1`・`page=2`・`page=3` を呼ぶと、各 1 件ずつ、slug が `programming`・`english`・`design` の順で返り、`id` は重複しない（test: projects.test.ts）
- [ ] 一覧は作成日時の昇順（同じなら `id` の昇順）で並ぶ
- [ ] `limit`・`page` を省略すると、`limit: 20`, `page: 1` として返す
- [ ] `limit` が 1〜100 の整数でない、または `page` が 1〜1,000,000 の整数でないときは `400` を返す
- [ ] `pageInfo.totalCount` は全件数、`hasNext` は次のページがあるとき `true`、`hasPrevious` は `page` が 2 以上のとき `true` を返す
- [ ] 一覧には、ログイン中のユーザーのプロジェクトだけを返す（signup 直後のユーザーは `data: []`）
- [ ] `GET /users/projects/programming` は `200` を返し、`data` に `id`（UUID）, `name`, `slug: "programming"` を含む（test: projects.test.ts）
- [ ] 存在しない slug、または他のユーザーのプロジェクトの slug で `GET /users/projects/:slug` を呼ぶと `404` を返す（test: projects.test.ts）

### タスク

- [ ] `GET /users/tasks?limit=20&page=1&status=scheduled` は `200` を返し、`status` が `scheduled` の Task を 1 件以上返す。`pageInfo` は `limit: 20`, `page: 1` を含む（test: tasks.test.ts）
- [ ] `status` を指定すると、その `status` の Task だけを返す。省略するとすべての `status` を返す（test: tasks.test.ts）
- [ ] `GET /users/tasks?limit=1&page=1`・`page=2`・`page=3`（`status=scheduled`）を並行して呼ぶと、各 1 件ずつ返り、task の `id` は重複しない（test: tasks.test.ts）
- [ ] 一覧は作成日時の昇順（同じなら `id` の昇順）で並ぶ
- [ ] `limit`・`page` の既定値と `400` の条件は、プロジェクト一覧と同じにする
- [ ] `status` が `scheduled` / `completed` / `archived` 以外、または複数指定（`status=a&status=b`）のときは `400` を返す
- [ ] 一覧には、ログイン中のユーザーの Task だけを返す
- [ ] `POST /users/tasks` に正しい payload を送ると `201` を返し、`data` に作成した Task（UUID の `id`、送った `title`・`description`・`status`）を含む（test: tasks.test.ts）
- [ ] `POST /users/tasks` に `{ "title": "" }` のような必須項目の欠けた payload を送ると `400` を返す（test: tasks.test.ts）
- [ ] `POST /users/tasks` に不正な `status` を送ると `400` を返す（test: tasks.test.ts）
- [ ] `POST /users/tasks` に存在しない `projectId`、または他のユーザーのプロジェクトの ID を送ると `400` を返す（test: tasks.test.ts）
- [ ] `POST /users/tasks` に UUID の形でない `projectId` を送ると `400` を返す
- [ ] `POST /users/tasks` に不正な `kind` を送ると `400` を返す（test: tasks.test.ts）
- [ ] `POST /users/tasks` に日付として読めない `deadline`（例: `invalid-date`）または `startingAt` を送ると `400` を返す（test: tasks.test.ts）
- [ ] `GET /users/tasks/:id` に作成済みの Task の ID を渡すと `200` を返し、`data` にその Task（`id`, `title`）を含む（test: tasks.test.ts）
- [ ] `GET /users/tasks/:id` に存在しない UUID を渡すと `404` を返す（test: tasks.test.ts）
- [ ] `PATCH /users/tasks/:id` に作成済みの Task の ID と正しい payload を送ると `200` を返し、`data` に更新後の `title`・`description`・`status` を含む（test: tasks.test.ts）
- [ ] `PATCH /users/tasks/:id` に存在しない UUID を渡すと `404` を返す（test: tasks.test.ts）
- [ ] `PATCH /users/tasks/:id` に不正な `status`・存在しない `projectId`・不正な `kind`・日付として読めない `deadline` を送ると、それぞれ `400` を返す（test: tasks.test.ts）
- [ ] `PATCH /users/tasks/:id` で `title` を空文字にすると `400` を返す
- [ ] `DELETE /users/tasks/:id` に作成済みの Task の ID を渡すと `200` を返し、`data` に削除した Task（`id`）を含む。その後 `GET /users/tasks/:id` は `404` を返す（test: tasks.test.ts）
- [ ] `DELETE /users/tasks/:id` に存在しない UUID を渡すと `404` を返す（test: tasks.test.ts）
- [ ] 他のユーザーの Task の ID、または UUID の形でない ID（例: `abc`）を `GET`・`PATCH`・`DELETE` に渡すと `404` を返す（`500` にしない）

## エラー

エラー時のボディは `{ "message": "<英語の短い文>" }` の形にする（例: `Unauthorized`, `Task not found`, `Email already exists`, `Invalid request`）。

| ステータス | 返すとき                                                                 |
| ---------- | ------------------------------------------------------------------------ |
| `400`      | signup の入力不正。一覧の `limit`・`page`・`status` の不正。タスクの作成・更新で、必須項目の欠け、`status`・`kind`・日付の不正、使えない `projectId` |
| `401`      | 認証必須のエンドポイントでトークンが無い・不正。ログインで email / password が誤り |
| `404`      | 存在しない（または他のユーザーの）slug のプロジェクト、存在しない（他のユーザーの・UUID の形でない）ID のタスク |
| `409`      | signup で登録済みの email                                                |
| `500`      | 想定外のエラー（内部の情報はレスポンスに含めない）                       |

## Seed データ

`npm run db:seed` で次を投入する。何度実行しても同じ状態になる（既存のデータを消してから入れ直す）。

- ログインできるユーザー
  - email: `test@example.com`
  - password: `password`
  - username: `Test User`
  - status: `active`
- 上のユーザーのプロジェクト 3 件。この順に作成日時が古くなるように入れ、`GET /users/projects?limit=1` で次の順に取れる
  - page 1: slug `programming`, name `Programming`
  - page 2: slug `english`, name `English`
  - page 3: slug `design`, name `Design`
- 上のユーザーのタスク 4 件（どれも `programming` プロジェクト、`kind: task`）
  - `status: scheduled` が 3 件
  - `status: completed` が 1 件

## 対象外

- リフレッシュトークンでアクセストークンを更新するエンドポイント（`refreshToken` は返すだけ）
- ログアウト、トークンの無効化
- プロジェクトの作成・更新・削除のエンドポイント
- ユーザー情報の更新・退会のエンドポイント
- Task の `parent` / `children`（親子関係）
- Task の `startedAt` / `finishedAt` / `archivedAt`（`status` を変えたときの自動記録も含む）
- Task のレスポンスに `project` を入れること
- Project の `stats` の集計
- `status` の複数指定による絞り込み
- パスワードの強度チェック（最小文字数など）
- メールアドレスの確認メール・パスワードリセット
- Cookie を使った認証
- アプリケーションの公開（デプロイ）

## 補足

- API 仕様: https://vws-api-spec-host.netlify.app/specs?id=express-web-api（OpenAPI: `https://vws-api-spec-host.netlify.app/specs/yml?id=express-web-api`）
- 参考にしたテスト: `test/tests/auth.test.ts`, `authRequired.test.ts`, `user.test.ts`, `projects.test.ts`, `tasks.test.ts`, `support/contracts.ts`, `support/assertions.ts`, `testData.ts`

### API 仕様とテストの食い違い（テストを正とする）

- **Task ID**: `test/README.md` にあるとおり、仕様内の Task ID の定義に不整合がある。テストに合わせて UUID として扱う。
- **`POST /users/tasks` のレスポンス**: API 仕様の `201` にはボディの定義が無いが、テストは `data` に作成した Task を求める。
- **`POST /auth/signup` のエラー**: API 仕様には `401` があるが、どんなときに返すか読み取れない。テストは `409`（重複）だけを確かめる。signup では `401` を返さない。
- **ページ番号**: API 仕様は `page` の `minimum: 0` だが、テストは `page=1` を最初のページとして扱う。`page` は 1 始まりにする。

### 決めたこと（下書きで要確認にしていた点）

方針は「`test/` が通ることを最優先にし、迷ったらシンプルな方にする」。

| 点 | 決めたこと | 理由 |
| -- | ---------- | ---- |
| signup の入力エラー | 必須項目の欠け・空、メール形式の誤り、確認用フィールドの不一致は `400`。パスワードの最小文字数は設けない | API 仕様に定義が無く、入力エラーは `400` が一般的。強度チェックはテストに無い |
| `limit`・`page` の既定値と範囲 | 既定値は `limit=20`, `page=1`。`limit` は 1〜100、`page` は 1〜1,000,000 の整数。範囲外・数値でない値は `400` | API 仕様の例が 20。テストは `page=1` 始まり。丸めるより `400` にした方が分かりやすい。`page` の上限は、飛ばす件数が DB の扱える整数を超えて `500` になるのを防ぐため（レビューの指摘で追加） |
| タスク一覧で `limit` を省略したとき | プロジェクト一覧と同じく既定値 `20` を使う | API 仕様では必須だが、2 つの一覧で振る舞いをそろえた方がシンプル |
| `status` の絞り込み | 1 つだけ受け付ける。不正な値や複数指定は `400` | テストは 1 つだけ指定する。API 仕様の 400 に合わせる |
| 一覧の並び順 | プロジェクト・タスクとも作成日時の昇順、同じなら `id` の昇順 | プロジェクトは Seed の投入順（programming → english → design）で取れる。タスクは順序が毎回同じになり、並行して取ったページで ID が重ならない |
| Seed のタスク件数 | `scheduled` を 3 件入れる | 作成日時の昇順なので、`limit=1` の 1〜3 ページは常に Seed のタスクになる。他のテストが同時にタスクを作成・削除しても、ページの中身がずれない |
| 所有者 | プロジェクトとタスクはユーザーごとに持つ。他のユーザーのタスクと slug は `404`、他のユーザーの `projectId` は `400` | パスが `/users/...` なので自分のものだけを扱うのが自然。存在しないものと同じ扱いにすると分岐が増えない |
| UUID の形でない ID | タスクの `:id` は `404`、`projectId` は `400` | 「見つからない」「使えない projectId」と同じ扱いにする。DB にそのまま渡して `500` にならないようにする |
| レスポンスの項目 | Task は `kind`・日付を含め、`project` は含めない。Project は `stats` を返さず、テーブルにある項目を返す | テストが確かめるのは必須項目だけ。`kind` は作成時に送るので返す方が自然 |
| 日付の受け付け | `2024-01-01` の形と ISO 8601 の日時を受け付け、返すときは UTC の ISO 8601 にする | テストは日付の形で送り、日時は `...Z` の形でしか受け付けない |
| `finishedAt` / `archivedAt` | 扱わない（自動で埋めない、返さない） | テストに無く、シンプルにするため |
| エラーメッセージ | `{ "message": "..." }` で英語の短い文。どの項目が不正かまでは入れない | API 仕様の例（`Email already exists`）に合わせる |
| Seed の中身 | ユーザー 1 人、プロジェクト 3 件（name は slug の先頭を大文字にしたもの）、タスク 4 件（`scheduled` 3 件、`completed` 1 件）。毎回消してから入れ直す | テストの前提を満たす最小の構成。何度実行しても同じ状態になる |

### テストを通すうえでの注意

- テストは日時を `YYYY-MM-DDTHH:mm:ss(.sss)Z` の形でしか受け付けない（`+09:00` などのオフセット付きは不可）。
