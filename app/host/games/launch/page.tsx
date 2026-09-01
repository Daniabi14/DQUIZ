"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/lib/auth/AuthContext";
import { useToast } from "@/components/ui/Toast";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Quiz } from "@/types/quiz";
import { Question } from "@/types/question";
import { getQuizzes, getQuizById, getQuestions } from "@/lib/game/quizService";
import { createLiveGame } from "@/lib/game/gameService";
import { fisherYatesShuffle } from "@/lib/shuffle/fisherYates";
import {
  ArrowLeft,
  Radio,
  Shuffle,
  ShieldCheck,
  Zap,
  RotateCcw,
  Sparkles,
  ArrowRight,
  HelpCircle,
  Play,
  Loader2,
} from "lucide-react";

function LaunchGameContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialQuizId = searchParams.get("quizId") || "";

  const { profile } = useAuth();
  const { showToast } = useToast();

  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [selectedQuizId, setSelectedQuizId] = useState<string>(initialQuizId);
  const [currentQuiz, setCurrentQuiz] = useState<Quiz | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [shuffledOrder, setShuffledOrder] = useState<Question[]>([]);

  // Settings
  const [shuffleQuestions, setShuffleQuestions] = useState(true);
  const [shuffleOptions, setShuffleOptions] = useState(true);
  const [scoringType, setScoringType] = useState<"speed" | "fixed">("speed");
  const [allowAnswerChanges, setAllowAnswerChanges] = useState(false);
  const [leaderboardVisibleToHost, setLeaderboardVisibleToHost] = useState(true);
  const [antiCheatingMode, setAntiCheatingMode] = useState(true);

  const [isLoading, setIsLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);

  useEffect(() => {
    async function load() {
      setIsLoading(true);
      try {
        const list = await getQuizzes(profile?.uid);
        setQuizzes(list);

        const targetId = selectedQuizId || (list.length > 0 ? list[0].id : "");
        if (targetId) {
          setSelectedQuizId(targetId);
          const qz = await getQuizById(targetId);
          setCurrentQuiz(qz);
          const qs = await getQuestions(targetId);
          setQuestions(qs);
          setShuffledOrder(fisherYatesShuffle(qs));
        }
      } catch (err) {
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    }
    load();
  }, [profile?.uid]);

  const handleQuizChange = async (quizId: string) => {
    setSelectedQuizId(quizId);
    const qz = await getQuizById(quizId);
    setCurrentQuiz(qz);
    const qs = await getQuestions(quizId);
    setQuestions(qs);
    setShuffledOrder(shuffleQuestions ? fisherYatesShuffle(qs) : qs);
  };

  const handleRegenerateShuffle = () => {
    if (questions.length === 0) return;
    setShuffledOrder(fisherYatesShuffle(questions));
    showToast({
      type: "info",
      title: "Shuffle Regenerated",
      message: "New random question order generated.",
    });
  };

  const handleAntiCheatingToggle = (enabled: boolean) => {
    setAntiCheatingMode(enabled);
    if (enabled) {
      setShuffleQuestions(true);
      setShuffleOptions(true);
      setAllowAnswerChanges(false);
    }
  };

  const handleCreateGame = async () => {
    if (!currentQuiz || questions.length === 0) {
      showToast({
        type: "error",
        title: "Cannot Launch",
        message: "This quiz contains no questions. Please add questions first.",
      });
      return;
    }

    setIsCreating(true);

    try {
      const questionIds = shuffleQuestions
        ? shuffledOrder.map((q) => q.id)
        : questions.map((q) => q.id);

      const game = await createLiveGame({
        quizId: currentQuiz.id,
        quizTitle: currentQuiz.name,
        questionIds,
        hostId: profile?.uid || "host",
        hostName: profile?.displayName || "Prof. Alex Rivera",
        settings: {
          shuffleQuestions,
          shuffleOptions,
          scoringType,
          allowAnswerChanges,
          leaderboardVisibleToHost,
          antiCheatingMode,
        },
      });

      showToast({
        type: "success",
        title: "Live Game Created!",
        message: `PIN: ${game.gamePin}. Entering lobby...`,
      });

      router.push(`/host/games/${game.id}/lobby`);
    } catch (err: any) {
      showToast({
        type: "error",
        title: "Failed to create game",
        message: err.message || "An unexpected error occurred.",
      });
    } finally {
      setIsCreating(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <Loader2 className="w-8 h-8 text-brand-400 animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/host/quizzes">
          <Button variant="ghost" size="sm" className="gap-1.5 text-slate-400">
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Quizzes</span>
          </Button>
        </Link>
      </div>

      <div className="pb-4 border-b border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <Badge variant="primary" size="sm" className="mb-1">
            HOST SESSION SETUP
          </Badge>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight font-display">
            Configure Live Game
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Choose game parameters, randomize orders, and launch your real-time PIN & QR room.
          </p>
        </div>
      </div>

      {/* Select Quiz */}
      <Card variant="glass" className="p-6 border-slate-800 space-y-4">
        <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400">
          Select Quiz to Host
        </label>
        <select
          value={selectedQuizId}
          onChange={(e) => handleQuizChange(e.target.value)}
          className="w-full px-4 py-3 bg-slate-900 border border-slate-800 rounded-xl text-slate-100 text-sm focus:outline-none focus:border-brand-500 font-semibold"
        >
          {quizzes.map((q) => (
            <option key={q.id} value={q.id}>
              {q.name} ({q.questionCount || 0} Questions • {q.difficulty})
            </option>
          ))}
        </select>
      </Card>

      {/* Game Settings Grid (Prompt item 24) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* Anti-Cheating Mode Box */}
        <Card
          variant="glass"
          className={`p-6 border transition-all ${
            antiCheatingMode
              ? "border-emerald-500/40 bg-emerald-950/20"
              : "border-slate-800 bg-slate-900/60"
          }`}
        >
          <div className="flex items-start justify-between gap-3">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-emerald-400" />
                <h3 className="font-bold text-white text-base">Anti-Cheating Mode</h3>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">
                Automatically randomizes questions and answer options, locks answers instantly, and enforces strict server deadline validation.
              </p>
            </div>
            <button
              type="button"
              onClick={() => handleAntiCheatingToggle(!antiCheatingMode)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                antiCheatingMode
                  ? "bg-emerald-600 text-white shadow-md shadow-emerald-600/30"
                  : "bg-slate-800 text-slate-400"
              }`}
            >
              {antiCheatingMode ? "ENABLED" : "DISABLED"}
            </button>
          </div>
        </Card>

        {/* Scoring Mode */}
        <Card variant="glass" className="p-6 border-slate-800 space-y-3">
          <div className="flex items-center gap-2">
            <Zap className="w-5 h-5 text-amber-400" />
            <h3 className="font-bold text-white text-base">Scoring System</h3>
          </div>
          <p className="text-xs text-slate-400">
            Award points strictly for correctness, or factor in response speed.
          </p>
          <div className="grid grid-cols-2 gap-2 pt-1">
            <button
              type="button"
              onClick={() => setScoringType("speed")}
              className={`p-2.5 rounded-xl border text-xs font-semibold transition-all ${
                scoringType === "speed"
                  ? "border-brand-500 bg-brand-600/20 text-brand-300"
                  : "border-slate-800 bg-slate-900 text-slate-400"
              }`}
            >
              Speed-Based Points
            </button>
            <button
              type="button"
              onClick={() => setScoringType("fixed")}
              className={`p-2.5 rounded-xl border text-xs font-semibold transition-all ${
                scoringType === "fixed"
                  ? "border-brand-500 bg-brand-600/20 text-brand-300"
                  : "border-slate-800 bg-slate-900 text-slate-400"
              }`}
            >
              Fixed Points
            </button>
          </div>
        </Card>
      </div>

      {/* Question Shuffle Preview & Regeneration (Prompt item 25 & 26) */}
      <Card variant="glass" className="p-6 border-slate-800 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Shuffle className="w-4 h-4 text-brand-400" />
              <span>Question Order Sequence</span>
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Fisher-Yates random sequence locked for all participants during the live game.
            </p>
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={handleRegenerateShuffle}
            disabled={!shuffleQuestions}
            className="gap-1.5 text-xs border-brand-500/30 text-brand-300 hover:bg-brand-950/40"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>REGENERATE SHUFFLE</span>
          </Button>
        </div>

        {/* Question sequence preview */}
        <div className="space-y-2">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-48 overflow-y-auto pr-1">
            {(shuffleQuestions ? shuffledOrder : questions).map((q, idx) => (
              <div
                key={q.id}
                className="p-3 bg-slate-900/80 border border-slate-800 rounded-xl flex items-center gap-2.5 text-xs"
              >
                <span className="w-6 h-6 rounded-md bg-brand-600/20 text-brand-300 font-mono font-bold flex items-center justify-center shrink-0">
                  {idx + 1}
                </span>
                <span className="text-slate-200 truncate flex-1">{q.questionText}</span>
                <span className="text-slate-500 text-[10px] font-mono shrink-0">
                  {q.timeLimit}s
                </span>
              </div>
            ))}
          </div>
        </div>
      </Card>

      {/* Launch Action */}
      <div className="flex items-center justify-end gap-3 pt-4">
        <Link href="/host/quizzes">
          <Button variant="ghost">Cancel</Button>
        </Link>
        <Button
          size="xl"
          isLoading={isCreating}
          onClick={handleCreateGame}
          className="gap-2.5 shadow-2xl shadow-emerald-600/30 bg-emerald-600 hover:bg-emerald-500 text-white"
        >
          <Play className="w-5 h-5 fill-current" />
          <span>CREATE LIVE GAME & ENTER LOBBY</span>
        </Button>
      </div>
    </div>
  );
}

export default function LaunchGamePage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center p-12">
          <Loader2 className="w-8 h-8 text-brand-400 animate-spin" />
        </div>
      }
    >
      <LaunchGameContent />
    </Suspense>
  );
}
