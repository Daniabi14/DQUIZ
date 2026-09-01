export type QuizStatus = "draft" | "published" | "archived";
export type QuizDifficulty = "easy" | "medium" | "hard" | "mixed";

export interface Quiz {
  id: string;
  hostId: string;
  hostName?: string;
  name: string;
  description: string;
  category: string;
  difficulty: QuizDifficulty;
  instructions?: string;
  coverImage?: string;
  status: QuizStatus;
  questionCount: number;
  totalPoints: number;
  estimatedTimeSeconds: number;
  createdAt?: any;
  updatedAt?: any;
}
