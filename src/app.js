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
import payrollRoutes from "./modules/payroll/payroll-routes.js";
import leavesRoutes from "./modules/leaves/leaves-routes.js";
import scheduleRoutes from "./modules/schedule/schedule-routes.js";
import assetsRoutes from "./modules/assets/assets-routes.js";
import maintenanceRoutes from "./modules/maintenance/maintenance-routes.js";
import expensesRoutes from "./modules/expenses/expenses-routes.js";
import advancesRoutes from "./modules/advances/advances-routes.js";
import bulletinsRoutes from "./modules/bulletins/bulletins-routes.js";
import userRoutes from "./modules/user/user-routes.js";
import cohortRoutes from "./modules/cohort/cohort-routes.js";
import cohortExtrasRoutes from "./modules/cohort-extras/cohort-extras-routes.js";
import cohortAssignmentsRoutes from "./modules/cohort-assignments/cohort-assignments-routes.js";
import cohortAssignmentGradeRoutes from "./modules/cohort-assignments/cohort-assignments-grade-routes.js";
import cohortMembersRoutes from "./modules/cohort-members/cohort-members-routes.js";
import cohortResourcesRoutes from "./modules/cohort-resources/cohort-resources-routes.js";
import cohortMaterialsRoutes from "./modules/cohort-materials/cohort-materials-routes.js";
import cohortMeetingsRoutes from "./modules/cohort-meetings/cohort-meetings-routes.js";
import cohortDiscussionsRoutes from "./modules/cohort-discussions/cohort-discussions-routes.js";
import cohortAttendanceRoutes from "./modules/cohort-attendance/cohort-attendance-routes.js";
import registrarRoutes from "./modules/registrar/registrar-routes.js";
import lorRoutes from "./modules/registrar/lor-routes.js";
import libraryRoutes from "./modules/library/library-routes.js";
import financeRoutes from "./modules/finance/finance-routes.js";

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

// ─── Placement coordinator workspace ERP modules ─────────────────────────────
// These paths intentionally sit at the same root prefixes the frontend services
// already call: /payroll, /leaves, /professor, /assets, /maintenance, /expenses,
// /advances, /bulletins, /user and /cohort.
app.use("/api/v1/payroll", payrollRoutes);
app.use("/api/v1/leaves", leavesRoutes);
app.use("/api/v1/professor", scheduleRoutes);
app.use("/api/v1/assets", assetsRoutes);
app.use("/api/v1/maintenance", maintenanceRoutes);
app.use("/api/v1/expenses", expensesRoutes);
app.use("/api/v1/advances", advancesRoutes);
app.use("/api/v1/bulletins", bulletinsRoutes);
app.use("/api/v1/user", userRoutes);
app.use("/api/v1/cohort/assignments", cohortAssignmentGradeRoutes);
app.use("/api/v1/cohort/:cohortId/assignments", cohortAssignmentsRoutes);
app.use("/api/v1/cohort/:cohortId/members", cohortMembersRoutes);
app.use("/api/v1/cohort/:cohortId/resources", cohortResourcesRoutes);
app.use("/api/v1/cohort/:cohortId/materials", cohortMaterialsRoutes);
app.use("/api/v1/cohort/:cohortId/meetings", cohortMeetingsRoutes);
app.use("/api/v1/cohort/:cohortId/discussions", cohortDiscussionsRoutes);
app.use("/api/v1/cohort", cohortExtrasRoutes);
app.use("/api/v1/cohort/:cohortId", cohortMeetingsRoutes);
app.use("/api/v1/cohort", cohortRoutes);
app.use("/api/v1", cohortAttendanceRoutes);
app.use("/api/v1/registrar", registrarRoutes);
app.use("/api/v1/lor", lorRoutes);
app.use("/api/v1/library", libraryRoutes);
app.use("/api/v1/finance", financeRoutes);

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
