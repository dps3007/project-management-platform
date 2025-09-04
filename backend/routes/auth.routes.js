import { Router } from "express";
import {
  registerUser,
  loginUser,
  logoutUser,
  logoutAllDevices,
  refreshToken,
  getCurrentUser,
  updateCurrentUser,
  deleteCurrentUser,
  updateAvatar,
  deactivateAccount,
  changePassword,
  forgotPassword,
  resetPassword,
  verifyEmail,
  resendVerificationEmail,
} from "../controllers/auth.controller.js";

import {
  userRegistrationValidation,
  userLoginValidation,
  changePasswordValidation,
  forgotPasswordValidation
} from "../validators/index.js";

import { validateRequest } from "../middlewares/validator.middleware.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { forgotPasswordLimiter } from "../middlewares/rateLimit.middleware.js";
import upload from "../middlewares/multer.middleware.js";

const router = Router();

// ✅ Auth routes
router.post("/register", userRegistrationValidation(), validateRequest, registerUser);
router.post("/login", userLoginValidation(), validateRequest, loginUser);
router.post("/logout", verifyJWT, logoutUser);
router.post("/logout-all", verifyJWT, logoutAllDevices);
router.post("/refresh-token", refreshToken);

// ✅ Email verification
router.post("/verify-email", verifyEmail);
router.post("/resend-verification", resendVerificationEmail);

// ✅ Profile routes
router.get("/me", verifyJWT, getCurrentUser);
router.put("/me", verifyJWT, updateCurrentUser);
router.delete("/me", verifyJWT, deleteCurrentUser);
router.put("/me/avatar", verifyJWT, upload.single("avatar"), updateAvatar);
router.put("/me/deactivate", verifyJWT, deactivateAccount); // abhi check nhi kiya

// ✅ Password routes
router.post("/change-password", verifyJWT, changePasswordValidation(), validateRequest, changePassword);
router.post("/forgot-password", forgotPasswordValidation(), validateRequest, forgotPasswordLimiter, forgotPassword); 
router.post("/reset-password", resetPassword);

export default router;
