import { User } from "../models/index.js";
import ApiError from "../utils/apiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import jwt from "jsonwebtoken";

export const verifyJWT = asyncHandler(async (req, res, next) => {

    const token = req.cookies.accessToken || req.headers.authorization?.split(" ")[1];

    if (!token) {
        throw new ApiError(401, "Unauthorized");
    }

    try{
        const decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);

        const user = await User.findById(decoded._id).select("-password -refreshToken -emailVerificationToken -emailVerificationTokenExpiry");

        if (!user) {
            throw new ApiError(401, "Invalid access token");
        }
        req.user = user;
        next();

    } catch (error) {
        throw new ApiError(401, "Invalid access token");
    }
});
