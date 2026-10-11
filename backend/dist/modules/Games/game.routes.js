"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GamesRouter = GamesRouter;
const express_1 = require("express");
const auth_middleware_1 = require("../../middleware/auth.middleware");
const game_controller_1 = require("./game.controller");
function GamesRouter() {
    const router = (0, express_1.Router)();
    router.get("/history", auth_middleware_1.protectRoute, game_controller_1.getGameHistory);
    return router;
}
//# sourceMappingURL=game.routes.js.map