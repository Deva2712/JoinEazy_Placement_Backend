import { CohortDiscussion, DiscussionLike, DiscussionReply, ReplyLike } from "./cohort-discussions-model.js";

const fmt = (d, userId) => {
  const j = d.toJSON ? d.toJSON() : d;
  const likes = j.likes || [];
  const replies = j.replies || [];
  const twoDaysAgo = new Date(Date.now() - 2 * 24 * 60 * 60 * 1000);
  return {
    ...j,
    is_archived: j.is_archived || new Date(j.created_at) < twoDaysAgo,
    likes_count: likes.length,
    liked_by_user_ids: likes.map(l => l.user_id),
    liked_by_current_user: userId ? likes.some(l => l.user_id === String(userId)) : false,
    replies: replies.map(r => {
      const rl = r.reply_likes || [];
      return { ...r, likes_count: rl.length, liked_by_user_ids: rl.map(l => l.user_id), liked_by_current_user: userId ? rl.some(l => l.user_id === String(userId)) : false };
    }),
  };
};

const include = [
  { model: DiscussionLike,  as: "likes",   attributes: ["user_id"] },
  { model: DiscussionReply, as: "replies",
    include: [{ model: ReplyLike, as: "reply_likes", attributes: ["user_id"] }] },
];

export const getDiscussions   = async (cohortId, userId) => (await CohortDiscussion.findAll({ where: { cohort_id: cohortId }, include, order: [["created_at","DESC"]] })).map(d => fmt(d, userId));
export const createDiscussion = async (cohortId, data, author) => { const d = await CohortDiscussion.create({ cohort_id: cohortId, author_id: String(author.id), author_name: author.name, author_avatar: author.avatar || null, title: data.title, content: data.content }); return fmt({ ...d.toJSON(), likes: [], replies: [] }, author.id); };
export const editDiscussion   = async (cohortId, id, data, userId) => { const d = await CohortDiscussion.findOne({ where: { id, cohort_id: cohortId } }); if (!d) { const e = new Error("Not found"); e.statusCode = 404; throw e; } if (d.author_id !== String(userId)) { const e = new Error("Not authorized"); e.statusCode = 403; throw e; } await d.update({ title: data.title ?? d.title, content: data.content ?? d.content }); return fmt({ ...d.toJSON(), likes: [], replies: [] }, userId); };
export const deleteDiscussion = async (cohortId, id, userId, role) => { const d = await CohortDiscussion.findOne({ where: { id, cohort_id: cohortId } }); if (!d) { const e = new Error("Not found"); e.statusCode = 404; throw e; } if (d.author_id !== String(userId) && role !== "admin") { const e = new Error("Not authorized"); e.statusCode = 403; throw e; } await d.destroy(); return { deleted: true }; };

export const likeDiscussion = async (cohortId, id, userId) => {
  const d = await CohortDiscussion.findOne({ where: { id, cohort_id: cohortId } });
  if (!d) { const e = new Error("Not found"); e.statusCode = 404; throw e; }
  const uid = String(userId);
  const ex = await DiscussionLike.findOne({ where: { discussion_id: id, user_id: uid } });
  if (ex) { await ex.destroy(); await d.update({ likes_count: Math.max(0, d.likes_count - 1) }); }
  else     { await DiscussionLike.create({ discussion_id: id, user_id: uid }); await d.update({ likes_count: d.likes_count + 1 }); }
  const updated = await CohortDiscussion.findOne({ where: { id }, include });
  return fmt(updated, userId);
};

export const addReply    = async (cohortId, id, data, author) => { const d = await CohortDiscussion.findOne({ where: { id, cohort_id: cohortId } }); if (!d) { const e = new Error("Not found"); e.statusCode = 404; throw e; } const r = await DiscussionReply.create({ discussion_id: id, author_id: String(author.id), author_name: author.name, author_avatar: author.avatar || null, content: data.content }); return { ...r.toJSON(), likes_count: 0, liked_by_user_ids: [], liked_by_current_user: false }; };
export const editReply   = async (cohortId, id, replyId, data, userId) => { const r = await DiscussionReply.findOne({ where: { id: replyId, discussion_id: id } }); if (!r) { const e = new Error("Not found"); e.statusCode = 404; throw e; } if (r.author_id !== String(userId)) { const e = new Error("Not authorized"); e.statusCode = 403; throw e; } await r.update({ content: data.content ?? r.content }); return r.toJSON(); };
export const deleteReply = async (cohortId, id, replyId, userId, role) => { const r = await DiscussionReply.findOne({ where: { id: replyId, discussion_id: id } }); if (!r) { const e = new Error("Not found"); e.statusCode = 404; throw e; } if (r.author_id !== String(userId) && role !== "admin") { const e = new Error("Not authorized"); e.statusCode = 403; throw e; } await r.destroy(); return { deleted: true }; };

export const likeReply = async (cohortId, id, replyId, userId) => {
  const r = await DiscussionReply.findOne({ where: { id: replyId, discussion_id: id } });
  if (!r) { const e = new Error("Not found"); e.statusCode = 404; throw e; }
  const uid = String(userId);
  const ex = await ReplyLike.findOne({ where: { reply_id: replyId, user_id: uid } });
  if (ex) { await ex.destroy(); await r.update({ likes_count: Math.max(0, r.likes_count - 1) }); }
  else     { await ReplyLike.create({ reply_id: replyId, user_id: uid }); await r.update({ likes_count: r.likes_count + 1 }); }
  const updated = await DiscussionReply.findOne({ where: { id: replyId }, include: [{ model: ReplyLike, as: "reply_likes" }] });
  const rl = updated.reply_likes || [];
  return { ...updated.toJSON(), liked_by_user_ids: rl.map(l => l.user_id), liked_by_current_user: rl.some(l => l.user_id === uid), likes_count: rl.length };
};