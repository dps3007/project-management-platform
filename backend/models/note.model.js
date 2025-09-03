import mongoose, { Schema } from "mongoose";

const projectNoteSchema = new Schema(
  {
    project: {
      type: Schema.Types.ObjectId,
      ref: "Project",
      required: true,
      index: true, // 📌 faster queries by project
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    content: {
      type: String,
      required: true,
      trim: true,
    },
    attachments: {
      type: [
        {
          url: String,
          mimetype: String,
          size: Number,
        },
      ],
      default: [],
    },
    isPinned: {
      type: Boolean,
      default: false, // 📌 pin important notes to the top
    },
  },
  { timestamps: true }
);

export const ProjectNote = mongoose.model("ProjectNote", projectNoteSchema);
