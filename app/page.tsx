"use client";

import React from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import {
  Gamepad2,
  Sparkles,
  Zap,
  Shuffle,
  ShieldCheck,
  FileSpreadsheet,
  BarChart3,
  Users2,
  Timer,
  CheckCircle2,
  ArrowRight,
  Radio,
} from "lucide-react";

export default function LandingPage() {
  const features = [
    {
      icon: Sparkles,
      title: "Interactive Quiz Builder",
      description:
        "Craft rich single-choice, multiple-choice, and true/false questions with custom point weights, time limits, and media.",
    },
    {
      icon: FileSpreadsheet,
      title: "Bulk Excel & CSV Upload",
      description:
        "Import dozens of questions in seconds using our pre-formatted spreadsheet templates with automatic row validation.",
    },
    {
      icon: Zap,
      title: "Real-Time Sync Engine",
      description:
        "Ultra-low latency question delivery, synchronized timers, and authoritative server-driven state transitions.",
    },
    {
      icon: Shuffle,
      title: "Fair Shuffle & Option Randomization",
      description:
        "Fisher-Yates question sequencing and per-participant answer option shuffling to prevent screen peeking.",
    },
    {
      icon: ShieldCheck,
      title: "Strict Anti-Cheating & Privacy",
      description:
        "Zero scores, rankings, or answers leaked to participants. Server timestamps strictly reject late submissions.",
    },
    {
      icon: BarChart3,
      title: "Deep Reports & Instant Export",
      description:
        "Download comprehensive Excel, CSV, and PDF reports for participant accuracy, item analysis, and attendance.",
    },
  ];

  const targetAudiences = [
    "Schools & Universities",
    "Corporate Trainers",
    "Hackathons & Competitions",
    "Workshops & Seminars",
    "Technical Bootcamps",
    "Community Quizzes",
  ];

  return (
    <div className="relative overflow-hidden flex flex-col items-center">
      {/* Background radial glows */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-brand-600/15 blur-[120px] pointer-events-none -z-10 rounded-full" />
      <div className="absolute top-1/3 -left-40 w-[500px] h-[500px] bg-indigo-600/10 blur-[140px] pointer-events-none -z-10 rounded-full" />
      <div className="absolute bottom-10 -right-40 w-[500px] h-[500px] bg-purple-600/10 blur-[140px] pointer-events-none -z-10 rounded-full" />

      {/* Hero Section */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-16 text-center flex flex-col items-center">
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          <Badge variant="primary" size="md" className="mb-6 px-4 py-1.5 border-brand-500/30 bg-brand-950/60">
            <Radio className="w-3.5 h-3.5 text-brand-400 animate-pulse mr-1" />
            STANDALONE REAL-TIME PLATFORM
          </Badge>
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="text-4xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight text-white max-w-4xl font-display leading-[1.1]"
        >
          LIVE QUIZZES. <br />
          <span className="bg-gradient-to-r from-brand-400 via-indigo-300 to-purple-400 bg-clip-text text-transparent">
            REAL-TIME COMPETITION.
          </span>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="mt-6 text-lg sm:text-xl text-slate-300 max-w-2xl font-normal leading-relaxed"
        >
          Create quizzes, invite participants, and run engaging live quiz sessions. Built for educators, trainers, companies, and competitions.
        </motion.p>

        {/* CTA Buttons */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="mt-10 flex flex-col sm:flex-row items-center gap-4 w-full sm:w-auto"
        >
          <Link href="/join" className="w-full sm:w-auto">
            <Button size="xl" className="w-full sm:w-auto shadow-2xl shadow-brand-600/30 gap-3">
              <Gamepad2 className="w-6 h-6 text-white" />
              <span>JOIN A GAME</span>
            </Button>
          </Link>

          <Link href="/login" className="w-full sm:w-auto">
            <Button variant="secondary" size="xl" className="w-full sm:w-auto gap-2 border-slate-700 bg-slate-900/90 hover:bg-slate-800">
              <span>HOST A QUIZ</span>
              <ArrowRight className="w-5 h-5 text-slate-400" />
            </Button>
          </Link>
        </motion.div>

        {/* Audience Pills */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="mt-14 flex flex-wrap justify-center gap-2 max-w-3xl"
        >
          {targetAudiences.map((aud) => (
            <span
              key={aud}
              className="px-3 py-1 bg-slate-900/60 border border-slate-800 rounded-lg text-xs font-medium text-slate-400"
            >
              {aud}
            </span>
          ))}
        </motion.div>
      </section>

      {/* Live Showcase Preview Box */}
      <section className="max-w-5xl mx-auto px-4 sm:px-6 w-full pb-20">
        <div className="relative rounded-3xl p-1 bg-gradient-to-b from-slate-800 via-slate-800/40 to-transparent shadow-2xl">
          <div className="bg-slate-950 rounded-[22px] p-6 sm:p-10 border border-slate-800/60 flex flex-col md:flex-row items-center justify-between gap-8">
            <div className="space-y-4 max-w-md">
              <Badge variant="success" size="sm">
                HOST CONTROL ENGINE
              </Badge>
              <h2 className="text-2xl sm:text-3xl font-bold text-white tracking-tight font-display">
                Complete control from creation to final report
              </h2>
              <p className="text-sm text-slate-400 leading-relaxed">
                Hosts manage live sessions with instant PINs, QR codes, live response monitoring, and zero data leakage to students.
              </p>
              <div className="space-y-2 pt-2">
                <div className="flex items-center gap-2 text-xs text-slate-300">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span>Student answers locked instantly upon submission</span>
                </div>
                <div className="flex items-center gap-2 text-xs text-slate-300">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span>Server-authoritative timer prevents latency exploitation</span>
                </div>
                <div className="flex items-center gap-2 text-xs text-slate-300">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span>Export comprehensive reports in Excel, CSV, and PDF</span>
                </div>
              </div>
            </div>

            {/* Visual Graphic Representation */}
            <div className="w-full md:w-80 bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Live Game Pin</span>
                <span className="px-2.5 py-1 bg-brand-500/20 text-brand-300 rounded-md text-xs font-mono font-bold">
                  582 941
                </span>
              </div>
              <div className="space-y-2">
                <div className="h-2.5 bg-slate-800 rounded-full overflow-hidden">
                  <div className="h-full bg-brand-500 w-3/4 rounded-full" />
                </div>
                <div className="flex justify-between text-[11px] text-slate-400">
                  <span>34 Answered</span>
                  <span>8 Remaining</span>
                </div>
              </div>
              <div className="p-3 bg-slate-950/80 rounded-xl border border-slate-800/80 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <Timer className="w-4 h-4 text-amber-400" />
                  <span className="text-xs font-medium text-slate-200">Timer</span>
                </div>
                <span className="text-sm font-bold font-mono text-amber-300">14s</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Feature Grid */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16 w-full">
        <div className="text-center space-y-3 mb-12">
          <h2 className="text-3xl font-extrabold text-white tracking-tight font-display">
            Engineered for High-Stakes & Large-Scale Quizzing
          </h2>
          <p className="text-slate-400 text-sm max-w-xl mx-auto">
            Everything you need to run reliable, engaging, and tamper-resistant quiz competitions.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feat, i) => {
            const Icon = feat.icon;
            return (
              <motion.div
                key={feat.title}
                initial={{ opacity: 0, y: 15 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: i * 0.08 }}
              >
                <Card variant="glass" hoverEffect className="h-full flex flex-col justify-between p-6">
                  <div className="space-y-4">
                    <div className="w-12 h-12 rounded-xl bg-brand-600/15 border border-brand-500/20 flex items-center justify-center text-brand-400">
                      <Icon className="w-6 h-6" />
                    </div>
                    <h3 className="text-lg font-bold text-white tracking-tight">{feat.title}</h3>
                    <p className="text-xs text-slate-400 leading-relaxed">{feat.description}</p>
                  </div>
                </Card>
              </motion.div>
            );
          })}
        </div>
      </section>

      {/* Footer */}
      <footer className="w-full border-t border-slate-900 mt-20 py-8 px-4 sm:px-6 text-center bg-slate-950">
        <p className="text-xs text-slate-500">
          DQUIZ — Independent Standalone Real-Time Quiz Platform. Generic and reusable.
        </p>
      </footer>
    </div>
  );
}
