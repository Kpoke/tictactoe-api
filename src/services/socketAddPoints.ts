import jwt from "jsonwebtoken";
import { UserModel } from "../model/User";
import type { JWTPayload } from "../types";

const JWT_SECRET = process.env.JWT_SECRET || "";

if (!JWT_SECRET) {
  throw new Error("JWT_SECRET environment variable is required");
}

const POINTS_PER_WIN = 3;

/**
 * Add points to user after winning a game
 */
export const socketAddPoints = async (token: string): Promise<void> => {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as JWTPayload;
    const user = await UserModel.findById(decoded.userId);
    
    if (!user) {
      throw new Error("User is not authorized");
    }
    
    await UserModel.addPoints(user.id, POINTS_PER_WIN);
  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError) {
      throw new Error("Invalid token");
    }
    if (error instanceof jwt.TokenExpiredError) {
      throw new Error("Token expired");
    }
    throw error;
  }
};
