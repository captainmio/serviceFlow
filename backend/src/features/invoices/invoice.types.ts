import type { InvoiceStatus } from "../../entities/invoice-status.js";
import type { AuthResponse } from "../auth/auth.types.js";

export interface InvoiceEligibleMonthResponse {
  projectId: string;
  projectTitle: string;
  customerId: string;
  customerName: string;
  monthStart: string;
  billableLineCount: number;
  subtotal: number;
}

export interface InvoiceSummaryResponse {
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

export interface InvoiceItemResponse {
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

export interface InvoiceSourceMonthResponse {
  projectId: string;
  projectTitle: string;
  monthStart: string;
  lineCount: number;
  subtotal: number;
}

export interface InvoiceDetailResponse extends InvoiceSummaryResponse {
  notes: string;
  items: InvoiceItemResponse[];
  sourceMonths: InvoiceSourceMonthResponse[];
  reviewedBy: AuthResponse["user"] | null;
  reviewedAt: string | null;
  issuedBy: AuthResponse["user"] | null;
  issuedAt: string | null;
  paidAt: string | null;
}

export interface InvoiceListResponse {
  eligibleMonths: InvoiceEligibleMonthResponse[];
  invoices: InvoiceSummaryResponse[];
}
