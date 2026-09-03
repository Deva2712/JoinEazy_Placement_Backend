import { Advance } from "./advances-model.js";

const advanceAdmins = [
  { name: "Anita Deshmukh", email: "finance@mahindrauniversity.edu.in", phone: "+91 98765 44001" },
  { name: "Megha Reddy", email: "advances@mahindrauniversity.edu.in", phone: "+91 98765 44003" },
];

const notFound = () => {
  const err = new Error("Advance not found");
  err.statusCode = 404;
  throw err;
};

export const service = {
  list: async () => ({ advances: { advances: (await Advance.findAll({ order: [["date", "DESC"]] })).map((r) => r.toJSON()), advanceAdmins } }),
  create: async (data) => (await Advance.create({ ...data, amount_requested: data.amount_requested ?? data.amount, date: data.date || new Date().toISOString().slice(0, 10) })).toJSON(),
  update: async (id, data) => {
    const row = await Advance.findByPk(id);
    if (!row) notFound();
    await row.update(data);
    return row.toJSON();
  },
  remove: async (id) => {
    const row = await Advance.findByPk(id);
    if (!row) notFound();
    await row.destroy();
    return { deleted: true, id };
  },
};
