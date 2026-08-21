// src/database/seed.js
//
// Minimal reference data so the API returns something on first run. Idempotent
// — keyed on natural identifiers, so re-running never duplicates.
//
// Deliberately small: this is a skeleton, and the frontend still carries its own
// mock fixtures. Grow this only with data the service genuinely needs.
import "dotenv/config";
import sequelize from "./connection.js";
import "./models.js";
import logger from "../utils/logger.js";

import { Company } from "../modules/companies/companies-model.js";
import { Job } from "../modules/jobs/jobs-model.js";

const COMPANIES = [
  { name: "Google",             sector: "Technology", tier: "Tier 1", profile: "Search and cloud computing", schools: ["Engineering"] },
  { name: "Microsoft",          sector: "Technology", tier: "Tier 1", profile: "Cloud, productivity and devices", schools: ["Engineering"] },
  { name: "McKinsey & Company", sector: "Consulting", tier: "Tier 1", profile: "Management consulting", schools: ["Management"] },
];

const run = async () => {
  await sequelize.authenticate();
  await sequelize.sync();
  logger.info("Connected. Seeding placement reference data…");

  let created = 0;
  for (const c of COMPANIES) {
    const [, wasCreated] = await Company.findOrCreate({ where: { name: c.name }, defaults: c });
    if (wasCreated) created++;
  }

  // One open drive so the student job board is not empty on a fresh install.
  const google = await Company.findOne({ where: { name: "Google" } });
  if (google) {
    await Job.findOrCreate({
      where: { role: "Software Development Engineer", company_id: google.id },
      defaults: {
        company_id: google.id,
        company_name: google.name,
        role: "Software Development Engineer",
        type: "Full Time",
        location: "Hyderabad, India",
        package: "₹40 LPA",
        description: "Design and build large-scale systems.",
        requirements: ["Data Structures", "Algorithms", "System Design"],
        openings: 5,
        min_cgpa: 7.5,
        branches: ["CSE", "IT", "ECE"],
        deadline: new Date(Date.now() + 30 * 86400000),
        status: "Applications open",
      },
    });
  }

  logger.info(`Done. ${created} company(ies) created, ${COMPANIES.length - created} already present.`);
  await sequelize.close();
};

run().catch((err) => {
  logger.error(`Seed failed: ${err.message}`);
  process.exit(1);
});
