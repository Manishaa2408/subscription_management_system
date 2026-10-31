const CustomerNote = require('../models/CustomerNote');
const { logActivity } = require('./customerActivityService');

const addNote = async (customerId, noteText, visibility = 'internal', currentUser) => {
  if (!noteText || !noteText.trim()) {
    throw new Error('Note text is required');
  }

  const note = await CustomerNote.create({
    customerId,
    note: noteText.trim(),
    visibility,
    createdBy: currentUser.id,
    authorName: currentUser.fullName || 'Staff Member',
    updatedBy: currentUser.id
  });

  // Record activity
  await logActivity({
    customerId,
    action: 'NOTE_ADDED',
    description: `Internal note added by ${currentUser.fullName || 'Staff'}`,
    performedBy: currentUser
  });

  return note;
};

const getCustomerNotes = async (customerId, currentUser) => {
  // Security guard: Customers must never access internal notes
  if (currentUser && currentUser.role === 'customer') {
    throw new Error('Access denied: Customers are not permitted to view internal notes');
  }

  return await CustomerNote.find({ customerId })
    .sort({ createdAt: -1 });
};

const updateNote = async (noteId, noteText, currentUser) => {
  const note = await CustomerNote.findById(noteId);
  if (!note) {
    throw new Error('Customer note not found');
  }

  // Only the creator or an Admin can edit the note
  if (currentUser.role !== 'admin' && String(note.createdBy) !== String(currentUser.id)) {
    throw new Error('Access denied: You can only edit your own notes');
  }

  note.note = noteText.trim();
  note.updatedBy = currentUser.id;
  await note.save();

  return note;
};

module.exports = {
  addNote,
  getCustomerNotes,
  updateNote
};
