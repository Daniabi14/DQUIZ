export interface ParticipantReportRow {
  rank: number;
  name: string;
  rollNumber: string;
  score: number;
  correct: number;
  incorrect: number;
  unanswered: number;
  accuracy: string; // e.g. "85%"
}

export interface QuestionReportRow {
  questionNumber: number;
  questionText: string;
  correctCount: number;
  incorrectCount: number;
  unansweredCount: number;
  accuracy: string;
  avgResponseTimeSec: string;
}

export interface ResponseReportRow {
  studentName: string;
  rollNumber: string;
  questionNumber: number;
  questionText: string;
  selectedAnswer: string;
  correctAnswer: string;
  isCorrect: boolean;
  responseTimeSec: string;
  points: number;
}

export interface AttendanceReportRow {
  studentName: string;
  rollNumber: string;
  institution?: string;
  joinedAt: string;
  completed: string;
  connectionStatus: string;
}
