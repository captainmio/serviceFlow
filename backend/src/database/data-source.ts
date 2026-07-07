import "reflect-metadata";
import { DataSource } from "typeorm";
import { env } from "../config/env.js";
import { User } from "../entities/user.entity.js";

export const appDataSource = new DataSource({
  type: "mysql",
  host: env.DB_HOST,
  port: env.DB_PORT,
  username: env.DB_USER,
  password: env.DB_PASSWORD,
  database: env.DB_NAME,
  synchronize: env.DB_SYNCHRONIZE,
  logging: false,
  entities: [User]
});
