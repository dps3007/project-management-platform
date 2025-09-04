import express from "express";
import {
  getProjectNotes,
  createProjectNote,
  updateProjectNote,
  deleteProjectNote,
  togglePinNote,
} from "../controllers/projectNotes.controller.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import upload from "../middlewares/multer.middleware.js";
import { authorizeRoles } from "../middlewares/authorize.middleware.js";
import { UserRolesEnum } from "../utils/constants.js";

const router = express.Router();

router.use(verifyJWT);

router.post("/:projectId/", upload.array("attachments"),authorizeRoles(UserRolesEnum.ADMIN), createProjectNote);
router.get("/:projectId/", getProjectNotes);
router.put("/:projectId/:noteId",authorizeRoles(UserRolesEnum.ADMIN), updateProjectNote);
router.delete("/:projectId/:noteId",authorizeRoles(UserRolesEnum.ADMIN), deleteProjectNote);
router.patch("/:projectId/:noteId/pin",authorizeRoles(UserRolesEnum.ADMIN), togglePinNote);

export default router;
