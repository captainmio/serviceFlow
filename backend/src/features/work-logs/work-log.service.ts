import { Between, In, Not } from "typeorm";
import { appDataSource } from "../../database/data-source.js";
import { Job } from "../../entities/job.entity.js";
import { JobService } from "../../entities/job-service.entity.js";
import type { WorkLogMonthStatus } from "../../entities/work-log-month-status.js";
import { WorkLogPeriod } from "../../entities/work-log-period.entity.js";
import { WorkLog } from "../../entities/work-log.entity.js";
import { WorkLogWeekSubmission } from "../../entities/work-log-week-submission.entity.js";
import { User } from "../../entities/user.entity.js";
import { isMissingTableOrColumnError } from "../../shared/database/typeorm-helpers.js";
import type { AuthenticatedUser } from "../auth/auth.types.js";
import type {
  WorkLogListQuery,
  WorkLogPayload,
  WorkLogPeriodReviewPayload,
  WorkLogWeekSubmissionPayload
} from "./work-log.schemas.js";
import type {
  WorkLogOptionResponse,
  WorkLogPeriodResponse,
  WorkLogResponse,
  WorkLogWeekSubmissionResponse
} from "./work-log.types.js";
import {
  assertHoursWithinLimits,
  calculateLineTotal,
  formatLocalDate,
  getMonthEnd,
  getMonthVisibleWeekRange,
  getWeekMonthOverlapRange,
  getWeekEnd,
  getMonthStart,
  getWeekStart,
  WorkLogLimitError
} from "./work-log.utils.js";

export class WorkLogAccessError extends Error {}
export class WorkLogNotFoundError extends Error {}
export class WorkLogValidationError extends Error {}

interface UpdateTargetContext {
  jobService: JobService;
  project: Job;
}

const blockedProjectStatuses = new Set(["approved", "invoiced", "paid", "cancelled"]);

const ensureMonthAwareSubmissionSchema = (error: unknown) => {
  if (isMissingTableOrColumnError(error)) {
    throw new WorkLogValidationError(
      "Work-log submissions need the latest database migration before month-portion submit or unsubmit can work"
    );
  }

  throw error;
};

const toAuthUser = (user: User) => ({
  id: user.uuid,
  name: user.name,
  email: user.email,
  role: user.role
});

const isAssignedToJobService = (authUserId: string, jobService: JobService) =>
  jobService.assignees.some((assignee) => assignee.uuid === authUserId);

const isAssignedToProject = (authUserId: string, project: Job) =>
  project.serviceAssignments.some((jobService) =>
    jobService.assignees.some((assignee) => assignee.uuid === authUserId)
  );

const ensureWorkDateNotInFuture = (workDate: string) => {
  const today = new Date();
  const maxAllowedDate = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  maxAllowedDate.setMonth(maxAllowedDate.getMonth() + 1);
  const maxAllowedDateKey = formatLocalDate(maxAllowedDate);

  if (workDate > maxAllowedDateKey) {
    throw new WorkLogValidationError("Work date cannot be more than one month in the future");
  }
};

const ensureWorkDateWithinProjectWindow = (project: Job, workDate: string) => {
  if (project.startDate && workDate < project.startDate) {
    throw new WorkLogValidationError("Work date must be on or after the project's start date");
  }

  if (project.dueDate && workDate > project.dueDate) {
    throw new WorkLogValidationError("Work date must be on or before the project's due date");
  }
};

