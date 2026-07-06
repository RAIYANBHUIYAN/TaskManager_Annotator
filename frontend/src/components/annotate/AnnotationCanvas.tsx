"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Stage, Layer, Line, Circle, Image as KonvaImage } from "react-konva";
import type Konva from "konva";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { createShape, deleteShape, fetchShapes } from "@/lib/api";
import { getMediaUrl } from "@/lib/auth";
import type { Point, Shape } from "@/lib/types";
import { DEFAULT_SHAPE_COLOR } from "@/lib/types";

interface AnnotationCanvasProps {
  imageId: string;
  imageUrl: string;
  selectedShapeId: string | null;
  onSelectShape: (id: string | null) => void;
}

const CANVAS_SIZE = 640;
const CLOSE_THRESHOLD = 12;

function useImage(src: string): [HTMLImageElement | null, number, number, boolean, boolean] {
  const [image, setImage] = useState<HTMLImageElement | null>(null);
  const [dims, setDims] = useState({ w: 0, h: 0 });
  const [loadedSrc, setLoadedSrc] = useState<string | null>(null);
  const [errorSrc, setErrorSrc] = useState<string | null>(null);

  useEffect(() => {
    if (!src) return;

    let cancelled = false;
    const img = new window.Image();
    img.onload = () => {
      if (cancelled) return;
      setImage(img);
      setDims({ w: img.naturalWidth, h: img.naturalHeight });
      setLoadedSrc(src);
    };
    img.onerror = () => {
      if (cancelled) return;
      setImage(null);
      setErrorSrc(src);
    };
    img.src = src;

    return () => {
      cancelled = true;
      img.onload = null;
      img.onerror = null;
    };
  }, [src]);

  if (!src) {
    return [null, 0, 0, false, true];
  }

  const loading = loadedSrc !== src && errorSrc !== src;
  const error = errorSrc === src;

  return [
    loadedSrc === src ? image : null,
    loadedSrc === src ? dims.w : 0,
    loadedSrc === src ? dims.h : 0,
    loading,
    error,
  ];
}

function getScale(naturalW: number, naturalH: number) {
  if (!naturalW || !naturalH) return { scale: 1, offsetX: 0, offsetY: 0, displayW: CANVAS_SIZE, displayH: CANVAS_SIZE };
  const scale = Math.min(CANVAS_SIZE / naturalW, CANVAS_SIZE / naturalH);
  const displayW = naturalW * scale;
  const displayH = naturalH * scale;
  const offsetX = (CANVAS_SIZE - displayW) / 2;
  const offsetY = (CANVAS_SIZE - displayH) / 2;
  return { scale, offsetX, offsetY, displayW, displayH };
}

function toImageCoords(
  stageX: number,
  stageY: number,
  scale: number,
  offsetX: number,
  offsetY: number,
): Point {
  return {
    x: (stageX - offsetX) / scale,
    y: (stageY - offsetY) / scale,
  };
}

function toStageCoords(
  point: Point,
  scale: number,
  offsetX: number,
  offsetY: number,
): Point {
  return {
    x: point.x * scale + offsetX,
    y: point.y * scale + offsetY,
  };
}

