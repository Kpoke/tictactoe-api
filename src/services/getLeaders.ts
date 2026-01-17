import { UserModel } from "../model/User";
import type { UserPublic } from "../types";

/**
 * Get top 100 users for leaderboard
 */
export const getLeaders = async (): Promise<UserPublic[]> => {
  return await UserModel.getTopUsers(100);
};
