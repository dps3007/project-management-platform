import {User} from "../models/user.model.js";
import  ApiResponse  from "../utils/apiResponse.js";
import ApiError from "../utils/apiError.js";
import asyncHandler  from "../utils/asyncHandler.js";

export const getAllUsers = asyncHandler(async (req, res) => {
  const { page = 1, limit = 10, search = "" } = req.query;

  const query = search
    ? { $or: [{ username: { $regex: search, $options: "i" } }, { email: { $regex: search, $options: "i" } }] }
    : {};

  const users = await User.find(query)
    .select("-password -refreshTokens")
    .skip((page - 1) * limit)
    .limit(Number(limit));

  const totalUsers = await User.countDocuments(query);

  return res.status(200).json(
    new ApiResponse(200, { users, totalUsers }, "Users fetched successfully")
  );
});

export const getUserById = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id).select("-password -refreshTokens");

  if (!user) {
    throw new ApiError(404, "User not found");
  }

  return res.status(200).json(
    new ApiResponse(200, user, "User fetched successfully")
  );
});

export const updateUserRole = asyncHandler(async (req, res) => {
  const { role } = req.body || {};
  
  if (!["user", "admin"].includes(role)) {
    throw new ApiError(400, "Invalid role");
  }

  const user = await User.findByIdAndUpdate(
    req.params.id,
    { role },
    { new: true }
  ).select("-password -refreshTokens");

  if (!user) {
    throw new ApiError(404, "User not found");
  }

  return res.status(200).json(
    new ApiResponse(200, user, "User role updated successfully")
  );
});

export const deleteUserByAdmin = asyncHandler(async (req, res) => {
  const user = await User.findByIdAndDelete(req.params.id);

  if (!user) {
    throw new ApiError(404, "User not found");
  }

  return res.status(200).json(
    new ApiResponse(200, null, "User deleted successfully by admin")
  );
});
