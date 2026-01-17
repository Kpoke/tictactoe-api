import dotenv from "dotenv";
dotenv.config();

// Validate environment variables first
import { validateEnv } from "./utils/env";
validateEnv();

import http from "http";
import express from "express";
import { Server as SocketIOServer } from "socket.io";
import cors from "cors";
import helmet from "helmet";
import compression from "compression";
import { routes } from "./api/routes";
import { db, waitForDb } from "./database/connection";
import { logger } from "./utils/logger";
import { requestLogger } from "./middleware/requestLogger";
import { errorHandler, notFoundHandler } from "./middleware/errorHandler";
import { authenticateSocket } from "./socket/auth";
import { SocketHandlers } from "./socket/handlers";
import { resetPlayers } from "./utilities/utils";
import type { ExtendedSocket } from "./types/socket";
import { asExtendedSocket } from "./types/socket";

const app = express();
const server = http.createServer(app);

// CORS configuration
const corsOrigin = process.env.CORS_ORIGIN || (process.env.NODE_ENV === "production" ? false : "*");

const io = new SocketIOServer(server, {
  cors: {
    origin: corsOrigin,
    methods: ["GET", "POST"],
    credentials: true,
  },
  // Socket.io authentication middleware
  auth: async (socket, next) => {
    await authenticateSocket(socket, next);
  },
});

const port = parseInt(process.env.PORT || "8082", 10);

// Security middleware
app.use(helmet());
app.use(compression());

// CORS
app.use(
  cors({
    origin: corsOrigin,
    credentials: true,
  })
);

// Body parsing with size limit
app.use(express.json({ limit: "10kb" }));
app.use(express.urlencoded({ extended: true, limit: "10kb" }));

// Request logging
app.use(requestLogger);

// Routes
routes(app);

// Error handling
app.use(notFoundHandler);
app.use(errorHandler);

// Initialize socket handlers
const socketHandlers = new SocketHandlers(io);

// Global timer interval for checking game timers (only checks active games)
const GAME_TIMER_CHECK_INTERVAL = 1000; // 1 second

const timerInterval = setInterval(() => {
  const activeGames = socketHandlers.getActiveGames();
  // Only check sockets that are in active games
  activeGames.forEach((socketId) => {
    const socket = io.sockets.sockets.get(socketId) as ExtendedSocket | undefined;
    if (!socket) {
      activeGames.delete(socketId);
      return;
    }

    if (socket.opponent && !socket.gameover && socket.time) {
      const opponentSocket = io.sockets.sockets.get(socket.opponent) as ExtendedSocket | undefined;

      if (!opponentSocket) {
        // Opponent disconnected, clean up
        socket.gameover = true;
        socket.opponent = undefined;
        socket.side = undefined;
        if (socket.time) {
          socket.time.destroy();
        }
        activeGames.delete(socketId);
        return;
      }

      // Check if current player's time is up
      if (socket.time.getTime() === 0) {
        const winnerSide = socket.side === "X" ? "O" : "X";
        socket.emit("winner", winnerSide);
        opponentSocket.emit("winner", winnerSide);
        resetPlayers(socket, opponentSocket);
        activeGames.delete(socketId);
        activeGames.delete(socket.opponent);
        return;
      }

      // Check if opponent's time is up
      if (opponentSocket.time && opponentSocket.time.getTime() === 0) {
        const winnerSide = opponentSocket.side === "X" ? "O" : "X";
        socket.emit("winner", winnerSide);
        opponentSocket.emit("winner", winnerSide);
        resetPlayers(socket, opponentSocket);
        activeGames.delete(socketId);
        activeGames.delete(socket.opponent);
      }
    } else {
      // Not in an active game, remove from set
      activeGames.delete(socketId);
    }
  });
}, GAME_TIMER_CHECK_INTERVAL);

io.on("connection", (socket) => {
  const extendedSocket = asExtendedSocket(socket);
  logger.info("New WebSocket connection", { socketId: socket.id });

  extendedSocket.on("winner", (data) => {
    socketHandlers.handleWinner(extendedSocket, data);
  });

  extendedSocket.on("play", (data) => {
    socketHandlers.handlePlay(extendedSocket, data);
  });

  extendedSocket.on("setPlayers", (username: string) => {
    socketHandlers.handleSetPlayers(extendedSocket, username);
  });

  extendedSocket.on("cancel", () => {
    socketHandlers.handleCancel(extendedSocket);
  });

  extendedSocket.on("updateuserpoints", async (token: string) => {
    await socketHandlers.handleUpdatePoints(extendedSocket, token);
  });

  extendedSocket.on("disconnect", () => {
    socketHandlers.handleDisconnect(extendedSocket);
  });
});

// Graceful shutdown - clear intervals
const gracefulShutdown = (signal: string) => {
  logger.info(`${signal} signal received: closing HTTP server`);
  clearInterval(timerInterval);
  server.close(() => {
    logger.info("HTTP server closed");
    db.destroy(() => {
      logger.info("Database connection closed");
      process.exit(0);
    });
  });
};

process.on("SIGTERM", () => gracefulShutdown("SIGTERM"));
process.on("SIGINT", () => gracefulShutdown("SIGINT"));

// Wait for database connection before starting server
waitForDb()
  .then(() => {
    server.listen(port, () => {
      logger.info(`Server is up on port ${port}!`);
    });
  })
  .catch((error) => {
    logger.error("Failed to start server", { error });
    process.exit(1);
  });
