import { Router } from "express";
import { protectRoute } from "../../middleware/auth.middleware";
import { getGameHistory } from "./game.controller";

export function GamesRouter(): Router {
  const router = Router();

  router.get("/history", protectRoute, getGameHistory);

  return router;
}
