import { useState, useEffect } from "react";
import axios from "axios";

// ── API client ────────────────────────────────────────────────────────────────
// In development, Vite proxies /api → localhost:3001 (see vite.config.js).
// In production, VITE_API_URL is your deployed Railway/Render URL.
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL
    ? `${import.meta.env.VITE_API_URL}/api`
    : "/api",
});

// ── Constants ─────────────────────────────────────────────────────────────────
const MAX_GUESSES = 5;
const WORD_LENGTH = 5;

const TILE_COLORS = {
  correct: "bg-[var(--color-correct)] border-[var(--color-correct)]",
  present: "bg-[var(--color-present)] border-[var(--color-present)]",
  absent:  "bg-[var(--color-absent)]  border-[var(--color-absent)]",
  empty:   "bg-transparent border-[var(--color-border)]",
};

// ── Sub-components ────────────────────────────────────────────────────────────

function Tile({ letter = "", status = "empty" }) {
  return (
    <div
      className={`
        w-14 h-14 flex items-center justify-center
        border-2 text-2xl font-bold uppercase tracking-widest
        transition-all duration-300
        ${TILE_COLORS[status]}
      `}
    >
      {letter}
    </div>
  );
}

function GuessRow({ letters, results }) {
  return (
    <div className="flex gap-1.5">
      {Array(WORD_LENGTH)
        .fill(null)
        .map((_, i) => (
          <Tile
            key={i}
            letter={letters?.[i] ?? ""}
            status={results?.[i]?.status ?? "empty"}
          />
        ))}
    </div>
  );
}

// ── Main App ──────────────────────────────────────────────────────────────────

export default function App() {
  const [currentGuess, setCurrentGuess] = useState("");
  const [guessHistory, setGuessHistory] = useState([]); // [{ guess, results }]
  const [gameStatus, setGameStatus] = useState("playing"); // "playing" | "won" | "lost"
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  // Keyboard input — physical keyboard
  useEffect(() => {
    function handleKeyDown(e) {
      if (gameStatus !== "playing") return;
      if (e.key === "Enter") return submitGuess();
      if (e.key === "Backspace") return setCurrentGuess((g) => g.slice(0, -1));
      if (/^[a-zA-Z]$/.test(e.key) && currentGuess.length < WORD_LENGTH) {
        setCurrentGuess((g) => g + e.key.toLowerCase());
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [currentGuess, gameStatus]);

  function showMessage(text, duration = 2500) {
    setMessage(text);
    setTimeout(() => setMessage(""), duration);
  }

  async function submitGuess() {
    if (currentGuess.length !== WORD_LENGTH) {
      return showMessage("Not enough letters");
    }
    if (guessHistory.length >= MAX_GUESSES) return;

    setIsLoading(true);

    try {
      const { data } = await api.post("/guess", { guess: currentGuess });
      const newEntry = { guess: currentGuess, results: data.result };

      setGuessHistory((prev) => [...prev, newEntry]);
      setCurrentGuess("");

      if (data.isCorrect) {
        setGameStatus("won");
        showMessage("Brilliant! 🎉", 4000);
      } else if (guessHistory.length + 1 >= MAX_GUESSES) {
        setGameStatus("lost");
        // Fetch the answer to reveal it on loss
        const { data: answerData } = await api.get("/answer");
        showMessage(`The word was ${answerData.answer.toUpperCase()}`, 5000);
      }
    } catch (err) {
      const errorMsg =
        err.response?.data?.error ?? "Something went wrong. Try again.";
      showMessage(errorMsg);
    } finally {
      setIsLoading(false);
    }
  }

  // ── Render ──────────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen flex flex-col items-center pt-8 px-4">

      {/* Header */}
      <header className="w-full max-w-sm mb-8 text-center border-b border-[var(--color-border)] pb-4">
        <h1 className="text-3xl font-bold tracking-widest uppercase">
          Wordl<span className="text-green-500">e</span>
        </h1>
        <p className="text-xs text-gray-500 mt-1 tracking-widest uppercase">
          Definitely Not Wordle
        </p>
      </header>

      {/* Toast message */}
      {message && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 bg-white text-black text-sm font-semibold px-4 py-2 rounded-md shadow-lg z-50 animate-bounce">
          {message}
        </div>
      )}

      {/* Game board — 5 rows × 5 tiles */}
      <div className="flex flex-col gap-1.5 mb-8">
        {Array(MAX_GUESSES)
          .fill(null)
          .map((_, rowIndex) => {
            const committedRow = guessHistory[rowIndex];
            const isCurrentRow =
              rowIndex === guessHistory.length && gameStatus === "playing";

            return (
              <GuessRow
                key={rowIndex}
                letters={
                  committedRow
                    ? committedRow.guess.split("")
                    : isCurrentRow
                    ? currentGuess.split("")
                    : []
                }
                results={committedRow?.results ?? []}
              />
            );
          })}
      </div>

      {/* Play again after game ends */}
      {gameStatus !== "playing" && (
        <button
          onClick={() => {
            setGuessHistory([]);
            setCurrentGuess("");
            setGameStatus("playing");
            setMessage("");
          }}
          className="mt-4 px-6 py-2 bg-green-600 hover:bg-green-500 text-white font-bold rounded-md tracking-widest uppercase text-sm transition-colors"
        >
          Play Again
        </button>
      )}

      {/* Connection status — remove this once you've confirmed it works */}
      <p className="text-xs text-gray-600 mt-12">
        {isLoading ? "Checking guess..." : `${guessHistory.length}/${MAX_GUESSES} guesses used`}
      </p>
    </div>
  );
}