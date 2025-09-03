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

router.get("/:noteId/comments", getNoteComments);
router.post("/:noteId/comments", createNoteComment);
router.put("/comments/:commentId", updateNoteComment);
router.delete("/comments/:commentId", deleteNoteComment);

export default router;
