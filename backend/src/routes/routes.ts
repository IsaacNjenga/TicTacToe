import { Router } from "express";
import { AuthRouter } from "../modules/Auth/auth.routes";
import { LogsRouter } from "../modules/Logs/logs.routes";
import { GamesRouter } from "../modules/Games/game.routes";

export function createRoutes(): Router {
  const router = Router();

  router.use("/auth", AuthRouter());
  router.use("/logs", LogsRouter());
  router.use("/games", GamesRouter());

  return router;
}

export const appRouter = createRoutes();
