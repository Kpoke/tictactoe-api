export interface User {
  id: string;
  username: string;
  password: string;
  points: number;
  created_at?: Date;
  updated_at?: Date;
}

export interface UserPublic {
  id: string;
  username: string;
  points: number;
  created_at?: Date;
  updated_at?: Date;
}

export interface JWTPayload {
  userId: string;
}

export interface SignupRequest {
  username: string;
  password: string;
}

export interface LoginRequest {
  username: string;
  password: string;
}

export interface AuthResponse {
  token: string;
  user: UserPublic;
}

export interface LeaderboardResponse {
  leaders: UserPublic[];
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
