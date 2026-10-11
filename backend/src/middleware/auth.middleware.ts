import jwt, { JwtPayload } from "jsonwebtoken";
import { Request, Response, NextFunction } from "express";
import { env } from "../config/env";
import { BadRequestError } from "../common/errors/BadRequestError";
import { catchAsync } from "../common/utils/catchAsync";
import { UserModel } from "../modules/Users/user.model";

interface JwtPayloadWithUserId extends JwtPayload {
  userId?: string;
}

export interface AuthenticatedRequest extends Request {
  user?: any;
}

export const protectRoute = catchAsync(
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    const token = req.header("Authorization")?.replace("Bearer ", "");
    if (!token) {
      throw new BadRequestError("No token provided. Access denied!");
    }
    try {
      const decoded = jwt.verify(
        token,
        env.JWT_SECRET!,
      ) as JwtPayloadWithUserId;
      if (!decoded || typeof decoded === "string" || !decoded.userId) {
        throw new BadRequestError("Invalid token. Access denied!");
      }
      const user = await UserModel.findById(decoded.userId).select("-password");
      if (!user) {
        throw new BadRequestError("User not found. Access denied!");
      }
      req.user = user;
      next();
    } catch (error) {
      throw new BadRequestError("Invalid token. Access denied!");
    }
  },
);