import { Between, ILike, In } from "typeorm";
import { appDataSource } from "../../database/data-source.js";
import { Job } from "../../entities/job.entity.js";
import { WorkLogLineStatus } from "../../entities/work-log-line-status.js";
import { WorkLogPeriod } from "../../entities/work-log-period.entity.js";
import { WorkLog } from "../../entities/work-log.entity.js";
import { WorkLogWeekSubmission } from "../../entities/work-log-week-submission.entity.js";
import { User } from "../../entities/user.entity.js";
import {
  isDuplicateEntryError,
  isMissingTableOrColumnError
} from "../../shared/database/typeorm-helpers.js";
import type { AuthenticatedUser } from "../auth/auth.types.js";
import { WorkLogAccessError, WorkLogNotFoundError, WorkLogValidationError } from "./work-log.service.js";
import type {
  FinalizeProjectApprovalPayload,
  ProjectApprovalListQuery,
  WorkLogLineReviewPayload
} from "./project-approval.schemas.js";
import type {
  ProjectApprovalDetailResponse,
  ProjectApprovalIncompleteMemberResponse,
  ProjectApprovalLineResponse,
  ProjectApprovalSummaryResponse
} from "./project-approval.types.js";
import { buildExpectedWeekStarts, getMonthEnd, summarizeWeeklyRevenue } from "./work-log-approval.utils.js";
import { getMonthStart, getWeekMonthOverlapRange, getWeekStart } from "./work-log.utils.js";

const toAuthUser = (user: User) => ({
  id: user.uuid,
  name: user.name,
  email: user.email,
  role: user.role
});

const loadVisibleProjects = async (authUser: AuthenticatedUser, search?: string) => {
  const repository = appDataSource.getRepository(Job);
  const whereClause = search
    ? [
        { title: ILike(`%${search}%`) },
        { customer: { companyName: ILike(`%${search}%`) } }
      ]
    : undefined;

  const projects = await repository.find({
    where: whereClause,
    relations: {
      customer: true,
      projectManager: true,
      serviceAssignments: {
        assignees: true,
        service: true
      }
    },
    order: {
      updatedAt: "DESC"
    }
  });

  return authUser.role === "manager"
    ? projects.filter((project) => project.projectManager?.uuid === authUser.id)
    : projects;
};

const ensureApprovalAccessToProject = (project: Job, authUser: AuthenticatedUser) => {
  if (authUser.role === "admin") {
    return;
  }

  if (authUser.role === "manager" && project.projectManager?.uuid === authUser.id) {
    return;
  }

  throw new WorkLogAccessError("You do not have access to this project approval");
};

const loadProjectOrThrow = async (projectId: string) => {
  const repository = appDataSource.getRepository(Job);
  const project = await repository.findOne({
    where: { id: projectId },
    relations: {
      customer: true,
      projectManager: true,
      serviceAssignments: {
        assignees: true,
        service: true
      }
    }
  });

  if (!project) {
    throw new WorkLogNotFoundError("Project not found");
  }

  return project;
};

const loadWorkLogPeriod = async (projectId: string, monthStart: string) =>
  appDataSource.getRepository(WorkLogPeriod).findOne({
    where: {
      job: { id: projectId },
      monthStart
    },
    relations: {
      job: true,
      reviewedBy: true
    }
  });

const getProjectAssignedMembers = (project: Job) => {
  const members = new Map<string, User>();

  project.serviceAssignments.forEach((assignment) => {
    assignment.assignees.forEach((assignee) => {
      members.set(assignee.uuid, assignee);
    });
  });

  return Array.from(members.values()).filter(
    (member) => member.role === "team_member" || member.role === "manager"
  );
};

