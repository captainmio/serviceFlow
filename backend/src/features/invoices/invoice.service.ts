import { Between, In, IsNull, MoreThanOrEqual, Not, type EntityManager } from "typeorm";
import { appDataSource } from "../../database/data-source.js";
import { Customer } from "../../entities/customer.entity.js";
import { InvoiceItem } from "../../entities/invoice-item.entity.js";
import { Invoice } from "../../entities/invoice.entity.js";
import type { InvoiceStatus } from "../../entities/invoice-status.js";
import { Job } from "../../entities/job.entity.js";
import { Notification } from "../../entities/notification.entity.js";
import { ProcessQueueJob } from "../../entities/process-queue-job.entity.js";
import { User } from "../../entities/user.entity.js";
import { WorkLogPeriod } from "../../entities/work-log-period.entity.js";
import { WorkLog } from "../../entities/work-log.entity.js";
import { WorkLogWeekSubmission } from "../../entities/work-log-week-submission.entity.js";
import { isDuplicateEntryError, isMissingTableOrColumnError } from "../../shared/database/typeorm-helpers.js";
import type { AuthenticatedUser } from "../auth/auth.types.js";
import { getMonthEnd, getWeekMonthOverlapRange } from "../work-logs/work-log.utils.js";
import type { CreateInvoiceDraftPayload, UpdateInvoiceStatusPayload } from "./invoice.schemas.js";
import type {
  InvoiceDetailResponse,
  InvoiceEligibleMonthResponse,
  InvoiceItemResponse,
  InvoiceListResponse,
  InvoiceSourceMonthResponse,
  InvoiceSummaryResponse
} from "./invoice.types.js";
import type { NotificationListResponse, NotificationResponse } from "./notification.types.js";

export class InvoiceAccessError extends Error {}
export class InvoiceValidationError extends Error {}
export class InvoiceNotFoundError extends Error {}

const toAuthUser = (user: User) => ({
  id: user.uuid,
  name: user.name,
  email: user.email,
  role: user.role
});

const roundToTwoDecimals = (value: number) => Math.round(value * 100) / 100;

