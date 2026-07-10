import type { MigrationInterface, QueryRunner } from "typeorm";

export class AddWorkLogLineReviewState1720591200000 implements MigrationInterface {
  name = "AddWorkLogLineReviewState1720591200000";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE \`work_logs\`
      ADD \`review_status\` enum ('pending', 'approved', 'rejected') NOT NULL DEFAULT 'pending',
      ADD \`reviewed_at\` datetime NULL,
      ADD \`rejection_reason\` varchar(2000) NULL,
      ADD \`reviewed_by\` varchar(36) NULL
    `);

    await queryRunner.query(`
      ALTER TABLE \`work_logs\`
      ADD CONSTRAINT \`FK_work_logs_reviewed_by\`
      FOREIGN KEY (\`reviewed_by\`) REFERENCES \`users\`(\`uuid\`) ON DELETE SET NULL ON UPDATE NO ACTION
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query("ALTER TABLE `work_logs` DROP FOREIGN KEY `FK_work_logs_reviewed_by`");
    await queryRunner.query(`
      ALTER TABLE \`work_logs\`
      DROP COLUMN \`reviewed_by\`,
      DROP COLUMN \`rejection_reason\`,
      DROP COLUMN \`reviewed_at\`,
      DROP COLUMN \`review_status\`
    `);
  }
}
