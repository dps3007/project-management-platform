import { User } from "../models/user.model.js";
import  ApiResponse  from "../utils/apiResponse.js";
import ApiError from "../utils/apiError.js";
import asyncHandler  from "../utils/asyncHandler.js";
import { emailVerificationMailgenContent, sendEmail } from "../utils/mail.js";
import jwt from "jsonwebtoken";



export const generateAccessTokenAndRefreshToken = async (userId) => {
    try{
        const user = await User.findById(userId);
        if (!user) throw new ApiError("User not found", 404);

        const accessToken = user.generateAccessToken();
        const refreshToken = user.generateRefreshToken();

        // push to array for multiple sessions
        user.refreshTokens.push(refreshToken);

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
    const user = await User.findOne({ email }).select("+password");
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
        "-password -refreshToken -emailVerificationToken -emailVerificationTokenExpiry -refreshTokens"
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
        .json(new ApiResponse(200, { user: loggedInUser, accessToken}, "User logged in successfully"));
});

export const logoutUser = asyncHandler(async (req, res) => {
    // Get refresh token from cookie or request body
    const refreshToken = req.cookies?.refreshToken || req.body.refreshToken;
    if (!refreshToken) throw new ApiError(400, "Refresh token not provided");

    // Make sure user is authenticated
    if (!req.user?._id) throw new ApiError(401, "Unauthorized");

    // Fetch user
    const user = await User.findById(req.user._id);
    if (!user) throw new ApiError(404, "User not found");

    // Remove the specific refresh token from the array
    user.refreshTokens = user.refreshTokens.filter(token => token !== refreshToken);
    await user.save({ validateBeforeSave: false });

    // Clear cookies
    const cookieOptions = {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
    };
    res.clearCookie("refreshToken", cookieOptions);
    res.clearCookie("accessToken", cookieOptions);

    return res.status(200).json(
        new ApiResponse(200, null, "User logged out successfully")
    );
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
  await user.save({ validateBeforeSave: false });

  // Generate verification URL
  const verificationUrl = `${process.env.FRONTEND_URL}/verify-email?token=${verificationToken}&email=${user.email}`;

  // Generate Mailgen content
  const mailgenContent = emailVerificationMailgenContent(user.username, verificationUrl);

  // Send verification email
  await sendEmail({
    email: user.email,           // ✅ must be 'email'
    subject: "Email Verification",
    mailgenContent               // ✅ Mailgen content object
  });

  return res.status(200).json(
    new ApiResponse(200, null, "Verification email resent successfully")
  );
});

export const refreshToken = asyncHandler(async (req, res) => {
  // Get refresh token from cookie or request body
  const refreshToken = req.cookies?.refreshToken || req.body.refreshToken;
  if (!refreshToken) throw new ApiError(400, "Refresh token is required");

  // Verify the refresh token
  let decoded;
  try {
    decoded = jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET);
  } catch (err) {
    throw new ApiError(401, "Invalid or expired refresh token");
  }

  // Find the user whose refreshTokens array contains this token
  const user = await User.findOne({
    _id: decoded._id,           // make sure payload contains _id
    refreshTokens: refreshToken // use hashed token if you hash tokens
  });

  if (!user) throw new ApiError(404, "User not found or token not valid");

  // Generate new tokens
  const newAccessToken = user.generateAccessToken();
  const newRefreshToken = user.generateRefreshToken();

  // Replace old refresh token with new one in DB
  user.refreshTokens = user.refreshTokens.filter(t => t !== refreshToken);
  user.refreshTokens.push(newRefreshToken);
  await user.save({ validateBeforeSave: false });

  // Optionally set refresh token as a secure httpOnly cookie
  res.cookie("refreshToken", newRefreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
  });

  return res.status(200).json(
    new ApiResponse(
      200,
      { accessToken: newAccessToken },
      "Tokens refreshed successfully"
    )
  );
});

