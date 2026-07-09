import { Between, Not } from "typeorm";
import { appDataSource } from "../../database/data-source.js";
import { Job } from "../../entities/job.entity.js";
import { JobService } from "../../entities/job-service.entity.js";
import type { WorkLogMonthStatus } from "../../entities/work-log-month-status.js";
import { WorkLogPeriod } from "../../entities/work-log-period.entity.js";
import { WorkLog } from "../../entities/work-log.entity.js";
import { User } from "../../entities/user.entity.js";
import type { AuthenticatedUser } from "../auth/auth.types.js";
import type {
  WorkLogListQuery,
  WorkLogPayload,
  WorkLogPeriodReviewPayload
} from "./work-log.schemas.js";
import type {
  WorkLogOptionResponse,
  WorkLogPeriodResponse,
  WorkLogResponse
} from "./work-log.types.js";
import {
  assertHoursWithinLimits,
  calculateLineTotal,
  formatLocalDate,
  getMonthStart,
  getWeekStart,
  WorkLogLimitError
} from "./work-log.utils.js";

export class WorkLogAccessError extends Error {}
export class WorkLogNotFoundError extends Error {}
export class WorkLogValidationError extends Error {}

const blockedProjectStatuses = new Set(["approved", "invoiced", "paid", "cancelled"]);

const toAuthUser = (user: User) => ({
  id: user.uuid,
  name: user.name,
  email: user.email,
  role: user.role
});

const startOfWeekToEndOfWeek = (weekStart: string) => {
  const end = new Date(`${weekStart}T00:00:00`);
  end.setDate(end.getDate() + 6);
  return formatLocalDate(end);
};

const isManagerOfProject = (authUser: AuthenticatedUser, project: Job) =>
  authUser.role === "manager" && project.projectManager?.uuid === authUser.id;

const isAssignedToJobService = (authUserId: string, jobService: JobService) =>
  jobService.assignees.some((assignee) => assignee.uuid === authUserId);

const isAssignedToProject = (authUserId: string, project: Job) =>
  project.serviceAssignments.some((jobService) =>
    jobService.assignees.some((assignee) => assignee.uuid === authUserId)
  );

const ensureWorkDateNotInFuture = (workDate: string) => {
  const today = new Date();
  const todayKey = formatLocalDate(new Date(today.getFullYear(), today.getMonth(), today.getDate()));

  if (workDate > todayKey) {
    throw new WorkLogValidationError("Work date cannot be in the future");
  }
};

const loadJobServiceOrThrow = async (jobServiceId: string) => {
  const repository = appDataSource.getRepository(JobService);
  const jobService = await repository.findOne({
    where: { id: jobServiceId },
    relations: {
      job: {
        customer: true,
        projectManager: true,
        approvedBy: true,
        serviceAssignments: {
          assignees: true
        }
      },
      service: true,
      assignees: true
    }
  });

  if (!jobService) {
    throw new WorkLogNotFoundError("Assigned project service not found");
  }

  return jobService;
};

const loadProjectOrThrow = async (projectId: string) => {
  const repository = appDataSource.getRepository(Job);
  const project = await repository.findOne({
    where: { id: projectId },
    relations: {
      customer: true,
      projectManager: true,
      serviceAssignments: {
        service: true,
        assignees: true
      }
    }
  });

  if (!project) {
    throw new WorkLogNotFoundError("Project not found");
  }

  return project;
};

const loadWorkLogOrThrow = async (workLogId: string) => {
  const repository = appDataSource.getRepository(WorkLog);
  const workLog = await repository.findOne({
    where: { id: workLogId },
    relations: {
      job: {
        customer: true,
        projectManager: true,
        serviceAssignments: {
          assignees: true
        }
      },
      jobService: {
        service: true,
        assignees: true
      },
      user: true
    }
  });

  if (!workLog) {
    throw new WorkLogNotFoundError("Work log not found");
  }

  return workLog;
};

const loadWorkLogPeriod = async (projectId: string, monthStart: string) => {
  const repository = appDataSource.getRepository(WorkLogPeriod);
  return repository.findOne({
    where: {
      job: { id: projectId },
      monthStart
    },
    relations: {
      job: true,
      reviewedBy: true
    }
  });
};

const ensureVisibleProject = (project: Job, authUser: AuthenticatedUser) => {
  if (authUser.role === "admin") {
    return;
  }

  if (authUser.role === "manager") {
    if (isManagerOfProject(authUser, project) || isAssignedToProject(authUser.id, project)) {
      return;
    }

    throw new WorkLogAccessError("You do not have access to this project's work logs");
  }

  if (!isAssignedToProject(authUser.id, project)) {
    throw new WorkLogAccessError("You do not have access to this project's work logs");
  }
};

