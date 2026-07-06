"use client";

import dynamic from "next/dynamic";
import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import AppNav from "@/components/shared/AppNav";
import ImageStrip from "@/components/annotate/ImageStrip";
import ShapeList from "@/components/annotate/ShapeList";
import { deleteShape, fetchImages, fetchShapes } from "@/lib/api";
import { useAuthStore } from "@/store/authStore";

const AnnotationCanvas = dynamic(
  () => import("@/components/annotate/AnnotationCanvas"),
  {
    ssr: false,
    loading: () => (
      <div className="w-full max-w-[640px] aspect-square bg-slate-900 rounded-xl animate-pulse" />
    ),
  },
);

export default function AnnotatePage() {
  const loadUser = useAuthStore((s) => s.loadUser);
  const queryClient = useQueryClient();
  const [selectedImageId, setSelectedImageId] = useState<string | null>(null);
  const [selectedShapeId, setSelectedShapeId] = useState<string | null>(null);

  const {
    data: images = [],
    isLoading,
    isFetching,
    isError: imagesError,
    refetch: refetchImages,
  } = useQuery({
    queryKey: ["annotation-images"],
    queryFn: fetchImages,
  });

  const activeImageId =
    isLoading || isFetching
      ? selectedImageId
      : images.length === 0
        ? null
        : selectedImageId && images.some((img) => img.id === selectedImageId)
          ? selectedImageId
          : (images[0]?.id ?? null);

  const selectedImage = images.find((img) => img.id === activeImageId) ?? null;

  const handleSelectImage = (id: string) => {
    setSelectedImageId(id);
    setSelectedShapeId(null);
  };

  const {
    data: shapes = [],
    isError: shapesError,
    refetch: refetchShapes,
  } = useQuery({
    queryKey: ["shapes", activeImageId],
    queryFn: () => fetchShapes(activeImageId!),
    enabled: !!activeImageId,
  });

  const deleteShapeMutation = useMutation({
    mutationFn: deleteShape,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["shapes", activeImageId] });
      queryClient.invalidateQueries({ queryKey: ["annotation-images"] });
      setSelectedShapeId(null);
      toast.success("Shape deleted");
    },
    onError: () => toast.error("Failed to delete shape"),
  });

  useEffect(() => {
    loadUser();
  }, [loadUser]);

  return (
    <div className="min-h-screen flex flex-col">
      <AppNav />
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-6">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-slate-900">Image Annotation</h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Upload images and draw polygon annotations
          </p>
        </div>

        {imagesError ? (
          <div className="text-center py-12 text-rose-600">
            <p className="mb-3">Failed to load images.</p>
            <button
              onClick={() => refetchImages()}
              className="text-sm px-4 py-2 bg-rose-50 hover:bg-rose-100 rounded-lg border border-rose-200"
            >
              Retry
            </button>
          </div>
        ) : (
          <>
            <div className="mb-6">
              <ImageStrip
                images={images}
                selectedId={activeImageId}
                onSelect={handleSelectImage}
                isLoading={isLoading}
              />
            </div>

            {selectedImage ? (
              <div className="grid grid-cols-1 lg:grid-cols-[1fr_280px] gap-6">
                <AnnotationCanvas
                  key={selectedImage.id}
                  imageId={selectedImage.id}
                  imageUrl={selectedImage.image}
                  selectedShapeId={selectedShapeId}
                  onSelectShape={setSelectedShapeId}
                />
                {shapesError ? (
                  <div className="bg-white rounded-xl border border-rose-200 p-4 text-rose-600 text-sm">
                    <p className="mb-2">Failed to load shapes.</p>
                    <button
                      onClick={() => refetchShapes()}
                      className="text-xs underline hover:no-underline"
                    >
                      Retry
                    </button>
                  </div>
                ) : (
                  <ShapeList
                    shapes={shapes}
                    selectedId={selectedShapeId}
                    onSelect={setSelectedShapeId}
                    onDelete={(id) => deleteShapeMutation.mutate(id)}
                  />
                )}
              </div>
            ) : (
              !isLoading && (
                <div className="text-center py-20">
                  <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-indigo-50 text-indigo-400 text-2xl mb-4">
                    🖼️
                  </div>
                  <h3 className="text-lg font-semibold text-slate-800 mb-1">No image selected</h3>
                  <p className="text-slate-500 text-sm">Upload an image to begin annotating</p>
                </div>
              )
            )}
          </>
        )}
      </main>
    </div>
  );
}
