# Backend

The backend is an Express 5 JSON API. It uses SQLite through `better-sqlite3`, validates authentication input, hashes account passwords with bcrypt, and protects account data with expiring JWTs.

## Setup

Run from this directory with Node.js 22:

```bash
npm ci
```

Copy `.env.example` to `.env`, then start the API:

```bash
npm start
```

The default API address is `http://localhost:5000`; the health check is `/api/health`. The application creates the database and tables when it starts. Set `DB_PATH` to use a different SQLite file. Relative paths are resolved from the process working directory.

## Demo data

The repository includes `db/database.sqlite`, preloaded with the demo account and sample catalog, sales, and purchases. To seed a new empty database:

```bash
npm run seed
```

The seed command refuses to replace existing accounts. To intentionally reset the selected database to the demo dataset:

```bash
npm run seed:reset
```

This reset deletes all users and transactions in that SQLite file.

Demo credentials are `demo@businesstracker.com` / `Demo1234!`.

## API routes

Authenticated routes require `Authorization: Bearer <token>`.

| Route | Methods | Purpose |
|---|---|---|
| `/api/auth/register` | `POST` | Create an account |
| `/api/auth/login` | `POST` | Sign in and receive a 12-hour token |
| `/api/products` | `GET`, `POST` | List and add products |
| `/api/products/low-stock` | `GET` | List products below their threshold |
| `/api/products/:id` | `PUT`, `DELETE` | Update or remove a product |
| `/api/sales` | `GET`, `POST` | List sales or record a sale |
| `/api/sales/summary` | `GET` | Revenue and sales totals |
| `/api/sales/daily` | `GET` | Daily sales totals |
| `/api/sales/stats` | `GET` | Sales and product summaries |
| `/api/sales/:sale_id` | `GET`, `PUT`, `DELETE` | Read, edit, or remove a sale |
| `/api/purchases` | `GET`, `POST` | List purchases or record a purchase |
| `/api/purchases/summary` | `GET` | Purchase totals |
| `/api/purchases/daily` | `GET` | Daily purchase totals |
| `/api/purchases/stats` | `GET` | Purchase and product summaries |
| `/api/purchases/:purchase_id` | `GET`, `PUT`, `DELETE` | Read, edit, or remove a purchase |
| `/api/analytics/net-revenue` | `GET` | Daily margin for a month and year |
| `/api/analytics/top-net-product` | `GET` | Product with the highest margin |
| `/api/analytics/earnings-per-product` | `GET` | Margin share by product |
| `/api/analytics/product-activity` | `GET` | Last-sold date by product |
| `/api/analytics/product-revenue` | `GET` | Daily margin for one product |
| `/api/settings` | `GET`, `PUT` | Read or set the preferred currency |
| `/api/settings/change-password` | `POST` | Change the signed-in account password |

All IDs and filters are checked against the authenticated account. Invalid stock changes return `409 Conflict`; a resource outside the account returns `404`.

## Storage and migrations

`db/schema.sql` defines the users, products, sales, sale items, purchases, purchase items, and settings tables. Products keep selling price and current acquisition cost separately. Purchases update the current acquisition cost, and each sale line saves a cost snapshot so later changes do not rewrite historical margins. On startup, the adapter migrates older databases by adding the missing cost fields and initializing them from the best available catalog or sales data.

The database uses WAL mode and enables foreign keys. The Docker Compose setup stores it in the named `db-data` volume.

## Environment and security

| Variable | Default | Description |
|---|---|---|
| `PORT` | `5000` | API port |
| `JWT_SECRET` | Local-only development key | JWT signing secret; production requires a unique secret of at least 32 characters |
| `CORS_ORIGIN` | `http://localhost:3001` | Comma-separated browser origins |
| `DB_PATH` | `db/database.sqlite` | Optional SQLite file path |

The API uses Helmet security headers, JSON payload limits, global and authentication rate limits, parameterized SQL, and account-scoped queries. Never use the local demo secret for a public deployment.

## Tests

```bash
npm test
```

The workflow tests use a temporary SQLite file and cover sale/purchase stock changes, transaction rollback, account isolation, and saved cost snapshots.
