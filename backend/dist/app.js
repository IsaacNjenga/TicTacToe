"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const routes_1 = require("./routes/routes");
const env_1 = require("./config/env");
const app = (0, express_1.default)();
const normalizeOrigin = (origin) => origin.trim().replace(/\/$/, "");
const allowedOrigins = [
    "http://localhost:5173",
    ...env_1.env.FRONTEND_URL.split(","),
]
    .map(normalizeOrigin)
    .filter(Boolean);
app.use((0, cors_1.default)({
    origin: (origin, callback) => {
        if (!origin || allowedOrigins.includes(normalizeOrigin(origin))) {
            callback(null, true);
            return;
        }
        callback(null, false);
    },
    credentials: true,
}));
app.use(express_1.default.json());
app.use("/api", routes_1.appRouter);
exports.default = app;
//# sourceMappingURL=app.js.map