import { Bulletin } from "./bulletins-model.js";

const notFound = () => {
  const err = new Error("Bulletin not found");
  err.statusCode = 404;
  throw err;
};

export const service = {
  list: async (query = {}) => {
    const where = {};
    if (query.level) where.level = query.level;
    if (query.priority) where.priority = query.priority;
    return (await Bulletin.findAll({ where, order: [["is_pinned", "DESC"], ["created_at", "DESC"]] })).map((r) => r.toJSON());
  },
  create: async (data, user) => (await Bulletin.create({ ...data, author: data.author || user?.name || "Placement Cell" })).toJSON(),
  remove: async (id) => {
    const row = await Bulletin.findByPk(id);
    if (!row) notFound();
    await row.destroy();
    return { deleted: true, id };
  },
};
