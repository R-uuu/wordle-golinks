import "dotenv/config";
import express from "express";
import cors from "cors";
import { readFileSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

// ── Setup ────────────────────────────────────────────────────────────────────

const __dirname = dirname(fileURLToPath(import.meta.url));
const app = express();
const PORT = process.env.PORT || 3001;

const rawWordList = JSON.parse(
  readFileSync(join(__dirname, "data/words.json"), "utf-8")
);

const WORD_LIST = Array.from(
  new Set(
    rawWordList
      .filter((word) => typeof word === "string")
      .map((word) => word.toLowerCase().trim())
      .filter((word) => /^[a-z]{5}$/.test(word))
  )
);

const ANSWER_POOL = WORD_LIST;
const VALID_WORDS = new Set(WORD_LIST);

// ── Middleware ────────────────────────────────────────────────────────────────

app.use(express.json());

app.use(
  cors({
    origin: process.env.ALLOWED_ORIGIN ?? "*",
    methods: ["GET", "POST"],
  })
);

// ── Utilities ─────────────────────────────────────────────────────────────────

/**
 * Deterministically picks today's word using a date-based index.
 * Everyone who visits today gets the same word — no database required.
 * This is the same pattern the NYT Wordle uses.
 */
function getDailyWord() {
  const epoch = new Date("2025-01-01").getTime();
  const today = new Date().setHours(0, 0, 0, 0);
  const dayIndex = Math.floor((today - epoch) / 86_400_000);
  return ANSWER_POOL[dayIndex % ANSWER_POOL.length];
}

/**
 * Core Wordle algorithm.
 * Returns an array of result objects: { letter, status }
 * Status is one of: "correct" | "present" | "absent"
 */
function evaluateGuess(guess, answer) {
  const result = Array(5).fill(null).map((_, i) => ({
    letter: guess[i].toUpperCase(),
    status: "absent",
  }));

  const answerPool = answer.split("");

  for (let i = 0; i < 5; i++) {
    if (guess[i] === answerPool[i]) {
      result[i].status = "correct";
      answerPool[i] = "#";
    }
  }

  for (let i = 0; i < 5; i++) {
    if (result[i].status === "correct") continue;
    const poolIndex = answerPool.indexOf(guess[i]);
    if (poolIndex !== -1) {
      result[i].status = "present";
      answerPool[poolIndex] = "#";
    }
  }

  return result;
}

async function isValidWord(word) {
  if (VALID_WORDS.has(word)) return true;

  try {
    const response = await fetch(
      `https://api.dictionaryapi.dev/api/v2/entries/en/${word}`
    );
    return response.ok;
  } catch {
    console.warn("Dictionary API unreachable, allowing guess.");
    return true;
  }
}

// ── Routes ────────────────────────────────────────────────────────────────────

// Health check — useful for Railway/Render uptime monitoring
app.get("/api/health", (_req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

/**
 * GET /api/answer
 * Returns today's answer. The spec explicitly requires this endpoint.
 * Called by the frontend when the game ends to reveal the word.
 */
app.get("/api/answer", (_req, res) => {
  res.json({ answer: getDailyWord() });
});

/**
 * POST /api/guess
 * Body: { guess: "crane" }
 * Returns the evaluation array for that guess.
 */
app.post("/api/guess", async (req, res) => {
  const { guess } = req.body;

  if (!guess || typeof guess !== "string") {
    return res.status(400).json({ error: "Guess is required." });
  }

  const normalized = guess.toLowerCase().trim();

  if (normalized.length !== 5) {
    return res.status(400).json({ error: "Guess must be exactly 5 letters." });
  }

  if (!/^[a-z]+$/.test(normalized)) {
    return res.status(400).json({ error: "Guess must contain only letters." });
  }

  const valid = await isValidWord(normalized);
  if (!valid) {
    return res.status(422).json({ error: "Not a valid word." });
  }

  const answer = getDailyWord();
  const result = evaluateGuess(normalized, answer);
  const isCorrect = result.every((r) => r.status === "correct");

  res.json({
    result,
    isCorrect,
    ...(isCorrect && { answer }),
  });
});

// ── Start ─────────────────────────────────────────────────────────────────────

app.listen(PORT, () => {
  console.log(`Server running -> http://localhost:${PORT}`);
  console.log(`Today's word -> ${getDailyWord()}`);
  console.log(`Word pool size -> ${ANSWER_POOL.length} words`);
});