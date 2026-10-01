import CohortMaterial from "./cohort-materials-model.js";

export const getMaterials = async (cohortId) => {
  const materials = await CohortMaterial.findAll({ where: { cohort_id: cohortId }, order: [["order","ASC"],["created_at","DESC"]] });
  return materials.map(m => m.toJSON());
};

export const createMaterial = async (cohortId, data, userId) => {
  const count = await CohortMaterial.count({ where: { cohort_id: cohortId } });
  const m = await CohortMaterial.create({ cohort_id: cohortId, created_by: String(userId), title: data.title, description: data.description || null, type: data.type || "document", url: data.url || null, file_name: data.fileName || null, file_size: data.fileSize || null, order: data.order ?? count });
  return m.toJSON();
};

export const updateMaterial = async (cohortId, materialId, data, userId) => {
  const m = await CohortMaterial.findOne({ where: { id: materialId, cohort_id: cohortId } });
  if (!m) { const e = new Error("Not found"); e.statusCode = 404; throw e; }
  if (m.created_by !== String(userId)) { const e = new Error("Not authorized"); e.statusCode = 403; throw e; }
  await m.update({ title: data.title ?? m.title, description: data.description ?? m.description, type: data.type ?? m.type, url: data.url ?? m.url });
  return m.toJSON();
};

export const deleteMaterial = async (cohortId, materialId, userId) => {
  const m = await CohortMaterial.findOne({ where: { id: materialId, cohort_id: cohortId } });
  if (!m) { const e = new Error("Not found"); e.statusCode = 404; throw e; }
  if (m.created_by !== String(userId)) { const e = new Error("Not authorized"); e.statusCode = 403; throw e; }
  await m.destroy();
  return { deleted: true };
};