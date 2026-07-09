import { useEffect, useMemo, useState } from "react";
import { z } from "zod";
import { AppShell } from "../components/features/layout/app-shell";
import { ConfirmationModal } from "../components/features/shared/confirmation-modal";
import { SlideOverPanel } from "../components/features/shared/slide-over-panel";
import { WorkLogEntryForm } from "../components/features/work-logs/work-log-entry-form";
import { WorkLogTable } from "../components/features/work-logs/work-log-table";
import { Input } from "../components/ui/input";
import { Select } from "../components/ui/select";
import { notify } from "../lib/notify";
import { fetchProjectsRequest } from "../services/project-api";
import {
  createWorkLogRequest,
  deleteWorkLogRequest,
  fetchWorkLogOptionsRequest,
  fetchWorkLogPeriodRequest,
  fetchWorkLogsRequest,
  updateWorkLogRequest
} from "../services/work-log-api";
import { useAuthStore } from "../stores/auth-store";
import type { Project } from "../types/project";
import type { WorkLog, WorkLogOption, WorkLogPeriod, WorkLogPayload } from "../types/work-log";

const monthStartSchema = z.string().regex(/^\d{4}-\d{2}$/);

const currentMonthInput = () => {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, "0");
  return `${year}-${month}`;
};

const toMonthStart = (monthInput: string) => `${monthInput}-01`;

const formatMonthStatus = (status: WorkLogPeriod["status"]) =>
  status.charAt(0).toUpperCase() + status.slice(1);

