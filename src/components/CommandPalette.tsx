"use client";

import { useEffect, useState, useMemo } from "react";
import { useRouter } from "next/navigation";

interface Command {
  id: string;
  name: string;
  description: string;
  icon: string;
  action: () => void;
  shortcut?: string;
  category: string;
}

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  projectId?: string;
}

export function CommandPalette({ isOpen, onClose, projectId }: CommandPaletteProps) {
  const [search, setSearch] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);
  const router = useRouter();

  const commands: Command[] = useMemo(() => [
    // Navigation
    {
      id: "nav-dashboard",
      name: "Go to Dashboard",
      description: "View all your organizations",
      icon: "🏠",
      action: () => router.push("/dashboard"),
      category: "Navigation",
    },
    {
      id: "nav-articles",
      name: "Go to Articles",
      description: "View and review articles",
      icon: "📄",
      action: () => projectId && router.push(`/project/${projectId}/articles`),
      category: "Navigation",
    },
    {
      id: "nav-import",
      name: "Import Articles",
      description: "Upload Excel or CSV file",
      icon: "📥",
      action: () => projectId && router.push(`/project/${projectId}/import`),
      category: "Navigation",
    },

    // Actions
    {
      id: "action-export",
      name: "Export Articles",
      description: "Download articles as Excel",
      icon: "📤",
      action: () => {
        // Trigger export
        const exportBtn = document.querySelector('[data-action="export"]') as HTMLButtonElement;
        exportBtn?.click();
      },
      category: "Actions",
    },

    // Keyboard Shortcuts
    {
      id: "help-shortcuts",
      name: "View Keyboard Shortcuts",
      description: "Show all available shortcuts",
      icon: "⌨️",
      action: () => {
        // Open shortcuts modal
        const helpBtn = document.querySelector('[data-action="shortcuts"]') as HTMLButtonElement;
        helpBtn?.click();
      },
      shortcut: "?",
      category: "Help",
    },
  ], [router, projectId]);

  const filteredCommands = useMemo(() => {
    if (!search) return commands;

    const searchLower = search.toLowerCase();
    return commands.filter(
      (cmd) =>
        cmd.name.toLowerCase().includes(searchLower) ||
        cmd.description.toLowerCase().includes(searchLower) ||
        cmd.category.toLowerCase().includes(searchLower)
    );
  }, [search, commands]);

  useEffect(() => {
    if (!isOpen) {
      setSearch("");
      setSelectedIndex(0);
    }
  }, [isOpen]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;

      if (e.key === "Escape") {
        onClose();
      } else if (e.key === "ArrowDown") {
        e.preventDefault();
        setSelectedIndex((prev) => Math.min(prev + 1, filteredCommands.length - 1));
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setSelectedIndex((prev) => Math.max(prev - 1, 0));
      } else if (e.key === "Enter") {
        e.preventDefault();
        if (filteredCommands[selectedIndex]) {
          filteredCommands[selectedIndex].action();
          onClose();
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, selectedIndex, filteredCommands, onClose]);

  if (!isOpen) return null;

  // Group by category
  const groupedCommands = filteredCommands.reduce((acc, cmd) => {
    if (!acc[cmd.category]) {
      acc[cmd.category] = [];
    }
    acc[cmd.category].push(cmd);
    return acc;
  }, {} as Record<string, Command[]>);

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center bg-black/50 pt-[20vh] backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="w-full max-w-2xl rounded-xl border border-gray-200 bg-white shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Search Input */}
        <div className="border-b border-gray-200 p-4">
          <div className="flex items-center gap-3">
            <span className="text-2xl">🔍</span>
            <input
              type="text"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setSelectedIndex(0);
              }}
              placeholder="Type a command or search..."
              className="flex-1 border-0 bg-transparent text-lg outline-none placeholder:text-gray-400"
              autoFocus
            />
            <kbd className="rounded bg-gray-100 px-2 py-1 text-xs font-semibold text-gray-600">
              ESC
            </kbd>
          </div>
        </div>

        {/* Results */}
        <div className="max-h-[400px] overflow-y-auto p-2">
          {filteredCommands.length === 0 ? (
            <div className="py-12 text-center text-gray-500">
              No commands found for "{search}"
            </div>
          ) : (
            Object.entries(groupedCommands).map(([category, cmds]) => (
              <div key={category} className="mb-4">
                <div className="mb-1 px-3 text-xs font-semibold uppercase tracking-wider text-gray-500">
                  {category}
                </div>
                {cmds.map((cmd, index) => {
                  const globalIndex = filteredCommands.indexOf(cmd);
                  const isSelected = globalIndex === selectedIndex;

                  return (
                    <button
                      key={cmd.id}
                      onClick={() => {
                        cmd.action();
                        onClose();
                      }}
                      onMouseEnter={() => setSelectedIndex(globalIndex)}
                      className={`w-full rounded-lg px-3 py-2.5 text-left transition-colors ${
                        isSelected
                          ? "bg-blue-50 ring-2 ring-blue-500 ring-inset"
                          : "hover:bg-gray-50"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-2xl">{cmd.icon}</span>
                        <div className="flex-1">
                          <div className="font-medium text-gray-900">{cmd.name}</div>
                          <div className="text-sm text-gray-500">{cmd.description}</div>
                        </div>
                        {cmd.shortcut && (
                          <kbd className="rounded bg-gray-100 px-2 py-1 text-xs font-semibold text-gray-600">
                            {cmd.shortcut}
                          </kbd>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-gray-200 bg-gray-50 px-4 py-3">
          <div className="flex items-center gap-4 text-xs text-gray-600">
            <div className="flex items-center gap-1">
              <kbd className="rounded bg-white px-1.5 py-0.5 shadow-sm">↑↓</kbd>
              <span>Navigate</span>
            </div>
            <div className="flex items-center gap-1">
              <kbd className="rounded bg-white px-1.5 py-0.5 shadow-sm">Enter</kbd>
              <span>Select</span>
            </div>
            <div className="flex items-center gap-1">
              <kbd className="rounded bg-white px-1.5 py-0.5 shadow-sm">ESC</kbd>
              <span>Close</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Hook to open command palette with Cmd+K
export function useCommandPalette() {
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setIsOpen(true);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  return { isOpen, setIsOpen };
}
