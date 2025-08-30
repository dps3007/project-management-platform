import { validationResult } from "express-validator";
import ApiError from "../utils/apiError.js";

export const validateRequest = (req, res, next) => {
    const errors = validationResult(req);
    
    if (errors.isEmpty()) {
        return next();
    }

    const extractedErrors = [];
    errors.array().map(err => ({
        msg: err.msg,
        param: err.param,
        location: err.location,
    }));                              

    // Pass to error handler
    throw new ApiError(422, "Validation failed", extractedErrors);
};