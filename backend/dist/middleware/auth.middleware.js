"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.protectRoute = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const env_1 = require("../config/env");
const BadRequestError_1 = require("../common/errors/BadRequestError");
const catchAsync_1 = require("../common/utils/catchAsync");
const user_model_1 = require("../modules/Users/user.model");
exports.protectRoute = (0, catchAsync_1.catchAsync)(async (req, res, next) => {
    const token = req.header("Authorization")?.replace("Bearer ", "");
    if (!token) {
        throw new BadRequestError_1.BadRequestError("No token provided. Access denied!");
    }
    try {
        const decoded = jsonwebtoken_1.default.verify(token, env_1.env.JWT_SECRET);
        if (!decoded || typeof decoded === "string" || !decoded.userId) {
            throw new BadRequestError_1.BadRequestError("Invalid token. Access denied!");
        }
        const user = await user_model_1.UserModel.findById(decoded.userId).select("-password");
        if (!user) {
            throw new BadRequestError_1.BadRequestError("User not found. Access denied!");
        }
        req.user = user;
        next();
    }
    catch (error) {
        throw new BadRequestError_1.BadRequestError("Invalid token. Access denied!");
    }
});
//# sourceMappingURL=auth.middleware.js.map