import type { WorkLog } from "../../../types/work-log";

interface WorkLogTableProps {
  workLogs: WorkLog[];
  canViewLoggedAmount: boolean;
  onEdit: (workLog: WorkLog) => void;
  onDelete: (workLog: WorkLog) => void;
}

const formatRole = (role: WorkLog["member"]["role"]) =>
  role === "team_member" ? "Team member" : role.charAt(0).toUpperCase() + role.slice(1);

export const WorkLogTable = ({
  workLogs,
  canViewLoggedAmount,
  onEdit,
  onDelete
}: WorkLogTableProps) => {
  return (
    <section className="rounded-[1.75rem] bg-white p-4 shadow-[0_20px_60px_rgba(11,20,55,0.08)] sm:p-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm font-medium text-[#A3AED0]">Reported entries</p>
          <h2 className="mt-1 text-xl font-bold text-[#2B3674]">Work-log reporting</h2>
        </div>
        <div className="rounded-full bg-[#F4F7FE] px-3 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-[#4318FF]">
          {workLogs.length} entries
        </div>
      </div>

      <div className="mt-6 space-y-4 md:hidden">
        {workLogs.length === 0 ? (
          <div className="rounded-2xl bg-[#F8FAFF] px-4 py-8 text-center text-sm font-medium text-[#707EAE]">
            No work logs found for the selected filters.
          </div>
        ) : (
          workLogs.map((workLog) => (
            <article key={workLog.id} className="rounded-[1.5rem] bg-[#F8FAFF] p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h3 className="text-base font-bold text-[#2B3674]">{workLog.projectTitle}</h3>
                  <p className="mt-1 text-sm text-[#707EAE]">{workLog.serviceName}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-semibold text-[#2B3674]">{workLog.hours.toFixed(2)} hrs</p>
                  {canViewLoggedAmount ? (
                    <p className="mt-1 text-xs font-medium text-[#A3AED0]">
                      ${workLog.lineTotal.toFixed(2)}
                    </p>
                  ) : null}
                </div>
              </div>

              <dl className="mt-4 space-y-3 text-sm text-[#707EAE]">
                <div>
                  <dt className="text-xs font-semibold uppercase tracking-[0.18em] text-[#A3AED0]">Member</dt>
                  <dd className="mt-1">
                    {workLog.member.name} - {formatRole(workLog.member.role)}
                  </dd>
                </div>
                <div>
                  <dt className="text-xs font-semibold uppercase tracking-[0.18em] text-[#A3AED0]">Work date</dt>
                  <dd className="mt-1">
                    {new Date(workLog.workDate).toLocaleDateString()}
                    {workLog.isWeekSubmitted ? (
                      <span className="ml-2 inline-flex rounded-full bg-emerald-100 px-2 py-0.5 text-[11px] font-semibold uppercase tracking-[0.12em] text-emerald-700">
                        Submitted
                      </span>
                    ) : null}
                  </dd>
                </div>
                {canViewLoggedAmount ? (
                  <div>
                    <dt className="text-xs font-semibold uppercase tracking-[0.18em] text-[#A3AED0]">Logged amount</dt>
                    <dd className="mt-1">${workLog.lineTotal.toFixed(2)}</dd>
                  </div>
                ) : null}
                <div>
                  <dt className="text-xs font-semibold uppercase tracking-[0.18em] text-[#A3AED0]">Notes</dt>
                  <dd className="mt-1">{workLog.notes || "No notes added"}</dd>
                </div>
              </dl>

              {workLog.canEdit || workLog.canDelete ? (
                <div className="mt-5 flex gap-3 text-sm font-semibold">
                  {workLog.canEdit ? (
                    <button type="button" className="text-[#4318FF]" onClick={() => onEdit(workLog)}>
                      Edit
                    </button>
                  ) : null}
                  {workLog.canDelete ? (
                    <button type="button" className="text-rose-600" onClick={() => onDelete(workLog)}>
                      Delete
                    </button>
                  ) : null}
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
              <th className="px-4">Date</th>
              <th className="px-4">Member</th>
              <th className="px-4">Project / Service</th>
              <th className="px-4">Hours</th>
              {canViewLoggedAmount ? <th className="px-4">Logged amount</th> : null}
              <th className="px-4">Notes</th>
              <th className="px-4">Actions</th>
            </tr>
          </thead>
          <tbody>
            {workLogs.length === 0 ? (
              <tr className="bg-[#F8FAFF]">
                <td
                  className="rounded-2xl px-4 py-8 text-center text-sm font-medium text-[#707EAE]"
                  colSpan={canViewLoggedAmount ? 7 : 6}
                >
                  No work logs found for the selected filters.
                </td>
              </tr>
            ) : (
              workLogs.map((workLog) => (
                <tr key={workLog.id} className="bg-[#F8FAFF]">
                  <td className="rounded-l-2xl px-4 py-4 text-sm text-[#707EAE]">
                    <div className="flex items-center gap-2">
                      <span>{new Date(workLog.workDate).toLocaleDateString()}</span>
                      {workLog.isWeekSubmitted ? (
                        <span className="inline-flex rounded-full bg-emerald-100 px-2 py-0.5 text-[11px] font-semibold uppercase tracking-[0.12em] text-emerald-700">
                          Submitted
                        </span>
                      ) : null}
                    </div>
                  </td>
                  <td className="px-4 py-4 text-sm">
                    <div className="font-semibold text-[#2B3674]">{workLog.member.name}</div>
                    <div className="mt-1 text-xs font-medium text-[#A3AED0]">
                      {formatRole(workLog.member.role)}
                    </div>
                  </td>
                  <td className="px-4 py-4 text-sm">
                    <div className="font-semibold text-[#2B3674]">{workLog.projectTitle}</div>
                    <div className="mt-1 text-xs font-medium text-[#707EAE]">{workLog.serviceName}</div>
                  </td>
                  <td className="px-4 py-4 text-sm text-[#707EAE]">{workLog.hours.toFixed(2)}</td>
                  {canViewLoggedAmount ? (
                    <td className="px-4 py-4 text-sm font-semibold text-[#2B3674]">
                      ${workLog.lineTotal.toFixed(2)}
                    </td>
                  ) : null}
                  <td className="px-4 py-4 text-sm text-[#707EAE]">
                    <div className="max-w-[240px] whitespace-pre-wrap">{workLog.notes || "No notes added"}</div>
                  </td>
                  <td className="rounded-r-2xl px-4 py-4">
                    <div className="flex gap-3 text-sm font-semibold">
                      {workLog.canEdit ? (
                        <button type="button" className="text-[#4318FF]" onClick={() => onEdit(workLog)}>
                          Edit
                        </button>
                      ) : null}
                      {workLog.canDelete ? (
                        <button type="button" className="text-rose-600" onClick={() => onDelete(workLog)}>
                          Delete
                        </button>
                      ) : null}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
};
