"use client";

import React, { useState } from "react";
import { useAuth } from "@/lib/auth/AuthContext";
import { useToast } from "@/components/ui/Toast";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { UserCheck, Mail, Building, Save } from "lucide-react";

export default function HostProfilePage() {
  const { profile, updateProfile } = useAuth();
  const { showToast } = useToast();

  const [displayName, setDisplayName] = useState(profile?.displayName || "Prof. Alex Rivera");
  const [institution, setInstitution] = useState(profile?.institution || "Global Academy");
  const [department, setDepartment] = useState(profile?.department || "Computer Science");
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      await updateProfile({
        displayName,
        institution,
        department,
      });
      showToast({
        type: "success",
        title: "Profile Saved",
        message: "Your profile information has been updated.",
      });
    } catch (err: any) {
      showToast({ type: "error", title: "Error", message: err.message });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="pb-6 border-b border-slate-800">
        <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight font-display">
          Host Profile
        </h1>
        <p className="text-sm text-slate-400 mt-1">
          Manage your personal display name and institutional affiliations.
        </p>
      </div>

      <Card variant="glass" className="p-6 sm:p-8 border-slate-800 shadow-2xl">
        <form onSubmit={handleSave} className="space-y-5">
          <Input
            label="Host Full Name"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            required
          />

          <Input
            label="Email Address"
            value={profile?.email || "host@dquiz.app"}
            disabled
            helperText="Email is managed via authentication credentials."
          />

          <Input
            label="Institution / Organization"
            value={institution}
            onChange={(e) => setInstitution(e.target.value)}
            placeholder="e.g. Stanford University or Tech Corp"
          />

          <Input
            label="Department / Team"
            value={department}
            onChange={(e) => setDepartment(e.target.value)}
            placeholder="e.g. Department of Computer Science"
          />

          <div className="flex justify-end pt-4 border-t border-slate-800">
            <Button type="submit" isLoading={isSaving} className="gap-2">
              <Save className="w-4 h-4" />
              <span>Save Changes</span>
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
