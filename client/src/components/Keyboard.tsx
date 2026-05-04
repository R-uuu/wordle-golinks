import type { LetterStatus, LetterMap } from "../hooks/useWordle";

// ── Types ─────────────────────────────────────────────────────────────────────

interface KeyProps {
  label:   string;
  status?: LetterStatus | "default";
  onPress: (key: string) => void;
}

interface KeyboardProps {
  letterMap: LetterMap;
  onKey:     (key: string) => void;
}

// ── Layout ────────────────────────────────────────────────────────────────────

const ROWS: string[][] = [
  ["Q", "W", "E", "R", "T", "Y", "U", "I", "O", "P"],
  ["A", "S", "D", "F", "G", "H", "J", "K", "L"],
  ["ENTER", "Z", "X", "C", "V", "B", "N", "M", "BACKSPACE"],
];

const KEY_COLORS: Record<string, string> = {
  correct: "bg-[var(--color-correct)] text-white border-[var(--color-correct)]",
  present: "bg-[var(--color-present)] text-white border-[var(--color-present)]",
  absent:  "bg-[var(--color-absent)]  text-white border-[var(--color-absent)]",
  default: "bg-[#818384] text-white border-[#818384]",
};

// ── Sub-components ────────────────────────────────────────────────────────────

function BackspaceIcon(): React.JSX.Element {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="currentColor"
      className="w-5 h-5 mx-auto"
      aria-hidden="true"
    >
      <path d="M22 3H7c-.69 0-1.23.35-1.59.88L0 12l5.41 8.11c.36.53.9.89 1.59.89h15c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-3.59 13L16 13.41 13.59 16 12 14.41 14.41 12 12 9.59 13.59 8 16 10.41 18.41 8 20 9.59 17.59 12 20 14.41 18.41 16z" />
    </svg>
  );
}

function Key({ label, status = "default", onPress }: KeyProps): React.JSX.Element {
  const isWide     = label === "ENTER" || label === "BACKSPACE";
  const colorClass = KEY_COLORS[status] ?? KEY_COLORS.default;

  return (
    <button
      onClick={() => onPress(label)}
      onMouseDown={(e: React.MouseEvent) => e.preventDefault()}
      aria-label={label === "BACKSPACE" ? "Delete" : label}
      className={`
        ${colorClass}
        ${isWide ? "px-3 min-w-[4rem]" : "w-10"}
        h-14 rounded-md text-xs font-bold uppercase tracking-wide
        border transition-colors duration-200
        active:scale-95 active:brightness-75
        select-none cursor-pointer
      `}
    >
      {label === "BACKSPACE" ? <BackspaceIcon /> : label}
    </button>
  );
}

// ── Keyboard ──────────────────────────────────────────────────────────────────

export default function Keyboard({ letterMap, onKey }: KeyboardProps): React.JSX.Element {
  return (
    <div className="flex flex-col items-center gap-1.5 w-full max-w-lg px-2">
      {ROWS.map((row, rowIndex) => (
        <div key={rowIndex} className="flex gap-1.5 justify-center">
          {row.map((key) => (
            <Key
              key={key}
              label={key}
              status={
                (letterMap[key.toLowerCase()] as LetterStatus) ?? "default"
              }
              onPress={onKey}
            />
          ))}
        </div>
      ))}
    </div>
  );
}