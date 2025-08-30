import { User } from "../models/index.js";
import ApiError from "../utils/apiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import jwt from "jsonwebtoken";

export const verifyJWT = asyncHandler(async (req, res, next) => {
    let token = req.cookies.accessToken || req.headers.authorization;

    if (token?.startsWith("Bearer ")) {
        token = token.split(" ")[1];
    }

    if (!token) {
        throw new ApiError(401, "Access token missing");
    }

    try {
        const decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);

        const user = await User.findById(decoded._id).select(
            "-password -refreshToken -emailVerificationToken -emailVerificationTokenExpiry"
        );

        if (!user) {
            throw new ApiError(401, "User not found");
        }

        req.user = user;
        next();
    } catch (error) {
        if (error.name === "TokenExpiredError") {
            throw new ApiError(401, "Access token expired");
        }
        throw new ApiError(401, "Invalid access token");
    }
});
