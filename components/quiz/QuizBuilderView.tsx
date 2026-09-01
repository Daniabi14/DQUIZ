"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/lib/auth/AuthContext";
import { useToast } from "@/components/ui/Toast";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { QuestionEditorModal } from "@/components/quiz/QuestionEditorModal";
import { QuestionPreviewModal } from "@/components/quiz/QuestionPreviewModal";
import { Quiz } from "@/types/quiz";
import { Question } from "@/types/question";
import {
  getQuizById,
  updateQuiz,
  getQuestions,
  createQuestion,
  updateQuestion,
  deleteQuestion,
  reorderQuestions,
} from "@/lib/game/quizService";
import {
  ArrowLeft,
  Plus,
  Play,
  UploadCloud,
  Edit3,
  Trash2,
  Eye,
  ArrowUp,
  ArrowDown,
  Clock,
  Award,
  HelpCircle,
  Save,
  Loader2,
} from "lucide-react";

export function QuizBuilderView() {
  const params = useParams();
  const quizId = params.id as string;
  const router = useRouter();
  const { profile } = useAuth();
  const { showToast } = useToast();

  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Modals state
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState<Question | null>(null);
  const [previewQuestion, setPreviewQuestion] = useState<Question | null>(null);

  // Metadata inline edit
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("General");
  const [difficulty, setDifficulty] = useState<any>("medium");
  const [isSavingMeta, setIsSavingMeta] = useState(false);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const qz = await getQuizById(quizId);
      if (!qz) {
        showToast({ type: "error", title: "Quiz not found" });
        router.push("/host/quizzes");
        return;
      }
      setQuiz(qz);
      setName(qz.name);
      setDescription(qz.description || "");
      setCategory(qz.category || "General");
      setDifficulty(qz.difficulty || "medium");

      const qs = await getQuestions(quizId);
      setQuestions(qs);
    } catch (err) {
      console.error("Failed to load quiz data:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (quizId) loadData();
  }, [quizId]);

  const handleSaveMetadata = async () => {
    if (!name.trim()) return;
    setIsSavingMeta(true);
    try {
      await updateQuiz(quizId, {
        name: name.trim(),
        description: description.trim(),
        category,
        difficulty,
      });
      showToast({
        type: "success",
        title: "Settings Saved",
        message: "Quiz details updated successfully.",
      });
    } catch (err: any) {
      showToast({ type: "error", title: "Error", message: err.message });
    } finally {
      setIsSavingMeta(false);
    }
  };

  const handleSaveQuestion = async (
    questionData: Partial<Question>,
    addAnother = false
  ) => {
    if (editingQuestion) {
      await updateQuestion(quizId, editingQuestion.id, questionData);
      showToast({
        type: "success",
        title: "Question Updated",
        message: `Question #${editingQuestion.orderNumber} saved.`,
      });
    } else {
      await createQuestion(quizId, questionData);
      showToast({
        type: "success",
        title: "Question Added",
        message: `Question #${questions.length + 1} added.`,
      });
    }
    const updatedQs = await getQuestions(quizId);
    setQuestions(updatedQs);
    if (!addAnother) {
      setIsEditorOpen(false);
      setEditingQuestion(null);
    }
  };

  const handleDeleteQuestion = async (q: Question) => {
    if (!confirm(`Delete question #${q.orderNumber}: "${q.questionText.slice(0, 40)}..."?`)) return;
    try {
      await deleteQuestion(quizId, q.id);
      showToast({
        type: "success",
        title: "Question Deleted",
        message: `Question #${q.orderNumber} removed.`,
      });
      const updated = await getQuestions(quizId);
      setQuestions(updated);
    } catch (err: any) {
      showToast({ type: "error", title: "Error", message: err.message });
    }
  };

  const handleMoveQuestion = async (index: number, direction: "up" | "down") => {
    const targetIndex = direction === "up" ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= questions.length) return;

    const newArr = [...questions];
    const temp = newArr[index];
    newArr[index] = newArr[targetIndex];
    newArr[targetIndex] = temp;

    setQuestions(newArr);
    await reorderQuestions(quizId, newArr);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <Loader2 className="w-8 h-8 text-brand-400 animate-spin" />
      </div>
    );
  }

  const totalPoints = questions.reduce((sum, q) => sum + (q.points || 0), 0);
  const totalTimeSeconds = questions.reduce((sum, q) => sum + (q.timeLimit || 20), 0);

  return (
    <div className="space-y-8">
      {/* Top action bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div className="flex items-center gap-3">
          <Link href="/host/quizzes">
            <Button variant="ghost" size="sm" className="gap-1 text-slate-400">
              <ArrowLeft className="w-4 h-4" />
              <span>Quizzes</span>
            </Button>
          </Link>
          <span className="text-slate-600">/</span>
          <h1 className="text-xl font-bold text-white tracking-tight truncate max-w-md">
            {quiz?.name}
          </h1>
        </div>

        <div className="flex items-center gap-2.5">
          <Link href={`/host/upload?quizId=${quizId}`}>
            <Button variant="secondary" size="sm" className="gap-1.5 border-slate-700">
              <UploadCloud className="w-4 h-4 text-brand-400" />
              <span>Import Excel / CSV</span>
            </Button>
          </Link>
          <Link href={`/host/games/launch?quizId=${quizId}`}>
            <Button size="sm" className="gap-1.5 bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-600/20">
              <Play className="w-3.5 h-3.5 fill-current" />
              <span>Launch Live Game</span>
            </Button>
          </Link>
        </div>
      </div>

      {/* Quiz Details Panel */}
      <Card variant="glass" className="p-6 border-slate-800 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold uppercase tracking-wider text-slate-400">
            Quiz Configuration
          </h2>
          <Button
            variant="outline"
            size="sm"
            onClick={handleSaveMetadata}
            isLoading={isSavingMeta}
            className="gap-1.5 text-xs"
          >
            <Save className="w-3.5 h-3.5 text-brand-400" />
            <span>Save Details</span>
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="md:col-span-2 space-y-3">
            <Input
              label="Quiz Title"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Quiz title..."
            />
            <div className="space-y-1">
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400">
                Description
              </label>
              <textarea
                rows={2}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Description..."
                className="w-full px-4 py-2 bg-slate-900 border border-slate-800 rounded-xl text-slate-100 placeholder-slate-500 text-sm focus:outline-none focus:border-brand-500"
              />
            </div>
          </div>

          <div className="space-y-3">
            <div className="space-y-1">
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400">
                Category
              </label>
              <input
                type="text"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-4 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-slate-100 text-sm focus:outline-none focus:border-brand-500"
              />
            </div>

            <div className="space-y-1">
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400">
                Difficulty
              </label>
              <select
                value={difficulty}
                onChange={(e) => setDifficulty(e.target.value)}
                className="w-full px-4 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-slate-200 text-sm focus:outline-none focus:border-brand-500"
              >
                <option value="easy">Easy</option>
                <option value="medium">Medium</option>
                <option value="hard">Hard</option>
                <option value="mixed">Mixed</option>
              </select>
            </div>
          </div>
        </div>

        {/* Summary badges */}
        <div className="pt-3 border-t border-slate-800/80 flex flex-wrap items-center gap-4 text-xs text-slate-300">
          <div className="flex items-center gap-1.5">
            <HelpCircle className="w-4 h-4 text-brand-400" />
            <span className="font-bold text-white">{questions.length}</span>
            <span>Questions</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Award className="w-4 h-4 text-amber-400" />
            <span className="font-bold text-white">{totalPoints}</span>
            <span>Total Points</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Clock className="w-4 h-4 text-emerald-400" />
            <span className="font-bold text-white">~{Math.ceil(totalTimeSeconds / 60)}</span>
            <span>Min Duration</span>
          </div>
        </div>
      </Card>

      {/* Question Builder Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-white tracking-tight font-display">
              Questions ({questions.length})
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Add, arrange, and configure points and timers for each question.
            </p>
          </div>

          <Button
            size="md"
            onClick={() => {
              setEditingQuestion(null);
              setIsEditorOpen(true);
            }}
            className="gap-2 shadow-lg shadow-brand-600/20"
          >
            <Plus className="w-4 h-4" />
            <span>Add Question</span>
          </Button>
        </div>

        {/* Question Cards List */}
        {questions.length === 0 ? (
          <Card variant="glass" className="p-12 text-center border-slate-800/80 space-y-4">
            <div className="w-14 h-14 rounded-2xl bg-brand-600/10 border border-brand-500/20 flex items-center justify-center mx-auto text-brand-400">
              <HelpCircle className="w-7 h-7" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">No questions in this quiz yet</h3>
              <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
                Add single-choice, true/false, or multiple-choice questions manually, or upload a spreadsheet.
              </p>
            </div>
            <div className="flex items-center justify-center gap-3 pt-2">
              <Button
                size="md"
                onClick={() => {
                  setEditingQuestion(null);
                  setIsEditorOpen(true);
                }}
                className="gap-2"
              >
                <Plus className="w-4 h-4" />
                <span>Add Question Manually</span>
              </Button>
              <Link href={`/host/upload?quizId=${quizId}`}>
                <Button variant="secondary" size="md" className="gap-2">
                  <UploadCloud className="w-4 h-4 text-brand-400" />
                  <span>Bulk Upload</span>
                </Button>
              </Link>
            </div>
          </Card>
        ) : (
          <div className="space-y-3">
            {questions.map((q, idx) => (
              <Card
                key={q.id}
                variant="default"
                className="p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-900/80 border-slate-800 hover:border-slate-700 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="flex flex-col gap-1">
                    <button
                      disabled={idx === 0}
                      onClick={() => handleMoveQuestion(idx, "up")}
                      className="p-1 rounded bg-slate-800 text-slate-400 hover:text-white disabled:opacity-30 disabled:pointer-events-none"
                      title="Move Up"
                    >
                      <ArrowUp className="w-3.5 h-3.5" />
                    </button>
                    <button
                      disabled={idx === questions.length - 1}
                      onClick={() => handleMoveQuestion(idx, "down")}
                      className="p-1 rounded bg-slate-800 text-slate-400 hover:text-white disabled:opacity-30 disabled:pointer-events-none"
                      title="Move Down"
                    >
                      <ArrowDown className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <div className="w-9 h-9 rounded-xl bg-brand-600/20 border border-brand-500/30 flex items-center justify-center font-bold text-sm text-brand-300 font-mono shrink-0">
                    {idx + 1}
                  </div>

                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary" size="sm">
                        {q.type.replace("_", " ")}
                      </Badge>
                      <span className="text-xs text-slate-400 font-mono">
                        {q.timeLimit}s • {q.points} Pts
                      </span>
                    </div>
                    <h3 className="font-bold text-white text-sm leading-snug line-clamp-2">
                      {q.questionText}
                    </h3>
                  </div>
                </div>

                <div className="flex items-center gap-2 self-end md:self-center shrink-0">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPreviewQuestion(q)}
                    className="gap-1.5 text-xs text-slate-300"
                    title="Live Preview"
                  >
                    <Eye className="w-3.5 h-3.5 text-brand-400" />
                    <span>Preview</span>
                  </Button>

                  <button
                    onClick={() => {
                      setEditingQuestion(q);
                      setIsEditorOpen(true);
                    }}
                    className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                    title="Edit Question"
                  >
                    <Edit3 className="w-4 h-4" />
                  </button>

                  <button
                    onClick={() => handleDeleteQuestion(q)}
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
      </div>

      {/* Modals */}
      <QuestionEditorModal
        isOpen={isEditorOpen}
        onClose={() => {
          setIsEditorOpen(false);
          setEditingQuestion(null);
        }}
        onSave={handleSaveQuestion}
        editingQuestion={editingQuestion}
        orderNumber={editingQuestion ? editingQuestion.orderNumber : questions.length + 1}
      />

      <QuestionPreviewModal
        isOpen={Boolean(previewQuestion)}
        onClose={() => setPreviewQuestion(null)}
        question={previewQuestion}
        totalQuestions={questions.length}
      />
    </div>
  );
}
