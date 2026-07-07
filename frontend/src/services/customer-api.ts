import { config } from "../config";
import type { Customer, CustomerPayload, CustomerStatus } from "../types/customer";
import { fetchJson, jsonHeaders } from "./api-client";

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
  return fetchJson<Customer[]>(
    `${config.apiBaseUrl}/customers${queryString ? `?${queryString}` : ""}`
  );
};

export const createCustomerRequest = async (payload: CustomerPayload): Promise<Customer> => {
  return fetchJson<Customer>(`${config.apiBaseUrl}/customers`, {
    method: "POST",
    headers: jsonHeaders,
    body: JSON.stringify(payload)
  });
};

export const updateCustomerRequest = async (
  customerId: string,
  payload: CustomerPayload
): Promise<Customer> => {
  return fetchJson<Customer>(`${config.apiBaseUrl}/customers/${customerId}`, {
    method: "PUT",
    headers: jsonHeaders,
    body: JSON.stringify(payload)
  });
};

export const deleteCustomerRequest = async (customerId: string): Promise<void> => {
  await fetchJson<void>(`${config.apiBaseUrl}/customers/${customerId}`, {
    method: "DELETE",
    headers: undefined
  });
};
