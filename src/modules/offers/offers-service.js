// src/modules/offers/offers-service.js
//
// Generic CRUD from utils/crud.js, plus the offer-specific logic the frontend
// used to perform in its mock branch. With the mock switched off nothing else
// keeps the roster and the application pipeline in step with an offer's status,
// so those cascades belong here.
import { Op } from "sequelize";
import { Offer } from "./offers-model.js";
import { Application } from "../applications/applications-model.js";
import { PlacementStudent } from "../students/students-model.js";
import { crudService } from "../../utils/crud.js";

const notFound = (m) => { const e = new Error(m); e.statusCode = 404; throw e; };
const badRequest = (m) => { const e = new Error(m); e.statusCode = 400; throw e; };

const base = crudService(Offer, { order: [["createdAt", "DESC"]] });

/**
 * `studentId` is a roll number on the frontend — applications, interviews,
 * training and off-campus records all key students that way, and the PPO tile
 * joins offers to applications on it. Emitting the UUID here silently broke
 * every one of those joins.
 */
const toApi = (row) => ({ ...row, studentId: row.studentRollNo ?? row.studentId });

/**
 * "₹18–22 LPA" → 22, "30 LPA" → 30, "12.5 LPA" → 12.5.
 * Monthly stipends return null: folding a per-month figure into an LPA average
 * would misreport every package statistic that reads this column.
 */
export const parseCtc = (raw) => {
  if (raw == null || raw === "") return null;
  if (typeof raw === "number") return Number.isFinite(raw) ? raw : null;
  const s = String(raw);
  if (/month|\/\s*mo|p\.?m\.?|stipend/i.test(s)) return null;
  const numbers = s.match(/\d+(?:\.\d+)?/g);
  if (!numbers) return null;
  // Top of an advertised range is the figure the frontend's own topOfPackage()
  // shows, so aggregate on the same number the UI displays.
  return Math.max(...numbers.map(Number));
};

/**
 * The coordinator's OfferModal submits `studentId` taken from the roster row it
 * loaded, so it is normally a UUID. The CSV import path sends a roll number
 * instead. Accept either, the same way offcampus-service.js already does.
 */
const resolveStudent = async (studentId) => {
  if (!studentId) badRequest("studentId is required");
  const byPk = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(String(studentId))
    ? await PlacementStudent.findOne({ where: { userId: studentId } })
    : null;
  const roster = byPk || await PlacementStudent.findOne({ where: { rollNo: String(studentId) } });
  if (!roster) badRequest(`No student on the placement roster matches "${studentId}".`);
  return roster;
};

/** Shape one incoming payload into model attributes. */
const toAttributes = (data, roster) => ({
  ...data,
  studentId: roster.userId,
  studentName:   data.studentName   ?? roster.name,
  studentRollNo: data.studentRollNo ?? roster.rollNo,
  studentBranch: data.studentBranch ?? roster.branch,
  ctcValue: parseCtc(data.ctc),
});

/**
 * An offer already live for the same (student, company, role) would double-count
 * in the funnel and render twice. Pending/Accepted are live; Rejected/Withdrawn
 * are closed records, so re-offering after one of those is a legitimate re-open.
 * Mirrors the guard the frontend's createOffer() applied in its mock branch.
 */
const assertNoLiveDuplicate = async ({ studentId, companyId, role }, excludeId = null) => {
  const where = {
    studentId,
    companyId: companyId ?? null,
    role: role ?? null,
    status: { [Op.in]: ["Pending", "Accepted"] },
  };
  if (excludeId) where.id = { [Op.ne]: excludeId };
  if (await Offer.findOne({ where })) {
    badRequest("An active offer already exists for this student / company / role.");
  }
};

/**
 * Keep the roster snapshot and the linked application in step with the offer.
 * Accepting places the student; withdrawing/rejecting un-places them.
 */
const cascadeStatus = async (offer, prevStatus) => {
  const roster = await PlacementStudent.findOne({ where: { userId: offer.studentId } });
  const app = offer.applicationId ? await Application.findByPk(offer.applicationId) : null;

  if (offer.status === "Accepted" && prevStatus !== "Accepted") {
    if (roster) {
      await roster.update({
        placementStatus: "Placed",
        placedCompany: offer.companyName ?? roster.placedCompany,
        placedRole:    offer.role ?? roster.placedRole,
        placedPackage: offer.ctcValue ?? roster.placedPackage,
        sector:        offer.sector ?? roster.sector,
      });
    }
    if (app) await app.update({ status: "Placed" });
    return;
  }

  if (prevStatus === "Accepted" && offer.status !== "Accepted") {
    // Leaving Accepted un-places the student — otherwise the roster keeps
    // reporting a placement that no live offer backs.
    if (roster) {
      await roster.update({
        placementStatus: "Offered",
        placedCompany: null, placedRole: null, placedPackage: null,
      });
    }
    if (app) await app.update({ status: offer.status === "Withdrawn" ? "Selected" : "Offer Received" });
  }
};

export const service = {
  ...base,

  list: async (query) => (await base.list(query)).map(toApi),
  get: async (id) => toApi(await base.get(id)),

  create: async (data) => {
    const roster = await resolveStudent(data.studentId);
    const attrs = toAttributes(data, roster);
    await assertNoLiveDuplicate(attrs);
    const row = await Offer.create(attrs);
    if (row.status === "Accepted") await cascadeStatus(row, null);
    return toApi(row.toJSON());
  },

  /**
   * Bulk create for the CSV import pipeline (POST /placement/offers/bulk).
   * The frontend's createOffers() states dedupe is the caller's job — its import
   * spec already classifies and skips active duplicates — so this trusts the
   * payloads rather than re-running the single-create guard per row. Rows that
   * fail are reported, not thrown, so one bad line cannot discard a 500-row import.
   */
  createBulk: async (payloads = []) => {
    if (!Array.isArray(payloads)) badRequest("Expected an array of offers");
    const created = [];
    const failed = [];
    for (const [i, payload] of payloads.entries()) {
      try {
        const roster = await resolveStudent(payload.studentId);
        const row = await Offer.create(toAttributes(payload, roster));
        if (row.status === "Accepted") await cascadeStatus(row, null);
        created.push(toApi(row.toJSON()));
      } catch (err) {
        failed.push({ index: i, studentId: payload?.studentId ?? null, error: err.message });
      }
    }
    return { created: created.length, failed: failed.length, offers: created, errors: failed };
  },

  update: async (id, data) => {
    const row = await Offer.findByPk(id);
    if (!row) notFound("Offer not found");
    const prevStatus = row.status;

    const patch = { ...data };
    if (data.studentId && data.studentId !== row.studentId) {
      const roster = await resolveStudent(data.studentId);
      Object.assign(patch, toAttributes(data, roster));
    }
    if ("ctc" in data) patch.ctcValue = parseCtc(data.ctc);
    if (patch.status === "Accepted") patch.acceptedAt = row.acceptedAt || new Date();
    if (patch.status && patch.status !== "Accepted") patch.acceptedAt = null;
    // Attaching the letter is what makes an offer "received" by the student.
    if (data.letterUrl && !row.letterSentAt) patch.letterSentAt = new Date();

    await row.update(patch);

    if (patch.status && patch.status !== prevStatus) await cascadeStatus(row, prevStatus);

    // Letter cascade: Selected → Offer Received, only on that exact transition.
    if (data.letterUrl && row.applicationId) {
      const app = await Application.findByPk(row.applicationId);
      if (app && app.status === "Selected") await app.update({ status: "Offer Received" });
    }
    return toApi(row.toJSON());
  },
};
