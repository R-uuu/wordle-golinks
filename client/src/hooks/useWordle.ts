import { useState, useEffect, useCallback } from "react";
import axios from "axios";

// ── API client ────────────────────────────────────────────────────────────────
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL
    ? `${import.meta.env.VITE_API_URL}/api`
    : "/api",
});

// ── Constants ─────────────────────────────────────────────────────────────────
export const MAX_GUESSES = 6;
export const WORD_LENGTH = 5;

// ── Types ─────────────────────────────────────────────────────────────────────

export type LetterStatus = "correct" | "present" | "absent";
export type GameStatus   = "playing" | "won" | "lost";

export interface LetterResult {
  letter: string;
  status: LetterStatus;
}

export interface GuessEntry {
  guess:   string;
  results: LetterResult[];
}

// Keys are lowercase letters; values are their best known status
export type LetterMap = Record<string, LetterStatus>;

export interface UseWordleReturn {
  currentGuess: string;
  guessHistory: GuessEntry[];
  gameStatus:   GameStatus;
  message:      string;
  isLoading:    boolean;
  letterMap:    LetterMap;
  handleKey:    (key: string) => void;
  resetGame:    () => void;
  shakingRow:   number | null;
}

// ── Hook ──────────────────────────────────────────────────────────────────────

export function useWordle(): UseWordleReturn {
  const [currentGuess, setCurrentGuess] = useState<string>("");
  const [guessHistory, setGuessHistory] = useState<GuessEntry[]>([]);
  const [gameStatus,   setGameStatus]   = useState<GameStatus>("playing");
  const [message,      setMessage]      = useState<string>("");
  const [isLoading,    setIsLoading]    = useState<boolean>(false);
  const [letterMap,    setLetterMap]    = useState<LetterMap>({});
  const [shakingRow,   setShakingRow]   = useState<number | null>(null);

  // ── Helpers ─────────────────────────────────────────────────────────────────

  function showMessage(text: string, duration = 2500): void {
    setMessage(text);
    setTimeout(() => setMessage(""), duration);
  }

  function updateLetterMap(results: LetterResult[]): void {
    const PRIORITY: Record<LetterStatus, number> = {
      correct: 3,
      present: 2,
      absent:  1,
    };

    setLetterMap((prev) => {
      const updated = { ...prev };
      results.forEach(({ letter, status }) => {
        const key             = letter.toLowerCase();
        const currentPriority = PRIORITY[prev[key]] ?? 0;
        const newPriority     = PRIORITY[status]    ?? 0;
        if (newPriority > currentPriority) {
          updated[key] = status;
        }
      });
      return updated;
    });
  }

  // ── Submit ───────────────────────────────────────────────────────────────────

  const submitGuess = useCallback(async (): Promise<void> => {
    if (isLoading || gameStatus !== "playing") return;

    if (currentGuess.length !== WORD_LENGTH) {
      showMessage("Not enough letters");
      return;
    }

    setIsLoading(true);

    try {
      const { data } = await api.post<{
        result:    LetterResult[];
        isCorrect: boolean;
        answer?:   string;
      }>("/guess", { guess: currentGuess });

      const newEntry: GuessEntry = { guess: currentGuess, results: data.result };

      setGuessHistory((prev) => [...prev, newEntry]);
      updateLetterMap(data.result);
      setCurrentGuess("");

      if (data.isCorrect) {
        setGameStatus("won");
        showMessage(getWinMessage(guessHistory.length + 1), 4000);
      } else if (guessHistory.length + 1 >= MAX_GUESSES) {
        setGameStatus("lost");
        const { data: answerData } = await api.get<{ answer: string }>("/answer");
        showMessage(`The word was ${answerData.answer.toUpperCase()}`, 6000);
      }
    } catch (err: unknown) {
      const errorMsg =
        axios.isAxiosError(err) && err.response?.data?.error
          ? err.response.data.error
          : "Server error — try again.";
      showMessage(errorMsg);

      if (axios.isAxiosError(err) && err.response?.status === 422) {
        const currentRow = guessHistory.length;
        setShakingRow(currentRow);
        setTimeout(() => setShakingRow(null), 600);
      }
    } finally {
      setIsLoading(false);
    }
  }, [currentGuess, guessHistory, gameStatus, isLoading]);

  // ── Key handler ──────────────────────────────────────────────────────────────

  const handleKey = useCallback(
    (key: string): void => {
      if (gameStatus !== "playing" || isLoading) return;

      if (key === "ENTER") {
        submitGuess();
        return;
      }

      if (key === "BACKSPACE") {
        setCurrentGuess((g) => g.slice(0, -1));
        return;
      }

      if (/^[A-Z]$/.test(key) && currentGuess.length < WORD_LENGTH) {
        setCurrentGuess((g) => g + key.toLowerCase());
      }
    },
    [gameStatus, isLoading, currentGuess, submitGuess]
  );

  // ── Physical keyboard listener ────────────────────────────────────────────────

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent): void {
      handleKey(e.key.toUpperCase());
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [handleKey]);

  // ── Reset ────────────────────────────────────────────────────────────────────

  function resetGame(): void {
    setCurrentGuess("");
    setGuessHistory([]);
    setGameStatus("playing");
    setMessage("");
    setLetterMap({});
    setShakingRow(null);
  }

  return {
    currentGuess,
    guessHistory,
    gameStatus,
    message,
    isLoading,
    letterMap,
    handleKey,
    resetGame,
    shakingRow,
  };
}

// ── Utility ───────────────────────────────────────────────────────────────────

function getWinMessage(guessCount: number): string {
  const messages: Record<number, string> = {
    1: "Unbelievable! 🤯",
    2: "Genius! 🧠",
    3: "Impressive! 🔥",
    4: "Nice work! 👏",
    5: "Phew! That was close 😅",
  };
  return messages[guessCount] ?? "You got it! 🎉";
}