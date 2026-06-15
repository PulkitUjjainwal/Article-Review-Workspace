import { useState, useCallback } from "react";

export interface UndoableAction<T> {
  do: () => Promise<void> | void;
  undo: () => Promise<void> | void;
  description: string;
  data: T;
}

export function useUndoRedo<T>() {
  const [history, setHistory] = useState<UndoableAction<T>[]>([]);
  const [currentIndex, setCurrentIndex] = useState(-1);

  const canUndo = currentIndex >= 0;
  const canRedo = currentIndex < history.length - 1;

  const executeAction = useCallback(async (action: UndoableAction<T>) => {
    await action.do();

    setHistory((prev) => {
      const newHistory = prev.slice(0, currentIndex + 1);
      newHistory.push(action);
      return newHistory;
    });

    setCurrentIndex((prev) => prev + 1);
  }, [currentIndex]);

  const undo = useCallback(async () => {
    if (!canUndo) return;

    const action = history[currentIndex];
    await action.undo();
    setCurrentIndex((prev) => prev - 1);
  }, [canUndo, history, currentIndex]);

  const redo = useCallback(async () => {
    if (!canRedo) return;

    const action = history[currentIndex + 1];
    await action.do();
    setCurrentIndex((prev) => prev + 1);
  }, [canRedo, history, currentIndex]);

  const clear = useCallback(() => {
    setHistory([]);
    setCurrentIndex(-1);
  }, []);

  return {
    executeAction,
    undo,
    redo,
    canUndo,
    canRedo,
    history,
    currentAction: currentIndex >= 0 ? history[currentIndex] : null,
  };
}
