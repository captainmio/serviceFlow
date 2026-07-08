import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { Link, Navigate, useNavigate, useParams } from "react-router-dom";
import { z } from "zod";
import { AppShell } from "../components/features/layout/app-shell";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Select } from "../components/ui/select";
import { notify } from "../lib/notify";
import {
  createTeamMemberRequest,
  fetchTeamMemberRequest,
  updateTeamMemberRequest
} from "../services/user-api";
import { useAuthStore } from "../stores/auth-store";
import type { TeamMember, TeamMemberPayload } from "../types/team-member";

const teamMemberFormSchema = z
  .object({
    firstName: z.string().trim().min(1, "First name is required"),
    lastName: z.string().trim().min(1, "Last name is required"),
    title: z.string().trim().min(1, "Title is required"),
    active: z.enum(["true", "false"]),
    startDate: z.string().min(1, "Start date is required"),
    endDate: z.string().optional(),
    role: z.enum(["admin", "manager", "team_member"]),
    maxWorkHoursPerDay: z.coerce.number().int().positive("Maximum work hours per day is required"),
    maxWorkHoursPerWeek: z.coerce.number().int().positive("Maximum work hours per week is required"),
    email: z.string().trim().email("Enter a valid email"),
    isLoginBlocked: z.boolean(),
    password: z.string().optional()
  })
  .superRefine((value, context) => {
    if (value.endDate && value.endDate < value.startDate) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: "End date must be on or after the start date",
        path: ["endDate"]
      });
    }

    if (value.maxWorkHoursPerWeek < value.maxWorkHoursPerDay) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Weekly hours must be greater than or equal to daily hours",
        path: ["maxWorkHoursPerWeek"]
      });
    }

    if (value.password?.trim() && value.password.trim().length < 8) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Password must be at least 8 characters long",
        path: ["password"]
      });
    }
  });

type TeamMemberFormValues = z.infer<typeof teamMemberFormSchema>;

const defaultValues: TeamMemberFormValues = {
  firstName: "",
  lastName: "",
  title: "",
  active: "true",
  startDate: "",
  endDate: "",
  role: "team_member",
  maxWorkHoursPerDay: 8,
  maxWorkHoursPerWeek: 40,
  email: "",
  isLoginBlocked: false,
  password: ""
};

const formatDateTime = (value: string | null) =>
  value ? new Date(value).toLocaleString() : "N/A";

