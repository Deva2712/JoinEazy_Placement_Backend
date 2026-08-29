// src/modules/auth/auth-model.js
//
// This service's own login — separate from PlacementStudent (which is a
// roster row, not an account). Only placement_coordinator accounts are issued
// here; every other role's login lives in its own service (Dean, HOD, etc.)
// and all share JWT_SECRET so one token verifies everywhere.
import { DataTypes } from "sequelize";
import bcrypt from "bcryptjs";
import sequelize from "../../database/connection.js";

const User = sequelize.define("User", {
  id:         { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  email:      { type: DataTypes.STRING, allowNull: false, unique: true, validate: { isEmail: true } },
  password:   { type: DataTypes.STRING, allowNull: false },
  role:       { type: DataTypes.ENUM("placement_coordinator"), allowNull: false, defaultValue: "placement_coordinator" },
  first_name: { type: DataTypes.STRING, allowNull: true },
  last_name:  { type: DataTypes.STRING, allowNull: true },
}, {
  tableName: "placement_users",
  timestamps: true,
  underscored: true,
  hooks: {
    beforeCreate: async (user) => {
      if (user.password) user.password = await bcrypt.hash(user.password, 10);
    },
    beforeUpdate: async (user) => {
      if (user.changed("password")) user.password = await bcrypt.hash(user.password, 10);
    },
  },
});

User.prototype.comparePassword = function (candidate) {
  return bcrypt.compare(candidate, this.password);
};

export { User };
