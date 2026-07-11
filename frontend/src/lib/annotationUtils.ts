import type { Point } from "./types";

export function letterboxTransform(naturalW: number, naturalH: number, boxSize: number) {
  const scale = Math.min(boxSize / naturalW, boxSize / naturalH);
  const displayW = naturalW * scale;
  const displayH = naturalH * scale;
  const offsetX = (boxSize - displayW) / 2;
  const offsetY = (boxSize - displayH) / 2;
  return { scale, offsetX, offsetY, displayW, displayH };
}

export function imagePointsToBox(
  points: Point[],
  naturalW: number,
  naturalH: number,
  boxSize: number,
): string {
  const { scale, offsetX, offsetY } = letterboxTransform(naturalW, naturalH, boxSize);
  return points.map((p) => `${p.x * scale + offsetX},${p.y * scale + offsetY}`).join(" ");
}

export function colorWithAlpha(hex: string, alpha: number): string {
  const normalized = hex.replace("#", "");
  if (normalized.length !== 6) {
    return `rgba(239, 68, 68, ${alpha})`;
  }
  const r = parseInt(normalized.slice(0, 2), 16);
  const g = parseInt(normalized.slice(2, 4), 16);
  const b = parseInt(normalized.slice(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

export function bboxPreviewPoints(points: Point[], size: number, padding = 4): string {
  if (points.length === 0) return "";

  const xs = points.map((p) => p.x);
  const ys = points.map((p) => p.y);
  const minX = Math.min(...xs);
  const maxX = Math.max(...xs);
  const minY = Math.min(...ys);
  const maxY = Math.max(...ys);
  const width = maxX - minX || 1;
  const height = maxY - minY || 1;
  const scale = (size - padding * 2) / Math.max(width, height);

  return points
    .map((p) => {
      const x = padding + (p.x - minX) * scale;
      const y = padding + (p.y - minY) * scale;
      return `${x},${y}`;
    })
    .join(" ");
}
