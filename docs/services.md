# Services

## Current Scope
- Service catalog screen for authenticated users
- Admins and managers can add, edit, and deactivate services
- All authenticated users can view and search the catalog
- Admins and managers can start a job from a selected service

## Data Model
- `services` stores `name`, `description`, `default_hourly_rate`, `status`, `created_at`, `updated_at`
- `jobs` stores `title`, `customer_id`, `service_id`, `hourly_rate`, `created_at`, `updated_at`
- The job hourly rate is stored as a snapshot from the selected service and can be adjusted during job creation

## API
- `GET /api/services`
- `POST /api/services`
- `PUT /api/services/:serviceId`
- `PATCH /api/services/:serviceId/deactivate`
- `POST /api/jobs`

## UX Rules
- The service screen follows the customer screen layout and visual language
- Deactivation is confirmed before execution
- Users can launch a job creation slide-over directly from a selected service
- Active customers are used when creating jobs from the service catalog

## Seed Data
- Default services are seeded when missing, including website maintenance, bug fixing, feature development, technical support, database cleanup, hosting support, and performance tuning
