import type { Service } from "../../../types/service";

interface ServiceTableProps {
  services: Service[];
  canManage: boolean;
  onEdit: (service: Service) => void;
  onDeactivate: (service: Service) => void;
}

const statusClassNames = {
  active: "bg-emerald-50 text-emerald-700",
  inactive: "bg-slate-100 text-slate-600"
} as const;

export const ServiceTable = ({
  services,
  canManage,
  onEdit,
  onDeactivate
}: ServiceTableProps) => {
  return (
    <section className="rounded-[1.75rem] bg-white p-4 shadow-[0_20px_60px_rgba(11,20,55,0.08)] sm:p-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm font-medium text-[#A3AED0]">Company services</p>
        </div>
        <div className="rounded-full bg-[#F4F7FE] px-3 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-[#4318FF]">
          Service catalog
        </div>
      </div>

      <div className="mt-6 space-y-4 md:hidden">
        {services.length === 0 ? (
          <div className="rounded-2xl bg-[#F8FAFF] px-4 py-8 text-center text-sm font-medium text-[#707EAE]">
            No data
          </div>
        ) : (
          services.map((service) => (
            <article key={service.id} className="rounded-[1.5rem] bg-[#F8FAFF] p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h3 className="text-base font-bold text-[#2B3674]">{service.name}</h3>
                  <p className="mt-1 text-sm text-[#707EAE]">{service.description}</p>
                </div>
                <span
                  className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${statusClassNames[service.status]}`}
                >
                  {service.status}
                </span>
              </div>

              <div className="mt-4 text-sm text-[#707EAE]">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#A3AED0]">
                  Default rate
                </p>
                <p className="mt-1 font-semibold text-[#2B3674]">${service.defaultHourlyRate.toFixed(2)}/hr</p>
              </div>
              {canManage ? (
                <div className="mt-5 grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    className="inline-flex h-11 items-center justify-center rounded-full bg-white text-sm font-semibold text-[#4318FF]"
                    onClick={() => onEdit(service)}
                  >
                    Edit
                  </button>
                  <button
                    type="button"
                    className="inline-flex h-11 items-center justify-center rounded-full bg-white text-sm font-semibold text-rose-600"
                    onClick={() => onDeactivate(service)}
                    disabled={service.status === "inactive"}
                  >
                    Deactivate
                  </button>
                </div>
              ) : null}
            </article>
          ))
        )}
      </div>

      <div className="mt-6 hidden overflow-x-auto md:block">
        <table className="min-w-full border-separate border-spacing-y-3 text-left">
          <thead>
            <tr className="text-xs uppercase tracking-[0.18em] text-[#A3AED0]">
              <th className="px-4">Service</th>
              <th className="px-4">Description</th>
              <th className="px-4">Default rate</th>
              <th className="px-4">Status</th>
              <th className="px-4">Updated</th>
              {canManage ? <th className="px-4">Actions</th> : null}
            </tr>
          </thead>
          <tbody>
            {services.length === 0 ? (
              <tr className="bg-[#F8FAFF]">
                <td
                  className="rounded-2xl px-4 py-8 text-center text-sm font-medium text-[#707EAE]"
                  colSpan={canManage ? 6 : 5}
                >
                  No data
                </td>
              </tr>
            ) : (
              services.map((service) => (
                <tr key={service.id} className="bg-[#F8FAFF]">
                  <td className="rounded-l-2xl px-4 py-4 text-sm font-semibold text-[#2B3674]">
                    {service.name}
                  </td>
                  <td className="px-4 py-4 text-sm text-[#707EAE]">{service.description}</td>
                  <td className="px-4 py-4 text-sm font-semibold text-[#2B3674]">
                    ${service.defaultHourlyRate.toFixed(2)}/hr
                  </td>
                  <td className="px-4 py-4">
                    <span
                      className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${statusClassNames[service.status]}`}
                    >
                      {service.status}
                    </span>
                  </td>
                  <td className="px-4 py-4 text-sm text-[#707EAE]">
                    {new Date(service.updatedAt).toLocaleDateString()}
                  </td>
                  {canManage ? (
                    <td className="rounded-r-2xl px-4 py-4">
                      <div className="flex gap-3 text-sm font-semibold">
                        <button type="button" className="text-[#4318FF]" onClick={() => onEdit(service)}>
                          Edit
                        </button>
                        <button
                          type="button"
                          className="text-rose-600 disabled:text-slate-400"
                          onClick={() => onDeactivate(service)}
                          disabled={service.status === "inactive"}
                        >
                          Deactivate
                        </button>
                      </div>
                    </td>
                  ) : null}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
};
