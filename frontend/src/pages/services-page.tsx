import { useEffect, useState } from "react";
import { AdminShell } from "../components/features/layout/admin-shell";
import { ConfirmationModal } from "../components/features/shared/confirmation-modal";
import { ServiceForm } from "../components/features/services/service-form";
import { ServiceTableLoading } from "../components/features/services/service-table-loading";
import { ServiceTable } from "../components/features/services/service-table";
import { Input } from "../components/ui/input";
import { Select } from "../components/ui/select";
import { useDebouncedValue } from "../lib/use-debounced-value";
import { notify } from "../lib/notify";
import {
  createServiceRequest,
  deactivateServiceRequest,
  fetchServicesRequest,
  updateServiceRequest
} from "../services/service-api";
import { useAuthStore } from "../stores/auth-store";
import type { Service, ServicePayload, ServiceStatus } from "../types/service";

export const ServicesPage = () => {
  const user = useAuthStore((state) => state.user);
  const [services, setServices] = useState<Service[]>([]);
  const [editingService, setEditingService] = useState<Service | null>(null);
  const [pendingDeactivateService, setPendingDeactivateService] = useState<Service | null>(null);
  const [isServiceFormOpen, setIsServiceFormOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<ServiceStatus | "all">("all");
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [isFiltering, setIsFiltering] = useState(false);
  const [isSavingService, setIsSavingService] = useState(false);
  const [isDeactivating, setIsDeactivating] = useState(false);
  const debouncedSearch = useDebouncedValue(search, 350);

  const canManage = user?.role === "admin" || user?.role === "manager";

  const loadServices = async (options?: { preserveTable?: boolean }) => {
    if (!user) {
      return;
    }

    if (options?.preserveTable) {
      setIsFiltering(true);
    } else {
      setIsInitialLoading(true);
    }

    try {
      const results = await fetchServicesRequest({
        search: debouncedSearch || undefined,
        status: statusFilter
      });
      setServices(results);
    } catch (error: unknown) {
      notify.error(error instanceof Error ? error.message : "Unable to fetch services");
    } finally {
      setIsInitialLoading(false);
      setIsFiltering(false);
    }
  };

  useEffect(() => {
    void loadServices({
      preserveTable: services.length > 0 || debouncedSearch.length > 0 || statusFilter !== "all"
    });
  }, [user, debouncedSearch, statusFilter]);

  const handleServiceSubmit = async (payload: ServicePayload): Promise<boolean> => {
    if (!user) {
      return false;
    }

    setIsSavingService(true);

    try {
      if (editingService) {
        await updateServiceRequest(editingService.id, payload);
        notify.success("Service updated successfully.");
        setEditingService(null);
      } else {
        await createServiceRequest(payload);
        notify.success("Service added successfully.");
      }

      setIsServiceFormOpen(false);
      await loadServices();
      return true;
    } catch (error: unknown) {
      notify.error(error instanceof Error ? error.message : "Unable to save service");
      return false;
    } finally {
      setIsSavingService(false);
    }
  };

  const handleDeactivate = async () => {
    if (!user || !pendingDeactivateService) {
      return;
    }

    setIsDeactivating(true);

    try {
      await deactivateServiceRequest(pendingDeactivateService.id);
      notify.success("Service deactivated successfully.");
      setPendingDeactivateService(null);
      await loadServices();
    } catch (error: unknown) {
      notify.error(error instanceof Error ? error.message : "Unable to deactivate service");
    } finally {
      setIsDeactivating(false);
    }
  };

  return (
    <AdminShell
      eyebrow="Pages / Services"
      title="Service catalog"
      description="list of services the company offers"
    >
      <section className="space-y-5">
        <div className="flex flex-col gap-4 rounded-[1.75rem] bg-white p-4 shadow-[0_20px_60px_rgba(11,20,55,0.08)] sm:p-6 md:flex-row md:items-end md:justify-between">
          <div className="grid flex-1 gap-4 md:grid-cols-[minmax(0,1fr)_220px]">
            <Input
              label="Search services"
              placeholder="Search by name or description"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
            <Select
              label="Status filter"
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value as ServiceStatus | "all")}
            >
              <option value="all">All services</option>
              <option value="active">Active only</option>
              <option value="inactive">Inactive only</option>
            </Select>
          </div>

          {canManage ? (
            <button
              className="inline-flex h-11 w-full items-center justify-center rounded-full bg-[#4318FF] px-5 text-sm font-semibold text-white shadow-[0_12px_30px_rgba(67,24,255,0.22)] transition hover:bg-[#3311cc] md:w-auto"
              type="button"
              onClick={() => {
                setEditingService(null);
                setIsServiceFormOpen(true);
              }}
            >
              Add service
            </button>
          ) : null}
        </div>

        <section className="rounded-[1.75rem] bg-white p-4 shadow-[0_20px_60px_rgba(11,20,55,0.08)] sm:p-6">
          {isInitialLoading ? (
            <ServiceTableLoading />
          ) : (
            <div className="relative">
              {isFiltering ? (
                <div className="absolute inset-0 z-10 flex items-center justify-center rounded-[1.75rem] bg-white/70 backdrop-blur-[2px]">
                  <div className="flex items-center gap-3 rounded-full bg-white px-4 py-3 text-sm font-semibold text-[#4318FF] shadow-[0_12px_30px_rgba(11,20,55,0.08)]">
                    <span className="h-3 w-3 animate-spin rounded-full border-2 border-[#C4B5FD] border-t-[#4318FF]" />
                    Filtering services...
                  </div>
                </div>
              ) : null}

              <ServiceTable
                services={services}
                canManage={canManage}
                onEdit={(service) => {
                  setEditingService(service);
                  setIsServiceFormOpen(true);
                }}
                onDeactivate={(service) => setPendingDeactivateService(service)}
              />
            </div>
          )}
        </section>
      </section>

      {canManage ? (
        <>
          <ServiceForm
            isOpen={isServiceFormOpen}
            initialService={editingService}
            isSubmitting={isSavingService}
            onClose={() => setIsServiceFormOpen(false)}
            onCancelEdit={() => setEditingService(null)}
            onSubmit={handleServiceSubmit}
          />
          <ConfirmationModal
            isOpen={pendingDeactivateService !== null}
            title="Deactivate service?"
            description={
              pendingDeactivateService
                ? `Deactivate ${pendingDeactivateService.name}? You can still keep past jobs linked to it, but it will no longer be offered as an active service.`
                : ""
            }
            confirmLabel="Deactivate service"
            tone="danger"
            isConfirming={isDeactivating}
            onCancel={() => {
              if (!isDeactivating) {
                setPendingDeactivateService(null);
              }
            }}
            onConfirm={handleDeactivate}
          />
        </>
      ) : null}
    </AdminShell>
  );
};
