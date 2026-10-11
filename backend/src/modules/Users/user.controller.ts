import { Response } from "express";
import { BadRequestError } from "../../common/errors/BadRequestError";
import { catchAsync } from "../../common/utils/catchAsync";
import { AuthenticatedRequest } from "../../middleware/auth.middleware";
import { createLog } from "../Logs/logs.service";
import { UserService } from "./user.service";
import { UpdateUserDTO } from "./user.types";

const getUserIdParam = (id: string | string[] | undefined): string => {
  if (!id) {
    throw new BadRequestError("User ID is required");
  }

  return Array.isArray(id) ? id[0] : id;
};

export const fetchUser = catchAsync(
  async (req: AuthenticatedRequest, res: Response) => {
    const users = await UserService.fetchUsers();

    if (req.user?._id) {
      await createLog({
        type: "user",
        refId: req.user._id.toString(),
        action: "fetched",
        title: "Users retrieved",
        description: "User list was fetched",
        refModel: "user",
        actor: req.user?._id,
      });
    }

    res.status(200).json({
      success: true,
      data: users,
      message: "Users retrieved successfully",
    });
  },
);

export const fetchUserById = catchAsync(
  async (req: AuthenticatedRequest, res: Response) => {
    const id = getUserIdParam(req.params.id);

    const user = await UserService.fetchUserById(
      id,
      req.user._id.toString(),
      req.user.role,
    );

    await createLog({
      type: "user",
      refId: id,
      action: "received",
      title: "User profile retrieved",
      description: `Fetched profile for user ${id}`,
      refModel: "user",
      actor: req.user?._id,
    });

    res.status(200).json({
      success: true,
      data: user,
      message: "User retrieved successfully",
    });
  },
);

export const updateUser = catchAsync(
  async (req: AuthenticatedRequest, res: Response) => {
    const id = getUserIdParam(req.params.id);

    const user = await UserService.updateUser(
      id,
      req.body as UpdateUserDTO,
      req.user._id.toString(),
      req.user.role,
    );

    await createLog({
      type: "user",
      refId: id,
      action: "updated",
      title: "User updated",
      description: `Updated profile for user ${id}`,
      refModel: "user",
      actor: req.user?._id,
    });

    res.status(200).json({
      success: true,
      data: user,
      message: "User updated successfully",
    });
  },
);

export const patchUser = updateUser;

export const deleteUser = catchAsync(
  async (req: AuthenticatedRequest, res: Response) => {
    const id = getUserIdParam(req.params.id);

    const user = await UserService.deleteUser(
      id,
      req.user._id.toString(),
      req.user.role,
    );

    await createLog({
      type: "user",
      refId: id,
      action: "deleted",
      title: "User deleted",
      description: `Deleted user ${id}`,
      refModel: "user",
      actor: req.user?._id,
    });

    res.status(200).json({
      success: true,
      data: user,
      message: "User deleted successfully",
    });
  },
);
