import { TableColumn, type MigrationInterface, type QueryRunner } from "typeorm";

export class AddInvoiceResubmittedAt1720607400000 implements MigrationInterface {
  name = "AddInvoiceResubmittedAt1720607400000";

  public async up(queryRunner: QueryRunner): Promise<void> {
    if (!(await queryRunner.hasTable("invoices"))) {
      return;
    }

    const table = await queryRunner.getTable("invoices");
    if (table && !table.findColumnByName("resubmitted_at")) {
      await queryRunner.addColumn(
        "invoices",
        new TableColumn({ name: "resubmitted_at", type: "datetime", isNullable: true })
      );
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    if (!(await queryRunner.hasTable("invoices"))) {
      return;
    }

    const table = await queryRunner.getTable("invoices");
    const column = table?.findColumnByName("resubmitted_at");
    if (column) {
      await queryRunner.dropColumn("invoices", column);
    }
  }
}
