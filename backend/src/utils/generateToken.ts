import jwt from "jsonwebtoken";
import { env } from "../config/env";

export const generateTokens = (
  userId: string,
): { accessToken: string; refreshToken: string } => {
  const accessToken = jwt.sign({ userId }, env.JWT_SECRET!, {
    expiresIn: "7d",
  });
  const refreshToken = jwt.sign({ userId }, env.JWT_SECRET!, {
    expiresIn: "10d",
  });
  return {
    accessToken: accessToken,
    refreshToken: refreshToken,
  };
};