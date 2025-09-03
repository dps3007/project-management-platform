import express from "express";
import {
  getNoteComments,
  createNoteComment,
  updateNoteComment,
  deleteNoteComment,
} from "../controllers/projectnote.comment.controller.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";

const router = express.Router();

router.use(verifyJWT);

router.get("/:noteId/", getNoteComments);
router.post("/:noteId/", createNoteComment);
router.put("/:commentId", updateNoteComment);
router.delete("/:commentId", deleteNoteComment);

export default router;
