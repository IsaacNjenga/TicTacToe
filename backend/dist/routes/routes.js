"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.appRouter = void 0;
exports.createRoutes = createRoutes;
const express_1 = require("express");
const auth_routes_1 = require("../modules/Auth/auth.routes");
const logs_routes_1 = require("../modules/Logs/logs.routes");
const game_routes_1 = require("../modules/Games/game.routes");
const user_routes_1 = require("../modules/Users/user.routes");
function createRoutes() {
    const router = (0, express_1.Router)();
    router.use("/auth", (0, auth_routes_1.AuthRouter)());
    router.use("/logs", (0, logs_routes_1.LogsRouter)());
    router.use("/games", (0, game_routes_1.GamesRouter)());
    router.use("/users", (0, user_routes_1.UserRouter)());
    return router;
}
exports.appRouter = createRoutes();
//# sourceMappingURL=routes.js.map