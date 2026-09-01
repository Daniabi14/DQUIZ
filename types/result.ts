export interface PlayerResult {
  playerId: string;
  name: string;
  rollNumber: string;
  rank: number;
  totalScore: number;
  correctAnswersCount: number;
  incorrectAnswersCount: number;
  unansweredCount: number;
  accuracyPercentage: number;
  averageResponseTimeMs: number;
  questionResults: {
    questionId: string;
    questionOrder: number;
    isCorrect: boolean;
    pointsAwarded: number;
    responseTimeMs: number;
  }[];
}

export interface QuizSummaryResult {
  gameId: string;
  quizId: string;
  quizTitle: string;
  hostId: string;
  totalParticipants: number;
  totalQuestions: number;
  highestScore: number;
  averageScore: number;
  averageAccuracy: number;
  highestScorerName?: string;
  endedAt: any;
}
