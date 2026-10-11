import { type Response } from "express";
import { catchAsync } from "../../common/utils/catchAsync";
import { BadRequestError } from "../../common/errors/BadRequestError";
import { AuthenticatedRequest } from "../../middleware/auth.middleware";
import { createLog, fetchLogs } from "./logs.service";

export const create = catchAsync(
  async (req: AuthenticatedRequest, res: Response) => {
    if (!req.body) {
      throw new BadRequestError("Request body is required");
    }

    await createLog(req.body);

    res.status(201).json({
      success: true,
    });
  },
);

export const fetchAllLogs = catchAsync(
  async (req: AuthenticatedRequest, res: Response) => {
    const result = await fetchLogs(req);

    if (req.user?._id) {
      await createLog({
        type: "logs",
        refId: req.user._id.toString(),
        action: "received",
        title: "Logs fetched",
        description: `Admin ${req.user._id} fetched audit logs`,
        refModel: "user",
        actor: req.user._id.toString(),
      });
    }

    res.status(200).json({
      success: true,
      data: result,
      message: "Logs fetched successfully",
    });
  },
);
