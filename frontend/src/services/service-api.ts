import { config } from "../config";
import type { Service, ServicePayload, ServiceStatus } from "../types/service";
import { buildAuthHeaders, parseError } from "./api-client";

export const fetchServicesRequest = async (
  token: string,
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
  const response = await fetch(`${config.apiBaseUrl}/services${queryString ? `?${queryString}` : ""}`, {
    headers: {
      Authorization: `Bearer ${token}`
    }
  });

  if (!response.ok) {
    await parseError(response);
  }

  return (await response.json()) as Service[];
};

export const createServiceRequest = async (
  token: string,
  payload: ServicePayload
): Promise<Service> => {
  const response = await fetch(`${config.apiBaseUrl}/services`, {
    method: "POST",
    headers: buildAuthHeaders(token),
    body: JSON.stringify(payload)
  });

  if (!response.ok) {
    await parseError(response);
  }

  return (await response.json()) as Service;
};

export const updateServiceRequest = async (
  token: string,
  serviceId: string,
  payload: ServicePayload
): Promise<Service> => {
  const response = await fetch(`${config.apiBaseUrl}/services/${serviceId}`, {
    method: "PUT",
    headers: buildAuthHeaders(token),
    body: JSON.stringify(payload)
  });

  if (!response.ok) {
    await parseError(response);
  }

  return (await response.json()) as Service;
};

export const deactivateServiceRequest = async (token: string, serviceId: string): Promise<Service> => {
  const response = await fetch(`${config.apiBaseUrl}/services/${serviceId}/deactivate`, {
    method: "PATCH",
    headers: {
      Authorization: `Bearer ${token}`
    }
  });

  if (!response.ok) {
    await parseError(response);
  }

  return (await response.json()) as Service;
};
