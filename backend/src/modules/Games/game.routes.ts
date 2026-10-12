import { Router } from "express";
import { protectRoute } from "../../middleware/auth.middleware";
import { getGameHistory, getLeaderboard } from "./game.controller";

export function GamesRouter(): Router {
  const router = Router();

  router.get("/history", protectRoute, getGameHistory);
  router.get("/leaderboard", protectRoute, getLeaderboard);

  return router;
}
