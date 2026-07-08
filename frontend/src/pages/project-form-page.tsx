import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { Link, Navigate, useNavigate, useParams } from "react-router-dom";
import { z } from "zod";
import { AppShell } from "../components/features/layout/app-shell";
import { ConfirmationModal } from "../components/features/shared/confirmation-modal";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Select } from "../components/ui/select";
import { Textarea } from "../components/ui/textarea";
import { notify } from "../lib/notify";
import { fetchCustomersRequest } from "../services/customer-api";
import {
  cancelProjectRequest,
  createProjectRequest,
  fetchProjectRequest,
  updateProjectRequest
} from "../services/project-api";
import { fetchAssignableUsersRequest } from "../services/user-api";
import { useAuthStore } from "../stores/auth-store";
import type { Customer } from "../types/customer";
import type { Project, ProjectPayload, ProjectStatus } from "../types/project";
import type { UserOption } from "../types/user";

const projectStatusOptions: Array<{ value: ProjectStatus; label: string }> = [
  { value: "draft", label: "Draft" },
  { value: "assigned", label: "Assigned" },
  { value: "in_progress", label: "In Progress" },
  { value: "submitted", label: "Submitted" },
  { value: "approved", label: "Approved" },
  { value: "rejected", label: "Rejected" },
  { value: "invoiced", label: "Invoiced" },
  { value: "paid", label: "Paid" },
  { value: "cancelled", label: "Cancelled" }
];

const projectFormSchema = z
  .object({
    customerId: z.string().trim().min(1, "Customer is required"),
    title: z.string().trim().min(1, "Title is required"),
    description: z.string().trim().max(2000),
    assignedToIds: z.array(z.string()),
    status: z.enum([
      "draft",
      "assigned",
      "in_progress",
      "submitted",
      "approved",
      "rejected",
      "invoiced",
      "paid",
      "cancelled"
    ]),
    startDate: z.string().optional(),
    dueDate: z.string().optional(),
    rejectionReason: z.string().optional()
  })
  .superRefine((value, context) => {
    const requiresDates = value.status !== "draft" && value.status !== "assigned";

    if (requiresDates && !value.startDate) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Start date is required for this status",
        path: ["startDate"]
      });
    }

    if (requiresDates && !value.dueDate) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Due date is required for this status",
        path: ["dueDate"]
      });
    }

    if (value.startDate && value.dueDate && value.startDate > value.dueDate) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Due date must be on or after the start date",
        path: ["dueDate"]
      });
    }

    if (value.status === "rejected" && !value.rejectionReason?.trim()) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Provide a rejection reason when the project is rejected",
        path: ["rejectionReason"]
      });
    }
  });

type ProjectFormValues = z.infer<typeof projectFormSchema>;

const emptyValues: ProjectFormValues = {
  customerId: "",
  title: "",
  description: "",
  assignedToIds: [],
  status: "draft",
  startDate: "",
  dueDate: "",
  rejectionReason: ""
};

const formatDateTime = (value: string | null) =>
  value ? new Date(value).toLocaleString() : "Not available";

const toProjectFormValues = (project: Project): ProjectFormValues => ({
  customerId: project.customerId,
  title: project.title,
  description: project.description,
  assignedToIds: project.assignedTo.map((member) => member.id),
  status: project.status,
  startDate: project.startDate ?? "",
  dueDate: project.dueDate ?? "",
  rejectionReason: project.rejectionReason ?? ""
});

