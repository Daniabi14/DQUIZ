export type GameStatus = "LOBBY" | "QUESTION" | "QUESTION_CLOSED" | "PAUSED" | "FINISHED";

export interface GameSettings {
  shuffleQuestions: boolean;
  shuffleOptions: boolean;
  scoringType: "fixed" | "speed";
  allowAnswerChanges: boolean;
  leaderboardVisibleToHost: boolean;
  antiCheatingMode: boolean;
}

export interface LiveGame {
  id: string;
  gamePin: string;
  quizId: string;
  quizTitle: string;
  hostId: string;
  hostName?: string;
  status: GameStatus;
  
  // Question navigation
  questionOrder: string[]; // array of question IDs
  currentQuestionIndex: number; // 0-indexed into questionOrder
  currentQuestionId: string | null;
  
  // Timing
  questionStartedAt: number | null; // epoch ms
  questionEndsAt: number | null; // epoch ms
  isPaused: boolean;
  pausedRemainingSeconds: number | null;
  
  // Settings & state
  settings: GameSettings;
  isJoiningLocked: boolean;
  totalPlayersCount: number;
  activeQuestionAnsweredCount: number;
  
  createdAt: any;
  startedAt?: any;
  endedAt?: any;
}
