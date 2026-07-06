"use client";

import { useCallback, useMemo, useState } from "react";
import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import {
  createTask,
  deleteTask,
  fetchTasks,
  updateTask,
} from "@/lib/api";
import type { Task, TaskStatus } from "@/lib/types";
import { TASK_STATUSES } from "@/lib/types";
import { useDateStore } from "@/store/dateStore";
import Column from "./Column";
import TaskCard from "./TaskCard";
import TaskModal, { type TaskFormData } from "./TaskModal";

function BoardSkeleton() {
  return (
    <div className="flex gap-4 animate-pulse">
      {[1, 2, 3].map((i) => (
        <div key={i} className="flex-1 min-w-[280px] h-96 bg-slate-100 rounded-2xl" />
      ))}
    </div>
  );
}

export default function Board() {
  const selectedDate = useDateStore((s) => s.selectedDate);
  const queryClient = useQueryClient();

  const [modalMode, setModalMode] = useState<"create" | "edit">("create");
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [activeTask, setActiveTask] = useState<Task | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const { data: tasks = [], isLoading, isError } = useQuery({
    queryKey: ["tasks", selectedDate],
    queryFn: () => fetchTasks(selectedDate),
  });

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
  );

  const tasksByStatus = useMemo(() => {
    const grouped: Record<TaskStatus, Task[]> = {
      todo: [],
      in_progress: [],
      done: [],
    };
    tasks.forEach((task) => {
      grouped[task.status].push(task);
    });
    return grouped;
  }, [tasks]);

  const invalidateTasks = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ["tasks", selectedDate] });
  }, [queryClient, selectedDate]);

  const createMutation = useMutation({
    mutationFn: createTask,
    onSuccess: () => {
      invalidateTasks();
      setIsModalOpen(false);
      toast.success("Task created");
    },
    onError: () => toast.error("Failed to create task"),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<TaskFormData> }) =>
      updateTask(id, data),
    onSuccess: () => {
      invalidateTasks();
      setIsModalOpen(false);
      setEditingTask(null);
      toast.success("Task updated");
    },
    onError: () => toast.error("Failed to update task"),
  });

  const deleteMutation = useMutation({
    mutationFn: deleteTask,
    onSuccess: () => {
      invalidateTasks();
      setIsModalOpen(false);
      setEditingTask(null);
      setConfirmDelete(false);
      toast.success("Task deleted");
    },
    onError: () => toast.error("Failed to delete task"),
  });

  const statusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: TaskStatus }) =>
      updateTask(id, { status }),
    onMutate: async ({ id, status }) => {
      await queryClient.cancelQueries({ queryKey: ["tasks", selectedDate] });
      const previous = queryClient.getQueryData<Task[]>(["tasks", selectedDate]);
      queryClient.setQueryData<Task[]>(["tasks", selectedDate], (old = []) =>
        old.map((t) => (t.id === id ? { ...t, status } : t)),
      );
      return { previous };
    },
    onError: (_err, _vars, context) => {
      if (context?.previous) {
        queryClient.setQueryData(["tasks", selectedDate], context.previous);
      }
      toast.error("Failed to move task — reverted");
    },
    onSettled: invalidateTasks,
  });

  const handleDragStart = (event: DragStartEvent) => {
    const task = event.active.data.current?.task as Task | undefined;
    if (task) setActiveTask(task);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    setActiveTask(null);
    const { active, over } = event;
    if (!over) return;

    const task = active.data.current?.task as Task | undefined;
    const newStatus = over.id as TaskStatus;
    if (!task || task.status === newStatus) return;

    statusMutation.mutate({ id: task.id, status: newStatus });
  };

  const handleSubmit = async (data: TaskFormData) => {
    if (modalMode === "create") {
      await createMutation.mutateAsync(data);
    } else if (editingTask) {
      await updateMutation.mutateAsync({ id: editingTask.id, data });
    }
  };

  const handleDelete = async () => {
    if (!editingTask) return;
    if (!confirmDelete) {
      setConfirmDelete(true);
      return;
    }
    await deleteMutation.mutateAsync(editingTask.id);
  };

  if (isLoading) return <BoardSkeleton />;

  if (isError) {
    return (
      <div className="text-center py-16 text-rose-600">
        Failed to load tasks. Please try again.
      </div>
    );
  }

  const isEmpty = tasks.length === 0;

  return (
    <>
      <div className="flex justify-end mb-4">
        <button
          onClick={() => {
            setModalMode("create");
            setEditingTask(null);
            setConfirmDelete(false);
            setIsModalOpen(true);
          }}
          className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-lg transition-colors shadow-sm"
        >
          + New Task
        </button>
      </div>

      {isEmpty && (
        <div className="text-center py-8 mb-4">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-indigo-50 text-indigo-400 text-xl mb-3">
            📋
          </div>
          <h3 className="text-base font-semibold text-slate-800 mb-1">No tasks for this day</h3>
          <p className="text-slate-500 text-sm">Create a task or drag one here once added.</p>
        </div>
      )}

      <DndContext
        sensors={sensors}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <div className="flex gap-4 overflow-x-auto pb-4">
          {TASK_STATUSES.map((col) => (
            <Column
              key={col.value}
              status={col.value}
              label={col.label}
              tasks={tasksByStatus[col.value]}
              onEditTask={(task) => {
                setModalMode("edit");
                setEditingTask(task);
                setConfirmDelete(false);
                setIsModalOpen(true);
              }}
            />
          ))}
        </div>
        <DragOverlay>
          {activeTask ? (
            <div className="rotate-2 scale-105">
              <TaskCard task={activeTask} onEdit={() => {}} />
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>

      <TaskModal
        key={isModalOpen ? `${modalMode}-${editingTask?.id ?? "new"}` : "closed"}
        mode={modalMode}
        task={editingTask}
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingTask(null);
          setConfirmDelete(false);
        }}
        onSubmit={handleSubmit}
        onDelete={modalMode === "edit" ? handleDelete : undefined}
        isSubmitting={
          createMutation.isPending || updateMutation.isPending || deleteMutation.isPending
        }
      />

      {confirmDelete && (
        <p className="fixed bottom-4 left-1/2 -translate-x-1/2 text-sm text-rose-600 bg-rose-50 px-4 py-2 rounded-lg border border-rose-200 shadow-lg z-50">
          Click &quot;Delete task&quot; again to confirm
        </p>
      )}
    </>
  );
}
