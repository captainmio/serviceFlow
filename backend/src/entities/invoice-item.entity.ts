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
import { Invoice } from "./invoice.entity.js";
import { Job } from "./job.entity.js";
import { WorkLog } from "./work-log.entity.js";

const decimalTransformer = {
  to: (value: number) => value,
  from: (value: string | number) => Number(value)
};

@Entity({ name: "invoice_items" })
@Unique("UQ_invoice_items_work_log", ["workLog"])
export class InvoiceItem {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @ManyToOne(() => Invoice, (invoice) => invoice.items, { nullable: false, onDelete: "CASCADE" })
  @JoinColumn({ name: "invoice_id" })
  invoice!: Invoice;

  @ManyToOne(() => Job, { nullable: false, onDelete: "CASCADE" })
  @JoinColumn({ name: "job_id" })
  job!: Job;

  @ManyToOne(() => WorkLog, { nullable: false, onDelete: "RESTRICT" })
  @JoinColumn({ name: "work_log_id" })
  workLog!: WorkLog;

  @Column({ type: "date", name: "month_start" })
  monthStart!: string;

  @Column({ type: "date", name: "work_date" })
  workDate!: string;

  @Column({ type: "varchar", length: 160, name: "service_name" })
  serviceName!: string;

  @Column({ type: "varchar", length: 120, name: "member_name" })
  memberName!: string;

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
