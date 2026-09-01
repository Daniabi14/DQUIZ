import { db } from "../firebase/client";
import {
  collection,
  doc,
  getDocs,
  getDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  serverTimestamp,
} from "firebase/firestore";
import { Quiz } from "@/types/quiz";
import { Question } from "@/types/question";

const DEFAULT_DEMO_QUIZZES: Quiz[] = [];

const DEFAULT_DEMO_QUESTIONS: Record<string, Question[]> = {};

function getLocalQuizzes(): Quiz[] {
  if (typeof window === "undefined") return [];
  const stored = localStorage.getItem("dquiz_local_quizzes");
  if (!stored) {
    localStorage.setItem("dquiz_local_quizzes", JSON.stringify([]));
    return [];
  }
  try {
    return JSON.parse(stored);
  } catch {
    return [];
  }
}

function saveLocalQuizzes(quizzes: Quiz[]) {
  if (typeof window !== "undefined") {
    localStorage.setItem("dquiz_local_quizzes", JSON.stringify(quizzes));
  }
}

function getLocalQuestions(quizId: string): Question[] {
  if (typeof window === "undefined") return DEFAULT_DEMO_QUESTIONS[quizId] || [];
  const stored = localStorage.getItem(`dquiz_local_questions_${quizId}`);
  if (!stored) {
    const defaults = DEFAULT_DEMO_QUESTIONS[quizId] || [];
    if (defaults.length > 0) {
      localStorage.setItem(`dquiz_local_questions_${quizId}`, JSON.stringify(defaults));
    }
    return defaults;
  }
  try {
    return JSON.parse(stored);
  } catch {
    return [];
  }
}

function saveLocalQuestions(quizId: string, questions: Question[]) {
  if (typeof window !== "undefined") {
    localStorage.setItem(`dquiz_local_questions_${quizId}`, JSON.stringify(questions));
  }
}

export async function getQuizzes(hostId?: string): Promise<Quiz[]> {
  try {
    const quizzesRef = collection(db, "quizzes");
    const q = hostId
      ? query(quizzesRef, where("hostId", "==", hostId))
      : quizzesRef;
    const snap = await getDocs(q);
    if (!snap.empty) {
      return snap.docs.map((d) => ({ id: d.id, ...d.data() } as Quiz));
    }
  } catch (err) {
    console.warn("Firestore getQuizzes fallback to local cache:", err);
  }
  const locals = getLocalQuizzes();
  return hostId ? locals.filter((q) => !q.hostId || q.hostId === hostId || q.hostId.startsWith("dev_")) : locals;
}

export async function getQuizById(quizId: string): Promise<Quiz | null> {
  try {
    const quizDocRef = doc(db, "quizzes", quizId);
    const snap = await getDoc(quizDocRef);
    if (snap.exists()) {
      return { id: snap.id, ...snap.data() } as Quiz;
    }
  } catch (err) {
    console.warn("Firestore getQuizById fallback to local cache:", err);
  }
  const locals = getLocalQuizzes();
  return locals.find((q) => q.id === quizId) || null;
}