const ensureVisibleWorkLog = (workLog: WorkLog, authUser: AuthenticatedUser) => {
  if (authUser.role === "admin") {
    return;
  }

  if (workLog.user.uuid === authUser.id) {
    return;
  }

  if (isManagerOfProject(authUser, workLog.job)) {
    return;
  }

  throw new WorkLogAccessError("You do not have access to this work log");
};

const ensureProjectIsOpenForWorkLogs = async (project: Job, monthStart: string) => {
  if (blockedProjectStatuses.has(project.status)) {
    throw new WorkLogValidationError(
      "Work logs cannot be changed once the project is approved, invoiced, paid, or cancelled"
    );
  }

  const period = await loadWorkLogPeriod(project.id, monthStart);

  if (period?.status === "approved") {
    throw new WorkLogValidationError(
      "This project's work logs are already approved for the selected month"
    );
  }
};

const ensureCreateAccess = (authUser: AuthenticatedUser, jobService: JobService) => {
  if (authUser.role !== "manager" && authUser.role !== "team_member") {
    throw new WorkLogAccessError("Only managers and team members can create work logs");
  }

  if (!isAssignedToJobService(authUser.id, jobService)) {
    throw new WorkLogAccessError("You can only add work logs to your assigned project services");
  }
};

const ensureUpdateAccess = (authUser: AuthenticatedUser, workLog: WorkLog) => {
  if (authUser.role === "admin") {
    return;
  }

  if (workLog.user.uuid !== authUser.id) {
    throw new WorkLogAccessError("You can only edit your own work logs");
  }
};

const ensureDeleteAccess = (authUser: AuthenticatedUser, workLog: WorkLog) => {
  if (authUser.role === "admin") {
    throw new WorkLogAccessError("Admins can adjust work logs but cannot delete them");
  }

  if (workLog.user.uuid !== authUser.id) {
    throw new WorkLogAccessError("You can only delete your own work logs");
  }
};

const loadUserHourTotals = async ({
  userId,
  workDate,
  excludeWorkLogId
}: {
  userId: string;
  workDate: string;
  excludeWorkLogId?: string;
}) => {
  const repository = appDataSource.getRepository(WorkLog);
  const weekStart = getWeekStart(workDate);
  const weekEnd = startOfWeekToEndOfWeek(weekStart);

  const [dayLogs, weekLogs] = await Promise.all([
    repository.find({
      where: {
        user: { uuid: userId },
        workDate,
        ...(excludeWorkLogId ? { id: Not(excludeWorkLogId) } : {})
      }
    }),
    repository.find({
      where: {
        user: { uuid: userId },
        workDate: Between(weekStart, weekEnd),
        ...(excludeWorkLogId ? { id: Not(excludeWorkLogId) } : {})
      }
    })
  ]);

  return {
    existingDayHours: dayLogs.reduce((sum, log) => sum + Number(log.hours), 0),
    existingWeekHours: weekLogs.reduce((sum, log) => sum + Number(log.hours), 0)
  };
};

const toWorkLogResponse = (workLog: WorkLog, authUser: AuthenticatedUser): WorkLogResponse => {
  const isOwnLog = workLog.user.uuid === authUser.id;
  const canEdit =
    authUser.role === "admin" || ((authUser.role === "manager" || authUser.role === "team_member") && isOwnLog);
  const canDelete = authUser.role !== "admin" && isOwnLog;

  return {
    id: workLog.id,
    projectId: workLog.job.id,
    projectTitle: workLog.job.title,
    customerName: workLog.job.customer.companyName,
    jobServiceId: workLog.jobService.id,
    serviceId: workLog.jobService.service.id,
    serviceName: workLog.jobService.service.name,
    member: toAuthUser(workLog.user),
    workDate: workLog.workDate,
    weekStart: getWeekStart(workLog.workDate),
    monthStart: getMonthStart(workLog.workDate),
    hours: workLog.hours,
    hourlyRate: workLog.hourlyRate,
    lineTotal: workLog.lineTotal,
    notes: workLog.notes,
    canEdit,
    canDelete,
    createdAt: workLog.createdAt.toISOString(),
    updatedAt: workLog.updatedAt.toISOString()
  };
};

