import type { MigrationInterface, QueryRunner } from "typeorm";

export class ClearJobsTable1720578600000 implements MigrationInterface {
  name = "ClearJobsTable1720578600000";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query("DELETE FROM `job_service_assignees`");
    await queryRunner.query("DELETE FROM `job_services`");
    await queryRunner.query("DELETE FROM `job_assignees`");
    await queryRunner.query("DELETE FROM `jobs`");
  }

  public async down(): Promise<void> {
    // This migration deletes data permanently and cannot be reversed.
  }
}
