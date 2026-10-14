import "dotenv/config";
import app from "./src/app.js";
import sequelize from "./src/database/connection.js";
import logger from "./src/utils/logger.js";

// Register every model (and association) before any sync runs.
import "./src/database/models.js";
import { seedAll } from "./src/database/seed-unified.js";
import { Company } from "./src/modules/companies/companies-model.js";
import { User } from "./src/modules/auth/auth-model.js";
import Department from "./src/modules/department/department-model.js";
import * as CompaniesModels from "./src/modules/companies/companies-model.js";
import * as MousModels from "./src/modules/mous/mous-model.js";
import * as StudentsModels from "./src/modules/students/students-model.js";
import * as JobsModels from "./src/modules/jobs/jobs-model.js";
import * as ApplicationsModels from "./src/modules/applications/applications-model.js";
import * as InterviewsModels from "./src/modules/interviews/interviews-model.js";
import * as OffersModels from "./src/modules/offers/offers-model.js";
import * as TrainingModels from "./src/modules/training/training-model.js";
import * as AssessmentsModels from "./src/modules/assessments/assessments-model.js";
import * as TasksModels from "./src/modules/tasks/tasks-model.js";

// ─── Process-level safety net ────────────────────────────────────────────────
// Node terminates on an unhandled rejection by default. One un-awaited promise
// — a handler not wrapped in asyncHandler, say — would otherwise take the whole
// API down, leaving the port open with nothing behind it (every request then
// fails as ERR_CONNECTION_RESET). Log and keep serving instead.
process.on("unhandledRejection", (reason) => {
  logger.error(`Unhandled promise rejection: ${reason?.stack || reason}`);
});

// An uncaught exception leaves the process in an undefined state, so this logs
// and exits rather than pretending recovery is safe.
process.on("uncaughtException", (err) => {
  logger.error(`Uncaught exception: ${err?.stack || err}`);
  process.exit(1);
});

const PORT = process.env.PORT || 8003;

const targetedAlterModels = [
  User,
  Department,
  ...Object.values(CompaniesModels),
  ...Object.values(MousModels),
  ...Object.values(StudentsModels),
  ...Object.values(JobsModels),
  ...Object.values(ApplicationsModels),
  ...Object.values(InterviewsModels),
  ...Object.values(OffersModels),
  ...Object.values(TrainingModels),
  ...Object.values(AssessmentsModels),
  ...Object.values(TasksModels),
].filter((model, index, models) =>
  model && typeof model.sync === "function" && models.indexOf(model) === index
);

const getErrorMessage = (err) => err?.parent?.message || err?.original?.message || err?.message;

const getTableName = (model) => {
  const tableName = typeof model.getTableName === "function" ? model.getTableName() : model.tableName;
  return typeof tableName === "object" ? tableName.tableName || JSON.stringify(tableName) : tableName;
};

const syncModelsTolerantly = async ({ alterStrictModels = false } = {}) => {
  const strictSet = new Set(targetedAlterModels);

  for (const model of targetedAlterModels) {
    await model.sync();
  }

  const skipped = [];
  for (const model of Object.values(sequelize.models)) {
    if (strictSet.has(model)) continue;
    try {
      await model.sync();
    } catch (err) {
      skipped.push(model.name);
      logger.warn(
        `Skipped non-placement model sync: model=${model.name}, table=${getTableName(model)}, error=${getErrorMessage(err)}`
      );
    }
  }

  if (alterStrictModels) {
    for (const model of targetedAlterModels) {
      await model.sync({ alter: true });
    }
  }

  logger.warn(
    `Non-placement model sync skipped ${skipped.length} model(s): ${skipped.length ? skipped.join(", ") : "none"}`
  );
};

const start = async () => {
  try {
    await sequelize.authenticate();
    logger.info("PostgreSQL connected");

    // "safe" creates missing tables only. Column changes go through
    // `npm run db:migrate`, never silently on boot.
    if (process.env.DB_SYNC === "alter") {
      await syncModelsTolerantly({ alterStrictModels: true });
      logger.info("Database synced (safe global sync + targeted alter)");
    } else if (process.env.DB_SYNC !== "none") {
      await syncModelsTolerantly();
      logger.info("Database synced (safe — created missing tables only)");
    }

    // First-boot seed. `docker compose up --build` starts an empty database, and
    // a demo that opens on empty tabs is indistinguishable from a broken one.
    // Guarded on the table actually being empty, so it never touches real data
    // and never runs twice. Set AUTO_SEED=false to opt out.
    if (process.env.AUTO_SEED !== "false" && (await Company.count()) === 0) {
      logger.info("No companies found — running first-boot seed…");
      await seedAll({ standalone: false });
    }

    app.listen(PORT, () => logger.info(`Placement API listening on ${PORT}`));
  } catch (err) {
    logger.error(`Failed to start: ${err.message}`);
    process.exit(1);
  }
};

start();
