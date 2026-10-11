"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.transporter = void 0;
const nodemailer_1 = __importDefault(require("nodemailer"));
const env_1 = require("../config/env");
exports.transporter = nodemailer_1.default.createTransport({
    host: env_1.env.EMAIL_HOST,
    port: Number(env_1.env.EMAIL_PORT) || 465,
    secure: true,
    auth: {
        user: env_1.env.EMAIL_USER,
        pass: env_1.env.EMAIL_PASS,
    },
    tls: { rejectUnauthorized: false },
});
//# sourceMappingURL=mailer.js.map