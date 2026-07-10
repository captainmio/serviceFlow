import { useEffect, useMemo, useState } from "react";
import { Fragment } from "react";
import { Link, Navigate, useSearchParams } from "react-router-dom";
import { z } from "zod";
import { AppShell } from "../components/features/layout/app-shell";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Textarea } from "../components/ui/textarea";
import { notify } from "../lib/notify";
import {
  fetchProjectApprovalDetailRequest,
  finalizeProjectApprovalMonthRequest,
  reviewProjectApprovalLineRequest
} from "../services/project-approval-api";
import { useAuthStore } from "../stores/auth-store";
import type { ProjectApprovalDetail, ProjectApprovalLine } from "../types/project-approval";

const monthSchema = z.string().regex(/^\d{4}-\d{2}$/);

const currentMonthInput = () => {
  const today = new Date();
  return `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}`;
};

const formatMonthStatus = (status: ProjectApprovalDetail["monthStatus"]) =>
  status.charAt(0).toUpperCase() + status.slice(1);

const formatWeekLabel = (weekStart: string) => {
  const start = new Date(`${weekStart}T00:00:00`);
  const end = new Date(start);
  end.setDate(end.getDate() + 6);

  return `${start.toLocaleDateString(undefined, { month: "short", day: "numeric" })} - ${end.toLocaleDateString(
    undefined,
    { month: "short", day: "numeric" }
  )}`;
};

const formatReviewOptionLabel = (status: ProjectApprovalLine["reviewStatus"]) => {
  if (status === "rejected") {
    return "Rejected";
  }

  if (status === "approved") {
    return "Approved";
  }

  return "Not reviewed";
};

interface ProjectApprovalDetailPageProps {
  projectId: string;
}

