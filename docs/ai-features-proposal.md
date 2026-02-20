# AI-Powered Features Proposal

## Overview

The following proposals describe five AI-powered features that would meaningfully enhance the Game Library platform. Each is designed to fit the existing Next.js / Firebase / TypeScript stack, bring genuine value to real users, and demonstrate modern AI engineering patterns.

---

## Feature 1 – In-Game AI Hint Assistant (Game Copilot)

**Difficulty**: Medium

### User Problem

Players get frustrated when they run out of ideas mid-game. In _Up and Down_ (number guessing) and _Treasure Hunt_, there is no feedback beyond raw "higher/lower" or tile reveal mechanics. New players often quit rather than persist.

### UX

A small **💡 Hint** button appears in the bottom corner of each eligible game. Clicking it opens a compact overlay that displays a contextually relevant tip generated from the current game state:

- _Up and Down_: "Your remaining attempts suggest a binary-search strategy. Try 62 next."
- _Treasure Hunt_: "Three of the four corners are still uncovered — corner tiles statistically reduce your expected moves by 18%."

The button is intentionally unobtrusive so it does not break the game flow; players choose when to ask for help.

### Technical Design

1. Add a `/api/ai/hint` POST route that accepts a `gameId` and a serialised `gameState` object.
2. On the server, build a concise prompt (< 400 tokens) from the game state and call the LLM.
3. Return the hint text. Cache identical game-state hashes in memory (LRU, 60 s TTL) to avoid duplicate calls on quick re-clicks.
4. Each game component gains a thin `useHint(gameState)` hook that calls the route and manages loading / error state.

```
POST /api/ai/hint
Body: { gameId: "up-and-down", gameState: { min, max, remainingAttempts, guesses } }
Response: { hint: "..." }
```

Rate-limit per IP (e.g., 10 hints / 10 min via an in-memory sliding window or Upstash Redis) to control API costs.

### Suggested Stack

| Layer | Technology |
|---|---|
| LLM | OpenAI `gpt-4o-mini` (cheap, fast, sufficient reasoning) |
| API key security | Server-side Next.js API route (key never reaches client) |
| Rate limiting | `@upstash/ratelimit` + Upstash Redis (Vercel-friendly serverless) |
| Client hook | Custom React hook `useHint` |

---

## Feature 2 – Semantic Game Search

**Difficulty**: Small

### User Problem

The current Fuse.js fuzzy search only matches against game titles and descriptions by exact token overlap. A user typing _"something relaxing"_, _"brain teaser"_, or _"play with friends"_ gets no results, even though matching games exist.

### UX

The existing search bar is unchanged visually. When the query does not match any game title or tag exactly, the system falls back to an embedding-based similarity search and returns the closest games with a subtle **"Related results"** label.

### Technical Design

1. **Offline pre-computation** – run a one-time script (`scripts/generate-embeddings.ts`) that embeds each game's title + description + tags using the OpenAI Embeddings API and writes the vectors to `app/data/game-embeddings.json`.
2. **Client-side similarity** – load the small JSON (≈ 4 games × 1 536 floats ≈ 50 KB) once and keep it in memory. On query change, embed the query with the same model via a lightweight `/api/ai/embed` route, then compute cosine similarity against stored vectors in the browser.
3. Augment the existing `SearchBar` component to call the embed route when Fuse returns zero results and display semantic matches.

Since the game catalogue is tiny (currently 4 games), the entire vector search runs in the browser with no additional infrastructure beyond the embedding API call.

### Suggested Stack

| Layer | Technology |
|---|---|
| Embeddings model | OpenAI `text-embedding-3-small` (cost-effective, 1 536-dim) |
| Storage | Static `game-embeddings.json` committed to the repo |
| Similarity | Cosine similarity computed in-browser (plain TypeScript) |
| Offline script | `ts-node` one-time generation script |

---

## Feature 3 – Personalised Game Recommendations

**Difficulty**: Small

### User Problem

After finishing a game, players have no guidance on what to try next. With no login system, there is no play history to drive traditional collaborative filtering.

### UX

After a game session ends (win, loss, or manual exit) a non-blocking **"You might enjoy…"** banner slides up at the bottom of the game page showing 1–2 tiles of recommended games. The banner can be dismissed. Recommendations update each session.

### Technical Design

1. On game-end, record the completed `gameId` in `sessionStorage` (no PII, no login needed).
2. Load the pre-computed game embeddings from Feature 2 (`game-embeddings.json`).
3. Compute cosine similarity between the just-played game's embedding and all others; exclude already-played games in the current session.
4. Display the top-1 or top-2 results.

For a richer signal over time: fire an anonymous event to a Firestore `analytics/gameEvents` counter (gameId → playCount). Blend embedding similarity (70 %) with normalised play-count popularity (30 %) to surface both "similar" and "trending" games. No personal data is stored.

### Suggested Stack

| Layer | Technology |
|---|---|
| Embeddings | Reuse vectors from Feature 2 (zero extra cost) |
| Session state | `sessionStorage` (no login required) |
| Popularity signal | Firestore anonymous play-count counters (optional) |
| UI | Existing game-tile component reused in a slide-up panel |

