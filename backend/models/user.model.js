import mongoose, { Schema } from "mongoose";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import crypto from "crypto";

const userSchema = new Schema(
  {
    avatar: {
      type: {
        url: { type: String, default: "https://placehold.co/200x200/png" },
        localPath: { type: String, default: "" },
      },
      default: undefined,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    username: {
      type: String,
      required: true,
      unique: true, // 🔑 prevent duplicate usernames
      trim: true,
      index: true,
    },
    password: {
      type: String,
      required: [true, "Password is required"],
      minlength: 6,
      select: false, // 🔑 don’t send password unless explicitly requested
    },
    isEmailVerified: {
      type: Boolean,
      default: false,
    },
    refreshTokens: {
      type: [String],
      default: [],
      validate: {
        validator: (arr) => arr.length <= 5, // optional: limit concurrent sessions
        message: "Exceeded maximum number of active sessions",
      },
    },
    passwordResetToken: { type: String, default: null },
    passwordResetTokenExpiry: { type: Date, default: null },
    emailVerificationToken: { type: String, default: null },
    emailVerificationTokenExpiry: { type: Date, default: null },

    // 🌍 Global role (app-level, not per-project)
    role: {
      type: String,
      enum: ["user", "admin"], // keep global simple
      default: "user",
    },
  },
  { timestamps: true }
);

// 🔑 Hash password before saving
userSchema.pre("save", async function (next) {
  if (this.isModified("password")) {
    this.password = await bcrypt.hash(this.password, 10);
  }
  next();
});

// 🔑 Compare password
userSchema.methods.isPasswordMatch = async function (password) {
  // Prevent bcrypt error if password is missing
  if (!password || !this.password) return false;

  return await bcrypt.compare(password, this.password);
};

// 🔑 Generate Access Token
userSchema.methods.generateAccessToken = function () {
  return jwt.sign(
    {
      _id: this._id,
      email: this.email,
      username: this.username,
      role: this.role, // include global role
    },
    process.env.ACCESS_TOKEN_SECRET,
    { expiresIn: process.env.ACCESS_TOKEN_EXPIRY }
  );
};

// 🔑 Generate Refresh Token
userSchema.methods.generateRefreshToken = function () {
  return jwt.sign(
    { _id: this._id },
    process.env.REFRESH_TOKEN_SECRET,
    { expiresIn: process.env.REFRESH_TOKEN_EXPIRY }
  );
};

// 🔑 Generate Temporary Token (reset / verify)
userSchema.methods.generateTemporaryToken = function () {
  const unhashedToken = crypto.randomBytes(20).toString("hex");
  const hashedToken = crypto
    .createHash("sha256")
    .update(unhashedToken)
    .digest("hex");
  const tokenExpiry = Date.now() + 20 * 60 * 1000; // 20 min
  return { unhashedToken, hashedToken, tokenExpiry };
};

// Generate Email Verification Token
userSchema.methods.generateEmailVerificationToken = function () {
  const token = crypto.randomBytes(32).toString("hex"); // random 32-byte hex string
  this.emailVerificationToken = token;
  this.emailVerificationTokenExpiry = Date.now() + 60 * 60 * 1000; // 1 hour
  return token;
};

// Generate Password Reset Token
userSchema.methods.generatePasswordResetToken = function () {
  const rawToken = crypto.randomBytes(32).toString("hex");

  // Hash before storing in DB
  this.passwordResetToken = crypto
    .createHash("sha256")
    .update(rawToken)
    .digest("hex");

  this.passwordResetTokenExpiry = Date.now() + 60 * 60 * 1000; // 1 hour

  return rawToken; // send the raw token in email
};

export const User = mongoose.model("User", userSchema);
