import type { MigrationInterface, QueryRunner } from "typeorm";

export class AddJobServiceAssignments1720576800000 implements MigrationInterface {
  name = "AddJobServiceAssignments1720576800000";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await this.safeUp(queryRunner);
  }

  public async safeUp(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS \`jobs\` (
        \`id\` varchar(36) NOT NULL,
        \`title\` varchar(160) NOT NULL DEFAULT 'Untitled job',
        \`customer_id\` varchar(36) NOT NULL,
        \`description\` varchar(2000) NOT NULL DEFAULT '',
        \`status\` enum('draft', 'assigned', 'in_progress', 'submitted', 'approved', 'rejected', 'invoiced', 'paid', 'cancelled') NOT NULL DEFAULT 'draft',
        \`start_date\` date NULL,
        \`due_date\` date NULL,
        \`approved_by\` varchar(36) NULL,
        \`approved_at\` datetime NULL,
        \`rejection_reason\` varchar(2000) NULL,
        \`created_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
        \`updated_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
        PRIMARY KEY (\`id\`)
      ) ENGINE=InnoDB
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS \`job_assignees\` (
        \`job_id\` varchar(36) NOT NULL,
        \`user_id\` varchar(36) NOT NULL,
        PRIMARY KEY (\`job_id\`, \`user_id\`),
        KEY \`IDX_job_assignees_user_id\` (\`user_id\`)
      ) ENGINE=InnoDB
    `);

    await queryRunner.query(`
      CREATE TABLE \`job_services\` (
        \`id\` varchar(36) NOT NULL,
        \`hourly_rate\` decimal(10,2) NOT NULL,
        \`job_id\` varchar(36) NOT NULL,
        \`service_id\` varchar(36) NOT NULL,
        PRIMARY KEY (\`id\`),
        KEY \`IDX_job_services_job_id\` (\`job_id\`),
        KEY \`IDX_job_services_service_id\` (\`service_id\`),
        CONSTRAINT \`FK_job_services_job_id\` FOREIGN KEY (\`job_id\`) REFERENCES \`jobs\`(\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION,
        CONSTRAINT \`FK_job_services_service_id\` FOREIGN KEY (\`service_id\`) REFERENCES \`services\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION
      ) ENGINE=InnoDB
    `);

    await queryRunner.query(`
      CREATE TABLE \`job_service_assignees\` (
        \`job_service_id\` varchar(36) NOT NULL,
        \`user_id\` varchar(36) NOT NULL,
        PRIMARY KEY (\`job_service_id\`, \`user_id\`),
        KEY \`IDX_job_service_assignees_user_id\` (\`user_id\`),
        CONSTRAINT \`FK_job_service_assignees_job_service_id\` FOREIGN KEY (\`job_service_id\`) REFERENCES \`job_services\`(\`id\`) ON DELETE CASCADE ON UPDATE CASCADE,
        CONSTRAINT \`FK_job_service_assignees_user_id\` FOREIGN KEY (\`user_id\`) REFERENCES \`users\`(\`uuid\`) ON DELETE CASCADE ON UPDATE CASCADE
      ) ENGINE=InnoDB
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await this.safeDown(queryRunner);
  }

  public async safeDown(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query("DROP TABLE `job_service_assignees`");
    await queryRunner.query("DROP TABLE `job_services`");
  }
}
