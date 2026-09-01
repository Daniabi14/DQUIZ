"use client";

import React, { useState } from "react";
import { Question } from "@/types/question";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import {
  Timer,
  Award,
  CheckCircle2,
  Lock,
  Smartphone,
  ShieldAlert,
  RotateCcw,
  Sparkles,
} from "lucide-react";

interface QuestionPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  question: Question | null;
  totalQuestions?: number;
}

export const QuestionPreviewModal = ({
  isOpen,
  onClose,
  question,
  totalQuestions = 10,
}: QuestionPreviewModalProps) => {
  const [viewMode, setViewMode] = useState<"host" | "student">("student");
  const [studentSelectedOption, setStudentSelectedOption] = useState<string | null>(null);
  const [isAnswerSubmitted, setIsAnswerSubmitted] = useState(false);

  if (!question) return null;

  const handleStudentSelect = (optionId: string) => {
    if (isAnswerSubmitted) return;
    setStudentSelectedOption(optionId);
    setIsAnswerSubmitted(true);
  };

  const handleResetStudentSimulation = () => {
    setStudentSelectedOption(null);
    setIsAnswerSubmitted(false);
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={() => {
        handleResetStudentSimulation();
        onClose();
      }}
      title="Question Live Preview"
      description="Inspect both the secure host view and the privacy-safe student mobile view."
      maxWidth="xl"
    >
      <div className="space-y-5">
        {/* Mode Switcher */}
        <div className="flex items-center justify-between p-2 bg-slate-950 rounded-xl border border-slate-800">
          <div className="flex gap-1.5">
            <button
              onClick={() => {
                setViewMode("student");
                handleResetStudentSimulation();
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
                viewMode === "student"
                  ? "bg-brand-600 text-white shadow-md shadow-brand-600/30"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              <Smartphone className="w-3.5 h-3.5" />
              <span>Student Mobile View</span>
            </button>

            <button
              onClick={() => setViewMode("host")}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
                viewMode === "host"
                  ? "bg-slate-800 text-white border border-slate-700"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              <ShieldAlert className="w-3.5 h-3.5 text-brand-400" />
              <span>Host Inspection View</span>
            </button>
          </div>

          {viewMode === "student" && (
            <button
              onClick={handleResetStudentSimulation}
              className="text-xs text-slate-400 hover:text-white flex items-center gap-1 px-2 py-1 rounded-md hover:bg-slate-900"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Reset</span>
            </button>
          )}
        </div>

        {/* Student View (Strict Privacy) */}
        {viewMode === "student" && (
          <div className="bg-slate-950 border-2 border-slate-800 rounded-2xl p-5 sm:p-6 space-y-5 shadow-2xl relative overflow-hidden">
            {/* Header info */}
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400 font-mono">
                QUESTION {question.orderNumber} / {totalQuestions}
              </span>
              <div className="flex items-center gap-1.5 px-3 py-1 bg-slate-900 border border-slate-800 rounded-full text-amber-300 font-mono font-bold text-xs">
                <Timer className="w-3.5 h-3.5 text-amber-400" />
                <span>{question.timeLimit}s</span>
              </div>
            </div>

            {/* Question Text */}
            <div className="text-center py-2">
              <h3 className="text-lg sm:text-xl font-bold text-white leading-snug">
                {question.questionText}
              </h3>
            </div>

            {/* Answer Options Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
              {question.options.map((option, idx) => {
                const isSelected = studentSelectedOption === option.id;
                const letter = String.fromCharCode(65 + idx);

                return (
                  <button
                    key={option.id}
                    disabled={isAnswerSubmitted}
                    onClick={() => handleStudentSelect(option.id)}
                    className={`p-4 rounded-xl text-left border font-semibold text-sm transition-all flex items-center gap-3 ${
                      isSelected
                        ? "bg-brand-600 border-brand-400 text-white shadow-lg shadow-brand-600/30 scale-[1.01]"
                        : isAnswerSubmitted
                        ? "bg-slate-900/40 border-slate-800/60 text-slate-500 cursor-not-allowed"
                        : "bg-slate-900/90 border-slate-800 text-slate-200 hover:border-slate-700 hover:bg-slate-800/80 active:scale-95"
                    }`}
                  >
                    <span className="w-7 h-7 rounded-lg bg-slate-800 flex items-center justify-center text-xs font-bold text-slate-300 shrink-0">
                      {letter}
                    </span>
                    <span className="flex-1">{option.text}</span>
                  </button>
                );
              })}
            </div>

            {/* Student Submitted Status Banner */}
            {isAnswerSubmitted && (
              <div className="p-4 bg-slate-900/90 border border-brand-500/30 rounded-xl text-center space-y-1">
                <div className="flex items-center justify-center gap-2 text-brand-400 font-bold text-sm">
                  <Lock className="w-4 h-4" />
                  <span>ANSWER SUBMITTED</span>
                </div>
                <p className="text-xs text-slate-400">
                  Waiting for the question to end... Responses are locked.
                </p>
              </div>
            )}
          </div>
        )}

        {/* Host Inspection View */}
        {viewMode === "host" && (
          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <Badge variant="primary" size="sm">
                  Question #{question.orderNumber}
                </Badge>
                <Badge variant="secondary" size="sm">
                  {question.type.replace("_", " ")}
                </Badge>
              </div>
              <div className="flex items-center gap-3 text-xs text-slate-300 font-mono">
                <span>{question.timeLimit}s</span>
                <span>•</span>
                <span>{question.points} Pts</span>
              </div>
            </div>

            <div>
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">
                Question Prompt
              </p>
              <h3 className="text-base font-bold text-white">{question.questionText}</h3>
            </div>

            <div className="space-y-2">
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                Options & Correct Answer
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {question.options.map((opt, idx) => {
                  const isCorrect = question.correctOptionIds.includes(opt.id);
                  const letter = String.fromCharCode(65 + idx);
                  return (
                    <div
                      key={opt.id}
                      className={`p-3 rounded-xl border flex items-center gap-2.5 text-xs ${
                        isCorrect
                          ? "bg-emerald-950/40 border-emerald-500/40 text-emerald-200 font-semibold"
                          : "bg-slate-950 border-slate-800 text-slate-400"
                      }`}
                    >
                      <span className="w-5 h-5 rounded flex items-center justify-center bg-slate-800 text-[10px] font-bold">
                        {letter}
                      </span>
                      <span className="flex-1">{opt.text}</span>
                      {isCorrect && <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />}
                    </div>
                  );
                })}
              </div>
            </div>

            {question.explanation && (
              <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 text-xs text-slate-300">
                <span className="font-semibold text-brand-400 block mb-0.5">Explanation:</span>
                {question.explanation}
              </div>
            )}
          </div>
        )}

        <div className="flex justify-end pt-2">
          <Button variant="outline" onClick={onClose}>
            Close Preview
          </Button>
        </div>
      </div>
    </Modal>
  );
};
