import { Router } from "express";
import { registerUser , loginUser, logoutUser  } from "../controllers/auth.controller.js";
import {userRegistrationValidation ,userLoginValidation} from "../validators/index.js";
import { validateRequest } from "../middlewares/validator.middleware.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";


const router = Router();

router.post("/register", userRegistrationValidation(), validateRequest, registerUser);

router.post("/login", userLoginValidation(), validateRequest, loginUser);

//protected routes
router.post("/logout", verifyJWT, validateRequest, logoutUser);

export default router;