const buildMissingWeeksByMember = async (project: Job, monthStart: string) => {
  const members = getProjectAssignedMembers(project);
  const expectedWeekStarts = buildExpectedWeekStarts({
    monthStart,
    projectStartDate: project.startDate,
    projectDueDate: project.dueDate
  });

  const submissionRepository = appDataSource.getRepository(WorkLogWeekSubmission);
  let submissions: WorkLogWeekSubmission[] = [];

  if (expectedWeekStarts.length > 0 && members.length > 0) {
    try {
      submissions = await submissionRepository.find({
        where: {
          job: { id: project.id },
          user: { uuid: In(members.map((member) => member.uuid)) },
          weekStart: In(expectedWeekStarts),
          monthStart
        },
        relations: {
          user: true
        }
      });
    } catch (error: unknown) {
      if (isMissingTableOrColumnError(error)) {
        submissions = await submissionRepository.find({
          where: {
            job: { id: project.id },
            user: { uuid: In(members.map((member) => member.uuid)) },
            weekStart: In(expectedWeekStarts)
          },
          relations: {
            user: true
          }
        });
      } else {
        throw error;
      }
    }
  }

  return members.map((member) => {
    const submittedWeekStarts = new Set(
      submissions
        .filter((submission) => submission.user.uuid === member.uuid)
        .map((submission) => submission.weekStart)
    );

    return {
      member,
      missingWeekStarts: expectedWeekStarts.filter((weekStart) => !submittedWeekStarts.has(weekStart))
    };
  });
};

const toProjectApprovalLine = (workLog: WorkLog): ProjectApprovalLineResponse => ({
  id: workLog.id,
  workDate: workLog.workDate,
  weekStart: getWeekStart(workLog.workDate),
  serviceName: workLog.jobService.service.name,
  member: toAuthUser(workLog.user),
  hours: workLog.hours,
  lineTotal: workLog.lineTotal,
  notes: workLog.notes,
  reviewStatus: workLog.reviewStatus,
  reviewedBy: workLog.reviewedBy ? toAuthUser(workLog.reviewedBy) : null,
  reviewedAt: workLog.reviewedAt ? workLog.reviewedAt.toISOString() : null,
  rejectionReason: workLog.rejectionReason
});

const buildWorkLogSubmissionKey = ({
  projectId,
  userId,
  weekStart,
  monthStart
}: {
  projectId: string;
  userId: string;
  weekStart: string;
  monthStart: string;
}) => `${projectId}:${userId}:${weekStart}:${monthStart}`;

const buildSubmittedWorkLogLookup = async (workLogs: WorkLog[]) => {
  if (workLogs.length === 0) {
    return new Set<string>();
  }

  const submissionRepository = appDataSource.getRepository(WorkLogWeekSubmission);
  const uniqueJobIds = Array.from(new Set(workLogs.map((workLog) => workLog.job.id)));
  const uniqueUserIds = Array.from(new Set(workLogs.map((workLog) => workLog.user.uuid)));
  const uniqueWeekStarts = Array.from(new Set(workLogs.map((workLog) => getWeekStart(workLog.workDate))));
  const uniqueMonthStarts = Array.from(new Set(workLogs.map((workLog) => getMonthStart(workLog.workDate))));

  let submissions: WorkLogWeekSubmission[] = [];

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
    if (!isMissingTableOrColumnError(error)) {
      throw error;
    }

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

    const fallbackSubmissionKeys = new Set(
      submissions.map((submission) => `${submission.job.id}:${submission.user.uuid}:${submission.weekStart}`)
    );

    return new Set(
      workLogs
        .filter((workLog) =>
          fallbackSubmissionKeys.has(`${workLog.job.id}:${workLog.user.uuid}:${getWeekStart(workLog.workDate)}`) &&
          Boolean(getWeekMonthOverlapRange(getWeekStart(workLog.workDate), getMonthStart(workLog.workDate)))
        )
        .map((workLog) =>
          buildWorkLogSubmissionKey({
            projectId: workLog.job.id,
            userId: workLog.user.uuid,
            weekStart: getWeekStart(workLog.workDate),
            monthStart: getMonthStart(workLog.workDate)
          })
        )
    );
  }

  return new Set(
    submissions.map((submission) =>
      buildWorkLogSubmissionKey({
        projectId: submission.job.id,
        userId: submission.user.uuid,
        weekStart: submission.weekStart,
        monthStart: submission.monthStart
      })
    )
  );
};

