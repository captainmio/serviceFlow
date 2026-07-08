import { ILike } from "typeorm";
import { appDataSource } from "../../database/data-source.js";
import { Customer } from "../../entities/customer.entity.js";
import { Invoice } from "../../entities/invoice.entity.js";
import { Job } from "../../entities/job.entity.js";
import type { CustomerListQuery, CustomerPayload } from "./customer.schemas.js";
import type { CustomerResponse } from "./customer.types.js";

export class CustomerDeleteBlockedError extends Error {
  constructor() {
    super("Cannot delete a customer that already has jobs or invoices. Set the customer to inactive instead.");
  }
}

const toCustomerResponse = (customer: Customer): CustomerResponse => ({
  id: customer.id,
  companyName: customer.companyName,
  contactPerson: customer.contactPerson,
  email: customer.email,
  phone: customer.phone,
  address: customer.address,
  status: customer.status,
  hasJobs: Array.isArray(customer.jobs) ? customer.jobs.length > 0 : false,
  createdAt: customer.createdAt.toISOString(),
  updatedAt: customer.updatedAt.toISOString()
});

export const listCustomers = async ({
  search,
  status
}: CustomerListQuery): Promise<CustomerResponse[]> => {
  const customerRepository = appDataSource.getRepository(Customer);

  const whereClause = search
    ? [
        { companyName: ILike(`%${search}%`), ...(status ? { status } : {}) },
        { contactPerson: ILike(`%${search}%`), ...(status ? { status } : {}) },
        { email: ILike(`%${search}%`), ...(status ? { status } : {}) },
        { phone: ILike(`%${search}%`), ...(status ? { status } : {}) }
      ]
    : status
      ? { status }
      : {};

  const customers = await customerRepository.find({
    where: whereClause,
    relations: {
      jobs: true
    },
    order: {
      companyName: "ASC"
    }
  });

  return customers.map(toCustomerResponse);
};

export const createCustomer = async (payload: CustomerPayload): Promise<CustomerResponse> => {
  const customerRepository = appDataSource.getRepository(Customer);

  const customer = customerRepository.create({
    companyName: payload.companyName.trim(),
    contactPerson: payload.contactPerson.trim(),
    email: payload.email.trim().toLowerCase(),
    phone: payload.phone.trim(),
    address: payload.address.trim(),
    status: payload.status
  });

  const savedCustomer = await customerRepository.save(customer);
  return toCustomerResponse({
    ...savedCustomer,
    jobs: []
  });
};

export const updateCustomer = async (
  customerId: string,
  payload: CustomerPayload
): Promise<CustomerResponse | null> => {
  const customerRepository = appDataSource.getRepository(Customer);
  const customer = await customerRepository.findOne({ where: { id: customerId } });

  if (!customer) {
    return null;
  }

  customer.companyName = payload.companyName.trim();
  customer.contactPerson = payload.contactPerson.trim();
  customer.email = payload.email.trim().toLowerCase();
  customer.phone = payload.phone.trim();
  customer.address = payload.address.trim();
  customer.status = payload.status;

  const savedCustomer = await customerRepository.save(customer);
  return toCustomerResponse({
    ...savedCustomer,
    jobs: customer.jobs ?? []
  });
};

export const deleteCustomer = async (customerId: string): Promise<boolean> => {
  const customerRepository = appDataSource.getRepository(Customer);
  const jobRepository = appDataSource.getRepository(Job);
  const invoiceRepository = appDataSource.getRepository(Invoice);

  const customer = await customerRepository.findOne({ where: { id: customerId } });

  if (!customer) {
    return false;
  }

  const [jobCount, invoiceCount] = await Promise.all([
    jobRepository.count({
      where: {
        customer: {
          id: customerId
        }
      }
    }),
    invoiceRepository.count({
      where: {
        customer: {
          id: customerId
        }
      }
    })
  ]);

  if (jobCount > 0 || invoiceCount > 0) {
    throw new CustomerDeleteBlockedError();
  }

  await customerRepository.remove(customer);
  return true;
};
