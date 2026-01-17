import type { Express } from "express";
import { controllers } from "./controller";
import { authRateLimiter, apiRateLimiter } from "../middleware/rateLimiter";
import { validate } from "../middleware/validator";
import { signupSchema, loginSchema } from "../utils/validation";
import { setupSwagger } from "./swagger";
import { asyncHandler } from "../middleware/errorHandler";

export const routes = (app: Express): void => {
  // Setup Swagger documentation programmatically
  setupSwagger(app);

  // Health check endpoint (no rate limiting)
  app.get("/health", asyncHandler(controllers.healthCheck));
  app.get("/api/health", asyncHandler(controllers.healthCheck));

  // Auth endpoints with rate limiting
  app.route("/api/signup").post(authRateLimiter, validate(signupSchema), asyncHandler(controllers.signup));
  app.route("/api/login").post(authRateLimiter, validate(loginSchema), asyncHandler(controllers.login));

  // Leaderboard endpoint with general rate limiting
  app.route("/api/leaderboard").get(apiRateLimiter, asyncHandler(controllers.getLeaderboard));

  // Catch-all for undefined routes
  app.get("*", (_req, res) => {
    res.send({ response: "Seems like you took a wrong turn" });
  });
};
