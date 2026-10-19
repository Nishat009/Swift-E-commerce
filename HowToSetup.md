# How to Set Up SwiftCart

These steps take a clean machine to a running shop with demo data.

## 1. Prerequisites

- **Node.js 18 or newer** (includes npm)
- **MongoDB 6 or newer**, running locally on `mongodb://127.0.0.1:27017`, or a MongoDB Atlas connection string

No other services are required. Payments, Google sign-in, email and image hosting are optional and stay off until you add their keys.

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

You can generate one with:

```bash
node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"
```

If MongoDB is not at the default local address, also change `MONGO_URI`. Leave everything else as it is.

## 4. Create the database and load demo data

MongoDB creates the database and collections automatically. The schema is defined by the Mongoose models in `backend/src/models/`. Indexes are built when the server starts.

Load the demo data:

```bash
npm --prefix backend run seed          # categories, products, coupons, demo content
npm --prefix backend run seed:admin    # demo admin and customer accounts
node backend/scripts/seed_campaigns.js # optional: lucky-draw campaigns
```

The seed scripts **delete and replace** existing data. They refuse to run against a remote database unless you add `--force`, and they never run when `NODE_ENV=production`.

## 5. Run the app

```bash
npm run dev
```

This starts the frontend and the backend together.

| Service | URL |
| :--- | :--- |
| Shop (frontend) | http://localhost:3001 |
| Admin panel | http://localhost:3001/admin |
| Backend API | http://localhost:5000/api |
| API docs (Swagger) | http://localhost:5000/api-docs |

## 6. Demo accounts

| Role | Email | Password |
| :--- | :--- | :--- |
| Admin | `admin@email.com` | `12345678` |
| Customer | `user@email.com` | `12345678` |

## 7. Run the tests (optional)

```bash
npm --prefix backend test
```

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
