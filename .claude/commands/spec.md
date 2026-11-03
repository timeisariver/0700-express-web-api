---
name: spec
description: 短いアイデアから _specs/ の仕様書の下書きと、作業ブランチを作る。
argument-hint: "<作りたい機能の説明>（例: タスクの作成 API / POST /users/tasks）"
disable-model-invocation: true
allowed-tools: Read, Write, Glob, Grep, Bash(git status:*), Bash(git switch:*), Bash(git branch:*), Bash(git rev-parse:*), Bash(git fetch:*), Bash(git diff:*), Bash(git ls-remote:*), Bash(curl -sL "https://vws-api-spec-host.netlify.app/specs/yml?id=express-web-api")
---

`$ARGUMENTS` をもとに、仕様書の下書きと作業ブランチを作る。仕様書は人が見直して仕上げる前提で、ここでは下書きまでにする。

## 1. 確認

1. `git status --short` が空であることを確認する。空でなければ、コミットか stash をするようユーザーに伝えて**ここで止める**。
2. `$ARGUMENTS` が空、または何を作るのか読み取れない場合は、推測せずにユーザーに質問する。

## 2. 引数を読む

`$ARGUMENTS` から次を決める。

- **機能名**: 仕様書の見出しにする、短い日本語の名前（例: 「タスクの作成 API」）。
- **slug**: ファイル名とブランチ名に使う英語の kebab-case（例: `create-task`）。`a-z`・`0-9`・`-` だけを使い、40 文字以内にする。
- **ブランチ名**: `feature/<slug>`。`git branch --list` や `git ls-remote --heads origin` のブランチと重なる場合は `feature/<slug>-02` のように番号を付ける。`_specs/<slug>.md` が既にある場合も同じ番号を付ける。
- **対象エンドポイント**: 引数に `POST /users/tasks` のように書かれていれば、それを使う。書かれていなければ、3 で API 仕様から当てはまるものを探す。

## 3. 調べる

仕様書に書く内容を、推測ではなくコードと仕様から確かめる。

- `README.md`、`test/README.md`、`_specs/_template.md` を読む。`CLAUDE.md`・`docs/` 配下に設計のドキュメントがあれば、それも読む。
- **API 仕様**: `curl -sL "https://vws-api-spec-host.netlify.app/specs/yml?id=express-web-api"` で OpenAPI 仕様を取得し、対象エンドポイントのパス・メソッド・リクエスト（パス / クエリ / ボディ）・レスポンスの項目とステータスコードを確かめる。取得できなかった場合は、その旨を「補足」に書き、テストコードだけを根拠にする。
- **テスト**: `test/tests/*.test.ts`、`test/tests/support/contracts.ts`、`test/tests/testData.ts` から、対象エンドポイントについてテストが期待していること（ステータスコード、レスポンスの項目、バリデーションエラーの条件、Seed データ）を確かめる。API 仕様とテストが食い違う場合は**テストを正とし**、食い違いを「補足」に書く（例: Task ID は UUID として扱う）。
- **既存の実装**: `src/**`（ルーティング・コントローラー・モデル・ミドルウェア）、`prisma/schema.prisma`、`prisma/seed.ts` などがあれば読み、流用できる処理（認証ミドルウェア、ページネーション、エラーレスポンスの形など）や、足りないテーブル・カラムを確かめる。まだ無いものは「まだ無い」と扱い、作る前提で書く。

## 4. ブランチを作る

`git fetch origin` し、`git switch --no-track -c <ブランチ名> origin/main` で作業ブランチを作って切り替える。

## 5. 仕様書を書く

`_specs/_template.md` の見出しと順序をそのまま使い、`_specs/<slug>.md` に保存する。テンプレートの HTML コメント（`<!-- -->`）は消す。

- **要件**は、HTTP リクエストを送って確かめられる粒度のチェックボックス（`- [ ]`）で書く（例: 「トークンなしで `401` を返す」「存在しない `projectId` で `400` を返す」）。`/implement` は要件に書いたことだけを実装するので、引数から読み取れることと、API 仕様・テストで確かめたことだけを書く。
- 対応するテストがある要件には、末尾に `（test: tasks.test.ts）` のようにテストファイル名を添える。
- 引数・API 仕様・テストのどれからも決められない点（並び順、エラーメッセージの文言、`limit` の上限など）は、要件に推測で書かず、その見出しの下に `<!-- 要確認: 〜 -->` で残す。
- **対象外**には、引数の範囲から外れるが作り込まれやすいこと（他のエンドポイント、リフレッシュトークンの更新処理など）を書く。
- コード例や、ファイル構成・テーブル設計などの実装方針は書かない（それは `/plan` が決める）。
- `test/` 配下のファイルは課題の判定用なので、変更しない。

## 6. 報告

仕様書の全文は貼らず、次の形式で伝える。

```
ブランチ: <ブランチ名>
仕様書: _specs/<slug>.md
機能名: <機能名>
```

続けて、`要確認` として残した点と、API 仕様とテストの食い違いがあればそれを箇条書きで伝える。最後に、仕様書を見直したら `/plan _specs/<slug>.md` で実装プランを作れることを伝える。
