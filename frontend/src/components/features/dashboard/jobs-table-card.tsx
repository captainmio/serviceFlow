interface JobRow {
  customer: string;
  project: string;
  status: string;
  owner: string;
}

const jobRows: JobRow[] = [
  { customer: "Baxter Plumbing", project: "Quarterly maintenance", status: "Scheduled", owner: "Admin" },
  { customer: "Northline Dental", project: "Invoice reconciliation", status: "In review", owner: "Manager" },
  { customer: "Urban Spark", project: "Crew allocation", status: "Ready", owner: "Team Lead" },
  { customer: "Peak Realty", project: "Expense audit", status: "Pending", owner: "Finance" }
];

const statusClassNames: Record<string, string> = {
  Scheduled: "bg-sky-50 text-sky-700",
  "In review": "bg-violet-50 text-violet-700",
  Ready: "bg-emerald-50 text-emerald-700",
  Pending: "bg-amber-50 text-amber-700"
};

export const JobsTableCard = () => {
  return (
    <section className="rounded-[1.75rem] bg-white p-6 shadow-[0_20px_60px_rgba(11,20,55,0.08)]">
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-[#A3AED0]">Operations board</p>
          <h2 className="mt-1 text-xl font-bold text-[#2B3674]">Active service work</h2>
        </div>
        <div className="rounded-full bg-[#F4F7FE] px-3 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-[#4318FF]">
          Live snapshot
        </div>
      </div>

      <div className="mt-6 overflow-x-auto">
        <table className="min-w-full border-separate border-spacing-y-3 text-left">
          <thead>
            <tr className="text-xs uppercase tracking-[0.18em] text-[#A3AED0]">
              <th className="px-4">Customer</th>
              <th className="px-4">Project</th>
              <th className="px-4">Status</th>
              <th className="px-4">Owner</th>
            </tr>
          </thead>
          <tbody>
            {jobRows.map((row) => (
              <tr key={`${row.customer}-${row.project}`} className="bg-[#F8FAFF]">
                <td className="rounded-l-2xl px-4 py-4 text-sm font-semibold text-[#2B3674]">
                  {row.customer}
                </td>
                <td className="px-4 py-4 text-sm text-[#707EAE]">{row.project}</td>
                <td className="px-4 py-4">
                  <span
                    className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${statusClassNames[row.status]}`}
                  >
                    {row.status}
                  </span>
                </td>
                <td className="rounded-r-2xl px-4 py-4 text-sm text-[#707EAE]">{row.owner}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
};
