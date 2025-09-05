import express from "express";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import {
  getTasks,
  createTask,
  getTaskById,
  updateTask,
  deleteTask,
  createSubTask,
  updateSubTask,
  deleteSubTask,
  statusTracker,
  assignTask,
  addTaskAttachments
} from "../controllers/task.controller.js";
import { authorizeRoles } from "../middlewares/authorize.middleware.js";
import { UserRolesEnum } from "../utils/constants.js";
import upload from "../middlewares/multer.middleware.js";


const router = express.Router();

// 🔐 Protect all task routes
router.use(verifyJWT);

// ==========================
// 📂 TASK CRUD
// ==========================
router.get("/:projectId/tasks", getTasks);             // Get all tasks in a project
router.post("/:projectId/tasks", authorizeRoles(UserRolesEnum.ADMIN, UserRolesEnum.PROJECT_ADMIN), createTask);          // Create a new task
router.get("/:projectId/tasks/:taskId", getTaskById);  // Get single task by ID
router.put("/:projectId/tasks/:taskId", authorizeRoles(UserRolesEnum.ADMIN, UserRolesEnum.PROJECT_ADMIN), updateTask);   // Update task
router.delete("/:projectId/tasks/:taskId", authorizeRoles(UserRolesEnum.ADMIN, UserRolesEnum.PROJECT_ADMIN), deleteTask);// Delete task
router.get("/tasks/status/:userId", verifyJWT, statusTracker); // Get status tracker for a task
router.post("/tasks/assign", authorizeRoles(UserRolesEnum.ADMIN, UserRolesEnum.PROJECT_ADMIN), assignTask); // Assign task to a user
// max 10 files per request
router.post("/tasks/:taskId/attachments", verifyJWT, upload.array("files", 10), addTaskAttachments);

// ==========================
// 📂 SUBTASK CRUD
// ==========================
router.post("/:projectId/subtasks/:taskId/", createSubTask);             // Create subtask
router.put("/:projectId/subtasks/:taskId/:subtaskId", updateSubTask);   // Update subtask
// PATCH to mark subtask as completed

router.delete("/:projectId/subtasks/:taskId/:subtaskId",authorizeRoles(UserRolesEnum.ADMIN, UserRolesEnum.PROJECT_ADMIN), deleteSubTask);// Delete subtask


export default router;