const formatLocalWeekStart = () => {
  const today = new Date();
  const date = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const day = date.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  date.setDate(date.getDate() + diff);

  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const dayOfMonth = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${dayOfMonth}`;
};

const getWeekStartFromDate = (dateValue: Date) => {
  const date = new Date(dateValue.getFullYear(), dateValue.getMonth(), dateValue.getDate());
  const day = date.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  date.setDate(date.getDate() + diff);
  return date;
};

const formatDateKey = (dateValue: Date) => {
  const year = dateValue.getFullYear();
  const month = String(dateValue.getMonth() + 1).padStart(2, "0");
  const day = String(dateValue.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const formatWeekOptionLabel = (weekStart: string) => {
  const startDate = new Date(`${weekStart}T00:00:00`);
  const endDate = new Date(startDate);
  endDate.setDate(endDate.getDate() + 6);

  const startLabel = startDate.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric"
  });
  const endLabel = endDate.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric"
  });

  return `${startLabel} - ${endLabel}`;
};

const buildWeekOptions = (monthInput: string) => {
  const [yearValue, monthValue] = monthInput.split("-").map(Number);

  if (!yearValue || !monthValue) {
    return [];
  }

  const firstDayOfMonth = new Date(yearValue, monthValue - 1, 1);
  const lastDayOfMonth = new Date(yearValue, monthValue, 0);
  const currentWeekStart = getWeekStartFromDate(firstDayOfMonth);
  const weeks: Array<{ value: string; label: string }> = [];

  while (currentWeekStart <= lastDayOfMonth) {
    const value = formatDateKey(currentWeekStart);
    weeks.push({
      value,
      label: formatWeekOptionLabel(value)
    });
    currentWeekStart.setDate(currentWeekStart.getDate() + 7);
  }

  return weeks;
};

export const WorkLogsPage = () => {
  const user = useAuthStore((state) => state.user);
  const [projects, setProjects] = useState<Project[]>([]);
  const [workLogOptions, setWorkLogOptions] = useState<WorkLogOption[]>([]);
  const [workLogs, setWorkLogs] = useState<WorkLog[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState("");
  const [selectedMemberId, setSelectedMemberId] = useState("");
  const [selectedMonthInput, setSelectedMonthInput] = useState(currentMonthInput());
  const [selectedWeekStart, setSelectedWeekStart] = useState(formatLocalWeekStart());
  const [period, setPeriod] = useState<WorkLogPeriod | null>(null);
  const [editingLog, setEditingLog] = useState<WorkLog | null>(null);
  const [logToDelete, setLogToDelete] = useState<WorkLog | null>(null);
  const [isEntryPanelOpen, setIsEntryPanelOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isFiltering, setIsFiltering] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const canCreate = user?.role === "manager" || user?.role === "team_member";
  const canViewLoggedAmount = user?.role !== "team_member";
  const selectedMonthStart = toMonthStart(selectedMonthInput);
  const hasSelectedProject = selectedProjectId.length > 0;
  const hasSelectedMember = user?.role === "team_member" ? hasSelectedProject : selectedMemberId.length > 0;
  const canOpenWorkLogEntry = Boolean(canCreate && hasSelectedProject && hasSelectedMember);
  const weekOptions = useMemo(() => buildWeekOptions(selectedMonthInput), [selectedMonthInput]);

  const availableProjects = useMemo(() => {
    if (user?.role === "team_member") {
      const uniqueProjects = new Map<string, { id: string; title: string; customerName: string }>();

      workLogOptions.forEach((option) => {
        uniqueProjects.set(option.projectId, {
          id: option.projectId,
          title: option.projectTitle,
          customerName: option.customerName
        });
      });

      return Array.from(uniqueProjects.values());
    }

    return projects.map((project) => ({
      id: project.id,
      title: project.title,
      customerName: project.customerName
    }));
  }, [projects, user?.role, workLogOptions]);

  const loadReferenceData = async () => {
    if (!user) {
      return;
    }

    try {
      const [projectResults, optionResults] = await Promise.all([
        user.role === "team_member" ? Promise.resolve<Project[]>([]) : fetchProjectsRequest(),
        user.role === "admin" ? Promise.resolve<WorkLogOption[]>([]) : fetchWorkLogOptionsRequest()
      ]);

      setProjects(projectResults);
      setWorkLogOptions(optionResults);
    } catch (error: unknown) {
      notify.error(error instanceof Error ? error.message : "Unable to load work-log reference data");
    }
  };

  const loadWorkLogs = async (options?: { preserveTable?: boolean }) => {
    if (!user) {
      return;
    }

    if (!selectedProjectId) {
      setWorkLogs([]);
      setIsLoading(false);
      setIsFiltering(false);
      return;
    }

    const monthValidation = monthStartSchema.safeParse(selectedMonthInput);

    if (!monthValidation.success) {
      notify.error("Select a valid month to view work logs.");
      return;
    }

    if (options?.preserveTable) {
      setIsFiltering(true);
    } else {
      setIsLoading(true);
    }

    try {
      const results = await fetchWorkLogsRequest({
        projectId: selectedProjectId || undefined,
        memberId: user.role === "team_member" ? user.id : selectedMemberId !== "all" ? selectedMemberId : undefined,
        monthStart: selectedMonthStart
      });
      setWorkLogs(results);
    } catch (error: unknown) {
      notify.error(error instanceof Error ? error.message : "Unable to fetch work logs");
    } finally {
      setIsLoading(false);
      setIsFiltering(false);
    }
  };

  useEffect(() => {
    void loadReferenceData();
  }, [user]);

  useEffect(() => {
    if (selectedProjectId && !availableProjects.some((project) => project.id === selectedProjectId)) {
      setSelectedProjectId("");
    }
  }, [availableProjects, selectedProjectId]);

  useEffect(() => {
    if (weekOptions.length === 0) {
      if (selectedWeekStart) {
        setSelectedWeekStart("");
      }
      return;
    }

    const hasSelectedWeek = weekOptions.some((weekOption) => weekOption.value === selectedWeekStart);

    if (hasSelectedWeek) {
      return;
    }

    const currentWeekStart = formatLocalWeekStart();
    const hasCurrentWeek = weekOptions.some((weekOption) => weekOption.value === currentWeekStart);

    setSelectedWeekStart(hasCurrentWeek ? currentWeekStart : (weekOptions[0]?.value ?? ""));
  }, [selectedMonthInput, selectedWeekStart, weekOptions]);

  useEffect(() => {
    if (!selectedProjectId) {
      if (selectedMemberId) {
        setSelectedMemberId("");
      }
      return;
    }

    if (user?.role !== "team_member" && !selectedMemberId) {
      setSelectedMemberId("all");
    }
  }, [selectedMemberId, selectedProjectId, user?.role]);

  useEffect(() => {
    if (!user) {
      return;
    }

    void loadWorkLogs({
      preserveTable: workLogs.length > 0 || selectedProjectId.length > 0 || selectedMemberId.length > 0
    });
  }, [user, selectedProjectId, selectedMemberId, selectedMonthInput]);

  useEffect(() => {
    if (!user || !selectedProjectId) {
      setPeriod(null);
      return;
    }

    void (async () => {
      try {
        const nextPeriod = await fetchWorkLogPeriodRequest(selectedProjectId, selectedMonthStart);
        setPeriod(nextPeriod);
      } catch (error: unknown) {
        notify.error(error instanceof Error ? error.message : "Unable to fetch this work-log month");
      }
    })();
  }, [user, selectedProjectId, selectedMonthStart]);

  const memberOptions = useMemo(() => {
    const uniqueMembers = new Map<string, WorkLog["member"]>();

    workLogs.forEach((workLog) => {
      uniqueMembers.set(workLog.member.id, workLog.member);
    });

    return Array.from(uniqueMembers.values()).sort((left, right) => left.name.localeCompare(right.name));
  }, [workLogs]);

  const filteredWorkLogs = useMemo(() => {
    if (!selectedWeekStart) {
      return [];
    }

    return workLogs.filter((workLog) => workLog.weekStart === selectedWeekStart);
  }, [selectedWeekStart, workLogs]);

  const summary = useMemo(() => {
    return {
      monthHours: workLogs.reduce((total, workLog) => total + workLog.hours, 0),
      loggedAmount: filteredWorkLogs.reduce((total, workLog) => total + workLog.lineTotal, 0),
      selectedWeekHours: filteredWorkLogs.reduce((total, workLog) => total + workLog.hours, 0)
    };
  }, [filteredWorkLogs, workLogs]);

  const handleSaveWorkLog = async (payload: WorkLogPayload) => {
    setIsSaving(true);

    try {
      if (editingLog) {
        await updateWorkLogRequest(editingLog.id, payload);
        notify.success("Work log updated successfully.");
      } else {
        await createWorkLogRequest(payload);
        notify.success("Work log saved successfully.");
      }

      setEditingLog(null);
      setIsEntryPanelOpen(false);
      await loadWorkLogs({ preserveTable: true });
    } catch (error: unknown) {
      notify.error(error instanceof Error ? error.message : "Unable to save this work log");
      throw error;
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteWorkLog = async () => {
    if (!logToDelete) {
      return;
    }

    setIsDeleting(true);

    try {
      await deleteWorkLogRequest(logToDelete.id);
      setEditingLog((currentLog) => (currentLog?.id === logToDelete.id ? null : currentLog));
      setLogToDelete(null);
      notify.success("Work log deleted successfully.");
      await loadWorkLogs({ preserveTable: true });
    } catch (error: unknown) {
      notify.error(error instanceof Error ? error.message : "Unable to delete this work log");
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <AppShell
      eyebrow="Pages / Work Logs"
      title="Work logs"
      description="Track daily work by service, review monthly status, and manage visible project logs."
    >
      <section className="space-y-5">
        <div className="grid gap-4 xl:grid-cols-[minmax(0,1.5fr)_minmax(320px,1fr)]">
          <div className="rounded-[1.75rem] bg-white p-5 shadow-[0_20px_60px_rgba(11,20,55,0.08)] sm:p-6">
            <div className="grid gap-4 md:grid-cols-3">
              <div className="rounded-[1.5rem] bg-[#F8FAFF] p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#A3AED0]">Selected week</p>
                <p className="mt-3 text-2xl font-bold text-[#2B3674]">{summary.selectedWeekHours.toFixed(2)} hrs</p>
              </div>
              <div className="rounded-[1.5rem] bg-[#F8FAFF] p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#A3AED0]">Selected month</p>
                <p className="mt-3 text-2xl font-bold text-[#2B3674]">{summary.monthHours.toFixed(2)} hrs</p>
              </div>
              {canViewLoggedAmount ? (
                <div className="rounded-[1.5rem] bg-[#F8FAFF] p-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#A3AED0]">Logged amount</p>
                  <p className="mt-3 text-2xl font-bold text-[#2B3674]">${summary.loggedAmount.toFixed(2)}</p>
                </div>
              ) : null}
            </div>

            <div className="mt-5 space-y-4">
              <div className="grid gap-4 md:grid-cols-[220px_minmax(0,1fr)]">
                <Input
                  label="Month"
                  type="month"
                  value={selectedMonthInput}
                  onChange={(event) => setSelectedMonthInput(event.target.value)}
                />

                <Select
                  label="Week"
                  value={selectedWeekStart}
                  onChange={(event) => setSelectedWeekStart(event.target.value)}
                >
                  {weekOptions.map((weekOption) => (
                    <option key={weekOption.value} value={weekOption.value}>
                      {weekOption.label}
                    </option>
                  ))}
                </Select>
              </div>

              <div className="grid gap-4 md:grid-cols-[minmax(0,1fr)_220px]">
                <Select
                  label="Project filter"
                  value={selectedProjectId}
                  onChange={(event) => setSelectedProjectId(event.target.value)}
                >
                  <option value="">-- SELECT PROJECT --</option>
                  {availableProjects.map((project) => (
                    <option key={project.id} value={project.id}>
                      {project.title} - {project.customerName}
                    </option>
                  ))}
                </Select>

                {user?.role === "team_member" ? (
                  <Input label="Team member filter" value={hasSelectedProject ? user.name : ""} readOnly disabled />
                ) : (
                  <Select
                    label="Team member filter"
                    value={selectedMemberId}
                    disabled={!hasSelectedProject}
                    onChange={(event) => setSelectedMemberId(event.target.value)}
                  >
                    {hasSelectedProject ? (
                      <option value="all">All visible members</option>
                    ) : (
                      <option value="">Select team member</option>
                    )}
                    {memberOptions.map((member) => (
                      <option key={member.id} value={member.id}>
                        {member.name}
                      </option>
                    ))}
                  </Select>
                )}
              </div>
            </div>

          </div>

          <div className="flex flex-col rounded-[1.75rem] bg-white p-5 shadow-[0_20px_60px_rgba(11,20,55,0.08)] sm:p-6">
            <p className="text-sm font-medium text-[#A3AED0]">Monthly status</p>
            <h2 className="mt-1 text-xl font-bold text-[#2B3674]">
              {period ? `${period.projectTitle} - ${selectedMonthInput}` : "Select a project month"}
            </h2>
            <p className="mt-3 inline-flex rounded-full bg-[#F4F7FE] px-3 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-[#4318FF]">
              {period ? formatMonthStatus(period.status) : "Pending"}
            </p>
            <p className="mt-4 text-sm leading-7 text-[#707EAE]">
              {period?.status === "approved"
                ? "This month is locked. Managers can no longer edit or delete entries here."
                : period?.status === "rejected"
                  ? period.rejectionReason || "This month was rejected and can be corrected before resubmission."
                  : "This month is still open for daily entries and adjustments."}
            </p>

            {period?.reviewedBy ? (
              <p className="mt-3 text-sm text-[#707EAE]">
                Reviewed by {period.reviewedBy.name}
                {period.reviewedAt ? ` on ${new Date(period.reviewedAt).toLocaleString()}` : ""}
              </p>
            ) : null}

            {canCreate ? (
              <div className="flex items-end justify-start xl:pl-[calc((100%-0px)*0)] mt-auto">
                <button
                  type="button"
                  className="w-full inline-flex h-12 items-center justify-center rounded-2xl bg-[#4318FF] px-5 text-sm font-semibold text-white shadow-[0_12px_30px_rgba(67,24,255,0.22)] transition hover:bg-[#3311cc] disabled:cursor-not-allowed disabled:bg-[#C7D2FE] disabled:text-white disabled:shadow-none"
                  disabled={!canOpenWorkLogEntry}
                  onClick={() => {
                    setEditingLog(null);
                    setIsEntryPanelOpen(true);
                  }}
                >
                  Add work log
                </button>
              </div>
            ) : null}
          </div>
        </div>

        <div className="relative">
          {isFiltering && !isLoading ? (
            <div className="absolute inset-0 z-10 flex items-center justify-center rounded-[1.75rem] bg-white/70 backdrop-blur-[2px]">
              <div className="flex items-center gap-3 rounded-full bg-white px-4 py-3 text-sm font-semibold text-[#4318FF] shadow-[0_12px_30px_rgba(11,20,55,0.08)]">
                <span className="h-3 w-3 animate-spin rounded-full border-2 border-[#C4B5FD] border-t-[#4318FF]" />
                Refreshing work logs...
              </div>
            </div>
          ) : null}

          {isLoading ? (
            <section className="rounded-[1.75rem] bg-white p-10 text-center text-sm font-medium text-[#707EAE] shadow-[0_20px_60px_rgba(11,20,55,0.08)]">
              Loading work logs...
            </section>
          ) : (
            <WorkLogTable
              workLogs={filteredWorkLogs}
              canViewLoggedAmount={Boolean(canViewLoggedAmount)}
              onEdit={(workLog) => {
                setEditingLog(workLog);
                setIsEntryPanelOpen(true);
              }}
              onDelete={(workLog) => setLogToDelete(workLog)}
            />
          )}
        </div>
      </section>

      <ConfirmationModal
        isOpen={Boolean(logToDelete)}
        title="Delete work log?"
        description={
          logToDelete
            ? `Are you sure you want to delete the ${logToDelete.hours.toFixed(2)} hour entry on ${new Date(logToDelete.workDate).toLocaleDateString()} for ${logToDelete.projectTitle}?`
            : ""
        }
        confirmLabel="Delete work log"
        tone="danger"
        isConfirming={isDeleting}
        onCancel={() => {
          if (!isDeleting) {
            setLogToDelete(null);
          }
        }}
        onConfirm={handleDeleteWorkLog}
      />

      <SlideOverPanel
        isOpen={isEntryPanelOpen}
        title={editingLog ? "Update work log" : "Add work log"}
        description={
          editingLog
            ? "Adjust the selected work-log record while the month remains open."
            : "Capture daily project work with the correct project and service selection."
        }
        onClose={() => {
          if (!isSaving) {
            setIsEntryPanelOpen(false);
            setEditingLog(null);
          }
        }}
      >
        <WorkLogEntryForm
          options={workLogOptions}
          editingLog={editingLog}
          isSaving={isSaving}
          canCreate={Boolean(canCreate)}
          userRole={user?.role ?? "team_member"}
          initialProjectId={selectedProjectId}
          onSubmit={handleSaveWorkLog}
          onCancelEdit={() => {
            setEditingLog(null);
            setIsEntryPanelOpen(false);
          }}
        />
      </SlideOverPanel>
    </AppShell>
  );
};
