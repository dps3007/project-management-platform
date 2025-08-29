import ApiError from "../utils/apiError.js";

const errorHandler = (err, req, res, next) => {
  if (err instanceof ApiError) {
    return res.status(err.statusCode).json({
      success: false,
      statusCode: err.statusCode,
      message: err.message,
    });
  }

  // fallback for unhandled errors
  console.error(err);
  return res.status(500).json({
    success: false,
    statusCode: 500,
    message: "Internal Server Error",
  });
};

export default errorHandler;
