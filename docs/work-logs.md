# Work Logs

## Overview
The work-log module lets team members and managers record daily work against the project-service assignments they already own. Each work log stores the service hourly rate at the time of entry so billing history stays accurate even if the service master data changes later.

## Roles
- Team members can create, edit, delete, and view only their own work logs while the selected project month is still open.
- Managers can create, edit, delete, and view their own work logs. They can also view other team members' work logs for projects where they are the project manager, but they cannot edit or delete those other users' entries.
- Admins can view all work logs and adjust existing entries, but they cannot delete work logs.

## Validation
- `hours` must be greater than zero.
- Work dates cannot be in the future.
- A user's total reported work for a day cannot exceed that user's configured daily maximum.
- A user's total reported work for a week cannot exceed that user's configured weekly maximum.
- Managers and team members can only create work logs for their assigned project services.
- Work logs cannot be changed when the project status is `approved`, `invoiced`, `paid`, or `cancelled`.
- Work logs also lock when the project-month review status is `approved`.

## Calculation
- `line_total = hours × hourly_rate`
- Example: `4.00 hours × $85.00 = $340.00`

## Review workflow
- Daily work is captured one entry at a time.
- Reporting is grouped by week for day-to-day use.
- Approval and rejection happen at the project-month level.
- Rejecting a month keeps it editable so corrections can be made.
- Approving a month locks all work logs for that project and month.
