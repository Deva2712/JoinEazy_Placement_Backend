// ─── Model registry ───────────────────────────────────────────────────────────
// Importing this module registers every Sequelize model (and its associations)
// on the shared connection. Anything needing the full schema — the server,
// migrate.js, seed.js — imports this instead of repeating the list.
import "../modules/auth/auth-model.js";
import "../modules/companies/companies-model.js";
import "../modules/mous/mous-model.js";
import "../modules/students/students-model.js";
import "../modules/jobs/jobs-model.js";
import "../modules/applications/applications-model.js";
import "../modules/interviews/interviews-model.js";
import "../modules/offers/offers-model.js";
import "../modules/training/training-model.js";
import "../modules/assessments/assessments-model.js";
import "../modules/tasks/tasks-model.js";
