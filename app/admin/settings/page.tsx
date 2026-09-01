"use client";

import React, { useState } from "react";
import { useToast } from "@/components/ui/Toast";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Settings, Shield, Globe, Save } from "lucide-react";

export default function AdminSettingsPage() {
  const { showToast } = useToast();

  const [platformName, setPlatformName] = useState("DQUIZ");
  const [maxParticipantsPerGame, setMaxParticipantsPerGame] = useState(1000);
  const [allowPublicRegistration, setAllowPublicRegistration] = useState(true);

  const handleSave = () => {
    showToast({
      type: "success",
      title: "Settings Saved",
      message: "Global system configuration updated.",
    });
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="pb-6 border-b border-slate-800">
        <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight font-display">
          System Settings & Platform Policy
        </h1>
        <p className="text-sm text-slate-400 mt-1">
          Configure platform-wide limits, security thresholds, and global parameters.
        </p>
      </div>

      <Card variant="glass" className="p-6 border-slate-800 space-y-6">
        <div className="space-y-4">
          <Input
            label="Platform Brand Name"
            value={platformName}
            onChange={(e) => setPlatformName(e.target.value)}
          />

          <div className="space-y-1.5">
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400">
              Maximum Concurrent Participants Per Session
            </label>
            <input
              type="number"
              value={maxParticipantsPerGame}
              onChange={(e) => setMaxParticipantsPerGame(Number(e.target.value))}
              className="w-full px-4 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-slate-100 text-sm focus:outline-none focus:border-brand-500"
            />
          </div>

          <div className="pt-2 flex items-center justify-between p-4 bg-slate-950 rounded-xl border border-slate-800">
            <div>
              <p className="text-sm font-bold text-white">Public Host Registration</p>
              <p className="text-xs text-slate-400">Allow new educators/hosts to register accounts</p>
            </div>
            <button
              type="button"
              onClick={() => setAllowPublicRegistration(!allowPublicRegistration)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                allowPublicRegistration
                  ? "bg-emerald-600 text-white"
                  : "bg-slate-800 text-slate-400"
              }`}
            >
              {allowPublicRegistration ? "ENABLED" : "DISABLED"}
            </button>
          </div>
        </div>

        <div className="pt-4 border-t border-slate-800 flex justify-end">
          <Button onClick={handleSave} className="gap-2">
            <Save className="w-4 h-4" />
            <span>Save Configuration</span>
          </Button>
        </div>
      </Card>
    </div>
  );
}
