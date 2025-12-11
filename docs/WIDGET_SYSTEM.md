# Widget System Implementation

**Issue**: #78
**Status**: ✅ Completed
**Implementation Date**: 2025-12-11

---

## 📋 概要

外部Webサイトに埋め込み可能なチャットウィジェットシステムを実装しました。スクリプトタグを追加するだけで、AIチャットボットと商品レコメンデーション機能を統合できます。

## 🎯 実装内容

### 1. Widget Loader (`public/widget/loader.js`)

**機能**:
- スクリプトタグから埋め込み型で読み込まれる軽量ローダー
- `__OMAKASE_LOADER_INITIALIZED__` グローバル変数で二重初期化防止
- Widget設定をAPIから動的取得
- React/ReactDOMの自動ロード

**特徴**:
```javascript
// 使用例
(function(w,d,s,l,i){
  w['__OMAKASE_LOADER_INITIALIZED__']=true;
  w['OmakaseWidget']=i;
  w[i]=w[i]||function(){(w[i].q=w[i].q||[]).push(arguments)};
  var f=d.getElementsByTagName(s)[0],
  j=d.createElement(s);j.async=true;
  j.src='https://widget.omakase.ai/widget/loader.js?id='+l;
  f.parentNode.insertBefore(j,f);
})(window,document,'script','AGENT_ID','omakase');
```

### 2. Widget Configuration API (`src/app/api/v1/widget_info/route.ts`)

**エンドポイント**: `GET /api/v1/widget_info?id={widgetId}`

**レスポンス形式**:
```typescript
{
  "id": "agent-123",
  "agentId": "agent-123",
  "theme": {
    "primaryColor": "#6366f1",
    "position": "bottom-right",
    "showBranding": true,
    "theme": "light"
  },
  "features": {
    "voice": false,
    "chat": true,
    "productRecommendations": true
  },
  "agent": {
    "name": "アシスタント",
    "avatar": "",
    "greeting": "こんにちは！何かお探しですか？"
  }
}
```

**CORS設定**: すべてのオリジンから許可 (`Access-Control-Allow-Origin: *`)

### 3. Widget Config Library (`src/lib/widget/config.ts`)

**提供機能**:
- TypeScript型定義
- デフォルト設定
- 埋め込みコード生成
- 設定バリデーション
- アナリティクスイベント型

**主要関数**:
```typescript
// 埋め込みコード生成
generateWidgetEmbedCode(widgetId: string): string

// 設定マージ
mergeWidgetConfig(input: WidgetConfigInput, widgetId: string): WidgetConfig

// バリデーション
validateWidgetConfig(config: Partial<WidgetConfig>): string[]
```

### 4. FloatingButton Component (`src/components/widget/FloatingButton.tsx`)

**機能**:
- アニメーション付きフローティングボタン
- 開閉状態のアイコン切り替え
- 未読メッセージバッジ表示
- ホバーエフェクト
- カスタマイズ可能な位置とカラー

**Props**:
```typescript
interface FloatingButtonProps {
  isOpen: boolean;
  onClick: () => void;
  primaryColor?: string;
  position?: "bottom-right" | "bottom-left";
  unreadCount?: number;
}
```

### 5. ProductCard Component (`src/components/widget/ProductCard.tsx`)

**機能**:
- 商品情報カード表示
- コンパクトモード / フルモード
- 商品クリックトラッキング
- 外部リンク対応
- 複数商品リスト表示

**コンポーネント**:
- `ProductCard`: 単一商品カード
- `ProductList`: 商品リスト（最大表示件数設定可能）

**Props**:
```typescript
interface ProductCardProps {
  product: Product;
  onProductClick?: (productId: string) => void;
  primaryColor?: string;
  compact?: boolean; // true: 横並び, false: グリッド
}
```

### 6. Enhanced ChatWidget (`src/components/widget/chat-widget.tsx`)

**新機能追加**:
- FloatingButton統合
- 商品レコメンデーション表示
- "Powered by Omakase.ai" ブランディング
- 商品情報付きメッセージ対応

**新Props**:
```typescript
interface ChatWidgetProps {
  // 既存
  agentId: string;
  agentName?: string;
  welcomeMessage?: string;
  position?: "bottom-right" | "bottom-left";
  theme?: "light" | "dark";
  primaryColor?: string;

  // 新規追加
  showBranding?: boolean; // デフォルト: true
  enableProductRecommendations?: boolean; // デフォルト: true
}
```

**メッセージ型拡張**:
```typescript
interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
  products?: Product[]; // 新規: 商品レコメンデーション
}
```

---

## 📁 ファイル構成

```
omakase-ai-copy/
├── public/
│   └── widget/
│       └── loader.js              # 埋め込みローダースクリプト
├── src/
│   ├── app/
│   │   └── api/
│   │       └── v1/
│   │           └── widget_info/
│   │               └── route.ts   # Widget設定API
│   ├── components/
│   │   └── widget/
│   │       ├── chat-widget.tsx    # メインチャットウィジェット (拡張)
│   │       ├── FloatingButton.tsx # フローティングボタン (新規)
│   │       └── ProductCard.tsx    # 商品カード (新規)
│   └── lib/
│       └── widget/
│           └── config.ts          # Widget設定管理 (新規)
└── examples/
    └── widget-embed.html          # 埋め込みサンプル
```

---

## 🚀 使い方

