import { ILike } from "typeorm";
import { appDataSource } from "../../database/data-source.js";
import { Customer } from "../../entities/customer.entity.js";
import { Job } from "../../entities/job.entity.js";
import { User } from "../../entities/user.entity.js";
import type { AuthenticatedUser } from "../auth/auth.types.js";
import type { JobListQuery, JobPayload } from "./job.schemas.js";
import type { JobResponse } from "./job.types.js";

export class JobDependencyError extends Error {}
export class JobNotFoundError extends Error {}
export class JobAlreadyExistsError extends Error {}

const toJobAssignment = (user: User) => ({
  id: user.id,
  name: user.name,
  email: user.email,
  role: user.role
});

const toJobResponse = (job: Job): JobResponse => ({
  id: job.id,
  title: job.title,
  description: job.description,
  customerId: job.customer.id,
  customerName: job.customer.companyName,
  assignedTo: job.assignedTo.map(toJobAssignment),
  status: job.status,
  startDate: job.startDate,
  dueDate: job.dueDate,
  approvedBy: job.approvedBy ? toJobAssignment(job.approvedBy) : null,
  approvedAt: job.approvedAt ? job.approvedAt.toISOString() : null,
  rejectionReason: job.rejectionReason,
  createdAt: job.createdAt.toISOString(),
  updatedAt: job.updatedAt.toISOString()
});

const findAssignees = async (assignedToIds: string[]) => {
  if (assignedToIds.length === 0) {
    return [];
  }

  const userRepository = appDataSource.getRepository(User);
  const assignees = await userRepository.find({
    where: assignedToIds.map((id) => ({
      id,
      role: "team_member"
    }))
  });

  if (assignees.length !== assignedToIds.length) {
    throw new JobDependencyError("Select valid team members for this job");
  }

  return assignees;
};

const ensureJobTitleIsUnique = async (
  customerId: string,
  title: string,
  currentJobId?: string
) => {
  const jobRepository = appDataSource.getRepository(Job);
  const normalizedTitle = title.trim();
  const existingJobs = await jobRepository.find({
    where: {
      customer: {
        id: customerId
      }
    },
    relations: {
      customer: true
    }
  });

  const duplicateJob = existingJobs.find(
    (job) =>
      job.id !== currentJobId && job.title.trim().toLowerCase() === normalizedTitle.toLowerCase()
  );

  if (duplicateJob) {
    throw new JobAlreadyExistsError(
      `A project named "${normalizedTitle}" already exists for this customer`
    );
  }
};

const loadJobOrThrow = async (jobId: string) => {
  const jobRepository = appDataSource.getRepository(Job);
  const job = await jobRepository.findOne({
    where: { id: jobId },
    relations: {
      customer: true,
      assignedTo: true,
      approvedBy: true
    }
  });

  if (!job) {
    throw new JobNotFoundError("Job not found");
  }

  return job;
};

const applyApprovalState = async (
  job: Job,
  payload: JobPayload,
  authUser: AuthenticatedUser
) => {
  if (payload.status === "approved" || payload.status === "rejected") {
    const userRepository = appDataSource.getRepository(User);
    const actingUser = await userRepository.findOne({ where: { id: authUser.id } });

    if (!actingUser) {
      throw new JobDependencyError("Unable to identify the acting user for approval");
    }

    job.approvedBy = actingUser;
    job.approvedAt = new Date();
  } else {
    job.approvedBy = null;
    job.approvedAt = null;
  }

  job.rejectionReason =
    payload.status === "rejected" ? payload.rejectionReason?.trim() ?? null : null;
};

export const listJobs = async ({ search, status, customerId }: JobListQuery): Promise<JobResponse[]> => {
  const jobRepository = appDataSource.getRepository(Job);

  const whereClause = search
    ? [
        {
          title: ILike(`%${search}%`),
          ...(status ? { status } : {}),
          ...(customerId ? { customer: { id: customerId } } : {})
        },
        {
          customer: {
            companyName: ILike(`%${search}%`),
            ...(customerId ? { id: customerId } : {})
          },
          ...(status ? { status } : {})
        }
      ]
    : {
        ...(status ? { status } : {}),
        ...(customerId ? { customer: { id: customerId } } : {})
      };

  const jobs = await jobRepository.find({
    where: whereClause,
    relations: {
      customer: true,
      assignedTo: true,
      approvedBy: true
    },
    order: {
      updatedAt: "DESC",
      createdAt: "DESC"
    }
  });

  return jobs.map(toJobResponse);
};

export const getJobById = async (jobId: string): Promise<JobResponse> => {
  const job = await loadJobOrThrow(jobId);
  return toJobResponse(job);
};

export const createJob = async (
  payload: JobPayload,
  authUser: AuthenticatedUser
): Promise<JobResponse> => {
  const customerRepository = appDataSource.getRepository(Customer);
  const jobRepository = appDataSource.getRepository(Job);

  const [customer, assignees] = await Promise.all([
    customerRepository.findOne({ where: { id: payload.customerId } }),
    findAssignees(payload.assignedToIds)
  ]);

  if (!customer || customer.status !== "active") {
    throw new JobDependencyError("Select an active customer for this job");
  }

  await ensureJobTitleIsUnique(payload.customerId, payload.title);

  const job = jobRepository.create({
    title: payload.title.trim(),
    description: payload.description.trim(),
    customer,
    assignedTo: assignees,
    status: payload.status,
    startDate: payload.startDate,
    dueDate: payload.dueDate
  });

  await applyApprovalState(job, payload, authUser);

  const savedJob = await jobRepository.save(job);
  const jobWithRelations = await jobRepository.findOneOrFail({
    where: { id: savedJob.id },
    relations: {
      customer: true,
      assignedTo: true,
      approvedBy: true
    }
  });

  return toJobResponse(jobWithRelations);
};

export const updateJob = async (
  jobId: string,
  payload: JobPayload,
  authUser: AuthenticatedUser
): Promise<JobResponse> => {
  const customerRepository = appDataSource.getRepository(Customer);
  const jobRepository = appDataSource.getRepository(Job);
  const [job, customer, assignees] = await Promise.all([
    loadJobOrThrow(jobId),
    customerRepository.findOne({ where: { id: payload.customerId } }),
    findAssignees(payload.assignedToIds)
  ]);

  if (!customer || customer.status !== "active") {
    throw new JobDependencyError("Select an active customer for this job");
  }

  await ensureJobTitleIsUnique(payload.customerId, payload.title, jobId);

  job.title = payload.title.trim();
  job.description = payload.description.trim();
  job.customer = customer;
  job.assignedTo = assignees;
  job.status = payload.status;
  job.startDate = payload.startDate;
  job.dueDate = payload.dueDate;

  await applyApprovalState(job, payload, authUser);

  const savedJob = await jobRepository.save(job);
  const jobWithRelations = await jobRepository.findOneOrFail({
    where: { id: savedJob.id },
    relations: {
      customer: true,
      assignedTo: true,
      approvedBy: true
    }
  });

  return toJobResponse(jobWithRelations);
};

export const cancelJob = async (
  jobId: string,
  authUser: AuthenticatedUser
): Promise<JobResponse> => {
  const job = await loadJobOrThrow(jobId);
  return updateJob(
    jobId,
    {
      title: job.title,
      description: job.description,
      customerId: job.customer.id,
      assignedToIds: job.assignedTo.map((user) => user.id),
      status: "cancelled",
      startDate: job.startDate,
      dueDate: job.dueDate,
      rejectionReason: null
    },
    authUser
  );
};
