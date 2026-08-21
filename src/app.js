// Placement-Backend — src/app.js
//
// Composition root for the Placement service. Backs the placement modules of
// Placement-Frontend: student job board and applications, the coordinator's
// drive pipeline (rounds → outcomes → offers), company/MOU relationships,
// training, assessments and the HOD's departmental view.
//
// Paths mirror what the frontend already calls (api/services/placement.service.js),
// so switching it from mocks to this service is a base-URL change, not a rewrite.
import express from "express";
import compression from "compression";
import "dotenv/config";

import companiesRoutes    from "./modules/companies/companies-routes.js";
import mousRoutes         from "./modules/mous/mous-routes.js";
import jobsRoutes         from "./modules/jobs/jobs-routes.js";
import applicationsRoutes, { applyRouter } from "./modules/applications/applications-routes.js";
import interviewsRoutes   from "./modules/interviews/interviews-routes.js";
import offersRoutes       from "./modules/offers/offers-routes.js";
import studentsRoutes     from "./modules/students/students-routes.js";
import trainingRoutes     from "./modules/training/training-routes.js";
import assessmentsRoutes  from "./modules/assessments/assessments-routes.js";
import tasksRoutes        from "./modules/tasks/tasks-routes.js";
import overviewRoutes     from "./modules/overview/overview-routes.js";

import { errorHandler }  from "./middleware/error.middleware.js";
import { requestLogger } from "./middleware/logger.middleware.js";

const app = express();

// Origins are configuration, never source — see the ERP's other services. The
// SPA derives its API host from window.location, so the Origin varies with the
// address the page was opened from; in development any loopback/private-LAN
// origin on the frontend's port is accepted.
const allowedOrigins = (process.env.CORS_ORIGIN || "http://localhost:3003")
  .split(",").map((o) => o.trim()).filter(Boolean);

const FRONTEND_PORT = process.env.FRONTEND_PORT || "3003";
const PRIVATE_ORIGIN = new RegExp(
  `^http://(localhost|127\\.0\\.0\\.1|10\\.\\d{1,3}\\.\\d{1,3}\\.\\d{1,3}|192\\.168\\.\\d{1,3}\\.\\d{1,3}|172\\.(1[6-9]|2\\d|3[01])\\.\\d{1,3}\\.\\d{1,3}):${FRONTEND_PORT}$`
);

const isAllowedOrigin = (origin) => {
  if (!origin) return false;
  if (allowedOrigins.includes(origin)) return true;
  return process.env.NODE_ENV !== "production" && PRIVATE_ORIGIN.test(origin);
};

app.use((req, res, next) => {
  const origin = req.headers.origin;
  if (isAllowedOrigin(origin)) res.setHeader("Access-Control-Allow-Origin", origin);
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, PATCH, DELETE, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
  res.setHeader("Access-Control-Allow-Credentials", "true");
  if (req.method === "OPTIONS") return res.status(200).end();
  next();
});

app.use(compression());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(requestLogger);

// ─── Placement modules ───────────────────────────────────────────────────────
// Dashboards first: they declare literal paths (/overview, /coord/overview,
// /hod/overview, /history/batch-totals) that must not be captured by a
// parameterised route mounted at the same prefix.
app.use("/api/v1/placement", overviewRoutes);

app.use("/api/v1/placement/companies",    companiesRoutes);
app.use("/api/v1/placement/mous",         mousRoutes);
// Same resource, both names — the frontend uses "jobs" for the student-facing
// board and "drives" for the coordinator pipeline.
app.use("/api/v1/placement/jobs",         jobsRoutes);
app.use("/api/v1/placement/drives",       jobsRoutes);
app.use("/api/v1/placement/applications", applicationsRoutes);
app.use("/api/v1/placement/apply",        applyRouter);
app.use("/api/v1/placement/interviews",   interviewsRoutes);
app.use("/api/v1/placement/offers",       offersRoutes);
app.use("/api/v1/placement/students",     studentsRoutes);
app.use("/api/v1/placement/training",     trainingRoutes);
app.use("/api/v1/placement/assessments",  assessmentsRoutes);
app.use("/api/v1/placement/tasks",        tasksRoutes);

app.get("/health", (req, res) =>
  res.status(200).json({ status: "ok", service: "placement-api", timestamp: new Date().toISOString() })
);

app.use((req, res) =>
  res.status(404).json({ success: false, message: `Route not found: ${req.method} ${req.originalUrl}` })
);

app.use(errorHandler);

export default app;
