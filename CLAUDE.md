# CLAUDE.md

Express + TypeScript + Prisma + PostgreSQL（Docker）+ JWT で、課題の Web API を作るリポジトリ。

このファイルには、どの作業でも守ることと、詳しい資料への案内だけを書く。詳しい内容は下の「詳しい資料」に分けて書き、ここにはリンクを 1 行足す。

## 必ず守ること

- **`test/` は変更しない**。課題の判定用のテストで、実装がこれに合わせる。
- **API 仕様とテストが食い違うときは、テストを正とする**（例: Task ID は UUID）。
- **認証は `Authorization: Bearer <accessToken>` ヘッダーで受け取る**。Cookie は使わない。ログインと登録は、トークンをレスポンスの JSON（`data.accessToken`）で返す。
- 仕様書の「要件」に書かれたことだけを実装し、「対象外」は作らない。
- 秘密の値（JWT の秘密鍵、DB の接続文字列）はコードに書かず、環境変数から読む。`.env` はコミットしない。
- コミットメッセージは `/cmt` のルールに従う（`<絵文字> <種類>: <日本語の要約>`）。
- main に直接コミットしない。作業は `/spec` が作る `feature/<slug>` ブランチで行う。

## よく使うコマンド

<!-- package.json ができたら、npm run dev / db:seed / typecheck などをここに足す。 -->

| やりたいこと           | コマンド                                         |
| ---------------------- | ------------------------------------------------ |
| 判定用テストを流す     | `npm run db:seed` → `npm run dev` のあと、`test/` で `npm run test` |

## 詳しい資料

作業に関係するものだけを、必要になったときに読む。全部を先に読まない。

| こんなときに                                   | 読むもの                                                                                     |
| ---------------------------------------------- | -------------------------------------------------------------------------------------------- |
| 課題の要件・チェック項目を知りたい             | [README.md](README.md)                                                                       |
| 開発の流れ（/spec → /plan → /implement → /pr） | [docs/claude-code-workflow.md](docs/claude-code-workflow.md)                                 |
| 課題の API を一通り作る手順と確認項目          | [docs/implementation-checklist.md](docs/implementation-checklist.md)                         |
| エンドポイントの形・Seed データ・テストの前提  | [test/README.md](test/README.md)、`test/tests/support/contracts.ts`                          |
| API 仕様の原文                                 | `curl -sL "https://vws-api-spec-host.netlify.app/specs/yml?id=express-web-api"`              |
| 仕様書・プランを書く                           | [_specs/_template.md](_specs/_template.md)、[_plans/_template.md](_plans/_template.md)        |
| コミットメッセージの種類と絵文字               | [.claude/commands/cmt.md](.claude/commands/cmt.md)                                           |
| 学習用の参考資料                               | [docs/documents.md](docs/documents.md)                                                       |

<!--
資料を足すときは、ここに 1 行足すだけにする。例:
| ディレクトリ構成・レイヤーの役割         | docs/architecture.md |
| 認証・認可の仕組み                       | docs/auth.md         |
| エラーレスポンスの形                     | docs/error-handling.md |
特定のディレクトリだけで守るルールは .claude/rules/<名前>.md に書き、frontmatter の paths で対象を絞る。
-->
