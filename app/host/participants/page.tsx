"use client";

import React, { useState, useEffect } from "react";
import { useAuth } from "@/lib/auth/AuthContext";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Users, GraduationCap, School, Search, HelpCircle } from "lucide-react";
import { getGamesByHost } from "@/lib/game/gameService";
import { Player } from "@/types/player";

export default function HostParticipantsPage() {
  const { profile } = useAuth();
  const [search, setSearch] = useState("");
  const [participants, setParticipants] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function load() {
      setIsLoading(true);
      try {
        const games = await getGamesByHost(profile?.uid || "host");
        const allP: any[] = [];
        if (typeof window !== "undefined") {
          for (const g of games) {
            const raw = localStorage.getItem(`dquiz_game_players_${g.id}`);
            if (raw) {
              const list: Player[] = JSON.parse(raw);
              list.forEach((p) => {
                if (!allP.some((existing) => existing.rollNumber === p.rollNumber)) {
                  allP.push({
                    id: p.id,
                    name: p.name,
                    rollNumber: p.rollNumber,
                    institution: p.institution || "N/A",
                    quizzesTaken: 1,
                    avgAccuracy: `${Math.round(p.score ? Math.min(100, p.score / 10) : 0)}%`,
                  });
                }
              });
            }
          }
        }
        setParticipants(allP);
      } catch (err) {
        console.warn(err);
      } finally {
        setIsLoading(false);
      }
    }
    load();
  }, [profile?.uid]);

  const filtered = participants.filter(
    (p) =>
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.rollNumber.toLowerCase().includes(search.toLowerCase()) ||
      p.institution.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="pb-6 border-b border-slate-800">
        <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight font-display">
          Participant Directory
        </h1>
        <p className="text-sm text-slate-400 mt-1">
          Historical roster of participants who have joined your live sessions.
        </p>
      </div>

      <div className="max-w-md">
        <div className="relative">
          <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search participants by name, roll no..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-slate-900/90 border border-slate-800 rounded-xl text-slate-100 placeholder-slate-500 text-sm focus:outline-none focus:border-brand-500"
          />
        </div>
      </div>

      {participants.length === 0 ? (
        <Card variant="glass" className="p-12 text-center border-slate-800 space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-brand-600/10 border border-brand-500/20 flex items-center justify-center mx-auto text-brand-400">
            <Users className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-white">No participants recorded yet</h3>
          <p className="text-xs text-slate-400 max-w-sm mx-auto">
            Once you launch a live quiz and students join with your Game PIN, their records will automatically appear here.
          </p>
        </Card>
      ) : (
        <Card variant="default" className="p-0 overflow-hidden border-slate-800 bg-slate-900/70">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-300">
              <thead className="bg-slate-950/80 text-xs font-semibold uppercase tracking-wider text-slate-400 border-b border-slate-800">
                <tr>
                  <th className="py-3 px-6">Name</th>
                  <th className="py-3 px-6">Roll Number / ID</th>
                  <th className="py-3 px-6">Institution / Dept</th>
                  <th className="py-3 px-6 text-center">Sessions Joined</th>
                  <th className="py-3 px-6 text-right">Avg Accuracy</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-medium">
                {filtered.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-800/40">
                    <td className="py-4 px-6 font-bold text-white">{p.name}</td>
                    <td className="py-4 px-6 font-mono text-slate-400">{p.rollNumber}</td>
                    <td className="py-4 px-6 text-slate-400">{p.institution}</td>
                    <td className="py-4 px-6 text-center font-mono font-bold text-white">
                      {p.quizzesTaken}
                    </td>
                    <td className="py-4 px-6 text-right font-mono font-bold text-emerald-400">
                      {p.avgAccuracy}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  );
}
