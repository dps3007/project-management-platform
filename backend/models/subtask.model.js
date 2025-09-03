import mongoose, { Schema } from "mongoose";
import { AvailableTaskStatuses, TaskStatusEnum } from "../utils/constants.js";

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
      enum: AvailableTaskStatuses, // ["TODO", "IN_PROGRESS", "DONE"]
      default: TaskStatusEnum.TODO,
    },
  },
  { timestamps: true }
);

export const Subtask = mongoose.model("Subtask", subtaskSchema);
