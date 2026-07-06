import { create } from "zustand";

function todayISO(): string {
  return new Date().toISOString().split("T")[0];
}

interface DateState {
  selectedDate: string;
  setSelectedDate: (date: string) => void;
}

export const useDateStore = create<DateState>((set) => ({
  selectedDate: todayISO(),
  setSelectedDate: (date) => set({ selectedDate: date }),
}));
