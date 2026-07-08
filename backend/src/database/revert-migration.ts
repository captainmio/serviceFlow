import { appDataSource } from "./data-source.js";

const revertMigration = async () => {
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
