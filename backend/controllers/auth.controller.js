import {User} from "../models/user.model.js";
import  ApiResponse  from "../utils/apiResponse.js";
import ApiError from "../utils/apiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { emailVerificationMailgenContent, sendEmail } from "../utils/mail.js";


export const generateAccessTokenAndRefreshToken = async (userId) => {
    try{
        const user = await User.findById(userId);
        if (!user) throw new ApiError("User not found", 404);

        const accessToken = user.generateAccessToken();
        const refreshToken = user.generateRefreshToken();

        user.refreshToken = refreshToken;
        await user.save({validateBeforeSave: false});

        return { accessToken, refreshToken };
    } catch (error) {
        console.error("Error generating tokens:", error);
        throw new ApiError("Error generating tokens", 500);
    }
};

export const registerUser = asyncHandler(async (req, res) => {
    const { username, email, password } = req.body;

    // 1. Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
        throw new ApiError("User already exists", 409);
    }

    // 2. Create new user
    const user = await User.create({
        username,
        email,
        password, // hashed in User model pre-save hook
        isEmailVerified: false,
    });

    // 3. Generate verification token
    const { unHashedToken, hashedToken, tokenExpiry } = user.generateTemporaryToken();
    user.emailVerificationToken = hashedToken;
    user.emailVerificationTokenExpiry = tokenExpiry;

    await user.save({ validateBeforeSave: false });

    // 4. Send email
    try {
        await sendEmail({
            email: user.email,
            subject: "Verify your email",
            mailgenContent: emailVerificationMailgenContent(
                user.username,
                `${req.protocol}://${req.get("host")}/api/v1/users/verify-email?token=${unHashedToken}`
            ),
        });
    } catch (error) {
        await User.findByIdAndDelete(user._id);
        throw new ApiError("Failed to send verification email", 500);
    }

    // 5. Response
    return ApiResponse.success(res, "User registered successfully", {
        user: {
            id: user._id,
            email: user.email,
            username: user.username,
        },
        emailVerificationSent: true,
    });
});
