import { hash } from "bcrypt";
import { config } from "dotenv";
import { z } from "zod";
import { appDataSource } from "../src/database/data-source.js";
import { User } from "../src/entities/user.entity.js";

config();

const cliArgsSchema = z.object({
  email: z.string().trim().email("Provide a valid admin email address"),
  password: z.string().min(8, "Password must be at least 8 characters long"),
  firstName: z.string().trim().min(1, "First name is required").max(80),
  lastName: z.string().trim().min(1, "Last name is required").max(80),
  title: z.string().trim().min(1).max(120).default("System Administrator")
});

const parseArgs = () => {
  const args = process.argv.slice(2);
  const values: Record<string, string> = {};

  for (const arg of args) {
    if (!arg.startsWith("--")) {
      continue;
    }

    const [rawKey, ...rawValueParts] = arg.slice(2).split("=");
    if (!rawKey || rawValueParts.length === 0) {
      continue;
    }

    const key = rawKey.replace(/-([a-z])/g, (_, letter: string) => letter.toUpperCase());
    values[key] = rawValueParts.join("=");
  }

  return cliArgsSchema.parse(values);
};

const ensureDevelopmentOnly = () => {
  if (process.env.NODE_ENV !== "development") {
    throw new Error("This command is available only when NODE_ENV=development");
  }
};

const run = async () => {
  ensureDevelopmentOnly();

  const args = parseArgs();
  await appDataSource.initialize();

  try {
    const userRepository = appDataSource.getRepository(User);
    const normalizedEmail = args.email.trim().toLowerCase();
    const existingUser = await userRepository.findOne({
      where: { email: normalizedEmail }
    });

    if (existingUser) {
      throw new Error(`A user with email ${normalizedEmail} already exists`);
    }

    const passwordHash = await hash(args.password, 10);
    const today = new Date().toISOString().slice(0, 10);
    const user = userRepository.create({
      firstName: args.firstName.trim(),
      lastName: args.lastName.trim(),
      name: `${args.firstName.trim()} ${args.lastName.trim()}`,
      title: args.title.trim(),
      email: normalizedEmail,
      passwordHash,
      role: "admin",
      active: true,
      isLoginBlocked: false,
      startDate: today,
      endDate: null,
      maxWorkHoursPerDay: 8,
      maxWorkHoursPerWeek: 40
    });

    const savedUser = await userRepository.save(user);
    console.log(`Created development admin: ${savedUser.email} (${savedUser.uuid})`);
  } finally {
    await appDataSource.destroy();
  }
};

run().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : "Unable to create development admin");
  process.exitCode = 1;
});
