import type { GameStats } from "../utils/statsStorage";
import ShareButton from "./ShareButton";
import type { GuessEntry } from "../hooks/useWordle";

interface StatsModalProps {
  stats: GameStats;
  isOpen: boolean;
  onClose: () => void;
  onPlayAgain: () => void;
  guessHistory: GuessEntry[];
  didWin: boolean;
}

interface StatBoxProps {
  value: number | string;
  label: string;
}

function StatBox({ value, label }: StatBoxProps): React.JSX.Element {
  return (
    <div className="flex flex-col items-center gap-1">
      <span className="text-4xl font-bold text-white">{value}</span>
      <span className="text-[10px] text-gray-400 uppercase tracking-wider text-center leading-tight">
        {label}
      </span>
    </div>
  );
}

function GuessDistribution({ distribution }: { distribution: number[] }): React.JSX.Element {
  const maxValue = Math.max(...distribution, 1);

  return (
    <div className="w-full flex flex-col gap-1.5">
      {distribution.map((count, i) => {
        const widthPct = Math.max((count / maxValue) * 100, 8);

        return (
          <div key={i} className="flex items-center gap-2 text-sm">
            <span className="text-gray-400 w-3 text-right font-mono">{i + 1}</span>

            <div className="flex-1 flex items-center">
              <div
                className="h-6 flex items-center justify-end pr-2
                           bg-[var(--color-absent)] rounded-sm
                           transition-all duration-500"
                style={{ width: `${widthPct}%` }}
              >
                <span className="text-white text-xs font-bold">{count}</span>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

export default function StatsModal({
  stats,
  isOpen,
  onClose,
  onPlayAgain,
  guessHistory,
  didWin,
}: StatsModalProps): React.JSX.Element | null {
  if (!isOpen) return null;

  const winPct =
    stats.gamesPlayed === 0
      ? 0
      : Math.round((stats.gamesWon / stats.gamesPlayed) * 100);

  return (
    <>
      <div
        className="fixed inset-0 bg-black/70 z-40"
        onClick={onClose}
        aria-hidden="true"
      />

      <div
        role="dialog"
        aria-modal="true"
        aria-label="Statistics"
        className="fixed inset-0 z-50 flex items-center justify-center px-4"
      >
        <div
          className="bg-[#121213] border border-[var(--color-border)]
                     rounded-xl w-full max-w-sm p-6 flex flex-col gap-6
                     shadow-2xl"
        >
          <div className="flex items-center justify-between">
            <h2 className="text-white text-lg font-bold tracking-widest uppercase">
              Statistics
            </h2>
            <button
              onClick={onClose}
              aria-label="Close statistics"
              className="text-gray-500 hover:text-white transition-colors text-xl leading-none"
            >
              X
            </button>
          </div>

          <div className="grid grid-cols-4 gap-2">
            <StatBox value={stats.gamesPlayed} label="Played" />
            <StatBox value={`${winPct}%`} label="Win %" />
            <StatBox value={stats.currentStreak} label="Current Streak" />
            <StatBox value={stats.maxStreak} label="Max Streak" />
          </div>

          <div className="flex flex-col gap-3">
            <h3 className="text-white text-xs font-bold tracking-widest uppercase">
              Guess Distribution
            </h3>
            <GuessDistribution distribution={stats.guessDistribution} />
          </div>

          <div className="flex flex-col gap-3 pt-2">
            <div className="flex justify-center">
              <ShareButton guessHistory={guessHistory} didWin={didWin} />
            </div>

            <div className="flex gap-3">
              <button
                onClick={onClose}
                className="flex-1 py-3 rounded-lg border border-[var(--color-border)]
                           text-white text-sm font-bold tracking-widest uppercase
                           hover:bg-[var(--color-border)] transition-colors"
              >
                Close
              </button>
              <button
                onClick={() => {
                  onClose();
                  onPlayAgain();
                }}
                className="flex-1 py-3 rounded-lg bg-[var(--color-correct)]
                           text-white text-sm font-bold tracking-widest uppercase
                           hover:brightness-110 transition-all"
              >
                Play Again
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
