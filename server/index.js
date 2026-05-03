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

// Load word list once at startup — no database needed
const WORDS = JSON.parse(
  readFileSync(join(__dirname, "data/words.json"), "utf-8")
);

// ── Middleware ────────────────────────────────────────────────────────────────

app.use(express.json());

app.use(
  cors({
    // In production, ALLOWED_ORIGIN will be your deployed Vercel URL.
    // In development, it's localhost:5173 (set in .env).
    origin: process.env.ALLOWED_ORIGIN,
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
  return WORDS[dayIndex % WORDS.length];
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

  // Track which answer letters are still "available" to match
  const answerPool = answer.split("");

  // First pass: find correct positions (green)
  for (let i = 0; i < 5; i++) {
    if (guess[i] === answerPool[i]) {
      result[i].status = "correct";
      answerPool[i] = null; // consume this letter
    }
  }

  // Second pass: find present letters in wrong positions (yellow)
  for (let i = 0; i < 5; i++) {
    if (result[i].status === "correct") continue;

    const poolIndex = answerPool.indexOf(guess[i]);
    if (poolIndex !== -1) {
      result[i].status = "present";
      answerPool[poolIndex] = null; // consume so it can't match twice
    }
  }

  return result;
}

// ── Routes ────────────────────────────────────────────────────────────────────

// Health check — useful for Railway/Render uptime monitoring
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

/**
 * GET /api/answer
 * Returns today's answer. The spec explicitly requires this endpoint.
 * Called by the frontend when the game ends to reveal the word.
 */
app.get("/api/answer", (req, res) => {
  res.json({ answer: getDailyWord() });
});

/**
 * POST /api/guess
 * Body: { guess: "crane" }
 * Returns the evaluation array for that guess.
 */
app.post("/api/guess", (req, res) => {
  const { guess } = req.body;

  // Input validation
  if (!guess || typeof guess !== "string" || guess.length !== 5) {
    return res.status(400).json({ error: "Guess must be exactly 5 letters." });
  }

  const answer = getDailyWord();
  const result = evaluateGuess(guess.toLowerCase(), answer);
  const isCorrect = result.every((r) => r.status === "correct");

  res.json({
    result,
    isCorrect,
    // Only reveal the answer if the guess is correct — keeps it honest
    ...(isCorrect && { answer }),
  });
});

// ── Start ─────────────────────────────────────────────────────────────────────

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
  console.log(`Today's word: ${getDailyWord()}`);
});