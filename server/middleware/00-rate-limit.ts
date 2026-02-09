import { getRequestIP } from 'h3';

/**
 * Basic Rate Limiting Middleware using Nitro Storage (In-Memory).
 * For a demo, this is sufficient to prevent automated abuse of write endpoints.
 */
export default defineEventHandler(async (event) => {
  const path = event.path;
  const method = event.method;

  // Only apply rate limiting to API routes, excluding auth and cleanup
  if (
    !path.startsWith('/api/') ||
    path.startsWith('/api/auth/') ||
    path.startsWith('/api/cleanup/') ||
    path.startsWith('/api/geographic/')
  ) {
    return;
  }

  // We are more strict with write operations (POST, PUT, DELETE)
  const isWriteOperation = ['POST', 'PUT', 'DELETE', 'PATCH'].includes(method);

  // Skip GET requests for stats to keep the dashboard responsive
  if (path.startsWith('/api/dashboard/stats') && method === 'GET') {
    return;
  }

  const ip = getRequestIP(event, { xForwardedFor: true }) || 'unknown';
  const storage = useStorage('cache:rate-limit');
  const now = Date.now();
  const windowMs = 60 * 1000; // 1 minute window
  const key = `${ip}:${isWriteOperation ? 'write' : 'read'}`;

  const limit = isWriteOperation ? 15 : 60; // 15 writes/min, 60 reads/min

  try {
    const record = (await storage.getItem(key)) as {
      count: number;
      expires: number;
    } | null;

    if (record && record.expires > now) {
      if (record.count >= limit) {
        throw createError({
          statusCode: 429,
          statusMessage: 'Too Many Requests',
          message: 'Rate limit exceeded. Please try again in a minute.',
        });
      }

      // Increment count
      await storage.setItem(key, {
        count: record.count + 1,
        expires: record.expires,
      });
    } else {
      // First request or window expired
      await storage.setItem(key, {
        count: 1,
        expires: now + windowMs,
      });
    }

    // Set headers for transparency
    setResponseHeader(event, 'X-RateLimit-Limit', limit.toString());
    setResponseHeader(
      event,
      'X-RateLimit-Remaining',
      Math.max(0, limit - ((record?.count || 0) + 1)).toString(),
    );
  } catch (error: any) {
    if (error.statusCode === 429) throw error;
    console.error('[RateLimit] Error:', error);
    // Fail soft: let the request through if storage fails
  }
});
