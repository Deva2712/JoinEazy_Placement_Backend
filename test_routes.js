// test_routes.js — the four-role guard, over real HTTP.
//
//   DATABASE_NAME=placement_smoke DATABASE_HOST=localhost DATABASE_USERNAME=postgres \
//   DATABASE_PASSWORD=postgres123 node test_routes.js
//
// Needs a throwaway Postgres database (it syncs the schema into whatever
// DATABASE_NAME points at — do not aim it at real data). test_roles.js checks
// the same rules with no database at all; this one proves they survive routing,
// mount order and the /coord/* aliases.
import jwt from "jsonwebtoken";

process.env.JWT_SECRET = process.env.JWT_SECRET || "test_secret";

const app = (await import("./src/app.js")).default;
const sequelize = (await import("./src/database/connection.js")).default;
await import("./src/database/models.js");
await sequelize.sync();

const server = app.listen(0);
const port = server.address().port;
const tok = (c) => jwt.sign(c, process.env.JWT_SECRET);

const USERS = {
  student: tok({ id: "11111111-1111-1111-1111-111111111111", role: "student" }),
  coord:   tok({ id: "22222222-2222-2222-2222-222222222222", role: "placement_coordinator" }),
  prof:    tok({ id: "33333333-3333-3333-3333-333333333333", role: "professor", branch: "CSE" }),
  // A professor whose token carries no branch cannot be scoped — must be
  // refused, never silently shown the whole cohort.
  profNoBranch: tok({ id: "44444444-4444-4444-4444-444444444444", role: "professor" }),
  hod:     tok({ id: "55555555-5555-5555-5555-555555555555", role: "hod", branches: ["CSE", "IT"] }),
};

const hit = async (who, method, path) => {
  const res = await fetch(`http://127.0.0.1:${port}/api/v1${path}`, {
    method,
    headers: { Authorization: `Bearer ${USERS[who]}`, "Content-Type": "application/json" },
    ...(method === "POST" ? { body: "{}" } : {}),
  });
  return res.status;
};

const CASES = [
  ["student", "GET",  "/placement/overview",              200],
  ["student", "GET",  "/placement/offers",                200],  // own only
  ["student", "GET",  "/placement/coord/offers",          403],  // never the cohort's
  ["student", "GET",  "/placement/prof/overview",         403],
  ["student", "POST", "/placement/jobs",                  403],

  ["coord",   "GET",  "/placement/coord/overview",        200],
  ["coord",   "GET",  "/placement/coord/offers",          200],
  ["coord",   "GET",  "/placement/prof/overview",         200],
  ["coord",   "GET",  "/placement/hod/current-students",  200],
  ["coord",   "GET",  "/placement/history/batch-totals",  200],

  ["prof",    "GET",  "/placement/prof/overview",         200],
  ["prof",    "GET",  "/placement/prof/active-drives",    200],
  ["prof",    "GET",  "/placement/history/batch-totals",  200],
  ["prof",    "GET",  "/placement/training/sessions",     200],
  ["prof",    "GET",  "/placement/coord/overview",        403],
  ["prof",    "POST", "/placement/jobs",                  403],

  ["profNoBranch", "GET", "/placement/prof/overview",     403],

  ["hod",     "GET",  "/placement/hod/overview",          200],
  ["hod",     "GET",  "/placement/hod/current-students",  200],
  ["hod",     "GET",  "/placement/hod/active-drives",     200],
  ["hod",     "GET",  "/placement/coord/offers",          403],
  ["hod",     "POST", "/placement/jobs",                  403],
  ["hod",     "POST", "/placement/training/sessions",     403],  // read-only, training included
];

let failed = 0;
for (const [who, method, path, want] of CASES) {
  const got = await hit(who, method, path);
  const ok = got === want;
  if (!ok) failed++;
  console.log(`${ok ? "ok  " : "FAIL"}  ${who.padEnd(12)} ${method.padEnd(4)} ${path.padEnd(34)} want ${want} got ${got}`);
}

const anon = await fetch(`http://127.0.0.1:${port}/api/v1/placement/offers`);
if (anon.status !== 401) failed++;
console.log(`${anon.status === 401 ? "ok  " : "FAIL"}  anon         GET  ${"/placement/offers".padEnd(34)} want 401 got ${anon.status}`);

server.close();
await sequelize.close();
console.log(failed ? `\n${failed} FAILURE(S)` : "\nall route guards behave");
process.exit(failed ? 1 : 0);
