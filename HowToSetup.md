# How to Set Up SwiftCart

These steps take a clean machine to a running shop with demo data.

## Quick start (in order)

Needs **Node.js 22+** (`.nvmrc` says 22; both `package.json` files declare `"engines": { "node": ">=22" }`) and **MongoDB 6+**.

```bash
# 1. install (root = frontend, backend/ = API)
npm run install:all                     # = npm install && npm --prefix backend install

# 2. environment
cp backend/.env.example backend/.env    # Windows: copy
#    In backend/.env set JWT_SECRET and JWT_REFRESH_SECRET (32+ random chars each) and
#    MONGO_URI (default mongodb://127.0.0.1:27017/swiftcart, or your Atlas URI)

# 3. database
npm --prefix backend run db:init        # collections + indexes, deletes nothing
npm --prefix backend run seed           # demo catalog (local DB only)
npm --prefix backend run seed:admin     # demo admin + customer, prints the password

# 4. run
npm run dev                             # shop http://localhost:3001, API http://localhost:5000/api

# 5. check
npm --prefix backend test               # 81 tests, needs MongoDB
```

The submission ZIP is built by `npm run package:zip` from the files tracked in git, so it never contains
`node_modules`, `.next`, build output or `.env` files. Step 2 above recreates them.

The sections below explain each step.

## 1. Prerequisites

- **Node.js 22 or newer** (includes npm), the current LTS line. Check with `node -v`. Download: https://nodejs.org. The repo has an `.nvmrc`, so `nvm use` picks the right version.
- **MongoDB 6 or newer** (MongoDB 8 recommended), running locally on `mongodb://127.0.0.1:27017`, or a MongoDB Atlas connection string. Download: https://www.mongodb.com/try/download/community
  A plain local `mongod` is enough. Account deletion uses a MongoDB transaction when the server supports one (Atlas, or any replica set); on a standalone server `backend/src/utils/transaction.js` detects that and runs the same writes one after another, so nothing needs configuring.

No other services are required. Payments, Google sign-in, email and image hosting are optional and stay off until you add their keys.

### Start MongoDB and check it is running

| System | Start MongoDB |
| :--- | :--- |
| Windows | Installed as a service by default. Otherwise run `net start MongoDB` in an admin terminal |
| macOS (Homebrew) | `brew services start mongodb-community` |
| Linux | `sudo systemctl start mongod` |
| Any (manual) | `mongod --dbpath <an empty folder>` |

Check the connection (this prints `{ ok: 1 }`):

```bash
mongosh "mongodb://127.0.0.1:27017" --eval "db.runCommand({ ping: 1 })"
```

Using MongoDB Atlas instead? Put its connection string in `MONGO_URI` (step 3) and skip this check.

## 2. Install packages

From the project root:

```bash
npm install
npm --prefix backend install
```

On Windows PowerShell, if `npm` is blocked, use `npm.cmd` instead.

## 3. Configure the environment

```bash
cp backend/.env.example backend/.env
cp .env.example .env.local        # optional, frontend
```

On Windows, use `copy` instead of `cp`.

Open `backend/.env` and fill in the two required values. Each must be a random string of **at least 32 characters**:

```env
JWT_SECRET=<random string, 32+ characters>
JWT_REFRESH_SECRET=<a different random string, 32+ characters>
```

The backend **refuses to start** if either is missing or shorter than 32 characters. You can generate one with:

```bash
node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"
```

If MongoDB is not at the default local address, also change `MONGO_URI`. To choose the demo accounts' password, set `SEED_PASSWORD` (8+ characters); otherwise the seed prints a random one. Leave everything else as it is.

Optional, but required in production if you want to save payment gateway keys from **Admin → Payment Settings**: set `PAYMENT_SETTINGS_KEY` to a third random string (32+ characters, same command as above). Locally it falls back to `JWT_SECRET`.

The frontend's `.env.local` is optional: by default the frontend talks to the backend at `http://localhost:5000/api` (`BACKEND_API_URL`).

Which file each part reads:

