# Authentication

## Current Scope
- JWT-based login using email and password
- Roles supported: `admin`, `manager`, `team_member`
- Seeder creates one initial `admin` account from backend environment variables

## Backend Flow
- `POST /api/auth/login` validates the request body and returns `{ token, user }`
- Passwords are stored as bcrypt hashes in the `users` table
- TypeORM manages the `users` entity and connects through environment variables

## Seeder
- Run `npm run seed --workspace backend`
- The seeder is idempotent for the configured admin email

## Required Environment Variables
- Backend: `DB_HOST`, `DB_PORT`, `DB_NAME`, `DB_USER`, `DB_PASSWORD`, `JWT_SECRET`, `JWT_EXPIRES_IN`, `CLIENT_ORIGIN`
- Frontend: `VITE_API_BASE_URL`
