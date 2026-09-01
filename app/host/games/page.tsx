"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useAuth } from "@/lib/auth/AuthContext";
import { useToast } from "@/components/ui/Toast";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { LiveGame } from "@/types/game";
import { getGamesByHost } from "@/lib/game/gameService";
import {
  Radio,
  Plus,
  Play,
  Award,
  Users,
  Clock,
  ArrowRight,
  Trash2,
  Loader2,
} from "lucide-react";

export default function HostGamesPage() {
  const { profile } = useAuth();
  const { showToast } = useToast();

  const [games, setGames] = useState<LiveGame[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadGames = async () => {
    setIsLoading(true);
    try {
      const data = await getGamesByHost(profile?.uid || "host");
      setGames(data);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadGames();
  }, [profile?.uid]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-800">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight font-display">
            Live Games & Sessions
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Monitor ongoing multiplayer sessions, view lobby rooms, or review past results.
          </p>
        </div>

        <Link href="/host/games/launch">
          <Button size="md" className="gap-2 bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-600/20">
            <Plus className="w-4 h-4" />
            <span>Launch New Game</span>
          </Button>
        </Link>
      </div>

      {/* Games List */}
      {isLoading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="w-8 h-8 text-brand-400 animate-spin" />
        </div>
      ) : games.length === 0 ? (
        <Card variant="glass" className="p-12 text-center border-slate-800/80 space-y-4">
          <div className="w-14 h-14 rounded-2xl bg-brand-600/10 border border-brand-500/20 flex items-center justify-center mx-auto text-brand-400">
            <Radio className="w-7 h-7" />
          </div>
          <div>
            <h3 className="text-base font-bold text-white">No active games yet</h3>
            <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
              Launch a live session from any quiz in your library to generate a PIN and QR code.
            </p>
          </div>
          <Link href="/host/games/launch">
            <Button size="md" className="gap-2">
              <Play className="w-4 h-4 fill-current" />
              <span>Launch Live Game</span>
            </Button>
          </Link>
        </Card>
      ) : (
        <div className="space-y-3">
          {games.map((g) => (
            <Card
              key={g.id}
              variant="default"
              className="p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-900/80 border-slate-800 hover:border-slate-700 transition-colors"
            >
              <div className="space-y-1.5">
                <div className="flex items-center gap-3">
                  <span className="px-2.5 py-1 bg-brand-500/20 text-brand-300 font-mono font-bold text-xs rounded-lg border border-brand-500/30">
                    PIN: {g.gamePin}
                  </span>
                  <Badge
                    variant={
                      g.status === "LOBBY"
                        ? "primary"
                        : g.status === "QUESTION"
                        ? "success"
                        : g.status === "FINISHED"
                        ? "secondary"
                        : "warning"
                    }
                    size="sm"
                  >
                    {g.status}
                  </Badge>
                </div>

                <h3 className="font-bold text-white text-base leading-snug">{g.quizTitle}</h3>

                <div className="flex items-center gap-4 text-xs text-slate-400 font-mono">
                  <span>{g.questionOrder?.length || 0} Questions</span>
                  <span>•</span>
                  <span>{g.totalPlayersCount || 0} Players</span>
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2 self-end md:self-center">
                {g.status === "LOBBY" ? (
                  <Link href={`/host/games/${g.id}/lobby`}>
                    <Button size="sm" className="gap-1.5 bg-brand-600 hover:bg-brand-500 text-white">
                      <Radio className="w-3.5 h-3.5" />
                      <span>Enter Lobby</span>
                    </Button>
                  </Link>
                ) : g.status === "FINISHED" ? (
                  <Link href={`/host/results?gameId=${g.id}`}>
                    <Button variant="secondary" size="sm" className="gap-1.5">
                      <Award className="w-3.5 h-3.5 text-amber-400" />
                      <span>View Results</span>
                    </Button>
                  </Link>
                ) : (
                  <Link href={`/host/games/${g.id}/control`}>
                    <Button size="sm" className="gap-1.5 bg-emerald-600 hover:bg-emerald-500 text-white">
                      <Play className="w-3.5 h-3.5 fill-current" />
                      <span>Control Game</span>
                    </Button>
                  </Link>
                )}
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
