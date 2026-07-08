import { hash } from "bcrypt";
import type { MigrationInterface, QueryRunner } from "typeorm";

export class SeedAdminUser1720573200000 implements MigrationInterface {
  name = "SeedAdminUser1720573200000";

  public async up(queryRunner: QueryRunner): Promise<void> {
    const existingUsers = await queryRunner.query(
      "SELECT `uuid` FROM `users` WHERE LOWER(`email`) = LOWER(?) LIMIT 1",
      ["admin"]
    );

    if (existingUsers.length > 0) {
      return;
    }

    const passwordHash = await hash("admin", 10);

    await queryRunner.query(
      `
        INSERT INTO \`users\` (
          \`uuid\`,
          \`first_name\`,
          \`last_name\`,
          \`name\`,
          \`title\`,
          \`email\`,
          \`password_hash\`,
          \`role\`,
          \`active\`,
          \`is_login_blocked\`,
          \`start_date\`,
          \`end_date\`,
          \`max_work_hours_per_day\`,
          \`max_work_hours_per_week\`,
          \`created_at\`,
          \`updated_at\`
        )
        VALUES (
          UUID(),
          ?,
          ?,
          ?,
          ?,
          ?,
          ?,
          ?,
          ?,
          ?,
          CURRENT_DATE,
          NULL,
          ?,
          ?,
          NOW(),
          NOW()
        )
      `,
      [
        "System",
        "Administrator",
        "System Administrator",
        "System Administrator",
        "admin",
        passwordHash,
        "admin",
        1,
        0,
        8,
        40
      ]
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query("DELETE FROM `users` WHERE LOWER(`email`) = LOWER(?)", ["admin"]);
  }
}
