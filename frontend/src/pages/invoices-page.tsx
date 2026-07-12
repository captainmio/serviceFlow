import { useEffect, useMemo, useState } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { AppShell } from "../components/features/layout/app-shell";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Textarea } from "../components/ui/textarea";
import { notify } from "../lib/notify";
import { createInvoiceDraftRequest, fetchInvoicesRequest } from "../services/invoice-api";
import { useAuthStore } from "../stores/auth-store";
import type { InvoiceEligibleMonth, InvoiceListResponse, InvoiceStatus, InvoiceSummary } from "../types/invoice";

const formatMonthLabel = (monthStart: string) =>
  new Date(`${monthStart}T00:00:00`).toLocaleDateString(undefined, {
    month: "long",
    year: "numeric"
  });

const formatStatus = (status: InvoiceStatus) => status.charAt(0).toUpperCase() + status.slice(1);

const todayDateInput = () => {
  const currentDate = new Date();
  return `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, "0")}-${String(
    currentDate.getDate()
  ).padStart(2, "0")}`;
};

const dueDateInput = () => {
  const currentDate = new Date();
  currentDate.setDate(currentDate.getDate() + 14);
  return `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, "0")}-${String(
    currentDate.getDate()
  ).padStart(2, "0")}`;
};

export const InvoicesPage = () => {
  const user = useAuthStore((state) => state.user);
  const canAccess = user?.role === "admin" || user?.role === "manager";
  const isAdmin = user?.role === "admin";
  const navigate = useNavigate();
  const [data, setData] = useState<InvoiceListResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [selectedKeys, setSelectedKeys] = useState<string[]>([]);
  const [invoiceDate, setInvoiceDate] = useState(todayDateInput());
  const [dueDate, setDueDate] = useState(dueDateInput());
  const [taxAmount, setTaxAmount] = useState("0");
  const [notes, setNotes] = useState("");

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
  const readyToIssueCount = data?.invoices.filter((invoice) => invoice.status === "reviewed").length ?? 0;

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

  const handleCreateDraft = async () => {
    if (!data || selectedEligibleMonths.length === 0) {
      notify.error("Select at least one invoice-eligible project month.");
      return;
    }

    setIsCreating(true);

    try {
      const result = await createInvoiceDraftRequest({
        sourceMonths: selectedEligibleMonths.map((entry) => ({
          projectId: entry.projectId,
          monthStart: entry.monthStart
        })),
        invoiceDate,
        dueDate,
        taxAmount: Number(taxAmount),
        notes
      });
      notify.success("Invoice draft created successfully.");
      setSelectedKeys([]);
      setNotes("");
      setTaxAmount("0");
      await loadInvoices({ preserve: true });
      navigate(`/invoices/${result.id}`);
    } catch (error: unknown) {
      notify.error(error instanceof Error ? error.message : "Unable to create this invoice draft");
    } finally {
      setIsCreating(false);
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
      eyebrow="Pages / Invoices"
      title="Invoices"
      description="Create invoice drafts from fully submitted approved project months, review invoices by role, and issue them with a controlled workflow."
    >
      <section className="space-y-5">
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

        {isAdmin ? (
          <div className="grid gap-5 xl:grid-cols-[minmax(0,1.4fr)_380px]">
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

            <aside className="space-y-5">
              <section className="rounded-[1.75rem] bg-white p-5 shadow-[0_20px_60px_rgba(11,20,55,0.08)] sm:p-6">
                <p className="text-sm font-medium text-[#A3AED0]">Draft setup</p>
                <div className="mt-4 space-y-4">
                  <Input label="Invoice date" type="date" value={invoiceDate} onChange={(event) => setInvoiceDate(event.target.value)} />
                  <Input label="Due date" type="date" value={dueDate} onChange={(event) => setDueDate(event.target.value)} />
                  <Input
                    label="Tax amount"
                    type="number"
                    min="0"
                    step="0.01"
                    value={taxAmount}
                    onChange={(event) => setTaxAmount(event.target.value)}
                  />
                  <Textarea
                    label="Notes"
                    placeholder="Optional invoice note"
                    value={notes}
                    onChange={(event) => setNotes(event.target.value)}
                  />
                </div>
              </section>

              <section className="rounded-[1.75rem] bg-white p-5 shadow-[0_20px_60px_rgba(11,20,55,0.08)] sm:p-6">
                <p className="text-sm font-medium text-[#A3AED0]">Selection summary</p>
                <div className="mt-4 space-y-3">
                  <div className="rounded-2xl bg-[#F8FAFF] p-4">
                    <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#A3AED0]">Customer</p>
                    <p className="mt-2 text-lg font-bold text-[#2B3674]">
                      {selectedEligibleMonths[0]?.customerName ?? "No customer selected"}
                    </p>
                  </div>
                  <div className="rounded-2xl bg-[#F8FAFF] p-4">
                    <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#A3AED0]">Subtotal</p>
                    <p className="mt-2 text-lg font-bold text-[#2B3674]">${selectedSubtotal.toFixed(2)}</p>
                  </div>
                  <div className="rounded-2xl bg-[#F8FAFF] p-4">
                    <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#A3AED0]">Estimated total</p>
                    <p className="mt-2 text-lg font-bold text-[#2B3674]">
                      ${(selectedSubtotal + Number(taxAmount || 0)).toFixed(2)}
                    </p>
                  </div>
                </div>

                <Button className="mt-5 w-full" disabled={selectedEligibleMonths.length === 0 || isCreating} onClick={handleCreateDraft}>
                  {isCreating ? "Creating draft..." : "Create invoice draft"}
                </Button>
              </section>
            </aside>
          </div>
        ) : null}

        <section className="rounded-[1.75rem] bg-white p-5 shadow-[0_20px_60px_rgba(11,20,55,0.08)] sm:p-6">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-sm font-medium text-[#A3AED0]">Invoice workflow</p>
              <h2 className="mt-1 text-xl font-bold text-[#2B3674]">
                {isAdmin ? "Drafts, reviewed invoices, and issued records" : "Invoices ready for your review"}
              </h2>
            </div>
          </div>

          <div className="mt-6 space-y-3">
            {isLoading ? (
              <div className="rounded-2xl bg-[#F8FAFF] p-4 text-sm text-[#707EAE]">Loading invoices...</div>
            ) : data?.invoices.length ? (
              data.invoices.map((invoice) => (
                <InvoiceRow key={invoice.id} invoice={invoice} />
              ))
            ) : (
              <div className="rounded-2xl bg-[#F8FAFF] p-4 text-sm text-[#707EAE]">
                No invoices are available for your view yet.
              </div>
            )}
          </div>
        </section>
      </section>
    </AppShell>
  );
};

const InvoiceRow = ({ invoice }: { invoice: InvoiceSummary }) => (
  <Link
    to={`/invoices/${invoice.id}`}
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
        <span className="rounded-full bg-[#F4F7FE] px-3 py-2 text-xs font-semibold uppercase tracking-[0.16em] text-[#4318FF]">
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
          {invoice.canIssue ? "Ready to issue" : invoice.canReview ? "Needs manager review" : "Read only"}
        </p>
      </div>
    </div>
  </Link>
);
