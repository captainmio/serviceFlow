import { Link } from "react-router-dom";
import type { TeamMember } from "../../../types/team-member";

interface TeamMemberTableProps {
  teamMembers: TeamMember[];
  canManage: boolean;
  canView: boolean;
}

const roleLabels = {
  admin: "Admin",
  manager: "Manager",
  team_member: "Team member"
} as const;

export const TeamMemberTable = ({ teamMembers, canManage, canView }: TeamMemberTableProps) => {
  const actionLabel = canManage ? "Edit" : "View";

  return (
    <section className="rounded-[1.75rem] bg-white p-4 shadow-[0_20px_60px_rgba(11,20,55,0.08)] sm:p-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm font-medium text-[#A3AED0]">Registered web app users</p>
        </div>
        <div className="rounded-full bg-[#F4F7FE] px-3 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-[#4318FF]">
          Team members
        </div>
      </div>

      <div className="mt-6 space-y-4 md:hidden">
        {teamMembers.length === 0 ? (
          <div className="rounded-2xl bg-[#F8FAFF] px-4 py-8 text-center text-sm font-medium text-[#707EAE]">
            No team members found
          </div>
        ) : (
          teamMembers.map((member) => (
            <article key={member.uuid} className="rounded-[1.5rem] bg-[#F8FAFF] p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h3 className="text-base font-bold text-[#2B3674]">{member.name}</h3>
                  <p className="mt-1 text-sm text-[#707EAE]">{member.title}</p>
                </div>
                <span
                  className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${
                    member.active ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-600"
                  }`}
                >
                  {member.active ? "Active" : "Inactive"}
                </span>
              </div>

              <dl className="mt-4 space-y-3 text-sm text-[#707EAE]">
                <div>
                  <dt className="text-xs font-semibold uppercase tracking-[0.18em] text-[#A3AED0]">Role</dt>
                  <dd className="mt-1">{roleLabels[member.role]}</dd>
                </div>
                <div>
                  <dt className="text-xs font-semibold uppercase tracking-[0.18em] text-[#A3AED0]">Email</dt>
                  <dd className="mt-1 break-all">{member.email}</dd>
                </div>
                <div>
                  <dt className="text-xs font-semibold uppercase tracking-[0.18em] text-[#A3AED0]">Member ID</dt>
                  <dd className="mt-1">#{member.id}</dd>
                </div>
              </dl>

              {canView ? (
                <div className="mt-5">
                  <Link
                    to={`/team-members/${member.uuid}/edit`}
                    className="inline-flex h-11 w-full items-center justify-center rounded-full bg-white text-sm font-semibold text-[#4318FF]"
                  >
                    {actionLabel}
                  </Link>
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
              <th className="px-4">ID</th>
              <th className="px-4">Name</th>
              <th className="px-4">Title</th>
              <th className="px-4">Email</th>
              <th className="px-4">Role</th>
              <th className="px-4">Status</th>
              <th className="px-4">Login access</th>
              {canView ? <th className="px-4">Actions</th> : null}
            </tr>
          </thead>
          <tbody>
            {teamMembers.length === 0 ? (
              <tr className="bg-[#F8FAFF]">
                <td
                  className="rounded-2xl px-4 py-8 text-center text-sm font-medium text-[#707EAE]"
                  colSpan={canView ? 8 : 7}
                >
                  No team members found
                </td>
              </tr>
            ) : (
              teamMembers.map((member) => (
                <tr key={member.uuid} className="bg-[#F8FAFF]">
                  <td className="rounded-l-2xl px-4 py-4 text-sm font-semibold text-[#2B3674]">
                    #{member.id}
                  </td>
                  <td className="px-4 py-4 text-sm">
                    <div className="font-semibold text-[#2B3674]">{member.name}</div>
                    <div className="mt-1 text-xs font-medium text-[#A3AED0]">
                      Started {new Date(member.startDate).toLocaleDateString()}
                    </div>
                  </td>
                  <td className="px-4 py-4 text-sm text-[#707EAE]">{member.title}</td>
                  <td className="px-4 py-4 text-sm text-[#707EAE]">{member.email}</td>
                  <td className="px-4 py-4 text-sm text-[#707EAE]">{roleLabels[member.role]}</td>
                  <td className="px-4 py-4">
                    <span
                      className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${
                        member.active ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-600"
                      }`}
                    >
                      {member.active ? "Active" : "Inactive"}
                    </span>
                  </td>
                  <td className="px-4 py-4 text-sm text-[#707EAE]">
                    {member.isLoginBlocked ? "Blocked" : "Allowed"}
                  </td>
                  {canView ? (
                    <td className="rounded-r-2xl px-4 py-4">
                      <Link to={`/team-members/${member.uuid}/edit`} className="text-sm font-semibold text-[#4318FF]">
                        {actionLabel}
                      </Link>
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
