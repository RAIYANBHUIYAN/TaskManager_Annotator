"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";

import { fetchShapes } from "@/lib/api";
import { colorWithAlpha, imagePointsToBox } from "@/lib/annotationUtils";
import { getMediaUrl } from "@/lib/auth";
import type { AnnotationImage } from "@/lib/types";

const THUMB_SIZE = 96;

interface AnnotatedThumbnailProps {
  image: AnnotationImage;
}

export default function AnnotatedThumbnail({ image }: AnnotatedThumbnailProps) {
  const [naturalSize, setNaturalSize] = useState<{ w: number; h: number } | null>(null);

  const { data: shapes = [] } = useQuery({
    queryKey: ["shapes", image.id],
    queryFn: () => fetchShapes(image.id),
    enabled: image.shape_count > 0,
    staleTime: 30_000,
  });

  return (
    <div className="relative w-full h-full">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={getMediaUrl(image.image, { maxWidth: 256 })}
        alt="Annotation thumbnail"
        className="w-full h-full object-cover"
        onLoad={(e) => {
          setNaturalSize({
            w: e.currentTarget.naturalWidth,
            h: e.currentTarget.naturalHeight,
          });
        }}
      />
      {naturalSize && shapes.length > 0 && (
        <svg
          className="absolute inset-0 w-full h-full pointer-events-none"
          viewBox={`0 0 ${THUMB_SIZE} ${THUMB_SIZE}`}
          preserveAspectRatio="xMidYMid slice"
        >
          {shapes.map((shape) => (
            <polygon
              key={shape.id}
              points={imagePointsToBox(
                shape.points,
                naturalSize.w,
                naturalSize.h,
                THUMB_SIZE,
              )}
              fill={colorWithAlpha(shape.color, 0.45)}
              stroke={shape.color}
              strokeWidth={1.5}
            />
          ))}
        </svg>
      )}
    </div>
  );
}
