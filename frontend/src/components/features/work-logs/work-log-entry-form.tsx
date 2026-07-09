import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect, useMemo } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import type { UserRole } from "../../../types/auth";
import type { WorkLog, WorkLogOption, WorkLogPayload } from "../../../types/work-log";
import { Button } from "../../ui/button";
import { Input } from "../../ui/input";
import { Select } from "../../ui/select";
import { Textarea } from "../../ui/textarea";

const workLogFormSchema = z.object({
  projectId: z.string().trim().min(1, "Project is required"),
  jobServiceId: z.string().trim().min(1, "Service is required"),
  workDate: z.string().trim().min(1, "Work date is required"),
  hours: z.coerce.number().positive("Reported work hours must be greater than zero"),
  notes: z.string().trim().max(2000)
});

type WorkLogFormValues = z.infer<typeof workLogFormSchema>;

const buildProjectOptions = (options: WorkLogOption[]) =>
  Array.from(
    new Map(
      options.map((option) => [
        option.projectId,
        {
          projectId: option.projectId,
          projectTitle: option.projectTitle,
          customerName: option.customerName,
          projectStartDate: option.projectStartDate,
          projectDueDate: option.projectDueDate
        }
      ])
    ).values()
  );

interface WorkLogEntryFormProps {
  options: WorkLogOption[];
  editingLog: WorkLog | null;
  isSaving: boolean;
  canCreate: boolean;
  userRole: UserRole;
  initialProjectId?: string;
  initialWeekStart?: string;
  onSubmit: (payload: WorkLogPayload) => Promise<void>;
  onCancelEdit: () => void;
}

