"use client";

import React from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth/AuthContext";
import {
  ShieldAlert,
  Users,
  UserCheck,
  Layers,
  HelpCircle,
  Radio,
  GraduationCap,
  Award,
  BarChart3,
  Tags,
  Settings,
  LogOut,
} from "lucide-react";
import { cn } from "@/lib/utils";

const adminNavItems = [
  { name: "Dashboard", href: "/admin/dashboard", icon: ShieldAlert },
  { name: "Users", href: "/admin/users", icon: Users },
  { name: "Hosts", href: "/admin/hosts", icon: UserCheck },
  { name: "Quizzes", href: "/admin/quizzes", icon: Layers },
  { name: "Question Bank", href: "/admin/question-bank", icon: HelpCircle },
  { name: "Live Games", href: "/admin/games", icon: Radio },
  { name: "Participants", href: "/admin/participants", icon: GraduationCap },
  { name: "Results", href: "/admin/results", icon: Award },
  { name: "Analytics", href: "/admin/analytics", icon: BarChart3 },
  { name: "Categories", href: "/admin/categories", icon: Tags },
  { name: "Settings", href: "/admin/settings", icon: Settings },
];

export const AdminSidebar = () => {
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
        {/* Admin Info Banner */}
        <div className="p-3 bg-purple-950/40 border border-purple-800/40 rounded-xl flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-purple-600/30 border border-purple-500/40 flex items-center justify-center text-purple-300 font-bold">
            A
          </div>
          <div className="overflow-hidden">
            <p className="text-sm font-semibold text-white truncate">
              {profile?.displayName || "System Admin"}
            </p>
            <p className="text-xs text-purple-400 font-semibold uppercase tracking-wider">
              SUPER ADMIN
            </p>
          </div>
        </div>

        {/* Navigation */}
        <nav className="space-y-1">
          {adminNavItems.map((item) => {
            const isActive = pathname === item.href || (item.href !== "/admin/dashboard" && pathname.startsWith(item.href));
            const Icon = item.icon;

            return (
              <Link
                key={item.name}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 px-3.5 py-2 rounded-xl text-sm font-medium transition-colors duration-150",
                  isActive
                    ? "bg-purple-950/60 text-purple-300 border border-purple-800/50 font-semibold"
                    : "text-slate-400 hover:text-slate-200 hover:bg-slate-900/60"
                )}
              >
                <Icon className={cn("w-4 h-4 shrink-0", isActive ? "text-purple-400" : "text-slate-500")} />
                <span>{item.name}</span>
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Logout */}
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
