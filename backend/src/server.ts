import { env } from "./config/env.js";
import { appDataSource } from "./database/data-source.js";
import { createApp } from "./app.js";
import { startProcessQueueWorker } from "./features/invoices/invoice.service.js";

const startServer = async () => {
  await appDataSource.initialize();
  startProcessQueueWorker();

  const app = createApp();

  app.listen(env.PORT, () => {
    console.log(`Backend running on port ${env.PORT}.`);
  });
};

startServer().catch((error: unknown) => {
  console.error("Server failed to start.", error);
  process.exitCode = 1;
});
