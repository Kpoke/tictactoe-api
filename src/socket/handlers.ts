import type { Server, Socket } from "socket.io";
import { getOpponent, chooseSides, resetPlayers } from "../utilities/utils";
import { Timer } from "../utilities/timer";
import { socketAddPoints } from "../services/socketAddPoints";
import { logger } from "../utils/logger";
import { socketPlaySchema, socketWinnerSchema } from "../utils/validation";
import type { ExtendedSocket, SocketPlayData, SocketWinnerData, MatchedPayload } from "../types/socket";
import { asExtendedSocket } from "../types/socket";

/**
 * Socket event handlers
 */
export class SocketHandlers {
  private io: Server;
  private activeGames: Set<string>;
  private matchmakingLock: Set<string>;
  private gamePointsAdded: Map<string, Map<string, boolean>>;

  constructor(io: Server) {
    this.io = io;
    this.activeGames = new Set<string>();
    this.matchmakingLock = new Set<string>();
    this.gamePointsAdded = new Map<string, Map<string, boolean>>();
  }

  /**
   * Get active games set (for timer checking)
   */
  getActiveGames(): Set<string> {
    return this.activeGames;
  }

  /**
   * Handle winner event
   */
  handleWinner(socket: ExtendedSocket, data: SocketWinnerData): void {
    try {
      // Validate data
      socketWinnerSchema.parse(data);

      const opponentSocket = this.io.sockets.sockets.get(data.opponentId) as ExtendedSocket | undefined;

      if (opponentSocket && !socket.gameover) {
        resetPlayers(socket, opponentSocket);
        opponentSocket.emit("winner", data.side);
        this.activeGames.delete(socket.id);
        this.activeGames.delete(data.opponentId);
        logger.info("Game ended - winner declared", {
          socketId: socket.id,
          winner: data.side,
        });
      }
    } catch (error) {
      logger.error("Error handling winner event", { error, socketId: socket.id });
      socket.emit("an error", "Invalid winner data");
    }
  }

  /**
   * Handle play event
   */
  handlePlay(socket: ExtendedSocket, data: SocketPlayData): void {
    try {
      // Validate data
      socketPlaySchema.parse(data);

      // Validate game state
      if (socket.gameover || !socket.opponent || socket.opponent !== data.opponentId) {
        socket.emit("an error", "Invalid game state");
        return;
      }

      const opponentSocket = this.io.sockets.sockets.get(data.opponentId) as ExtendedSocket | undefined;

      if (!opponentSocket) {
        socket.emit("an error", "Opponent not found");
        return;
      }

      // Pause current player's timer and get time BEFORE starting opponent's timer
      const currentPlayerTime = socket.time?.getTime() || 0;
      if (socket.time) {
        socket.time.pause();
      }

      // Start opponent's timer and get time AFTER starting
      if (opponentSocket.time) {
        opponentSocket.time.start();
      }
      const opponentTime = opponentSocket.time?.getTime() || 0;

      // Send play event to opponent with correct time values
      opponentSocket.emit("play", {
        box: data.box,
        timeObject: {
          user: opponentTime,
          opponent: currentPlayerTime,
        },
      });

      logger.debug("Move played", {
        socketId: socket.id,
        box: data.box,
      });
    } catch (error) {
      logger.error("Error handling play event", { error, socketId: socket.id });
      socket.emit("an error", "Invalid play data");
    }
  }

