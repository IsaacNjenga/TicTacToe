"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.connectToDB = connectToDB;
const mongoose_1 = __importDefault(require("mongoose"));
const env_1 = require("./env");
const uri = env_1.env.URI || "";
async function connectToDB() {
    try {
        await mongoose_1.default.connect(uri, {
            serverSelectionTimeoutMS: 5000,
            socketTimeoutMS: 45000,
            connectTimeoutMS: 10000,
            retryWrites: true,
            retryReads: true,
        });
        const database = mongoose_1.default.connection.db;
        if (!database) {
            throw new Error("Database connection is not available");
        }
        console.log("Database connected");
    }
    catch (error) {
        console.error("Database connection failed!:", error);
        process.exit(1); // crash early (important)
    }
}
//# sourceMappingURL=db.js.map