const noteService = require('../services/customerNoteService');
const { sendSuccess, sendError } = require('../../../utils/responseHandler');

const getNotes = async (req, res, next) => {
  try {
    const notes = await noteService.getCustomerNotes(req.params.id, req.user);
    return sendSuccess(res, 200, 'Customer notes retrieved successfully', { notes });
  } catch (err) {
    if (err.message.includes('Access denied')) {
      return sendError(res, 403, err.message);
    }
    next(err);
  }
};

const addNote = async (req, res, next) => {
  try {
    const { note, visibility } = req.body;
    if (!note || !note.trim()) {
      return sendError(res, 400, 'Note content is required');
    }

    const createdNote = await noteService.addNote(
      req.params.id,
      note,
      visibility || 'internal',
      req.user
    );
    return sendSuccess(res, 201, 'Internal note added successfully', { note: createdNote });
  } catch (err) {
    return sendError(res, 400, err.message);
  }
};

const updateNote = async (req, res, next) => {
  try {
    const { note } = req.body;
    if (!note || !note.trim()) {
      return sendError(res, 400, 'Note content is required');
    }

    const updated = await noteService.updateNote(req.params.noteId, note, req.user);
    return sendSuccess(res, 200, 'Note updated successfully', { note: updated });
  } catch (err) {
    if (err.message.includes('Access denied')) {
      return sendError(res, 403, err.message);
    }
    if (err.message.includes('not found')) {
      return sendError(res, 404, err.message);
    }
    return sendError(res, 400, err.message);
  }
};

module.exports = {
  getNotes,
  addNote,
  updateNote
};
