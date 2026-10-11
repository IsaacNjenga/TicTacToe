"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.errorHandler = void 0;
const CustomError_1 = require("./CustomError");
const errorHandler = (err, req, res, next) => {
    if (err instanceof CustomError_1.CustomError) {
        return res.status(err.statusCode).json({
            success: false,
            errors: err.serializeErrors(),
        });
    }
    // Fallback for unhandled/500 errors
    console.error("Unhandled Error:", err);
    return res.status(500).json({
        success: false,
        errors: [{ message: "Internal server error" }],
    });
};
exports.errorHandler = errorHandler;
//# sourceMappingURL=ErrorHandler.js.map