"use client";

import { useDroppable } from "@dnd-kit/core";

import type { Task, TaskStatus } from "@/lib/types";
import TaskCard from "./TaskCard";

interface ColumnProps {
  status: TaskStatus;
  label: string;
  tasks: Task[];
  onEditTask: (task: Task) => void;
}

const COLUMN_COLORS: Record<TaskStatus, string> = {
  todo: "border-t-slate-400",
  in_progress: "border-t-amber-400",
  done: "border-t-emerald-400",
};

export default function Column({ status, label, tasks, onEditTask }: ColumnProps) {
  const { setNodeRef, isOver } = useDroppable({ id: status });

  return (
    <div
      ref={setNodeRef}
      className={`flex-1 min-w-[280px] bg-slate-50/80 rounded-2xl border border-slate-200 border-t-4 ${COLUMN_COLORS[status]} ${
        isOver ? "ring-2 ring-indigo-300 bg-indigo-50/30" : ""
      } transition-colors`}
    >
      <div className="p-4">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold text-slate-800">{label}</h2>
          <span className="text-xs font-medium text-slate-500 bg-white px-2 py-0.5 rounded-full border border-slate-200">
            {tasks.length}
          </span>
        </div>

        <div className="space-y-3 min-h-[120px]">
          {tasks.length === 0 ? (
            <p className="text-sm text-slate-400 text-center py-8">Drop tasks here</p>
          ) : (
            tasks.map((task) => (
              <TaskCard key={task.id} task={task} onEdit={onEditTask} />
            ))
          )}
        </div>
      </div>
    </div>
  );
}
