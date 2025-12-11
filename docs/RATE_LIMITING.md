# Rate Limiting & Usage Tracking Implementation

## Overview

This implementation provides comprehensive rate limiting and subscription-based usage tracking for the Omakase AI API.

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    Request Flow                          │
├─────────────────────────────────────────────────────────┤
│                                                          │
│  Client Request                                          │
│       ↓                                                  │
│  ┌──────────────────────┐                               │
│  │   middleware.ts      │                               │
│  │  - IP-based rate     │                               │
│  │    limiting (60/min) │                               │
│  │  - Security headers  │                               │
│  └──────────┬───────────┘                               │
│            ↓                                            │
│  ┌──────────────────────┐                               │
│  │  API Route Handler   │                               │
│  │  - Per-route limits  │                               │
│  │  - Chat: 20/min      │                               │
│  └──────────┬───────────┘                               │
│            ↓                                            │
│  ┌──────────────────────┐                               │
│  │  Usage Tracker       │                               │
│  │  - Subscription      │                               │
│  │    limits            │                               │
│  │  - Monthly quotas    │                               │
│  └──────────┬───────────┘                               │
│            ↓                                            │
│  Process Request                                        │
│                                                          │
└─────────────────────────────────────────────────────────┘
```

## Files Created

### Core Libraries

1. **`src/lib/rate-limit.ts`**
   - Sliding window rate limiter
   - In-memory storage (upgradable to Redis)
   - IP and user-based limiting
   - Configurable limits per endpoint

2. **`src/lib/usage.ts`**
   - Subscription plan management
   - Monthly usage tracking
   - Quota enforcement
   - Auto-reset billing periods

3. **`src/middleware.ts`**
   - Next.js middleware for global rate limiting
   - Security headers
   - CORS configuration

### API Endpoints

4. **`src/app/api/usage/route.ts`**
   - GET /api/usage - Returns current usage statistics

5. **`src/app/api/chat/route.example.ts`**
   - Example integration of rate limiting + usage tracking

## Subscription Plans

| Plan       | Chat Limit | Data Limit | Price |
|------------|-----------|-----------|-------|
| INTERN     | 1,000/mo  | 100 MB    | Free  |
| ASSOCIATE  | 10,000/mo | 1 GB      | Paid  |
| PRINCIPAL  | Unlimited | 10 GB     | Paid  |

## Usage Examples

### 1. Apply Rate Limiting to API Route

```typescript
import { NextRequest } from "next/server";
import { withRateLimit, chatLimiter } from "@/lib/rate-limit";

export async function POST(request: NextRequest) {
  // Apply rate limiting (20 requests/minute for chat)
  const rateLimitResult = await withRateLimit(request, chatLimiter);
  if (rateLimitResult) return rateLimitResult;

  // Your handler code...
}
```

### 2. Check and Track Usage

```typescript
import { withChatUsageCheck } from "@/lib/usage";

export async function POST(request: NextRequest) {
  // Get agent owner's user ID
  const agent = await prisma.agent.findUnique({
    where: { id: agentId },
    include: { user: true },
  });

  // Check subscription limits and increment usage
  const usageCheckResult = await withChatUsageCheck(agent.userId);
  if (usageCheckResult) return usageCheckResult;

  // Process request...
}
```

### 3. Get Usage Statistics

```typescript
import { getUsageStats } from "@/lib/usage";

const stats = await getUsageStats(userId);
console.log(stats);
// {
//   plan: "INTERN",
//   status: "ACTIVE",
//   chat: {
//     current: 45,
//     limit: 1000,
//     percentage: 4.5
//   },
//   data: {
//     current: 12,
//     limit: 100,
//     percentage: 12
//   },
//   billingPeriod: {
//     start: Date,
//     end: Date,
//     daysRemaining: 23
//   }
// }
```

### 4. Custom Rate Limiter

```typescript
import { RateLimiter } from "@/lib/rate-limit";

// Create custom limiter: 5 requests per 10 seconds
const customLimiter = new RateLimiter({
  interval: 10 * 1000,
  uniqueTokenPerInterval: 5,
});

// Use it
const identifier = getClientIdentifier(request, userId);
await customLimiter.check(identifier);
```

## Rate Limit Headers

All rate-limited responses include these headers:

```
X-RateLimit-Limit: 60          # Maximum requests allowed
X-RateLimit-Remaining: 42      # Requests remaining
X-RateLimit-Reset: 1234567890  # Unix timestamp when limit resets
```

When limit exceeded (429 response):
```
Retry-After: 45  # Seconds until retry allowed
```

## Error Responses

### Rate Limit Exceeded (429)

```json
{
  "error": "Too many requests",
  "message": "Rate limit exceeded. Please try again later.",
  "retryAfter": 45
}
```

### Usage Limit Exceeded (429)

```json
{
  "error": "Usage limit exceeded",
  "message": "Your INTERN plan allows 1000 chats per month. You've used 1000.",
  "plan": "INTERN",
  "currentUsage": 1000,
  "limit": 1000,
  "upgradeUrl": "/dashboard/billing"
}
```

## Configuration

### Default Rate Limiters

```typescript
// General API: 60 requests/minute
export const apiLimiter = new RateLimiter({
  interval: 60 * 1000,
  uniqueTokenPerInterval: 60,
});

