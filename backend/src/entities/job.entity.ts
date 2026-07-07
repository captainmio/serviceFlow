import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn
} from "typeorm";
import { Customer } from "./customer.entity.js";
import { Service } from "./service.entity.js";

const decimalTransformer = {
  to: (value: number) => value,
  from: (value: string | number) => Number(value)
};

@Entity({ name: "jobs" })
export class Job {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column({ type: "varchar", length: 160, default: "Untitled job" })
  title!: string;

  @ManyToOne(() => Customer, (customer) => customer.jobs, { nullable: false })
  @JoinColumn({ name: "customer_id" })
  customer!: Customer;

  @ManyToOne(() => Service, (service) => service.jobs, { nullable: false })
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

  @CreateDateColumn({ name: "created_at" })
  createdAt!: Date;

  @UpdateDateColumn({ name: "updated_at" })
  updatedAt!: Date;
}
