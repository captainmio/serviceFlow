import { config } from "../config";
import type { Service, ServicePayload, ServiceStatus } from "../types/service";
import { fetchJson, jsonHeaders } from "./api-client";

export const fetchServicesRequest = async (
  options: { search?: string; status?: ServiceStatus | "all" }
): Promise<Service[]> => {
  const params = new URLSearchParams();

  if (options.search) {
    params.set("search", options.search);
  }

  if (options.status && options.status !== "all") {
    params.set("status", options.status);
  }

  const queryString = params.toString();
  return fetchJson<Service[]>(`${config.apiBaseUrl}/services${queryString ? `?${queryString}` : ""}`);
};

export const createServiceRequest = async (payload: ServicePayload): Promise<Service> => {
  return fetchJson<Service>(`${config.apiBaseUrl}/services`, {
    method: "POST",
    headers: jsonHeaders,
    body: JSON.stringify(payload)
  });
};

export const updateServiceRequest = async (
  serviceId: string,
  payload: ServicePayload
): Promise<Service> => {
  return fetchJson<Service>(`${config.apiBaseUrl}/services/${serviceId}`, {
    method: "PUT",
    headers: jsonHeaders,
    body: JSON.stringify(payload)
  });
};

export const deactivateServiceRequest = async (serviceId: string): Promise<Service> => {
  return fetchJson<Service>(`${config.apiBaseUrl}/services/${serviceId}/deactivate`, {
    method: "PATCH",
    headers: undefined
  });
};