export default function AnnotationCanvas({
  imageId,
  imageUrl,
  selectedShapeId,
  onSelectShape,
}: AnnotationCanvasProps) {
  const queryClient = useQueryClient();
  const stageRef = useRef<Konva.Stage>(null);
  const skipNextClickRef = useRef(false);
  const [image, naturalW, naturalH, imageLoading, imageError] = useImage(
    getMediaUrl(imageUrl, { maxWidth: 1280 }),
  );
  const { scale, offsetX, offsetY, displayW, displayH } = getScale(naturalW, naturalH);

  const [draftPoints, setDraftPoints] = useState<Point[]>([]);
  const [label, setLabel] = useState("Tumor");
  const [hideAnnotations, setHideAnnotations] = useState(false);

  const { data: shapes = [], isFetching: shapesFetching } = useQuery({
    queryKey: ["shapes", imageId],
    queryFn: () => fetchShapes(imageId),
    enabled: !!imageId,
  });

  const createMutation = useMutation({
    mutationFn: (points: Point[]) =>
      createShape(imageId, { points, label, color: DEFAULT_SHAPE_COLOR }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["shapes", imageId] });
      queryClient.invalidateQueries({ queryKey: ["annotation-images"] });
      setDraftPoints([]);
      toast.success("Shape saved");
    },
    onError: () => toast.error("Failed to save shape"),
  });

  const deleteMutation = useMutation({
    mutationFn: deleteShape,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["shapes", imageId] });
      queryClient.invalidateQueries({ queryKey: ["annotation-images"] });
      onSelectShape(null);
      toast.success("Shape deleted");
    },
    onError: () => toast.error("Failed to delete shape"),
  });

  const handleStageClick = (e: Konva.KonvaEventObject<MouseEvent>) => {
    if (skipNextClickRef.current) {
      skipNextClickRef.current = false;
      return;
    }
    if (!image) return;
    const stage = e.target.getStage();
    if (!stage) return;

    // Deselect if clicking empty area
    if (e.target === stage || e.target.getClassName() === "Image") {
      onSelectShape(null);
    }

    const pos = stage.getPointerPosition();
    if (!pos) return;

    // Check if within image bounds
    if (
      pos.x < offsetX ||
      pos.y < offsetY ||
      pos.x > offsetX + displayW ||
      pos.y > offsetY + displayH
    ) {
      return;
    }

    const imgPoint = toImageCoords(pos.x, pos.y, scale, offsetX, offsetY);

    // Close polygon if clicking near first point
    if (draftPoints.length >= 3) {
      const first = toStageCoords(draftPoints[0], scale, offsetX, offsetY);
      const dist = Math.hypot(pos.x - first.x, pos.y - first.y);
      if (dist < CLOSE_THRESHOLD) {
        createMutation.mutate(draftPoints);
        return;
      }
    }

    setDraftPoints((prev) => [...prev, imgPoint]);
  };

  const handleStageDblClick = () => {
    if (draftPoints.length >= 3) {
      skipNextClickRef.current = true;
      createMutation.mutate(draftPoints);
    }
  };

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === "Delete" || e.key === "Backspace") {
        if (selectedShapeId) {
          deleteMutation.mutate(selectedShapeId);
        }
      }
      if (e.key === "Escape") {
        setDraftPoints([]);
        onSelectShape(null);
      }
    },
    [selectedShapeId, deleteMutation, onSelectShape],
  );

  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);

  const renderShape = (shape: Shape, isSelected: boolean) => {
    const flatPoints = shape.points.flatMap((p) => {
      const s = toStageCoords(p, scale, offsetX, offsetY);
      return [s.x, s.y];
    });

    return (
      <Line
        key={shape.id}
        points={flatPoints}
        closed
        fill={isSelected ? `${shape.color}66` : `${shape.color}44`}
        stroke={isSelected ? "#fff" : shape.color}
        strokeWidth={isSelected ? 2.5 : 2}
        onClick={() => onSelectShape(shape.id)}
        onTap={() => onSelectShape(shape.id)}
      />
    );
  };

  const draftStagePoints = draftPoints.flatMap((p) => {
    const s = toStageCoords(p, scale, offsetX, offsetY);
    return [s.x, s.y];
  });

  if (imageLoading) {
    return (
      <div className="w-full max-w-[640px] aspect-square bg-slate-900 rounded-xl animate-pulse flex items-center justify-center text-slate-500">
        Loading image…
      </div>
    );
  }

  if (imageError) {
    return (
      <div className="w-full max-w-[640px] aspect-square bg-slate-900 rounded-xl flex items-center justify-center text-slate-400 text-sm p-6 text-center">
        Failed to load image. It may have been deleted or is unreachable.
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-4 text-sm">
        {shapesFetching && (
          <span className="text-xs text-slate-400">Loading annotations…</span>
        )}
        <div className="flex items-center gap-2">
          <label className="text-slate-600">Class:</label>
          <select
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            className="px-2 py-1 rounded border border-slate-200 text-sm"
          >
            <option value="Tumor">Tumor</option>
            <option value="Lesion">Lesion</option>
            <option value="Region">Region</option>
          </select>
        </div>
        <label className="flex items-center gap-2 text-slate-600 cursor-pointer">
          <input
            type="checkbox"
            checked={hideAnnotations}
            onChange={(e) => setHideAnnotations(e.target.checked)}
          />
          Hide Annotations
        </label>
        {draftPoints.length > 0 && (
          <button
            onClick={() => setDraftPoints([])}
            className="text-xs text-rose-600 hover:text-rose-700"
          >
            Cancel drawing
          </button>
        )}
        {selectedShapeId && (
          <button
            onClick={() => deleteMutation.mutate(selectedShapeId)}
            className="text-xs px-3 py-1 bg-rose-600 text-white rounded-lg hover:bg-rose-700"
          >
            Delete selected
          </button>
        )}
      </div>

      <div className="inline-block rounded-xl overflow-hidden border border-slate-700 shadow-xl">
        <Stage
          ref={stageRef}
          width={CANVAS_SIZE}
          height={CANVAS_SIZE}
          pixelRatio={1}
          onClick={handleStageClick}
          onDblClick={handleStageDblClick}
          className="bg-black cursor-crosshair"
        >
          <Layer>
            {image && (
              <KonvaImage
                image={image}
                x={offsetX}
                y={offsetY}
                width={displayW}
                height={displayH}
              />
            )}
            {!hideAnnotations &&
              shapes.map((shape) =>
                renderShape(shape, shape.id === selectedShapeId),
              )}
            {draftPoints.length > 0 && (
              <>
                <Line
                  points={draftStagePoints}
                  stroke="#3b82f6"
                  strokeWidth={2}
                  dash={[6, 4]}
                />
                {draftPoints.map((p, i) => {
                  const s = toStageCoords(p, scale, offsetX, offsetY);
                  return (
                    <Circle
                      key={i}
                      x={s.x}
                      y={s.y}
                      radius={5}
                      fill="#3b82f6"
                      stroke="#fff"
                      strokeWidth={1}
                    />
                  );
                })}
              </>
            )}
          </Layer>
        </Stage>
      </div>

      <p className="text-xs text-slate-500">
        Click to add vertices · Double-click or click first point to close &amp; save ·
        Select a shape and press Delete to remove
      </p>
    </div>
  );
}