const toPeriodResponse = (
  project: Job,
  monthStart: string,
  period: WorkLogPeriod | null
): WorkLogPeriodResponse => ({
  id: period?.id ?? null,
  projectId: project.id,
  projectTitle: project.title,
  monthStart,
  status: period?.status ?? "pending",
  reviewedBy: period?.reviewedBy ? toAuthUser(period.reviewedBy) : null,
  reviewedAt: period?.reviewedAt ? period.reviewedAt.toISOString() : null,
  rejectionReason: period?.rejectionReason ?? null,
  isLocked: period?.status === "approved"
});

export const listWorkLogOptions = async (
  authUser: AuthenticatedUser
): Promise<WorkLogOptionResponse[]> => {
  if (authUser.role === "admin") {
    return [];
  }

  const repository = appDataSource.getRepository(JobService);
  const jobServices = await repository.find({
    where: {
      assignees: {
        uuid: authUser.id
      }
    },
    relations: {
      job: {
        customer: true
      },
      service: true,
      assignees: true
    }
  });

  return jobServices
    .filter((jobService) => jobService.assignees.some((assignee) => assignee.uuid === authUser.id))
    .filter((jobService) => !blockedProjectStatuses.has(jobService.job.status))
    .map((jobService) => ({
      jobServiceId: jobService.id,
      projectId: jobService.job.id,
      projectTitle: jobService.job.title,
      customerName: jobService.job.customer.companyName,
      serviceId: jobService.service.id,
      serviceName: jobService.service.name,
      hourlyRate: jobService.hourlyRate,
      projectStatus: jobService.job.status
    }))
    .sort((left, right) => left.projectTitle.localeCompare(right.projectTitle));
};

export const listWorkLogs = async (
  query: WorkLogListQuery,
  authUser: AuthenticatedUser
): Promise<WorkLogResponse[]> => {
  const repository = appDataSource.getRepository(WorkLog);
  const monthEnd = query.monthStart
    ? formatLocalDate(new Date(Number(query.monthStart.slice(0, 4)), Number(query.monthStart.slice(5, 7)), 0))
    : null;
  const workLogs = await repository.find({
    where: {
      ...(query.projectId ? { job: { id: query.projectId } } : {}),
      ...(query.memberId ? { user: { uuid: query.memberId } } : {}),
      ...(query.monthStart
        ? {
            workDate: Between(query.monthStart, monthEnd ?? query.monthStart)
          }
        : {})
    },
    relations: {
      job: {
        customer: true,
        projectManager: true,
        serviceAssignments: {
          assignees: true
        }
      },
      jobService: {
        service: true,
        assignees: true
      },
      user: true
    },
    order: {
      workDate: "DESC",
      updatedAt: "DESC"
    }
  });

  return workLogs
    .filter((workLog) => {
      try {
        ensureVisibleWorkLog(workLog, authUser);
        return true;
      } catch {
        return false;
      }
    })
    .map((workLog) => toWorkLogResponse(workLog, authUser));
};

export const getWorkLogById = async (
  workLogId: string,
  authUser: AuthenticatedUser
): Promise<WorkLogResponse> => {
  const workLog = await loadWorkLogOrThrow(workLogId);
  ensureVisibleWorkLog(workLog, authUser);
  return toWorkLogResponse(workLog, authUser);
};

export const createWorkLog = async (
  payload: WorkLogPayload,
  authUser: AuthenticatedUser
): Promise<WorkLogResponse> => {
  ensureWorkDateNotInFuture(payload.workDate);

  const [jobService, user] = await Promise.all([
    loadJobServiceOrThrow(payload.jobServiceId),
    appDataSource.getRepository(User).findOne({ where: { uuid: authUser.id } })
  ]);

  if (!user) {
    throw new WorkLogAccessError("Unable to identify the active user");
  }

  ensureCreateAccess(authUser, jobService);

  const monthStart = getMonthStart(payload.workDate);
  await ensureProjectIsOpenForWorkLogs(jobService.job, monthStart);

  const { existingDayHours, existingWeekHours } = await loadUserHourTotals({
    userId: user.uuid,
    workDate: payload.workDate
  });

  try {
    assertHoursWithinLimits({
      hours: payload.hours,
      existingDayHours,
      existingWeekHours,
      maxDayHours: user.maxWorkHoursPerDay,
      maxWeekHours: user.maxWorkHoursPerWeek
    });
  } catch (error: unknown) {
    if (error instanceof WorkLogLimitError) {
      throw new WorkLogValidationError(error.message);
    }

    throw error;
  }

  const repository = appDataSource.getRepository(WorkLog);
  const workLog = repository.create({
    job: jobService.job,
    jobService,
    user,
    workDate: payload.workDate,
    hours: payload.hours,
    hourlyRate: jobService.hourlyRate,
    lineTotal: calculateLineTotal(payload.hours, jobService.hourlyRate),
    notes: payload.notes?.trim() ?? ""
  });

  const savedWorkLog = await repository.save(workLog);
  const workLogWithRelations = await loadWorkLogOrThrow(savedWorkLog.id);
  return toWorkLogResponse(workLogWithRelations, authUser);
};

