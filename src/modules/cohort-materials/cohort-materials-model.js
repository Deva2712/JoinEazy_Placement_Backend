import { DataTypes } from "sequelize";
import sequelize from "../../database/connection.js";

const CohortMaterial = sequelize.define("CohortMaterial", {
  id:          { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  cohort_id:   { type: DataTypes.STRING, allowNull: false },
  created_by:  { type: DataTypes.STRING, allowNull: false },
  title:       { type: DataTypes.STRING, allowNull: false },
  description: { type: DataTypes.TEXT, allowNull: true },
  type:        { type: DataTypes.STRING, defaultValue: "document" },
  url:         { type: DataTypes.STRING, allowNull: true },
  file_name:   { type: DataTypes.STRING, allowNull: true },
  file_size:   { type: DataTypes.STRING, allowNull: true },
  order:       { type: DataTypes.INTEGER, defaultValue: 0 },
}, { tableName: "cohort_materials", timestamps: true, underscored: true,
     indexes: [{ fields: ["cohort_id"] }] });

export default CohortMaterial;