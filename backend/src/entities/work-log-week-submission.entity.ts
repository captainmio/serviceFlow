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

@Entity({ name: "work_log_week_submissions" })
@Unique("UQ_work_log_week_submissions_job_user_week", ["job", "user", "weekStart"])
export class WorkLogWeekSubmission {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @ManyToOne(() => Job, { nullable: false, onDelete: "CASCADE" })
  @JoinColumn({ name: "job_id" })
  job!: Job;

  @ManyToOne(() => User, { nullable: false, onDelete: "CASCADE" })
  @JoinColumn({ name: "user_id" })
  user!: User;

  @Column({ type: "date", name: "week_start" })
  weekStart!: string;

  @Column({ type: "datetime", name: "submitted_at" })
  submittedAt!: Date;

  @CreateDateColumn({ name: "created_at" })
  createdAt!: Date;

  @UpdateDateColumn({ name: "updated_at" })
  updatedAt!: Date;
}

