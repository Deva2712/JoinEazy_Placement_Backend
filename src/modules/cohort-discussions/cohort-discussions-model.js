import { DataTypes } from "sequelize";
import sequelize from "../../database/connection.js";

const CohortDiscussion = sequelize.define("CohortDiscussion", {
  id:           { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  cohort_id:    { type: DataTypes.STRING, allowNull: false },
  author_id:    { type: DataTypes.STRING, allowNull: false },
  author_name:  { type: DataTypes.STRING, allowNull: false },
  author_avatar:{ type: DataTypes.STRING, allowNull: true },
  title:        { type: DataTypes.STRING, allowNull: false },
  content:      { type: DataTypes.TEXT, allowNull: false },
  likes_count:  { type: DataTypes.INTEGER, defaultValue: 0 },
  is_archived:  { type: DataTypes.BOOLEAN, defaultValue: false },
}, { tableName: "cohort_discussions", timestamps: true, underscored: true,
     indexes: [{ fields: ["cohort_id"] }] });

const DiscussionLike = sequelize.define("DiscussionLike", {
  id:            { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  discussion_id: { type: DataTypes.UUID, allowNull: false },
  user_id:       { type: DataTypes.STRING, allowNull: false },
}, { tableName: "discussion_likes", timestamps: false, underscored: true,
     indexes: [{ unique: true, fields: ["discussion_id","user_id"] }] });

const DiscussionReply = sequelize.define("DiscussionReply", {
  id:            { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  discussion_id: { type: DataTypes.UUID, allowNull: false },
  author_id:     { type: DataTypes.STRING, allowNull: false },
  author_name:   { type: DataTypes.STRING, allowNull: false },
  author_avatar: { type: DataTypes.STRING, allowNull: true },
  content:       { type: DataTypes.TEXT, allowNull: false },
  likes_count:   { type: DataTypes.INTEGER, defaultValue: 0 },
}, { tableName: "discussion_replies", timestamps: true, underscored: true,
     indexes: [{ fields: ["discussion_id"] }] });

const ReplyLike = sequelize.define("ReplyLike", {
  id:       { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  reply_id: { type: DataTypes.UUID, allowNull: false },
  user_id:  { type: DataTypes.STRING, allowNull: false },
}, { tableName: "reply_likes", timestamps: false, underscored: true,
     indexes: [{ unique: true, fields: ["reply_id","user_id"] }] });

CohortDiscussion.hasMany(DiscussionReply, { foreignKey: "discussion_id", as: "replies", onDelete: "CASCADE" });
CohortDiscussion.hasMany(DiscussionLike,  { foreignKey: "discussion_id", as: "likes",   onDelete: "CASCADE" });
DiscussionReply.hasMany(ReplyLike,        { foreignKey: "reply_id",      as: "reply_likes", onDelete: "CASCADE" });

export { CohortDiscussion, DiscussionLike, DiscussionReply, ReplyLike };