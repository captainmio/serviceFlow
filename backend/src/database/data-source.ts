import "reflect-metadata";
import { DataSource } from "typeorm";
import { env } from "../config/env.js";
import { Customer } from "../entities/customer.entity.js";
import { Invoice } from "../entities/invoice.entity.js";
import { Job } from "../entities/job.entity.js";
import { JobService } from "../entities/job-service.entity.js";
import { Service } from "../entities/service.entity.js";
import { User } from "../entities/user.entity.js";
import { WorkLogPeriod } from "../entities/work-log-period.entity.js";
import { WorkLog } from "../entities/work-log.entity.js";
import { WorkLogWeekSubmission } from "../entities/work-log-week-submission.entity.js";
import { AddUserMasterData1720569600000 } from "./migrations/1720569600000-add-user-master-data.js";
import { SeedAdminUser1720573200000 } from "./migrations/1720573200000-seed-admin-user.js";
import { AddJobServiceAssignments1720576800000 } from "./migrations/1720576800000-add-job-service-assignments.js";
import { ClearJobsTable1720578600000 } from "./migrations/1720578600000-clear-jobs-table.js";
import { AddProjectManagerToJobs1720580400000 } from "./migrations/1720580400000-add-project-manager-to-jobs.js";
import { AddWorkLogs1720584000000 } from "./migrations/1720584000000-add-work-logs.js";
import { AddWorkLogWeekSubmissions1720587600000 } from "./migrations/1720587600000-add-work-log-week-submissions.js";

export const appDataSource = new DataSource({
  type: "mysql",
  host: env.DB_HOST,
  port: env.DB_PORT,
  username: env.DB_USER,
  password: env.DB_PASSWORD,
  database: env.DB_NAME,
  synchronize: false,
  logging: false,
  entities: [User, Customer, Job, JobService, Invoice, Service, WorkLog, WorkLogPeriod, WorkLogWeekSubmission],
  migrations: [
    AddUserMasterData1720569600000,
    SeedAdminUser1720573200000,
    AddJobServiceAssignments1720576800000,
    ClearJobsTable1720578600000,
    AddProjectManagerToJobs1720580400000,
    AddWorkLogs1720584000000,
    AddWorkLogWeekSubmissions1720587600000
  ]
});
