"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/lib/auth/AuthContext";
import { useToast } from "@/components/ui/Toast";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Modal } from "@/components/ui/Modal";
import { useGame } from "@/hooks/useGame";
import { useTimer } from "@/hooks/useTimer";
import { Question } from "@/types/question";
import { AnswerRecord } from "@/types/answer";
import { getQuestions } from "@/lib/game/quizService";
import {
  pauseGame,
  resumeGame,
  endCurrentQuestion,
  advanceToNextQuestion,
  finishGame,
  getQuestionResponses,
} from "@/lib/game/liveGameEngine";
import {
  Play,
  Pause,
  SkipForward,
  CheckCircle2,
  XCircle,
  Timer,
  Trophy,
  Users,
  Award,
  AlertCircle,
  Radio,
  BarChart3,
  Loader2,
  StopCircle,
} from "lucide-react";

export function HostControlView() {
  const params = useParams();
  const gameId = params.id as string;
  const router = useRouter();
  const { profile } = useAuth();
  const { showToast } = useToast();

  const { game, players, loading } = useGame(gameId);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [responses, setResponses] = useState<AnswerRecord[]>([]);
  const [isLeaderboardOpen, setIsLeaderboardOpen] = useState(false);
  const [isActionLoading, setIsActionLoading] = useState(false);

  useEffect(() => {
    async function loadQuizQuestions() {
      if (game?.quizId) {
        const qs = await getQuestions(game.quizId);
        setQuestions(qs);
      }
    }
    loadQuizQuestions();
  }, [game?.quizId]);

  const currentQId = game?.currentQuestionId;
  const currentQuestion = questions.find((q) => q.id === currentQId);
  const currentQIndex = game?.currentQuestionIndex || 0;
  const totalQuestions = game?.questionOrder?.length || questions.length || 1;
  const isLastQuestion = currentQIndex >= totalQuestions - 1;

  const { secondsRemaining, isTimeUp } = useTimer(
    game?.questionEndsAt || null,
    game?.isPaused || game?.status === "PAUSED"
  );

  useEffect(() => {
    async function fetchResponses() {
      if (gameId && currentQId) {
        const res = await getQuestionResponses(gameId, currentQId);
        setResponses(res);
      }
    }
    fetchResponses();
    const interval = setInterval(fetchResponses, 1000);
    return () => clearInterval(interval);
  }, [gameId, currentQId, game?.status]);

  useEffect(() => {
    if (game?.status === "QUESTION" && isTimeUp && secondsRemaining === 0) {
      endCurrentQuestion(gameId);
    }
  }, [isTimeUp, secondsRemaining, game?.status, gameId]);

  if (loading || !game) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
        <Loader2 className="w-10 h-10 text-brand-400 animate-spin" />
        <p className="text-sm font-medium text-slate-400">Connecting to live quiz session...</p>
      </div>
    );
  }

  const answeredCount = responses.length;
  const unansweredCount = Math.max(0, players.length - answeredCount);
  const correctCount = responses.filter((r) => r.isCorrect).length;
  const incorrectCount = responses.filter((r) => !r.isCorrect).length;

  const optionCounts: Record<string, number> = {};
  if (currentQuestion) {
    currentQuestion.options.forEach((opt) => {
      optionCounts[opt.id] = responses.filter((r) =>
        r.selectedOptionIds?.includes(opt.id)
      ).length;
    });
  }

  const sortedPlayers = [...players].sort((a, b) => (b.score || 0) - (a.score || 0));

  const handleTogglePause = async () => {
    setIsActionLoading(true);
    try {
      if (game.status === "PAUSED") {
        await resumeGame(gameId);
        showToast({ type: "success", title: "Quiz Resumed" });
      } else {
        await pauseGame(gameId);
        showToast({ type: "info", title: "Quiz Paused" });
      }
    } catch (e: any) {
      showToast({ type: "error", title: "Action Failed", message: e.message });
    } finally {
      setIsActionLoading(false);
    }
  };

  const handleEndQuestion = async () => {
    setIsActionLoading(true);
    try {
      await endCurrentQuestion(gameId);
      showToast({ type: "info", title: "Question Ended", message: "Responses closed." });
    } catch (e: any) {
      showToast({ type: "error", title: "Action Failed", message: e.message });
    } finally {
      setIsActionLoading(false);
    }
  };

  const handleNextQuestion = async () => {
    setIsActionLoading(true);
    try {
      const res = await advanceToNextQuestion(gameId, questions);
      if (res.finished) {
        showToast({
          type: "success",
          title: "Quiz Completed!",
          message: "Opening results...",
        });
        router.push(`/host/results?gameId=${gameId}`);
      } else {
        showToast({
          type: "success",
          title: `Question ${currentQIndex + 2} Live!`,
        });
      }
    } catch (e: any) {
      showToast({ type: "error", title: "Action Failed", message: e.message });
    } finally {
      setIsActionLoading(false);
    }
  };

  const handleEndQuizEarly = async () => {
    if (!confirm("Are you sure you want to end the entire quiz session now?")) return;
    setIsActionLoading(true);
    try {
      await finishGame(gameId);
      showToast({ type: "info", title: "Quiz Finished" });
      router.push(`/host/results?gameId=${gameId}`);
    } catch (e: any) {
      showToast({ type: "error", title: "Action Failed", message: e.message });
    } finally {
      setIsActionLoading(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Top Session Control Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 bg-slate-900/90 border border-slate-800 rounded-2xl shadow-xl backdrop-blur-md">
        <div className="flex items-center gap-3">
          <Badge variant="primary" size="md" className="font-mono text-xs px-3 py-1 font-bold">
            PIN: {game.gamePin}
          </Badge>
          <div className="overflow-hidden">
            <h1 className="text-base font-bold text-white truncate">{game.quizTitle}</h1>
            <p className="text-xs text-slate-400">
              {players.length} Total Connected Participants
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsLeaderboardOpen(true)}
            className="gap-1.5 border-amber-500/30 text-amber-300 hover:bg-amber-950/30 text-xs"
          >
            <Trophy className="w-3.5 h-3.5 text-amber-400" />
            <span>Leaderboard</span>
          </Button>

          {game.status === "QUESTION" && (
            <Button
              variant="secondary"
              size="sm"
              onClick={handleTogglePause}
              isLoading={isActionLoading}
              className="gap-1.5 text-xs border-slate-700"
            >
              <Pause className="w-3.5 h-3.5 text-amber-400" />
              <span>Pause</span>
            </Button>
          )}

          {game.status === "PAUSED" && (
            <Button
              variant="secondary"
              size="sm"
              onClick={handleTogglePause}
              isLoading={isActionLoading}
              className="gap-1.5 text-xs bg-emerald-950/40 border-emerald-500/40 text-emerald-300"
            >
              <Play className="w-3.5 h-3.5 text-emerald-400 fill-current" />
              <span>Resume</span>
            </Button>
          )}

          {game.status === "QUESTION" && (
            <Button
              variant="danger"
              size="sm"
              onClick={handleEndQuestion}
              isLoading={isActionLoading}
              className="gap-1.5 text-xs"
            >
              <StopCircle className="w-3.5 h-3.5" />
              <span>End Question</span>
            </Button>
          )}

          {game.status === "QUESTION_CLOSED" && (
            <Button
              size="md"
              onClick={handleNextQuestion}
              isLoading={isActionLoading}
              className="gap-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold shadow-lg shadow-emerald-600/20"
            >
              <span>{isLastQuestion ? "Finish Quiz & View Results" : "Next Question"}</span>
              <SkipForward className="w-4 h-4" />
            </Button>
          )}

          <Button
            variant="ghost"
            size="sm"
            onClick={handleEndQuizEarly}
            className="text-slate-500 hover:text-rose-400 text-xs"
            title="End Session"
          >
            End Quiz
          </Button>
        </div>
      </div>

      {/* Question Info & Real-Time Timer Header */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <Card variant="glass" className="p-6 md:col-span-2 border-slate-800 space-y-3">
          <div className="flex items-center justify-between">
            <Badge variant="primary" size="sm" className="font-mono">
              QUESTION {currentQIndex + 1} OF {totalQuestions}
            </Badge>
            <Badge
              variant={
                game.status === "QUESTION"
                  ? "success"
                  : game.status === "PAUSED"
                  ? "warning"
                  : "secondary"
              }
              size="sm"
            >
              {game.status}
            </Badge>
          </div>

          <h2 className="text-xl sm:text-2xl font-bold text-white leading-snug">
            {currentQuestion?.questionText || "Loading question..."}
          </h2>
        </Card>

        <Card variant="glass" className="p-6 border-slate-800 flex flex-col justify-between space-y-3 text-center">
          <div>
            <span className="text-xs uppercase font-bold text-slate-400 tracking-wider">
              {game.status === "PAUSED" ? "Timer (Paused)" : "Time Remaining"}
            </span>
            <div
              className={`text-5xl font-extrabold font-mono tracking-tight mt-1 ${
                secondsRemaining <= 5 && game.status === "QUESTION"
                  ? "text-rose-400 animate-pulse"
                  : "text-amber-300"
              }`}
            >
              {secondsRemaining}s
            </div>
          </div>

          <div className="p-2.5 bg-slate-950/80 rounded-xl border border-slate-800 flex justify-between text-xs text-slate-400 font-medium">
            <span>Answered:</span>
            <span className="font-bold text-white font-mono">
              {answeredCount} / {players.length}
            </span>
          </div>
        </Card>
      </div>

      {/* Question Statistics & Options Breakdown */}
      <Card variant="default" className="p-6 bg-slate-900/80 border-slate-800 space-y-5">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <h3 className="text-sm font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-brand-400" />
            <span>Real-Time Response Distribution</span>
          </h3>

          {game.status === "QUESTION_CLOSED" && (
            <div className="flex items-center gap-3 text-xs font-semibold">
              <span className="text-emerald-400 flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" /> Correct: {correctCount}
              </span>
              <span className="text-rose-400 flex items-center gap-1">
                <XCircle className="w-3.5 h-3.5" /> Incorrect: {incorrectCount}
              </span>
              <span className="text-slate-400">Unanswered: {unansweredCount}</span>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {currentQuestion?.options.map((opt, idx) => {
            const isCorrect = currentQuestion.correctOptionIds.includes(opt.id);
            const count = optionCounts[opt.id] || 0;
            const percentage =
              answeredCount > 0 ? Math.round((count / answeredCount) * 100) : 0;
            const letter = String.fromCharCode(65 + idx);

            return (
              <div
                key={opt.id}
                className={`p-4 rounded-xl border space-y-2 relative overflow-hidden transition-all ${
                  game.status === "QUESTION_CLOSED" && isCorrect
                    ? "bg-emerald-950/30 border-emerald-500/50"
                    : "bg-slate-950 border-slate-800"
                }`}
              >
                <div
                  className={`absolute left-0 top-0 bottom-0 opacity-15 transition-all duration-300 ${
                    isCorrect ? "bg-emerald-500" : "bg-brand-500"
                  }`}
                  style={{ width: `${percentage}%` }}
                />

                <div className="flex items-center justify-between relative z-10">
                  <div className="flex items-center gap-2">
                    <span className="w-6 h-6 rounded-lg bg-slate-800 text-white font-bold text-xs flex items-center justify-center">
                      {letter}
                    </span>
                    <span className="font-semibold text-sm text-slate-100">{opt.text}</span>
                  </div>

                  {game.status === "QUESTION_CLOSED" && isCorrect && (
                    <Badge variant="success" size="sm">
                      CORRECT
                    </Badge>
                  )}
                </div>

                <div className="flex items-center justify-between text-xs text-slate-400 relative z-10 pt-1">
                  <span>{count} Responses</span>
                  <span className="font-mono font-bold text-slate-300">{percentage}%</span>
                </div>
              </div>
            );
          })}
        </div>
      </Card>

      {/* Host Leaderboard Modal */}
      <Modal
        isOpen={isLeaderboardOpen}
        onClose={() => setIsLeaderboardOpen(false)}
        title="Live Leaderboard (Host Only)"
        description="Top participant scores based on accuracy and response speed."
        maxWidth="lg"
      >
        <div className="space-y-4">
          <div className="max-h-96 overflow-y-auto pr-1">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-950 text-slate-400 font-semibold uppercase tracking-wider border-b border-slate-800">
                <tr>
                  <th className="py-2.5 px-3">Rank</th>
                  <th className="py-2.5 px-3">Student</th>
                  <th className="py-2.5 px-3">Roll No</th>
                  <th className="py-2.5 px-3 text-right">Score</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-medium">
                {sortedPlayers.map((p, idx) => (
                  <tr key={p.id} className="hover:bg-slate-800/40">
                    <td className="py-3 px-3 font-bold font-mono">
                      {idx === 0 ? (
                        <span className="text-amber-400 flex items-center gap-1">🥇 1</span>
                      ) : idx === 1 ? (
                        <span className="text-slate-300 flex items-center gap-1">🥈 2</span>
                      ) : idx === 2 ? (
                        <span className="text-amber-600 flex items-center gap-1">🥉 3</span>
                      ) : (
                        `#${idx + 1}`
                      )}
                    </td>
                    <td className="py-3 px-3 font-bold text-white">{p.name}</td>
                    <td className="py-3 px-3 font-mono text-slate-400">{p.rollNumber}</td>
                    <td className="py-3 px-3 text-right font-mono font-extrabold text-brand-300">
                      {p.score || 0}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="flex justify-end pt-2">
            <Button variant="outline" size="sm" onClick={() => setIsLeaderboardOpen(false)}>
              Close Leaderboard
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
