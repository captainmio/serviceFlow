import {
  Column,
  Entity,
  JoinColumn,
  JoinTable,
  ManyToMany,
  ManyToOne,
  PrimaryGeneratedColumn
} from "typeorm";
import { Job } from "./job.entity.js";
import { Service } from "./service.entity.js";
import { User } from "./user.entity.js";

const decimalTransformer = {
  to: (value: number) => value,
  from: (value: string | number) => Number(value)
};

@Entity({ name: "job_services" })
export class JobService {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @ManyToOne(() => Job, (job) => job.serviceAssignments, { nullable: false, onDelete: "CASCADE" })
  @JoinColumn({ name: "job_id" })
  job!: Job;

  @ManyToOne(() => Service, (service) => service.jobServices, { nullable: false })
  @JoinColumn({ name: "service_id" })
  service!: Service;

  @Column({
    type: "decimal",
    precision: 10,
    scale: 2,
    name: "hourly_rate",
    transformer: decimalTransformer
  })
  hourlyRate!: number;

  @ManyToMany(() => User, (user) => user.assignedJobServices)
  @JoinTable({
    name: "job_service_assignees",
    joinColumn: {
      name: "job_service_id",
      referencedColumnName: "id"
    },
    inverseJoinColumn: {
      name: "user_id",
      referencedColumnName: "uuid"
    }
  })
  assignees!: User[];
}
