import { Project } from "../models/project.model.js";
import { ProjectNote } from "../models/note.model.js";
import ApiResponse from "../utils/apiResponse.js";
import  ApiError  from "../utils/apiError.js";
import  asyncHandler  from "../utils/asyncHandler.js";
import mongoose from "mongoose";

// 📌 Get all notes for a project
const getProjectNotes = asyncHandler(async (req, res) => {
  const { projectId } = req.params;

  const project = await Project.findById(projectId);
  if (!project) throw new ApiError(404, "Project not found");

  const notes = await ProjectNote.find({ project: projectId })
    .populate("createdBy", "username fullName avatar")
    .sort({ isPinned: -1, createdAt: -1 }); // pinned first, then recent

  return res
    .status(200)
    .json(new ApiResponse(200, notes, "Project notes fetched successfully"));
});

// 📌 Create a note
const createProjectNote = asyncHandler(async (req, res) => {
  const { projectId } = req.params;
  const { content } = req.body;

  const project = await Project.findById(projectId);
  if (!project) throw new ApiError(404, "Project not found");

  const files = req.files || [];
  const attachments = files.map((file) => ({
    url: `${process.env.SERVER_URL}/uploads/${file.originalname}`,
    mimetype: file.mimetype,
    size: file.size,
  }));

  const note = await ProjectNote.create({
    project: projectId,
    createdBy: req.user._id,
    content,
    attachments,
  });

  return res
    .status(201)
    .json(new ApiResponse(201, note, "Project note created successfully"));
});

// 📌 Update a note
const updateProjectNote = asyncHandler(async (req, res) => {
  const { noteId } = req.params;
  const { content, isPinned } = req.body;

  const note = await ProjectNote.findByIdAndUpdate(
    noteId,
    { content, isPinned },
    { new: true }
  );

  if (!note) throw new ApiError(404, "Note not found");

  return res
    .status(200)
    .json(new ApiResponse(200, note, "Project note updated successfully"));
});

// 📌 Delete a note
const deleteProjectNote = asyncHandler(async (req, res) => {
  const { noteId } = req.params;

  const note = await ProjectNote.findByIdAndDelete(noteId);
  if (!note) throw new ApiError(404, "Note not found");

  return res
    .status(200)
    .json(new ApiResponse(200, {}, "Project note deleted successfully"));
});

// 📌 Pin / Unpin a note
const togglePinNote = asyncHandler(async (req, res) => {
  const { noteId } = req.params;

  const note = await ProjectNote.findById(noteId);
  if (!note) throw new ApiError(404, "Note not found");

  note.isPinned = !note.isPinned;
  await note.save();

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        note,
        note.isPinned
          ? "Note pinned successfully"
          : "Note unpinned successfully"
      )
    );
});

export {
  getProjectNotes,
  createProjectNote,
  updateProjectNote,
  deleteProjectNote,
  togglePinNote,
};