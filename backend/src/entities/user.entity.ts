import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn
} from "typeorm";
import { userRoles } from "./user-role.js";

@Entity({ name: "users" })
export class User {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column({ type: "varchar", length: 120 })
  name!: string;

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

  @CreateDateColumn({ name: "created_at" })
  createdAt!: Date;

  @UpdateDateColumn({ name: "updated_at" })
  updatedAt!: Date;
}
