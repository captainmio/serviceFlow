import { appDataSource } from "../../database/data-source.js";
import { Customer } from "../../entities/customer.entity.js";
import { Job } from "../../entities/job.entity.js";
import { Service } from "../../entities/service.entity.js";
import type { JobPayload } from "./job.schemas.js";
import type { JobResponse } from "./job.types.js";

export class JobDependencyError extends Error {}

const toJobResponse = (job: Job): JobResponse => ({
  id: job.id,
  title: job.title,
  customerId: job.customer.id,
  customerName: job.customer.companyName,
  serviceId: job.service.id,
  serviceName: job.service.name,
  hourlyRate: job.hourlyRate,
  createdAt: job.createdAt.toISOString(),
  updatedAt: job.updatedAt.toISOString()
});

export const createJob = async (payload: JobPayload): Promise<JobResponse> => {
  const customerRepository = appDataSource.getRepository(Customer);
  const serviceRepository = appDataSource.getRepository(Service);
  const jobRepository = appDataSource.getRepository(Job);

  const [customer, service] = await Promise.all([
    customerRepository.findOne({ where: { id: payload.customerId } }),
    serviceRepository.findOne({ where: { id: payload.serviceId } })
  ]);

  if (!customer || customer.status !== "active") {
    throw new JobDependencyError("Select an active customer for this job");
  }

  if (!service || service.status !== "active") {
    throw new JobDependencyError("Select an active service for this job");
  }

  const job = jobRepository.create({
    title: payload.title.trim(),
    customer,
    service,
    hourlyRate: payload.hourlyRate
  });

  const savedJob = await jobRepository.save(job);
  const jobWithRelations = await jobRepository.findOneOrFail({
    where: { id: savedJob.id },
    relations: {
      customer: true,
      service: true
    }
  });

  return toJobResponse(jobWithRelations);
};
