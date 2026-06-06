import rateLimit from 'express-rate-limit';

export const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, error: { message: 'Too many requests', code: 'RATE_LIMITED' } },
});

export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10, // Strict limit for auth endpoints
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, error: { message: 'Too many auth attempts', code: 'RATE_LIMITED' } },
});

export const aiLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 5, // AI endpoints are expensive
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, error: { message: 'AI rate limit exceeded', code: 'RATE_LIMITED' } },
});
