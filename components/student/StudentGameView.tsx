"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { useGame } from "@/hooks/useGame";
import { useTimer } from "@/hooks/useTimer";
import { StudentSession } from "@/types/player";
import { Question, QuestionOption } from "@/types/question";
import { getQuestions } from "@/lib/game/quizService";
import { submitStudentAnswer } from "@/lib/game/liveGameEngine";
import { shuffleOptions } from "@/lib/shuffle/fisherYates";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import {
  Gamepad2,
  Lock,
  Timer,
  Sparkles,
  Wifi,
  WifiOff,
  Clock,
  Loader2,
  ShieldCheck,
  PauseCircle,
  CheckCircle,
  Award,
} from "lucide-react";

export function StudentGameView() {
  const params = useParams();
  const gameId = params.id as string;
  const router = useRouter();

  const { game, loading } = useGame(gameId);

  const [session, setSession] = useState<StudentSession | null>(null);
  const [sessionLoaded, setSessionLoaded] = useState(false);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [isOnline, setIsOnline] = useState(true);

  // Student answer state for current question
  const [selectedOptionIds, setSelectedOptionIds] = useState<string[]>([]);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [shuffledCurrentOptions, setShuffledCurrentOptions] = useState<QuestionOption[]>([]);
  const [lastAnsweredQId, setLastAnsweredQId] = useState<string | null>(null);

  // Load session from storage
  useEffect(() => {
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem("dquiz_student_session");
      if (stored) {
        try {
          const parsed = JSON.parse(stored);
          setSession(parsed);
        } catch {
          // ignore
        }
      }
      setSessionLoaded(true);

      const handleOnline = () => setIsOnline(true);
      const handleOffline = () => setIsOnline(false);
      window.addEventListener("online", handleOnline);
      window.addEventListener("offline", handleOffline);

      return () => {
        window.removeEventListener("online", handleOnline);
        window.removeEventListener("offline", handleOffline);
      };
    }
  }, []);

  // Fetch questions
  useEffect(() => {
    async function loadQuizQuestions() {
      if (game?.quizId) {
        const qs = await getQuestions(game.quizId);
        setQuestions(qs);
      }
    }
    loadQuizQuestions();
  }, [game?.quizId]);

  // Current active question
  const currentQuestion = questions.find((q) => q.id === game?.currentQuestionId);
  const totalQuestionsCount = game?.questionOrder?.length || questions.length || 1;
  const currentQuestionNumber = (game?.currentQuestionIndex || 0) + 1;

  // Live Timer
  const { secondsRemaining, isTimeUp } = useTimer(
    game?.questionEndsAt || null,
    game?.isPaused || game?.status === "PAUSED"
  );

  // Handle per-question option randomization and reset
  useEffect(() => {
    if (currentQuestion && currentQuestion.id !== lastAnsweredQId) {
      let alreadyAnswered = false;
      if (typeof window !== "undefined") {
        const answersRaw = localStorage.getItem(`dquiz_answers_${gameId}`);
        if (answersRaw) {
          const answers = JSON.parse(answersRaw);
          const found = answers.find(
            (a: any) =>
              a.questionId === currentQuestion.id &&
              a.playerId === session?.playerId
          );
          if (found) {
            setSelectedOptionIds(found.selectedOptionIds || []);
            setIsSubmitted(true);
            alreadyAnswered = true;
          }
        }
      }

      if (!alreadyAnswered) {
        setSelectedOptionIds([]);
        setIsSubmitted(false);
      }

      if (game?.settings?.shuffleOptions && currentQuestion.type !== "true_false") {
        setShuffledCurrentOptions(shuffleOptions(currentQuestion.options));
      } else {
        setShuffledCurrentOptions(currentQuestion.options);
      }

      setLastAnsweredQId(currentQuestion.id);
    }
  }, [currentQuestion?.id, game?.settings?.shuffleOptions, session?.playerId]);

  const handleSelectOption = async (optionId: string) => {
    if (isSubmitted || !currentQuestion || !session || !game || game.status !== "QUESTION") return;

    let nextSelection = [optionId];
    if (currentQuestion.type === "multiple_choice") {
      if (selectedOptionIds.includes(optionId)) {
        nextSelection = selectedOptionIds.filter((id) => id !== optionId);
      } else {
        nextSelection = [...selectedOptionIds, optionId];
      }
      setSelectedOptionIds(nextSelection);
      return;
    }

    setSelectedOptionIds([optionId]);
    setIsSubmitted(true);

    await submitStudentAnswer({
      gameId: game.id,
      playerId: session.playerId,
      playerName: session.name,
      playerRollNumber: session.rollNumber,
      question: currentQuestion,
      selectedOptionIds: [optionId],
      clientSubmittedAt: Date.now(),
    });
  };

  const handleMultipleChoiceSubmit = async () => {
    if (isSubmitted || !currentQuestion || !session || !game || selectedOptionIds.length === 0) return;

    setIsSubmitted(true);

    await submitStudentAnswer({
      gameId: game.id,
      playerId: session.playerId,
      playerName: session.name,
      playerRollNumber: session.rollNumber,
      question: currentQuestion,
      selectedOptionIds,
      clientSubmittedAt: Date.now(),
    });
  };

  if (loading || !sessionLoaded) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-8 space-y-4 min-h-[70vh]">
        <Loader2 className="w-10 h-10 text-brand-400 animate-spin" />
        <p className="text-sm font-medium text-slate-400">Connecting to live quiz session...</p>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="flex-1 flex items-center justify-center p-4">
        <Card variant="glass" className="p-8 max-w-md w-full text-center space-y-4 border-slate-800">
          <Gamepad2 className="w-12 h-12 text-brand-400 mx-auto" />
          <h2 className="text-xl font-bold text-white">Join Session First</h2>
          <p className="text-xs text-slate-400">
            You need to enter your Name and Roll Number before participating in this live quiz.
          </p>
          <Button
            size="lg"
            className="w-full"
            onClick={() => router.push(`/join${game?.gamePin ? `?pin=${game.gamePin}` : ""}`)}
          >
            Go to Join Screen
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col items-center justify-between p-4 sm:p-6 max-w-xl mx-auto w-full min-h-[calc(100vh-4rem)]">
      {/* Top Status Bar */}
      <div className="w-full flex items-center justify-between py-2 px-3.5 bg-slate-900/80 border border-slate-800 rounded-2xl mb-4 backdrop-blur-md shadow-md">
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
          <span className="text-xs font-mono font-bold text-brand-300">
            PIN: {game?.gamePin || session.gamePin}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-slate-300 truncate max-w-[120px]">
            {session.name}
          </span>
          <span className="text-slate-600">•</span>
          {isOnline ? (
            <span className="flex items-center gap-1 text-[11px] font-semibold text-emerald-400">
              <Wifi className="w-3.5 h-3.5" />
            </span>
          ) : (
            <span className="flex items-center gap-1 text-[11px] font-semibold text-rose-400">
              <WifiOff className="w-3.5 h-3.5" />
            </span>
          )}
        </div>
      </div>

      {/* Main Content Area */}
      <div className="w-full flex-1 flex flex-col items-center justify-center">
        <AnimatePresence mode="wait">
          {/* 1. LOBBY WAITING ROOM */}
          {(!game || game.status === "LOBBY") && (
            <motion.div
              key="lobby"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full text-center space-y-6"
            >
              <div className="w-20 h-20 rounded-3xl bg-brand-600/20 border-2 border-brand-500/40 flex items-center justify-center mx-auto text-brand-400 shadow-2xl shadow-brand-500/20">
                <Sparkles className="w-10 h-10 animate-pulse" />
              </div>

              <div className="space-y-2">
                <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight font-display">
                  YOU'RE IN!
                </h1>
                <p className="text-xl font-bold text-brand-300">{session.name}</p>
              </div>

              <Card variant="glass" className="p-6 border-slate-800 max-w-sm mx-auto space-y-3 shadow-xl">
                <div className="space-y-1">
                  <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                    Roll Number / Participant ID
                  </span>
                  <p className="text-lg font-mono font-bold text-white tracking-wide">
                    {session.rollNumber}
                  </p>
                </div>
                {session.institution && (
                  <div className="pt-2 border-t border-slate-800 text-xs text-slate-400">
                    <span>{session.institution}</span>
                  </div>
                )}
              </Card>

              <div className="pt-4 flex items-center justify-center gap-2 text-slate-400 text-sm font-medium">
                <Clock className="w-4 h-4 animate-spin text-brand-400" />
                <span>Waiting for the host to start...</span>
              </div>
            </motion.div>
          )}

          {/* 2. LIVE QUESTION SCREEN */}
          {game && game.status === "QUESTION" && currentQuestion && (
            <motion.div
              key={`q_${currentQuestion.id}`}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.25 }}
              className="w-full space-y-5"
            >
              <div className="flex items-center justify-between pb-2">
                <Badge variant="primary" size="md" className="font-mono px-3 py-1 font-bold">
                  QUESTION {currentQuestionNumber} / {totalQuestionsCount}
                </Badge>

                <div
                  className={`flex items-center gap-1.5 px-3.5 py-1 rounded-full font-mono font-bold text-sm border transition-colors ${
                    secondsRemaining <= 5
                      ? "bg-rose-950/60 border-rose-500/50 text-rose-300 animate-pulse"
                      : "bg-slate-900 border-slate-800 text-amber-300"
                  }`}
                >
                  <Timer className="w-4 h-4" />
                  <span>{secondsRemaining}s</span>
                </div>
              </div>

              <div className="text-center py-3 px-2">
                <h2 className="text-xl sm:text-2xl font-bold text-white leading-snug tracking-tight">
                  {currentQuestion.questionText}
                </h2>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                {(shuffledCurrentOptions.length > 0
                  ? shuffledCurrentOptions
                  : currentQuestion.options
                ).map((opt, idx) => {
                  const isSelected = selectedOptionIds.includes(opt.id);
                  const letter = String.fromCharCode(65 + idx);

                  return (
                    <button
                      key={opt.id}
                      disabled={isSubmitted || secondsRemaining === 0}
                      onClick={() => handleSelectOption(opt.id)}
                      className={`p-4 rounded-2xl text-left border font-semibold text-sm transition-all flex items-center gap-3 active:scale-95 ${
                        isSelected
                          ? "bg-brand-600 border-brand-400 text-white shadow-xl shadow-brand-600/30 scale-[1.01]"
                          : isSubmitted || secondsRemaining === 0
                          ? "bg-slate-900/30 border-slate-800/40 text-slate-500 cursor-not-allowed"
                          : "bg-slate-900/90 border-slate-800 text-slate-100 hover:border-slate-700 hover:bg-slate-800/90"
                      }`}
                    >
                      <span className="w-8 h-8 rounded-xl bg-slate-800 flex items-center justify-center text-xs font-bold text-slate-300 shrink-0">
                        {letter}
                      </span>
                      <span className="flex-1 leading-snug">{opt.text}</span>
                    </button>
                  );
                })}
              </div>

              {currentQuestion.type === "multiple_choice" && !isSubmitted && (
                <div className="pt-2">
                  <Button
                    size="lg"
                    disabled={selectedOptionIds.length === 0}
                    onClick={handleMultipleChoiceSubmit}
                    className="w-full font-bold shadow-lg shadow-brand-600/25"
                  >
                    Submit Answer Selection ({selectedOptionIds.length})
                  </Button>
                </div>
              )}

              {isSubmitted && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="p-4 bg-slate-900/95 border-2 border-brand-500/30 rounded-2xl text-center space-y-1 shadow-xl"
                >
                  <div className="flex items-center justify-center gap-2 text-brand-400 font-bold text-sm">
                    <Lock className="w-4 h-4" />
                    <span>ANSWER SUBMITTED</span>
                  </div>
                  <p className="text-xs text-slate-400 font-medium">
                    Waiting for the question to end...
                  </p>
                </motion.div>
              )}
            </motion.div>
          )}

          {/* 3. QUIZ PAUSED BANNER */}
          {game && game.status === "PAUSED" && (
            <motion.div
              key="paused"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full text-center space-y-4 p-8 bg-amber-950/20 border-2 border-amber-500/30 rounded-3xl"
            >
              <PauseCircle className="w-14 h-14 text-amber-400 mx-auto animate-pulse" />
              <div className="space-y-1">
                <h2 className="text-2xl font-extrabold text-white tracking-tight font-display">
                  QUIZ PAUSED
                </h2>
                <p className="text-sm text-amber-200">
                  Please wait for the host to resume...
                </p>
              </div>
            </motion.div>
          )}

          {/* 4. BETWEEN QUESTIONS NEUTRAL SCREEN */}
          {game && game.status === "QUESTION_CLOSED" && (
            <motion.div
              key="question_closed"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full text-center space-y-6"
            >
              <div className="w-16 h-16 rounded-3xl bg-emerald-600/20 border-2 border-emerald-500/40 flex items-center justify-center mx-auto text-emerald-400 shadow-xl shadow-emerald-500/20">
                <CheckCircle className="w-8 h-8" />
              </div>

              <div className="space-y-2">
                <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight font-display">
                  QUESTION COMPLETED
                </h2>
                <p className="text-sm text-slate-300 font-medium">
                  Get ready for the next question...
                </p>
              </div>

              <div className="p-4 bg-slate-900/60 rounded-2xl border border-slate-800 max-w-sm mx-auto flex items-center justify-center gap-2 text-xs text-slate-400">
                <Clock className="w-3.5 h-3.5 text-brand-400 animate-spin" />
                <span>Waiting for the host to advance...</span>
              </div>
            </motion.div>
          )}

          {/* 5. FINAL STUDENT COMPLETION SCREEN */}
          {game && game.status === "FINISHED" && (
            <motion.div
              key="finished"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="w-full text-center space-y-6"
            >
              <div className="w-20 h-20 rounded-3xl bg-indigo-600/20 border-2 border-indigo-500/40 flex items-center justify-center mx-auto text-indigo-400 shadow-2xl shadow-indigo-500/20">
                <Award className="w-10 h-10" />
              </div>

              <div className="space-y-3">
                <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight font-display">
                  QUIZ COMPLETED
                </h1>
                <p className="text-base text-slate-300 font-medium max-w-sm mx-auto">
                  Thank you for participating.
                </p>
              </div>

              <Card variant="glass" className="p-6 border-slate-800 max-w-sm mx-auto space-y-2">
                <p className="text-sm font-bold text-white">Your responses have been recorded.</p>
                <p className="text-xs text-slate-400">Please wait for further instructions from your host.</p>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Footer */}
      <div className="w-full pt-4 pb-2 text-center border-t border-slate-900">
        <p className="text-[11px] text-slate-500 flex items-center justify-center gap-1.5 font-medium">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
          <span>DQUIZ Student Privacy Protection Active</span>
        </p>
      </div>
    </div>
  );
}
