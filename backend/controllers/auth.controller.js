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
        throw new ApiError(409, "User already exists");

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
        throw new ApiError(500, "Failed to send verification email");
    }

    // 5. Response
    const createdUser = await User.findById(user._id).select('-password -refreshToken -emailVerificationToken -emailVerificationTokenExpiry',);

    if (!createdUser) {
        throw new ApiError(500, "User registration failed"); 
    }
    return res
  .status(201)
  .json(new ApiResponse(201, {user: createdUser}, "User registered successfully"));

});

export const loginUser = asyncHandler(async (req, res) => {
    const { email, password } = req.body;

    // 1. Validate input
    if (!email || !password) {
        throw new ApiError(400, "Email and password are required");
    }

    // 2. Find user
    const user = await User.findOne({ email });
    if (!user) {
        throw new ApiError(401, "Invalid credentials");
    }

    // 3. Validate password
    const isPasswordValid = await user.isPasswordMatch(password);
    if (!isPasswordValid) {
        throw new ApiError(401, "Invalid credentials");
    }

    // 4. Generate tokens
    const { accessToken, refreshToken } = await generateAccessTokenAndRefreshToken(user._id);

    // 5. Fetch user without sensitive fields
    const loggedInUser = await User.findById(user._id).select(
        "-password -refreshToken -emailVerificationToken -emailVerificationTokenExpiry"
    );

    if (!loggedInUser) {
        throw new ApiError(500, "User login failed");
    }

    // 6. Cookie options
    const options = {
        httpOnly: true,
        secure: true,
        sameSite: "strict",
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    };

    // 7. Response
    return res.status(200)
        .cookie("refreshToken", refreshToken, options)
        .cookie("accessToken", accessToken, options)
        .json(new ApiResponse(200, { user: loggedInUser, accessToken, refreshToken }, "User logged in successfully"));
});

export const logoutUser = asyncHandler(async (req, res) => {
    // Remove refreshToken from DB (optional but recommended)
    if (req.user?._id) {
        await User.findByIdAndUpdate(req.user._id, { $unset: { refreshToken: 1 } });
    }

    // Options must match cookies set during login
    const options = {
        httpOnly: true,
        secure: true,
        sameSite: "strict",
    };

    // Clear cookies
    res.clearCookie("refreshToken", options);
    res.clearCookie("accessToken", options);

    return res
        .status(200)
        .json(new ApiResponse(200, null, "User logged out successfully"));
});

export const getCurrentUser = asyncHandler(async (req, res) => {

    return res.status(200).json(new ApiResponse(200, { user: req.user }, "Current user fetched successfully"));
});

