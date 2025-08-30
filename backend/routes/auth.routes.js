import { Router } from "express";
import { registerUser , loginUser  } from "../controllers/auth.controller.js";
import {userRegistrationValidation ,userLoginValidation} from "../validators/index.js";
import { validateRequest } from "../middlewares/validator.middleware.js";


const router = Router();

router.post("/register", userRegistrationValidation(), validateRequest, registerUser);

router.post("/login", userLoginValidation(), validateRequest, loginUser);

export default router;