import { create } from "zustand";

interface TaskUIState {
  isModalOpen: boolean;
  setModalOpen: (open: boolean) => void;
}

/** UI-only task state; task data lives in React Query cache. */
export const useTaskStore = create<TaskUIState>((set) => ({
  isModalOpen: false,
  setModalOpen: (open) => set({ isModalOpen: open }),
}));
