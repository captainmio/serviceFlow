import { useEffect, useMemo, useState } from "react";
import { Link, Navigate, useNavigate, useSearchParams } from "react-router-dom";
import { AppShell } from "../components/features/layout/app-shell";
import { notify } from "../lib/notify";
import { fetchInvoicesRequest } from "../services/invoice-api";
import { useAuthStore } from "../stores/auth-store";
import type { InvoiceEligibleMonth, InvoiceListResponse, InvoiceStatus, InvoiceSummary } from "../types/invoice";

const formatMonthLabel = (monthStart: string) =>
  new Date(`${monthStart}T00:00:00`).toLocaleDateString(undefined, {
    month: "long",
    year: "numeric"
  });

const formatStatus = (status: InvoiceStatus) => {
  if (status === "draft") {
    return "Waiting for manager approval";
  }

  if (status === "rejected") {
    return "Changes requested";
  }

  return status.charAt(0).toUpperCase() + status.slice(1);
};

const statusBadgeClass = (status: InvoiceStatus) => {
  if (status === "draft") {
    return "bg-amber-100 text-amber-800";
  }

  if (status === "reviewed" || status === "paid") {
    return "bg-emerald-100 text-emerald-800";
  }

  if (status === "issued") {
    return "bg-blue-100 text-blue-800";
  }

  return "bg-rose-100 text-rose-800";
};

