import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ProjectTable } from "../components/features/projects/project-table";
import { AdminShell } from "../components/features/layout/admin-shell";
import { ConfirmationModal } from "../components/features/shared/confirmation-modal";
import { Input } from "../components/ui/input";
import { Select } from "../components/ui/select";
import { useDebouncedValue } from "../lib/use-debounced-value";
import { notify } from "../lib/notify";
import { fetchCustomersRequest } from "../services/customer-api";
import { cancelProjectRequest, fetchProjectsRequest } from "../services/project-api";
import { useAuthStore } from "../stores/auth-store";
import type { Customer } from "../types/customer";
import type { Project, ProjectStatus } from "../types/project";

const projectStatusOptions: Array<{ value: ProjectStatus | "all"; label: string }> = [
  { value: "all", label: "All statuses" },
  { value: "draft", label: "Draft" },
  { value: "assigned", label: "Assigned" },
  { value: "in_progress", label: "In Progress" },
  { value: "submitted", label: "Submitted" },
  { value: "approved", label: "Approved" },
  { value: "rejected", label: "Rejected" },
  { value: "invoiced", label: "Invoiced" },
  { value: "paid", label: "Paid" },
  { value: "cancelled", label: "Cancelled" }
];

export const ProjectsPage = () => {
  const user = useAuthStore((state) => state.user);
  const [projects, setProjects] = useState<Project[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<ProjectStatus | "all">("all");
  const [customerFilter, setCustomerFilter] = useState("all");
  const [pendingCancelProject, setPendingCancelProject] = useState<Project | null>(null);
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [isFiltering, setIsFiltering] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);
  const debouncedSearch = useDebouncedValue(search, 350);

  const canManage = user?.role === "admin" || user?.role === "manager";

  const loadProjects = async (options?: { preserveTable?: boolean }) => {
    if (!user) {
      return;
    }

    if (options?.preserveTable) {
      setIsFiltering(true);
    } else {
      setIsInitialLoading(true);
    }

    try {
      const results = await fetchProjectsRequest({
        search: debouncedSearch || undefined,
        status: statusFilter,
        customerId: customerFilter !== "all" ? customerFilter : undefined
      });
      setProjects(results);
    } catch (error: unknown) {
      notify.error(error instanceof Error ? error.message : "Unable to fetch projects");
    } finally {
      setIsInitialLoading(false);
      setIsFiltering(false);
    }
  };

  useEffect(() => {
    if (!user) {
      return;
    }

    void (async () => {
      try {
        const [customerResults] = await Promise.all([
          fetchCustomersRequest({
            status: "active"
          })
        ]);
        setCustomers(customerResults);
      } catch (error: unknown) {
        notify.error(error instanceof Error ? error.message : "Unable to fetch customers");
      }
    })();
  }, [user]);

  useEffect(() => {
    void loadProjects({
      preserveTable:
        projects.length > 0 || debouncedSearch.length > 0 || statusFilter !== "all" || customerFilter !== "all"
    });
  }, [user, debouncedSearch, statusFilter, customerFilter]);

  const handleCancel = async () => {
    if (!pendingCancelProject) {
      return;
    }

    setIsCancelling(true);

    try {
      await cancelProjectRequest(pendingCancelProject.id);
      notify.success("Project cancelled successfully.");
      setPendingCancelProject(null);
      await loadProjects();
    } catch (error: unknown) {
      notify.error(error instanceof Error ? error.message : "Unable to cancel project");
    } finally {
      setIsCancelling(false);
    }
  };

  return (
    <AdminShell
      eyebrow="Pages / Projects"
      title="Project management"
      description=""
    >
      <section className="space-y-5">
        <div className="flex flex-col gap-4 rounded-[1.75rem] bg-white p-4 shadow-[0_20px_60px_rgba(11,20,55,0.08)] sm:p-6">
          <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_220px_260px]">
            <Input
              label="Search projects"
              placeholder="Search by title or customer"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
            <Select
              label="Status filter"
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value as ProjectStatus | "all")}
            >
              {projectStatusOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </Select>
            <Select
              label="Customer filter"
              value={customerFilter}
              onChange={(event) => setCustomerFilter(event.target.value)}
            >
              <option value="all">All customers</option>
              {customers.map((customer) => (
                <option key={customer.id} value={customer.id}>
                  {customer.companyName}
                </option>
              ))}
            </Select>
          </div>

          {canManage ? (
            <div className="flex justify-end">
              <Link
                to="/projects/new"
                className="inline-flex h-11 items-center justify-center rounded-full bg-[#4318FF] px-5 text-sm font-semibold text-white shadow-[0_12px_30px_rgba(67,24,255,0.22)] transition hover:bg-[#3311cc]"
              >
                Create project
              </Link>
            </div>
          ) : null}
        </div>

        <div className="relative">
          {isFiltering && !isInitialLoading ? (
            <div className="absolute inset-0 z-10 flex items-center justify-center rounded-[1.75rem] bg-white/70 backdrop-blur-[2px]">
              <div className="flex items-center gap-3 rounded-full bg-white px-4 py-3 text-sm font-semibold text-[#4318FF] shadow-[0_12px_30px_rgba(11,20,55,0.08)]">
                <span className="h-3 w-3 animate-spin rounded-full border-2 border-[#C4B5FD] border-t-[#4318FF]" />
                Filtering projects...
              </div>
            </div>
          ) : null}

          {isInitialLoading ? (
            <section className="rounded-[1.75rem] bg-white p-10 text-center text-sm font-medium text-[#707EAE] shadow-[0_20px_60px_rgba(11,20,55,0.08)]">
              Loading projects...
            </section>
          ) : (
            <ProjectTable
              projects={projects}
              canManage={canManage}
              onCancel={setPendingCancelProject}
            />
          )}
        </div>
      </section>

      <ConfirmationModal
        isOpen={pendingCancelProject !== null}
        title="Cancel project?"
        description={
          pendingCancelProject
            ? `Cancel ${pendingCancelProject.title}? This will move the project to Cancelled and keep its history visible.`
            : ""
        }
        confirmLabel="Cancel project"
        isConfirming={isCancelling}
        tone="danger"
        onCancel={() => {
          if (!isCancelling) {
            setPendingCancelProject(null);
          }
        }}
        onConfirm={handleCancel}
      />
    </AdminShell>
  );
};
