import { body } from "express-validator";

export const userRegistrationValidation = () => {
  return [
    body("username")
      .trim()
      .notEmpty().withMessage("Username is required").bail()
      .isLength({ min: 3 }).withMessage("Username must be minimum 3 characters").bail()
      .isLowercase().withMessage("Username must be in lowercase").bail()
    .matches(/^[a-z0-9_]+$/).withMessage("Username can only contain lowercase letters, numbers, and underscores"),

  body("email")
    .trim()
    .notEmpty().withMessage("Email is required").bail()
    .isEmail().withMessage("Invalid email address")
    .normalizeEmail(),

  body("password")
    .trim()
    .notEmpty().withMessage("Password is required").bail()
    .isLength({ min: 6 }).withMessage("Password must be at least 6 characters").bail()
    .isStrongPassword({
      minLength: 6,
      minLowercase: 1,
      minUppercase: 1,
      minNumbers: 1,
      minSymbols: 1,
    })
    .withMessage("Password must include uppercase, number, and special character"),

  body("fullName")
    .optional()
    .trim()
    .isLength({ min: 2 }).withMessage("Full name must be at least 2 characters").bail()
    .matches(/^[a-zA-Z\s]+$/).withMessage("Full name must only contain letters and spaces"),
  ];
};

export const userLoginValidation = () => {
  return [
    body("email")
      .trim()
      .notEmpty().withMessage("Email is required").bail()
      .isEmail().withMessage("Invalid email address")
      .normalizeEmail(),

    body("password")
      .trim()
      .notEmpty().withMessage("Password is required").bail()
      .isLength({ min: 6 }).withMessage("Password must be at least 6 characters").bail()
  ];
};

export const changePasswordValidation = () => {
  return [
    body("oldPassword")
      .trim()
      .notEmpty().withMessage("Old password is required").bail()
      .isLength({ min: 6 }).withMessage("Old password must be at least 6 characters"),

    body("newPassword")
      .trim()
      .notEmpty().withMessage("New password is required").bail()
      .isLength({ min: 6 }).withMessage("New password must be at least 6 characters").bail()
      .isStrongPassword({
        minLength: 6,
        minLowercase: 1,
        minUppercase: 1,
        minNumbers: 1,
        minSymbols: 1,
      })
      .withMessage("New password must include uppercase, number, and special character"),
  ];
};

export const forgotPasswordValidation = () => {
  return [
    body("email")
      .trim()
      .notEmpty().withMessage("Email is required").bail()
      .isEmail().withMessage("Invalid email address")
      .normalizeEmail(),
  ];
};
