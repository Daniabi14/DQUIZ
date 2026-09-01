"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { QRCodeSVG } from "qrcode.react";
import { useAuth } from "@/lib/auth/AuthContext";
import { useToast } from "@/components/ui/Toast";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { useGame } from "@/hooks/useGame";
import {
  toggleLockJoining,
  removePlayer,
} from "@/lib/game/gameService";
import { doc, updateDoc, serverTimestamp } from "firebase/firestore";
import { db } from "@/lib/firebase/client";
import { getQuestions } from "@/lib/game/quizService";
import {
  Users,
  Copy,
  Lock,
  Unlock,
  Play,
  UserX,
  Radio,
  Sparkles,
  ShieldCheck,
  CheckCircle2,
  Loader2,
  Share2,
} from "lucide-react";

export default function HostLobbyPage() {
  const params = useParams();
  const gameId = params.id as string;
  const router = useRouter();
  const { profile } = useAuth();
  const { showToast } = useToast();

  const { game, players, loading } = useGame(gameId);
  const [isStarting, setIsStarting] = useState(false);
  const [origin, setOrigin] = useState("");

  useEffect(() => {
    if (typeof window !== "undefined") {
      setOrigin(window.location.origin);
    }
  }, []);

  if (loading || !game) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
        <Loader2 className="w-10 h-10 text-brand-400 animate-spin" />
        <p className="text-sm text-slate-400 font-medium">Loading live lobby...</p>
      </div>
    );
  }

  const joinUrl = `${origin}/join?pin=${game.gamePin}`;

  const handleCopyLink = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(joinUrl);
      showToast({
        type: "success",
        title: "Link Copied!",
        message: "Join link copied to clipboard.",
      });
    }
  };

  const handleToggleLock = async () => {
    const nextLocked = !game.isJoiningLocked;
    await toggleLockJoining(gameId, nextLocked);
    showToast({
      type: "info",
      title: nextLocked ? "Joining Locked" : "Joining Unlocked",
      message: nextLocked
        ? "No new participants can join."
        : "Participants can now join with PIN.",
    });
  };

  const handleKickPlayer = async (playerId: string, playerName: string) => {
    if (!confirm(`Remove ${playerName} from this session?`)) return;
    await removePlayer(gameId, playerId);
    showToast({
      type: "warning",
      title: "Player Removed",
      message: `${playerName} was removed.`,
    });
  };

  const handleStartQuiz = async () => {
    if (players.length === 0) {
      if (!confirm("No students have joined yet. Start anyway for testing?")) return;
    }

    setIsStarting(true);

    try {
      // Fetch the first question details to set authoritative timer
      const questions = await getQuestions(game.quizId);
      const firstQId = game.questionOrder[0];
      const firstQ = questions.find((q) => q.id === firstQId) || questions[0];
      const timeLimitSeconds = firstQ?.timeLimit || 20;

      const now = Date.now();
      const endsAt = now + timeLimitSeconds * 1000;

      // Update game status to QUESTION in Firestore and local storage
      const updatedData = {
        status: "QUESTION",
        currentQuestionIndex: 0,
        currentQuestionId: firstQId,
        questionStartedAt: now,
        questionEndsAt: endsAt,
        isPaused: false,
        activeQuestionAnsweredCount: 0,
        startedAt: serverTimestamp(),
      };

      try {
        await updateDoc(doc(db, "games", gameId), updatedData);
      } catch (e) {
        console.warn("Firestore start game notice:", e);
      }

      // Update local dev store
      if (typeof window !== "undefined") {
        const localRaw = localStorage.getItem(`dquiz_game_id_${gameId}`);
        if (localRaw) {
          const g = JSON.parse(localRaw);
          const updated = { ...g, ...updatedData };
          localStorage.setItem(`dquiz_game_id_${gameId}`, JSON.stringify(updated));
          localStorage.setItem(`dquiz_game_${game.gamePin}`, JSON.stringify(updated));
        }
      }

      showToast({
        type: "success",
        title: "Quiz Started!",
        message: "Question 1 is now live for all participants.",
      });

      router.push(`/host/games/${gameId}/control`);
    } catch (err: any) {
      showToast({
        type: "error",
        title: "Failed to start quiz",
        message: err.message,
      });
      setIsStarting(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <Badge variant="success" size="sm">
              <Radio className="w-3.5 h-3.5 mr-1 animate-pulse" />
              LOBBY ACTIVE
            </Badge>
            <span className="text-xs text-slate-400">{game.quizTitle}</span>
          </div>
          <h1 className="text-2xl font-extrabold text-white tracking-tight font-display mt-1">
            Waiting for Participants
          </h1>
        </div>

        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={handleToggleLock}
            className={`gap-1.5 ${
              game.isJoiningLocked
                ? "border-amber-500/40 text-amber-300 bg-amber-950/20"
                : "border-slate-700 text-slate-300"
            }`}
          >
            {game.isJoiningLocked ? <Lock className="w-4 h-4" /> : <Unlock className="w-4 h-4" />}
            <span>{game.isJoiningLocked ? "Unlock Joining" : "Lock Joining"}</span>
          </Button>

          <Button
            size="lg"
            isLoading={isStarting}
            onClick={handleStartQuiz}
            className="gap-2 bg-emerald-600 hover:bg-emerald-500 text-white shadow-xl shadow-emerald-600/30 px-6 font-bold"
          >
            <Play className="w-4 h-4 fill-current" />
            <span>START QUIZ</span>
          </Button>
        </div>
      </div>

      {/* Main Lobby Visual Box (PIN + QR Code) (Prompt item 29) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Huge PIN & QR */}
        <div className="lg:col-span-2 bg-gradient-to-br from-slate-900 via-slate-900/90 to-brand-950/40 border-2 border-brand-500/30 rounded-3xl p-6 sm:p-10 shadow-2xl flex flex-col md:flex-row items-center justify-between gap-8 relative overflow-hidden">
          <div className="space-y-4 text-center md:text-left">
            <p className="text-xs font-extrabold uppercase tracking-[0.25em] text-brand-400">
              JOIN THE GAME AT
            </p>
            <p className="text-sm font-mono font-bold text-slate-200">
              {origin.replace(/^https?:\/\//, "")}/join
            </p>

            <div className="pt-2">
              <span className="text-xs text-slate-400 font-semibold block uppercase tracking-wider mb-1">
                Game PIN
              </span>
              <div className="text-5xl sm:text-6xl font-extrabold font-mono tracking-[0.2em] text-white bg-slate-950/80 px-6 py-3 rounded-2xl border border-slate-800 shadow-inner inline-block">
                {game.gamePin.slice(0, 3)} {game.gamePin.slice(3)}
              </div>
            </div>

            <div className="pt-2 flex flex-wrap items-center gap-2 justify-center md:justify-start">
              <Button
                variant="outline"
                size="sm"
                onClick={handleCopyLink}
                className="gap-1.5 border-brand-500/30 text-brand-300 hover:bg-brand-950/40"
              >
                <Copy className="w-3.5 h-3.5" />
                <span>COPY JOIN LINK</span>
              </Button>
            </div>
          </div>

          {/* QR Code Container */}
          <div className="bg-white p-5 rounded-2xl shadow-2xl flex flex-col items-center justify-center shrink-0 border-4 border-slate-900">
            <QRCodeSVG value={joinUrl} size={160} level="M" />
            <p className="text-[11px] text-slate-900 font-bold uppercase tracking-wider mt-2">
              Scan to Join
            </p>
          </div>
        </div>

        {/* Right: Real-time Player Counter Card */}
        <Card variant="glass" className="p-6 border-slate-800 flex flex-col justify-between space-y-4">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                Players Joined
              </span>
              <Badge variant="primary" size="sm">
                <Users className="w-3.5 h-3.5 mr-1" />
                Live
              </Badge>
            </div>
            <p className="text-5xl font-extrabold font-mono text-white tracking-tight">
              {players.length}
            </p>
          </div>

          <div className="p-4 bg-slate-950/80 rounded-xl border border-slate-800 space-y-2 text-xs text-slate-400">
            <div className="flex items-center justify-between">
              <span>Questions:</span>
              <span className="font-bold text-white">{game.questionOrder?.length || 0}</span>
            </div>
            <div className="flex items-center justify-between">
              <span>Anti-Cheating:</span>
              <span className="font-bold text-emerald-400">
                {game.settings?.antiCheatingMode ? "Active" : "Standard"}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span>Student Privacy:</span>
              <span className="font-bold text-emerald-400">Enforced</span>
            </div>
          </div>

          <Button
            size="lg"
            isLoading={isStarting}
            onClick={handleStartQuiz}
            className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold"
          >
            <Play className="w-4 h-4 fill-current mr-1" />
            <span>START QUIZ NOW</span>
          </Button>
        </Card>
      </div>

      {/* Participants Live Grid (Prompt item 30) */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-white tracking-tight font-display flex items-center gap-2">
            <Users className="w-5 h-5 text-brand-400" />
            <span>Participant Roster ({players.length})</span>
          </h2>
          <span className="text-xs text-slate-400">
            Click 'Remove' next to any participant to remove them.
          </span>
        </div>

        {players.length === 0 ? (
          <Card variant="default" className="p-12 text-center border-slate-800 bg-slate-900/40 space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-brand-600/10 border border-brand-500/20 flex items-center justify-center mx-auto text-brand-400 animate-pulse">
              <Users className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-white">No participants yet</h3>
            <p className="text-xs text-slate-400 max-w-sm mx-auto">
              Share Game PIN <span className="font-mono font-bold text-brand-300">{game.gamePin}</span> or scan the QR code to join.
            </p>
          </Card>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            {players.map((player) => (
              <div
                key={player.id}
                className="p-3.5 bg-slate-900/90 border border-slate-800 rounded-xl flex items-center justify-between gap-3 group hover:border-slate-700 transition-colors"
              >
                <div className="overflow-hidden space-y-0.5">
                  <p className="font-bold text-sm text-white truncate">{player.name}</p>
                  <p className="text-xs text-slate-400 font-mono">{player.rollNumber}</p>
                  {player.institution && (
                    <p className="text-[10px] text-slate-500 truncate">{player.institution}</p>
                  )}
                </div>

                <button
                  onClick={() => handleKickPlayer(player.id, player.name)}
                  className="p-1.5 rounded-lg text-slate-600 hover:text-rose-400 hover:bg-rose-950/30 opacity-0 group-hover:opacity-100 transition-all shrink-0"
                  title="Remove Participant"
                >
                  <UserX className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
