"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Stage, Layer, Line, Image as KonvaImage } from "react-konva";
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
const MIN_IMAGE_POINT_DIST = 2;
const MIN_POINTS_TO_SAVE = 3;
const PEN_STROKE_WIDTH = 2.5;

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
  if (!naturalW || !naturalH) {
    return { scale: 1, offsetX: 0, offsetY: 0, displayW: CANVAS_SIZE, displayH: CANVAS_SIZE };
  }
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

function isInsideImage(
  pos: { x: number; y: number },
  offsetX: number,
  offsetY: number,
  displayW: number,
  displayH: number,
): boolean {
  return (
    pos.x >= offsetX &&
    pos.y >= offsetY &&
    pos.x <= offsetX + displayW &&
    pos.y <= offsetY + displayH
  );
}

function simplifyPoints(points: Point[], minDist: number): Point[] {
  if (points.length <= 2) return points;

  const simplified: Point[] = [points[0]];
  for (let i = 1; i < points.length; i += 1) {
    const prev = simplified[simplified.length - 1];
    const dist = Math.hypot(points[i].x - prev.x, points[i].y - prev.y);
    if (dist >= minDist) {
      simplified.push(points[i]);
    }
  }

  const last = points[points.length - 1];
  const tail = simplified[simplified.length - 1];
  if (tail.x !== last.x || tail.y !== last.y) {
    simplified.push(last);
  }

  return simplified;
}

function pointsToFlatStage(
  points: Point[],
  scale: number,
  offsetX: number,
  offsetY: number,
): number[] {
  return points.flatMap((p) => {
    const s = toStageCoords(p, scale, offsetX, offsetY);
    return [s.x, s.y];
  });
}

