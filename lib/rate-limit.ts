/**
 * Distributed rate limiter with Upstash Redis + automatic in-memory fallback.
 *
 * When UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN are set, all
 * counters are stored in Redis — giving a single global limit across every
 * Cloud Run instance.  When those variables are absent (local dev, cold boot
 * without Redis), the implementation falls back to a per-process in-memory
 * map so the app always starts and limits still apply within each instance.
 *
 * Algorithm: fixed-window counter via Redis INCR + EXPIRE.
 */
import { NextResponse } from "next/server";

// ─── Redis client (lazy-loaded so missing env does not crash the module) ─────

type RedisClient = {
  incr: (key: string) => Promise<number>;
  expire: (key: string, seconds: number) => Promise<number>;
  ttl: (key: string) => Promise<number>;
};

let _redis: RedisClient | null | "unavailable" = null;

async function getRedisClient(): Promise<RedisClient | null> {
  if (_redis === "unavailable") return null;
  if (_redis !== null) return _redis;

  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;

  if (!url || !token) {
    _redis = "unavailable";
    return null;
  }

  // Upstash REST API is plain HTTP — safe in Node.js and Edge runtimes.
  const makeRequest = async (body: unknown): Promise<unknown> => {
    const res = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });
    if (!res.ok) throw new Error(`Upstash HTTP ${res.status}`);
    const json = await res.json() as { result: unknown };
    return json.result;
  };

  _redis = {
    incr: async (key: string) => {
      const result = await makeRequest(["INCR", key]);
      return result as number;
    },
    expire: async (key: string, seconds: number) => {
      const result = await makeRequest(["EXPIRE", key, seconds]);
      return result as number;
    },
    ttl: async (key: string) => {
      const result = await makeRequest(["TTL", key]);
      return result as number;
    },
  };

  return _redis;
}

// ─── In-memory fallback ───────────────────────────────────────────────────────

type BucketState = {
  count: number;
  resetAt: number;
};

const inMemoryBuckets = new Map<string, BucketState>();

function cleanupBuckets(now: number) {
  if (inMemoryBuckets.size < 5000) return;
  for (const [key, bucket] of inMemoryBuckets) {
    if (bucket.resetAt <= now) inMemoryBuckets.delete(key);
  }
}

function localRateLimit(key: string, maxRequests: number, windowMs: number, now: number) {
  cleanupBuckets(now);

  const current = inMemoryBuckets.get(key);
  if (!current || current.resetAt <= now) {
    inMemoryBuckets.set(key, { count: 1, resetAt: now + windowMs });
    return { count: 1, resetAt: now + windowMs };
  }

  const nextCount = current.count + 1;
  inMemoryBuckets.set(key, { count: nextCount, resetAt: current.resetAt });
  return { count: nextCount, resetAt: current.resetAt };
}

// ─── IP extraction ────────────────────────────────────────────────────────────

function getClientIp(request: Request): string {
  // GCP Cloud Run / load balancer sets X-Forwarded-For.
  const forwardedFor = request.headers.get("x-forwarded-for");
  if (forwardedFor) {
    const firstIp = forwardedFor.split(",")[0]?.trim();
    if (firstIp) return firstIp;
  }
  return (
    request.headers.get("x-real-ip") ??
    request.headers.get("cf-connecting-ip") ??
    "unknown"
  );
}

// ─── Public API ───────────────────────────────────────────────────────────────

export async function applyRateLimit(params: {
  request: Request;
  scope: string;
  maxRequests: number;
  windowMs: number;
}) {
  const { request, scope, maxRequests, windowMs } = params;
  const now = Date.now();
  const windowSeconds = Math.ceil(windowMs / 1000);

  const ip = getClientIp(request);
  const windowId = Math.floor(now / windowMs);
  const bucketKey = `rl:${scope}:${ip}:${windowId}`;
  const resetAt = (windowId + 1) * windowMs;

  let count: number;

  const redis = await getRedisClient().catch(() => null);

  if (redis) {
    try {
      count = await redis.incr(bucketKey);
      // Only set expiry when the key is brand new (count === 1), to avoid
      // resetting the TTL on every request.
      if (count === 1) {
        await redis.expire(bucketKey, windowSeconds * 2);
      }
    } catch {
      // Redis temporarily unreachable — fall back silently.
      const local = localRateLimit(bucketKey, maxRequests, windowMs, now);
      count = local.count;
    }
  } else {
    const local = localRateLimit(bucketKey, maxRequests, windowMs, now);
    count = local.count;
  }

  const remaining = Math.max(0, maxRequests - count);
  const resetEpochSec = Math.ceil(resetAt / 1000);

  if (count > maxRequests) {
    const retryAfterSeconds = Math.max(1, resetEpochSec - Math.ceil(now / 1000));
    return {
      allowed: false,
      headers: {
        "Retry-After": String(retryAfterSeconds),
        "X-RateLimit-Limit": String(maxRequests),
        "X-RateLimit-Remaining": "0",
        "X-RateLimit-Reset": String(resetEpochSec),
      },
      response: NextResponse.json(
        {
          error: "Too many requests",
          message: "Limite de requisições excedido. Tente novamente em instantes.",
        },
        {
          status: 429,
          headers: {
            "Retry-After": String(retryAfterSeconds),
            "X-RateLimit-Limit": String(maxRequests),
            "X-RateLimit-Remaining": "0",
            "X-RateLimit-Reset": String(resetEpochSec),
          },
        }
      ),
    };
  }

  return {
    allowed: true,
    headers: {
      "X-RateLimit-Limit": String(maxRequests),
      "X-RateLimit-Remaining": String(remaining),
      "X-RateLimit-Reset": String(resetEpochSec),
    },
  };
}
