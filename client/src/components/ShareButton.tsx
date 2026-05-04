import { useState } from "react";
import { buildShareText, shareResult } from "../utils/shareUtils";
import type { GuessEntry } from "../hooks/useWordle";

interface ShareButtonProps {
  guessHistory: GuessEntry[];
  didWin: boolean;
}

const GAME_URL = import.meta.env.VITE_GAME_URL ?? window.location.origin;

export default function ShareButton({
  guessHistory,
  didWin,
}: ShareButtonProps): React.JSX.Element {
  const [buttonLabel, setButtonLabel] = useState<string>("Share go/wordle");
  const [copied, setCopied] = useState<boolean>(false);

  async function handleShare(): Promise<void> {
    const text = buildShareText(guessHistory, didWin, GAME_URL);
    const result = await shareResult(text);

    if (result === "copied") {
      setButtonLabel("Copied to clipboard");
      setCopied(true);
      setTimeout(() => {
        setButtonLabel("Share go/wordle");
        setCopied(false);
      }, 3000);
      return;
    }

    if (result === "shared") {
      setButtonLabel("Shared");
      setTimeout(() => setButtonLabel("Share go/wordle"), 3000);
    }
  }

  return (
    <button
      onClick={handleShare}
      className={`
        flex items-center gap-2
        px-6 py-3 rounded-lg font-bold text-sm tracking-widest uppercase
        transition-all duration-300
        ${copied
          ? "bg-[var(--color-correct)] text-white scale-105"
          : "bg-white text-black hover:bg-gray-100"
        }
      `}
    >
      <span className="text-base">Link</span>
      <span>{buttonLabel}</span>
    </button>
  );
}
