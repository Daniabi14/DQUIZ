"use client";

import React, { useState } from "react";
import { useAuth } from "@/lib/auth/AuthContext";
import { useToast } from "@/components/ui/Toast";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Settings, Shield, Bell, Save } from "lucide-react";

export default function HostSettingsPage() {
  const { showToast } = useToast();

  const [soundEffects, setSoundEffects] = useState(true);
  const [autoLockLobby, setAutoLockLobby] = useState(false);
  const [defaultTimeLimit, setDefaultTimeLimit] = useState(20);
  const [defaultPoints, setDefaultPoints] = useState(1000);

  const handleSave = () => {
    showToast({
      type: "success",
      title: "Settings Saved",
      message: "Host preferences updated.",
    });
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="pb-6 border-b border-slate-800">
        <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight font-display">
          Host Settings
        </h1>
        <p className="text-sm text-slate-400 mt-1">
          Configure default quiz parameters and session preferences.
        </p>
      </div>

      <Card variant="glass" className="p-6 border-slate-800 space-y-6">
        <div className="space-y-4">
          <h3 className="text-sm font-bold uppercase tracking-wider text-slate-400">
            Quiz Defaults
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400">
                Default Time Limit (Seconds)
              </label>
              <select
                value={defaultTimeLimit}
                onChange={(e) => setDefaultTimeLimit(Number(e.target.value))}
                className="w-full px-4 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-slate-200 text-sm focus:outline-none focus:border-brand-500"
              >
                <option value={15}>15 Seconds</option>
                <option value={20}>20 Seconds (Standard)</option>
                <option value={30}>30 Seconds</option>
                <option value={60}>60 Seconds</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400">
                Default Points
              </label>
              <select
                value={defaultPoints}
                onChange={(e) => setDefaultPoints(Number(e.target.value))}
                className="w-full px-4 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-slate-200 text-sm focus:outline-none focus:border-brand-500"
              >
                <option value={500}>500 Points</option>
                <option value={1000}>1000 Points (Standard)</option>
                <option value={2000}>2000 Points</option>
              </select>
            </div>
          </div>
        </div>

        <div className="pt-4 border-t border-slate-800 flex justify-end">
          <Button onClick={handleSave} className="gap-2">
            <Save className="w-4 h-4" />
            <span>Save Preferences</span>
          </Button>
        </div>
      </Card>
    </div>
  );
}
