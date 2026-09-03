import { PayrollRecord } from "./payroll-model.js";

const order = [["paidAt", "DESC"]];

export const service = {
  history: async () => (await PayrollRecord.findAll({ order })).map((r) => r.toJSON()),
  breakdown: async () => {
    const row = await PayrollRecord.findOne({ order });
    return row?.breakdown || {};
  },
  download: async (id) => {
    const row = await PayrollRecord.findByPk(id);
    if (!row) {
      const err = new Error("Payroll record not found");
      err.statusCode = 404;
      throw err;
    }
    return { success: true, url: `/uploads/payroll/${id}.pdf` };
  },
};
