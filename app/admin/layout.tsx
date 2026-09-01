"use client";

import React, { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth/AuthContext";
import { AdminSidebar } from "@/components/layout/AdminSidebar";
import { Loader2 } from "lucide-react";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { profile, loading, isAdmin } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading) {
      if (!profile) {
        router.push("/login");
      }
    }
  }, [loading, profile, router]);

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 text-purple-400 animate-spin" />
      </div>
    );
  }

  if (!profile) {
    return null;
  }

  return (
    <div className="flex flex-1 min-h-[calc(100vh-4rem)]">
      <AdminSidebar />
      <main className="flex-1 overflow-y-auto p-6 sm:p-8 lg:p-10 bg-slate-950/60">
        <div className="max-w-7xl mx-auto">{children}</div>
      </main>
    </div>
  );
}
