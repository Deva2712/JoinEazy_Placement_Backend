// ─── Model registry ───────────────────────────────────────────────────────────
// Importing this module registers every Sequelize model (and its associations)
// on the shared connection. Anything needing the full schema — the server,
// migrate.js, seed.js — imports this instead of repeating the list.
import "../modules/auth/auth-model.js";
import "../modules/department/department-model.js";
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
import "../modules/payroll/payroll-model.js";
import "../modules/leaves/leaves-model.js";
import "../modules/schedule/schedule-model.js";
import "../modules/assets/assets-model.js";
import "../modules/maintenance/maintenance-model.js";
import "../modules/expenses/expenses-model.js";
import "../modules/advances/advances-model.js";
import "../modules/bulletins/bulletins-model.js";
import "../modules/cohort/cohort-model.js";
import "../modules/cohort-extras/cohort-extras-model.js";
import "../modules/cohort-assignments/cohort-assignments-model.js";
import "../modules/cohort-members/cohort-members-model.js";
import "../modules/cohort-resources/cohort-resources-model.js";
import "../modules/cohort-materials/cohort-materials-model.js";
import "../modules/cohort-meetings/cohort-meetings-model.js";
import "../modules/cohort-discussions/cohort-discussions-model.js";
import "../modules/cohort-attendance/cohort-attendance-model.js";
import "../modules/registrar/registrar-model.js";
import "../modules/library/library-model.js";
import "../modules/finance/finance-model.js";
