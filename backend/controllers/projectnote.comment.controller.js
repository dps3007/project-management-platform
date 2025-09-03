import { ProjectNote } from "../models/projectnote.models.js";
import { ProjectNoteComment } from "../models/projectnotecomment.models.js";
import { ApiResponse } from "../utils/api-response.js";
import { ApiError } from "../utils/api-error.js";
import { asyncHandler } from "../utils/async-handler.js";
import mongoose from "mongoose";

// 📌 Get comments for a note
const getNoteComments = asyncHandler(async (req, res) => {
  const { noteId } = req.params;

  const note = await ProjectNote.findById(noteId);
  if (!note) throw new ApiError(404, "Note not found");

  const comments = await ProjectNoteComment.find({ note: noteId })
    .populate("createdBy", "username fullName avatar")
    .populate("parentComment", "content createdBy")
    .sort({ createdAt: 1 });

  return res
    .status(200)
    .json(new ApiResponse(200, comments, "Comments fetched successfully"));
});

// 📌 Add a new comment
const createNoteComment = asyncHandler(async (req, res) => {
  const { noteId } = req.params;
  const { content, parentComment } = req.body;

  const note = await ProjectNote.findById(noteId);
  if (!note) throw new ApiError(404, "Note not found");

  const comment = await ProjectNoteComment.create({
    note: noteId,
    content,
    createdBy: req.user._id,
    parentComment: parentComment || null,
  });

  return res
    .status(201)
    .json(new ApiResponse(201, comment, "Comment added successfully"));
});

// 📌 Update comment
const updateNoteComment = asyncHandler(async (req, res) => {
  const { commentId } = req.params;
  const { content } = req.body;

  const comment = await ProjectNoteComment.findById(commentId);
  if (!comment) throw new ApiError(404, "Comment not found");

  if (!comment.createdBy.equals(req.user._id)) {
    throw new ApiError(403, "You can only edit your own comments");
  }

  comment.content = content;
  await comment.save();

  return res
    .status(200)
    .json(new ApiResponse(200, comment, "Comment updated successfully"));
});

// 📌 Delete comment
const deleteNoteComment = asyncHandler(async (req, res) => {
  const { commentId } = req.params;

  const comment = await ProjectNoteComment.findById(commentId);
  if (!comment) throw new ApiError(404, "Comment not found");

  if (!comment.createdBy.equals(req.user._id)) {
    throw new ApiError(403, "You can only delete your own comments");
  }

  await ProjectNoteComment.deleteOne({ _id: commentId });

  return res
    .status(200)
    .json(new ApiResponse(200, {}, "Comment deleted successfully"));
});

export {
  getNoteComments,
  createNoteComment,
  updateNoteComment,
  deleteNoteComment,
};
