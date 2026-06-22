/**
 * In-memory rate limiter — tidak memerlukan Redis.
 * Cocok untuk deployment single-instance. Untuk multi-instance,
 * ganti dengan Redis-backed solution (e.g. Upstash).
 */

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

const store = new Map<string, RateLimitEntry>();

// Bersihkan entry yang sudah expired setiap 5 menit
setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of store.entries()) {
    if (now > entry.resetAt) {
      store.delete(key);
    }
  }
}, 5 * 60 * 1000);

export interface RateLimitResult {
  success: boolean;
  remaining: number;
  resetAt: number;
}

/**
 * @param identifier — biasanya IP address dari request
 * @param limit — max request yang diizinkan dalam window
 * @param windowMs — durasi window dalam milidetik
 */
export function rateLimit(
  identifier: string,
  limit: number,
  windowMs: number
): RateLimitResult {
  const now = Date.now();
  const key = identifier;
  const existing = store.get(key);

  if (!existing || now > existing.resetAt) {
    // Window baru atau sudah expired
    const resetAt = now + windowMs;
    store.set(key, { count: 1, resetAt });
    return { success: true, remaining: limit - 1, resetAt };
  }

  if (existing.count >= limit) {
    return { success: false, remaining: 0, resetAt: existing.resetAt };
  }

  existing.count += 1;
  return {
    success: true,
    remaining: limit - existing.count,
    resetAt: existing.resetAt,
  };
}

/**
 * Helper: ekstrak IP dari Next.js request headers
 */
export function getIpFromRequest(req: Request): string {
  const forwarded = req.headers.get('x-forwarded-for');
  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }
  return req.headers.get('x-real-ip') || 'unknown';
}
