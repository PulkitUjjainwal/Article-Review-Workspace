"use client";

import { useState, useEffect, useRef } from "react";
import type { ReviewDecision } from "@prisma/client";
import { TextArea } from "~/components/ui/Input";

interface Article {
  id: string;
  pmid?: string | null;
  title: string;
  authors?: string | null;
  journal?: string | null;
  publicationYear?: string | null;
  doi?: string | null;
  citation?: string | null;
  reviewDecision: ReviewDecision;
  reviewNotes?: string | null;
}

interface ArticleDetailModalProps {
  article: Article;
  onClose: () => void;
  onUpdate: (decision: ReviewDecision, notes?: string) => void;
}

export function ArticleDetailModal({
  article,
  onClose,
  onUpdate,
}: ArticleDetailModalProps) {
  const [decision, setDecision] = useState<ReviewDecision>(
    article.reviewDecision
  );
  const [notes, setNotes] = useState(article.reviewNotes || "");
  const [saving, setSaving] = useState(false);
  const modalRef = useRef<HTMLDivElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);

  const handleSave = async () => {
    setSaving(true);
    await onUpdate(decision, notes);
    setSaving(false);
    onClose();
  };

  // Focus trap and escape key handler
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
      // Keyboard shortcuts for review decisions
      if (e.key === "i" && !e.target || !(e.target instanceof HTMLTextAreaElement)) {
        setDecision("INCLUDE");
      }
      if (e.key === "e" && !e.target || !(e.target instanceof HTMLTextAreaElement)) {
        setDecision("EXCLUDE");
      }
      if (e.key === "m" && !e.target || !(e.target instanceof HTMLTextAreaElement)) {
        setDecision("MAYBE");
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    closeButtonRef.current?.focus();

    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  // Click outside to close
  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50"
      onClick={handleBackdropClick}
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
    >
      <div
        ref={modalRef}
        className="max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-lg bg-white p-6 shadow-xl"
      >
        {/* Header */}
        <div className="mb-6 flex items-start justify-between">
          <h2 id="modal-title" className="text-2xl font-bold text-gray-900">
            Article Details
          </h2>
          <button
            ref={closeButtonRef}
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
            aria-label="Close modal"
          >
            <svg
              className="h-6 w-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        {/* Article Info */}
        <div className="mb-6 space-y-4">
          <div>
            <h3 className="mb-2 text-lg font-semibold text-gray-900">
              {article.title}
            </h3>
            {article.authors && (
              <p className="text-sm text-gray-600">{article.authors}</p>
            )}
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            {article.journal && (
              <div>
                <span className="text-sm font-medium text-gray-500">
                  Journal:
                </span>
                <p className="text-sm text-gray-900">{article.journal}</p>
              </div>
            )}
            {article.publicationYear && (
              <div>
                <span className="text-sm font-medium text-gray-500">Year:</span>
                <p className="text-sm text-gray-900">
                  {article.publicationYear}
                </p>
              </div>
            )}
            {article.pmid && (
              <div>
                <span className="text-sm font-medium text-gray-500">PMID:</span>
                <p className="text-sm text-gray-900">{article.pmid}</p>
              </div>
            )}
            {article.doi && (
              <div>
                <span className="text-sm font-medium text-gray-500">DOI:</span>
                <p className="text-sm text-gray-900">{article.doi}</p>
              </div>
            )}
          </div>

          {article.citation && (
            <div>
              <span className="text-sm font-medium text-gray-500">
                Citation:
              </span>
              <p className="text-sm text-gray-900">{article.citation}</p>
            </div>
          )}
        </div>

        {/* Review Section */}
        <div className="mb-6 space-y-4 border-t pt-6">
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700">
              Review Decision
            </label>
            <div className="flex gap-2">
              <button
                onClick={() => setDecision("INCLUDE")}
                className={`flex-1 rounded-lg px-4 py-3 font-semibold transition ${
                  decision === "INCLUDE"
                    ? "bg-green-600 text-white"
                    : "bg-green-100 text-green-800 hover:bg-green-200"
                }`}
                aria-label="Include article (keyboard: i)"
                aria-pressed={decision === "INCLUDE"}
              >
                ✓ Include
              </button>
              <button
                onClick={() => setDecision("EXCLUDE")}
                className={`flex-1 rounded-lg px-4 py-3 font-semibold transition ${
                  decision === "EXCLUDE"
                    ? "bg-red-600 text-white"
                    : "bg-red-100 text-red-800 hover:bg-red-200"
                }`}
                aria-label="Exclude article (keyboard: e)"
                aria-pressed={decision === "EXCLUDE"}
              >
                ✗ Exclude
              </button>
              <button
                onClick={() => setDecision("MAYBE")}
                className={`flex-1 rounded-lg px-4 py-3 font-semibold transition ${
                  decision === "MAYBE"
                    ? "bg-yellow-600 text-white"
                    : "bg-yellow-100 text-yellow-800 hover:bg-yellow-200"
                }`}
                aria-label="Mark as maybe (keyboard: m)"
                aria-pressed={decision === "MAYBE"}
              >
                ? Maybe
              </button>
            </div>
            <div className="mt-2 text-xs text-gray-500">
              Keyboard: <kbd className="px-1.5 py-0.5 bg-gray-100 rounded border">i</kbd> include,{" "}
              <kbd className="px-1.5 py-0.5 bg-gray-100 rounded border">e</kbd> exclude,{" "}
              <kbd className="px-1.5 py-0.5 bg-gray-100 rounded border">m</kbd> maybe,{" "}
              <kbd className="px-1.5 py-0.5 bg-gray-100 rounded border">esc</kbd> close
            </div>
          </div>

          <TextArea
            id="notes"
            label="Review Notes"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={4}
            placeholder="Add notes about your review decision..."
          />
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-3">
          <button
            onClick={onClose}
            className="rounded-lg border border-gray-300 px-6 py-2 font-semibold text-gray-700 hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="rounded-lg bg-blue-600 px-6 py-2 font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
          >
            {saving ? "Saving..." : "Save Review"}
          </button>
        </div>
      </div>
    </div>
  );
}
