import type { MigrationInterface, QueryRunner } from "typeorm";

export class AddWorkLogs1720584000000 implements MigrationInterface {
  name = "AddWorkLogs1720584000000";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE \`work_log_periods\` (
        \`id\` varchar(36) NOT NULL,
        \`month_start\` date NOT NULL,
        \`status\` enum ('pending', 'approved', 'rejected') NOT NULL DEFAULT 'pending',
        \`reviewed_at\` datetime NULL,
        \`rejection_reason\` varchar(2000) NULL,
        \`created_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
        \`updated_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
        \`job_id\` varchar(36) NOT NULL,
        \`reviewed_by\` varchar(36) NULL,
        UNIQUE INDEX \`UQ_work_log_periods_job_month\` (\`job_id\`, \`month_start\`),
        PRIMARY KEY (\`id\`)
      ) ENGINE=InnoDB
    `);

    await queryRunner.query(`
      CREATE TABLE \`work_logs\` (
        \`id\` varchar(36) NOT NULL,
        \`work_date\` date NOT NULL,
        \`hours\` decimal(6,2) NOT NULL,
        \`hourly_rate\` decimal(10,2) NOT NULL,
        \`line_total\` decimal(12,2) NOT NULL,
        \`notes\` varchar(2000) NOT NULL DEFAULT '',
        \`created_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
        \`updated_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
        \`job_id\` varchar(36) NOT NULL,
        \`job_service_id\` varchar(36) NOT NULL,
        \`user_id\` varchar(36) NOT NULL,
        PRIMARY KEY (\`id\`)
      ) ENGINE=InnoDB
    `);

    await queryRunner.query(`
      ALTER TABLE \`work_log_periods\`
      ADD CONSTRAINT \`FK_work_log_periods_job_id\`
      FOREIGN KEY (\`job_id\`) REFERENCES \`jobs\`(\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION
    `);
    await queryRunner.query(`
      ALTER TABLE \`work_log_periods\`
      ADD CONSTRAINT \`FK_work_log_periods_reviewed_by\`
      FOREIGN KEY (\`reviewed_by\`) REFERENCES \`users\`(\`uuid\`) ON DELETE SET NULL ON UPDATE NO ACTION
    `);
    await queryRunner.query(`
      ALTER TABLE \`work_logs\`
      ADD CONSTRAINT \`FK_work_logs_job_id\`
      FOREIGN KEY (\`job_id\`) REFERENCES \`jobs\`(\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION
    `);
    await queryRunner.query(`
      ALTER TABLE \`work_logs\`
      ADD CONSTRAINT \`FK_work_logs_job_service_id\`
      FOREIGN KEY (\`job_service_id\`) REFERENCES \`job_services\`(\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION
    `);
    await queryRunner.query(`
      ALTER TABLE \`work_logs\`
      ADD CONSTRAINT \`FK_work_logs_user_id\`
      FOREIGN KEY (\`user_id\`) REFERENCES \`users\`(\`uuid\`) ON DELETE CASCADE ON UPDATE NO ACTION
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query("ALTER TABLE `work_logs` DROP FOREIGN KEY `FK_work_logs_user_id`");
    await queryRunner.query("ALTER TABLE `work_logs` DROP FOREIGN KEY `FK_work_logs_job_service_id`");
    await queryRunner.query("ALTER TABLE `work_logs` DROP FOREIGN KEY `FK_work_logs_job_id`");
    await queryRunner.query("ALTER TABLE `work_log_periods` DROP FOREIGN KEY `FK_work_log_periods_reviewed_by`");
    await queryRunner.query("ALTER TABLE `work_log_periods` DROP FOREIGN KEY `FK_work_log_periods_job_id`");
    await queryRunner.query("DROP TABLE `work_logs`");
    await queryRunner.query("DROP INDEX `UQ_work_log_periods_job_month` ON `work_log_periods`");
    await queryRunner.query("DROP TABLE `work_log_periods`");
  }
}
