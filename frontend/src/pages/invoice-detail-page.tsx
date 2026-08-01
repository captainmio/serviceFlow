import { useEffect, useState } from "react";
import { Link, Navigate, useLocation, useNavigate } from "react-router-dom";
import { AppShell } from "../components/features/layout/app-shell";
import { ConfirmationModal } from "../components/features/shared/confirmation-modal";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Textarea } from "../components/ui/textarea";
import { notify } from "../lib/notify";
import {
  deleteInvoiceDraftRequest,
  fetchInvoiceDetailRequest,
  rejectInvoiceRequest,
  updateInvoiceDraftRequest,
  updateInvoiceStatusRequest
} from "../services/invoice-api";
import { useAuthStore } from "../stores/auth-store";
import type { InvoiceDetail, InvoiceStatus } from "../types/invoice";

const formatStatus = (status: InvoiceStatus) => {
  if (status === "draft") {
    return "Waiting for manager approval";
  }

  if (status === "rejected") {
    return "Changes requested";
  }

  return status.charAt(0).toUpperCase() + status.slice(1);
};

export const InvoiceDetailPage = ({ invoiceId }: { invoiceId: string }) => {
  const user = useAuthStore((state) => state.user);
  const canAccess = user?.role === "admin" || user?.role === "manager";
  const location = useLocation();
  const navigate = useNavigate();
  const [invoice, setInvoice] = useState<InvoiceDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isCancelConfirmOpen, setIsCancelConfirmOpen] = useState(false);
  const [isRejectConfirmOpen, setIsRejectConfirmOpen] = useState(false);
  const [isApproveConfirmOpen, setIsApproveConfirmOpen] = useState(false);
  const [isIssueConfirmOpen, setIsIssueConfirmOpen] = useState(false);
  const [rejectionReason, setRejectionReason] = useState("");
  const [isEditingDraft, setIsEditingDraft] = useState(false);
  const [invoiceDate, setInvoiceDate] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [taxAmount, setTaxAmount] = useState("0");
  const [notes, setNotes] = useState("");

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

  const handleStatusUpdate = async (status: InvoiceStatus, successMessage: string): Promise<boolean> => {
    setIsUpdating(true);

    try {
      const result = await updateInvoiceStatusRequest(invoiceId, status);
      setInvoice(result);
      notify.success(successMessage);
      return true;
    } catch (error: unknown) {
      notify.error(error instanceof Error ? error.message : "Unable to update invoice status");
      return false;
    } finally {
      setIsUpdating(false);
    }
  };

  const handleCancelDraft = async () => {
    setIsUpdating(true);

    try {
      await deleteInvoiceDraftRequest(invoiceId);
      setIsCancelConfirmOpen(false);
      notify.success("Invoice draft deleted successfully.");
      navigate("/invoices");
    } catch (error: unknown) {
      notify.error(error instanceof Error ? error.message : "Unable to delete this invoice draft");
    } finally {
      setIsUpdating(false);
    }
  };

  const beginDraftEdit = () => {
    if (!invoice) {
      return;
    }

    setInvoiceDate(invoice.invoiceDate);
    setDueDate(invoice.dueDate);
    setTaxAmount(String(invoice.taxAmount));
    setNotes(invoice.notes);
    setIsEditingDraft(true);
  };

  const handleDraftSave = async () => {
    setIsUpdating(true);

    try {
      const result = await updateInvoiceDraftRequest(invoiceId, {
        invoiceDate,
        dueDate,
        taxAmount: Number(taxAmount),
        notes
      });
      setInvoice(result);
      setIsEditingDraft(false);
      notify.success("Invoice draft updated and returned for manager review.");
    } catch (error: unknown) {
      notify.error(error instanceof Error ? error.message : "Unable to update this invoice draft");
    } finally {
      setIsUpdating(false);
    }
  };

  const handleRejectInvoice = async () => {
    const reason = rejectionReason.trim();

    if (!reason) {
      notify.error("Please provide a reason before rejecting the invoice draft.");
      return;
    }

    setIsUpdating(true);

    try {
      const result = await rejectInvoiceRequest(invoiceId, reason);
      setInvoice(result);
      setRejectionReason("");
      setIsRejectConfirmOpen(false);
      notify.success("Invoice draft rejected and returned to the admin.");
    } catch (error: unknown) {
      notify.error(error instanceof Error ? error.message : "Unable to reject this invoice draft");
    } finally {
      setIsUpdating(false);
    }
  };

  const handleApproveInvoice = async () => {
    const approved = await handleStatusUpdate("reviewed", "Invoice approved for issue.");
    if (approved) {
      setIsApproveConfirmOpen(false);
    }
  };

  const handleIssueInvoice = async () => {
    const issued = await handleStatusUpdate("issued", "Invoice issued successfully.");
    if (issued) {
      setIsIssueConfirmOpen(false);
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
                    to={`/invoices${location.search ? location.search : ""}`}
                    className="inline-flex h-11 items-center justify-center rounded-full bg-[#F4F7FE] px-5 text-sm font-semibold text-[#4318FF] transition hover:bg-[#E8EEFF]"
                  >
                    Back to invoices
                  </Link>
                  {user?.role === "manager" && invoice.canReview ? (
                    <>
                      <Button className="bg-rose-600 hover:bg-rose-700" disabled={isUpdating} onClick={() => setIsRejectConfirmOpen(true)}>
                        Reject draft
                      </Button>
                      <Button disabled={isUpdating} onClick={() => setIsApproveConfirmOpen(true)}>
                        Approve for issue
                      </Button>
                    </>
                  ) : null}
                  {user?.role === "admin" && invoice.canEdit ? (
                    <Button disabled={isUpdating} onClick={beginDraftEdit}>
                      Edit draft
                    </Button>
                  ) : null}
                  {user?.role === "admin" && invoice.status === "draft" ? (
                    <Button
                      className="bg-rose-600 hover:bg-rose-700"
                      disabled={isUpdating}
                      onClick={() => setIsCancelConfirmOpen(true)}
                    >
                      Cancel draft
                    </Button>
                  ) : null}
                  {user?.role === "admin" && invoice.canIssue ? (
                    <Button disabled={isUpdating} onClick={() => setIsIssueConfirmOpen(true)}>
                      Issue invoice
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

            {invoice.rejectionReason ? (
              <section className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3" role="alert">
                <div className="flex flex-col gap-1.5 sm:flex-row sm:items-start sm:gap-3">
                  <p className="shrink-0 text-sm font-semibold text-amber-900">Manager feedback:</p>
                  <p className="min-w-0 text-sm leading-5 text-amber-800">{invoice.rejectionReason}</p>
                </div>
                {invoice.rejectedBy ? <p className="mt-1 text-xs text-amber-700">Requested by {invoice.rejectedBy.name}</p> : null}
              </section>
            ) : null}

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
                  {isEditingDraft ? (
                    <div className="mt-4 space-y-4">
                      <Input label="Invoice date" type="date" value={invoiceDate} onChange={(event) => setInvoiceDate(event.target.value)} />
                      <Input label="Due date" type="date" value={dueDate} onChange={(event) => setDueDate(event.target.value)} />
                      <Input label="Tax amount" type="number" min="0" step="0.01" value={taxAmount} onChange={(event) => setTaxAmount(event.target.value)} />
                      <Textarea label="Notes" value={notes} onChange={(event) => setNotes(event.target.value)} />
                      <div className="flex gap-3">
                        <Button className="flex-1" disabled={isUpdating} onClick={() => void handleDraftSave()}>
                          {isUpdating ? "Saving..." : "Save and resubmit"}
                        </Button>
                        <button className="rounded-full px-4 text-sm font-semibold text-[#707EAE] hover:bg-[#F4F7FE]" type="button" onClick={() => setIsEditingDraft(false)}>
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="mt-4 space-y-3">
                      <InfoCard label="Invoice date" value={new Date(invoice.invoiceDate).toLocaleDateString()} />
                      <InfoCard label="Due date" value={new Date(invoice.dueDate).toLocaleDateString()} />
                      <InfoCard label="Reviewed by" value={invoice.reviewedBy?.name ?? "Not reviewed yet"} />
                      <InfoCard label="Issued by" value={invoice.issuedBy?.name ?? "Not issued yet"} />
                      <InfoCard label="Paid at" value={invoice.paidAt ? new Date(invoice.paidAt).toLocaleString() : "Not paid yet"} />
                    </div>
                  )}
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
      <ConfirmationModal
        isOpen={isApproveConfirmOpen}
        title="Approve invoice draft?"
        description="This confirms the draft is correct and moves it to the administrator issuing queue."
        confirmLabel="Approve for issue"
        isConfirming={isUpdating}
        onCancel={() => {
          if (!isUpdating) {
            setIsApproveConfirmOpen(false);
          }
        }}
        onConfirm={handleApproveInvoice}
      />
      <ConfirmationModal
        isOpen={isIssueConfirmOpen}
        title="Issue invoice?"
        description="This will mark the reviewed invoice as issued. Confirm that the invoice is ready to send to the customer."
        confirmLabel="Issue invoice"
        isConfirming={isUpdating}
        onCancel={() => {
          if (!isUpdating) {
            setIsIssueConfirmOpen(false);
          }
        }}
        onConfirm={handleIssueInvoice}
      />
      <ConfirmationModal
        isOpen={isCancelConfirmOpen}
        title="Cancel invoice draft?"
        description="This permanently deletes the draft and releases its project work logs so they can be invoiced again."
        confirmLabel="Delete draft"
        tone="danger"
        isConfirming={isUpdating}
        onCancel={() => {
          if (!isUpdating) {
            setIsCancelConfirmOpen(false);
          }
        }}
        onConfirm={handleCancelDraft}
      />
      <ConfirmationModal
        isOpen={isRejectConfirmOpen}
        title="Reject invoice draft?"
        description="Provide the changes the administrator needs to make before this invoice can be approved for issue."
        confirmLabel="Reject draft"
        tone="danger"
        isConfirming={isUpdating}
        isConfirmDisabled={!rejectionReason.trim()}
        onCancel={() => {
          if (!isUpdating) {
            setIsRejectConfirmOpen(false);
          }
        }}
        onConfirm={handleRejectInvoice}
      >
        <Textarea label="Reason" placeholder="Explain what needs to be corrected" value={rejectionReason} onChange={(event) => setRejectionReason(event.target.value)} />
      </ConfirmationModal>
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
