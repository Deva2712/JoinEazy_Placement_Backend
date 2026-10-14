// src/modules/auth/auth-model.js
//
// This service's own login — separate from PlacementStudent (which is a
// roster row, not an account). Only placement_coordinator accounts are issued
// here; every other role's login lives in its own service (Dean, HOD, etc.)
// and all share JWT_SECRET so one token verifies everywhere.
import { DataTypes } from "sequelize";
import bcrypt from "bcryptjs";
import sequelize from "../../database/connection.js";

const ROLES = [
  "admin", "professor", "student", "staff", "hod", "hr", "dean",
  "academic_admin", "employee", "placement_coordinator",
];

const isBcryptHash = (value) => typeof value === "string" && value.startsWith("$2");

const User = sequelize.define("User", {
  id:         { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  name:       { type: DataTypes.STRING, allowNull: false },
  email:      { type: DataTypes.STRING, allowNull: false, unique: true, validate: { isEmail: true } },
  password:   { type: DataTypes.STRING, allowNull: false },
  role:       { type: DataTypes.ENUM(...ROLES), defaultValue: "student" },
  isActive:   { type: DataTypes.BOOLEAN, defaultValue: true },
  batch:      { type: DataTypes.STRING, allowNull: true },
  year:       { type: DataTypes.INTEGER, allowNull: true },
  dateOfBirth:      { type: DataTypes.DATEONLY, allowNull: true },
  gender:           { type: DataTypes.STRING, allowNull: true },
  employeeId:       { type: DataTypes.STRING, allowNull: true },
  department:       { type: DataTypes.STRING, allowNull: true },
  designation:      { type: DataTypes.STRING, allowNull: true },
  officeLocation:   { type: DataTypes.STRING, allowNull: true },
  city:             { type: DataTypes.STRING, allowNull: true },
  state:            { type: DataTypes.STRING, allowNull: true },
  pinCode:          { type: DataTypes.STRING, allowNull: true },
  country:          { type: DataTypes.STRING, allowNull: true },
  mobileNumber:     { type: DataTypes.STRING, allowNull: true },
  alternateNumber:  { type: DataTypes.STRING, allowNull: true },
  personalEmail:    { type: DataTypes.STRING, allowNull: true },
  linkedinProfile:  { type: DataTypes.STRING, allowNull: true },
  panNumber:        { type: DataTypes.STRING, allowNull: true },
  aadhaarNumber:    { type: DataTypes.STRING, allowNull: true },
  permanentAddress: { type: DataTypes.TEXT, allowNull: true },
  currentAddress:   { type: DataTypes.TEXT, allowNull: true },
  profile_pic:      { type: DataTypes.TEXT, allowNull: true },
}, {
  tableName: "users",
  timestamps: true,
  hooks: {
    beforeCreate: async (user) => {
      if (user.password && !isBcryptHash(user.password)) {
        user.password = await bcrypt.hash(user.password, 10);
      }
    },
    beforeUpdate: async (user) => {
      if (user.changed("password") && !isBcryptHash(user.password)) {
        user.password = await bcrypt.hash(user.password, 10);
      }
    },
  },
});

User.prototype.comparePassword = function (candidate) {
  return bcrypt.compare(candidate, this.password);
};

User.beforeValidate((user) => {
  if (user.email) user.email = String(user.email).toLowerCase();
});

export { User, ROLES };
