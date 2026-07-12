import type { AuthUser } from "./auth";

export type InvoiceStatus = "draft" | "reviewed" | "issued" | "paid" | "cancelled";

export interface InvoiceEligibleMonth {
  projectId: string;
  projectTitle: string;
  customerId: string;
  customerName: string;
  monthStart: string;
  billableLineCount: number;
  subtotal: number;
}

export interface InvoiceSummary {
  id: string;
  invoiceNumber: string;
  customerId: string;
  customerName: string;
  status: InvoiceStatus;
  invoiceDate: string;
  dueDate: string;
  subtotal: number;
  taxAmount: number;
  totalAmount: number;
  projectCount: number;
  monthCount: number;
  canReview: boolean;
  canIssue: boolean;
}

export interface InvoiceItem {
  id: string;
  workLogId: string;
  projectId: string;
  projectTitle: string;
  monthStart: string;
  workDate: string;
  serviceName: string;
  memberName: string;
  hours: number;
  hourlyRate: number;
  lineTotal: number;
  notes: string;
}

export interface InvoiceSourceMonth {
  projectId: string;
  projectTitle: string;
  monthStart: string;
  lineCount: number;
  subtotal: number;
}

export interface InvoiceDetail extends InvoiceSummary {
  notes: string;
  items: InvoiceItem[];
  sourceMonths: InvoiceSourceMonth[];
  reviewedBy: AuthUser | null;
  reviewedAt: string | null;
  issuedBy: AuthUser | null;
  issuedAt: string | null;
  paidAt: string | null;
}

export interface InvoiceListResponse {
  eligibleMonths: InvoiceEligibleMonth[];
  invoices: InvoiceSummary[];
}
