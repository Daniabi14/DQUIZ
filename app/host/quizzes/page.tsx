"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth/AuthContext";
import { useToast } from "@/components/ui/Toast";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Quiz } from "@/types/quiz";
import { getQuizzes, deleteQuiz, duplicateQuiz } from "@/lib/game/quizService";
import {
  Layers,
  Plus,
  Search,
  Play,
  Edit3,
  Copy,
  Trash2,
  Filter,
  ArrowUpDown,
  Clock,
  Award,
  UploadCloud,
  HelpCircle,
} from "lucide-react";

export default function MyQuizzesPage() {
  const router = useRouter();
  const { profile } = useAuth();
  const { showToast } = useToast();

  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedDifficulty, setSelectedDifficulty] = useState("all");
  const [selectedStatus, setSelectedStatus] = useState("all");
  const [isLoading, setIsLoading] = useState(true);

  const loadQuizzes = async () => {
    setIsLoading(true);
    try {
      const data = await getQuizzes(profile?.uid);
      setQuizzes(data);
    } catch (err) {
      console.error("Failed to load quizzes:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadQuizzes();
  }, [profile?.uid]);

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to delete "${name}"? This action cannot be undone.`)) return;
    try {
      await deleteQuiz(id);
      showToast({
        type: "success",
        title: "Quiz Deleted",
        message: `"${name}" has been removed.`,
      });
      loadQuizzes();
    } catch (err: any) {
      showToast({
        type: "error",
        title: "Error",
        message: err.message || "Failed to delete quiz.",
      });
    }
  };

  const handleDuplicate = async (id: string, name: string) => {
    try {
      const newId = await duplicateQuiz(id, profile?.uid || "host");
      showToast({
        type: "success",
        title: "Quiz Duplicated",
        message: `Created a copy of "${name}".`,
      });
      loadQuizzes();
    } catch (err: any) {
      showToast({
        type: "error",
        title: "Error",
        message: err.message || "Failed to duplicate quiz.",
      });
    }
  };

  const filteredQuizzes = quizzes.filter((q) => {
    const matchesSearch =
      q.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      q.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      q.category?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === "all" || q.category === selectedCategory;
    const matchesDifficulty = selectedDifficulty === "all" || q.difficulty === selectedDifficulty;
    const matchesStatus = selectedStatus === "all" || q.status === selectedStatus;
    return matchesSearch && matchesCategory && matchesDifficulty && matchesStatus;
  });

  const categories = Array.from(new Set(quizzes.map((q) => q.category).filter(Boolean)));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-800">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight font-display">
            My Quizzes
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Create, manage, and launch live quiz competitions from your library.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link href="/host/upload">
            <Button variant="secondary" size="md" className="gap-2 border-slate-700">
              <UploadCloud className="w-4 h-4 text-brand-400" />
              <span className="hidden sm:inline">Bulk Upload</span>
            </Button>
          </Link>
          <Link href="/host/quizzes/new">
            <Button variant="primary" size="md" className="gap-2 shadow-lg shadow-brand-600/20">
              <Plus className="w-4 h-4" />
              <span>Create New Quiz</span>
            </Button>
          </Link>
        </div>
      </div>

      {/* Search & Filters Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="relative">
          <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search quizzes..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-slate-900/90 border border-slate-800 rounded-xl text-slate-100 placeholder-slate-500 text-sm focus:outline-none focus:border-brand-500"
          />
        </div>

        <select
          value={selectedCategory}
          onChange={(e) => setSelectedCategory(e.target.value)}
          className="px-3.5 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-slate-300 text-sm focus:outline-none focus:border-brand-500"
        >
          <option value="all">All Categories</option>
          {categories.map((cat) => (
            <option key={cat} value={cat}>
              {cat}
            </option>
          ))}
        </select>

        <select
          value={selectedDifficulty}
          onChange={(e) => setSelectedDifficulty(e.target.value)}
          className="px-3.5 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-slate-300 text-sm focus:outline-none focus:border-brand-500"
        >
          <option value="all">All Difficulties</option>
          <option value="easy">Easy</option>
          <option value="medium">Medium</option>
          <option value="hard">Hard</option>
          <option value="mixed">Mixed</option>
        </select>

        <select
          value={selectedStatus}
          onChange={(e) => setSelectedStatus(e.target.value)}
          className="px-3.5 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-slate-300 text-sm focus:outline-none focus:border-brand-500"
        >
          <option value="all">All Statuses</option>
          <option value="published">Published</option>
          <option value="draft">Draft</option>
          <option value="archived">Archived</option>
        </select>
      </div>

      {/* Quizzes Grid */}
      {filteredQuizzes.length === 0 ? (
        <Card variant="glass" className="p-12 text-center border-slate-800/80 space-y-4">
          <div className="w-14 h-14 rounded-2xl bg-brand-600/10 border border-brand-500/20 flex items-center justify-center mx-auto text-brand-400">
            <Layers className="w-7 h-7" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-white">No quizzes found</h3>
            <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
              {searchQuery
                ? "Try adjusting your search filters."
                : "Create your first interactive quiz or bulk import questions to get started."}
            </p>
          </div>
          <Link href="/host/quizzes/new">
            <Button size="md" className="gap-2">
              <Plus className="w-4 h-4" />
              <span>Create Your First Quiz</span>
            </Button>
          </Link>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredQuizzes.map((quiz) => (
            <Card
              key={quiz.id}
              variant="default"
              hoverEffect
              className="p-5 flex flex-col justify-between space-y-4 bg-slate-900/70 border-slate-800"
            >
              <div className="space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <Badge
                    variant={
                      quiz.status === "published"
                        ? "success"
                        : quiz.status === "draft"
                        ? "warning"
                        : "secondary"
                    }
                    size="sm"
                  >
                    {quiz.status}
                  </Badge>

                  <Badge variant="outline" size="sm" className="capitalize text-slate-400">
                    {quiz.difficulty}
                  </Badge>
                </div>

                <div>
                  <h3 className="font-bold text-white text-base leading-tight hover:text-brand-300 transition-colors">
                    {quiz.name}
                  </h3>
                  {quiz.description && (
                    <p className="text-xs text-slate-400 mt-1 line-clamp-2 leading-relaxed">
                      {quiz.description}
                    </p>
                  )}
                </div>

                <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
                  <div className="flex items-center gap-1.5 font-medium">
                    <HelpCircle className="w-3.5 h-3.5 text-brand-400" />
                    <span>{quiz.questionCount} Questions</span>
                  </div>
                  <div className="flex items-center gap-1.5 font-medium">
                    <Award className="w-3.5 h-3.5 text-amber-400" />
                    <span>{quiz.totalPoints || quiz.questionCount * 1000} Pts</span>
                  </div>
                </div>
              </div>

              {/* Card Actions */}
              <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between gap-2">
                <div className="flex items-center gap-1">
                  <Link href={`/host/quizzes/${quiz.id}/edit`}>
                    <button
                      className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                      title="Edit Quiz & Questions"
                    >
                      <Edit3 className="w-4 h-4" />
                    </button>
                  </Link>
                  <button
                    onClick={() => handleDuplicate(quiz.id, quiz.name)}
                    className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                    title="Duplicate Quiz"
                  >
                    <Copy className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(quiz.id, quiz.name)}
                    className="p-2 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-950/30 transition-colors"
                    title="Delete Quiz"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                <Link href={`/host/games/launch?quizId=${quiz.id}`}>
                  <Button size="sm" className="gap-1.5 bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-600/20">
                    <Play className="w-3.5 h-3.5 fill-current" />
                    <span>Host Live</span>
                  </Button>
                </Link>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
