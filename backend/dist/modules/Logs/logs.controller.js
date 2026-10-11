"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.fetchAllLogs = exports.create = void 0;
const catchAsync_1 = require("../../common/utils/catchAsync");
const BadRequestError_1 = require("../../common/errors/BadRequestError");
const logs_service_1 = require("./logs.service");
exports.create = (0, catchAsync_1.catchAsync)(async (req, res) => {
    if (!req.body) {
        throw new BadRequestError_1.BadRequestError("Request body is required");
    }
    await (0, logs_service_1.createLog)(req.body);
    res.status(201).json({
        success: true,
    });
});
exports.fetchAllLogs = (0, catchAsync_1.catchAsync)(async (req, res) => {
    const result = await (0, logs_service_1.fetchLogs)(req);
    if (req.user?._id) {
        await (0, logs_service_1.createLog)({
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
});
//# sourceMappingURL=logs.controller.js.map