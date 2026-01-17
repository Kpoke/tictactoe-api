import type { Socket } from "socket.io";
import type { Timer } from "../utilities/timer";

export interface ExtendedSocket extends Socket {
  name?: string;
  opponent?: string;
  side?: "X" | "O";
  time?: Timer;
  gameover?: boolean;
}

// Helper to cast socket to ExtendedSocket
export function asExtendedSocket(socket: Socket): ExtendedSocket {
  return socket as ExtendedSocket;
}

export interface SocketPlayData {
  box: string;
  opponentId: string;
}

export interface SocketWinnerData {
  side: "X" | "O";
  opponentId: string;
}

export interface MatchedPayload {
  username: string;
  id: string;
  side: "X" | "O";
  timeObject: {
    user: number;
    opponent: number;
  };
  callback?: () => void;
}
