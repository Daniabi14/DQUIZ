import { db } from "../firebase/client";
import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  query,
  where,
  serverTimestamp,
} from "firebase/firestore";
import { LiveGame } from "@/types/game";
import { Question } from "@/types/question";
import { AnswerRecord } from "@/types/answer";
import { evaluateAnswerSubmission } from "../scoring/scoringEngine";
import { getGame } from "./gameService";

export async function submitStudentAnswer(params: {
  gameId: string;
  playerId: string;
  playerName: string;
  playerRollNumber: string;
  question: Question;
  selectedOptionIds: string[];
  clientSubmittedAt: number;
}): Promise<{ success: boolean; message?: string }> {
  const {
    gameId,
    playerId,
    playerName,
    playerRollNumber,
    question,
    selectedOptionIds,
    clientSubmittedAt,
  } = params;

  const game = await getGame(gameId);
  if (!game || game.status !== "QUESTION") {
    return { success: false, message: "Question is not currently active." };
  }

  // Check if player has already submitted for this question
  const answerDocId = `${gameId}_${question.id}_${playerId}`;

  // Evaluate score securely server-side
  const scoreResult = evaluateAnswerSubmission({
    question,
    selectedOptionIds,
    clientSubmittedAt,
    questionStartedAt: game.questionStartedAt || Date.now(),
    questionEndsAt: game.questionEndsAt || Date.now() + 20000,
    settings: game.settings,
  });

  const answerRecord: AnswerRecord = {
    id: answerDocId,
    gameId,
    playerId,
    playerName,
    playerRollNumber,
    questionId: question.id,
    questionOrderNumber: game.currentQuestionIndex + 1,
    selectedOptionIds,
    isCorrect: scoreResult.isCorrect,
    pointsAwarded: scoreResult.pointsAwarded,
    responseTimeMs: scoreResult.responseTimeMs,
    submittedAt: Date.now(),
  };

  // 1. Save in local cache for offline/demo reliability
  if (typeof window !== "undefined") {
    const existingAnswersRaw = localStorage.getItem(`dquiz_answers_${gameId}`);
    const existingAnswers: AnswerRecord[] = existingAnswersRaw
      ? JSON.parse(existingAnswersRaw)
      : [];

    const existingIndex = existingAnswers.findIndex((a) => a.id === answerDocId);
    if (existingIndex >= 0) {
      if (!game.settings.allowAnswerChanges) {
        return { success: false, message: "Answer has already been locked." };
      }
      existingAnswers[existingIndex] = answerRecord;
    } else {
      existingAnswers.push(answerRecord);
    }
    localStorage.setItem(`dquiz_answers_${gameId}`, JSON.stringify(existingAnswers));

    // Update player score locally
    const playersRaw = localStorage.getItem(`dquiz_game_players_${gameId}`);
    if (playersRaw) {
      const players = JSON.parse(playersRaw);
      const pIdx = players.findIndex((p: any) => p.id === playerId);
      if (pIdx >= 0) {
        players[pIdx].score = (players[pIdx].score || 0) + scoreResult.pointsAwarded;
        players[pIdx].hasAnsweredCurrentQuestion = true;
        localStorage.setItem(`dquiz_game_players_${gameId}`, JSON.stringify(players));
      }
    }
  }

  // 2. Save in Firestore
  try {
    const answerRef = doc(db, "games", gameId, "answers", answerDocId);
    await setDoc(answerRef, {
      ...answerRecord,
      submittedAt: serverTimestamp(),
    });
  } catch (err) {
    console.warn("Firestore submitStudentAnswer notice:", err);
  }

  return { success: true };
}

export async function pauseGame(gameId: string): Promise<void> {
  const game = await getGame(gameId);
  if (!game || game.status !== "QUESTION") return;

  const now = Date.now();
  const remainingMs = Math.max(0, (game.questionEndsAt || now) - now);
  const remainingSecs = Math.ceil(remainingMs / 1000);

  const update = {
    status: "PAUSED",
    isPaused: true,
    pausedRemainingSeconds: remainingSecs,
  };

  try {
    await updateDoc(doc(db, "games", gameId), update);
  } catch (err) {
    console.warn("pauseGame firestore notice:", err);
  }

  if (typeof window !== "undefined") {
    const localRaw = localStorage.getItem(`dquiz_game_id_${gameId}`);
    if (localRaw) {
      const g = JSON.parse(localRaw);
      const updated = { ...g, ...update };
      localStorage.setItem(`dquiz_game_id_${gameId}`, JSON.stringify(updated));
      localStorage.setItem(`dquiz_game_${g.gamePin}`, JSON.stringify(updated));
    }
  }
}

