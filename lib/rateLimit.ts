/**
 * Simple in-memory rate limiter for Next.js API routes.
 * Uses a per-IP Map — resets automatically as entries expire.
 *
 * Not distributed (single-process only). Sufficient for an internal dashboard.
 * Swap for Redis-based rate limiting if you scale to multiple instances.
 */

interface RateLimitEntry {
  count: number
  resetAt: number
}

const store = new Map<string, RateLimitEntry>()

// Periodically purge expired entries to prevent memory leaks
setInterval(() => {
  const now = Date.now()
  for (const [key, entry] of store.entries()) {
    if (now > entry.resetAt) store.delete(key)
  }
}, 60_000)

/**
 * Check and increment rate limit for a given key.
 * Returns true if the request is allowed, false if the limit is exceeded.
 *
 * @param key     - Unique identifier (e.g. IP address)
 * @param max     - Max requests allowed in the window
 * @param windowMs - Window duration in milliseconds
 */
export function checkRateLimit(key: string, max: number, windowMs: number): boolean {
  const now = Date.now()
  const entry = store.get(key)

  if (!entry || now > entry.resetAt) {
    store.set(key, { count: 1, resetAt: now + windowMs })
    return true
  }

  if (entry.count >= max) return false

  entry.count++
  return true
}

/**
 * Get the IP address from a Next.js request.
 * Respects x-forwarded-for for deployments behind a proxy/CDN.
 */
export function getClientIp(req: Request): string {
  const forwarded = (req as Request & { headers: Headers }).headers.get('x-forwarded-for')
  return forwarded ? forwarded.split(',')[0].trim() : 'unknown'
}
