# Architecture

## System Overview

```mermaid
flowchart LR
    User[User<br/>admin / manager / team_member]

    subgraph Frontend["Frontend - React + Vite"]
        Router[Routes and pages]
        UI[Feature UI and forms]
        Store[Auth store and client state]
        ApiClient[Axios API client<br/>withCredentials=true]
        Bell[Notification bell]
    end

    subgraph Backend["Backend - Express + TypeScript"]
        App[Express app]
        Auth[Auth module<br/>JWT + cookies]
        Customers[Customers module]
        Services[Services module]
        Projects[Projects and jobs module]
        Users[Users module]
        WorkLogs[Work logs module]
        Approvals[Project approvals module]
        Invoices[Invoices module]
        Notifications[Notifications endpoints]
        Worker[Invoice queue worker]
    end

    subgraph Database["MySQL + TypeORM"]
        UsersTable[(users)]
        CustomersTable[(customers)]
        ServicesTable[(services)]
        JobsTable[(jobs)]
        JobServicesTable[(job_services)]
        WorkLogsTable[(work_logs)]
        WorkLogPeriodsTable[(work_log_periods)]
        WeekSubmissionsTable[(work_log_week_submissions)]
        InvoicesTable[(invoices)]
        InvoiceItemsTable[(invoice_items)]
        NotificationsTable[(notifications)]
        QueueTable[(process_queue_jobs)]
    end

    User --> Router
    Router --> UI
    UI --> Store
    UI --> ApiClient
    Bell --> ApiClient
    ApiClient --> App

    App --> Auth
    App --> Customers
    App --> Services
    App --> Projects
    App --> Users
    App --> WorkLogs
    App --> Approvals
    App --> Invoices
    App --> Notifications
    App --> Worker

    Auth --> UsersTable
    Customers --> CustomersTable
    Services --> ServicesTable
    Projects --> JobsTable
    Projects --> JobServicesTable
    Projects --> CustomersTable
    Projects --> ServicesTable
    Projects --> UsersTable
    Users --> UsersTable
    WorkLogs --> WorkLogsTable
    WorkLogs --> WorkLogPeriodsTable
    WorkLogs --> WeekSubmissionsTable
    WorkLogs --> JobServicesTable
    WorkLogs --> JobsTable
    WorkLogs --> UsersTable
    Approvals --> WorkLogsTable
    Approvals --> WorkLogPeriodsTable
    Approvals --> WeekSubmissionsTable
    Approvals --> JobsTable
    Invoices --> InvoicesTable
    Invoices --> InvoiceItemsTable
    Invoices --> WorkLogsTable
    Invoices --> JobsTable
    Invoices --> CustomersTable
    Notifications --> NotificationsTable
    Worker --> QueueTable
    Worker --> NotificationsTable
```

## Main Runtime Flow

```mermaid
sequenceDiagram
    participant U as User
    participant F as Frontend
    participant B as Backend API
    participant DB as MySQL
    participant Q as Queue Worker

    U->>F: Open app and sign in
    F->>B: POST /api/auth/login
    B->>DB: Validate user and role
    B-->>F: Auth cookies + session user

    U->>F: Create or update business data
    F->>B: /api/customers /api/services /api/projects /api/users
    B->>DB: Persist changes
    B-->>F: Updated records

    U->>F: Submit work logs
    F->>B: /api/work-logs
    B->>DB: Validate rules and store line snapshots
    B-->>F: Saved work logs

    U->>F: Review project month
    F->>B: /api/project-approvals
    B->>DB: Load submissions and review state
    B-->>F: Queue and detail data

    U->>F: Create or review invoice
    F->>B: /api/invoices
    B->>DB: Copy eligible work into invoice items
    B->>DB: Store notification and queue jobs
    B-->>F: Invoice response

    Q->>DB: Poll persisted queue jobs
    Q->>DB: Mark notifications ready and retriable
    F->>B: GET /api/notifications
    B->>DB: Load unread notifications
    B-->>F: Notification list
```

## High-Level Responsibilities

- The frontend handles routing, forms, role-aware navigation, and periodic notification polling.
- The backend owns all business rules, validation, auth, approval logic, invoice lifecycle rules, and queue processing.
- MySQL is the source of truth for users, operational records, invoice data, notifications, and persisted queue jobs.
- TypeORM migrations are the expected way to evolve schema and bootstrap required data.

## Current Boundaries

- Frontend talks only to the backend API through `VITE_API_BASE_URL`.
- Auth is cookie-based, so frontend and backend local origins must be configured correctly.
- The invoice queue worker runs inside the backend process rather than as a separate service.
- Project and job terminology overlap in the codebase because the router preserves older naming compatibility.
