import { ILike } from "typeorm";
import { appDataSource } from "../../database/data-source.js";
import { Customer } from "../../entities/customer.entity.js";
import { Job } from "../../entities/job.entity.js";
import { JobService } from "../../entities/job-service.entity.js";
import { Service } from "../../entities/service.entity.js";
import { User } from "../../entities/user.entity.js";
import type { AuthenticatedUser } from "../auth/auth.types.js";
import type { JobListQuery, JobPayload } from "./job.schemas.js";
import type { JobResponse } from "./job.types.js";
import { buildPersistedJobServiceAssignments } from "./job.utils.js";

export class JobDependencyError extends Error {}
export class JobNotFoundError extends Error {}
export class JobAlreadyExistsError extends Error {}
export class JobAccessError extends Error {}

const toJobAssignment = (user: User) => ({
  id: user.uuid,
  name: user.name,
  email: user.email,
  role: user.role
});

const dedupeUsers = (users: User[]) => {
  const seenUserIds = new Set<string>();

  return users.filter((user) => {
    if (seenUserIds.has(user.uuid)) {
      return false;
    }

    seenUserIds.add(user.uuid);
    return true;
  });
};

const toJobServiceAssignment = (jobService: JobService) => ({
  id: jobService.id,
  serviceId: jobService.service.id,
  serviceName: jobService.service.name,
  hourlyRate: jobService.hourlyRate,
  assignedTo: jobService.assignees.map(toJobAssignment)
});

const toJobResponse = (job: Job): JobResponse => ({
  id: job.id,
  title: job.title,
  description: job.description,
  customerId: job.customer.id,
  customerName: job.customer.companyName,
  projectManagerId: job.projectManager?.uuid ?? "",
  projectManager: job.projectManager ? toJobAssignment(job.projectManager) : null,
  assignedTo: dedupeUsers(job.serviceAssignments.flatMap((jobService) => jobService.assignees)).map(toJobAssignment),
  serviceAssignments: job.serviceAssignments.map(toJobServiceAssignment),
  status: job.status,
  startDate: job.startDate,
  dueDate: job.dueDate,
  approvedBy: job.approvedBy ? toJobAssignment(job.approvedBy) : null,
  approvedAt: job.approvedAt ? job.approvedAt.toISOString() : null,
  rejectionReason: job.rejectionReason,
  createdAt: job.createdAt.toISOString(),
  updatedAt: job.updatedAt.toISOString()
});

const findAssignableUsersByIds = async (assignedToIds: string[]) => {
  const userRepository = appDataSource.getRepository(User);
  const uniqueAssignedToIds = Array.from(new Set(assignedToIds));

  const assignees = await userRepository.find({
    where: uniqueAssignedToIds.map((id) => ({
      uuid: id,
      active: true,
      isLoginBlocked: false
    }))
  });

  const validAssignees = assignees.filter(
    (user) => user.role === "team_member" || user.role === "manager"
  );

  if (validAssignees.length !== uniqueAssignedToIds.length) {
    throw new JobDependencyError("Select valid team members or managers for this project service");
  }

  return validAssignees;
};

const buildJobServiceAssignments = async (payload: JobPayload) => {
  const serviceRepository = appDataSource.getRepository(Service);
  const serviceIds = Array.from(new Set(payload.serviceAssignments.map((assignment) => assignment.serviceId)));
  const allAssignedUserIds = payload.serviceAssignments.flatMap((assignment) => assignment.assignedToIds);

  const [services, assignableUsers] = await Promise.all([
    serviceRepository.find({
      where: serviceIds.map((id) => ({ id }))
    }),
    findAssignableUsersByIds(allAssignedUserIds)
  ]);

  if (services.length !== serviceIds.length) {
    throw new JobDependencyError("Select valid services for this project");
  }

  try {
    return buildPersistedJobServiceAssignments({
      payload,
      services,
      assignableUsers
    }).map((assignment) => appDataSource.getRepository(JobService).create(assignment));
  } catch (error: unknown) {
    if (error instanceof Error) {
      throw new JobDependencyError(error.message);
    }

    throw error;
  }
};

const findProjectManager = async (projectManagerId: string) => {
  const userRepository = appDataSource.getRepository(User);
  const projectManager = await userRepository.findOne({
    where: {
      uuid: projectManagerId,
      role: "manager",
      active: true,
      isLoginBlocked: false
    }
  });

  if (!projectManager) {
    throw new JobDependencyError("Select a valid active project manager");
  }

  return projectManager;
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
      serviceAssignments: {
        service: true,
        assignees: true
      },
      projectManager: true,
      assignedTo: true,
      approvedBy: true
    }
  });

  if (!job) {
    throw new JobNotFoundError("Job not found");
  }

  return job;
};

