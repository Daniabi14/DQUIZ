import type { Metadata } from "next";
import "./globals.css";
import { AuthProvider } from "@/lib/auth/AuthContext";
import { ToastProvider } from "@/components/ui/Toast";
import { Navbar } from "@/components/layout/Navbar";

export const metadata: Metadata = {
  title: "DQUIZ — Standalone Real-Time Multiplayer Quiz Platform",
  description:
    "Create quizzes, invite participants, and run engaging live real-time quiz sessions for schools, universities, companies, and workshops.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className="min-h-screen bg-slate-950 text-slate-100 antialiased flex flex-col">
        <AuthProvider>
          <ToastProvider>
            <Navbar />
            <main className="flex-1 flex flex-col">{children}</main>
          </ToastProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