export const InvoicesPage = () => {
  const user = useAuthStore((state) => state.user);
  const canAccess = user?.role === "admin" || user?.role === "manager";
  const isAdmin = user?.role === "admin";
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const requestedTab = searchParams.get("tab") === "issue" || !isAdmin ? "issue" : "ready";
  const [data, setData] = useState<InvoiceListResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedKeys, setSelectedKeys] = useState<string[]>([]);
  const [activeTab, setActiveTab] = useState<"ready" | "issue">(requestedTab);

  useEffect(() => {
    setActiveTab(requestedTab);
  }, [requestedTab]);

  const loadInvoices = async (options?: { preserve?: boolean }) => {
    if (!canAccess) {
      return;
    }

    if (!options?.preserve) {
      setIsLoading(true);
    }

    try {
      const result = await fetchInvoicesRequest();
      setData(result);
    } catch (error: unknown) {
      notify.error(error instanceof Error ? error.message : "Unable to fetch invoices");
    } finally {
      if (!options?.preserve) {
        setIsLoading(false);
      }
    }
  };

  useEffect(() => {
    void loadInvoices();
  }, [canAccess]);

  useEffect(() => {
    if (!canAccess) {
      return;
    }

    const interval = window.setInterval(() => {
      void loadInvoices({ preserve: true });
    }, 30000);

    return () => window.clearInterval(interval);
  }, [canAccess]);

  const selectedEligibleMonths = useMemo(() => {
    if (!data) {
      return [];
    }

    const selectedSet = new Set(selectedKeys);
    return data.eligibleMonths.filter((entry) => selectedSet.has(`${entry.projectId}:${entry.monthStart}`));
  }, [data, selectedKeys]);

  const selectedCustomerId = selectedEligibleMonths[0]?.customerId ?? null;
  const selectedSubtotal = selectedEligibleMonths.reduce((sum, entry) => sum + entry.subtotal, 0);
  const needsReviewCount = data?.invoices.filter((invoice) => invoice.status === "draft").length ?? 0;
  const readyToIssueInvoices = data?.invoices.filter((invoice) => invoice.status === "draft" || invoice.canIssue) ?? [];
  const readyToIssueCount = readyToIssueInvoices.length;
  const invoiceDrafts = data?.invoices.filter((invoice) => invoice.status === "draft" || invoice.status === "rejected" || invoice.status === "reviewed") ?? [];

  const toggleEligibleMonth = (entry: InvoiceEligibleMonth) => {
    const key = `${entry.projectId}:${entry.monthStart}`;

    setSelectedKeys((currentKeys) => {
      if (currentKeys.includes(key)) {
        return currentKeys.filter((currentKey) => currentKey !== key);
      }

      if (selectedCustomerId && selectedCustomerId !== entry.customerId) {
        notify.error("An invoice draft can only combine project months from the same customer.");
        return currentKeys;
      }

      return [...currentKeys, key];
    });
  };

  const handleContinueToDraftDetails = () => {
    if (selectedEligibleMonths.length === 0) {
      notify.error("Select at least one invoice-eligible project month.");
      return;
    }

    const params = new URLSearchParams();
    selectedKeys.forEach((key) => params.append("source", key));
    navigate(`/invoices/new?${params.toString()}`);
  };

  if (user?.role === "team_member") {
    return <Navigate to="/work-logs" replace />;
  }

  if (!canAccess) {
    return <Navigate to="/login" replace />;
  }

  return (
    <AppShell
      eyebrow="Pages / Invoices"
      title="Invoices"
      description="Create invoice drafts from fully submitted approved project months, review invoices by role, and issue them with a controlled workflow."
    >
      <section className={isAdmin && activeTab === "ready" ? "space-y-5 pb-28" : "space-y-5"}>
        <div className="grid gap-4 xl:grid-cols-3">
          <div className="rounded-[1.75rem] bg-white p-5 shadow-[0_20px_60px_rgba(11,20,55,0.08)] sm:p-6">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#A3AED0]">
              Invoice-ready months
            </p>
            <p className="mt-3 text-3xl font-bold text-[#2B3674]">{data?.eligibleMonths.length ?? 0}</p>
          </div>
          <div className="rounded-[1.75rem] bg-white p-5 shadow-[0_20px_60px_rgba(11,20,55,0.08)] sm:p-6">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#A3AED0]">
              Drafts needing review
            </p>
            <p className="mt-3 text-3xl font-bold text-[#2B3674]">{needsReviewCount}</p>
          </div>
          <div className="rounded-[1.75rem] bg-white p-5 shadow-[0_20px_60px_rgba(11,20,55,0.08)] sm:p-6">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#A3AED0]">
              Ready to issue
            </p>
            <p className="mt-3 text-3xl font-bold text-[#2B3674]">{readyToIssueCount}</p>
          </div>
        </div>

        <div className="flex flex-wrap gap-2 rounded-[1.5rem] bg-white p-2 shadow-[0_20px_60px_rgba(11,20,55,0.08)]" role="tablist" aria-label="Invoice sections">
          {isAdmin ? (
            <button
              type="button"
              role="tab"
              aria-selected={activeTab === "ready"}
              className={`rounded-full px-5 py-3 text-sm font-semibold transition ${
                activeTab === "ready" ? "bg-[#4318FF] text-white shadow-[0_10px_24px_rgba(67,24,255,0.2)]" : "text-[#707EAE] hover:bg-[#F4F7FE]"
              }`}
              onClick={() => setActiveTab("ready")}
            >
              Projects ready for invoice draft
              <span className="ml-2 rounded-full bg-white/20 px-2 py-1 text-xs">{data?.eligibleMonths.length ?? 0}</span>
            </button>
          ) : null}
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === "issue"}
            className={`rounded-full px-5 py-3 text-sm font-semibold transition ${
              activeTab === "issue" ? "bg-[#4318FF] text-white shadow-[0_10px_24px_rgba(67,24,255,0.2)]" : "text-[#707EAE] hover:bg-[#F4F7FE]"
            }`}
            onClick={() => setActiveTab("issue")}
          >
            Invoice drafts and issuing queue
            <span className="ml-2 rounded-full bg-white/20 px-2 py-1 text-xs">{invoiceDrafts.length}</span>
          </button>
        </div>

        {activeTab === "ready" ? (
          <>
            {isAdmin ? <>
            <section className="rounded-[1.75rem] bg-white p-5 shadow-[0_20px_60px_rgba(11,20,55,0.08)] sm:p-6">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                <div>
                  <p className="text-sm font-medium text-[#A3AED0]">Create an invoice draft</p>
                  <h2 className="mt-1 text-xl font-bold text-[#2B3674]">Select project months to get started</h2>
                  <p className="mt-2 max-w-2xl text-sm leading-6 text-[#707EAE]">
                    Choose one or more invoice-ready project months for the same customer. These months are available only after work logs have been submitted, reviewed, and approved.
                  </p>
                </div>
                <div className="shrink-0 rounded-2xl bg-[#F4F7FE] px-4 py-3 text-sm font-semibold text-[#4318FF]">
                  Step 1 of 2: Select project months
                </div>
              </div>

              <div className="mt-5 grid gap-3 lg:grid-cols-4">
                <div className="rounded-2xl bg-[#F8FAFF] p-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#A3AED0]">Selected</p>
                  <p className="mt-2 text-lg font-bold text-[#2B3674]">
                    {selectedEligibleMonths.length} project month{selectedEligibleMonths.length === 1 ? "" : "s"}
                  </p>
                </div>
                <div className="rounded-2xl bg-[#F8FAFF] p-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#A3AED0]">Customer</p>
                  <p className="mt-2 truncate text-lg font-bold text-[#2B3674]">
                    {selectedEligibleMonths[0]?.customerName ?? "Select a project month"}
                  </p>
                </div>
                <div className="rounded-2xl bg-[#F8FAFF] p-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#A3AED0]">Subtotal</p>
                  <p className="mt-2 text-lg font-bold text-[#2B3674]">${selectedSubtotal.toFixed(2)}</p>
                </div>
                <div className="rounded-2xl bg-[#F5F2FF] p-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#8B7ED8]">Next step</p>
                  <p className="mt-2 text-lg font-bold text-[#4318FF]">Draft details</p>
                </div>
              </div>

            </section>

            <section className="rounded-[1.75rem] bg-white p-5 shadow-[0_20px_60px_rgba(11,20,55,0.08)] sm:p-6">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-medium text-[#A3AED0]">Invoice queue</p>
                  <h2 className="mt-1 text-xl font-bold text-[#2B3674]">Project months ready for draft</h2>
                </div>
                <div className="rounded-full bg-[#F4F7FE] px-3 py-2 text-xs font-semibold uppercase tracking-[0.16em] text-[#4318FF]">
                  {selectedEligibleMonths.length} selected
                </div>
              </div>

              <div className="mt-6 space-y-3">
                {isLoading ? (
                  <div className="rounded-2xl bg-[#F8FAFF] p-4 text-sm text-[#707EAE]">Loading invoice-ready months...</div>
                ) : data?.eligibleMonths.length ? (
                  data.eligibleMonths.map((entry) => {
                    const key = `${entry.projectId}:${entry.monthStart}`;
                    const isSelected = selectedKeys.includes(key);
                    const isDisabled = Boolean(selectedCustomerId && selectedCustomerId !== entry.customerId && !isSelected);

                    return (
                      <button
                        key={key}
                        type="button"
                        disabled={isDisabled}
                        className={`flex w-full items-center justify-between rounded-[1.5rem] border p-4 text-left transition ${
                          isSelected
                            ? "border-[#4318FF] bg-[#F5F2FF]"
                            : "border-[#E8EDF7] bg-[#FBFCFF] hover:border-[#D9E1F2] hover:bg-[#F8FAFF]"
                        } disabled:cursor-not-allowed disabled:opacity-60`}
                        onClick={() => toggleEligibleMonth(entry)}
                      >
                        <div className="min-w-0">
                          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#A3AED0]">
                            {formatMonthLabel(entry.monthStart)}
                          </p>
                          <h3 className="mt-2 truncate text-lg font-bold text-[#2B3674]">{entry.projectTitle}</h3>
                          <p className="mt-1 text-sm text-[#707EAE]">{entry.customerName}</p>
                        </div>
                        <div className="ml-4 shrink-0 text-right">
                          <p className="text-sm font-semibold text-[#2B3674]">${entry.subtotal.toFixed(2)}</p>
                          <p className="mt-1 text-xs text-[#A3AED0]">{entry.billableLineCount} billable lines</p>
                        </div>
                      </button>
                    );
                  })
                ) : (
                  <div className="rounded-2xl bg-[#F8FAFF] p-4 text-sm text-[#707EAE]">
                    No fully submitted approved project months are ready for draft.
                  </div>
                )}
              </div>
            </section>
            </> : (
              <section className="rounded-[1.75rem] bg-white p-8 text-center shadow-[0_20px_60px_rgba(11,20,55,0.08)]">
                <h2 className="text-xl font-bold text-[#2B3674]">Invoice-ready project months</h2>
                <p className="mt-3 text-sm leading-6 text-[#707EAE]">Only administrators can create invoice drafts from approved project months.</p>
              </section>
            )}
          </>
        ) : (
          <section className="rounded-[1.75rem] bg-white p-5 shadow-[0_20px_60px_rgba(11,20,55,0.08)] sm:p-6">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-sm font-medium text-[#A3AED0]">Invoice workflow</p>
              <h2 className="mt-1 text-xl font-bold text-[#2B3674]">Invoice drafts and issuing queue</h2>
              <p className="mt-2 text-sm leading-6 text-[#707EAE]">Review newly created drafts and issue invoices that have already been approved by a manager.</p>
            </div>
          </div>

          <div className="mt-6 space-y-3">
            {isLoading ? (
              <div className="rounded-2xl bg-[#F8FAFF] p-4 text-sm text-[#707EAE]">Loading invoices...</div>
            ) : invoiceDrafts.length ? (
              invoiceDrafts.map((invoice) => (
                <InvoiceRow key={invoice.id} invoice={invoice} />
              ))
            ) : (
              <div className="rounded-2xl bg-[#F8FAFF] p-4 text-sm text-[#707EAE]">
                No invoice drafts are available yet.
              </div>
            )}
          </div>
        </section>
        )}

        {isAdmin && activeTab === "ready" ? (
          <div className="fixed inset-x-0 bottom-0 z-40 border-t border-[#E8EDF7] bg-white/95 px-4 py-3 shadow-[0_-12px_35px_rgba(11,20,55,0.12)] backdrop-blur sm:px-6">
            <div className="mx-auto flex max-w-[1440px] flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="min-w-0">
                <p className="text-sm font-semibold text-[#2B3674]">
                  {selectedEligibleMonths.length > 0
                    ? `${selectedEligibleMonths.length} project month${selectedEligibleMonths.length === 1 ? "" : "s"} selected`
                    : "Select a project month to continue"}
                </p>
                <p className="truncate text-xs text-[#707EAE]">
                  {selectedEligibleMonths[0]?.customerName ?? "Invoice-ready project months"}
                  {selectedEligibleMonths.length > 0 ? ` • $${selectedSubtotal.toFixed(2)} subtotal` : ""}
                </p>
              </div>
              <button
                className="inline-flex h-11 w-full shrink-0 items-center justify-center rounded-full bg-[#4318FF] px-6 text-sm font-semibold text-white shadow-[0_12px_30px_rgba(67,24,255,0.22)] transition hover:bg-[#3311cc] disabled:cursor-not-allowed disabled:bg-[#C4B5FD] sm:w-auto"
                type="button"
                disabled={selectedEligibleMonths.length === 0}
                onClick={handleContinueToDraftDetails}
              >
                Continue to draft details
              </button>
            </div>
          </div>
        ) : null}
      </section>
    </AppShell>
  );
};

