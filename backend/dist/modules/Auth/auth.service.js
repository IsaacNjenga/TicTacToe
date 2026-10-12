"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.resetPassword = exports.verifyPasswordResetOtp = exports.requestPasswordResetOtp = exports.changePassword = exports.login = exports.activateAccountService = exports.createAccount = void 0;
const BadRequestError_1 = require("../../common/errors/BadRequestError");
const activateAccount_1 = require("../../utils/activateAccount");
const generateToken_1 = require("../../utils/generateToken");
const requestOTP_1 = require("../../utils/requestOTP");
const verifyOTP_1 = require("../../utils/verifyOTP");
const otp_model_1 = require("../OTP/otp.model");
const user_model_1 = require("../Users/user.model");
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const createAccount = async (input) => {
    const username = input.username?.trim();
    if (!username) {
        throw new BadRequestError_1.BadRequestError("Username is required");
    }
    if (!input.email?.trim()) {
        throw new BadRequestError_1.BadRequestError("Email is required");
    }
    if (!input.password) {
        throw new BadRequestError_1.BadRequestError("Password is required");
    }
    if (input.password.length < 8) {
        throw new BadRequestError_1.BadRequestError("Password must be at least 8 characters long");
    }
    const countryCode = input.countryCode?.trim().toUpperCase();
    if (countryCode && !/^[A-Z]{2}$/.test(countryCode)) {
        throw new BadRequestError_1.BadRequestError("Country must be a two-letter country code");
    }
    const email = input.email.toLowerCase().trim();
    const existingEmail = await user_model_1.UserModel.findOne({
        email,
    });
    if (existingEmail) {
        throw new BadRequestError_1.BadRequestError("User with this email already exists");
    }
    const passwordHash = await bcryptjs_1.default.hash(input.password, 10);
    const defaultAvatarUrl = `https://api.dicebear.com/7.x/avataaars/png?seed=${email}`;
    return {
        ...input,
        username,
        email,
        countryCode: countryCode || undefined,
        password: passwordHash,
        avatar: defaultAvatarUrl,
    };
};
exports.createAccount = createAccount;
const activateAccountService = async (email) => {
    if (!email) {
        throw new BadRequestError_1.BadRequestError("Email is required");
    }
    await (0, activateAccount_1.activateAccount)(email);
    return true;
};
exports.activateAccountService = activateAccountService;
const login = async (input) => {
    if (!input.email) {
        throw new BadRequestError_1.BadRequestError("Email is required");
    }
    if (!input.password) {
        throw new BadRequestError_1.BadRequestError("Password is required");
    }
    const email = input.email;
    const user = await user_model_1.UserModel.findOne({ email }).select("+password");
    if (!user) {
        throw new BadRequestError_1.BadRequestError("Invalid Email or password");
    }
    if (!user.isActivated) {
        throw new BadRequestError_1.BadRequestError("Account is not activated. Please check your email for activation instructions.");
    }
    const isPasswordValid = await bcryptjs_1.default.compare(input.password, user.password);
    if (!isPasswordValid) {
        throw new BadRequestError_1.BadRequestError("Invalid Email or password");
    }
    const { accessToken, refreshToken } = (0, generateToken_1.generateTokens)(user._id.toString());
    return { accessToken, refreshToken };
};
exports.login = login;
const changePassword = async (input) => {
    if (!input.oldPassword) {
        throw new BadRequestError_1.BadRequestError("Old password is required");
    }
    if (!input.newPassword) {
        throw new BadRequestError_1.BadRequestError("New password is required");
    }
    if (input.newPassword.length < 8) {
        throw new BadRequestError_1.BadRequestError("New password must be at least 8 characters long");
    }
    if (!input.email) {
        throw new BadRequestError_1.BadRequestError("Email is required");
    }
    const email = input.email;
    // console.log(email)
    const user = await user_model_1.UserModel.findOne({ email }).select("+password");
    if (!user) {
        throw new BadRequestError_1.BadRequestError("User not found");
    }
    const isOldPasswordValid = await bcryptjs_1.default.compare(input.oldPassword, user.password);
    if (!isOldPasswordValid) {
        throw new BadRequestError_1.BadRequestError("Invalid old password");
    }
    const isSamePassword = await bcryptjs_1.default.compare(input.newPassword, user.password);
    if (isSamePassword) {
        throw new BadRequestError_1.BadRequestError("New password must be different from the old password");
    }
    const newPasswordHash = await bcryptjs_1.default.hash(input.newPassword, 10);
    user.password = newPasswordHash;
    await user.save();
    return true;
};
exports.changePassword = changePassword;
const requestPasswordResetOtp = async (input) => {
    if (!input.email) {
        throw new BadRequestError_1.BadRequestError("Email is required");
    }
    if (!input.email) {
        throw new BadRequestError_1.BadRequestError("Email is required");
    }
    const email = input.email.toLowerCase().trim();
    // console.log(email);
    const user = await user_model_1.UserModel.findOne({ email });
    if (!user) {
        throw new BadRequestError_1.BadRequestError("User not found");
    }
    const isOtpSent = await (0, requestOTP_1.otpRequest)(email);
    if (!isOtpSent) {
        throw new BadRequestError_1.BadRequestError("Failed to send OTP");
    }
    return true;
};
exports.requestPasswordResetOtp = requestPasswordResetOtp;
// export const requestEmail = async (
//   input: RequestEmailDTO,
// ): Promise<{ email: string }> => {
//   if (!input.email) {
//     throw new BadRequestError("Email is required");
//   }
//     if (!input.email) {
//     throw new BadRequestError("User ID is required");
//   }
//   const email = input.email.toLowerCase().trim();
//   const user = await UserModel.findOne({ email:input.email });
//   if (!user) {
//     throw new BadRequestError("User not found");
//   }
//   return { email };
// };
const verifyPasswordResetOtp = async (input) => {
    // await requestEmail(input);
    await (0, verifyOTP_1.verifyOtpCode)(input.email, input.otp);
    return true;
};
exports.verifyPasswordResetOtp = verifyPasswordResetOtp;
const resetPassword = async (input) => {
    if (!input.newPassword) {
        throw new BadRequestError_1.BadRequestError("New password is required");
    }
    if (input.newPassword.length < 8) {
        throw new BadRequestError_1.BadRequestError("New password must be at least 8 characters long");
    }
    if (!input.email) {
        throw new BadRequestError_1.BadRequestError("Email is required");
    }
    const email = input.email.toLowerCase().trim();
    const verifiedOtp = await otp_model_1.OtpModel.findOne({ email, verified: true });
    if (!verifiedOtp) {
        throw new BadRequestError_1.BadRequestError("OTP must be verified before resetting password");
    }
    const user = await user_model_1.UserModel.findOne({ email });
    if (!user) {
        throw new BadRequestError_1.BadRequestError("User not found");
    }
    const newPasswordHash = await bcryptjs_1.default.hash(input.newPassword, 10);
    user.password = newPasswordHash;
    await user.save();
    await otp_model_1.OtpModel.deleteOne({ email });
    return true;
};
exports.resetPassword = resetPassword;
//# sourceMappingURL=auth.service.js.map