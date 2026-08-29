// src/modules/mous/mous-service.js
//
// MoUs, plus the two things the generic CRUD cannot do on its own:
//
//   1. max ONE "Active" MoU per company — the rule the frontend's mock enforced
//      and the reason the Companies tab's "Expiring Soon" KPI and "Active
//      Partners" count can disagree if it is violated.
//   2. campusVisits — MoUForm posts these inline as an array of
//      { date, purpose }, but they are their own table (one-to-many via mouId).
//      Sequelize ignores unknown keys, so without the sync below every visit the
//      coordinator entered was silently dropped on save. Reads return the array
//      back in the same shape from the association.
import { Op } from "sequelize";
import { Mou, CampusVisit } from "./mous-model.js";
import { crudService } from "../../utils/crud.js";

const notFound = (m) => { const e = new Error(m); e.statusCode = 404; throw e; };
const badRequest = (m) => { const e = new Error(m); e.statusCode = 400; throw e; };

const base = crudService(Mou, {
  include: [{ model: CampusVisit, as: "campusVisits", attributes: ["id", "date", "purpose"] }],
  order: [["startDate", "DESC"]],
});

const assertSingleActive = async (companyId, excludeId = null) => {
  const where = { companyId: companyId, status: "Active" };
  if (excludeId) where.id = { [Op.ne]: excludeId };
  const existing = await Mou.findOne({ where });
  if (existing) {
    badRequest("This company already has an active MoU — deactivate it before activating another.");
  }
};

/**
 * Replace an MoU's visits with the submitted set. The form always sends the
 * complete list, so rows missing from the payload were removed by the
 * coordinator. Rows with neither a date nor a purpose are skipped — the form
 * filters those out already, but a direct API caller might not.
 */
const syncCampusVisits = async (mouId, visits) => {
  if (!Array.isArray(visits)) return;
  await CampusVisit.destroy({ where: { mouId } });
  const rows = visits
    .filter((v) => v && (v.date || v.purpose))
    // date is NOT NULL on the table; a purpose-only row would fail the insert
    // and take the whole save down with it.
    .filter((v) => v.date)
    .map((v) => ({ mouId, date: v.date, purpose: v.purpose || null }));
  if (rows.length) await CampusVisit.bulkCreate(rows);
};

/** Re-read so the response carries the visits that were just written. */
const withVisits = async (id) => base.get(id);

export const service = {
  ...base,

  create: async (data) => {
    const { campusVisits, ...attrs } = data;
    if (attrs.status === "Active") {
      await assertSingleActive(attrs.companyId);
    }
    const row = await Mou.create(attrs);
    await syncCampusVisits(row.id, campusVisits);
    return withVisits(row.id);
  },

  update: async (id, data) => {
    const { campusVisits, ...attrs } = data;
    const row = await Mou.findByPk(id);
    if (!row) notFound("MoU not found");
    if (attrs.status === "Active" && row.status !== "Active") {
      await assertSingleActive(row.companyId, id);
    }
    await row.update(attrs);
    await syncCampusVisits(id, campusVisits);
    return withVisits(id);
  },
};