export async function createQuiz(quizData: Partial<Quiz>): Promise<string> {
  const quizId = `quiz_${Date.now()}`;
  const newQuiz: Quiz = {
    id: quizId,
    hostId: quizData.hostId || "host",
    hostName: quizData.hostName || "Host",
    name: quizData.name || "Untitled Quiz",
    description: quizData.description || "",
    category: quizData.category || "General",
    difficulty: quizData.difficulty || "medium",
    instructions: quizData.instructions || "",
    coverImage: quizData.coverImage || "",
    status: quizData.status || "draft",
    questionCount: 0,
    totalPoints: 0,
    estimatedTimeSeconds: 0,
    createdAt: Date.now(),
  };

  try {
    await setDoc(doc(db, "quizzes", quizId), {
      ...newQuiz,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
  } catch (err) {
    console.warn("Firestore createQuiz fallback to local cache:", err);
  }

  const locals = getLocalQuizzes();
  saveLocalQuizzes([newQuiz, ...locals]);
  return quizId;
}

export async function updateQuiz(quizId: string, data: Partial<Quiz>): Promise<void> {
  try {
    await updateDoc(doc(db, "quizzes", quizId), {
      ...data,
      updatedAt: serverTimestamp(),
    });
  } catch (err) {
    console.warn("Firestore updateQuiz fallback to local cache:", err);
  }

  const locals = getLocalQuizzes();
  const updated = locals.map((q) => (q.id === quizId ? { ...q, ...data } : q));
  saveLocalQuizzes(updated);
}

export async function deleteQuiz(quizId: string): Promise<void> {
  try {
    await deleteDoc(doc(db, "quizzes", quizId));
  } catch (err) {
    console.warn("Firestore deleteQuiz fallback to local cache:", err);
  }

  const locals = getLocalQuizzes();
  saveLocalQuizzes(locals.filter((q) => q.id !== quizId));
  if (typeof window !== "undefined") {
    localStorage.removeItem(`dquiz_local_questions_${quizId}`);
  }
}

export async function duplicateQuiz(quizId: string, hostId: string): Promise<string> {
  const original = await getQuizById(quizId);
  const questions = await getQuestions(quizId);

  const newQuizId = `quiz_${Date.now()}`;
  const duplicated: Quiz = {
    ...original!,
    id: newQuizId,
    name: `${original?.name || "Quiz"} (Copy)`,
    hostId,
    status: "draft",
    createdAt: Date.now(),
  };

  const newQuestions = questions.map((q, idx) => ({
    ...q,
    id: `q_${Date.now()}_${idx}`,
    quizId: newQuizId,
  }));

  const locals = getLocalQuizzes();
  saveLocalQuizzes([duplicated, ...locals]);
  saveLocalQuestions(newQuizId, newQuestions);

  try {
    await setDoc(doc(db, "quizzes", newQuizId), duplicated);
    for (const q of newQuestions) {
      await setDoc(doc(db, "quizzes", newQuizId, "questions", q.id), q);
    }
  } catch (err) {
    console.warn("Firestore duplicateQuiz fallback to local cache:", err);
  }

  return newQuizId;
}

export async function getQuestions(quizId: string): Promise<Question[]> {
  try {
    const qRef = collection(db, "quizzes", quizId, "questions");
    const qSnap = await getDocs(query(qRef, orderBy("orderNumber", "asc")));
    if (!qSnap.empty) {
      return qSnap.docs.map((d) => ({ id: d.id, ...d.data() } as Question));
    }
  } catch (err) {
    console.warn("Firestore getQuestions fallback to local cache:", err);
  }
  return getLocalQuestions(quizId);
}

export async function createQuestion(quizId: string, questionData: Partial<Question>): Promise<string> {
  const existing = await getQuestions(quizId);
  const qId = `q_${Date.now()}`;
  const newQuestion: Question = {
    id: qId,
    quizId,
    orderNumber: existing.length + 1,
    questionText: questionData.questionText || "Untitled Question",
    type: questionData.type || "single_choice",
    imageUrl: questionData.imageUrl || "",
    options: questionData.options || [
      { id: "opt_1", text: "Option A" },
      { id: "opt_2", text: "Option B" },
    ],
    correctOptionIds: questionData.correctOptionIds || ["opt_1"],
    timeLimit: questionData.timeLimit || 20,
    points: questionData.points || 1000,
    explanation: questionData.explanation || "",
    createdAt: Date.now(),
  };

  const updatedQuestions = [...existing, newQuestion];
  saveLocalQuestions(quizId, updatedQuestions);

  // Update Quiz summary metadata
  const totalPoints = updatedQuestions.reduce((sum, q) => sum + (q.points || 0), 0);
  const totalTime = updatedQuestions.reduce((sum, q) => sum + (q.timeLimit || 20), 0);
  await updateQuiz(quizId, {
    questionCount: updatedQuestions.length,
    totalPoints,
    estimatedTimeSeconds: totalTime,
  });

  try {
    await setDoc(doc(db, "quizzes", quizId, "questions", qId), newQuestion);
  } catch (err) {
    console.warn("Firestore createQuestion fallback to local cache:", err);
  }

  return qId;
}

export async function updateQuestion(
  quizId: string,
  questionId: string,
  data: Partial<Question>
): Promise<void> {
  const questions = await getQuestions(quizId);
  const updated = questions.map((q) => (q.id === questionId ? { ...q, ...data } : q));
  saveLocalQuestions(quizId, updated);

  const totalPoints = updated.reduce((sum, q) => sum + (q.points || 0), 0);
  const totalTime = updated.reduce((sum, q) => sum + (q.timeLimit || 20), 0);
  await updateQuiz(quizId, {
    questionCount: updated.length,
    totalPoints,
    estimatedTimeSeconds: totalTime,
  });

  try {
    await updateDoc(doc(db, "quizzes", quizId, "questions", questionId), data);
  } catch (err) {
    console.warn("Firestore updateQuestion fallback to local cache:", err);
  }
}

export async function deleteQuestion(quizId: string, questionId: string): Promise<void> {
  const questions = await getQuestions(quizId);
  const filtered = questions
    .filter((q) => q.id !== questionId)
    .map((q, idx) => ({ ...q, orderNumber: idx + 1 }));

  saveLocalQuestions(quizId, filtered);

  const totalPoints = filtered.reduce((sum, q) => sum + (q.points || 0), 0);
  const totalTime = filtered.reduce((sum, q) => sum + (q.timeLimit || 20), 0);
  await updateQuiz(quizId, {
    questionCount: filtered.length,
    totalPoints,
    estimatedTimeSeconds: totalTime,
  });

  try {
    await deleteDoc(doc(db, "quizzes", quizId, "questions", questionId));
  } catch (err) {
    console.warn("Firestore deleteQuestion fallback to local cache:", err);
  }
}

export async function reorderQuestions(quizId: string, newQuestions: Question[]): Promise<void> {
  const indexed = newQuestions.map((q, idx) => ({ ...q, orderNumber: idx + 1 }));
  saveLocalQuestions(quizId, indexed);

  try {
    for (const q of indexed) {
      await updateDoc(doc(db, "quizzes", quizId, "questions", q.id), {
        orderNumber: q.orderNumber,
      });
    }
  } catch (err) {
    console.warn("Firestore reorderQuestions fallback:", err);
  }
}

export async function getAllHostQuestions(
  hostId?: string
): Promise<{ question: Question; quizName: string; quizCategory: string }[]> {
  const quizzes = await getQuizzes(hostId);
  const results: { question: Question; quizName: string; quizCategory: string }[] = [];

  for (const quiz of quizzes) {
    const questions = await getQuestions(quiz.id);
    for (const q of questions) {
      results.push({
        question: q,
        quizName: quiz.name,
        quizCategory: quiz.category,
      });
    }
  }

  return results;
}
