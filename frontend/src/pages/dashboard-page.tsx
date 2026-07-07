import { JobsTableCard } from "../components/features/dashboard/jobs-table-card";
import { MetricCard } from "../components/features/dashboard/metric-card";
import { ProgressCard } from "../components/features/dashboard/progress-card";
import { AdminShell } from "../components/features/layout/admin-shell";
import { useAuthStore } from "../stores/auth-store";

export const DashboardPage = () => {
  const user = useAuthStore((state) => state.user);

  return (
    <AdminShell
      eyebrow="Pages / Dashboard"
      title={`Welcome back, ${user?.name ?? "User"}`}
      description="A clean operations dashboard inspired by modern admin layouts, ready for customer, project, and invoice modules."
    >
      <section className="grid gap-5 xl:grid-cols-4">
        <MetricCard label="Open jobs" value="24" change="+6.2%" />
        <MetricCard label="Invoices pending" value="$12.4k" change="+2.1%" />
        <MetricCard label="Team utilization" value="81%" change="Healthy" />
        <MetricCard label="Collections this month" value="$38.9k" change="-1.4%" positive={false} />
      </section>

      <section className="grid gap-5 xl:grid-cols-[minmax(0,1.6fr)_minmax(320px,0.8fr)]">
        <JobsTableCard />
        <ProgressCard />
      </section>
    </AdminShell>
  );
};
