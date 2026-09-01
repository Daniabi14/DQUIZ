export type QuestionType = "single_choice" | "true_false" | "multiple_choice";

export interface QuestionOption {
  id: string; // unique ID, e.g. "opt_1", "opt_2" or uuid
  text: string;
}

export interface Question {
  id: string;
  quizId?: string;
  orderNumber: number;
  questionText: string;
  type: QuestionType;
  imageUrl?: string;
  options: QuestionOption[];
  // Secret/Host-only fields:
  correctOptionIds: string[]; // List of option IDs that are correct
  timeLimit: number; // in seconds, default 20
  points: number; // default 1000
  explanation?: string;
  createdAt?: any;
  updatedAt?: any;
}

// Student-safe view of a question during live game (NEVER contains correctOptionIds or explanation)
export interface StudentQuestionView {
  id: string;
  orderNumber: number; // 1-indexed relative to current live session
  totalQuestions: number;
  questionText: string;
  type: QuestionType;
  imageUrl?: string;
  options: QuestionOption[];
  timeLimit: number;
}
