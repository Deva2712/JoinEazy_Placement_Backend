import { LeaveApplication, LeaveSubstitutionRequest } from "./leaves-model.js";

const managementContacts = [
  { name: "HR Helpdesk", email: "hr@mahindrauniversity.edu.in", phone: "+91 98765 41001" },
  { name: "Academic Office", email: "academics@mahindrauniversity.edu.in", phone: "+91 98765 41002" },
];

const faculties = [
  { id: "faculty-priya-sharma", name: "Priya Sharma" },
  { id: "faculty-arjun-verma", name: "Prof. Arjun Verma" },
  { id: "faculty-meera-iyer", name: "Dr. Meera Iyer" },
];

const serialize = (row) => row.toJSON();

export const service = {
  overview: async () => ({
    managementContacts,
    faculties,
    applications: (await LeaveApplication.findAll({ order: [["appliedAt", "DESC"]] })).map(serialize),
    substitutionRequests: (await LeaveSubstitutionRequest.findAll({ order: [["created_at", "DESC"]] })).map(serialize),
  }),
  create: async (data) => {
    const row = await LeaveApplication.create({ facultyName: data.facultyName || "Priya Sharma", ...data });
    return row.toJSON();
  },
  update: async (id, data) => {
    const row = await LeaveApplication.findByPk(id);
    if (!row) {
      const err = new Error("Leave application not found");
      err.statusCode = 404;
      throw err;
    }
    await row.update(data);
    return row.toJSON();
  },
  approve: async (id, { role, action, remark }) => {
    const row = await LeaveApplication.findByPk(id);
    if (!row) {
      const err = new Error("Leave application not found");
      err.statusCode = 404;
      throw err;
    }
    const leaveApproval = { ...(row.leaveApproval || {}) };
    leaveApproval[role] = { status: action, remark: remark ?? null };
    const values = Object.values(leaveApproval).map((v) => v?.status);
    const status = values.includes("Rejected") ? "Rejected" : values.every((v) => v === "Approved") ? "Approved" : "Pending";
    await row.update({ leaveApproval, status });
    return row.toJSON();
  },
  substitution: async (id, { action }) => {
    const row = await LeaveSubstitutionRequest.findByPk(id);
    if (!row) {
      const err = new Error("Substitution request not found");
      err.statusCode = 404;
      throw err;
    }
    await row.update({ status: action });
    return row.toJSON();
  },
};
