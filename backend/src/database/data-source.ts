import "reflect-metadata";
import { DataSource } from "typeorm";
import { env } from "../config/env.js";
import { Customer } from "../entities/customer.entity.js";
import { Invoice } from "../entities/invoice.entity.js";
import { Job } from "../entities/job.entity.js";
import { Service } from "../entities/service.entity.js";
import { User } from "../entities/user.entity.js";
import { AddUserMasterData1720569600000 } from "./migrations/1720569600000-add-user-master-data.js";
import { SeedAdminUser1720573200000 } from "./migrations/1720573200000-seed-admin-user.js";

export const appDataSource = new DataSource({
  type: "mysql",
  host: env.DB_HOST,
  port: env.DB_PORT,
  username: env.DB_USER,
  password: env.DB_PASSWORD,
  database: env.DB_NAME,
  synchronize: false,
  logging: false,
  entities: [User, Customer, Job, Invoice, Service],
  migrations: [AddUserMasterData1720569600000, SeedAdminUser1720573200000]
});
