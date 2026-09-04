// src/utils/crud.js
//
// Generic CRUD used by the skeleton modules. Each module still owns its own
// routes/controller/service files (the convention the rest of the ERP follows),
// but the plain list/get/create/update/remove bodies come from here rather than
// being copy-pasted eleven times. A module overrides any of them the moment it
// needs real logic.

const notFound = (msg = "Not found") => { const e = new Error(msg); e.statusCode = 404; throw e; };

/**
 * @param Model     Sequelize model
 * @param options   { include, order, searchable: [columns], scope: (query) => where }
 */
export const crudService = (Model, options = {}) => {
  const { include = [], order = [["created_at", "DESC"]], scope } = options;

  return {
    list: async (query = {}) => {
      const where = scope ? scope(query) : {};
      // Straight equality filters for any column the caller names.
      for (const [k, v] of Object.entries(query)) {
        if (["limit", "offset", "q", "sort"].includes(k)) continue;
        if (Model.rawAttributes[k] !== undefined) where[k] = v;
      }
      const rows = await Model.findAll({
        where,
        include,
        order,
        limit: Math.min(Number(query.limit) || 200, 500),
        offset: Number(query.offset) || 0,
      });
      return rows.map((r) => r.toJSON());
    },

    get: async (id) => {
      const row = await Model.findByPk(id, { include });
      if (!row) notFound(`${Model.name} not found`);
      return row.toJSON();
    },

    create: async (data) => {
      const row = await Model.create(data);
      return row.toJSON();
    },

    update: async (id, data) => {
      const row = await Model.findByPk(id);
      if (!row) notFound(`${Model.name} not found`);
      await row.update(data);
      return row.toJSON();
    },

    remove: async (id) => {
      const row = await Model.findByPk(id);
      if (!row) notFound(`${Model.name} not found`);
      await row.destroy();
      return { deleted: true, id };
    },
  };
};

/**
 * A list controller that narrows the result to the caller when the caller is a
 * student, and returns everything when they are staff.
 *
 * Needed because the frontend reads the SAME path with two meanings: a student
 * GETs /placement/offers to see their own offers, while the coordinator GETs
 * /placement/coord/offers (the same router) to see all of them. Without this a
 * student listing offers or interviews reads the whole cohort's — every other
 * student's employer and CTC.
 *
 * @param column  the model's owning-student column (student_id everywhere so far)
 */
export const ownerScopedList = (service, column = "student_id") => async (req, res) => {
  const query = { ...req.query };
  if (req.user?.role === "student") query[column] = req.user.id;
  res.json({ success: true, data: await service.list(query) });
};

/** Controller wrappers over a crudService — keeps controllers logic-free. */
export const crudController = (service) => ({
  list:   async (req, res) => res.json({ success: true, data: await service.list(req.query) }),
  get:    async (req, res) => res.json({ success: true, data: await service.get(req.params.id) }),
  create: async (req, res) => res.status(201).json({ success: true, data: await service.create(req.body) }),
  update: async (req, res) => res.json({ success: true, data: await service.update(req.params.id, req.body) }),
  remove: async (req, res) => res.json({ success: true, data: await service.remove(req.params.id) }),
});
