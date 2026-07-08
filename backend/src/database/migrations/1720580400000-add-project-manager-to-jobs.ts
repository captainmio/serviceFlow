import type { MigrationInterface, QueryRunner } from "typeorm";

export class AddProjectManagerToJobs1720580400000 implements MigrationInterface {
  name = "AddProjectManagerToJobs1720580400000";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query("ALTER TABLE `jobs` ADD `project_manager_id` varchar(36) NULL");
    await queryRunner.query(
      "ALTER TABLE `jobs` ADD CONSTRAINT `FK_jobs_project_manager_id` FOREIGN KEY (`project_manager_id`) REFERENCES `users`(`uuid`) ON DELETE SET NULL ON UPDATE NO ACTION"
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query("ALTER TABLE `jobs` DROP FOREIGN KEY `FK_jobs_project_manager_id`");
    await queryRunner.query("ALTER TABLE `jobs` DROP COLUMN `project_manager_id`");
  }
}
