import { hash } from "bcrypt";
import { env } from "../config/env.js";
import { appDataSource } from "./data-source.js";
import { User } from "../entities/user.entity.js";

const seed = async () => {
  await appDataSource.initialize();

  const userRepository = appDataSource.getRepository(User);
  const existingUser = await userRepository.findOne({
    where: { email: env.SEED_ADMIN_EMAIL.toLowerCase() }
  });

  if (existingUser) {
    console.log(`Admin user already exists for ${env.SEED_ADMIN_EMAIL}.`);
    await appDataSource.destroy();
    return;
  }

  const passwordHash = await hash(env.SEED_ADMIN_PASSWORD, 10);

  const adminUser = userRepository.create({
    name: env.SEED_ADMIN_NAME,
    email: env.SEED_ADMIN_EMAIL.toLowerCase(),
    passwordHash,
    role: "admin"
  });

  await userRepository.save(adminUser);
  console.log(`Seeded admin user ${adminUser.email}.`);

  await appDataSource.destroy();
};

seed().catch(async (error: unknown) => {
  console.error("Seeding failed.", error);

  if (appDataSource.isInitialized) {
    await appDataSource.destroy();
  }

  process.exitCode = 1;
});
