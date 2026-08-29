import "dotenv/config";
import app from "./src/app.js";
import sequelize from "./src/database/connection.js";
import logger from "./src/utils/logger.js";

// Register every model (and association) before any sync runs.
import "./src/database/models.js";
import { seedAll } from "./src/database/seed.js";
import { Company } from "./src/modules/companies/companies-model.js";

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

const start = async () => {
  try {
    await sequelize.authenticate();
    logger.info("PostgreSQL connected");

    // "safe" creates missing tables only. Column changes go through
    // `npm run db:migrate`, never silently on boot.
    if (process.env.DB_SYNC === "alter") {
      await sequelize.sync({ alter: true });
      logger.info("Database synced (alter)");
    } else if (process.env.DB_SYNC !== "none") {
      await sequelize.sync();
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
