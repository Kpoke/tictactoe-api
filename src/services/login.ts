import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import type { User } from "../types";

const JWT_SECRET = process.env.JWT_SECRET || "";

if (!JWT_SECRET) {
  throw new Error("JWT_SECRET environment variable is required");
}

/**
 * Authenticate user and generate JWT token
 */
export const login = async (loginPassword: string, user: User): Promise<string> => {
  const isValid = await bcrypt.compare(loginPassword, user.password);
  
  if (!isValid) {
    throw new Error("Invalid username or password");
  }

  const token = jwt.sign({ userId: user.id }, JWT_SECRET, {
    expiresIn: "7d",
  });
  
  return token;
};
