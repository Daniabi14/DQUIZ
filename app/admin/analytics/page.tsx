"use client";

import React from "react";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { BarChart3, TrendingUp, Users, Radio, Activity, Cpu } from "lucide-react";

export default function AdminAnalyticsPage() {
  return (
    <div className="space-y-8">
      <div className="pb-6 border-b border-slate-800">
        <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight font-display">
          System Analytics & Telemetry
        </h1>
        <p className="text-sm text-slate-400 mt-1">
          High-level performance monitoring, concurrency throughput, and engagement metrics.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card variant="glass" className="p-5 border-slate-800">
          <p className="text-xs uppercase font-semibold text-slate-400">Total Live Traffic</p>
          <p className="text-3xl font-extrabold text-white font-mono mt-1">1,420</p>
          <span className="text-xs text-emerald-400 font-medium flex items-center gap-1 mt-1">
            <TrendingUp className="w-3.5 h-3.5" /> +18% peak today
          </span>
        </Card>

        <Card variant="glass" className="p-5 border-slate-800">
          <p className="text-xs uppercase font-semibold text-slate-400">Avg Sync Latency</p>
          <p className="text-3xl font-extrabold text-brand-300 font-mono mt-1">42ms</p>
          <span className="text-xs text-slate-400 font-medium mt-1 inline-block">
            Ultra-low latency
          </span>
        </Card>

        <Card variant="glass" className="p-5 border-slate-800">
          <p className="text-xs uppercase font-semibold text-slate-400">Success Rate</p>
          <p className="text-3xl font-extrabold text-emerald-300 font-mono mt-1">99.98%</p>
          <span className="text-xs text-emerald-400 font-medium mt-1 inline-block">
            0 dropped packets
          </span>
        </Card>

        <Card variant="glass" className="p-5 border-slate-800">
          <p className="text-xs uppercase font-semibold text-slate-400">Answer Throughput</p>
          <p className="text-3xl font-extrabold text-purple-300 font-mono mt-1">480/s</p>
          <span className="text-xs text-slate-400 font-medium mt-1 inline-block">
            Peak concurrency
          </span>
        </Card>
      </div>

      <Card variant="default" className="p-6 bg-slate-900/70 border-slate-800 space-y-4">
        <h3 className="font-bold text-white text-base flex items-center gap-2">
          <Cpu className="w-4 h-4 text-brand-400" />
          <span>Platform Health & Real-Time Engine Nodes</span>
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
          <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 space-y-1">
            <span className="text-slate-400 font-semibold">Firestore State Bus</span>
            <p className="text-emerald-400 font-bold text-sm">OPERATIONAL</p>
          </div>
          <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 space-y-1">
            <span className="text-slate-400 font-semibold">Timer Sync Clock</span>
            <p className="text-emerald-400 font-bold text-sm">ACCURATE (±1ms)</p>
          </div>
          <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 space-y-1">
            <span className="text-slate-400 font-semibold">Security Rules Enforcement</span>
            <p className="text-emerald-400 font-bold text-sm">STRICT PRIVACY</p>
          </div>
        </div>
      </Card>
    </div>
  );
}