export const updateWorkLog = async (
  workLogId: string,
  payload: WorkLogPayload,
  authUser: AuthenticatedUser
): Promise<WorkLogResponse> => {
  ensureWorkDateNotInFuture(payload.workDate);

  const workLog = await loadWorkLogOrThrow(workLogId);
  ensureUpdateAccess(authUser, workLog);

  const targetJobService = payload.jobServiceId === workLog.jobService.id
    ? workLog.jobService
    : await loadJobServiceOrThrow(payload.jobServiceId);

  if (authUser.role !== "admin" && !isAssignedToJobService(authUser.id, targetJobService)) {
    throw new WorkLogAccessError("You can only keep work logs on your assigned project services");
  }

  const actingUser = authUser.role === "admin" ? workLog.user : workLog.user;
  const monthStart = getMonthStart(payload.workDate);
  await ensureProjectIsOpenForWorkLogs(targetJobService.job, monthStart);

  const { existingDayHours, existingWeekHours } = await loadUserHourTotals({
    userId: actingUser.uuid,
    workDate: payload.workDate,
    excludeWorkLogId: workLog.id
  });

  try {
    assertHoursWithinLimits({
      hours: payload.hours,
      existingDayHours,
      existingWeekHours,
      maxDayHours: actingUser.maxWorkHoursPerDay,
      maxWeekHours: actingUser.maxWorkHoursPerWeek
    });
  } catch (error: unknown) {
    if (error instanceof WorkLogLimitError) {
      throw new WorkLogValidationError(error.message);
    }

    throw error;
  }

  workLog.job = targetJobService.job;
  workLog.jobService = targetJobService;
  workLog.workDate = payload.workDate;
  workLog.hours = payload.hours;
  workLog.hourlyRate = workLog.hourlyRate;
  workLog.lineTotal = calculateLineTotal(payload.hours, workLog.hourlyRate);
  workLog.notes = payload.notes?.trim() ?? "";

  await appDataSource.getRepository(WorkLog).save(workLog);
  const updatedWorkLog = await loadWorkLogOrThrow(workLog.id);
  return toWorkLogResponse(updatedWorkLog, authUser);
};

export const deleteWorkLog = async (
  workLogId: string,
  authUser: AuthenticatedUser
): Promise<void> => {
  const workLog = await loadWorkLogOrThrow(workLogId);
  ensureDeleteAccess(authUser, workLog);
  await ensureProjectIsOpenForWorkLogs(workLog.job, getMonthStart(workLog.workDate));
  await appDataSource.getRepository(WorkLog).remove(workLog);
};

export const getWorkLogPeriod = async (
  projectId: string,
  monthStart: string,
  authUser: AuthenticatedUser
): Promise<WorkLogPeriodResponse> => {
  const project = await loadProjectOrThrow(projectId);
  ensureVisibleProject(project, authUser);
  const period = await loadWorkLogPeriod(projectId, monthStart);
  return toPeriodResponse(project, monthStart, period);
};

export const reviewWorkLogPeriod = async (
  payload: WorkLogPeriodReviewPayload,
  authUser: AuthenticatedUser
): Promise<WorkLogPeriodResponse> => {
  if (authUser.role !== "admin") {
    throw new WorkLogAccessError("Only admins can review work-log months");
  }

  const [project, reviewer] = await Promise.all([
    loadProjectOrThrow(payload.projectId),
    appDataSource.getRepository(User).findOne({ where: { uuid: authUser.id } })
  ]);

  if (!reviewer) {
    throw new WorkLogAccessError("Unable to identify the active reviewer");
  }

  const repository = appDataSource.getRepository(WorkLogPeriod);
  const existingPeriod = await loadWorkLogPeriod(payload.projectId, payload.monthStart);
  const period = existingPeriod ?? repository.create({
    job: project,
    monthStart: payload.monthStart
  });

  period.status = payload.status as WorkLogMonthStatus;
  period.reviewedBy = payload.status === "pending" ? null : reviewer;
  period.reviewedAt = payload.status === "pending" ? null : new Date();
  period.rejectionReason =
    payload.status === "rejected" ? payload.rejectionReason?.trim() ?? null : null;

  await repository.save(period);
  return toPeriodResponse(project, payload.monthStart, period);
};
