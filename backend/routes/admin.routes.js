import { Router } from "express";
import {
  getAllUsers,
  getUserById,
  updateUserRole,
  deleteUserByAdmin,
} from "../controllers/admin.controller.js";

import { verifyJWT, isAdmin } from "../middlewares/auth.middleware.js";

const router = Router();

// ✅ All admin routes are protected
router.use(verifyJWT, isAdmin);

// Get all users with pagination + search
router.get("/users", getAllUsers);

// Get single user by id
router.get("/users/:id", getUserById);

// Update user role (user ↔ admin)
router.put("/users/:id/role", updateUserRole);

// Delete user
router.delete("/users/:id", deleteUserByAdmin);

export default router;
