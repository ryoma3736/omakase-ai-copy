# API Documentation

Omakase AI Clone API エンドポイント仕様書。

## 認証

すべての API エンドポイント（公開エンドポイントを除く）は NextAuth.js セッションによる認証が必要です。

```typescript
// 認証ヘッダー
Cookie: next-auth.session-token=xxx
```

---

## Agents API

### GET /api/agents

ユーザーのエージェント一覧を取得。

**認証**: 必須

**Response**

```json
[
  {
    "id": "clxx...",
    "name": "MyShop Assistant",
    "websiteUrl": "https://example.com",
    "description": "商品案内用エージェント",
    "isActive": true,
    "personality": {
      "tone": "friendly",
      "formalityLevel": 5,
      "emojiUsage": 5
    },
    "widgetConfig": {
      "primaryColor": "#3B82F6",
      "position": "bottom-right"
    },
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-01-01T00:00:00.000Z"
  }
]
```

---

### POST /api/agents

新しいエージェントを作成。

**認証**: 必須

**Request Body**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| name | string | Yes | エージェント名 |
| websiteUrl | string | Yes | 対象WebサイトURL |
| description | string | No | 説明 |
| personality | object | No | パーソナリティ設定 |
| widgetConfig | object | No | ウィジェット設定 |

```json
{
  "name": "MyShop Assistant",
  "websiteUrl": "https://example.com",
  "description": "商品案内用エージェント",
  "personality": {
    "tone": "friendly",
    "formalityLevel": 5,
    "emojiUsage": 5,
    "greetingMessage": "こんにちは！"
  }
}
```

**Response** `201 Created`

```json
{
  "id": "clxx...",
  "name": "MyShop Assistant",
  "websiteUrl": "https://example.com",
  ...
}
```

---

### GET /api/agents/[id]

特定のエージェント詳細を取得。

**認証**: 必須

**Path Parameters**

| Parameter | Description |
|-----------|-------------|
| id | エージェントID |

**Response**

```json
{
  "id": "clxx...",
  "name": "MyShop Assistant",
  "products": [...],
  "knowledgeBase": [...],
  "_count": {
    "conversations": 42
  }
}
```

**Error Responses**

| Status | Description |
|--------|-------------|
| 404 | Agent not found |
| 401 | Unauthorized |

---

### PATCH /api/agents/[id]

エージェントを更新。

**認証**: 必須

**Request Body**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| name | string | No | エージェント名 |
| websiteUrl | string | No | WebサイトURL |
| description | string | No | 説明 |
| isActive | boolean | No | 稼働状態 |
| personality | object | No | パーソナリティ設定 |
| widgetConfig | object | No | ウィジェット設定 |

**Response** `200 OK`

---

### DELETE /api/agents/[id]

エージェントを削除。

**認証**: 必須

**Response** `200 OK`

```json
{
  "success": true
}
```

---

## Knowledge Base API

### GET /api/agents/[id]/knowledge

エージェントのナレッジベース一覧を取得。

**認証**: 必須

**Response**

```json
[
  {
    "id": "clxx...",
    "type": "URL",
    "title": "商品ページ",
    "content": "...",
    "status": "READY",
    "metadata": { "url": "https://example.com/products" },
    "createdAt": "2024-01-01T00:00:00.000Z"
  }
]
```

---

### POST /api/agents/[id]/knowledge

ナレッジベースエントリを追加。

**認証**: 必須

**Request Body**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| type | string | Yes | "URL" \| "TEXT" \| "PDF" \| "CSV" \| "MARKDOWN" |
| title | string | Yes | タイトル |
| url | string | No | URL（typeがURLの場合必須） |
| content | string | No | コンテンツ（typeがTEXTの場合必須） |

**Response** `201 Created`

---

### DELETE /api/agents/[id]/knowledge/[entryId]

ナレッジベースエントリを削除。

**認証**: 必須

**Response** `200 OK`

---

## Chat API

### POST /api/chat

チャットメッセージを送信（ストリーミング）。

**認証**: 不要（公開API）

**Request Body**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| agentId | string | Yes | エージェントID |
| message | string | Yes | ユーザーメッセージ |
| conversationId | string | No | 会話ID（継続時） |
| sessionId | string | No | セッションID |

```json
{
  "agentId": "clxx...",
  "message": "おすすめの商品は？",
  "conversationId": "clxx...",
  "sessionId": "uuid-xxx"
}
```

**Response** `200 OK` (Server-Sent Events)

```
data: {"type":"metadata","conversationId":"clxx..."}

data: {"type":"message","content":"こんにちは"}

data: {"type":"message","content":"！おすすめは"}

data: {"type":"done"}
```

**Error Responses**