const ensureWeekWithinProjectWindow = (project: Job, weekStart: string) => {
  const weekEnd = getWeekEnd(weekStart);

  if (project.startDate && weekEnd < project.startDate) {
    throw new WorkLogValidationError("This week is before the project's start date");
  }

  if (project.dueDate && weekStart > project.dueDate) {
    throw new WorkLogValidationError("This week is after the project's due date");
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

const resolveUpdateTargetContext = async (
  workLog: WorkLog,
  payloadJobServiceId: string
): Promise<UpdateTargetContext> => {
  if (payloadJobServiceId === workLog.jobService.id) {
    return {
      jobService: workLog.jobService,
      project: workLog.job
    };
  }

  const jobService = await loadJobServiceOrThrow(payloadJobServiceId);

  return {
    jobService,
    project: jobService.job
  };
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

const loadWeekSubmission = async (
  projectId: string,
  userId: string,
  weekStart: string,
  monthStart: string
) => {
  const repository = appDataSource.getRepository(WorkLogWeekSubmission);
  try {
    return await repository.findOne({
      where: {
        job: { id: projectId },
        user: { uuid: userId },
        weekStart,
        monthStart
      },
      relations: {
        job: true,
        user: true
      }
    });
  } catch (error: unknown) {
    if (isMissingTableOrColumnError(error)) {
      try {
        return await repository.findOne({
          where: {
            job: { id: projectId },
            user: { uuid: userId },
            weekStart
          },
          relations: {
            job: true,
            user: true
          }
        });
      } catch (fallbackError: unknown) {
        if (isMissingTableOrColumnError(fallbackError)) {
          return null;
        }

        throw fallbackError;
      }
    }

    throw error;
  }
};

const ensureVisibleProject = (project: Job, authUser: AuthenticatedUser) => {
  if (authUser.role === "admin") {
    return;
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

const ensureWeekNotSubmittedForNonAdmin = async (
  authUser: AuthenticatedUser,
  projectId: string,
  userId: string,
  weekStart: string,
  monthStart: string
) => {
  if (authUser.role === "admin") {
    return;
  }

  const submission = await loadWeekSubmission(projectId, userId, weekStart, monthStart);

  if (submission) {
    throw new WorkLogValidationError(
      "This selected month portion has already been submitted. Team members can no longer change work logs for it"
    );
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
  const weekEnd = getWeekEnd(weekStart);

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

const toWorkLogResponse = (
  workLog: WorkLog,
  authUser: AuthenticatedUser,
  isWeekSubmitted: boolean
): WorkLogResponse => {
  const isOwnLog = workLog.user.uuid === authUser.id;
  const canEdit =
    authUser.role === "admin" ||
    ((authUser.role === "manager" || authUser.role === "team_member") && isOwnLog && !isWeekSubmitted);
  const canDelete = authUser.role !== "admin" && isOwnLog && !isWeekSubmitted;

  return {
    id: workLog.id,
    projectId: workLog.job.id,
    projectTitle: workLog.job.title,
    customerName: workLog.job.customer.companyName,
    projectStartDate: workLog.job.startDate,
    projectDueDate: workLog.job.dueDate,
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
    isWeekSubmitted,
    canEdit,
    canDelete,
    createdAt: workLog.createdAt.toISOString(),
    updatedAt: workLog.updatedAt.toISOString()
  };
};

const buildWeekSubmissionLookup = async (workLogs: WorkLog[]) => {
  if (workLogs.length === 0) {
    return new Set<string>();
  }

  const submissionRepository = appDataSource.getRepository(WorkLogWeekSubmission);
  const uniqueJobIds = Array.from(new Set(workLogs.map((workLog) => workLog.job.id)));
  const uniqueUserIds = Array.from(new Set(workLogs.map((workLog) => workLog.user.uuid)));
  const uniqueWeekStarts = Array.from(new Set(workLogs.map((workLog) => getWeekStart(workLog.workDate))));
  const uniqueMonthStarts = Array.from(new Set(workLogs.map((workLog) => getMonthStart(workLog.workDate))));

  let submissions: WorkLogWeekSubmission[];

  try {
    submissions = await submissionRepository.find({
      where: {
        job: { id: In(uniqueJobIds) },
        user: { uuid: In(uniqueUserIds) },
        weekStart: In(uniqueWeekStarts),
        monthStart: In(uniqueMonthStarts)
      },
      relations: {
        job: true,
        user: true
      }
    });
  } catch (error: unknown) {
    if (isMissingTableOrColumnError(error)) {
      try {
        submissions = await submissionRepository.find({
          where: {
            job: { id: In(uniqueJobIds) },
            user: { uuid: In(uniqueUserIds) },
            weekStart: In(uniqueWeekStarts)
          },
          relations: {
            job: true,
            user: true
          }
        });
      } catch (fallbackError: unknown) {
        if (isMissingTableOrColumnError(fallbackError)) {
          return new Set<string>();
        }

        throw fallbackError;
      }
    } else {
      throw error;
    }
  }

  return new Set(
    submissions.map(
      (submission) =>
        `${submission.job.id}:${submission.user.uuid}:${submission.weekStart}:${submission.monthStart}`
    )
  );
};

const listSubmittedWeekStarts = async (
  projectId: string,
  userId: string,
  monthStart: string
) => {
  const submissionRepository = appDataSource.getRepository(WorkLogWeekSubmission);

  try {
    const submissions = await submissionRepository.find({
      where: {
        job: { id: projectId },
        user: { uuid: userId },
        monthStart
      },
      relations: {
        job: true,
        user: true
      }
    });

    return submissions.map((submission) => submission.weekStart);
  } catch (error: unknown) {
    if (!isMissingTableOrColumnError(error)) {
      throw error;
    }

    try {
      const submissions = await submissionRepository.find({
        where: {
          job: { id: projectId },
          user: { uuid: userId }
        },
        relations: {
          job: true,
          user: true
        }
      });

      return submissions
        .filter((submission) => getWeekMonthOverlapRange(submission.weekStart, monthStart))
        .map((submission) => submission.weekStart);
    } catch (fallbackError: unknown) {
      if (isMissingTableOrColumnError(fallbackError)) {
        return [];
      }

      throw fallbackError;
    }
  }
};

const toPeriodResponse = (
  project: Job,
  monthStart: string,
  period: WorkLogPeriod | null,
  submittedWeekStarts: string[] = []
): WorkLogPeriodResponse => ({
  id: period?.id ?? null,
  projectId: project.id,
  projectTitle: project.title,
  monthStart,
  status: period?.status ?? "pending",
  reviewedBy: period?.reviewedBy ? toAuthUser(period.reviewedBy) : null,
  reviewedAt: period?.reviewedAt ? period.reviewedAt.toISOString() : null,
  rejectionReason: period?.rejectionReason ?? null,
  isLocked: period?.status === "approved",
  submittedWeekStarts
});

export const listWorkLogOptions = async (
  authUser: AuthenticatedUser
): Promise<WorkLogOptionResponse[]> => {
  if (authUser.role === "admin") {
    return [];
  }

  const repository = appDataSource.getRepository(JobService);
  const jobServices = await repository.find({
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
      projectStartDate: jobService.job.startDate,
      projectDueDate: jobService.job.dueDate,
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
  const visibleMonthRange = query.monthStart ? getMonthVisibleWeekRange(query.monthStart) : null;
  const workLogs = await repository.find({
    where: {
      ...(query.projectId ? { job: { id: query.projectId } } : {}),
      ...(query.memberId ? { user: { uuid: query.memberId } } : {}),
      ...(query.monthStart
        ? {
            workDate: Between(visibleMonthRange?.start ?? query.monthStart, visibleMonthRange?.end ?? query.monthStart)
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

  const submittedWeeks = await buildWeekSubmissionLookup(workLogs);

  return workLogs
    .filter((workLog) => {
      try {
        ensureVisibleWorkLog(workLog, authUser);
        return true;
      } catch {
        return false;
      }
    })
    .map((workLog) =>
      toWorkLogResponse(
        workLog,
        authUser,
        submittedWeeks.has(
          `${workLog.job.id}:${workLog.user.uuid}:${getWeekStart(workLog.workDate)}:${getMonthStart(workLog.workDate)}`
        )
      )
    );
};

export const getWorkLogById = async (
  workLogId: string,
  authUser: AuthenticatedUser
): Promise<WorkLogResponse> => {
  const workLog = await loadWorkLogOrThrow(workLogId);
  ensureVisibleWorkLog(workLog, authUser);
  const isWeekSubmitted = Boolean(
    await loadWeekSubmission(
      workLog.job.id,
      workLog.user.uuid,
      getWeekStart(workLog.workDate),
      getMonthStart(workLog.workDate)
    )
  );
  return toWorkLogResponse(workLog, authUser, isWeekSubmitted);
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
  ensureWorkDateWithinProjectWindow(jobService.job, payload.workDate);

  const monthStart = getMonthStart(payload.workDate);
  await ensureProjectIsOpenForWorkLogs(jobService.job, monthStart);
  await ensureWeekNotSubmittedForNonAdmin(
    authUser,
    jobService.job.id,
    user.uuid,
    getWeekStart(payload.workDate),
    monthStart
  );

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
  return toWorkLogResponse(workLogWithRelations, authUser, false);
};

export const updateWorkLog = async (
  workLogId: string,
  payload: WorkLogPayload,
  authUser: AuthenticatedUser
): Promise<WorkLogResponse> => {
  ensureWorkDateNotInFuture(payload.workDate);

  const workLog = await loadWorkLogOrThrow(workLogId);
  ensureUpdateAccess(authUser, workLog);

  const { jobService: targetJobService, project: targetProject } = await resolveUpdateTargetContext(
    workLog,
    payload.jobServiceId
  );

  if (authUser.role !== "admin" && !isAssignedToJobService(authUser.id, targetJobService)) {
    throw new WorkLogAccessError("You can only keep work logs on your assigned project services");
  }

  const actingUser = authUser.role === "admin" ? workLog.user : workLog.user;
  ensureWorkDateWithinProjectWindow(targetProject, payload.workDate);
  const sourceWeekStart = getWeekStart(workLog.workDate);
  const sourceMonthStart = getMonthStart(workLog.workDate);
  const targetWeekStart = getWeekStart(payload.workDate);
  const targetMonthStart = getMonthStart(payload.workDate);

  await ensureProjectIsOpenForWorkLogs(targetProject, targetMonthStart);
  await ensureWeekNotSubmittedForNonAdmin(
    authUser,
    workLog.job.id,
    workLog.user.uuid,
    sourceWeekStart,
    sourceMonthStart
  );

  if (
    targetProject.id !== workLog.job.id ||
    targetWeekStart !== sourceWeekStart ||
    targetMonthStart !== sourceMonthStart
  ) {
    await ensureWeekNotSubmittedForNonAdmin(
      authUser,
      targetProject.id,
      workLog.user.uuid,
      targetWeekStart,
      targetMonthStart
    );
  }

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

  workLog.job = targetProject;
  workLog.jobService = targetJobService;
  workLog.workDate = payload.workDate;
  workLog.hours = payload.hours;
  workLog.hourlyRate = workLog.hourlyRate;
  workLog.lineTotal = calculateLineTotal(payload.hours, workLog.hourlyRate);
  workLog.notes = payload.notes?.trim() ?? "";

  await appDataSource.getRepository(WorkLog).save(workLog);
  const updatedWorkLog = await loadWorkLogOrThrow(workLog.id);
  const isWeekSubmitted = Boolean(
    await loadWeekSubmission(
      updatedWorkLog.job.id,
      updatedWorkLog.user.uuid,
      getWeekStart(updatedWorkLog.workDate),
      getMonthStart(updatedWorkLog.workDate)
    )
  );
  return toWorkLogResponse(updatedWorkLog, authUser, isWeekSubmitted);
};

export const deleteWorkLog = async (
  workLogId: string,
  authUser: AuthenticatedUser
): Promise<void> => {
  const workLog = await loadWorkLogOrThrow(workLogId);
  ensureDeleteAccess(authUser, workLog);
  await ensureProjectIsOpenForWorkLogs(workLog.job, getMonthStart(workLog.workDate));
  await ensureWeekNotSubmittedForNonAdmin(
    authUser,
    workLog.job.id,
    workLog.user.uuid,
    getWeekStart(workLog.workDate),
    getMonthStart(workLog.workDate)
  );
  await appDataSource.getRepository(WorkLog).remove(workLog);
};

export const getWorkLogPeriod = async (
  projectId: string,
  monthStart: string,
  authUser: AuthenticatedUser
): Promise<WorkLogPeriodResponse> => {
  const project = await loadProjectOrThrow(projectId);
  ensureVisibleProject(project, authUser);
  const [period, submittedWeekStarts] = await Promise.all([
    loadWorkLogPeriod(projectId, monthStart),
    authUser.role === "admin" ? Promise.resolve<string[]>([]) : listSubmittedWeekStarts(projectId, authUser.id, monthStart)
  ]);
  return toPeriodResponse(project, monthStart, period, submittedWeekStarts);
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

export const submitWorkLogWeek = async (
  payload: WorkLogWeekSubmissionPayload,
  authUser: AuthenticatedUser
): Promise<WorkLogWeekSubmissionResponse> => {
  if (authUser.role !== "team_member" && authUser.role !== "manager") {
    throw new WorkLogAccessError("Only team members and managers can submit their work-log month portions");
  }

  const project = await loadProjectOrThrow(payload.projectId);
  ensureVisibleProject(project, authUser);
  ensureWeekWithinProjectWindow(project, payload.weekStart);
  const overlapRange = getWeekMonthOverlapRange(payload.weekStart, payload.monthStart);

  if (!overlapRange) {
    throw new WorkLogValidationError("The selected week does not overlap the selected month");
  }

  await ensureProjectIsOpenForWorkLogs(project, payload.monthStart);

  const existingSubmission = await loadWeekSubmission(
    payload.projectId,
    authUser.id,
    payload.weekStart,
    payload.monthStart
  );

  if (existingSubmission) {
    throw new WorkLogValidationError("This selected month portion has already been submitted");
  }

  const user = await appDataSource.getRepository(User).findOne({ where: { uuid: authUser.id } });

  if (!user) {
    throw new WorkLogAccessError("Unable to identify the active user");
  }

  const submissionRepository = appDataSource.getRepository(WorkLogWeekSubmission);
  const submission = submissionRepository.create({
    job: project,
    user,
    weekStart: payload.weekStart,
    monthStart: payload.monthStart,
    submittedAt: new Date()
  });

  try {
    await submissionRepository.save(submission);
  } catch (error: unknown) {
    ensureMonthAwareSubmissionSchema(error);
  }

  return {
    projectId: project.id,
    weekStart: submission.weekStart,
    monthStart: submission.monthStart,
    submittedAt: submission.submittedAt.toISOString()
  };
};

export const unsubmitWorkLogWeek = async (
  payload: WorkLogWeekSubmissionPayload,
  authUser: AuthenticatedUser
): Promise<void> => {
  if (authUser.role !== "team_member" && authUser.role !== "manager") {
    throw new WorkLogAccessError(
      "Only team members and managers can unsubmit their work-log month portions"
    );
  }

  const project = await loadProjectOrThrow(payload.projectId);
  ensureVisibleProject(project, authUser);
  ensureWeekWithinProjectWindow(project, payload.weekStart);
  const overlapRange = getWeekMonthOverlapRange(payload.weekStart, payload.monthStart);

  if (!overlapRange) {
    throw new WorkLogValidationError("The selected week does not overlap the selected month");
  }

  await ensureProjectIsOpenForWorkLogs(project, payload.monthStart);

  const existingSubmission = await loadWeekSubmission(
    payload.projectId,
    authUser.id,
    payload.weekStart,
    payload.monthStart
  );

  if (!existingSubmission) {
    throw new WorkLogNotFoundError("This work-log month portion has not been submitted yet");
  }

  try {
    await appDataSource.getRepository(WorkLogWeekSubmission).remove(existingSubmission);
  } catch (error: unknown) {
    ensureMonthAwareSubmissionSchema(error);
  }
};
