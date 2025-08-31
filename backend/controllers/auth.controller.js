import {User} from "../models/user.model.js";
import  ApiResponse  from "../utils/apiResponse.js";
import ApiError from "../utils/apiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { emailVerificationMailgenContent, sendEmail } from "../utils/mail.js";
import jwt from "jsonwebtoken";



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

export const updateCurrentUser = asyncHandler(async (req, res) => {
  const { username, email } = req.body;

  if (!username && !email) {
    throw new ApiError(400, "Please provide new username or email");
  }

  // Dynamically create update object
  const updateFields = {};
  if (username) updateFields.username = username;
  if (email) updateFields.email = email;

  const updatedUser = await User.findByIdAndUpdate(
    req.user._id,
    { $set: updateFields },
    { new: true, runValidators: true }
  ).select("-password"); // password ko exclude karna acha practice hai

  if (!updatedUser) {
    throw new ApiError(404, "User not found");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, { user: updatedUser }, "User updated successfully"));
});

export const deleteCurrentUser = asyncHandler(async (req, res) => {
  const deletedUser = await User.findByIdAndDelete(req.user._id);

  if (!deletedUser) {
    throw new ApiError(404, "User not found");
  }

  return res
    .status(200) // safer than 204 if sending body
    .json(new ApiResponse(200, null, "User deleted successfully"));
});

export const verifyEmail = asyncHandler(async (req, res) => {
  const { email, verificationToken } = req.body;

  if (!email || !verificationToken) {
    throw new ApiError(400, "Email and verification token are required");
  }

  const user = await User.findOne({
    email: email.toLowerCase(),
    emailVerificationToken: verificationToken
  });

  if (!user) {
    throw new ApiError(404, "User not found or invalid token");
  }

  // check expiry
  if (user.emailVerificationTokenExpiry && user.emailVerificationTokenExpiry < Date.now()) {
    throw new ApiError(400, "Verification token has expired");
  }

  user.emailVerified = true;
  user.emailVerificationToken = undefined;
  user.emailVerificationTokenExpiry = undefined;

  await user.save();

  // return safe data only
  const safeUser = {
    _id: user._id,
    username: user.username,
    email: user.email,
    emailVerified: user.emailVerified
  };

  return res.status(200).json(
    new ApiResponse(200, { user: safeUser }, "Email verified successfully")
  );
});

export const resendVerificationEmail = asyncHandler(async (req, res) => {
  const { email } = req.body;

  if (!email) {
    throw new ApiError(400, "Email is required");
  }

  const user = await User.findOne({ email: email.toLowerCase() });

  if (!user) {
    throw new ApiError(404, "User not found");
  }

  // Already verified?
  if (user.emailVerified) {
    throw new ApiError(400, "Email is already verified");
  }

  // Optional: Check cooldown (e.g., 1 min gap)
  if (user.lastVerificationEmailSentAt && Date.now() - user.lastVerificationEmailSentAt < 60 * 1000) {
    throw new ApiError(429, "Please wait before requesting another verification email");
  }

  // Generate new verification token
  const verificationToken = user.generateEmailVerificationToken();
  user.lastVerificationEmailSentAt = Date.now();
  await user.save();

  // Send verification email
  const verifyUrl = `${process.env.FRONTEND_URL}/verify-email?token=${verificationToken}&email=${user.email}`;

  await sendEmail({
    to: user.email,
    subject: "Email Verification",
    text: `Please verify your email by clicking the link: ${verifyUrl}`,
    html: `<p>Please verify your email by clicking the link below:</p>
           <a href="${verifyUrl}">${verifyUrl}</a>`
  });

  return res.status(200).json(
    new ApiResponse(200, null, "Verification email resent successfully")
  );
});

export const refreshToken = asyncHandler(async (req, res) => {
  const { refreshToken } = req.body;

  if (!refreshToken) {
    throw new ApiError(400, "Refresh token is required");
  }

  let decoded;
  try {
    decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
  } catch (error) {
    throw new ApiError(401, "Invalid or expired refresh token");
  }

  // Find the user
  const user = await User.findById(decoded.id);
  if (!user) {
    throw new ApiError(404, "User not found");
  }

  // Check if refresh token exists in user's stored tokens
  if (!user.refreshTokens.includes(refreshToken)) {
    throw new ApiError(401, "Refresh token is not valid (possibly revoked)");
  }

  // Generate new tokens
  const newAccessToken = user.generateAccessToken(); // expires in e.g., 15m
  const newRefreshToken = user.generateRefreshToken(); // expires in e.g., 7d

  // Rotate tokens: remove old, add new
  user.refreshTokens = user.refreshTokens.filter((t) => t !== refreshToken);
  user.refreshTokens.push(newRefreshToken);
  await user.save();

  return res.status(200).json(
    new ApiResponse(
      200,
      { accessToken: newAccessToken, refreshToken: newRefreshToken },
      "Tokens refreshed successfully"
    )
  );
});

