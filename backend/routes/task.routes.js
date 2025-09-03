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
} from "../controllers/task.controller.js";

const router = express.Router();

// 🔐 Protect all task routes
router.use(verifyJWT);

// ==========================
// 📂 TASK CRUD
// ==========================
router.get("/:projectId/tasks", getTasks);             // Get all tasks in a project
router.post("/:projectId/tasks", createTask);          // Create a new task
router.get("/:projectId/tasks/:taskId", getTaskById);  // Get single task by ID
router.put("/:projectId/tasks/:taskId", updateTask);   // Update task
router.delete("/:projectId/tasks/:taskId", deleteTask);// Delete task

// ==========================
// 📂 SUBTASK CRUD
// ==========================
router.post("/:projectId/tasks/:taskId/subtasks", createSubTask);             // Create subtask
router.put("/:projectId/tasks/:taskId/subtasks/:subtaskId", updateSubTask);   // Update subtask
router.delete("/:projectId/tasks/:taskId/subtasks/:subtaskId", deleteSubTask);// Delete subtask

export default router;
