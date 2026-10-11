import { type Request, type Response } from "express";
import { catchAsync } from "../../common/utils/catchAsync";
import {
  activateAccountService,
  changePassword,
  login,
  requestPasswordResetOtp,
  resetPassword,
  verifyPasswordResetOtp,
  createAccount,
  //   checkEmail,
  //   checkUsername,
} from "./auth.service";
import { UserModel } from "../Users/user.model";
import { createLog } from "../Logs/logs.service";
import { BadRequestError } from "../../common/errors/BadRequestError";

export const userRegisterController = catchAsync(
  async (req: Request, res: Response) => {
    const userData = await createAccount(req.body);

    const result = new UserModel({ ...userData, isActivated: true });
    await result.save();

    await createLog({
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
  },
);

export const userLoginController = catchAsync(
  async (req: Request, res: Response) => {
    const loginResult = await login(req.body);

    const user = await UserModel.findOne({ email: req.body.email });
    if (!user) {
      throw new BadRequestError("User not found");
    }
    user.refreshToken = loginResult?.refreshToken || null;
    await user.save();

    await createLog({
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
  },
);

export const activateAccountController = catchAsync(
  async (req: Request, res: Response) => {
    await activateAccountService(req.body.email);

    const targetUser = await UserModel.findOne({ email: req.body.email });
    if (targetUser) {
      await createLog({
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
  },
);

export const changePasswordController = catchAsync(
  async (req: Request, res: Response) => {
    await changePassword(req.body);

    const targetUser = await UserModel.findOne({ email: req.body.email });
    if (targetUser) {
      await createLog({
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
  },
);

export const requestPasswordResetOtpController = catchAsync(
  async (req: Request, res: Response) => {
    await requestPasswordResetOtp(req.body);

    const targetUser = await UserModel.findOne({ email: req.body.email });
    if (targetUser) {
      await createLog({
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
  },
);

export const verifyPasswordResetOtpController = catchAsync(
  async (req: Request, res: Response) => {
    await verifyPasswordResetOtp(req.body);

    const targetUser = await UserModel.findOne({ email: req.body.email });
    if (targetUser) {
      await createLog({
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
  },
);

export const resetPasswordController = catchAsync(
  async (req: Request, res: Response) => {
    await resetPassword(req.body);

    const targetUser = await UserModel.findOne({ email: req.body.email });
    if (targetUser) {
      await createLog({
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
  },
);

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
