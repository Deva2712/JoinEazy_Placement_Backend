// src/middleware/auth.middleware.js
//
// JWT verification and the placement role model. This service does not own user
// accounts — tokens are issued by the main ERP and verified here with the shared
// JWT_SECRET, so one login works across both. The token's claims are the whole
// identity; there is no users table in this database to look up.
import jwt from "jsonwebtoken";
import { asyncHandler } from "./error.middleware.js";

/**
 * The four roles the placement frontend actually ships, read off its route
 * guards (Placement-Frontend/src/App.jsx) — these strings must match exactly,
 * because ProtectedRoute compares them against `user.role` verbatim.
 *
 * Deliberately NOT here: "admin" and "dean". Neither has a placement screen in
 * the frontend, so granting them write access would open a door no UI opens.
 * "hr" exists in the ERP but has no placement route either.
 */
export const ROLES = {
  STUDENT: "student",
  COORDINATOR: "placement_coordinator",
  PROFESSOR: "professor",
  HOD: "hod",
};

/**
 * Who may write placement data: the coordinator, and only the coordinator.
 *
 * The frontend backs this up — every mutating screen (drives, companies, MOUs,
 * offers, interviews, roster imports) lives under /placement-coord, which is
 * gated to placement_coordinator alone. /placement-prof and /placement-hod
 * render read-only views.
 */
export const COORD_ONLY = [ROLES.COORDINATOR];

/**
 * Staff reads: the three non-student roles. A professor and an HoD both open
 * placement statistics, they just see different slices of them — see
 * `branchScope` below for how the slice is decided.
 */
export const STAFF_READ = [ROLES.COORDINATOR, ROLES.PROFESSOR, ROLES.HOD];

/**
 * The one exception to "coordinator is the only writer": a professor who
 * instructs a training program marks attendance and records assessment scores
 * for it (Placement-Frontend's useProfProgramsData → trainingService
 * .markAttendance / .addAssessmentScore / .updateAssessmentScore).
 */
export const TRAINING_WRITE = [ROLES.COORDINATOR, ROLES.PROFESSOR];

export const protect = asyncHandler(async (req, res, next) => {
  let token;
  if (req.headers.authorization?.startsWith("Bearer ")) {
    token = req.headers.authorization.split(" ")[1];
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
    role: decoded.role || ROLES.STUDENT,
    // Branch scoping claims. A professor carries one branch; an HoD carries the
    // several their department covers (Computer Science → CSE, IT, Data
    // Science). Both are optional — `branchScope` decides what a missing claim
    // means per role, and never guesses one open.
    branch: decoded.branch || null,
    branches: Array.isArray(decoded.branches) ? decoded.branches : null,
  };
  next();
});

export const authorize = (...roles) => (req, res, next) => {
  if (!roles.includes(req.user?.role)) {
    const err = new Error(`Role '${req.user?.role}' is not authorized for this route`);
    err.statusCode = 403;
    throw err;
  }
  next();
};

/**
 * Resolves which branches the caller may see, and puts it on `req.scope`.
 *
 * The branch a professor or HoD sees comes from their TOKEN, never from the
 * query string — otherwise `?branch=CSE` turns every scoped endpoint into an
 * open one and the whole point of the role is gone. The query is honoured only
 * to narrow within what the token already allows, and only the coordinator (who
 * may see everything) can name any branch freely.
 *
 * `req.scope.branches === null` means "no restriction".
 */
export const branchScope = (req, res, next) => {
  const { role, branch, branches } = req.user || {};
  const asked = (req.query.branch || req.query.branches || "")
    .split(",").map((b) => b.trim()).filter(Boolean);

  if (role === ROLES.COORDINATOR) {
    req.scope = { branches: asked.length ? asked : null };
    return next();
  }

  const allowed = role === ROLES.HOD
    ? (branches || (branch ? [branch] : []))
    : (branch ? [branch] : []);

  if (!allowed.length) {
    // A prof or HoD whose token carries no branch cannot be scoped, and
    // defaulting to "all branches" would leak the whole cohort. Fail loudly so
    // the ERP's token payload gets fixed rather than silently over-sharing.
    const err = new Error(
      `No branch claim on this ${role} token — cannot scope placement data`
    );
    err.statusCode = 403;
    throw err;
  }

  // Narrowing only: anything asked for that is not already allowed is dropped.
  const narrowed = asked.length ? asked.filter((b) => allowed.includes(b)) : allowed;
  req.scope = { branches: narrowed.length ? narrowed : allowed };
  next();
};