export const filterRevenueEligibleWorkLogs = <
  TLine extends {
    job: { id: string };
    user: { uuid: string };
    workDate: string;
    reviewStatus: string;
  }
>(
  workLogs: TLine[],
  submittedLookup: Set<string>
) =>
  workLogs.filter(
    (workLog) =>
      workLog.reviewStatus === "approved" &&
      submittedLookup.has(
        buildWorkLogSubmissionKey({
          projectId: workLog.job.id,
          userId: workLog.user.uuid,
          weekStart: getWeekStart(workLog.workDate),
          monthStart: getMonthStart(workLog.workDate)
        })
      )
  );

export const computeCanFinalize = ({
  lineItems,
  periodStatus
}: {
  lineItems: WorkLog[];
  periodStatus: string;
}) =>
  lineItems.length > 0 &&
  periodStatus !== "approved";

export const computeQueueResolved = ({
  lineItems,
  memberStates,
  periodStatus
}: {
  lineItems: WorkLog[];
  memberStates: Array<{ missingWeekStarts: string[] }>;
  periodStatus: string;
}) =>
  periodStatus === "approved" &&
  memberStates.every((memberState) => memberState.missingWeekStarts.length === 0) &&
  lineItems.length > 0;

export const listProjectApprovals = async (
  query: ProjectApprovalListQuery,
  authUser: AuthenticatedUser
): Promise<ProjectApprovalSummaryResponse[]> => {
  if (authUser.role !== "admin" && authUser.role !== "manager") {
    throw new WorkLogAccessError("Only admins and managers can access project approvals");
  }

  const projects = await loadVisibleProjects(authUser, query.search);
  if (projects.length === 0) {
    return [];
  }
  const monthEnd = getMonthEnd(query.monthStart);
  const workLogRepository = appDataSource.getRepository(WorkLog);
  const periodRepository = appDataSource.getRepository(WorkLogPeriod);

  const [monthWorkLogs, monthPeriods] = await Promise.all([
    workLogRepository.find({
      where: {
        job: { id: In(projects.map((project) => project.id)) },
        workDate: Between(query.monthStart, monthEnd)
      },
      relations: {
        job: true,
        user: true
      }
    }),
    periodRepository.find({
      where: {
        job: { id: In(projects.map((project) => project.id)) },
        monthStart: query.monthStart
      },
      relations: {
        job: true
      }
    })
  ]);

  const summariesWithResolution = await Promise.all(
    projects.map(async (project) => {
      const projectMonthWorkLogs = monthWorkLogs.filter((workLog) => workLog.job.id === project.id);
      const memberStates = await buildMissingWeeksByMember(project, query.monthStart);
      const readyMembers = memberStates.filter((memberState) => memberState.missingWeekStarts.length === 0);
      const period = monthPeriods.find((currentPeriod) => currentPeriod.job.id === project.id);
      const submittedWeekCount = new Set(
        projectMonthWorkLogs
          .filter((workLog) => workLog.user.uuid)
          .map((workLog) => `${workLog.user.uuid}:${getWeekStart(workLog.workDate)}`)
      ).size;

      const summary = {
        projectId: project.id,
        projectTitle: project.title,
        customerName: project.customer.companyName,
        monthStart: query.monthStart,
        readyMemberCount: readyMembers.length,
        incompleteMemberCount: memberStates.filter((memberState) => memberState.missingWeekStarts.length > 0).length,
        submittedWeekCount,
        totalLoggedRevenue: Number(
          projectMonthWorkLogs.reduce((sum, workLog) => sum + workLog.lineTotal, 0).toFixed(2)
        ),
        lineItemCount: projectMonthWorkLogs.length,
        monthStatus: period?.status ?? "pending",
        canFinalize: computeCanFinalize({
          lineItems: projectMonthWorkLogs,
          periodStatus: period?.status ?? "pending"
        })
      } satisfies ProjectApprovalSummaryResponse;

      return {
        summary,
        isResolved: computeQueueResolved({
          lineItems: projectMonthWorkLogs,
          memberStates,
          periodStatus: period?.status ?? "pending"
        })
      };
    })
  );

  return summariesWithResolution.filter((entry) => !entry.isResolved).map((entry) => entry.summary);
};

