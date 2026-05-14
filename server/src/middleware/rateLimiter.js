import rateLimit, { ipKeyGenerator } from 'express-rate-limit';

export const aiRateLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 20,
  keyGenerator: (req) => {
    if (req.user?.id) return `user_${req.user.id}`;
    return ipKeyGenerator(req);
  },
  message: { error: 'Too many AI requests. Limit is 20 per hour. Please try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
});
