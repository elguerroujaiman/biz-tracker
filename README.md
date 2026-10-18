# BizTracker

BizTracker is a small-business management app for tracking products, inventory, sales, supplier purchases, and business performance. It brings day-to-day operations and useful sales and profit analytics together in one dashboard.

## Background

I originally built this project as my **PFE (Projet de Fin d'Études)** for the **Licence en Sciences Mathématiques et Informatique** at the **Faculty of Sciences of Tetouan**. After the original academic project, I returned to it and reworked it into the current version, updating the interface and application structure and adding a SQLite-backed API, security improvements, and a Docker setup.

## What it includes

- **Product and inventory management:** organize products by category, track selling and purchase costs, search and filter the catalog, and set low-stock thresholds.
- **Sales:** record sales with multiple products, keep transaction history, and review or edit sale details.
- **Purchases:** record supplier purchases and restocking, with purchase history and transaction details.
- **Dashboard and analytics:** review revenue and purchase totals, stock alerts, sales and margin trends, product performance, and recent activity.
- **Accounts and preferences:** create an account, sign in, manage account settings, and choose a currency symbol.
- **Sample data:** explore the interface with the included SQLite dataset or generate sample records with the seed command.

## Technology

- **Frontend:** React 19, Vite, React Router, Chart.js, and React Bootstrap, with responsive custom styling.
- **Backend:** Node.js 22, Express 5, SQLite with `better-sqlite3`, password hashing with bcrypt, and JWT-based authentication.
- **Containers:** Docker Compose, a multi-stage frontend build served by Nginx, and a separate API container.

## Run with Docker Compose

Install [Docker Desktop](https://www.docker.com/products/docker-desktop/) (or Docker Engine with the Compose plugin). From the project root, run:

```bash
docker compose up --build -d
```

Open the app at [http://localhost:3001](http://localhost:3001). The API health endpoint is [http://localhost:3001/api/health](http://localhost:3001/api/health).

Compose stores its SQLite database in the named `db-data` volume. A new volume starts with an empty database. To load the sample account and sample business data, run:

```bash
docker compose exec backend npm run seed
```

The sample sign-in is `demo@businesstracker.com` with password `Demo1234!`. These credentials are for the local sample dataset only; do not use them for a live business or public deployment. You can also register your own account in the app.

Stop the containers while keeping the database:

```bash
docker compose down
```

Remove the containers **and the database volume** (this deletes the data):

```bash
docker compose down -v
```

To intentionally replace the current database contents with the sample dataset, run `docker compose exec backend npm run seed:reset`. This deletes all accounts and transactions in that database.

## Run locally without Docker

Install **Node.js 22** and npm. In PowerShell, from the repository root, create local environment files from the examples:

```powershell
Copy-Item .env.example .env
Copy-Item backend/.env.example backend/.env
```

Start the backend in one terminal:

```powershell
cd backend
npm ci
npm start
```

Start the frontend in a second terminal from the project root:

```powershell
npm ci
npm start
```

The frontend is at [http://localhost:3001](http://localhost:3001), and the API listens at `http://localhost:5000`. The frontend's local API URL is configured in `.env.example`; the backend's options are in `backend/.env.example`.

The default local SQLite path is `backend/db/database.sqlite`. If you use a new, empty database instead, seed it from the backend directory with `npm run seed`. The seed command refuses to overwrite existing users. To deliberately reset that database to the sample dataset, use `npm run seed:reset` from the backend directory; it deletes all existing data in the selected database.

## Project layout

```text
src/                  React pages, components, styles, and API client
backend/              Express API, database schema, migrations, seed data, and tests
docker-compose.yml    Local multi-container setup
Dockerfile            Frontend build and Nginx image
backend/Dockerfile    Backend image
nginx.conf            Frontend server and API reverse proxy configuration
```

## Checks

Run the frontend tests from the repository root:

```bash
npm test
```

Run the backend workflow tests:

```bash
cd backend
npm test
```

Build the frontend for production:

```bash
npm run build
```

## Data and security notes

- Account data is scoped to the signed-in user. Passwords are hashed, authentication uses expiring JWTs, and sale and purchase stock updates run in database transactions.
- SQLite files are stored under `backend/db` locally and in the `db-data` Docker volume when using Compose. Keep backups of any business data you need.
- `.env` files are ignored by Git; commit the `.env.example` templates only. Before hosting the app publicly, set `NODE_ENV=production`, provide a unique `JWT_SECRET` of at least 32 characters, use HTTPS, and configure the deployment for your domain. Never expose a local development secret or the sample account as a live credential.
- See [backend/README.md](backend/README.md) for API routes, database details, environment options, and more backend notes.

## License

This project is licensed under the MIT License. See [LICENSE](LICENSE).
