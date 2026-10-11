import { Router } from "express";
import {
  requestPasswordResetOtpController,
  resetPasswordController,
  userLoginController,
  verifyPasswordResetOtpController,
  changePasswordController,
  activateAccountController,
  userRegisterController,
  //   checkEmailExists,
  //   checkUsernameExists,
} from "./auth.controller";

export function AuthRouter(): Router {
  const router = Router();

  router.post("/sign-up", userRegisterController);
  router.post("/activate-account", activateAccountController);
  router.post("/sign-in", userLoginController);
  router.post("/change-password", changePasswordController);
  router.post("/password-reset/request-otp", requestPasswordResetOtpController);
  router.post("/password-reset/verify-otp", verifyPasswordResetOtpController);
  router.post("/password-reset/reset", resetPasswordController);
  //   router.get("/check-username", checkUsernameExists);
  //   router.get("/check-email", checkEmailExists);

  return router;
}
