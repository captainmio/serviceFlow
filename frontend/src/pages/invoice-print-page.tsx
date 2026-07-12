import { useEffect, useState } from "react";
import { Link, Navigate } from "react-router-dom";
import { Button } from "../components/ui/button";
import { notify } from "../lib/notify";
import { fetchInvoiceDetailRequest } from "../services/invoice-api";
import { useAuthStore } from "../stores/auth-store";
import type { InvoiceDetail } from "../types/invoice";

export const InvoicePrintPage = ({ invoiceId }: { invoiceId: string }) => {
  const user = useAuthStore((state) => state.user);
  const canAccess = user?.role === "admin" || user?.role === "manager";
  const [invoice, setInvoice] = useState<InvoiceDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!canAccess) {
      return;
    }

    void (async () => {
      setIsLoading(true);

      try {
        const result = await fetchInvoiceDetailRequest(invoiceId);
        setInvoice(result);
      } catch (error: unknown) {
        notify.error(error instanceof Error ? error.message : "Unable to load invoice PDF view");
      } finally {
        setIsLoading(false);
      }
    })();
  }, [canAccess, invoiceId]);

  if (user?.role === "team_member") {
    return <Navigate to="/work-logs" replace />;
  }

  if (!canAccess) {
    return <Navigate to="/login" replace />;
  }

  return (
    <main className="min-h-screen bg-[#F4F7FE] px-4 py-6 print:bg-white print:px-0 print:py-0">
      {isLoading ? (
        <div className="mx-auto max-w-5xl rounded-[1.75rem] bg-white p-10 text-center text-sm text-[#707EAE] shadow-[0_20px_60px_rgba(11,20,55,0.08)]">
          Loading printable invoice...
        </div>
      ) : !invoice ? (
        <div className="mx-auto max-w-5xl rounded-[1.75rem] bg-white p-10 text-center text-sm text-[#707EAE] shadow-[0_20px_60px_rgba(11,20,55,0.08)]">
          Unable to load this printable invoice.
        </div>
      ) : (
        <div className="mx-auto max-w-5xl space-y-5">
          <div className="flex items-center justify-between print:hidden">
            <Link
              to={`/invoices/${invoice.id}`}
              className="inline-flex h-11 items-center justify-center rounded-full bg-white px-5 text-sm font-semibold text-[#4318FF] shadow-[0_12px_30px_rgba(11,20,55,0.08)] transition hover:bg-[#F8FAFF]"
            >
              Back to invoice
            </Link>
            <Button onClick={() => window.print()}>Print / Save PDF</Button>
          </div>

          <section className="rounded-[1.75rem] bg-white p-8 shadow-[0_20px_60px_rgba(11,20,55,0.08)] print:rounded-none print:shadow-none">
            <div className="flex items-start justify-between gap-6 border-b border-[#E8EDF7] pb-6">
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[#A3AED0]">Invoice</p>
                <h1 className="mt-3 text-3xl font-bold text-[#2B3674]">{invoice.invoiceNumber}</h1>
                <p className="mt-2 text-sm text-[#707EAE]">{invoice.customerName}</p>
              </div>
              <div className="text-right text-sm text-[#707EAE]">
                <p>
                  <span className="font-semibold text-[#2B3674]">Invoice date:</span>{" "}
                  {new Date(invoice.invoiceDate).toLocaleDateString()}
                </p>
                <p className="mt-2">
                  <span className="font-semibold text-[#2B3674]">Due date:</span>{" "}
                  {new Date(invoice.dueDate).toLocaleDateString()}
                </p>
                <p className="mt-2">
                  <span className="font-semibold text-[#2B3674]">Status:</span> {invoice.status}
                </p>
              </div>
            </div>

            <div className="mt-8 overflow-hidden rounded-[1.25rem] border border-[#E8EDF7]">
              <table className="min-w-full text-left text-sm">
                <thead className="bg-[#F8FAFF]">
                  <tr className="text-xs uppercase tracking-[0.18em] text-[#A3AED0]">
                    <th className="px-4 py-3 font-semibold">Date</th>
                    <th className="px-4 py-3 font-semibold">Project</th>
                    <th className="px-4 py-3 font-semibold">Service</th>
                    <th className="px-4 py-3 font-semibold">Member</th>
                    <th className="px-4 py-3 font-semibold">Hours</th>
                    <th className="px-4 py-3 font-semibold">Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {invoice.items.map((item) => (
                    <tr key={item.id} className="border-t border-[#EEF2FF] text-[#2B3674]">
                      <td className="px-4 py-4">{new Date(item.workDate).toLocaleDateString()}</td>
                      <td className="px-4 py-4">
                        <div className="font-semibold">{item.projectTitle}</div>
                        <div className="text-xs text-[#707EAE]">
                          {new Date(item.monthStart).toLocaleDateString(undefined, { month: "long", year: "numeric" })}
                        </div>
                      </td>
                      <td className="px-4 py-4">{item.serviceName}</td>
                      <td className="px-4 py-4">{item.memberName}</td>
                      <td className="px-4 py-4">{item.hours.toFixed(2)} hrs</td>
                      <td className="px-4 py-4">${item.lineTotal.toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="mt-8 ml-auto max-w-sm space-y-3">
              <div className="flex items-center justify-between text-sm text-[#707EAE]">
                <span>Subtotal</span>
                <span className="font-semibold text-[#2B3674]">${invoice.subtotal.toFixed(2)}</span>
              </div>
              <div className="flex items-center justify-between text-sm text-[#707EAE]">
                <span>Tax</span>
                <span className="font-semibold text-[#2B3674]">${invoice.taxAmount.toFixed(2)}</span>
              </div>
              <div className="flex items-center justify-between border-t border-[#E8EDF7] pt-3 text-base">
                <span className="font-semibold text-[#2B3674]">Total</span>
                <span className="font-bold text-[#2B3674]">${invoice.totalAmount.toFixed(2)}</span>
              </div>
            </div>

            {invoice.notes ? (
              <div className="mt-8 border-t border-[#E8EDF7] pt-6">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#A3AED0]">Notes</p>
                <p className="mt-3 text-sm leading-7 text-[#707EAE]">{invoice.notes}</p>
              </div>
            ) : null}
          </section>
        </div>
      )}
    </main>
  );
};