export default function AnnotationCanvas({
  imageId,
  imageUrl,
  selectedShapeId,
  onSelectShape,
}: AnnotationCanvasProps) {
  const queryClient = useQueryClient();
  const stageRef = useRef<Konva.Stage>(null);
  const draftLineRef = useRef<Konva.Line>(null);
  const isDrawingRef = useRef(false);
  const draftPointsRef = useRef<Point[]>([]);
  const transformRef = useRef({
    scale: 1,
    offsetX: 0,
    offsetY: 0,
    displayW: CANVAS_SIZE,
    displayH: CANVAS_SIZE,
  });

  const [image, naturalW, naturalH, imageLoading, imageError] = useImage(
    getMediaUrl(imageUrl, { maxWidth: 1280 }),
  );
  const { scale, offsetX, offsetY, displayW, displayH } = getScale(naturalW, naturalH);

  useEffect(() => {
    transformRef.current = { scale, offsetX, offsetY, displayW, displayH };
  }, [scale, offsetX, offsetY, displayW, displayH]);

  const [label, setLabel] = useState("Tumor");
  const [hideAnnotations, setHideAnnotations] = useState(false);
  const [isDrawing, setIsDrawing] = useState(false);

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
      toast.success("Annotation saved");
    },
    onError: () => toast.error("Failed to save annotation"),
  });

  const deleteMutation = useMutation({
    mutationFn: deleteShape,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["shapes", imageId] });
      queryClient.invalidateQueries({ queryKey: ["annotation-images"] });
      onSelectShape(null);
      toast.success("Annotation deleted");
    },
    onError: () => toast.error("Failed to delete annotation"),
  });

  const resetDraft = useCallback(() => {
    isDrawingRef.current = false;
    draftPointsRef.current = [];
    const line = draftLineRef.current;
    if (line) {
      line.points([]);
      line.visible(false);
      line.getLayer()?.batchDraw();
    }
    setIsDrawing(false);
  }, []);

  const updateDraftLine = useCallback(() => {
    const line = draftLineRef.current;
    if (!line) return;
    const { scale: s, offsetX: ox, offsetY: oy } = transformRef.current;
    line.points(pointsToFlatStage(draftPointsRef.current, s, ox, oy));
    line.visible(draftPointsRef.current.length > 0);
    line.getLayer()?.batchDraw();
  }, []);

  const finishDrawing = useCallback(() => {
    if (!isDrawingRef.current) return;

    const points = simplifyPoints(draftPointsRef.current, MIN_IMAGE_POINT_DIST);
    resetDraft();

    if (points.length < MIN_POINTS_TO_SAVE) {
      return;
    }

    createMutation.mutate(points);
  }, [createMutation, resetDraft]);

  const startDrawing = useCallback(
    (pos: { x: number; y: number }) => {
      const { scale: s, offsetX: ox, offsetY: oy, displayW: dw, displayH: dh } =
        transformRef.current;
      if (!isInsideImage(pos, ox, oy, dw, dh)) return;

      isDrawingRef.current = true;
      setIsDrawing(true);
      onSelectShape(null);
      draftPointsRef.current = [toImageCoords(pos.x, pos.y, s, ox, oy)];
      updateDraftLine();
    },
    [onSelectShape, updateDraftLine],
  );

  const extendDrawing = useCallback(
    (pos: { x: number; y: number }) => {
      if (!isDrawingRef.current) return;

      const { scale: s, offsetX: ox, offsetY: oy, displayW: dw, displayH: dh } =
        transformRef.current;
      if (!isInsideImage(pos, ox, oy, dw, dh)) {
        finishDrawing();
        return;
      }

      const imgPoint = toImageCoords(pos.x, pos.y, s, ox, oy);
      const last = draftPointsRef.current[draftPointsRef.current.length - 1];
      if (last) {
        const dist = Math.hypot(imgPoint.x - last.x, imgPoint.y - last.y);
        if (dist < MIN_IMAGE_POINT_DIST) return;
      }

      draftPointsRef.current.push(imgPoint);
      updateDraftLine();
    },
    [finishDrawing, updateDraftLine],
  );

  const handlePointerDown = (e: Konva.KonvaEventObject<MouseEvent | TouchEvent>) => {
    if (!image || createMutation.isPending) return;

    const stage = e.target.getStage();
    if (!stage) return;

    const targetClass = e.target.getClassName();
    if (targetClass === "Line" && e.target.id()) {
      onSelectShape(e.target.id());
      return;
    }

    if (targetClass !== "Stage" && targetClass !== "Image") {
      return;
    }

    const pos = stage.getPointerPosition();
    if (!pos) return;

    startDrawing(pos);
  };

  const handlePointerMove = () => {
    const stage = stageRef.current;
    if (!stage) return;
    const pos = stage.getPointerPosition();
    if (!pos) return;
    extendDrawing(pos);
  };

  const handlePointerUp = () => {
    finishDrawing();
  };

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === "Delete" || e.key === "Backspace") {
        if (selectedShapeId) {
          deleteMutation.mutate(selectedShapeId);
        }
      }
      if (e.key === "Escape") {
        resetDraft();
        onSelectShape(null);
      }
    },
    [selectedShapeId, deleteMutation, onSelectShape, resetDraft],
  );

  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);

  const renderShape = (shape: Shape, isSelected: boolean) => {
    const flatPoints = pointsToFlatStage(shape.points, scale, offsetX, offsetY);

    return (
      <Line
        key={shape.id}
        id={shape.id}
        points={flatPoints}
        closed
        tension={0.4}
        fill={isSelected ? `${shape.color}55` : `${shape.color}33`}
        stroke={isSelected ? "#fff" : shape.color}
        strokeWidth={isSelected ? 2.5 : 2}
        lineCap="round"
        lineJoin="round"
        perfectDrawEnabled={false}
        hitStrokeWidth={14}
      />
    );
  };

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
        {isDrawing && (
          <button
            type="button"
            onClick={resetDraft}
            className="text-xs text-rose-600 hover:text-rose-700"
          >
            Cancel stroke
          </button>
        )}
        {selectedShapeId && (
          <button
            type="button"
            onClick={() => deleteMutation.mutate(selectedShapeId)}
            className="text-xs px-3 py-1 bg-rose-600 text-white rounded-lg hover:bg-rose-700"
          >
            Delete selected
          </button>
        )}
      </div>

      <div className="inline-block rounded-xl overflow-hidden border border-slate-700 shadow-xl touch-none">
        <Stage
          ref={stageRef}
          width={CANVAS_SIZE}
          height={CANVAS_SIZE}
          pixelRatio={1}
          onMouseDown={handlePointerDown}
          onMousemove={handlePointerMove}
          onMouseup={handlePointerUp}
          onMouseleave={handlePointerUp}
          onTouchStart={handlePointerDown}
          onTouchMove={handlePointerMove}
          onTouchEnd={handlePointerUp}
          className={`bg-black ${isDrawing ? "cursor-crosshair" : "cursor-cell"}`}
        >
          <Layer listening={false}>
            {image && (
              <KonvaImage
                image={image}
                x={offsetX}
                y={offsetY}
                width={displayW}
                height={displayH}
              />
            )}
          </Layer>
          <Layer>
            {!hideAnnotations &&
              shapes.map((shape) => renderShape(shape, shape.id === selectedShapeId))}
          </Layer>
          <Layer listening={false}>
            <Line
              ref={draftLineRef}
              stroke="#3b82f6"
              strokeWidth={PEN_STROKE_WIDTH}
              lineCap="round"
              lineJoin="round"
              tension={0.5}
              closed={false}
              visible={false}
              perfectDrawEnabled={false}
            />
          </Layer>
        </Stage>
      </div>

      <p className="text-xs text-slate-500">
        Click and drag to draw · Release to save · Click a shape to select · Press Delete to
        remove · Esc to cancel
      </p>
    </div>
  );
}
