"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.LogsRouter = LogsRouter;
const express_1 = require("express");
const auth_middleware_1 = require("../../middleware/auth.middleware");
const logs_controller_1 = require("./logs.controller");
function LogsRouter() {
    const router = (0, express_1.Router)();
    router.get("/fetch-logs", auth_middleware_1.protectRoute, logs_controller_1.fetchAllLogs);
    return router;
}
//# sourceMappingURL=logs.routes.js.map