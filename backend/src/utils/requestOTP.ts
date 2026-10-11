import { BadRequestError } from "../common/errors/BadRequestError";
import otpGenerator from "otp-generator";
import { transporter } from "./mailer";
import bcrypt from "bcryptjs";
import { OtpModel } from "../modules/OTP/otp.model";

export interface OtpRequestDTO {
  to: string;
}

export const otpRequest = async (to: string): Promise<boolean> => {
  if (!to) {
    throw new BadRequestError("Recipient email is required");
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(to)) {
    throw new BadRequestError("Invalid email format");
  }

  const email = to.toLowerCase().trim();
  const otp = otpGenerator.generate(6, {
    digits: true,
    upperCaseAlphabets: false,
    specialChars: false,
  });
  const hashedOtp = await bcrypt.hash(otp, 10);

  await OtpModel.deleteOne({ email });
  await OtpModel.create({
    email,
    otp: hashedOtp,
  });

  await transporter.sendMail({
    from: "Support Team",
    to: email,
    subject: "Your One-Time Password",
    html: `
      <div style="font-family: Arial, sans-serif; padding: 20px; color: #333;">
        <h2 style="color: #4CAF50;">One-Time Password</h2>
        <p>Hello,</p>
        <p>You requested a one-time password (OTP). Use the code below to proceed:</p>
        <div style="
          font-size: 24px;
          font-weight: bold;
          letter-spacing: 4px;
          margin: 20px 0;
          padding: 10px;
          background: #f4f4f4;
          display: inline-block;
          border-radius: 5px;
        ">
          ${otp}
        </div>
        <p>This code will expire in <strong>2 minutes</strong>.</p>
        <p>If you did not request this, please ignore this email.</p>
        <br/>
        <p>- Your Support Team</p>
      </div>
    `,
  });

  return true;
};