"use client";

import { useEffect, useState } from "react";

interface KeyboardShortcutsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface Shortcut {
  keys: string[];
  description: string;
  category: string;
}

const shortcuts: Shortcut[] = [
  // Global
  { keys: ["Cmd", "K"], description: "Open command palette", category: "Global" },
  { keys: ["?"], description: "Show keyboard shortcuts", category: "Global" },
  { keys: ["ESC"], description: "Close modal / Clear selection", category: "Global" },

  // Navigation
  { keys: ["j"], description: "Next article", category: "Navigation" },
  { keys: ["k"], description: "Previous article", category: "Navigation" },
  { keys: ["Enter"], description: "Open focused article", category: "Navigation" },

  // Review Actions
  { keys: ["i"], description: "Mark as Include", category: "Review" },
  { keys: ["e"], description: "Mark as Exclude", category: "Review" },
  { keys: ["m"], description: "Mark as Maybe", category: "Review" },
  { keys: ["Space"], description: "Toggle selection", category: "Review" },

  // Bulk Actions
  { keys: ["Cmd", "A"], description: "Select all (in modal)", category: "Bulk Actions" },
  { keys: ["Cmd", "Z"], description: "Undo last review", category: "Bulk Actions" },
  { keys: ["Cmd", "Shift", "Z"], description: "Redo review", category: "Bulk Actions" },
];

export function KeyboardShortcutsModal({ isOpen, onClose }: KeyboardShortcutsModalProps) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  // Group by category
  const groupedShortcuts = shortcuts.reduce((acc, shortcut) => {
    if (!acc[shortcut.category]) {
      acc[shortcut.category] = [];
    }
    acc[shortcut.category].push(shortcut);
    return acc;
  }, {} as Record<string, Shortcut[]>);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="w-full max-w-3xl rounded-xl bg-white shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="border-b border-gray-200 px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="text-3xl">⌨️</span>
              <div>
                <h2 className="text-2xl font-bold text-gray-900">
                  Keyboard Shortcuts
                </h2>
                <p className="text-sm text-gray-600">
                  Speed up your workflow with these shortcuts
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="rounded-lg p-2 text-gray-400 transition hover:bg-gray-100 hover:text-gray-600"
              aria-label="Close"
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
        </div>

        {/* Content */}
        <div className="max-h-[60vh] overflow-y-auto p-6">
          <div className="grid gap-8 md:grid-cols-2">
            {Object.entries(groupedShortcuts).map(([category, categoryShortcuts]) => (
              <div key={category}>
                <h3 className="mb-3 text-sm font-semibold uppercase tracking-wider text-gray-500">
                  {category}
                </h3>
                <div className="space-y-2">
                  {categoryShortcuts.map((shortcut, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between rounded-lg border border-gray-200 p-3 transition hover:border-blue-300 hover:bg-blue-50"
                    >
                      <span className="text-sm text-gray-700">
                        {shortcut.description}
                      </span>
                      <div className="flex items-center gap-1">
                        {shortcut.keys.map((key, keyIndex) => (
                          <span key={keyIndex} className="flex items-center gap-1">
                            <kbd className="inline-flex h-7 min-w-[28px] items-center justify-center rounded bg-gradient-to-b from-gray-100 to-gray-200 px-2 text-xs font-semibold text-gray-800 shadow-sm ring-1 ring-gray-300">
                              {key}
                            </kbd>
                            {keyIndex < shortcut.keys.length - 1 && (
                              <span className="text-gray-400">+</span>
                            )}
                          </span>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="border-t border-gray-200 bg-gray-50 px-6 py-4">
          <div className="flex items-center justify-between text-sm text-gray-600">
            <div className="flex items-center gap-2">
              <span className="text-blue-600">💡 Tip:</span>
              <span>Press <kbd className="rounded bg-white px-2 py-1 shadow-sm">?</kbd> anytime to view shortcuts</span>
            </div>
            <button
              onClick={onClose}
              className="rounded-lg bg-blue-600 px-4 py-2 font-semibold text-white transition hover:bg-blue-700"
            >
              Got it!
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// Hook to open shortcuts modal with ?
export function useKeyboardShortcuts() {
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger if typing in input
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement
      ) {
        return;
      }

      if (e.key === "?" && !e.shiftKey) {
        e.preventDefault();
        setIsOpen(true);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  return { isOpen, setIsOpen };
}
