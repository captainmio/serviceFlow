import { useEffect, useState } from "react";
import { Link, Navigate } from "react-router-dom";
import { AppShell } from "../components/features/layout/app-shell";
import { Input } from "../components/ui/input";
import { notify } from "../lib/notify";
import { useDebouncedValue } from "../lib/use-debounced-value";
import { fetchProjectApprovalsRequest } from "../services/project-approval-api";
import { useAuthStore } from "../stores/auth-store";
import type { ProjectApprovalSummary } from "../types/project-approval";

const currentMonthStart = () => {
  const today = new Date();
  return `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-01`;
};

const toMonthInput = (monthStart: string) => monthStart.slice(0, 7);

const formatMonthLabel = (monthStart: string) =>
  new Date(`${monthStart}T00:00:00`).toLocaleDateString(undefined, {
    month: "long",
    year: "numeric"
  });

const formatStatus = (status: ProjectApprovalSummary["monthStatus"]) =>
  status.charAt(0).toUpperCase() + status.slice(1);

export const ProjectApprovalsPage = () => {
  const user = useAuthStore((state) => state.user);
  const [projects, setProjects] = useState<ProjectApprovalSummary[]>([]);
  const [search, setSearch] = useState("");
  const [selectedMonthInput, setSelectedMonthInput] = useState(toMonthInput(currentMonthStart()));
  const [isLoading, setIsLoading] = useState(true);
  const [isFiltering, setIsFiltering] = useState(false);
  const debouncedSearch = useDebouncedValue(search, 350);
  const canAccess = user?.role === "admin" || user?.role === "manager";
  const selectedMonthStart = `${selectedMonthInput}-01`;
  const queueSummary = {
    projectCount: projects.length,
    pendingMembers: projects.reduce((total, project) => total + project.incompleteMemberCount, 0),
    monthRevenue: projects.reduce((total, project) => total + project.totalLoggedRevenue, 0)
  };

  const loadApprovals = async (options?: { preserveTable?: boolean }) => {
    if (!canAccess) {
      return;
    }

    if (options?.preserveTable) {
      setIsFiltering(true);
    } else {
      setIsLoading(true);
    }

    try {
      const results = await fetchProjectApprovalsRequest({
        search: debouncedSearch || undefined,
        monthStart: selectedMonthStart
      });
      setProjects(results);
    } catch (error: unknown) {
      notify.error(error instanceof Error ? error.message : "Unable to fetch project approvals");
    } finally {
      setIsLoading(false);
      setIsFiltering(false);
    }
  };

  useEffect(() => {
    void loadApprovals({
      preserveTable: projects.length > 0 || debouncedSearch.length > 0
    });
  }, [canAccess, debouncedSearch, selectedMonthStart]);

  if (user?.role === "team_member") {
    return <Navigate to="/work-logs" replace />;
  }

  if (!canAccess) {
    return <Navigate to="/login" replace />;
  }

  return (
    <AppShell
      eyebrow="Pages / Project Approvals"
      title="Project approvals"
      description="Review submitted work logs, spot incomplete team member submissions, and finalize project months."
    >
      <section className="space-y-5">
        <div className="grid gap-4 xl:grid-cols-[minmax(0,1.5fr)_minmax(320px,1fr)]">
          <div className="rounded-[1.75rem] bg-white p-5 shadow-[0_20px_60px_rgba(11,20,55,0.08)] sm:p-6">

            <div className="mt-5 grid gap-4 lg:grid-cols-[minmax(0,1fr)_240px]">
              <Input
                label="Search project name"
                placeholder="Search by project or customer"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
              />
            </div>

            <div className="mt-4">
              <Input
                label="Project month"
                type="month"
                value={selectedMonthInput}
                onChange={(event) => setSelectedMonthInput(event.target.value)}
              />
            </div>
          </div>

          <div className="rounded-[1.75rem] bg-white p-5 shadow-[0_20px_60px_rgba(11,20,55,0.08)] sm:p-6">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#A3AED0]">Month snapshot</p>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <div className="rounded-2xl bg-[#F8FAFF] p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#A3AED0]">Projects</p>
                <p className="mt-2 text-2xl font-bold text-[#2B3674]">{queueSummary.projectCount}</p>
              </div>
              <div className="rounded-2xl bg-[#F8FAFF] p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#A3AED0]">Still incomplete</p>
                <p className="mt-2 text-2xl font-bold text-[#2B3674]">{queueSummary.pendingMembers}</p>
              </div>
              <div className="rounded-2xl bg-[#F8FAFF] p-4 sm:col-span-2">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#A3AED0]">Visible revenue</p>
                <p className="mt-2 text-2xl font-bold text-[#2B3674]">${queueSummary.monthRevenue.toFixed(2)}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="relative">
          {isFiltering && !isLoading ? (
            <div className="absolute inset-0 z-10 flex items-center justify-center rounded-[1.75rem] bg-white/70 backdrop-blur-[2px]">
              <div className="flex items-center gap-3 rounded-full bg-white px-4 py-3 text-sm font-semibold text-[#4318FF] shadow-[0_12px_30px_rgba(11,20,55,0.08)]">
                <span className="h-3 w-3 animate-spin rounded-full border-2 border-[#C4B5FD] border-t-[#4318FF]" />
                Refreshing approval queue...
              </div>
            </div>
          ) : null}

          {isLoading ? (
            <section className="rounded-[1.75rem] bg-white p-10 text-center text-sm font-medium text-[#707EAE] shadow-[0_20px_60px_rgba(11,20,55,0.08)]">
              Loading approval-ready projects...
            </section>
          ) : projects.length === 0 ? (
            <section className="rounded-[1.75rem] bg-white p-10 text-center shadow-[0_20px_60px_rgba(11,20,55,0.08)]">
              <h2 className="text-xl font-bold text-[#2B3674]">No projects are ready for approval</h2>
              <p className="mt-3 text-sm leading-7 text-[#707EAE]">
                Try another month or wait for at least one assigned team member to complete all weekly submissions for the selected month.
              </p>
            </section>
          ) : (
            <div className="grid gap-4">
              {projects.map((project) => (
                <Link
                  key={`${project.projectId}-${project.monthStart}`}
                  to={`/project-approvals/${project.projectId}?month=${project.monthStart.slice(0, 7)}`}
                  className="group rounded-[1.75rem] border border-transparent bg-white p-5 shadow-[0_20px_60px_rgba(11,20,55,0.08)] transition hover:-translate-y-0.5 hover:border-[#D9E1F2] hover:bg-[#F8FAFF] hover:shadow-[0_24px_70px_rgba(11,20,55,0.12)] sm:p-6"
                >
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                    <div className="min-w-0">
                      <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#A3AED0]">
                        {formatMonthLabel(project.monthStart)}
                      </p>
                      <h2 className="mt-2 truncate text-2xl font-bold text-[#2B3674] group-hover:text-[#4318FF]">
                        {project.projectTitle}
                      </h2>
                      <p className="mt-2 text-sm text-[#707EAE]">{project.customerName}</p>
                    </div>

                    <div className="flex items-center gap-2 self-start">
                      <span className="rounded-full bg-[#F4F7FE] px-3 py-2 text-xs font-semibold uppercase tracking-[0.16em] text-[#4318FF]">
                        {formatStatus(project.monthStatus)}
                      </span>
                      <span
                        className={`rounded-full px-3 py-2 text-xs font-semibold uppercase tracking-[0.16em] ${
                          project.canFinalize
                            ? "bg-emerald-100 text-emerald-700"
                            : "bg-amber-100 text-amber-700"
                        }`}
                      >
                        {project.canFinalize ? "Ready to finalize" : "Needs review"}
                      </span>
                    </div>
                  </div>

                  <div className="mt-5 grid gap-3 lg:grid-cols-3 xl:grid-cols-4">
                    <div className="rounded-2xl bg-[#F8FAFF] p-4">
                      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#A3AED0]">Incomplete</p>
                      <p className="mt-2 text-xl font-bold text-[#2B3674]">{project.incompleteMemberCount}</p>
                    </div>
                    <div className="rounded-2xl bg-[#F8FAFF] p-4">
                      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#A3AED0]">Line items</p>
                      <p className="mt-2 text-xl font-bold text-[#2B3674]">{project.lineItemCount}</p>
                    </div>
                    <div className="rounded-2xl bg-[#F8FAFF] p-4">
                      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#A3AED0]">Month revenue</p>
                      <p className="mt-2 text-xl font-bold text-[#2B3674]">${project.totalLoggedRevenue.toFixed(2)}</p>
                    </div>
                  </div>

                  <div className="mt-5 flex items-center justify-between border-t border-[#EEF2FF] pt-4 text-sm text-[#707EAE]">
                    <span>{project.submittedWeekCount} submitted member-weeks tracked</span>
                    <span className="font-semibold text-[#4318FF]">Open review</span>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </section>
    </AppShell>
  );
};