export const ProjectApprovalDetailPage = ({ projectId }: ProjectApprovalDetailPageProps) => {
  const user = useAuthStore((state) => state.user);
  const [searchParams, setSearchParams] = useSearchParams();
  const [detail, setDetail] = useState<ProjectApprovalDetail | null>(null);
  const [selectedMonthInput, setSelectedMonthInput] = useState(searchParams.get("month") ?? currentMonthInput());
  const [rejectingLine, setRejectingLine] = useState<ProjectApprovalLine | null>(null);
  const [rejectionReason, setRejectionReason] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [savingLineId, setSavingLineId] = useState<string | null>(null);
  const [isFinalizing, setIsFinalizing] = useState(false);
  const [expandedWeeks, setExpandedWeeks] = useState<string[]>([]);
  const canAccess = user?.role === "admin" || user?.role === "manager";
  const selectedMonthStart = `${selectedMonthInput}-01`;

  const loadDetail = async (options?: { preserveContent?: boolean }) => {
    if (!canAccess) {
      return;
    }

    const monthValidation = monthSchema.safeParse(selectedMonthInput);

    if (!monthValidation.success) {
      notify.error("Select a valid month before loading approval details.");
      return;
    }

    if (!options?.preserveContent) {
      setIsLoading(true);
    }

    try {
      const result = await fetchProjectApprovalDetailRequest(projectId, selectedMonthStart);
      setDetail(result);
    } catch (error: unknown) {
      notify.error(error instanceof Error ? error.message : "Unable to fetch project approval detail");
    } finally {
      if (!options?.preserveContent) {
        setIsLoading(false);
      }
    }
  };

  useEffect(() => {
    void loadDetail();
  }, [canAccess, projectId, selectedMonthInput]);

  useEffect(() => {
    setSearchParams((currentParams) => {
      const nextParams = new URLSearchParams(currentParams);
      nextParams.set("month", selectedMonthInput);
      return nextParams;
    });
  }, [selectedMonthInput, setSearchParams]);

  const groupedByWeek = useMemo(() => {
    if (!detail) {
      return [];
    }

    const groups = new Map<string, ProjectApprovalLine[]>();

    detail.workLogs.forEach((workLog) => {
      groups.set(workLog.weekStart, [...(groups.get(workLog.weekStart) ?? []), workLog]);
    });

    return Array.from(groups.entries()).sort(([left], [right]) => left.localeCompare(right));
  }, [detail]);

  const weekSections = useMemo(
    () =>
      groupedByWeek.map(([weekStart, lines]) => ({
        weekStart,
        lines,
        totalRevenue: lines.reduce((sum, line) => sum + line.lineTotal, 0),
        totalHours: lines.reduce((sum, line) => sum + line.hours, 0),
        pendingCount: lines.filter((line) => line.reviewStatus === "pending").length,
        rejectedCount: lines.filter((line) => line.reviewStatus === "rejected").length,
        approvedCount: lines.filter((line) => line.reviewStatus === "approved").length
      })),
    [groupedByWeek]
  );

  useEffect(() => {
    if (weekSections.length === 0) {
      setExpandedWeeks([]);
      return;
    }

    const highlightedWeeks = weekSections
      .filter((section) => section.pendingCount > 0 || section.rejectedCount > 0)
      .map((section) => section.weekStart);

    setExpandedWeeks(highlightedWeeks.length > 0 ? highlightedWeeks : [weekSections[0]?.weekStart ?? ""]);
  }, [weekSections]);

  const toggleWeekSection = (weekStart: string) => {
    setExpandedWeeks((currentWeeks) =>
      currentWeeks.includes(weekStart)
        ? currentWeeks.filter((currentWeekStart) => currentWeekStart !== weekStart)
        : [...currentWeeks, weekStart]
    );
  };

  const handleApprove = async (line: ProjectApprovalLine) => {
    setSavingLineId(line.id);

    try {
      await reviewProjectApprovalLineRequest(line.id, {
        status: "approved",
        rejectionReason: null
      });
      await loadDetail({ preserveContent: true });
    } catch (error: unknown) {
      notify.error(error instanceof Error ? error.message : "Unable to approve this work log line");
    } finally {
      setSavingLineId(null);
    }
  };

  const handleClearReview = async (line: ProjectApprovalLine) => {
    setSavingLineId(line.id);

    try {
      await reviewProjectApprovalLineRequest(line.id, {
        status: "pending",
        rejectionReason: null
      });
      await loadDetail({ preserveContent: true });
    } catch (error: unknown) {
      notify.error(error instanceof Error ? error.message : "Unable to clear this work log review");
    } finally {
      setSavingLineId(null);
    }
  };

  const handleReject = async () => {
    if (!rejectingLine) {
      return;
    }

    if (!rejectionReason.trim()) {
      notify.error("Provide a rejection reason before rejecting this work log line.");
      return;
    }

    setSavingLineId(rejectingLine.id);

    try {
      await reviewProjectApprovalLineRequest(rejectingLine.id, {
        status: "rejected",
        rejectionReason: rejectionReason.trim()
      });
      setRejectingLine(null);
      setRejectionReason("");
      await loadDetail({ preserveContent: true });
    } catch (error: unknown) {
      notify.error(error instanceof Error ? error.message : "Unable to reject this work log line");
    } finally {
      setSavingLineId(null);
    }
  };

  const handleFinalize = async () => {
    if (!detail) {
      return;
    }

    if (detail.monthStatus === "approved" && detail.incompleteMembers.length === 0) {
      notify.error("This project month has already been finalized.");
      return;
    }

    if (detail.workLogs.length === 0) {
      notify.error("At least one reviewed work log line is required before finalizing this month.");
      return;
    }

    setIsFinalizing(true);

    try {
      const result = await finalizeProjectApprovalMonthRequest(projectId, selectedMonthStart);
      setDetail(result);
      notify.success("Project month approval submitted successfully.");
    } catch (error: unknown) {
      notify.error(error instanceof Error ? error.message : "Unable to finalize this project month");
    } finally {
      setIsFinalizing(false);
    }
  };

  if (user?.role === "team_member") {
    return <Navigate to="/work-logs" replace />;
  }

  if (!canAccess) {
    return <Navigate to="/login" replace />;
  }

  return (
    <AppShell
      eyebrow="Pages / Project Approvals / Review"
      title={detail ? detail.projectTitle : "Project approval detail"}
      description="Review submitted work log lines, track incomplete weekly submissions, and submit the month approval when you're ready."
    >
      <section className="space-y-5">
        {isLoading ? (
          <section className="rounded-[1.75rem] bg-white p-10 text-center text-sm font-medium text-[#707EAE] shadow-[0_20px_60px_rgba(11,20,55,0.08)]">
            Loading project approval detail...
          </section>
        ) : !detail ? (
          <section className="rounded-[1.75rem] bg-white p-10 text-center text-sm font-medium text-[#707EAE] shadow-[0_20px_60px_rgba(11,20,55,0.08)]">
            No project approval data found.
          </section>
        ) : (
          <>
            <div className="grid gap-4 xl:grid-cols-[minmax(0,1.7fr)_360px]">
              <div className="space-y-4">
                <div className="rounded-[1.75rem] bg-white p-5 shadow-[0_20px_60px_rgba(11,20,55,0.08)] sm:p-6">
                  <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
                    <div className="order-1 flex w-full flex-col gap-3 sm:flex-row xl:order-2 xl:w-auto xl:justify-end">
                      <Link
                        to="/project-approvals"
                        className="inline-flex h-11 w-full items-center justify-center rounded-full bg-[#F4F7FE] px-5 text-sm font-semibold text-[#4318FF] transition hover:bg-[#E8EEFF] sm:flex-1 xl:w-auto xl:flex-none"
                      >
                        Back to approvals
                      </Link>
                      <Button
                        className="w-full sm:flex-1 xl:w-auto xl:flex-none"
                        disabled={(detail.monthStatus === "approved" && detail.incompleteMembers.length === 0) || isFinalizing}
                        onClick={handleFinalize}
                      >
                        {isFinalizing ? "Submitting..." : "Submit Month Approval"}
                      </Button>
                    </div>

                    <div className="order-2 w-full xl:order-1 xl:w-auto xl:min-w-[220px]">
                      <Input
                        label="Month"
                        type="month"
                        value={selectedMonthInput}
                        onChange={(event) => setSelectedMonthInput(event.target.value)}
                      />
                    </div>
                  </div>
                </div>

                <div className="rounded-[1.75rem] bg-white p-5 shadow-[0_20px_60px_rgba(11,20,55,0.08)] sm:p-6">
                  <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                    <div className="flex min-h-[120px] flex-col rounded-2xl bg-[#F8FAFF] p-4">
                      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#A3AED0]">Weeks in review</p>
                      <p className="mt-auto pt-4 text-2xl font-bold text-[#2B3674]">{weekSections.length}</p>
                    </div>
                    <div className="flex min-h-[120px] flex-col rounded-2xl bg-[#F8FAFF] p-4">
                      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#A3AED0]">Incomplete members</p>
                      <p className="mt-auto pt-4 text-2xl font-bold text-[#2B3674]">{detail.incompleteMembers.length}</p>
                    </div>
                    <div className="flex min-h-[120px] flex-col rounded-2xl bg-[#F8FAFF] p-4">
                      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#A3AED0]">Month revenue</p>
                      <p className="mt-auto pt-4 text-2xl font-bold text-[#2B3674]">${detail.monthRevenue.toFixed(2)}</p>
                    </div>
                    <div className="flex min-h-[120px] flex-col rounded-2xl bg-[#F8FAFF] p-4">
                      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#A3AED0]">Project revenue</p>
                      <p className="mt-auto pt-4 text-2xl font-bold text-[#2B3674]">${detail.projectRevenue.toFixed(2)}</p>
                    </div>
                  </div>
                </div>

                <div className="rounded-[1.75rem] bg-white p-5 shadow-[0_20px_60px_rgba(11,20,55,0.08)] sm:p-6">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-sm font-medium text-[#A3AED0]">Weekly review sections</p>
                      <h2 className="mt-1 text-xl font-bold text-[#2B3674]">Review work logs by week</h2>
                    </div>
                    <div className="rounded-full bg-[#F4F7FE] px-3 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-[#4318FF]">
                      {detail.workLogs.length} line items
                    </div>
                  </div>

                  <div className="mt-6 space-y-4">
                    {weekSections.map((section) => {
                      const isExpanded = expandedWeeks.includes(section.weekStart);

                      return (
                        <div key={section.weekStart} className="rounded-[1.5rem] border border-[#E8EDF7] bg-[#FBFCFF]">
                          <button
                            type="button"
                            className="flex w-full flex-col gap-4 p-4 text-left sm:p-5"
                            onClick={() => toggleWeekSection(section.weekStart)}
                          >
                            <div className="flex flex-col gap-3 xl:flex-row xl:items-start xl:justify-between">
                              <div>
                                <p className="text-sm font-semibold text-[#2B3674]">{formatWeekLabel(section.weekStart)}</p>
                                <p className="mt-1 text-xs text-[#707EAE]">
                                  {section.lines.length} line item{section.lines.length === 1 ? "" : "s"} across {section.totalHours.toFixed(2)} hrs
                                </p>
                              </div>
                              <div className="flex flex-wrap items-center gap-2">
                                <span className="rounded-full bg-white px-3 py-2 text-xs font-semibold uppercase tracking-[0.16em] text-[#4318FF]">
                                  ${section.totalRevenue.toFixed(2)}
                                </span>
                                {section.approvedCount > 0 ? (
                                  <span className="rounded-full bg-emerald-100 px-3 py-2 text-xs font-semibold uppercase tracking-[0.16em] text-emerald-700">
                                    {section.approvedCount} approved
                                  </span>
                                ) : null}
                                {section.rejectedCount > 0 ? (
                                  <span className="rounded-full bg-rose-100 px-3 py-2 text-xs font-semibold uppercase tracking-[0.16em] text-rose-700">
                                    {section.rejectedCount} rejected
                                  </span>
                                ) : null}
                              </div>
                            </div>

                            <div className="flex items-center justify-between border-t border-[#EEF2FF] pt-4 text-sm">
                              <span className="text-[#707EAE]">
                                {section.pendingCount > 0 || section.rejectedCount > 0
                                  ? "Needs review attention"
                                  : "All lines reviewed"}
                              </span>
                              <span className="font-semibold text-[#4318FF]">
                                {isExpanded ? "Hide lines" : "Show lines"}
                              </span>
                            </div>
                          </button>

                          {isExpanded ? (
                            <div className="border-t border-[#EEF2FF] px-4 pb-4 pt-1 sm:px-5 sm:pb-5">
                              <div className="overflow-x-auto">
                                <table className="min-w-full text-left text-sm">
                                  <thead>
                                    <tr className="text-xs uppercase tracking-[0.18em] text-[#A3AED0]">
                                      <th className="pb-3 pr-4 font-semibold">Review</th>
                                      <th className="pb-3 pr-4 font-semibold">Date</th>
                                      <th className="pb-3 pr-4 font-semibold">Member</th>
                                      <th className="pb-3 pr-4 font-semibold">Description</th>
                                      <th className="pb-3 pr-4 font-semibold">Hours</th>
                                      <th className="pb-3 pr-4 font-semibold">Revenue</th>
                                    </tr>
                                  </thead>
                                  <tbody>
                                    {section.lines.map((line) => {
                                      const isSavingThisLine = savingLineId === line.id;

                                      return (
                                        <Fragment key={line.id}>
                                          <tr className={`border-t border-[#EEF2FF] text-[#2B3674] ${isSavingThisLine ? "bg-[#F8FAFF]" : ""}`}>
                                            <td className="py-4 pr-4">
                                              <div className="flex flex-col items-start gap-2 text-left">
                                                <label className="flex items-center gap-2 text-sm font-medium text-[#2B3674]">
                                                  <input
                                                    type="radio"
                                                    name={`review-${line.id}`}
                                                    className="h-4 w-4 accent-slate-500"
                                                    checked={line.reviewStatus === "pending"}
                                                    disabled={Boolean(savingLineId) || detail.monthStatus === "approved"}
                                                    onChange={() => {
                                                      void handleClearReview(line);
                                                    }}
                                                  />
                                                  <span>Not reviewed</span>
                                                </label>
                                                <label className="flex items-center gap-2 text-sm font-medium text-[#2B3674]">
                                                  <input
                                                    type="radio"
                                                    name={`review-${line.id}`}
                                                    className="h-4 w-4 accent-emerald-600"
                                                    checked={line.reviewStatus === "approved"}
                                                    disabled={Boolean(savingLineId) || detail.monthStatus === "approved"}
                                                    onChange={() => {
                                                      void handleApprove(line);
                                                    }}
                                                  />
                                                  <span>Approve</span>
                                                </label>
                                                <label className="flex items-center gap-2 text-sm font-medium text-[#2B3674]">
                                                  <input
                                                    type="radio"
                                                    name={`review-${line.id}`}
                                                    className="h-4 w-4 accent-rose-600"
                                                    checked={line.reviewStatus === "rejected"}
                                                    disabled={Boolean(savingLineId) || detail.monthStatus === "approved"}
                                                    onChange={() => {
                                                      setRejectingLine(line);
                                                      setRejectionReason(line.rejectionReason ?? "");
                                                    }}
                                                  />
                                                  <span>Reject</span>
                                                </label>
                                                {isSavingThisLine ? (
                                                  <span className="inline-flex items-center gap-2 text-xs font-semibold text-[#4318FF]">
                                                    <span className="h-3 w-3 animate-spin rounded-full border-2 border-[#C4B5FD] border-t-[#4318FF]" />
                                                    Saving review...
                                                  </span>
                                                ) : (
                                                  <span className="text-xs text-[#707EAE]">
                                                    {formatReviewOptionLabel(line.reviewStatus)}
                                                  </span>
                                                )}
                                              </div>
                                            </td>
                                            <td className="py-4 pr-4">{new Date(line.workDate).toLocaleDateString()}</td>
                                            <td className="py-4 pr-4">
                                              <div className="font-semibold">{line.member.name}</div>
                                              <div className="text-xs text-[#707EAE]">{line.member.email}</div>
                                            </td>
                                            <td className="py-4 pr-4">
                                              {line.notes ? (
                                                <>
                                                  <div className="text-xs text-[#707EAE]">{line.notes}</div>
                                                </>
                                              ) : (
                                                <span className="text-xs text-[#A3AED0]">No notes added</span>
                                              )}
                                            </td>
                                            <td className="py-4 pr-4">
                                              <div className="font-semibold text-[#2B3674]">{line.serviceName}</div>
                                              <div className="mt-1 text-sm text-[#707EAE]">{line.hours.toFixed(2)} hrs</div>
                                            </td>
                                            <td className="py-4 pr-4">${line.lineTotal.toFixed(2)}</td>
                                          </tr>
                                          {line.rejectionReason ? (
                                            <tr className="border-t border-[#EEF2FF] bg-[#FFF7F7]">
                                              <td className="py-3 pr-4 text-xs font-semibold uppercase tracking-[0.16em] text-rose-500">
                                                Rejection reason
                                              </td>
                                              <td className="py-3 text-xs leading-6 text-rose-600" colSpan={5}>
                                                {line.rejectionReason}
                                              </td>
                                            </tr>
                                          ) : null}
                                        </Fragment>
                                      );
                                    })}
                                  </tbody>
                                </table>
                              </div>
                            </div>
                          ) : null}
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              <aside className="space-y-5 xl:sticky xl:self-start">
                <div className="rounded-[1.75rem] bg-white p-5 shadow-[0_20px_60px_rgba(11,20,55,0.08)] sm:p-6">
                  <p className="text-sm font-medium text-[#A3AED0]">Finalize checklist</p>
                  <div className="mt-4 space-y-3">
                    <div className="rounded-2xl bg-[#F8FAFF] p-4">
                      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#A3AED0]">Month status</p>
                      <p className="mt-2 text-lg font-bold text-[#2B3674]">{formatMonthStatus(detail.monthStatus)}</p>
                    </div>
                    <div className="rounded-2xl bg-[#F8FAFF] p-4">
                      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#A3AED0]">Can finalize</p>
                      <p className="mt-2 text-lg font-bold text-[#2B3674]">{detail.canFinalize ? "Yes" : "Not yet"}</p>
                    </div>
                  </div>
                </div>

                <div className="rounded-[1.75rem] bg-white p-5 shadow-[0_20px_60px_rgba(11,20,55,0.08)] sm:p-6">
                  <p className="text-sm font-medium text-[#A3AED0]">Incomplete submissions</p>
                  <div className="mt-4 space-y-4">
                    {detail.incompleteMembers.length === 0 ? (
                      <p className="text-sm text-[#707EAE]">Everyone assigned to this project has submitted their month.</p>
                    ) : (
                      detail.incompleteMembers.map((entry) => (
                        <div key={entry.member.id} className="rounded-2xl bg-[#F8FAFF] p-4">
                          <div className="font-semibold text-[#2B3674]">{entry.member.name}</div>
                          <div className="mt-1 text-xs text-[#707EAE]">{entry.member.email}</div>
                          <div className="mt-3 text-xs font-semibold uppercase tracking-[0.16em] text-[#A3AED0]">
                            Missing weeks
                          </div>
                          <div className="mt-2 flex flex-wrap gap-2">
                            {entry.missingWeekStarts.map((weekStart) => (
                              <span
                                key={`${entry.member.id}-${weekStart}`}
                                className="rounded-full bg-white px-3 py-1.5 text-xs font-semibold text-rose-600"
                              >
                                {formatWeekLabel(weekStart)}
                              </span>
                            ))}
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                <div className="rounded-[1.75rem] bg-white p-5 shadow-[0_20px_60px_rgba(11,20,55,0.08)] sm:p-6">
                  <p className="text-sm font-medium text-[#A3AED0]">Revenue summary</p>
                  <div className="mt-4 space-y-3">
                    {detail.weeklyRevenue.map((entry) => (
                      <div key={entry.weekStart} className="flex items-center justify-between rounded-2xl bg-[#F8FAFF] px-4 py-3">
                        <div>
                          <div className="font-semibold text-[#2B3674]">{formatWeekLabel(entry.weekStart)}</div>
                          <div className="mt-1 text-xs text-[#707EAE]">
                            {entry.weekStart} to {entry.weekEnd}
                          </div>
                        </div>
                        <div className="text-sm font-semibold text-[#4318FF]">${entry.totalRevenue.toFixed(2)}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </aside>
            </div>
          </>
        )}
      </section>

      {rejectingLine ? (
        <div className="fixed inset-0 z-[60] px-4">
          <div
            className="absolute inset-0 bg-[#0B1437]/35"
            onClick={() => {
              if (!savingLineId) {
                setRejectingLine(null);
                setRejectionReason("");
              }
            }}
          />
          <div className="absolute left-1/2 top-1/2 w-full max-w-xl -translate-x-1/2 -translate-y-1/2 rounded-[1.75rem] bg-white p-6 shadow-[0_24px_80px_rgba(11,20,55,0.18)]">
            <h2 className="text-xl font-bold text-[#2B3674]">Reject this work log?</h2>
            <p className="mt-3 text-sm leading-6 text-[#707EAE]">
              {`Provide a rejection reason for ${rejectingLine.member.name}'s work log on ${new Date(rejectingLine.workDate).toLocaleDateString()}.`}
            </p>

            <div className="mt-5">
              <Textarea
                label="Rejection reason"
                placeholder="Explain what needs to be corrected in this work log line"
                value={rejectionReason}
                onChange={(event) => setRejectionReason(event.target.value)}
              />
            </div>

            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                className="inline-flex h-11 items-center justify-center rounded-full px-5 text-sm font-semibold text-[#707EAE] transition hover:bg-[#F4F7FE] hover:text-[#2B3674]"
                onClick={() => {
                  if (!savingLineId) {
                    setRejectingLine(null);
                    setRejectionReason("");
                  }
                }}
              >
                Cancel
              </button>
              <Button
                className="bg-rose-600 text-white hover:bg-rose-700"
                disabled={Boolean(savingLineId)}
                onClick={() => {
                  void handleReject();
                }}
              >
                {savingLineId ? "Please wait..." : "Reject work log"}
              </Button>
            </div>
          </div>
        </div>
      ) : null}
    </AppShell>
  );
};