| File | Read by | Must contain |
| :--- | :--- | :--- |
| `backend/.env` (from `backend/.env.example`) | Express API on port **5000** (`backend/server.js`) | `JWT_SECRET`, `JWT_REFRESH_SECRET`; `MONGO_URI` if not local; `FRONTEND_URL=http://localhost:3001` (CORS) |
| `.env.local` (from `.env.example`) | Next.js frontend on port **3001** | Nothing locally. In production: `BACKEND_API_URL=https://<your-api>/api` |

The browser never calls the API directly: it calls the frontend's same-origin proxy (`/api/backend/*`), which forwards to `BACKEND_API_URL`, so there is no `NEXT_PUBLIC_` API variable.

For a production backend (`NODE_ENV=production`) the server also refuses to start without `MONGO_URI` and `FRONTEND_URL`, or when `DEMO_PASSWORD` is set.

## 4. Create the database and load demo data

There is no separate "create database" step: MongoDB creates the `swiftcart` database the first time it is written to. The schema is defined by the Mongoose models in `backend/src/models/`. To create every collection and index up front (safe to re-run, deletes nothing):

```bash
npm --prefix backend run db:init
```

Load the demo data:

```bash
npm --prefix backend run seed          # categories, products, coupons, demo content
npm --prefix backend run seed:admin    # demo admin and customer accounts
npm --prefix backend run seed:catalog  # fashion products only; adds what is missing, deletes nothing
node backend/scripts/seed_campaigns.js # optional: lucky-draw campaigns
```

`seed:catalog` never deletes, so it is the one to use on a live database that has no products (point `MONGO_URI` at it). The other seed scripts **delete and replace** existing data. They refuse to run against a remote database unless you add `--force`, and they never run when `NODE_ENV=production`.

## 5. Run the app

```bash
npm run dev
```

This starts the frontend and the backend together. The frontend runs on port **3001** (not Next.js's usual 3000); use `http://localhost:3001` as the authorized origin if you set up Google sign-in.

On first start, if the database has no public product, the backend adds the fashion demo catalog (insert-only, nothing is deleted), so the shop is never empty. Set `AUTO_SEED_CATALOG=false` in `backend/.env` to turn this off on a real shop.

| Service | URL |
| :--- | :--- |
| Shop (frontend) | http://localhost:3001 |
| Admin panel | http://localhost:3001/admin |
| Backend API | http://localhost:5000/api |
| API docs (Swagger) | http://localhost:5000/api-docs |

## 6. Demo accounts

| Role | Email | Password |
| :--- | :--- | :--- |
| Admin | `admin@email.com` | your `SEED_PASSWORD`, or the random one `seed:admin` printed |
| Customer | `user@email.com` | your `SEED_PASSWORD`, or the random one `seed:admin` printed |

These accounts are for local demos only. Never run the seed scripts against a production database.

## 7. Run the tests (optional)

Prerequisites: steps 1–3 done (Node 22+, `npm install` in both folders, `backend/.env` with the JWT secrets) and MongoDB running on `MONGO_URI`; the tests do not use an in-memory database. The tests use their own `swiftcart_*_test` databases and never touch `swiftcart`.

```bash
npm --prefix backend test          # all backend tests, including the route-guard policy check
npm run lint                       # frontend lint
```

Two end-to-end checks run against a running local backend instead. Start it with `npm --prefix backend run dev`, then:

```bash
# TEST_ADMIN_PASSWORD (or SEED_PASSWORD) = the seeded admin's password; the API defaults to http://localhost:5000/api
npm --prefix backend run test:live
```

They create a temporary product, order and customer and delete them again at the end.

## Production build

```bash
npm run build && npm start           # frontend
npm --prefix backend start           # backend (set NODE_ENV=production)
```

In production, `MONGO_URI`, `FRONTEND_URL` and the Cloudinary keys are also required. See the comments in `backend/.env.example`.

## Troubleshooting

- **"JWT_SECRET must be set (at least 32 characters)"**: fill both secrets in `backend/.env` (step 3).
- **"MONGO_URI points to a remote database"** when seeding: add `--force` to the seed command if you really want to seed that database.
- **Port in use**: change `PORT` in `backend/.env`, or the `-p 3001` in the root `package.json`.
