import {
  Column,
  CreateDateColumn,
  Entity,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn
} from "typeorm";
import { customerStatuses } from "./customer-status.js";
import { Invoice } from "./invoice.entity.js";
import { Job } from "./job.entity.js";

@Entity({ name: "customers" })
export class Customer {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column({ type: "varchar", length: 160, name: "company_name" })
  companyName!: string;

  @Column({ type: "varchar", length: 120, name: "contact_person" })
  contactPerson!: string;

  @Column({ type: "varchar", length: 160, unique: true })
  email!: string;

  @Column({ type: "varchar", length: 40 })
  phone!: string;

  @Column({ type: "varchar", length: 255 })
  address!: string;

  @Column({
    type: "enum",
    enum: customerStatuses,
    default: "active"
  })
  status!: (typeof customerStatuses)[number];

  @OneToMany(() => Job, (job) => job.customer)
  jobs!: Job[];

  @OneToMany(() => Invoice, (invoice) => invoice.customer)
  invoices!: Invoice[];

  @CreateDateColumn({ name: "created_at" })
  createdAt!: Date;

  @UpdateDateColumn({ name: "updated_at" })
  updatedAt!: Date;
}
