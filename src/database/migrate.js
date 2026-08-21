// src/database/migrate.js
//
// Sync the models to the schema. Run this after changing a model — the server
// boots with DB_SYNC=safe, which creates missing tables but never adds columns.
//
// NOTE for Docker: a one-shot migration container runs the code baked into its
// image, not a bind mount. Rebuild it after editing models, or `alter` will run
// against a stale model set and DROP columns the live code expects.
import "dotenv/config";
import sequelize from "./connection.js";
import "./models.js";
import logger from "../utils/logger.js";

const run = async () => {
  await sequelize.authenticate();
  logger.info("Connected. Syncing models → schema (alter)…");
  await sequelize.sync({ alter: true });
  logger.info("Migration complete.");
  await sequelize.close();
};

run().catch((err) => {
  logger.error(`Migration failed: ${err.message}`);
  process.exit(1);
});
