import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  Unique,
  UpdateDateColumn
} from "typeorm";
import { Customer } from "./customer.entity.js";
import { invoiceStatuses } from "./invoice-status.js";
import { InvoiceItem } from "./invoice-item.entity.js";
import { User } from "./user.entity.js";

@Entity({ name: "invoices" })
@Unique("UQ_invoices_invoice_number", ["invoiceNumber"])
export class Invoice {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column({ type: "varchar", length: 160, name: "invoice_number" })
  invoiceNumber!: string;

  @ManyToOne(() => Customer, (customer) => customer.invoices, { nullable: false })
  @JoinColumn({ name: "customer_id" })
  customer!: Customer;

  @Column({
    type: "enum",
    enum: invoiceStatuses,
    default: "draft"
  })
  status!: (typeof invoiceStatuses)[number];

  @Column({ type: "date", name: "invoice_date" })
  invoiceDate!: string;

  @Column({ type: "date", name: "due_date" })
  dueDate!: string;

  @Column({
    type: "decimal",
    precision: 12,
    scale: 2,
    transformer: {
      to: (value: number) => value,
      from: (value: string | number) => Number(value)
    }
  })
  subtotal!: number;

  @Column({
    type: "decimal",
    precision: 12,
    scale: 2,
    name: "tax_amount",
    default: 0,
    transformer: {
      to: (value: number) => value,
      from: (value: string | number) => Number(value)
    }
  })
  taxAmount!: number;

  @Column({
    type: "decimal",
    precision: 12,
    scale: 2,
    name: "total_amount",
    transformer: {
      to: (value: number) => value,
      from: (value: string | number) => Number(value)
    }
  })
  totalAmount!: number;

  @Column({ type: "varchar", length: 2000, default: "" })
  notes!: string;

  @ManyToOne(() => User, { nullable: true, onDelete: "SET NULL" })
  @JoinColumn({ name: "issued_by" })
  issuedBy!: User | null;

  @Column({ type: "datetime", name: "issued_at", nullable: true })
  issuedAt!: Date | null;

  @ManyToOne(() => User, { nullable: true, onDelete: "SET NULL" })
  @JoinColumn({ name: "reviewed_by" })
  reviewedBy!: User | null;

  @Column({ type: "datetime", name: "reviewed_at", nullable: true })
  reviewedAt!: Date | null;

  @Column({ type: "datetime", name: "paid_at", nullable: true })
  paidAt!: Date | null;

  @OneToMany(() => InvoiceItem, (item) => item.invoice)
  items!: InvoiceItem[];

  @CreateDateColumn({ name: "created_at" })
  createdAt!: Date;

  @UpdateDateColumn({ name: "updated_at" })
  updatedAt!: Date;
}