  /**
   * Handle setPlayers event (matchmaking)
   */
  handleSetPlayers(socket: ExtendedSocket, username: string): void {
    // Prevent joining multiple games
    if (socket.opponent) {
      socket.emit("an error", "Already in a game");
      return;
    }

    // Prevent race condition: check if already in matchmaking
    if (this.matchmakingLock.has(socket.id)) {
      return;
    }

    this.matchmakingLock.add(socket.id);
    socket.name = username;
    socket.time = new Timer(30);
    socket.gameover = false;

    socket.join("waiting");
    logger.info("Player joined waiting room", { socketId: socket.id, username });

    this.io
      .in("waiting")
      .fetchSockets()
      .then((clients) => {
        // Remove from lock when done
        this.matchmakingLock.delete(socket.id);

        // Double-check socket is still valid and not in a game
        if (socket.opponent) {
          socket.leave("waiting");
          return;
        }

        const clientIds = clients.map((client) => client.id);
        const opponentId = getOpponent(socket, clientIds, this.io);

        if (opponentId) {
          const opponentSocket = this.io.sockets.sockets.get(opponentId) as ExtendedSocket | undefined;

          // Validate opponent is still available
          if (!opponentSocket || opponentSocket.opponent || this.matchmakingLock.has(opponentId)) {
            this.matchmakingLock.delete(socket.id);
            return;
          }

          // Lock opponent to prevent double matching
          this.matchmakingLock.add(opponentId);

          opponentSocket.leave("waiting");
          socket.leave("waiting");

          socket.opponent = opponentId;
          opponentSocket.opponent = socket.id;

          const { side1, side2 } = chooseSides();

          // Set sides and initial times
          socket.side = side1;
          opponentSocket.side = side2;

          // X player gets 34 seconds, O gets 30
          if (side1 === "X") {
            socket.time?.setTime(34);
            socket.time?.start();
          } else {
            socket.time?.setTime(30);
            socket.time?.start();
          }

          if (side2 === "X") {
            opponentSocket.time?.setTime(34);
            opponentSocket.time?.start();
          } else {
            opponentSocket.time?.setTime(30);
            opponentSocket.time?.start();
          }

          // Add both to active games set
          this.activeGames.add(socket.id);
          this.activeGames.add(opponentId);

          // Release locks
          this.matchmakingLock.delete(socket.id);
          this.matchmakingLock.delete(opponentId);

          // Get time values after starting timers
          const socketTime = socket.time?.getTime() || 0;
          const opponentTime = opponentSocket.time?.getTime() || 0;

          // Emit matched event to opponent
          const opponentPayload: MatchedPayload = {
            username: socket.name || "",
            id: socket.id,
            side: side1,
            timeObject: {
              opponent: socketTime,
              user: opponentTime,
            },
          };

          opponentSocket.emit("matched", opponentPayload);

          // Emit matched event to current socket
          const currentPayload: MatchedPayload = {
            username: opponentSocket.name || "",
            id: opponentId,
            side: side2,
            timeObject: {
              user: socketTime,
              opponent: opponentTime,
            },
          };

          socket.emit("matched", currentPayload);

          logger.info("Players matched", {
            socket1: socket.id,
            socket2: opponentId,
            side1,
            side2,
          });
        } else {
          // No opponent found, release lock
          this.matchmakingLock.delete(socket.id);
        }
      })
      .catch((error) => {
        logger.error("Error in matchmaking", { error, socketId: socket.id });
        this.matchmakingLock.delete(socket.id);
        socket.leave("waiting");
      });
  }

  /**
   * Handle cancel event
   */
  handleCancel(socket: ExtendedSocket): void {
    socket.leave("waiting");
    this.matchmakingLock.delete(socket.id);
    logger.info("Player cancelled matchmaking", { socketId: socket.id });
  }

  /**
   * Handle updateuserpoints event
   */
  async handleUpdatePoints(socket: ExtendedSocket, token: string): Promise<void> {
    // Prevent duplicate point additions for the same game
    const gameKey = `${socket.id}-${socket.opponent || "none"}`;
    const socketPoints = this.gamePointsAdded.get(socket.id) || new Map<string, boolean>();

    if (socketPoints.get(gameKey)) {
      socket.emit("an error", "Points already added for this game");
      return;
    }

    try {
      await socketAddPoints(token);
      socketPoints.set(gameKey, true);
      this.gamePointsAdded.set(socket.id, socketPoints);
      socket.emit("updated");
      logger.info("Points updated", { socketId: socket.id });
    } catch (error) {
      const message = error instanceof Error ? error.message : "An error occurred";
      socket.emit("an error", message);
      logger.error("Error updating points", { error, socketId: socket.id });
    }
  }

  /**
   * Handle disconnect event
   */
  handleDisconnect(socket: ExtendedSocket): void {
    const opponentId = socket.opponent;

    if (!socket.gameover && opponentId) {
      const opponentSocket = this.io.sockets.sockets.get(opponentId) as ExtendedSocket | undefined;

      if (opponentSocket) {
        const winnerSide = socket.side === "X" ? "O" : "X";
        opponentSocket.emit("winner", winnerSide);
        resetPlayers(socket, opponentSocket);
        this.activeGames.delete(socket.id);
        this.activeGames.delete(opponentId);
        logger.info("Player disconnected during game", {
          socketId: socket.id,
          opponentId,
        });
      }
    }

    // Clean up timer
    if (socket.time) {
      socket.time.destroy();
    }

    // Clean up matchmaking lock
    this.matchmakingLock.delete(socket.id);
    this.activeGames.delete(socket.id);
    this.gamePointsAdded.delete(socket.id);

    logger.info("Client disconnected", { socketId: socket.id });
  }
}
