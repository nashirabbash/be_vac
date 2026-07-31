# CLAUDE.md

These rules apply to every task in this project unless explicitly overridden.
Bias: caution over speed on non-trivial work. Use judgment on trivial tasks.

## Rule 1 — Think Before Coding

State assumptions explicitly. If uncertain, ask rather than guess.
Present multiple interpretations when ambiguity exists.
Push back when a simpler approach exists.
Stop when confused. Name what's unclear.

## Rule 2 — Simplicity First

Minimum code that solves the problem. Nothing speculative.
No features beyond what was asked. No abstractions for single-use code.
Test: would a senior engineer say this is overcomplicated? If yes, simplify.

## Rule 3 — Surgical Changes

Touch only what you must. Clean up only your own mess.
Don't "improve" adjacent code, comments, or formatting.
Don't refactor what isn't broken. Match existing style.

## Rule 4 — Goal-Driven Execution

Define success criteria. Loop until verified.
Don't follow steps. Define success and iterate.
Strong success criteria let you loop independently.

## Rule 5 — Use the model only for judgment calls

Use me for: classification, drafting, summarization, extraction.
Do NOT use me for: routing, retries, deterministic transforms.
If code can answer, code answers.

## Rule 6 — Token budgets are not advisory

Per-task: 4,000 tokens. Per-session: 30,000 tokens.
If approaching budget, summarize and start fresh.
Surface the breach. Do not silently overrun.

## Rule 7 — Surface conflicts, don't average them

If two patterns contradict, pick one (more recent / more tested).
Explain why. Flag the other for cleanup.
Don't blend conflicting patterns.

## Rule 8 — Read before you write

Before adding code, read exports, immediate callers, shared utilities.
"Looks orthogonal" is dangerous. If unsure why code is structured a way, ask.

## Rule 9 — Tests verify intent, not just behavior

Tests must encode WHY behavior matters, not just WHAT it does.
A test that can't fail when business logic changes is wrong.

## Rule 10 — Checkpoint after every significant step

Summarize what was done, what's verified, what's left.
Don't continue from a state you can't describe back.
If you lose track, stop and restate.

## Rule 11 — Match the codebase's conventions, even if you disagree

Conformance > taste inside the codebase.
If you genuinely think a convention is harmful, surface it. Don't fork silently.

## Rule 12 — Fail loud

"Completed" is wrong if anything was skipped silently.
"Tests pass" is wrong if any were skipped.
Default to surfacing uncertainty, not hiding it.

## Rule 13 — Always Apply Clean Code Principles

Apply clean code principles in every piece of code you write.

- Simplicity (KISS): Keep logic straightforward and avoid unnecessary complexity. Choose the easiest solution to understand and maintain.
- Readability: Use clear, descriptive names for variables and functions, and keep formatting and indentation consistent.
- Single Responsibility (SRP): Each function, class, or module should have one responsibility and one reason to change.
- Don't Repeat Yourself (DRY): Avoid duplication by extracting repeated logic into reusable functions or modules.
- Small Functions: Keep functions short and focused on a single task to improve clarity and testability.
- Minimal Side Effects: Avoid changing state outside a function's scope unless that behavior is intentional.
- YAGNI: Do not add functionality unless it is immediately needed. Avoid over-engineering.
- Consistency: Follow the codebase's existing conventions and style so the project stays easy to work on.

## Rule 14 - dont use dash for comment

dont write comment use dash like this
`# ── Preprocessing ──────────────────────────────────────────────────────────────`

better write like this
`#PreProcessing`

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Stack

- **Runtime**: Bun (TypeScript execution environment)
- **Framework**: Elysia (lightweight web framework for Bun)
- **Database**: PostgreSQL via Prisma ORM (`@prisma/adapter-pg`)
- **Schema validation**: TypeBox (Elysia native schema validation via `t`)
- **Authentication**: JWT (`@elysiajs/jwt`) & Bun's native `Bun.password.hash/verify` (bcrypt)
- **Logging**: Pino (`pino` / `pino-pretty`) with custom `loggerMiddleware.ts`
- **API Documentation**: Swagger (`@elysiajs/swagger`) at `/docs`

## Development Commands

```bash
# Start dev server (hot reload on file changes)
bun run dev

# Run tests
bun test
bun test --coverage

# Prisma commands
bunx prisma migrate dev      # Create + apply migration
bunx prisma studio           # Open GUI for database
bunx prisma generate         # Regenerate client types to src/generated/prisma
```

## Architecture

### Project Structure

```text
be_vac/
├── prisma/
│   └── schema.prisma        # Database schema (PostgreSQL via Prisma ORM)
├── src/
│   ├── db.ts                # Database connection & Prisma Client initialization
│   ├── index.ts             # Entry point — Elysia initialization, middleware & routes
│   ├── logger.ts            # Pino logger instance
│   ├── generated/           # Generated Prisma client types (src/generated/prisma)
│   ├── middleware/
│   │   ├── auth.ts          # Authentication middleware
│   │   └── loggerMiddleware.ts # HTTP request/response logger middleware
│   ├── routes/              # HTTP handlers, Elysia decorators, TypeBox validation
│   │   ├── auth.ts          # /api/auth (/register, /login, /logout)
│   │   ├── device.ts        # /api/device (/bind, /live-locations) & /api/devices
│   │   └── therapy.ts       # /api/therapy-sessions (POST, GET)
│   ├── services/            # Business logic, Prisma DB calls
│   │   ├── auth.ts
│   │   ├── device.ts
│   │   └── therapy.ts
│   └── utils/
│       └── qrResolver.ts    # QR payload resolver utility
├── tests/                   # Unit and integration tests
│   ├── routes/              # Route integration tests
│   ├── services/            # Service unit tests
│   ├── setup.ts
│   └── utils.ts             # Test helpers & mock Prisma client
└── docs/
    └── agents/              # Domain, issue tracker, and triage docs
```

### Three-layer design

- **Routes** (`src/routes/`) — HTTP handlers, Elysia decorators, request validation with TypeBox (`t`)
- **Services** (`src/services/`) — Business logic, Prisma DB calls, error handling
- **Database** (`prisma/schema.prisma`) — Database schema definitions and client

## Entry point

`src/index.ts` initializes Elysia, registers CORS, logger middleware, Swagger documentation (`/docs`), registers all routes under `/api/` prefix, and listens on port 3000.

## Agent skills

### Issue tracker

Issues are tracked in GitHub Issues. See `docs/agents/issue-tracker.md`.

### Triage labels

Using standard triage labels. See `docs/agents/triage-labels.md`.

### Domain docs

Single-context repository. See `docs/agents/domain.md`.
