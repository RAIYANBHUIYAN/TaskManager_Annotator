"use client";

import { useDraggable } from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";

import type { Task, TaskPriority } from "@/lib/types";
import { TASK_PRIORITIES } from "@/lib/types";

interface TaskCardProps {
  task: Task;
  onEdit: (task: Task) => void;
}

function priorityStyle(priority: TaskPriority): string {
  return TASK_PRIORITIES.find((p) => p.value === priority)?.color ?? "bg-slate-100 text-slate-700";
}

export default function TaskCard({ task, onEdit }: TaskCardProps) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: task.id,
    data: { task },
  });

  const style = {
    transform: CSS.Translate.toString(transform),
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="bg-white rounded-xl border border-slate-200 p-3 shadow-sm hover:shadow-md transition-shadow cursor-grab active:cursor-grabbing"
      {...listeners}
      {...attributes}
    >
      <div className="flex items-start justify-between gap-2 mb-2">
        <h3 className="text-sm font-medium text-slate-900 leading-snug">{task.title}</h3>
        <span className={`shrink-0 text-xs px-2 py-0.5 rounded-full font-medium ${priorityStyle(task.priority)}`}>
          {task.priority}
        </span>
      </div>

      {task.description && (
        <p className="text-xs text-slate-500 line-clamp-2 mb-2">{task.description}</p>
      )}

      {task.tags.length > 0 && (
        <div className="flex flex-wrap gap-1 mb-2">
          {task.tags.map((tag) => (
            <span
              key={tag.id}
              className="text-xs px-2 py-0.5 rounded-md bg-slate-100 text-slate-600"
            >
              {tag.name}
            </span>
          ))}
        </div>
      )}

      <p className="text-xs text-slate-400 mb-2">
        Due{" "}
        {new Date(task.due_date + "T12:00:00").toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
          year: "numeric",
        })}
      </p>

      <button
        onClick={(e) => {
          e.stopPropagation();
          onEdit(task);
        }}
        onPointerDown={(e) => e.stopPropagation()}
        className="text-xs text-indigo-600 hover:text-indigo-700 font-medium"
      >
        Edit
      </button>
    </div>
  );
}
