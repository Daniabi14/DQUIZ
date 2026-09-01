"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/lib/auth/AuthContext";
import { useToast } from "@/components/ui/Toast";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { LiveGame } from "@/types/game";
import { Question } from "@/types/question";
import { AnswerRecord } from "@/types/answer";
import { Player } from "@/types/player";
import {
  ParticipantReportRow,
  QuestionReportRow,
  ResponseReportRow,
  AttendanceReportRow,
} from "@/types/report";
import { getGamesByHost, getGame } from "@/lib/game/gameService";
import { getQuestions } from "@/lib/game/quizService";
import {
  generateParticipantReport,
  generateQuestionReport,
  generateResponseReport,
  generateAttendanceReport,
} from "@/lib/reports/reportGenerator";
import { generatePdfReport } from "@/lib/reports/pdfGenerator";
import {
  FileSpreadsheet,
  FileText,
  Download,
  Users,
  CheckCircle,
  Clock,
  Layers,
  Award,
  Loader2,
} from "lucide-react";

function ReportsCenterContent() {
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

  useEffect(() => {
    async function load() {
      setIsLoading(true);
      try {
        const list = await getGamesByHost(profile?.uid || "host");
        setGames(list);
        const targetId = selectedGameId || (list.length > 0 ? list[0].id : "");
        if (targetId) {
          setSelectedGameId(targetId);
          await loadData(targetId);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    }
    load();
  }, [profile?.uid]);

  const loadData = async (gameId: string) => {
    const g = await getGame(gameId);
    setGame(g);
    if (g) {
      const qs = await getQuestions(g.quizId);
      setQuestions(qs);

      let pList: Player[] = [];
      if (typeof window !== "undefined") {
        const pRaw = localStorage.getItem(`dquiz_game_players_${gameId}`);
        if (pRaw) pList = JSON.parse(pRaw);
      }
      setPlayers(pList);

      let aList: AnswerRecord[] = [];
      if (typeof window !== "undefined") {
        const aRaw = localStorage.getItem(`dquiz_answers_${gameId}`);
        if (aRaw) aList = JSON.parse(aRaw);
      }
      setAllAnswers(aList);
    }
  };

  const handleGameSelect = async (gameId: string) => {
    setSelectedGameId(gameId);
    await loadData(gameId);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <Loader2 className="w-8 h-8 text-brand-400 animate-spin" />
      </div>
    );
  }

  // Build rows for each report type
  const totalCount = players.length;
  const participantRows: ParticipantReportRow[] = [...players]
    .sort((a, b) => (b.score || 0) - (a.score || 0))
    .map((p, idx) => {
      const playerAnswers = allAnswers.filter((a) => a.playerId === p.id);
      const correct = playerAnswers.filter((a) => a.isCorrect).length;
      const incorrect = playerAnswers.filter((a) => !a.isCorrect).length;
      const totalQ = questions.length || 1;
      const unanswered = Math.max(0, totalQ - playerAnswers.length);
      const accuracy = Math.round((correct / totalQ) * 100);

      return {
        rank: idx + 1,
        name: p.name,
        rollNumber: p.rollNumber,
        score: p.score || 0,
        correct,
        incorrect,
        unanswered,
        accuracy: `${accuracy}%`,
      };
    });

  const questionRows: QuestionReportRow[] = questions.map((q, idx) => {
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

  const responseRows: ResponseReportRow[] = allAnswers.map((a) => {
    const q = questions.find((item) => item.id === a.questionId);
    const selectedText = (q?.options || [])
      .filter((opt) => a.selectedOptionIds?.includes(opt.id))
      .map((opt) => opt.text)
      .join(", ");
    const correctText = (q?.options || [])
      .filter((opt) => q?.correctOptionIds?.includes(opt.id))
      .map((opt) => opt.text)
      .join(", ");

    return {
      studentName: a.playerName,
      rollNumber: a.playerRollNumber,
      questionNumber: a.questionOrderNumber || 1,
      questionText: q?.questionText || "Question",
      selectedAnswer: selectedText || "None",
      correctAnswer: correctText || "None",
      isCorrect: a.isCorrect,
      responseTimeSec: `${((a.responseTimeMs || 0) / 1000).toFixed(1)}s`,
      points: a.pointsAwarded,
    };
  });

  const attendanceRows: AttendanceReportRow[] = players.map((p) => ({
    studentName: p.name,
    rollNumber: p.rollNumber,
    institution: p.institution || "N/A",
    joinedAt: new Date(p.joinedAt || Date.now()).toLocaleTimeString(),
    completed: game?.status === "FINISHED" ? "Yes" : "In Progress",
    connectionStatus: p.connectionStatus || "connected",
  }));

  const highestScore = participantRows.length > 0 ? participantRows[0].score : 0;
  const avgScore =
    participantRows.length > 0
      ? Math.round(
          participantRows.reduce((acc, curr) => acc + curr.score, 0) /
            participantRows.length
        )
      : 0;
  const avgAccuracy =
    participantRows.length > 0
      ? Math.round(
          participantRows.reduce(
            (acc, curr) => acc + parseInt(curr.accuracy, 10),
            0
          ) / participantRows.length
        )
      : 0;

  const quizTitle = game?.quizTitle || "QuizLive";

  const reportCards = [
    {
      title: "Participant Report",
      description:
        "Student ranking, individual score, accuracy percentage, correct & incorrect count.",
      icon: Award,
      onExcel: () => generateParticipantReport(participantRows, quizTitle, "excel"),
      onCsv: () => generateParticipantReport(participantRows, quizTitle, "csv"),
    },
    {
      title: "Question Analytics Report",
      description:
        "Question-wise difficulty breakdown, correctness rate, and average response times.",
      icon: CheckCircle,
      onExcel: () => generateQuestionReport(questionRows, quizTitle, "excel"),
      onCsv: () => generateQuestionReport(questionRows, quizTitle, "csv"),
    },
    {
      title: "Detailed Response Dossier",
      description:
        "Granular log of every answer submitted with timestamps, selected keys, and point awards.",
      icon: FileSpreadsheet,
      onExcel: () => generateResponseReport(responseRows, quizTitle, "excel"),
      onCsv: () => generateResponseReport(responseRows, quizTitle, "csv"),
    },
    {
      title: "Attendance & Verification Log",
      description:
        "Timestamped roster of joined participants, institutions, and connection records.",
      icon: Users,
      onExcel: () => generateAttendanceReport(attendanceRows, quizTitle, "excel"),
      onCsv: () => generateAttendanceReport(attendanceRows, quizTitle, "csv"),
    },
  ];

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-800">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight font-display">
            Reports & Export Center
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Generate and download institutional-grade spreadsheets and PDF performance summaries.
          </p>
        </div>

        {games.length > 0 && (
          <select
            value={selectedGameId}
            onChange={(e) => handleGameSelect(e.target.value)}
            className="px-4 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-slate-200 text-sm font-semibold focus:outline-none focus:border-brand-500"
          >
            {games.map((g) => (
              <option key={g.id} value={g.id}>
                PIN: {g.gamePin} — {g.quizTitle}
              </option>
            ))}
          </select>
        )}
      </div>

      {/* Featured PDF Download Hero Banner (Prompt item 43) */}
      <Card variant="glass" className="p-6 sm:p-8 border-brand-500/30 bg-gradient-to-br from-slate-900 via-slate-900 to-brand-950/40 shadow-2xl flex flex-col sm:flex-row items-center justify-between gap-6">
        <div className="space-y-2">
          <Badge variant="primary" size="sm">
            OFFICIAL PDF REPORT
          </Badge>
          <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight font-display">
            Executive Summary & Results PDF
          </h2>
          <p className="text-xs text-slate-300 max-w-lg leading-relaxed">
            Includes header branding, summary KPI cards, complete student leaderboard, accuracy distribution, and verification footer.
          </p>
        </div>

        <Button
          size="lg"
          onClick={() => {
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
              participants: participantRows,
            });
            showToast({ type: "success", title: "PDF Report Downloaded" });
          }}
          className="gap-2 shadow-xl shadow-brand-600/30 bg-brand-600 hover:bg-brand-500 text-white shrink-0"
        >
          <FileText className="w-5 h-5" />
          <span>Download Official PDF</span>
        </Button>
      </Card>

      {/* Four Core Report Types Grid (Prompt item 41) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {reportCards.map((rc) => {
          const Icon = rc.icon;
          return (
            <Card
              key={rc.title}
              variant="default"
              className="p-6 bg-slate-900/80 border-slate-800 flex flex-col justify-between space-y-4 hover:border-slate-700 transition-colors"
            >
              <div className="space-y-2">
                <div className="w-10 h-10 rounded-xl bg-brand-600/15 border border-brand-500/20 flex items-center justify-center text-brand-400">
                  <Icon className="w-5 h-5" />
                </div>
                <h3 className="font-bold text-white text-base">{rc.title}</h3>
                <p className="text-xs text-slate-400 leading-relaxed">{rc.description}</p>
              </div>

              <div className="flex items-center gap-2 pt-2 border-t border-slate-800/80">
                <Button
                  size="sm"
                  onClick={() => {
                    rc.onExcel();
                    showToast({ type: "success", title: "Excel Report Generated" });
                  }}
                  className="gap-1.5 flex-1 bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-600/20"
                >
                  <FileSpreadsheet className="w-4 h-4" />
                  <span>Excel (.xlsx)</span>
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    rc.onCsv();
                    showToast({ type: "success", title: "CSV Report Generated" });
                  }}
                  className="gap-1.5 flex-1 border-slate-700 text-slate-300 hover:bg-slate-800"
                >
                  <Download className="w-4 h-4" />
                  <span>CSV (.csv)</span>
                </Button>
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}

export default function ReportsCenterPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center p-12">
          <Loader2 className="w-8 h-8 text-brand-400 animate-spin" />
        </div>
      }
    >
      <ReportsCenterContent />
    </Suspense>
  );
}
