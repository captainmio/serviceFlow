# Project Approvals

## Overview
The Project Approvals module is the month-end review screen for submitted work logs. It lets reviewers see project months that still need attention, inspect every reported work-log line for a selected month, identify incomplete submitters, approve or reject individual lines, and submit the month approval when they are ready.

## Roles
- Admins can access every project in the approval queue.
- Managers can access only the projects where they are the configured project manager.
- Team members do not have access to this module.

## Approval readiness
- A project-month appears in the approval queue only when at least one assigned team member or manager has completed every expected weekly submission for that month.
- For weeks that overlap two months, readiness is evaluated only against the portion of that week that belongs to the selected month.
- Expected weeks are based on the overlap between:
  - the selected month,
  - the project's start and due date window,
  - and the current date for active months.
- The detail screen also lists assigned members who still have missing weekly submissions.

## Line review
- Every work-log line in the selected month can be marked `approved` or `rejected`.
- A reviewed line can also be reset back to `pending` if the reviewer wants to clear their answer.
- Rejecting a line requires a rejection reason.
- Review state is stored directly on each work-log row so the month can track partial progress.

## Finalizing a month
- The `Submit month approval` action is available only when:
  - the selected month has work-log lines,
  - and the project month has not already been finalized.
- Rejected or missing team-member work can still exist when a manager submits month approval.
- A project-month stays visible in the queue until the month is approved and every assigned member has submitted the expected work for that month.
- Finalizing a month marks the project-month status as `approved` and locks related work logs from further changes.

## Revenue summaries
- The detail page shows:
  - weekly revenue totals for the selected month,
  - total revenue for the selected month,
  - and total revenue for the entire project based on submitted work-log lines that were individually reviewed as `approved`.
- Revenue summaries exclude:
  - work-log lines that are still pending review,
  - work-log lines reviewed as `rejected`,
  - and work-log lines whose week-month portion has not been submitted yet.
