"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserRouter = UserRouter;
const express_1 = require("express");
const auth_middleware_1 = require("../../middleware/auth.middleware");
const user_controller_1 = require("./user.controller");
function UserRouter() {
    const router = (0, express_1.Router)();
    router.get("/get-users", auth_middleware_1.protectRoute, user_controller_1.fetchUser);
    router.get("/get-user/:id", auth_middleware_1.protectRoute, user_controller_1.fetchUserById);
    router.put("/update-user/:id", auth_middleware_1.protectRoute, user_controller_1.updateUser);
    router.delete("/delete-user/:id", auth_middleware_1.protectRoute, user_controller_1.deleteUser);
    return router;
}
//# sourceMappingURL=user.routes.js.map