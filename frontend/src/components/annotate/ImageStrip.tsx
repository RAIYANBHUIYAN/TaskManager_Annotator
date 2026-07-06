"use client";

import { useCallback, useRef, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { deleteImage, uploadImage } from "@/lib/api";
import { getMediaUrl } from "@/lib/auth";
import type { AnnotationImage } from "@/lib/types";

interface ImageStripProps {
  images: AnnotationImage[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  isLoading?: boolean;
}

export default function ImageStrip({
  images,
  selectedId,
  onSelect,
  isLoading,
}: ImageStripProps) {
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  const uploadMutation = useMutation({
    mutationFn: uploadImage,
    onSuccess: (img) => {
      queryClient.invalidateQueries({ queryKey: ["annotation-images"] });
      onSelect(img.id);
      toast.success("Image uploaded");
    },
    onError: (error: unknown) => {
      const detail =
        error &&
        typeof error === "object" &&
        "response" in error &&
        error.response &&
        typeof error.response === "object" &&
        "data" in error.response
          ? JSON.stringify(error.response.data)
          : "Upload failed";
      toast.error(detail.includes("Cloudinary") ? "Image storage misconfigured on server" : "Upload failed");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: deleteImage,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["annotation-images"] });
      toast.success("Image deleted");
    },
    onError: () => toast.error("Delete failed"),
  });

  const handleFiles = useCallback(
    (files: FileList | null) => {
      if (!files?.length) return;
      const file = files[0];
      if (!file.type.startsWith("image/")) {
        toast.error("Please select an image file");
        return;
      }
      uploadMutation.mutate(file);
    },
    [uploadMutation],
  );

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    handleFiles(e.dataTransfer.files);
  };

  if (isLoading) {
    return (
      <div className="flex gap-3 overflow-x-auto pb-2 animate-pulse">
        {[1, 2, 3].map((i) => (
          <div key={i} className="w-24 h-24 shrink-0 bg-slate-200 rounded-xl" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-3">
        <button
          onClick={() => fileInputRef.current?.click()}
          disabled={uploadMutation.isPending}
          className="shrink-0 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 text-white text-sm font-medium rounded-lg transition-colors"
        >
          {uploadMutation.isPending ? "Uploading…" : "+ Upload"}
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => handleFiles(e.target.files)}
        />
        <p className="text-xs text-slate-500">or drag & drop an image below</p>
      </div>

      <div
        onDragOver={(e) => {
          e.preventDefault();
          setIsDragging(true);
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={onDrop}
        className={`flex gap-3 overflow-x-auto pb-2 min-h-[100px] rounded-xl border-2 border-dashed p-2 transition-colors ${
          isDragging ? "border-indigo-400 bg-indigo-50/50" : "border-slate-200"
        }`}
      >
        {images.length === 0 ? (
          <p className="text-sm text-slate-400 self-center px-4">
            No images yet — upload one to start annotating
          </p>
        ) : (
          images.map((img) => (
            <div key={img.id} className="relative shrink-0 group">
              <button
                onClick={() => onSelect(img.id)}
                className={`block w-24 h-24 rounded-xl overflow-hidden border-2 transition-all ${
                  selectedId === img.id
                    ? "border-indigo-500 ring-2 ring-indigo-200"
                    : "border-slate-200 hover:border-slate-300"
                }`}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={getMediaUrl(img.image)}
                  alt="Annotation thumbnail"
                  className="w-full h-full object-cover"
                />
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  if (confirm("Delete this image and all its annotations?")) {
                    deleteMutation.mutate(img.id);
                  }
                }}
                className="absolute -top-1 -right-1 w-5 h-5 bg-rose-500 text-white text-xs rounded-full opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
                title="Delete image"
              >
                ×
              </button>
              {img.shape_count > 0 && (
                <span className="absolute bottom-1 right-1 text-[10px] bg-black/60 text-white px-1.5 py-0.5 rounded">
                  {img.shape_count}
                </span>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
