// test_roles.js — the four-role guard, checked end to end.
//
//   node test_roles.js
//
// Covers what would otherwise only be caught in production: that a professor
// cannot widen their own branch scope through the query string, that an HoD
// cannot write, and that a coordinator can. Run it after touching
// auth.middleware.js.
import assert from "node:assert/strict";
import jwt from "jsonwebtoken";

process.env.JWT_SECRET = "test_secret";
const { protect, authorize, branchScope, ROLES, COORD_ONLY, STAFF_READ, TRAINING_WRITE } =
  await import("./src/middleware/auth.middleware.js");

const run = (mw, req) => new Promise((resolve) => {
  const res = { status: () => res, json: () => res, end: () => res };
  try {
    mw(req, res, (err) => resolve(err || null));
  } catch (err) {
    resolve(err);
  }
});

const tokenFor = (claims) => jwt.sign(claims, process.env.JWT_SECRET);
const reqFor = (claims, query = {}) => ({
  headers: { authorization: `Bearer ${tokenFor(claims)}` }, query,
});

// ─── protect ─────────────────────────────────────────────────────────────────
{
  const req = reqFor({ id: "u1", role: ROLES.PROFESSOR, branch: "CSE" });
  assert.equal(await run(protect, req), null);
  assert.equal(req.user.role, "professor");
  assert.equal(req.user.branch, "CSE");
}
{
  const err = await run(protect, { headers: {}, query: {} });
  assert.equal(err.statusCode, 401, "no token must be 401, not 500");
}
{
  const err = await run(protect, { headers: { authorization: "Bearer garbage" }, query: {} });
  assert.equal(err.statusCode, 401, "a bad token is a rejected credential, not an outage");
}

// ─── the four roles are exactly these strings ────────────────────────────────
assert.deepEqual(
  Object.values(ROLES).sort(),
  ["hod", "placement_coordinator", "professor", "student"],
  "role strings must match Placement-Frontend's ProtectedRoute verbatim",
);
assert.deepEqual(COORD_ONLY, ["placement_coordinator"]);
assert.ok(!STAFF_READ.includes("student"), "student is not staff");
assert.ok(!TRAINING_WRITE.includes("hod"), "HoD is read-only, including training");

// ─── authorize ───────────────────────────────────────────────────────────────
{
  const write = authorize(...COORD_ONLY);
  assert.equal(await run(write, { user: { role: "placement_coordinator" } }), null);
  for (const role of ["professor", "hod", "student"]) {
    const err = await run(write, { user: { role } });
    assert.equal(err?.statusCode, 403, `${role} must not write placement data`);
  }
}

// ─── branchScope — the part worth testing ────────────────────────────────────
{
  // A professor gets their own branch and nothing else...
  const req = { user: { role: ROLES.PROFESSOR, branch: "CSE" }, query: {} };
  assert.equal(await run(branchScope, req), null);
  assert.deepEqual(req.scope.branches, ["CSE"]);
}
{
  // ...and cannot widen it by asking for someone else's.
  const req = { user: { role: ROLES.PROFESSOR, branch: "CSE" }, query: { branch: "ECE" } };
  await run(branchScope, req);
  assert.deepEqual(req.scope.branches, ["CSE"], "query must never widen a token's scope");
}
{
  // An HoD sees every branch their department covers.
  const req = { user: { role: ROLES.HOD, branches: ["CSE", "IT", "Data Science"] }, query: {} };
  await run(branchScope, req);
  assert.deepEqual(req.scope.branches, ["CSE", "IT", "Data Science"]);
}
{
  // An HoD may narrow within their own branches.
  const req = { user: { role: ROLES.HOD, branches: ["CSE", "IT"] }, query: { branches: "IT" } };
  await run(branchScope, req);
  assert.deepEqual(req.scope.branches, ["IT"]);
}
{
  // A missing claim must fail loudly, never fall back to "all branches".
  const req = { user: { role: ROLES.PROFESSOR, branch: null, branches: null }, query: {} };
  const err = await run(branchScope, req);
  assert.equal(err?.statusCode, 403, "an unscopable prof token must not see the whole cohort");
}
{
  // The coordinator is unrestricted.
  const req = { user: { role: ROLES.COORDINATOR }, query: {} };
  await run(branchScope, req);
  assert.equal(req.scope.branches, null, "null means no restriction");
}

console.log("all role guard checks passed");
