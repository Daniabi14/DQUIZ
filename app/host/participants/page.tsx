"use client";

import React, { useState, useEffect } from "react";
import { useAuth } from "@/lib/auth/AuthContext";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Users, GraduationCap, School, Search } from "lucide-react";

export default function HostParticipantsPage() {
  const { profile } = useAuth();
  const [search, setSearch] = useState("");

  const [sampleParticipants] = useState([
    { id: "p1", name: "Daniel Abishek", rollNumber: "23CS001", institution: "Computing Dept", quizzesTaken: 5, avgAccuracy: "92%" },
    { id: "p2", name: "Priya Sharma", rollNumber: "23CS002", institution: "Computing Dept", quizzesTaken: 5, avgAccuracy: "88%" },
    { id: "p3", name: "Arun Kumar", rollNumber: "23CS003", institution: "Engineering Dept", quizzesTaken: 4, avgAccuracy: "84%" },
    { id: "p4", name: "Sneha Patel", rollNumber: "23CS004", institution: "Information Tech", quizzesTaken: 4, avgAccuracy: "81%" },
  ]);

  const filtered = sampleParticipants.filter(
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
    </div>
  );
}
