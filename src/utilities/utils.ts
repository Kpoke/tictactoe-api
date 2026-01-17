import type { Server, Socket } from "socket.io";
import type { Timer } from "./timer";

interface ExtendedSocket extends Socket {
  name?: string;
  opponent?: string;
  side?: "X" | "O";
  time?: Timer;
  gameover?: boolean;
}

/**
 * Get an available opponent from the waiting room
 */
export const getOpponent = (
  socket: ExtendedSocket,
  allPlayers: string[],
  io: Server
): string | null => {
  const availablePlayers = allPlayers.filter((clientId) => {
    if (clientId === socket.id) return false;
    
    const opponentSocket = io.sockets.sockets.get(clientId) as ExtendedSocket | undefined;
    if (!opponentSocket) return false;
    
    // Don't match with same username
    if (socket.name && opponentSocket.name === socket.name) return false;
    
    return true;
  });

  if (availablePlayers.length > 0) {
    return availablePlayers[Math.floor(Math.random() * availablePlayers.length)];
  }
  
  return null;
};

/**
 * Randomly assign sides to players
 */
export const chooseSides = (): { side1: "X" | "O"; side2: "X" | "O" } => {
  const sideArray: ("X" | "O")[] = ["X", "O"];
  const random = Math.floor(Math.random() * 2);
  const side1 = sideArray[random];
  const side2 = sideArray[1 - random];
  return { side1, side2 };
};

/**
 * Reset game state for both players
 */
export const resetPlayers = (socket1: ExtendedSocket, socket2: ExtendedSocket): void => {
  socket1.gameover = true;
  socket2.gameover = true;
  socket1.opponent = undefined;
  socket2.opponent = undefined;
  socket1.side = undefined;
  socket2.side = undefined;
  
  if (socket1.time) {
    socket1.time.destroy();
  }
  if (socket2.time) {
    socket2.time.destroy();
  }
};
