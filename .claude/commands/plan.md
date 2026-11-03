---
name: plan
description: _specs/ の仕様書をもとに、タスク分割と担当範囲を決めた実装プランを _plans/ に書き出す。
argument-hint: <仕様書のパス>
disable-model-invocation: true
allowed-tools: Read, Write, Glob, Grep, Bash(git status:*), Bash(git switch:*), Bash(git branch:*), Bash(git rev-parse:*), Bash(git fetch:*), Bash(git diff:*), Bash(curl -sL https://vws-api-spec-host.netlify.app/specs/yml:*)
---

仕様書 `$ARGUMENTS` をもとに、実装プランを書く。プランは人が見直してから `/implement` に渡す前提で、ここでは実装しない。

## 1. 準備

1. 仕様書、`README.md`、`test/README.md`、`_plans/_template.md` を読む。`CLAUDE.md`・`docs/` 配下に設計のドキュメントがあれば、それも読む。仕様書が見つからなければ止めてユーザーに伝える。
2. 仕様書に `<!-- 要確認: 〜 -->` が残っている、または実装方針が変わるほど曖昧な点や矛盾があれば、**プランを書く前に**ユーザーに質問する。推測で埋めない。
3. `git status --short` を確認する。この仕様書とこれから書くプラン以外の変更があれば、止めてユーザーに確認する。
4. main にいる場合は `feature/<仕様書のファイル名>` ブランチを作って切り替える。

## 2. 調べる

- **既存の実装**: `package.json`、`tsconfig.json`、`docker-compose.yml`、`prisma/schema.prisma`、`prisma/seed.ts`、`src/**` を読み、流用できるもの（認証ミドルウェア、ページネーション、エラーレスポンス、バリデーション、ログ出力など）と変更が要るものを確かめる。
- **プロジェクトの土台が無い場合**（`package.json` や `src/` がまだ無い）: Express + TypeScript + Prisma + PostgreSQL（Docker）の土台作りを第 1 段階のタスクに含める。`npm run dev`・`npm run db:seed` が使えること、サーバが `http://localhost:3000/api/v1` で動くこと、リクエストログとクエリログが出ることは `README.md` と `test/README.md` の前提なので、土台のタスクで満たす。
- **API 仕様**: 仕様書の「リクエスト」「レスポンス」で足りない点があれば、`curl -sL "https://vws-api-spec-host.netlify.app/specs/yml?id=express-web-api"` で確かめる。API 仕様とテストが食い違う場合はテストを正とする。
- **テスト**: 仕様書の要件に添えられた `test/tests/*.test.ts` と `test/tests/support/*.ts` を読み、レスポンスの形（`data`・`pageInfo` など）と Seed データの前提を確かめる。
- **置き場所**: 既存のディレクトリ構成があればそれに従う。無ければ MVC で分ける（`src/routes`・`src/controllers`・`src/models`（Prisma を使うデータ操作）・`src/middlewares`・`src/lib`（共通処理）、DB は `prisma/`）。1 つのリソースでしか使わない処理は、今まさに複数箇所で使うまでは `src/lib` に切り出さない。

## 3. タスクに分ける

**変更するファイルが重ならないように**タスクを分ける。各タスクは `/implement` が `implementer` サブエージェントに 1 つずつ渡す単位になる。同じ段階のタスクは並列に実行される。

- **第 1 段階（土台）**: `prisma/schema.prisma`・マイグレーション・`prisma/seed.ts` の変更、共通のミドルウェア（認証・エラーハンドリング・ログ）、`src/lib` の共通処理、プロジェクトの土台作り。`prisma/schema.prisma` と `prisma/seed.ts` は複数のリソースが触るので、必ず 1 つのタスクにまとめる。
- **第 2 段階（リソース）**: リソース（auth・users・projects・tasks など）ごとに、model・controller・router をまとめて 1 タスクにする。第 1 段階で作る Prisma のモデルや共通処理を使う。
- **第 3 段階（結線）**: `src/routes/index.ts` や `src/app.ts` など、第 2 段階の router を登録する共有ファイルの変更を 1 つのタスクにまとめる。既に登録済みで変更が要らなければ作らない。
- 変更が 1 リソースで済むなど小さい場合は、無理に分けずに 1 タスクにする（段階も 1 つでよい）。
- 仕様書の「要件」「エラー」「Seed データ」はどれか 1 つ以上のタスクに割り当て、漏れがないようにする。
- `test/` 配下は課題の判定用なので、どのタスクの担当範囲にも入れない。

## 4. プランを書く

`_plans/_template.md` の見出しと順序をそのまま使い、`_plans/<仕様書のファイル名>.md` に保存する。テンプレートの HTML コメント（`<!-- -->`）は消す。既に同名のプランがあれば、上書きしてよいかユーザーに確認する。

- 各タスクに、目的、担当範囲（ファイル・ディレクトリ）、満たす要件、作る／使う公開 API を書く。公開 API は、後の段階のタスクがそれだけを見て使えるように、名前とシグネチャまで書く（例: `requireAuth: RequestHandler`（`req.user.id` に UUID を入れる）、`findTasksByUser(userId: string, query: { limit: number; page: number; status?: TaskStatus }): Promise<{ tasks: Task[]; totalCount: number }>`、Prisma のモデル名とカラム）。
- 各タスクに、終わったことを確かめる方法を書く（例: `npm run build` が通る、`npx prisma migrate dev` と `npm run db:seed` が通る、`test/` で `npx vitest run tests/tasks.test.ts` が通る）。
- コードの全文は書かない（それは `/implement` が書く）。
- 仕様書から一意に決まらず、プランで決めたこと（ディレクトリ構成、使うライブラリ、トークンの有効期限、バリデーションの方法など）は「判断した点」に書く。

コミットはしない（人が見直して直す前提のため。`/implement` が仕様書と一緒にコミットする）。

## 5. 報告

プランの全文は貼らず、次の形式で伝える。

```
ブランチ: <ブランチ名>
プラン: _plans/<slug>.md
タスク: 第 1 段階 <n> 件、第 2 段階 <n> 件、第 3 段階 <n> 件
```

続けて「判断した点」を箇条書きで伝える。最後に、プランを見直したら `/implement _plans/<slug>.md` で実装できることを伝える。
