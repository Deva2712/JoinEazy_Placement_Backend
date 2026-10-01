// src/modules/library/library-service.js
import { LibraryBook, LibraryRequest } from "./library-model.js";

// GET /library/dashboard
export const getLibraryDashboard = async (userId) => {
  const [requests, borrowed, inventory] = await Promise.all([
    LibraryRequest.findAll({ where: { user_id: userId, status: ["pending", "extension-pending"] }, order: [["created_at", "DESC"]] }),
    LibraryRequest.findAll({ where: { user_id: userId, status: "approved" }, order: [["due_date", "ASC"]] }),
    LibraryBook.findAll({ order: [["title", "ASC"]] }),
  ]);

  return {
    admins:    [],
    requests:  requests.map((r) => r.toJSON()),
    borrowed:  borrowed.map((r) => ({
      id:           r.id,
      bookTitle:    r.book_title,
      author:       r.author,
      isbn:         r.isbn,
      category:     r.category,
      borrowedDate: r.approved_date,
      dueDate:      r.due_date,
      physicalCopyPickedUp: r.physical_copy_picked_up,
    })),
    inventory: inventory.map((b) => b.toJSON()),
  };
};

// POST /library/request  body: { bookId, durationDays }
export const requestBook = async (bookId, durationDays, user) => {
  const book = await LibraryBook.findByPk(bookId);
  if (!book) { const e = new Error("Book not found"); e.statusCode = 404; throw e; }

  const dueDate = new Date();
  dueDate.setDate(dueDate.getDate() + durationDays);

  const request = await LibraryRequest.create({
    user_id:      user.id,
    user_name:    user.name,
    book_id:      bookId,
    book_title:   book.title,
    author:       book.author,
    isbn:         book.isbn,
    category:     book.category,
    duration_days: durationDays,
    request_date: new Date().toISOString().split("T")[0],
    status:       "pending",
  });
  return {
    ...request.toJSON(),
    bookTitle: request.book_title,
    requestDate: request.request_date,
    durationDays: request.duration_days,
  };
};

// DELETE /library/requests/:id
export const cancelRequest = async (requestId, userId) => {
  const request = await LibraryRequest.findOne({ where: { id: requestId, user_id: userId } });
  if (!request) { const e = new Error("Request not found"); e.statusCode = 404; throw e; }
  if (!["pending", "extension-pending"].includes(request.status)) {
    const e = new Error("Cannot cancel — already processed"); e.statusCode = 400; throw e;
  }
  await request.destroy();
  return { deleted: true };
};

// POST /library/return  body: { bookId }
export const returnBook = async (bookId, userId) => {
  const request = await LibraryRequest.findOne({ where: { book_id: bookId, user_id: userId, status: "approved" } });
  if (!request) { const e = new Error("No active borrow found"); e.statusCode = 404; throw e; }
  await request.update({ status: "returned", return_date: new Date().toISOString().split("T")[0] });
  await LibraryBook.increment("available_copies", { where: { id: bookId } });
  return request.toJSON();
};

// POST /library/extend  body: { bookId, additionalDays }
export const requestExtension = async (bookId, additionalDays, user) => {
  const borrowed = await LibraryRequest.findOne({ where: { book_id: bookId, user_id: user.id, status: "approved" } });
  if (!borrowed) { const e = new Error("No active borrow found"); e.statusCode = 404; throw e; }

  const extRequest = await LibraryRequest.create({
    user_id:      user.id,
    user_name:    user.name,
    book_id:      bookId,
    book_title:   borrowed.book_title,
    author:       borrowed.author,
    isbn:         borrowed.isbn,
    category:     borrowed.category,
    duration_days: additionalDays,
    status:       "extension-pending",
    original_borrowed_id: borrowed.id,
    additional_days: additionalDays,
    due_date:     borrowed.due_date,
    request_date: new Date().toISOString().split("T")[0],
  });

  return {
    ...extRequest.toJSON(),
    bookTitle: extRequest.book_title,
    dueDate:   extRequest.due_date,
    requestDate: extRequest.request_date,
  };
};

// POST /library/approve-extension  body: { requestId, bookId, additionalDays }
export const approveExtension = async (requestId, bookId, additionalDays) => {
  const extRequest = await LibraryRequest.findByPk(requestId);
  if (!extRequest) { const e = new Error("Extension request not found"); e.statusCode = 404; throw e; }

  const borrowed = await LibraryRequest.findOne({ where: { book_id: bookId, user_id: extRequest.user_id, status: "approved" } });
  if (!borrowed) { const e = new Error("Original borrow not found"); e.statusCode = 404; throw e; }

  const newDue = new Date(borrowed.due_date);
  newDue.setDate(newDue.getDate() + parseInt(additionalDays));
  const newDueStr = newDue.toISOString().split("T")[0];

  await borrowed.update({ due_date: newDueStr });
  await extRequest.update({ status: "approved", approved_date: new Date().toISOString().split("T")[0] });

  return { ...borrowed.toJSON(), dueDate: newDueStr };
};