import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  JoinTable,
  ManyToMany,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn
} from "typeorm";
import { Customer } from "./customer.entity.js";
import { jobStatuses } from "./job-status.js";
import { User } from "./user.entity.js";

@Entity({ name: "jobs" })
export class Job {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column({ type: "varchar", length: 160, default: "Untitled job" })
  title!: string;

  @ManyToOne(() => Customer, (customer) => customer.jobs, { nullable: false })
  @JoinColumn({ name: "customer_id" })
  customer!: Customer;

  @Column({ type: "varchar", length: 2000, default: "" })
  description!: string;

  @Column({
    type: "enum",
    enum: jobStatuses,
    default: "draft"
  })
  status!: (typeof jobStatuses)[number];

  @Column({ type: "date", name: "start_date", nullable: true })
  startDate!: string | null;

  @Column({ type: "date", name: "due_date", nullable: true })
  dueDate!: string | null;

  @ManyToMany(() => User, (user) => user.assignedJobs)
  @JoinTable({
    name: "job_assignees",
    joinColumn: {
      name: "job_id",
      referencedColumnName: "id"
    },
    inverseJoinColumn: {
      name: "user_id",
      referencedColumnName: "uuid"
    }
  })
  assignedTo!: User[];

  @ManyToOne(() => User, (user) => user.approvedJobs, { nullable: true })
  @JoinColumn({ name: "approved_by" })
  approvedBy!: User | null;

  @Column({ type: "datetime", name: "approved_at", nullable: true })
  approvedAt!: Date | null;

  @Column({ type: "varchar", length: 2000, name: "rejection_reason", nullable: true })
  rejectionReason!: string | null;

  @CreateDateColumn({ name: "created_at" })
  createdAt!: Date;

  @UpdateDateColumn({ name: "updated_at" })
  updatedAt!: Date;
}