export const ProjectFormPage = () => {
  const { projectId } = useParams();
  const navigate = useNavigate();
  const user = useAuthStore((state) => state.user);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [assignableUsers, setAssignableUsers] = useState<UserOption[]>([]);
  const [project, setProject] = useState<Project | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isCancelConfirmOpen, setIsCancelConfirmOpen] = useState(false);
  const isEditing = Boolean(projectId);
  const canManage = user?.role === "admin" || user?.role === "manager";
  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors }
  } = useForm<ProjectFormValues>({
    resolver: zodResolver(projectFormSchema),
    defaultValues: emptyValues
  });

  const selectedStatus = watch("status");
  const selectedAssigneeIds = watch("assignedToIds");
  const shouldShowApprovalFields = selectedStatus === "approved";
  const shouldShowRejectionReason = selectedStatus === "rejected";
  const areDatesOptional = selectedStatus === "draft" || selectedStatus === "assigned";

  useEffect(() => {
    if (!shouldShowRejectionReason) {
      setValue("rejectionReason", "", { shouldValidate: true, shouldDirty: true });
    }
  }, [setValue, shouldShowRejectionReason]);

  useEffect(() => {
    if (!user) {
      return;
    }

    if (!canManage) {
      setIsLoading(false);
      return;
    }

    void (async () => {
      setIsLoading(true);

      try {
        const [customerResults, userResults, projectResult] = await Promise.all([
          fetchCustomersRequest({ status: "active" }),
          fetchAssignableUsersRequest(),
          isEditing && projectId ? fetchProjectRequest(projectId) : Promise.resolve(null)
        ]);

        setCustomers(customerResults);
        setAssignableUsers(userResults);
        setProject(projectResult);

        if (projectResult) {
          reset(toProjectFormValues(projectResult));
        } else {
          reset(emptyValues);
        }
      } catch (error: unknown) {
        notify.error(error instanceof Error ? error.message : "Unable to load this project screen");
      } finally {
        setIsLoading(false);
      }
    })();
  }, [canManage, isEditing, projectId, reset, user]);

  const pageTitle = useMemo(() => {
    if (isEditing) {
      return project ? `Edit ${project.title}` : "Edit project";
    }

    return "Create project";
  }, [isEditing, project]);

  if (!canManage) {
    return <Navigate to="/projects" replace />;
  }

  const toggleAssignee = (userId: string) => {
    if (selectedAssigneeIds.includes(userId)) {
      setValue(
        "assignedToIds",
        selectedAssigneeIds.filter((value) => value !== userId),
        { shouldValidate: true, shouldDirty: true }
      );
      return;
    }

    setValue("assignedToIds", [...selectedAssigneeIds, userId], {
      shouldValidate: true,
      shouldDirty: true
    });
  };

  const handleSave = async (values: ProjectFormValues) => {
    setIsSaving(true);

    const payload: ProjectPayload = {
      customerId: values.customerId,
      title: values.title,
      description: values.description,
      assignedToIds: values.assignedToIds,
      status: values.status,
      startDate: values.startDate || null,
      dueDate: values.dueDate || null,
      rejectionReason: values.status === "rejected" ? values.rejectionReason?.trim() || null : null
    };

    try {
      const savedProject = isEditing && projectId
        ? await updateProjectRequest(projectId, payload)
        : await createProjectRequest(payload);

      setProject(savedProject);
      reset(toProjectFormValues(savedProject));
      notify.success(isEditing ? "Project updated successfully." : "Project created successfully.");
      navigate(`/projects/${savedProject.id}/edit`, { replace: true });
    } catch (error: unknown) {
      notify.error(error instanceof Error ? error.message : "Unable to save this project");
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancelProject = async () => {
    if (!project) {
      return;
    }

    setIsSaving(true);

    try {
      const updatedProject = await cancelProjectRequest(project.id);
      setProject(updatedProject);
      reset(toProjectFormValues(updatedProject));
      notify.success("Project cancelled successfully.");
    } catch (error: unknown) {
      notify.error(error instanceof Error ? error.message : "Unable to cancel this project");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <AppShell
      eyebrow={isEditing ? "Pages / Projects / Edit" : "Pages / Projects / Create"}
      title={pageTitle}
      description=""
    >
      <section className="space-y-5">
        <div className="flex items-center justify-between gap-3 rounded-[1.75rem] bg-white p-4 shadow-[0_20px_60px_rgba(11,20,55,0.08)] sm:p-6">
          <div>
            <p className="text-sm font-medium text-[#A3AED0]">Project workspace</p>
            <p className="mt-1 text-sm text-[#707EAE]">
              {isEditing
                ? ""
                : "Create a new project record. The ID will be generated automatically once it is saved."}
            </p>
          </div>

          <div className="flex gap-3">
            <Link
              to="/projects"
              className="inline-flex h-11 items-center justify-center rounded-full px-5 text-sm font-semibold text-[#707EAE] transition hover:bg-[#F4F7FE] hover:text-[#2B3674]"
            >
              Back to projects
            </Link>
            {project ? (
              <Button
                type="button"
                className="bg-rose-600 shadow-[0_12px_30px_rgba(225,29,72,0.22)] hover:bg-rose-700"
                onClick={() => {
                  setIsCancelConfirmOpen(true);
                }}
                disabled={isSaving || selectedStatus === "cancelled"}
              >
                Cancel project
              </Button>
            ) : null}
          </div>
        </div>

        {isLoading ? (
          <section className="rounded-[1.75rem] bg-white p-10 text-center text-sm font-medium text-[#707EAE] shadow-[0_20px_60px_rgba(11,20,55,0.08)]">
            Loading project details...
          </section>
        ) : (
          <form className="space-y-5" onSubmit={handleSubmit(handleSave)}>
            <section className="grid gap-5 xl:grid-cols-[minmax(0,1.7fr)_minmax(320px,1fr)]">
              <div className="space-y-5">
                <div className="rounded-[1.75rem] bg-white p-5 shadow-[0_20px_60px_rgba(11,20,55,0.08)] sm:p-6">
                  <div className="space-y-4">
                    <Input
                      label="ID"
                      value={project?.id ?? ""}
                      readOnly
                      disabled
                    />
                    <Select label="Customer" error={errors.customerId?.message} {...register("customerId")}>
                      <option value="">Select a customer</option>
                      {customers.map((customer) => (
                        <option key={customer.id} value={customer.id}>
                          {customer.companyName}
                        </option>
                      ))}
                    </Select>
                    <Input label="Title" error={errors.title?.message} {...register("title")} />
                    <Textarea
                      label="Description"
                      error={errors.description?.message}
                      {...register("description")}
                    />
                    <Select label="Status" error={errors.status?.message} {...register("status")}>
                      {projectStatusOptions.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </Select>
                    <Input
                      label={areDatesOptional ? "Start date (optional)" : "Start date"}
                      type="date"
                      error={errors.startDate?.message}
                      {...register("startDate")}
                    />
                    <Input
                      label={areDatesOptional ? "Due date (optional)" : "Due date"}
                      type="date"
                      error={errors.dueDate?.message}
                      {...register("dueDate")}
                    />
                    {shouldShowApprovalFields ? (
                      <>
                        <Input
                          label="Approved by"
                          value={
                            project?.approvedBy
                              ? `${project.approvedBy.name} (${project.approvedBy.email})`
                              : "Will populate after save"
                          }
                          readOnly
                          disabled
                        />
                        <Input
                          label="Approved at"
                          value={project?.approvedAt ? formatDateTime(project.approvedAt) : "Will populate after save"}
                          readOnly
                          disabled
                        />
                      </>
                    ) : null}
                    {shouldShowRejectionReason ? (
                      <Textarea
                        label="Rejection reason"
                        error={errors.rejectionReason?.message}
                        placeholder="Required when the status is Rejected"
                        {...register("rejectionReason")}
                      />
                    ) : null}
                  </div>
                </div>

                <div className="rounded-[1.75rem] bg-white p-5 shadow-[0_20px_60px_rgba(11,20,55,0.08)] sm:p-6">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-sm font-medium text-[#A3AED0]">Assigned team members</p>
                      <h2 className="mt-1 text-xl font-bold text-[#2B3674]">Assigned to</h2>
                    </div>
                    <div className="rounded-full bg-[#F4F7FE] px-3 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-[#4318FF]">
                      {selectedAssigneeIds.length} selected
                    </div>
                  </div>

                        {assignableUsers.length === 0 ? (
                    <div className="mt-5 rounded-2xl bg-[#F8FAFF] px-4 py-6 text-sm text-[#707EAE]">
                      No team members are available yet. Add or seed team members before assigning work.
                    </div>
                  ) : (
                    <div className="mt-5 grid gap-3 md:grid-cols-2">
                      {assignableUsers.map((member) => {
                        const isSelected = selectedAssigneeIds.includes(member.id);

                        return (
                          <label
                            key={member.id}
                            className={`flex cursor-pointer items-start gap-3 rounded-2xl border px-4 py-4 transition ${
                              isSelected
                                ? "border-[#4318FF] bg-[#F4F7FE]"
                                : "border-[#E9EDF7] bg-[#FDFDFF] hover:border-[#C4B5FD]"
                            }`}
                          >
                            <input
                              type="checkbox"
                              className="mt-1 h-4 w-4 accent-[#4318FF]"
                              checked={isSelected}
                              onChange={() => toggleAssignee(member.id)}
                            />
                            <div className="min-w-0">
                              <div className="text-sm font-semibold text-[#2B3674]">{member.name}</div>
                              <div className="mt-1 break-all text-xs text-[#707EAE]">{member.email}</div>
                            </div>
                          </label>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>

              <aside className="space-y-5">
                <div className="rounded-[1.75rem] bg-white p-5 shadow-[0_20px_60px_rgba(11,20,55,0.08)] sm:p-6">
                  <p className="text-sm font-medium text-[#A3AED0]">Audit trail</p>
                  <div className="mt-4 space-y-4 text-sm text-[#707EAE]">
                    <div>
                      <div className="text-xs font-semibold uppercase tracking-[0.18em] text-[#A3AED0]">Created at</div>
                      <div className="mt-1 font-medium text-[#2B3674]">
                        {project ? formatDateTime(project.createdAt) : "N/A"}
                      </div>
                    </div>
                    <div>
                      <div className="text-xs font-semibold uppercase tracking-[0.18em] text-[#A3AED0]">Updated at</div>
                      <div className="mt-1 font-medium text-[#2B3674]">
                        {project ? formatDateTime(project.updatedAt) : "N/A"}
                      </div>
                    </div>
                    <div>
                      <div className="text-xs font-semibold uppercase tracking-[0.18em] text-[#A3AED0]">Current status</div>
                      <div className="mt-1 font-medium text-[#2B3674]">
                        {projectStatusOptions.find((option) => option.value === selectedStatus)?.label ?? "Draft"}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="rounded-[1.75rem] bg-white p-5 shadow-[0_20px_60px_rgba(11,20,55,0.08)] sm:p-6">
                  <p className="text-sm font-medium text-[#A3AED0]">Actions</p>
                  <div className="mt-5 space-y-3">
                    <Button type="submit" className="w-full" disabled={isSaving}>
                      {isSaving ? "Saving..." : isEditing ? "Update project" : "Create project"}
                    </Button>
                    <Link
                      to="/projects"
                      className="inline-flex h-11 w-full items-center justify-center rounded-full bg-[#F4F7FE] px-5 text-sm font-semibold text-[#4318FF] transition hover:bg-[#E8EEFF]"
                    >
                      Discard changes
                    </Link>
                  </div>
                </div>
              </aside>
            </section>
          </form>
        )}
      </section>

      <ConfirmationModal
        isOpen={isCancelConfirmOpen}
        title="Cancel project?"
        description={
          project
            ? `Are you sure you want to cancel ${project.title}? This will move the project to Cancelled and keep its history visible.`
            : ""
        }
        confirmLabel="Cancel project"
        tone="danger"
        isConfirming={isSaving}
        onCancel={() => {
          if (!isSaving) {
            setIsCancelConfirmOpen(false);
          }
        }}
        onConfirm={async () => {
          await handleCancelProject();
          setIsCancelConfirmOpen(false);
        }}
      />
    </AppShell>
  );
};
