import { Link, Navigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { TeamMemberTable } from "../components/features/team-members/team-member-table";
import { AppShell } from "../components/features/layout/app-shell";
import { Input } from "../components/ui/input";
import { Select } from "../components/ui/select";
import { useDebouncedValue } from "../lib/use-debounced-value";
import { notify } from "../lib/notify";
import { fetchTeamMembersRequest } from "../services/user-api";
import { useAuthStore } from "../stores/auth-store";
import type { TeamMember } from "../types/team-member";
import type { UserRole } from "../types/auth";

export const TeamMembersPage = () => {
  const user = useAuthStore((state) => state.user);
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [search, setSearch] = useState("");
  const [activeFilter, setActiveFilter] = useState<"all" | "true" | "false">("all");
  const [roleFilter, setRoleFilter] = useState<UserRole | "all">("all");
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [isFiltering, setIsFiltering] = useState(false);
  const debouncedSearch = useDebouncedValue(search, 350);

  const canView = user?.role === "admin" || user?.role === "manager";
  const canManage = user?.role === "admin";

  const loadTeamMembers = async (options?: { preserveTable?: boolean }) => {
    if (!canView) {
      return;
    }

    if (options?.preserveTable) {
      setIsFiltering(true);
    } else {
      setIsInitialLoading(true);
    }

    try {
      const results = await fetchTeamMembersRequest({
        search: debouncedSearch || undefined,
        active: activeFilter,
        role: roleFilter
      });
      setTeamMembers(results);
    } catch (error: unknown) {
      notify.error(error instanceof Error ? error.message : "Unable to fetch team members");
    } finally {
      setIsInitialLoading(false);
      setIsFiltering(false);
    }
  };

  useEffect(() => {
    void loadTeamMembers({
      preserveTable:
        teamMembers.length > 0 || debouncedSearch.length > 0 || activeFilter !== "all" || roleFilter !== "all"
    });
  }, [canView, debouncedSearch, activeFilter, roleFilter]);

  if (user?.role === "team_member") {
    return <Navigate to="/projects" replace />;
  }

  return (
    <AppShell eyebrow="Pages / Team Members" title="Team members" description="">
      <section className="space-y-5">
        <div className="flex flex-col gap-4 rounded-[1.75rem] bg-white p-4 shadow-[0_20px_60px_rgba(11,20,55,0.08)] sm:p-6 md:flex-row md:items-end md:justify-between">
          <div className="grid flex-1 gap-4 md:grid-cols-[minmax(0,1fr)_220px_220px]">
            <Input
              label="Search team members"
              placeholder="Search by name, email, or title"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
            <Select label="Status filter" value={activeFilter} onChange={(event) => setActiveFilter(event.target.value as "all" | "true" | "false")}>
              <option value="all">All statuses</option>
              <option value="true">Active only</option>
              <option value="false">Inactive only</option>
            </Select>
            <Select label="Role filter" value={roleFilter} onChange={(event) => setRoleFilter(event.target.value as UserRole | "all")}>
              <option value="all">All roles</option>
              <option value="admin">Admin</option>
              <option value="manager">Manager</option>
              <option value="team_member">Team member</option>
            </Select>
          </div>

          {canManage ? (
            <Link
              to="/team-members/new"
              className="inline-flex h-11 w-full items-center justify-center rounded-full bg-[#4318FF] px-5 text-sm font-semibold text-white shadow-[0_12px_30px_rgba(67,24,255,0.22)] transition hover:bg-[#3311cc] md:w-auto"
            >
              Create team member
            </Link>
          ) : null}
        </div>

        <div className="relative">
          {isFiltering && !isInitialLoading ? (
            <div className="absolute inset-0 z-10 flex items-center justify-center rounded-[1.75rem] bg-white/70 backdrop-blur-[2px]">
              <div className="flex items-center gap-3 rounded-full bg-white px-4 py-3 text-sm font-semibold text-[#4318FF] shadow-[0_12px_30px_rgba(11,20,55,0.08)]">
                <span className="h-3 w-3 animate-spin rounded-full border-2 border-[#C4B5FD] border-t-[#4318FF]" />
                Filtering team members...
              </div>
            </div>
          ) : null}

          {isInitialLoading ? (
            <section className="rounded-[1.75rem] bg-white p-10 text-center text-sm font-medium text-[#707EAE] shadow-[0_20px_60px_rgba(11,20,55,0.08)]">
              Loading team members...
            </section>
          ) : (
            <TeamMemberTable
              teamMembers={teamMembers}
              canManage={canManage}
              canView={canView}
            />
          )}
        </div>
      </section>
    </AppShell>
  );
};
