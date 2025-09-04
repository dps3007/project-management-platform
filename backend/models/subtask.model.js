import mongoose, { Schema } from "mongoose";
import { AvailableTaskStatusesEnum, TaskStatusEnum } from "../utils/constants.js"; // corrected import

const subtaskSchema = new Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    task: {
      type: Schema.Types.ObjectId,
      ref: "Task",
      required: true,
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    status: {
      type: String,
      enum: AvailableTaskStatusesEnum, // corrected enum name
      default: TaskStatusEnum.TODO,
    },
  },
  { timestamps: true }
);

export const Subtask = mongoose.model("Subtask", subtaskSchema);