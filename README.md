# Omakase AI Clone

EC向けAI接客エージェントプラットフォーム。URLを入力するだけでAIが商品を学習し、24時間自動で顧客対応を行います。

## 主な機能

- **AIエージェント自動生成**: WebサイトURLを入力するだけでAIが商品情報を学習
- **リアルタイムチャット**: Claude APIを使用した自然な会話
- **商品推奨**: 会話内容に基づいた商品レコメンデーション
- **アナリティクス**: 会話数、コンバージョン率などのリアルタイム分析
- **サブスクリプション**: Stripe連携による課金管理
- **埋め込みウィジェット**: サイトに簡単に設置できるチャットウィジェット

## 技術スタック

- **Framework**: Next.js 16 (App Router)
- **UI**: React 19, Tailwind CSS
- **Database**: PostgreSQL + Prisma ORM
- **Authentication**: NextAuth.js v5 (Google, GitHub OAuth)
- **AI**: Anthropic Claude API
- **Payment**: Stripe
- **Testing**: Vitest, Playwright

## セットアップ

### 1. リポジトリのクローン

```bash
git clone https://github.com/your-username/omakase-ai-clone.git
cd omakase-ai-clone
```

### 2. 依存関係のインストール

```bash
npm install
```

### 3. 環境変数の設定

`.env.example`をコピーして`.env.local`を作成:

```bash
cp .env.example .env.local
```

以下の環境変数を設定:

```env
# Database
DATABASE_URL="postgresql://user:password@localhost:5432/omakase"

# NextAuth.js
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-secret-key"

# Google OAuth
GOOGLE_CLIENT_ID="your-google-client-id"
GOOGLE_CLIENT_SECRET="your-google-client-secret"

# GitHub OAuth
GITHUB_CLIENT_ID="your-github-client-id"
GITHUB_CLIENT_SECRET="your-github-client-secret"

# Anthropic Claude API
ANTHROPIC_API_KEY="your-anthropic-api-key"

# Stripe
STRIPE_SECRET_KEY="sk_test_..."
STRIPE_WEBHOOK_SECRET="whsec_..."
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY="pk_test_..."

# App URL (for widget embed)
NEXT_PUBLIC_APP_URL="http://localhost:3000"
```

### 4. データベースのセットアップ

```bash
# Prismaクライアント生成
npx prisma generate

# マイグレーション実行
npx prisma migrate dev

# (オプション) シードデータ投入
npx prisma db seed
```

### 5. 開発サーバーの起動

```bash
npm run dev
```

[http://localhost:3000](http://localhost:3000) でアクセス可能。

## プロジェクト構造

```
src/
├── app/                    # Next.js App Router
│   ├── (auth)/            # 認証ページ
│   ├── (dashboard)/       # ダッシュボード
│   ├── api/               # APIルート
│   └── page.tsx           # ランディングページ
├── components/
│   ├── ui/                # UIコンポーネント
│   ├── dashboard/         # ダッシュボード用
│   └── widget/            # チャットウィジェット
├── hooks/                 # カスタムフック
├── lib/                   # ユーティリティ
│   ├── auth.ts           # NextAuth設定
│   ├── prisma.ts         # Prismaクライアント
│   ├── rate-limit.ts     # レート制限
│   └── usage.ts          # 使用量追跡
└── __tests__/            # テストファイル
```

## テスト

```bash
# ユニットテスト
npm run test

# カバレッジ付き
npm run test:coverage

# E2Eテスト
npm run test:e2e

# E2Eテスト (UIモード)
npm run test:e2e:ui
```

## API エンドポイント

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/agents` | エージェント一覧取得 |
| POST | `/api/agents` | エージェント作成 |
| GET | `/api/agents/[id]` | エージェント詳細取得 |
| PATCH | `/api/agents/[id]` | エージェント更新 |
| DELETE | `/api/agents/[id]` | エージェント削除 |
| POST | `/api/chat` | チャット送信 (Streaming) |
| GET | `/api/analytics` | アナリティクス取得 |
| POST | `/api/stripe/checkout` | 決済セッション作成 |
| POST | `/api/stripe/webhook` | Stripe Webhook |

詳細は [docs/API.md](docs/API.md) を参照。

## デプロイ

### Vercel

```bash
vercel --prod
```

詳細は [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md) を参照。

## サブスクリプションプラン

| プラン | チャット数/月 | データ容量 | 価格 |
|--------|-------------|-----------|------|
| INTERN | 1,000 | 100MB | 無料 |
| ASSOCIATE | 10,000 | 1GB | 有料 |
| PRINCIPAL | 無制限 | 10GB | 有料 |

## ライセンス

MIT

## コントリビューション

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request
