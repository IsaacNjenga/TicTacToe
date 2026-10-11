"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateTokens = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const env_1 = require("../config/env");
const generateTokens = (userId) => {
    const accessToken = jsonwebtoken_1.default.sign({ userId }, env_1.env.JWT_SECRET, {
        expiresIn: "7d",
    });
    const refreshToken = jsonwebtoken_1.default.sign({ userId }, env_1.env.JWT_SECRET, {
        expiresIn: "10d",
    });
    return {
        accessToken: accessToken,
        refreshToken: refreshToken,
    };
};
exports.generateTokens = generateTokens;
//# sourceMappingURL=generateToken.js.map