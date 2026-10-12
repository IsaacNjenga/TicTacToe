import { Router } from "express";
import { AuthRouter } from "../modules/Auth/auth.routes";
import { LogsRouter } from "../modules/Logs/logs.routes";
import { GamesRouter } from "../modules/Games/game.routes";
import { UserRouter } from "../modules/Users/user.routes";

export function createRoutes(): Router {
  const router = Router();

  router.use("/auth", AuthRouter());
  router.use("/logs", LogsRouter());
  router.use("/games", GamesRouter());
  router.use("/users", UserRouter());

  return router;
}

export const appRouter = createRoutes();
