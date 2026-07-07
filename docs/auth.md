# Authentication

## Current Scope
- JWT-based login using email and password
- Roles supported: `admin`, `manager`, `team_member`
- Seeder creates one initial `admin` account from backend environment variables

## Backend Flow
- `POST /api/auth/login` validates the request body, sets `HttpOnly` auth cookies, and returns `{ user }`
- `GET /api/auth/session` returns the current authenticated user from the access-token cookie
- `POST /api/auth/refresh` rotates the refresh flow and issues a new 15-minute access token
- `POST /api/auth/logout` clears both auth cookies
- Passwords are stored as bcrypt hashes in the `users` table
- TypeORM manages the `users` entity and connects through environment variables

## Seeder
- Run `npm run seed --workspace backend`
- The seeder is idempotent for the configured admin email

## Required Environment Variables
- Backend: `DB_HOST`, `DB_PORT`, `DB_NAME`, `DB_USER`, `DB_PASSWORD`, `JWT_SECRET`, `JWT_EXPIRES_IN`, `JWT_REFRESH_EXPIRES_IN`, `CLIENT_ORIGIN`
- Frontend: `VITE_API_BASE_URL`
