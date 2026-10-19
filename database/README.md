# Database

SwiftCart uses **MongoDB**, not a SQL database, so `schema.sql` is only a pointer note. The schema is
defined by the Mongoose models in [`backend/src/models/`](../backend/src/models/), and this
folder holds the from-scratch setup.

| File | Purpose |
| :--- | :--- |
| [`schema.json`](schema.json) | Generated reference of every collection: fields, types, refs, enums, defaults and indexes |
| [`../backend/scripts/initDb.js`](../backend/scripts/initDb.js) | Creates all collections and indexes on an empty database |

## Create the database from scratch

```bash
# MONGO_URI in backend/.env (defaults to mongodb://127.0.0.1:27017/swiftcart)
npm --prefix backend run db:init      # create 28 collections + indexes (non-destructive)
npm --prefix backend run seed         # optional: demo products/categories (local DB only)
npm --prefix backend run seed:admin   # optional: demo admin + customer accounts
```

## Regenerate schema.json after changing a model

```bash
npm --prefix backend run db:schema
```
