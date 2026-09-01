import { Question } from "@/types/question";
import { GameSettings } from "@/types/game";

export interface ScoreEvaluationResult {
  isCorrect: boolean;
  pointsAwarded: number;
  responseTimeMs: number;
  message?: string;
}

/**
 * Server-authoritative answer scoring.
 * Checks correctness, validates submission deadline, and calculates points based on speed or fixed rules.
 */
export function evaluateAnswerSubmission(params: {
  question: Question;
  selectedOptionIds: string[];
  clientSubmittedAt: number;
  questionStartedAt: number;
  questionEndsAt: number;
  settings: GameSettings;
}): ScoreEvaluationResult {
  const {
    question,
    selectedOptionIds,
    clientSubmittedAt,
    questionStartedAt,
    questionEndsAt,
    settings,
  } = params;

  const now = Date.now();
  // Server-authoritative time check (allow a small 1500ms network buffer if Anti-Cheating is relaxed, but strict if on)
  const gracePeriodMs = settings.antiCheatingMode ? 1000 : 2500;

  if (now > questionEndsAt + gracePeriodMs) {
    return {
      isCorrect: false,
      pointsAwarded: 0,
      responseTimeMs: Math.max(0, questionEndsAt - questionStartedAt),
      message: "Submission received after deadline.",
    };
  }

  // Response time calculation (ms from question start to submission)
  const responseTimeMs = Math.max(0, Math.min(now - questionStartedAt, questionEndsAt - questionStartedAt));
  const totalDurationMs = Math.max(1000, questionEndsAt - questionStartedAt);

  // Evaluate correctness: Selected options must match correctOptionIds exactly
  const correctSet = new Set(question.correctOptionIds);
  const isCorrect =
    selectedOptionIds.length === question.correctOptionIds.length &&
    selectedOptionIds.every((id) => correctSet.has(id));

  if (!isCorrect) {
    return {
      isCorrect: false,
      pointsAwarded: 0,
      responseTimeMs,
    };
  }

  const basePoints = question.points || 1000;

  if (settings.scoringType === "fixed") {
    return {
      isCorrect: true,
      pointsAwarded: basePoints,
      responseTimeMs,
    };
  }

  // Speed-based scoring formula:
  // Award between 50% and 100% of base points proportional to time remaining
  const timeRemainingMs = Math.max(0, questionEndsAt - now);
  const speedMultiplier = 0.5 + 0.5 * (timeRemainingMs / totalDurationMs);
  const pointsAwarded = Math.round(basePoints * speedMultiplier);

  return {
    isCorrect: true,
    pointsAwarded,
    responseTimeMs,
  };
}