---

## Feature 4 – AI-Powered Leaderboard Score Validation

**Difficulty**: Medium

### User Problem

Public leaderboards without authentication are trivial to abuse. Anyone can submit an arbitrarily high score (e.g., 9 999 consecutive wins in Rock-Paper-Scissors), polluting the board and demotivating honest players.

### UX

No visible change for legitimate players — their scores are accepted and posted normally. Suspicious submissions see a brief **"Score verification required"** step (a lightweight proof-of-play challenge) before the record is saved. Blocked scores show a friendly error message.

### Technical Design

**Layer 1 – Deterministic rules** (no AI cost, runs first):
- `rock-paper-scissors`: maximum possible score in a session is bounded by elapsed time. Reject scores that imply < 800 ms per round average.
- `47` game: the reported stop-time must be within the physically possible range.
- Reject scores that are statistical outliers (> 4 σ above the current leaderboard mean).

**Layer 2 – LLM-assisted contextual reasoning** (called only when Layer 1 flags a borderline case):
- Construct a brief prompt: game metadata, current top-10 distribution, submitted score, and session metadata (time spent on page).
- Ask the model to reason about plausibility and return `{ verdict: "accept" | "review" | "reject", reasoning: string }`.
- Log borderline cases to a Firestore `admin/flaggedScores` collection for manual review.

```
POST /api/scoreboard/save-score
→ validateScore(gameId, score, sessionMetadata)
   → Layer1Rules.check()  // fast, no cost
   → if (borderline) LLMValidator.assess()  // only when needed
→ accept / reject / flag
```

### Suggested Stack

| Layer | Technology |
|---|---|
| Rule engine | Pure TypeScript, inline in the save-score API route |
| LLM reasoning | OpenAI `gpt-4o-mini` (borderline cases only, low cost) |
| Flagged scores | Firestore `admin/flaggedScores` collection |
| Session proof | Timestamp + page-load token (signed HMAC) |

---

## Feature 5 – AI Score Narrator & Social Sharing

**Difficulty**: Small

### User Problem

After achieving a notable score, players have no compelling reason to share it. Generic "Your score is X" messages do not drive social engagement or repeat visits.

### UX

When a player finishes a game with a score that ranks in the top 10 (or beats their session best), a **"Share your result"** card appears. It displays an AI-generated one-to-two sentence message that is witty, personalised, and game-specific:

> _"You stopped the timer at 47.023 s — just 23 ms off perfection. Your internal clock is eerily good. Can anyone beat this?"_

> _"12 consecutive Rock-Paper-Scissors wins against the computer. Either you're psychic, or you've cracked the algorithm 🤔"_

A **Copy** button copies the text + URL to the clipboard. An optional **Share on X / Twitter** button is provided.

### Technical Design

1. Add a `/api/ai/narrate` POST route accepting `{ gameId, score, leaderboardRank, gameContext }`.
2. Build a short prompt (< 300 tokens) with game-specific context and call the LLM.
3. Return the generated text. Cache results keyed on `(gameId, score, rank)` with a short TTL (5 min) to handle rapid retries without extra API calls.
4. Render the card in the existing game-over flow alongside the name-input field.

```
POST /api/ai/narrate
Body: { gameId: "47", score: 47.023, leaderboardRank: 1 }
Response: { message: "You stopped the timer at 47.023 s — just 23 ms off perfection…" }
```

### Suggested Stack

| Layer | Technology |
|---|---|
| LLM | OpenAI `gpt-4o-mini` |
| Response caching | In-memory LRU cache (server-side, 5 min TTL) |
| Sharing | `navigator.clipboard.writeText` + Web Share API |
| UI | New `ShareCard` component (plain Tailwind) |

---

## Summary Table

| # | Feature | Pattern | Difficulty | Primary Value |
|---|---|---|---|---|
| 1 | In-Game AI Hint Assistant | LLM + prompt engineering | Medium | Reduces frustration, improves retention |
| 2 | Semantic Game Search | Embeddings + cosine similarity | Small | Better game discovery |
| 3 | Personalised Game Recommendations | Embeddings + session state | Small | Increases games played per visit |
| 4 | AI-Powered Score Validation | Rule engine + LLM reasoning | Medium | Protects leaderboard integrity |
| 5 | AI Score Narrator & Social Sharing | LLM + prompt engineering | Small | Drives social sharing and return visits |

## Recommended Implementation Order

1. **Feature 2** (Semantic Search) – smallest scope, adds immediate value, and produces the game-embeddings artefact that Feature 3 depends on.
2. **Feature 3** (Recommendations) – reuses embeddings from Feature 2; very low incremental effort.
3. **Feature 5** (Score Narrator) – standalone, no dependencies, high visibility impact.
4. **Feature 1** (Hint Assistant) – requires per-game prompt engineering and rate-limiting infrastructure.
5. **Feature 4** (Score Validation) – most complex; build after the LLM API infrastructure from Features 1 and 5 is in place.
