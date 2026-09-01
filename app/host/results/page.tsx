"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/lib/auth/AuthContext";
import { useToast } from "@/components/ui/Toast";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Modal } from "@/components/ui/Modal";
import { LiveGame } from "@/types/game";
import { Question } from "@/types/question";
import { AnswerRecord } from "@/types/answer";
import { Player } from "@/types/player";
import { ParticipantReportRow } from "@/types/report";
import { getGamesByHost, getGame } from "@/lib/game/gameService";
import { getQuestions, getQuizById } from "@/lib/game/quizService";
import {
  generateParticipantReport,
  generateQuestionReport,
  generateResponseReport,
  generateAttendanceReport,
} from "@/lib/reports/reportGenerator";
import { generatePdfReport } from "@/lib/reports/pdfGenerator";
import {
  Award,
  Download,
  Users,
  CheckCircle2,
  XCircle,
  Clock,
  TrendingUp,
  FileSpreadsheet,
  FileText,
  HelpCircle,
  Eye,
  ArrowLeft,
  Sparkles,
  Trophy,
  Loader2,
} from "lucide-react";

function ResultsContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialGameId = searchParams.get("gameId") || "";

  const { profile } = useAuth();
  const { showToast } = useToast();

  const [games, setGames] = useState<LiveGame[]>([]);
  const [selectedGameId, setSelectedGameId] = useState<string>(initialGameId);
  const [game, setGame] = useState<LiveGame | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [players, setPlayers] = useState<Player[]>([]);
  const [allAnswers, setAllAnswers] = useState<AnswerRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Participant Detail Modal State
  const [selectedPlayer, setSelectedPlayer] = useState<Player | null>(null);

  useEffect(() => {
    async function loadGames() {
      setIsLoading(true);
      try {
        const hostGames = await getGamesByHost(profile?.uid || "host");
        setGames(hostGames);

        const targetId = selectedGameId || (hostGames.length > 0 ? hostGames[0].id : "");
        if (targetId) {
          setSelectedGameId(targetId);
          await loadGameData(targetId);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    }
    loadGames();
  }, [profile?.uid]);

  const loadGameData = async (gameId: string) => {
    const g = await getGame(gameId);
    setGame(g);

    if (g) {
      const qs = await getQuestions(g.quizId);
      setQuestions(qs);

      // Load players
      let pList: Player[] = [];
      if (typeof window !== "undefined") {
        const pRaw = localStorage.getItem(`dquiz_game_players_${gameId}`);
        if (pRaw) pList = JSON.parse(pRaw);
      }
      setPlayers(pList);

      // Load answers
      let aList: AnswerRecord[] = [];
      if (typeof window !== "undefined") {
        const aRaw = localStorage.getItem(`dquiz_answers_${gameId}`);
        if (aRaw) aList = JSON.parse(aRaw);
      }
      setAllAnswers(aList);
    }
  };

  const handleSelectGame = async (gameId: string) => {
    setSelectedGameId(gameId);
    await loadGameData(gameId);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <Loader2 className="w-8 h-8 text-brand-400 animate-spin" />
      </div>
    );
  }

  // Generate ranked participant results
  const rankedParticipants: (ParticipantReportRow & { playerId: string })[] = [...players]
    .sort((a, b) => (b.score || 0) - (a.score || 0))
    .map((p, idx) => {
      const playerAnswers = allAnswers.filter((a) => a.playerId === p.id);
      const correct = playerAnswers.filter((a) => a.isCorrect).length;
      const incorrect = playerAnswers.filter((a) => !a.isCorrect).length;
      const totalQ = questions.length || 1;
      const unanswered = Math.max(0, totalQ - playerAnswers.length);
      const accuracyPct = Math.round((correct / totalQ) * 100);

      return {
        playerId: p.id,
        rank: idx + 1,
        name: p.name,
        rollNumber: p.rollNumber,
        score: p.score || 0,
        correct,
        incorrect,
        unanswered,
        accuracy: `${accuracyPct}%`,
      };
    });

  // Calculate high-level summary metrics (Prompt item 40)
  const totalCount = players.length;
  const highestScore = rankedParticipants.length > 0 ? rankedParticipants[0].score : 0;
  const avgScore =
    rankedParticipants.length > 0
      ? Math.round(
          rankedParticipants.reduce((acc, curr) => acc + curr.score, 0) /
            rankedParticipants.length
        )
      : 0;
  const avgAccuracy =
    rankedParticipants.length > 0
      ? Math.round(
          rankedParticipants.reduce(
            (acc, curr) => acc + parseInt(curr.accuracy, 10),
            0
          ) / rankedParticipants.length
        )
      : 0;

  // Question-by-question analytics
  const questionAnalytics = questions.map((q, idx) => {
    const qAnswers = allAnswers.filter((a) => a.questionId === q.id);
    const correct = qAnswers.filter((a) => a.isCorrect).length;
    const incorrect = qAnswers.filter((a) => !a.isCorrect).length;
    const unanswered = Math.max(0, totalCount - qAnswers.length);
    const accuracy = totalCount > 0 ? Math.round((correct / totalCount) * 100) : 0;
    const avgTimeMs =
      qAnswers.length > 0
        ? Math.round(
            qAnswers.reduce((acc, curr) => acc + (curr.responseTimeMs || 0), 0) /
              qAnswers.length
          )
        : 0;

    return {
      questionNumber: idx + 1,
      questionText: q.questionText,
      correctCount: correct,
      incorrectCount: incorrect,
      unansweredCount: unanswered,
      accuracy: `${accuracy}%`,
      avgResponseTimeSec: `${(avgTimeMs / 1000).toFixed(1)}s`,
    };
  });

  // Export handlers
  const handleExportPdf = () => {
    if (!game) return;
    generatePdfReport({
      quizTitle: game.quizTitle,
      gamePin: game.gamePin,
      hostName: game.hostName || profile?.displayName || "Host",
      totalParticipants: totalCount,
      totalQuestions: questions.length,
      highestScore,
      averageScore: avgScore,
      averageAccuracy: avgAccuracy,
      participants: rankedParticipants,
    });
    showToast({ type: "success", title: "PDF Report Generated" });
  };

  const handleExportExcel = () => {
    if (!game) return;
    generateParticipantReport(rankedParticipants, game.quizTitle, "excel");
    showToast({ type: "success", title: "Excel Report Downloaded" });
  };

  const handleExportCsv = () => {
    if (!game) return;
    generateParticipantReport(rankedParticipants, game.quizTitle, "csv");
    showToast({ type: "success", title: "CSV Report Downloaded" });
  };

  // Selected player answers for detail view (Prompt item 44)
  const selectedPlayerAnswers = selectedPlayer
    ? questions.map((q, idx) => {
        const ans = allAnswers.find(
          (a) => a.playerId === selectedPlayer.id && a.questionId === q.id
        );
        return {
          questionNumber: idx + 1,
          questionText: q.questionText,
          hasAnswered: Boolean(ans),
          isCorrect: ans?.isCorrect || false,
          points: ans?.pointsAwarded || 0,
          responseTimeSec: ans ? `${((ans.responseTimeMs || 0) / 1000).toFixed(1)}s` : "N/A",
        };
      })
    : [];

  return (
    <div className="space-y-8">
      {/* Header & Session Selector */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-800">
        <div>
          <Badge variant="success" size="sm" className="mb-1">
            OFFICIAL RESULTS
          </Badge>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight font-display">
            Quiz Results & Performance
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Authoritative scores, accuracy metrics, and downloadable reports.
          </p>
        </div>

        {games.length > 0 && (
          <div className="flex items-center gap-2">
            <select
              value={selectedGameId}
              onChange={(e) => handleSelectGame(e.target.value)}
              className="px-4 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-slate-200 text-sm font-semibold focus:outline-none focus:border-brand-500"
            >
              {games.map((g) => (
                <option key={g.id} value={g.id}>
                  PIN: {g.gamePin} — {g.quizTitle} ({g.status})
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* KPI Cards (Prompt item 40) */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
        <Card variant="glass" className="p-4 border-slate-800 text-center">
          <p className="text-xs uppercase font-semibold text-slate-400">Participants</p>
          <p className="text-2xl sm:text-3xl font-extrabold text-white font-mono mt-1">
            {totalCount}
          </p>
        </Card>

        <Card variant="glass" className="p-4 border-slate-800 text-center">
          <p className="text-xs uppercase font-semibold text-slate-400">Questions</p>
          <p className="text-2xl sm:text-3xl font-extrabold text-white font-mono mt-1">
            {questions.length}
          </p>
        </Card>

        <Card variant="glass" className="p-4 border-slate-800 text-center">
          <p className="text-xs uppercase font-semibold text-amber-400">Highest Score</p>
          <p className="text-2xl sm:text-3xl font-extrabold text-amber-300 font-mono mt-1">
            {highestScore.toLocaleString()}
          </p>
        </Card>

        <Card variant="glass" className="p-4 border-slate-800 text-center">
          <p className="text-xs uppercase font-semibold text-brand-400">Average Score</p>
          <p className="text-2xl sm:text-3xl font-extrabold text-brand-300 font-mono mt-1">
            {avgScore.toLocaleString()}
          </p>
        </Card>

        <Card variant="glass" className="p-4 border-slate-800 text-center col-span-2 sm:col-span-1">
          <p className="text-xs uppercase font-semibold text-emerald-400">Avg Accuracy</p>
          <p className="text-2xl sm:text-3xl font-extrabold text-emerald-300 font-mono mt-1">
            {avgAccuracy}%
          </p>
        </Card>
      </div>

      {/* Download Reports Action Bar (Prompt items 40, 42) */}
      <Card variant="default" className="p-5 bg-slate-900/90 border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h3 className="font-bold text-white text-base">Export Official Reports</h3>
          <p className="text-xs text-slate-400 mt-0.5">
            Download comprehensive result dossiers in Excel, CSV, or formatted PDF.
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          <Button
            size="sm"
            onClick={handleExportPdf}
            className="gap-1.5 bg-brand-600 hover:bg-brand-500 text-white shadow-brand-600/20"
          >
            <FileText className="w-4 h-4" />
            <span>Download PDF</span>
          </Button>
          <Button
            variant="secondary"
            size="sm"
            onClick={handleExportExcel}
            className="gap-1.5 border-slate-700 text-emerald-300 hover:bg-emerald-950/30"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
            <span>Download Excel</span>
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleExportCsv}
            className="gap-1.5 border-slate-700 text-slate-300"
          >
            <Download className="w-4 h-4" />
            <span>Download CSV</span>
          </Button>
        </div>
      </Card>

      {/* Leaderboard Table (Host Only) */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-white tracking-tight font-display flex items-center gap-2">
            <Trophy className="w-5 h-5 text-amber-400" />
            <span>Final Participant Leaderboard</span>
          </h2>
          <span className="text-xs text-slate-400">Click any row to inspect question breakdown</span>
        </div>

        {rankedParticipants.length === 0 ? (
          <Card variant="default" className="p-12 text-center border-slate-800 bg-slate-900/40 space-y-2">
            <Users className="w-8 h-8 text-slate-500 mx-auto" />
            <h3 className="text-base font-bold text-white">No participant records recorded</h3>
            <p className="text-xs text-slate-400">No players submitted answers for this session.</p>
          </Card>
        ) : (
          <Card variant="default" className="p-0 overflow-hidden border-slate-800 bg-slate-900/70">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-slate-300">
                <thead className="bg-slate-950/80 text-xs font-semibold uppercase tracking-wider text-slate-400 border-b border-slate-800">
                  <tr>
                    <th className="py-3 px-6">Rank</th>
                    <th className="py-3 px-6">Student Name</th>
                    <th className="py-3 px-6">Roll Number</th>
                    <th className="py-3 px-6 text-right">Score</th>
                    <th className="py-3 px-6 text-center">Correct</th>
                    <th className="py-3 px-6 text-center">Incorrect</th>
                    <th className="py-3 px-6 text-center">Accuracy</th>
                    <th className="py-3 px-6 text-right">Details</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 font-medium">
                  {rankedParticipants.map((p) => {
                    const originalPlayer = players.find((pl) => pl.id === p.playerId);

                    return (
                      <tr
                        key={p.playerId}
                        onClick={() => setSelectedPlayer(originalPlayer || null)}
                        className="hover:bg-slate-800/40 cursor-pointer transition-colors"
                      >
                        <td className="py-4 px-6 font-bold font-mono">
                          {p.rank === 1 ? (
                            <span className="text-amber-400 font-extrabold flex items-center gap-1.5">
                              🥇 #1
                            </span>
                          ) : p.rank === 2 ? (
                            <span className="text-slate-300 font-extrabold flex items-center gap-1.5">
                              🥈 #2
                            </span>
                          ) : p.rank === 3 ? (
                            <span className="text-amber-600 font-extrabold flex items-center gap-1.5">
                              🥉 #3
                            </span>
                          ) : (
                            `#${p.rank}`
                          )}
                        </td>
                        <td className="py-4 px-6 font-bold text-white">{p.name}</td>
                        <td className="py-4 px-6 font-mono text-slate-400">{p.rollNumber}</td>
                        <td className="py-4 px-6 text-right font-mono font-extrabold text-brand-300">
                          {p.score.toLocaleString()}
                        </td>
                        <td className="py-4 px-6 text-center text-emerald-400 font-mono">
                          {p.correct}
                        </td>
                        <td className="py-4 px-6 text-center text-rose-400 font-mono">
                          {p.incorrect}
                        </td>
                        <td className="py-4 px-6 text-center font-mono font-bold text-slate-100">
                          {p.accuracy}
                        </td>
                        <td className="py-4 px-6 text-right">
                          <Button variant="ghost" size="sm" className="text-xs text-brand-400">
                            Inspect
                          </Button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </Card>
        )}
      </div>

      {/* Item Analysis & Question Performance (Prompt item 45) */}
      <div className="space-y-4">
        <h2 className="text-lg font-bold text-white tracking-tight font-display flex items-center gap-2">
          <HelpCircle className="w-5 h-5 text-brand-400" />
          <span>Question-Wise Item Analytics</span>
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {questionAnalytics.map((qa) => (
            <Card key={qa.questionNumber} variant="default" className="p-5 bg-slate-900/60 border-slate-800 space-y-3">
              <div className="flex items-center justify-between">
                <Badge variant="primary" size="sm" className="font-mono">
                  Question #{qa.questionNumber}
                </Badge>
                <Badge
                  variant={parseInt(qa.accuracy, 10) >= 60 ? "success" : "warning"}
                  size="sm"
                >
                  {qa.accuracy} Accuracy
                </Badge>
              </div>

              <p className="font-bold text-white text-sm line-clamp-2">{qa.questionText}</p>

              <div className="pt-2 border-t border-slate-800/80 grid grid-cols-3 gap-2 text-xs text-center font-mono">
                <div className="p-2 bg-slate-950 rounded-lg">
                  <span className="text-slate-500 block text-[10px]">CORRECT</span>
                  <span className="text-emerald-400 font-bold">{qa.correctCount}</span>
                </div>
                <div className="p-2 bg-slate-950 rounded-lg">
                  <span className="text-slate-500 block text-[10px]">INCORRECT</span>
                  <span className="text-rose-400 font-bold">{qa.incorrectCount}</span>
                </div>
                <div className="p-2 bg-slate-950 rounded-lg">
                  <span className="text-slate-500 block text-[10px]">AVG TIME</span>
                  <span className="text-amber-300 font-bold">{qa.avgResponseTimeSec}</span>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>

      {/* Individual Participant Detail Modal (Prompt item 44) */}
      <Modal
        isOpen={Boolean(selectedPlayer)}
        onClose={() => setSelectedPlayer(null)}
        title={selectedPlayer ? selectedPlayer.name : "Participant Breakdown"}
        description={`Roll Number: ${selectedPlayer?.rollNumber || "N/A"} • Total Score: ${selectedPlayer?.score || 0}`}
        maxWidth="lg"
      >
        {selectedPlayer && (
          <div className="space-y-4 max-h-[70vh] overflow-y-auto pr-1">
            <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 flex justify-between items-center text-xs">
              <div>
                <span className="text-slate-400">Institution:</span>
                <p className="text-white font-semibold">{selectedPlayer.institution || "N/A"}</p>
              </div>
              <div>
                <span className="text-slate-400">Total Score:</span>
                <p className="text-brand-300 font-bold font-mono text-base">
                  {selectedPlayer.score || 0} Pts
                </p>
              </div>
            </div>

            <div className="space-y-2">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Question Performance Breakdown
              </h4>

              <div className="space-y-2">
                {selectedPlayerAnswers.map((pa) => (
                  <div
                    key={pa.questionNumber}
                    className={`p-3 rounded-xl border flex items-center justify-between gap-3 text-xs ${
                      pa.isCorrect
                        ? "bg-emerald-950/20 border-emerald-500/30"
                        : "bg-rose-950/20 border-rose-500/30"
                    }`}
                  >
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-white">Q{pa.questionNumber}</span>
                        {pa.isCorrect ? (
                          <span className="text-emerald-400 font-semibold flex items-center gap-1">
                            <CheckCircle2 className="w-3.5 h-3.5" /> Correct
                          </span>
                        ) : (
                          <span className="text-rose-400 font-semibold flex items-center gap-1">
                            <XCircle className="w-3.5 h-3.5" /> Incorrect
                          </span>
                        )}
                      </div>
                      <p className="text-slate-400 truncate max-w-sm">{pa.questionText}</p>
                    </div>

                    <div className="text-right font-mono shrink-0">
                      <span className="text-white font-bold block">{pa.points} Pts</span>
                      <span className="text-slate-400 text-[10px]">{pa.responseTimeSec}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <Button variant="outline" size="sm" onClick={() => setSelectedPlayer(null)}>
                Close
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}

export default function ResultsPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center p-12">
          <Loader2 className="w-8 h-8 text-brand-400 animate-spin" />
        </div>
      }
    >
      <ResultsContent />
    </Suspense>
  );
}
