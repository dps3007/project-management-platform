import rateLimit from "express-rate-limit";

// Apply on forgot password route
export const forgotPasswordLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // max 5 attempts per window per IP
  message: {
    success: false,
    message: "Too many password reset attempts, try again later",
  },
  standardHeaders: true,
  legacyHeaders: false,
});
