import { User } from "../models/user.model.js";
import { Project } from "../models/project.model.js";
import { ProjectMember } from "../models/projectmember.model.js";

import  ApiResponse  from "../utils/apiResponse.js";
import ApiError from "../utils/apiError.js";
import asyncHandler from "../utils/asyncHandler.js";
import mongoose from "mongoose";
import { AvailableRolesEnum, UserRolesEnum } from "../utils/constants.js";


const getProjects = asyncHandler(async (req, res) => {
  const projects = await ProjectMember.aggregate([
    {
      $match: { user: new mongoose.Types.ObjectId(req.user._id) },
    },
    {
      $lookup: {
        from: "projects",
        localField: "project",
        foreignField: "_id",
        as: "project",
        pipeline: [
          {
            $lookup: {
              from: "projectmembers",
              localField: "_id",
              foreignField: "project",
              as: "projectmembers",
            },
          },
          {
            $addFields: { members: { $size: "$projectmembers" } },
          },
        ],
      },
    },
    { $unwind: "$project" },
    {
      $project: {
        "project._id": 1,
        "project.name": 1,
        "project.description": 1,
        "project.members": 1,
        "project.createdAt": 1,
        "project.createdBy": 1,
        role: 1,
        _id: 0,
      },
    },
  ]);

  return res
    .status(200)
    .json(new ApiResponse(200, projects, "Projects fetched successfully"));
});

const getProjectById = asyncHandler(async (req, res) => {
  const { projectId } = req.params;
  const project = await Project.findById(projectId);

  if (!project) throw new ApiError(404, "Project not found");

  return res
    .status(200)
    .json(new ApiResponse(200, project, "Project fetched successfully"));
});

const createProject = asyncHandler(async (req, res) => {
  const { name, description } = req.body;

  const project = await Project.create({
    name,
    description,
    createdBy: req.user._id,
  });

  await ProjectMember.create({
    user: req.user._id,
    project: project._id,
    role: UserRolesEnum.ADMIN,
  });

  return res
    .status(201)
    .json(new ApiResponse(201, project, "Project created successfully"));
});

const updateProject = asyncHandler(async (req, res) => {
  const { name, description } = req.body;
  const { projectId } = req.params;

  const project = await Project.findByIdAndUpdate(
    projectId,
    { name, description },
    { new: true }
  );

  if (!project) throw new ApiError(404, "Project not found");

  return res
    .status(200)
    .json(new ApiResponse(200, project, "Project updated successfully"));
});


const deleteProject = asyncHandler(async (req, res) => {
  const { projectId } = req.params;

  const project = await Project.findByIdAndDelete(projectId);
  if (!project) throw new ApiError(404, "Project not found");

  // also delete members
  await ProjectMember.deleteMany({ project: projectId });

  return res
    .status(200)
    .json(new ApiResponse(200, project, "Project deleted successfully"));
});


const addMembersToProject = asyncHandler(async (req, res) => {
  const { email, role } = req.body;
  const { projectId } = req.params;

  const user = await User.findOne({ email });
  if (!user) throw new ApiError(404, "User not found");

  const member = await ProjectMember.findOneAndUpdate(
    { user: user._id, project: projectId },
    { user: user._id, project: projectId, role },
    { new: true, upsert: true }
  );

  return res
    .status(201)
    .json(new ApiResponse(201, member, "Project member added successfully"));
});


const getProjectMembers = asyncHandler(async (req, res) => {
  const { projectId } = req.params;
  const project = await Project.findById(projectId);

  if (!project) throw new ApiError(404, "Project not found");

  const projectMembers = await ProjectMember.aggregate([
    { $match: { project: new mongoose.Types.ObjectId(projectId) } },
    {
      $lookup: {
        from: "users",
        localField: "user",
        foreignField: "_id",
        as: "user",
        pipeline: [
          { $project: { _id: 1, username: 1, fullName: 1, avatar: 1 } },
        ],
      },
    },
    { $addFields: { user: { $arrayElemAt: ["$user", 0] } } },
    {
      $project: {
        project: 1,
        user: 1,
        role: 1,
        createdAt: 1,
        updatedAt: 1,
        _id: 0,
      },
    },
  ]);

  return res
    .status(200)
    .json(new ApiResponse(200, projectMembers, "Project members fetched"));
});


const updateMemberRole = asyncHandler(async (req, res) => {
  const { projectId, userId } = req.params;
  const { newRole } = req.body;

  if (!AvailableRolesEnum.includes(newRole)) {
    throw new ApiError(400, "Invalid role");
  }

  const projectMember = await ProjectMember.findOneAndUpdate(
    { project: projectId, user: userId },
    { role: newRole },
    { new: true }
  );

  if (!projectMember) throw new ApiError(404, "Project member not found");

  return res
    .status(200)
    .json(new ApiResponse(200, projectMember, "Member role updated successfully"));
});


const deleteMember = asyncHandler(async (req, res) => {
  const { projectId, userId } = req.params;

  const projectMember = await ProjectMember.findOneAndDelete({
    project: projectId,
    user: userId,
  });

  if (!projectMember) throw new ApiError(404, "Project member not found");

  return res
    .status(200)
    .json(new ApiResponse(200, projectMember, "Member removed successfully"));
});

export {
  addMembersToProject,
  createProject,
  deleteMember,
  getProjects,
  getProjectById,
  getProjectMembers,
  updateProject,
  deleteProject,
  updateMemberRole,
};
