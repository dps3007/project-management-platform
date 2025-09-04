import ApiResponse from "../utils/apiResponse.js";

import asyncHandler from "../utils/asyncHandler.js";

export const healthCheck = asyncHandler(async (req, res) => {
    const response = new ApiResponse(200, { status: "OK" }, "Health check passed");
    
    res.status(200).json(response);
});

export default healthCheck;
