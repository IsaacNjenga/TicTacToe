"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.OtpModel = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
exports.OtpModel = mongoose_1.default.model("Otp", new mongoose_1.default.Schema({
    email: {
        type: String,
        required: true,
        index: true,
    },
    otp: {
        type: String, // hashed OTP
        required: true,
    },
    attempts: {
        type: Number,
        default: 0,
    },
    createdAt: {
        type: Date,
        default: Date.now,
        expires: 120,
    },
    verified: {
        type: Boolean,
        default: false,
    },
    expired: { type: Boolean, default: false },
}, { collection: "otps", timestamps: false }));
//# sourceMappingURL=otp.model.js.map