"use client";

import ShapePreview from "@/components/annotate/ShapePreview";
import type { Shape } from "@/lib/types";

interface ShapeListProps {
  shapes: Shape[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  onDelete: (id: string) => void;
}

export default function ShapeList({ shapes, selectedId, onSelect, onDelete }: ShapeListProps) {
  if (shapes.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-slate-200 p-4">
        <h3 className="text-sm font-semibold text-slate-800 mb-2">Saved regions</h3>
        <p className="text-xs text-slate-400">No annotations yet. Draw on the canvas with your mouse or finger.</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-4">
      <h3 className="text-sm font-semibold text-slate-800 mb-3">
        Saved regions <span className="text-slate-400 font-normal">({shapes.length})</span>
      </h3>
      <ul className="space-y-2 max-h-[400px] overflow-y-auto">
        {shapes.map((shape, i) => (
          <li
            key={shape.id}
            onClick={() => onSelect(shape.id)}
            className={`flex items-center justify-between p-2 rounded-lg cursor-pointer transition-colors ${
              selectedId === shape.id
                ? "bg-indigo-50 border border-indigo-200"
                : "hover:bg-slate-50 border border-transparent"
            }`}
          >
            <div className="flex items-center gap-2 min-w-0">
              <ShapePreview shape={shape} selected={selectedId === shape.id} />
              <div className="min-w-0">
                <span className="text-sm text-slate-700 truncate block">
                  {shape.label || `Region ${i + 1}`}
                </span>
                <span className="text-xs text-slate-400">{shape.points.length} pts</span>
              </div>
            </div>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onDelete(shape.id);
              }}
              className="text-xs text-rose-500 hover:text-rose-600 shrink-0 ml-2"
            >
              Delete
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
