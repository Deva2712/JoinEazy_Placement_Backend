// src/modules/companies/companies-service.js
//
// Companies plus their two child collections. CompanyForm submits
// `recruiterContacts` and `hiringHistory` inline on every save, and CompanyCard
// derives its "Students placed" figure from hiringHistory — but both are
// separate tables, so without the sync below Sequelize dropped them on write and
// omitted them on read, and every card showed 0.
import { Company, RecruiterContact, HiringHistory } from "./companies-model.js";
import { Job } from "../jobs/jobs-model.js";
import { Offer } from "../offers/offers-model.js";
import { crudService } from "../../utils/crud.js";

const include = [
  { model: RecruiterContact, as: "recruiterContacts", attributes: ["id", "name", "email", "phone", "role"] },
  { model: HiringHistory, as: "hiringHistory", attributes: ["id", "year", "studentsPlaced", "avgPackage"] },
];

const base = crudService(Company, { include, order: [["name", "ASC"]] });

const notFound = (m) => { const e = new Error(m); e.statusCode = 404; throw e; };

/**
 * Replace a company's child rows with the submitted set. The form always sends
 * the complete list (already stripped of empty rows), so anything missing was
 * removed by the coordinator.
 */
const syncChildren = async (companyId, data) => {
  if (Array.isArray(data.recruiterContacts)) {
    await RecruiterContact.destroy({ where: { companyId } });
    const rows = data.recruiterContacts
      // name is NOT NULL; an email-only row would abort the whole save.
      .filter((c) => c && c.name)
      .map((c) => ({ companyId, name: c.name, email: c.email || null, phone: c.phone || null, role: c.role || null }));
    if (rows.length) await RecruiterContact.bulkCreate(rows);
  }

  if (Array.isArray(data.hiringHistory)) {
    await HiringHistory.destroy({ where: { companyId } });
    const rows = data.hiringHistory
      .filter((h) => h && h.year != null)
      .map((h) => ({
        companyId,
        year: Number(h.year),
        studentsPlaced: Number(h.studentsPlaced) || 0,
        avgPackage: h.avgPackage == null ? null : Number(h.avgPackage),
      }));
    if (rows.length) await HiringHistory.bulkCreate(rows);
  }
};

export const service = {
  ...base,

  create: async (data) => {
    const company = await Company.create(data);
    await syncChildren(company.id, data);
    return base.get(company.id);
  },

  update: async (id, data) => {
    const company = await Company.findByPk(id);
    if (!company) notFound("Company not found");

    const nameChanged = data.name && data.name !== company.name;
    await company.update(data);
    await syncChildren(id, data);

    // Jobs and offers store the company name denormalised, so a rename has to
    // sweep them or the Drives grid and Offers tab keep showing the old one.
    if (nameChanged) {
      await Job.update({ companyName: company.name }, { where: { companyId: id } });
      await Offer.update({ companyName: company.name }, { where: { companyId: id } });
    }
    return base.get(id);
  },
};
