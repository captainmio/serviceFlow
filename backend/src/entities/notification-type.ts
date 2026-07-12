export const notificationTypes = ["invoice_review_requested", "invoice_issue_requested"] as const;

export type NotificationType = (typeof notificationTypes)[number];
