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

export const connectDB = async () => {
  await sequelize.authenticate();
  logger.info("PostgreSQL connected via Sequelize");

  const mode = resolveSyncMode();

  if (mode === "none") {
    logger.info("DB_SYNC=none — skipping schema sync");
    return;
  }

  if (mode === "alter") {
    logger.warn(
      "DB_SYNC=alter — this duplicates UNIQUE constraints on every boot; " +
      "prefer `npm run db:migrate`"
    );
    await sequelize.sync({ alter: true });
    logger.info("Database synced (alter)");
    return;
  }

  if (mode !== "safe") {
    logger.warn(`Unknown DB_SYNC value "${mode}" — falling back to "safe"`);
  }

  await sequelize.sync();
  logger.info("Database synced (safe — created missing tables only)");
};

export default sequelize;
