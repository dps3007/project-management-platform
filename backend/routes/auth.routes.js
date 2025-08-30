import { Router } from "express";
import { registerUser } from "../controllers/auth.controller.js";
import userRegistrationValidation from "../validators/index.js";
import { validateRequest } from "../middlewares/validator.middleware.js";


const router = Router();

router.post("/register", userRegistrationValidation(), validateRequest, registerUser);

export default router;
