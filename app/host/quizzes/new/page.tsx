"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/lib/auth/AuthContext";
import { useToast } from "@/components/ui/Toast";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { createQuiz } from "@/lib/game/quizService";
import { QuizDifficulty, QuizStatus } from "@/types/quiz";
import { ArrowLeft, Sparkles, HelpCircle, ArrowRight } from "lucide-react";

export default function NewQuizPage() {
  const router = useRouter();
  const { profile } = useAuth();
  const { showToast } = useToast();

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("Technology");
  const [difficulty, setDifficulty] = useState<QuizDifficulty>("medium");
  const [instructions, setInstructions] = useState("");
  const [coverImage, setCoverImage] = useState("");
  const [status, setStatus] = useState<QuizStatus>("published");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError("Please enter a quiz name.");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const quizId = await createQuiz({
        name: name.trim(),
        description: description.trim(),
        category: category.trim() || "General",
        difficulty,
        instructions: instructions.trim(),
        coverImage: coverImage.trim() || undefined,
        status,
        hostId: profile?.uid || "host",
        hostName: profile?.displayName || "Host",
      });

      showToast({
        type: "success",
        title: "Quiz Created",
        message: "Now add your questions or upload a spreadsheet.",
      });

      router.push(`/host/quizzes/${quizId}/edit`);
    } catch (err: any) {
      console.error("Failed to create quiz:", err);
      setError(err.message || "Failed to create quiz.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Back button & Header */}
      <div className="flex items-center gap-4">
        <Link href="/host/quizzes">
          <Button variant="ghost" size="sm" className="gap-1.5 text-slate-400">
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Quizzes</span>
          </Button>
        </Link>
      </div>

      <div className="pb-4 border-b border-slate-800">
        <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight font-display">
          Create New Quiz
        </h1>
        <p className="text-sm text-slate-400 mt-1">
          Set up quiz configuration before adding or importing questions.
        </p>
      </div>

      <Card variant="glass" className="p-6 sm:p-8 border-slate-800 shadow-2xl">
        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Quiz Name */}
          <Input
            label="Quiz Name / Title *"
            placeholder="e.g. Advanced Data Structures & Algorithms"
            value={name}
            onChange={(e) => {
              setName(e.target.value);
              if (error) setError(null);
            }}
            required
            autoFocus
          />

          {/* Description */}
          <div className="space-y-1.5 text-left">
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400">
              Description (Optional)
            </label>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Brief summary of the topics covered in this quiz..."
              className="w-full px-4 py-3 bg-slate-900/90 border border-slate-800 rounded-xl text-slate-100 placeholder-slate-500 text-sm focus:outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20"
            />
          </div>

          {/* Category & Difficulty Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400">
                Category
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-4 py-3 bg-slate-900 border border-slate-800 rounded-xl text-slate-200 text-sm focus:outline-none focus:border-brand-500"
              >
                <option value="Computer Science">Computer Science</option>
                <option value="Web Development">Web Development</option>
                <option value="Data Science & AI">Data Science & AI</option>
                <option value="Engineering">Engineering</option>
                <option value="Business & Finance">Business & Finance</option>
                <option value="General Knowledge">General Knowledge</option>
                <option value="Other">Other</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400">
                Difficulty Level
              </label>
              <select
                value={difficulty}
                onChange={(e) => setDifficulty(e.target.value as QuizDifficulty)}
                className="w-full px-4 py-3 bg-slate-900 border border-slate-800 rounded-xl text-slate-200 text-sm focus:outline-none focus:border-brand-500"
              >
                <option value="easy">Easy (Fundamentals)</option>
                <option value="medium">Medium (Standard)</option>
                <option value="hard">Hard (Advanced)</option>
                <option value="mixed">Mixed (Varied)</option>
              </select>
            </div>
          </div>

          {/* Instructions */}
          <div className="space-y-1.5 text-left">
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400">
              Host / Participant Instructions (Optional)
            </label>
            <textarea
              rows={2}
              value={instructions}
              onChange={(e) => setInstructions(e.target.value)}
              placeholder="e.g. No external calculators permitted. Speed-scoring enabled."
              className="w-full px-4 py-2.5 bg-slate-900/90 border border-slate-800 rounded-xl text-slate-100 placeholder-slate-500 text-sm focus:outline-none focus:border-brand-500"
            />
          </div>

          {/* Status Selection */}
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400">
              Initial Status
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setStatus("published")}
                className={`py-2.5 px-4 rounded-xl border text-xs font-semibold transition-all ${
                  status === "published"
                    ? "border-emerald-500 bg-emerald-950/30 text-emerald-300"
                    : "border-slate-800 bg-slate-900 text-slate-400"
                }`}
              >
                Ready / Published
              </button>
              <button
                type="button"
                onClick={() => setStatus("draft")}
                className={`py-2.5 px-4 rounded-xl border text-xs font-semibold transition-all ${
                  status === "draft"
                    ? "border-amber-500 bg-amber-950/30 text-amber-300"
                    : "border-slate-800 bg-slate-900 text-slate-400"
                }`}
              >
                Draft (Work in Progress)
              </button>
            </div>
          </div>

          {error && (
            <div className="p-3 bg-rose-950/60 border border-rose-500/30 rounded-xl text-rose-300 text-xs font-medium">
              {error}
            </div>
          )}

          {/* Submit */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
            <Link href="/host/quizzes">
              <Button type="button" variant="ghost">
                Cancel
              </Button>
            </Link>
            <Button type="submit" size="lg" isLoading={isLoading} className="gap-2">
              <span>Create & Add Questions</span>
              <ArrowRight className="w-4 h-4" />
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
