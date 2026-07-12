import {
  Table,
  TableColumn,
  TableForeignKey,
  TableIndex,
  type MigrationInterface,
  type QueryRunner
} from "typeorm";

export class AddInvoiceWorkflow1720602000000 implements MigrationInterface {
  name = "AddInvoiceWorkflow1720602000000";

  public async up(queryRunner: QueryRunner): Promise<void> {
    const hasInvoicesTable = await queryRunner.hasTable("invoices");

    if (!hasInvoicesTable) {
      await queryRunner.createTable(
        new Table({
          name: "invoices",
          columns: [
            { name: "id", type: "varchar", length: "36", isPrimary: true, isNullable: false },
            { name: "invoice_number", type: "varchar", length: "160", isNullable: false },
            { name: "status", type: "enum", enum: ["draft", "reviewed", "issued", "paid", "cancelled"], default: "'draft'" },
            { name: "invoice_date", type: "date", isNullable: false },
            { name: "due_date", type: "date", isNullable: false },
            { name: "subtotal", type: "decimal", precision: 12, scale: 2, isNullable: false, default: "0" },
            { name: "tax_amount", type: "decimal", precision: 12, scale: 2, isNullable: false, default: "0" },
            { name: "total_amount", type: "decimal", precision: 12, scale: 2, isNullable: false, default: "0" },
            { name: "notes", type: "varchar", length: "2000", isNullable: false, default: "''" },
            { name: "customer_id", type: "varchar", length: "36", isNullable: false },
            { name: "issued_by", type: "varchar", length: "36", isNullable: true },
            { name: "issued_at", type: "datetime", isNullable: true },
            { name: "reviewed_by", type: "varchar", length: "36", isNullable: true },
            { name: "reviewed_at", type: "datetime", isNullable: true },
            { name: "paid_at", type: "datetime", isNullable: true },
            { name: "created_at", type: "datetime", precision: 6, isNullable: false, default: "CURRENT_TIMESTAMP(6)" },
            {
              name: "updated_at",
              type: "datetime",
              precision: 6,
              isNullable: false,
              default: "CURRENT_TIMESTAMP(6)",
              onUpdate: "CURRENT_TIMESTAMP(6)"
            }
          ],
          indices: [new TableIndex({ name: "UQ_invoices_invoice_number", columnNames: ["invoice_number"], isUnique: true })]
        })
      );
      await queryRunner.createForeignKey(
        "invoices",
        new TableForeignKey({
          name: "FK_invoices_customer_id",
          columnNames: ["customer_id"],
          referencedTableName: "customers",
          referencedColumnNames: ["id"],
          onDelete: "CASCADE"
        })
      );
      await queryRunner.createForeignKey(
        "invoices",
        new TableForeignKey({
          name: "FK_invoices_issued_by",
          columnNames: ["issued_by"],
          referencedTableName: "users",
          referencedColumnNames: ["uuid"],
          onDelete: "SET NULL"
        })
      );
      await queryRunner.createForeignKey(
        "invoices",
        new TableForeignKey({
          name: "FK_invoices_reviewed_by",
          columnNames: ["reviewed_by"],
          referencedTableName: "users",
          referencedColumnNames: ["uuid"],
          onDelete: "SET NULL"
        })
      );
    } else {
      await this.renameColumnIfPresent(queryRunner, "invoices", "invoiceNumber", "invoice_number");
      await this.addColumnIfMissing(
        queryRunner,
        "invoices",
        new TableColumn({
          name: "status",
          type: "enum",
          enum: ["draft", "reviewed", "issued", "paid", "cancelled"],
          default: "'draft'"
        })
      );
      await this.addColumnIfMissing(queryRunner, "invoices", new TableColumn({ name: "invoice_date", type: "date", isNullable: false, default: "'2026-01-01'" }));
      await this.addColumnIfMissing(queryRunner, "invoices", new TableColumn({ name: "due_date", type: "date", isNullable: false, default: "'2026-01-01'" }));
      await this.addColumnIfMissing(queryRunner, "invoices", new TableColumn({ name: "subtotal", type: "decimal", precision: 12, scale: 2, isNullable: false, default: "0" }));
      await this.addColumnIfMissing(queryRunner, "invoices", new TableColumn({ name: "tax_amount", type: "decimal", precision: 12, scale: 2, isNullable: false, default: "0" }));
      await this.addColumnIfMissing(queryRunner, "invoices", new TableColumn({ name: "total_amount", type: "decimal", precision: 12, scale: 2, isNullable: false, default: "0" }));
      await this.addColumnIfMissing(queryRunner, "invoices", new TableColumn({ name: "notes", type: "varchar", length: "2000", isNullable: false, default: "''" }));
      await this.addColumnIfMissing(queryRunner, "invoices", new TableColumn({ name: "issued_by", type: "varchar", length: "36", isNullable: true }));
      await this.addColumnIfMissing(queryRunner, "invoices", new TableColumn({ name: "issued_at", type: "datetime", isNullable: true }));
      await this.addColumnIfMissing(queryRunner, "invoices", new TableColumn({ name: "reviewed_by", type: "varchar", length: "36", isNullable: true }));
      await this.addColumnIfMissing(queryRunner, "invoices", new TableColumn({ name: "reviewed_at", type: "datetime", isNullable: true }));
      await this.addColumnIfMissing(queryRunner, "invoices", new TableColumn({ name: "paid_at", type: "datetime", isNullable: true }));
      await this.createIndexIfMissing(
        queryRunner,
        "invoices",
        new TableIndex({ name: "UQ_invoices_invoice_number", columnNames: ["invoice_number"], isUnique: true })
      );
      await this.createForeignKeyIfMissing(
        queryRunner,
        "invoices",
        ["issued_by"],
        new TableForeignKey({
          name: "FK_invoices_issued_by",
          columnNames: ["issued_by"],
          referencedTableName: "users",
          referencedColumnNames: ["uuid"],
          onDelete: "SET NULL"
        })
      );
      await this.createForeignKeyIfMissing(
        queryRunner,
        "invoices",
        ["reviewed_by"],
        new TableForeignKey({
          name: "FK_invoices_reviewed_by",
          columnNames: ["reviewed_by"],
          referencedTableName: "users",
          referencedColumnNames: ["uuid"],
          onDelete: "SET NULL"
        })
      );
    }

    if (!(await queryRunner.hasTable("invoice_items"))) {
      await queryRunner.createTable(
        new Table({
          name: "invoice_items",
          columns: [
            { name: "id", type: "varchar", length: "36", isPrimary: true, isNullable: false },
            { name: "invoice_id", type: "varchar", length: "36", isNullable: false },
            { name: "job_id", type: "varchar", length: "36", isNullable: false },
            { name: "work_log_id", type: "varchar", length: "36", isNullable: false },
            { name: "month_start", type: "date", isNullable: false },
            { name: "work_date", type: "date", isNullable: false },
            { name: "service_name", type: "varchar", length: "160", isNullable: false },
            { name: "member_name", type: "varchar", length: "120", isNullable: false },
            { name: "hours", type: "decimal", precision: 6, scale: 2, isNullable: false },
            { name: "hourly_rate", type: "decimal", precision: 10, scale: 2, isNullable: false },
            { name: "line_total", type: "decimal", precision: 12, scale: 2, isNullable: false },
            { name: "notes", type: "varchar", length: "2000", isNullable: false, default: "''" },
            { name: "created_at", type: "datetime", precision: 6, isNullable: false, default: "CURRENT_TIMESTAMP(6)" },
            {
              name: "updated_at",
              type: "datetime",
              precision: 6,
              isNullable: false,
              default: "CURRENT_TIMESTAMP(6)",
              onUpdate: "CURRENT_TIMESTAMP(6)"
            }
          ],
          indices: [new TableIndex({ name: "UQ_invoice_items_work_log", columnNames: ["work_log_id"], isUnique: true })]
        })
      );
      await queryRunner.createForeignKey(
        "invoice_items",
        new TableForeignKey({
          name: "FK_invoice_items_invoice_id",
          columnNames: ["invoice_id"],
          referencedTableName: "invoices",
          referencedColumnNames: ["id"],
          onDelete: "CASCADE"
        })
      );
      await queryRunner.createForeignKey(
        "invoice_items",
        new TableForeignKey({
          name: "FK_invoice_items_job_id",
          columnNames: ["job_id"],
          referencedTableName: "jobs",
          referencedColumnNames: ["id"],
          onDelete: "CASCADE"
        })
      );
      await queryRunner.createForeignKey(
        "invoice_items",
        new TableForeignKey({
          name: "FK_invoice_items_work_log_id",
          columnNames: ["work_log_id"],
          referencedTableName: "work_logs",
          referencedColumnNames: ["id"],
          onDelete: "RESTRICT"
        })
      );
    }

    if (!(await queryRunner.hasTable("notifications"))) {
      await queryRunner.createTable(
        new Table({
          name: "notifications",
          columns: [
            { name: "id", type: "varchar", length: "36", isPrimary: true, isNullable: false },
            { name: "user_id", type: "varchar", length: "36", isNullable: false },
            { name: "type", type: "enum", enum: ["invoice_review_requested", "invoice_issue_requested"], isNullable: false },
            { name: "title", type: "varchar", length: "160", isNullable: false },
            { name: "message", type: "varchar", length: "2000", isNullable: false, default: "''" },
            { name: "link", type: "varchar", length: "255", isNullable: false, default: "''" },
            { name: "read_at", type: "datetime", isNullable: true },
            { name: "created_at", type: "datetime", precision: 6, isNullable: false, default: "CURRENT_TIMESTAMP(6)" },
            {
              name: "updated_at",
              type: "datetime",
              precision: 6,
              isNullable: false,
              default: "CURRENT_TIMESTAMP(6)",
              onUpdate: "CURRENT_TIMESTAMP(6)"
            }
          ]
        })
      );
      await queryRunner.createForeignKey(
        "notifications",
        new TableForeignKey({
          name: "FK_notifications_user_id",
          columnNames: ["user_id"],
          referencedTableName: "users",
          referencedColumnNames: ["uuid"],
          onDelete: "CASCADE"
        })
      );
      await queryRunner.createIndex(
        "notifications",
        new TableIndex({ name: "IDX_notifications_user_id_created_at", columnNames: ["user_id", "created_at"] })
      );
    }

    if (!(await queryRunner.hasTable("process_queue_jobs"))) {
      await queryRunner.createTable(
        new Table({
          name: "process_queue_jobs",
          columns: [
            { name: "id", type: "varchar", length: "36", isPrimary: true, isNullable: false },
            { name: "type", type: "varchar", length: "120", isNullable: false },
            { name: "dedupe_key", type: "varchar", length: "160", isNullable: true },
            { name: "payload", type: "text", isNullable: false },
            { name: "status", type: "enum", enum: ["pending", "processing", "completed", "failed"], isNullable: false, default: "'pending'" },
            { name: "attempts", type: "int", isNullable: false, default: "0" },
            { name: "available_at", type: "datetime", isNullable: false },
            { name: "processed_at", type: "datetime", isNullable: true },
            { name: "last_error", type: "varchar", length: "2000", isNullable: true },
            { name: "created_at", type: "datetime", precision: 6, isNullable: false, default: "CURRENT_TIMESTAMP(6)" },
            {
              name: "updated_at",
              type: "datetime",
              precision: 6,
              isNullable: false,
              default: "CURRENT_TIMESTAMP(6)",
              onUpdate: "CURRENT_TIMESTAMP(6)"
            }
          ],
          indices: [
            new TableIndex({ name: "UQ_process_queue_jobs_dedupe_key", columnNames: ["dedupe_key"], isUnique: true }),
            new TableIndex({ name: "IDX_process_queue_jobs_status_available_at", columnNames: ["status", "available_at"] })
          ]
        })
      );
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    if (await queryRunner.hasTable("process_queue_jobs")) {
      await queryRunner.dropTable("process_queue_jobs");
    }

    if (await queryRunner.hasTable("notifications")) {
      await queryRunner.dropTable("notifications");
    }

    if (await queryRunner.hasTable("invoice_items")) {
      await queryRunner.dropTable("invoice_items");
    }
  }

  private async renameColumnIfPresent(
    queryRunner: QueryRunner,
    tableName: string,
    fromName: string,
    toName: string
  ) {
    const hasFromColumn = await queryRunner.hasColumn(tableName, fromName);
    const hasToColumn = await queryRunner.hasColumn(tableName, toName);

    if (hasFromColumn && !hasToColumn) {
      await queryRunner.renameColumn(tableName, fromName, toName);
    }
  }

  private async addColumnIfMissing(queryRunner: QueryRunner, tableName: string, column: TableColumn) {
    const hasColumn = await queryRunner.hasColumn(tableName, column.name);

    if (!hasColumn) {
      await queryRunner.addColumn(tableName, column);
    }
  }

  private async createIndexIfMissing(queryRunner: QueryRunner, tableName: string, index: TableIndex) {
    const table = await queryRunner.getTable(tableName);
    const hasAllColumns = await Promise.all(index.columnNames.map((columnName) => queryRunner.hasColumn(tableName, columnName)));

    if (!hasAllColumns.every(Boolean)) {
      return;
    }

    const hasMatchingIndex = table?.indices.some(
      (existingIndex) =>
        existingIndex.name === index.name ||
        (existingIndex.columnNames.length === index.columnNames.length &&
          existingIndex.columnNames.every((columnName, columnIndex) => columnName === index.columnNames[columnIndex]))
    );

    if (!hasMatchingIndex) {
      await queryRunner.createIndex(tableName, index);
    }
  }

  private async createForeignKeyIfMissing(
    queryRunner: QueryRunner,
    tableName: string,
    columnNames: string[],
    foreignKey: TableForeignKey
  ) {
    const table = await queryRunner.getTable(tableName);
    const hasAllColumns = await Promise.all(columnNames.map((columnName) => queryRunner.hasColumn(tableName, columnName)));

    if (!hasAllColumns.every(Boolean)) {
      return;
    }

    const hasMatchingForeignKey = table?.foreignKeys.some(
      (existingForeignKey) =>
        existingForeignKey.name === foreignKey.name ||
        (existingForeignKey.columnNames.length === foreignKey.columnNames.length &&
          existingForeignKey.columnNames.every(
            (columnName, columnIndex) => columnName === foreignKey.columnNames[columnIndex]
          ))
    );

    if (!hasMatchingForeignKey) {
      await queryRunner.createForeignKey(tableName, foreignKey);
    }
  }
}
