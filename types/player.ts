export type ConnectionStatus = "connected" | "disconnected" | "reconnecting";

// Public player view (What host sees in lobby/game)
export interface Player {
  id: string;
  gameId: string;
  name: string;
  rollNumber: string;
  institution?: string;
  department?: string;
  connectionStatus: ConnectionStatus;
  joinedAt: any;
  lastActiveAt?: any;
  hasAnsweredCurrentQuestion: boolean;
  score: number; // Server-authoritative total score (Host only)
  rank?: number; // Host only
}

// Student's local session info
export interface StudentSession {
  playerId: string;
  gameId: string;
  gamePin: string;
  name: string;
  rollNumber: string;
  institution?: string;
  joinedAt: number;
}
