import { BadRequestError } from "../../common/errors/BadRequestError";
import { activateAccount } from "../../utils/activateAccount";
import { generateTokens } from "../../utils/generateToken";
import { otpRequest } from "../../utils/requestOTP";
import { verifyOtpCode } from "../../utils/verifyOTP";
import { OtpModel } from "../OTP/otp.model";
import { UserModel } from "../Users/user.model";
import {
  SignupDTO,
  SigninDTO,
  ChangePasswordDTO,
  ResetPasswordDTO,
  RequestPasswordResetDTO,
  // RequestEmailDTO,
  VerifyOtpDTO,
} from "./auth.types";
import bcrypt from "bcryptjs";

export const createAccount = async (input: SignupDTO): Promise<SignupDTO> => {
  const username = input.username?.trim();
  if (!username) {
    throw new BadRequestError("Username is required");
  }
  if (!input.email?.trim()) {
    throw new BadRequestError("Email is required");
  }
  if (!input.password) {
    throw new BadRequestError("Password is required");
  }
  if (input.password.length < 8) {
    throw new BadRequestError("Password must be at least 8 characters long");
  }

  const email = input.email.toLowerCase().trim();
  const existingEmail = await UserModel.findOne({
    email,
  });

  if (existingEmail) {
    throw new BadRequestError("User with this email already exists");
  }

  const passwordHash = await bcrypt.hash(input.password, 10);
  const defaultAvatarUrl = `https://api.dicebear.com/7.x/avataaars/png?seed=${email}`;

  return {
    ...input,
    username,
    email,
    password: passwordHash,
    avatar: defaultAvatarUrl,
  };
};

export const activateAccountService = async (
  email: string,
): Promise<boolean> => {
  if (!email) {
    throw new BadRequestError("Email is required");
  }
  await activateAccount(email);
  return true;
};

export const login = async (
  input: SigninDTO,
): Promise<{
  accessToken: string;
  refreshToken: string;
} | null> => {
  if (!input.email) {
    throw new BadRequestError("Email is required");
  }
  if (!input.password) {
    throw new BadRequestError("Password is required");
  }

  const email = input.email;
  const user = await UserModel.findOne({ email }).select("+password");
  if (!user) {
    throw new BadRequestError("Invalid Email or password");
  }
  if (!user.isActivated) {
    throw new BadRequestError(
      "Account is not activated. Please check your email for activation instructions.",
    );
  }

  const isPasswordValid = await bcrypt.compare(input.password, user.password);
  if (!isPasswordValid) {
    throw new BadRequestError("Invalid Email or password");
  }

  const { accessToken, refreshToken } = generateTokens(user._id.toString());

  return { accessToken, refreshToken };
};

export const changePassword = async (
  input: ChangePasswordDTO,
): Promise<boolean> => {
  if (!input.oldPassword) {
    throw new BadRequestError("Old password is required");
  }
  if (!input.newPassword) {
    throw new BadRequestError("New password is required");
  }
  if (input.newPassword.length < 8) {
    throw new BadRequestError(
      "New password must be at least 8 characters long",
    );
  }
  if (!input.email) {
    throw new BadRequestError("Email is required");
  }

  const email = input.email;
  // console.log(email)
  const user = await UserModel.findOne({ email }).select("+password");
  if (!user) {
    throw new BadRequestError("User not found");
  }

  const isOldPasswordValid = await bcrypt.compare(
    input.oldPassword,
    user.password,
  );
  if (!isOldPasswordValid) {
    throw new BadRequestError("Invalid old password");
  }

  const isSamePassword = await bcrypt.compare(input.newPassword, user.password);
  if (isSamePassword) {
    throw new BadRequestError(
      "New password must be different from the old password",
    );
  }

  const newPasswordHash = await bcrypt.hash(input.newPassword, 10);
  user.password = newPasswordHash;
  await user.save();

  return true;
};

export const requestPasswordResetOtp = async (
  input: RequestPasswordResetDTO,
): Promise<boolean> => {
  if (!input.email) {
    throw new BadRequestError("Email is required");
  }

  if (!input.email) {
    throw new BadRequestError("Email is required");
  }

  const email = input.email.toLowerCase().trim();
  // console.log(email);
  const user = await UserModel.findOne({ email });
  if (!user) {
    throw new BadRequestError("User not found");
  }

  const isOtpSent = await otpRequest(email);
  if (!isOtpSent) {
    throw new BadRequestError("Failed to send OTP");
  }

  return true;
};

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

export const verifyPasswordResetOtp = async (
  input: Pick<VerifyOtpDTO, "email" | "otp">,
): Promise<boolean> => {
  // await requestEmail(input);
  await verifyOtpCode(input.email, input.otp);

  return true;
};

export const resetPassword = async (
  input: ResetPasswordDTO,
): Promise<boolean> => {
  if (!input.newPassword) {
    throw new BadRequestError("New password is required");
  }
  if (input.newPassword.length < 8) {
    throw new BadRequestError(
      "New password must be at least 8 characters long",
    );
  }
  if (!input.email) {
    throw new BadRequestError("Email is required");
  }

  const email = input.email.toLowerCase().trim();
  const verifiedOtp = await OtpModel.findOne({ email, verified: true });
  if (!verifiedOtp) {
    throw new BadRequestError("OTP must be verified before resetting password");
  }

  const user = await UserModel.findOne({ email });
  if (!user) {
    throw new BadRequestError("User not found");
  }

  const newPasswordHash = await bcrypt.hash(input.newPassword, 10);
  user.password = newPasswordHash;
  await user.save();

  await OtpModel.deleteOne({ email });

  return true;
};
