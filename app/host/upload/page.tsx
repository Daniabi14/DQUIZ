"use client";

import React, { useState, useEffect, useRef, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/lib/auth/AuthContext";
import { useToast } from "@/components/ui/Toast";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Modal } from "@/components/ui/Modal";
import { Input } from "@/components/ui/Input";
import { Quiz } from "@/types/quiz";
import { Question } from "@/types/question";
import {
  getQuizzes,
  getQuizById,
  createQuiz,
  getQuestions,
  createQuestion,
  reorderQuestions,
} from "@/lib/game/quizService";
import {
  downloadExcelTemplate,
  downloadCsvTemplate,
} from "@/lib/uploads/templateGenerator";
import {
  parseAndValidateQuestions,
  downloadErrorReport,
  ValidationResult,
} from "@/lib/uploads/validationEngine";
import {
  UploadCloud,
  FileSpreadsheet,
  Download,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Eye,
  ArrowRight,
  Layers,
  Sparkles,
  RotateCcw,
  Loader2,
} from "lucide-react";

function UploadQuestionsContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialQuizId = searchParams.get("quizId") || "";

  const { profile } = useAuth();
  const { showToast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [selectedQuizId, setSelectedQuizId] = useState<string>(initialQuizId);
  const [newQuizTitle, setNewQuizTitle] = useState("");
  const [newQuizCategory, setNewQuizCategory] = useState("General Knowledge");

  const [file, setFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [validationResult, setValidationResult] = useState<ValidationResult | null>(null);
  const [importMode, setImportMode] = useState<"add" | "replace">("add");
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [activeTab, setActiveTab] = useState<"preview" | "errors">("preview");

  useEffect(() => {
    async function load() {
      const list = await getQuizzes(profile?.uid);
      setQuizzes(list);
      if (initialQuizId && list.some((q) => q.id === initialQuizId)) {
        setSelectedQuizId(initialQuizId);
      }
    }
    load();
  }, [profile?.uid, initialQuizId]);

  const handleFileSelected = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    setFile(selectedFile);
    setIsProcessing(true);
    setValidationResult(null);

    try {
      const result = await parseAndValidateQuestions(selectedFile, selectedQuizId || "temp");
      setValidationResult(result);
      if (result.errorCount > 0 && result.validCount === 0) {
        setActiveTab("errors");
      } else {
        setActiveTab("preview");
      }
    } catch (err: any) {
      showToast({
        type: "error",
        title: "Parsing Error",
        message: err.message || "Failed to parse file.",
      });
      setFile(null);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleReset = () => {
    setFile(null);
    setValidationResult(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleExecuteImport = async () => {
    if (!validationResult || validationResult.validQuestions.length === 0) return;

    setIsImporting(true);

    try {
      let targetQuizId = selectedQuizId;

      // If creating a brand new quiz from spreadsheet:
      if (!targetQuizId || targetQuizId === "new") {
        targetQuizId = await createQuiz({
          name: newQuizTitle.trim() || file?.name.replace(/\.[^/.]+$/, "") || "Imported Quiz",
          category: newQuizCategory.trim() || "General",
          hostId: profile?.uid || "host",
          hostName: profile?.displayName || "Host",
          status: "published",
        });
      }

      if (importMode === "replace") {
        // Replace all existing questions
        const indexedQuestions = validationResult.validQuestions.map((q, idx) => ({
          ...q,
          quizId: targetQuizId,
          orderNumber: idx + 1,
        }));
        await reorderQuestions(targetQuizId, indexedQuestions);
      } else {
        // Append to existing questions
        const existing = await getQuestions(targetQuizId);
        const startIdx = existing.length;

        for (let i = 0; i < validationResult.validQuestions.length; i++) {
          const q = validationResult.validQuestions[i];
          await createQuestion(targetQuizId, {
            ...q,
            orderNumber: startIdx + i + 1,
          });
        }
      }

      showToast({
        type: "success",
        title: "Import Successful!",
        message: `Imported ${validationResult.validCount} questions into quiz.`,
      });

      router.push(`/host/quizzes/${targetQuizId}/edit`);
    } catch (err: any) {
      showToast({
        type: "error",
        title: "Import Failed",
        message: err.message || "Failed to complete import.",
      });
    } finally {
      setIsImporting(false);
      setIsConfirmModalOpen(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-800">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight font-display">
            Bulk Question Upload
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Import questions via Excel (.xlsx) or CSV (.csv) with pre-validation and error diagnostics.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => downloadExcelTemplate()}
            className="gap-2 border-emerald-500/30 text-emerald-300 hover:bg-emerald-950/30"
          >
            <Download className="w-4 h-4 text-emerald-400" />
            <span>Excel Template</span>
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => downloadCsvTemplate()}
            className="gap-2 border-slate-700 text-slate-300"
          >
            <Download className="w-4 h-4 text-slate-400" />
            <span>CSV Template</span>
          </Button>
        </div>
      </div>

      {/* Target Quiz Selector */}
      <Card variant="glass" className="p-6 border-slate-800 space-y-4">
        <h2 className="text-sm font-bold uppercase tracking-wider text-slate-400">
          1. Select Destination Quiz
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400">
              Destination Quiz
            </label>
            <select
              value={selectedQuizId}
              onChange={(e) => setSelectedQuizId(e.target.value)}
              className="w-full px-4 py-3 bg-slate-900 border border-slate-800 rounded-xl text-slate-200 text-sm focus:outline-none focus:border-brand-500"
            >
              <option value="new">+ Create New Quiz from File</option>
              {quizzes.map((q) => (
                <option key={q.id} value={q.id}>
                  {q.name} ({q.questionCount || 0} existing questions)
                </option>
              ))}
            </select>
          </div>

          {(!selectedQuizId || selectedQuizId === "new") && (
            <div className="space-y-3">
              <Input
                label="New Quiz Title"
                placeholder="e.g. Engineering Finals Review"
                value={newQuizTitle}
                onChange={(e) => setNewQuizTitle(e.target.value)}
              />
            </div>
          )}
        </div>
      </Card>

      {/* Upload Zone */}
      {!validationResult && (
        <Card variant="default" className="p-8 border-2 border-dashed border-slate-800 bg-slate-900/40 text-center space-y-4">
          <input
            type="file"
            ref={fileInputRef}
            accept=".xlsx, .xls, .csv"
            onChange={handleFileSelected}
            className="hidden"
          />

          <div className="w-16 h-16 rounded-2xl bg-brand-600/10 border border-brand-500/20 flex items-center justify-center mx-auto text-brand-400">
            <UploadCloud className="w-8 h-8" />
          </div>

          <div>
            <h3 className="text-base font-bold text-white">
              {isProcessing ? "Validating Spreadsheet..." : "Upload Excel or CSV file"}
            </h3>
            <p className="text-xs text-slate-400 mt-1 max-w-md mx-auto">
              Drag & drop your formatted template spreadsheet here, or click to browse.
            </p>
          </div>

          <div className="pt-2">
            <Button
              size="lg"
              isLoading={isProcessing}
              onClick={() => fileInputRef.current?.click()}
              className="gap-2 shadow-lg shadow-brand-600/20"
            >
              <FileSpreadsheet className="w-4 h-4" />
              <span>Choose File to Validate</span>
            </Button>
          </div>
        </Card>
      )}

      {/* Validation Result Display */}
      {validationResult && (
        <div className="space-y-6">
          {/* Validation Header Summary (Prompt item 19) */}
          <Card variant="glass" className="p-6 border-slate-800 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <Badge variant="primary" size="sm" className="mb-1">
                  UPLOAD VALIDATION REPORT
                </Badge>
                <h2 className="text-xl font-bold text-white tracking-tight">
                  File: {file?.name}
                </h2>
              </div>

              <div className="flex items-center gap-3">
                <Button variant="ghost" size="sm" onClick={handleReset} className="gap-1.5 text-slate-400">
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Choose Another File</span>
                </Button>

                {validationResult.errorCount > 0 && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => downloadErrorReport(validationResult.errors)}
                    className="gap-1.5 border-rose-500/30 text-rose-300 hover:bg-rose-950/30"
                  >
                    <Download className="w-3.5 h-3.5 text-rose-400" />
                    <span>Download Error Report</span>
                  </Button>
                )}
              </div>
            </div>

            {/* Scoreboard */}
            <div className="grid grid-cols-3 gap-4 pt-2">
              <div className="p-4 bg-slate-900/90 rounded-xl border border-slate-800 text-center">
                <p className="text-xs uppercase font-semibold text-slate-400">Total Rows</p>
                <p className="text-2xl font-bold text-white font-mono mt-1">
                  {validationResult.totalCount}
                </p>
              </div>

              <div className="p-4 bg-emerald-950/30 rounded-xl border border-emerald-500/30 text-center">
                <p className="text-xs uppercase font-semibold text-emerald-400">Valid Questions</p>
                <p className="text-2xl font-bold text-emerald-300 font-mono mt-1">
                  {validationResult.validCount}
                </p>
              </div>

              <div className="p-4 bg-rose-950/30 rounded-xl border border-rose-500/30 text-center">
                <p className="text-xs uppercase font-semibold text-rose-400">Row Errors</p>
                <p className="text-2xl font-bold text-rose-300 font-mono mt-1">
                  {validationResult.errorCount}
                </p>
              </div>
            </div>
          </Card>

          {/* Tab Switcher (Preview vs Errors) */}
          <div className="flex gap-2 border-b border-slate-800 pb-2">
            <button
              onClick={() => setActiveTab("preview")}
              className={`px-4 py-2 rounded-xl text-sm font-semibold flex items-center gap-2 transition-all ${
                activeTab === "preview"
                  ? "bg-brand-600/20 text-brand-300 border border-brand-500/30"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              <Eye className="w-4 h-4" />
              <span>Valid Questions Preview ({validationResult.validCount})</span>
            </button>

            {validationResult.errorCount > 0 && (
              <button
                onClick={() => setActiveTab("errors")}
                className={`px-4 py-2 rounded-xl text-sm font-semibold flex items-center gap-2 transition-all ${
                  activeTab === "errors"
                    ? "bg-rose-950/40 text-rose-300 border border-rose-500/40"
                    : "text-slate-400 hover:text-rose-300"
                }`}
              >
                <AlertTriangle className="w-4 h-4 text-rose-400" />
                <span>Diagnostics & Errors ({validationResult.errorCount})</span>
              </button>
            )}
          </div>

          {/* Valid Questions Preview (Prompt item 20) */}
          {activeTab === "preview" && (
            <div className="space-y-4">
              {validationResult.validCount === 0 ? (
                <div className="p-8 text-center bg-slate-900/40 rounded-2xl border border-slate-800 text-slate-400 text-sm">
                  No valid questions found in this file. Please inspect the errors tab.
                </div>
              ) : (
                <div className="space-y-3">
                  {validationResult.validQuestions.map((q, idx) => (
                    <Card
                      key={q.id}
                      variant="default"
                      className="p-4 bg-slate-900/70 border-slate-800 space-y-2"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="w-6 h-6 rounded-md bg-brand-600/20 text-brand-300 font-mono text-xs font-bold flex items-center justify-center">
                            {idx + 1}
                          </span>
                          <Badge variant="secondary" size="sm">
                            {q.type.replace("_", " ")}
                          </Badge>
                        </div>
                        <span className="text-xs text-slate-400 font-mono">
                          {q.timeLimit}s • {q.points} Pts
                        </span>
                      </div>

                      <p className="font-bold text-white text-sm">{q.questionText}</p>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs pt-1">
                        {q.options.map((opt, i) => {
                          const isCorrect = q.correctOptionIds.includes(opt.id);
                          return (
                            <div
                              key={opt.id}
                              className={`p-2 rounded-lg border flex items-center gap-2 ${
                                isCorrect
                                  ? "bg-emerald-950/40 border-emerald-500/40 text-emerald-300 font-semibold"
                                  : "bg-slate-950 border-slate-800 text-slate-400"
                              }`}
                            >
                              <span className="font-bold">{String.fromCharCode(65 + i)}.</span>
                              <span className="flex-1">{opt.text}</span>
                              {isCorrect && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />}
                            </div>
                          );
                        })}
                      </div>

                      {q.explanation && (
                        <p className="text-[11px] text-slate-400 italic pt-1">
                          Note: {q.explanation}
                        </p>
                      )}
                    </Card>
                  ))}
                </div>
              )}

              {/* Import Options & Action (Prompt item 21) */}
              {validationResult.validCount > 0 && (
                <div className="p-6 bg-slate-900 rounded-2xl border border-slate-800 space-y-4">
                  {selectedQuizId && selectedQuizId !== "new" && (
                    <div className="space-y-2">
                      <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400">
                        Import Strategy
                      </label>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <button
                          type="button"
                          onClick={() => setImportMode("add")}
                          className={`p-3 rounded-xl border text-left text-xs transition-all ${
                            importMode === "add"
                              ? "border-brand-500 bg-brand-600/20 text-brand-300 font-semibold"
                              : "border-slate-800 bg-slate-950 text-slate-400"
                          }`}
                        >
                          <p className="font-bold text-sm text-white">ADD TO EXISTING QUESTIONS</p>
                          <p className="text-slate-400 mt-0.5">
                            Appends {validationResult.validCount} questions to the end of the quiz.
                          </p>
                        </button>

                        <button
                          type="button"
                          onClick={() => setImportMode("replace")}
                          className={`p-3 rounded-xl border text-left text-xs transition-all ${
                            importMode === "replace"
                              ? "border-amber-500 bg-amber-950/20 text-amber-300 font-semibold"
                              : "border-slate-800 bg-slate-950 text-slate-400"
                          }`}
                        >
                          <p className="font-bold text-sm text-amber-300">REPLACE EXISTING QUESTIONS</p>
                          <p className="text-slate-400 mt-0.5">
                            Deletes existing questions and replaces them with this file.
                          </p>
                        </button>
                      </div>
                    </div>
                  )}

                  <div className="flex items-center justify-end gap-3 pt-2">
                    <Button variant="ghost" onClick={handleReset}>
                      Cancel
                    </Button>
                    <Button
                      size="lg"
                      isLoading={isImporting}
                      onClick={() => {
                        if (importMode === "replace") {
                          setIsConfirmModalOpen(true);
                        } else {
                          handleExecuteImport();
                        }
                      }}
                      className="gap-2 shadow-lg shadow-brand-600/20"
                    >
                      <span>
                        Import {validationResult.validCount} Valid Questions
                      </span>
                      <ArrowRight className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Row Diagnostics / Errors Tab */}
          {activeTab === "errors" && (
            <div className="space-y-3">
              {validationResult.errors.map((err, idx) => (
                <div
                  key={idx}
                  className="p-4 bg-rose-950/30 border border-rose-500/30 rounded-xl flex items-start gap-3"
                >
                  <XCircle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-white text-sm">Row {err.rowNumber}</span>
                      {err.questionNumber && (
                        <span className="text-xs text-rose-300 font-mono">
                          (Question #{err.questionNumber})
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-rose-200">{err.error}</p>
                    {err.rawData?.["Question"] && (
                      <p className="text-[11px] text-slate-400 font-mono truncate max-w-xl">
                        Content: "{err.rawData["Question"]}"
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Confirmation Modal for Replace Mode */}
      <Modal
        isOpen={isConfirmModalOpen}
        onClose={() => setIsConfirmModalOpen(false)}
        title="Confirm Question Replacement"
        description="Are you sure you want to replace all existing questions in this quiz?"
      >
        <div className="space-y-4">
          <p className="text-xs text-slate-300 leading-relaxed">
            This will permanently overwrite existing questions with the {validationResult?.validCount} questions from your uploaded file.
          </p>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="ghost" onClick={() => setIsConfirmModalOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="danger"
              isLoading={isImporting}
              onClick={handleExecuteImport}
            >
              Confirm & Replace
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

export default function UploadQuestionsPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center p-12">
          <Loader2 className="w-8 h-8 text-brand-400 animate-spin" />
        </div>
      }
    >
      <UploadQuestionsContent />
    </Suspense>
  );
}
