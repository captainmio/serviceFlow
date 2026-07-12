# Invoices

## Overview
- The invoice module turns fully submitted and project-approved work into controlled invoice drafts.
- Admins create drafts from invoice-eligible project months.
- Managers review those drafts and approve them for issue.
- Admins issue approved invoices and later mark them as paid.

## Roles
- Admins can:
  - view invoice-eligible project months,
  - create invoice drafts,
  - issue reviewed invoices,
  - mark issued invoices as paid,
  - and view all invoices.
- Managers can:
  - view invoices linked to projects they manage,
  - review draft invoices,
  - and approve them for issue by changing the status to `reviewed`.
- Team members do not have access to invoices.

## Invoice Eligibility
- A project-month becomes invoice-eligible only when:
  - the project month is already approved in Project Approvals,
  - every assigned member has submitted the expected work for that month,
  - there is at least one billable work-log line,
  - and the eligible work-log lines have not already been invoiced.
- Billable lines are:
  - submitted,
  - individually approved,
  - and not rejected or still pending review.

## Draft Creation
- Admins can select one or more invoice-eligible project months.
- All selected source months must belong to the same customer.
- Draft creation copies eligible work logs into invoice items as snapshots.
- Invoice totals are recalculated on the backend from the copied invoice items.

## Status Flow
- Valid invoice statuses are:
  - `draft`
  - `reviewed`
  - `issued`
  - `paid`
  - `cancelled`
- Allowed transitions:
  - manager: `draft -> reviewed`
  - admin: `reviewed -> issued`
  - admin: `issued -> paid`
  - admin: `draft -> cancelled`
  - admin: `reviewed -> cancelled`

## Notifications And Queueing
- Creating a draft enqueues notifications for the managers of the included projects.
- Reviewing a draft enqueues notifications for admin users that the invoice is ready to issue.
- Notifications are stored in the database and surfaced through the app bell icon.
- Queue jobs are persisted in the database so failed notification processing can retry on future executions.

## Duplicate Protection
- Invoice numbers are unique.
- Invoice items keep a unique link to each source `work_log_id`.
- This prevents the same approved work-log line from being billed twice across active invoices.
