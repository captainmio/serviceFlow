import {
  TableColumn,
  TableForeignKey,
  type MigrationInterface,
  type QueryRunner
} from "typeorm";

export class AddInvoiceRejectionWorkflow1720605600000 implements MigrationInterface {
  name = "AddInvoiceRejectionWorkflow1720605600000";

  public async up(queryRunner: QueryRunner): Promise<void> {
    if (await queryRunner.hasTable("invoices")) {
      const invoiceTable = await queryRunner.getTable("invoices");
      const statusColumn = invoiceTable?.findColumnByName("status");

      if (statusColumn && !statusColumn.enum?.includes("rejected")) {
        await queryRunner.changeColumn(
          "invoices",
          statusColumn,
          new TableColumn({
            name: "status",
            type: "enum",
            enum: ["draft", "rejected", "reviewed", "issued", "paid", "cancelled"],
            default: "'draft'",
            isNullable: false
          })
        );
      }

      await this.addInvoiceColumnIfMissing(
        queryRunner,
        new TableColumn({ name: "rejected_by", type: "varchar", length: "36", isNullable: true })
      );
      await this.addInvoiceColumnIfMissing(
        queryRunner,
        new TableColumn({ name: "rejected_at", type: "datetime", isNullable: true })
      );
      await this.addInvoiceColumnIfMissing(
        queryRunner,
        new TableColumn({ name: "rejection_reason", type: "varchar", length: "2000", isNullable: true })
      );

      const refreshedInvoiceTable = await queryRunner.getTable("invoices");
      if (refreshedInvoiceTable && !refreshedInvoiceTable.foreignKeys.some((key) => key.name === "FK_invoices_rejected_by")) {
        await queryRunner.createForeignKey(
          "invoices",
          new TableForeignKey({
            name: "FK_invoices_rejected_by",
            columnNames: ["rejected_by"],
            referencedTableName: "users",
            referencedColumnNames: ["uuid"],
            onDelete: "SET NULL"
          })
        );
      }
    }

    if (await queryRunner.hasTable("notifications")) {
      const notificationTable = await queryRunner.getTable("notifications");
      const typeColumn = notificationTable?.findColumnByName("type");

      if (typeColumn && !typeColumn.enum?.includes("invoice_changes_requested")) {
        await queryRunner.changeColumn(
          "notifications",
          typeColumn,
          new TableColumn({
            name: "type",
            type: "enum",
            enum: ["invoice_review_requested", "invoice_issue_requested", "invoice_changes_requested"],
            isNullable: false
          })
        );
      }
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    if (await queryRunner.hasTable("notifications")) {
      const notificationTable = await queryRunner.getTable("notifications");
      const typeColumn = notificationTable?.findColumnByName("type");

      if (typeColumn?.enum?.includes("invoice_changes_requested")) {
        await queryRunner.changeColumn(
          "notifications",
          typeColumn,
          new TableColumn({
            name: "type",
            type: "enum",
            enum: ["invoice_review_requested", "invoice_issue_requested"],
            isNullable: false
          })
        );
      }
    }

    if (await queryRunner.hasTable("invoices")) {
      const invoiceTable = await queryRunner.getTable("invoices");
      const rejectedForeignKey = invoiceTable?.foreignKeys.find((key) => key.name === "FK_invoices_rejected_by");

      if (rejectedForeignKey) {
        await queryRunner.dropForeignKey("invoices", rejectedForeignKey);
      }

      for (const columnName of ["rejected_by", "rejected_at", "rejection_reason"]) {
        const refreshedTable = await queryRunner.getTable("invoices");
        const column = refreshedTable?.findColumnByName(columnName);
        if (column) {
          await queryRunner.dropColumn("invoices", column);
        }
      }

      const refreshedInvoiceTable = await queryRunner.getTable("invoices");
      const statusColumn = refreshedInvoiceTable?.findColumnByName("status");

      if (statusColumn?.enum?.includes("rejected")) {
        await queryRunner.changeColumn(
          "invoices",
          statusColumn,
          new TableColumn({
            name: "status",
            type: "enum",
            enum: ["draft", "reviewed", "issued", "paid", "cancelled"],
            default: "'draft'",
            isNullable: false
          })
        );
      }
    }
  }

  private async addInvoiceColumnIfMissing(queryRunner: QueryRunner, column: TableColumn): Promise<void> {
    const table = await queryRunner.getTable("invoices");
    if (table && !table.findColumnByName(column.name)) {
      await queryRunner.addColumn("invoices", column);
    }
  }
}
