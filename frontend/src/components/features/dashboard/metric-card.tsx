interface MetricCardProps {
  label: string;
  value: string;
  change: string;
  positive?: boolean;
}

export const MetricCard = ({ label, value, change, positive = true }: MetricCardProps) => {
  return (
    <article className="rounded-[1.75rem] bg-white p-5 shadow-[0_20px_60px_rgba(11,20,55,0.08)]">
      <p className="text-sm font-medium text-[#A3AED0]">{label}</p>
      <div className="mt-4 flex items-end justify-between gap-4">
        <h2 className="text-3xl font-bold tracking-tight text-[#2B3674]">{value}</h2>
        <span
          className={[
            "rounded-full px-3 py-1 text-xs font-semibold",
            positive ? "bg-emerald-50 text-emerald-600" : "bg-amber-50 text-amber-600"
          ].join(" ")}
        >
          {change}
        </span>
      </div>
    </article>
  );
};
