export interface AnswerSubmission {
  gameId: string;
  playerId: string;
  questionId: string;
  selectedOptionIds: string[];
  clientSubmittedAt: number; // epoch ms
}

export interface AnswerRecord {
  id: string;
  gameId: string;
  playerId: string;
  playerName: string;
  playerRollNumber: string;
  questionId: string;
  questionOrderNumber: number;
  selectedOptionIds: string[];
  isCorrect: boolean;
  pointsAwarded: number;
  responseTimeMs: number;
  submittedAt: any;
}
