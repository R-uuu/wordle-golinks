import { useState, useEffect } from "react";
import { useWordle, MAX_GUESSES, WORD_LENGTH } from "./hooks/useWordle";
import type { LetterResult } from "./hooks/useWordle";
import { useStats } from "./hooks/useStats";
import Keyboard from "./components/Keyboard";
import StatsModal from "./components/StatsModal";

interface TileProps {
  letter: string;
  status: string;
  delay: number;
  committed: boolean;
}

interface GuessRowProps {
  letters: string[];
  results: LetterResult[];
  committed: boolean;
  isWinRow: boolean;
  isShaking: boolean;
}

interface ToastProps {
  message: string;
}

const FLIP_DURATION = 500;
const FLIP_STEP = 150;

function Tile({ letter, status, delay, committed }: TileProps): React.JSX.Element {
  const [revealed, setRevealed] = useState<boolean>(false);

  useEffect(() => {
    if (!committed || !status) return;

    const timer = setTimeout(() => {
      setRevealed(true);
    }, delay + FLIP_DURATION / 2);

    return () => clearTimeout(timer);
  }, [committed, status, delay]);

  useEffect(() => {
    if (!committed) {
      setRevealed(false);
    }
  }, [committed]);

  const hasLetter = Boolean(letter);

  const colorClass = (() => {
    if (revealed && status) {
      const map: Record<string, string> = {
        correct: "bg-[var(--color-correct)] border-[var(--color-correct)] text-white",
        present: "bg-[var(--color-present)] border-[var(--color-present)] text-white",
        absent: "bg-[var(--color-absent)] border-[var(--color-absent)] text-white",
      };
      return map[status] ?? "border-[var(--color-border)] bg-transparent";
    }

    if (hasLetter) return "border-[#999] bg-transparent text-white";
    return "border-[var(--color-border)] bg-transparent";
  })();

  const animClass = (() => {
    if (committed && status) {
      return `tile-flip tile-delay-${Math.min(delay / FLIP_STEP, 4)}`;
    }
    if (hasLetter && !committed) return "tile-pop";
    return "";
  })();

  return (
    <div style={{ perspective: "250px" }}>
      <div
        className={`
          w-14 h-14 flex items-center justify-center
          border-2 text-2xl font-bold uppercase
          transition-colors duration-[0ms]
          ${colorClass}
          ${animClass}
        `}
      >
        {letter}
      </div>
    </div>
  );
}

function GuessRow({
  letters,
  results,
  committed,
  isWinRow,
  isShaking,
}: GuessRowProps): React.JSX.Element {
  return (
    <div className={`flex gap-1.5 ${isShaking ? "tile-shake" : ""}`}>
      {Array(WORD_LENGTH)
        .fill(null)
        .map((_, i) => (
          <div key={i} className={isWinRow ? `tile-bounce tile-delay-${i}` : ""}>
            <Tile
              letter={letters[i] ?? ""}
              status={results[i]?.status ?? ""}
              delay={i * FLIP_STEP}
              committed={committed}
            />
          </div>
        ))}
    </div>
  );
}

function Toast({ message }: ToastProps): React.JSX.Element | null {
  if (!message) return null;

  return (
    <div
      className="fixed top-20 left-1/2 -translate-x-1/2 z-50
                 bg-white text-black text-sm font-bold
                 px-5 py-2.5 rounded-lg shadow-xl
                 animate-bounce pointer-events-none"
    >
      {message}
    </div>
  );
}

export default function App(): React.JSX.Element {
  const {
    currentGuess,
    guessHistory,
    gameStatus,
    message,
    letterMap,
    handleKey,
    resetGame,
    shakingRow,
  } = useWordle();

  const { stats, showModal, closeModal } = useStats(gameStatus, guessHistory);
  const [statsOpen, setStatsOpen] = useState<boolean>(false);

  const winRow = gameStatus === "won" ? guessHistory.length - 1 : null;

  return (
    <div className="min-h-screen flex flex-col items-center pt-8 px-4">
      <header
        className="w-full max-w-sm mb-8 text-center
                   border-b border-[var(--color-border)] pb-4"
      >
        <div className="flex items-center justify-between">
          <div className="w-8" />
          <h1 className="text-3xl font-bold tracking-widest uppercase">
            Wordl<span className="text-[var(--color-correct)]">e</span>
          </h1>
          <button
            onClick={() => setStatsOpen(true)}
            aria-label="View statistics"
            className="text-gray-400 hover:text-white transition-colors text-xl w-8"
          >
            Stats
          </button>
        </div>
        <p className="text-xs text-gray-500 mt-1 tracking-widest uppercase">
          Definitely Not Wordle
        </p>
      </header>

      <Toast message={message} />

      <div className="flex flex-col gap-1.5 mb-8">
        {Array(MAX_GUESSES)
          .fill(null)
          .map((_, rowIndex) => {
            const committed = guessHistory[rowIndex];
            const isActive = rowIndex === guessHistory.length;

            return (
              <GuessRow
                key={rowIndex}
                letters={
                  committed
                    ? committed.guess.split("")
                    : isActive
                    ? currentGuess.split("")
                    : []
                }
                results={committed?.results ?? []}
                committed={Boolean(committed)}
                isWinRow={winRow === rowIndex}
                isShaking={shakingRow === rowIndex}
              />
            );
          })}
      </div>

      <Keyboard letterMap={letterMap} onKey={handleKey} />

      {gameStatus !== "playing" && (
        <button
          onClick={() => {
            closeModal();
            setStatsOpen(false);
            resetGame();
          }}
          className="mt-8 px-8 py-2.5 bg-[var(--color-correct)]
                     hover:brightness-110 text-white font-bold rounded-lg
                     tracking-widest uppercase text-sm transition-all"
        >
          Play Again
        </button>
      )}

      <StatsModal
        stats={stats}
        isOpen={showModal || statsOpen}
        onClose={() => {
          closeModal();
          setStatsOpen(false);
        }}
        onPlayAgain={() => {
          closeModal();
          setStatsOpen(false);
          resetGame();
        }}
      />
    </div>
  );
}
