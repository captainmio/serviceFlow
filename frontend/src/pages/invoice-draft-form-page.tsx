import { useEffect, useMemo, useState } from "react";
import { Link, Navigate, useNavigate, useSearchParams } from "react-router-dom";
import { AppShell } from "../components/features/layout/app-shell";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Textarea } from "../components/ui/textarea";
import { notify } from "../lib/notify";
import { createInvoiceDraftRequest, fetchInvoicesRequest } from "../services/invoice-api";
import { useAuthStore } from "../stores/auth-store";
import type { InvoiceEligibleMonth, InvoiceListResponse } from "../types/invoice";

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

const formatMonthLabel = (monthStart: string) =>
  new Date(`${monthStart}T00:00:00`).toLocaleDateString(undefined, {
    month: "long",
    year: "numeric"
  });

export const InvoiceDraftFormPage = () => {
  const user = useAuthStore((state) => state.user);
  const isAdmin = user?.role === "admin";
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [data, setData] = useState<InvoiceListResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [invoiceDate, setInvoiceDate] = useState(todayDateInput());
  const [dueDate, setDueDate] = useState(dueDateInput());
  const [taxAmount, setTaxAmount] = useState("0");
  const [notes, setNotes] = useState("");
  const sourceKeys = searchParams.getAll("source");

  useEffect(() => {
    if (!isAdmin) {
      return;
    }

    void (async () => {
      try {
        setData(await fetchInvoicesRequest());
      } catch (error: unknown) {
        notify.error(error instanceof Error ? error.message : "Unable to load invoice-ready months");
      } finally {
        setIsLoading(false);
      }
    })();
  }, [isAdmin]);

  const selectedEligibleMonths = useMemo(() => {
    if (!data) {
      return [];
    }

    const sourceKeySet = new Set(sourceKeys);
    return data.eligibleMonths.filter((entry) => sourceKeySet.has(`${entry.projectId}:${entry.monthStart}`));
  }, [data, sourceKeys]);

  const customerIds = new Set(selectedEligibleMonths.map((entry) => entry.customerId));
  const selectedSubtotal = selectedEligibleMonths.reduce((sum, entry) => sum + entry.subtotal, 0);
  const estimatedTotal = selectedSubtotal + Number(taxAmount || 0);

  const handleCreateDraft = async () => {
    if (selectedEligibleMonths.length === 0) {
      notify.error("No invoice-eligible project months were selected.");
      return;
    }

    if (customerIds.size !== 1) {
      notify.error("An invoice draft can only combine project months from the same customer.");
      return;
    }

    if (invoiceDate > dueDate) {
      notify.error("Due date must be on or after the invoice date.");
      return;
    }

    setIsCreating(true);

    try {
      await createInvoiceDraftRequest({
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
      navigate("/invoices");
    } catch (error: unknown) {
      notify.error(error instanceof Error ? error.message : "Unable to create this invoice draft");
    } finally {
      setIsCreating(false);
    }
  };

  if (user?.role === "team_member") {
    return <Navigate to="/work-logs" replace />;
  }

  if (!isAdmin) {
    return <Navigate to="/invoices" replace />;
  }

  return (
    <AppShell
      eyebrow="Pages / Invoices / Create draft"
      title="Create invoice draft"
      description="Confirm the selected project months, add invoice details, and create the draft."
    >
      <section className="space-y-5">
        <Link
          to="/invoices"
          className="inline-flex h-10 items-center rounded-full bg-[#F4F7FE] px-4 text-sm font-semibold text-[#4318FF] transition hover:bg-[#E8EEFF]"
        >
          Back to invoices
        </Link>

        {isLoading ? (
          <section className="rounded-[1.75rem] bg-white p-10 text-center text-sm text-[#707EAE] shadow-[0_20px_60px_rgba(11,20,55,0.08)]">
            Loading selected project months...
          </section>
        ) : selectedEligibleMonths.length === 0 ? (
          <section className="rounded-[1.75rem] bg-white p-8 text-center shadow-[0_20px_60px_rgba(11,20,55,0.08)]">
            <h2 className="text-xl font-bold text-[#2B3674]">No project months selected</h2>
            <p className="mt-3 text-sm leading-6 text-[#707EAE]">
              Return to the invoice list and select at least one invoice-ready project month.
            </p>
          </section>
        ) : (
          <div className="grid items-start gap-5 xl:grid-cols-[minmax(260px,0.65fr)_minmax(0,1.35fr)]">
            <section className="rounded-[1.75rem] bg-white p-5 shadow-[0_20px_60px_rgba(11,20,55,0.08)] sm:p-6 xl:sticky xl:top-6">
              <div>
                <p className="text-sm font-medium text-[#A3AED0]">Step 1 of 2</p>
                <h2 className="mt-1 text-xl font-bold text-[#2B3674]">Selected project months</h2>
                <p className="mt-2 text-sm leading-6 text-[#707EAE]">
                  These approved project months will become the source lines for the invoice draft.
                </p>
              </div>

              <div className="mt-6 space-y-3">
                {selectedEligibleMonths.map((entry: InvoiceEligibleMonth) => (
                  <div key={`${entry.projectId}:${entry.monthStart}`} className="rounded-2xl border border-[#E8EDF7] bg-[#FBFCFF] p-4">
                    <div className="flex items-start justify-between gap-4">
                      <div className="min-w-0">
                        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#A3AED0]">
                          {formatMonthLabel(entry.monthStart)}
                        </p>
                        <h3 className="mt-2 truncate text-lg font-bold text-[#2B3674]">{entry.projectTitle}</h3>
                        <p className="mt-1 text-sm text-[#707EAE]">{entry.customerName}</p>
                      </div>
                      <div className="shrink-0 text-right">
                        <p className="font-semibold text-[#2B3674]">${entry.subtotal.toFixed(2)}</p>
                        <p className="mt-1 text-xs text-[#A3AED0]">{entry.billableLineCount} billable lines</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            <section className="rounded-[1.75rem] bg-white p-5 shadow-[0_20px_60px_rgba(11,20,55,0.08)] sm:p-6">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <p className="text-sm font-medium text-[#A3AED0]">Step 2 of 2</p>
                  <h2 className="mt-1 text-xl font-bold text-[#2B3674]">Draft setup</h2>
                  <p className="mt-2 text-sm leading-6 text-[#707EAE]">
                    Add the dates, tax, and optional notes that will appear on the invoice.
                  </p>
                </div>
                <Button className="w-full shrink-0 sm:w-auto" disabled={isCreating} onClick={handleCreateDraft}>
                  {isCreating ? "Creating draft..." : "Create invoice draft"}
                </Button>
              </div>

              <div className="mt-5 space-y-4">
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
                <Textarea label="Notes" placeholder="Optional invoice note" value={notes} onChange={(event) => setNotes(event.target.value)} />
              </div>

              <div className="mt-5 space-y-3 rounded-2xl bg-[#F8FAFF] p-4">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-[#707EAE]">Customer</span>
                  <span className="font-semibold text-[#2B3674]">{selectedEligibleMonths[0]?.customerName}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-[#707EAE]">Subtotal</span>
                  <span className="font-semibold text-[#2B3674]">${selectedSubtotal.toFixed(2)}</span>
                </div>
                <div className="flex items-center justify-between border-t border-[#E8EDF7] pt-3 text-base">
                  <span className="font-semibold text-[#2B3674]">Estimated total</span>
                  <span className="font-bold text-[#4318FF]">${estimatedTotal.toFixed(2)}</span>
                </div>
              </div>

            </section>
          </div>
        )}
      </section>
    </AppShell>
  );
};
