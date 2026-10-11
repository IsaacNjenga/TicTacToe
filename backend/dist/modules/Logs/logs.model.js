"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.LogModel = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
const LogSchema = new mongoose_1.default.Schema({
    type: {
        type: String,
        required: true,
    },
    refId: {
        type: mongoose_1.default.Schema.Types.ObjectId,
        required: true,
        refPath: "refModel",
    },
    action: {
        type: String,
        enum: [
            "created",
            "updated",
            "deleted",
            "fetched",
            "sent",
            "received",
            "failed",
            "logged_in",
            "logged_out",
        ],
        required: true,
    },
    title: String,
    description: String,
    refModel: {
        type: String,
        required: true,
        enum: ["user", "otp"],
    },
    actor: {
        type: mongoose_1.default.Schema.Types.ObjectId,
        required: true,
        ref: "User",
    },
}, { collection: "logs", timestamps: true });
exports.LogModel = mongoose_1.default.model("logs", LogSchema);
//# sourceMappingURL=logs.model.js.map