import { DataTypes } from "sequelize";
import sequelize from "../../database/connection.js";

const CampusAsset = sequelize.define("CampusAsset", {
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  name: { type: DataTypes.STRING, allowNull: false },
  category: { type: DataTypes.STRING, allowNull: false },
  totalCount: { type: DataTypes.INTEGER, defaultValue: 0 },
  availableCount: { type: DataTypes.INTEGER, defaultValue: 0 },
  location: { type: DataTypes.STRING, allowNull: true },
  condition: { type: DataTypes.STRING, defaultValue: "Good" },
}, { tableName: "workspace_assets", timestamps: true, underscored: true });

const AssetRequest = sequelize.define("AssetRequest", {
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  assetId: { type: DataTypes.UUID, allowNull: true },
  assetName: { type: DataTypes.STRING, allowNull: true },
  category: { type: DataTypes.STRING, allowNull: true },
  quantity: { type: DataTypes.INTEGER, defaultValue: 1 },
  purpose: { type: DataTypes.TEXT, allowNull: false },
  fromDate: { type: DataTypes.DATEONLY, allowNull: false },
  toDate: { type: DataTypes.DATEONLY, allowNull: false },
  cohortId: { type: DataTypes.UUID, allowNull: true },
  status: { type: DataTypes.STRING, defaultValue: "Pending" },
  postedAt: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
  adminRemarks: { type: DataTypes.TEXT, allowNull: true },
}, { tableName: "workspace_asset_requests", timestamps: true, underscored: true });

CampusAsset.hasMany(AssetRequest, { foreignKey: "assetId", as: "requests" });
AssetRequest.belongsTo(CampusAsset, { foreignKey: "assetId", as: "asset" });

export { CampusAsset, AssetRequest };
