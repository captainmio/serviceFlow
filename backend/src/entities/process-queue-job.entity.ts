import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  Unique,
  UpdateDateColumn
} from "typeorm";
import { processQueueJobStatuses } from "./process-queue-job-status.js";

@Entity({ name: "process_queue_jobs" })
@Unique("UQ_process_queue_jobs_dedupe_key", ["dedupeKey"])
export class ProcessQueueJob {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column({ type: "varchar", length: 120 })
  type!: string;

  @Column({ type: "varchar", length: 160, name: "dedupe_key", nullable: true })
  dedupeKey!: string | null;

  @Column({ type: "simple-json" })
  payload!: Record<string, string>;

  @Column({
    type: "enum",
    enum: processQueueJobStatuses,
    default: "pending"
  })
  status!: (typeof processQueueJobStatuses)[number];

  @Column({ type: "int", default: 0 })
  attempts!: number;

  @Column({ type: "datetime", name: "available_at" })
  availableAt!: Date;

  @Column({ type: "datetime", name: "processed_at", nullable: true })
  processedAt!: Date | null;

  @Column({ type: "varchar", length: 2000, name: "last_error", nullable: true })
  lastError!: string | null;

  @CreateDateColumn({ name: "created_at" })
  createdAt!: Date;

  @UpdateDateColumn({ name: "updated_at" })
  updatedAt!: Date;
}
