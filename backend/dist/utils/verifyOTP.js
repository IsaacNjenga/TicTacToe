"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.verifyOTP = exports.verifyOtpCode = void 0;
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const otp_model_1 = require("../modules/OTP/otp.model");
const catchAsync_1 = require("../common/utils/catchAsync");
const BadRequestError_1 = require("../common/errors/BadRequestError");
const verifyOtpCode = async (email, otp) => {
    if (!email) {
        throw new BadRequestError_1.BadRequestError("Email is required");
    }
    if (!otp) {
        throw new BadRequestError_1.BadRequestError("OTP is required");
    }
    const normalizedEmail = email.toLowerCase().trim();
    const cleanOtp = String(otp).trim();
    const record = await otp_model_1.OtpModel.findOne({ email: normalizedEmail });
    if (!record) {
        throw new BadRequestError_1.BadRequestError("OTP not found for this email");
    }
    if (record.attempts >= 5) {
        throw new BadRequestError_1.BadRequestError("Too many attempts");
    }
    const isMatch = await bcryptjs_1.default.compare(cleanOtp, record.otp);
    if (!isMatch) {
        record.attempts += 1;
        await record.save();
        throw new BadRequestError_1.BadRequestError("Invalid OTP, attempts: " +
            record.attempts +
            ", max attempts: 5" +
            ", OTP will expire in 2 minutes");
    }
    record.verified = true;
    await record.save();
    return true;
};
exports.verifyOtpCode = verifyOtpCode;
exports.verifyOTP = (0, catchAsync_1.catchAsync)(async (req, res) => {
    const { email, otp } = req.body;
    await (0, exports.verifyOtpCode)(email, otp);
    res.status(200).json({
        success: true,
        message: "OTP verified successfully",
    });
});
//# sourceMappingURL=verifyOTP.js.map