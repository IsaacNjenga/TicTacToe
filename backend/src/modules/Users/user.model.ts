import mongoose from "mongoose";

const UserSchema = new mongoose.Schema(
  {
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

    isActivated: { type: Boolean, default: false },

    refreshToken: {
      type: String,
      default: null,
      select: false,
    },
  },
  {
    collection: "users",
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  },
);

UserSchema.index({ isActivated: 1 });

export const UserModel = mongoose.model("User", UserSchema);