const buildExpectedWeekStarts = ({
  monthStart,
  projectStartDate,
  projectDueDate
}: {
  monthStart: string;
  projectStartDate: string | null;
  projectDueDate: string | null;
}) => {
  const monthEnd = getMonthEnd(monthStart);
  const today = new Date();
  const currentDate = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(
    today.getDate()
  ).padStart(2, "0")}`;
  const activeStart = [monthStart, projectStartDate ?? monthStart].sort().at(-1) ?? monthStart;
  const activeEnd = [projectDueDate ?? monthEnd, monthEnd, currentDate].sort()[0] ?? monthEnd;

  if (activeStart > activeEnd) {
    return [];
  }

  const first = new Date(`${activeStart}T00:00:00`);
  first.setDate(first.getDate() - ((first.getDay() + 6) % 7));
  const weekStarts: string[] = [];

  while (`${first.getFullYear()}-${String(first.getMonth() + 1).padStart(2, "0")}-${String(first.getDate()).padStart(2, "0")}` <= activeEnd) {
    weekStarts.push(
      `${first.getFullYear()}-${String(first.getMonth() + 1).padStart(2, "0")}-${String(first.getDate()).padStart(2, "0")}`
    );
    first.setDate(first.getDate() + 7);
  }

  return weekStarts;
};

const getWeekStart = (workDate: string) => {
  const current = new Date(`${workDate}T00:00:00`);
  const day = current.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  current.setDate(current.getDate() + diff);

  return `${current.getFullYear()}-${String(current.getMonth() + 1).padStart(2, "0")}-${String(
    current.getDate()
  ).padStart(2, "0")}`;
};

const getMonthStart = (workDate: string) => `${workDate.slice(0, 7)}-01`;

const ensureAdmin = (authUser: AuthenticatedUser) => {
  if (authUser.role !== "admin") {
    throw new InvoiceAccessError("Only admins can manage invoice drafts and issuing");
  }
};

const ensureManagerOrAdmin = (authUser: AuthenticatedUser) => {
  if (authUser.role !== "admin" && authUser.role !== "manager") {
    throw new InvoiceAccessError("You do not have access to invoices");
  }
};

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

  if (members.length === 0 || expectedWeekStarts.length === 0) {
    return members.map((member) => ({
      member,
      missingWeekStarts: [] as string[]
    }));
  }

  const repository = appDataSource.getRepository(WorkLogWeekSubmission);
  let submissions: WorkLogWeekSubmission[] = [];

  try {
    submissions = await repository.find({
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
    if (!isMissingTableOrColumnError(error)) {
      throw error;
    }

    submissions = await repository.find({
      where: {
        job: { id: project.id },
        user: { uuid: In(members.map((member) => member.uuid)) },
        weekStart: In(expectedWeekStarts)
      },
      relations: {
        user: true
      }
    });
  }

  return members.map((member) => {
    const submittedWeekStarts = new Set(
      submissions
        .filter((submission) => submission.user.uuid === member.uuid)
        .filter((submission) => Boolean(getWeekMonthOverlapRange(submission.weekStart, monthStart)))
        .map((submission) => submission.weekStart)
    );

    return {
      member,
      missingWeekStarts: expectedWeekStarts.filter((weekStart) => !submittedWeekStarts.has(weekStart))
    };
  });
};

const buildSubmittedWorkLogLookup = async (workLogs: WorkLog[]) => {
  if (workLogs.length === 0) {
    return new Set<string>();
  }

  const repository = appDataSource.getRepository(WorkLogWeekSubmission);
  const uniqueJobIds = Array.from(new Set(workLogs.map((workLog) => workLog.job.id)));
  const uniqueUserIds = Array.from(new Set(workLogs.map((workLog) => workLog.user.uuid)));
  const uniqueWeekStarts = Array.from(new Set(workLogs.map((workLog) => getWeekStart(workLog.workDate))));
  const uniqueMonthStarts = Array.from(new Set(workLogs.map((workLog) => getMonthStart(workLog.workDate))));

  try {
    const submissions = await repository.find({
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

    return new Set(
      submissions.map(
        (submission) => `${submission.job.id}:${submission.user.uuid}:${submission.weekStart}:${submission.monthStart}`
      )
    );
  } catch (error: unknown) {
    if (!isMissingTableOrColumnError(error)) {
      throw error;
    }

    const submissions = await repository.find({
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

    const fallbackKeys = new Set(
      submissions.map((submission) => `${submission.job.id}:${submission.user.uuid}:${submission.weekStart}`)
    );

    return new Set(
      workLogs
        .filter((workLog) =>
          fallbackKeys.has(`${workLog.job.id}:${workLog.user.uuid}:${getWeekStart(workLog.workDate)}`) &&
          Boolean(getWeekMonthOverlapRange(getWeekStart(workLog.workDate), getMonthStart(workLog.workDate)))
        )
        .map((workLog) => `${workLog.job.id}:${workLog.user.uuid}:${getWeekStart(workLog.workDate)}:${getMonthStart(workLog.workDate)}`)
    );
  }
};

const filterBillableWorkLogs = (workLogs: WorkLog[], submittedLookup: Set<string>, invoicedWorkLogIds: Set<string>) =>
  workLogs.filter(
    (workLog) =>
      workLog.reviewStatus === "approved" &&
      submittedLookup.has(`${workLog.job.id}:${workLog.user.uuid}:${getWeekStart(workLog.workDate)}:${getMonthStart(workLog.workDate)}`) &&
      !invoicedWorkLogIds.has(workLog.id)
  );

const loadInvoicedWorkLogIds = async (workLogIds: string[]) => {
  if (workLogIds.length === 0) {
    return new Set<string>();
  }

  const items = await appDataSource.getRepository(InvoiceItem).find({
    where: {
      workLog: { id: In(workLogIds) },
      invoice: {
        status: Not("cancelled")
      }
    },
    relations: {
      workLog: true,
      invoice: true
    }
  });

  return new Set(items.map((item) => item.workLog.id));
};

const loadApprovedPeriods = async () =>
  appDataSource.getRepository(WorkLogPeriod).find({
    where: {
      status: "approved"
    },
    relations: {
      job: {
        customer: true,
        projectManager: true,
        serviceAssignments: {
          assignees: true,
          service: true
        }
      }
    },
    order: {
      monthStart: "DESC",
      updatedAt: "DESC"
    }
  });

const createEligibleMonthResponse = async (period: WorkLogPeriod): Promise<InvoiceEligibleMonthResponse | null> => {
  const monthEnd = getMonthEnd(period.monthStart);
  const project = period.job;
  const missingWeeksByMember = await buildMissingWeeksByMember(project, period.monthStart);

  if (missingWeeksByMember.some((entry) => entry.missingWeekStarts.length > 0)) {
    return null;
  }

  const workLogs = await appDataSource.getRepository(WorkLog).find({
    where: {
      job: { id: project.id },
      workDate: Between(period.monthStart, monthEnd)
    },
    relations: {
      job: true,
      user: true,
      jobService: {
        service: true
      }
    }
  });

  const submittedLookup = await buildSubmittedWorkLogLookup(workLogs);
  const invoicedWorkLogIds = await loadInvoicedWorkLogIds(workLogs.map((workLog) => workLog.id));
  const billableWorkLogs = filterBillableWorkLogs(workLogs, submittedLookup, invoicedWorkLogIds);

  if (billableWorkLogs.length === 0) {
    return null;
  }

  return {
    projectId: project.id,
    projectTitle: project.title,
    customerId: project.customer.id,
    customerName: project.customer.companyName,
    monthStart: period.monthStart,
    billableLineCount: billableWorkLogs.length,
    subtotal: roundToTwoDecimals(billableWorkLogs.reduce((sum, workLog) => sum + workLog.lineTotal, 0))
  };
};

const loadInvoiceOrThrow = async (invoiceId: string) => {
  const invoice = await appDataSource.getRepository(Invoice).findOne({
    where: { id: invoiceId },
    relations: {
      customer: true,
      items: {
        job: {
          projectManager: true,
          customer: true
        },
        workLog: true
      },
      issuedBy: true,
      reviewedBy: true
    }
  });

  if (!invoice) {
    throw new InvoiceNotFoundError("Invoice not found");
  }

  return invoice;
};

const getInvoiceProjectManagers = (invoice: Invoice) => {
  const managers = new Map<string, User>();

  invoice.items.forEach((item) => {
    if (item.job.projectManager) {
      managers.set(item.job.projectManager.uuid, item.job.projectManager);
    }
  });

  return Array.from(managers.values());
};

const ensureInvoiceAccess = (invoice: Invoice, authUser: AuthenticatedUser) => {
  if (authUser.role === "admin") {
    return;
  }

  if (authUser.role === "manager") {
    const managerIds = new Set(getInvoiceProjectManagers(invoice).map((manager) => manager.uuid));

    if (managerIds.has(authUser.id)) {
      return;
    }
  }

  throw new InvoiceAccessError("You do not have access to this invoice");
};

export const getAllowedInvoiceStatusTransitions = (
  currentStatus: InvoiceStatus,
  role: AuthenticatedUser["role"]
) => {
  if (role === "manager") {
    return currentStatus === "draft" ? ["reviewed"] : [];
  }

  if (role === "admin") {
    if (currentStatus === "reviewed") {
      return ["issued", "cancelled"];
    }

    if (currentStatus === "issued") {
      return ["paid"];
    }

    if (currentStatus === "draft") {
      return ["cancelled"];
    }
  }

  return [];
};

export const isInvoiceStatusTransitionAllowed = ({
  currentStatus,
  nextStatus,
  role
}: {
  currentStatus: InvoiceStatus;
  nextStatus: InvoiceStatus;
  role: AuthenticatedUser["role"];
}) => getAllowedInvoiceStatusTransitions(currentStatus, role).includes(nextStatus);

const toInvoiceSummary = (invoice: Invoice, authUser: AuthenticatedUser): InvoiceSummaryResponse => {
  const uniqueProjectIds = new Set(invoice.items.map((item) => item.job.id));
  const uniqueMonths = new Set(invoice.items.map((item) => `${item.job.id}:${item.monthStart}`));

  return {
    id: invoice.id,
    invoiceNumber: invoice.invoiceNumber,
    customerId: invoice.customer.id,
    customerName: invoice.customer.companyName,
    status: invoice.status,
    invoiceDate: invoice.invoiceDate,
    dueDate: invoice.dueDate,
    subtotal: invoice.subtotal,
    taxAmount: invoice.taxAmount,
    totalAmount: invoice.totalAmount,
    projectCount: uniqueProjectIds.size,
    monthCount: uniqueMonths.size,
    canReview: isInvoiceStatusTransitionAllowed({
      currentStatus: invoice.status,
      nextStatus: "reviewed",
      role: authUser.role
    }),
    canIssue: isInvoiceStatusTransitionAllowed({
      currentStatus: invoice.status,
      nextStatus: "issued",
      role: authUser.role
    })
  };
};

const toInvoiceItem = (item: InvoiceItem): InvoiceItemResponse => ({
  id: item.id,
  workLogId: item.workLog.id,
  projectId: item.job.id,
  projectTitle: item.job.title,
  monthStart: item.monthStart,
  workDate: item.workDate,
  serviceName: item.serviceName,
  memberName: item.memberName,
  hours: item.hours,
  hourlyRate: item.hourlyRate,
  lineTotal: item.lineTotal,
  notes: item.notes
});

const toInvoiceDetail = (invoice: Invoice, authUser: AuthenticatedUser): InvoiceDetailResponse => {
  const sourceMonthMap = new Map<string, InvoiceSourceMonthResponse>();

  invoice.items.forEach((item) => {
    const key = `${item.job.id}:${item.monthStart}`;
    const existing = sourceMonthMap.get(key);

    if (existing) {
      existing.lineCount += 1;
      existing.subtotal = roundToTwoDecimals(existing.subtotal + item.lineTotal);
      return;
    }

    sourceMonthMap.set(key, {
      projectId: item.job.id,
      projectTitle: item.job.title,
      monthStart: item.monthStart,
      lineCount: 1,
      subtotal: item.lineTotal
    });
  });

  return {
    ...toInvoiceSummary(invoice, authUser),
    notes: invoice.notes,
    items: invoice.items
      .slice()
      .sort((left, right) => left.workDate.localeCompare(right.workDate))
      .map(toInvoiceItem),
    sourceMonths: Array.from(sourceMonthMap.values()).sort((left, right) =>
      `${left.monthStart}:${left.projectTitle}`.localeCompare(`${right.monthStart}:${right.projectTitle}`)
    ),
    reviewedBy: invoice.reviewedBy ? toAuthUser(invoice.reviewedBy) : null,
    reviewedAt: invoice.reviewedAt ? invoice.reviewedAt.toISOString() : null,
    issuedBy: invoice.issuedBy ? toAuthUser(invoice.issuedBy) : null,
    issuedAt: invoice.issuedAt ? invoice.issuedAt.toISOString() : null,
    paidAt: invoice.paidAt ? invoice.paidAt.toISOString() : null
  };
};

const generateInvoiceNumber = async (invoiceDate: string) => {
  const prefix = `INV-${invoiceDate.slice(0, 7).replace("-", "")}-`;
  const repository = appDataSource.getRepository(Invoice);

  for (let attempt = 0; attempt < 5; attempt += 1) {
    const existing = await repository.find({
      where: {
        invoiceNumber: MoreThanOrEqual(prefix)
      },
      order: {
        invoiceNumber: "DESC"
      },
      take: 20
    });
    const matching = existing
      .map((invoice) => invoice.invoiceNumber)
      .filter((invoiceNumber) => invoiceNumber.startsWith(prefix))
      .map((invoiceNumber) => Number(invoiceNumber.slice(prefix.length)))
      .filter((value) => Number.isFinite(value));
    const nextNumber = (Math.max(0, ...matching) + 1).toString().padStart(4, "0");
    const candidate = `${prefix}${nextNumber}`;

    const collision = await repository.findOne({ where: { invoiceNumber: candidate } });

    if (!collision) {
      return candidate;
    }
  }

  return `${prefix}${Date.now().toString().slice(-4)}`;
};

const enqueueProcessQueueJob = async ({
  type,
  dedupeKey,
  payload,
  manager = appDataSource.manager
}: {
  type: string;
  dedupeKey: string;
  payload: Record<string, string>;
  manager?: EntityManager;
}) => {
  const repository = manager.getRepository(ProcessQueueJob);
  const existing = await repository.findOne({
    where: {
      dedupeKey
    }
  });

  if (existing) {
    return existing;
  }

  const job = repository.create({
    type,
    dedupeKey,
    payload,
    availableAt: new Date()
  });

  try {
    return await repository.save(job);
  } catch (error: unknown) {
    if (isDuplicateEntryError(error)) {
      const duplicate = await repository.findOne({
        where: {
          dedupeKey
        }
      });

      if (duplicate) {
        return duplicate;
      }
    }

    throw error;
  }
};

const createNotification = async ({
  user,
  type,
  title,
  message,
  link
}: {
  user: User;
  type: Notification["type"];
  title: string;
  message: string;
  link: string;
}) => {
  const repository = appDataSource.getRepository(Notification);
  const notification = repository.create({
    user,
    type,
    title,
    message,
    link,
    readAt: null
  });

  await repository.save(notification);
};

const processInvoiceReviewRequestedJob = async (queueJob: ProcessQueueJob) => {
  const invoiceId = queueJob.payload.invoiceId;

  if (!invoiceId) {
    throw new InvoiceValidationError("Invoice review queue job is missing an invoice id");
  }

  const invoice = await loadInvoiceOrThrow(invoiceId);
  const managers = getInvoiceProjectManagers(invoice);

  for (const manager of managers) {
    await createNotification({
      user: manager,
      type: "invoice_review_requested",
      title: "Invoice draft ready for review",
      message: `${invoice.invoiceNumber} is ready for your approval review.`,
      link: `/invoices/${invoice.id}`
    });
  }
};

const processInvoiceIssueRequestedJob = async (queueJob: ProcessQueueJob) => {
  const invoiceId = queueJob.payload.invoiceId;

  if (!invoiceId) {
    throw new InvoiceValidationError("Invoice issue queue job is missing an invoice id");
  }

  const invoice = await loadInvoiceOrThrow(invoiceId);
  const admins = await appDataSource.getRepository(User).find({
    where: {
      role: "admin",
      active: true,
      isLoginBlocked: false
    }
  });

  for (const admin of admins) {
    await createNotification({
      user: admin,
      type: "invoice_issue_requested",
      title: "Invoice ready to issue",
      message: `${invoice.invoiceNumber} has been approved and is ready to be issued.`,
      link: `/invoices/${invoice.id}`
    });
  }
};

export const processPendingQueueJobs = async () => {
  const repository = appDataSource.getRepository(ProcessQueueJob);
  let queueJobs: ProcessQueueJob[] = [];

  try {
    queueJobs = await repository.find({
      where: {
        status: In(["pending", "failed"]),
        availableAt: MoreThanOrEqual(new Date(0))
      },
      order: {
        createdAt: "ASC"
      },
      take: 10
    });
  } catch (error: unknown) {
    if (isMissingTableOrColumnError(error)) {
      return;
    }

    throw error;
  }

  for (const queueJob of queueJobs) {
    if (queueJob.availableAt > new Date()) {
      continue;
    }

    queueJob.status = "processing";
    queueJob.attempts += 1;
    queueJob.lastError = null;
    await repository.save(queueJob);

    try {
      if (queueJob.type === "invoice_review_requested") {
        await processInvoiceReviewRequestedJob(queueJob);
      } else if (queueJob.type === "invoice_issue_requested") {
        await processInvoiceIssueRequestedJob(queueJob);
      }

      queueJob.status = "completed";
      queueJob.processedAt = new Date();
      await repository.save(queueJob);
    } catch (error: unknown) {
      queueJob.status = "failed";
      queueJob.lastError = error instanceof Error ? error.message.slice(0, 2000) : "Queue job failed";
      queueJob.availableAt = new Date(Date.now() + 60_000);
      await repository.save(queueJob);
    }
  }
};

export const listInvoices = async (authUser: AuthenticatedUser): Promise<InvoiceListResponse> => {
  ensureManagerOrAdmin(authUser);
  await processPendingQueueJobs();

  const invoiceRepository = appDataSource.getRepository(Invoice);
  let invoices: Invoice[] = [];

  try {
    invoices = await invoiceRepository.find({
      relations: {
        customer: true,
        items: {
          job: {
            projectManager: true,
            customer: true
          },
          workLog: true
        },
        reviewedBy: true,
        issuedBy: true
      },
      order: {
        updatedAt: "DESC"
      }
    });
  } catch (error: unknown) {
    if (!isMissingTableOrColumnError(error)) {
      throw error;
    }
  }

  const visibleInvoices =
    authUser.role === "admin"
      ? invoices
      : invoices.filter((invoice) =>
          invoice.items.some((item) => item.job.projectManager?.uuid === authUser.id)
        );

  const eligibleMonths =
    authUser.role === "admin"
      ? await (async () => {
          try {
            return (
              await Promise.all((await loadApprovedPeriods()).map((period) => createEligibleMonthResponse(period)))
            ).filter((entry): entry is InvoiceEligibleMonthResponse => Boolean(entry));
          } catch (error: unknown) {
            if (isMissingTableOrColumnError(error)) {
              return [];
            }

            throw error;
          }
        })()
      : [];

  return {
    eligibleMonths,
    invoices: visibleInvoices.map((invoice) => toInvoiceSummary(invoice, authUser))
  };
};

export const getInvoiceDetail = async (
  invoiceId: string,
  authUser: AuthenticatedUser
): Promise<InvoiceDetailResponse> => {
  ensureManagerOrAdmin(authUser);
  await processPendingQueueJobs();
  const invoice = await loadInvoiceOrThrow(invoiceId);
  ensureInvoiceAccess(invoice, authUser);
  return toInvoiceDetail(invoice, authUser);
};

const loadEligibleSourcesForDraft = async (payload: CreateInvoiceDraftPayload) => {
  const sourceKeySet = new Set<string>();

  payload.sourceMonths.forEach((sourceMonth) => {
    const key = `${sourceMonth.projectId}:${sourceMonth.monthStart}`;

    if (sourceKeySet.has(key)) {
      throw new InvoiceValidationError("The same project month can only be selected once per invoice draft");
    }

    sourceKeySet.add(key);
  });

  const periodRepository = appDataSource.getRepository(WorkLogPeriod);
  const periods = await Promise.all(
    payload.sourceMonths.map((sourceMonth) =>
      periodRepository.findOne({
        where: {
          job: { id: sourceMonth.projectId },
          monthStart: sourceMonth.monthStart,
          status: "approved"
        },
        relations: {
          job: {
            customer: true,
            projectManager: true,
            serviceAssignments: {
              assignees: true,
              service: true
            }
          }
        }
      })
    )
  );

  if (periods.some((period) => !period)) {
    throw new InvoiceValidationError("Every selected source month must already be project-approved");
  }

  const approvedPeriods = periods.filter((period): period is WorkLogPeriod => Boolean(period));
  const customerIds = new Set(approvedPeriods.map((period) => period.job.customer.id));

  if (customerIds.size !== 1) {
    throw new InvoiceValidationError("All selected project months must belong to the same customer");
  }

  const eligibleResults = await Promise.all(approvedPeriods.map((period) => createEligibleMonthResponse(period)));

  if (eligibleResults.some((entry) => !entry)) {
    throw new InvoiceValidationError(
      "Each selected month must be fully submitted, approved, billable, and not already invoiced"
    );
  }

  return approvedPeriods;
};

export const createInvoiceDraft = async (
  payload: CreateInvoiceDraftPayload,
  authUser: AuthenticatedUser
): Promise<InvoiceDetailResponse> => {
  ensureAdmin(authUser);

  if (payload.invoiceDate > payload.dueDate) {
    throw new InvoiceValidationError("Due date must be on or after the invoice date");
  }

  const approvedPeriods = await loadEligibleSourcesForDraft(payload);
  const customer = approvedPeriods[0]?.job.customer;

  if (!customer) {
    throw new InvoiceValidationError("Unable to determine the invoice customer");
  }

  const workLogRepository = appDataSource.getRepository(WorkLog);
  const allWorkLogs = await Promise.all(
    approvedPeriods.map((period) =>
      workLogRepository.find({
        where: {
          job: { id: period.job.id },
          workDate: Between(period.monthStart, getMonthEnd(period.monthStart))
        },
        relations: {
          job: true,
          user: true,
          jobService: {
            service: true
          }
        }
      })
    )
  );

  const flatWorkLogs = allWorkLogs.flat();
  const submittedLookup = await buildSubmittedWorkLogLookup(flatWorkLogs);
  const invoicedWorkLogIds = await loadInvoicedWorkLogIds(flatWorkLogs.map((workLog) => workLog.id));
  const billableWorkLogs = filterBillableWorkLogs(flatWorkLogs, submittedLookup, invoicedWorkLogIds);

  if (billableWorkLogs.length === 0) {
    throw new InvoiceValidationError("At least one submitted and approved work log is required to create a draft");
  }

  const actingUser = await appDataSource.getRepository(User).findOne({
    where: { uuid: authUser.id }
  });

  if (!actingUser) {
    throw new InvoiceAccessError("Unable to identify the active admin");
  }

  try {
    const invoiceId = await appDataSource.transaction(async (transactionManager) => {
      const invoiceRepository = transactionManager.getRepository(Invoice);
      const itemRepository = transactionManager.getRepository(InvoiceItem);
      const invoice = invoiceRepository.create({
        invoiceNumber: await generateInvoiceNumber(payload.invoiceDate),
        customer: customer as Customer,
        status: "draft",
        invoiceDate: payload.invoiceDate,
        dueDate: payload.dueDate,
        subtotal: roundToTwoDecimals(billableWorkLogs.reduce((sum, workLog) => sum + workLog.lineTotal, 0)),
        taxAmount: roundToTwoDecimals(payload.taxAmount),
        totalAmount: roundToTwoDecimals(
          billableWorkLogs.reduce((sum, workLog) => sum + workLog.lineTotal, 0) + payload.taxAmount
        ),
        notes: payload.notes,
        reviewedBy: null,
        reviewedAt: null,
        issuedBy: null,
        issuedAt: null,
        paidAt: null
      });
      const savedInvoice = await invoiceRepository.save(invoice);
      const items = billableWorkLogs.map((workLog) =>
        itemRepository.create({
          invoice: savedInvoice,
          job: workLog.job,
          workLog,
          monthStart: getMonthStart(workLog.workDate),
          workDate: workLog.workDate,
          serviceName: workLog.jobService.service.name,
          memberName: workLog.user.name,
          hours: workLog.hours,
          hourlyRate: workLog.hourlyRate,
          lineTotal: workLog.lineTotal,
          notes: workLog.notes
        })
      );

      await itemRepository.save(items);

      await enqueueProcessQueueJob({
        type: "invoice_review_requested",
        dedupeKey: `invoice_review_requested:${savedInvoice.id}`,
        payload: {
          invoiceId: savedInvoice.id,
          createdBy: actingUser.uuid
        },
        manager: transactionManager
      });

      return savedInvoice.id;
    });
    await processPendingQueueJobs();

    const loadedInvoice = await loadInvoiceOrThrow(invoiceId);
    return toInvoiceDetail(loadedInvoice, authUser);
  } catch (error: unknown) {
    if (isDuplicateEntryError(error)) {
      throw new InvoiceValidationError("One or more selected work log lines have already been invoiced");
    }

    throw error;
  }
};

export const updateInvoiceStatus = async (
  invoiceId: string,
  payload: UpdateInvoiceStatusPayload,
  authUser: AuthenticatedUser
): Promise<InvoiceDetailResponse> => {
  ensureManagerOrAdmin(authUser);
  const invoice = await loadInvoiceOrThrow(invoiceId);
  ensureInvoiceAccess(invoice, authUser);

  if (
    !isInvoiceStatusTransitionAllowed({
      currentStatus: invoice.status,
      nextStatus: payload.status,
      role: authUser.role
    })
  ) {
    throw new InvoiceValidationError(
      `The ${invoice.status} invoice status cannot be changed to ${payload.status} by your role`
    );
  }

  const actingUser = await appDataSource.getRepository(User).findOne({
    where: { uuid: authUser.id }
  });

  if (!actingUser) {
    throw new InvoiceAccessError("Unable to identify the active user");
  }

  await appDataSource.transaction(async (transactionManager) => {
    invoice.status = payload.status;

    if (payload.status === "reviewed") {
      invoice.reviewedBy = actingUser;
      invoice.reviewedAt = new Date();
      await enqueueProcessQueueJob({
        type: "invoice_issue_requested",
        dedupeKey: `invoice_issue_requested:${invoice.id}`,
        payload: {
          invoiceId: invoice.id
        },
        manager: transactionManager
      });
    }

    if (payload.status === "issued") {
      invoice.issuedBy = actingUser;
      invoice.issuedAt = new Date();
    }

    if (payload.status === "paid") {
      invoice.paidAt = new Date();
    }

    await transactionManager.getRepository(Invoice).save(invoice);
  });
  await processPendingQueueJobs();
  const loadedInvoice = await loadInvoiceOrThrow(invoice.id);
  return toInvoiceDetail(loadedInvoice, authUser);
};

const toNotificationResponse = (notification: Notification): NotificationResponse => ({
  id: notification.id,
  type: notification.type,
  title: notification.title,
  message: notification.message,
  link: notification.link,
  readAt: notification.readAt ? notification.readAt.toISOString() : null,
  createdAt: notification.createdAt.toISOString()
});

export const listNotifications = async (
  authUser: AuthenticatedUser
): Promise<NotificationListResponse> => {
  const user = await appDataSource.getRepository(User).findOne({
    where: {
      uuid: authUser.id
    }
  });

  if (!user) {
    throw new InvoiceAccessError("Unable to identify the active user");
  }

  let notifications: Notification[] = [];

  try {
    await processPendingQueueJobs();
    notifications = await appDataSource.getRepository(Notification).find({
      where: {
        user: { uuid: authUser.id }
      },
      relations: {
        user: true
      },
      order: {
        createdAt: "DESC"
      },
      take: 12
    });
  } catch (error: unknown) {
    if (!isMissingTableOrColumnError(error)) {
      return {
        unreadCount: 0,
        notifications: [],
        user: toAuthUser(user)
      };
    }
  }

  return {
    unreadCount: notifications.filter((notification) => !notification.readAt).length,
    notifications: notifications.map(toNotificationResponse),
    user: toAuthUser(user)
  };
};

export const markAllNotificationsRead = async (authUser: AuthenticatedUser): Promise<NotificationListResponse> => {
  const repository = appDataSource.getRepository(Notification);
  let notifications: Notification[] = [];

  try {
    notifications = await repository.find({
      where: {
        user: { uuid: authUser.id },
        readAt: IsNull()
      },
      relations: {
        user: true
      }
    });
  } catch (error: unknown) {
    if (isMissingTableOrColumnError(error)) {
      return listNotifications(authUser);
    }

    return {
      unreadCount: 0,
      notifications: [],
      user: {
        id: authUser.id,
        name: authUser.name,
        email: authUser.email,
        role: authUser.role
      }
    };
  }

  if (notifications.length > 0) {
    const readAt = new Date();
    notifications.forEach((notification) => {
      notification.readAt = readAt;
    });

    try {
      await repository.save(notifications);
    } catch (error: unknown) {
      if (!isMissingTableOrColumnError(error)) {
        return listNotifications(authUser);
      }
    }
  }

  return listNotifications(authUser);
};

let queueWorkerInterval: NodeJS.Timeout | null = null;

export const startProcessQueueWorker = () => {
  if (queueWorkerInterval) {
    return;
  }

  queueWorkerInterval = setInterval(() => {
    void processPendingQueueJobs().catch(() => undefined);
  }, 15_000);
};
