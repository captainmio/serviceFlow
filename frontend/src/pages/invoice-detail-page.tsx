import { useEffect, useState } from "react";
import { Link, Navigate, useLocation } from "react-router-dom";
import { AppShell } from "../components/features/layout/app-shell";
import { Button } from "../components/ui/button";
import { notify } from "../lib/notify";
import { fetchInvoiceDetailRequest, updateInvoiceStatusRequest } from "../services/invoice-api";
import { useAuthStore } from "../stores/auth-store";
import type { InvoiceDetail, InvoiceStatus } from "../types/invoice";

const formatStatus = (status: InvoiceStatus) => status.charAt(0).toUpperCase() + status.slice(1);

export const InvoiceDetailPage = ({ invoiceId }: { invoiceId: string }) => {
  const user = useAuthStore((state) => state.user);
  const canAccess = user?.role === "admin" || user?.role === "manager";
  const location = useLocation();
  const [invoice, setInvoice] = useState<InvoiceDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);

  const loadInvoice = async (options?: { preserve?: boolean }) => {
    if (!canAccess) {
      return;
    }

    if (!options?.preserve) {
      setIsLoading(true);
    }

    try {
      const result = await fetchInvoiceDetailRequest(invoiceId);
      setInvoice(result);
    } catch (error: unknown) {
      notify.error(error instanceof Error ? error.message : "Unable to fetch invoice detail");
    } finally {
      if (!options?.preserve) {
        setIsLoading(false);
      }
    }
  };

  useEffect(() => {
    void loadInvoice();
  }, [canAccess, invoiceId, location.search]);

  useEffect(() => {
    if (!canAccess) {
      return;
    }

    const interval = window.setInterval(() => {
      void loadInvoice({ preserve: true });
    }, 15000);

    const handleFocus = () => {
      void loadInvoice({ preserve: true });
    };

    window.addEventListener("focus", handleFocus);

    return () => {
      window.clearInterval(interval);
      window.removeEventListener("focus", handleFocus);
    };
  }, [canAccess, invoiceId, location.search]);

  const handleStatusUpdate = async (status: InvoiceStatus, successMessage: string) => {
    setIsUpdating(true);

    try {
      const result = await updateInvoiceStatusRequest(invoiceId, status);
      setInvoice(result);
      notify.success(successMessage);
    } catch (error: unknown) {
      notify.error(error instanceof Error ? error.message : "Unable to update invoice status");
    } finally {
      setIsUpdating(false);
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
      eyebrow="Pages / Invoices / Detail"
      title={invoice?.invoiceNumber ?? "Invoice detail"}
      description="Review invoice source months, billable lines, and role-specific workflow actions before the invoice is issued."
    >
      <section className="space-y-5">
        {isLoading ? (
          <div className="rounded-[1.75rem] bg-white p-10 text-center text-sm text-[#707EAE] shadow-[0_20px_60px_rgba(11,20,55,0.08)]">
            Loading invoice detail...
          </div>
        ) : !invoice ? (
          <div className="rounded-[1.75rem] bg-white p-10 text-center text-sm text-[#707EAE] shadow-[0_20px_60px_rgba(11,20,55,0.08)]">
            Unable to load this invoice.
          </div>
        ) : (
          <>
            <div className="rounded-[1.75rem] bg-white p-5 shadow-[0_20px_60px_rgba(11,20,55,0.08)] sm:p-6">
              <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#A3AED0]">
                    {invoice.customerName}
                  </p>
                  <h2 className="mt-2 text-2xl font-bold text-[#2B3674]">{invoice.invoiceNumber}</h2>
                  <p className="mt-2 text-sm text-[#707EAE]">
                    {invoice.sourceMonths.length} project-month source{invoice.sourceMonths.length === 1 ? "" : "s"} •{" "}
                    {invoice.items.length} billable line{invoice.items.length === 1 ? "" : "s"}
                  </p>
                </div>

                <div className="flex w-full flex-col gap-3 sm:flex-row xl:w-auto">
                  <Link
                    to="/invoices"
                    className="inline-flex h-11 items-center justify-center rounded-full bg-[#F4F7FE] px-5 text-sm font-semibold text-[#4318FF] transition hover:bg-[#E8EEFF]"
                  >
                    Back to invoices
                  </Link>
                  {user?.role === "manager" && invoice.canReview ? (
                    <Button disabled={isUpdating} onClick={() => void handleStatusUpdate("reviewed", "Invoice approved for issue.")}>
                      {isUpdating ? "Saving..." : "Approve for issue"}
                    </Button>
                  ) : null}
                  {user?.role === "admin" && invoice.canIssue ? (
                    <Button disabled={isUpdating} onClick={() => void handleStatusUpdate("issued", "Invoice issued successfully.")}>
                      {isUpdating ? "Saving..." : "Issue invoice"}
                    </Button>
                  ) : null}
                  {user?.role === "admin" && invoice.status === "issued" ? (
                    <>
                      <Link
                        to={`/invoices/${invoice.id}/print`}
                        className="inline-flex h-11 items-center justify-center rounded-full bg-[#F4F7FE] px-5 text-sm font-semibold text-[#4318FF] transition hover:bg-[#E8EEFF]"
                      >
                        Print / Save PDF
                      </Link>
                      <Button disabled={isUpdating} onClick={() => void handleStatusUpdate("paid", "Invoice marked as paid.")}>
                        {isUpdating ? "Saving..." : "Mark as paid"}
                      </Button>
                    </>
                  ) : null}
                  {user?.role === "admin" && invoice.status === "paid" ? (
                    <Link
                      to={`/invoices/${invoice.id}/print`}
                      className="inline-flex h-11 items-center justify-center rounded-full bg-[#F4F7FE] px-5 text-sm font-semibold text-[#4318FF] transition hover:bg-[#E8EEFF]"
                    >
                      Print / Save PDF
                    </Link>
                  ) : null}
                </div>
              </div>
            </div>

            <div className="grid gap-4 xl:grid-cols-4">
              <MetricCard label="Status" value={formatStatus(invoice.status)} />
              <MetricCard label="Subtotal" value={`$${invoice.subtotal.toFixed(2)}`} />
              <MetricCard label="Tax" value={`$${invoice.taxAmount.toFixed(2)}`} />
              <MetricCard label="Total" value={`$${invoice.totalAmount.toFixed(2)}`} />
            </div>

            <div className="grid gap-5 xl:grid-cols-[minmax(0,1.5fr)_360px]">
              <section className="rounded-[1.75rem] bg-white p-5 shadow-[0_20px_60px_rgba(11,20,55,0.08)] sm:p-6">
                <p className="text-sm font-medium text-[#A3AED0]">Invoice items</p>
                <div className="mt-5 overflow-x-auto">
                  <table className="min-w-full text-left text-sm">
                    <thead>
                      <tr className="text-xs uppercase tracking-[0.18em] text-[#A3AED0]">
                        <th className="pb-3 pr-4 font-semibold">Date</th>
                        <th className="pb-3 pr-4 font-semibold">Project</th>
                        <th className="pb-3 pr-4 font-semibold">Service</th>
                        <th className="pb-3 pr-4 font-semibold">Member</th>
                        <th className="pb-3 pr-4 font-semibold">Hours</th>
                        <th className="pb-3 pr-4 font-semibold">Revenue</th>
                      </tr>
                    </thead>
                    <tbody>
                      {invoice.items.map((item) => (
                        <tr key={item.id} className="border-t border-[#EEF2FF] text-[#2B3674]">
                          <td className="py-4 pr-4">{new Date(item.workDate).toLocaleDateString()}</td>
                          <td className="py-4 pr-4">
                            <div className="font-semibold">{item.projectTitle}</div>
                            <div className="text-xs text-[#707EAE]">{new Date(item.monthStart).toLocaleDateString(undefined, { month: "long", year: "numeric" })}</div>
                          </td>
                          <td className="py-4 pr-4">
                            <div className="font-semibold">{item.serviceName}</div>
                            <div className="text-xs text-[#707EAE]">{item.notes || "No notes added"}</div>
                          </td>
                          <td className="py-4 pr-4">{item.memberName}</td>
                          <td className="py-4 pr-4">{item.hours.toFixed(2)} hrs</td>
                          <td className="py-4 pr-4">${item.lineTotal.toFixed(2)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </section>

              <aside className="space-y-5">
                <section className="rounded-[1.75rem] bg-white p-5 shadow-[0_20px_60px_rgba(11,20,55,0.08)] sm:p-6">
                  <p className="text-sm font-medium text-[#A3AED0]">Source months</p>
                  <div className="mt-4 space-y-3">
                    {invoice.sourceMonths.map((entry) => (
                      <div key={`${entry.projectId}:${entry.monthStart}`} className="rounded-2xl bg-[#F8FAFF] p-4">
                        <div className="font-semibold text-[#2B3674]">{entry.projectTitle}</div>
                        <div className="mt-1 text-xs text-[#707EAE]">
                          {new Date(entry.monthStart).toLocaleDateString(undefined, { month: "long", year: "numeric" })}
                        </div>
                        <div className="mt-3 flex items-center justify-between text-sm">
                          <span className="text-[#707EAE]">{entry.lineCount} line items</span>
                          <span className="font-semibold text-[#4318FF]">${entry.subtotal.toFixed(2)}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </section>

                <section className="rounded-[1.75rem] bg-white p-5 shadow-[0_20px_60px_rgba(11,20,55,0.08)] sm:p-6">
                  <p className="text-sm font-medium text-[#A3AED0]">Workflow detail</p>
                  <div className="mt-4 space-y-3">
                    <InfoCard label="Invoice date" value={new Date(invoice.invoiceDate).toLocaleDateString()} />
                    <InfoCard label="Due date" value={new Date(invoice.dueDate).toLocaleDateString()} />
                    <InfoCard label="Reviewed by" value={invoice.reviewedBy?.name ?? "Not reviewed yet"} />
                    <InfoCard label="Issued by" value={invoice.issuedBy?.name ?? "Not issued yet"} />
                    <InfoCard label="Paid at" value={invoice.paidAt ? new Date(invoice.paidAt).toLocaleString() : "Not paid yet"} />
                  </div>
                </section>

                <section className="rounded-[1.75rem] bg-white p-5 shadow-[0_20px_60px_rgba(11,20,55,0.08)] sm:p-6">
                  <p className="text-sm font-medium text-[#A3AED0]">Notes</p>
                  <p className="mt-4 text-sm leading-7 text-[#707EAE]">{invoice.notes || "No invoice notes added."}</p>
                </section>
              </aside>
            </div>
          </>
        )}
      </section>
    </AppShell>
  );
};

const MetricCard = ({ label, value }: { label: string; value: string }) => (
  <div className="rounded-[1.75rem] bg-white p-5 shadow-[0_20px_60px_rgba(11,20,55,0.08)] sm:p-6">
    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#A3AED0]">{label}</p>
    <p className="mt-3 text-2xl font-bold text-[#2B3674]">{value}</p>
  </div>
);

const InfoCard = ({ label, value }: { label: string; value: string }) => (
  <div className="rounded-2xl bg-[#F8FAFF] p-4">
    <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#A3AED0]">{label}</p>
    <p className="mt-2 text-sm font-semibold text-[#2B3674]">{value}</p>
  </div>
);
