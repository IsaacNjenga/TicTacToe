"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.env = void 0;
const zod_1 = require("zod");
require("dotenv/config");
const envSchema = zod_1.z.object({
    URI: zod_1.z.string().min(1),
    PORT: zod_1.z.string().default("3001"),
    NODE_ENV: zod_1.z
        .enum(["development", "test", "production"])
        .default("development"),
    JWT_SECRET: zod_1.z.string().min(1),
    EMAIL_HOST: zod_1.z.string().min(1),
    EMAIL_PORT: zod_1.z.string().default("465"),
    EMAIL_USER: zod_1.z.string().min(1),
    EMAIL_PASS: zod_1.z.string().min(1),
    REDIS_URL: zod_1.z.string().min(1),
    FRONTEND_URL: zod_1.z.string().min(1),
});
// This will throw an error if process.env.variable is missing
// REDIS_HOST: z.string().min(1),
// REDIS_PORT: z.string().default("6379")
exports.env = envSchema.parse(process.env);
//# sourceMappingURL=env.js.map