export const forgotPassword = asyncHandler(async (req, res) => {
  const { email } = req.body;

  if (!email) {
    throw new ApiError(400, "Email is required");
  }

  const user = await User.findOne({ email: email.toLowerCase() });
  if (!user) {
    throw new ApiError(404, "User not found");
  }

  // Generate password reset token
  const resetToken = user.generatePasswordResetToken();
  user.passwordResetToken = resetToken;
  await user.save({ validateBeforeSave: false });

  // Create reset URL
  const resetUrl = `${process.env.FRONTEND_URL}/reset-password?token=${resetToken}&email=${user.email}`;

  // Build Mailgen content
  const mailgenContent = {
    body: {
      name: user.username || user.email,
      intro: "You requested a password reset.",
      action: {
        instructions: "Click the button below to reset your password:",
        button: {
          color: "#DC4D2F",
          text: "Reset Password",
          link: resetUrl,
        },
      },
      outro: "If you did not request this, you can safely ignore this email.",
    },
  };

  // Send email with correct keys
  await sendEmail({
    email: user.email,
    subject: "Password Reset",
    mailgenContent,
  });

  return res.status(200).json(
    new ApiResponse(200, null, "Password reset email sent successfully")
  );
});

export const resetPassword = asyncHandler(async (req, res) => {
  const { token, email, newPassword } = req.body;

  if (!token || !email || !newPassword) {
    throw new ApiError(400, "All fields are required");
  }

  const user = await User.findOne({
    email: email.toLowerCase(),
    passwordResetToken: token,
    passwordResetTokenExpiry: { $gt: Date.now() } // token abhi valid hai?
  });

  if (!user) {
    throw new ApiError(400, "Invalid or expired reset token");
  }

  // Update password
  user.password = newPassword;
  user.passwordResetToken = null;
  user.passwordResetTokenExpiry = null;
  await user.save();

  return res.status(200).json(
    new ApiResponse(200, null, "Password reset successful")
  );
});

export const logoutAllDevices = asyncHandler(async (req, res) => {
    const user = await User.findById(req.user._id);
    if (!user) {
        throw new ApiError(404, "User not found");
    }
    
    user.refreshTokens = []; // ✅ Clear all refresh tokens
    await user.save();

    // Clear cookies
    const options = { httpOnly: true, secure: true, sameSite: "strict" };
    res.clearCookie("refreshToken", options);
    res.clearCookie("accessToken", options);

  return res.status(200).json(
    new ApiResponse(200, null, "Logged out from all devices successfully")
  );
});

export const updateAvatar = asyncHandler(async (req, res) => {
  if (!req.file) {
    throw new ApiError(400, "Avatar file is required");
}

const user = await User.findById(req.user._id);
if (!user) throw new ApiError(404, "User not found");

// Example: save to Cloudinary or local storage
user.avatar = {
    url: `/uploads/${req.file.filename}`, 
    localPath: req.file.path
  };
  
  await user.save();
  
  return res.status(200).json(
    new ApiResponse(200, { avatar: user.avatar }, "Avatar updated successfully")
  );
});

export const deactivateAccount = asyncHandler(async (req, res) => {
    const user = await User.findByIdAndUpdate(
        req.user._id,
        { isActive: false },
    { new: true }
);

if (!user) {
    throw new ApiError(404, "User not found");
  }
  
  return res.status(200).json(
      new ApiResponse(200, null, "Account deactivated successfully")
    );
});

export const changePassword = asyncHandler(async (req, res) => {
  const { oldPassword, newPassword } = req.body;

  if (!oldPassword || !newPassword) {
    throw new ApiError(400, "All fields are required");
  }

  const user = await User.findById(req.user._id).select("+password");
  if (!user) {
    throw new ApiError(404, "User not found");
  }

  // ✅ Check if old password matches
  const isMatch = await user.isPasswordMatch(oldPassword);
  if (!isMatch) {
    throw new ApiError(401, "Old password is incorrect");
  }

  // ✅ Extra: Prevent using same password again
  const isSame = await user.isPasswordMatch(newPassword);
  if (isSame) {
    throw new ApiError(400, "New password cannot be the same as old password");
  }

  // ✅ Update password
  user.password = newPassword;

  // ✅ Invalidate all refresh tokens (force re-login on all devices)
  user.refreshTokens = [];

  await user.save();

  return res.status(200).json(
    new ApiResponse(200, null, "Password changed successfully, please log in again")
  );
});