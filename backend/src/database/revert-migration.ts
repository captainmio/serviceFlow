import { appDataSource } from "./data-source.js";

const revertMigration = async () => {
  // Revert exactly one migration; transaction behavior is configured by the
  // DataSource helper used by this command.
  await appDataSource.initialize();
  await appDataSource.undoLastMigration();
  await appDataSource.destroy();
};

revertMigration().catch(async (error: unknown) => {
  console.error("Migration revert failed.", error);

  if (appDataSource.isInitialized) {
    await appDataSource.destroy();
  }

  process.exitCode = 1;
});
