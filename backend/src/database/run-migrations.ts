import { appDataSource } from "./data-source.js";

const runMigrations = async () => {
  await appDataSource.initialize();
  await appDataSource.runMigrations();
  await appDataSource.destroy();
};

runMigrations().catch(async (error: unknown) => {
  console.error("Migration run failed.", error);

  if (appDataSource.isInitialized) {
    await appDataSource.destroy();
  }

  process.exitCode = 1;
});
