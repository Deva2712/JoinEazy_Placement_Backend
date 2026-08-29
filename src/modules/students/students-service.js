// src/modules/students/students-service.js
//
// Generic CRUD plus a read shape the coordinator's StudentsTab can actually
// consume. The roster rows that tab renders use `year`/`company`/`role`/
// `package` where this model stores `batchYear`/`placedCompany`/`placedRole`/
// `placedPackage`, so reads emit both: the canonical column names stay in the
// payload (nothing else that reads this endpoint has to change) and the
// frontend's names are added alongside.
import { PlacementStudent } from "./students-model.js";
import { crudService } from "../../utils/crud.js";

const badRequest = (m) => { const e = new Error(m); e.statusCode = 400; throw e; };

const base = crudService(PlacementStudent, { order: [["rollNo", "ASC"]] });

// The skeleton's finer-grained states have no badge or filter option in the UI;
// everything that is not a settled outcome reads as "In Process" there.
const ROSTER_STATUS = {
  Placed: "Placed",
  "In Process": "In Process",
  "Not Placed": "Not Placed",
  "Not eligible": "Not Placed",
  "Opted out": "Not Placed",
};

const toRosterShape = (row) => ({
  ...row,
  placementStatus: ROSTER_STATUS[row.placementStatus] || "In Process",
  year: row.batchYear ?? null,
  company: row.placedCompany ?? null,
  role: row.placedRole ?? null,
  package: row.placedPackage ?? null,
});

/**
 * Accept the frontend's field names on write as well as the canonical ones —
 * the CSV import sends `year`, the roster edit form sends `batchYear`.
 */
const fromRosterShape = (data = {}) => {
  const { year, company, role, package: pkg, ...rest } = data;
  return {
    ...rest,
    ...(year !== undefined && rest.batchYear === undefined ? { batchYear: year } : {}),
    ...(company !== undefined && rest.placedCompany === undefined ? { placedCompany: company } : {}),
    ...(role !== undefined && rest.placedRole === undefined ? { placedRole: role } : {}),
    ...(pkg !== undefined && rest.placedPackage === undefined ? { placedPackage: pkg } : {}),
  };
};

export const service = {
  ...base,

  list:   async (query) => (await base.list(query)).map(toRosterShape),
  get:    async (id) => toRosterShape(await base.get(id)),
  create: async (data) => toRosterShape(await base.create(fromRosterShape(data))),
  update: async (id, data) => toRosterShape(await base.update(id, fromRosterShape(data))),

  /**
   * Bulk roster import (POST /placement/students/bulk). Payload rows are
   * { rollNo, name, branch, cgpa, year } per the frontend's studentsSpec.
   * That spec is append-only and dedupes by rollNo before sending, but a
   * concurrent import could still collide, so an existing rollNo is skipped
   * rather than overwritten — matching the spec's stated behaviour.
   */
  createBulk: async (payloads = []) => {
    if (!Array.isArray(payloads)) badRequest("Expected an array of students");
    let created = 0;
    const skipped = [];
    const failed = [];
    for (const [i, payload] of payloads.entries()) {
      try {
        const attrs = fromRosterShape(payload);
        if (!attrs.rollNo) { failed.push({ index: i, error: "Missing rollNo" }); continue; }
        const [, wasCreated] = await PlacementStudent.findOrCreate({
          where: { rollNo: attrs.rollNo },
          defaults: attrs,
        });
        if (wasCreated) created += 1;
        else skipped.push(attrs.rollNo);
      } catch (err) {
        failed.push({ index: i, rollNo: payload?.rollNo ?? null, error: err.message });
      }
    }
    return { created, skipped: skipped.length, failed: failed.length, skippedRollNos: skipped, errors: failed };
  },
};
