"use client";

import { bboxPreviewPoints, colorWithAlpha } from "@/lib/annotationUtils";
import type { Shape } from "@/lib/types";

interface ShapePreviewProps {
  shape: Shape;
  size?: number;
  selected?: boolean;
}

export default function ShapePreview({ shape, size = 44, selected }: ShapePreviewProps) {
  const points = bboxPreviewPoints(shape.points, size);

  if (!points) {
    return <div className="shrink-0 rounded-md bg-slate-100" style={{ width: size, height: size }} />;
  }

  return (
    <svg
      width={size}
      height={size}
      className={`shrink-0 rounded-md bg-slate-900/90 ${selected ? "ring-2 ring-indigo-400" : ""}`}
      aria-hidden
    >
      <polygon
        points={points}
        fill={colorWithAlpha(shape.color, selected ? 0.65 : 0.5)}
        stroke={selected ? "#fff" : shape.color}
        strokeWidth={1.5}
      />
    </svg>
  );
}
