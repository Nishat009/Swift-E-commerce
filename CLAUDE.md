# CLAUDE.md

Guidance for AI coding assistants (Claude Code, Codex, etc.) working in this repository.

## Project

SwiftCart is a full-stack fashion e-commerce shop:

- **Frontend**: Next.js 16 (App Router), React 19, TypeScript, Tailwind CSS, Zustand. Lives at the repo root.
- **Backend**: Node.js + Express + MongoDB (Mongoose). Lives in `backend/`.
- **Admin panel**: part of the frontend at `/admin`, backed by `/api/admin/*`.

Setup steps are in [HowToSetup.md](HowToSetup.md). Feature overview is in [docs/PROJECT_OVERVIEW.md](docs/PROJECT_OVERVIEW.md).

## Commands

```bash
npm install && npm --prefix backend install   # install
npm run dev                                   # frontend :3001 + backend :5000
npm run build                                 # frontend production build
npm run lint                                  # frontend lint
npm --prefix backend test                     # backend tests (node --test)
npm --prefix backend run seed                 # demo data (local DB only)
npm --prefix backend run seed:admin           # demo admin + customer accounts
npm --prefix backend run seed:catalog         # fashion products only, insert-only (safe on a live DB)
npm run package:zip                           # submission ZIP from git HEAD
```

## Layout

| Path | What it holds |
| :--- | :--- |
| `app/` | Next.js routes (shop pages, `admin/`, `dashboard/`, `api/` proxy routes) |
| `components/` | UI by area: `admin`, `auth`, `product`, `dressing-room`, `layout`, `ui`, ... |
| `lib/`, `services/`, `hooks/`, `context/`, `stores/` | API client, helpers, state |
| `backend/server.js` | Backend entry point |
| `backend/src/app.js` | Express app and route mounting |
| `backend/src/routes/` | One router per resource |
| `backend/src/controllers/` | Route handlers |
| `backend/src/models/` | Mongoose models (the database schema) |
| `backend/src/middleware/` | `protect` (auth), `authorize` (roles), validation, uploads, errors |
| `backend/scripts/` | Seed and maintenance scripts |
| `backend/tests/` | Backend tests |

## Rules

- **Auth on every mutating route.** Any route that creates, updates or deletes data must use `protect`, and admin routes must also use `authorize('admin')`. Public exceptions (login, register, contact form, newsletter, chat, back-in-stock notify, Stripe webhook) are deliberate and rate-limited.
- **Validate input** with `express-validator` rules and the `validate` middleware.
- **Never commit secrets.** Real values go in `backend/.env` / `.env.local` (gitignored). Add new variables to the matching `.env.example` with a blank or placeholder value.
- **Prices are stored in USD**; bKash converts using `BDT_PER_USD`.
- Seed scripts wipe data; keep the `assertSafeToSeed` guard in any new script.
- Match the surrounding code style. Keep changes focused, and run `npm --prefix backend test` after backend changes.
- Add a line to [CHANGELOG.md](CHANGELOG.md) for user-visible changes.