export const TeamMemberFormPage = () => {
  const { userUuid } = useParams();
  const navigate = useNavigate();
  const user = useAuthStore((state) => state.user);
  const [teamMemberId, setTeamMemberId] = useState<number | null>(null);
  const [teamMember, setTeamMember] = useState<TeamMember | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const isEditing = Boolean(userUuid);
  const canView = user?.role === "admin" || user?.role === "manager";
  const canManage = user?.role === "admin";
  const isReadOnly = user?.role === "manager";
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors }
  } = useForm<TeamMemberFormValues>({
    resolver: zodResolver(teamMemberFormSchema),
    defaultValues
  });

  useEffect(() => {
    if (!canView) {
      setIsLoading(false);
      return;
    }

    if (!isEditing && !canManage) {
      setIsLoading(false);
      return;
    }

    if (!isEditing || !userUuid) {
      reset(defaultValues);
      setTeamMemberId(null);
      setTeamMember(null);
      setIsLoading(false);
      return;
    }

    void (async () => {
      setIsLoading(true);

      try {
        const teamMember = await fetchTeamMemberRequest(userUuid);
        setTeamMember(teamMember);
        setTeamMemberId(teamMember.id);
        reset({
          firstName: teamMember.firstName,
          lastName: teamMember.lastName,
          title: teamMember.title,
          active: teamMember.active ? "true" : "false",
          startDate: teamMember.startDate,
          endDate: teamMember.endDate ?? "",
          role: teamMember.role,
          maxWorkHoursPerDay: teamMember.maxWorkHoursPerDay,
          maxWorkHoursPerWeek: teamMember.maxWorkHoursPerWeek,
          email: teamMember.email,
          isLoginBlocked: teamMember.isLoginBlocked,
          password: ""
        });
      } catch (error: unknown) {
        notify.error(error instanceof Error ? error.message : "Unable to load this team member");
      } finally {
        setIsLoading(false);
      }
    })();
  }, [canManage, canView, isEditing, reset, userUuid]);

  const pageTitle = useMemo(() => {
    if (!isEditing) {
      return "Create team member";
    }

    return canManage ? "Edit team member" : "View team member";
  }, [canManage, isEditing]);

  if (user?.role === "team_member") {
    return <Navigate to="/projects" replace />;
  }

  if (!canView) {
    return <Navigate to="/projects" replace />;
  }

  if (!isEditing && !canManage) {
    return <Navigate to="/team-members" replace />;
  }

  const handleSave = async (values: TeamMemberFormValues) => {
    setIsSaving(true);

    if (!isEditing && !values.password?.trim()) {
      notify.error("Password is required when creating a team member");
      setIsSaving(false);
      return;
    }

    const payload: TeamMemberPayload = {
      firstName: values.firstName,
      lastName: values.lastName,
      title: values.title,
      email: values.email,
      active: values.active === "true",
      isLoginBlocked: values.isLoginBlocked,
      startDate: values.startDate,
      endDate: values.endDate ? values.endDate : null,
      role: values.role,
      maxWorkHoursPerDay: values.maxWorkHoursPerDay,
      maxWorkHoursPerWeek: values.maxWorkHoursPerWeek
      ,
      password: values.password?.trim() || undefined
    };

    try {
      const savedTeamMember = isEditing && userUuid
        ? await updateTeamMemberRequest(userUuid, payload)
        : await createTeamMemberRequest(payload);

      setTeamMember(savedTeamMember);
      setTeamMemberId(savedTeamMember.id);
      notify.success(isEditing ? "Team member updated successfully." : "Team member created successfully.");
      navigate(`/team-members/${savedTeamMember.uuid}/edit`, { replace: true });
    } catch (error: unknown) {
      notify.error(error instanceof Error ? error.message : "Unable to save team member");
    } finally {
      setIsSaving(false);
    }
  };

  const handleInvalidSubmit = () => {
    notify.error("Please fix the highlighted team member form errors and try again.");
  };

  return (
    <AppShell
      eyebrow={isEditing ? "Pages / Team Members / Edit" : "Pages / Team Members / Create"}
      title={pageTitle}
      description=""
    >
      <section className="space-y-5">
        <div className="flex items-center justify-between gap-3 rounded-[1.75rem] bg-white p-4 shadow-[0_20px_60px_rgba(11,20,55,0.08)] sm:p-6">
          <div>
            <p className="text-sm font-medium text-[#A3AED0]">Team member workspace</p>
            <p className="mt-1 text-sm text-[#707EAE]">
              {!isEditing
                ? "Create a new team member record."
                : canManage
                  ? "Update the selected team member record."
                  : "Review the selected team member record."}
            </p>
          </div>

          <Link
            to="/team-members"
            className="inline-flex h-11 items-center justify-center rounded-full px-5 text-sm font-semibold text-[#707EAE] transition hover:bg-[#F4F7FE] hover:text-[#2B3674]"
          >
            Back to team members
          </Link>
        </div>

        {isLoading ? (
          <section className="rounded-[1.75rem] bg-white p-10 text-center text-sm font-medium text-[#707EAE] shadow-[0_20px_60px_rgba(11,20,55,0.08)]">
            Loading team member details...
          </section>
        ) : (
          <form className="space-y-5" onSubmit={handleSubmit(handleSave, handleInvalidSubmit)}>
            <section className="grid gap-5 xl:grid-cols-[minmax(0,1.7fr)_minmax(320px,1fr)]">
              <div className="space-y-5">
                <div className="rounded-[1.75rem] bg-white p-5 shadow-[0_20px_60px_rgba(11,20,55,0.08)] sm:p-6">
                  <div className="space-y-4">
                    <Input label="ID" value={teamMemberId === null ? "" : String(teamMemberId)} readOnly disabled />
                    <Select label="Role" error={errors.role?.message} disabled={isReadOnly} {...register("role")}>
                      <option value="admin">Admin</option>
                      <option value="manager">Manager</option>
                      <option value="team_member">Team member</option>
                    </Select>
                    <Input label="First name" error={errors.firstName?.message} disabled={isReadOnly} {...register("firstName")} />
                    <Input label="Last name" error={errors.lastName?.message} disabled={isReadOnly} {...register("lastName")} />
                    <Input label="Title" error={errors.title?.message} disabled={isReadOnly} {...register("title")} />
                    <Select label="Active" error={errors.active?.message} disabled={isReadOnly} {...register("active")}>
                      <option value="true">Active</option>
                      <option value="false">Inactive</option>
                    </Select>
                    <Input
                      label="Start date"
                      type="date"
                      error={errors.startDate?.message}
                      disabled={isReadOnly}
                      {...register("startDate")}
                    />
                    <Input
                      label="End date"
                      type="date"
                      error={errors.endDate?.message}
                      disabled={isReadOnly}
                      {...register("endDate")}
                    />
                  </div>
                </div>

                <div className="rounded-[1.75rem] border border-[#E9EDF7] bg-white p-5 shadow-[0_20px_60px_rgba(11,20,55,0.08)] sm:p-6">
                  <p className="text-sm font-semibold text-[#2B3674]">Work hours</p>
                  <div className="mt-4 space-y-4">
                    <Input
                      label="Maximum work hours per day"
                      type="number"
                      min="1"
                      error={errors.maxWorkHoursPerDay?.message}
                      disabled={isReadOnly}
                      {...register("maxWorkHoursPerDay")}
                    />
                    <Input
                      label="Maximum work hours per week"
                      type="number"
                      min="1"
                      error={errors.maxWorkHoursPerWeek?.message}
                      disabled={isReadOnly}
                      {...register("maxWorkHoursPerWeek")}
                    />
                  </div>
                </div>

                <div className="rounded-[1.75rem] border border-[#E9EDF7] bg-white p-5 shadow-[0_20px_60px_rgba(11,20,55,0.08)] sm:p-6">
                  <p className="text-sm font-semibold text-[#2B3674]">Login management</p>
                  <div className="mt-4 grid gap-4">
                    <Input
                      label="Email"
                      type="email"
                      error={errors.email?.message}
                      disabled={isReadOnly}
                      {...register("email")}
                    />
                    <Input
                      label="Account password"
                      type="password"
                      error={errors.password?.message}
                      disabled={isReadOnly}
                      placeholder={
                        isReadOnly
                          ? ""
                          : isEditing
                            ? "Enter a new password to replace the current one"
                            : ""
                      }
                      {...register("password")}
                    />
                    <label
                      className={`flex min-h-12 items-center gap-3 rounded-2xl border border-[#E9EDF7] px-4 text-sm font-medium text-[#2B3674] ${
                        isReadOnly ? "bg-slate-100" : "bg-[#FDFDFF]"
                      }`}
                    >
                      <input
                        type="checkbox"
                        className="h-4 w-4 accent-[#4318FF]"
                        disabled={isReadOnly}
                        {...register("isLoginBlocked")}
                      />
                      Is team member blocked to login
                    </label>
                  </div>
                </div>
              </div>

              <aside className="space-y-5">
                <div className="rounded-[1.75rem] bg-white p-5 shadow-[0_20px_60px_rgba(11,20,55,0.08)] sm:p-6">
                  <p className="text-sm font-medium text-[#A3AED0]">Audit trail</p>
                  <div className="mt-4 space-y-4 text-sm text-[#707EAE]">
                    <div>
                      <div className="text-xs font-semibold uppercase tracking-[0.18em] text-[#A3AED0]">Created at</div>
                      <div className="mt-1 font-medium text-[#2B3674]">
                        {formatDateTime(teamMember?.createdAt ?? null)}
                      </div>
                    </div>
                    <div>
                      <div className="text-xs font-semibold uppercase tracking-[0.18em] text-[#A3AED0]">Updated at</div>
                      <div className="mt-1 font-medium text-[#2B3674]">
                        {formatDateTime(teamMember?.updatedAt ?? null)}
                      </div>
                    </div>
                    <div>
                      <div className="text-xs font-semibold uppercase tracking-[0.18em] text-[#A3AED0]">Current status</div>
                      <div className="mt-1 font-medium text-[#2B3674]">
                        {teamMember ? (teamMember.active ? "Active" : "Inactive") : "N/A"}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="rounded-[1.75rem] bg-white p-5 shadow-[0_20px_60px_rgba(11,20,55,0.08)] sm:p-6">
                  <p className="text-sm font-medium text-[#A3AED0]">Actions</p>
                  <div className="mt-5 space-y-3">
                    {canManage ? (
                      <Button type="submit" className="w-full" disabled={isSaving}>
                        {isSaving ? "Saving..." : isEditing ? "Update team member" : "Create team member"}
                      </Button>
                    ) : null}
                    <Link
                      to="/team-members"
                      className="inline-flex h-11 w-full items-center justify-center rounded-full bg-[#F4F7FE] px-5 text-sm font-semibold text-[#4318FF] transition hover:bg-[#E8EEFF]"
                    >
                      {canManage ? "Discard changes" : "Back to team members"}
                    </Link>
                  </div>
                </div>
              </aside>
            </section>
          </form>
        )}
      </section>
    </AppShell>
  );
};