| Status | Description |
|--------|-------------|
| 400 | Bad request (missing agentId) |
| 404 | Agent not found |
| 429 | Rate limit exceeded |
| 500 | Internal server error |

---

## Analytics API

### GET /api/analytics

ユーザーの全体アナリティクスを取得。

**認証**: 必須

**Response**

```json
{
  "totalConversations": 150,
  "totalMessages": 1200,
  "avgMessagesPerConversation": 8.0,
  "conversationsByDay": [
    { "date": "2024-01-01", "count": 10 },
    { "date": "2024-01-02", "count": 15 }
  ],
  "messagesByRole": [
    { "role": "USER", "count": 600 },
    { "role": "ASSISTANT", "count": 600 }
  ],
  "topAgents": [
    { "name": "MyShop Assistant", "conversations": 100 }
  ],
  "conversionRate": 12.5,
  "avgResponseTime": 1.2
}
```

---

### GET /api/analytics/[agentId]

特定エージェントのアナリティクスを取得。

**認証**: 必須

**Response**

```json
{
  "totalConversations": 100,
  "totalMessages": 800,
  "avgSessionDuration": 300,
  "productRecommendations": 50,
  "clickThroughRate": 15.0,
  "conversationsByDay": [...],
  "popularProducts": [...]
}
```

---

## Conversations Export API

### GET /api/conversations/export

会話データをエクスポート。

**認証**: 必須

**Query Parameters**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| format | string | No | "csv" \| "json" (default: csv) |
| agentId | string | No | フィルター用エージェントID |
| startDate | string | No | 開始日 (YYYY-MM-DD) |
| endDate | string | No | 終了日 (YYYY-MM-DD) |

**Response** (CSV format)

```
Content-Type: text/csv; charset=utf-8
Content-Disposition: attachment; filename="conversations-xxx.csv"
```

**Response** (JSON format)

```json
{
  "exportedAt": "2024-01-01T00:00:00.000Z",
  "totalConversations": 100,
  "conversations": [...]
}
```

---

## Stripe API

### POST /api/stripe/checkout

Stripe チェックアウトセッションを作成。

**認証**: 必須

**Request Body**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| priceId | string | Yes | Stripe Price ID |

**Response**

```json
{
  "url": "https://checkout.stripe.com/..."
}
```

---

### POST /api/stripe/portal

Stripe カスタマーポータルセッションを作成。

**認証**: 必須

**Response**

```json
{
  "url": "https://billing.stripe.com/..."
}
```

---

### POST /api/stripe/webhook

Stripe Webhook ハンドラー。

**認証**: Stripe 署名検証

**Headers**

| Header | Description |
|--------|-------------|
| stripe-signature | Stripe 署名 |

**Supported Events**

- `checkout.session.completed`
- `customer.subscription.updated`
- `customer.subscription.deleted`
- `invoice.payment_succeeded`
- `invoice.payment_failed`
- `payment_method.attached`
- `customer.created`
- `subscription_schedule.updated`

---

## Usage API

### GET /api/usage

ユーザーの使用状況を取得。

**認証**: 必須

**Response**

```json
{
  "plan": "ASSOCIATE",
  "currentChatUsage": 500,
  "chatLimit": 10000,
  "currentDataUsage": 50,
  "dataLimitMB": 1024,
  "currentPeriodStart": "2024-01-01T00:00:00.000Z",
  "currentPeriodEnd": "2024-02-01T00:00:00.000Z"
}
```

---

## Error Codes

| Status | Code | Description |
|--------|------|-------------|
| 400 | BAD_REQUEST | リクエストが不正 |
| 401 | UNAUTHORIZED | 認証が必要 |
| 403 | FORBIDDEN | アクセス権限がない |
| 404 | NOT_FOUND | リソースが見つからない |
| 429 | RATE_LIMITED | レート制限超過 |
| 500 | INTERNAL_ERROR | サーバーエラー |

**Error Response Format**

```json
{
  "error": "エラーメッセージ",
  "code": "ERROR_CODE"
}
```

---

## Rate Limiting

| Endpoint | Limit | Window |
|----------|-------|--------|
| General API | 60 requests | 1 minute |
| Chat API | 20 requests | 1 minute |
| Strict API | 10 requests | 1 minute |

**Rate Limit Headers**

```
X-RateLimit-Limit: 60
X-RateLimit-Remaining: 55
X-RateLimit-Reset: 1704067200
Retry-After: 30
```

---

## Pagination

> Note: 現在のバージョンでは最大1000件の制限のみ。将来的にカーソルベースのページネーションを実装予定。

---

## Versioning

現在 API バージョニングは未実装。将来的には URL パスベースのバージョニングを予定:

```
/api/v1/agents
/api/v2/agents
```
