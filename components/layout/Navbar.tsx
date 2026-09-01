"use client";

import React from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth/AuthContext";
import { Button } from "@/components/ui/Button";
import { Sparkles, Gamepad2, Shield, User, LogOut, LayoutDashboard } from "lucide-react";

export const Navbar = () => {
  const pathname = usePathname();
  const router = useRouter();
  const { profile, role, isHost, isAdmin, logout } = useAuth();

  // Hide main navbar on full-screen game interfaces if needed, but show on landing/join/auth
  const isMinimalRoute = pathname.startsWith("/game/");

  if (isMinimalRoute) return null;

  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-800/80 bg-slate-950/80 backdrop-blur-md">
      <div className="max-w-7xl mx-auto flex h-16 items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Brand Logo */}
        <Link href="/" className="flex items-center gap-2.5 group">
          <div className="h-9 w-9 rounded-xl bg-gradient-to-tr from-brand-600 to-indigo-400 flex items-center justify-center shadow-md shadow-brand-500/20 group-hover:scale-105 transition-transform">
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          <div className="flex flex-col">
            <span className="font-extrabold text-xl tracking-wider text-white font-display">
              D<span className="text-brand-400">QUIZ</span>
            </span>
          </div>
        </Link>

        {/* Action Links */}
        <div className="flex items-center gap-3">
          <Link href="/join">
            <Button variant="outline" size="sm" className="gap-2 border-brand-500/30 hover:border-brand-500/60 text-brand-300">
              <Gamepad2 className="w-4 h-4 text-brand-400" />
              <span>Join Game</span>
            </Button>
          </Link>

          {profile ? (
            <div className="flex items-center gap-2">
              {isAdmin ? (
                <Link href="/admin/dashboard">
                  <Button variant="secondary" size="sm" className="gap-1.5 bg-purple-950/60 border-purple-800/50 text-purple-300 hover:bg-purple-900/60">
                    <Shield className="w-4 h-4 text-purple-400" />
                    <span className="hidden sm:inline">Admin</span>
                  </Button>
                </Link>
              ) : isHost ? (
                <Link href="/host/dashboard">
                  <Button variant="secondary" size="sm" className="gap-1.5">
                    <LayoutDashboard className="w-4 h-4 text-brand-400" />
                    <span className="hidden sm:inline">Host Panel</span>
                  </Button>
                </Link>
              ) : null}

              <div className="flex items-center gap-2 pl-2 border-l border-slate-800">
                <span className="text-xs text-slate-300 font-medium hidden md:inline-block max-w-[120px] truncate">
                  {profile.displayName || profile.email}
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={async () => {
                    await logout();
                    router.push("/");
                  }}
                  className="p-2 text-slate-400 hover:text-rose-400"
                  title="Logout"
                >
                  <LogOut className="w-4 h-4" />
                </Button>
              </div>
            </div>
          ) : (
            <Link href="/login">
              <Button variant="primary" size="sm">
                Host Sign In
              </Button>
            </Link>
          )}
        </div>
      </div>
    </header>
  );
};
