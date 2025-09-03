import express from "express";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import {
  addMembersToProject,
  createProject,
  deleteMember,
  getProjects,
  getProjectById,
  getProjectMembers,
  updateProject,
  deleteProject,
  updateMemberRole,
} from "../controllers/project.controller.js";

const router = express.Router();

// 🔐 Protect all project routes
router.use(verifyJWT);

//
// ==========================
// 📂 PROJECT CRUD
// ==========================
router.post("/", createProject);           // Create new project
router.get("/", getProjects);              // Get all projects of logged-in user
router.get("/:projectId", getProjectById); // Get single project details
router.put("/:projectId", updateProject);  // Update project
router.delete("/:projectId", deleteProject); // Delete project

//
// ==========================
// 👥 PROJECT MEMBERS
// ==========================
router.post("/:projectId/members", addMembersToProject);         // Add member
router.get("/:projectId/members", getProjectMembers);            // Get all members of a project
router.put("/:projectId/members/:userId", updateMemberRole);     // Update member role
router.delete("/:projectId/members/:userId", deleteMember);      // Remove member

export default router;
