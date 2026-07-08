import type { Service, ServicePayload, ServiceStatus } from "../types/service";
import { apiClient } from "./api-client";

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
  const { data } = await apiClient.get<Service[]>(`/services${queryString ? `?${queryString}` : ""}`);
  return data;
};

export const createServiceRequest = async (payload: ServicePayload): Promise<Service> => {
  const { data } = await apiClient.post<Service>("/services", payload);
  return data;
};

export const updateServiceRequest = async (
  serviceId: string,
  payload: ServicePayload
): Promise<Service> => {
  const { data } = await apiClient.put<Service>(`/services/${serviceId}`, payload);
  return data;
};

export const deactivateServiceRequest = async (serviceId: string): Promise<Service> => {
  const { data } = await apiClient.patch<Service>(`/services/${serviceId}/deactivate`);
  return data;
};
