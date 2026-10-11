import { Router } from "express";
import { protectRoute } from "../../middleware/auth.middleware";
import {
  fetchUser,
  fetchUserById,
  updateUser,
  deleteUser,
} from "./user.controller";

export function UserRouter(): Router {
  const router = Router();

  router.get("/get-users", protectRoute, fetchUser);
  router.get("/get-user/:id", protectRoute, fetchUserById);
  router.put("/update-user/:id", protectRoute, updateUser);
  router.delete("/delete-user/:id", protectRoute, deleteUser);

  return router;
}
