import type { Customer, CustomerPayload, CustomerStatus } from "../types/customer";
import { apiClient } from "./api-client";

export const fetchCustomersRequest = async (
  options: { search?: string; status?: CustomerStatus | "all" }
): Promise<Customer[]> => {
  const params = new URLSearchParams();

  if (options.search) {
    params.set("search", options.search);
  }

  if (options.status && options.status !== "all") {
    params.set("status", options.status);
  }

  const queryString = params.toString();
  const { data } = await apiClient.get<Customer[]>(`/customers${queryString ? `?${queryString}` : ""}`);
  return data;
};

export const createCustomerRequest = async (payload: CustomerPayload): Promise<Customer> => {
  const { data } = await apiClient.post<Customer>("/customers", payload);
  return data;
};

export const updateCustomerRequest = async (
  customerId: string,
  payload: CustomerPayload
): Promise<Customer> => {
  const { data } = await apiClient.put<Customer>(`/customers/${customerId}`, payload);
  return data;
};

export const deleteCustomerRequest = async (customerId: string): Promise<void> => {
  await apiClient.delete(`/customers/${customerId}`);
};
