import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  Unique,
  UpdateDateColumn
} from "typeorm";
import { Job } from "./job.entity.js";
import { User } from "./user.entity.js";
import { workLogMonthStatuses } from "./work-log-month-status.js";

@Entity({ name: "work_log_periods" })
@Unique("UQ_work_log_periods_job_month", ["job", "monthStart"])
export class WorkLogPeriod {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @ManyToOne(() => Job, { nullable: false, onDelete: "CASCADE" })
  @JoinColumn({ name: "job_id" })
  job!: Job;

  @Column({ type: "date", name: "month_start" })
  monthStart!: string;

  @Column({
    type: "enum",
    enum: workLogMonthStatuses,
    default: "pending"
  })
  status!: (typeof workLogMonthStatuses)[number];

  @ManyToOne(() => User, { nullable: true, onDelete: "SET NULL" })
  @JoinColumn({ name: "reviewed_by" })
  reviewedBy!: User | null;

  @Column({ type: "datetime", name: "reviewed_at", nullable: true })
  reviewedAt!: Date | null;

  @Column({ type: "varchar", length: 2000, name: "rejection_reason", nullable: true })
  rejectionReason!: string | null;

  @CreateDateColumn({ name: "created_at" })
  createdAt!: Date;

  @UpdateDateColumn({ name: "updated_at" })
  updatedAt!: Date;
}
