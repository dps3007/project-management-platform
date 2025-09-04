import {User}  from "../models/user.model.js";
import { Project } from "../models/project.model.js";
import { Task } from "../models/task.model.js";
import { Subtask } from "../models/subtask.model.js";
import  ApiResponse  from "../utils/apiResponse.js";
import  ApiError  from "../utils/apiError.js";
import  asyncHandler  from "../utils/asyncHandler.js";
import mongoose from "mongoose";

// 📌 Get all tasks of a project
const getTasks = asyncHandler(async (req, res) => {
  const { projectId } = req.params;

  const project = await Project.findById(projectId);
  if (!project) throw new ApiError(404, "Project not found");

  const tasks = await Task.find({ project: projectId })
    .populate("assignedTo", "avatar username fullName")
    .populate("assignedBy", "avatar username fullName");

  return res
    .status(200)
    .json(new ApiResponse(200, tasks, "Tasks fetched successfully"));
});

// 📌 Create a new task
const createTask = asyncHandler(async (req, res) => {
  const { title, description, assignedTo, status } = req.body;
  const { projectId } = req.params;

  const project = await Project.findById(projectId);
  if (!project) throw new ApiError(404, "Project not found");

  const files = req.files || [];
  const attachments = files.map((file) => ({
    url: `${process.env.SERVER_URL}/images/${file.originalname}`,
    mimetype: file.mimetype,
    size: file.size,
  }));

  const task = await Task.create({
    title,
    description,
    project: projectId,
    assignedTo: assignedTo ? new mongoose.Types.ObjectId(assignedTo) : null,
    assignedBy: req.user._id,
    status,
    attachments,
  });

  return res
    .status(201)
    .json(new ApiResponse(201, task, "Task created successfully"));
});

// 📌 Get task by ID (with subtasks + user details)
const getTaskById = asyncHandler(async (req, res) => {
  const { taskId } = req.params;

  const task = await Task.aggregate([
    { $match: { _id: new mongoose.Types.ObjectId(taskId) } },

    {
      $lookup: {
        from: "users",
        localField: "assignedTo",
        foreignField: "_id",
        as: "assignedTo",
        pipeline: [
          {
            $project: { _id: 1, username: 1, fullName: 1, avatar: 1 },
          },
        ],
      },
    },
    {
      $lookup: {
        from: "subtasks",
        localField: "_id",
        foreignField: "task",
        as: "subtasks",
        pipeline: [
          {
            $lookup: {
              from: "users",
              localField: "createdBy",
              foreignField: "_id",
              as: "createdBy",
              pipeline: [
                {
                  $project: {
                    _id: 1,
                    username: 1,
                    fullName: 1,
                    avatar: 1,
                  },
                },
              ],
            },
          },
          {
            $addFields: {
              createdBy: { $arrayElemAt: ["$createdBy", 0] },
            },
          },
        ],
      },
    },
    {
      $addFields: {
        assignedTo: { $arrayElemAt: ["$assignedTo", 0] },
      },
    },
  ]);

  if (!task.length) throw new ApiError(404, "Task not found");

  return res
    .status(200)
    .json(new ApiResponse(200, task[0], "Task fetched successfully"));
});

// 📌 Update task
const updateTask = asyncHandler(async (req, res) => {
  const { taskId } = req.params;
  const { title, description, assignedTo, status } = req.body;

  const task = await Task.findByIdAndUpdate(
    taskId,
    {
      title,
      description,
      assignedTo,
      status,
    },
    { new: true }
  );

  if (!task) throw new ApiError(404, "Task not found");

  return res
    .status(200)
    .json(new ApiResponse(200, task, "Task updated successfully"));
});

// 📌 Delete task
const deleteTask = asyncHandler(async (req, res) => {
  const { taskId } = req.params;

  const task = await Task.findByIdAndDelete(taskId);
  if (!task) throw new ApiError(404, "Task not found");

  // delete related subtasks too
  await Subtask.deleteMany({ task: taskId });

  return res
    .status(200)
    .json(new ApiResponse(200, {}, "Task deleted successfully"));
});

// 📌 Create subtask
const createSubTask = asyncHandler(async (req, res) => {
  const { title } = req.body;
  const { taskId } = req.params;

  const task = await Task.findById(taskId);
  if (!task) throw new ApiError(404, "Task not found");

  const subtask = await Subtask.create({
    title,
    task: taskId,
    createdBy: req.user._id,
  });

  return res
    .status(201)
    .json(new ApiResponse(201, subtask, "Subtask created successfully"));
});

// 📌 Update subtask
const updateSubTask = asyncHandler(async (req, res) => {
  const { subtaskId } = req.params;
  const { title, status } = req.body;

  const subtask = await Subtask.findByIdAndUpdate(
    subtaskId,
    { title, status },
    { new: true }
  );

  if (!subtask) throw new ApiError(404, "Subtask not found");

  return res
    .status(200)
    .json(new ApiResponse(200, subtask, "Subtask updated successfully"));
});

// 📌 Delete subtask
const deleteSubTask = asyncHandler(async (req, res) => {
  const { subtaskId } = req.params;

  const subtask = await Subtask.findByIdAndDelete(subtaskId);
  if (!subtask) throw new ApiError(404, "Subtask not found");

  return res
    .status(200)
    .json(new ApiResponse(200, {}, "Subtask deleted successfully"));
});

export {
  getTasks,
  createTask,
  getTaskById,
  updateTask,
  deleteTask,
  createSubTask,
  updateSubTask,
  deleteSubTask,
};
