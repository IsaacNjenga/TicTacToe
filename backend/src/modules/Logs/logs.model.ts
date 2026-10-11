import mongoose from "mongoose";

const LogSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      required: true,
    },
    refId: {
      type: mongoose.Schema.Types.ObjectId,
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
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: "User",
    },
  },
  { collection: "logs", timestamps: true },
);

export const LogModel = mongoose.model("logs", LogSchema);
