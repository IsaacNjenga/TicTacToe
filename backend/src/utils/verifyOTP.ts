import bcrypt from "bcryptjs";
import { type Request, type Response } from "express";
import { OtpModel } from "../modules/OTP/otp.model";
import { catchAsync } from "../common/utils/catchAsync";
import { BadRequestError } from "../common/errors/BadRequestError";

export const verifyOtpCode = async (
  email: string,
  otp: string,
): Promise<boolean> => {
  if (!email) {
    throw new BadRequestError("Email is required");
  }
  if (!otp) {
    throw new BadRequestError("OTP is required");
  }

  const normalizedEmail = email.toLowerCase().trim();
  const cleanOtp = String(otp).trim();

  const record = await OtpModel.findOne({ email: normalizedEmail });
  if (!record) {
    throw new BadRequestError("OTP not found for this email");
  }
  if (record.attempts >= 5) {
    throw new BadRequestError("Too many attempts");
  }

  const isMatch = await bcrypt.compare(cleanOtp, record.otp);
  if (!isMatch) {
    record.attempts += 1;
    await record.save();
    throw new BadRequestError(
      "Invalid OTP, attempts: " +
        record.attempts +
        ", max attempts: 5" +
        ", OTP will expire in 2 minutes",
    );
  }

  record.verified = true;
  await record.save();

  return true;
};

export const verifyOTP = catchAsync(async (req: Request, res: Response) => {
  const { email, otp } = req.body;

  await verifyOtpCode(email, otp);

  res.status(200).json({
    success: true,
    message: "OTP verified successfully",
  });
});