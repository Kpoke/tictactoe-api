import { UserModel } from "../model/User";
import type { User } from "../types";

/**
 * Check if a user exists by username
 */
export const checkUser = async (username: string): Promise<User | null> => {
  return await UserModel.findByUsername(username);
};
