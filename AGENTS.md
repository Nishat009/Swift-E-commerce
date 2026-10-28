# AGENTS.md

Guidance for AI coding agents (Codex, Claude Code, ...) working in this repository. The full project
rules are in [CLAUDE.md](CLAUDE.md); this file repeats the essentials.

## Project

**SwiftCart**: a full-stack fashion e-commerce shop.

- Frontend: Next.js 16 (App Router), React 19, TypeScript, Tailwind CSS, Zustand, at the repo root.
- Backend: Node.js + Express + MongoDB (Mongoose) REST API in `backend/`.
- Admin panel: `/admin` in the frontend, backed by `/api/admin/*`.

## Rules

- Every route that changes data uses `protect`; admin routes also use `authorize('admin')`. Add a new
  route to `backend/src/config/routePolicy.js` and run `npm --prefix backend run routes:doc`;
  `backend/tests/route-guards.test.js` fails otherwise. See [SECURITY.md](SECURITY.md).
- Validate input with `express-validator` and the `validate` middleware.
- Never commit secrets; add new variables to the matching `.env.example`.
- Run `npm --prefix backend test` after backend changes and `npm run lint` after frontend changes.
- Add a line to [CHANGELOG.md](CHANGELOG.md) for user-visible changes.

<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
