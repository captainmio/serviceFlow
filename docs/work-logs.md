# Work Logs

## Overview
The work-log module lets team members and managers record daily work against the project-service assignments they already own. Each work log stores the service hourly rate at the time of entry so billing history stays accurate even if the service master data changes later.

## Roles
- Team members can create, edit, delete, and view only their own work logs while the selected project month is still open.
- Managers now follow the same work-log visibility and edit rules as team members inside the work-log screen: they can create, edit, delete, and view only their own work logs while the selected project month is still open.
- Admins can view all work logs and adjust existing entries, but they cannot delete work logs.

## Validation
- `hours` must be greater than zero.
- Work dates can be entered up to one month ahead.
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
- Team members and managers submit work by week, but overlapping weeks are tracked per month portion.
- When a selected month includes an overlapping week, the history view keeps the full Monday-Sunday week visible, including the adjacent-month days at the boundary.
- If a selected week spans two different months, the work-log screen submits only the dates that belong to the currently selected month.
- Submitted weeks become read-only for team members and managers until they are unsubmitted.
- Week-month submissions can be unsubmitted only while the related project month is still open.
- Line-by-line approval now happens in the dedicated Project Approvals screen.
- Final month approval happens only after every work-log line for the selected project month has been approved.
- Approving a month locks all work logs for that project and month.
