import { Router } from "express";
import { protectRoute } from "../../middleware/auth.middleware";
import { fetchAllLogs } from "./logs.controller";

export function LogsRouter(): Router {
  const router = Router();

  router.get("/fetch-logs", protectRoute, fetchAllLogs);
  return router;
}