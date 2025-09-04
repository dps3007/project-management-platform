import mongoose, { Schema } from "mongoose";

const projectNoteCommentSchema = new Schema(
  {
    note: {
      type: Schema.Types.ObjectId,
      ref: "ProjectNote",
      required: true,
    },
    content: {
      type: String,
      required: true,
      trim: true,
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    parentComment: {
      type: Schema.Types.ObjectId,
      ref: "ProjectNoteComment", // for threaded replies
      default: null,
    },
    note: {
      type: Schema.Types.ObjectId,
      ref: "ProjectNote",
      required: true,
      index: true, // added index for faster queries
    },
  },
  { timestamps: true }
);

export const ProjectNoteComment = mongoose.model(
  "ProjectNoteComment",
  projectNoteCommentSchema
);
