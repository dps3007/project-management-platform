import express from "express";
import {
  getProjectNotes,
  createProjectNote,
  updateProjectNote,
  deleteProjectNote,
  togglePinNote,
} from "../controllers/projectnote.controller.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import upload from "../middlewares/multer.middleware.js";

const router = express.Router();

router.use(verifyJWT);

router.get("/:projectId/notes", getProjectNotes);
router.post("/:projectId/notes", upload.array("attachments"), createProjectNote);
router.put("/notes/:noteId", updateProjectNote);
router.delete("/notes/:noteId", deleteProjectNote);
router.patch("/notes/:noteId/pin", togglePinNote);

export default router;
