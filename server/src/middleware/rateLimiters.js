import rateLimit from 'express-rate-limit';

const json = (message) => ({ success: false, message });

export const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, limit: 300, standardHeaders: true, legacyHeaders: false,
  message: json('Too many requests, please try again later'),
});

// Login / forgot / reset: strict.
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, limit: 10, standardHeaders: true, legacyHeaders: false,
  message: json('Too many attempts, please try again in 15 minutes'),
});

// Cart quotes are cheap but public.
export const quoteLimiter = rateLimit({
  windowMs: 60 * 1000, limit: 60, standardHeaders: true, legacyHeaders: false,
  message: json('Too many requests, please slow down'),
});

// Orders: generous enough for shared mobile networks, strict enough to stop scripts.
export const orderLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, limit: 20, standardHeaders: true, legacyHeaders: false,
  message: json('Too many orders from this network. Please try again later.'),
});

// Public order tracking: the page re-checks every ~90 s, so this leaves room for normal use but stops scanning.
export const trackLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, limit: 40, standardHeaders: true, legacyHeaders: false,
  message: json('Too many tracking requests. Please try again in a few minutes.'),
});

// Contact form / support requests: a few per hour per network is plenty for real people.
export const contactLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, limit: 8, standardHeaders: true, legacyHeaders: false,
  message: json('Too many messages from this network. Please try again later.'),
});

// Chat: a real conversation is a message every few seconds; scripts are stopped.
export const chatLimiter = rateLimit({
  windowMs: 10 * 60 * 1000, limit: 40, standardHeaders: true, legacyHeaders: false,
  message: json('You are sending messages very fast. Please wait a moment.'),
});


// Reviews require an order ID + phone and are submitted only once per purchase.
export const reviewLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, limit: 10, standardHeaders: true, legacyHeaders: false,
  message: json('Too many review submissions from this network. Please try again later.'),
});
