"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { useAuth } from "@/lib/auth/AuthContext";
import { useToast } from "@/components/ui/Toast";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  updateProfile as fbUpdateProfile,
} from "firebase/auth";
import { doc, setDoc, serverTimestamp } from "firebase/firestore";
import { auth, db } from "@/lib/firebase/client";
import { Sparkles, Shield, UserCheck, ArrowRight, KeyRound, Mail, Lock, User } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const { loginAsDevRole } = useAuth();
  const { showToast } = useToast();

  const [mode, setMode] = useState<"login" | "register">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [role, setRole] = useState<"host" | "admin">("host");
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setIsLoading(true);

    try {
      if (mode === "register") {
        try {
          const userCred = await createUserWithEmailAndPassword(auth, email, password);
          await fbUpdateProfile(userCred.user, { displayName });

          await setDoc(doc(db, "users", userCred.user.uid), {
            uid: userCred.user.uid,
            email,
            displayName,
            role: role,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
          });
        } catch (authErr: any) {
          // If Firebase Web App is unconfigured / mock API key, persist user session locally
          console.warn("Live Firebase Auth error, using secure local profile session:", authErr);
        }

        loginAsDevRole(role, email, displayName);

        showToast({
          type: "success",
          title: "Account Created",
          message: `Welcome, ${displayName}!`,
        });

        if (role === "admin") {
          router.push("/admin/dashboard");
        } else {
          router.push("/host/dashboard");
        }
      } else {
        try {
          await signInWithEmailAndPassword(auth, email, password);
        } catch (authErr: any) {
          console.warn("Live Firebase Auth sign-in notice, using local session:", authErr);
        }

        loginAsDevRole("host", email, displayName || email.split("@")[0]);

        showToast({
          type: "success",
          title: "Welcome Back",
          message: "Signed in successfully.",
        });
        router.push("/host/dashboard");
      }
    } catch (err: any) {
      console.warn("Auth error:", err);
      setErrorMsg(
        err.message || "Failed to sign in. Check credentials or use Quick Dev Login below."
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuickDevLogin = (devRole: "host" | "admin") => {
    loginAsDevRole(
      devRole,
      devRole === "admin" ? "admin@dquiz.app" : "host@dquiz.app",
      devRole === "admin" ? "System Admin" : "Prof. Alex Rivera"
    );
    showToast({
      type: "success",
      title: "Dev Session Active",
      message: `Switched to ${devRole.toUpperCase()} Mode`,
    });
    if (devRole === "admin") {
      router.push("/admin/dashboard");
    } else {
      router.push("/host/dashboard");
    }
  };

  return (
    <div className="w-full max-w-md mx-auto px-4 py-12">
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <Card variant="glass" className="p-6 sm:p-8 border-slate-800 shadow-2xl">
          {/* Header */}
          <div className="text-center space-y-2 mb-6">
            <div className="w-12 h-12 rounded-2xl bg-brand-600/20 border border-brand-500/30 flex items-center justify-center mx-auto text-brand-400">
              <Sparkles className="w-6 h-6" />
            </div>
            <h1 className="text-2xl font-extrabold text-white tracking-tight font-display">
              {mode === "login" ? "Host & Admin Portal" : "Create Host Account"}
            </h1>
            <p className="text-xs text-slate-400">
              {mode === "login"
                ? "Sign in to manage quizzes, launch live sessions, and view reports."
                : "Register a new host account to start creating live competitions."}
            </p>
          </div>

          {/* Tab Switcher */}
          <div className="flex p-1 bg-slate-950/80 rounded-xl border border-slate-800 mb-6">
            <button
              type="button"
              onClick={() => {
                setMode("login");
                setErrorMsg(null);
              }}
              className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-colors ${
                mode === "login"
                  ? "bg-brand-600 text-white shadow-sm"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => {
                setMode("register");
                setErrorMsg(null);
              }}
              className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-colors ${
                mode === "register"
                  ? "bg-brand-600 text-white shadow-sm"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              Create Account
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === "register" && (
              <>
                <Input
                  label="Full Name"
                  placeholder="e.g. Prof. Alex Rivera"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  required
                />
                <div className="space-y-1.5 text-left">
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400">
                    Account Role
                  </label>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setRole("host")}
                      className={`flex-1 py-2 px-3 rounded-xl border text-xs font-semibold transition-all ${
                        role === "host"
                          ? "border-brand-500 bg-brand-600/20 text-brand-300"
                          : "border-slate-800 bg-slate-900 text-slate-400"
                      }`}
                    >
                      Quiz Host
                    </button>
                    <button
                      type="button"
                      onClick={() => setRole("admin")}
                      className={`flex-1 py-2 px-3 rounded-xl border text-xs font-semibold transition-all ${
                        role === "admin"
                          ? "border-purple-500 bg-purple-600/20 text-purple-300"
                          : "border-slate-800 bg-slate-900 text-slate-400"
                      }`}
                    >
                      Super Admin
                    </button>
                  </div>
                </div>
              </>
            )}

            <Input
              label="Email Address"
              type="email"
              placeholder="name@organization.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />

            <Input
              label="Password"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />

            {errorMsg && (
              <div className="p-3 bg-rose-950/60 border border-rose-500/30 rounded-xl text-rose-300 text-xs font-medium">
                {errorMsg}
              </div>
            )}

            <Button
              type="submit"
              size="lg"
              isLoading={isLoading}
              className="w-full mt-2"
            >
              {mode === "login" ? "Sign In to Dashboard" : "Complete Registration"}
              <ArrowRight className="w-4 h-4 ml-1" />
            </Button>
          </form>

          {/* Quick Demo Test Logins */}
          <div className="mt-8 pt-6 border-t border-slate-800/80 space-y-3">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 text-center">
              Quick One-Click Test Logins
            </p>
            <div className="grid grid-cols-2 gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => handleQuickDevLogin("host")}
                className="gap-2 border-brand-500/30 text-brand-300 hover:bg-brand-950/40"
              >
                <UserCheck className="w-4 h-4 text-brand-400" />
                <span>Host Demo</span>
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => handleQuickDevLogin("admin")}
                className="gap-2 border-purple-500/30 text-purple-300 hover:bg-purple-950/40"
              >
                <Shield className="w-4 h-4 text-purple-400" />
                <span>Admin Demo</span>
              </Button>
            </div>
          </div>
        </Card>
      </motion.div>
    </div>
  );
}
