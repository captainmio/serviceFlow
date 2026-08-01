import type { MigrationInterface, QueryRunner } from "typeorm";

export class AddUserMasterData1720569600000 implements MigrationInterface {
  name = "AddUserMasterData1720569600000";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await this.safeUp(queryRunner);
  }

  public async safeUp(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS \`users\` (
        \`id\` varchar(36) NOT NULL,
        \`name\` varchar(120) NOT NULL,
        \`email\` varchar(160) NOT NULL UNIQUE,
        \`password_hash\` varchar(255) NOT NULL,
        \`role\` enum('admin', 'manager', 'team_member') NOT NULL DEFAULT 'team_member',
        \`created_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
        \`updated_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
        PRIMARY KEY (\`id\`)
      )
    `);
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS \`customers\` (
        \`id\` varchar(36) NOT NULL,
        \`company_name\` varchar(160) NOT NULL,
        \`contact_person\` varchar(120) NOT NULL,
        \`email\` varchar(160) NOT NULL UNIQUE,
        \`phone\` varchar(40) NOT NULL,
        \`address\` varchar(255) NOT NULL,
        \`status\` enum('active', 'inactive') NOT NULL DEFAULT 'active',
        \`created_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
        \`updated_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
        PRIMARY KEY (\`id\`)
      ) ENGINE=InnoDB
    `);
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS \`services\` (
        \`id\` varchar(36) NOT NULL,
        \`name\` varchar(160) NOT NULL UNIQUE,
        \`description\` varchar(255) NOT NULL DEFAULT '',
        \`default_hourly_rate\` decimal(10,2) NOT NULL,
        \`status\` enum('active', 'inactive') NOT NULL DEFAULT 'active',
        \`created_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
        \`updated_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
        PRIMARY KEY (\`id\`)
      ) ENGINE=InnoDB
    `);
    await queryRunner.query("ALTER TABLE `users` CHANGE `id` `uuid` varchar(36) NOT NULL");
    await queryRunner.query("ALTER TABLE `users` ADD `member_id` int NOT NULL AUTO_INCREMENT UNIQUE");
    await queryRunner.query(
      "ALTER TABLE `users` ADD `first_name` varchar(80) NOT NULL DEFAULT 'System'"
    );
    await queryRunner.query(
      "ALTER TABLE `users` ADD `last_name` varchar(80) NOT NULL DEFAULT 'User'"
    );
    await queryRunner.query(
      "ALTER TABLE `users` ADD `title` varchar(120) NOT NULL DEFAULT 'System Administrator'"
    );
    await queryRunner.query("ALTER TABLE `users` ADD `active` tinyint NOT NULL DEFAULT 1");
    await queryRunner.query(
      "ALTER TABLE `users` ADD `is_login_blocked` tinyint NOT NULL DEFAULT 0"
    );
    await queryRunner.query(
      "ALTER TABLE `users` ADD `start_date` date NOT NULL DEFAULT (CURRENT_DATE)"
    );
    await queryRunner.query("ALTER TABLE `users` ADD `end_date` date NULL");
    await queryRunner.query(
      "ALTER TABLE `users` ADD `max_work_hours_per_day` int NOT NULL DEFAULT 8"
    );
    await queryRunner.query(
      "ALTER TABLE `users` ADD `max_work_hours_per_week` int NOT NULL DEFAULT 40"
    );

    await queryRunner.query(`
      UPDATE \`users\`
      SET
        \`first_name\` = TRIM(SUBSTRING_INDEX(\`name\`, ' ', 1)),
        \`last_name\` = CASE
          WHEN LOCATE(' ', TRIM(\`name\`)) > 0 THEN TRIM(SUBSTRING(TRIM(\`name\`), LOCATE(' ', TRIM(\`name\`)) + 1))
          ELSE 'User'
        END,
        \`title\` = CASE
          WHEN \`role\` = 'admin' THEN 'System Administrator'
          WHEN \`role\` = 'manager' THEN 'Manager'
          ELSE 'Team Member'
        END,
        \`start_date\` = DATE(\`created_at\`)
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await this.safeDown(queryRunner);
  }

  public async safeDown(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query("ALTER TABLE `users` DROP COLUMN `max_work_hours_per_week`");
    await queryRunner.query("ALTER TABLE `users` DROP COLUMN `max_work_hours_per_day`");
    await queryRunner.query("ALTER TABLE `users` DROP COLUMN `end_date`");
    await queryRunner.query("ALTER TABLE `users` DROP COLUMN `start_date`");
    await queryRunner.query("ALTER TABLE `users` DROP COLUMN `is_login_blocked`");
    await queryRunner.query("ALTER TABLE `users` DROP COLUMN `active`");
    await queryRunner.query("ALTER TABLE `users` DROP COLUMN `title`");
    await queryRunner.query("ALTER TABLE `users` DROP COLUMN `last_name`");
    await queryRunner.query("ALTER TABLE `users` DROP COLUMN `first_name`");
    await queryRunner.query("ALTER TABLE `users` DROP COLUMN `member_id`");
    await queryRunner.query("ALTER TABLE `users` CHANGE `uuid` `id` varchar(36) NOT NULL");
  }
}
