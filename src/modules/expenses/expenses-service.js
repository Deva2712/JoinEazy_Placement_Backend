import { Expense } from "./expenses-model.js";

const financeAdmins = [
  { name: "Anita Deshmukh", email: "finance@mahindrauniversity.edu.in", phone: "+91 98765 44001" },
  { name: "Sanjay Gupta", email: "accounts@mahindrauniversity.edu.in", phone: "+91 98765 44002" },
];

const notFound = () => {
  const err = new Error("Expense not found");
  err.statusCode = 404;
  throw err;
};

export const service = {
  list: async () => ({ expenses: { expenses: (await Expense.findAll({ order: [["date", "DESC"]] })).map((r) => r.toJSON()), financeAdmins } }),
  create: async (data) => (await Expense.create({ ...data, date: data.date || new Date().toISOString().slice(0, 10) })).toJSON(),
  update: async (id, data) => {
    const row = await Expense.findByPk(id);
    if (!row) notFound();
    await row.update(data);
    return row.toJSON();
  },
  remove: async (id) => {
    const row = await Expense.findByPk(id);
    if (!row) notFound();
    await row.destroy();
    return { deleted: true, id };
  },
};
