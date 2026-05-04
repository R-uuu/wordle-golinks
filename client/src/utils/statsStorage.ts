export interface GameStats {
  gamesPlayed: number;
  gamesWon: number;
  currentStreak: number;
  maxStreak: number;
  // Index 0 = won on guess 1, index 4 = won on guess 5
  guessDistribution: number[];
}

const STORAGE_KEY = "wordle_stats";

const DEFAULT_STATS: GameStats = {
  gamesPlayed: 0,
  gamesWon: 0,
  currentStreak: 0,
  maxStreak: 0,
  guessDistribution: [0, 0, 0, 0, 0],
};

export function loadStats(): GameStats {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { ...DEFAULT_STATS };

    const parsed = JSON.parse(raw) as Partial<GameStats>;
    return {
      gamesPlayed: parsed.gamesPlayed ?? 0,
      gamesWon: parsed.gamesWon ?? 0,
      currentStreak: parsed.currentStreak ?? 0,
      maxStreak: parsed.maxStreak ?? 0,
      guessDistribution:
        Array.isArray(parsed.guessDistribution) && parsed.guessDistribution.length === 5
          ? parsed.guessDistribution.map((n) => (typeof n === "number" ? n : 0))
          : [...DEFAULT_STATS.guessDistribution],
    };
  } catch {
    return { ...DEFAULT_STATS };
  }
}

export function saveStats(stats: GameStats): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(stats));
  } catch {
    // localStorage can be blocked in private browsing; fail silently.
    console.warn("Could not save stats to localStorage.");
  }
}

/**
 * Call this once when the game resolves to "won" or "lost".
 * Returns the updated stats so the hook can store them in state.
 */
export function recordResult(didWin: boolean, guessCount: number): GameStats {
  const prev = loadStats();

  const guessDistribution = [...prev.guessDistribution];
  if (didWin) {
    // guessCount is 1-indexed, array is 0-indexed.
    const safeIndex = Math.min(Math.max(guessCount, 1), guessDistribution.length) - 1;
    guessDistribution[safeIndex] += 1;
  }

  const currentStreak = didWin ? prev.currentStreak + 1 : 0;

  const updated: GameStats = {
    gamesPlayed: prev.gamesPlayed + 1,
    gamesWon: didWin ? prev.gamesWon + 1 : prev.gamesWon,
    currentStreak,
    maxStreak: Math.max(prev.maxStreak, currentStreak),
    guessDistribution,
  };

  saveStats(updated);
  return updated;
}
