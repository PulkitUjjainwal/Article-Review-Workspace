"use client";

import { useEffect } from "react";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log the error to an error reporting service
    console.error("Application error:", error);
  }, [error]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-md rounded-lg bg-white p-8 shadow-lg">
        <div className="mb-4 flex items-center justify-center">
          <div className="rounded-full bg-red-100 p-3">
            <svg
              className="h-8 w-8 text-red-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
          </div>
        </div>
        <h2 className="mb-2 text-center text-2xl font-bold text-gray-900">
          Oops! Something went wrong
        </h2>
        <p className="mb-6 text-center text-gray-600">
          We encountered an unexpected error. Don't worry, you can try again.
        </p>
        {process.env.NODE_ENV === "development" && (
          <div className="mb-6 rounded-lg bg-red-50 p-4">
            <p className="mb-2 text-sm font-semibold text-red-800">
              Error Details (Development Only):
            </p>
            <p className="text-xs text-red-700">{error.message}</p>
            {error.digest && (
              <p className="mt-1 text-xs text-red-600">Digest: {error.digest}</p>
            )}
          </div>
        )}
        <div className="flex gap-3">
          <button
            onClick={() => reset()}
            className="flex-1 rounded-lg bg-blue-600 px-4 py-3 font-semibold text-white transition hover:bg-blue-700"
          >
            Try Again
          </button>
          <button
            onClick={() => (window.location.href = "/")}
            className="flex-1 rounded-lg border-2 border-gray-300 px-4 py-3 font-semibold text-gray-700 transition hover:bg-gray-50"
          >
            Go Home
          </button>
        </div>
      </div>
    </div>
  );
}
