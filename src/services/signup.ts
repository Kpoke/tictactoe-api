import jwt from "jsonwebtoken";
import { UserModel } from "../model/User";
import type { AuthResponse } from "../types";

const JWT_SECRET = process.env.JWT_SECRET || "";

if (!JWT_SECRET) {
  throw new Error("JWT_SECRET environment variable is required");
}

/**
 * Create a new user and generate JWT token
 */
export const signup = async (username: string, password: string): Promise<AuthResponse> => {
  const user = await UserModel.create(username, password);
  const token = jwt.sign({ userId: user.id }, JWT_SECRET, {
    expiresIn: "7d",
  });
  
  return {
    token,
    user: UserModel.toPublic(user),
  };
};
