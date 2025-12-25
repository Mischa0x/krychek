interface RateLimitEntry {
  count: number;
  resetTime: number;
}

const rateLimitStore = new Map<string, RateLimitEntry>();
const CLEANUP_INTERVAL = 60 * 1000;
let lastCleanup = Date.now();

function cleanup() {
  const now = Date.now();
  if (now - lastCleanup < CLEANUP_INTERVAL) return;
  lastCleanup = now;
  const entries = Array.from(rateLimitStore.entries());
  for (const [key, entry] of entries) {
    if (now > entry.resetTime) rateLimitStore.delete(key);
  }
}

export interface RateLimitConfig {
  windowMs: number;
  maxRequests: number;
}

export interface RateLimitResult {
  success: boolean;
  remaining: number;
  resetTime: number;
  retryAfter?: number;
}

export function rateLimit(
  identifier: string,
  config: RateLimitConfig = { windowMs: 60 * 1000, maxRequests: 30 }
): RateLimitResult {
  cleanup();
  const now = Date.now();
  let entry = rateLimitStore.get(identifier);
  if (!entry || now > entry.resetTime) {
    entry = { count: 1, resetTime: now + config.windowMs };
    rateLimitStore.set(identifier, entry);
    return { success: true, remaining: config.maxRequests - 1, resetTime: entry.resetTime };
  }
  if (entry.count >= config.maxRequests) {
    return {
      success: false,
      remaining: 0,
      resetTime: entry.resetTime,
      retryAfter: Math.ceil((entry.resetTime - now) / 1000),
    };
  }
  entry.count++;
  rateLimitStore.set(identifier, entry);
  return { success: true, remaining: config.maxRequests - entry.count, resetTime: entry.resetTime };
}

export function getClientIp(request: Request): string {
  const headers = request.headers;
  const forwardedFor = headers.get('x-forwarded-for');
  if (forwardedFor) return forwardedFor.split(',')[0].trim();
  const realIp = headers.get('x-real-ip');
  if (realIp) return realIp;
  const cfConnectingIp = headers.get('cf-connecting-ip');
  if (cfConnectingIp) return cfConnectingIp;
  return 'unknown';
}
