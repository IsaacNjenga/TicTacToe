"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.resetPasswordController = exports.verifyPasswordResetOtpController = exports.requestPasswordResetOtpController = exports.changePasswordController = exports.activateAccountController = exports.userLoginController = exports.userRegisterController = void 0;
const catchAsync_1 = require("../../common/utils/catchAsync");
const auth_service_1 = require("./auth.service");
const user_model_1 = require("../Users/user.model");
const logs_service_1 = require("../Logs/logs.service");
const BadRequestError_1 = require("../../common/errors/BadRequestError");
exports.userRegisterController = (0, catchAsync_1.catchAsync)(async (req, res) => {
    const userData = await (0, auth_service_1.createAccount)(req.body);
    const result = new user_model_1.UserModel({ ...userData, isActivated: true });
    await result.save();
    await (0, logs_service_1.createLog)({
        type: "user",
        refId: result._id.toString(),
        action: "created",
        title: "New user created",
        description: `User ${result.email} was created`,
        refModel: "user",
        actor: result._id.toString(),
    });
    res.status(201).json({
        success: true,
        data: {
            id: result._id.toString(),
            username: result.username,
            email: result.email,
            avatar: result.avatar,
        },
    });
});
exports.userLoginController = (0, catchAsync_1.catchAsync)(async (req, res) => {
    const loginResult = await (0, auth_service_1.login)(req.body);
    const user = await user_model_1.UserModel.findOne({ email: req.body.email });
    if (!user) {
        throw new BadRequestError_1.BadRequestError("User not found");
    }
    user.refreshToken = loginResult?.refreshToken || null;
    await user.save();
    await (0, logs_service_1.createLog)({
        type: "user",
        refId: user._id.toString(),
        action: "logged_in",
        title: "User login",
        description: `User ${user.email} logged in`,
        refModel: "user",
        actor: user?._id.toString(),
    });
    res.status(200).json({
        success: true,
        message: "Login successful",
        token: loginResult?.accessToken,
        refreshToken: loginResult?.refreshToken,
        user: {
            id: user._id,
            email: user.email,
            avatar: user.avatar,
            username: user.username,
        },
    });
});
exports.activateAccountController = (0, catchAsync_1.catchAsync)(async (req, res) => {
    await (0, auth_service_1.activateAccountService)(req.body.email);
    const targetUser = await user_model_1.UserModel.findOne({ email: req.body.email });
    if (targetUser) {
        await (0, logs_service_1.createLog)({
            type: "user",
            refId: targetUser._id.toString(),
            action: "updated",
            title: "Account activated",
            description: `Account activated for ${req.body.email}`,
            refModel: "user",
            actor: targetUser._id.toString(),
        });
    }
    res.status(200).json({
        success: true,
        message: "Account activated successfully",
    });
});
exports.changePasswordController = (0, catchAsync_1.catchAsync)(async (req, res) => {
    await (0, auth_service_1.changePassword)(req.body);
    console.log(req.body.email);
    const targetUser = await user_model_1.UserModel.findOne({ email: req.body.email });
    if (targetUser) {
        await (0, logs_service_1.createLog)({
            type: "user",
            refId: targetUser._id.toString(),
            action: "updated",
            title: "Password changed",
            description: `Password changed for ${targetUser.email} - ${targetUser.username}`,
            refModel: "user",
            actor: targetUser._id.toString(),
        });
    }
    res.status(200).json({
        success: true,
        message: "Password changed successfully",
    });
});
exports.requestPasswordResetOtpController = (0, catchAsync_1.catchAsync)(async (req, res) => {
    await (0, auth_service_1.requestPasswordResetOtp)(req.body);
    // console.log(req.body.email);
    const targetUser = await user_model_1.UserModel.findOne({ email: req.body.email });
    if (targetUser) {
        await (0, logs_service_1.createLog)({
            type: "user",
            refId: targetUser._id.toString(),
            action: "sent",
            title: "Password reset OTP requested",
            description: `Password reset OTP requested for ${req.body.email}`,
            refModel: "user",
            actor: targetUser._id.toString(),
        });
    }
    res.status(200).json({
        success: true,
        message: "OTP sent! OTP will expire in 2 minutes",
    });
});
exports.verifyPasswordResetOtpController = (0, catchAsync_1.catchAsync)(async (req, res) => {
    await (0, auth_service_1.verifyPasswordResetOtp)(req.body);
    const targetUser = await user_model_1.UserModel.findOne({ email: req.body.email });
    if (targetUser) {
        await (0, logs_service_1.createLog)({
            type: "user",
            refId: targetUser._id.toString(),
            action: "received",
            title: "Password reset OTP verified",
            description: `Password reset OTP verified for ${req.body.email}`,
            refModel: "user",
            actor: targetUser._id.toString(),
        });
    }
    res.status(200).json({
        success: true,
        message: "OTP verified successfully",
    });
});
exports.resetPasswordController = (0, catchAsync_1.catchAsync)(async (req, res) => {
    await (0, auth_service_1.resetPassword)(req.body);
    const targetUser = await user_model_1.UserModel.findOne({ email: req.body.email });
    if (targetUser) {
        await (0, logs_service_1.createLog)({
            type: "user",
            refId: targetUser._id.toString(),
            action: "updated",
            title: "Password reset",
            description: `Password was reset for ${req.body.email}`,
            refModel: "user",
            actor: targetUser._id.toString(),
        });
    }
    res.status(200).json({
        success: true,
        message: "Password reset successfully",
    });
});
// export const checkEmailExists = catchAsync(
//   async (req: Request, res: Response) => {
//     const email = Array.isArray(req.query.email)
//       ? req.query.email[0]
//       : req.query.email;
//     if (typeof email !== "string" || !email) {
//       throw new BadRequestError("Email query parameter is required");
//     }
//     const exists = await checkEmail(email);
//     if (exists) {
//       res.status(200).json({
//         success: true,
//         data: "Email is already in use",
//         message: "Email check successful",
//       });
//     }
//   },
// );
// export const checkUsernameExists = catchAsync(
//   async (req: Request, res: Response) => {
//     const username = Array.isArray(req.query.username)
//       ? req.query.username[0]
//       : req.query.username;
//     if (typeof username !== "string" || !username) {
//       throw new BadRequestError("Username query parameter is required");
//     }
//     const exists = await checkUsername(username);
//     if (exists) {
//       res.status(200).json({
//         success: true,
//         data: "Username is already in use",
//         message: "Username check successful",
//       });
//     }
//   },
// );
//# sourceMappingURL=auth.controller.js.map