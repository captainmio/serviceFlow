import { apiClient } from "./api-client";
import type { InvoiceDetail, InvoiceListResponse, InvoiceStatus } from "../types/invoice";

export interface CreateInvoiceDraftPayload {
  sourceMonths: Array<{
    projectId: string;
    monthStart: string;
  }>;
  invoiceDate: string;
  dueDate: string;
  taxAmount: number;
  notes: string;
}

export const fetchInvoicesRequest = async (): Promise<InvoiceListResponse> => {
  const { data } = await apiClient.get<InvoiceListResponse>("/invoices");
  return data;
};

export const fetchInvoiceDetailRequest = async (invoiceId: string): Promise<InvoiceDetail> => {
  const { data } = await apiClient.get<InvoiceDetail>(`/invoices/${invoiceId}`);
  return data;
};

export const createInvoiceDraftRequest = async (
  payload: CreateInvoiceDraftPayload
): Promise<InvoiceDetail> => {
  const { data } = await apiClient.post<InvoiceDetail>("/invoices", payload);
  return data;
};

export const updateInvoiceStatusRequest = async (
  invoiceId: string,
  status: InvoiceStatus
): Promise<InvoiceDetail> => {
  const { data } = await apiClient.patch<InvoiceDetail>(`/invoices/${invoiceId}/status`, { status });
  return data;
};
