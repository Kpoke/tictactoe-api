import { db } from "../database/connection";
import type { User, UserPublic } from "../types";
import bcrypt from "bcrypt";

const SALT_ROUNDS = 10;

export class UserModel {
  /**
   * Find a user by username
   */
  static async findByUsername(username: string): Promise<User | null> {
    const user = await db<User>("users")
      .where("username", username.toLowerCase().trim())
      .first();
    return user || null;
  }

  /**
   * Find a user by ID
   */
  static async findById(id: string): Promise<User | null> {
    const user = await db<User>("users").where("id", id).first();
    return user || null;
  }

  /**
   * Create a new user
   */
  static async create(username: string, password: string): Promise<User> {
    const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);
    
    const [user] = await db<User>("users")
      .insert({
        username: username.toLowerCase().trim(),
        password: hashedPassword,
        points: 0,
      })
      .returning("*");
    
    return user;
  }

  /**
   * Update user points
   */
  static async addPoints(userId: string, points: number): Promise<void> {
    await db<User>("users")
      .where("id", userId)
      .increment("points", points);
  }

  /**
   * Get top users for leaderboard
   */
  static async getTopUsers(limit: number = 100): Promise<UserPublic[]> {
    const users = await db<User>("users")
      .select("id", "username", "points", "created_at", "updated_at")
      .orderBy("points", "desc")
      .limit(limit);
    
    return users;
  }

  /**
   * Convert user to public format (without password)
   */
  static toPublic(user: User): UserPublic {
    const { password, ...publicUser } = user;
    return publicUser;
  }
}
