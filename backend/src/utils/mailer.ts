import nodemailer from "nodemailer";
import { env } from "../config/env";

export const transporter = nodemailer.createTransport({
  host: env.EMAIL_HOST,
  port: Number(env.EMAIL_PORT) || 465,
  secure: true,
  auth: {
    user: env.EMAIL_USER,
    pass: env.EMAIL_PASS,
  },
  tls: { rejectUnauthorized: false },
});