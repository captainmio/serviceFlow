import type { MigrationInterface, QueryRunner } from "typeorm";

export class AddWorkLogWeekSubmissions1720587600000 implements MigrationInterface {
  name = "AddWorkLogWeekSubmissions1720587600000";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE \`work_log_week_submissions\` (
        \`id\` varchar(36) NOT NULL,
        \`week_start\` date NOT NULL,
        \`submitted_at\` datetime NOT NULL,
        \`created_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
        \`updated_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
        \`job_id\` varchar(36) NOT NULL,
        \`user_id\` varchar(36) NOT NULL,
        UNIQUE INDEX \`UQ_work_log_week_submissions_job_user_week\` (\`job_id\`, \`user_id\`, \`week_start\`),
        PRIMARY KEY (\`id\`)
      ) ENGINE=InnoDB
    `);

    await queryRunner.query(`
      ALTER TABLE \`work_log_week_submissions\`
      ADD CONSTRAINT \`FK_work_log_week_submissions_job_id\`
      FOREIGN KEY (\`job_id\`) REFERENCES \`jobs\`(\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION
    `);

    await queryRunner.query(`
      ALTER TABLE \`work_log_week_submissions\`
      ADD CONSTRAINT \`FK_work_log_week_submissions_user_id\`
      FOREIGN KEY (\`user_id\`) REFERENCES \`users\`(\`uuid\`) ON DELETE CASCADE ON UPDATE NO ACTION
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query("ALTER TABLE `work_log_week_submissions` DROP FOREIGN KEY `FK_work_log_week_submissions_user_id`");
    await queryRunner.query("ALTER TABLE `work_log_week_submissions` DROP FOREIGN KEY `FK_work_log_week_submissions_job_id`");
    await queryRunner.query("DROP INDEX `UQ_work_log_week_submissions_job_user_week` ON `work_log_week_submissions`");
    await queryRunner.query("DROP TABLE `work_log_week_submissions`");
  }
}