### 基本的な埋め込み

```html
<!-- Option 1: Loader経由 (推奨) -->
<script>
  (function(w,d,s,l,i){
    w['__OMAKASE_LOADER_INITIALIZED__']=true;
    w['OmakaseWidget']=i;
    w[i]=w[i]||function(){(w[i].q=w[i].q||[]).push(arguments)};
    var f=d.getElementsByTagName(s)[0],
    j=d.createElement(s);j.async=true;
    j.src='https://widget.omakase.ai/widget/loader.js?id='+l;
    f.parentNode.insertBefore(j,f);
  })(window,document,'script','YOUR_AGENT_ID','omakase');
</script>

<!-- Option 2: 直接読み込み (テスト用) -->
<script src="https://widget.omakase.ai/widget.js"></script>
<script>
  OmakaseWidget.init({
    agentId: 'YOUR_AGENT_ID',
    primaryColor: '#667eea',
    position: 'bottom-right'
  });
</script>
```

### カスタマイズ

```javascript
// 初期化後にカスタマイズ
window.omakase('config', {
  primaryColor: '#667eea',
  position: 'bottom-left',
  theme: 'dark',
  showBranding: false
});

// イベントトラッキング
window.omakase('trackEvent', {
  event: 'product.clicked',
  productId: 'prod-123'
});
```

---

## 🎨 カスタマイズオプション

| オプション | 型 | デフォルト | 説明 |
|-----------|-----|-----------|------|
| `primaryColor` | string | #6366f1 | メインカラー（HEX形式） |
| `position` | string | bottom-right | 表示位置 (bottom-right / bottom-left) |
| `theme` | string | light | テーマ (light / dark) |
| `showBranding` | boolean | true | "Powered by Omakase.ai" 表示 |
| `enableProductRecommendations` | boolean | true | 商品レコメンデーション機能 |
| `agentName` | string | アシスタント | エージェント名 |
| `welcomeMessage` | string | こんにちは！... | 初期メッセージ |

---

## 🔧 開発環境での動作確認

### 1. 開発サーバー起動

```bash
npm run dev
```

### 2. サンプルページにアクセス

```
http://localhost:3000/examples/widget-embed.html
```

### 3. Widget設定確認

```bash
curl http://localhost:3000/api/v1/widget_info?id=test-agent-123
```

---

## 📊 データベース連携

### Agent Model (Prisma)

Widget設定は `Agent.widgetConfig` (JSON型) に保存されます：

```typescript
model Agent {
  id           String  @id @default(cuid())
  name         String
  widgetConfig Json?   // Widget設定
  // ...
}
```

### 設定例

```json
{
  "primaryColor": "#667eea",
  "position": "bottom-right",
  "theme": "light",
  "showBranding": true,
  "agentName": "おまかせAI",
  "greeting": "こんにちは！何かお探しですか？",
  "voice": false,
  "chat": true,
  "productRecommendations": true
}
```

---

## 🧪 テスト

### API テスト

```bash
# Widget設定取得
curl -X GET "http://localhost:3000/api/v1/widget_info?id=test-agent-123"

# CORS確認
curl -X OPTIONS "http://localhost:3000/api/v1/widget_info?id=test-agent-123" \
  -H "Origin: https://example.com"
```

### E2Eテスト (Playwright)

```bash
npm run test:e2e
```

---

## 🔐 セキュリティ考慮事項

### CORS設定
- すべてのオリジンから許可 (`Access-Control-Allow-Origin: *`)
- 公開APIのため、認証不要
- Widgetが無効な場合は403エラー

### CSP (Content Security Policy)
ホストサイトでCSPを設定している場合、以下を許可する必要があります：

```html
<meta http-equiv="Content-Security-Policy"
  content="script-src 'self' https://widget.omakase.ai;
           connect-src 'self' https://api.omakase.ai;">
```

### XSS対策
- `escapeHtml()` 関数でユーザー入力をサニタイズ
- React自動エスケープ機能

---

## 📈 アナリティクス

### トラッキングイベント

Widget利用状況は以下のイベントで追跡可能：

```typescript
enum WidgetEvent {
  LOADED = 'widget.loaded',
  OPENED = 'widget.opened',
  CLOSED = 'widget.closed',
  MESSAGE_SENT = 'widget.message_sent',
  MESSAGE_RECEIVED = 'widget.message_received',
  PRODUCT_CLICKED = 'widget.product_clicked',
  ERROR = 'widget.error',
}
```

### イベント送信例

```javascript
window.omakase('trackEvent', {
  event: 'widget.product_clicked',
  productId: 'prod-123',
  productName: 'Example Product',
  price: 1000
});
```

---

## 🚧 今後の拡張予定

- [ ] Widget Analytics Dashboard
- [ ] A/Bテスト機能
- [ ] 音声入力対応
- [ ] 多言語対応
- [ ] カスタムCSS注入機能
- [ ] Webhookイベント通知
- [ ] Widget埋め込みコード生成UI

---

## 📚 関連ドキュメント

- [Chat API仕様](/docs/API_CHAT.md)
- [Agent設定](/docs/AGENT_CONFIG.md)
- [Prismaスキーマ](/prisma/schema.prisma)

---

## 👨‍💻 実装者

**源 (Gen)** - CodeGenAgent 💻
*「コードは詩であり、テストはその韻律」*

生成完了 ✨
