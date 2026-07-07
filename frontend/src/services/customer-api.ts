import { config } from "../config";
import type { Customer, CustomerPayload, CustomerStatus } from "../types/customer";
import { buildAuthHeaders, parseError } from "./api-client";

export const fetchCustomersRequest = async (
  token: string,
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
  const response = await fetch(
    `${config.apiBaseUrl}/customers${queryString ? `?${queryString}` : ""}`,
    {
      headers: {
        Authorization: `Bearer ${token}`
      }
    }
  );

  if (!response.ok) {
    await parseError(response);
  }

  return (await response.json()) as Customer[];
};

export const createCustomerRequest = async (
  token: string,
  payload: CustomerPayload
): Promise<Customer> => {
  const response = await fetch(`${config.apiBaseUrl}/customers`, {
    method: "POST",
    headers: buildAuthHeaders(token),
    body: JSON.stringify(payload)
  });

  if (!response.ok) {
    await parseError(response);
  }

  return (await response.json()) as Customer;
};

export const updateCustomerRequest = async (
  token: string,
  customerId: string,
  payload: CustomerPayload
): Promise<Customer> => {
  const response = await fetch(`${config.apiBaseUrl}/customers/${customerId}`, {
    method: "PUT",
    headers: buildAuthHeaders(token),
    body: JSON.stringify(payload)
  });

  if (!response.ok) {
    await parseError(response);
  }

  return (await response.json()) as Customer;
};

export const deleteCustomerRequest = async (token: string, customerId: string): Promise<void> => {
  const response = await fetch(`${config.apiBaseUrl}/customers/${customerId}`, {
    method: "DELETE",
    headers: {
      Authorization: `Bearer ${token}`
    }
  });

  if (!response.ok) {
    await parseError(response);
  }
};
