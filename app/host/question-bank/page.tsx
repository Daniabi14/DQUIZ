"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useAuth } from "@/lib/auth/AuthContext";
import { useToast } from "@/components/ui/Toast";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Question } from "@/types/question";
import { QuestionPreviewModal } from "@/components/quiz/QuestionPreviewModal";
import { getAllHostQuestions, deleteQuestion } from "@/lib/game/quizService";
import {
  HelpCircle,
  Search,
  Filter,
  Eye,
  Edit3,
  Trash2,
  Clock,
  Award,
  Layers,
  ArrowRight,
  Plus,
  Loader2,
} from "lucide-react";

interface BankItem {
  question: Question;
  quizName: string;
  quizCategory: string;
}

export default function QuestionBankPage() {
  const { profile } = useAuth();
  const { showToast } = useToast();

  const [items, setItems] = useState<BankItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedType, setSelectedType] = useState("all");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [previewQuestion, setPreviewQuestion] = useState<Question | null>(null);

  const loadQuestions = async () => {
    setIsLoading(true);
    try {
      const data = await getAllHostQuestions(profile?.uid);
      setItems(data);
    } catch (err) {
      console.error("Failed to load question bank:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadQuestions();
  }, [profile?.uid]);

  const handleDelete = async (quizId?: string, questionId?: string) => {
    if (!quizId || !questionId) return;
    if (!confirm("Are you sure you want to delete this question?")) return;
    try {
      await deleteQuestion(quizId, questionId);
      showToast({
        type: "success",
        title: "Question Deleted",
        message: "Question removed from library.",
      });
      loadQuestions();
    } catch (err: any) {
      showToast({ type: "error", title: "Error", message: err.message });
    }
  };

  const categories = Array.from(new Set(items.map((i) => i.quizCategory).filter(Boolean)));

  const filteredItems = items.filter((item) => {
    const q = item.question;
    const matchesSearch =
      q.questionText.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.quizName.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesType = selectedType === "all" || q.type === selectedType;
    const matchesCat = selectedCategory === "all" || item.quizCategory === selectedCategory;
    return matchesSearch && matchesType && matchesCat;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-800">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight font-display">
            Question Bank
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Global repository of all questions created across your quizzes.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link href="/host/quizzes">
            <Button variant="primary" size="md" className="gap-2">
              <Layers className="w-4 h-4" />
              <span>Go to Quizzes</span>
            </Button>
          </Link>
        </div>
      </div>

      {/* Search & Filter Controls */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="relative">
          <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search questions by keyword..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-slate-900/90 border border-slate-800 rounded-xl text-slate-100 placeholder-slate-500 text-sm focus:outline-none focus:border-brand-500"
          />
        </div>

        <select
          value={selectedType}
          onChange={(e) => setSelectedType(e.target.value)}
          className="px-3.5 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-slate-300 text-sm focus:outline-none focus:border-brand-500"
        >
          <option value="all">All Question Types</option>
          <option value="single_choice">Single Choice</option>
          <option value="true_false">True / False</option>
          <option value="multiple_choice">Multiple Choice</option>
        </select>

        <select
          value={selectedCategory}
          onChange={(e) => setSelectedCategory(e.target.value)}
          className="px-3.5 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-slate-300 text-sm focus:outline-none focus:border-brand-500"
        >
          <option value="all">All Categories</option>
          {categories.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
      </div>

      {/* Questions Table / List */}
      {isLoading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="w-8 h-8 text-brand-400 animate-spin" />
        </div>
      ) : filteredItems.length === 0 ? (
        <Card variant="glass" className="p-12 text-center border-slate-800/80 space-y-4">
          <div className="w-14 h-14 rounded-2xl bg-brand-600/10 border border-brand-500/20 flex items-center justify-center mx-auto text-brand-400">
            <HelpCircle className="w-7 h-7" />
          </div>
          <div>
            <h3 className="text-base font-bold text-white">No questions found</h3>
            <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
              {searchQuery
                ? "No questions match your current search criteria."
                : "Create a quiz or upload questions to populate your question bank."}
            </p>
          </div>
          <Link href="/host/quizzes/new">
            <Button size="md" className="gap-2">
              <Plus className="w-4 h-4" />
              <span>Create New Quiz</span>
            </Button>
          </Link>
        </Card>
      ) : (
        <div className="space-y-3">
          {filteredItems.map(({ question: q, quizName, quizCategory }) => (
            <Card
              key={q.id}
              variant="default"
              className="p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-900/80 border-slate-800 hover:border-slate-700 transition-colors"
            >
              <div className="space-y-2 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant="primary" size="sm">
                    {q.type.replace("_", " ")}
                  </Badge>
                  <span className="text-xs text-slate-400 font-medium px-2 py-0.5 bg-slate-800 rounded-md">
                    {quizName}
                  </span>
                  <span className="text-xs text-slate-500">•</span>
                  <span className="text-xs text-slate-400 font-mono">
                    {q.timeLimit}s • {q.points} Pts
                  </span>
                </div>

                <h3 className="font-bold text-white text-sm leading-snug">
                  {q.questionText}
                </h3>

                <div className="flex flex-wrap gap-2 text-xs text-slate-400">
                  {q.options.map((opt, i) => (
                    <span
                      key={opt.id}
                      className={`px-2 py-0.5 rounded ${
                        q.correctOptionIds.includes(opt.id)
                          ? "bg-emerald-950/40 text-emerald-300 border border-emerald-500/30 font-semibold"
                          : "bg-slate-950 border border-slate-800 text-slate-400"
                      }`}
                    >
                      {String.fromCharCode(65 + i)}. {opt.text}
                    </span>
                  ))}
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2 self-end md:self-center shrink-0">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPreviewQuestion(q)}
                  className="gap-1.5 text-xs text-slate-300"
                >
                  <Eye className="w-3.5 h-3.5 text-brand-400" />
                  <span>Preview</span>
                </Button>

                {q.quizId && (
                  <Link href={`/host/quizzes/${q.quizId}/edit`}>
                    <button
                      className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                      title="Edit in Quiz"
                    >
                      <Edit3 className="w-4 h-4" />
                    </button>
                  </Link>
                )}

                <button
                  onClick={() => handleDelete(q.quizId, q.id)}
                  className="p-2 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-950/30 transition-colors"
                  title="Delete Question"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Preview Modal */}
      <QuestionPreviewModal
        isOpen={Boolean(previewQuestion)}
        onClose={() => setPreviewQuestion(null)}
        question={previewQuestion}
      />
    </div>
  );
}
