"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteUser = exports.patchUser = exports.updateUser = exports.fetchUserById = exports.fetchUser = void 0;
const BadRequestError_1 = require("../../common/errors/BadRequestError");
const catchAsync_1 = require("../../common/utils/catchAsync");
const logs_service_1 = require("../Logs/logs.service");
const user_service_1 = require("./user.service");
const getUserIdParam = (id) => {
    if (!id) {
        throw new BadRequestError_1.BadRequestError("User ID is required");
    }
    return Array.isArray(id) ? id[0] : id;
};
exports.fetchUser = (0, catchAsync_1.catchAsync)(async (req, res) => {
    const users = await user_service_1.UserService.fetchUsers();
    if (req.user?._id) {
        await (0, logs_service_1.createLog)({
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
});
exports.fetchUserById = (0, catchAsync_1.catchAsync)(async (req, res) => {
    const id = getUserIdParam(req.params.id);
    const user = await user_service_1.UserService.fetchUserById(id, req.user._id.toString(), req.user.role);
    await (0, logs_service_1.createLog)({
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
});
exports.updateUser = (0, catchAsync_1.catchAsync)(async (req, res) => {
    const id = getUserIdParam(req.params.id);
    const user = await user_service_1.UserService.updateUser(id, req.body, req.user._id.toString(), req.user.role);
    await (0, logs_service_1.createLog)({
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
});
exports.patchUser = exports.updateUser;
exports.deleteUser = (0, catchAsync_1.catchAsync)(async (req, res) => {
    const id = getUserIdParam(req.params.id);
    const user = await user_service_1.UserService.deleteUser(id, req.user._id.toString(), req.user.role);
    await (0, logs_service_1.createLog)({
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
});
//# sourceMappingURL=user.controller.js.map