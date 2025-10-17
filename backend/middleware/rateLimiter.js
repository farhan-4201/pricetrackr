import rateLimit from 'express-rate-limit';

export function createRateLimiters() {
  const scrapingRateLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 10, // Limit each IP to 10 scraping requests per 15 minutes
    message: {
      error: 'Too many scraping requests from this IP, please try again later.',
      retryAfter: 900 // seconds (15 minutes)
    },
    standardHeaders: true,
    legacyHeaders: false,
    skip: (req) => {
      return process.env.NODE_ENV === 'development' && req.ip === '127.0.0.1';
    },
    handler: (req, res) => {
      res.status(429).json({
        error: 'Too many scraping requests from this IP, please try again later.',
        retryAfter: Math.ceil(req.rateLimit.resetTime / 1000),
        timestamp: new Date().toISOString()
      });
    }
  });

  const apiRateLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 100,
    message: {
      error: 'Too many requests from this IP, please try again later.',
      retryAfter: 900
    },
    standardHeaders: true,
    legacyHeaders: false,
    skip: (req) => {
      return process.env.NODE_ENV === 'development' && req.ip === '127.0.0.1';
    }
  });

  const authRateLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 5,
    message: {
      error: 'Too many authentication attempts, please try again later.',
      retryAfter: 900
    },
    standardHeaders: true,
    legacyHeaders: false,
    skip: (req) => {
      return process.env.NODE_ENV === 'development' && req.ip === '127.0.0.1';
    }
  });

  return { scrapingRateLimiter, apiRateLimiter, authRateLimiter };
}
