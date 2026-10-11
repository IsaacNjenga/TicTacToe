import { BadRequestError } from "../../common/errors/BadRequestError";
import { UserModel } from "./user.model";
import { UpdateUserDTO, User } from "./user.types";

const USER_PRIVATE_SELECT = "-password -refreshToken";
const ADMIN_ONLY_FIELDS = new Set(["role"]);
const BLOCKED_UPDATE_FIELDS = new Set([
  "_id",
  "id",
  "password",
  "refreshToken",
]);

const toUser = (user: unknown): User => user as User;

const assertUserId = (userId: string) => {
  if (!userId) {
    throw new BadRequestError("User ID is required");
  }
};

const canManageUser = (
  targetUserId: string,
  requesterId: string,
  requesterRole?: string,
) => targetUserId === requesterId || requesterRole === "SUPER_ADMIN";

const sanitizeUpdateData = (
  data: UpdateUserDTO,
  requesterRole?: string,
): Partial<UpdateUserDTO> => {
  if (!data || Object.keys(data).length === 0) {
    throw new BadRequestError("Update data is required");
  }

  const updateData = { ...data } as Record<string, unknown>;
  const restrictedFields = Object.keys(updateData).filter((field) => {
    if (BLOCKED_UPDATE_FIELDS.has(field)) {
      return true;
    }

    return requesterRole !== "SUPER_ADMIN" && ADMIN_ONLY_FIELDS.has(field);
  });

  if (restrictedFields.length > 0) {
    throw new BadRequestError(
      `You cannot update these fields: ${restrictedFields.join(", ")}`,
    );
  }

  return updateData as Partial<UpdateUserDTO>;
};

export class UserService {
  static async fetchUsers(): Promise<User[]> {
    const users = await UserModel.find().select(USER_PRIVATE_SELECT).lean();

    return users.map(toUser);
  }

  static async fetchUserById(
    userId: string,
    requesterId: string,
    requesterRole?: string,
  ): Promise<User> {
    assertUserId(userId);

    if (!canManageUser(userId, requesterId, requesterRole)) {
      throw new BadRequestError("You can only access your own profile");
    }

    const user = await UserModel.findById(userId)
      .select(USER_PRIVATE_SELECT)
      .lean();

    if (!user) {
      throw new BadRequestError("User not found");
    }

    return toUser(user);
  }

  static async updateUser(
    userId: string,
    data: UpdateUserDTO,
    requesterId: string,
    requesterRole?: string,
  ): Promise<User> {
    assertUserId(userId);

    if (!canManageUser(userId, requesterId, requesterRole)) {
      throw new BadRequestError("You can only update your own profile");
    }

    const updateData = sanitizeUpdateData(data, requesterRole);
    const user = await UserModel.findByIdAndUpdate(userId, updateData, {
      new: true,
      runValidators: true,
    })
      .select(USER_PRIVATE_SELECT)
      .lean();

    if (!user) {
      throw new BadRequestError("User not found");
    }

    return toUser(user);
  }

  static async deleteUser(
    userId: string,
    requesterId: string,
    requesterRole?: string,
  ): Promise<User> {
    assertUserId(userId);

    if (!canManageUser(userId, requesterId, requesterRole)) {
      throw new BadRequestError("You can only delete your own account");
    }

    const user = await UserModel.findByIdAndDelete(userId)
      .select(USER_PRIVATE_SELECT)
      .lean();

    if (!user) {
      throw new BadRequestError("User not found");
    }

    return toUser(user);
  }
}
