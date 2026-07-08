import {
  Column,
  CreateDateColumn,
  Entity,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn
} from "typeorm";
import { JobService } from "./job-service.entity.js";
import { serviceStatuses } from "./service-status.js";

const decimalTransformer = {
  to: (value: number) => value,
  from: (value: string | number) => Number(value)
};

@Entity({ name: "services" })
export class Service {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column({ type: "varchar", length: 160, unique: true })
  name!: string;

  @Column({ type: "varchar", length: 255, default: "" })
  description!: string;

  @Column({
    type: "decimal",
    precision: 10,
    scale: 2,
    name: "default_hourly_rate",
    transformer: decimalTransformer
  })
  defaultHourlyRate!: number;

  @Column({
    type: "enum",
    enum: serviceStatuses,
    default: "active"
  })
  status!: (typeof serviceStatuses)[number];

  @OneToMany(() => JobService, (jobService) => jobService.service)
  jobServices!: JobService[];

  @CreateDateColumn({ name: "created_at" })
  createdAt!: Date;

  @UpdateDateColumn({ name: "updated_at" })
  updatedAt!: Date;
}
