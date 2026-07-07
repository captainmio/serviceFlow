import { hash } from "bcrypt";
import { env } from "../config/env.js";
import { Service } from "../entities/service.entity.js";
import type { ServicePayload } from "../features/services/service.schemas.js";
import { appDataSource } from "./data-source.js";
import { User } from "../entities/user.entity.js";

const defaultServices: ServicePayload[] = [
  {
    name: "Website maintenance",
    description: "Routine updates, uptime checks, and performance monitoring.",
    defaultHourlyRate: 120,
    status: "active"
  },
  {
    name: "Bug fixing",
    description: "Troubleshooting and resolving application defects.",
    defaultHourlyRate: 135,
    status: "active"
  },
  {
    name: "Feature development",
    description: "Building new product capabilities and scoped enhancements.",
    defaultHourlyRate: 160,
    status: "active"
  },
  {
    name: "Technical support",
    description: "Operational help desk support and incident triage.",
    defaultHourlyRate: 110,
    status: "active"
  },
  {
    name: "Database cleanup",
    description: "Data hygiene, archival preparation, and schema housekeeping.",
    defaultHourlyRate: 145,
    status: "active"
  },
  {
    name: "Hosting support",
    description: "Hosting coordination, deployments, and environment reviews.",
    defaultHourlyRate: 125,
    status: "active"
  },
  {
    name: "Performance tuning",
    description: "Profiling and optimization for slow or resource-heavy systems.",
    defaultHourlyRate: 150,
    status: "active"
  }
];

const seed = async () => {
  await appDataSource.initialize();

  const userRepository = appDataSource.getRepository(User);
  const serviceRepository = appDataSource.getRepository(Service);
  const existingUser = await userRepository.findOne({
    where: { email: env.SEED_ADMIN_EMAIL.toLowerCase() }
  });

  if (!existingUser) {
    const passwordHash = await hash(env.SEED_ADMIN_PASSWORD, 10);

    const adminUser = userRepository.create({
      name: env.SEED_ADMIN_NAME,
      email: env.SEED_ADMIN_EMAIL.toLowerCase(),
      passwordHash,
      role: "admin"
    });

    await userRepository.save(adminUser);
    console.log(`Seeded admin user ${adminUser.email}.`);
  } else {
    console.log(`Admin user already exists for ${env.SEED_ADMIN_EMAIL}.`);
  }

  for (const serviceSeed of defaultServices) {
    const existingService = await serviceRepository.findOne({
      where: { name: serviceSeed.name }
    });

    if (existingService) {
      continue;
    }

    const service = serviceRepository.create(serviceSeed);
    await serviceRepository.save(service);
  }
  console.log(`Seeded ${defaultServices.length} default services when missing.`);

  await appDataSource.destroy();
};

seed().catch(async (error: unknown) => {
  console.error("Seeding failed.", error);

  if (appDataSource.isInitialized) {
    await appDataSource.destroy();
  }

  process.exitCode = 1;
});
