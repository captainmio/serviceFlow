# ServiceFlow - README

## 1. Project Overview
* **Purpose:** A small service company uses the system to manage customers, jobs/projects, work logs, expenses, invoices, and payment status.
* **Techstack:**
  - **Backend:** Node.js, TypeScript, Express.js, TypeORM, MySQL, bcrypt, JWT
  - **Frontend:** React, TypeScript, Zod, TailwindCSS v4, React Router, React Hook Form, Recharts, Zustand, Axios
* **Architecture:** Client-server with separate `frontend` and `backend` folders.

## 2. Coding Style & Conventions
* **File Naming:** Use `kebab-case` for all files (for example `user-profile.tsx`, not `UserProfile.tsx`). Components use `PascalCase`; hooks use `camelCase`.
* **Exports:** Use named exports only. No default exports.
* **Typing:** Never use `any`. Explicitly define interfaces and types.
* **Components:** Default to small, focused components with a target max of 200 lines per file.
* **UI components:** Reuse frontend UI primitives such as buttons, inputs, cards, and layout wrappers throughout the app. Create a new component if changing an existing one would make it too specific.
* **Notifications:** Use a single global notification system for user-facing success, error, and informational feedback. In this project, use `react-toastify` instead of ad hoc inline alerts for mutation results.
* **Form state preservation:** Do not clear or reset user-entered values in inputs, textareas, selects, or other low-level UI controls when a submission fails. Preserve the entered data so the user can correct and resubmit.
* **Form layout default:** Default new create/edit forms to full-width stacked fields. Use multi-column field layouts only when there is a clear usability reason.
* **Destructive actions:** Confirm delete and other destructive actions with a modal before executing them. Reuse a shared confirmation-modal pattern for future delete flows.
* **Styling:** Use Tailwind utility classes; avoid custom CSS unless strictly necessary.
* **Functions:** Prefer arrow functions and functional programming principles where practical.
* **Security:** Never hardcode API URLs. Read them from `.env` variables.
* **Database changes:** Use TypeORM migrations for schema changes. Do not rely on seed scripts or `synchronize` to introduce or patch schema updates.

## 2.1 Frontend Layout Direction
* **Design inspiration:** Use the Horizon-style admin layout approach as inspiration for composition only: light workspace, left sidebar, top content header, rounded white cards, roomy table sections, and soft shadows. Do not copy brand assets or exact page structures.
* **Primary app shell:** Default authenticated pages to a two-column shell with a persistent left sidebar and a wide content canvas on the right.
* **Page header pattern:** Start primary pages with breadcrumb or eyebrow text, a bold title, and one short supporting sentence.
* **Card language:** Prefer white cards on a pale blue background, large rounded corners, low-noise shadows, and generous spacing.
* **Data-first pages:** Customer, job, invoice, and payment screens should lead with summary metrics and then move into tables, lists, or activity panels.
* **Color direction:** Base the interface around `#F4F7FE`, `#FFFFFF`, `#2B3674`, `#707EAE`, `#A3AED0`, with a strong accent around `#4318FF`.
* **Interaction style:** Buttons, pills, and active navigation states should feel soft and confident, using rounded-pill or soft-rounded shapes.
* **Reuse expectations:** Extract and reuse shared layout pieces such as sidebar, header, metric cards, section cards, table wrappers, shared modals, and slide-over wrappers before duplicating page patterns.

## 3. Execution Commands
* **Install Dependencies:** `npm install` (prefer `pnpm install` where applicable).
* **Run Backend Dev Server:** `npm run dev:backend`
* **Run Frontend Dev Server:** `npm run dev:frontend`
* **Run Tests:** `npm run test`
* **Build:** `npm run build`

## 4. Agent Boundaries & Guardrails
* **Secrets:** Never print secrets, API keys, or credentials to terminal output.
* **Dependencies:** Do not add new third-party libraries without explicit user approval.
* **Error Handling:** Avoid empty `try-catch` blocks. Fail fast and handle errors gracefully.

## 5. Testing
* **Bug fixes:** Reproduce the bug with a test first when practical, then make it pass.
* **Browser console:** New pages and UI changes should be free of browser console errors and warnings in normal use.
* **Feature tests:** Create feature test files for new pages and new features. Cover the primary user flow, not just helper functions.
* **Hover behavior:** Buttons, links, and button-like controls should clearly present pointer cursor feedback on hover.
* **Interactive fields:** Explicitly verify that inputs, selects, textareas, buttons, dialogs, modals, and slide-over forms are clickable, focusable, and editable after UI changes.
* **Form primitives:** Custom form controls used with `react-hook-form` must forward refs correctly.
* **Failed-submit UX:** Verify that failed form submissions keep the user’s current input values intact and only show validation or notification feedback.
* **Motion UX:** Slide-over panels should animate smoothly on both open and close without breaking click behavior or clearing state unexpectedly.
* **Notification UX:** Mutation failures and successes should appear through the global toast system in the correct context, especially for duplicate or conflict errors.
* **Search UX:** Search-driven screens should debounce user input, avoid flickering the whole layout during filtering, and use stable loading states or overlays before showing updated results.
* **Validation tests:** Add focused tests for form validation, schema validation, and permission-sensitive behavior.
* **Expectation:** Always create test cases for new features, validation, or bug fixes where practical.

## 6. Living Docs & Context
* **Changes:** If behavioral changes make this file inaccurate, propose updates to `AGENTS.md` in the same change.
* **Documentation:** Ensure new utility functions are documented in `/docs`. Update docs when behavior or page structure changes.

## 7. Goal-Driven Execution
**Define success criteria. Loop until verified.**

Transform tasks into verifiable goals:
* "Add validation" -> "Write tests for invalid inputs, then make them pass"
* "Fix the bug" -> "Write a test that reproduces it, then make it pass"
* "Refactor X" -> "Ensure tests pass before and after"

## 8. Notes To Follow
* Touch only what you must. Clean up only your own mess.
* Do not improve adjacent code, comments, or formatting unless the task requires it.
* Do not refactor things that are not broken.
* Keep changes tightly scoped to the requested task.
* `/components/ui` should contain primitive, low-level reusable UI.
* `/components/features` should contain domain-specific modular components.
* Ask: "Would a senior engineer say this is overcomplicated?" If yes, simplify.
* Do not silently introduce conflicting architectural patterns. Reuse existing patterns when reasonable.
* Remove only the dead code directly caused by your own changes.
