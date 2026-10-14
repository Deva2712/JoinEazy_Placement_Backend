import { Sequelize } from "sequelize";
import logger from "../utils/logger.js";

const sequelize = new Sequelize(
  process.env.DATABASE_NAME,
  process.env.DATABASE_USERNAME,
  process.env.DATABASE_PASSWORD,
  {
    host: process.env.DATABASE_HOST,
    port: process.env.DATABASE_PORT || 5432,
    dialect: process.env.DATABASE_DIALECT || "postgres",
    logging: (msg) => logger.debug(msg),
    pool: {
      max: 10,
      min: 0,
      acquire: 30000,
      idle: 10000,
    },
    dialectOptions: {
      // SSL is explicit, not inferred. Keying it solely off NODE_ENV meant a
      // shell that happened to export NODE_ENV=production forced SSL against a
      // local Postgres that does not offer it, and the connection failed with
      // "The server does not support SSL connections". DATABASE_SSL overrides;
      // NODE_ENV remains the default when it is unset.
      ssl: (process.env.DATABASE_SSL ?? (process.env.NODE_ENV === "production" ? "true" : "false")) === "true"
        ? { require: true, rejectUnauthorized: false }
        : false,
    },
  }
);

/**
 * How the server treats the schema at boot, via DB_SYNC:
 *
 *   "safe"  (default) — CREATE TABLE IF NOT EXISTS. Creates anything missing,
 *                       never touches a table that already exists.
 *   "none"            — connect only. Default in production.
 *   "alter"           — reconcile existing tables against the models.
 *
 * "alter" is deliberately NOT the default. Sequelize's alter re-creates every
 * UNIQUE constraint on each run rather than detecting the existing one, so
 * booting with it repeatedly leaves users_email_key, _key1, _key2 … stacked up
 * on the same column. Use `npm run db:migrate` when models change — it runs
 * alter once and then cleans up the duplicates it made.
 */
const resolveSyncMode = () => {
  const explicit = process.env.DB_SYNC?.trim().toLowerCase();
  if (explicit) return explicit;
  return process.env.NODE_ENV === "production" ? "none" : "safe";
};

const getTargetedAlterModels = async () => {
  const [
    { User },
    { default: Department },
    CompaniesModels,
    MousModels,
    StudentsModels,
    JobsModels,
    ApplicationsModels,
    InterviewsModels,
    OffersModels,
    TrainingModels,
    AssessmentsModels,
    TasksModels,
  ] = await Promise.all([
    import("../modules/auth/auth-model.js"),
    import("../modules/department/department-model.js"),
    import("../modules/companies/companies-model.js"),
    import("../modules/mous/mous-model.js"),
    import("../modules/students/students-model.js"),
    import("../modules/jobs/jobs-model.js"),
    import("../modules/applications/applications-model.js"),
    import("../modules/interviews/interviews-model.js"),
    import("../modules/offers/offers-model.js"),
    import("../modules/training/training-model.js"),
    import("../modules/assessments/assessments-model.js"),
    import("../modules/tasks/tasks-model.js"),
  ]);

  return [
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
};

const getErrorMessage = (err) => err?.parent?.message || err?.original?.message || err?.message;

const getTableName = (model) => {
  const tableName = typeof model.getTableName === "function" ? model.getTableName() : model.tableName;
  return typeof tableName === "object" ? tableName.tableName || JSON.stringify(tableName) : tableName;
};

const syncModelsTolerantly = async ({ alterStrictModels = false } = {}) => {
  const strictModels = await getTargetedAlterModels();
  const strictSet = new Set(strictModels);

  for (const model of strictModels) {
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
    for (const model of strictModels) {
      await model.sync({ alter: true });
    }
  }

  logger.warn(
    `Non-placement model sync skipped ${skipped.length} model(s): ${skipped.length ? skipped.join(", ") : "none"}`
  );
};

export const connectDB = async () => {
  await sequelize.authenticate();
  logger.info("PostgreSQL connected via Sequelize");

  const mode = resolveSyncMode();

  if (mode === "none") {
    logger.info("DB_SYNC=none — skipping schema sync");
    return;
  }

  if (mode === "alter") {
    await syncModelsTolerantly({ alterStrictModels: true });
    logger.info("Database synced (safe global sync + targeted alter)");
    return;
  }

  if (mode !== "safe") {
    logger.warn(`Unknown DB_SYNC value "${mode}" — falling back to "safe"`);
  }

  await syncModelsTolerantly();
  logger.info("Database synced (safe — created missing tables only)");
};

export default sequelize;
