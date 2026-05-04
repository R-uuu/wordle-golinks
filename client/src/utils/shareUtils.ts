import type { GuessEntry } from "../hooks/useWordle";

const EMOJI: Record<string, string> = {
  correct: "🟩",
  present: "🟨",
  absent: "⬛",
};

export function buildShareText(
  guessHistory: GuessEntry[],
  didWin: boolean,
  gameUrl: string
): string {
  const date = new Date().toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });

  const score = didWin ? `${guessHistory.length}/5` : "X/5";

  const grid = guessHistory
    .map((entry) => entry.results.map((r) => EMOJI[r.status] ?? "⬛").join(""))
    .join("\n");

  return [
    `Wordle (go/wordle) - ${date}`,
    score,
    "",
    grid,
    "",
    gameUrl,
  ].join("\n");
}

export async function shareResult(
  text: string
): Promise<"shared" | "copied" | "error"> {
  const navWithUAData = navigator as Navigator & {
    userAgentData?: { mobile?: boolean };
  };

  const isMobile =
    Boolean(navWithUAData.userAgentData?.mobile) ||
    /Android|iPhone|iPad|iPod|Mobile/i.test(navigator.userAgent);

  // Desktop/Windows: use clipboard first so users are never blocked by the OS share sheet.
  if (!isMobile) {
    try {
      await navigator.clipboard.writeText(text);
      return "copied";
    } catch {
      return "error";
    }
  }

  // Mobile: prefer native share sheet, then fall back to clipboard.
  if (navigator.share) {
    try {
      await navigator.share({ text });
      return "shared";
    } catch {
      // User may cancel share; fall through to clipboard fallback.
    }
  }

  try {
    await navigator.clipboard.writeText(text);
    return "copied";
  } catch {
    return "error";
  }
}