const formatTodayKey = () => {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, "0");
  const day = String(today.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

export const WorkLogEntryForm = ({
  options,
  editingLog,
  isSaving,
  canCreate,
  userRole,
  initialProjectId,
  initialWeekStart,
  onSubmit,
  onCancelEdit
}: WorkLogEntryFormProps) => {
  const availableProjects = useMemo(() => buildProjectOptions(options), [options]);
  const {
    register,
    handleSubmit,
    reset,
    watch,
    setError,
    setValue,
    clearErrors,
    formState: { errors }
  } = useForm<WorkLogFormValues>({
    resolver: zodResolver(workLogFormSchema),
    defaultValues: {
      projectId: "",
      jobServiceId: "",
      workDate: "",
      hours: 0,
      notes: ""
    }
  });

  const selectedProjectId = watch("projectId");
  const selectedJobServiceId = watch("jobServiceId");
  const serviceOptions = useMemo(
    () => options.filter((option) => option.projectId === selectedProjectId),
    [options, selectedProjectId]
  );
  const selectedProject = useMemo(
    () =>
      availableProjects.find((project) => project.projectId === selectedProjectId) ??
      (editingLog
        ? {
            projectId: editingLog.projectId,
            projectTitle: editingLog.projectTitle,
            customerName: editingLog.customerName,
            projectStartDate: editingLog.projectStartDate,
            projectDueDate: editingLog.projectDueDate
          }
        : null),
    [availableProjects, editingLog, selectedProjectId]
  );
  const isReadOnlySelection = Boolean(editingLog) || userRole === "admin";
  const maxWorkDate = formatTodayKey();

  useEffect(() => {
    if (editingLog) {
      reset({
        projectId: editingLog.projectId,
        jobServiceId: editingLog.jobServiceId,
        workDate: editingLog.workDate,
        hours: editingLog.hours,
        notes: editingLog.notes
      });
      return;
    }

    const fallbackProjectId = initialProjectId || availableProjects[0]?.projectId || "";
    const fallbackServiceOptions = options.filter((option) => option.projectId === fallbackProjectId);
    const fallbackWorkDate =
      initialWeekStart && initialWeekStart <= maxWorkDate ? initialWeekStart : "";

    reset({
      projectId: fallbackProjectId,
      jobServiceId: fallbackServiceOptions[0]?.jobServiceId ?? "",
      workDate: fallbackWorkDate,
      hours: 0,
      notes: ""
    });
  }, [availableProjects, editingLog, initialProjectId, initialWeekStart, maxWorkDate, options, reset]);

  useEffect(() => {
    if (editingLog || !initialProjectId || selectedProjectId === initialProjectId) {
      return;
    }

    const hasProject = availableProjects.some((project) => project.projectId === initialProjectId);

    if (hasProject) {
      setValue("projectId", initialProjectId, {
        shouldValidate: true
      });
    }
  }, [availableProjects, editingLog, initialProjectId, selectedProjectId, setValue]);

  useEffect(() => {
    if (editingLog) {
      return;
    }

    const hasSelectedService = serviceOptions.some(
      (serviceOption) => serviceOption.jobServiceId === selectedJobServiceId
    );

    if (!hasSelectedService) {
      setValue("jobServiceId", serviceOptions[0]?.jobServiceId ?? "", {
        shouldValidate: true
      });
    }
  }, [editingLog, selectedJobServiceId, serviceOptions, setValue]);

  useEffect(() => {
    clearErrors("workDate");
  }, [clearErrors, selectedProjectId]);

  if (!editingLog && canCreate && options.length === 0) {
    return (
      <section className="rounded-[1.75rem] border border-[#EEF2FF] bg-white p-5 shadow-[0_20px_60px_rgba(11,20,55,0.08)] sm:p-6">
        <p className="text-sm font-medium text-[#A3AED0]">Daily work entry</p>
        <h2 className="mt-2 text-xl font-bold text-[#2B3674]">No assigned services available</h2>
        <p className="mt-3 text-sm leading-7 text-[#707EAE]">
          Work-log options will appear here once you are assigned to a project service that is open for reporting.
        </p>
      </section>
    );
  }

  return (
    <form
      className="rounded-[1.75rem] border border-[#EEF2FF] bg-white p-5 shadow-[0_20px_60px_rgba(11,20,55,0.08)] sm:p-6"
      onSubmit={handleSubmit(async (values) => {
        if (selectedProject?.projectStartDate && values.workDate < selectedProject.projectStartDate) {
          setError("workDate", {
            message: "Work date must be on or after the project's start date"
          });
          return;
        }

        if (selectedProject?.projectDueDate && values.workDate > selectedProject.projectDueDate) {
          setError("workDate", {
            message: "Work date must be on or before the project's due date"
          });
          return;
        }

        await onSubmit({
          jobServiceId: values.jobServiceId,
          workDate: values.workDate,
          hours: values.hours,
          notes: values.notes
        });

        if (!editingLog) {
          reset({
            projectId: values.projectId,
            jobServiceId: values.jobServiceId,
            workDate: "",
            hours: 0,
            notes: ""
          });
        }
      })}
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm font-medium text-[#A3AED0]">
            {editingLog ? "Work-log adjustment" : "Daily work entry"}
          </p>
          <h2 className="mt-1 text-xl font-bold text-[#2B3674]">
            {editingLog ? "Update selected work log" : "Add a work log"}
          </h2>
        </div>
      </div>

      <div className="mt-5 space-y-5">
        <div className="grid gap-4 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)]">
          <Select
            label="Project"
            error={errors.projectId?.message}
            disabled={isReadOnlySelection}
            {...register("projectId")}
          >
            <option value="">Select a project</option>
            {availableProjects.map((project) => (
              <option key={project.projectId} value={project.projectId}>
                {project.projectTitle} - {project.customerName}
              </option>
            ))}
            {editingLog && !options.some((option) => option.projectId === editingLog.projectId) ? (
              <option value={editingLog.projectId}>
                {editingLog.projectTitle} - {editingLog.customerName}
              </option>
            ) : null}
          </Select>

          <Select
            label="Service"
            error={errors.jobServiceId?.message}
            disabled={isReadOnlySelection}
            {...register("jobServiceId")}
          >
            <option value="">Select a service</option>
            {serviceOptions.map((option) => (
              <option key={option.jobServiceId} value={option.jobServiceId}>
                {option.serviceName}
              </option>
            ))}
            {editingLog && !serviceOptions.some((option) => option.jobServiceId === editingLog.jobServiceId) ? (
              <option value={editingLog.jobServiceId}>{editingLog.serviceName}</option>
            ) : null}
          </Select>
        </div>

        <div className="rounded-[1.5rem] border border-[#EEF2FF] bg-[#F8FAFF] p-4">
          <div className="grid gap-4 sm:grid-cols-[minmax(0,1fr)_180px]">
            <Input
              label="Work date"
              type="date"
              min={selectedProject?.projectStartDate ?? undefined}
              max={selectedProject?.projectDueDate ?? maxWorkDate}
              error={errors.workDate?.message}
              {...register("workDate")}
            />

            <Input
              label="Reported hours"
              type="number"
              step="0.25"
              min="0.25"
              error={errors.hours?.message}
              {...register("hours")}
            />
          </div>
        </div>

        <Textarea
          label="Work notes"
          placeholder="Describe the work completed for this day"
          error={errors.notes?.message}
          {...register("notes")}
        />
      </div>

      <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-[#707EAE]">
          {editingLog
            ? "Adjust the selected record while the month remains open."
            : "Add daily project work with the correct project and service assignment."}
        </p>
        <Button type="submit" disabled={isSaving}>
          {isSaving ? "Saving..." : editingLog ? "Update work log" : "Save work log"}
        </Button>
      </div>
    </form>
  );
};