const ensureJobAccess = (job: Job, authUser: AuthenticatedUser) => {
  if (authUser.role !== "manager") {
    return;
  }

  if (!job.projectManager || job.projectManager.uuid !== authUser.id) {
    throw new JobAccessError("You do not have access to this project");
  }
};

const applyApprovalState = async (
  job: Job,
  payload: JobPayload,
  authUser: AuthenticatedUser
) => {
  if (payload.status === "approved" || payload.status === "rejected") {
    const userRepository = appDataSource.getRepository(User);
    const actingUser = await userRepository.findOne({ where: { uuid: authUser.id } });

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

export const listJobs = async (
  { search, status, customerId }: JobListQuery,
  authUser: AuthenticatedUser
): Promise<JobResponse[]> => {
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
      serviceAssignments: {
        service: true,
        assignees: true
      },
      projectManager: true,
      assignedTo: true,
      approvedBy: true
    },
    order: {
      updatedAt: "DESC",
      createdAt: "DESC"
    }
  });

  const visibleJobs =
    authUser.role === "manager"
      ? jobs.filter((job) => job.projectManager?.uuid === authUser.id)
      : jobs;

  return visibleJobs.map(toJobResponse);
};

export const getJobById = async (jobId: string, authUser: AuthenticatedUser): Promise<JobResponse> => {
  const job = await loadJobOrThrow(jobId);
  ensureJobAccess(job, authUser);
  return toJobResponse(job);
};

export const createJob = async (
  payload: JobPayload,
  authUser: AuthenticatedUser
): Promise<JobResponse> => {
  const customerRepository = appDataSource.getRepository(Customer);
  const jobRepository = appDataSource.getRepository(Job);

  const [customer, serviceAssignments, projectManager] = await Promise.all([
    customerRepository.findOne({ where: { id: payload.customerId } }),
    buildJobServiceAssignments(payload),
    findProjectManager(payload.projectManagerId)
  ]);

  if (!customer || customer.status !== "active") {
    throw new JobDependencyError("Select an active customer for this job");
  }

  await ensureJobTitleIsUnique(payload.customerId, payload.title);

  const job = jobRepository.create({
    title: payload.title.trim(),
    description: payload.description.trim(),
    customer,
    projectManager,
    assignedTo: dedupeUsers(serviceAssignments.flatMap((serviceAssignment) => serviceAssignment.assignees)),
    serviceAssignments,
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
      serviceAssignments: {
        service: true,
        assignees: true
      },
      projectManager: true,
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
  const [job, customer, projectManager] = await Promise.all([
    loadJobOrThrow(jobId),
    customerRepository.findOne({ where: { id: payload.customerId } }),
    findProjectManager(payload.projectManagerId)
  ]);

  if (!customer || customer.status !== "active") {
    throw new JobDependencyError("Select an active customer for this job");
  }

  await ensureJobTitleIsUnique(payload.customerId, payload.title, jobId);

  const services = await appDataSource.getRepository(Service).find({
    where: Array.from(new Set(payload.serviceAssignments.map((assignment) => assignment.serviceId))).map((id) => ({ id }))
  });
  const assignableUsers = await findAssignableUsersByIds(
    payload.serviceAssignments.flatMap((assignment) => assignment.assignedToIds)
  );
  const serviceAssignments = buildPersistedJobServiceAssignments({
    payload,
    services,
    assignableUsers,
    job,
    existingAssignments: job.serviceAssignments
  }).map((assignment) => appDataSource.getRepository(JobService).create(assignment));

  job.title = payload.title.trim();
  job.description = payload.description.trim();
  job.customer = customer;
  job.projectManager = projectManager;
  job.assignedTo = dedupeUsers(serviceAssignments.flatMap((serviceAssignment) => serviceAssignment.assignees));
  job.serviceAssignments = serviceAssignments;
  job.status = payload.status;
  job.startDate = payload.startDate;
  job.dueDate = payload.dueDate;

  await applyApprovalState(job, payload, authUser);

  const savedJob = await jobRepository.save(job);
  const jobWithRelations = await jobRepository.findOneOrFail({
    where: { id: savedJob.id },
    relations: {
      customer: true,
      serviceAssignments: {
        service: true,
        assignees: true
      },
      projectManager: true,
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
      projectManagerId: job.projectManager?.uuid ?? "",
      serviceAssignments: job.serviceAssignments.map((serviceAssignment) => ({
        serviceId: serviceAssignment.service.id,
        hourlyRate: serviceAssignment.hourlyRate,
        assignedToIds: serviceAssignment.assignees.map((user) => user.uuid)
      })),
      status: "cancelled",
      startDate: job.startDate,
      dueDate: job.dueDate,
      rejectionReason: null
    },
    authUser
  );
};
