"use client";

import { usePathname } from "next/navigation";
import { CommandPalette, useCommandPalette } from "./CommandPalette";
import { KeyboardShortcutsModal, useKeyboardShortcuts } from "./KeyboardShortcutsModal";

export function GlobalUXFeatures() {
  const pathname = usePathname();
  const { isOpen: isCommandPaletteOpen, setIsOpen: setCommandPaletteOpen } = useCommandPalette();
  const { isOpen: isShortcutsOpen, setIsOpen: setShortcutsOpen } = useKeyboardShortcuts();

  // Extract projectId from pathname if available
  const projectId = pathname?.match(/\/project\/([^/]+)/)?.[1];

  return (
    <>
      <CommandPalette
        isOpen={isCommandPaletteOpen}
        onClose={() => setCommandPaletteOpen(false)}
        projectId={projectId}
      />
      <KeyboardShortcutsModal
        isOpen={isShortcutsOpen}
        onClose={() => setShortcutsOpen(false)}
      />
    </>
  );
}