export const getProjectApprovalDetail = async (
  projectId: string,
  monthStart: string,
  authUser: AuthenticatedUser
): Promise<ProjectApprovalDetailResponse> => {
  if (authUser.role !== "admin" && authUser.role !== "manager") {
    throw new WorkLogAccessError("Only admins and managers can access project approvals");
  }

  const project = await loadProjectOrThrow(projectId);
  ensureApprovalAccessToProject(project, authUser);

  const monthEnd = getMonthEnd(monthStart);
  const workLogRepository = appDataSource.getRepository(WorkLog);
  const [workLogs, period, projectRevenueRows, memberStates] = await Promise.all([
    workLogRepository.find({
      where: {
        job: { id: projectId },
        workDate: Between(monthStart, monthEnd)
      },
      relations: {
        job: true,
        jobService: {
          service: true
        },
        user: true,
        reviewedBy: true
      },
      order: {
        workDate: "ASC",
        createdAt: "ASC"
      }
    }),
    loadWorkLogPeriod(projectId, monthStart),
    workLogRepository.find({
      where: {
        job: { id: projectId }
      },
      relations: {
        job: true,
        user: true,
        jobService: {
          service: true
        }
      }
    }),
    buildMissingWeeksByMember(project, monthStart)
  ]);

  const revenueEligibleWorkLogs = filterRevenueEligibleWorkLogs(
    workLogs,
    await buildSubmittedWorkLogLookup(workLogs)
  );
  const revenueEligibleProjectWorkLogs = filterRevenueEligibleWorkLogs(
    projectRevenueRows,
    await buildSubmittedWorkLogLookup(projectRevenueRows)
  );

  const readyMembers = memberStates
    .filter((memberState) => memberState.missingWeekStarts.length === 0)
    .map((memberState) => toAuthUser(memberState.member));

  const incompleteMembers: ProjectApprovalIncompleteMemberResponse[] = memberStates
    .filter((memberState) => memberState.missingWeekStarts.length > 0)
    .map((memberState) => ({
      member: toAuthUser(memberState.member),
      missingWeekStarts: memberState.missingWeekStarts
    }));

  return {
    projectId: project.id,
    projectTitle: project.title,
    customerName: project.customer.companyName,
    monthStart,
    monthStatus: period?.status ?? "pending",
    reviewedBy: period?.reviewedBy ? toAuthUser(period.reviewedBy) : null,
    reviewedAt: period?.reviewedAt ? period.reviewedAt.toISOString() : null,
    workLogs: workLogs.map(toProjectApprovalLine),
    incompleteMembers,
    readyMembers,
    weeklyRevenue: summarizeWeeklyRevenue(
      revenueEligibleWorkLogs.map((workLog) => ({
        weekStart: getWeekStart(workLog.workDate),
        lineTotal: workLog.lineTotal
      }))
    ),
    monthRevenue: Number(revenueEligibleWorkLogs.reduce((sum, workLog) => sum + workLog.lineTotal, 0).toFixed(2)),
    projectRevenue: Number(
      revenueEligibleProjectWorkLogs.reduce((sum, workLog) => sum + workLog.lineTotal, 0).toFixed(2)
    ),
    canFinalize: computeCanFinalize({
      lineItems: workLogs,
      periodStatus: period?.status ?? "pending"
    })
  };
};

