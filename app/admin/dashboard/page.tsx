"use client";

import React, { useState, useEffect } from "react";
import { useAuth } from "@/lib/auth/AuthContext";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import Link from "next/link";
import {
  ShieldAlert,
  Users,
  UserCheck,
  Layers,
  Radio,
  BarChart3,
  Server,
  Activity,
  CheckCircle2,
  AlertTriangle,
} from "lucide-react";
import { collection, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase/client";

export default function AdminDashboardPage() {
  const { profile } = useAuth();

  const [systemStats, setSystemStats] = useState({
    totalUsers: 1,
    totalHosts: 0,
    totalQuizzes: 0,
    totalLiveGames: 0,
    totalResponsesRecorded: 0,
    systemUptime: "99.99%",
  });

  const [recentHosts, setRecentHosts] = useState<any[]>([]);

  useEffect(() => {
    async function loadStats() {
      try {
        const usersSnap = await getDocs(collection(db, "users"));
        const quizzesSnap = await getDocs(collection(db, "quizzes"));
        const gamesSnap = await getDocs(collection(db, "games"));

        const userCount = Math.max(1, usersSnap.size);
        const hostCount = usersSnap.docs.filter((d) => d.data().role === "host").length;

        setSystemStats({
          totalUsers: userCount,
          totalHosts: hostCount,
          totalQuizzes: quizzesSnap.size,
          totalLiveGames: gamesSnap.size,
          totalResponsesRecorded: 0,
          systemUptime: "99.99%",
        });

        const hostList = usersSnap.docs
          .filter((d) => d.data().role === "host")
          .map((d) => ({
            id: d.id,
            name: d.data().displayName || "Host",
            email: d.data().email || "",
            quizzes: 0,
            status: d.data().disabled ? "suspended" : "active",
          }));
        setRecentHosts(hostList);
      } catch (e) {
        console.warn(e);
      }
    }
    loadStats();
  }, []);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Badge variant="primary" size="sm" className="bg-purple-950/60 border-purple-800 text-purple-300">
              SUPER ADMIN CONTROL CENTER
            </Badge>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight font-display">
            Super Administrator Dashboard
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Global monitoring, host verification, platform configuration, and system telemetry.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Badge variant="success" size="md" className="gap-1.5 py-1.5 px-3">
            <Activity className="w-3.5 h-3.5" />
            <span>Systems Normal</span>
          </Badge>
        </div>
      </div>

      {/* System Metrics Overview */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        <Card variant="glass" className="p-5 border-slate-800 flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Total System Hosts</p>
            <p className="text-2xl sm:text-3xl font-extrabold text-white font-display mt-1">
              {systemStats.totalHosts}
            </p>
            <span className="text-[11px] text-slate-500 font-medium mt-1 inline-block">
              Registered quiz masters
            </span>
          </div>
          <div className="w-12 h-12 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400">
            <UserCheck className="w-6 h-6" />
          </div>
        </Card>

        <Card variant="glass" className="p-5 border-slate-800 flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Global Quizzes</p>
            <p className="text-2xl sm:text-3xl font-extrabold text-white font-display mt-1">
              {systemStats.totalQuizzes}
            </p>
            <span className="text-[11px] text-brand-400 font-medium mt-1 inline-block">
              Across all hosts
            </span>
          </div>
          <div className="w-12 h-12 rounded-xl bg-brand-500/10 border border-brand-500/20 flex items-center justify-center text-brand-400">
            <Layers className="w-6 h-6" />
          </div>
        </Card>

        <Card variant="glass" className="p-5 border-slate-800 flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Live Games Conducted</p>
            <p className="text-2xl sm:text-3xl font-extrabold text-white font-display mt-1">
              {systemStats.totalLiveGames}
            </p>
            <span className="text-[11px] text-purple-400 font-medium mt-1 inline-block">
              {systemStats.totalResponsesRecorded} answers recorded
            </span>
          </div>
          <div className="w-12 h-12 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400">
            <Radio className="w-6 h-6" />
          </div>
        </Card>
      </div>

      {/* Global Host Management Overview */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-white tracking-tight font-display">
            Active System Hosts
          </h2>
          <Link href="/admin/users" className="text-xs text-brand-400 hover:text-brand-300 font-semibold">
            View All Users →
          </Link>
        </div>

        {recentHosts.length === 0 ? (
          <Card variant="default" className="p-12 text-center border-slate-800 bg-slate-900/50 space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-brand-600/10 border border-brand-500/20 flex items-center justify-center mx-auto text-brand-400">
              <Users className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-white">No registered hosts yet</h3>
            <p className="text-xs text-slate-400 max-w-sm mx-auto">
              When educators and trainers register on your platform, their accounts will appear here automatically.
            </p>
          </Card>
        ) : (
          <Card variant="default" className="p-0 overflow-hidden border-slate-800 bg-slate-900/50">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-slate-300">
                <thead className="bg-slate-950/80 text-xs font-semibold uppercase tracking-wider text-slate-400 border-b border-slate-800">
                  <tr>
                    <th className="py-3.5 px-6">Host Name</th>
                    <th className="py-3.5 px-6">Email</th>
                    <th className="py-3.5 px-6">Quizzes</th>
                    <th className="py-3.5 px-6">Status</th>
                    <th className="py-3.5 px-6 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 font-medium">
                  {recentHosts.map((host) => (
                    <tr key={host.id} className="hover:bg-slate-800/30 transition-colors">
                      <td className="py-4 px-6 font-bold text-white flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-slate-800 flex items-center justify-center text-brand-400 text-xs font-bold">
                          {host.name.charAt(0)}
                        </div>
                        <span>{host.name}</span>
                      </td>
                      <td className="py-4 px-6 text-slate-400">{host.email}</td>
                      <td className="py-4 px-6 text-white font-mono">{host.quizzes}</td>
                      <td className="py-4 px-6">
                        <Badge variant="success" size="sm">
                          {host.status}
                        </Badge>
                      </td>
                      <td className="py-4 px-6 text-right">
                        <Link href="/admin/users">
                          <Button variant="ghost" size="sm" className="text-slate-400 hover:text-white">
                            Manage
                          </Button>
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}
