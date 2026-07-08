import {
  Column,
  CreateDateColumn,
  Entity,
  Generated,
  ManyToMany,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn
} from "typeorm";
import { Job } from "./job.entity.js";
import { userRoles } from "./user-role.js";

@Entity({ name: "users" })
export class User {
  @PrimaryGeneratedColumn("uuid")
  uuid!: string;

  @Column({ type: "int", unique: true, name: "member_id" })
  @Generated("increment")
  id!: number;

  @Column({ type: "varchar", length: 80, name: "first_name", default: "System" })
  firstName!: string;

  @Column({ type: "varchar", length: 80, name: "last_name", default: "User" })
  lastName!: string;

  @Column({ type: "varchar", length: 120 })
  name!: string;

  @Column({ type: "varchar", length: 120 })
  title!: string;

  @Column({ type: "varchar", length: 160, unique: true })
  email!: string;

  @Column({ type: "varchar", length: 255, name: "password_hash" })
  passwordHash!: string;

  @Column({
    type: "enum",
    enum: userRoles,
    default: "team_member"
  })
  role!: (typeof userRoles)[number];

  @Column({ type: "boolean", default: true })
  active!: boolean;

  @Column({ type: "boolean", name: "is_login_blocked", default: false })
  isLoginBlocked!: boolean;

  @Column({ type: "date", name: "start_date", default: () => "CURRENT_DATE" })
  startDate!: string;

  @Column({ type: "date", name: "end_date", nullable: true })
  endDate!: string | null;

  @Column({ type: "int", name: "max_work_hours_per_day", default: 8 })
  maxWorkHoursPerDay!: number;

  @Column({ type: "int", name: "max_work_hours_per_week", default: 40 })
  maxWorkHoursPerWeek!: number;

  @ManyToMany(() => Job, (job) => job.assignedTo)
  assignedJobs!: Job[];

  @OneToMany(() => Job, (job) => job.approvedBy)
  approvedJobs!: Job[];

  @CreateDateColumn({ name: "created_at" })
  createdAt!: Date;

  @UpdateDateColumn({ name: "updated_at" })
  updatedAt!: Date;
}
