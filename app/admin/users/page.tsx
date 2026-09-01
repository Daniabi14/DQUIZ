"use client";

import React, { useState } from "react";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Users, Search, Shield, UserX, UserCheck } from "lucide-react";

export default function AdminUsersPage() {
  const [search, setSearch] = useState("");
  const [users, setUsers] = useState([
    { id: "u1", name: "Prof. Alex Rivera", email: "alex.r@univ.edu", role: "host", status: "active", joined: "2026-08-15" },
    { id: "u2", name: "Dr. Sarah Chen", email: "schen@biotech.org", role: "host", status: "active", joined: "2026-08-20" },
    { id: "u3", name: "System Admin", email: "admin@dquiz.app", role: "admin", status: "active", joined: "2026-08-01" },
    { id: "u4", name: "Marcus Brody", email: "marcus@academy.io", role: "host", status: "active", joined: "2026-08-28" },
  ]);

  const toggleStatus = (id: string) => {
    setUsers((prev) =>
      prev.map((u) =>
        u.id === id ? { ...u, status: u.status === "active" ? "suspended" : "active" } : u
      )
    );
  };

  const filtered = users.filter(
    (u) =>
      u.name.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase()) ||
      u.role.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="pb-6 border-b border-slate-800">
        <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight font-display">
          User Management
        </h1>
        <p className="text-sm text-slate-400 mt-1">
          Manage host accounts, system administrators, and account permissions.
        </p>
      </div>

      <div className="max-w-md">
        <div className="relative">
          <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search users by name, email, or role..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-slate-900/90 border border-slate-800 rounded-xl text-slate-100 placeholder-slate-500 text-sm focus:outline-none focus:border-brand-500"
          />
        </div>
      </div>

      <Card variant="default" className="p-0 overflow-hidden border-slate-800 bg-slate-900/70">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-300">
            <thead className="bg-slate-950/80 text-xs font-semibold uppercase tracking-wider text-slate-400 border-b border-slate-800">
              <tr>
                <th className="py-3.5 px-6">User</th>
                <th className="py-3.5 px-6">Email</th>
                <th className="py-3.5 px-6">Role</th>
                <th className="py-3.5 px-6">Status</th>
                <th className="py-3.5 px-6">Joined</th>
                <th className="py-3.5 px-6 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-medium">
              {filtered.map((u) => (
                <tr key={u.id} className="hover:bg-slate-800/40">
                  <td className="py-4 px-6 font-bold text-white flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-slate-800 flex items-center justify-center text-xs font-bold text-brand-300">
                      {u.name.charAt(0)}
                    </div>
                    <span>{u.name}</span>
                  </td>
                  <td className="py-4 px-6 text-slate-400">{u.email}</td>
                  <td className="py-4 px-6">
                    <Badge variant={u.role === "admin" ? "primary" : "secondary"} size="sm">
                      {u.role}
                    </Badge>
                  </td>
                  <td className="py-4 px-6">
                    <Badge variant={u.status === "active" ? "success" : "danger"} size="sm">
                      {u.status}
                    </Badge>
                  </td>
                  <td className="py-4 px-6 text-xs text-slate-400 font-mono">{u.joined}</td>
                  <td className="py-4 px-6 text-right">
                    {u.role !== "admin" && (
                      <Button
                        variant={u.status === "active" ? "ghost" : "secondary"}
                        size="sm"
                        onClick={() => toggleStatus(u.id)}
                        className={`text-xs ${
                          u.status === "active"
                            ? "text-rose-400 hover:bg-rose-950/30"
                            : "text-emerald-400"
                        }`}
                      >
                        {u.status === "active" ? "Suspend" : "Activate"}
                      </Button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
