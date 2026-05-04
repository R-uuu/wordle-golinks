import { useState, useEffect } from "react";
import { loadStats, recordResult } from "../utils/statsStorage";
import type { GameStats } from "../utils/statsStorage";
import type { GameStatus, GuessEntry } from "./useWordle";

interface UseStatsReturn {
  stats: GameStats;
  showModal: boolean;
  closeModal: () => void;
}

/**
 * Watches gameStatus and automatically:
 * 1. Records the result in localStorage when the game ends
 * 2. Opens the stats modal after a short delay (so the last tile animates first)
 */
export function useStats(gameStatus: GameStatus, guessHistory: GuessEntry[]): UseStatsReturn {
  const [stats, setStats] = useState<GameStats>(loadStats);
  const [showModal, setShowModal] = useState<boolean>(false);

  useEffect(() => {
    if (gameStatus === "playing") return;

    const didWin = gameStatus === "won";
    const guessCount = guessHistory.length;

    const updated = recordResult(didWin, guessCount);
    setStats(updated);

    const timer = setTimeout(() => setShowModal(true), 1800);
    return () => clearTimeout(timer);

    // Only run when gameStatus changes, not on every guessHistory change.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gameStatus]);

  function closeModal(): void {
    setShowModal(false);
  }

  return { stats, showModal, closeModal };
}
