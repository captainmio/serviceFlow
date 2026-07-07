import { useEffect, useState } from "react";
import { AdminShell } from "../components/features/layout/admin-shell";
import { CustomerForm } from "../components/features/customers/customer-form";
import { CustomerTableLoading } from "../components/features/customers/customer-table-loading";
import { CustomerTable } from "../components/features/customers/customer-table";
import { ConfirmationModal } from "../components/features/shared/confirmation-modal";
import { Input } from "../components/ui/input";
import { Select } from "../components/ui/select";
import {
  createCustomerRequest,
  deleteCustomerRequest,
  fetchCustomersRequest,
  updateCustomerRequest
} from "../services/customer-api";
import { notify } from "../lib/notify";
import { useDebouncedValue } from "../lib/use-debounced-value";
import { useAuthStore } from "../stores/auth-store";
import type { Customer, CustomerPayload, CustomerStatus } from "../types/customer";

export const CustomersPage = () => {
  const user = useAuthStore((state) => state.user);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<CustomerStatus | "all">("all");
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [isFiltering, setIsFiltering] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleteConfirming, setIsDeleteConfirming] = useState(false);
  const [pendingDeleteCustomer, setPendingDeleteCustomer] = useState<Customer | null>(null);
  const debouncedSearch = useDebouncedValue(search, 350);

  const canManage = user?.role === "admin" || user?.role === "manager";

  const loadCustomers = async (options?: { preserveTable?: boolean }) => {
    if (!user) {
      return;
    }

    if (options?.preserveTable) {
      setIsFiltering(true);
    } else {
      setIsInitialLoading(true);
    }

    try {
      const results = await fetchCustomersRequest({
        search: debouncedSearch || undefined,
        status: statusFilter
      });
      setCustomers(results);
    } catch (error: unknown) {
      notify.error(error instanceof Error ? error.message : "Unable to fetch customers");
    } finally {
      setIsInitialLoading(false);
      setIsFiltering(false);
    }
  };

  useEffect(() => {
    void loadCustomers({
      preserveTable: customers.length > 0 || debouncedSearch.length > 0 || statusFilter !== "all"
    });
  }, [user, debouncedSearch, statusFilter]);

  const handleSubmit = async (payload: CustomerPayload): Promise<boolean> => {
    if (!user) {
      return false;
    }

    setIsSaving(true);

    try {
      if (editingCustomer) {
        await updateCustomerRequest(editingCustomer.id, payload);
        notify.success("Customer updated successfully.");
        setEditingCustomer(null);
      } else {
        await createCustomerRequest(payload);
        notify.success("Customer created successfully.");
      }

      setIsFormOpen(false);
      await loadCustomers();
      return true;
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Unable to save customer";
      notify.error(message);
      return false;
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!user) {
      return;
    }

    if (!pendingDeleteCustomer) {
      return;
    }

    setIsDeleteConfirming(true);

    try {
      await deleteCustomerRequest(pendingDeleteCustomer.id);
      await loadCustomers();
      notify.success("Customer deleted successfully.");
      setPendingDeleteCustomer(null);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Unable to delete customer";
      notify.error(message);
    } finally {
      setIsDeleteConfirming(false);
    }
  };

  const handleCreateClick = () => {
    setEditingCustomer(null);
    setIsFormOpen(true);
  };

  const handleEditClick = (customer: Customer) => {
    setEditingCustomer(customer);
    setIsFormOpen(true);
  };

  return (
    <AdminShell
      eyebrow="Pages / Customers"
      title="Customer"
      description=""
    >
      <section className="space-y-5">
        <div className="flex flex-col gap-4 rounded-[1.75rem] bg-white p-4 shadow-[0_20px_60px_rgba(11,20,55,0.08)] sm:p-6 md:flex-row md:items-end md:justify-between">
          <div className="grid flex-1 gap-4 md:grid-cols-[minmax(0,1fr)_220px]">
            <Input
              label="Search customers"
              placeholder="Search by company, contact, email, or phone"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
            <Select
              label="Status filter"
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value as CustomerStatus | "all")}
            >
              <option value="all">All customers</option>
              <option value="active">Active only</option>
              <option value="inactive">Inactive only</option>
            </Select>
          </div>

          {canManage ? (
            <button
              className="inline-flex h-11 w-full items-center justify-center rounded-full bg-[#4318FF] px-5 text-sm font-semibold text-white shadow-[0_12px_30px_rgba(67,24,255,0.22)] transition hover:bg-[#3311cc] md:w-auto"
              type="button"
              onClick={handleCreateClick}
            >
              Create customer
            </button>
          ) : null}
        </div>

        <div className="space-y-5">
          <section className="rounded-[1.75rem] bg-white p-4 shadow-[0_20px_60px_rgba(11,20,55,0.08)] sm:p-6">
            {isInitialLoading ? (
              <CustomerTableLoading />
            ) : (
              <div className="relative">
                {isFiltering ? (
                  <div className="absolute inset-0 z-10 flex items-center justify-center rounded-[1.75rem] bg-white/70 backdrop-blur-[2px]">
                    <div className="flex items-center gap-3 rounded-full bg-white px-4 py-3 text-sm font-semibold text-[#4318FF] shadow-[0_12px_30px_rgba(11,20,55,0.08)]">
                      <span className="h-3 w-3 animate-spin rounded-full border-2 border-[#C4B5FD] border-t-[#4318FF]" />
                      Filtering customers...
                    </div>
                  </div>
                ) : null}

                <CustomerTable
                  customers={customers}
                  canManage={canManage}
                  onEdit={handleEditClick}
                  onDelete={async (customer) => {
                    setPendingDeleteCustomer(customer);
                  }}
                />
              </div>
            )}
          </section>
        </div>
      </section>

      {canManage ? (
        <CustomerForm
          isOpen={isFormOpen}
          initialCustomer={editingCustomer}
          isSubmitting={isSaving}
          onClose={() => setIsFormOpen(false)}
          onCancelEdit={() => setEditingCustomer(null)}
          onSubmit={handleSubmit}
        />
      ) : null}

      <ConfirmationModal
        isOpen={pendingDeleteCustomer !== null}
        title="Delete customer?"
        description={
          pendingDeleteCustomer
            ? `You are about to delete ${pendingDeleteCustomer.companyName}. If this customer already has jobs or invoices, deletion will be blocked and you should mark the customer inactive instead.`
            : ""
        }
        confirmLabel="Delete customer"
        isConfirming={isDeleteConfirming}
        tone="danger"
        onCancel={() => {
          if (!isDeleteConfirming) {
            setPendingDeleteCustomer(null);
          }
        }}
        onConfirm={handleDelete}
      />
    </AdminShell>
  );
};
