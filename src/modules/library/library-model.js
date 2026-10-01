// src/modules/library/library-model.js
import { DataTypes } from "sequelize";
import sequelize from "../../database/connection.js";

// Books inventory
const LibraryBook = sequelize.define("LibraryBook", {
  id:            { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  title:         { type: DataTypes.STRING, allowNull: false },
  author:        { type: DataTypes.STRING, allowNull: false },
  isbn:          { type: DataTypes.STRING, allowNull: true },
  category:      { type: DataTypes.STRING, allowNull: true },
  total_copies:  { type: DataTypes.INTEGER, defaultValue: 1 },
  available_copies: { type: DataTypes.INTEGER, defaultValue: 1 },
  cover_url:     { type: DataTypes.STRING, allowNull: true },
}, {
  tableName: "library_books",
  timestamps: true,
  underscored: true,
});

// Borrow/request records
const LibraryRequest = sequelize.define("LibraryRequest", {
  id:              { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  user_id:         { type: DataTypes.STRING, allowNull: false },
  user_name:       { type: DataTypes.STRING, allowNull: false },
  book_id:         { type: DataTypes.UUID, allowNull: false },
  book_title:      { type: DataTypes.STRING, allowNull: false },
  author:          { type: DataTypes.STRING, allowNull: true },
  isbn:            { type: DataTypes.STRING, allowNull: true },
  category:        { type: DataTypes.STRING, allowNull: true },
  duration_days:   { type: DataTypes.INTEGER, defaultValue: 14 },
  status:          { type: DataTypes.ENUM("pending", "approved", "returned", "rejected", "extension-pending"), defaultValue: "pending" },
  request_date:    { type: DataTypes.DATEONLY, defaultValue: DataTypes.NOW },
  approved_date:   { type: DataTypes.DATEONLY, allowNull: true },
  due_date:        { type: DataTypes.DATEONLY, allowNull: true },
  return_date:     { type: DataTypes.DATEONLY, allowNull: true },
  physical_copy_picked_up: { type: DataTypes.BOOLEAN, defaultValue: false },
  additional_days: { type: DataTypes.INTEGER, allowNull: true },
  original_borrowed_id: { type: DataTypes.UUID, allowNull: true },
}, {
  tableName: "library_requests",
  timestamps: true,
  underscored: true,
  indexes: [{ fields: ["user_id"] }, { fields: ["status"] }],
});

LibraryBook.hasMany(LibraryRequest, { foreignKey: "book_id", as: "requests" });
LibraryRequest.belongsTo(LibraryBook, { foreignKey: "book_id" });

export { LibraryBook, LibraryRequest };