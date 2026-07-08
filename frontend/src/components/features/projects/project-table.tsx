import { Link } from "react-router-dom";
import type { Project } from "../../../types/project";

interface ProjectTableProps {
  projects: Project[];
  canManage: boolean;
  onCancel: (project: Project) => void;
}

const statusClassNames: Record<Project["status"], string> = {
  draft: "bg-slate-100 text-slate-700",
  assigned: "bg-blue-50 text-blue-700",
  in_progress: "bg-amber-50 text-amber-700",
  submitted: "bg-violet-50 text-violet-700",
  approved: "bg-emerald-50 text-emerald-700",
  rejected: "bg-rose-50 text-rose-700",
  invoiced: "bg-cyan-50 text-cyan-700",
  paid: "bg-teal-50 text-teal-700",
  cancelled: "bg-slate-200 text-slate-600"
};

const formatStatus = (status: Project["status"]) =>
  status
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");

const renderAssignedTo = (project: Project) => {
  if (project.assignedTo.length === 0) {
    return "Unassigned";
  }

  return project.assignedTo.map((user) => user.name).join(", ");
};

export const ProjectTable = ({ projects, canManage, onCancel }: ProjectTableProps) => {
  return (
    <section className="rounded-[1.75rem] bg-white p-4 shadow-[0_20px_60px_rgba(11,20,55,0.08)] sm:p-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm font-medium text-[#A3AED0]">Project records</p>
        </div>
        <div className="rounded-full bg-[#F4F7FE] px-3 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-[#4318FF]">
          Project pipeline
        </div>
      </div>

      <div className="mt-6 space-y-4 md:hidden">
        {projects.length === 0 ? (
          <div className="rounded-2xl bg-[#F8FAFF] px-4 py-8 text-center text-sm font-medium text-[#707EAE]">
            No projects found
          </div>
        ) : (
          projects.map((project) => (
            <article key={project.id} className="rounded-[1.5rem] bg-[#F8FAFF] p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h3 className="text-base font-bold text-[#2B3674]">{project.title}</h3>
                  <p className="mt-1 text-sm text-[#707EAE]">{project.customerName}</p>
                </div>
                <span
                  className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${statusClassNames[project.status]}`}
                >
                  {formatStatus(project.status)}
                </span>
              </div>

              <dl className="mt-4 space-y-3 text-sm text-[#707EAE]">
                <div>
                  <dt className="text-xs font-semibold uppercase tracking-[0.18em] text-[#A3AED0]">Assigned</dt>
                  <dd className="mt-1">{renderAssignedTo(project)}</dd>
                </div>
                <div>
                  <dt className="text-xs font-semibold uppercase tracking-[0.18em] text-[#A3AED0]">Due date</dt>
                  <dd className="mt-1">
                    {project.dueDate ? new Date(project.dueDate).toLocaleDateString() : "Not scheduled"}
                  </dd>
                </div>
                <div>
                  <dt className="text-xs font-semibold uppercase tracking-[0.18em] text-[#A3AED0]">Updated</dt>
                  <dd className="mt-1">{new Date(project.updatedAt).toLocaleDateString()}</dd>
                </div>
              </dl>

              <div className={`mt-5 grid gap-3 ${canManage ? "grid-cols-2" : "grid-cols-1"}`}>
                <Link
                  to={`/projects/${project.id}/edit`}
                  className="inline-flex h-11 items-center justify-center rounded-full bg-white text-sm font-semibold text-[#4318FF]"
                >
                  {canManage ? "Edit" : "View"}
                </Link>
                {canManage ? (
                  <button
                    type="button"
                    className="inline-flex h-11 items-center justify-center rounded-full bg-white text-sm font-semibold text-rose-600 disabled:text-slate-400"
                    onClick={() => onCancel(project)}
                    disabled={project.status === "cancelled"}
                  >
                    Cancel
                  </button>
                ) : null}
              </div>
            </article>
          ))
        )}
      </div>

      <div className="mt-6 hidden overflow-x-auto md:block">
        <table className="min-w-full border-separate border-spacing-y-3 text-left">
          <thead>
            <tr className="text-xs uppercase tracking-[0.18em] text-[#A3AED0]">
              <th className="px-4">Project</th>
              <th className="px-4">Customer</th>
              <th className="px-4">Assigned to</th>
              <th className="px-4">Status</th>
              <th className="px-4">Due date</th>
              <th className="px-4">Updated</th>
              <th className="px-4">Actions</th>
            </tr>
          </thead>
          <tbody>
            {projects.length === 0 ? (
              <tr className="bg-[#F8FAFF]">
                <td className="rounded-2xl px-4 py-8 text-center text-sm font-medium text-[#707EAE]" colSpan={7}>
                  No projects found
                </td>
              </tr>
            ) : (
              projects.map((project) => (
                <tr key={project.id} className="bg-[#F8FAFF]">
                  <td className="rounded-l-2xl px-4 py-4 text-sm">
                    <div className="font-semibold text-[#2B3674]">{project.title}</div>
                    <div className="mt-1 text-xs font-medium text-[#A3AED0]">{project.id}</div>
                  </td>
                  <td className="px-4 py-4 text-sm text-[#707EAE]">{project.customerName}</td>
                  <td className="px-4 py-4 text-sm text-[#707EAE]">{renderAssignedTo(project)}</td>
                  <td className="px-4 py-4">
                    <span
                      className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${statusClassNames[project.status]}`}
                    >
                      {formatStatus(project.status)}
                    </span>
                  </td>
                  <td className="px-4 py-4 text-sm text-[#707EAE]">
                    {project.dueDate ? new Date(project.dueDate).toLocaleDateString() : "Not scheduled"}
                  </td>
                  <td className="px-4 py-4 text-sm text-[#707EAE]">
                    {new Date(project.updatedAt).toLocaleDateString()}
                  </td>
                  <td className="rounded-r-2xl px-4 py-4">
                    <div className="flex gap-3 text-sm font-semibold">
                      <Link to={`/projects/${project.id}/edit`} className="text-[#4318FF]">
                        {canManage ? "Edit" : "View"}
                      </Link>
                      {canManage ? (
                        <button
                          type="button"
                          className="text-rose-600 disabled:text-slate-400"
                          onClick={() => onCancel(project)}
                          disabled={project.status === "cancelled"}
                        >
                          Cancel
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
