import { AssetRequest, CampusAsset } from "./assets-model.js";

const admins = [
  { name: "Ravi Menon", email: "admin.assets@mahindrauniversity.edu.in", phone: "+91 98765 42001", designation: "Asset Manager" },
  { name: "Nisha Rao", email: "facilities@mahindrauniversity.edu.in", phone: "+91 98765 42002", designation: "Facilities Admin" },
];

const notFound = () => {
  const err = new Error("Asset request not found");
  err.statusCode = 404;
  throw err;
};

const enrich = async (data) => {
  const asset = data.assetId ? await CampusAsset.findByPk(data.assetId) : null;
  return {
    ...data,
    assetName: data.assetName || asset?.name || null,
    category: data.category || asset?.category || null,
  };
};

export const service = {
  listAssets: async () => (await CampusAsset.findAll({ order: [["name", "ASC"]] })).map((r) => r.toJSON()),
  requests: async () => ({
    requests: (await AssetRequest.findAll({ order: [["postedAt", "DESC"]] })).map((r) => r.toJSON()),
    admins,
  }),
  createRequest: async (data) => (await AssetRequest.create(await enrich(data))).toJSON(),
  updateRequest: async (id, data) => {
    const row = await AssetRequest.findByPk(id);
    if (!row) notFound();
    await row.update(await enrich(data));
    return row.toJSON();
  },
};