const InvoiceRow = ({ invoice }: { invoice: InvoiceSummary }) => (
  <Link
    to={`/invoices/${invoice.id}?tab=issue`}
    className="block rounded-[1.5rem] border border-[#E8EDF7] bg-[#FBFCFF] p-4 transition hover:border-[#D9E1F2] hover:bg-[#F8FAFF]"
  >
    <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
      <div className="min-w-0">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#A3AED0]">{invoice.invoiceNumber}</p>
        <h3 className="mt-2 text-lg font-bold text-[#2B3674]">{invoice.customerName}</h3>
        <p className="mt-1 text-sm text-[#707EAE]">
          {invoice.projectCount} project{invoice.projectCount === 1 ? "" : "s"} across {invoice.monthCount} month
          {invoice.monthCount === 1 ? "" : "s"}
        </p>
      </div>
      <div className="flex flex-wrap items-center gap-3">
        <span className={`rounded-full px-3 py-1.5 text-xs font-semibold tracking-wide ${statusBadgeClass(invoice.status)}`}>
          {formatStatus(invoice.status)}
        </span>
        <span className="text-sm font-semibold text-[#2B3674]">${invoice.totalAmount.toFixed(2)}</span>
      </div>
    </div>
    <div className="mt-4 grid gap-3 sm:grid-cols-3">
      <div className="rounded-2xl bg-white px-4 py-3">
        <p className="text-xs uppercase tracking-[0.16em] text-[#A3AED0]">Invoice date</p>
        <p className="mt-2 font-semibold text-[#2B3674]">{new Date(invoice.invoiceDate).toLocaleDateString()}</p>
      </div>
      <div className="rounded-2xl bg-white px-4 py-3">
        <p className="text-xs uppercase tracking-[0.16em] text-[#A3AED0]">Due date</p>
        <p className="mt-2 font-semibold text-[#2B3674]">{new Date(invoice.dueDate).toLocaleDateString()}</p>
      </div>
      <div className="rounded-2xl bg-white px-4 py-3">
        <p className="text-xs uppercase tracking-[0.16em] text-[#A3AED0]">Action state</p>
        <p className="mt-2 font-semibold text-[#2B3674]">
          {invoice.canIssue ? "Ready to issue" : invoice.canReview ? "Waiting for manager approval" : "Read only"}
        </p>
      </div>
    </div>
  </Link>
);
