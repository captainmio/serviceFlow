import type { MigrationInterface, QueryRunner } from "typeorm";

export class ClearWorkLogData1720598400000 implements MigrationInterface {
  name = "ClearWorkLogData1720598400000";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query("DELETE FROM `work_log_week_submissions`");
    await queryRunner.query("DELETE FROM `work_logs`");
    await queryRunner.query("DELETE FROM `work_log_periods`");
  }

  public async down(): Promise<void> {
    return Promise.resolve();
  }
}
