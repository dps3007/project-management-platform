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
import { authorizeRoles } from "../middlewares/authorize.middleware.js";
import { UserRolesEnum } from "../utils/constants.js";

const router = express.Router();

// 🔐 Protect all project routes
router.use(verifyJWT);

//
// ==========================
// 📂 PROJECT CRUD
// ==========================
router.post("/", authorizeRoles(UserRolesEnum.ADMIN, UserRolesEnum.PROJECT_ADMIN), createProject);           // Create new project

router.get("/", getProjects);              // Get all projects of logged-in user
router.get("/:projectId", getProjectById); // Get single project details
router.put("/:projectId",authorizeRoles(UserRolesEnum.ADMIN, UserRolesEnum.PROJECT_ADMIN), updateProject);  // Update project
router.delete("/:projectId", authorizeRoles(UserRolesEnum.ADMIN, UserRolesEnum.PROJECT_ADMIN), deleteProject); // Delete project

//
// ==========================
// 👥 PROJECT MEMBERS
// ==========================
router.post("/:projectId/members",authorizeRoles(UserRolesEnum.ADMIN, UserRolesEnum.PROJECT_ADMIN), addMembersToProject);         // Add member
router.get("/:projectId/members", getProjectMembers);            // Get all members of a project
router.put("/:projectId/members/:userId",authorizeRoles(UserRolesEnum.ADMIN, UserRolesEnum.PROJECT_ADMIN), updateMemberRole);     // Update member role
router.delete("/:projectId/members/:userId", authorizeRoles(UserRolesEnum.ADMIN, UserRolesEnum.PROJECT_ADMIN), deleteMember);      // Remove member

export default router;
