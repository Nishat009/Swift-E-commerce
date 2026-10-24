# Database

SwiftCart uses **MongoDB**, not a SQL database, so `schema.sql` is only a pointer note and `seed.sql` is a SQL copy of the demo data. The schema is
defined by the Mongoose models in [`backend/src/models/`](../backend/src/models/), and this
folder holds the from-scratch setup.

| File | Purpose |
| :--- | :--- |
| [`schema.json`](schema.json) | Generated reference of every collection: fields, types, refs, enums, defaults and indexes |
| [`seed.sql`](seed.sql) | Demo categories and products as plain SQL (CREATE TABLE + INSERT); loads into MySQL, PostgreSQL or SQLite. Generated, do not edit |
| [`../backend/scripts/initDb.js`](../backend/scripts/initDb.js) | Creates all collections and indexes on an empty database |

## Create the database from scratch

```bash
# MONGO_URI in backend/.env (defaults to mongodb://127.0.0.1:27017/swiftcart)
npm --prefix backend run db:init      # create 28 collections + indexes (non-destructive)
npm --prefix backend run seed         # optional: demo products/categories (local DB only)
npm --prefix backend run seed:admin   # optional: demo admin + customer accounts
```

## Regenerate seed.sql after changing the demo catalog

```bash
npm --prefix backend run db:seed-sql
```

A backend test fails if `seed.sql` is out of date.

## Regenerate schema.json after changing a model

```bash
npm --prefix backend run db:schema
```

## Related records and deletes

MongoDB has no foreign keys, so the app handles references itself. Every reference used in a lookup has an index (see `indexes` in `schema.json`).

| Deleted | What happens to related data |
| :--- | :--- |
| Customer account | Cart, wishlist, notifications, stock alerts, wardrobe and pending sign-in challenges are deleted. Orders, lucky-draw tickets, reviews and logs are kept as store records and show "Deleted user". Admin accounts must be demoted first. |
| Product | Never removed: it is archived (`status: archived`, `active: false`), so orders and reviews keep a valid reference. |
| Category | Refused while active products still use it. |
