import type { MigrationInterface, QueryRunner } from "typeorm";

export class AddJobServiceAssignments1720576800000 implements MigrationInterface {
  name = "AddJobServiceAssignments1720576800000";

  public async up(queryRunner: QueryRunner): Promise<void> {
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
    await queryRunner.query("DROP TABLE `job_service_assignees`");
    await queryRunner.query("DROP TABLE `job_services`");
  }
}
