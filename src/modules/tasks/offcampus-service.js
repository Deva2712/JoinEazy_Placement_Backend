// src/modules/tasks/offcampus-service.js
//
// Placements a student sourced themselves. These never went through a campus
// drive but still count toward placement statistics, so they get their own
// table with a verification workflow rather than being faked as an Application
// row with a null jobId (which is what the frontend's mock layer did).
//
// `convertToPpo` additionally mints a real Offer row, because that is the only
// read path the Offers tab and Analytics use — both count `offer.offCampus`,
// not this table.
import { OffCampusRecord } from "./tasks-model.js";
import { PlacementStudent } from "../students/students-model.js";
import { Offer } from "../offers/offers-model.js";
import { parseCtc } from "../offers/offers-service.js";
import { crudService } from "../../utils/crud.js";

const badRequest = (m) => { const e = new Error(m); e.statusCode = 400; throw e; };
const notFound = (m) => { const e = new Error(m); e.statusCode = 404; throw e; };

const base = crudService(OffCampusRecord, { order: [["createdAt", "DESC"]] });

/**
 * The modal sends `studentId` as a ROLL NUMBER (the coordinator types one in),
 * so resolve it to the roster row's real id. A UUID is accepted too.
 */
const resolveStudent = async (payload) => {
  const raw = payload.studentId || payload.rollNo || payload.roll_no || payload.student_id;
  if (!raw) badRequest("Student is required");
  const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(String(raw));
  const roster = isUuid
    ? await PlacementStudent.findOne({ where: { userId: raw } })
    : await PlacementStudent.findOne({ where: { rollNo: String(raw) } });
  if (!roster) badRequest(`Student "${raw}" is not on the placement roster.`);
  return roster;
};

/** Reads emit `studentId` as the roll number and `company`, matching the modal. */
const toApi = (row) => ({
  ...row,
  studentId: row.studentRollNo ?? row.studentId,
  company: row.companyName ?? null,
  ctc: row.ctcValue ?? null,
  package: row.ctc ?? null,
});

/** Map the modal's payload onto columns. */
const toAttributes = (payload, roster) => {
  const companyName = payload.company ?? payload.companyName;
  const verified = payload.verified === true;
  return {
    studentId: roster.userId,
    studentRollNo: roster.rollNo,
    studentName: payload.studentName ?? roster.name,
    studentBranch: payload.studentBranch ?? roster.branch,
    companyName,
    role: payload.role ?? null,
    type: payload.type ?? null,
    source: payload.source ?? null,
    ctc: payload.package ?? payload.ctc ?? null,
    // Numeric mirror of `package`, so analytics can aggregate off-campus
    // placements alongside on-campus offers.
    ctcValue: payload.ctcValue ?? parseCtc(payload.package ?? payload.ctc),
    location: payload.location ?? null,
    sector: payload.sector ?? null,
    appliedAt: payload.appliedAt ?? null,
    startDate: payload.startDate ?? null,
    endDate: payload.endDate ?? null,
    offerDate: payload.offerDate ?? payload.startDate ?? null,
    letterUrl: payload.letterUrl ?? null,
    proofUrl: payload.letterUrl ?? payload.proofUrl ?? null,
    notes: payload.notes ?? null,
    verified,
    // `status` is the workflow column; `verified` is the checkbox the modal
    // binds. Keep them in step rather than letting them disagree.
    status: payload.status && ["Pending verification", "Verified", "Rejected"].includes(payload.status)
      ? payload.status
      : (verified ? "Verified" : "Pending verification"),
  };
};

/**
 * A converted internship becomes a real PPO offer so it shows up in the Offers
 * tab and the off-campus KPI. Idempotent on (student, company, role) — ticking
 * the box twice must not create two offers.
 */
const ensurePpoOffer = async (record) => {
  const existing = await Offer.findOne({
    where: { studentId: record.studentId, companyName: record.companyName, role: record.role },
  });
  if (existing) return existing.toJSON();
  const offer = await Offer.create({
    studentId: record.studentId,
    studentName: record.studentName,
    studentRollNo: record.studentRollNo,
    studentBranch: record.studentBranch,
    companyId: null,
    companyName: record.companyName,
    role: record.role,
    ctc: record.ctc || "—",
    ctcValue: record.ctcValue ?? parseCtc(record.ctc),
    location: record.location,
    sector: record.sector,
    ppo: true,
    offCampus: true,
    status: "Pending",
  });
  return offer.toJSON();
};

export const service = {
  ...base,

  list: async (query) => (await base.list(query)).map(toApi),
  get: async (id) => toApi(await base.get(id)),

  create: async (payload = {}) => {
    if (!(payload.company ?? payload.companyName)) badRequest("Company is required");
    if (!payload.role) badRequest("Role is required");
    const roster = await resolveStudent(payload);
    const record = await OffCampusRecord.create(toAttributes(payload, roster));
    if (payload.convertToPpo) await ensurePpoOffer(record);
    return toApi(record.toJSON());
  },

  update: async (id, patch = {}) => {
    const record = await OffCampusRecord.findByPk(id);
    if (!record) notFound("Off-campus record not found");
    // Only re-resolve the student when the caller actually supplied one;
    // otherwise a partial patch would blank the linkage.
    const roster = (patch.studentId || patch.rollNo)
      ? await resolveStudent(patch)
      : await PlacementStudent.findOne({ where: { userId: record.studentId } });
    const attrs = toAttributes({ ...record.toJSON(), ...patch }, roster || { userId: record.studentId, rollNo: record.studentRollNo, name: record.studentName, branch: record.studentBranch });
    await record.update(attrs);
    if (patch.convertToPpo) await ensurePpoOffer(record);
    return toApi(record.toJSON());
  },
};
