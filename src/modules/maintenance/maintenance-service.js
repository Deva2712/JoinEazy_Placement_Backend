import { MaintenanceRequest } from "./maintenance-model.js";

const technicians = [
  { name: "Suresh Kumar", phone: "+91 98765 43001", specialization: "Electrical" },
  { name: "Imran Ali", phone: "+91 98765 43002", specialization: "HVAC" },
  { name: "Lakshmi Devi", phone: "+91 98765 43003", specialization: "Civil Works" },
];
const admins = [{ name: "Facilities Desk", email: "maintenance@mahindrauniversity.edu.in", phone: "+91 98765 43000" }];
const issueTypes = ["Electrical", "Plumbing", "HVAC", "Furniture", "IT", "Housekeeping"];

const notFound = () => {
  const err = new Error("Maintenance request not found");
  err.statusCode = 404;
  throw err;
};

export const service = {
  overview: async () => ({
    requests: (await MaintenanceRequest.findAll({ order: [["createdAt", "DESC"]] })).map((r) => r.toJSON()),
    technicians,
    admins,
    issueTypes,
  }),
  create: async (data) => (await MaintenanceRequest.create(data)).toJSON(),
  updateStatus: async (id, data) => {
    const row = await MaintenanceRequest.findByPk(id);
    if (!row) notFound();
    await row.update({ status: data.status, adminRemarks: data.adminRemarks ?? row.adminRemarks });
    return row.toJSON();
  },
};
