import type { Request, Response } from "express";
import { checkUser } from "../utilities/checkUser";
import { signup as signupService } from "../services/signup";
import { getLeaders } from "../services/getLeaders";
import { login as loginService } from "../services/login";
import { AppError } from "../middleware/errorHandler";
import { logger } from "../utils/logger";
import { db } from "../database/connection";

export const controllers = {
  signup: async (req: Request, res: Response): Promise<void> => {
    const { username, password } = req.body;

    try {
      const existingUser = await checkUser(username.toLowerCase());
      if (existingUser) {
        throw new AppError("Username already exists", 400);
      }

      const result = await signupService(username.toLowerCase(), password);
      logger.info("User signed up", { username: result.user.username });
      res.status(201).send(result);
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      logger.error("Signup error", { error });
      throw new AppError("Failed to create user", 400);
    }
  },

  login: async (req: Request, res: Response): Promise<void> => {
    const { username, password } = req.body;

    try {
      const user = await checkUser(username.toLowerCase());
      if (!user) {
        throw new AppError("Invalid username or password", 401);
      }

      const token = await loginService(password, user);
      logger.info("User logged in", { username: user.username });
      res.status(200).send({
        token,
        user: {
          id: user.id,
          username: user.username,
          points: user.points,
          created_at: user.created_at,
          updated_at: user.updated_at,
        },
      });
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      logger.error("Login error", { error });
      throw new AppError("Invalid username or password", 401);
    }
  },

  getLeaderboard: async (_req: Request, res: Response): Promise<void> => {
    try {
      const leaders = await getLeaders();
      res.status(200).send({ leaders });
    } catch (error) {
      logger.error("Leaderboard error", { error });
      throw new AppError("Failed to fetch leaderboard", 500);
    }
  },

  healthCheck: async (_req: Request, res: Response): Promise<void> => {
    try {
      // Check database connection
      await db.raw("SELECT 1");
      res.status(200).json({
        status: "healthy",
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        database: "connected",
      });
    } catch (error) {
      logger.error("Health check failed", { error });
      res.status(503).json({
        status: "unhealthy",
        timestamp: new Date().toISOString(),
        database: "disconnected",
      });
    }
  },
};
