import { NextResponse } from "next/server";

type AdminAuthResult =
  | { allowed: true }
  | { allowed: false; response: NextResponse };

/**
 * Protects sensitive operational endpoints (ingest/recompute/debug).
 *
 * Accepts either:
 * - Authorization: Bearer <ADMIN_API_KEY>
 * - x-admin-key: <ADMIN_API_KEY>
 *
 * Fallback to CRON_SECRET keeps backward compatibility for existing schedulers.
 */
export function requireAdminAccess(request: Request): AdminAuthResult {
  const expectedSecret = process.env.ADMIN_API_KEY || process.env.CRON_SECRET;

  if (!expectedSecret) {
    if (process.env.NODE_ENV !== "production") {
      return { allowed: true };
    }

    return {
      allowed: false,
      response: NextResponse.json(
        {
          error: "Server misconfiguration",
          message: "ADMIN_API_KEY/CRON_SECRET não configurado em produção.",
        },
        { status: 500 }
      ),
    };
  }

  const authHeader = request.headers.get("authorization");
  const bearerToken = authHeader?.startsWith("Bearer ")
    ? authHeader.slice(7)
    : null;
  const adminKeyHeader = request.headers.get("x-admin-key");

  if (bearerToken === expectedSecret || adminKeyHeader === expectedSecret) {
    return { allowed: true };
  }

  return {
    allowed: false,
    response: NextResponse.json(
      {
        error: "Unauthorized",
        message: "Forneça Authorization Bearer ou x-admin-key válidos.",
      },
      { status: 401 }
    ),
  };
}
