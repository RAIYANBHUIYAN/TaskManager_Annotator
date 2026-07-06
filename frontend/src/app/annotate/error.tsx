"use client";

export default function AnnotateError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4">
      <div className="max-w-md text-center">
        <h2 className="text-xl font-semibold text-slate-900 mb-2">Annotate page failed to load</h2>
        <p className="text-sm text-slate-600 mb-6">
          This can happen when the drawing tools fail to initialize. Refresh and try again.
        </p>
        <button
          type="button"
          onClick={reset}
          className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-lg"
        >
          Reload page
        </button>
      </div>
    </div>
  );
}
