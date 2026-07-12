# ServiceFlow

ServiceFlow is a full-stack operations app for service businesses that need to manage customers, services, projects, team members, work logs, approvals, invoices, and invoice-related notifications in one place.

The repository is organized as an npm workspace with two apps:

- `backend`: Express + TypeScript + TypeORM + MySQL API
- `frontend`: React + TypeScript + Vite client

## What The App Does

ServiceFlow supports an end-to-end delivery and billing flow:

1. Admins and managers manage customers and service offerings.
2. Admins create projects and assign project services to team members.
3. Team members and managers record work logs against assigned project services.
4. Admins and managers review monthly project work in Project Approvals.
5. Admins create invoice drafts from approved, submitted, billable work.
6. Managers review drafts, then admins issue and mark invoices as paid.
7. Admins and managers receive invoice workflow notifications in the app.

## Core Features

### Authentication and Roles

- JWT-based authentication with cookie-based sessions
- Roles: `admin`, `manager`, `team_member`
- Session endpoints for login, refresh, logout, and active-session checks

### Customers

- Create, edit, search, and filter customers
- Mark customers active or inactive
- Prevent deleting customers that already have related jobs or invoices

### Services

- Manage the service catalog
- Keep default hourly rates on services
- Start project creation from a selected service

### Projects

- Create and update projects
- Assign service work to team members
- Track project manager ownership
- Support project lifecycle actions such as cancellation

### Team Members

- Manage users and role assignments
- Expose assignable users for project staffing

### Work Logs

- Record daily work against assigned project services
- Enforce daily and weekly hour limits
- Keep historical billing accuracy by snapshotting hourly rates on each work log
- Lock edits based on weekly submission state and project-month approval state

### Project Approvals

- Review submitted work by project month
- Approve, reject, or reset individual work-log lines
- Track who still has missing submissions
- Finalize a month once review is complete

### Invoices

- Build invoice drafts from approved, eligible work
- Enforce status transitions: `draft`, `reviewed`, `issued`, `paid`, `cancelled`
- Prevent duplicate billing of the same approved work-log line

### Notifications

- Store invoice workflow notifications in the database
- Show unread notifications in the frontend bell UI
- Run a backend queue worker at startup to process persisted jobs

## Tech Stack

### Frontend

- React 18
- TypeScript
- Vite
- React Router
- React Hook Form
- Zod
- Zustand
- Axios
- Tailwind CSS v4 alpha

### Backend

- Node.js
- Express
- TypeScript
- TypeORM
- MySQL
- Zod
- JWT authentication

## Repository Structure

```text
serviceFlow/
  backend/     Express API, database config, migrations, tests
  frontend/    React app, routes, UI, API client
  docs/        Feature documentation and business rules
```

## Docs To Read First

These files contain the current business rules and are worth reading before making changes:

- [docs/architecture.md](./docs/architecture.md)
- [docs/auth.md](./docs/auth.md)
- [docs/customers.md](./docs/customers.md)
- [docs/services.md](./docs/services.md)
- [docs/work-logs.md](./docs/work-logs.md)
- [docs/project-approvals.md](./docs/project-approvals.md)
- [docs/invoices.md](./docs/invoices.md)

## Requirements

Before starting the app, make sure you have:

- Node.js 18 or newer
- npm 9 or newer
- A running MySQL database

## Environment Variables

Do not commit real secrets. Use the example files as templates:

- `backend/.env.example`
- `frontend/.env.example`

### Backend Variables

- `PORT`: Port for the backend API, for example `4000`
- `CLIENT_ORIGIN`: Frontend URL allowed by CORS, for example `http://localhost:5173`
- `NODE_ENV`: Application mode such as `development`
- `DB_HOST`: MySQL host
- `DB_PORT`: MySQL port, usually `3306`
- `DB_NAME`: MySQL database name
- `DB_USER`: MySQL username
- `DB_PASSWORD`: MySQL password
- `DB_SYNCHRONIZE`: TypeORM schema sync flag. Keep this `false` when using migrations.
- `JWT_SECRET`: Secret used to sign access and refresh tokens. It must be at least 32 characters.
- `JWT_EXPIRES_IN`: Access token lifetime, for example `15m`
- `JWT_REFRESH_EXPIRES_IN`: Refresh token lifetime, for example `12h`

### Frontend Variables

- `VITE_API_BASE_URL`: Base URL for the backend API, for example `http://localhost:4000`

## Setup

### 1. Install dependencies

From the repo root:

```bash
npm install
```

### 2. Create local env files

Create these files from the examples:

```bash
backend/.env
frontend/.env
```

Fill them with your local values.

### 3. Prepare the database

Create an empty MySQL database that matches `DB_NAME`, then run the backend migrations:

```bash
npm run migration:run --workspace backend
```

Important note:

- The initial admin user is currently seeded by a migration, not by a standalone `seed` script.
- The authentication doc mentions `npm run seed --workspace backend`, but that script does not currently exist in `backend/package.json`.

## How To Run The App

Open two terminals from the repository root.

### Run the backend

```bash
npm run dev:backend
```

The backend starts on `PORT`, which defaults to `4000`.

### Run the frontend

```bash
npm run dev:frontend
```

Vite usually serves the frontend on `http://localhost:5173`.

### Optional root shortcut

This workspace also includes:

```bash
npm run dev
```

That command starts the backend only.

## Build Commands

### Build everything

```bash
npm run build
```

### Build backend only

```bash
npm run build --workspace backend
```

### Build frontend only

```bash
npm run build --workspace frontend
```

## Test Commands

### Run all configured tests from the root

```bash
npm test
```

### Run backend tests directly

```bash
npm run test --workspace backend
```

Current note:

- The repository currently exposes automated tests only for the backend.
- The frontend does not currently define a test script in `frontend/package.json`.

## Other Useful Developer Commands

### Start the compiled backend

```bash
npm run start --workspace backend
```

### Re-run migrations

```bash
npm run migration:run --workspace backend
```

### Revert the latest migration

```bash
npm run migration:revert --workspace backend
```

## API and Runtime Notes

- Health check endpoint: `GET /health`
- API routes are mounted under `/api/...`
- The frontend uses `axios` with `withCredentials: true`, so backend and frontend origins must match the cookie and CORS setup.
- The backend starts an invoice queue worker on boot.
- TypeORM is configured with `synchronize: false`; schema changes should go through migrations.

## Things Coders Should Know Before Editing

- Business rules live in `docs/` and are important for approvals, invoices, and work-log locking.
- Several features are role-sensitive, so UI and API changes should be checked against `admin`, `manager`, and `team_member` behavior.
- Invoice notifications are persisted in the database and not only handled in memory.
- Some naming still reflects earlier terminology. For example, parts of the backend use both `jobs` and `projects`.
- There is both `/api/projects` and `/api/jobs` routing to the same project router for compatibility.

## Missing Topics That Would Improve This README

- A proper architecture diagram or request flow overview
- A database schema or ERD for key entities
- Seed data strategy beyond the migration-based admin user
- Default login credentials, if the team wants them documented for local development
- Deployment instructions for staging and production
- Troubleshooting steps for common setup failures such as CORS, cookies, or MySQL connection issues
- Contribution guidelines and code style expectations
- Version requirements for MySQL and Node.js if the team wants stricter compatibility guidance
- A clear frontend test strategy once frontend tests are added