export async function resumeGame(gameId: string): Promise<void> {
  const game = await getGame(gameId);
  if (!game || game.status !== "PAUSED") return;

  const remainingSecs = game.pausedRemainingSeconds || 10;
  const now = Date.now();
  const endsAt = now + remainingSecs * 1000;

  const update = {
    status: "QUESTION",
    isPaused: false,
    questionEndsAt: endsAt,
    pausedRemainingSeconds: null,
  };

  try {
    await updateDoc(doc(db, "games", gameId), update);
  } catch (err) {
    console.warn("resumeGame firestore notice:", err);
  }

  if (typeof window !== "undefined") {
    const localRaw = localStorage.getItem(`dquiz_game_id_${gameId}`);
    if (localRaw) {
      const g = JSON.parse(localRaw);
      const updated = { ...g, ...update };
      localStorage.setItem(`dquiz_game_id_${gameId}`, JSON.stringify(updated));
      localStorage.setItem(`dquiz_game_${g.gamePin}`, JSON.stringify(updated));
    }
  }
}

export async function endCurrentQuestion(gameId: string): Promise<void> {
  const update = {
    status: "QUESTION_CLOSED",
  };

  try {
    await updateDoc(doc(db, "games", gameId), update);
  } catch (err) {
    console.warn("endCurrentQuestion firestore notice:", err);
  }

  if (typeof window !== "undefined") {
    const localRaw = localStorage.getItem(`dquiz_game_id_${gameId}`);
    if (localRaw) {
      const g = JSON.parse(localRaw);
      const updated = { ...g, ...update };
      localStorage.setItem(`dquiz_game_id_${gameId}`, JSON.stringify(updated));
      localStorage.setItem(`dquiz_game_${g.gamePin}`, JSON.stringify(updated));
    }
  }
}

export async function advanceToNextQuestion(
  gameId: string,
  questions: Question[]
): Promise<{ finished: boolean }> {
  const game = await getGame(gameId);
  if (!game) return { finished: true };

  const nextIndex = game.currentQuestionIndex + 1;

  if (nextIndex >= game.questionOrder.length) {
    // No more questions, finish game
    await finishGame(gameId);
    return { finished: true };
  }

  const nextQId = game.questionOrder[nextIndex];
  const nextQ = questions.find((q) => q.id === nextQId) || questions[nextIndex];
  const timeLimit = nextQ?.timeLimit || 20;

  const now = Date.now();
  const endsAt = now + timeLimit * 1000;

  const update = {
    status: "QUESTION",
    currentQuestionIndex: nextIndex,
    currentQuestionId: nextQId,
    questionStartedAt: now,
    questionEndsAt: endsAt,
    isPaused: false,
    activeQuestionAnsweredCount: 0,
  };

  try {
    await updateDoc(doc(db, "games", gameId), update);
  } catch (err) {
    console.warn("advanceToNextQuestion firestore notice:", err);
  }

  if (typeof window !== "undefined") {
    const localRaw = localStorage.getItem(`dquiz_game_id_${gameId}`);
    if (localRaw) {
      const g = JSON.parse(localRaw);
      const updated = { ...g, ...update };
      localStorage.setItem(`dquiz_game_id_${gameId}`, JSON.stringify(updated));
      localStorage.setItem(`dquiz_game_${g.gamePin}`, JSON.stringify(updated));
    }
  }

  return { finished: false };
}

export async function finishGame(gameId: string): Promise<void> {
  const update = {
    status: "FINISHED",
    endedAt: Date.now(),
  };

  try {
    await updateDoc(doc(db, "games", gameId), {
      ...update,
      endedAt: serverTimestamp(),
    });
  } catch (err) {
    console.warn("finishGame firestore notice:", err);
  }

  if (typeof window !== "undefined") {
    const localRaw = localStorage.getItem(`dquiz_game_id_${gameId}`);
    if (localRaw) {
      const g = JSON.parse(localRaw);
      const updated = { ...g, ...update };
      localStorage.setItem(`dquiz_game_id_${gameId}`, JSON.stringify(updated));
      localStorage.setItem(`dquiz_game_${g.gamePin}`, JSON.stringify(updated));
    }
  }
}

export async function getQuestionResponses(
  gameId: string,
  questionId: string
): Promise<AnswerRecord[]> {
  try {
    const answersRef = collection(db, "games", gameId, "answers");
    const q = query(answersRef, where("questionId", "==", questionId));
    const snap = await getDocs(q);
    if (!snap.empty) {
      return snap.docs.map((d) => ({ id: d.id, ...d.data() } as AnswerRecord));
    }
  } catch (err) {
    console.warn("Firestore getQuestionResponses notice:", err);
  }

  if (typeof window !== "undefined") {
    const answersRaw = localStorage.getItem(`dquiz_answers_${gameId}`);
    if (answersRaw) {
      const answers: AnswerRecord[] = JSON.parse(answersRaw);
      return answers.filter((a) => a.questionId === questionId);
    }
  }
  return [];
}
