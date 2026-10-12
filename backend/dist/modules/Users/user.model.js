"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserModel = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
const UserSchema = new mongoose_1.default.Schema({
    username: { type: String, trim: true, default: "" },
    email: {
        type: String,
        trim: true,
        sparse: true,
        unique: true,
    },
    password: {
        type: String,
        required: true,
        select: false,
    },
    avatar: { type: String, default: null },
    countryCode: {
        type: String,
        trim: true,
        uppercase: true,
        match: /^[A-Z]{2}$/,
        default: null,
    },
    isActivated: { type: Boolean, default: false },
    refreshToken: {
        type: String,
        default: null,
        select: false,
    },
}, {
    collection: "users",
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
});
UserSchema.index({ isActivated: 1 });
exports.UserModel = mongoose_1.default.model("User", UserSchema);
//# sourceMappingURL=user.model.js.map