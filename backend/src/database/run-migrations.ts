import { appDataSource } from "./data-source.js";

const runMigrations = async () => {
  // DataSource initialization is kept here so migration scripts use the same
  // connection and migration registry as the application.
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