// Chat API: 20 requests/minute
export const chatLimiter = new RateLimiter({
  interval: 60 * 1000,
  uniqueTokenPerInterval: 20,
});

// Strict: 10 requests/minute
export const strictLimiter = new RateLimiter({
  interval: 60 * 1000,
  uniqueTokenPerInterval: 10,
});
```

### Modify Plan Limits

Edit `PLAN_LIMITS` in `src/lib/usage.ts`:

```typescript
export const PLAN_LIMITS = {
  INTERN: {
    chatLimit: 1000,      // Change this
    dataLimitMB: 100,     // Change this
  },
  // ...
};
```

## Testing

### Test Rate Limiting

```bash
# Send 100 requests rapidly
for i in {1..100}; do
  curl -X POST http://localhost:3000/api/chat \
    -H "Content-Type: application/json" \
    -d '{"agentId":"test","message":"hi"}' &
done
```

Expected: First 20 succeed, rest get 429.

### Test Usage Limits

```typescript
// In test file
import { incrementChatUsage, checkChatUsage } from "@/lib/usage";

// Simulate usage
for (let i = 0; i < 1001; i++) {
  await incrementChatUsage(userId);
}

// This should throw UsageLimitError
await checkChatUsage(userId); // ❌ Throws
```

## Production Considerations

### 1. Upgrade to Redis (Distributed Systems)

For multi-instance deployments, replace in-memory store:

```typescript
// rate-limit.ts
import { Redis } from "ioredis";

const redis = new Redis(process.env.REDIS_URL);

async check(identifier: string): Promise<boolean> {
  const key = `ratelimit:${identifier}`;
  const count = await redis.incr(key);

  if (count === 1) {
    await redis.expire(key, this.interval / 1000);
  }

  if (count > this.limit) {
    throw new RateLimitError(...);
  }

  return true;
}
```

### 2. Monitor Usage

Add logging/metrics:

```typescript
// usage.ts - Add after incrementChatUsage
analytics.track("chat_usage_incremented", {
  userId,
  plan: subscription.plan,
  currentUsage: subscription.currentChatUsage,
});
```

### 3. Webhook for Limit Reached

```typescript
// usage.ts - Add to checkChatUsage
if (subscription.currentChatUsage >= subscription.chatLimit * 0.9) {
  await sendLimitWarningEmail(userId);
}
```

### 4. Database Indexes

Ensure these indexes exist:

```sql
CREATE INDEX idx_subscription_user_id ON Subscription(userId);
CREATE INDEX idx_subscription_period ON Subscription(currentPeriodEnd);
```

## Troubleshooting

### Rate Limits Not Working

1. Check middleware is running:
   ```typescript
   console.log("Middleware running for:", request.nextUrl.pathname);
   ```

2. Verify matcher config in `middleware.ts`:
   ```typescript
   export const config = {
     matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
   };
   ```

### Usage Not Incrementing

1. Check subscription exists:
   ```bash
   npx prisma studio
   # Check Subscription table
   ```

2. Verify userId is correct:
   ```typescript
   console.log("Checking usage for:", userId);
   ```

### Billing Period Not Resetting

1. Run manual reset:
   ```typescript
   import { resetMonthlyUsage } from "@/lib/usage";
   await resetMonthlyUsage(userId);
   ```

2. Add cron job (Vercel):
   ```typescript
   // app/api/cron/reset-usage/route.ts
   export async function GET() {
     const expiredSubscriptions = await prisma.subscription.findMany({
       where: { currentPeriodEnd: { lt: new Date() } },
     });

     for (const sub of expiredSubscriptions) {
       await resetMonthlyUsage(sub.userId);
     }

     return Response.json({ reset: expiredSubscriptions.length });
   }
   ```

## Migration Guide

If you have existing API routes, follow these steps:

1. **Add rate limiting**:
   ```diff
   + import { withRateLimit, chatLimiter } from "@/lib/rate-limit";

   export async function POST(request: NextRequest) {
   +   const rateLimitResult = await withRateLimit(request, chatLimiter);
   +   if (rateLimitResult) return rateLimitResult;

     // existing code...
   }
   ```

2. **Add usage tracking**:
   ```diff
   + import { withChatUsageCheck } from "@/lib/usage";

   export async function POST(request: NextRequest) {
     const agent = await prisma.agent.findUnique({
       where: { id: agentId },
   +     include: { user: true },
     });

   +   const usageResult = await withChatUsageCheck(agent.userId);
   +   if (usageResult) return usageResult;

     // existing code...
   }
   ```

3. **Test thoroughly** before deploying.

## Security Notes

- Rate limits are stored in-memory and will reset on server restart
- IP addresses can be spoofed; consider additional authentication
- Usage data is stored in database and persists across restarts
- Monitor for abuse patterns (same IP, multiple accounts)

## License

MIT

---

**Generated by**: CodeGenAgent (源) 💻
**Issue**: #64 - Rate Limiting & Usage Tracking実装
**Date**: 2025-12-11
