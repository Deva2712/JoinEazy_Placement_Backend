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
import path from "node:path";
import compression from "compression";
import cookieParser from "cookie-parser";
import "dotenv/config";

import companiesRoutes from "./modules/companies/companies-routes.js";
import mousRoutes from "./modules/mous/mous-routes.js";
import jobsRoutes from "./modules/jobs/jobs-routes.js";
import applicationsRoutes, { applyRouter } from "./modules/applications/applications-routes.js";
import interviewsRoutes from "./modules/interviews/interviews-routes.js";
import offersRoutes from "./modules/offers/offers-routes.js";
import studentsRoutes from "./modules/students/students-routes.js";
import { profileRouter, documentsRouter } from "./modules/students/profile-routes.js";
import trainingRoutes from "./modules/training/training-routes.js";
import assessmentsRoutes from "./modules/assessments/assessments-routes.js";
import tasksRoutes from "./modules/tasks/tasks-routes.js";
import offCampusRoutes from "./modules/tasks/offcampus-routes.js";
import overviewRoutes from "./modules/overview/overview-routes.js";
import authRoutes from "./modules/auth/auth-routes.js";

import { errorHandler } from "./middleware/error.middleware.js";
import { UPLOAD_DIR } from "./middleware/upload.middleware.js";
import { protect, authorize, PLACEMENT_STAFF } from "./middleware/auth.middleware.js";
import { upload, publicUrl } from "./middleware/upload.middleware.js";
import { requestLogger } from "./middleware/logger.middleware.js";

const app = express();

// ─── Core Middleware ───────────────────────────────────────────────────────────
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
app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(requestLogger);

app.use("/api/v1/auth", authRoutes);

// ─── Placement modules ───────────────────────────────────────────────────────
// Dashboards first: they declare literal paths (/overview, /coord/overview,
// /hod/overview, /history/batch-totals) that must not be captured by a
// parameterised route mounted at the same prefix.
app.use("/api/v1/placement", overviewRoutes);

app.use("/api/v1/placement/companies", companiesRoutes);
app.use("/api/v1/placement/mous", mousRoutes);
// Same resource, both names — the frontend uses "jobs" for the student-facing
// board and "drives" for the coordinator pipeline.
app.use("/api/v1/placement/jobs", jobsRoutes);
app.use("/api/v1/placement/drives", jobsRoutes);
app.use("/api/v1/placement/applications", applicationsRoutes);
app.use("/api/v1/placement/coord/applications", applicationsRoutes);
app.use("/api/v1/placement/apply", applyRouter);
app.use("/api/v1/placement/interviews", interviewsRoutes);
app.use("/api/v1/placement/coord/interviews", interviewsRoutes);
app.use("/api/v1/placement/offers", offersRoutes);
app.use("/api/v1/placement/coord/offers", offersRoutes);
app.use("/api/v1/placement/students", studentsRoutes);
// Act on the signed-in student, so they sit beside students rather than under it.
app.use("/api/v1/placement/profile", profileRouter);
app.use("/api/v1/placement/documents", documentsRouter);
app.use("/api/v1/placement/training", trainingRoutes);
app.use("/api/v1/placement/assessments", assessmentsRoutes);
app.use("/api/v1/placement/tasks", tasksRoutes);
app.use("/api/v1/placement/off-campus-records", offCampusRoutes);

// Uploaded resumes/portfolios are served straight back from disk — the URLs
// stored in *_url columns are /uploads/<file>.
app.use("/uploads", express.static(UPLOAD_DIR));

/**
 * POST /placement/import — dataset file drop.
 *
 * Deliberately a receipt, not an importer. The live bulk-import flow
 * (ImportModal + importSpecs) parses CSV in the browser and posts structured
 * rows to /students/bulk, /offers/bulk and /drives/:jobId/applicants; this
 * endpoint is only reachable from ImportDataModal, which is not mounted
 * anywhere in the current frontend. It stores the upload and reports it as
 * queued — matching the mock's response shape — so the flow does not 404 if
 * that modal is ever wired up, without inventing eight CSV parsers nothing
 * calls. Flagged for review rather than built out.
 */
app.post(
  "/api/v1/placement/import",
  protect,
  authorize(...PLACEMENT_STAFF),
  upload.single("file"),
  (req, res) => {
    if (!req.file) return res.status(400).json({ success: false, message: "No file uploaded" });
    res.json({
      success: true,
      data: {
        target: req.body?.target || null,
        fileName: req.file.originalname,
        bytes: req.file.size,
        url: publicUrl(req.file.filename),
        status: "Queued for backend processing",
      },
    });
  }
);

app.get("/health", (req, res) =>
  res.status(200).json({ status: "ok", service: "placement-api", timestamp: new Date().toISOString() })
);

app.use((req, res) =>
  res.status(404).json({ success: false, message: `Route not found: ${req.method} ${req.originalUrl}` })
);

app.use(errorHandler);

export default app;
