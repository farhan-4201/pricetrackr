import rateLimit from 'express-rate-limit';

// Create the individual rate limiter instances at module load so they can be
// imported directly (named exports) or created via createRateLimiters() for
// backward compatibility.
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
    return process.env.NODE_ENV === 'development' && (req.ip === '127.0.0.1' || req.ip === '::1');
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
    return process.env.NODE_ENV === 'development' && (req.ip === '127.0.0.1' || req.ip === '::1');
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
    return process.env.NODE_ENV === 'development' && (req.ip === '127.0.0.1' || req.ip === '::1');
  }
});

export function createRateLimiters() {
  return { scrapingRateLimiter, apiRateLimiter, authRateLimiter };
}

// Named exports so other modules can import the specific limiter directly
export { scrapingRateLimiter, apiRateLimiter, authRateLimiter };
