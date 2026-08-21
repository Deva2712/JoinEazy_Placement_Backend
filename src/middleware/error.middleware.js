import logger from "../utils/logger.js";

// Central error handler — must have 4 params for Express to treat it as error middleware
export const errorHandler = (err, req, res, next) => {
  // Middleware that does `res.status(401); throw new Error(...)` — the pattern
  // used throughout auth.middleware.js — leaves the intended code on the
  // *response*, not on the error. Without this fallback a plain Error has no
  // .statusCode and every 401/403 reaches the browser as a 500.
  const statusFromResponse = res.statusCode >= 400 ? res.statusCode : null;
  const statusCode = err.statusCode || err.status || statusFromResponse || 500;
  const message = err.message || "Internal Server Error";

  // A rejected login or a wrong role is expected traffic, not a server fault —
  // logging those at error level with a stack buries real 500s.
  if (statusCode >= 500) {
    logger.error(`${req.method} ${req.originalUrl} — ${message}`, { stack: err.stack });
  } else {
    logger.warn(`${req.method} ${req.originalUrl} — ${statusCode} ${message}`);
  }

  res.status(statusCode).json({
    success: false,
    message,
    ...(process.env.NODE_ENV === "development" && { stack: err.stack }),
  });
};

// Wrap async route handlers to avoid try/catch boilerplate
export const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

/**
 * An error with an intended HTTP status.
 *
 * The dean modules (imported from JoinEazy_Dean_B) throw these instead of the
 * `const e = new Error(); e.statusCode = n;` pattern used elsewhere in this
 * codebase. Both end up in errorHandler above, which reads `statusCode`, so
 * the two styles are interchangeable — this just gives the dean code the
 * constructor it expects rather than rewriting 17 files.
 */
export class AppError extends Error {
  constructor(message, statusCode) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true;
    Error.captureStackTrace(this, this.constructor);
  }
}
