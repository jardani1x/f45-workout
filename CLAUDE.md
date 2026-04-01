# CLAUDE.md — AI Assistant Guide for f45-workout

## Overview

This repository contains a **F45-style interval workout timer** web app and a **Claude AI agent workspace**. The app is a single-file vanilla JavaScript application deployed as a static site (GitHub Pages).

---

## Repository Structure

```
f45-workout/
├── index.html              # PRIMARY: F45 workout timer app (718 lines, self-contained)
├── notepad.html            # Secondary: Windows 95/98-style nostalgic notepad
│
├── memory/                 # AI agent daily memory logs
│   └── YYYY-MM-DD.md       # Daily session notes
│
├── qin_history_book/       # Qin Dynasty book project (31 markdown chapters)
│   ├── book_blueprint.md
│   └── chapter_01.md … chapter_31.md
│
├── utility-calculator/
│   └── style.css           # Incomplete standalone calculator styles
│
# AI Agent Framework files
├── AGENTS.md               # Workspace guidelines and memory management rules
├── SOUL.md                 # Agent identity, values, and behavioral principles
├── IDENTITY.md             # Agent profile template (fill on first onboarding)
├── BOOTSTRAP.md            # First-run setup conversation guide
├── HEARTBEAT.md            # Scheduled periodic check configuration
├── TOOLS.md                # Local infrastructure/tool notes template
├── USER.md                 # User profile template
│
└── .openclaw/
    └── workspace-state.json  # Claude Code workspace bootstrap metadata
```

---

## Primary App: F45 Workout Timer (`index.html`)

### Architecture

- **Single-file app** — all HTML, CSS, and JavaScript in one file. No build step.
- **No dependencies** — strictly vanilla JavaScript. No frameworks, no npm.
- **No package.json** — this is not a Node project. Do not create one.
- Wrapped in an IIFE with `'use strict'` for scope isolation.

### Exercise System

- **6 categories:** squat, lunge, hinge, push, pull, carry
- **4 exercises per category** (24 total in library)
- **4 sets per workout**, 6 exercises per set (24 total per session)
- **Daily seeded randomization** — exercises are deterministic for a given calendar day (same exercises if you reload on the same day, new exercises the next day)
- Sets 1–2 use the same exercise selection; Sets 3–4 use a different selection

### State Machine

```javascript
const state = {
  running: boolean,         // Is the timer currently ticking?
  currentSet: 0-3,          // Active set index (0-indexed)
  currentExercise: 0-5,     // Active exercise within the set (0-indexed)
  isWork: boolean,          // true = work phase, false = rest phase
  timeLeft: number          // Seconds remaining in the current phase
}
```

### Timing Defaults (configurable via Settings overlay)

| Setting   | Default  |
|-----------|----------|
| Work time | 40s      |
| Rest time | 20s      |
| Long rest | 120s     |

Settings are persisted to `localStorage['f45Prefs']`.

### Key Functions

- `seededRandom(seed)` — deterministic PRNG using the seed
- `getTodaySeed()` — generates a date-based seed for daily randomization
- `selectWorkout()` — builds the full 4-set workout plan for today
- `renderWorkout()` — renders the exercise list DOM
- `tick()` — called every second via `setInterval`; handles phase transitions
- `playBeep(freq, dur)` — Web Audio API beep
- `vibrate(pattern)` — Vibration API haptic feedback

### UI Sections

1. **Hero (sticky):** Phase label (WORK / REST / COMPLETE), large timer, progress bar
2. **Controls:** Back · Start/Pause · Next · Reset · Settings (gear icon)
3. **Next Up card:** Shows the next exercise during rest phases
4. **Workout list:** All 24 exercises, grouped by set, current exercise highlighted
5. **Settings overlay:** Work/rest time inputs, sound & vibration toggles
6. **Completion overlay:** "Workout Complete!" shown at end of 4 sets

### CSS Custom Properties

```css
--bg: #0a0a0a
--text: #f0f0f0
--blue: #3b82f6      /* Work phase accent */
--orange: #f97316    /* Rest phase accent */
--green: #22c55e     /* Completion accent */
```

