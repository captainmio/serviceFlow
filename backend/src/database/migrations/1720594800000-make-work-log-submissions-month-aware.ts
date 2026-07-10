import type { MigrationInterface, QueryRunner } from "typeorm";

export class MakeWorkLogSubmissionsMonthAware1720594800000 implements MigrationInterface {
  name = "MakeWorkLogSubmissionsMonthAware1720594800000";

  private readonly tableName = "work_log_week_submissions";
  private readonly legacyIndexName = "UQ_work_log_week_submissions_job_user_week";
  private readonly monthAwareIndexName = "UQ_work_log_week_submissions_job_user_week_month";
  private readonly jobIdIndexName = "IDX_work_log_week_submissions_job_id";
  private readonly userIdIndexName = "IDX_work_log_week_submissions_user_id";

  private async hasIndex(queryRunner: QueryRunner, indexName: string) {
    const table = await queryRunner.getTable(this.tableName);
    return table?.indices.some((index) => index.name === indexName) ?? false;
  }

  public async up(queryRunner: QueryRunner): Promise<void> {
    const hasSubmissionTable = await queryRunner.hasTable(this.tableName);

    if (!hasSubmissionTable) {
      throw new Error("The work_log_week_submissions table must exist before applying this migration");
    }

    const hasMonthStartColumn = await queryRunner.hasColumn(this.tableName, "month_start");

    if (!hasMonthStartColumn) {
      await queryRunner.query(`
        ALTER TABLE \`work_log_week_submissions\`
        ADD \`month_start\` date NULL
      `);
    }

    await queryRunner.query(`
      UPDATE \`work_log_week_submissions\`
      SET \`month_start\` = DATE_FORMAT(\`week_start\`, '%Y-%m-01')
      WHERE \`month_start\` IS NULL
    `);

    await queryRunner.query(`
      ALTER TABLE \`work_log_week_submissions\`
      MODIFY \`month_start\` date NOT NULL
    `);

    const hasJobIdIndex = await this.hasIndex(queryRunner, this.jobIdIndexName);

    if (!hasJobIdIndex) {
      await queryRunner.query(`
        CREATE INDEX \`IDX_work_log_week_submissions_job_id\`
        ON \`work_log_week_submissions\` (\`job_id\`)
      `);
    }

    const hasUserIdIndex = await this.hasIndex(queryRunner, this.userIdIndexName);

    if (!hasUserIdIndex) {
      await queryRunner.query(`
        CREATE INDEX \`IDX_work_log_week_submissions_user_id\`
        ON \`work_log_week_submissions\` (\`user_id\`)
      `);
    }

    const hasLegacyIndex = await this.hasIndex(queryRunner, this.legacyIndexName);

    if (hasLegacyIndex) {
      await queryRunner.query(
        "DROP INDEX `UQ_work_log_week_submissions_job_user_week` ON `work_log_week_submissions`"
      );
    }

    const hasMonthAwareIndex = await this.hasIndex(queryRunner, this.monthAwareIndexName);

    if (!hasMonthAwareIndex) {
      await queryRunner.query(`
        CREATE UNIQUE INDEX \`UQ_work_log_week_submissions_job_user_week_month\`
        ON \`work_log_week_submissions\` (\`job_id\`, \`user_id\`, \`week_start\`, \`month_start\`)
      `);
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const hasSubmissionTable = await queryRunner.hasTable(this.tableName);

    if (!hasSubmissionTable) {
      return;
    }

    const hasMonthAwareIndex = await this.hasIndex(queryRunner, this.monthAwareIndexName);

    if (hasMonthAwareIndex) {
      await queryRunner.query(
        "DROP INDEX `UQ_work_log_week_submissions_job_user_week_month` ON `work_log_week_submissions`"
      );
    }

    const hasLegacyIndex = await this.hasIndex(queryRunner, this.legacyIndexName);

    if (!hasLegacyIndex) {
      await queryRunner.query(`
        CREATE UNIQUE INDEX \`UQ_work_log_week_submissions_job_user_week\`
        ON \`work_log_week_submissions\` (\`job_id\`, \`user_id\`, \`week_start\`)
      `);
    }

    const hasMonthStartColumn = await queryRunner.hasColumn(this.tableName, "month_start");

    if (hasMonthStartColumn) {
      await queryRunner.query(`
        ALTER TABLE \`work_log_week_submissions\`
        DROP COLUMN \`month_start\`
      `);
    }
  }
}
