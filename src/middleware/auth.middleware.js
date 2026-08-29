// src/middleware/auth.middleware.js
//
// JWT verification. This service does not own user accounts — tokens are issued
// by the main ERP and verified here with the shared JWT_SECRET, so one login
// works across both. The token's claims are the whole identity; there is no
// users table in this database to look up.
import jwt from "jsonwebtoken";
import { asyncHandler } from "./error.middleware.js";

export const protect = asyncHandler(async (req, res, next) => {
  let token;
  if (req.headers.authorization?.startsWith("Bearer ")) {
    token = req.headers.authorization.split(" ")[1];
  } else if (req.cookies?.token) {
    token = req.cookies.token;
  }
  if (!token) {
    const err = new Error("Not authorized — no token");
    err.statusCode = 401;
    throw err;
  }

  let decoded;
  try {
    decoded = jwt.verify(token, process.env.JWT_SECRET);
  } catch (jwtErr) {
    // A bad or expired token is a rejected credential, not a server fault —
    // without this it surfaces as a 500 and the SPA reports an outage.
    const err = new Error(
      jwtErr.name === "TokenExpiredError"
        ? "Session expired — please log in again"
        : "Not authorized — invalid token"
    );
    err.statusCode = 401;
    throw err;
  }

  req.user = {
    id: decoded.id || decoded.sub,
    name: decoded.name || null,
    email: decoded.email || null,
    role: decoded.role || "student",
  };
  next();
});

/**
 * Who may write placement data.
 *
 * "professor" is deliberately absent: a professor sees drives and their own
 * mentees but does not run the placement cell. HOD and dean are included
 * because both have placement screens in the frontend (PlacementHod,
 * PlacementProf) that need write access to their department's data.
 */
export const PLACEMENT_STAFF = ["admin", "placement_coordinator", "hod", "dean"];

export const authorize = (...roles) => (req, res, next) => {
  if (!roles.includes(req.user?.role)) {
    const err = new Error(`Role '${req.user?.role}' is not authorized for this route`);
    err.statusCode = 403;
    throw err;
  }
  next();
};
