"use client";

import React from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth/AuthContext";
import {
  LayoutDashboard,
  Layers,
  HelpCircle,
  UploadCloud,
  Radio,
  Users,
  Award,
  FileBarChart,
  UserCheck,
  Settings,
  LogOut,
  Sparkles,
} from "lucide-react";
import { cn } from "@/lib/utils";

const hostNavItems = [
  { name: "Dashboard", href: "/host/dashboard", icon: LayoutDashboard },
  { name: "My Quizzes", href: "/host/quizzes", icon: Layers },
  { name: "Question Bank", href: "/host/question-bank", icon: HelpCircle },
  { name: "Upload Questions", href: "/host/upload", icon: UploadCloud },
  { name: "Live Games", href: "/host/games", icon: Radio },
  { name: "Participants", href: "/host/participants", icon: Users },
  { name: "Results", href: "/host/results", icon: Award },
  { name: "Reports", href: "/host/reports", icon: FileBarChart },
  { name: "Profile", href: "/host/profile", icon: UserCheck },
  { name: "Settings", href: "/host/settings", icon: Settings },
];

export const HostSidebar = () => {
  const pathname = usePathname();
  const router = useRouter();
  const { profile, logout } = useAuth();

  const handleLogout = async () => {
    await logout();
    router.push("/login");
  };

  return (
    <aside className="w-64 shrink-0 border-r border-slate-800 bg-slate-950 flex flex-col justify-between min-h-[calc(100vh-4rem)]">
      <div className="p-4 space-y-6">
        {/* Host Info Box */}
        <div className="p-3 bg-slate-900/90 border border-slate-800 rounded-xl flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-brand-600/20 border border-brand-500/30 flex items-center justify-center text-brand-400 font-bold">
            {profile?.displayName?.charAt(0) || "H"}
          </div>
          <div className="overflow-hidden">
            <p className="text-sm font-semibold text-white truncate">
              {profile?.displayName || "Host User"}
            </p>
            <p className="text-xs text-brand-400 font-medium capitalize">
              {profile?.role || "Host"}
            </p>
          </div>
        </div>

        {/* Navigation Items */}
        <nav className="space-y-1">
          {hostNavItems.map((item) => {
            const isActive = pathname === item.href || (item.href !== "/host/dashboard" && pathname.startsWith(item.href));
            const Icon = item.icon;

            return (
              <Link
                key={item.name}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-colors duration-150",
                  isActive
                    ? "bg-brand-600/20 text-brand-300 border border-brand-500/30 font-semibold"
                    : "text-slate-400 hover:text-slate-200 hover:bg-slate-900/60"
                )}
              >
                <Icon className={cn("w-4 h-4 shrink-0", isActive ? "text-brand-400" : "text-slate-500")} />
                <span>{item.name}</span>
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Footer / Logout */}
      <div className="p-4 border-t border-slate-900">
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium text-slate-400 hover:text-rose-400 hover:bg-rose-950/20 transition-colors"
        >
          <LogOut className="w-4 h-4" />
          <span>Logout</span>
        </button>
      </div>
    </aside>
  );
};
