import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn
} from "typeorm";
import { Job } from "./job.entity.js";
import { JobService } from "./job-service.entity.js";
import { User } from "./user.entity.js";

const decimalTransformer = {
  to: (value: number) => value,
  from: (value: string | number) => Number(value)
};

@Entity({ name: "work_logs" })
export class WorkLog {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @ManyToOne(() => Job, { nullable: false, onDelete: "CASCADE" })
  @JoinColumn({ name: "job_id" })
  job!: Job;

  @ManyToOne(() => JobService, { nullable: false, onDelete: "CASCADE" })
  @JoinColumn({ name: "job_service_id" })
  jobService!: JobService;

  @ManyToOne(() => User, { nullable: false, onDelete: "CASCADE" })
  @JoinColumn({ name: "user_id" })
  user!: User;

  @Column({ type: "date", name: "work_date" })
  workDate!: string;

  @Column({
    type: "decimal",
    precision: 6,
    scale: 2,
    transformer: decimalTransformer
  })
  hours!: number;

  @Column({
    type: "decimal",
    precision: 10,
    scale: 2,
    name: "hourly_rate",
    transformer: decimalTransformer
  })
  hourlyRate!: number;

  @Column({
    type: "decimal",
    precision: 12,
    scale: 2,
    name: "line_total",
    transformer: decimalTransformer
  })
  lineTotal!: number;

  @Column({ type: "varchar", length: 2000, default: "" })
  notes!: string;

  @CreateDateColumn({ name: "created_at" })
  createdAt!: Date;

  @UpdateDateColumn({ name: "updated_at" })
  updatedAt!: Date;
}
