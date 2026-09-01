"use client";

import React, { useState, useEffect } from "react";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { useToast } from "@/components/ui/Toast";
import { Users, Search, Shield, UserX, UserCheck, Trash2, AlertTriangle, Loader2 } from "lucide-react";
import { collection, getDocs, deleteDoc, doc, updateDoc } from "firebase/firestore";
import { db } from "@/lib/firebase/client";

interface UserItem {
  id: string;
  name: string;
  email: string;
  role: string;
  status: string;
  joined: string;
}

const DEFAULT_USERS: UserItem[] = [
  { id: "u_super", name: "Daniel Abishek", email: "danielabishek60@gmail.com", role: "admin", status: "active", joined: "Primary SuperAdmin" },
];

export default function AdminUsersPage() {
  const { showToast } = useToast();
  const [search, setSearch] = useState("");
  const [users, setUsers] = useState<UserItem[]>([]);
  const [userToDelete, setUserToDelete] = useState<UserItem | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const loadUsers = async () => {
    setIsLoading(true);
    try {
      const snap = await getDocs(collection(db, "users"));
      if (!snap.empty) {
        const fetched: UserItem[] = snap.docs.map((d) => {
          const data = d.data();
          return {
            id: d.id,
            name: data.displayName || "User",
            email: data.email || "",
            role: data.role || "host",
            status: data.disabled ? "suspended" : "active",
            joined: data.createdAt?.toDate ? data.createdAt.toDate().toLocaleDateString() : "Recent",
          };
        });
        setUsers(fetched);
        setIsLoading(false);
        return;
      }
    } catch (e) {
      console.warn("Firestore fetch users notice, using local directory:", e);
    }

    if (typeof window !== "undefined") {
      const stored = localStorage.getItem("dquiz_admin_users");
      if (stored) {
        setUsers(JSON.parse(stored));
      } else {
        setUsers(DEFAULT_USERS);
        localStorage.setItem("dquiz_admin_users", JSON.stringify(DEFAULT_USERS));
      }
    }
    setIsLoading(false);
  };

  useEffect(() => {
    loadUsers();
  }, []);

  const saveUsers = (newUsers: UserItem[]) => {
    setUsers(newUsers);
    if (typeof window !== "undefined") {
      localStorage.setItem("dquiz_admin_users", JSON.stringify(newUsers));
    }
  };

  const toggleStatus = async (user: UserItem) => {
    const nextStatus = user.status === "active" ? "suspended" : "active";
    const updated = users.map((u) =>
      u.id === user.id ? { ...u, status: nextStatus } : u
    );
    saveUsers(updated);

    try {
      await updateDoc(doc(db, "users", user.id), {
        disabled: nextStatus === "suspended",
      });
    } catch (e) {
      console.warn(e);
    }

    showToast({
      type: nextStatus === "suspended" ? "warning" : "success",
      title: nextStatus === "suspended" ? "Account Suspended" : "Account Activated",
      message: `${user.name} is now ${nextStatus}.`,
    });
  };

  const confirmDelete = async () => {
    if (!userToDelete) return;

    if (userToDelete.email === "danielabishek60@gmail.com") {
      showToast({
        type: "error",
        title: "Action Forbidden",
        message: "The primary Super Admin account cannot be deleted.",
      });
      setUserToDelete(null);
      return;
    }

    setIsDeleting(true);

    try {
      try {
        await deleteDoc(doc(db, "users", userToDelete.id));
      } catch (e) {
        console.warn(e);
      }

      const updated = users.filter((u) => u.id !== userToDelete.id);
      saveUsers(updated);

      showToast({
        type: "success",
        title: "User Deleted",
        message: `Account for ${userToDelete.name} (${userToDelete.email}) was permanently removed.`,
      });
    } catch (err: any) {
      showToast({
        type: "error",
        title: "Failed to delete user",
        message: err.message,
      });
    } finally {
      setIsDeleting(false);
      setUserToDelete(null);
    }
  };

  const filtered = users.filter(
    (u) =>
      u.name.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase()) ||
      u.role.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="pb-6 border-b border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Badge variant="primary" size="sm" className="bg-purple-950/60 border-purple-800 text-purple-300">
              SUPER ADMIN PRIVILEGE
            </Badge>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight font-display">
            User Management & Deletion
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Permanently delete host accounts, suspend access, and oversee permissions.
          </p>
        </div>
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
              {filtered.map((u) => {
                const isPrimaryAdmin = u.email === "danielabishek60@gmail.com";

                return (
                  <tr key={u.id} className="hover:bg-slate-800/40">
                    <td className="py-4 px-6 font-bold text-white flex items-center gap-2.5">
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold ${
                        isPrimaryAdmin ? "bg-purple-600/30 text-purple-300 border border-purple-500/40" : "bg-slate-800 text-brand-300"
                      }`}>
                        {u.name.charAt(0)}
                      </div>
                      <div className="flex flex-col">
                        <span>{u.name}</span>
                        {isPrimaryAdmin && (
                          <span className="text-[10px] text-purple-400 font-bold">PRIMARY SUPERADMIN</span>
                        )}
                      </div>
                    </td>
                    <td className="py-4 px-6 text-slate-400 font-mono text-xs">{u.email}</td>
                    <td className="py-4 px-6">
                      <Badge variant={u.role === "admin" ? "primary" : "secondary"} size="sm" className={u.role === "admin" ? "bg-purple-950/60 border-purple-800 text-purple-300" : ""}>
                        {u.role.toUpperCase()}
                      </Badge>
                    </td>
                    <td className="py-4 px-6">
                      <Badge variant={u.status === "active" ? "success" : "danger"} size="sm">
                        {u.status}
                      </Badge>
                    </td>
                    <td className="py-4 px-6 text-xs text-slate-400 font-mono">{u.joined}</td>
                    <td className="py-4 px-6 text-right">
                      {!isPrimaryAdmin && (
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => toggleStatus(u)}
                            className={`text-xs ${
                              u.status === "active"
                                ? "text-amber-400 hover:bg-amber-950/30"
                                : "text-emerald-400 hover:bg-emerald-950/30"
                            }`}
                          >
                            {u.status === "active" ? "Suspend" : "Activate"}
                          </Button>

                          <Button
                            variant="danger"
                            size="sm"
                            onClick={() => setUserToDelete(u)}
                            className="gap-1 text-xs px-2.5 py-1"
                            title="Delete User Permanently"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            <span>Delete</span>
                          </Button>
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Delete User Confirmation Modal */}
      <Modal
        isOpen={Boolean(userToDelete)}
        onClose={() => setUserToDelete(null)}
        title="Permanently Delete User Account"
        description="This action will remove the user and revoke all access immediately."
        maxWidth="md"
      >
        {userToDelete && (
          <div className="space-y-4">
            <div className="p-4 bg-rose-950/30 border border-rose-500/30 rounded-xl flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
              <div className="space-y-1 text-xs">
                <p className="font-bold text-white">
                  Are you sure you want to delete {userToDelete.name}?
                </p>
                <p className="text-rose-200">
                  Account <span className="font-mono text-white font-semibold">({userToDelete.email})</span> will be permanently deleted from the database.
                </p>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setUserToDelete(null)}
                disabled={isDeleting}
              >
                Cancel
              </Button>
              <Button
                variant="danger"
                size="sm"
                isLoading={isDeleting}
                onClick={confirmDelete}
                className="gap-1.5"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Confirm & Delete User</span>
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