export const reviewProjectApprovalLine = async (
  workLogId: string,
  payload: WorkLogLineReviewPayload,
  authUser: AuthenticatedUser
): Promise<ProjectApprovalLineResponse> => {
  if (authUser.role !== "admin" && authUser.role !== "manager") {
    throw new WorkLogAccessError("Only admins and managers can review work log lines");
  }

  const repository = appDataSource.getRepository(WorkLog);
  const workLog = await repository.findOne({
    where: { id: workLogId },
    relations: {
      job: {
        customer: true,
        projectManager: true,
        serviceAssignments: {
          assignees: true,
          service: true
        }
      },
      jobService: {
        service: true
      },
      user: true,
      reviewedBy: true
    }
  });

  if (!workLog) {
    throw new WorkLogNotFoundError("Work log not found");
  }

  ensureApprovalAccessToProject(workLog.job, authUser);
  const monthStart = `${workLog.workDate.slice(0, 7)}-01`;
  const period = await loadWorkLogPeriod(workLog.job.id, monthStart);

  if (period?.status === "approved") {
    throw new WorkLogValidationError("This project month is already finalized and can no longer be changed");
  }

  const actingUser = await appDataSource.getRepository(User).findOne({ where: { uuid: authUser.id } });

  if (!actingUser) {
    throw new WorkLogAccessError("Unable to identify the active reviewer");
  }

  workLog.reviewStatus = payload.status as WorkLogLineStatus;
  workLog.reviewedBy = payload.status === "pending" ? null : actingUser;
  workLog.reviewedAt = payload.status === "pending" ? null : new Date();
  workLog.rejectionReason = payload.status === "rejected" ? payload.rejectionReason?.trim() ?? null : null;

  await repository.save(workLog);

  return toProjectApprovalLine(workLog);
};

export const finalizeProjectApprovalMonth = async (
  projectId: string,
  payload: FinalizeProjectApprovalPayload,
  authUser: AuthenticatedUser
): Promise<ProjectApprovalDetailResponse> => {
  if (authUser.role !== "admin" && authUser.role !== "manager") {
    throw new WorkLogAccessError("Only admins and managers can finalize project approval months");
  }

  const project = await loadProjectOrThrow(projectId);
  ensureApprovalAccessToProject(project, authUser);
  const monthEnd = getMonthEnd(payload.monthStart);
  const workLogRepository = appDataSource.getRepository(WorkLog);
  const workLogs = await workLogRepository.find({
    where: {
      job: { id: projectId },
      workDate: Between(payload.monthStart, monthEnd)
    }
  });

  const memberStates = await buildMissingWeeksByMember(project, payload.monthStart);
  const existingPeriod = await loadWorkLogPeriod(projectId, payload.monthStart);

  if (
    existingPeriod?.status === "approved" &&
    memberStates.every((memberState) => memberState.missingWeekStarts.length === 0)
  ) {
    throw new WorkLogValidationError("This project month has already been finalized");
  }

  if (!computeCanFinalize({ lineItems: workLogs, periodStatus: "pending" })) {
    throw new WorkLogValidationError(
      "Finalize is only available when the selected month has work log lines and has not already been finalized"
    );
  }

  const reviewer = await appDataSource.getRepository(User).findOne({ where: { uuid: authUser.id } });

  if (!reviewer) {
    throw new WorkLogAccessError("Unable to identify the active reviewer");
  }

  const periodRepository = appDataSource.getRepository(WorkLogPeriod);
  const period = existingPeriod ?? periodRepository.create({
    job: project,
    monthStart: payload.monthStart
  });

  period.status = "approved";
  period.reviewedBy = reviewer;
  period.reviewedAt = new Date();
  period.rejectionReason = null;

  try {
    await periodRepository.save(period);
  } catch (error: unknown) {
    if (isDuplicateEntryError(error)) {
      throw new WorkLogValidationError("This project month has already been finalized");
    }

    throw error;
  }

  return getProjectApprovalDetail(projectId, payload.monthStart, authUser);
};