---

## Development Conventions

### Code Style

- Vanilla JS only — no libraries, no imports
- `'use strict'` at the top of the IIFE
- `const` by default; `let` when reassignment is needed. Avoid `var`.
- Do **not** redeclare variables already declared in the outer IIFE scope. This was the cause of a prior `SyntaxError` (#68d3ec4).
- DOM manipulation via `document.getElementById`, `element.classList`, `element.textContent`

### Variable Declaration Rule (Critical)

When adding new variables, check if they are already declared in the enclosing IIFE scope. Duplicate `let`/`const` declarations cause a `SyntaxError` at parse time and break the entire app. The bug was fixed in commit `68d3ec4`.

### Randomization

The seeded PRNG must remain deterministic — do not replace it with `Math.random()`. Daily consistency is a design requirement.

### No Build Process

- Edit `index.html` directly. There is no transpilation, minification, or bundling.
- Testing is manual (open in browser, interact with the timer).
- Deployment: push to `main` → GitHub Pages serves `index.html` automatically.

### Audio

- Uses the Web Audio API (`AudioContext`). Do not use `<audio>` tags or external sound files.
- Beep frequencies escalate during the 3-2-1 countdown for urgency.

---

## Deployment

- **Platform:** GitHub Pages (`jardani1x.github.io/f45-workout/`)
- **Trigger:** Any push to `main` auto-deploys
- **No CI/CD config** — no `.github/workflows/` exists; Pages is configured via repo settings

---

## Git Workflow

- Feature branches follow the pattern `claude/<description>-<hash>` (e.g. `claude/add-claude-documentation-eBhqS`)
- Commits use conventional-style messages: `feat:`, `fix:`, `refactor:`, `docs:`
- Push to the feature branch, not to `main`, unless explicitly asked to merge

---

## AI Agent Workspace

This repo doubles as a Claude AI agent workspace for user **Jardani** (Singapore timezone).

### Key Agent Files

| File           | Purpose |
|----------------|---------|
| `SOUL.md`      | Agent identity, values, behavioral principles. Read this first. |
| `AGENTS.md`    | Workspace rules, memory management, group chat behavior, safety guidelines |
| `HEARTBEAT.md` | Configured for morning/afternoon/evening checks (stocks, crypto, weather) |
| `IDENTITY.md`  | Agent profile — fill in on first onboarding |
| `BOOTSTRAP.md` | First-run setup script for new agent instances |
| `USER.md`      | User profile template |
| `TOOLS.md`     | Infrastructure/tool notes |

### Memory System

- Daily logs go in `memory/YYYY-MM-DD.md`
- Curated long-term memory lives in `MEMORY.md` (create if not present)
- On session start: read `SOUL.md`, `USER.md`, and recent `memory/` files

### Heartbeat Schedule (Jardani)

| Time (SGT)  | Tasks |
|-------------|-------|
| 8–9 am      | S&P 500, top 10 stocks, BTC & ETH prices |
| 1–2 pm      | Singapore weather, important emails |
| 6–7 pm      | Crypto prices (BTC, ETH) |
| 11 pm–8 am  | Quiet hours — skip checks |

---

## Secondary Content: Qin Dynasty Book

- 31 chapters in `qin_history_book/`, compiled versions at repo root (`qin_history_book_full.md`, `qin_history_full_*.md`)
- Multiple EPUB exports (`qin_dynasty.epub`, versioned variants)
- This is a standalone content project — edits here do not affect the workout app

---

## What NOT to Do

- Do not add `npm`, `package.json`, or any build tooling
- Do not introduce JavaScript frameworks (React, Vue, etc.)
- Do not use `Math.random()` in place of `seededRandom()` for exercise selection
- Do not declare variables already declared in the IIFE scope (`WORK_TIME`, `REST_TIME`, `LONG_REST_TIME`, `seededRandom`, etc.)
- Do not push directly to `main` without explicit user instruction
- Do not add external CDN links or third-party scripts
