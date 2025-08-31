import ApiError from "../utils/apiError";

export const isAdmin = (req, res, next) => {
  if (req.user && req.user.role === "admin") {
    return next();
  }
  throw new ApiError(403, "Access denied: Admins only");
};