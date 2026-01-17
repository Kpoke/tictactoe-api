import jwt from "jsonwebtoken";
import type { Socket } from "socket.io";
import { UserModel } from "../model/User";
import type { JWTPayload } from "../types";
import { logger } from "../utils/logger";

const JWT_SECRET = process.env.JWT_SECRET || "";

if (!JWT_SECRET) {
  throw new Error("JWT_SECRET environment variable is required");
}

/**
 * Authenticate socket connection using JWT token
 */
export const authenticateSocket = async (socket: Socket, next: (err?: Error) => void): Promise<void> => {
  try {
    const token = socket.handshake.auth.token || socket.handshake.headers.authorization?.replace("Bearer ", "");

    if (!token) {
      logger.warn("Socket connection attempted without token", { socketId: socket.id });
      return next(new Error("Authentication token required"));
    }

    const decoded = jwt.verify(token, JWT_SECRET) as JWTPayload;
    const user = await UserModel.findById(decoded.userId);

    if (!user) {
      logger.warn("Socket connection with invalid user", { socketId: socket.id, userId: decoded.userId });
      return next(new Error("User not found"));
    }

    // Attach user info to socket
    (socket as any).user = {
      id: user.id,
      username: user.username,
      points: user.points,
    };

    logger.info("Socket authenticated", { socketId: socket.id, username: user.username });
    next();
  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError) {
      logger.warn("Socket connection with invalid token", { socketId: socket.id });
      return next(new Error("Invalid token"));
    }
    if (error instanceof jwt.TokenExpiredError) {
      logger.warn("Socket connection with expired token", { socketId: socket.id });
      return next(new Error("Token expired"));
    }
    logger.error("Socket authentication error", { error, socketId: socket.id });
    next(new Error("Authentication failed"));
  }
};
