"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/lib/auth/AuthContext";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import {
  Layers,
  HelpCircle,
  Radio,
  Users,
  Plus,
  UploadCloud,
  Play,
  ArrowRight,
  TrendingUp,
  Clock,
  Sparkles,
} from "lucide-react";
import { collection, query, where, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase/client";

export default function HostDashboardPage() {
  const { profile } = useAuth();
  const [stats, setStats] = useState({
    totalQuizzes: 4,
    totalQuestions: 48,
    totalGames: 12,
    totalParticipants: 384,
  });

  const [recentQuizzes, setRecentQuizzes] = useState([
    {
      id: "quiz_1",
      name: "Computer Science Fundamentals",
      category: "Technology",
      difficulty: "medium",
      questionCount: 15,
      status: "published",
      updatedAt: "2 hours ago",
    },
    {
      id: "quiz_2",
      name: "Modern Web Architecture & Cloud",
      category: "Engineering",
      difficulty: "hard",
      questionCount: 20,
      status: "published",
      updatedAt: "Yesterday",
    },
    {
      id: "quiz_3",
      name: "General Science & Logic Trivia",
      category: "General Knowledge",
      difficulty: "easy",
      questionCount: 10,
      status: "draft",
      updatedAt: "3 days ago",
    },
  ]);

  return (
    <div className="space-y-8">
      {/* Welcome Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-800">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight font-display">
            Welcome back, {profile?.displayName || "Host"}
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Manage your question banks, launch live sessions, and analyze player performance.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link href="/host/upload">
            <Button variant="secondary" size="md" className="gap-2 border-slate-700">
              <UploadCloud className="w-4 h-4 text-brand-400" />
              <span>Upload Questions</span>
            </Button>
          </Link>
          <Link href="/host/quizzes/new">
            <Button variant="primary" size="md" className="gap-2 shadow-lg shadow-brand-600/20">
              <Plus className="w-4 h-4" />
              <span>Create Quiz</span>
            </Button>
          </Link>
        </div>
      </div>

      {/* Metric Cards (Prompt item 13) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <Card variant="glass" className="p-5 border-slate-800 flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Total Quizzes</p>
            <p className="text-2xl sm:text-3xl font-extrabold text-white font-display mt-1">
              {stats.totalQuizzes}
            </p>
            <span className="text-[11px] text-emerald-400 font-medium flex items-center gap-1 mt-1">
              <TrendingUp className="w-3 h-3" /> 2 active drafts
            </span>
          </div>
          <div className="w-12 h-12 rounded-xl bg-brand-500/10 border border-brand-500/20 flex items-center justify-center text-brand-400">
            <Layers className="w-6 h-6" />
          </div>
        </Card>

        <Card variant="glass" className="p-5 border-slate-800 flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Total Questions</p>
            <p className="text-2xl sm:text-3xl font-extrabold text-white font-display mt-1">
              {stats.totalQuestions}
            </p>
            <span className="text-[11px] text-brand-400 font-medium flex items-center gap-1 mt-1">
              <Sparkles className="w-3 h-3" /> Across 3 banks
            </span>
          </div>
          <div className="w-12 h-12 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
            <HelpCircle className="w-6 h-6" />
          </div>
        </Card>

        <Card variant="glass" className="p-5 border-slate-800 flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Total Games</p>
            <p className="text-2xl sm:text-3xl font-extrabold text-white font-display mt-1">
              {stats.totalGames}
            </p>
            <span className="text-[11px] text-purple-400 font-medium flex items-center gap-1 mt-1">
              <Radio className="w-3 h-3" /> Live & Completed
            </span>
          </div>
          <div className="w-12 h-12 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400">
            <Radio className="w-6 h-6" />
          </div>
        </Card>

        <Card variant="glass" className="p-5 border-slate-800 flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Total Participants</p>
            <p className="text-2xl sm:text-3xl font-extrabold text-white font-display mt-1">
              {stats.totalParticipants}
            </p>
            <span className="text-[11px] text-emerald-400 font-medium flex items-center gap-1 mt-1">
              <Users className="w-3 h-3" /> 100% privacy safe
            </span>
          </div>
          <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
            <Users className="w-6 h-6" />
          </div>
        </Card>
      </div>

      {/* Quick Launch & Active Games section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Quizzes List */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-white tracking-tight font-display">
              My Recent Quizzes
            </h2>
            <Link href="/host/quizzes" className="text-xs text-brand-400 hover:text-brand-300 font-medium flex items-center gap-1">
              <span>View All</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="space-y-3">
            {recentQuizzes.map((quiz) => (
              <Card
                key={quiz.id}
                variant="default"
                hoverEffect
                className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900/60"
              >
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2.5">
                    <h3 className="font-bold text-white text-base hover:text-brand-300 transition-colors">
                      {quiz.name}
                    </h3>
                    <Badge
                      variant={quiz.status === "published" ? "success" : "secondary"}
                      size="sm"
                    >
                      {quiz.status}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-4 text-xs text-slate-400">
                    <span>{quiz.category}</span>
                    <span>•</span>
                    <span className="capitalize">{quiz.difficulty}</span>
                    <span>•</span>
                    <span>{quiz.questionCount} Questions</span>
                  </div>
                </div>

                <div className="flex items-center gap-2 self-end sm:self-center">
                  <Link href={`/host/games/launch?quizId=${quiz.id}`}>
                    <Button size="sm" className="gap-1.5 bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-600/20">
                      <Play className="w-3.5 h-3.5 fill-current" />
                      <span>Launch Live</span>
                    </Button>
                  </Link>
                </div>
              </Card>
            ))}
          </div>
        </div>

        {/* Live Session Quick Panel */}
        <div className="space-y-4">
          <h2 className="text-lg font-bold text-white tracking-tight font-display">
            Quick Game Setup
          </h2>
          <Card variant="glass" className="p-6 border-slate-800 space-y-5">
            <div className="p-4 bg-brand-950/40 border border-brand-500/20 rounded-xl space-y-2">
              <div className="flex items-center gap-2 text-brand-400 font-semibold text-xs uppercase tracking-wider">
                <Radio className="w-4 h-4 animate-pulse" />
                <span>Instant Multiplayer Game</span>
              </div>
              <p className="text-xs text-slate-300">
                Generate an instant Game PIN, project the QR code, and start receiving live student answers.
              </p>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between text-xs text-slate-400">
                <span>Anti-Cheating Mode</span>
                <span className="text-emerald-400 font-semibold">Enabled</span>
              </div>
              <div className="flex items-center justify-between text-xs text-slate-400">
                <span>Question Randomization</span>
                <span className="text-brand-400 font-semibold">Fisher-Yates</span>
              </div>
              <div className="flex items-center justify-between text-xs text-slate-400">
                <span>Student Results Privacy</span>
                <span className="text-emerald-400 font-semibold">Guaranteed</span>
              </div>
            </div>

            <Link href="/host/quizzes" className="block">
              <Button size="lg" className="w-full gap-2">
                <Play className="w-4 h-4 fill-current" />
                <span>Start Live Session</span>
              </Button>
            </Link>
          </Card>
        </div>
      </div>
    </div>
  );
}
