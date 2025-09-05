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

router.post("/:noteId", createNoteComment);
router.get("/:noteId", getNoteComments);
router.put("/update/:commentId", updateNoteComment);
router.delete("/delete/:commentId", deleteNoteComment);

export default router;
