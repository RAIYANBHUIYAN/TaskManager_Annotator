"use client";

import { useDateStore } from "@/store/dateStore";

export default function DateSelector() {
  const selectedDate = useDateStore((s) => s.selectedDate);
  const setSelectedDate = useDateStore((s) => s.setSelectedDate);

  const shiftDate = (days: number) => {
    const d = new Date(selectedDate + "T12:00:00");
    d.setDate(d.getDate() + days);
    setSelectedDate(d.toISOString().split("T")[0]);
  };

  const formatted = new Date(selectedDate + "T12:00:00").toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });

  return (
    <div className="flex items-center gap-3">
      <button
        onClick={() => shiftDate(-1)}
        className="w-9 h-9 flex items-center justify-center rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-600 transition-colors"
        aria-label="Previous day"
      >
        ←
      </button>

      <div className="flex flex-col items-center min-w-[200px]">
        <input
          type="date"
          value={selectedDate}
          onChange={(e) => setSelectedDate(e.target.value)}
          className="sr-only"
          id="date-picker"
        />
        <label
          htmlFor="date-picker"
          className="text-sm font-semibold text-slate-900 cursor-pointer hover:text-indigo-600 transition-colors"
        >
          {formatted}
        </label>
        <button
          onClick={() => setSelectedDate(new Date().toISOString().split("T")[0])}
          className="text-xs text-indigo-600 hover:text-indigo-700 mt-0.5"
        >
          Today
        </button>
      </div>

      <button
        onClick={() => shiftDate(1)}
        className="w-9 h-9 flex items-center justify-center rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-600 transition-colors"
        aria-label="Next day"
      >
        →
      </button>
    </div>
  );
}
