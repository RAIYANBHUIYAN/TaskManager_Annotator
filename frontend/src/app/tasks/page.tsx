"use client";

import { useEffect } from "react";

import AppNav from "@/components/shared/AppNav";
import DateSelector from "@/components/shared/DateSelector";
import Board from "@/components/tasks/Board";
import { useAuthStore } from "@/store/authStore";

export default function TasksPage() {
  const loadUser = useAuthStore((s) => s.loadUser);

  useEffect(() => {
    loadUser();
  }, [loadUser]);

  return (
    <div className="min-h-screen flex flex-col">
      <AppNav />
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Task Board</h1>
            <p className="text-sm text-slate-500 mt-0.5">Drag tasks between columns to update status</p>
          </div>
          <DateSelector />
        </div>
        <Board />
      </main>
    </div>
  );
}
