"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.otpRequest = void 0;
const BadRequestError_1 = require("../common/errors/BadRequestError");
const otp_generator_1 = __importDefault(require("otp-generator"));
const mailer_1 = require("./mailer");
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const otp_model_1 = require("../modules/OTP/otp.model");
const otpRequest = async (to) => {
    if (!to) {
        throw new BadRequestError_1.BadRequestError("Recipient email is required");
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(to)) {
        throw new BadRequestError_1.BadRequestError("Invalid email format");
    }
    const email = to.toLowerCase().trim();
    const otp = otp_generator_1.default.generate(6, {
        digits: true,
        upperCaseAlphabets: false,
        specialChars: false,
    });
    const hashedOtp = await bcryptjs_1.default.hash(otp, 10);
    await otp_model_1.OtpModel.deleteOne({ email });
    await otp_model_1.OtpModel.create({
        email,
        otp: hashedOtp,
    });
    await mailer_1.transporter.sendMail({
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
exports.otpRequest = otpRequest;
//# sourceMappingURL=requestOTP.js.map