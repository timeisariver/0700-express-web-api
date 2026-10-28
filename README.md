
## バックエンド + Web API (Express + TypeScript + Prisma + PostgreSQL + Docker + JWT)

下記、API仕様をもとに Web API を実装してください。

### API 仕様

https://vws-api-spec-host.netlify.app/specs?id=express-web-api

### 認証について

- `/auth/signup` でユーザ登録
- `/auth/login` でログインで認証を行うように実装してください。

それぞれのエンドポイントでは jwt トークンを発行して各エンドポイントでは、
Authorization ヘッダー内のトークンを検証して、トークンが不正な場合は 401 Unauthorized で返すように実装してください。

### 技術スタック

- Express
- TypeScript
- Prisma
- PostgreSQL
- Docker
- JWT

## 課題で身に着けること

- データベースの基本
- MVC(Model View Controller)
- SQLでのCRUD (PostgreSQL)
- ORMの基礎
- ORMでのCRUD
- マイグレーションとシード
- JWTを使用した認証・認可
- TypeScript + Express を利用したWeb APIの実装

## 課題の進め方

### 1. 課題の最終ゴールを確認する

デモを確認したり、メンターに確認してこの課題で達成すべき内容を確認してください。

### 2. 必要な概念を確認する

課題でやる全体像を把握した上で課題に必要な概念を学んで取り組んでください。
この課題ではリポジトリをフォークするのではなく、自分のリポジトリを作成して取り組んでください。

[参考資料](./docs/documents.md)

### 3. 実装に取り組む

実装量が多いので適切なタイミングでメンターに方向性のチェックを依頼するようにしてください。

Hint: 方向性のチェックを行う際は、プルリクエストを使用して現時点のコードを共有しながら進めましょう。

- [プルリクエストを出す上での注意点](https://lab.ver-1-0.net/posts/pr-points/)

#### チェック項目

- [ ] API 仕様に則りコードが実装されていること
- [ ] APIサーバが下記仕様に則っていること
  - [ ] Seed データが用意されていること
  - [ ] リクエストログが出力される
  - [ ] クエリログが出力される

仕様に則っているかどうかは、[./test](./test) ディレクトリにあるテストコードを実行して確認してください。

1. `npm run db:seed`
2. `npm run dev` でサーバ起動

の手順を踏んだあとに、test ディレクトリにあるテストコードを実行して、テストが全て成功すれば仕様に則っていると判断できます。
詳細は [./test/README.md](./test/README.md) を確認してください。

#### 4. メンターに最終レビューを依頼する

この課題では、アプリケーションの公開は不要なので実装完了次第レビューを依頼してください。


