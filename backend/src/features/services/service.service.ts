import { ILike } from "typeorm";
import { appDataSource } from "../../database/data-source.js";
import { Service } from "../../entities/service.entity.js";
import type { ServiceListQuery, ServicePayload } from "./service.schemas.js";
import type { ServiceResponse } from "./service.types.js";

const toServiceResponse = (service: Service): ServiceResponse => ({
  id: service.id,
  name: service.name,
  description: service.description,
  defaultHourlyRate: service.defaultHourlyRate,
  status: service.status,
  createdAt: service.createdAt.toISOString(),
  updatedAt: service.updatedAt.toISOString()
});

export const listServices = async ({
  search,
  status
}: ServiceListQuery): Promise<ServiceResponse[]> => {
  const serviceRepository = appDataSource.getRepository(Service);

  const whereClause = search
    ? [
        { name: ILike(`%${search}%`), ...(status ? { status } : {}) },
        { description: ILike(`%${search}%`), ...(status ? { status } : {}) }
      ]
    : status
      ? { status }
      : {};

  const services = await serviceRepository.find({
    where: whereClause,
    order: {
      name: "ASC"
    }
  });

  return services.map(toServiceResponse);
};

export const createService = async (payload: ServicePayload): Promise<ServiceResponse> => {
  const serviceRepository = appDataSource.getRepository(Service);

  const service = serviceRepository.create({
    name: payload.name.trim(),
    description: payload.description.trim(),
    defaultHourlyRate: payload.defaultHourlyRate,
    status: payload.status
  });

  const savedService = await serviceRepository.save(service);
  return toServiceResponse(savedService);
};

export const updateService = async (
  serviceId: string,
  payload: ServicePayload
): Promise<ServiceResponse | null> => {
  const serviceRepository = appDataSource.getRepository(Service);
  const service = await serviceRepository.findOne({ where: { id: serviceId } });

  if (!service) {
    return null;
  }

  service.name = payload.name.trim();
  service.description = payload.description.trim();
  service.defaultHourlyRate = payload.defaultHourlyRate;
  service.status = payload.status;

  const savedService = await serviceRepository.save(service);
  return toServiceResponse(savedService);
};

export const deactivateService = async (serviceId: string): Promise<ServiceResponse | null> => {
  const serviceRepository = appDataSource.getRepository(Service);
  const service = await serviceRepository.findOne({ where: { id: serviceId } });

  if (!service) {
    return null;
  }

  service.status = "inactive";
  const savedService = await serviceRepository.save(service);
  return toServiceResponse(savedService);
};
