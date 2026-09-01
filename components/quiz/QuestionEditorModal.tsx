"use client";

import React, { useState, useEffect } from "react";
import { Question, QuestionOption, QuestionType } from "@/types/question";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Badge } from "@/components/ui/Badge";
import {
  CheckCircle2,
  Plus,
  Trash2,
  Clock,
  Award,
  Image as ImageIcon,
  CheckSquare,
  Sparkles,
} from "lucide-react";

interface QuestionEditorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (questionData: Partial<Question>, addAnother?: boolean) => Promise<void>;
  editingQuestion?: Question | null;
  orderNumber?: number;
}

export const QuestionEditorModal = ({
  isOpen,
  onClose,
  onSave,
  editingQuestion,
  orderNumber = 1,
}: QuestionEditorModalProps) => {
  const [type, setType] = useState<QuestionType>("single_choice");
  const [questionText, setQuestionText] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [options, setOptions] = useState<QuestionOption[]>([
    { id: "opt_1", text: "" },
    { id: "opt_2", text: "" },
    { id: "opt_3", text: "" },
    { id: "opt_4", text: "" },
  ]);
  const [correctOptionIds, setCorrectOptionIds] = useState<string[]>(["opt_1"]);
  const [timeLimit, setTimeLimit] = useState(20);
  const [points, setPoints] = useState(1000);
  const [explanation, setExplanation] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (editingQuestion) {
      setType(editingQuestion.type || "single_choice");
      setQuestionText(editingQuestion.questionText || "");
      setImageUrl(editingQuestion.imageUrl || "");
      setOptions(
        editingQuestion.options && editingQuestion.options.length > 0
          ? editingQuestion.options
          : [
              { id: "opt_1", text: "" },
              { id: "opt_2", text: "" },
            ]
      );
      setCorrectOptionIds(editingQuestion.correctOptionIds || ["opt_1"]);
      setTimeLimit(editingQuestion.timeLimit || 20);
      setPoints(editingQuestion.points || 1000);
      setExplanation(editingQuestion.explanation || "");
    } else {
      // Reset defaults for new question
      setType("single_choice");
      setQuestionText("");
      setImageUrl("");
      setOptions([
        { id: "opt_1", text: "" },
        { id: "opt_2", text: "" },
        { id: "opt_3", text: "" },
        { id: "opt_4", text: "" },
      ]);
      setCorrectOptionIds(["opt_1"]);
      setTimeLimit(20);
      setPoints(1000);
      setExplanation("");
    }
    setError(null);
  }, [editingQuestion, isOpen]);

  // When type changes, update options accordingly
  const handleTypeChange = (newType: QuestionType) => {
    setType(newType);
    if (newType === "true_false") {
      setOptions([
        { id: "opt_true", text: "True" },
        { id: "opt_false", text: "False" },
      ]);
      setCorrectOptionIds(["opt_true"]);
    } else if (options.length < 2 || options[0].id === "opt_true") {
      setOptions([
        { id: "opt_1", text: "" },
        { id: "opt_2", text: "" },
        { id: "opt_3", text: "" },
        { id: "opt_4", text: "" },
      ]);
      setCorrectOptionIds(["opt_1"]);
    }
  };

  const handleOptionTextChange = (id: string, text: string) => {
    setOptions(options.map((opt) => (opt.id === id ? { ...opt, text } : opt)));
    if (error) setError(null);
  };

  const handleAddOption = () => {
    if (options.length >= 6) return;
    const newId = `opt_${Date.now()}`;
    setOptions([...options, { id: newId, text: "" }]);
  };

  const handleRemoveOption = (id: string) => {
    if (options.length <= 2) return;
    const updated = options.filter((opt) => opt.id !== id);
    setOptions(updated);
    setCorrectOptionIds(correctOptionIds.filter((optId) => optId !== id));
  };

  const toggleCorrectOption = (id: string) => {
    if (type === "single_choice" || type === "true_false") {
      setCorrectOptionIds([id]);
    } else {
      // Multiple choice toggle
      if (correctOptionIds.includes(id)) {
        if (correctOptionIds.length > 1) {
          setCorrectOptionIds(correctOptionIds.filter((item) => item !== id));
        }
      } else {
        setCorrectOptionIds([...correctOptionIds, id]);
      }
    }
  };

  const handleSave = async (addAnother = false) => {
    setError(null);
    if (!questionText.trim()) {
      setError("Please enter the question text.");
      return;
    }

    const filledOptions = options.map((opt) => ({ ...opt, text: opt.text.trim() }));
    const emptyOpt = filledOptions.find((opt) => !opt.text);
    if (emptyOpt) {
      setError("Please fill in all answer options.");
      return;
    }

    if (correctOptionIds.length === 0) {
      setError("Please select at least one correct answer.");
      return;
    }

    setIsSaving(true);
    try {
      await onSave(
        {
          type,
          questionText: questionText.trim(),
          imageUrl: imageUrl.trim() || undefined,
          options: filledOptions,
          correctOptionIds,
          timeLimit: Number(timeLimit),
          points: Number(points),
          explanation: explanation.trim() || undefined,
        },
        addAnother
      );

      if (addAnother) {
        setQuestionText("");
        setImageUrl("");
        setOptions([
          { id: "opt_1", text: "" },
          { id: "opt_2", text: "" },
          { id: "opt_3", text: "" },
          { id: "opt_4", text: "" },
        ]);
        setCorrectOptionIds(["opt_1"]);
        setExplanation("");
      } else {
        onClose();
      }
    } catch (err: any) {
      setError(err.message || "Failed to save question.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={editingQuestion ? `Edit Question #${orderNumber}` : `Add Question #${orderNumber}`}
      description="Configure question parameters, time limits, and correct answer keys."
      maxWidth="xl"
    >
      <div className="space-y-5 max-h-[75vh] overflow-y-auto pr-1">
        {/* Question Type Selector */}
        <div className="space-y-1.5">
          <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400">
            Question Type
          </label>
          <div className="grid grid-cols-3 gap-2">
            {[
              { id: "single_choice", label: "Single Choice" },
              { id: "true_false", label: "True / False" },
              { id: "multiple_choice", label: "Multiple Choice" },
            ].map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => handleTypeChange(t.id as QuestionType)}
                className={`py-2 px-3 rounded-xl border text-xs font-semibold transition-all ${
                  type === t.id
                    ? "border-brand-500 bg-brand-600/20 text-brand-300"
                    : "border-slate-800 bg-slate-900/80 text-slate-400 hover:text-slate-200"
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>

        {/* Question Text */}
        <div className="space-y-1.5 text-left">
          <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400">
            Question Prompt <span className="text-rose-400">*</span>
          </label>
          <textarea
            rows={3}
            value={questionText}
            onChange={(e) => setQuestionText(e.target.value)}
            placeholder="e.g. What is the primary purpose of server-side rendering?"
            className="w-full px-4 py-3 bg-slate-900/90 border border-slate-800 rounded-xl text-slate-100 placeholder-slate-500 text-sm focus:outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20"
          />
        </div>

        {/* Optional Image URL */}
        <Input
          label="Optional Image URL"
          placeholder="https://example.com/diagram.png"
          value={imageUrl}
          onChange={(e) => setImageUrl(e.target.value)}
        />

        {/* Answer Options */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400">
              Answer Options & Correct Key (Click checkmark to select correct answer)
            </label>
            {type !== "true_false" && options.length < 6 && (
              <button
                type="button"
                onClick={handleAddOption}
                className="text-xs text-brand-400 hover:text-brand-300 font-semibold flex items-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Option</span>
              </button>
            )}
          </div>

          <div className="space-y-2.5">
            {options.map((option, idx) => {
              const isCorrect = correctOptionIds.includes(option.id);
              const letter = String.fromCharCode(65 + idx);

              return (
                <div
                  key={option.id}
                  className={`flex items-center gap-2.5 p-2 rounded-xl border transition-all ${
                    isCorrect
                      ? "border-emerald-500/50 bg-emerald-950/20"
                      : "border-slate-800 bg-slate-900/60"
                  }`}
                >
                  <button
                    type="button"
                    onClick={() => toggleCorrectOption(option.id)}
                    className={`w-9 h-9 rounded-lg flex items-center justify-center font-bold text-sm transition-colors shrink-0 ${
                      isCorrect
                        ? "bg-emerald-600 text-white shadow-md shadow-emerald-600/30"
                        : "bg-slate-800 text-slate-400 hover:bg-slate-700"
                    }`}
                    title={isCorrect ? "Correct Answer" : "Mark as Correct"}
                  >
                    {isCorrect ? <CheckCircle2 className="w-5 h-5" /> : letter}
                  </button>

                  <input
                    type="text"
                    value={option.text}
                    disabled={type === "true_false"}
                    onChange={(e) => handleOptionTextChange(option.id, e.target.value)}
                    placeholder={`Option ${letter} text...`}
                    className="flex-1 bg-transparent border-none text-slate-100 placeholder-slate-500 text-sm focus:outline-none px-2"
                  />

                  {type !== "true_false" && options.length > 2 && (
                    <button
                      type="button"
                      onClick={() => handleRemoveOption(option.id)}
                      className="p-1.5 text-slate-500 hover:text-rose-400 transition-colors"
                      title="Remove Option"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Time Limit & Points */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400">
              Time Limit (Seconds)
            </label>
            <select
              value={timeLimit}
              onChange={(e) => setTimeLimit(Number(e.target.value))}
              className="w-full px-4 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-slate-200 text-sm focus:outline-none focus:border-brand-500"
            >
              <option value={10}>10 Seconds (Fast)</option>
              <option value={15}>15 Seconds</option>
              <option value={20}>20 Seconds (Standard)</option>
              <option value={30}>30 Seconds</option>
              <option value={45}>45 Seconds</option>
              <option value={60}>60 Seconds (1 min)</option>
              <option value={90}>90 Seconds</option>
              <option value={120}>120 Seconds (2 min)</option>
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400">
              Base Points
            </label>
            <select
              value={points}
              onChange={(e) => setPoints(Number(e.target.value))}
              className="w-full px-4 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-slate-200 text-sm focus:outline-none focus:border-brand-500"
            >
              <option value={500}>500 Points</option>
              <option value={1000}>1000 Points (Standard)</option>
              <option value={1500}>1500 Points</option>
              <option value={2000}>2000 Points (Double)</option>
            </select>
          </div>
        </div>

        {/* Explanation (Optional) */}
        <div className="space-y-1.5 text-left">
          <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400">
            Explanation (Host Review / Final Reports)
          </label>
          <textarea
            rows={2}
            value={explanation}
            onChange={(e) => setExplanation(e.target.value)}
            placeholder="Brief explanation of why this answer is correct..."
            className="w-full px-4 py-2.5 bg-slate-900/90 border border-slate-800 rounded-xl text-slate-100 placeholder-slate-500 text-sm focus:outline-none focus:border-brand-500"
          />
        </div>

        {error && (
          <div className="p-3 bg-rose-950/60 border border-rose-500/30 rounded-xl text-rose-300 text-xs font-medium">
            {error}
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-end gap-2 pt-4 border-t border-slate-800">
          <Button variant="ghost" type="button" onClick={onClose} disabled={isSaving}>
            Cancel
          </Button>

          {!editingQuestion && (
            <Button
              variant="secondary"
              type="button"
              onClick={() => handleSave(true)}
              isLoading={isSaving}
            >
              Save & Add Another
            </Button>
          )}

          <Button
            variant="primary"
            type="button"
            onClick={() => handleSave(false)}
            isLoading={isSaving}
          >
            {editingQuestion ? "Update Question" : "Save Question"}
          </Button>
        </div>
      </div>
    </Modal>
  );
};
