"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserService = void 0;
const BadRequestError_1 = require("../../common/errors/BadRequestError");
const user_model_1 = require("./user.model");
const USER_PRIVATE_SELECT = "-password -refreshToken";
const ADMIN_ONLY_FIELDS = new Set(["role"]);
const BLOCKED_UPDATE_FIELDS = new Set([
    "_id",
    "id",
    "password",
    "refreshToken",
]);
const toUser = (user) => user;
const assertUserId = (userId) => {
    if (!userId) {
        throw new BadRequestError_1.BadRequestError("User ID is required");
    }
};
const canManageUser = (targetUserId, requesterId, requesterRole) => targetUserId === requesterId || requesterRole === "SUPER_ADMIN";
const sanitizeUpdateData = (data, requesterRole) => {
    if (!data || Object.keys(data).length === 0) {
        throw new BadRequestError_1.BadRequestError("Update data is required");
    }
    const updateData = { ...data };
    const restrictedFields = Object.keys(updateData).filter((field) => {
        if (BLOCKED_UPDATE_FIELDS.has(field)) {
            return true;
        }
        return requesterRole !== "SUPER_ADMIN" && ADMIN_ONLY_FIELDS.has(field);
    });
    if (restrictedFields.length > 0) {
        throw new BadRequestError_1.BadRequestError(`You cannot update these fields: ${restrictedFields.join(", ")}`);
    }
    return updateData;
};
class UserService {
    static async fetchUsers() {
        const users = await user_model_1.UserModel.find().select(USER_PRIVATE_SELECT).lean();
        return users.map(toUser);
    }
    static async fetchUserById(userId, requesterId, requesterRole) {
        assertUserId(userId);
        if (!canManageUser(userId, requesterId, requesterRole)) {
            throw new BadRequestError_1.BadRequestError("You can only access your own profile");
        }
        const user = await user_model_1.UserModel.findById(userId)
            .select(USER_PRIVATE_SELECT)
            .lean();
        if (!user) {
            throw new BadRequestError_1.BadRequestError("User not found");
        }
        return toUser(user);
    }
    static async updateUser(userId, data, requesterId, requesterRole) {
        assertUserId(userId);
        if (!canManageUser(userId, requesterId, requesterRole)) {
            throw new BadRequestError_1.BadRequestError("You can only update your own profile");
        }
        const updateData = sanitizeUpdateData(data, requesterRole);
        const user = await user_model_1.UserModel.findByIdAndUpdate(userId, updateData, {
            new: true,
            runValidators: true,
        })
            .select(USER_PRIVATE_SELECT)
            .lean();
        if (!user) {
            throw new BadRequestError_1.BadRequestError("User not found");
        }
        return toUser(user);
    }
    static async deleteUser(userId, requesterId, requesterRole) {
        assertUserId(userId);
        if (!canManageUser(userId, requesterId, requesterRole)) {
            throw new BadRequestError_1.BadRequestError("You can only delete your own account");
        }
        const user = await user_model_1.UserModel.findByIdAndDelete(userId)
            .select(USER_PRIVATE_SELECT)
            .lean();
        if (!user) {
            throw new BadRequestError_1.BadRequestError("User not found");
        }
        return toUser(user);
    }
}
exports.UserService = UserService;
//# sourceMappingURL=user.service.js.map