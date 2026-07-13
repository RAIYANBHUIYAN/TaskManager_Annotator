"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";

import {
  deleteAdminUser,
  fetchAdminUsers,
  fetchMe,
  logout,
} from "@/lib/api";
import type { User } from "@/lib/types";

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export default function AdminDashboardPage() {
  const router = useRouter();
  const [users, setUsers] = useState<User[]>([]);
  const [totalUsers, setTotalUsers] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const loadUsers = useCallback(async () => {
    try {
      const me = await fetchMe();
      if (!me.is_staff) {
        router.replace("/admin/login");
        return;
      }
      const data = await fetchAdminUsers();
      setUsers(data.users);
      setTotalUsers(data.total_users);
    } catch {
      router.replace("/admin/login");
    } finally {
      setIsLoading(false);
    }
  }, [router]);

  useEffect(() => {
    loadUsers();
  }, [loadUsers]);

  const handleDelete = async (user: User) => {
    const label = user.email;
    if (!window.confirm(`Delete user ${label}? This removes all their tasks and annotations.`)) {
      return;
    }

    setDeletingId(user.id);
    try {
      await deleteAdminUser(user.id);
      toast.success(`Deleted ${label}`);
      await loadUsers();
    } catch {
      toast.error("Could not delete user");
    } finally {
      setDeletingId(null);
    }
  };

  const handleLogout = () => {
    logout();
    router.push("/admin/login");
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-100 flex items-center justify-center text-slate-600">
        Loading admin panel…
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-100">
      <header className="bg-slate-900 text-white border-b border-slate-800">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="w-8 h-8 rounded-lg bg-indigo-600 text-sm font-bold flex items-center justify-center">
              AD
            </span>
            <span className="font-semibold">TaskFlow Admin</span>
          </div>
          <button
            onClick={handleLogout}
            className="text-sm text-slate-300 hover:text-white px-3 py-1.5 rounded-lg hover:bg-slate-800"
          >
            Sign out
          </button>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-8 space-y-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">User management</h1>
          <p className="text-slate-600 mt-1">View and delete registered accounts</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
            <p className="text-sm font-medium text-slate-500">Total users</p>
            <p className="text-3xl font-bold text-slate-900 mt-2">{totalUsers}</p>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-200">
            <h2 className="font-semibold text-slate-900">All users</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 text-slate-600">
                <tr>
                  <th className="text-left px-6 py-3 font-medium">Email</th>
                  <th className="text-left px-6 py-3 font-medium">Name</th>
                  <th className="text-left px-6 py-3 font-medium">Joined</th>
                  <th className="text-left px-6 py-3 font-medium">Role</th>
                  <th className="text-right px-6 py-3 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {users.map((user) => (
                  <tr key={user.id} className="hover:bg-slate-50/80">
                    <td className="px-6 py-4 text-slate-900">{user.email}</td>
                    <td className="px-6 py-4 text-slate-600">
                      {[user.first_name, user.last_name].filter(Boolean).join(" ") || "—"}
                    </td>
                    <td className="px-6 py-4 text-slate-600">{formatDate(user.date_joined)}</td>
                    <td className="px-6 py-4">
                      {user.is_staff ? (
                        <span className="inline-flex px-2 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-700">
                          Admin
                        </span>
                      ) : (
                        <span className="inline-flex px-2 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-600">
                          User
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right">
                      {user.is_staff ? (
                        <span className="text-slate-400 text-xs">Protected</span>
                      ) : (
                        <button
                          onClick={() => handleDelete(user)}
                          disabled={deletingId === user.id}
                          className="text-rose-600 hover:text-rose-700 font-medium disabled:opacity-50"
                        >
                          {deletingId === user.id ? "Deleting…" : "Delete"}
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  );
}
