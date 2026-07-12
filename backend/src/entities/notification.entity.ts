import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn
} from "typeorm";
import { notificationTypes } from "./notification-type.js";
import { User } from "./user.entity.js";

@Entity({ name: "notifications" })
export class Notification {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @ManyToOne(() => User, { nullable: false, onDelete: "CASCADE" })
  @JoinColumn({ name: "user_id" })
  user!: User;

  @Column({
    type: "enum",
    enum: notificationTypes
  })
  type!: (typeof notificationTypes)[number];

  @Column({ type: "varchar", length: 160 })
  title!: string;

  @Column({ type: "varchar", length: 2000, default: "" })
  message!: string;

  @Column({ type: "varchar", length: 255, default: "" })
  link!: string;

  @Column({ type: "datetime", name: "read_at", nullable: true })
  readAt!: Date | null;

  @CreateDateColumn({ name: "created_at" })
  createdAt!: Date;

  @UpdateDateColumn({ name: "updated_at" })
  updatedAt!: Date;
}
