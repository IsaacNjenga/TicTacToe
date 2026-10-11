"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.globalErrorHandler = void 0;
const AppErrors_1 = require("../common/errors/AppErrors");
const env_1 = require("../config/env");
const globalErrorHandler = (err, req, res, next) => {
    const statusCode = err instanceof AppErrors_1.AppError ? err.statusCode : 500;
    const response = {
        status: statusCode >= 500 ? "error" : "fail",
        message: err.message || "Internal Server Error",
        ...(env_1.env.NODE_ENV === "development" && { stack: err.stack })
    };
    res.status(statusCode).json(response);
};
exports.globalErrorHandler = globalErrorHandler;
//# sourceMappingURL=error.middleware.js.map