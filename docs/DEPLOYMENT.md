# Deployment Guide

本番環境へのデプロイ手順書。

## 目次

1. [Vercel デプロイ](#vercel-デプロイ)
2. [データベース設定](#データベース設定)
3. [Stripe 本番設定](#stripe-本番設定)
4. [OAuth プロバイダー設定](#oauth-プロバイダー設定)
5. [監視・ログ設定](#監視ログ設定)
6. [デプロイチェックリスト](#デプロイチェックリスト)

---

## Vercel デプロイ

### CLI でのデプロイ

```bash
# Vercel CLI インストール
npm i -g vercel

# ログイン
vercel login

# 本番デプロイ
vercel --prod
```

### 環境変数の設定

Vercel Dashboard または CLI で設定:

```bash
# 個別設定
vercel env add DATABASE_URL production
vercel env add NEXTAUTH_SECRET production
vercel env add ANTHROPIC_API_KEY production

# .env ファイルからまとめて設定
vercel env pull .env.production
```

### 必要な環境変数

| 変数名 | 説明 | 必須 |
|--------|------|------|
| `DATABASE_URL` | PostgreSQL 接続URL | Yes |
| `NEXTAUTH_URL` | アプリケーションURL | Yes |
| `NEXTAUTH_SECRET` | セッション暗号化キー | Yes |
| `GOOGLE_CLIENT_ID` | Google OAuth クライアントID | Yes |
| `GOOGLE_CLIENT_SECRET` | Google OAuth シークレット | Yes |
| `GITHUB_CLIENT_ID` | GitHub OAuth クライアントID | No |
| `GITHUB_CLIENT_SECRET` | GitHub OAuth シークレット | No |
| `ANTHROPIC_API_KEY` | Claude API キー | Yes |
| `STRIPE_SECRET_KEY` | Stripe シークレットキー | Yes |
| `STRIPE_WEBHOOK_SECRET` | Stripe Webhook シークレット | Yes |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | Stripe 公開キー | Yes |
| `NEXT_PUBLIC_APP_URL` | アプリURL（ウィジェット用） | Yes |

---

## データベース設定

### Supabase (推奨)

1. [Supabase](https://supabase.com) でプロジェクト作成
2. Settings > Database > Connection string をコピー
3. `DATABASE_URL` に設定

```env
DATABASE_URL="postgresql://postgres:[PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres"
```

### PlanetScale

1. [PlanetScale](https://planetscale.com) でデータベース作成
2. Connect > Node.js の接続文字列をコピー

```env
DATABASE_URL="mysql://[USER]:[PASSWORD]@[HOST]/[DATABASE]?sslaccept=strict"
```

> Note: PlanetScale は MySQL のため、Prisma スキーマの変更が必要

### Railway

1. [Railway](https://railway.app) で PostgreSQL を追加
2. Variables タブから `DATABASE_URL` をコピー

### マイグレーション実行

```bash
# 本番用マイグレーション
npx prisma migrate deploy

# スキーマの確認
npx prisma db pull
```

### Connection Pooling

大規模環境では PgBouncer などの Connection Pooling を推奨:

```env
# Supabase の Pooler URL を使用
DATABASE_URL="postgresql://postgres:[PASSWORD]@db.[PROJECT-REF].supabase.co:6543/postgres?pgbouncer=true"
```

---

## Stripe 本番設定

### 1. テストモードから本番モードへ

1. Stripe Dashboard で「View test data」をオフ
2. 本番用 API キーを取得
3. 環境変数を更新

```env
STRIPE_SECRET_KEY="sk_live_..."
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY="pk_live_..."
```

### 2. Webhook エンドポイント設定

1. Stripe Dashboard > Developers > Webhooks
2. 「Add endpoint」をクリック
3. エンドポイント URL: `https://your-domain.com/api/stripe/webhook`
4. イベントを選択:
   - `checkout.session.completed`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.payment_succeeded`
   - `invoice.payment_failed`
   - `payment_method.attached`
   - `customer.created`
   - `subscription_schedule.updated`

5. Webhook シークレットをコピー

```env
STRIPE_WEBHOOK_SECRET="whsec_..."
```

### 3. 価格設定

1. Products で料金プランを作成
2. Price ID を確認
3. コード内の Price ID を更新

```typescript
// src/app/api/stripe/checkout/route.ts
const priceId = "price_live_xxxx"; // 本番用 Price ID に変更
```

---

## OAuth プロバイダー設定

### Google OAuth

1. [Google Cloud Console](https://console.cloud.google.com) にアクセス
2. APIs & Services > Credentials
3. OAuth 2.0 Client IDs を編集
4. Authorized redirect URIs に追加:
   ```
   https://your-domain.com/api/auth/callback/google
   ```

### GitHub OAuth

1. [GitHub Developer Settings](https://github.com/settings/developers) にアクセス
2. OAuth Apps でアプリを編集
3. Authorization callback URL を更新:
   ```
   https://your-domain.com/api/auth/callback/github
   ```

---

## 監視・ログ設定

### Vercel Analytics

1. Vercel Dashboard でプロジェクト選択
2. Analytics タブを有効化
3. (オプション) `@vercel/analytics` をインストール

```bash
npm install @vercel/analytics
```

```typescript
// src/app/layout.tsx
import { Analytics } from '@vercel/analytics/react';

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        {children}
        <Analytics />
      </body>
    </html>
  );
}
```

### Sentry (エラー追跡)

```bash
npx @sentry/wizard@latest -i nextjs
```

### ログ集約

Vercel のログは自動で収集されます。外部サービス連携:

- Datadog
- LogDNA
- Papertrail

---

## デプロイチェックリスト

### デプロイ前

- [ ] 環境変数がすべて設定済み
- [ ] `DATABASE_URL` が本番DBを指している
- [ ] `NEXTAUTH_URL` が本番URLに設定
- [ ] Stripe キーが本番用に変更
- [ ] OAuth コールバックURLが本番用に更新
- [ ] データベースマイグレーション実行済み

### デプロイ後

- [ ] サイトにアクセスできる
- [ ] ログインが機能する (Google/GitHub)
- [ ] エージェント作成が機能する
- [ ] チャットが機能する
- [ ] Stripe 決済が機能する
- [ ] Webhook が正常に受信できる
- [ ] SSL 証明書が有効
- [ ] 404/500 エラーページが表示される

### パフォーマンス確認

- [ ] Lighthouse スコア 90+
- [ ] Core Web Vitals が良好
- [ ] 画像最適化が有効
- [ ] キャッシュヘッダーが設定済み

---

## トラブルシューティング

### データベース接続エラー

```
Error: Can't reach database server
```

- `DATABASE_URL` が正しいか確認
- IP 許可リストを確認 (Supabase/PlanetScale)
- SSL 設定を確認

### OAuth エラー

```
Error: redirect_uri_mismatch
```

- コールバック URL が完全一致しているか確認
- `NEXTAUTH_URL` が正しいか確認

### Stripe Webhook エラー

```
Error: No signatures found matching the expected signature
```

- `STRIPE_WEBHOOK_SECRET` が正しいか確認
- Webhook エンドポイント URL が正しいか確認
- イベントタイプが正しく選択されているか確認

---

## スケーリング

### Vercel

- Pro/Enterprise プランでリソース増加
- Edge Functions で低レイテンシ

### データベース

- Read Replicas の追加
- Connection Pooling の設定
- インデックス最適化

### キャッシュ

- Vercel Edge Cache
- Redis (Upstash) の導入

---

## 参考リンク

- [Vercel Deployment Documentation](https://vercel.com/docs/deployments/overview)
- [Prisma Deployment Checklist](https://www.prisma.io/docs/guides/deployment/deployment-guides)
- [Stripe Production Checklist](https://stripe.com/docs/development/checklist)
- [NextAuth.js Deployment](https://next-auth.js.org/deployment)
